# Changelog

[English](./CHANGELOG.md) | [中文 (Chinese)](../zh-CN/CHANGELOG.md)

All notable changes to @dreamer/session are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.3] - 2026-02-19

### Changed

- **i18n**: `initSessionI18n` is no longer exported; i18n initializes on module
  load. Remove any manual `initSessionI18n()` calls from your code.
- **Dependencies**: `@dreamer/runtime-adapter` ^1.0.15, `@dreamer/service`
  ^1.0.2, `@dreamer/crypto` ^1.0.1, `@dreamer/test` ^1.0.11.

---

## [1.0.2] - 2026-02-19

### Changed

- **i18n**: Renamed translation method from `$t` to `$tr` to avoid conflict with
  global `$t`. Update existing code to use `$tr` for package messages.

---

## [1.0.1] - 2026-02-18

### Added

- **i18n**: Adapter error messages and file cleanup log message are localized.
  - New `@dreamer/i18n` dependency; `src/i18n.ts` and `src/locales/en-US.json` /
    `zh-CN.json`.
  - Redis: "need connection or client", "clear() not supported".
  - MongoDB: "need database when using client", "need connection or client".
  - File: "Session cleanup error" label.
- Exports: `$t`, `initSessionI18n`, `setSessionLocale`, type `Locale`. Locale is
  auto-detected from `LANGUAGE` / `LC_ALL` / `LANG` when not set.

---

## [1.0.0] - 2026-02-16

### Added

- Redis, MongoDB, and File session storage adapters.
- Session middleware for HTTP integration.
- SessionManager and `createSessionManager` factory with service container
  support.
- Per-sessionId in-process write lock: only one request per client (sessionId)
  writes session at a time, avoiding concurrent overwrites when multiple
  requests share the same session cookie.
