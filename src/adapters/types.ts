/**
 * @module @dreamer/session/adapters/types
 *
 * @fileoverview Session 存储适配器类型定义
 */

/**
 * Session 数据
 */
export interface SessionData {
  /** Session 数据（键值对） */
  [key: string]: unknown;
}

/**
 * Session 存储适配器接口
 */
export interface SessionStore {
  /**
   * 获取 Session 数据
   * @param sessionId Session ID
   * @returns Session 数据，如果不存在或已过期返回 null
   */
  get(sessionId: string): Promise<SessionData | null>;

  /**
   * 设置 Session 数据
   * @param sessionId Session ID
   * @param data Session 数据
   * @param maxAge 过期时间（毫秒）
   */
  set(sessionId: string, data: SessionData, maxAge: number): Promise<void>;

  /**
   * 删除 Session
   * @param sessionId Session ID
   */
  delete(sessionId: string): Promise<void>;

  /**
   * 检查 Session 是否存在
   * @param sessionId Session ID
   * @returns 是否存在
   */
  has(sessionId: string): Promise<boolean>;

  /**
   * 清空所有 Session（可选，某些适配器可能不支持）
   */
  clear(): Promise<void>;
}
