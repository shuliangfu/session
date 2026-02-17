/**
 * @module @dreamer/session/adapters/file
 *
 * @fileoverview 文件 Session 存储适配器
 */

import {
  join,
  mkdir,
  readdir,
  readTextFile,
  remove,
  stat,
  writeTextFile,
} from "@dreamer/runtime-adapter";
import { $t } from "../i18n.ts";
import type { SessionData, SessionStore } from "./types.ts";

/**
 * 文件 Session 适配器配置选项
 */
export interface FileSessionAdapterOptions {
  /** Session 存储目录路径（默认：./sessions） */
  sessionDir?: string;
  /** 键前缀（可选） */
  prefix?: string;
}

/**
 * Session 文件数据结构
 */
interface SessionFile {
  /** Session 数据 */
  data: SessionData;
  /** 过期时间（时间戳，毫秒） */
  expiresAt: number;
}

/**
 * 文件 Session 存储适配器
 * 基于文件系统的持久化 Session 存储
 */
export class FileSessionAdapter implements SessionStore {
  private sessionDir: string;
  private prefix?: string;
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(options: FileSessionAdapterOptions = {}) {
    this.sessionDir = options.sessionDir || "./sessions";
    this.prefix = options.prefix;

    // 确保目录存在
    this.initSessionDir();

    // 启动定期清理过期 Session
    this.startCleanup();
  }

  /**
   * 初始化 Session 目录
   */
  private async initSessionDir(): Promise<void> {
    try {
      await mkdir(this.sessionDir, { recursive: true });
    } catch (error) {
      // 忽略已存在的目录错误
      if (
        !(error instanceof Error && error.message.includes("already exists"))
      ) {
        throw error;
      }
    }
  }

  /**
   * 获取文件路径
   */
  private getFilePath(sessionId: string): string {
    const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = this.prefix
      ? `${this.prefix}_${safeId}.json`
      : `${safeId}.json`;
    return join(this.sessionDir, filename);
  }

  /**
   * 启动定期清理
   */
  private startCleanup(): void {
    // 每小时清理一次过期 Session
    this.cleanupTimer = setInterval(async () => {
      await this.cleanup();
    }, 3600000); // 1 小时

    // 立即执行一次清理
    this.cleanup();
  }

  /**
   * 清理过期 Session
   */
  private async cleanup(): Promise<void> {
    try {
      const files = await readdir(this.sessionDir);
      const now = Date.now();

      for (const entry of files) {
        const fileName = entry.name;
        if (!fileName.endsWith(".json")) {
          continue;
        }

        const filePath = join(this.sessionDir, fileName);
        try {
          const content = await readTextFile(filePath);
          const sessionFile: SessionFile = JSON.parse(content);

          // 如果已过期，删除文件
          if (sessionFile.expiresAt < now) {
            await remove(filePath);
          }
        } catch {
          // 如果文件损坏，删除它
          await remove(filePath);
        }
      }
    } catch (error) {
      // 忽略清理错误，仅输出翻译后的标签
      console.error($t("session.file.cleanupError") + ":", error);
    }
  }

  /**
   * 获取 Session 数据
   */
  async get(sessionId: string): Promise<SessionData | null> {
    try {
      const filePath = this.getFilePath(sessionId);
      const content = await readTextFile(filePath);
      const sessionFile: SessionFile = JSON.parse(content);

      // 检查是否过期
      if (sessionFile.expiresAt < Date.now()) {
        await this.delete(sessionId);
        return null;
      }

      return sessionFile.data;
    } catch {
      // 文件不存在或已过期
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
    const filePath = this.getFilePath(sessionId);
    const expiresAt = Date.now() + maxAge;

    const sessionFile: SessionFile = {
      data,
      expiresAt,
    };

    await writeTextFile(filePath, JSON.stringify(sessionFile, null, 2));
  }

  /**
   * 删除 Session
   */
  async delete(sessionId: string): Promise<void> {
    try {
      const filePath = this.getFilePath(sessionId);
      await remove(filePath);
    } catch {
      // 文件可能不存在，忽略错误
    }
  }

  /**
   * 检查 Session 是否存在
   */
  async has(sessionId: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(sessionId);
      const fileInfo = await stat(filePath);

      if (!fileInfo.isFile) {
        return false;
      }

      // 检查是否过期
      const content = await readTextFile(filePath);
      const sessionFile: SessionFile = JSON.parse(content);

      if (sessionFile.expiresAt < Date.now()) {
        await this.delete(sessionId);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清空所有 Session
   */
  async clear(): Promise<void> {
    try {
      const files = await readdir(this.sessionDir);

      for (const entry of files) {
        const fileName = entry.name;
        if (fileName.endsWith(".json")) {
          const filePath = join(this.sessionDir, fileName);
          await remove(filePath);
        }
      }
    } catch {
      // 忽略错误
    }
  }

  /**
   * 停止清理定时器
   */
  stopCleanup(): void {
    if (this.cleanupTimer !== undefined) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}
