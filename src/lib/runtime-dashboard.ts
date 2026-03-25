import { readFile } from 'fs/promises';
import path from 'path';

type RuntimeLogRow = {
  event: string;
  channel: 'web' | 'wechat';
  sessionId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
};

type FailureSample = {
  timestamp: string;
  channel: string;
  event: string;
  sessionId: string;
  reason: string;
  riskLevel: string;
  emotion: string;
  messagePreview: string;
};

type DailyStat = {
  date: string;
  webSessions: number;
  firstSendRate: number;
  secondTurnContinuationRate: number;
  fallbackRate: number;
  riskHitRate: number;
};

type OpsSnapshot = {
  totalEvents: number;
  webSessions: number;
  firstTurnSessions: number;
  secondTurnSessions: number;
  firstSendRate: number;
  secondTurnContinuationRate: number;
  fallbackRate: number;
  riskHitRate: number;
  webMessageCount: number;
  recentFailures: FailureSample[];
  dailyStats: DailyStat[];
};

const LOG_PATH = path.join(process.cwd(), 'data', 'runtime-events.jsonl');

function safeDivide(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

function toDateKey(timestamp: string): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function getMetadataValue(metadata: Record<string, unknown> | undefined, key: string): string {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : '';
}

function getMetadataNumber(metadata: Record<string, unknown> | undefined, key: string): number {
  const value = metadata?.[key];
  return typeof value === 'number' ? value : 0;
}

export async function getRuntimeDashboardSnapshot(): Promise<OpsSnapshot> {
  let content = '';

  try {
    content = await readFile(LOG_PATH, 'utf8');
  } catch {
    return {
      totalEvents: 0,
      webSessions: 0,
      firstTurnSessions: 0,
      secondTurnSessions: 0,
      firstSendRate: 0,
      secondTurnContinuationRate: 0,
      fallbackRate: 0,
      riskHitRate: 0,
      webMessageCount: 0,
      recentFailures: [],
      dailyStats: [],
    };
  }

  const events = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as RuntimeLogRow);

  const webPageViews = events.filter((event) => event.event === 'chat_page_viewed' && event.channel === 'web');
  const webMessages = events.filter((event) => event.event === 'chat_user_message_sent' && event.channel === 'web');
  const webFallbacks = events.filter((event) => event.event === 'chat_fallback_used' && event.channel === 'web');
  const webResponses = events.filter((event) => event.event === 'chat_response_completed' && event.channel === 'web');
  const webRisks = events.filter((event) => event.event === 'chat_risk_detected' && event.channel === 'web');

  const webSessions = new Set(webPageViews.map((event) => event.sessionId).filter(Boolean));
  const firstTurnSessions = new Set(
    webMessages
      .filter((event) => getMetadataNumber(event.metadata, 'turn') === 1)
      .map((event) => event.sessionId)
      .filter(Boolean),
  );
  const secondTurnSessions = new Set(
    webMessages
      .filter((event) => getMetadataNumber(event.metadata, 'turn') === 2)
      .map((event) => event.sessionId)
      .filter(Boolean),
  );

  const recentFailures = events
    .filter((event) =>
      ['chat_fallback_used', 'chat_risk_detected', 'chat_request_invalid', 'wechat_fallback_used', 'wechat_risk_detected'].includes(
        event.event,
      ),
    )
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    .slice(0, 12)
    .map((event) => ({
      timestamp: event.timestamp,
      channel: event.channel,
      event: event.event,
      sessionId: event.sessionId || '',
      reason: getMetadataValue(event.metadata, 'reason'),
      riskLevel: getMetadataValue(event.metadata, 'riskLevel') || getMetadataValue(event.metadata, 'level'),
      emotion: getMetadataValue(event.metadata, 'emotion'),
      messagePreview: getMetadataValue(event.metadata, 'messagePreview'),
    }));

  const dateKeys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });

  const dailyStats = dateKeys.map((date) => {
    const dayEvents = events.filter((event) => toDateKey(event.timestamp) === date);
    const dayPageViews = dayEvents.filter((event) => event.event === 'chat_page_viewed' && event.channel === 'web');
    const dayMessages = dayEvents.filter((event) => event.event === 'chat_user_message_sent' && event.channel === 'web');
    const dayFallbacks = dayEvents.filter((event) => event.event === 'chat_fallback_used' && event.channel === 'web');
    const dayResponses = dayEvents.filter((event) => event.event === 'chat_response_completed' && event.channel === 'web');
    const dayRisks = dayEvents.filter((event) => event.event === 'chat_risk_detected' && event.channel === 'web');

    const daySessions = new Set(dayPageViews.map((event) => event.sessionId).filter(Boolean));
    const dayFirstTurns = new Set(
      dayMessages
        .filter((event) => getMetadataNumber(event.metadata, 'turn') === 1)
        .map((event) => event.sessionId)
        .filter(Boolean),
    );
    const daySecondTurns = new Set(
      dayMessages
        .filter((event) => getMetadataNumber(event.metadata, 'turn') === 2)
        .map((event) => event.sessionId)
        .filter(Boolean),
    );

    return {
      date,
      webSessions: daySessions.size,
      firstSendRate: safeDivide(dayFirstTurns.size, daySessions.size),
      secondTurnContinuationRate: safeDivide(daySecondTurns.size, dayFirstTurns.size),
      fallbackRate: safeDivide(dayFallbacks.length, dayFallbacks.length + dayResponses.length),
      riskHitRate: safeDivide(dayRisks.length, dayMessages.length),
    };
  });

  return {
    totalEvents: events.length,
    webSessions: webSessions.size,
    firstTurnSessions: firstTurnSessions.size,
    secondTurnSessions: secondTurnSessions.size,
    firstSendRate: safeDivide(firstTurnSessions.size, webSessions.size),
    secondTurnContinuationRate: safeDivide(secondTurnSessions.size, firstTurnSessions.size),
    fallbackRate: safeDivide(webFallbacks.length, webFallbacks.length + webResponses.length),
    riskHitRate: safeDivide(webRisks.length, webMessages.length),
    webMessageCount: webMessages.length,
    recentFailures,
    dailyStats,
  };
}
