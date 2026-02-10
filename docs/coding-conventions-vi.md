# Coding Conventions

Tài liệu này mô tả các coding conventions, tổ chức file và patterns theo framework dùng trong dự án.

## Mục lục

1. [App Router (Chỉ Routing)](#app-router-chỉ-routing)
2. [Data Fetching và Mutations](#data-fetching-và-mutations)
3. [Quy ước File và Folder](#quy-ước-file-và-folder)
   - [Đặt tên](#đặt-tên)
   - [Component Props](#component-props)
   - [Cấu trúc Folder](#cấu-trúc-folder)
4. [Forms và Validation](#forms-và-validation)
5. [Quốc tế hóa (next-intl)](#quốc-tế-hóa-next-intl)

## App Router (Chỉ Routing)

- **Routes**: `app/[locale]/{segment}/page.tsx` cho routing; các file này import page components từ `src/modules/{module}/presentation/pages/`.
- **Không code trong /app**: Toàn bộ logic nghiệp vụ, components và services nằm trong `/src`. Thư mục `/app` chỉ xử lý routing Next.js.
- **Server vs Client**: Pages và components có thể là Server hoặc Client Components. Mặc định Server Components; thêm `"use client"` chỉ khi cần hooks, browser APIs hoặc Zustand.
- **Client boundary**: Giữ `"use client"` càng thấp càng tốt (leaf components hoặc wrapper nhỏ).

### Ví dụ Route

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
  // ... thiết lập next-intl
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppInitializer />
      <RootLayout>{children}</RootLayout>
      <Toaster />
    </NextIntlClientProvider>
  );
}
```

Route groups (vd. `(main)`) dùng layout chung cung cấp `MainLayout` với menu và auth slot; route auth dùng `AuthLayout`. Cách này giữ `/app` tối thiểu và toàn bộ code trong `/src` để dễ tổ chức và testing.

## Data Fetching và Mutations

- **Server Components**: Lấy dữ liệu qua use cases (trong `src/modules/{module}/application/`, resolve từ container khi cần); không `fetch` trực tiếp trong component khi nó đại diện use case.
- **Client Components**: Với mutations (forms), resolve use cases qua `useContainer()` và gọi `execute()`. Use cases dùng services hoặc API client để giao tiếp với backend hoặc external API. Client Components cũng có thể lấy dữ liệu qua use cases khi cần.
- **Forms**: Validate với Zod (React Hook Form), rồi gọi application services để gửi dữ liệu tới backend.

## Quy ước File và Folder

### Đặt tên

- **Mọi file và folder dùng kebab-case** (chữ thường, nối bằng dấu gạch ngang), trừ file route dành riêng Next.js như `page.tsx` và `layout.tsx`.
- **Page modules** nằm trong folder riêng dưới `src/modules/{module}/presentation/pages/{page}/page.tsx`.

### Component Props

- **Mọi component có props phải định nghĩa props type** và dùng trong chữ ký component.
- **Component không có props không định nghĩa props type** và không có tham số props.

### Cấu trúc Folder

| Đường dẫn | Mục đích |
|-----------|----------|
| `app/` | Chỉ routing (page.tsx, layout.tsx, error.tsx, not-found.tsx); dưới `app/[locale]/` với next-intl |
| `src/application/` | Thiết lập cấp app: components, config, localization, register-container |
| `src/common/components/` | Components dùng chung (flat: button, card, dialog, form, input, label, v.v.) |
| `src/common/hooks/` | Hooks dùng chung (vd. use-container) |
| `src/common/interfaces.ts` | Interfaces dùng chung (MenuItem, ResolvedMenuItem) |
| `src/common/pages/` | Components trang dùng chung (error-page, not-found-page) |
| `src/common/routing/` | next-intl routing (routing.ts, navigation.ts) |
| `src/common/utils/` | Utilities (cn, container, base-use-case, menu, read-doc) |
| `src/modules/{module}/` | Module tính năng với domain, application, infrastructure, presentation layers |
| `src/__tests__/` | Tests phản chiếu cấu trúc src |

## Forms và Validation

- Dùng React Hook Form với Zod (`zodResolver(schema)`) và Form components từ `src/common/components/`.
- Khi submit form, resolve use case tương ứng qua `useContainer()` và gọi `execute()` với dữ liệu form đã validate. Use cases ủy thác cho services hoặc API client.
- Xử lý lỗi API và map vào form state khi cần (vd. qua module utils như `map-auth-error`).

### Ví dụ

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

## Quốc tế hóa (next-intl)

- **Routing theo locale**: `app/[locale]/...`; middleware phát hiện locale.
- **Server Components**: Dùng `getTranslations('namespace')` cho translations.
- **Client Components**: Dùng `useTranslations('namespace')` cho translations.
- **Navigation**: Dùng next-intl `Link` và `useRouter` cho điều hướng theo locale.

### Translation Files

File JSON translation lưu trong `src/application/localization/`:
- `en.json` - Tiếng Anh
- `vi.json` - Tiếng Việt
- `zh.json` - Tiếng Trung

### Ví dụ

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
