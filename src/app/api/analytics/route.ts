import { NextRequest, NextResponse } from 'next/server';
import { logRuntimeEvent, RuntimeEventName } from '@/lib/observability';

const ALLOWED_EVENTS = new Set<RuntimeEventName>([
  'chat_page_viewed',
  'chat_user_message_sent',
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = typeof body?.event === 'string' ? body.event : '';
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
    const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : {};

    if (!ALLOWED_EVENTS.has(event as RuntimeEventName)) {
      return NextResponse.json({ error: 'unsupported event' }, { status: 400 });
    }

    await logRuntimeEvent({
      event: event as RuntimeEventName,
      channel: 'web',
      sessionId,
      metadata,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'invalid analytics payload' }, { status: 400 });
  }
}
