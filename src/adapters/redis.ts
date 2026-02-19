/**
 * @module @dreamer/session/adapters/redis
 *
 * @fileoverview Redis Session 存储适配器
 */

import { createClient } from "redis";
import { $tr } from "../i18n.ts";
import type { SessionData, SessionStore } from "./types.ts";

/**
 * Redis 连接配置
 */
export interface RedisConnectionConfig {
  /** Redis 连接 URL（例如：redis://127.0.0.1:6379） */
  url?: string;
  /** Redis 主机地址（默认：127.0.0.1） */
  host?: string;
  /** Redis 端口（默认：6379） */
  port?: number;
  /** Redis 密码（可选） */
  password?: string;
  /** Redis 数据库编号（默认：0） */
  db?: number;
  /** Socket 选项 */
  socket?: {
    /** 是否启用 keepAlive（默认：false） */
    keepAlive?: boolean;
    /** 连接超时时间（毫秒，默认：5000） */
    connectTimeout?: number;
  };
}

/**
 * Redis 客户端接口
 */
export interface RedisClient {
  /** 设置键值 */
  set(
    key: string,
    value: string,
    options?: { EX?: number },
  ): Promise<void> | void;
  /** 获取值 */
  get(key: string): Promise<string | null> | string | null;
  /** 删除键 */
  del(key: string): Promise<number> | number;
  /** 检查键是否存在 */
  exists(key: string): Promise<number> | number;
  /** 设置过期时间 */
  expire(key: string, seconds: number): Promise<number> | number;
  /** 断开连接 */
  disconnect?: () => Promise<void> | void;
  /** 退出连接 */
  quit?: () => Promise<void> | void;
}

/**
 * Redis Session 适配器配置选项
 */
export interface RedisSessionAdapterOptions {
  /** Redis 连接配置（如果提供，适配器会内部创建连接） */
  connection?: RedisConnectionConfig;
  /** Redis 客户端实例（如果提供 connection，则不需要提供 client） */
  client?: RedisClient;
  /** 键前缀（可选，默认：session） */
  keyPrefix?: string;
}

/**
 * Redis Session 存储适配器
 * 基于 Redis 的持久化 Session 存储
 */
export class RedisSessionAdapter implements SessionStore {
  private client: RedisClient | null = null;
  private keyPrefix: string;
  private internalClient: any = null; // 内部创建的客户端
  private connectionConfig?: RedisConnectionConfig;

  constructor(options: RedisSessionAdapterOptions = {}) {
    if (options.connection) {
      // 如果提供了连接配置，保存配置，稍后创建连接
      this.connectionConfig = options.connection;
      this.keyPrefix = options.keyPrefix || "session";
    } else if (options.client) {
      // 如果提供了客户端，直接使用
      this.client = options.client;
      this.keyPrefix = options.keyPrefix || "session";
    } else {
      throw new Error($tr("session.redis.needConnectionOrClient"));
    }
  }

  /**
   * 连接到 Redis（如果使用 connection 配置）
   */
  async connect(): Promise<void> {
    if (this.connectionConfig && !this.internalClient) {
      const config = this.connectionConfig;
      const redisUrl = config.url ||
        `redis://${config.host || "127.0.0.1"}:${config.port || 6379}`;

      this.internalClient = createClient({
        url: redisUrl,
        password: config.password,
        database: config.db || 0,
        socket: {
          keepAlive: config.socket?.keepAlive || false,
          connectTimeout: config.socket?.connectTimeout || 5000,
        },
      });

      await this.internalClient.connect();
      this.client = this.internalClient;
    }
  }

  /**
   * 获取 Redis 键名
   */
  private getKey(sessionId: string): string {
    return `${this.keyPrefix}:${sessionId}`;
  }

  /**
   * 获取 Session 数据
   */
  async get(sessionId: string): Promise<SessionData | null> {
    if (!this.client) {
      await this.connect();
    }

    const key = this.getKey(sessionId);
    const data = await this.client!.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as SessionData;
    } catch {
      return null;
    }
  }

  /**
   * 设置 Session 数据
   */
  async set(
    sessionId: string,
    data: SessionData,
    maxAge: number,
  ): Promise<void> {
    if (!this.client) {
      await this.connect();
    }

    const key = this.getKey(sessionId);
    const value = JSON.stringify(data);
    const ttl = Math.floor(maxAge / 1000); // 转换为秒

    await this.client!.set(key, value, { EX: ttl });
  }

  /**
   * 删除 Session
   */
  async delete(sessionId: string): Promise<void> {
    if (!this.client) {
      await this.connect();
    }

    const key = this.getKey(sessionId);
    await this.client!.del(key);
  }

  /**
   * 检查 Session 是否存在
   */
  async has(sessionId: string): Promise<boolean> {
    if (!this.client) {
      await this.connect();
    }

    const key = this.getKey(sessionId);
    const result = await this.client!.exists(key);
    return result > 0;
  }

  /**
   * 清空所有 Session（Redis 不支持直接清空所有 session，需要遍历）
   */
  clear(): Promise<void> {
    // Redis 不支持直接清空所有 session，需要遍历删除
    // 这里不实现，因为性能问题
    return Promise.reject(new Error($tr("session.redis.clearNotSupported")));
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.internalClient) {
      await this.internalClient.quit();
      this.internalClient = null;
      this.client = null;
    }
  }
}
