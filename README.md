# @dreamer/session

> A Deno- and Bun-compatible persistent Session management library with Redis,
> MongoDB, and file storage backends.

[![JSR](https://jsr.io/badges/@dreamer/session)](https://jsr.io/@dreamer/session)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Tests: 28 passed](https://img.shields.io/badge/Tests-28%20passed-brightgreen)](./docs/en-US/TEST_REPORT.md)

📖 **Docs**: [English](./docs/en-US/README.md) |
[中文 (Chinese)](./docs/zh-CN/README.md)

---

## 📋 Changelog

### [1.0.0] - 2026-02-16

**Added**: Redis, MongoDB, and File session storage adapters; session middleware
for HTTP integration; SessionManager and `createSessionManager` factory with
service container support; per-sessionId in-process write lock to avoid
concurrent overwrites when multiple requests share the same session cookie.

Full changelog: [en-US](./docs/en-US/CHANGELOG.md) |
[zh-CN](./docs/zh-CN/CHANGELOG.md)

---

- **Install**: `deno add jsr:@dreamer/session` or
  `bunx jsr add @dreamer/session`
- **License**: [Apache-2.0](./LICENSE)
