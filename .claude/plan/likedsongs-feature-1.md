# 获取用户 LikedSongs 功能 - 详细规划 (更新版)

> **规划创建时间**: 2025-12-03
> **版本**: v2.0（基于用户反馈更新）
> **预计总开发时间**: 16.5-24.5 小时
> **优先级**: 高（作为查重功能的前置依赖）

---

## 已明确的决策

### 技术选型

- **API 获取方案**: 需通过测试选择最优方案（3 个候选 API 对比测试）
  - 候选 A: `sp://core-collection/unstable/@/list/tracks`
  - 候选 B: `Spicetify.Platform.LibraryAPI`（已确认可用）
  - 候选 C: Spotify Web API
- **缓存更新策略**: 事件监听 + 定时轮询混合方案（方案 A）
- **日志策略**: 开发模式详细日志 + 生产模式静默加载
- **分页实现**: 支持增量加载,减少首次启动压力

### 开发规范

- 所有测试日志输出到 Chrome DevTools Console
- 实现 DEBUG 模式开关控制日志输出
- 定时轮询间隔: 3 分钟
- 事件监听作为可选增强,失败不影响核心功能

---

## 整体规划概述

### 项目目标

实现 LikedSongs（我喜欢的音乐）的本地缓存管理,为查重功能提供数据基础。系统需要能够高效获取、缓存和更新用户的喜欢歌曲列表,同时提供友好的开发调试体验。

### 技术栈

- **语言**: TypeScript
- **运行时**: Spicetify Extension 环境
- **调试工具**: Chrome DevTools Console
- **API**: Spotify 内部 API (通过 Spicetify 封装)

### 主要阶段

1. **阶段 1**: API 端点测试与选型（新增）
2. **阶段 2**: 类型定义与数据模型设计
3. **阶段 3**: 基础数据获取实现
4. **阶段 4**: 分页加载与缓存优化
5. **阶段 5**: 错误处理与用户反馈

---

## 详细任务分解

### 阶段 1: API 端点测试与选型

**目标**: 通过实际测试选择最适合的 API 端点,确保后续开发建立在可靠基础上

---

#### 任务 1.1: 创建 API 测试工具模块

**目标**: 建立统一的 API 测试框架,支持对比测试多个候选 API

**输入**:

- Spicetify API 文档
- 3 个候选 API 端点信息

**输出**:

- `src/utils/api-tester.ts` - API 测试工具类
- `src/config/debug.ts` - DEBUG 模式配置
- `src/utils/logger.ts` - 日志工具类

**涉及文件**:

```
src/
├── utils/
│   ├── api-tester.ts       [新建]
│   └── logger.ts            [新建]
└── config/
    └── debug.ts             [新建]
```

**实现要点**:

1. **Logger 工具类** (`src/utils/logger.ts`)

```typescript
export const DEBUG_MODE = true; // 发布时改为 false

export class Logger {
  /**
   * 开发模式日志（仅在 DEBUG_MODE 为 true 时输出）
   */
  static debug(module: string, message: string, ...args: any[]) {
    if (DEBUG_MODE) {
      console.log(`[${module}] ${message}`, ...args);
    }
  }

  /**
   * 信息日志（始终输出）
   */
  static info(module: string, message: string, ...args: any[]) {
    console.info(`[${module}] ${message}`, ...args);
  }

  /**
   * 错误日志（始终输出）
   */
  static error(module: string, message: string, error?: any) {
    console.error(`[${module}] ${message}`, error);
  }

  /**
   * 性能测试日志
   */
  static perf(module: string, action: string, duration: number) {
    if (DEBUG_MODE) {
      console.log(`[${module}] ⚡ ${action} 耗时: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * 表格形式展示测试结果
   */
  static table(data: any[]) {
    if (DEBUG_MODE) {
      console.table(data);
    }
  }
}
```

2. **API 测试工具** (`src/utils/api-tester.ts`)

```typescript
import { Logger } from "./logger";

interface APITestResult {
  name: string;
  success: boolean;
  responseTime: number;
  dataCount: number;
  hasAddedAt: boolean;
  supportsPagination: boolean;
  errorMessage?: string;
}

export class APITester {
  /**
   * 测试单个 API 端点
   */
  static async testAPI(
    name: string,
    fetchFn: () => Promise<any>,
    options?: {
      requiresAddedAt?: boolean;
      paginationTest?: boolean;
    }
  ): Promise<APITestResult> {
    const startTime = performance.now();
    const result: APITestResult = {
      name,
      success: false,
      responseTime: 0,
      dataCount: 0,
      hasAddedAt: false,
      supportsPagination: false,
    };

    try {
      Logger.debug("APITester", `开始测试 ${name}...`);

      const data = await fetchFn();
      const endTime = performance.now();

      result.responseTime = endTime - startTime;
      result.success = !!data;

      // 检查数据结构
      if (data) {
        result.dataCount = Array.isArray(data)
          ? data.length
          : data.items?.length || 0;
        result.hasAddedAt = this.checkAddedAtField(data);
      }

      Logger.perf("APITester", name, result.responseTime);
      Logger.debug("APITester", `${name} 测试成功`, {
        数据量: result.dataCount,
        包含添加时间: result.hasAddedAt,
      });
    } catch (error) {
      const endTime = performance.now();
      result.responseTime = endTime - startTime;
      result.errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error("APITester", `${name} 测试失败`, error);
    }

    return result;
  }

  /**
   * 连续稳定性测试
   */
  static async stabilityTest(
    name: string,
    fetchFn: () => Promise<any>,
    times: number = 5
  ): Promise<number> {
    let successCount = 0;

    Logger.debug("APITester", `开始稳定性测试 ${name} (${times} 次)...`);

    for (let i = 0; i < times; i++) {
      try {
        await fetchFn();
        successCount++;
        await new Promise((resolve) => setTimeout(resolve, 500)); // 间隔 500ms
      } catch (error) {
        Logger.error("APITester", `第 ${i + 1} 次请求失败`, error);
      }
    }

    const successRate = (successCount / times) * 100;
    Logger.info(
      "APITester",
      `${name} 稳定性: ${successRate.toFixed(1)}% (${successCount}/${times})`
    );

    return successRate;
  }

  /**
   * 检查数据是否包含 addedAt 字段
   */
  private static checkAddedAtField(data: any): boolean {
    if (Array.isArray(data)) {
      return data.length > 0 && "addedAt" in data[0];
    }
    if (data.items && Array.isArray(data.items)) {
      return data.items.length > 0 && "addedAt" in data.items[0];
    }
    return false;
  }
}
```

**验收标准**:

- ✅ Logger 类能够正确控制日志输出（DEBUG_MODE 开关有效）
- ✅ APITester 能够测量 API 响应时间
- ✅ 所有日志正确输出到 DevTools Console
- ✅ 支持表格形式展示测试结果对比

**预估工作量**: 1-2 小时

---

#### 任务 1.2: 实现 3 个 API 端点的测试逻辑

**目标**: 为每个候选 API 编写具体的测试代码

**输入**:

- 任务 1.1 创建的测试框架
- Spicetify API 文档

**输出**:

- `src/tests/liked-songs-api-test.ts` - API 对比测试脚本

**涉及文件**:

```
src/
└── tests/
    └── liked-songs-api-test.ts  [新建]
```

**实现要点**:

```typescript
import { Logger } from "../utils/logger";
import { APITester } from "../utils/api-tester";

export class LikedSongsAPITest {
  /**
   * 执行完整的 API 对比测试
   */
  static async runFullTest() {
    Logger.info(
      "LikedSongsAPITest",
      "========== 开始 LikedSongs API 对比测试 =========="
    );

    const results = [];

    // 测试 API A: sp://core-collection
    results.push(
      await APITester.testAPI("API A (core-collection)", () =>
        this.testCoreCollectionAPI()
      )
    );

    // 测试 API B: Platform.LibraryAPI
    results.push(
      await APITester.testAPI("API B (Platform.LibraryAPI)", () =>
        this.testPlatformLibraryAPI()
      )
    );

    // 测试 API C: Web API
    results.push(
      await APITester.testAPI("API C (Spotify Web API)", () =>
        this.testSpotifyWebAPI()
      )
    );

    // 展示对比结果
    Logger.table(results);

    // 稳定性测试（对成功的 API 进行）
    for (const result of results) {
      if (result.success) {
        await this.runStabilityTest(result.name);
      }
    }

    Logger.info("LikedSongsAPITest", "========== 测试完成 ==========");
    this.printRecommendation(results);
  }

  /**
   * API A: sp://core-collection/unstable/@/list/tracks
   */
  private static async testCoreCollectionAPI() {
    const response = await Spicetify.CosmosAsync.get(
      "sp://core-collection/unstable/@/list/tracks",
      { limit: 50, offset: 0 }
    );
    return response;
  }

  /**
   * API B: Spicetify.Platform.LibraryAPI
   */
  private static async testPlatformLibraryAPI() {
    if (!Spicetify.Platform?.LibraryAPI) {
      throw new Error("Platform.LibraryAPI 不可用");
    }

    const response = await Spicetify.Platform.LibraryAPI.getTracks({
      limit: 50,
      offset: 0,
    });
    return response;
  }

  /**
   * API C: Spotify Web API (通过 CosmosAsync 调用)
   */
  private static async testSpotifyWebAPI() {
    const response = await Spicetify.CosmosAsync.get(
      "https://api.spotify.com/v1/me/tracks",
      { limit: 50, offset: 0 }
    );
    return response;
  }

  /**
   * 稳定性测试
   */
  private static async runStabilityTest(apiName: string) {
    Logger.info("LikedSongsAPITest", `开始稳定性测试: ${apiName}`);

    let fetchFn: () => Promise<any>;

    if (apiName.includes("core-collection")) {
      fetchFn = () => this.testCoreCollectionAPI();
    } else if (apiName.includes("LibraryAPI")) {
      fetchFn = () => this.testPlatformLibraryAPI();
    } else {
      fetchFn = () => this.testSpotifyWebAPI();
    }

    const successRate = await APITester.stabilityTest(apiName, fetchFn, 5);
    return successRate;
  }

  /**
   * 打印推荐结论
   */
  private static printRecommendation(results: any[]) {
    const successfulAPIs = results.filter((r) => r.success);

    if (successfulAPIs.length === 0) {
      Logger.error("LikedSongsAPITest", "所有 API 测试均失败！");
      return;
    }

    // 按响应时间排序
    successfulAPIs.sort((a, b) => a.responseTime - b.responseTime);

    Logger.info("LikedSongsAPITest", "========== 推荐方案 ==========");
    Logger.info("LikedSongsAPITest", `🏆 推荐使用: ${successfulAPIs[0].name}`);
    Logger.info(
      "LikedSongsAPITest",
      `   原因: 响应最快 (${successfulAPIs[0].responseTime.toFixed(
        2
      )}ms), 数据完整`
    );
  }
}
```

**验收标准**:

- ✅ 3 个 API 都能正常测试（即使失败也能正确记录）
- ✅ 测试结果以表格形式展示在 Console
- ✅ 自动生成推荐结论
- ✅ 稳定性测试能够连续执行 5 次

**预估工作量**: 2-3 小时

---

#### 任务 1.3: 执行测试并对比结果

**目标**: 在实际 Spotify 环境中运行测试,收集数据并分析

**输入**:

- 任务 1.2 的测试脚本
- 运行中的 Spotify 客户端

**输出**:

- Console 中的测试结果数据
- API 对比分析文档（Markdown 格式）

**涉及文件**:

- `src/app.tsx` [修改 - 添加测试触发代码]
- `.claude/plan/api-test-results.md` [新建 - 测试结果文档]

**实现要点**:

1. **在 app.tsx 中添加测试入口**

```typescript
import { LikedSongsAPITest } from "./tests/liked-songs-api-test";
import { DEBUG_MODE } from "./utils/logger";

async function main() {
  // 等待 Spicetify 加载
  while (!Spicetify?.showNotification) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // 开发模式下自动运行 API 测试
  if (DEBUG_MODE) {
    // 延迟 2 秒确保 Spotify 完全加载
    setTimeout(async () => {
      await LikedSongsAPITest.runFullTest();
    }, 2000);
  }
}

export default main;
```

2. **测试执行检查清单**

   - [ ] 打开 Spotify 并启用扩展
   - [ ] 打开 DevTools Console (Ctrl+Shift+I)
   - [ ] 观察测试日志输出
   - [ ] 记录表格形式的测试结果
   - [ ] 记录稳定性测试结果
   - [ ] 检查每个 API 返回的数据结构
   - [ ] 验证 addedAt 字段是否存在

3. **测试结果文档模板** (`.claude/plan/api-test-results.md`)

````markdown
# LikedSongs API 测试结果

**测试时间**: YYYY-MM-DD HH:mm:ss
**Spotify 版本**: [记录版本号]
**Spicetify 版本**: [记录版本号]

## 测试结果汇总

| API 名称 | 可用性 | 响应时间 | 数据量 | addedAt | 分页支持 | 稳定性 |
| -------- | ------ | -------- | ------ | ------- | -------- | ------ |
| API A    | ✅/❌  | XXms     | XX 条  | ✅/❌   | ✅/❌    | XX%    |
| API B    | ✅/❌  | XXms     | XX 条  | ✅/❌   | ✅/❌    | XX%    |
| API C    | ✅/❌  | XXms     | XX 条  | ✅/❌   | ✅/❌    | XX%    |

## 详细测试数据

### API A: sp://core-collection

- **响应示例**:
  ```json
  [粘贴实际返回的 JSON 数据]
  ```
````

- **优点**: [列出优点]
- **缺点**: [列出缺点]

[重复 API B 和 API C]

## 推荐结论

**推荐使用**: [API 名称]

**理由**:

1. [理由 1]
2. [理由 2]
3. [理由 3]

**注意事项**:

- [需要注意的问题]

````

**验收标准**:
- ✅ 所有 3 个 API 都完成测试
- ✅ Console 输出完整的测试日志和表格
- ✅ 测试结果文档包含真实数据
- ✅ 稳定性测试至少运行 5 次
- ✅ 有明确的推荐结论

**预估工作量**: 1-2 小时（包括测试执行和文档记录）

---

#### 任务 1.4: 确定最终 API 方案并记录

**目标**: 基于测试结果做出技术决策,并更新项目文档

**输入**:
- 任务 1.3 的测试结果文档
- 对比分析数据

**输出**:
- 最终选定的 API 方案
- 更新 `CLAUDE.md` 中的技术决策部分
- 代码注释说明选型理由

**涉及文件**:
- `CLAUDE.md` [修改]
- `src/config/api-config.ts` [新建]

**实现要点**:

1. **创建 API 配置文件** (`src/config/api-config.ts`)
```typescript
/**
 * LikedSongs API 配置
 *
 * 选型依据（YYYY-MM-DD 测试）:
 * - 测试了 3 个候选 API
 * - 最终选择: [API 名称]
 * - 选择理由:
 *   1. 响应速度: XXms (最快/次快)
 *   2. 数据完整性: 包含 addedAt 字段
 *   3. 稳定性: XX% (连续 5 次测试)
 *   4. 分页支持: 良好
 *
 * 详见: .claude/plan/api-test-results.md
 */

export const LIKED_SONGS_API_CONFIG = {
  // 选定的 API 端点
  endpoint: 'sp://core-collection/unstable/@/list/tracks', // 示例,根据实际测试结果修改

  // 分页配置
  pagination: {
    defaultLimit: 50,
    maxLimit: 100
  },

  // 缓存配置
  cache: {
    updateInterval: 3 * 60 * 1000, // 3 分钟
    enableEventListener: true // 是否启用事件监听增强
  }
} as const;
````

2. **更新 CLAUDE.md**

```markdown
### LikedSongs 功能技术决策 (YYYY-MM-DD)

#### API 选型

经过对比测试 3 个候选 API,最终选择: **[API 名称]**

- **测试方法**: 连续 5 次请求,对比响应时间、数据完整性、稳定性
- **测试结果**: 详见 `.claude/plan/api-test-results.md`
- **选择理由**:
  1. 响应速度: XXms
  2. 数据完整性: 包含 track、addedAt 等必要字段
  3. 稳定性: XX% 成功率
  4. 分页支持: 良好

#### 缓存更新策略

- **方案**: 事件监听 + 定时轮询混合
- **轮询间隔**: 3 分钟
- **事件监听**: 可选增强（失败不影响核心功能）
```

**验收标准**:

- ✅ API 配置文件包含详细的选型说明
- ✅ CLAUDE.md 更新了技术决策章节
- ✅ 代码注释引用了测试结果文档
- ✅ 团队成员能够理解选型依据

**预估工作量**: 0.5-1 小时

---

### 阶段 2: 类型定义与数据模型设计

**目标**: 基于选定的 API,定义 TypeScript 类型系统

---

#### 任务 2.1: 定义 LikedSongs 相关类型

**目标**: 创建完整的类型定义,确保类型安全

**输入**:

- 任务 1.4 确定的 API 响应结构
- Spotify API 数据格式

**输出**:

- `src/types/liked-songs.ts` - LikedSongs 类型定义

**涉及文件**:

```
src/
└── types/
    └── liked-songs.ts  [新建]
```

**实现要点**:

```typescript
/**
 * LikedSongs 数据模型
 * 基于 [选定的 API 名称] 的响应结构设计
 */

/**
 * 单个喜欢的歌曲项
 */
export interface LikedSongItem {
  /** 歌曲 URI (spotify:track:xxx) */
  uri: string;

  /** 歌曲名称 */
  name: string;

  /** 艺术家列表 */
  artists: Array<{
    name: string;
    uri: string;
  }>;

  /** 专辑信息 */
  album: {
    name: string;
    uri: string;
  };

  /** 添加到 LikedSongs 的时间（ISO 8601 格式） */
  addedAt: string;

  /** 歌曲时长（毫秒） */
  duration: number;
}

/**
 * LikedSongs 响应数据
 */
export interface LikedSongsResponse {
  /** 歌曲列表 */
  items: LikedSongItem[];

  /** 总数量 */
  total: number;

  /** 当前偏移量 */
  offset: number;

  /** 本次返回数量 */
  limit: number;
}

/**
 * LikedSongs 缓存结构
 */
export interface LikedSongsCache {
  /** 歌曲列表（以 URI 为 key） */
  tracks: Map<string, LikedSongItem>;

  /** 总数量 */
  total: number;

  /** 最后更新时间 */
  lastUpdated: number;

  /** 是否已完整加载 */
  isFullyLoaded: boolean;
}

/**
 * 更新策略配置
 */
export interface UpdateStrategyConfig {
  /** 轮询间隔（毫秒） */
  pollingInterval: number;

  /** 是否启用事件监听 */
  enableEventListener: boolean;

  /** 单次加载数量 */
  batchSize: number;
}
```

**验收标准**:

- ✅ 类型定义与实际 API 响应匹配
- ✅ 包含缓存管理所需的全部字段
- ✅ 使用 Map 结构优化查询性能
- ✅ 添加详细的 JSDoc 注释

**预估工作量**: 1 小时

---

### 阶段 3: 基础数据获取实现

**目标**: 实现基本的数据获取和缓存逻辑

---

#### 任务 3.1: 实现 LikedSongs 管理器基础类

**目标**: 创建核心管理类,封装数据获取逻辑

**输入**:

- 阶段 2 的类型定义
- 阶段 1 确定的 API 配置

**输出**:

- `src/managers/LikedSongsManager.ts` - 核心管理类

**涉及文件**:

```
src/
└── managers/
    └── LikedSongsManager.ts  [新建]
```

**实现要点**:

```typescript
import { Logger } from "../utils/logger";
import { LIKED_SONGS_API_CONFIG } from "../config/api-config";
import type {
  LikedSongsCache,
  LikedSongItem,
  LikedSongsResponse,
} from "../types/liked-songs";

export class LikedSongsManager {
  private static cache: LikedSongsCache = {
    tracks: new Map(),
    total: 0,
    lastUpdated: 0,
    isFullyLoaded: false,
  };

  private static isLoading = false;

  /**
   * 初始化管理器
   */
  static async initialize() {
    Logger.info("LikedSongsManager", "正在初始化...");

    try {
      // 首次加载
      await this.loadInitialData();

      // 启动更新机制
      this.initUpdateMechanism();

      Logger.info(
        "LikedSongsManager",
        `初始化完成,已加载 ${this.cache.total} 首歌曲`
      );

      // 生产模式下显示通知
      if (!DEBUG_MODE) {
        Spicetify.showNotification(
          `LikedSongs 已加载 (${this.cache.total} 首)`
        );
      }
    } catch (error) {
      Logger.error("LikedSongsManager", "初始化失败", error);
      throw error;
    }
  }

  /**
   * 首次加载数据
   */
  private static async loadInitialData() {
    Logger.debug("LikedSongsManager", "开始首次加载...");

    const firstBatch = await this.fetchLikedSongs(
      0,
      LIKED_SONGS_API_CONFIG.pagination.defaultLimit
    );

    this.cache.total = firstBatch.total;
    firstBatch.items.forEach((item) => {
      this.cache.tracks.set(item.uri, item);
    });

    this.cache.lastUpdated = Date.now();

    Logger.debug(
      "LikedSongsManager",
      `首批加载完成: ${firstBatch.items.length}/${firstBatch.total}`
    );
  }

  /**
   * 获取 LikedSongs 数据
   */
  private static async fetchLikedSongs(
    offset: number,
    limit: number
  ): Promise<LikedSongsResponse> {
    const startTime = performance.now();

    try {
      // 根据选定的 API 调用（这里以 core-collection 为例）
      const response = await Spicetify.CosmosAsync.get(
        LIKED_SONGS_API_CONFIG.endpoint,
        { offset, limit }
      );

      const duration = performance.now() - startTime;
      Logger.perf("LikedSongsManager", `获取数据 (offset=${offset})`, duration);

      return response;
    } catch (error) {
      Logger.error(
        "LikedSongsManager",
        `获取数据失败 (offset=${offset})`,
        error
      );
      throw error;
    }
  }

  /**
   * 检查歌曲是否在 LikedSongs 中
   */
  static isLiked(trackUri: string): boolean {
    return this.cache.tracks.has(trackUri);
  }

  /**
   * 获取缓存统计信息
   */
  static getStats() {
    return {
      total: this.cache.total,
      loaded: this.cache.tracks.size,
      lastUpdated: new Date(this.cache.lastUpdated).toLocaleString(),
      isFullyLoaded: this.cache.isFullyLoaded,
    };
  }

  /**
   * 初始化更新机制（将在任务 4.3 中实现）
   */
  private static initUpdateMechanism() {
    // 占位,阶段 4 实现
    Logger.debug("LikedSongsManager", "更新机制将在阶段 4 实现");
  }
}
```

**验收标准**:

- ✅ 能够成功获取首批数据
- ✅ 数据存储在 Map 结构中
- ✅ `isLiked()` 方法能够快速查询
- ✅ 日志输出清晰（DEBUG 模式下）
- ✅ 错误处理完善

**预估工作量**: 2-3 小时

---

#### 任务 3.2: 集成到扩展入口

**目标**: 在扩展启动时自动初始化 LikedSongs 管理器

**输入**:

- 任务 3.1 的管理器类

**输出**:

- 修改后的 `src/app.tsx`

**涉及文件**:

- `src/app.tsx` [修改]

**实现要点**:

```typescript
import { LikedSongsManager } from "./managers/LikedSongsManager";
import { Logger } from "./utils/logger";
import { DEBUG_MODE } from "./utils/logger";

async function main() {
  // 等待 Spicetify 加载
  while (!Spicetify?.showNotification) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  Logger.info("App", "Spicetify Dedup 扩展已启动");

  try {
    // 初始化 LikedSongs 管理器
    await LikedSongsManager.initialize();

    // 开发模式下输出统计信息
    if (DEBUG_MODE) {
      const stats = LikedSongsManager.getStats();
      Logger.table([stats]);
    }
  } catch (error) {
    Logger.error("App", "初始化失败", error);
    Spicetify.showNotification("Dedup 扩展初始化失败", true);
  }
}

export default main;
```

**验收标准**:

- ✅ 扩展启动时自动加载 LikedSongs
- ✅ 开发模式下显示详细日志
- ✅ 生产模式下静默加载
- ✅ 错误时显示用户友好的通知

**预估工作量**: 0.5 小时

---

### 阶段 4: 分页加载与缓存优化

**目标**: 实现完整数据加载和智能更新机制

---

#### 任务 4.1: 实现分页加载完整数据

**目标**: 支持加载用户的全部 LikedSongs

**输入**:

- 任务 3.1 的基础管理器

**输出**:

- 增强的 `LikedSongsManager.ts`（添加分页逻辑）

**涉及文件**:

- `src/managers/LikedSongsManager.ts` [修改]

**实现要点**:

```typescript
/**
 * 加载全部数据（分页）
 */
static async loadAllData() {
  if (this.isLoading) {
    Logger.debug('LikedSongsManager', '正在加载中,跳过重复请求');
    return;
  }

  this.isLoading = true;
  Logger.info('LikedSongsManager', '开始加载全部数据...');

  try {
    const { defaultLimit } = LIKED_SONGS_API_CONFIG.pagination;
    let offset = this.cache.tracks.size; // 从已加载位置继续
    const total = this.cache.total;

    while (offset < total) {
      const batch = await this.fetchLikedSongs(offset, defaultLimit);

      batch.items.forEach(item => {
        this.cache.tracks.set(item.uri, item);
      });

      offset += batch.items.length;

      Logger.debug('LikedSongsManager', `加载进度: ${offset}/${total}`);

      // 间隔 500ms,避免频繁请求
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.cache.isFullyLoaded = true;
    this.cache.lastUpdated = Date.now();

    Logger.info('LikedSongsManager', `全部数据加载完成: ${this.cache.tracks.size} 首`);

  } catch (error) {
    Logger.error('LikedSongsManager', '加载全部数据失败', error);
  } finally {
    this.isLoading = false;
  }
}
```

**验收标准**:

- ✅ 能够加载超过 1000 首歌曲的大型歌单
- ✅ 加载进度清晰展示在日志中
- ✅ 请求间隔合理,不会触发限流
- ✅ 支持断点续传（从已加载位置继续）

**预估工作量**: 1-2 小时

---

#### 任务 4.2: 实现增量更新逻辑

**目标**: 高效更新缓存,仅加载新增歌曲

**输入**:

- 任务 4.1 的分页加载逻辑

**输出**:

- 增强的 `LikedSongsManager.ts`（添加增量更新）

**涉及文件**:

- `src/managers/LikedSongsManager.ts` [修改]

**实现要点**:

```typescript
/**
 * 增量更新（仅加载新增歌曲）
 */
static async updateIncremental() {
  Logger.debug('LikedSongsManager', '开始增量更新...');

  try {
    // 获取最新的首批数据
    const firstBatch = await this.fetchLikedSongs(0, LIKED_SONGS_API_CONFIG.pagination.defaultLimit);

    const currentTotal = this.cache.total;
    const newTotal = firstBatch.total;

    if (newTotal === currentTotal) {
      Logger.debug('LikedSongsManager', '无新增歌曲');
      return;
    }

    Logger.info('LikedSongsManager', `检测到新增歌曲: ${newTotal - currentTotal} 首`);

    // 更新总数
    this.cache.total = newTotal;

    // 遍历首批数据,查找新增歌曲
    const newTracks: LikedSongItem[] = [];
    for (const item of firstBatch.items) {
      if (!this.cache.tracks.has(item.uri)) {
        newTracks.push(item);
        this.cache.tracks.set(item.uri, item);
      }
    }

    this.cache.lastUpdated = Date.now();

    if (newTracks.length > 0) {
      Logger.info('LikedSongsManager', `增量更新完成: 新增 ${newTracks.length} 首`);

      // 开发模式下显示新增歌曲
      if (DEBUG_MODE) {
        Logger.debug('LikedSongsManager', '新增歌曲:', newTracks.map(t => t.name));
      }
    }

  } catch (error) {
    Logger.error('LikedSongsManager', '增量更新失败', error);
  }
}
```

**验收标准**:

- ✅ 能够检测到新增歌曲
- ✅ 仅加载必要的数据,不重复加载
- ✅ 更新后 total 和 tracks 保持一致
- ✅ 开发模式下显示新增歌曲列表

**预估工作量**: 1-2 小时

---

#### 任务 4.3: 实现混合更新机制（事件监听 + 定时轮询）

**目标**: 实现用户反馈的方案 A - 事件监听和定时轮询混合策略

**输入**:

- 任务 4.2 的增量更新逻辑
- 用户反馈的更新策略需求

**输出**:

- 完整的更新机制实现

**涉及文件**:

- `src/managers/LikedSongsManager.ts` [修改]

**实现要点**:

```typescript
/**
 * 初始化更新机制
 * 策略: 事件监听 + 定时轮询混合
 */
private static initUpdateMechanism() {
  Logger.info('LikedSongsManager', '初始化更新机制（事件监听 + 定时轮询）');

  // 1. 定时轮询（基础保障）
  this.startPolling();

  // 2. 尝试事件监听（可选增强）
  try {
    this.setupEventListeners();
  } catch (error) {
    Logger.error('LikedSongsManager', '事件监听初始化失败,仅使用定时轮询', error);
  }
}

/**
 * 启动定时轮询
 */
private static startPolling() {
  const interval = LIKED_SONGS_API_CONFIG.cache.updateInterval;

  Logger.debug('LikedSongsManager', `启动定时轮询（间隔: ${interval / 1000}秒）`);

  setInterval(async () => {
    Logger.debug('LikedSongsManager', '定时轮询触发');
    await this.updateIncremental();
  }, interval);
}

/**
 * 尝试设置事件监听（增强功能）
 */
private static setupEventListeners() {
  if (!LIKED_SONGS_API_CONFIG.cache.enableEventListener) {
    Logger.debug('LikedSongsManager', '事件监听已禁用');
    return;
  }

  Logger.debug('LikedSongsManager', '尝试设置事件监听...');

  // 尝试监听可能的事件
  // 注意: 这些事件可能不存在,所以整个函数包裹在 try-catch 中

  // 方法 1: 尝试监听 Player 事件（可能包含 like 操作）
  try {
    Spicetify.Player.addEventListener('songchange', async () => {
      // 检查当前歌曲是否刚被喜欢
      const currentTrack = Spicetify.Player.data?.item;
      if (currentTrack && this.shouldCheckUpdate(currentTrack.uri)) {
        Logger.debug('LikedSongsManager', '歌曲变更事件触发,检查更新');
        await this.updateIncremental();
      }
    });
    Logger.debug('LikedSongsManager', '✅ 已注册 songchange 事件监听');
  } catch (error) {
    Logger.debug('LikedSongsManager', 'songchange 事件监听失败', error);
  }

  // 方法 2: 尝试监听 Platform 事件（如果可用）
  try {
    if (Spicetify.Platform?.LibraryAPI?.events) {
      Spicetify.Platform.LibraryAPI.events.addListener('update', async () => {
        Logger.debug('LikedSongsManager', 'LibraryAPI 更新事件触发');
        await this.updateIncremental();
      });
      Logger.debug('LikedSongsManager', '✅ 已注册 LibraryAPI update 事件监听');
    }
  } catch (error) {
    Logger.debug('LikedSongsManager', 'LibraryAPI 事件监听失败', error);
  }

  // 方法 3: 监听 DOM 变化（备选方案）
  // 监听"喜欢"按钮的点击（需要观察 Spotify UI 结构）
  // 这个方法比较 hack,但在其他方法失败时可以作为备选
}

/**
 * 判断是否应该检查更新
 * 避免频繁触发更新
 */
private static lastCheckTime = 0;
private static shouldCheckUpdate(trackUri: string): boolean {
  const now = Date.now();
  const minInterval = 5000; // 最小间隔 5 秒

  if (now - this.lastCheckTime < minInterval) {
    return false;
  }

  this.lastCheckTime = now;
  return true;
}
```

**验收标准**:

- ✅ 定时轮询每 3 分钟触发一次
- ✅ 事件监听失败不影响定时轮询
- ✅ 避免频繁触发更新（防抖）
- ✅ 日志清晰展示触发来源（轮询/事件）
- ✅ 可通过配置文件开关事件监听

**预估工作量**: 2-3 小时

---

### 阶段 5: 错误处理与用户反馈

**目标**: 完善日志系统和用户通知,提升开发和使用体验

---

#### 任务 5.1: 完善日志输出规范

**目标**: 统一日志格式,区分开发和生产模式

**输入**:

- 现有的 Logger 类

**输出**:

- 增强的日志工具类
- 日志输出规范文档

**涉及文件**:

- `src/utils/logger.ts` [修改]
- `.claude/plan/logging-standard.md` [新建]

**实现要点**:

1. **增强 Logger 类**

```typescript
export const DEBUG_MODE = true; // 发布时改为 false

export class Logger {
  private static readonly PREFIX = "[Spicetify-Dedup]";

  /**
   * 开发模式日志（详细）
   */
  static debug(module: string, message: string, ...args: any[]) {
    if (DEBUG_MODE) {
      console.log(`${this.PREFIX} [DEBUG] [${module}] ${message}`, ...args);
    }
  }

  /**
   * 信息日志（重要信息,生产环境也输出）
   */
  static info(module: string, message: string, ...args: any[]) {
    console.info(`${this.PREFIX} [INFO] [${module}] ${message}`, ...args);
  }

  /**
   * 警告日志
   */
  static warn(module: string, message: string, ...args: any[]) {
    console.warn(`${this.PREFIX} [WARN] [${module}] ${message}`, ...args);
  }

  /**
   * 错误日志（始终输出）
   */
  static error(module: string, message: string, error?: any) {
    console.error(`${this.PREFIX} [ERROR] [${module}] ${message}`, error);
  }

  /**
   * 性能测试日志
   */
  static perf(module: string, action: string, duration: number) {
    if (DEBUG_MODE) {
      const emoji = duration < 100 ? "⚡" : duration < 500 ? "🚀" : "🐢";
      console.log(
        `${
          this.PREFIX
        } [PERF] [${module}] ${emoji} ${action} 耗时: ${duration.toFixed(2)}ms`
      );
    }
  }

  /**
   * 表格形式展示数据
   */
  static table(data: any[]) {
    if (DEBUG_MODE) {
      console.log(`${this.PREFIX} [TABLE]`);
      console.table(data);
    }
  }

  /**
   * 分组日志（方便折叠查看）
   */
  static group(title: string, fn: () => void) {
    if (DEBUG_MODE) {
      console.group(`${this.PREFIX} ${title}`);
      fn();
      console.groupEnd();
    }
  }

  /**
   * 统计信息展示
   */
  static stats(module: string, stats: Record<string, any>) {
    if (DEBUG_MODE) {
      this.group(`[${module}] 统计信息`, () => {
        Object.entries(stats).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    }
  }
}
```

**验收标准**:

- ✅ 日志格式统一清晰
- ✅ 开发/生产模式日志输出正确
- ✅ 性能日志包含直观的 emoji 标识
- ✅ 支持分组和表格展示

**预估工作量**: 1-2 小时

---

#### 任务 5.2: 实现用户友好的通知系统

**目标**: 在生产模式下提供简洁的用户通知

**输入**:

- Spicetify 通知 API

**输出**:

- 通知工具类

**涉及文件**:

- `src/utils/notifier.ts` [新建]

**实现要点**:

```typescript
import { Logger, DEBUG_MODE } from "./logger";

export class Notifier {
  /**
   * 成功通知（仅生产模式）
   */
  static success(message: string) {
    if (!DEBUG_MODE) {
      Spicetify.showNotification(message, false, 3000);
    }
    Logger.info("Notifier", `✅ ${message}`);
  }

  /**
   * 错误通知（始终显示）
   */
  static error(message: string) {
    Spicetify.showNotification(message, true, 5000);
    Logger.error("Notifier", message);
  }

  /**
   * 警告通知
   */
  static warn(message: string) {
    if (!DEBUG_MODE) {
      Spicetify.showNotification(message, true, 4000);
    }
    Logger.warn("Notifier", message);
  }

  /**
   * 加载通知（带进度）
   */
  static loading(message: string) {
    // 仅在开发模式下显示加载通知
    if (DEBUG_MODE) {
      Spicetify.showNotification(message, false, 2000);
    }
    Logger.debug("Notifier", `⏳ ${message}`);
  }
}
```

**验收标准**:

- ✅ 生产模式下通知简洁友好
- ✅ 开发模式下不频繁弹出通知
- ✅ 错误通知始终显示
- ✅ 通知持续时间合理

**预估工作量**: 1 小时

---

#### 任务 5.3: 实现错误恢复机制

**目标**: 处理网络错误、API 失败等异常情况

**输入**:

- 现有的错误处理逻辑

**输出**:

- 增强的错误处理和重试机制

**涉及文件**:

- `src/managers/LikedSongsManager.ts` [修改]
- `src/utils/retry-helper.ts` [新建]

**实现要点**:

1. **重试工具** (`src/utils/retry-helper.ts`)

```typescript
import { Logger } from "./logger";

export class RetryHelper {
  /**
   * 带重试的异步操作
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      delay?: number;
      onRetry?: (attempt: number, error: any) => void;
    } = {}
  ): Promise<T> {
    const { maxRetries = 3, delay = 1000, onRetry } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          Logger.warn(
            "RetryHelper",
            `操作失败,${delay}ms 后重试 (${attempt}/${maxRetries})`
          );

          onRetry?.(attempt, error);

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}
```

2. **应用到 fetchLikedSongs**:

```typescript
private static async fetchLikedSongs(
  offset: number,
  limit: number
): Promise<LikedSongsResponse> {
  return RetryHelper.withRetry(
    async () => {
      const response = await Spicetify.CosmosAsync.get(
        LIKED_SONGS_API_CONFIG.endpoint,
        { offset, limit }
      );
      return response;
    },
    {
      maxRetries: 3,
      delay: 2000,
      onRetry: (attempt, error) => {
        Logger.warn(
          'LikedSongsManager',
          `数据获取失败 (offset=${offset}),正在重试...`,
          error
        );
      }
    }
  );
}
```

**验收标准**:

- ✅ 网络错误自动重试最多 3 次
- ✅ 重试间隔合理（指数退避）
- ✅ 重试日志清晰
- ✅ 多次失败后抛出错误

**预估工作量**: 1-2 小时

---

## 用户决策记录

### ✅ 决策 1: 完整加载时机

**已选择方案**: **方案 A - 快速启动,后台加载（保守版）**

**决策时间**: 2025-12-03

**具体方案**:

- 首批加载: 50 首（快速启动）
- 后台加载: 50 首/批,间隔 500ms
- 性能估算: 2000 首约需 25 秒
- 后续调整: 用户会根据实际测试结果调整 `defaultLimit` 参数

**选择理由**:

1. 启动速度快,用户体验好
2. 保守参数,不会触发 Spotify 限流
3. 稳定可靠,适合初期实现
4. 后续可根据测试结果优化

---

### ✅ 决策 2: 事件监听探索深度

**已选择方案**: **方案 A - 基础实现,依赖定时轮询**

**决策时间**: 2025-12-03

**具体方案**:

- 定时轮询作为基础保障（每 3 分钟）
- 事件监听作为可选增强
- 事件监听失败不影响核心功能
- 后续用户可能深入优化事件监听

**选择理由**:

1. 开发快速,风险低
2. 定时轮询保证基础功能可用
3. 为后续优化预留空间

---

## 实施计划

### 当前状态

- ✅ 规划已完成
- ✅ 用户决策已确认
- ⏳ 等待用户命令开始执行

### 执行流程

1. **阶段 1**: API 端点测试与选型

   - 浮浮酱实现测试代码
   - 用户执行测试并提供结果
   - 根据测试结果确定最终 API

2. **阶段 2-5**: 按规划顺序实施
   - 类型定义
   - 基础数据获取
   - 分页加载与缓存优化
   - 错误处理与用户反馈

### 测试流程说明

用户将负责执行 API 测试并记录结果:

1. 启动 Spotify 并打开 DevTools Console
2. 观察测试日志输出
3. 记录 3 个 API 的测试结果
4. 将测试结果反馈给浮浮酱
5. 浮浮酱根据结果确定最终 API 方案

---

## 用户反馈区域

```
用户补充内容:

2025-12-03:
- 确认使用方案 A（保守版）进行加载
- 确认使用基础事件监听方案
- 后续会根据测试结果调整 defaultLimit
- 用户将负责执行 API 测试并提供结果
```

---

## 总结

### 任务清单

- [ ] **阶段 1**: API 端点测试与选型

  - [ ] 1.1 创建 API 测试工具模块
  - [ ] 1.2 实现 3 个 API 端点的测试逻辑
  - [ ] 1.3 执行测试并对比结果
  - [ ] 1.4 确定最终 API 方案并记录

- [ ] **阶段 2**: 类型定义与数据模型设计

  - [ ] 2.1 定义 LikedSongs 相关类型

- [ ] **阶段 3**: 基础数据获取实现

  - [ ] 3.1 实现 LikedSongs 管理器基础类
  - [ ] 3.2 集成到扩展入口

- [ ] **阶段 4**: 分页加载与缓存优化

  - [ ] 4.1 实现分页加载完整数据
  - [ ] 4.2 实现增量更新逻辑
  - [ ] 4.3 实现混合更新机制（事件监听 + 定时轮询）

- [ ] **阶段 5**: 错误处理与用户反馈
  - [ ] 5.1 完善日志输出规范
  - [ ] 5.2 实现用户友好的通知系统
  - [ ] 5.3 实现错误恢复机制

### 预估总工作量

- **阶段 1**: 6-8 小时
- **阶段 2**: 1 小时
- **阶段 3**: 2.5-3.5 小时
- **阶段 4**: 4-7 小时
- **阶段 5**: 3-5 小时

**总计**: 16.5-24.5 小时

### 关键风险

1. **API 可用性**: 候选 API 可能在新版本 Spotify 中失效

   - 缓解: 测试阶段充分验证,记录替代方案

2. **事件监听不可靠**: Spotify 可能不提供可靠的事件监听接口

   - 缓解: 定时轮询作为基础保障

3. **性能问题**: 大型歌单（>10000 首）加载缓慢
   - 缓解: 分批加载 + 后台处理

---

**规划文档版本**: v2.0（基于用户反馈更新）
**最后更新时间**: 2025-12-03
