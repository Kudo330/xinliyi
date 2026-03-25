'use client';

import Link from 'next/link';
import { Activity, ArrowRight, Heart, Leaf, Moon, Sparkles, Sun } from 'lucide-react';

const guideCards = [
  { icon: Heart, label: '情感关系', note: '把那些没说出口的委屈，轻一点放下来。', time: '09:00 - 10:30' },
  { icon: Sun, label: '工作压力', note: '把反复盘旋的任务与焦虑拆开整理。', time: '11:50 - 12:30' },
  { icon: Moon, label: '睡前心事', note: '在一天结束前，让情绪慢慢降落。', time: '14:30 - 16:00' },
];

const priorities = [
  '先说最堵的一件事，不需要完整，也不需要礼貌。',
  '如果你只想被接住，我们就不急着找答案。',
  '如果你已经想梳理问题，也可以一起把下一步理清。',
];

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY'];

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="notebook-shell page-fade-up mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1380px] rounded-[28px]">
        <div className="notebook-spine hidden lg:block" />

        <section className="relative flex w-full flex-col border-b border-[rgba(227,213,201,0.75)] px-6 py-8 sm:px-10 lg:w-1/2 lg:border-b-0 lg:border-r lg:border-[rgba(227,213,201,0.65)] lg:px-14 lg:py-12">
          <div className="page-fade-up-delay flex items-center justify-between text-[11px] uppercase tracking-[0.34em] text-[#c58c91]">
            <span>Week 12</span>
            <span>Spring Equinox</span>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-[#917f76]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(201,138,143,0.22)] bg-[rgba(255,255,255,0.72)]">
                <Leaf className="h-4 w-4 text-[#c48188]" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em]">Mind Companion Ledger</span>
            </div>

            <div className="flex items-end gap-4">
              <h1 className="font-display text-2xl leading-none text-[#241e1d] sm:text-3xl">此刻</h1>
              <p className="font-display text-2xl leading-none text-[#241e1d] sm:text-3xl">把心事写进今天这一页</p>
            </div>

            <p className="max-w-xl text-sm leading-7 text-[#70625c] sm:text-base">
              这是一个像纸本手帐一样的对话空间。你可以从工作、关系、夜晚的情绪开始，也可以只写下一句“我今天很累”。
            </p>

            <div className="relative z-20 flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/chat"
                className="relative z-20 inline-flex items-center justify-center gap-2 rounded-full bg-[#c9878e] px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_16px_34px_rgba(201,135,142,0.28)] hover:-translate-y-0.5 hover:bg-[#b9757d]"
              >
                开始书写
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/ops"
                className="relative z-20 inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(180,160,149,0.5)] bg-[rgba(255,255,255,0.6)] px-5 py-3 text-sm text-[#7d6d66] transition-all hover:-translate-y-0.5"
              >
                <Activity className="h-4 w-4" />
                查看运行面板
              </Link>
            </div>
          </div>

          <div className="paper-lines mt-8 flex-1 pb-6 pt-4">
            <div className="grid gap-4">
              {guideCards.map((card, index) => (
                <article
                  key={card.label}
                  className={`soft-accent-card rounded-[18px] border px-5 py-4 shadow-[0_10px_24px_rgba(183,145,132,0.06)] ${index === 1 ? 'translate-x-0 md:translate-x-4' : ''}`}
                  style={{ borderColor: 'rgba(229, 213, 201, 0.58)' }}
                >
                  <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-[#c48188]">
                    <span>{card.time}</span>
                    <card.icon className="h-4 w-4" />
                  </div>
                  <p className="flex items-center gap-6 whitespace-nowrap font-sans text-[17px] font-normal leading-8 text-[#302724] sm:text-[18px]">
                    <span>{card.label}</span>
                    <span>{card.note}</span>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex w-full flex-col px-6 py-8 sm:px-10 lg:w-1/2 lg:px-14 lg:py-12">
          <div className="page-fade-up-delay flex items-center justify-between">
            <h2 className="font-display text-2xl text-[#241e1d] sm:text-3xl">Priorities</h2>
            <div className="flex gap-2">
              <span className="h-2 w-2 rounded-full bg-[rgba(201,138,143,0.45)]" />
              <span className="h-2 w-2 rounded-full bg-[rgba(201,138,143,0.22)]" />
            </div>
          </div>

          <div className="mt-10 space-y-6 border-b border-[rgba(227,213,201,0.7)] pb-12">
            {priorities.map((item, index) => (
              <div key={item} className="flex items-start gap-4 border-b border-[rgba(231,220,210,0.6)] pb-5 last:border-b-0 last:pb-0">
                <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${index === 0 ? 'border-[#c9878e] bg-[#c9878e] text-white' : 'border-[rgba(181,164,153,0.6)] text-transparent'}`}>
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className={`text-lg leading-8 ${index === 0 ? 'text-[#5b4d47] line-through decoration-[#c9878e]/70 decoration-2' : 'text-[#3f3632]'}`}>
                    {item}
                  </p>
                  {index === 0 ? <span className="mt-2 inline-flex rounded-full bg-[rgba(221,213,205,0.72)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#9a8a82]">Design</span> : null}
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-6">
            <div className="paper-lines min-h-[176px] rounded-[20px] border border-[rgba(227,213,201,0.58)] bg-[rgba(255,255,255,0.3)] px-6 py-5">
              <h3 className="font-display text-2xl text-[#241e1d]">Journal &amp; Notes</h3>
              <div className="mt-6 max-w-[620px] space-y-3 font-display text-[18px] italic leading-[1.8] text-[#8b7b73] sm:text-[22px]">
                <p><span className="type-line type-line-short">今天不用把故事说完整，只需要给情绪一个位置。</span></p>
                <p><span className="type-line type-line-delay type-line-short">如果你愿意，我们可以先从最难开口的那一句开始。</span></p>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-0 right-10 h-40 w-32 rounded-[45%_55%_70%_30%/45%_50%_50%_55%] bg-[rgba(226,216,208,0.42)] blur-[1px]" />
          </div>

          <div className="mt-6 text-right text-[11px] uppercase tracking-[0.18em] text-[#b39d92]">
            如遇紧急情况，可拨打心理援助热线 400-161-9995
          </div>

          <aside className="absolute right-3 top-1/2 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
            {months.map((month) => (
              <div key={month} className={`month-tab flex h-20 w-11 items-center justify-center rounded-r-2xl rounded-l-xl text-xs tracking-[0.3em] ${month === 'MAR' ? 'text-[#c9878e]' : 'text-[#b3a49b]'}`} style={{ writingMode: 'vertical-rl' }}>
                {month}
              </div>
            ))}
          </aside>
        </section>
      </div>
    </main>
  );
}
