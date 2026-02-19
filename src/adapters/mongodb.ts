/**
 * @module @dreamer/session/adapters/mongodb
 *
 * @fileoverview MongoDB Session 存储适配器
 */

import { MongoClient } from "mongodb";
import { $tr } from "../i18n.ts";
import type { SessionData, SessionStore } from "./types.ts";

/**
 * MongoDB 连接配置
 */
export interface MongoDBConnectionConfig {
  /** MongoDB 连接 URL（例如：mongodb://127.0.0.1:27017） */
  url?: string;
  /** MongoDB 主机地址（默认：127.0.0.1） */
  host?: string;
  /** MongoDB 端口（默认：27017） */
  port?: number;
  /** 数据库名称 */
  database: string;
  /** 用户名（可选） */
  username?: string;
  /** 密码（可选） */
  password?: string;
  /** 认证数据库（可选） */
  authSource?: string;
}

/**
 * MongoDB 客户端接口
 */
export interface MongoDBClient {
  /** 获取数据库 */
  db(name: string): {
    /** 获取集合 */
    collection(name: string): {
      /** 查找一个文档 */
      findOne(filter: Record<string, unknown>): Promise<any>;
      /** 更新或插入文档 */
      updateOne(
        filter: Record<string, unknown>,
        update: Record<string, unknown>,
        options?: { upsert?: boolean },
      ): Promise<any>;
      /** 删除文档 */
      deleteOne(filter: Record<string, unknown>): Promise<any>;
      /** 创建索引 */
      createIndex(
        keys: Record<string, number>,
        options?: { expireAfterSeconds?: number },
      ): Promise<string>;
    };
  };
  /** 关闭连接 */
  close(): Promise<void>;
}

/**
 * MongoDB Session 适配器配置选项
 */
export interface MongoDBSessionAdapterOptions {
  /** MongoDB 连接配置（如果提供，适配器会内部创建连接） */
  connection?: MongoDBConnectionConfig;
  /** MongoDB 客户端实例（如果提供 connection，则不需要提供 client） */
  client?: MongoDBClient;
  /** 数据库名称（如果只提供 client，必须提供此字段） */
  database?: string;
  /** 集合名称（可选，默认：sessions） */
  collectionName?: string;
}

/**
 * MongoDB Session 存储适配器
 * 基于 MongoDB 的持久化 Session 存储
 */
export class MongoDBSessionAdapter implements SessionStore {
  private client: MongoDBClient | null = null;
  private collectionName: string;
  private databaseName: string;
  private internalClient: any = null; // 内部创建的客户端
  private connectionConfig?: MongoDBConnectionConfig;

  constructor(options: MongoDBSessionAdapterOptions = {}) {
    if (options.connection) {
      // 如果提供了连接配置，保存配置，稍后创建连接
      this.connectionConfig = options.connection;
      this.collectionName = options.collectionName || "sessions";
      this.databaseName = options.connection.database;
    } else if (options.client) {
      // 如果提供了客户端，直接使用
      this.client = options.client;
      this.collectionName = options.collectionName || "sessions";
      // 如果提供了 client，需要提供 database 名称
      if (options.database) {
        this.databaseName = options.database;
      } else {
        throw new Error($tr("session.mongodb.needDatabaseWithClient"));
      }
    } else {
      throw new Error($tr("session.mongodb.needConnectionOrClient"));
    }
  }

  /**
   * 连接到 MongoDB（如果使用 connection 配置）
   */
  async connect(): Promise<void> {
    if (this.connectionConfig && !this.internalClient) {
      const config = this.connectionConfig;
      let mongoUrl: string;

      if (config.url) {
        mongoUrl = config.url;
      } else {
        const host = config.host || "127.0.0.1";
        const port = config.port || 27017;
        const auth = config.username && config.password
          ? `${config.username}:${config.password}@`
          : "";
        mongoUrl = `mongodb://${auth}${host}:${port}/${config.database}`;
        if (config.authSource) {
          mongoUrl += `?authSource=${config.authSource}`;
        }
      }

      this.internalClient = new MongoClient(mongoUrl);
      await this.internalClient.connect();
      this.client = this.internalClient;
    }
  }

  /**
   * 获取集合
   */
  private async getCollection(): Promise<any> {
    if (!this.client) {
      await this.connect();
    }

    const db = this.client!.db(this.databaseName);
    const collection = db.collection(this.collectionName);

    // 确保有 TTL 索引（用于自动过期）
    try {
      await collection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 },
      );
    } catch {
      // 索引可能已存在，忽略错误
    }

    return collection;
  }

  /**
   * 获取 Session 数据
   */
  async get(sessionId: string): Promise<SessionData | null> {
    const collection = await this.getCollection();

    const doc = await collection.findOne({
      _id: sessionId,
      expiresAt: { $gt: new Date() },
    });

    if (!doc) {
      return null;
    }

    // 移除 MongoDB 的 _id 和 expiresAt 字段
    const { _id, expiresAt: _expiresAt, ...data } = doc;
    return data as SessionData;
  }

  /**
   * 设置 Session 数据
   */
  async set(
    sessionId: string,
    data: SessionData,
    maxAge: number,
  ): Promise<void> {
    const collection = await this.getCollection();

    const expiresAt = new Date(Date.now() + maxAge);

    await collection.updateOne(
      { _id: sessionId },
      {
        $set: {
          ...data,
          expiresAt,
        },
      },
      { upsert: true },
    );
  }

  /**
   * 删除 Session
   */
  async delete(sessionId: string): Promise<void> {
    const collection = await this.getCollection();

    await collection.deleteOne({ _id: sessionId });
  }

  /**
   * 检查 Session 是否存在
   */
  async has(sessionId: string): Promise<boolean> {
    const collection = await this.getCollection();

    const doc = await collection.findOne({
      _id: sessionId,
      expiresAt: { $gt: new Date() },
    });

    return doc !== null;
  }

  /**
   * 清空所有 Session
   */
  async clear(): Promise<void> {
    const collection = await this.getCollection();
    // 使用 deleteMany 方法（如果可用）
    if (typeof collection.deleteMany === "function") {
      await collection.deleteMany({});
    } else {
      // 回退方案：逐个删除
      const allDocs = await collection.find({}).toArray();
      for (const doc of allDocs) {
        await collection.deleteOne({ _id: doc._id });
      }
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.internalClient) {
      await this.internalClient.close();
      this.internalClient = null;
      this.client = null;
    }
  }
}
