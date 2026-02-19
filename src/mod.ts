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
import { initSessionI18n } from "./i18n.ts";
import type { SessionData, SessionStore } from "./adapters/types.ts";
import type { ServiceContainer } from "@dreamer/service";

// 入口处初始化 i18n，供适配器错误信息等文案使用
initSessionI18n();

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
 * 按 sessionId 的进程内写锁
 * 保证同一客户端（同一 sessionId）在同一时刻只有一个请求执行 session 写入，
 * 避免页面刷新时多个静态资源请求并发写同一 session 造成覆盖或重复写入。
 */
const sessionWriteLocks = new Map<string, Promise<void>>();

/**
 * 在指定 sessionId 的写锁下执行 fn，执行完后释放锁
 */
async function withSessionWriteLock(
  sessionId: string,
  fn: () => Promise<void>,
): Promise<void> {
  const prev = sessionWriteLocks.get(sessionId) ?? Promise.resolve();
  let release!: () => void;
  const myLock = new Promise<void>((r) => {
    release = r;
  });
  const chain = prev.then(() => myLock);
  sessionWriteLocks.set(sessionId, chain);
  await prev;
  try {
    await fn();
  } finally {
    release();
  }
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

    // 自动保存 session（如果启用）：同一 sessionId 串行写入，避免并发覆盖
    if (autoSave && ctx.session) {
      const hasData = Object.keys(ctx.session).length > 0;

      await withSessionWriteLock(sessionId, async () => {
        if (hasData) {
          await store.set(sessionId, ctx.session!, maxAge);
          ctx.cookies.set(name, sessionId, {
            maxAge,
            httpOnly: true,
            path: "/",
            ...cookieOptions,
          });
        } else {
          if (sessionId) {
            await store.delete(sessionId);
          }
          ctx.cookies.remove(name);
        }
      });
    }
  };
}

/**
 * Session 管理器扩展选项
 * 包含服务容器集成相关配置
 */
export interface SessionManagerOptions extends SessionOptions {
  /** 管理器名称（用于服务容器识别） */
  name?: string;
}

/**
 * Session 管理器
 * 提供手动管理 Session 的 API
 */
export class SessionManager {
  /** Session 存储适配器 */
  private store: SessionStore;
  /** Cookie 名称 */
  private cookieName: string;
  /** Session 过期时间 */
  private maxAge: number;
  /** Session ID 生成函数 */
  private genId: () => string;
  /** 服务容器实例 */
  private container?: ServiceContainer;
  /** 管理器名称 */
  private readonly managerName: string;

  /**
   * 创建 SessionManager 实例
   * @param options Session 管理器配置选项
   */
  constructor(options: SessionManagerOptions) {
    this.store = options.store;
    this.cookieName = options.name || "sessionId";
    this.maxAge = options.maxAge || 86400000;
    this.genId = options.genId || generateSessionId;
    this.managerName = options.name || "default";
  }

  /**
   * 获取管理器名称
   * @returns 管理器名称
   */
  getName(): string {
    return this.managerName;
  }

  /**
   * 设置服务容器
   * @param container 服务容器实例
   */
  setContainer(container: ServiceContainer): void {
    this.container = container;
  }

  /**
   * 获取服务容器
   * @returns 服务容器实例，如果未设置则返回 undefined
   */
  getContainer(): ServiceContainer | undefined {
    return this.container;
  }

  /**
   * 从服务容器创建 SessionManager 实例
   * @param container 服务容器实例
   * @param name 管理器名称（默认 "default"）
   * @returns 关联了服务容器的 SessionManager 实例
   */
  static fromContainer(
    container: ServiceContainer,
    name = "default",
  ): SessionManager | undefined {
    const serviceName = `session:${name}`;
    return container.tryGet<SessionManager>(serviceName);
  }

  /**
   * 创建新的 Session
   * @param data Session 数据
   * @returns Session ID
   */
  async create(data: SessionData): Promise<string> {
    const sessionId = this.genId();
    await this.store.set(sessionId, data, this.maxAge);
    return sessionId;
  }

  /**
   * 获取 Session 数据
   * @param sessionId Session ID
   * @returns Session 数据，如果不存在则返回 null
   */
  async get(sessionId: string): Promise<SessionData | null> {
    return await this.store.get(sessionId);
  }

  /**
   * 更新 Session 数据
   * @param sessionId Session ID
   * @param data Session 数据
   */
  async update(sessionId: string, data: SessionData): Promise<void> {
    await this.store.set(sessionId, data, this.maxAge);
  }

  /**
   * 删除 Session
   * @param sessionId Session ID
   */
  async delete(sessionId: string): Promise<void> {
    await this.store.delete(sessionId);
  }

  /**
   * 检查 Session 是否存在
   * @param sessionId Session ID
   * @returns 是否存在
   */
  async has(sessionId: string): Promise<boolean> {
    return await this.store.has(sessionId);
  }

  /**
   * 获取 Cookie 名称
   * @returns Cookie 名称
   */
  getCookieName(): string {
    return this.cookieName;
  }

  /**
   * 获取存储适配器
   * @returns Session 存储适配器
   */
  getStore(): SessionStore {
    return this.store;
  }
}

/**
 * 创建 SessionManager 的工厂函数
 * 用于服务容器注册
 * @param options Session 管理器配置选项
 * @returns SessionManager 实例
 */
export function createSessionManager(
  options: SessionManagerOptions,
): SessionManager {
  return new SessionManager(options);
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

// i18n 仅包内使用，不对外导出；测试需 init/setLocale 时从 ./i18n.ts 导入

// 导出类型定义（模块增强会自动生效）
// 注意：types.d.ts 中的模块增强会在导入时自动生效
// 用户只需要导入 session 中间件即可获得类型支持
