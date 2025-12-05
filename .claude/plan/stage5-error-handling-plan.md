# 阶段5: 错误处理与用户反馈 - 执行计划

> **创建时间**: 2025-12-05
> **执行方案**: 渐进式增强（方案1）
> **预估工作量**: 2.5-3.5 小时

---

## 任务概览

### 目标
实现完善的错误处理与用户反馈系统，包括：
1. 增强日志输出规范
2. 实现用户友好的通知系统
3. 实现错误恢复机制

### 涉及文件
- `src/utils/logger.ts` [修改]
- `src/utils/notifier.ts` [新建]
- `src/utils/retry-helper.ts` [新建]
- `src/managers/liked-songs-manager.ts` [修改]
- `.claude/plan/logging-standard.md` [新建]

---

## 任务 5.1: 增强 Logger 类

**文件**: `src/utils/logger.ts`

**修改内容**:
1. 添加 PREFIX 常量: `"[Spicetify-Dedup]"`
2. 修改现有方法添加统一前缀和级别标识
3. 新增 `warn()` 方法
4. 新增 `group()` 方法
5. 新增 `stats()` 方法
6. 优化 `perf()` 方法的 emoji 逻辑

**验收标准**:
- ✅ 所有日志带有统一前缀
- ✅ 日志级别清晰（DEBUG/INFO/WARN/ERROR/PERF/TABLE）
- ✅ 支持分组和统计信息展示
- ✅ 现有代码调用不受影响

---

## 任务 5.2: 创建 Notifier 通知系统

**文件**: `src/utils/notifier.ts` [新建]

**实现内容**:
- `success()`: 成功通知（仅生产模式，3000ms）
- `error()`: 错误通知（始终显示，5000ms）
- `warn()`: 警告通知（仅生产模式，4000ms）
- `loading()`: 加载通知（仅开发模式，2000ms）

**验收标准**:
- ✅ 生产模式下通知简洁友好
- ✅ 开发模式下不频繁弹出通知
- ✅ 错误通知始终显示
- ✅ 通知持续时间合理

---

## 任务 5.3: 创建 RetryHelper 重试机制

**文件**: `src/utils/retry-helper.ts` [新建]

**实现内容**:
- 泛型方法 `withRetry<T>()`
- 支持配置: maxRetries, delay, onRetry
- 默认重试 3 次，延迟 1000ms

**验收标准**:
- ✅ 网络错误自动重试最多 3 次
- ✅ 重试间隔合理
- ✅ 重试日志清晰
- ✅ 多次失败后抛出错误

---

## 任务 5.4: 集成到 LikedSongsManager

**文件**: `src/managers/liked-songs-manager.ts`

**修改内容**:
- 修改 `fetchLikedSongs()` 方法
- 使用 `RetryHelper.withRetry()` 包裹 API 调用
- 配置重试参数: maxRetries=3, delay=2000

**验收标准**:
- ✅ 现有功能不受影响
- ✅ 网络错误自动重试
- ✅ TypeScript 编译无错误

---

## 任务 5.5: 创建日志规范文档

**文件**: `.claude/plan/logging-standard.md` [新建]

**文档内容**:
- 日志级别说明
- 使用示例
- 最佳实践
- 开发/生产模式差异

**验收标准**:
- ✅ 文档结构清晰
- ✅ 包含所有日志方法的说明
- ✅ 提供实际使用示例

---

## 执行顺序

1. 任务 5.1 (Logger 增强) - 基础设施
2. 任务 5.2 和 5.3 (Notifier 和 RetryHelper) - 并行
3. 任务 5.4 (集成到 Manager) - 应用
4. 任务 5.5 (文档) - 记录

---

## 总体验收标准

- ✅ 所有 TypeScript 编译无错误
- ✅ 开发模式日志详细，生产模式简洁
- ✅ 错误重试机制生效
- ✅ 通知显示符合预期
- ✅ 文档完整清晰
