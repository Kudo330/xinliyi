# 心理易

一个面向轻情绪支持场景的 AI 心理陪伴 Web 应用，包含：

1. Web 聊天页 `/chat`
2. 微信消息接入 `/api/wechat`
3. 运行面板 `/ops`
4. 调试配置接口 `/api/debug-ai-config`

## 当前状态

1. `npm run build` 通过
2. `npm run lint` 通过
3. 首页、聊天页、运行面板可访问
4. `/api/chat` 与 `/api/wechat` 共用同一套 AI 配置与基础风控逻辑

## 技术栈

1. Next.js 14
2. React 18
3. TypeScript
4. Tailwind CSS

## 本地运行

1. 安装依赖
```bash
npm install
```

2. 复制环境变量
```bash
copy .env.example .env.local
```

3. 填写 `.env.local`

OpenRouter 示例：
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openai/gpt-4o-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

MiniMax 示例：
```env
AI_PROVIDER=minimax
MINIMAX_API_KEY=your-key
MINIMAX_BASE_URL=https://api.minimaxi.com/anthropic
MINIMAX_MODEL=MiniMax-M2.5
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. 启动本地应用
```bash
npm run app:start
```

5. 查看状态
```bash
npm run app:status
```

6. 停止应用
```bash
npm run app:stop
```

默认访问：

1. [http://127.0.0.1:3000](http://127.0.0.1:3000)
2. [http://127.0.0.1:3000/chat](http://127.0.0.1:3000/chat)
3. [http://127.0.0.1:3000/ops](http://127.0.0.1:3000/ops)
4. [http://127.0.0.1:3000/api/debug-ai-config](http://127.0.0.1:3000/api/debug-ai-config)

## 环境变量说明

推荐变量：

1. `AI_PROVIDER`
2. `OPENROUTER_API_KEY`
3. `OPENROUTER_BASE_URL`
4. `OPENROUTER_MODEL`
5. `MINIMAX_API_KEY`
6. `MINIMAX_BASE_URL`
7. `MINIMAX_MODEL`
8. `NEXT_PUBLIC_APP_URL`
9. `WECHAT_TOKEN`
10. `WECHAT_APP_ID`
11. `WECHAT_APP_SECRET`
12. `WECHAT_ENCODING_AES_KEY`

兼容旧变量：

1. `ANTHROPIC_API_KEY`
2. `ANTHROPIC_BASE_URL`
3. `AI_MODEL`

## 调试与监控

1. `/api/debug-ai-config`
   - 查看当前运行进程实际生效的 provider、baseUrl、model
2. `/ops`
   - 查看发送率、继续率、fallback 触发率、风险命中率
3. 运行日志
   - `data/runtime-events.jsonl`

## 项目结构

```text
src/
  app/
    api/chat/route.ts
    api/wechat/route.ts
    api/analytics/route.ts
    api/debug-ai-config/route.ts
    chat/page.tsx
    ops/page.tsx
    page.tsx
  lib/
    ai-client.ts
    mental-support.ts
    observability.ts
    runtime-dashboard.ts
scripts/
  start-app.ps1
  stop-app.ps1
  status-app.ps1
docs/
  benchmark.md
  rubrics.md
  上线检查清单.md
```

## 部署

### Vercel

1. 导入仓库
2. 在 Project Settings -> Environment Variables 中配置环境变量
3. 确认 `AI_PROVIDER` 与对应 provider 的 key/baseUrl/model 已配置
4. 部署后访问 `/api/debug-ai-config` 检查生效配置

### 自托管

```bash
npm install
npm run build
npm run start
```

## 风险边界

这是一个心理陪伴产品，不提供医疗诊断或治疗。

上线前至少确认：

1. 页面文案与边界说明准确
2. 隐私政策与服务条款已补齐
3. 日志中不泄露密钥
4. 关键回复经过人工抽检
