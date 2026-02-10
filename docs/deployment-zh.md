# 部署

本指南介绍如何将 Next.js Starter Kit 部署到生产环境，使用 **Firebase** 提供后端服务，**Cloudflare Pages** 托管静态网站，并通过 **GitHub Actions** 实现 CI/CD 自动化。

## 目录

1. [概述](#概述)
2. [Firebase 设置](#firebase-设置)
3. [Cloudflare Pages 设置](#cloudflare-pages-设置)
4. [GitHub Actions CI/CD](#github-actions-cicd)
5. [环境变量](#环境变量)

## 概述

部署流程由三部分组成：

| 组件 | 用途 |
|-----------|---------|
| **Firebase** | 认证、Firestore 数据库和安全规则 |
| **Cloudflare Pages** | 全球 CDN 静态站点托管 |
| **GitHub Actions** | Push 时自动构建、测试和部署 |

```
开发者 → Push 到 GitHub → GitHub Actions → 构建 → 部署到 Cloudflare Pages
```

## Firebase 设置

### 1. 创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击 **Add project** 并按照向导操作
3. 如需使用 Analytics 模块，可启用 **Google Analytics**

### 2. 启用 Authentication

1. 导航至 **Authentication** → **Sign-in method**
2. 启用所需的 provider：
   - **Email/Password** — 邮箱登录/注册必需
   - **Google** — "使用 Google 继续"功能必需
3. 在 **Authorized domains** 中添加生产域名（例如：`yourdomain.com`）

### 3. 创建 Firestore 数据库

1. 导航至 **Firestore Database** → **Create database**
2. 选择靠近用户的区域
3. 以 **production mode** 启动（规则将单独部署）

### 4. 获取 Firebase 客户端配置

1. 导航至 **Project settings** → **General**
2. 在 **Your apps** 下，点击 **Web** 图标（`</>`）注册 Web 应用
3. 复制 Firebase 配置对象为 JSON 字符串：

```json
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "...",
  "measurementId": "..."
}
```

4. 整个 JSON 对象存储为单个环境变量 `NEXT_PUBLIC_FIREBASE_CONFIG`（参见 [环境变量](#环境变量)）

### 5. 部署 Firestore 安全规则

Firestore 安全规则位于项目根目录的 `firestore.rules` 文件中。通过 [Firebase Console](https://console.firebase.google.com/) 手动部署：

1. 导航至 **Firestore Database** → **Rules**
2. 将 `firestore.rules` 的内容复制到编辑器中
3. 点击 **Publish**

> **注意**：安全规则很少变更，因此通过控制台手动部署即可。

## Cloudflare Pages 设置

[Cloudflare Pages](https://pages.cloudflare.com/) 托管静态导出的 Next.js 站点，提供全球 CDN、自动 HTTPS 和快速部署。

### 1. 创建 Cloudflare 账号

1. 在 [cloudflare.com](https://www.cloudflare.com/) 注册
2. 在控制面板中导航至 **Workers & Pages**

### 2. 创建 Pages 项目

1. 点击 **Create application** → **Pages** → **Connect to Git**
2. 选择你的 GitHub 仓库
3. 配置构建设置：

| 设置 | 值 |
|---------|-------|
| **Framework preset** | `Next.js (Static Export)` |
| **Build command** | `npm run build` |
| **Build output directory** | `out` |

> **注意**：如果 Next.js 应用在 `next.config.ts` 中使用 `output: "export"`，输出目录为 `out`。如果使用默认服务器模式配合 `@cloudflare/next-on-pages`，请参阅 Cloudflare 的 [Next.js on Pages 指南](https://developers.cloudflare.com/pages/framework-guides/nextjs/)。

### 3. 自定义域名（可选）

1. 在 Pages 项目中前往 **Custom domains**
2. 添加你的域名（例如：`yourdomain.com`）
3. 按照 DNS 配置说明操作

## GitHub Actions CI/CD

GitHub Actions 在每次 push 时自动执行构建、测试和部署。项目包含 `main` 和 `develop` 分支的 CI 工作流。

### 工作流概述

| 工作流 | 触发条件 | 用途 |
|----------|---------|---------|
| `ci-main.yml` | Push 到 `main` | Lint、测试、构建 — 生产流水线 |
| `ci-develop.yml` | Push 到 `develop` | Lint、测试、构建 — 开发流水线 |
| `ci-pull-requests.yml` | Pull requests | Lint、测试 — PR 验证 |

### 所需 GitHub Secrets

在仓库的 **Settings** → **Secrets and variables** → **Actions** 中添加以下 secrets：

| Secret | 说明 |
|--------|-------------|
| `NEXT_PUBLIC_FIREBASE_CONFIG` | Firebase web config JSON（参见 [Firebase 设置](#4-获取-firebase-客户端配置)） |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token（用于 Pages 部署） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

> **注意**：你**不需要**在 Cloudflare Pages 控制面板中添加环境变量。`NEXT_PUBLIC_FIREBASE_CONFIG` secret 在 GitHub Actions 构建步骤中注入，因此值在构建时嵌入到静态站点中。

### 部署步骤示例

从 GitHub Actions 部署到 Cloudflare Pages，在工作流中添加部署步骤：

```yaml
- name: Deploy to Cloudflare Pages
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: pages deploy out --project-name=your-project-name
```

## 环境变量

Firebase 配置通过单个环境变量提供，包含完整的 web config JSON 字符串。

| 变量 | 说明 | 示例 |
|----------|-------------|---------|
| `NEXT_PUBLIC_FIREBASE_CONFIG` | Firebase web config JSON | `{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"...","measurementId":"..."}` |

该变量以 `NEXT_PUBLIC_` 为前缀，因此在构建时嵌入到静态站点中。

### 本地开发

本地开发时，复制 `.env.development` 并填入你的值：

```bash
cp .env.development .env.local
```

编辑 `.env.local` 填入你的 Firebase config JSON。此文件已被 git-ignore，可安全存放本地密钥。

### 生产环境

生产构建时，将 `NEXT_PUBLIC_FIREBASE_CONFIG` 设置为 **GitHub Actions secret**。该值在构建时注入并嵌入到静态输出中——无需在 Cloudflare Pages 中进行额外配置。
