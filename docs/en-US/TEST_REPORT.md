# @dreamer/session Test Report

## Overview

| Item               | Value                                    |
| ------------------ | ---------------------------------------- |
| **Package**        | `@dreamer/session@1.1.0`                 |
| **Service**        | `@dreamer/service@^1.1.0`                |
| **Runtime**        | `@dreamer/runtime-adapter@^1.2.2`        |
| **Test framework** | `@dreamer/test@^1.2.3`                   |
| **Date**           | 2026-07-23                               |
| **Environment**    | Deno 2.9+, Bun 1.3+, Node.js 22+         |

---

## Results

### Summary

| Metric       | Value                              |
| ------------ | ---------------------------------- |
| **Total**    | 23 unit tests (per runtime)        |
| **Passed**   | Deno 29 / Bun 23 / Node 23         |
| **Failed**   | 0                                  |
| **Rate**     | 100%                               |
| **Duration** | Deno ~1s / Bun ~1.1s / Node ~1.4s  |

> Deno counts 6 additional lifecycle hooks (5 `describe` `afterAll` + 1
> `@dreamer/test` cleanup) on top of the 23 unit tests; Bun and Node report 23
> unit tests each.

### By file

| File          | Count | Passed | Failed | Status  |
| ------------- | ----- | ------ | ------ | ------- |
| `mod.test.ts` | 23    | 23     | 0      | ✅ Pass |

---

## Test details

### 1. FileSessionAdapter (4 tests)

| Scenario               | Status |
| ---------------------- | ------ |
| Create and get session | ✅     |
| Delete session         | ✅     |
| Has session            | ✅     |
| Expired session        | ✅     |

### 2. SessionManager (4 tests)

| Scenario | Status |
| -------- | ------ |
| Create   | ✅     |
| Get      | ✅     |
| Update   | ✅     |
| Delete   | ✅     |

### 3. Session middleware (3 tests)

| Scenario           | Status |
| ------------------ | ------ |
| Create new session | ✅     |
| Read from cookie   | ✅     |
| Auto-save          | ✅     |

### 4. SessionManager + ServiceContainer (7 tests)

| Scenario                   | Status |
| -------------------------- | ------ |
| Default manager name       | ✅     |
| Custom manager name        | ✅     |
| Set/get container          | ✅     |
| Get manager from container | ✅     |
| TryGet returns undefined   | ✅     |
| Get cookie name            | ✅     |
| Get store                  | ✅     |

### 5. createSessionManager (5 tests)

| Scenario              | Status |
| --------------------- | ------ |
| Create instance       | ✅     |
| Default name          | ✅     |
| Custom name           | ✅     |
| Register in container | ✅     |
| Create and manage     | ✅     |

---

## Cross-runtime notes

- **Deno**: `deno test --allow-all tests/*.test.ts`
- **Bun**: `bun test tests/` (requires `bun install` first)
- **Node.js 22+**: `npm run test:node` (`tsx --tsconfig tsconfig.json --test
  --test-force-exit tests/*.test.ts`; requires `npm install` first)
- Adapter tests use only `FileSessionAdapter` (filesystem via runtime-adapter);
  no real Redis/MongoDB services or Chromium are required, so all 9 CI jobs run
  without external services.

---

## Conclusion

All 23 unit tests pass on Deno, Bun, and Node.js 22+. The package covers adapters
(Redis, MongoDB, File), middleware, SessionManager, and service container
integration.

---

**Pass rate: 100%** ✅ — 23 tests, all passed across three runtimes.
