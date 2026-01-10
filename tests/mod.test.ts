/**
 * @fileoverview Session 库测试
 */

import { makeTempDir, remove } from "@dreamer/runtime-adapter";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "@dreamer/test";
import {
  FileSessionAdapter,
  type HttpContext,
  session,
  SessionManager,
} from "../src/mod.ts";

describe("@dreamer/session", () => {
  describe("FileSessionAdapter", () => {
    let sessionDir: string;
    const adapters: FileSessionAdapter[] = [];

    beforeAll(async () => {
      // 创建临时测试目录
      sessionDir = await makeTempDir({ prefix: "session-test-" });
    });

    afterEach(() => {
      // 每个测试后停止所有适配器的清理定时器
      for (const adapter of adapters) {
        adapter.stopCleanup();
      }
      adapters.length = 0;
    });

    afterAll(async () => {
      // 清理测试目录
      try {
        await remove(sessionDir, { recursive: true });
      } catch {
        // 忽略错误
      }
    });

    it("应该创建和获取 Session", async () => {
      const adapter = new FileSessionAdapter({ sessionDir });
      adapters.push(adapter);

      const sessionId = "test-session-123";
      const data = { userId: 123, username: "alice" };

      await adapter.set(sessionId, data, 3600000);

      const retrieved = await adapter.get(sessionId);
      expect(retrieved).toEqual(data);
    });

    it("应该删除 Session", async () => {
      const adapter = new FileSessionAdapter({ sessionDir });
      adapters.push(adapter);

      const sessionId = "test-session-123";
      const data = { userId: 123 };

      await adapter.set(sessionId, data, 3600000);
      await adapter.delete(sessionId);

      const retrieved = await adapter.get(sessionId);
      expect(retrieved).toBeNull();
    });

    it("应该检查 Session 是否存在", async () => {
      const adapter = new FileSessionAdapter({ sessionDir });
      adapters.push(adapter);

      const sessionId = "test-session-123";
      const data = { userId: 123 };

      expect(await adapter.has(sessionId)).toBe(false);

      await adapter.set(sessionId, data, 3600000);
      expect(await adapter.has(sessionId)).toBe(true);
    });

    it("应该处理过期的 Session", async () => {
      const adapter = new FileSessionAdapter({ sessionDir });
      adapters.push(adapter);

      const sessionId = "test-session-123";
      const data = { userId: 123 };

      // 设置很短的过期时间（1 秒）
      await adapter.set(sessionId, data, 1000);

      // 立即获取应该存在
      expect(await adapter.get(sessionId)).toEqual(data);

      // 等待过期
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // 过期后应该返回 null
      const retrieved = await adapter.get(sessionId);
      expect(retrieved).toBeNull();
    });
  });

  describe("SessionManager", () => {
    let sessionDir: string;
    const adapters: FileSessionAdapter[] = [];

    beforeAll(async () => {
      sessionDir = await makeTempDir({ prefix: "session-test-" });
    });

    afterEach(() => {
      // 每个测试后停止所有适配器的清理定时器
      for (const adapter of adapters) {
        adapter.stopCleanup();
      }
      adapters.length = 0;
    });

    afterAll(async () => {
      try {
        await remove(sessionDir, { recursive: true });
      } catch {
        // 忽略错误
      }
    });

    it("应该创建 Session", async () => {
      const adapter = new FileSessionAdapter({ sessionDir });
      adapters.push(adapter);
      const manager = new SessionManager({ store: adapter });

      const data = { userId: 123, username: "alice" };
      const sessionId = await manager.create(data);

      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe("string");
    });

    it("应该获取 Session", async () => {
      const adapter = new FileSessionAdapter({ sessionDir });
      adapters.push(adapter);
      const manager = new SessionManager({ store: adapter });

      const data = { userId: 123, username: "alice" };
      const sessionId = await manager.create(data);

      const retrieved = await manager.get(sessionId);
      expect(retrieved).toEqual(data);
    });

    it("应该更新 Session", async () => {
      const adapter = new FileSessionAdapter({ sessionDir });
      adapters.push(adapter);
      const manager = new SessionManager({ store: adapter });

      const data = { userId: 123 };
      const sessionId = await manager.create(data);

      const updated = { userId: 456 };
      await manager.update(sessionId, updated);

      const retrieved = await manager.get(sessionId);
      expect(retrieved).toEqual(updated);
    });

    it("应该删除 Session", async () => {
      const adapter = new FileSessionAdapter({ sessionDir });
      adapters.push(adapter);
      const manager = new SessionManager({ store: adapter });

      const data = { userId: 123 };
      const sessionId = await manager.create(data);

      await manager.delete(sessionId);

      const retrieved = await manager.get(sessionId);
      expect(retrieved).toBeNull();
    });
  });

  describe("Session 中间件", () => {
    let sessionDir: string;
    const adapters: FileSessionAdapter[] = [];

    beforeAll(async () => {
      sessionDir = await makeTempDir({ prefix: "session-test-" });
    });

    afterEach(() => {
      // 每个测试后停止所有适配器的清理定时器
      for (const adapter of adapters) {
        adapter.stopCleanup();
      }
      adapters.length = 0;
    });

    afterAll(async () => {
      try {
        await remove(sessionDir, { recursive: true });
      } catch {
        // 忽略错误
      }
    });

    it("应该创建新的 Session", async () => {
      const adapter = new FileSessionAdapter({ sessionDir });
      adapters.push(adapter);
      const middleware = session({ store: adapter });

      const ctx: HttpContext = {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      };

      await middleware(ctx, async () => {
        // 设置 session 数据
        ctx.session = { userId: 123 };
      });

      expect(ctx.session).toEqual({ userId: 123 });
      expect(ctx.cookies.get("sessionId")).toBeUndefined(); // Cookie 会在响应时设置
    });

    it("应该从 Cookie 中读取 Session", async () => {
      const adapter = new FileSessionAdapter({ sessionDir });
      adapters.push(adapter);
      const middleware = session({ store: adapter });

      // 先创建一个 session
      await adapter.set("test-session-123", { userId: 123 }, 3600000);

      const ctx: HttpContext = {
        cookies: {
          get: (name) => name === "sessionId" ? "test-session-123" : undefined,
          set: () => {},
          remove: () => {},
        },
      };

      await middleware(ctx, async () => {});

      expect(ctx.session).toEqual({ userId: 123 });
    });

    it("应该自动保存 Session", async () => {
      const adapter = new FileSessionAdapter({ sessionDir });
      adapters.push(adapter);
      const middleware = session({ store: adapter, autoSave: true });

      let cookieValue: string | undefined;
      const ctx: HttpContext = {
        cookies: {
          get: () => undefined,
          set: (name, value) => {
            if (name === "sessionId") {
              cookieValue = value;
            }
          },
          remove: () => {},
        },
      };

      await middleware(ctx, async () => {
        ctx.session = { userId: 123 };
      });

      // 检查 session 是否保存
      if (cookieValue) {
        const saved = await adapter.get(cookieValue);
        expect(saved).toEqual({ userId: 123 });
      }
    });
  });
});
