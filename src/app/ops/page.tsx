import Link from 'next/link';
import { AlertTriangle, ArrowLeft, BarChart3, LifeBuoy, MessageCircleWarning } from 'lucide-react';
import { getRuntimeDashboardSnapshot } from '@/lib/runtime-dashboard';

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDateTime(value: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default async function OpsPage() {
  const snapshot = await getRuntimeDashboardSnapshot();

  const cards = [
    {
      title: '首条发送率',
      value: formatPercent(snapshot.firstSendRate),
      detail: `${snapshot.firstTurnSessions}/${snapshot.webSessions || 0} 个 Web 会话发出首条消息`,
      icon: BarChart3,
    },
    {
      title: '前两轮继续率',
      value: formatPercent(snapshot.secondTurnContinuationRate),
      detail: `${snapshot.secondTurnSessions}/${snapshot.firstTurnSessions || 0} 个会话继续到第二轮`,
      icon: MessageCircleWarning,
    },
    {
      title: 'Fallback 触发率',
      value: formatPercent(snapshot.fallbackRate),
      detail: '按 Web fallback 事件与正常响应事件计算',
      icon: LifeBuoy,
    },
    {
      title: '风险命中率',
      value: formatPercent(snapshot.riskHitRate),
      detail: `${snapshot.webMessageCount} 条 Web 消息中的风险命中比例`,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="notebook-shell mx-auto max-w-[1380px] overflow-hidden rounded-[28px]">
        <div
          className="border-b border-[rgba(227,213,201,0.7)] px-5 py-5 sm:px-8 lg:px-12"
          style={{ background: 'rgba(255,248,242,0.54)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="rounded-full border border-[rgba(219,201,191,0.92)] p-3 transition-all hover:scale-105"
                style={{ background: 'linear-gradient(180deg, rgba(247,239,232,0.96) 0%, rgba(236,224,214,0.92) 100%)' }}
              >
                <ArrowLeft className="h-5 w-5" style={{ color: '#8b756c' }} />
              </Link>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#c18b90' }}>
                  Runtime Ops
                </p>
                <h1 className="font-display text-4xl" style={{ color: '#2c2320' }}>
                  运行面板
                </h1>
                <p className="mt-2 max-w-2xl text-[13px] leading-7" style={{ color: '#7a6961' }}>
                  数据来自本地运行日志 `data/runtime-events.jsonl`。这是只读视图，打开聊天页产生新日志后，刷新本页即可看到最新结果。
                </p>
              </div>
            </div>
            <div className="text-right text-xs uppercase tracking-[0.2em]" style={{ color: '#9a887f' }}>
              <div>Events</div>
              <div className="mt-1 text-lg tracking-[0.08em]" style={{ color: '#4b3e38' }}>
                {snapshot.totalEvents}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1.4fr_1fr] lg:px-12">
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[28px] border px-5 py-5 shadow-[0_18px_34px_rgba(156,124,109,0.08)]"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,252,248,0.96) 0%, rgba(245,236,228,0.96) 100%)',
                    borderColor: 'rgba(215,194,182,0.92)',
                  }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #e7c0c4 0%, #d79aa0 100%)' }}>
                      <card.icon className="h-5 w-5" style={{ color: '#fff7f5' }} />
                    </div>
                    <h2 className="font-display text-[24px]" style={{ color: '#372d2a' }}>
                      {card.title}
                    </h2>
                  </div>
                  <div className="text-3xl font-semibold" style={{ color: '#4b3e38' }}>
                    {card.value}
                  </div>
                  <p className="mt-2 text-[13px] leading-7" style={{ color: '#705f59' }}>
                    {card.detail}
                  </p>
                </div>
              ))}
            </div>

            <div
              className="rounded-[28px] border px-5 py-5 shadow-[0_18px_34px_rgba(156,124,109,0.08)]"
              style={{
                background: 'linear-gradient(180deg, rgba(255,252,248,0.96) 0%, rgba(245,236,228,0.96) 100%)',
                borderColor: 'rgba(215,194,182,0.92)',
              }}
            >
              <h2 className="font-display text-[28px]" style={{ color: '#372d2a' }}>
                近 7 天走势
              </h2>
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(223,209,199,0.92)]" style={{ color: '#8a756d' }}>
                      <th className="pb-3 pr-4 font-medium">日期</th>
                      <th className="pb-3 pr-4 font-medium">会话</th>
                      <th className="pb-3 pr-4 font-medium">首条发送率</th>
                      <th className="pb-3 pr-4 font-medium">二轮继续率</th>
                      <th className="pb-3 pr-4 font-medium">Fallback</th>
                      <th className="pb-3 font-medium">风险命中率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.dailyStats.map((row) => (
                      <tr key={row.date} className="border-b border-[rgba(235,226,219,0.72)] last:border-b-0" style={{ color: '#5b4b44' }}>
                        <td className="py-3 pr-4">{row.date}</td>
                        <td className="py-3 pr-4">{row.webSessions}</td>
                        <td className="py-3 pr-4">{formatPercent(row.firstSendRate)}</td>
                        <td className="py-3 pr-4">{formatPercent(row.secondTurnContinuationRate)}</td>
                        <td className="py-3 pr-4">{formatPercent(row.fallbackRate)}</td>
                        <td className="py-3">{formatPercent(row.riskHitRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <aside
            className="rounded-[28px] border px-5 py-5 shadow-[0_18px_34px_rgba(156,124,109,0.08)]"
            style={{
              background: 'linear-gradient(180deg, rgba(255,252,248,0.96) 0%, rgba(245,236,228,0.96) 100%)',
              borderColor: 'rgba(215,194,182,0.92)',
            }}
          >
            <h2 className="font-display text-[28px]" style={{ color: '#372d2a' }}>
              最近失败样本
            </h2>
            <div className="mt-5 space-y-4">
              {snapshot.recentFailures.length === 0 ? (
                <p className="text-[13px] leading-7" style={{ color: '#705f59' }}>
                  还没有运行日志。访问聊天页并发几轮消息后，这里会显示最近的 fallback、风险命中和无效请求样本。
                </p>
              ) : (
                snapshot.recentFailures.map((item, index) => (
                  <div
                    key={`${item.timestamp}-${index}`}
                    className="rounded-[22px] border px-4 py-4"
                    style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(223,209,199,0.92)' }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em]" style={{ borderColor: 'rgba(211,191,180,0.9)', color: '#8e7c74' }}>
                        {item.channel} / {item.event}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: '#b08f85' }}>
                        {item.riskLevel || item.reason || 'observe'}
                      </span>
                    </div>
                    <p className="mt-3 text-[13px] leading-7" style={{ color: '#5b4b44' }}>
                      {item.messagePreview || '无文本预览'}
                    </p>
                    <div className="mt-3 text-[11px] uppercase tracking-[0.16em]" style={{ color: '#a49389' }}>
                      {formatDateTime(item.timestamp)}
                      {item.emotion ? ` · ${item.emotion}` : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
