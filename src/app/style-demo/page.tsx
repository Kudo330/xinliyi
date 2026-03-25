'use client';

import { useState } from 'react';
import { Heart, Sparkles, Calendar, Star, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

type StyleType = 'A' | 'B' | 'C' | 'D';

export default function StyleDemoPage() {
  const [activeStyle, setActiveStyle] = useState<StyleType>('A');
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', content: '你好呀，今天过得怎么样？' },
    { id: '2', role: 'user', content: '今天工作有点累...' },
    { id: '3', role: 'assistant', content: '辛苦了，先喝口水休息一下吧。' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), role: 'user', content: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: '我理解你的感受，慢慢来。' }]);
    }, 500);
  };

  // 风格A：温暖治愈系
  const StyleA = () => (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #F5F0E8 0%, #E8E4DF 50%, #F5EDE3 100%)' }}>
      {/* 毛绒质感背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #D4C4B0 0%, transparent 70%)', filter: 'blur(20px)' }} />
        <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #C4B4A0 0%, transparent 70%)', filter: 'blur(25px)' }} />
      </div>

      <header className="relative px-6 py-5" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-xl hover:scale-105 transition-transform" style={{ background: 'rgba(212,196,176,0.3)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: '#8B7355' }} />
          </Link>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8DDD0 0%, #D4C4B0 100%)' }}>
            <span className="text-lg">🌿</span>
          </div>
          <div>
            <h1 className="text-base font-medium" style={{ color: '#5A4A3A' }}>心理易</h1>
            <p className="text-xs" style={{ color: '#A08060' }}>温暖陪伴中</p>
          </div>
        </div>
      </header>

      <main className="relative px-6 py-8 space-y-6 max-w-2xl mx-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: msg.role === 'assistant' ? 'linear-gradient(135deg, #E8DDD0 0%, #D4C4B0 100%)' : 'linear-gradient(135deg, #C4B4A0 0%, #A08060 100%)' }}>
              <span className="text-sm">{msg.role === 'assistant' ? '🌿' : '你'}</span>
            </div>
            <div className={`max-w-[70%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className="inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed" style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg, #A08060 0%, #8B7355 100%)' : 'rgba(255,255,255,0.9)',
                color: msg.role === 'user' ? '#FFF' : '#5A4A3A',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="relative px-6 py-4" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: '#FFF', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="说说你现在的心情..."
            className="flex-1 bg-transparent focus:outline-none text-sm"
            style={{ color: '#5A4A3A' }}
          />
          <button onClick={handleSend} className="p-2 rounded-xl transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg, #A08060 0%, #8B7355 100%)' }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </footer>
    </div>
  );

  // 风格B：极简自然系
  const StyleB = () => (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
      {/* 自然纹理背景 */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <svg width="100%" height="100%">
          <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#E0E0E0" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <header className="px-6 py-6 border-b" style={{ borderColor: '#F0F0F0' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
              <span className="text-sm">🌿</span>
            </div>
            <span className="text-sm font-normal text-gray-600">心理易</span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="px-6 py-8 space-y-6 max-w-2xl mx-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-100">
              <span className="text-xs">{msg.role === 'assistant' ? '🌿' : '你'}</span>
            </div>
            <div className={`max-w-[65%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className="inline-block px-4 py-3 rounded-2xl text-sm" style={{
                background: msg.role === 'user' ? '#1A1A1A' : '#FFF',
                color: msg.role === 'user' ? '#FFF' : '#333',
                border: '1px solid #F0F0F0'
              }}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-white border-t" style={{ borderColor: '#F0F0F0' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="..."
            className="flex-1 bg-transparent focus:outline-none text-sm text-gray-600"
          />
          <button onClick={handleSend} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <Send className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </footer>
    </div>
  );

  // 风格C：温暖手绘风
  const StyleC = () => (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(180deg, #FFF9F0 0%, #FFF5E6 100%)' }}>
      {/* 手绘装饰元素 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-4 text-4xl opacity-20">🌸</div>
        <div className="absolute top-40 right-8 text-3xl opacity-20">🌿</div>
        <div className="absolute bottom-32 left-12 text-4xl opacity-20">🌼</div>
        <div className="absolute bottom-20 -right-2 text-3xl opacity-20">🍃</div>
        <svg className="absolute top-16 right-20 w-24 h-24 opacity-10" viewBox="0 0 100 100">
          <path d="M50 10 Q70 30 50 50 Q30 70 50 90" stroke="#D4A574" strokeWidth="2" fill="none"/>
          <path d="M50 30 Q60 40 50 50" stroke="#D4A574" strokeWidth="1.5" fill="none"/>
          <path d="M50 50 Q40 60 50 70" stroke="#D4A574" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>

      <header className="relative px-5 py-4" style={{ background: 'rgba(255,255,255,0.5)' }}>
        <div className="flex items-center justify-between">
          <Link href="/" className="p-2 rounded-2xl bg-white shadow-sm hover:scale-105 transition-transform">
            <ArrowLeft className="w-5 h-5 text-amber-700" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <span className="text-xl">🌿</span>
            </div>
            <div>
              <h1 className="text-base font-normal" style={{ color: '#8B6914' }}>心理易</h1>
              <p className="text-xs" style={{ color: '#B8956E' }}>在这里陪你</p>
            </div>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="relative px-5 py-6 space-y-5 max-w-xl mx-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm" style={{ background: msg.role === 'assistant' ? '#FFF9F0' : '#FFE4B5' }}>
              <span className="text-sm">{msg.role === 'assistant' ? '🌿' : '你'}</span>
            </div>
            <div className={`max-w-[68%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className="inline-block px-4 py-3 rounded-2xl text-sm shadow-sm" style={{
                background: msg.role === 'user' ? '#FFB347' : '#FFF',
                color: msg.role === 'user' ? '#FFF' : '#8B6914',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px'
              }}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="relative px-5 py-4" style={{ background: 'rgba(255,255,255,0.6)' }}>
        <div className="max-w-xl mx-auto flex items-center gap-2 px-3 py-2 rounded-full bg-white shadow-md">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="写下你的心情..."
            className="flex-1 bg-transparent focus:outline-none text-sm px-2"
            style={{ color: '#8B6914' }}
          />
          <button onClick={handleSend} className="p-2.5 rounded-full shadow-sm transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg, #FFB347 0%, #FF9500 100%)' }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </footer>
    </div>
  );

  // 风格D：拟物化便签风
  const StyleD = () => (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(180deg, #F5F0E8 0%, #EDE5D8 100%)' }}>
      {/* 便签纸纹理 */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-2" style={{ background: 'repeating-linear-gradient(90deg, #E8DCD0 0px, #E8DCD0 20px, transparent 20px, transparent 40px)' }} />
      </div>

      {/* 顶部装饰条 */}
      <div className="h-3 w-full" style={{ background: 'linear-gradient(90deg, #E8A4B8 0%, #F5D76E 50%, #7DD3C0 100%)' }} />

      <header className="px-6 py-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/" className="p-2 rounded-lg hover:bg-white/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-rose-400" />
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-sm">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F5D76E 0%, #E8A4B8 100%)' }}>
              <span className="text-sm">💌</span>
            </div>
            <span className="text-sm font-normal text-rose-800">心理易</span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="px-6 py-4 max-w-xl mx-auto space-y-4">
        {/* 日期分隔线 */}
        <div className="flex items-center gap-4 my-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, #D4C4B0, transparent)' }} />
          <span className="text-xs px-3 py-1 rounded-full bg-white/60" style={{ color: '#A08060' }}>今天</span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, #D4C4B0, transparent)' }} />
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm" style={{ background: msg.role === 'assistant' ? '#FFFDE7' : '#FFEBEE' }}>
              <span className="text-sm">{msg.role === 'assistant' ? '💌' : '你'}</span>
            </div>
            <div className={`max-w-[65%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              {/* 便签样式消息 */}
              <div className="inline-block px-4 py-3 text-sm shadow-md relative" style={{
                background: msg.role === 'user' ? '#FF6B8A' : '#FFFDE7',
                color: msg.role === 'user' ? '#FFF' : '#5D4037',
                transform: msg.role === 'user' ? 'rotate(1deg)' : 'rotate(-1deg)',
                boxShadow: '2px 2px 8px rgba(0,0,0,0.1)'
              }}>
                {/* 便签顶部装饰 */}
                {msg.role === 'assistant' && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-1 rounded-full" style={{ background: '#E8A4B8' }} />
                )}
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 px-6 py-4" style={{ background: 'linear-gradient(180deg, rgba(245,240,232,0.9), rgba(245,240,232,1))' }}>
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#FFFDE7] shadow-md" style={{ boxShadow: '2px 2px 10px rgba(0,0,0,0.1)' }}>
            <span className="text-rose-300">💌</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="写信给我..."
              className="flex-1 bg-transparent focus:outline-none text-sm"
              style={{ color: '#5D4037' }}
            />
            <button onClick={handleSend} className="p-2 rounded-lg transition-transform hover:scale-105 shadow-sm" style={{ background: '#FF6B8A' }}>
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> 返回
            </Link>
            <h1 className="text-lg font-medium text-gray-800">设计风格演示</h1>
            <div className="w-16" />
          </div>
        </div>
      </div>

      {/* 风格选择 */}
      <div className="pt-20 pb-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 flex-wrap justify-center">
            {[
              { key: 'A', label: 'A. 温暖治愈系', desc: '米色基调、柔和光晕' },
              { key: 'B', label: 'B. 极简自然系', desc: '留白、自然纹理' },
              { key: 'C', label: 'C. 温暖手绘风', desc: '手绘插画、圆角' },
              { key: 'D', label: 'D. 拟物化便签', desc: '便签纸、信纸风格' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveStyle(item.key as StyleType)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${activeStyle === item.key ? 'ring-2 ring-offset-2 ring-blue-500' : 'hover:bg-gray-200'}`}
                style={{
                  background: activeStyle === item.key ? '#3B82F6' : '#FFF',
                  color: activeStyle === item.key ? '#FFF' : '#374151'
                }}
              >
                <div className="font-medium">{item.key}. {item.label.split('. ')[1]}</div>
                <div className="text-xs opacity-70">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 演示区域 */}
      <div className="pb-8">
        {activeStyle === 'A' && <StyleA />}
        {activeStyle === 'B' && <StyleB />}
        {activeStyle === 'C' && <StyleC />}
        {activeStyle === 'D' && <StyleD />}
      </div>
    </div>
  );
}
