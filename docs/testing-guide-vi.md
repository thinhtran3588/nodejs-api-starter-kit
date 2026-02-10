# Testing Guide

Tài liệu này mô tả cách tiếp cận testing phù hợp với Clean Architecture patterns định nghĩa trong [Architecture](./architecture-vi.md).

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Cấu hình Test](#cấu-hình-test)
3. [Tổ chức Test](#tổ-chức-test)
4. [Loại Test](#loại-test)
5. [Viết Tests](#viết-tests)
   - [Use Case Tests](#use-case-tests)
   - [Component Tests](#component-tests)
   - [Schema Tests](#schema-tests)
6. [Test Utilities](#test-utilities)
7. [Yêu cầu Coverage](#yêu-cầu-coverage)
8. [Chạy Tests](#chạy-tests)
9. [Best Practices](#best-practices)

## Tổng quan

Dự án dùng **Vitest** cho testing với **React Testing Library** cho UI tests.

### Nguyên tắc chính

1. **100% Coverage bắt buộc** - Mọi lines, functions, branches và statements phải được cover
2. **Test Behavior, không phải Implementation** - Tập trung vào kết quả thay vì chi tiết nội bộ
3. **Isolation First** - Mock external services và dependencies
4. **Phản chiếu cấu trúc Source** - Tests theo cùng cấu trúc folder với source code

## Cấu hình Test

Cấu hình trong `vitest.config.ts`:

- **Environment**: `jsdom` cho DOM APIs
- **Setup file**: `src/__tests__/test-utils/setup.ts`
- **Coverage thresholds**: 100% cho mọi metrics
- **Path aliases**: Khớp với `@/` → `src/`

## Tổ chức Test

Tests phản chiếu cấu trúc source dưới `src/__tests__/`:

```text
src/__tests__/
├── application/              # Tests cấp app
│   ├── components/           # AppInitializer tests
│   └── register-container.test.ts
├── common/
│   ├── components/           # Tests shared component
│   ├── hooks/                # Tests shared hook
│   └── utils/                # Tests utility
├── modules/
│   └── {module}/
│       ├── domain/           # Tests schema
│       ├── application/      # Tests use case
│       └── presentation/
│           ├── components/   # Tests component
│           ├── hooks/        # Tests hook
│           └── pages/        # Tests page
└── test-utils/
    ├── setup.ts              # Setup toàn cục
    └── ...                   # Test helpers
```

### Quy ước đặt tên File

- Tests kết thúc bằng `.test.ts` hoặc `.test.tsx`
- Khớp tên file source: `sign-in-form.tsx` → `sign-in-form.test.tsx`

## Loại Test

### Unit Tests

**Mục đích**: Test logic thuần không cần render React.

**Targets**:
- Domain schemas (`domain/schemas.ts`)
- Use cases (`application/*-use-case.ts`)
- Utilities (`utils/`)

### Component Tests

**Mục đích**: Validate UI behavior và user interactions.

**Targets**:
- Page components (`presentation/pages/`)
- Shared components (`presentation/components/`, `common/components/`)
- Forms với validation

### Integration Tests

**Mục đích**: Validate flows qua nhiều layers.

**Targets**:
- Phối hợp Component + use case
- Error handling flows
- Flows riêng module (auth, books, settings)

## Viết Tests

### Use Case Tests

```typescript
// src/__tests__/modules/auth/application/sign-in-with-email-use-case.test.ts
import { SignInWithEmailUseCase } from "@/modules/auth/application/sign-in-with-email-use-case";
import type { AuthenticationService } from "@/modules/auth/domain/interfaces";

describe("SignInWithEmailUseCase", () => {
  let useCase: SignInWithEmailUseCase;
  let mockAuthService: AuthenticationService;

  beforeEach(() => {
    mockAuthService = {
      signInWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUpWithEmail: vi.fn(),
      signOut: vi.fn(),
      sendPasswordReset: vi.fn(),
      subscribeToAuthState: vi.fn(),
      updateDisplayName: vi.fn(),
      updatePassword: vi.fn(),
    };
    useCase = new SignInWithEmailUseCase(mockAuthService);
  });

  it("gọi auth service với credentials", async () => {
    await useCase.execute({ email: "test@example.com", password: "password123" });
    
    expect(mockAuthService.signInWithEmail).toHaveBeenCalledWith(
      "test@example.com",
      "password123"
    );
  });
});
```

### Component Tests

```typescript
// src/__tests__/modules/auth/presentation/pages/sign-in/components/sign-in-form.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "@/modules/auth/presentation/pages/sign-in/components/sign-in-form";

describe("SignInForm", () => {
  it("submit valid credentials", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "ValidPass123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });

  it("hiển thị validation error cho invalid email", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText(/email/i), "invalid");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });
});
```

### Schema Tests

```typescript
// src/__tests__/modules/auth/domain/schemas.test.ts
import { loginSchema } from "@/modules/auth/domain/schemas";

describe("loginSchema", () => {
  it("validates đúng input", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    
    expect(result.success).toBe(true);
  });

  it("reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid",
      password: "password123",
    });
    
    expect(result.success).toBe(false);
  });
});
```

## Test Utilities

Shared helpers trong `src/__tests__/test-utils/`:

| File | Mục đích |
|------|----------|
| `setup.ts` | Setup toàn cục (jest-dom, mocks, environment) |
| `render.tsx` | Custom render với providers (nếu cần) |
| `fixtures.ts` | Shared test data |

### Ví dụ Setup

```typescript
// src/__tests__/test-utils/setup.ts
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock browser APIs
Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
```

## Yêu cầu Coverage

**100% coverage là bắt buộc** cho:

| Metric | Threshold |
|--------|-----------|
| Lines | 100% |
| Functions | 100% |
| Branches | 100% |
| Statements | 100% |

### Branch Coverage

Mọi conditional phải được test:
- Ternary operators (`? :`)
- Logical operators (`&&`, `||`)
- Optional chaining (`?.`)
- Nullish coalescing (`??`)

### Coverage Exclusions

Chỉ bỏ qua test cho:
- Pure type definitions
- Configuration files
- Test utilities

## Chạy Tests

```bash
npm test              # Chạy tất cả tests
npm run test:watch    # Watch mode
npm run test:coverage # Với coverage report
npm run validate      # Full validation (bao gồm tests)
```

## Best Practices

1. **Dùng pattern Arrange-Act-Assert (AAA)**
   ```typescript
   it("làm gì đó", () => {
     // Arrange
     const input = { ... };
     
     // Act
     const result = doSomething(input);
     
     // Assert
     expect(result).toBe(expected);
   });
   ```

2. **Ưu tiên queries theo role/label** thay vì `data-testid`
   ```typescript
   // Tốt
   screen.getByRole("button", { name: /submit/i });
   screen.getByLabelText(/email/i);
   
   // Tránh
   screen.getByTestId("submit-button");
   ```

3. **Mock tại boundary** - Mock services/repositories, không mock use cases
   ```typescript
   // Tốt - mock service interface
   const mockService: AuthenticationService = { ... };
   
   // Tránh - mock internal implementation
   vi.mock("firebase/auth");
   ```

4. **Test error cases** - Cover validation errors, API failures, edge cases

5. **Giữ tests nhanh** - Mock external calls, tránh render không cần thiết

6. **Một assertion focus mỗi test** - Nhiều assertions được nếu test một behavior
