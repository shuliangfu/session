/**
 * @module @dreamer/session/adapters
 *
 * @fileoverview Session 存储适配器模块
 */

// 导出类型
export type { SessionData, SessionStore } from "./types.ts";

// 导出适配器
export { FileSessionAdapter } from "./file.ts";
export { MongoDBSessionAdapter } from "./mongodb.ts";
export { RedisSessionAdapter } from "./redis.ts";

// 导出配置类型
export type { FileSessionAdapterOptions } from "./file.ts";
export type {
  MongoDBClient,
  MongoDBConnectionConfig,
  MongoDBSessionAdapterOptions,
} from "./mongodb.ts";
export type {
  RedisClient,
  RedisConnectionConfig,
  RedisSessionAdapterOptions,
} from "./redis.ts";
