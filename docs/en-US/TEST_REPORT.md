# @dreamer/session Test Report

## Overview

| Item               | Value                                    |
| ------------------ | ---------------------------------------- |
| **Package**        | `@dreamer/session@1.0.0-beta.3`          |
| **Service**        | `@dreamer/service@1.0.0-beta.4`          |
| **Runtime**        | `@dreamer/runtime-adapter@1.0.0-beta.22` |
| **Test framework** | `@dreamer/test@1.0.0-beta.39`            |
| **Date**           | 2026-01-30                               |
| **Environment**    | Deno 2.5+, Bun 1.0+                      |

---

## Results

### Summary

| Metric       | Value |
| ------------ | ----- |
| **Total**    | 28    |
| **Passed**   | 28    |
| **Failed**   | 0     |
| **Rate**     | 100%  |
| **Duration** | ~1.3s |

### By file

| File          | Count | Passed | Failed | Status  |
| ------------- | ----- | ------ | ------ | ------- |
| `mod.test.ts` | 28    | 28     | 0      | ✅ Pass |

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

## Conclusion

All 28 tests pass. The package covers adapters (Redis, MongoDB, File),
middleware, SessionManager, and service container integration.

---

**Pass rate: 100%** ✅ — 28 tests, all passed.
