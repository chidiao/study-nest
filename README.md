# study-nest

NestJS + Prisma + MySQL 后端项目。

技术栈：NestJS 12 · Prisma 7 · MySQL 8.4 (Docker) · JWT 鉴权 · class-validator

## 快速开始

```bash
pnpm install
cp .env.example .env    # 按需修改数据库连接与 JWT_SECRET
pnpm db:up              # 启动 MySQL 容器
pnpm prisma:generate    # 生成 Prisma Client
pnpm prisma:migrate     # 创建并应用迁移
pnpm start:dev          # 启动开发服务
```

## 常用命令

| 命令                             | 说明                        |
| -------------------------------- | --------------------------- |
| `pnpm start:dev`                 | 开发模式（热重载）          |
| `pnpm build` / `pnpm start:prod` | 构建 / 生产模式启动         |
| `pnpm lint` / `pnpm format`      | 代码检查 / 格式化           |
| `pnpm test` / `pnpm test:e2e`    | 单元测试 / 端到端测试       |
| `pnpm db:up` / `pnpm db:down`    | 启动 / 停止 MySQL 容器      |
| `pnpm prisma:generate`           | 生成 Prisma Client          |
| `pnpm prisma:migrate`            | 创建并应用开发迁移          |
| `pnpm prisma:deploy`             | 应用迁移（生产环境）        |
| `pnpm prisma:studio`             | 打开 Prisma Studio 浏览数据 |

## 目录结构

```
prisma/
  schema.prisma          # 数据模型
  migrations/            # 迁移文件
docker/
  mysql/init/            # MySQL 初始化脚本
src/
  auth/                  # 注册 / 登录 / JWT 鉴权
    dto/                 # 请求参数校验
    auth.service.ts      # 业务逻辑
    jwt.strategy.ts      # JWT 校验策略
  prisma/
    prisma.service.ts    # PrismaService（全局注入）
    prisma.module.ts
  config/
    env.ts               # 环境变量加载与校验
  generated/prisma/      # Prisma Client（自动生成，不入库）
docker-compose.yml       # MySQL 8.4
ecosystem.config.cjs     # PM2 部署配置
```

## 环境变量

`src/config/env.ts` 会按以下顺序加载 `.env` 文件（靠前者优先，且真实环境变量始终优先）：

1. `.env.${NODE_ENV}.local`
2. `.env.local`
3. `.env.${NODE_ENV}`
4. `.env`

文件按**项目根目录**解析（自动向上查找 `package.json`），因此从任意目录启动都能加载成功。

| 变量                                | 必填                  | 说明                                                           |
| ----------------------------------- | --------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`                      | 是                    | MySQL 连接串，如 `mysql://user:pass@localhost:3306/study-nest` |
| `JWT_SECRET`                        | 是                    | JWT 签名密钥，生产环境请使用强随机值                           |
| `JWT_EXPIRES_IN`                    | 否                    | Token 有效期，默认 `7d`                                        |
| `TENCENT_IM_SDK_APP_ID`             | 调用 IM 接口时必填    | 腾讯 IM 应用 SDKAppID                                          |
| `TENCENT_IM_SECRET_KEY`             | 调用 IM 接口时必填    | 腾讯 IM 密钥，仅配置在服务端                                   |
| `TENCENT_IM_USERSIG_EXPIRE_SECONDS` | 否                    | UserSig 有效期秒数，默认 `5184000`（60 天）                    |
| `MYSQL_ROOT_PASSWORD`               | 启动 MySQL 容器时必填 | MySQL root 密码                                                |
| `MYSQL_PASSWORD`                    | 是                    | 应用数据库用户密码                                             |
| `PORT`                              | 否                    | HTTP 端口，默认 `3000`                                         |

`GET /im/usersig` 需要 JWT 登录态，使用当前用户数据库 ID 作为腾讯 IM UserID，返回 SDKAppID、UserID、UserSig 和过期时间。腾讯配置未填写时接口返回 503；密钥不会返回给客户端。

缺少必填变量或 `JWT_SECRET` 少于 32 字节时，应用会在启动阶段直接报错。不要将真实 `.env` 提交到版本库；部署时通过密钥管理服务或进程环境注入这些值。

## API

| 方法 | 路径             | 说明                          | 鉴权 |
| ---- | ---------------- | ----------------------------- | ---- |
| POST | `/auth/register` | 注册，返回 `{ token, user }`  | 否   |
| POST | `/auth/login`    | 登录，返回 `{ token, user }`  | 否   |
| GET  | `/auth/profile`  | 当前用户信息，返回 `{ user }` | 是   |
| GET  | `/im/usersig`    | 获取当前用户的腾讯 IM UserSig | 是   |
| GET  | `/`              | 健康检查                      | 否   |

鉴权方式：`Authorization: Bearer <token>`

注册时未填写昵称会自动生成 `注册用户` + 8 位随机英文数字。密码使用 bcrypt 加密存储。

## 部署

```bash
pnpm install
pnpm build
cp .env.example .env && vim .env   # 或由进程管理器注入环境变量
pnpm prisma:deploy
pm2 start ecosystem.config.cjs
```

注意：

- `.env` 不入库，服务器上需手动创建或由 PM2 / systemd / 容器平台注入。
- 若 MySQL 与应用同机（MySQL 在 Docker 内），`DATABASE_URL` 用 `localhost`；若应用也在 Docker 内，需改用 compose 服务名（如 `mysql`）。
