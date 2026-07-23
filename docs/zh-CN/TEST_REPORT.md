# @dreamer/session 测试报告

## 📊 测试概览

| 项目                 | 值                                       |
| -------------------- | ---------------------------------------- |
| **测试包版本**       | `@dreamer/session@1.1.0`                 |
| **服务容器版本**     | `@dreamer/service@^1.1.0`                |
| **运行时适配器版本** | `@dreamer/runtime-adapter@^1.2.2`        |
| **测试框架**         | `@dreamer/test@^1.2.3`                   |
| **测试时间**         | `2026-07-23`                             |
| **测试环境**         | Deno 2.9+, Bun 1.3+, Node.js 22+         |

---

## 🎯 测试结果

### 总体统计

| 指标         | 值                                   |
| ------------ | ------------------------------------ |
| **总测试数** | 23 个单元测试（每运行时）            |
| **通过**     | Deno 29 / Bun 23 / Node 23           |
| **失败**     | 0                                    |
| **通过率**   | 100%                                 |
| **执行时间** | Deno ~1s / Bun ~1.1s / Node ~1.4s    |

> Deno 在 23 个单元测试之外额外计入 6 个 lifecycle hook（5 个 `describe`
> `afterAll` + 1 个 `@dreamer/test` cleanup）；Bun 与 Node 各报 23 个单元测试。

### 测试文件统计

| 测试文件      | 测试数 | 通过 | 失败 | 状态    |
| ------------- | ------ | ---- | ---- | ------- |
| `mod.test.ts` | 23     | 23   | 0    | ✅ 通过 |

---

## 📋 功能测试详情

### 1. FileSessionAdapter (mod.test.ts) - 4 个测试

| 测试场景                  | 状态 |
| ------------------------- | ---- |
| 应该创建和获取 Session    | ✅   |
| 应该删除 Session          | ✅   |
| 应该检查 Session 是否存在 | ✅   |
| 应该处理过期的 Session    | ✅   |

### 2. SessionManager (mod.test.ts) - 4 个测试

| 测试场景         | 状态 |
| ---------------- | ---- |
| 应该创建 Session | ✅   |
| 应该获取 Session | ✅   |
| 应该更新 Session | ✅   |
| 应该删除 Session | ✅   |

### 3. Session 中间件 (mod.test.ts) - 3 个测试

| 测试场景                     | 状态 |
| ---------------------------- | ---- |
| 应该创建新的 Session         | ✅   |
| 应该从 Cookie 中读取 Session | ✅   |
| 应该自动保存 Session         | ✅   |

### 4. SessionManager ServiceContainer 集成 (mod.test.ts) - 7 个测试

| 测试场景                          | 状态 |
| --------------------------------- | ---- |
| 应该获取默认管理器名称            | ✅   |
| 应该获取自定义管理器名称          | ✅   |
| 应该设置和获取服务容器            | ✅   |
| 应该从服务容器获取 SessionManager | ✅   |
| 应该在服务不存在时返回 undefined  | ✅   |
| 应该获取 Cookie 名称              | ✅   |
| 应该获取存储适配器                | ✅   |

### 5. createSessionManager 工厂函数 (mod.test.ts) - 5 个测试

| 测试场景                     | 状态 |
| ---------------------------- | ---- |
| 应该创建 SessionManager 实例 | ✅   |
| 应该使用默认名称             | ✅   |
| 应该使用自定义名称           | ✅   |
| 应该能够在服务容器中注册     | ✅   |
| 应该支持创建和管理 Session   | ✅   |

---

## 📈 测试覆盖分析

### 接口方法覆盖

| 类/接口                | 方法            | 覆盖状态 |
| ---------------------- | --------------- | -------- |
| `FileSessionAdapter`   | `get`           | ✅       |
| `FileSessionAdapter`   | `set`           | ✅       |
| `FileSessionAdapter`   | `delete`        | ✅       |
| `FileSessionAdapter`   | `has`           | ✅       |
| `SessionManager`       | `create`        | ✅       |
| `SessionManager`       | `get`           | ✅       |
| `SessionManager`       | `update`        | ✅       |
| `SessionManager`       | `delete`        | ✅       |
| `SessionManager`       | `has`           | ✅       |
| `SessionManager`       | `getName`       | ✅       |
| `SessionManager`       | `setContainer`  | ✅       |
| `SessionManager`       | `getContainer`  | ✅       |
| `SessionManager`       | `fromContainer` | ✅       |
| `SessionManager`       | `getCookieName` | ✅       |
| `SessionManager`       | `getStore`      | ✅       |
| `session`              | 中间件函数      | ✅       |
| `createSessionManager` | 工厂函数        | ✅       |

### 边界情况覆盖

| 场景            | 覆盖状态 |
| --------------- | -------- |
| Session 不存在  | ✅       |
| Session 过期    | ✅       |
| 空 Session 数据 | ✅       |
| 默认配置        | ✅       |
| 自定义配置      | ✅       |
| 服务容器未设置  | ✅       |
| 服务不存在      | ✅       |

### 错误处理覆盖

| 场景                       | 覆盖状态 |
| -------------------------- | -------- |
| Session 不存在时返回 null  | ✅       |
| 服务不存在时返回 undefined | ✅       |

---

## 🌍 跨运行时说明

- **Deno**：`deno test --allow-all tests/*.test.ts`
- **Bun**：`bun test tests/`（需先 `bun install`）
- **Node.js 22+**：`npm run test:node`（`tsx --tsconfig tsconfig.json --test
  --test-force-exit tests/*.test.ts`，需先 `npm install`）
- 适配器测试仅使用 `FileSessionAdapter`（经 runtime-adapter 文件系统 API），
  无需真实 Redis/MongoDB 服务或 Chromium，故 9 个 CI 作业均无需外部服务。

---

## ✨ 优点

1. **完整的存储适配器支持**：支持 Redis、MongoDB、文件存储
2. **灵活的中间件集成**：与 HTTP 包无缝集成
3. **手动管理支持**：通过 SessionManager 支持手动管理 Session
4. **服务容器集成**：支持依赖注入，便于管理多个 Session 管理器实例
5. **自动过期管理**：自动清理过期 Session
6. **跨运行时兼容**：兼容 Deno、Bun、Node.js 22+ 三端运行时

---

## 📝 结论

@dreamer/session 的 23 个单元测试在 Deno、Bun、Node.js 22+ 三端全部通过，覆盖了
核心功能和服务容器集成。包支持多种存储后端（Redis、MongoDB、文件），提供中间件和
手动管理两种使用方式，并通过服务容器支持依赖注入。

---

<div align="center">

**测试通过率：100%** ✅

_共 23 个单元测试 | 三端全部通过_

</div>
