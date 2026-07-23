# @dreamer/session

> A persistent Session management library compatible with Deno, Bun, and
> Node.js 22+, with Redis, MongoDB, and file storage backends.

[![JSR](https://jsr.io/badges/@dreamer/session)](https://jsr.io/@dreamer/session)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Tests: 23 passed (3 runtimes)](https://img.shields.io/badge/Tests-23%20passed%20%7C%203%20runtimes-brightgreen)](./docs/en-US/TEST_REPORT.md)

📖 **Docs**: English (this README) |
[中文 (Chinese)](./docs/zh-CN/README.md)

---

## 📋 Changelog

See [en-US](./docs/en-US/CHANGELOG.md) | [zh-CN](./docs/zh-CN/CHANGELOG.md) for
full history.

**Latest (v1.1.0 - 2026-07-23)**: **Added** – Node.js 22+ compatibility.
**Changed** – Redis/MongoDB adapters lazy-load their npm packages inside
`connect()`; dependency bumps (`@dreamer/runtime-adapter` ^1.2.2, etc.). See
[CHANGELOG](./docs/en-US/CHANGELOG.md).

---

## 📦 Installation

### Deno

```bash
deno add jsr:@dreamer/session
```

### Bun

```bash
bunx jsr add @dreamer/session
```

### Node.js 22+

```bash
npx jsr add @dreamer/session
```

---

## 🌍 Runtime Compatibility

| Runtime   | Version | Status |
| --------- | ------- | ------ |
| **Deno**  | 2.9+    | ✅ Full support |
| **Bun**   | 1.3+    | ✅ Full support |
| **Node.js** | 22+   | ✅ Full support |

`redis` and `mongodb` are optional peer-style dependencies used only by their
respective adapters; they are loaded on demand when an adapter actually
connects.

---

- **License**: [Apache-2.0](./LICENSE)
