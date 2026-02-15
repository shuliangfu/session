# 变更日志

[English](../en-US/CHANGELOG.md) | 中文 (Chinese)

本文件记录 @dreamer/session 的重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.0] - 2026-02-16

### 新增

- Redis、MongoDB、文件三种 Session 存储适配器。
- Session 中间件，与 HTTP 库集成。
- SessionManager 及 `createSessionManager` 工厂，支持服务容器集成。
- 按 sessionId 的进程内写锁：同一客户端（同一
  sessionId）同一时刻仅有一个请求写入 session，避免多请求共持同一 session cookie
  时的并发覆盖。
