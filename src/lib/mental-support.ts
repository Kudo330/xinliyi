export const REQUEST_TIMEOUT_MS = 9000;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_HISTORY_MESSAGES = 12;
export const MAX_HISTORY_MESSAGE_LENGTH = 1200;
export const HOTLINE_NUMBER = '400-161-9995';

export const CRISIS_KEYWORDS = ['自杀', '不想活', '活不下去', '轻生', '结束生命', '自残', '伤害自己', '准备好告别', '想结束'];
export const SOFT_RISK_KEYWORDS = ['撑不住了', '想消失', '想离开', '没意思', '不如死', '一了百了', '不想醒来', '告别', '消失就好了', '如果我消失', '没人需要我'];

export type ChatRole = 'user' | 'assistant';
export type EmotionType = 'neutral' | 'happy' | 'sad' | 'anxious' | 'angry' | 'calm';
export type RiskLevel = 'none' | 'elevated' | 'high';
export type CompanionType = 'samoyed' | 'cat' | null;
export type IntentType = 'venting' | 'comfort' | 'advice';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type RiskAssessment = {
  detected: boolean;
  level: RiskLevel;
  score: number;
  reasons: string[];
};

export type LocalReplyContext = {
  message: string;
  history?: ChatMessage[];
  companion?: CompanionType;
};

const EMOTION_KEYWORDS: Record<EmotionType, string[]> = {
  neutral: [],
  happy: ['开心', '高兴', '快乐', '幸福', '轻松', 'happy', 'joy', 'excited'],
  sad: ['难过', '伤心', '痛苦', '失望', '绝望', '孤独', '想哭', 'sad', 'depressed', 'crying'],
  anxious: ['焦虑', '紧张', '担心', '害怕', '不安', '压力', '失眠', 'anxious', 'worried', 'nervous'],
  angry: ['生气', '愤怒', '讨厌', '气死了', '火大', 'angry', 'hate', 'furious'],
  calm: ['平静', '放松', '安心', '舒服', '安宁', 'calm', 'peaceful', 'relaxed'],
};

const ADVICE_KEYWORDS = ['怎么办', '要不要', '该不该', '是不是', '如何', '怎么做', '怎么说', '要不要分', '适不适合'];

const BASE_SYSTEM_PROMPT = `你是用户的心理陪伴者，请用温暖、克制、自然的中文回应。
核心原则：
- 先接住情绪，再回应问题
- 回复控制在 2 到 4 句话，避免说教
- 不要使用模板化安慰，不要过度承诺
- 不做医疗诊断，不提供危险建议
- 当用户明显处在高风险状态时，优先稳定情绪，不要空泛分析

高频场景：
- 工作压力：先承认辛苦，再帮助用户把问题拆小
- 情感困扰：先接住委屈，再温和回应
- 焦虑情绪：先帮用户放慢，再处理问题
- 自我怀疑：避免空泛鼓励，强调具体感受可以被看见

输出要求：
- 说人话，像真实陪伴，不像客服
- 不要反复强调“我理解你”
- 允许停顿感和留白感`;

const COMPANION_PROMPTS: Record<Exclude<CompanionType, null>, string> = {
  samoyed: `角色：小白，一只白色萨摩耶。
风格：
- 温柔、安静、耐心，先陪伴再推进
- 更适合在用户难过、疲惫、委屈时接住情绪
- 句子偏短，语气柔和，像坐在用户身边
- 少一点分析，多一点安定感
- 不要俏皮，不要跳脱`,
  cat: `角色：小橘，一只橘色金渐层。
风格：
- 轻快、机灵、自然，但不过度卖萌
- 适合在用户纠结、烦躁、想理清问题时轻轻推一步
- 可以适度帮助用户拆问题、理顺下一步
- 语气比小白更有动作感，但仍然温和
- 不要引导负面，不要刻意制造戏剧感`,
};

export function buildSystemPrompt(companion: CompanionType): string {
  if (!companion) {
    return BASE_SYSTEM_PROMPT;
  }

  return `${BASE_SYSTEM_PROMPT}\n\n${COMPANION_PROMPTS[companion]}`;
}

export function detectEmotion(message: string, history: ChatMessage[] = []): EmotionType {
  const recentText = [...history.slice(-4).map((item) => item.content), message].join('\n').toLowerCase();
  const order: EmotionType[] = ['sad', 'anxious', 'angry', 'happy', 'calm'];

  for (const emotion of order) {
    if (EMOTION_KEYWORDS[emotion].some((keyword) => recentText.includes(keyword))) {
      return emotion;
    }
  }

  return 'neutral';
}

export function detectIntent(message: string): IntentType {
  const text = message.trim();

  if (ADVICE_KEYWORDS.some((keyword) => text.includes(keyword)) || text.includes('?') || text.includes('？')) {
    return 'advice';
  }

  if (text.includes('很累') || text.includes('崩溃') || text.includes('撑不住') || text.includes('好难受')) {
    return 'comfort';
  }

  return 'venting';
}

export function containsCrisisSignal(message: string): boolean {
  return CRISIS_KEYWORDS.some((keyword) => message.includes(keyword));
}

function containsSoftRiskSignal(message: string): boolean {
  return SOFT_RISK_KEYWORDS.some((keyword) => message.includes(keyword));
}

export function assessRiskSignals(message: string, history: ChatMessage[] = []): RiskAssessment {
  const userHistory = history.filter((item) => item.role === 'user').slice(-6);
  const recentTexts = [...userHistory.map((item) => item.content), message];
  const directHits = recentTexts.reduce(
    (count, text) => count + CRISIS_KEYWORDS.filter((keyword) => text.includes(keyword)).length,
    0,
  );
  const softHits = recentTexts.reduce(
    (count, text) => count + SOFT_RISK_KEYWORDS.filter((keyword) => text.includes(keyword)).length,
    0,
  );
  const recentDistinctTurns = recentTexts.filter((text) => containsCrisisSignal(text) || containsSoftRiskSignal(text)).length;
  const currentDirectHit = containsCrisisSignal(message);

  let score = 0;
  const reasons: string[] = [];

  if (currentDirectHit) {
    score += 3;
    reasons.push('current_direct_keyword');
  }

  if (!currentDirectHit && containsSoftRiskSignal(message)) {
    score += 2;
    reasons.push('current_soft_keyword');
  }

  if (directHits >= 2) {
    score += 2;
    reasons.push('repeated_direct_signal');
  }

  if (softHits >= 2) {
    score += 1;
    reasons.push('repeated_soft_signal');
  }

  if (recentDistinctTurns >= 2) {
    score += 1;
    reasons.push('multi_turn_accumulation');
  }

  if (score >= 3) {
    return { detected: true, level: 'high', score, reasons };
  }

  if (score >= 2) {
    return { detected: true, level: 'elevated', score, reasons };
  }

  return { detected: false, level: 'none', score, reasons };
}

function buildCompanionPrefix(companion: CompanionType): string {
  if (companion === 'samoyed') {
    return '?????';
  }

  if (companion === 'cat') {
    return '???????????';
  }

  return '??????';
}

function buildClarifyQuestion(message: string): string {
  if (message.includes('辞职') || message.includes('离职') || message.includes('换工作')) {
    return '你更卡的是“想走”，还是“走了之后会不会后悔”这件事？';
  }

  if (message.includes('分手') || message.includes('复合') || message.includes('关系')) {
    return '你现在更难受的是这段关系本身，还是你不知道下一步该怎么做？';
  }

  if (message.includes('工作') || message.includes('领导') || message.includes('同事')) {
    return '这件事里，最让你顶不住的是人、事，还是你对自己的要求？';
  }

  return '如果只挑一件最卡你的点，现在最想先理清的是哪一块？';
}

function buildEmotionSupport(emotion: EmotionType, companion: CompanionType): string {
  const prefix = buildCompanionPrefix(companion);

  switch (emotion) {
    case 'sad':
      return `${prefix} ????????????????????????????????????`;
    case 'anxious':
      return `${prefix} ?????????????????????????????????????`;
    case 'angry':
      return `${prefix} ???????????????????????????????????????????`;
    case 'happy':
      return `${prefix} ???????????????????????????????????`;
    case 'calm':
      return `${prefix} ????????????????????????????????????`;
    default:
      return `${prefix} ???????????????????????????????`;
  }
}

function buildRiskReply(level: RiskLevel, companion: CompanionType): string {
  if (level === 'high') {
    return companion === 'cat'
      ? '你现在像是已经一个人扛得太久了。先别继续硬撑，先让身边一个能陪你的人靠近一点。'
      : '你现在这样撑着一定很难受。先不用急着把话说完整，先让一个可信任的人陪在你身边。';
  }

  return companion === 'cat'
    ? '你这会儿已经很绷了。我们先别往后推，先把自己放回一个有人陪、有地方落脚的状态。'
    : '我感觉到你已经有点撑不住了。现在最重要的不是把事情讲清楚，而是先别让自己一个人扛着。';
}

export function buildLocalSupportReply({ message, history = [], companion = null }: LocalReplyContext): string | null {
  const risk = assessRiskSignals(message, history);
  const emotion = detectEmotion(message, history);
  const intent = detectIntent(message);

  if (risk.detected) {
    return buildRiskReply(risk.level, companion);
  }

  if (intent === 'advice') {
    const prefix = companion === 'cat' ? '这件事可以慢一点理。' : '先别急着替自己下结论。';
    return `${prefix} ${buildClarifyQuestion(message)}`;
  }

  return buildEmotionSupport(emotion, companion);
}

function hasEnoughAdviceContext(message: string, history: ChatMessage[] = []): boolean {
  const text = message.trim();
  const userTurns = history.filter((item) => item.role === 'user');
  const combined = [...userTurns.slice(-2).map((item) => item.content), text].join(' ');

  if (combined.length >= 28) {
    return true;
  }

  const detailSignals = ['因为', '但是', '所以', '最近', '一直', '总是', '不知道', '后悔', '关系', '工作'];
  const hitCount = detailSignals.filter((signal) => combined.includes(signal)).length;

  return hitCount >= 2;
}

export function shouldPreferLocalReply(message: string, history: ChatMessage[] = []): boolean {
  const risk = assessRiskSignals(message, history);
  const intent = detectIntent(message);

  if (risk.detected) {
    return true;
  }

  if (intent === 'advice') {
    return !hasEnoughAdviceContext(message, history);
  }

  return false;
}

export function buildFallbackReply(message: string, history: ChatMessage[] = [], companion: CompanionType = null): string {
  return (
    buildLocalSupportReply({ message, history, companion }) ||
    '我在这里。你可以从现在最想说的那一句开始，我们慢慢来。'
  );
}

export function normalizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item): item is ChatMessage => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const role = (item as ChatMessage).role;
      const content = (item as ChatMessage).content;
      return (role === 'user' || role === 'assistant') && typeof content === 'string';
    })
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, MAX_HISTORY_MESSAGE_LENGTH),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-MAX_HISTORY_MESSAGES);
}
