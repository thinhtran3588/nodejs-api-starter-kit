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

[English](README.md) | [Tiếng Việt](README-vi.md) | **中文**

生产就绪的 Node.js 入门套件，用于构建快速、可扩展的 REST 和 GraphQL API 服务器，采用 Clean Architecture、DDD 和 CQRS。

## 功能特性

- **Clean Architecture + DDD** — Domain、Application、Infrastructure、Adapters 四层，配合 Awilix DI
- **CQRS 模式** — 分离 command 和 query handler，优化读写操作
- **模块化结构** — 功能模块位于 `src/modules/`，支持自动发现
- **技术栈** — Fastify、TypeScript（strict）、PostgreSQL、Sequelize ORM、Mercurius（GraphQL）
- **认证与安全** — Firebase Admin SDK、JWT、输入清理、速率限制、CORS
- **测试** — Vitest，要求 100% 覆盖率（lines、functions、branches、statements）
- **领域事件** — 事件驱动架构，支持异步处理和乐观锁

## 快速开始

```bash
npm install
cp .env.example .env  # 编辑你的数据库配置
npm run migrate
npm run dev
```

API 运行于 `http://localhost:3000`。

## 脚本命令

| 命令                 | 说明                                     |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | 启动开发服务器（支持热重载）             |
| `npm run build`      | 将 TypeScript 编译为 JavaScript          |
| `npm run validate`   | 运行 lint、格式检查和带覆盖率的测试      |
| `npm run migrate`    | 运行数据库迁移                           |

## 文档

| 文档                                                 | 说明                                                  |
| ---------------------------------------------------- | ----------------------------------------------------- |
| [架构](docs/architecture-zh.md)                         | 层级结构、数据流、设计模式、Awilix 依赖注入           |
| [编码规范](docs/coding-conventions-zh.md)               | 文件命名、代码风格、验证顺序、自动发现                |
| [开发指南](docs/development-guide-zh.md)                | Git 工作流、添加功能、创建模块                        |
| [测试指南](docs/testing-guide-zh.md)                    | 测试组织、100% 覆盖率、最佳实践                       |
| [Firebase 集成](docs/firebase-integration-zh.md)        | Admin SDK 设置、令牌验证、用户管理                    |
| [部署](docs/deployment-zh.md)                           | Docker 构建、环境变量、生产环境清单                   |

## AI Agent 集成

本项目包含 AI 编码助手的配置以协助开发，支持 [Antigravity](https://github.com/google-deepmind/antigravity) 和 [Cursor](https://cursor.com/)。

### Antigravity

| 路径                                   | 用途                                      |
| -------------------------------------- | ----------------------------------------- |
| `.agent/workflows/branch-and-pr.md`    | 强制性 Git 工作流和验证流程               |
| `.agent/skills/project-rules/SKILL.md` | 项目约定和代码风格                        |
| `.agent/skills/`                       | 专业技能（reviewer、backend、arch）       |

### Cursor

| 路径                                       | 用途                                          |
| ------------------------------------------ | --------------------------------------------- |
| `.cursor/rules/general.mdc`                | 项目约定和代码风格                            |
| `.cursor/rules/branch-and-pr-workflow.mdc` | Git 工作流、验证和 PR 创建                    |
| `.cursor/skills/`                          | 专业 agent（code review、backend、arch）      |

如需与其他 AI 工具配合使用，请将规则复制到 agent 的配置位置并根据需要调整。

## 贡献

1. 从 `develop` 创建功能分支
2. 编写/更新测试以保持 100% 覆盖率
3. 提交前运行 `npm run validate`
4. 向 `develop` 发起 Pull Request

详细工作流参见[开发指南](docs/development-guide-zh.md)。

## 许可证

MIT
