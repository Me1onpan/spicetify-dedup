# API 端点测试与选型 - 执行计划

> **创建时间**: 2025-12-03
> **任务**: 实现阶段 1 - API 端点测试与选型
> **方案**: 方案 1 - 严格遵循规划文档实现
> **预计工作量**: 3-4 小时

---

## 上下文信息

### 项目背景

- **项目名称**: Spicetify Dedup Extension
- **技术栈**: TypeScript + Spicetify API + React
- **构建工具**: Spicetify Creator
- **当前状态**: 模板代码阶段

### 任务目标

实现 LikedSongs 功能的第一阶段：通过对比测试 3 个候选 API，选出最优方案作为后续开发基础。

### 候选 API

1. **API A**: `sp://core-collection/unstable/@/list/tracks`
2. **API B**: `Spicetify.Platform.LibraryAPI`
3. **API C**: Spotify Web API (通过 CosmosAsync)

---

## 详细执行步骤

### 任务 1.1：创建 API 测试工具模块

#### 步骤 1.1.1：创建目录结构

- 创建 `src/utils/` 目录
- 创建 `src/config/` 目录
- 创建 `src/tests/` 目录

#### 步骤 1.1.2：实现 Logger 工具类

**文件**: `src/utils/logger.ts`

**功能**:

- 导出 `DEBUG_MODE` 常量（默认 `true`）
- 实现 `Logger` 静态类
- 方法: `debug()`, `info()`, `error()`, `perf()`, `table()`

**代码结构**:

```typescript
export const DEBUG_MODE = true;

export class Logger {
  static debug(module: string, message: string, ...args: any[]) {}
  static info(module: string, message: string, ...args: any[]) {}
  static error(module: string, message: string, error?: any) {}
  static perf(module: string, action: string, duration: number) {}
  static table(data: any[]) {}
}
```

#### 步骤 1.1.3：实现 APITester 工具类

**文件**: `src/utils/api-tester.ts`

**依赖**: `./logger`

**功能**:

- 定义 `APITestResult` 接口
- 实现 `APITester.testAPI()` - 测试单个 API
- 实现 `APITester.stabilityTest()` - 连续测试 5 次
- 私有方法 `checkAddedAtField()` - 检查数据字段

---

### 任务 1.2：实现 3 个 API 端点的测试逻辑

#### 步骤 1.2.1：实现 LikedSongsAPITest 类

**文件**: `src/tests/liked-songs-api-test.ts`

**依赖**:

- `../utils/logger`
- `../utils/api-tester`
- 全局 `Spicetify` 对象

**功能**:

- `runFullTest()` - 执行完整测试流程
- `testCoreCollectionAPI()` - 测试 API A
- `testPlatformLibraryAPI()` - 测试 API B
- `testSpotifyWebAPI()` - 测试 API C
- `runStabilityTest()` - 稳定性测试
- `printRecommendation()` - 打印推荐结论

---

### 任务 1.3：执行测试并对比结果

#### 步骤 1.3.1：修改 app.tsx 添加测试入口

**文件**: `src/app.tsx`

**修改内容**:

- 导入 `LikedSongsAPITest` 和 `DEBUG_MODE`
- 保留原有 Spicetify 加载逻辑
- DEBUG 模式下延迟 2 秒自动运行测试

**代码结构**:

```typescript
import { LikedSongsAPITest } from "./tests/liked-songs-api-test";
import { DEBUG_MODE } from "./utils/logger";

async function main() {
  while (!Spicetify?.showNotification) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (DEBUG_MODE) {
    setTimeout(async () => {
      await LikedSongsAPITest.runFullTest();
    }, 2000);
  }
}

export default main;
```

#### 步骤 1.3.2：创建测试结果文档模板

**文件**: `.claude/plan/api-test-results.md`

**内容**:

- 测试时间、版本信息
- 测试结果汇总表格
- 详细测试数据区域（占位）
- 推荐结论区域（占位）

---

### 任务 1.4：确定最终 API 方案并记录

#### 步骤 1.4.1：创建 API 配置文件（占位版本）

**文件**: `src/config/api-config.ts`

**内容**:

- 完整的配置结构
- API 端点使用占位符
- 详细的注释说明

#### 步骤 1.4.2：构建项目并验证编译

**操作**: `npm run build`

**验证**:

- TypeScript 编译无错误
- 所有导入路径正确
- 全局 `Spicetify` 类型可用

---

## 文件清单

### 新建文件

1. `src/utils/logger.ts` - 日志工具类
2. `src/utils/api-tester.ts` - API 测试工具类
3. `src/tests/liked-songs-api-test.ts` - 测试脚本
4. `src/config/api-config.ts` - API 配置文件（占位）
5. `.claude/plan/api-test-results.md` - 测试结果文档模板

### 修改文件

1. `src/app.tsx` - 添加测试入口

---

## 依赖关系图

```
app.tsx
  └─ liked-songs-api-test.ts
       ├─ api-tester.ts
       │    └─ logger.ts
       └─ logger.ts
```

---

## 验收标准

阶段 1 完成标准：

- [ ] Logger 类能够正确控制日志输出
- [ ] APITester 能够测量 API 响应时间
- [ ] 所有日志正确输出到 DevTools Console
- [ ] 支持表格形式展示测试结果对比
- [ ] 3 个 API 都能正常测试
- [ ] 测试结果以表格形式展示在 Console
- [ ] 自动生成推荐结论
- [ ] 稳定性测试能够连续执行 5 次
- [ ] TypeScript 编译无错误
- [ ] DEBUG 模式下自动运行测试

---

## 用户职责

测试执行由用户完成：

1. 构建并启动 Spotify 扩展
2. 打开 Chrome DevTools Console (Ctrl+Shift+I)
3. 观察测试日志输出
4. 记录 3 个 API 的测试结果
5. 填写 `.claude/plan/api-test-results.md`
6. 将测试结果反馈给 AI
7. AI 根据结果更新 `api-config.ts`

---

## 实施注意事项

1. **类型安全**: 所有 Spicetify API 调用都有类型支持
2. **错误处理**: API 测试失败不应中断流程
3. **性能测量**: 使用 `performance.now()` 精确测量
4. **代码风格**: 遵循 TypeScript 严格模式

---

## 预计时间分配

| 任务                   | 预计时间     |
| ---------------------- | ------------ |
| 任务 1.1: 创建测试工具 | 1-1.5 小时   |
| 任务 1.2: 实现测试脚本 | 1-1.5 小时   |
| 任务 1.3: 集成与文档   | 0.5-1 小时   |
| 任务 1.4: 配置与构建   | 0.5 小时     |
| **总计**               | **3-4 小时** |

---

**执行计划版本**: v1.0
**最后更新**: 2025-12-03
