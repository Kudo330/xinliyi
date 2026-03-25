import { appendFile, mkdir } from 'fs/promises';
import path from 'path';

export type RuntimeEventName =
  | 'chat_page_viewed'
  | 'chat_user_message_sent'
  | 'chat_response_completed'
  | 'chat_fallback_used'
  | 'chat_risk_detected'
  | 'chat_request_invalid'
  | 'wechat_message_received'
  | 'wechat_response_completed'
  | 'wechat_fallback_used'
  | 'wechat_risk_detected';

export type RuntimeEvent = {
  event: RuntimeEventName;
  channel: 'web' | 'wechat';
  sessionId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
};

const LOG_DIR = path.join(process.cwd(), 'data');
const LOG_FILE = path.join(LOG_DIR, 'runtime-events.jsonl');
const RUNTIME_LOG_MODE = process.env.RUNTIME_LOG_MODE || '';
const IS_VERCEL = process.env.VERCEL === '1';
const SHOULD_WRITE_LOCAL_LOG = !IS_VERCEL && RUNTIME_LOG_MODE !== 'off';

export function buildMessagePreview(message: string, maxLength = 80): string {
  return message.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export async function logRuntimeEvent(entry: RuntimeEvent): Promise<void> {
  const payload = {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  if (!SHOULD_WRITE_LOCAL_LOG) {
    console.log('Runtime Event:', JSON.stringify(payload));
    return;
  }

  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(LOG_FILE, `${JSON.stringify(payload)}\n`, 'utf8');
  } catch (error) {
    console.error('Runtime Log Error:', error, payload);
  }
}
