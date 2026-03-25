import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { generateAiReply, hasAiApiKey, resolveAiConfig } from '@/lib/ai-client';
import {
  assessRiskSignals,
  buildFallbackReply,
  buildLocalSupportReply,
  buildSystemPrompt,
  detectEmotion,
  MAX_MESSAGE_LENGTH,
  REQUEST_TIMEOUT_MS,
  shouldPreferLocalReply,
} from '@/lib/mental-support';
import { buildMessagePreview, logRuntimeEvent } from '@/lib/observability';

const WECHAT_TOKEN = process.env.WECHAT_TOKEN || '';

function verifySignature(timestamp: string, nonce: string, signature: string): boolean {
  if (!WECHAT_TOKEN || !timestamp || !nonce || !signature) {
    return false;
  }

  const str = [WECHAT_TOKEN, timestamp, nonce].sort().join('');
  const sha1 = crypto.createHash('sha1').update(str).digest('hex');
  return sha1 === signature;
}

function textResponse(body: string, init?: ResponseInit) {
  return new NextResponse(body, {
    ...init,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...init?.headers,
    },
  });
}

function xmlResponse(body: string, init?: ResponseInit) {
  return new NextResponse(body, {
    ...init,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      ...init?.headers,
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const signature = searchParams.get('signature') || '';
  const timestamp = searchParams.get('timestamp') || '';
  const nonce = searchParams.get('nonce') || '';
  const echostr = searchParams.get('echostr') || '';

  if (!verifySignature(timestamp, nonce, signature)) {
    return textResponse('signature verify failed', { status: 403 });
  }

  return textResponse(echostr);
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const signature = searchParams.get('signature') || '';
    const timestamp = searchParams.get('timestamp') || '';
    const nonce = searchParams.get('nonce') || '';

    if (!verifySignature(timestamp, nonce, signature)) {
      return textResponse('signature verify failed', { status: 403 });
    }

    const xml = await request.text();
    const fromUserName = extractXmlValue(xml, 'FromUserName');
    const toUserName = extractXmlValue(xml, 'ToUserName');
    const msgType = extractXmlValue(xml, 'MsgType');
    const content = extractXmlValue(xml, 'Content').trim();

    let reply = '收到啦。';

    if (msgType === 'text') {
      reply = await getAIReply(content);
    } else if (msgType === 'event' && extractXmlValue(xml, 'Event') === 'subscribe') {
      reply = '欢迎来到心理易。我会在这里陪你慢慢聊。如果你现在就想开始，直接回一条消息就好。';
    }

    return xmlResponse(buildReplyXml(fromUserName, toUserName, reply));
  } catch (error) {
    console.error('WeChat API Error:', error);
    return textResponse('success');
  }
}

function extractXmlValue(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>|<${tag}>(.*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] || match[2] || '' : '';
}

function escapeXmlContent(content: string): string {
  return content.replace(/]]>/g, ']]]]><![CDATA[>');
}

function buildReplyXml(from: string, to: string, content: string): string {
  return `<xml>
  <ToUserName><![CDATA[${from}]]></ToUserName>
  <FromUserName><![CDATA[${to}]]></FromUserName>
  <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${escapeXmlContent(content)}]]></Content>
</xml>`;
}

async function getAIReply(userMessage: string): Promise<string> {
  const startedAt = Date.now();
  const aiConfig = resolveAiConfig();
  const risk = assessRiskSignals(userMessage);
  const emotion = detectEmotion(userMessage);

  await logRuntimeEvent({
    event: 'wechat_message_received',
    channel: 'wechat',
    metadata: {
      messageLength: userMessage.length,
      messagePreview: buildMessagePreview(userMessage),
      riskDetected: risk.detected,
      riskLevel: risk.level,
      emotion,
    },
  });

  if (risk.detected) {
    await logRuntimeEvent({
      event: 'wechat_risk_detected',
      channel: 'wechat',
      metadata: {
        level: risk.level,
        score: risk.score,
        reasons: risk.reasons,
        emotion,
        messageLength: userMessage.length,
        messagePreview: buildMessagePreview(userMessage),
      },
    });
  }

  if (!userMessage) {
    return '你可以直接告诉我，现在最想说的那一句。';
  }

  if (userMessage.length > MAX_MESSAGE_LENGTH) {
    return '这段话有点长，我们可以分两小段慢慢说。';
  }

  if (shouldPreferLocalReply(userMessage)) {
    const localReply = buildLocalSupportReply({ message: userMessage });
    if (localReply) {
      return localReply;
    }
  }

  if (!hasAiApiKey()) {
    await logRuntimeEvent({
      event: 'wechat_fallback_used',
      channel: 'wechat',
      metadata: {
        reason: 'missing_api_key',
        provider: aiConfig.provider,
        baseUrl: aiConfig.baseUrl,
        model: aiConfig.model,
        riskDetected: risk.detected,
        riskLevel: risk.level,
        emotion,
        messageLength: userMessage.length,
        messagePreview: buildMessagePreview(userMessage),
      },
    });
    return buildFallbackReply(userMessage);
  }

  try {
    const reply = await generateAiReply({
      systemPrompt: buildSystemPrompt(null),
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 180,
      timeoutMs: REQUEST_TIMEOUT_MS,
    });

    if (!reply) {
      await logRuntimeEvent({
        event: 'wechat_fallback_used',
        channel: 'wechat',
        metadata: {
          reason: 'empty_reply',
          riskDetected: risk.detected,
          riskLevel: risk.level,
          emotion,
          messageLength: userMessage.length,
          messagePreview: buildMessagePreview(userMessage),
        },
      });
      return buildFallbackReply(userMessage);
    }

    await logRuntimeEvent({
      event: 'wechat_response_completed',
      channel: 'wechat',
      metadata: {
        latencyMs: Date.now() - startedAt,
        fallback: false,
        source: 'model',
        riskDetected: risk.detected,
        riskLevel: risk.level,
        emotion,
        messageLength: userMessage.length,
        messagePreview: buildMessagePreview(userMessage),
      },
    });

    return reply;
  } catch (error) {
    console.error('WeChat AI Reply Error:', error);
    await logRuntimeEvent({
      event: 'wechat_fallback_used',
      channel: 'wechat',
      metadata: {
        reason: 'upstream_error',
        provider: aiConfig.provider,
        baseUrl: aiConfig.baseUrl,
        model: aiConfig.model,
        errorMessage: error instanceof Error ? error.message : String(error),
        riskDetected: risk.detected,
        riskLevel: risk.level,
        emotion,
        messageLength: userMessage.length,
        messagePreview: buildMessagePreview(userMessage),
      },
    });
    return buildFallbackReply(userMessage);
  }
}
