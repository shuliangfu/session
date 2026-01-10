# @dreamer/session

> 一个兼容 Deno 和 Bun 的持久化 Session 会话管理库，提供统一的 Session 管理接口，支持多种存储后端（Redis、MongoDB、文件）

[![JSR](https://jsr.io/badges/@dreamer/session)](https://jsr.io/@dreamer/session)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 功能

持久化 Session 会话管理库，提供统一的 Session 管理接口，支持多种存储后端，用于用户会话管理、状态保持等场景。

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

---

## 🎨 设计原则

**所有 @dreamer/* 库都遵循以下原则**：

- **主包（@dreamer/xxx）**：用于服务端（兼容 Deno 和 Bun 运行时）
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

---

## 🌍 环境兼容性

| 环境 | 版本要求 | 状态 |
|------|---------|------|
| **Deno** | 2.5+ | ✅ 完全支持 |
| **Bun** | 1.0+ | ✅ 完全支持 |
| **服务端** | - | ✅ 支持（兼容 Deno 和 Bun 运行时，支持 Redis、MongoDB、文件存储） |
| **客户端** | - | ❌ 不支持（纯服务端库） |
| **依赖** | `redis@^5.10.0`, `mongodb@^6.10.0` | 📦 用于 Redis 和 MongoDB 适配器（可选） |

---

## 🚀 快速开始

### 使用 Redis 存储（推荐用于生产环境）

```typescript
import { session, RedisSessionAdapter } from "jsr:@dreamer/session";
import { Http } from "jsr:@dreamer/http";

const app = new Http();

// 创建 Redis 存储适配器
const store = new RedisSessionAdapter({
  connection: {
    host: "127.0.0.1",
    port: 6379,
    password: "password", // 可选
  },
});

// 使用 Session 中间件
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

// 在路由中使用 Session
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
import { session, MongoDBSessionAdapter } from "jsr:@dreamer/session";
import { Http } from "jsr:@dreamer/http";

const app = new Http();

// 创建 MongoDB 存储适配器
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

app.use(session({
  store,
  maxAge: 86400000, // 24 小时
}));

// 使用方式与 Redis 相同
app.get("/login", async (ctx) => {
  ctx.session = { userId: 123 };
  return new Response("登录成功");
});
```

### 使用文件存储（适合单机应用）

```typescript
import { session, FileSessionAdapter } from "jsr:@dreamer/session";
import { Http } from "jsr:@dreamer/http";

const app = new Http();

// 创建文件存储适配器
const store = new FileSessionAdapter({
  sessionDir: "./sessions", // Session 存储目录
  prefix: "app", // 可选，文件前缀
});

app.use(session({
  store,
  maxAge: 86400000, // 24 小时
}));

// 使用方式与其他适配器相同
app.get("/login", async (ctx) => {
  ctx.session = { userId: 123 };
  return new Response("登录成功");
});
```

### 使用自定义客户端实例

```typescript
import { session, RedisSessionAdapter } from "jsr:@dreamer/session";
import { createClient } from "redis";

// 使用已存在的 Redis 客户端
const redisClient = createClient({
  url: "redis://127.0.0.1:6379",
});
await redisClient.connect();

const store = new RedisSessionAdapter({
  client: redisClient,
  keyPrefix: "myapp:session",
});

app.use(session({ store }));
```

### 手动管理 Session（不使用中间件）

```typescript
import { SessionManager, RedisSessionAdapter } from "jsr:@dreamer/session";

const store = new RedisSessionAdapter({
  connection: { host: "127.0.0.1", port: 6379 },
});

const manager = new SessionManager({ store });

// 创建 Session
const sessionId = await manager.create({
  userId: 123,
  username: "alice",
});

// 获取 Session
const data = await manager.get(sessionId);
console.log(data); // { userId: 123, username: "alice" }

// 更新 Session
await manager.update(sessionId, { userId: 456 });

// 删除 Session
await manager.delete(sessionId);

// 检查 Session 是否存在
const exists = await manager.has(sessionId);
```

---

## 📚 API 文档

### Session 存储适配器接口

所有 Session 存储适配器都实现统一的接口：

```typescript
interface SessionStore {
  // 获取 Session 数据
  get(sessionId: string): Promise<SessionData | null>;

  // 设置 Session 数据
  set(sessionId: string, data: SessionData, maxAge: number): Promise<void>;

  // 删除 Session
  delete(sessionId: string): Promise<void>;

  // 检查 Session 是否存在
  has(sessionId: string): Promise<boolean>;

  // 清空所有 Session（可选，某些适配器可能不支持）
  clear(): Promise<void>;
}
```

### RedisSessionAdapter

基于 Redis 的 Session 存储适配器。

**配置选项**：
```typescript
interface RedisSessionAdapterOptions {
  connection?: RedisConnectionConfig;  // Redis 连接配置
  client?: RedisClient;                // Redis 客户端实例
  keyPrefix?: string;                  // 键前缀（默认：session）
}

interface RedisConnectionConfig {
  url?: string;                        // Redis 连接 URL
  host?: string;                       // Redis 主机（默认：127.0.0.1）
  port?: number;                       // Redis 端口（默认：6379）
  password?: string;                   // Redis 密码
  db?: number;                         // Redis 数据库编号（默认：0）
  socket?: {
    keepAlive?: boolean;               // 是否启用 keepAlive
    connectTimeout?: number;           // 连接超时时间（毫秒）
  };
}
```

**示例**：
```typescript
const store = new RedisSessionAdapter({
  connection: {
    host: "127.0.0.1",
    port: 6379,
    password: "password",
  },
  keyPrefix: "myapp:session",
});
```

### MongoDBSessionAdapter

基于 MongoDB 的 Session 存储适配器。

**配置选项**：
```typescript
interface MongoDBSessionAdapterOptions {
  connection?: MongoDBConnectionConfig;  // MongoDB 连接配置
  client?: MongoDBClient;                // MongoDB 客户端实例
  database?: string;                     // 数据库名称（如果只提供 client，必须提供）
  collectionName?: string;               // 集合名称（默认：sessions）
}

interface MongoDBConnectionConfig {
  url?: string;                          // MongoDB 连接 URL
  host?: string;                         // MongoDB 主机（默认：127.0.0.1）
  port?: number;                         // MongoDB 端口（默认：27017）
  database: string;                      // 数据库名称（必须）
  username?: string;                     // 用户名
  password?: string;                     // 密码
  authSource?: string;                   // 认证数据库
}
```

**示例**：
```typescript
const store = new MongoDBSessionAdapter({
  connection: {
    host: "127.0.0.1",
    port: 27017,
    database: "myapp",
  },
  collectionName: "sessions",
});
```

### FileSessionAdapter

基于文件系统的 Session 存储适配器。

**配置选项**：
```typescript
interface FileSessionAdapterOptions {
  sessionDir?: string;  // Session 存储目录（默认：./sessions）
  prefix?: string;      // 文件前缀（可选）
}
```

**示例**：
```typescript
const store = new FileSessionAdapter({
  sessionDir: "./sessions",
  prefix: "app",
});
```

### Session 中间件

#### `session(options: SessionOptions)`

创建 Session 中间件，用于与 HTTP 库集成。

**配置选项**：
```typescript
interface SessionOptions {
  store: SessionStore;                  // Session 存储适配器（必须）
  name?: string;                        // Cookie 名称（默认：sessionId）
  maxAge?: number;                      // Session 过期时间（毫秒，默认：86400000，24 小时）
  cookie?: CookieOptions;               // Cookie 选项
  autoSave?: boolean;                   // 是否自动保存 Session（默认：true）
  genId?: () => string;                 // Session ID 生成函数（可选）
}

interface CookieOptions {
  maxAge?: number;                      // 过期时间（毫秒）
  expires?: Date;                       // 过期日期
  domain?: string;                      // 域名
  path?: string;                        // 路径（默认：/）
  secure?: boolean;                     // 是否只在 HTTPS 下发送
  httpOnly?: boolean;                   // 是否禁止 JavaScript 访问
  sameSite?: "strict" | "lax" | "none"; // SameSite 策略
}
```

**示例**：
```typescript
app.use(session({
  store: new RedisSessionAdapter({ connection: { host: "127.0.0.1" } }),
  name: "sessionId",
  maxAge: 86400000,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  },
  autoSave: true,
}));
```

### SessionManager

手动管理 Session 的类，不依赖 HTTP 中间件。

**方法**：
- `create(data: SessionData): Promise<string>`: 创建新的 Session，返回 session ID
- `get(sessionId: string): Promise<SessionData | null>`: 获取 Session 数据
- `update(sessionId: string, data: SessionData): Promise<void>`: 更新 Session 数据
- `delete(sessionId: string): Promise<void>`: 删除 Session
- `has(sessionId: string): Promise<boolean>`: 检查 Session 是否存在

**示例**：
```typescript
const manager = new SessionManager({
  store: new RedisSessionAdapter({ connection: { host: "127.0.0.1" } }),
  maxAge: 86400000,
});

// 创建 Session
const sessionId = await manager.create({ userId: 123 });

// 获取 Session
const data = await manager.get(sessionId);

// 更新 Session
await manager.update(sessionId, { userId: 456 });

// 删除 Session
await manager.delete(sessionId);
```

---

## ⚡ 性能优化

- **持久化存储**：所有 Session 数据持久化存储，确保数据不丢失
- **自动过期管理**：自动清理过期 Session，避免存储空间浪费
- **定期清理**：文件适配器支持定期清理过期文件
- **TTL 索引**：MongoDB 适配器使用 TTL 索引自动删除过期文档
- **连接复用**：Redis 和 MongoDB 适配器支持连接复用

---

## 📝 注意事项

1. **持久化存储**：本库只支持持久化存储（Redis、MongoDB、文件），不支持内存存储，确保 Session 数据持久化
2. **自动过期**：Session 会自动过期，过期时间由 `maxAge` 配置
3. **Cookie 集成**：Session ID 通过 Cookie 传递，需要 HTTP 库支持 Cookie 功能
4. **存储适配器**：必须提供存储适配器，不能为空
5. **Session ID 生成**：默认使用 `@dreamer/crypto` 库生成安全的随机 Session ID
6. **文件适配器清理**：文件适配器会启动定期清理定时器，测试时需要调用 `stopCleanup()` 停止定时器

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 详见 [LICENSE.md](./LICENSE.md)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
