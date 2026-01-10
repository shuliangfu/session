/**
 * @module @dreamer/session/adapters
 *
 * @fileoverview Session 存储适配器模块
 */

// 导出类型
export type {
  SessionData,
  SessionStore,
} from "./types.ts";

// 导出适配器
export { FileSessionAdapter } from "./file.ts";
export { MongoDBSessionAdapter } from "./mongodb.ts";
export { RedisSessionAdapter } from "./redis.ts";

// 导出配置类型
export type {
  FileSessionAdapterOptions,
} from "./file.ts";
export type {
  MongoDBSessionAdapterOptions,
  MongoDBConnectionConfig,
  MongoDBClient,
} from "./mongodb.ts";
export type {
  RedisSessionAdapterOptions,
  RedisConnectionConfig,
  RedisClient,
} from "./redis.ts";
