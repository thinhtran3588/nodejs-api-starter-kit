# Coding Conventions

本文档描述项目中使用的编码约定、文件组织与框架相关 patterns。

## 目录

1. [App Router（仅 Routing）](#app-router仅-routing)
2. [Data Fetching 与 Mutations](#data-fetching-与-mutations)
3. [文件与目录约定](#文件与目录约定)
   - [命名](#命名)
   - [Component Props](#component-props)
   - [目录结构](#目录结构)
4. [Forms 与 Validation](#forms-与-validation)
5. [国际化（next-intl）](#国际化next-intl)

## App Router（仅 Routing）

- **Routes**：`app/[locale]/{segment}/page.tsx` 负责 routing；这些文件从 `src/modules/{module}/presentation/pages/` 导入 page components。
- **/app 中无业务代码**：业务逻辑、components 与 services 均在 `/src`。`/app` 仅处理 Next.js routing。
- **Server vs Client**：Pages 与 components 可为 Server 或 Client Component。默认 Server Components；仅在使用 hooks、browser APIs 或 Zustand 时加 `"use client"`。
- **Client boundary**：尽量将 `"use client"` 放在 leaf components 或小包装上。

### Route 示例

```tsx
// app/[locale]/auth/sign-in/page.tsx
import { SignInPage } from "@/modules/auth/presentation/pages/sign-in/page";

export default function Page() {
  return <SignInPage />;
}
```

```tsx
// app/[locale]/layout.tsx
import { AppInitializer } from "@/application/components/app-initializer";
import { RootLayout } from "@/common/components/root-layout";
import { Toaster } from "@/common/components/toaster";

export default async function LocaleLayout({ children, params }: { ... }) {
  // ... next-intl 设置
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppInitializer />
      <RootLayout>{children}</RootLayout>
      <Toaster />
    </NextIntlClientProvider>
  );
}
```

路由组（如 `(main)`）使用共享 layout 提供带菜单与 auth slot 的 `MainLayout`；auth 路由使用 `AuthLayout`。这样保持 `/app` 最小化，代码集中在 `/src`，便于组织与测试。

## Data Fetching 与 Mutations

- **Server Components**：经 use cases（在 `src/modules/{module}/application/`，需要时从 container 解析）获取数据；在表示 use case 时不在 component 内直接 `fetch`。
- **Client Components**：变更（forms）时经 `useContainer()` 解析 use cases 并调用 `execute()`。Use cases 使用 services 或 API client 与后端或外部 API 通信。Client Components 也可在需要时经 use cases 获取数据。
- **Forms**：用 Zod（React Hook Form）validation 后，调用 application services 提交到后端。

## 文件与目录约定

### 命名

- **文件与目录均使用 kebab-case**（小写连字符），Next.js 保留路由文件（如 `page.tsx`、`layout.tsx`）除外。
- **Page modules** 放在独立目录：`src/modules/{module}/presentation/pages/{page}/page.tsx`。

### Component Props

- **有 props 的 component 必须定义 props type**，并在 component 签名中使用。
- **无 props 的 component** 不定义 props type、不包含 props 参数。

### 目录结构

| 路径 | 用途 |
|------|------|
| `app/` | 仅 routing（page.tsx、layout.tsx、error.tsx、not-found.tsx）；在 next-intl 的 `app/[locale]/` 下 |
| `src/application/` | 应用级设置：components、config、localization、register-container |
| `src/common/components/` | 共享组件（扁平：button、card、dialog、form、input、label 等） |
| `src/common/hooks/` | 共享 hooks（如 use-container） |
| `src/common/interfaces.ts` | 共享 interfaces（MenuItem、ResolvedMenuItem） |
| `src/common/pages/` | 共享页面组件（error-page、not-found-page） |
| `src/common/routing/` | next-intl routing（routing.ts、navigation.ts） |
| `src/common/utils/` | 工具（cn、container、base-use-case、menu、read-doc） |
| `src/modules/{module}/` | 功能模块，含 domain、application、infrastructure、presentation layers |
| `src/__tests__/` | 测试镜像 src 结构 |

## Forms 与 Validation

- 使用 React Hook Form + Zod（`zodResolver(schema)`）及 `src/common/components/` 的 Form components。
- Submit 时经 `useContainer()` 解析对应 use case 并调用 `execute()` 传入已校验表单数据。Use cases 委托给 services 或 API client。
- 处理 API 错误并视需要映射到表单状态（如经模块 utils 如 `map-auth-error`）。

### 示例

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/modules/auth/domain/schemas";
import { useContainer } from "@/common/hooks/use-container";

function SignInForm() {
  const { signInWithEmailUseCase } = useContainer();
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    await signInWithEmailUseCase.execute(data);
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* ... */}</form>;
}
```

## 国际化（next-intl）

- **基于语言的路由**：`app/[locale]/...`；中间件检测语言。
- **Server Components**：使用 `getTranslations('namespace')` 获取翻译。
- **Client Components**：使用 `useTranslations('namespace')` 获取翻译。
- **Navigation**：使用 next-intl 的 `Link` 与 `useRouter` 做语言感知导航。

### 翻译文件

翻译 JSON 文件存放在 `src/application/localization/`：
- `en.json` - 英语
- `vi.json` - 越南语
- `zh.json` - 中文

### 示例

```tsx
// Server Component
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("auth");
  return <h1>{t("signIn.title")}</h1>;
}

// Client Component
"use client";
import { useTranslations } from "next-intl";

export function SignInForm() {
  const t = useTranslations("auth");
  return <button>{t("signIn.submit")}</button>;
}
```
