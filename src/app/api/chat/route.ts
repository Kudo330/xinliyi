import { NextRequest, NextResponse } from 'next/server';
import { generateAiReply, hasAiApiKey, resolveAiConfig } from '@/lib/ai-client';
import {
  assessRiskSignals,
  buildFallbackReply,
  buildLocalSupportReply,
  buildSystemPrompt,
  detectEmotion,
  MAX_MESSAGE_LENGTH,
  normalizeHistory,
  REQUEST_TIMEOUT_MS,
  shouldPreferLocalReply,
} from '@/lib/mental-support';
import { buildMessagePreview, logRuntimeEvent } from '@/lib/observability';

export async function POST(request: NextRequest) {
  let message = '';
  let sessionId = '';
  let companion: 'samoyed' | 'cat' | null = null;
  const startedAt = Date.now();

  try {
    const body = await request.json();
    const aiConfig = resolveAiConfig();
    message = typeof body?.message === 'string' ? body.message.trim() : '';
    sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
    companion = body?.companion === 'samoyed' || body?.companion === 'cat' ? body.companion : null;

    const history = normalizeHistory(body?.history);
    const risk = assessRiskSignals(message, history);
    const emotion = detectEmotion(message, history);

    if (risk.detected) {
      await logRuntimeEvent({
        event: 'chat_risk_detected',
        channel: 'web',
        sessionId,
        metadata: {
          level: risk.level,
          score: risk.score,
          reasons: risk.reasons,
          emotion,
          messageLength: message.length,
          messagePreview: buildMessagePreview(message),
          historyCount: history.length,
        },
      });
    }

    if (!message) {
      await logRuntimeEvent({
        event: 'chat_request_invalid',
        channel: 'web',
        sessionId,
        metadata: { reason: 'empty_message', messagePreview: buildMessagePreview(message) },
      });
      return NextResponse.json({ error: '请告诉我你现在最想说的那一句。' }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      await logRuntimeEvent({
        event: 'chat_request_invalid',
        channel: 'web',
        sessionId,
        metadata: {
          reason: 'message_too_long',
          messageLength: message.length,
          messagePreview: buildMessagePreview(message),
        },
      });
      return NextResponse.json({ error: '这段话有点长，我们可以分两小段慢慢说。' }, { status: 400 });
    }

    if (shouldPreferLocalReply(message, history)) {
      const localReply = buildLocalSupportReply({ message, history, companion });

      if (localReply) {
        await logRuntimeEvent({
          event: 'chat_response_completed',
          channel: 'web',
          sessionId,
          metadata: {
            latencyMs: Date.now() - startedAt,
            fallback: false,
            source: 'local_strategy',
            riskDetected: risk.detected,
            riskLevel: risk.level,
            emotion,
            messageLength: message.length,
            messagePreview: buildMessagePreview(message),
            historyCount: history.length,
            companion,
          },
        });

        return NextResponse.json(
          {
            response: localReply,
            fallback: false,
            emotion,
          },
          { status: 200 },
        );
      }
    }

    if (!hasAiApiKey()) {
      await logRuntimeEvent({
        event: 'chat_fallback_used',
        channel: 'web',
        sessionId,
        metadata: {
          reason: 'missing_api_key',
          provider: aiConfig.provider,
          baseUrl: aiConfig.baseUrl,
          model: aiConfig.model,
          messageLength: message.length,
          messagePreview: buildMessagePreview(message),
          historyCount: history.length,
          riskDetected: risk.detected,
          riskLevel: risk.level,
          emotion,
        },
      });

      return NextResponse.json(
        {
          response: buildFallbackReply(message, history, companion),
          fallback: true,
          emotion,
        },
        { status: 200 },
      );
    }

    try {
      const reply = await generateAiReply({
        systemPrompt: buildSystemPrompt(companion),
        messages: [...history, { role: 'user', content: message }],
        maxTokens: 180,
        timeoutMs: REQUEST_TIMEOUT_MS,
      });

      if (!reply) {
        await logRuntimeEvent({
          event: 'chat_fallback_used',
          channel: 'web',
          sessionId,
          metadata: {
            reason: 'empty_reply',
            messageLength: message.length,
            messagePreview: buildMessagePreview(message),
            historyCount: history.length,
            riskDetected: risk.detected,
            riskLevel: risk.level,
            emotion,
          },
        });

        return NextResponse.json(
          {
            response: buildFallbackReply(message, history, companion),
            fallback: true,
            emotion,
          },
          { status: 200 },
        );
      }

      await logRuntimeEvent({
        event: 'chat_response_completed',
        channel: 'web',
        sessionId,
        metadata: {
          latencyMs: Date.now() - startedAt,
          fallback: false,
          source: 'model',
          riskDetected: risk.detected,
          riskLevel: risk.level,
          emotion,
          messageLength: message.length,
          messagePreview: buildMessagePreview(message),
          historyCount: history.length,
          companion,
        },
      });

      return NextResponse.json(
        {
          response: reply,
          fallback: false,
          emotion,
        },
        { status: 200 },
      );
    } catch (error) {
      console.error('Chat API Error:', error);
      await logRuntimeEvent({
        event: 'chat_fallback_used',
        channel: 'web',
        sessionId,
        metadata: {
          reason: 'upstream_error',
          provider: aiConfig.provider,
          baseUrl: aiConfig.baseUrl,
          model: aiConfig.model,
          errorMessage: error instanceof Error ? error.message : String(error),
          messageLength: message.length,
          messagePreview: buildMessagePreview(message),
          historyCount: history.length,
          riskDetected: risk.detected,
          riskLevel: risk.level,
          emotion,
        },
      });

      return NextResponse.json(
        {
          response: buildFallbackReply(message, history, companion),
          fallback: true,
          emotion,
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error('Chat API Error:', error);

    if (message) {
      await logRuntimeEvent({
        event: 'chat_fallback_used',
        channel: 'web',
        sessionId,
        metadata: {
          reason: 'request_exception',
          messageLength: message.length,
          messagePreview: buildMessagePreview(message),
        },
      });
    }

    return NextResponse.json(
      {
        response: buildFallbackReply(message, [], companion),
        fallback: true,
        emotion: detectEmotion(message),
      },
      { status: message ? 200 : 500 },
    );
  }
}
