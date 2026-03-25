# Vercel 部署清单

## 1. 适用范围

这个项目可以部署到 Vercel 作为真实可访问的网站。  
注意区分：

1. `GitHub Pages`：只适合项目展示页
2. `Vercel`：适合承载真实聊天能力

## 2. 部署前提

需要准备：

1. 一个 Vercel 账号
2. 已连接 GitHub
3. 仓库已经推送到 GitHub

## 3. 建议的环境变量

最推荐先用 MiniMax 部署：

```env
AI_PROVIDER=minimax
MINIMAX_API_KEY=你的真实 key
MINIMAX_BASE_URL=https://api.minimaxi.com/anthropic
MINIMAX_MODEL=MiniMax-M2.5
NEXT_PUBLIC_APP_URL=https://你的-vercel-域名.vercel.app
```

如果要接微信，再补：

```env
WECHAT_TOKEN=your_wechat_token
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_ENCODING_AES_KEY=your_encoding_aes_key
```

## 4. 当前项目对 Vercel 的适配说明

项目已经做了两项适配：

1. 在 Vercel 环境下，不再尝试写本地运行日志文件
2. `/ops` 页面在 Vercel 下会返回空快照，而不是依赖本地文件日志

这意味着：

1. 真实聊天可用
2. 线上运行不会因为文件系统只读而报错
3. 本地 `/ops` 仍可继续作为调试面板使用

## 5. 最短路径部署方式

### 方式 A：通过 GitHub 导入

1. 登录 Vercel
2. 点击 `Add New -> Project`
3. 选择 GitHub 仓库 `Kudo330/xinliyi`
4. Framework 选择 `Next.js`
5. Build Command 保持默认
6. Output Directory 保持默认
7. 填写环境变量
8. 点击 Deploy

### 方式 B：通过 Vercel CLI

在项目根目录执行：

```bash
npx vercel
```

首次会提示：

1. 登录 Vercel
2. 绑定项目
3. 选择当前目录

生产环境部署：

```bash
npx vercel --prod
```

## 6. 部署后检查项

部署完成后至少检查：

1. 首页是否正常打开
2. `/chat` 是否可进入
3. `/api/debug-ai-config` 是否显示正确 provider / model
4. 发送一条消息是否有真实回复
5. 没有出现 provider 认证错误

## 7. 域名

域名不是必须。

你可以先直接用：

1. `xxx.vercel.app`

如果后面要对外展示成正式产品，再绑定自定义域名即可。

## 8. 当前推荐方案

当前最实际的方案是：

1. GitHub Pages：做项目展示页
2. Vercel：做真实产品站

这样面试官既能看产品介绍，也能体验真实网站。
