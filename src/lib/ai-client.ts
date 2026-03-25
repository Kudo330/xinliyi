import { ChatMessage } from '@/lib/mental-support';

const DEFAULT_APP_URL = 'http://localhost:3000';
const DEFAULT_MINIMAX_BASE_URL = 'https://api.minimaxi.com/anthropic';
const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MINIMAX_MODEL = 'MiniMax-M2.5';
const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini';

type AiProvider = 'openrouter' | 'minimax';

type AnthropicResponse = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
};

type OpenRouterContent = string | Array<{ type?: string; text?: string }>;

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: OpenRouterContent;
    };
  }>;
};

function normalizeEnv(value?: string): string {
  return (value || '').trim().replace(/\s+/g, '');
}

function inferProvider(): AiProvider {
  const explicitProvider = normalizeEnv(process.env.AI_PROVIDER).toLowerCase();

  if (explicitProvider === 'openrouter') {
    return 'openrouter';
  }

  if (explicitProvider === 'minimax') {
    return 'minimax';
  }

  if (normalizeEnv(process.env.OPENROUTER_API_KEY) || normalizeEnv(process.env.OPENROUTER_BASE_URL)) {
    return 'openrouter';
  }

  if (normalizeEnv(process.env.MINIMAX_API_KEY) || normalizeEnv(process.env.MINIMAX_BASE_URL)) {
    return 'minimax';
  }

  return 'minimax';
}

function getBaseUrl(provider: AiProvider): string {
  if (provider === 'openrouter') {
    return normalizeEnv(process.env.OPENROUTER_BASE_URL) || DEFAULT_OPENROUTER_BASE_URL;
  }

  return (
    normalizeEnv(process.env.MINIMAX_BASE_URL) ||
    normalizeEnv(process.env.ANTHROPIC_BASE_URL) ||
    DEFAULT_MINIMAX_BASE_URL
  );
}

function getApiKey(provider: AiProvider): string {
  if (provider === 'openrouter') {
    return normalizeEnv(process.env.OPENROUTER_API_KEY);
  }

  return normalizeEnv(process.env.MINIMAX_API_KEY) || normalizeEnv(process.env.ANTHROPIC_API_KEY);
}

function getModelName(provider: AiProvider): string {
  if (provider === 'openrouter') {
    return (
      normalizeEnv(process.env.OPENROUTER_MODEL) ||
      normalizeEnv(process.env.AI_MODEL) ||
      DEFAULT_OPENROUTER_MODEL
    );
  }

  return (
    normalizeEnv(process.env.MINIMAX_MODEL) ||
    normalizeEnv(process.env.AI_MODEL) ||
    DEFAULT_MINIMAX_MODEL
  );
}

function parseOpenRouterContent(content: OpenRouterContent | undefined): string {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item?.text || '')
      .join('\n')
      .trim();
  }

  return '';
}

export function resolveAiConfig() {
  const provider = inferProvider();
  const baseUrl = getBaseUrl(provider).replace(/\/$/, '');
  const apiKey = getApiKey(provider);
  const model = getModelName(provider);

  return {
    provider,
    baseUrl,
    apiKey,
    model,
  };
}

export function hasAiApiKey(): boolean {
  return Boolean(resolveAiConfig().apiKey);
}

export async function generateAiReply(params: {
  systemPrompt: string;
  messages: ChatMessage[];
  maxTokens?: number;
  timeoutMs: number;
}): Promise<string> {
  const { provider, baseUrl, apiKey, model } = resolveAiConfig();

  if (!apiKey) {
    throw new Error(`AI API key is not configured for provider "${provider}".`);
  }

  if (provider === 'openrouter') {
    const endpoint = new URL('/api/v1/chat/completions', 'https://openrouter.ai');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL,
        'X-Title': 'xinliyi-app',
      },
      body: JSON.stringify({
        model,
        max_tokens: params.maxTokens ?? 300,
        messages: [
          { role: 'system', content: params.systemPrompt },
          ...params.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
      }),
      signal: AbortSignal.timeout(params.timeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter Error ${response.status} (${endpoint.toString()}): ${errorText}`,
      );
    }

    const data = (await response.json()) as OpenRouterResponse;
    return parseOpenRouterContent(data.choices?.[0]?.message?.content);
  }

  const endpoint = new URL('v1/messages', `${baseUrl}/`);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: params.maxTokens ?? 300,
      system: params.systemPrompt,
      messages: params.messages,
    }),
    signal: AbortSignal.timeout(params.timeoutMs),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Anthropic-Compatible Error ${response.status} (${endpoint.toString()}): ${errorText}`,
    );
  }

  const data = (await response.json()) as AnthropicResponse;
  return data.content?.find((item) => item.type === 'text')?.text?.trim() || '';
}
