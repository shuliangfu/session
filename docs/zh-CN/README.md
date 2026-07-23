# @dreamer/session

> [English](../../README.md) | 中文 (Chinese)

> 一个兼容 Deno、Bun、Node.js 22+ 的持久化 Session 会话管理库，提供统一的
> Session 管理接口，支持多种存储后端（Redis、MongoDB、文件）

---

## 🎯 功能

持久化 Session 会话管理库，提供统一的 Session
管理接口，支持多种存储后端，用于用户会话管理、状态保持等场景。

---

## ✨ 特性

- **持久化存储**：
  - Redis 存储（分布式 Session）
  - MongoDB 存储（数据库持久化）
  - 文件系统存储（本地持久化）
  - **不支持内存存储**（确保 Session 持久化）
- **自动过期管理**：
  - 自动清理过期 Session
  - TTL 支持（过期时间）
  - 定期清理机制
- **Cookie 集成**：
  - 通过 Cookie 中的 session ID 关联 Session
  - 自动设置和读取 Cookie
  - 支持自定义 Cookie 选项
- **中间件支持**：
  - 提供 Session 中间件，与 HTTP 库集成
  - 自动管理 Session 生命周期
  - 支持自动保存和手动保存
- **适配器模式**：
  - 统一的 Session 存储接口（SessionStore）
  - Redis 适配器（RedisSessionAdapter）
  - MongoDB 适配器（MongoDBSessionAdapter）
  - 文件适配器（FileSessionAdapter）
  - 运行时切换存储后端
- **服务容器集成**：
  - 支持 `@dreamer/service` 依赖注入
  - 管理多个 SessionManager 实例
  - 提供 `createSessionManager` 工厂函数

---

## 🎨 设计原则

__所有 @dreamer/_ 库都遵循以下原则_*：

- **主包（@dreamer/xxx）**：用于服务端（兼容 Deno、Bun、Node.js 22+ 运行时）
- **客户端子包（@dreamer/xxx/client）**：用于客户端（浏览器环境）

这样可以：

- 明确区分服务端和客户端代码
- 避免在客户端代码中引入服务端依赖
- 提供更好的类型安全和代码提示
- 支持更好的 tree-shaking

**注意**：@dreamer/session 是纯服务端库，不提供客户端子包。

---

## 🎯 使用场景

- **用户会话管理**：用户登录状态、用户信息存储
- **购物车管理**：电商网站的购物车数据
- **表单状态保持**：多步骤表单的状态保存
- **临时数据存储**：需要持久化的临时数据
- **分布式应用**：多实例应用的 Session 共享（使用 Redis 或 MongoDB）

---

## 📦 安装

### Deno

```bash
deno add jsr:@dreamer/session
```

### Bun

```bash
bunx jsr add @dreamer/session
```

### Node.js 22+

```bash
npx jsr add @dreamer/session
```

---

## 🌍 环境兼容性

| 环境         | 版本要求                             | 状态                                                              |
| ------------ | ------------------------------------ | ----------------------------------------------------------------- |
| **Deno**     | 2.9+                                 | ✅ 完全支持                                                       |
| **Bun**      | 1.3+                                 | ✅ 完全支持                                                       |
| **Node.js**  | 22+                                  | ✅ 完全支持                                                       |
| **服务端**   | -                                    | ✅ 支持（兼容 Deno、Bun、Node.js，支持 Redis、MongoDB、文件存储） |
| **客户端**   | -                                    | ❌ 不支持（纯服务端库）                                           |
| **依赖**     | `redis@^5.11.0`, `mongodb@^7.0.0`    | 📦 用于 Redis 和 MongoDB 适配器（按需懒加载）                     |
| **可选依赖** | `jsr:@dreamer/service@^1.1.0`        | 📦 用于服务容器集成（可选）                                       |

---

## 🚀 快速开始

### 使用 Redis 存储（推荐用于生产环境）

```typescript
import { RedisSessionAdapter, session } from "jsr:@dreamer/session";
import { Http } from "jsr:@dreamer/http";

const app = new Http();

const store = new RedisSessionAdapter({
  connection: {
    host: "127.0.0.1",
    port: 6379,
    password: "password", // 可选
  },
});

app.use(session({
  store,
  name: "sessionId",
  maxAge: 86400000, // 24 小时
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  },
}));

app.get("/login", async (ctx) => {
  ctx.session = {
    userId: 123,
    username: "alice",
    role: "admin",
  };
  return new Response("登录成功");
});

app.get("/profile", async (ctx) => {
  const userId = ctx.session?.userId;
  if (!userId) {
    return new Response("未登录", { status: 401 });
  }
  return new Response(`用户 ID: ${userId}`);
});

await app.listen({ port: 8000 });
```

### 使用 MongoDB 存储

```typescript
import { MongoDBSessionAdapter, session } from "jsr:@dreamer/session";
import { Http } from "jsr:@dreamer/http";

const app = new Http();
const store = new MongoDBSessionAdapter({
  connection: {
    host: "127.0.0.1",
    port: 27017,
    database: "myapp",
    username: "user", // 可选
    password: "password", // 可选
  },
  collectionName: "sessions", // 可选，默认：sessions
});

app.use(session({ store, maxAge: 86400000 }));
app.get("/login", async (ctx) => {
  ctx.session = { userId: 123 };
  return new Response("登录成功");
});
```

### 使用文件存储（适合单机应用）

```typescript
import { FileSessionAdapter, session } from "jsr:@dreamer/session";
import { Http } from "jsr:@dreamer/http";

const app = new Http();
const store = new FileSessionAdapter({
  sessionDir: "./sessions",
  prefix: "app", // 可选
});

app.use(session({ store, maxAge: 86400000 }));
app.get("/login", async (ctx) => {
  ctx.session = { userId: 123 };
  return new Response("登录成功");
});
```

### 手动管理 Session（不使用中间件）

```typescript
import { RedisSessionAdapter, SessionManager } from "jsr:@dreamer/session";

const store = new RedisSessionAdapter({
  connection: { host: "127.0.0.1", port: 6379 },
});
const manager = new SessionManager({ store });

const sessionId = await manager.create({ userId: 123, username: "alice" });
const data = await manager.get(sessionId);
await manager.update(sessionId, { userId: 456 });
await manager.delete(sessionId);
const exists = await manager.has(sessionId);
```

---

## 📚 API 文档

### SessionStore 接口

```typescript
interface SessionStore {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, data: SessionData, maxAge: number): Promise<void>;
  delete(sessionId: string): Promise<void>;
  has(sessionId: string): Promise<boolean>;
  clear(): Promise<void>; // 可选
}
```

### Session 中间件 `session(options)`

```typescript
interface SessionOptions {
  store: SessionStore; // 必须
  name?: string; // 默认 sessionId
  maxAge?: number; // 默认 86400000（24 小时）
  cookie?: CookieOptions;
  autoSave?: boolean; // 默认 true
  genId?: () => string;
}
```

### SessionManager 方法

| 方法                                           | 说明                               |
| ---------------------------------------------- | ---------------------------------- |
| `create(data)`                                 | 创建新的 Session，返回 session ID  |
| `get(sessionId)`                               | 获取 Session 数据                  |
| `update(sessionId, data)`                      | 更新 Session 数据                  |
| `delete(sessionId)`                            | 删除 Session                       |
| `has(sessionId)`                               | 检查 Session 是否存在              |
| `getName()` / `getCookieName()` / `getStore()` | 获取配置与存储                     |
| `static fromContainer(container, name?)`       | 从服务容器获取 SessionManager 实例 |

---

## 📊 测试报告

| 测试类别                      | 测试数 | 状态        |
| ----------------------------- | ------ | ----------- |
| FileSessionAdapter            | 4      | ✅ 通过     |
| SessionManager                | 4      | ✅ 通过     |
| Session 中间件                | 3      | ✅ 通过     |
| ServiceContainer 集成         | 7      | ✅ 通过     |
| createSessionManager 工厂函数 | 5      | ✅ 通过     |
| **总计**                      | **23** | ✅ **100%** |

> 三端（Deno / Bun / Node.js 22+）全部通过，详见
> [TEST_REPORT.md](./TEST_REPORT.md)。

---

## 📋 变更日志

完整变更见 [CHANGELOG.md](./CHANGELOG.md)。

**最新 (v1.1.0 - 2026-07-23)**：**新增** – Node.js 22+ 兼容。**变更** –
Redis/MongoDB 适配器改为在 `connect()` 内懒加载 npm 包；依赖升级
（`@dreamer/runtime-adapter` ^1.2.2 等）。详见
[CHANGELOG](./CHANGELOG.md)。

---

## 📝 注意事项

1. **持久化存储**：仅支持 Redis、MongoDB、文件，不支持内存存储。
2. **自动过期**：由 `maxAge` 配置。
3. **Cookie**：Session ID 通过 Cookie 传递，需 HTTP 库支持 Cookie。
4. **存储适配器**：必须提供。
5. **Session ID**：默认使用 `@dreamer/crypto` 生成。
6. **文件适配器**：会启动定期清理定时器，测试时需调用 `stopCleanup()`。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

## 📄 许可证

Apache License 2.0，详见 [LICENSE](../../LICENSE)。
