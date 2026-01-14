/**
 * @module @dreamer/session
 *
 * @dreamer/session 会话管理库
 *
 * 提供持久化 Session 管理功能，支持多种存储后端（Redis、MongoDB、文件）。
 *
 * 功能特性：
 * - 持久化 Session 存储（不支持内存存储）
 * - 多种存储适配器（Redis、MongoDB、文件）
 * - Session 中间件（与 HTTP 库集成）
 * - 自动过期管理
 * - Cookie 集成（通过 session ID）
 *
 * 环境兼容性：
 * - 服务端：✅ 支持（Deno 和 Bun 运行时）
 * - 客户端：❌ 不支持（纯服务端库）
 *
 * @example
 * ```typescript
 * import { session, RedisSessionAdapter } from "jsr:@dreamer/session";
 * import { Http } from "jsr:@dreamer/http";
 *
 * const app = new Http();
 *
 * // 使用 Redis 存储
 * const store = new RedisSessionAdapter({
 *   connection: {
 *     host: "127.0.0.1",
 *     port: 6379,
 *   },
 * });
 *
 * app.use(session({
 *   store,
 *   name: "sessionId",
 *   maxAge: 86400000, // 24 小时
 * }));
 *
 * // 在路由中使用
 * app.get("/login", async (ctx) => {
 *   ctx.session.userId = 123;
 *   return new Response("登录成功");
 * });
 * ```
 */

import { generateRandomBytes } from "@dreamer/crypto";
import type { SessionData, SessionStore } from "./adapters/types.ts";

/**
 * Cookie 选项
 * 从 @dreamer/http 导入，保持类型一致性
 * 如果 HTTP 库还未实现，这里提供临时定义
 */
export interface CookieOptions {
  /** 过期时间（毫秒） */
  maxAge?: number;
  /** 过期日期 */
  expires?: Date;
  /** 域名 */
  domain?: string;
  /** 路径 */
  path?: string;
  /** 是否只在 HTTPS 下发送 */
  secure?: boolean;
  /** 是否禁止 JavaScript 访问 */
  httpOnly?: boolean;
  /** SameSite 策略 */
  sameSite?: "strict" | "lax" | "none";
}

// TODO: 当 HTTP 库实现后，改为从 HTTP 库导入
// import type { CookieOptions } from "jsr:@dreamer/http";

/**
 * Session 配置选项
 */
export interface SessionOptions {
  /** Session 存储适配器（必须提供） */
  store: SessionStore;
  /** Cookie 名称（默认：sessionId） */
  name?: string;
  /** Session 过期时间（毫秒，默认：86400000，24 小时） */
  maxAge?: number;
  /** Cookie 选项 */
  cookie?: CookieOptions;
  /** 是否自动保存 Session（默认：true） */
  autoSave?: boolean;
  /** Session ID 生成函数（可选，默认使用 generateRandomBytes） */
  genId?: () => string;
}

/**
 * HTTP 上下文接口（需要与 @dreamer/http 集成）
 *
 * 注意：
 * 1. 这个接口用于 Session 中间件的类型约束
 * 2. 实际的 HttpContext 类型由 @dreamer/http 定义
 * 3. session 属性通过模块增强（types.d.ts）添加到 HttpContext
 *
 * TODO: 当 HTTP 库实现后，改为从 HTTP 库导入
 * import type { HttpContext } from "jsr:@dreamer/http";
 */
export interface HttpContext {
  /** Cookie 操作 */
  cookies: {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: CookieOptions): void;
    remove(name: string): void;
  };
  /** Session 数据（由中间件添加，通过模块增强添加到 HttpContext） */
  session?: SessionData;
}

/**
 * 生成 Session ID
 * 使用 @dreamer/crypto 库生成安全的随机字节，兼容 Deno 和 Bun
 */
function generateSessionId(): string {
  const bytes = generateRandomBytes(32);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Session 中间件
 * 用于与 HTTP 库集成，自动管理 Session
 */
export function session(
  options: SessionOptions,
): (ctx: HttpContext, next: () => Promise<void>) => Promise<void> {
  const {
    store,
    name = "sessionId",
    maxAge = 86400000, // 24 小时
    cookie: cookieOptions = {},
    autoSave = true,
    genId = generateSessionId,
  } = options;

  return async (ctx: HttpContext, next: () => Promise<void>): Promise<void> => {
    // 从 Cookie 中获取 session ID
    let sessionId = ctx.cookies.get(name);

    // 如果不存在，创建新的 session ID
    if (!sessionId) {
      sessionId = genId();
    }

    // 从存储中获取 session 数据
    let sessionData: SessionData | null = null;
    if (sessionId) {
      sessionData = await store.get(sessionId);
    }

    // 如果 session 不存在或已过期，创建新的 session
    if (!sessionData) {
      sessionData = {};
      sessionId = genId();
    }

    // 将 session 数据添加到上下文
    ctx.session = sessionData;

    // 执行下一个中间件
    await next();

    // 自动保存 session（如果启用）
    if (autoSave && ctx.session) {
      // 检查 session 是否有数据
      const hasData = Object.keys(ctx.session).length > 0;

      if (hasData) {
        // 保存 session 数据
        await store.set(sessionId, ctx.session, maxAge);

        // 设置 Cookie
        ctx.cookies.set(name, sessionId, {
          maxAge,
          httpOnly: true,
          path: "/",
          ...cookieOptions,
        });
      } else {
        // 如果 session 为空，删除它
        if (sessionId) {
          await store.delete(sessionId);
        }
        ctx.cookies.remove(name);
      }
    }
  };
}

/**
 * Session 管理器
 * 提供手动管理 Session 的 API
 */
export class SessionManager {
  private store: SessionStore;
  private name: string;
  private maxAge: number;
  private genId: () => string;

  constructor(options: SessionOptions) {
    this.store = options.store;
    this.name = options.name || "sessionId";
    this.maxAge = options.maxAge || 86400000;
    this.genId = options.genId || generateSessionId;
  }

  /**
   * 创建新的 Session
   */
  async create(data: SessionData): Promise<string> {
    const sessionId = this.genId();
    await this.store.set(sessionId, data, this.maxAge);
    return sessionId;
  }

  /**
   * 获取 Session 数据
   */
  async get(sessionId: string): Promise<SessionData | null> {
    return await this.store.get(sessionId);
  }

  /**
   * 更新 Session 数据
   */
  async update(sessionId: string, data: SessionData): Promise<void> {
    await this.store.set(sessionId, data, this.maxAge);
  }

  /**
   * 删除 Session
   */
  async delete(sessionId: string): Promise<void> {
    await this.store.delete(sessionId);
  }

  /**
   * 检查 Session 是否存在
   */
  async has(sessionId: string): Promise<boolean> {
    return await this.store.has(sessionId);
  }
}

// 导出适配器
export {
  FileSessionAdapter,
  MongoDBSessionAdapter,
  RedisSessionAdapter,
} from "./adapters/mod.ts";
export type {
  FileSessionAdapterOptions,
  MongoDBClient,
  MongoDBConnectionConfig,
  MongoDBSessionAdapterOptions,
  RedisClient,
  RedisConnectionConfig,
  RedisSessionAdapterOptions,
  SessionData,
  SessionStore,
} from "./adapters/mod.ts";

// 导出类型定义（模块增强会自动生效）
// 注意：types.d.ts 中的模块增强会在导入时自动生效
// 用户只需要导入 session 中间件即可获得类型支持
