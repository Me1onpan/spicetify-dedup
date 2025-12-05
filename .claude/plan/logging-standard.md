# 日志输出规范

> **创建时间**: 2025-12-05
> **适用范围**: Spicetify Dedup 扩展项目
> **相关文件**: `src/utils/logger.ts`

---

## 概述

本文档定义了 Spicetify Dedup 扩展的日志输出规范，确保日志信息清晰、统一、易于调试。

所有日志通过 `Logger` 工具类输出到 Chrome DevTools Console，支持开发模式和生产模式的差异化输出。

---

## 日志级别说明

### 1. DEBUG - 开发模式详细日志

**用途**: 开发调试时的详细信息

**行为**:
- ✅ 仅在 `DEBUG_MODE = true` 时输出
- ❌ 生产模式下不输出

**使用场景**:
- 函数执行流程追踪
- 变量值检查
- 中间状态输出
- 开发调试信息

**输出格式**:
```
[Spicetify-Dedup] [DEBUG] [模块名] 消息内容
```

**示例**:
```typescript
Logger.debug("LikedSongsManager", "开始首次加载...");
// 输出: [Spicetify-Dedup] [DEBUG] [LikedSongsManager] 开始首次加载...

Logger.debug("APITester", "测试结果", { success: true, count: 50 });
// 输出: [Spicetify-Dedup] [DEBUG] [APITester] 测试结果 { success: true, count: 50 }
```

---

### 2. INFO - 重要信息日志

**用途**: 重要的业务信息和状态变更

**行为**:
- ✅ 始终输出（开发和生产模式）
- 📝 记录关键操作和状态

**使用场景**:
- 模块初始化完成
- 重要操作成功
- 状态变更通知
- 用户操作记录

**输出格式**:
```
[Spicetify-Dedup] [INFO] [模块名] 消息内容
```

**示例**:
```typescript
Logger.info("LikedSongsManager", "初始化完成，已加载 50/2000 首歌曲");
// 输出: [Spicetify-Dedup] [INFO] [LikedSongsManager] 初始化完成，已加载 50/2000 首歌曲

Logger.info("App", "Spicetify Dedup 扩展已启动");
// 输出: [Spicetify-Dedup] [INFO] [App] Spicetify Dedup 扩展已启动
```

---

### 3. WARN - 警告日志

**用途**: 警告信息，表示潜在问题但不影响核心功能

**行为**:
- ✅ 始终输出（开发和生产模式）
- ⚠️ 使用 `console.warn()` 输出

**使用场景**:
- 操作失败但可重试
- 配置项缺失使用默认值
- 性能问题警告
- 非致命错误

**输出格式**:
```
[Spicetify-Dedup] [WARN] [模块名] 消息内容
```

**示例**:
```typescript
Logger.warn("RetryHelper", "操作失败,2000ms 后重试 (1/3)");
// 输出: [Spicetify-Dedup] [WARN] [RetryHelper] 操作失败,2000ms 后重试 (1/3)

Logger.warn("LikedSongsManager", "数据获取失败 (offset=0),正在重试...", error);
// 输出: [Spicetify-Dedup] [WARN] [LikedSongsManager] 数据获取失败 (offset=0),正在重试... Error: ...
```

---

### 4. ERROR - 错误日志

**用途**: 错误信息，表示操作失败

**行为**:
- ✅ 始终输出（开发和生产模式）
- ❌ 使用 `console.error()` 输出
- 🔴 通常伴随异常对象

**使用场景**:
- API 调用失败
- 数据处理错误
- 初始化失败
- 致命错误

**输出格式**:
```
[Spicetify-Dedup] [ERROR] [模块名] 消息内容 Error对象
```

**示例**:
```typescript
Logger.error("LikedSongsManager", "初始化失败", error);
// 输出: [Spicetify-Dedup] [ERROR] [LikedSongsManager] 初始化失败 Error: ...

Logger.error("APITester", "API A 测试失败", error);
// 输出: [Spicetify-Dedup] [ERROR] [APITester] API A 测试失败 Error: ...
```

---

### 5. PERF - 性能测试日志

**用途**: 性能测试和耗时统计

**行为**:
- ✅ 仅在 `DEBUG_MODE = true` 时输出
- ⚡ 包含性能等级 emoji
- 📊 显示精确耗时（毫秒）

**性能等级**:
- ⚡ 快速: < 100ms
- 🚀 中等: 100ms ~ 500ms
- 🐢 慢速: > 500ms

**使用场景**:
- API 调用耗时
- 数据处理性能
- 算法效率测试
- 性能瓶颈定位

**输出格式**:
```
[Spicetify-Dedup] [PERF] [模块名] emoji 操作描述 耗时: XXms
```

**示例**:
```typescript
Logger.perf("LikedSongsManager", "获取数据 (offset=0)", 45.23);
// 输出: [Spicetify-Dedup] [PERF] [LikedSongsManager] ⚡ 获取数据 (offset=0) 耗时: 45.23ms

Logger.perf("APITester", "API B 测试", 234.56);
// 输出: [Spicetify-Dedup] [PERF] [APITester] 🚀 API B 测试 耗时: 234.56ms

Logger.perf("DataProcessor", "处理大量数据", 1234.56);
// 输出: [Spicetify-Dedup] [PERF] [DataProcessor] 🐢 处理大量数据 耗时: 1234.56ms
```

---

### 6. TABLE - 表格数据展示

**用途**: 以表格形式展示结构化数据

**行为**:
- ✅ 仅在 `DEBUG_MODE = true` 时输出
- 📊 使用 `console.table()` 输出
- 🎯 适合对比和统计数据

**使用场景**:
- API 测试结果对比
- 统计信息展示
- 配置项对比
- 数据结构查看

**输出格式**:
```
[Spicetify-Dedup] [TABLE]
(表格数据)
```

**示例**:
```typescript
const testResults = [
  { name: "API A", success: false, responseTime: 0 },
  { name: "API B", success: true, responseTime: 22.7 },
  { name: "API C", success: true, responseTime: 2525.8 }
];

Logger.table(testResults);
// 输出:
// [Spicetify-Dedup] [TABLE]
// ┌─────────┬──────────┬─────────┬──────────────┐
// │ (index) │   name   │ success │ responseTime │
// ├─────────┼──────────┼─────────┼──────────────┤
// │    0    │ 'API A'  │  false  │      0       │
// │    1    │ 'API B'  │  true   │     22.7     │
// │    2    │ 'API C'  │  true   │   2525.8     │
// └─────────┴──────────┴─────────┴──────────────┘
```

---

## 高级日志方法

### 7. GROUP - 分组日志

**用途**: 将相关日志分组，方便折叠查看

**行为**:
- ✅ 仅在 `DEBUG_MODE = true` 时输出
- 📁 使用 `console.group()` 创建可折叠分组
- 🎯 自动管理 `groupEnd()`

**使用场景**:
- 复杂操作的日志分组
- 多步骤流程追踪
- 嵌套逻辑展示

**输出格式**:
```
[Spicetify-Dedup] 分组标题
  内容1
  内容2
  ...
```

**示例**:
```typescript
Logger.group("[LikedSongsManager] 初始化流程", () => {
  console.log("步骤 1: 检查 API 可用性");
  console.log("步骤 2: 加载首批数据");
  console.log("步骤 3: 启动更新机制");
});

// 输出:
// ▼ [Spicetify-Dedup] [LikedSongsManager] 初始化流程
//     步骤 1: 检查 API 可用性
//     步骤 2: 加载首批数据
//     步骤 3: 启动更新机制
```

---

### 8. STATS - 统计信息展示

**用途**: 展示统计信息，自动格式化为分组日志

**行为**:
- ✅ 仅在 `DEBUG_MODE = true` 时输出
- 📊 自动格式化键值对
- 🎯 内部调用 `group()` 方法

**使用场景**:
- 缓存统计信息
- 性能指标汇总
- 状态信息展示

**输出格式**:
```
[Spicetify-Dedup] [模块名] 统计信息
  键1: 值1
  键2: 值2
  ...
```

**示例**:
```typescript
const stats = {
  total: 2000,
  loaded: 50,
  lastUpdated: "2025-12-05 15:30:00",
  isFullyLoaded: false
};

Logger.stats("LikedSongsManager", stats);

// 输出:
// ▼ [Spicetify-Dedup] [LikedSongsManager] 统计信息
//     total: 2000
//     loaded: 50
//     lastUpdated: 2025-12-05 15:30:00
//     isFullyLoaded: false
```

---

## 开发/生产模式差异

### DEBUG_MODE = true (开发模式)

**特点**:
- 📝 详细日志输出
- 🔍 包含调试信息
- 📊 性能测试数据
- 📁 分组和统计信息

**输出级别**:
- ✅ DEBUG
- ✅ INFO
- ✅ WARN
- ✅ ERROR
- ✅ PERF
- ✅ TABLE
- ✅ GROUP
- ✅ STATS

**适用场景**:
- 本地开发
- 功能调试
- 性能优化
- 问题排查

---

### DEBUG_MODE = false (生产模式)

**特点**:
- 📝 简洁日志输出
- ⚠️ 仅关键信息
- 🚫 不输出调试信息
- 🎯 减少性能开销

**输出级别**:
- ❌ DEBUG
- ✅ INFO
- ✅ WARN
- ✅ ERROR
- ❌ PERF
- ❌ TABLE
- ❌ GROUP
- ❌ STATS

**适用场景**:
- 生产环境
- 用户使用
- 性能敏感场景

---

## 最佳实践

### 1. 选择合适的日志级别

```typescript
// ✅ 好的做法
Logger.debug("Module", "详细的调试信息");  // 调试信息用 debug
Logger.info("Module", "初始化完成");       // 重要状态用 info
Logger.warn("Module", "配置缺失，使用默认值"); // 警告用 warn
Logger.error("Module", "操作失败", error);  // 错误用 error

// ❌ 不好的做法
Logger.info("Module", "变量 x = 123");     // 调试信息不应该用 info
Logger.error("Module", "初始化完成");      // 正常状态不应该用 error
```

---

### 2. 提供清晰的上下文信息

```typescript
// ✅ 好的做法
Logger.debug("LikedSongsManager", `正在获取数据 (offset=${offset}, limit=${limit})...`);
Logger.error("APITester", `API B 测试失败 (响应时间: ${duration}ms)`, error);

// ❌ 不好的做法
Logger.debug("LikedSongsManager", "获取数据");  // 缺少关键参数
Logger.error("APITester", "失败", error);       // 信息不明确
```

---

### 3. 使用性能日志追踪耗时

```typescript
// ✅ 好的做法
const startTime = performance.now();
// ... 执行操作 ...
const duration = performance.now() - startTime;
Logger.perf("Module", "操作描述", duration);

// ❌ 不好的做法
Logger.debug("Module", "操作完成");  // 没有性能数据
```

---

### 4. 使用表格展示对比数据

```typescript
// ✅ 好的做法
const results = [
  { api: "A", time: 45, success: true },
  { api: "B", time: 23, success: true },
  { api: "C", time: 2500, success: false }
];
Logger.table(results);

// ❌ 不好的做法
results.forEach(r => {
  Logger.debug("Test", `API ${r.api}: ${r.time}ms`);
});
```

---

### 5. 使用分组组织复杂日志

```typescript
// ✅ 好的做法
Logger.group("[Module] 复杂操作", () => {
  Logger.debug("Module", "步骤 1");
  Logger.debug("Module", "步骤 2");
  Logger.debug("Module", "步骤 3");
});

// ❌ 不好的做法
Logger.debug("Module", "复杂操作 - 步骤 1");
Logger.debug("Module", "复杂操作 - 步骤 2");
Logger.debug("Module", "复杂操作 - 步骤 3");
```

---

### 6. 统计信息使用 stats() 方法

```typescript
// ✅ 好的做法
Logger.stats("Module", {
  total: 100,
  processed: 50,
  failed: 5
});

// ❌ 不好的做法
Logger.debug("Module", `total: 100, processed: 50, failed: 5`);
```

---

## 常见使用场景

### 场景 1: 模块初始化

```typescript
static async initialize(): Promise<void> {
  Logger.info("Module", "正在初始化...");

  try {
    Logger.debug("Module", "检查依赖...");
    // ... 初始化逻辑 ...

    Logger.info("Module", "初始化完成");

    // 开发模式下显示统计信息
    if (DEBUG_MODE) {
      Logger.stats("Module", this.getStats());
    }
  } catch (error) {
    Logger.error("Module", "初始化失败", error);
    throw error;
  }
}
```

---

### 场景 2: API 调用

```typescript
private static async fetchData(offset: number): Promise<Data> {
  const startTime = performance.now();

  try {
    Logger.debug("Module", `正在获取数据 (offset=${offset})...`);

    const response = await api.getData({ offset });

    const duration = performance.now() - startTime;
    Logger.perf("Module", `获取数据 (offset=${offset})`, duration);

    return response;
  } catch (error) {
    Logger.error("Module", `获取数据失败 (offset=${offset})`, error);
    throw error;
  }
}
```

---

### 场景 3: 测试和对比

```typescript
static async runTests(): Promise<void> {
  Logger.info("Tester", "开始测试...");

  const results = [];

  for (const api of apis) {
    const result = await this.testAPI(api);
    results.push(result);
  }

  // 表格形式展示结果
  Logger.table(results);

  // 分组展示详细信息
  Logger.group("[Tester] 测试详情", () => {
    results.forEach(r => {
      Logger.debug("Tester", `${r.name}: ${r.success ? "✅" : "❌"}`);
    });
  });
}
```

---

## 注意事项

### 1. 避免敏感信息泄露

```typescript
// ❌ 不要记录敏感信息
Logger.debug("Auth", `用户密码: ${password}`);
Logger.debug("API", `Token: ${apiToken}`);

// ✅ 记录安全的信息
Logger.debug("Auth", "用户认证成功");
Logger.debug("API", "Token 已刷新");
```

---

### 2. 控制日志数量

```typescript
// ❌ 避免在循环中大量输出日志
for (let i = 0; i < 10000; i++) {
  Logger.debug("Module", `处理第 ${i} 项`);  // 会输出 10000 条日志！
}

// ✅ 使用批量日志或定期输出
for (let i = 0; i < 10000; i++) {
  if (i % 1000 === 0) {
    Logger.debug("Module", `处理进度: ${i}/10000`);
  }
}
```

---

### 3. 使用模块名保持一致

```typescript
// ✅ 使用类名作为模块名
class LikedSongsManager {
  static method() {
    Logger.info("LikedSongsManager", "消息");
  }
}

// ❌ 模块名不一致
class LikedSongsManager {
  static method1() {
    Logger.info("Manager", "消息");  // 不一致
  }
  static method2() {
    Logger.info("LikedSongs", "消息");  // 不一致
  }
}
```

---

## 总结

- 📝 使用合适的日志级别
- 🎯 提供清晰的上下文信息
- ⚡ 追踪性能关键操作
- 📊 使用表格和分组组织复杂日志
- 🔒 避免记录敏感信息
- 🎛️ 控制日志数量
- 📌 保持模块名一致

---

> 文档最后更新：2025-12-05
