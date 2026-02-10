# Node.js API Starter Kit

[![CI - Main](https://github.com/thinhtran3588/nodejs-api-starter-kit/actions/workflows/ci-main.yml/badge.svg?branch=main)](https://github.com/thinhtran3588/nodejs-api-starter-kit/actions/workflows/ci-main.yml)
[![codecov - Main](https://codecov.io/github/thinhtran3588/nodejs-api-starter-kit/graph/badge.svg?token=b8InPphzTT)](https://codecov.io/github/thinhtran3588/nodejs-api-starter-kit)

[![CI - Develop](https://github.com/thinhtran3588/nodejs-api-starter-kit/actions/workflows/ci-develop.yml/badge.svg?branch=develop)](https://github.com/thinhtran3588/nodejs-api-starter-kit/actions/workflows/ci-develop.yml)
[![codecov - Develop](https://codecov.io/github/thinhtran3588/nodejs-api-starter-kit/branch/develop/graph/badge.svg?token=b8InPphzTT)](https://codecov.io/github/thinhtran3588/nodejs-api-starter-kit)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat&logo=fastify&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![GraphQL](https://img.shields.io/badge/GraphQL-E10098?style=flat&logo=graphql&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=flat&logo=firebase&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)

[English](README.md) | **Tiếng Việt** | [中文](README-zh.md)

Bộ khởi tạo Node.js sẵn sàng production để xây dựng REST và GraphQL API server nhanh, có khả năng mở rộng với Clean Architecture, DDD và CQRS.

## Tính năng

- **Clean Architecture + DDD** — Các layer Domain, Application, Infrastructure, Adapters với Awilix DI
- **CQRS Pattern** — Tách biệt command và query handler để tối ưu đọc và ghi
- **Cấu trúc Module** — Module tính năng trong `src/modules/` với tự động phát hiện
- **Tech Stack** — Fastify, TypeScript (strict), PostgreSQL, Sequelize ORM, Mercurius (GraphQL)
- **Auth & Bảo mật** — Firebase Admin SDK, JWT, sanitize đầu vào, rate limiting, CORS
- **Testing** — Vitest với yêu cầu 100% coverage (lines, functions, branches, statements)
- **Domain Events** — Kiến trúc hướng sự kiện với xử lý bất đồng bộ và optimistic locking

## Bắt đầu nhanh

```bash
npm install
cp .env.example .env  # Chỉnh sửa cấu hình database của bạn
npm run migrate
npm run dev
```

API chạy tại `http://localhost:3000`.

## Scripts

| Lệnh                | Mô tả                                           |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Khởi động server phát triển với hot reload       |
| `npm run build`      | Build TypeScript sang JavaScript                 |
| `npm run validate`   | Chạy lint, kiểm tra format và tests với coverage |
| `npm run migrate`    | Chạy database migrations                         |

## Tài liệu

| Tài liệu                                            | Mô tả                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| [Kiến trúc](docs/architecture-vi.md)                    | Các layer, luồng dữ liệu, design patterns, DI với Awilix  |
| [Quy ước Coding](docs/coding-conventions-vi.md)         | Đặt tên file, code style, thứ tự validation, auto discover |
| [Hướng dẫn Phát triển](docs/development-guide-vi.md)    | Git workflow, thêm tính năng, tạo modules                  |
| [Hướng dẫn Testing](docs/testing-guide-vi.md)           | Tổ chức test, 100% coverage, best practices                |
| [Tích hợp Firebase](docs/firebase-integration-vi.md)    | Cài đặt Admin SDK, xác thực token, quản lý người dùng     |
| [Triển khai](docs/deployment-vi.md)                     | Docker builds, biến môi trường, checklist production       |

## Tích hợp AI Agent

Dự án này bao gồm cấu hình cho các trợ lý AI coding, hỗ trợ cả [Antigravity](https://github.com/google-deepmind/antigravity) và [Cursor](https://cursor.com/).

### Antigravity

| Đường dẫn                              | Mục đích                                          |
| -------------------------------------- | ------------------------------------------------- |
| `.agent/workflows/branch-and-pr.md`    | Quy trình Git bắt buộc và validation              |
| `.agent/skills/project-rules/SKILL.md` | Quy ước dự án và code style                       |
| `.agent/skills/`                       | Các kỹ năng chuyên biệt (reviewer, backend, arch) |

### Cursor

| Đường dẫn                                  | Mục đích                                           |
| ------------------------------------------ | -------------------------------------------------- |
| `.cursor/rules/general.mdc`                | Quy tắc dự án và conventions                       |
| `.cursor/rules/branch-and-pr-workflow.mdc` | Git workflow, validation và tạo PR                 |
| `.cursor/skills/`                          | Các agent chuyên biệt (code review, backend, arch) |

Để sử dụng với các công cụ AI khác, copy rules sang vị trí cấu hình của agent và điều chỉnh cho phù hợp.

## Đóng góp

1. Tạo feature branch từ `develop`
2. Viết/cập nhật tests để duy trì 100% coverage
3. Chạy `npm run validate` trước khi commit
4. Mở Pull Request nhắm vào `develop`

Xem [Hướng dẫn Phát triển](docs/development-guide-vi.md) để biết workflow chi tiết.

## Giấy phép

MIT
