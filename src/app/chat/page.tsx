'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Calendar, Heart, MoreHorizontal, Send, Sparkles } from 'lucide-react';

type Role = 'user' | 'assistant';
type Mode = 'chat' | 'card' | 'timemachine';
type Companion = 'samoyed' | 'cat' | null;
type EmotionType = 'neutral' | 'happy' | 'sad' | 'anxious' | 'angry' | 'calm';
type CompanionMood = 'happy' | 'peaceful' | 'sleepy' | 'excited';

type Message = {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  kind?: 'text' | 'card' | 'weekly-report';
  card?: {
    title: string;
    keyword: string;
    mantra: string;
    action: string;
    accent: string;
  };
  weeklyReport?: {
    title: string;
    subtitle: string;
    overview: string;
    highlights: string[];
    suggestion: string;
  };
};

type ChatHistoryMessage = {
  role: Role;
  content: string;
};

type CompanionState = {
  name: string;
  mood: CompanionMood;
  daysCount: number;
};

const DEFAULT_WELCOME_MESSAGE = '你好呀。\n\n今天过得怎么样？如果你想说说心里的事，我会在这里安静听着。';
const COMPANION_WELCOME_MESSAGES: Record<Exclude<Companion, null>, string> = {
  samoyed: '你好呀，我是小白。\n\n你可以慢一点说，不用急着整理好情绪。我会先陪你把这一刻接住。',
  cat: '嗨，我是小橘。\n\n你可以从今天最想说的那件事开始，也可以只是随便聊聊。我会陪你一点点理顺。',
};
const MAX_CONTEXT_MESSAGES = 12;
const CARD_DECK = [
  {
    title: '向晴',
    keyword: '今日宜从容',
    mantra: '今天适合先顾好节奏，再谈结果。慢一点，不会耽误你往前走。',
    action: '把今天最重要的一件事单独留出来，先做完它。',
    accent: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,236,228,0.98) 100%)',
  },
  {
    title: '小满',
    keyword: '今日宜留白',
    mantra: '事情不用排得太满，给自己留一点空，当天色都会松下来。',
    action: '主动空出十分钟，什么都不安排。',
    accent: 'linear-gradient(180deg, rgba(255,247,236,0.98) 0%, rgba(248,227,205,0.98) 100%)',
  },
  {
    title: '有风',
    keyword: '今日宜出门',
    mantra: '今天适合动一动，哪怕只是换个地方坐一会儿，想法都会顺一些。',
    action: '去窗边站两分钟，或者下楼走一小圈。',
    accent: 'linear-gradient(180deg, rgba(255,250,247,0.98) 0%, rgba(239,225,218,0.98) 100%)',
  },
  {
    title: '照面',
    keyword: '今日宜开口',
    mantra: '有些话不必准备得太完整，说出来的那一刻，事情就已经开始松动了。',
    action: '把你最想说的一句先发出去，不用润色。',
    accent: 'linear-gradient(180deg, rgba(254,247,242,0.98) 0%, rgba(242,232,225,0.98) 100%)',
  },
  {
    title: '缓行',
    keyword: '今日宜减速',
    mantra: '今天不是比快的时候。把步子放稳，比逞一时之快更划算。',
    action: '把待办里最赶的那件事拆成两步。',
    accent: 'linear-gradient(180deg, rgba(252,247,244,0.98) 0%, rgba(239,231,226,0.98) 100%)',
  },
  {
    title: '见喜',
    keyword: '今日宜记好事',
    mantra: '今天有小顺利的话，别让它轻轻过去。记下来，它会变成后面的底气。',
    action: '写下一件今天还不错的小事。',
    accent: 'linear-gradient(180deg, rgba(255,249,244,0.98) 0%, rgba(242,234,226,0.98) 100%)',
  },
  {
    title: '新枝',
    keyword: '今日宜试试',
    mantra: '今天适合做一点新的尝试，不用大，能让你觉得有意思就够了。',
    action: '选一件平时不会做的小事，试一次。',
    accent: 'linear-gradient(180deg, rgba(254,248,242,0.98) 0%, rgba(244,233,224,0.98) 100%)',
  },
  {
    title: '安坐',
    keyword: '今日宜稳住',
    mantra: '今天不必四处比较。把自己的位置坐稳，很多杂音自然会退下去。',
    action: '关掉一个会分心的窗口，先专心二十分钟。',
    accent: 'linear-gradient(180deg, rgba(255,246,238,0.98) 0%, rgba(247,230,214,0.98) 100%)',
  },
  {
    title: '顺水',
    keyword: '今日宜借力',
    mantra: '有些事不必硬拽着往前走，顺着手边已有的条件做，反而更省力。',
    action: '先做最容易启动的那一件。',
    accent: 'linear-gradient(180deg, rgba(252,246,241,0.98) 0%, rgba(238,229,220,0.98) 100%)',
  },
  {
    title: '留灯',
    keyword: '今日宜收尾',
    mantra: '今天适合把尾巴收一收，不求漂亮，只求心里干净一点。',
    action: '睡前把桌面清一下，或者关掉不再看的页面。',
    accent: 'linear-gradient(180deg, rgba(255,248,245,0.98) 0%, rgba(241,230,223,0.98) 100%)',
  },
  {
    title: '得闲',
    keyword: '今日宜轻松',
    mantra: '有空的时候别急着再塞事情进去。让自己松一会儿，也算正经安排。',
    action: '留一段不被打断的空白时间。',
    accent: 'linear-gradient(180deg, rgba(250,247,242,0.98) 0%, rgba(235,229,220,0.98) 100%)',
  },
  {
    title: '开阔',
    keyword: '今日宜抬头',
    mantra: '今天别总盯着眼前那一点。视野放开些，很多事就没那么卡了。',
    action: '停下来抬头看看远处，再回来继续。',
    accent: 'linear-gradient(180deg, rgba(253,247,243,0.98) 0%, rgba(241,232,226,0.98) 100%)',
  },
];

const COMPANION_BY_TYPE: Record<Exclude<Companion, null>, CompanionState> = {
  samoyed: { name: '小白', mood: 'peaceful', daysCount: 1 },
  cat: { name: '小橘', mood: 'peaceful', daysCount: 1 },
};

function CompanionAvatar({
  companion,
  className = '',
  detailed = false,
}: {
  companion: Companion;
  className?: string;
  detailed?: boolean;
}) {
  const src = companion === 'cat' ? '/golden-cat-avatar.png' : '/samoyed-avatar.png';
  const sizes = detailed ? '80px' : '48px';
  const scaleClass = detailed ? 'scale-x-[0.94] scale-y-[1.12]' : 'scale-x-[0.92] scale-y-[1.08]';
  const positionClass = companion === 'cat' ? 'object-[center_45%]' : 'object-[center_44%]';

  return (
    <span className={`relative block overflow-hidden rounded-full ${className}`}>
      <Image
        src={src}
        alt={companion === 'cat' ? '小橘头像' : '小白头像'}
        fill
        sizes={sizes}
        priority={detailed}
        className={`${scaleClass} ${positionClass} select-none mix-blend-multiply`}
        style={{ filter: 'contrast(1.03) brightness(1.01)' }}
      />
    </span>
  );
}

const EMOTION_LABELS: Record<Exclude<EmotionType, 'neutral'>, string> = {
  happy: '我感觉到你这会儿有一点轻松和开心。',
  sad: '我感觉到你心里有些难过。',
  anxious: '我感觉到你在紧张和担心。',
  angry: '我感觉到你有些委屈和生气。',
  calm: '你现在像是在慢慢安定下来。',
};

function createMessage(role: Role, content: string): Message {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: new Date(),
    kind: 'text',
  };
}

function getEmotionGradient(emotion: EmotionType): string {
  const gradients: Record<EmotionType, string> = {
    neutral: 'linear-gradient(180deg, #F5F0E8 0%, #E8E4DF 50%, #E0DBD3 100%)',
    happy: 'linear-gradient(180deg, #FFF8E7 0%, #FFE4C4 50%, #FFDAB9 100%)',
    sad: 'linear-gradient(180deg, #E8F4F8 0%, #D4E4E8 50%, #C8DBE0 100%)',
    anxious: 'linear-gradient(180deg, #F5F0E8 0%, #E8E0D8 50%, #DDD5CB 100%)',
    angry: 'linear-gradient(180deg, #FFF0F0 0%, #FFE4E4 50%, #FFD4D4 100%)',
    calm: 'linear-gradient(180deg, #F0F8E8 0%, #E4ECD4 50%, #D8E0C4 100%)',
  };

  return gradients[emotion];
}

function getEmotionGlow(emotion: EmotionType): { color: string; opacity: number } {
  const glows: Record<EmotionType, { color: string; opacity: number }> = {
    neutral: { color: '#D4E4D4', opacity: 0.3 },
    happy: { color: '#FFE4B5', opacity: 0.4 },
    sad: { color: '#B4C8D4', opacity: 0.35 },
    anxious: { color: '#D4C8B8', opacity: 0.3 },
    angry: { color: '#FFB4B4', opacity: 0.3 },
    calm: { color: '#C4D4B4', opacity: 0.35 },
  };

  return glows[emotion];
}

function getCompanionMood(emotion: EmotionType): CompanionMood {
  switch (emotion) {
    case 'happy':
      return 'excited';
    case 'sad':
    case 'angry':
      return 'sleepy';
    case 'calm':
      return 'happy';
    default:
      return 'peaceful';
  }
}

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function createCardMessage(): Message {
  const card = getRandomItem(CARD_DECK);

  return {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    content: `${card.title}\n${card.mantra}`,
    timestamp: new Date(),
    kind: 'card',
    card,
  };
}

function createWeeklyReportMessage(companion: Companion, emotionHistory: EmotionType[], userMessageCount: number): Message {
  const emotionCounts = emotionHistory.reduce<Record<EmotionType, number>>(
    (acc, emotion) => {
      acc[emotion] += 1;
      return acc;
    },
    { neutral: 0, happy: 0, sad: 0, anxious: 0, angry: 0, calm: 0 },
  );

  const dominantEmotionEntry = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0] as [EmotionType, number] | undefined;
  const dominantEmotion = dominantEmotionEntry?.[1] ? dominantEmotionEntry[0] : 'neutral';

  const overviewMap: Record<EmotionType, string> = {
    neutral: '这一周整体比较平，像是在一边往前走，一边慢慢消化手头的事。',
    happy: '这一周有一些轻松下来的时刻，说明你并不是一直绷着，还是有在慢慢回暖。',
    sad: '这一周心里偏沉一点，像有些事一直挂着，没有真正放下来。',
    anxious: '这一周更像是在反复担心和来回想，心一直没怎么真正松开。',
    angry: '这一周有几次明显的烦和堵，说明有些边界已经让你不太舒服了。',
    calm: '这一周虽然有起伏，但整体比前面更能慢慢安定下来。',
  };

  const companionSuggestion =
    companion === 'cat'
      ? '下周别一口气想完所有事，先挑一件最想理顺的，处理完再看下一件。'
      : '下周先给自己留一点缓冲，不用每次都在最紧的时候才想起照顾自己。';

  const highlights: string[] = [];
  if (userMessageCount > 0) {
    highlights.push(`这一周你一共留下了 ${userMessageCount} 次表达，说明你有在认真对待自己的状态。`);
  }

  if (emotionCounts.anxious > 0 || emotionCounts.sad > 0) {
    highlights.push('比较常见的是紧张和心累，很多时候不是事情太多，而是一直没有真正停下来。');
  }

  if (emotionCounts.calm > 0 || emotionCounts.happy > 0) {
    highlights.push('中间也出现过稍微缓下来的时候，这说明你的状态不是单向往下的。');
  }

  if (highlights.length < 3) {
    highlights.push('你不是没有在往前走，只是最近走得比较慢，也比较费力。');
  }

  return {
    id: `weekly-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    content: overviewMap[dominantEmotion],
    timestamp: new Date(),
    kind: 'weekly-report',
    weeklyReport: {
      title: '上一周心情周报',
      subtitle: companion === 'cat' ? '小橘替你看了一眼这一周' : '小白替你轻轻整理了一下这一周',
      overview: overviewMap[dominantEmotion],
      highlights: highlights.slice(0, 3),
      suggestion: companionSuggestion,
    },
  };
}

function getAssistantBubbleStyle(companion: Companion) {
  if (companion === 'cat') {
    return {
      background: 'linear-gradient(135deg, rgba(255,248,239,0.96) 0%, rgba(251,232,211,0.98) 100%)',
      color: '#5b4538',
      borderColor: 'rgba(233, 189, 148, 0.92)',
    };
  }

  return {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(243,236,229,0.98) 100%)',
    color: '#4f423c',
    borderColor: 'rgba(223,209,199,0.92)',
  };
}

function createSessionId(): string {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isEmotionType(value: unknown): value is EmotionType {
  return value === 'neutral' || value === 'happy' || value === 'sad' || value === 'anxious' || value === 'angry' || value === 'calm';
}

function buildChatHistory(messages: Message[]): ChatHistoryMessage[] {
  return messages
    .filter((message) => message.content !== DEFAULT_WELCOME_MESSAGE && !Object.values(COMPANION_WELCOME_MESSAGES).includes(message.content))
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((message) => ({
      role: message.role,
      content:
        message.kind === 'card' && message.card
          ? `${message.card.title}。${message.card.mantra} ${message.card.action}`
          : message.kind === 'weekly-report' && message.weeklyReport
            ? `${message.weeklyReport.title}。${message.weeklyReport.overview} ${message.weeklyReport.suggestion}`
            : message.content,
    }));
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('chat');
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral');
  const [emotionHistory, setEmotionHistory] = useState<EmotionType[]>([]);
  const [companion, setCompanion] = useState<Companion>(null);
  const [companionState, setCompanionState] = useState<CompanionState>({
    name: '',
    mood: 'peaceful',
    daysCount: 1,
  });
  const [showCompanionSelect, setShowCompanionSelect] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(createSessionId());
  const userTurnCountRef = useRef(0);

  useEffect(() => {
    setMessages([createMessage('assistant', DEFAULT_WELCOME_MESSAGE)]);
  }, []);

  useEffect(() => {
    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'chat_page_viewed',
        sessionId: sessionIdRef.current,
      }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const glow = useMemo(() => getEmotionGlow(currentEmotion), [currentEmotion]);

  const selectCompanion = (type: Exclude<Companion, null>) => {
    setCompanion(type);
    setCompanionState(COMPANION_BY_TYPE[type]);
    setShowCompanionSelect(false);
    setMessages((prev) => {
      const nextWelcome = createMessage('assistant', COMPANION_WELCOME_MESSAGES[type]);
      if (prev.length === 1 && prev[0]?.role === 'assistant') {
        return [nextWelcome];
      }
      return [...prev, nextWelcome];
    });
  };

  const applyDetectedEmotion = (emotion: EmotionType) => {
    setCurrentEmotion(emotion);
    setEmotionHistory((prev) => [...prev.slice(-9), emotion]);
    setCompanionState((prev) => ({ ...prev, mood: getCompanionMood(emotion) }));
  };

  const drawCard = () => {
    if (isLoading) {
      return;
    }

    setMode('chat');
    setInput('');
    setMessages((prev) => [...prev, createCardMessage()]);
  };

  const generateWeeklyReport = () => {
    if (isLoading) {
      return;
    }

    setMode('chat');
    setInput('');

    const userMessageCount = messages.filter((message) => message.role === 'user').length;
    setMessages((prev) => [...prev, createWeeklyReportMessage(companion, emotionHistory, userMessageCount)]);
  };

  const handleModeChange = (nextMode: Mode) => {
    if (nextMode === 'card') {
      drawCard();
      return;
    }

    if (nextMode === 'timemachine') {
      generateWeeklyReport();
      return;
    }

    setMode(nextMode);

    setInput('');
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage = createMessage('user', trimmed);
    const history = buildChatHistory(messages);
    const nextUserTurn = userTurnCountRef.current + 1;

    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'chat_user_message_sent',
        sessionId: sessionIdRef.current,
        metadata: {
          turn: nextUserTurn,
          mode,
          messageLength: trimmed.length,
          messagePreview: trimmed.replace(/\s+/g, ' ').trim().slice(0, 80),
        },
      }),
    }).catch(() => {});

    userTurnCountRef.current = nextUserTurn;

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          companion,
          history,
          sessionId: sessionIdRef.current,
        }),
      });

      const data = await response.json();
      const nextEmotion = isEmotionType(data.emotion) ? data.emotion : 'neutral';

      applyDetectedEmotion(nextEmotion);
      setMessages((prev) => [...prev, createMessage('assistant', data.response || data.error || '我在这里，慢慢说。')]);
    } catch {
      applyDetectedEmotion('neutral');
      setMessages((prev) => [...prev, createMessage('assistant', '网络有一点不稳定，但我还在这里。')]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div
        className="notebook-shell relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1380px] flex-col overflow-hidden rounded-[28px]"
        style={{ background: getEmotionGradient(currentEmotion) }}
      >
        <div className="notebook-spine hidden lg:block" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden transition-all duration-1000">
        <div
          className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full transition-all duration-1500"
          style={{
            background: `radial-gradient(circle, ${glow.color} 0%, transparent 70%)`,
            opacity: glow.opacity,
            transform: currentEmotion === 'sad' ? 'translate(-30%, -30%) scale(1.1)' : 'translate(-30%, -30%)',
            filter: currentEmotion === 'sad' ? 'blur(20px)' : 'blur(30px)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full transition-all duration-1500"
          style={{
            background: 'radial-gradient(circle, #E8DFD4 0%, transparent 70%)',
            opacity: 0.25,
            transform: 'translate(20%, 20%)',
            filter: 'blur(30px)',
          }}
        />
        </div>

        <header className="relative flex items-center justify-between border-b border-[rgba(227,213,201,0.7)] px-5 py-5 sm:px-8 lg:px-12" style={{ background: 'rgba(255,248,242,0.54)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-4">
          <Link
            href="/"
            className="rounded-full border border-[rgba(219,201,191,0.92)] p-3 transition-all hover:scale-105"
            style={{ background: 'linear-gradient(180deg, rgba(247,239,232,0.96) 0%, rgba(236,224,214,0.92) 100%)' }}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: '#8b756c' }} />
          </Link>
          <div className="flex items-center gap-3">
            {companion ? (
              <button
                onClick={() => setShowCompanionSelect(true)}
                className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl transition-all hover:scale-105"
                style={{
                  background: 'transparent',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              >
                <CompanionAvatar companion={companion} className="h-12 w-12" />
                <span
                  className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white text-[10px]"
                  style={{
                    background:
                      companionState.mood === 'happy'
                        ? '#c9878e'
                        : companionState.mood === 'excited'
                          ? '#d69a86'
                          : companionState.mood === 'peaceful'
                            ? '#b79c91'
                            : '#a88d84',
                    color: '#fffaf8',
                  }}
                >
                  •
                </span>
              </button>
            ) : (
              <button
                onClick={() => setShowCompanionSelect(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #E8E4DF 0%, #D8D4CB 100%)' }}
              >
                <span className="text-lg">+</span>
              </button>
            )}
            <div>
              <h1 className="font-display text-[22px] leading-none" style={{ color: '#2c2320' }}>
                {companion ? companionState.name : '小心'}
              </h1>
              <p className="mt-1 text-[11px] uppercase tracking-[0.26em]" style={{ color: '#c18b90' }}>
                {mode === 'chat' ? '一起慢慢聊' : mode === 'card' ? '抽一张疗愈卡' : '和过去的自己说说话'}
              </p>
            </div>
          </div>
        </div>
          <button
            className="rounded-full border border-[rgba(215,198,188,0.9)] p-3 transition-all hover:scale-105"
            style={{ background: 'linear-gradient(180deg, rgba(252,248,243,0.94) 0%, rgba(239,230,222,0.92) 100%)' }}
          >
            <MoreHorizontal className="h-5 w-5" style={{ color: '#a18f86' }} />
          </button>
        </header>

        <div className="relative flex gap-2 overflow-x-auto border-b border-[rgba(227,213,201,0.6)] px-5 py-4 sm:px-8 lg:px-12">
        {[ 
          { key: 'chat', icon: Heart, label: '倾诉' },
          { key: 'card', icon: Sparkles, label: '抽卡' },
          { key: 'timemachine', icon: Calendar, label: '时光' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => handleModeChange(item.key as Mode)}
            className="flex items-center gap-2 whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] transition-all hover:scale-105"
            style={{
              background: mode === item.key ? 'linear-gradient(135deg, #ca878e 0%, #b9767d 100%)' : 'rgba(255,255,255,0.66)',
              color: mode === item.key ? '#FFFFFF' : '#8e7c74',
              borderColor: mode === item.key ? 'rgba(185, 118, 125, 0.82)' : 'rgba(216,199,189,0.82)',
              boxShadow: mode === item.key ? '0 12px 26px rgba(201,135,142,0.24)' : 'none',
            }}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
        </div>

      {currentEmotion !== 'neutral' && emotionHistory.length > 0 && (
        <div className="relative px-5 pb-3 pt-3 sm:px-8 lg:px-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(216,198,188,0.8)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm shadow-sm" style={{ color: '#7c6b64' }}>
            <span className="h-2 w-2 rounded-full bg-[#c9878e]" />
            <span>{EMOTION_LABELS[currentEmotion as Exclude<EmotionType, 'neutral'>]}</span>
          </div>
        </div>
      )}

        <main className="relative flex-1 overflow-y-auto">
          <div className="paper-lines mx-auto max-w-3xl space-y-8 px-5 py-8 sm:px-8 lg:px-12">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm"
                style={{
                  background:
                    message.role === 'assistant'
                      ? 'transparent'
                      : 'linear-gradient(135deg, #d9999f 0%, #c9878e 100%)',
                  border: message.role === 'assistant' ? 'none' : '1px solid rgba(190, 116, 125, 0.75)',
                }}
              >
                <span className="text-sm" style={{ color: message.role === 'assistant' ? '#7a6961' : '#fffdf9' }}>
                  {message.role === 'assistant' ? <CompanionAvatar companion={companion} className="h-11 w-11" /> : '你'}
                </span>
              </div>
              <div className={`max-w-[75%] ${message.role === 'user' ? 'text-right' : ''}`}>
                {message.kind === 'card' && message.card ? (
                  <div
                    className="inline-block w-[min(100%,360px)] overflow-hidden rounded-[28px] border p-5 shadow-[0_20px_40px_rgba(156,124,109,0.12)]"
                    style={{
                      background: message.card.accent,
                      borderColor: getAssistantBubbleStyle(companion).borderColor,
                    }}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.28em] text-[#c18b90]">Lucky Note</div>
                        <h3 className="mt-2 font-display text-[30px] leading-none text-[#2f2623]">{message.card.title}</h3>
                      </div>
                      <div className="rounded-full border border-[rgba(201,138,143,0.26)] bg-[rgba(255,255,255,0.52)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#9e7e73]">
                        {message.card.keyword}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-[22px] border border-[rgba(219,201,191,0.52)] bg-[rgba(255,255,255,0.54)] px-4 py-4">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-[#b58b84]">今日签语</div>
                        <p className="mt-2 text-[14px] leading-7 text-[#5a4a44]">{message.card.mantra}</p>
                      </div>
                      <div className="rounded-[22px] border border-[rgba(219,201,191,0.52)] bg-[rgba(255,255,255,0.4)] px-4 py-4">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-[#b58b84]">顺手做做</div>
                        <p className="mt-2 text-[14px] leading-7 text-[#695750]">{message.card.action}</p>
                      </div>
                    </div>
                  </div>
                ) : message.kind === 'weekly-report' && message.weeklyReport ? (
                  <div
                    className="inline-block w-[min(100%,420px)] overflow-hidden rounded-[30px] border p-5 shadow-[0_20px_40px_rgba(156,124,109,0.12)]"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,251,248,0.98) 0%, rgba(244,235,228,0.98) 100%)',
                      borderColor: getAssistantBubbleStyle(companion).borderColor,
                    }}
                  >
                    <div className="mb-4">
                      <div className="text-[11px] uppercase tracking-[0.26em] text-[#c18b90]">Weekly Report</div>
                      <h3 className="mt-2 font-display text-[28px] leading-none text-[#2f2623]">{message.weeklyReport.title}</h3>
                      <p className="mt-2 text-[13px] text-[#8b756c]">{message.weeklyReport.subtitle}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[22px] border border-[rgba(219,201,191,0.52)] bg-[rgba(255,255,255,0.54)] px-4 py-4">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-[#b58b84]">这一周的感觉</div>
                        <p className="mt-2 text-[14px] leading-7 text-[#5a4a44]">{message.weeklyReport.overview}</p>
                      </div>

                      <div className="rounded-[22px] border border-[rgba(219,201,191,0.52)] bg-[rgba(255,255,255,0.4)] px-4 py-4">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-[#b58b84]">我留意到的几件事</div>
                        <ul className="mt-2 space-y-2 text-[14px] leading-7 text-[#695750]">
                          {message.weeklyReport.highlights.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-[10px] h-1.5 w-1.5 rounded-full bg-[#c18b90]" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-[22px] border border-[rgba(219,201,191,0.52)] bg-[rgba(255,255,255,0.4)] px-4 py-4">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-[#b58b84]">下周可以先这样</div>
                        <p className="mt-2 text-[14px] leading-7 text-[#695750]">{message.weeklyReport.suggestion}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="inline-block whitespace-pre-wrap rounded-[26px] border px-5 py-4 text-[13px] leading-relaxed shadow-[0_18px_34px_rgba(156,124,109,0.08)]"
                    style={{
                      background:
                        message.role === 'user'
                          ? 'linear-gradient(135deg, rgba(201,135,142,0.98) 0%, rgba(185,118,125,0.96) 100%)'
                          : getAssistantBubbleStyle(companion).background,
                      color: message.role === 'user' ? '#fffaf8' : getAssistantBubbleStyle(companion).color,
                      borderColor: message.role === 'user' ? 'rgba(190,116,125,0.88)' : getAssistantBubbleStyle(companion).borderColor,
                      borderRadius: message.role === 'user' ? '24px 24px 8px 24px' : '24px 24px 24px 8px',
                    }}
                  >
                    {message.content}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm" style={{ background: 'transparent' }}>
                <CompanionAvatar companion={companion} className="h-11 w-11" />
              </div>
              <div className="rounded-[26px] rounded-bl-md border border-[rgba(223,209,199,0.92)] bg-white/85 px-5 py-4 shadow-sm">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="h-2 w-2 animate-pulse rounded-full" style={{ background: '#c9878e', animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="relative border-t border-[rgba(227,213,201,0.7)] px-5 py-5 sm:px-8 lg:px-12" style={{ background: 'rgba(255,248,242,0.58)', backdropFilter: 'blur(20px)' }}>
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3 rounded-[28px] border border-[rgba(220,205,195,0.92)] px-1 py-1 shadow-[0_22px_44px_rgba(125,98,84,0.1)]" style={{ background: 'rgba(255,255,255,0.88)' }}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'card'
                  ? '比如：帮我抽一张卡'
                  : '在这里写下你现在的心情...'
              }
              className="flex-1 resize-none bg-transparent px-5 py-4 text-[13px] leading-relaxed focus:outline-none"
              style={{ color: '#4f423c', minHeight: '24px', maxHeight: '100px' }}
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 rounded-full p-3.5 transition-all hover:scale-105 disabled:opacity-50"
              style={{
                background: input.trim() && !isLoading ? 'linear-gradient(135deg, #ca878e 0%, #b9767d 100%)' : 'rgba(212,212,212,0.5)',
                color: '#FFFFFF',
              }}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          </div>
        </footer>

      {showCompanionSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(140,125,117,0.18)', backdropFilter: 'blur(8px)' }}>
          <div className="relative w-full max-w-sm overflow-hidden rounded-[30px] border border-[rgba(223,209,199,0.92)] p-8 shadow-2xl" style={{ background: 'linear-gradient(180deg, #fffdfa 0%, #f5ede5 100%)' }}>
            <div className="absolute left-0 top-0 h-32 w-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #efdad3 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #e7c0c4 0%, #d79aa0 100%)' }}>
                  <Heart className="h-5 w-5" style={{ color: '#fff7f5' }} />
                </div>
                <h3 className="font-display text-2xl" style={{ color: '#372d2a' }}>选择你的心灵小伙伴</h3>
              </div>

              <p className="mb-6 text-sm leading-7" style={{ color: '#705f59' }}>
                它会陪你度过每一天，也会留意你的情绪变化。
              </p>

              <div className="mb-6 flex gap-4">
                <button
                  onClick={() => selectCompanion('samoyed')}
                  className="flex-1 rounded-2xl p-4 transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #f6efe7 100%)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                    border: companion === 'samoyed' ? '2px solid #c9878e' : '2px solid transparent',
                  }}
                >
                  <CompanionAvatar companion="samoyed" className="mx-auto mb-3 block h-16 w-16" detailed />
                  <div className="font-display text-xl" style={{ color: '#4A5550' }}>小白</div>
                  <div className="text-xs uppercase tracking-[0.16em]" style={{ color: '#8f9c98' }}>安静温柔</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.16em]" style={{ color: '#aab5b0' }}>治愈陪伴</div>
                </button>

                <button
                  onClick={() => selectCompanion('cat')}
                  className="flex-1 rounded-2xl p-4 transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(180deg, #fbf2eb 0%, #f2d7cb 100%)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                    border: companion === 'cat' ? '2px solid #c9878e' : '2px solid transparent',
                  }}
                >
                  <CompanionAvatar companion="cat" className="mx-auto mb-3 block h-16 w-16" detailed />
                  <div className="font-display text-xl" style={{ color: '#4A5550' }}>小橘</div>
                  <div className="text-xs uppercase tracking-[0.16em]" style={{ color: '#b27a54' }}>活泼可爱</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.16em]" style={{ color: '#d09572' }}>轻松陪伴</div>
                </button>
              </div>

              <button
                onClick={() => setShowCompanionSelect(false)}
                className="w-full rounded-full py-3.5 text-sm font-semibold uppercase tracking-[0.16em] transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #ca878e 0%, #b9767d 100%)', color: '#FFFFFF' }}
              >
                继续聊天
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
