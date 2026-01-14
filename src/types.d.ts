/**
 * @dreamer/session 类型定义
 *
 * 通过模块增强扩展 @dreamer/http 的 HttpContext 类型
 */

import type { SessionData } from "./adapters/types.ts";

/**
 * 模块增强：扩展 @dreamer/http 的 HttpContext 类型
 *
 * 当用户导入 @dreamer/session 时，HttpContext 类型会自动扩展，
 * 添加 session 属性。
 *
 * 注意：这要求 HTTP 库已经定义了 HttpContext 接口并导出。
 */
declare module "jsr:@dreamer/server" {
  interface HttpContext {
    /** Session 数据（由 Session 中间件添加） */
    session?: SessionData;
  }
}

/**
 * 导出 SessionData 类型供用户使用
 */
export type { SessionData } from "./adapters/types.ts";
