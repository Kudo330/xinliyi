import { NextResponse } from 'next/server';
import { resolveAiConfig } from '@/lib/ai-client';

function redactApiKey(key: string): string {
  if (!key) {
    return '';
  }

  if (key.length <= 8) {
    return '***';
  }

  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

export async function GET() {
  const { provider, baseUrl, apiKey, model } = resolveAiConfig();

  return NextResponse.json({
    provider,
    baseUrl,
    model,
    apiKeyPreview: redactApiKey(apiKey),
    hasApiKey: Boolean(apiKey),
    aiProviderEnv: process.env.AI_PROVIDER || '',
  });
}
