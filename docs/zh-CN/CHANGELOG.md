# 变更日志

[English](../en-US/CHANGELOG.md) | 中文 (Chinese)

本文件记录 @dreamer/session 的重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.1] - 2026-02-18

### 新增

- **i18n**：适配器错误信息与文件清理日志支持多语言。
  - 新增依赖 `@dreamer/i18n`；`src/i18n.ts` 与 `src/locales/en-US.json` /
    `zh-CN.json`。
  - Redis：「需要 connection 或 client」、「不支持 clear()」。
  - MongoDB：「使用 client 时需提供 database」、「需要 connection 或 client」。
  - 文件：「Session 清理错误」标签。
- 导出：`$t`、`initSessionI18n`、`setSessionLocale`、类型 `Locale`。未设置时
  从环境变量 `LANGUAGE` / `LC_ALL` / `LANG` 自动检测语言。

---

## [1.0.0] - 2026-02-16

### 新增

- Redis、MongoDB、文件三种 Session 存储适配器。
- Session 中间件，与 HTTP 库集成。
- SessionManager 及 `createSessionManager` 工厂，支持服务容器集成。
- 按 sessionId 的进程内写锁：同一客户端（同一
  sessionId）同一时刻仅有一个请求写入 session，避免多请求共持同一 session cookie
  时的并发覆盖。
