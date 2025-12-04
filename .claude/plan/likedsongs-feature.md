# 获取用户 LikedSongs 功能 - 详细规划

> **规划创建时间**: 2025-12-02
> **预计总开发时间**: 8-10 小时
> **优先级**: 高（作为查重功能的前置依赖）

---

## 已明确的决策

- **技术栈**: TypeScript + React + Spicetify Creator
- **API 方式**: 使用 Spicetify.CosmosAsync 获取 LikedSongs 数据
- **数据源**: Spotify Web API 通过 CosmosAsync 封装
- **缓存策略**: 首次加载全量,后续增量更新
- **分页处理**: 使用 Spotify API 的 offset/limit 分页机制

---

## 整体规划概述

### 项目目标

实现获取用户"喜欢的歌曲"（LikedSongs）列表的功能,作为查重功能的数据基础。该功能需要：

1. 完整获取用户所有喜欢的歌曲数据
2. 处理大量歌曲的分页加载（Spotify 用户可能有数千首喜欢的歌曲）
3. 提供高效的数据缓存和更新机制
4. 具备良好的错误处理和用户反馈

### 技术栈

- **框架**: Spicetify Creator
- **语言**: TypeScript
- **API**: Spicetify.CosmosAsync (Spotify 内部 API)
- **存储**: LocalStorage / Spicetify.LocalStorage
- **UI**: React (通过 Spicetify.React)

### 主要阶段

1. **阶段 1：API 调研与类型定义**
2. **阶段 2：基础数据获取实现**
3. **阶段 3：分页加载与缓存优化**
4. **阶段 4：错误处理与用户反馈**

---

## 详细任务分解

### 阶段 1：API 调研与类型定义

#### 任务 1.1：调研 Spotify LikedSongs API

- **目标**: 确定获取 LikedSongs 的正确 API 端点和参数格式
- **输入**:
  - Spicetify 官方文档
  - Chrome DevTools Network 面板（观察 Spotify Web 的实际请求）
  - Spicetify.CosmosAsync 类型定义
- **输出**:
  - API 端点 URL 格式（预期为 `sp://core-collection/unstable/@/list/tracks`）
  - 请求参数结构
  - 响应数据格式示例
- **涉及文件**:
  - 无需修改代码,仅记录调研结果
- **预估工作量**: 30-60 分钟

**具体步骤**：

1. 打开 Spotify 客户端并进入"喜欢的歌曲"页面
2. 按 `Ctrl + Shift + I` 打开 DevTools
3. 切换到 Network 标签,筛选 Fetch/XHR 请求
4. 滚动歌单触发加载,观察请求 URL 和参数
5. 记录以下信息：
   - 完整的 API 端点
   - 分页参数（offset, limit）
   - 响应数据结构（特别是歌曲数组的位置）
   - 总数量字段名称

#### 任务 1.2：定义 TypeScript 类型

- **目标**: 为 LikedSongs API 的请求和响应创建完整的类型定义
- **输入**:
  - 任务 1.1 的调研结果
  - 现有的 `src/types/spicetify.d.ts`
- **输出**:
  - 新的类型定义文件 `src/types/likedsongs.d.ts`
- **涉及文件**:
  - 新建 `src/types/likedsongs.d.ts`
- **预估工作量**: 30 分钟

**类型定义内容**（预期结构）：

```typescript
// src/types/likedsongs.d.ts

/** LikedSongs API 请求参数 */
export interface LikedSongsRequestParams {
  offset: number;
  limit: number;
}

/** LikedSongs API 响应数据 */
export interface LikedSongsResponse {
  totalLength: number;
  items: LikedSongItem[];
  // 其他可能的字段...
}

/** 单个喜欢的歌曲项 */
export interface LikedSongItem {
  addedAt: string; // ISO 8601 时间戳
  track: Spicetify.PlayerTrack;
  // 其他字段...
}

/** LikedSongs 缓存数据结构 */
export interface LikedSongsCacheData {
  tracks: LikedSongItem[];
  totalCount: number;
  lastUpdated: number; // Unix 时间戳
  cacheVersion: string;
}
```

---

### 阶段 2：基础数据获取实现

#### 任务 2.1：创建 LikedSongs 管理器核心类

- **目标**: 实现封装 LikedSongs 数据获取逻辑的管理器类
- **输入**:
  - 任务 1.1 和 1.2 的成果
  - Spicetify.CosmosAsync API
- **输出**:
  - 可复用的 LikedSongs 管理器类
- **涉及文件**:
  - 新建 `src/managers/LikedSongsManager.ts`
- **预估工作量**: 2 小时

**核心功能点**：

```typescript
// src/managers/LikedSongsManager.ts

export class LikedSongsManager {
  private static readonly API_ENDPOINT =
    "sp://core-collection/unstable/@/list/tracks";
  private static readonly DEFAULT_LIMIT = 50;

  /**
   * 获取单页 LikedSongs 数据
   * @param offset 起始位置
   * @param limit 每页数量（默认 50）
   */
  static async fetchPage(
    offset: number = 0,
    limit: number = DEFAULT_LIMIT
  ): Promise<LikedSongsResponse> {
    // 实现分页获取逻辑
  }

  /**
   * 获取所有 LikedSongs（自动处理分页）
   */
  static async fetchAll(): Promise<LikedSongItem[]> {
    // 实现递归/循环分页获取
  }

  /**
   * 获取 LikedSongs 总数
   */
  static async getTotalCount(): Promise<number> {
    // 仅获取第一页以获取总数
  }
}
```

**实现要点**：

1. 使用 `Spicetify.CosmosAsync.get()` 发起请求
2. 处理 API 返回的响应格式
3. 分页逻辑：循环获取直到所有数据加载完毕
4. 添加请求间隔（避免触发速率限制,建议 100-200ms）

#### 任务 2.2：编写单元测试（可选）

- **目标**: 验证 LikedSongsManager 的基础功能
- **输入**:
  - 任务 2.1 的代码
- **输出**:
  - 手动测试脚本或日志输出
- **涉及文件**:
  - `src/managers/LikedSongsManager.ts`（添加调试日志）
- **预估工作量**: 30 分钟

**测试方法**（手动测试）：

1. 在 `app.tsx` 中临时调用 LikedSongsManager
2. 使用 `Spicetify.showNotification()` 显示获取结果
3. 在 DevTools Console 中输出详细日志

```typescript
// 在 app.tsx 中临时添加测试代码
async function testLikedSongs() {
  console.log("开始获取 LikedSongs...");
  const songs = await LikedSongsManager.fetchAll();
  console.log(`成功获取 ${songs.length} 首歌曲`, songs);
  Spicetify.showNotification(`获取到 ${songs.length} 首喜欢的歌曲`);
}
```

---

### 阶段 3：分页加载与缓存优化

#### 任务 3.1：实现本地缓存机制

- **目标**: 使用 LocalStorage 缓存 LikedSongs 数据,避免频繁请求
- **输入**:
  - 任务 2.1 的 LikedSongsManager
  - Spicetify.LocalStorage API
- **输出**:
  - 带缓存功能的增强版 LikedSongsManager
- **涉及文件**:
  - 修改 `src/managers/LikedSongsManager.ts`
- **预估工作量**: 1.5 小时

**缓存策略**：

1. **缓存键名**: `spicetify-dedup:likedsongs-cache`
2. **缓存有效期**: 15 分钟（可配置）
3. **缓存版本控制**: 通过 `cacheVersion` 字段管理

**新增方法**：

```typescript
export class LikedSongsManager {
  private static readonly CACHE_KEY = "spicetify-dedup:likedsongs-cache";
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 分钟

  /**
   * 从缓存获取数据
   */
  static getCached(): LikedSongsCacheData | null {
    const cached = Spicetify.LocalStorage.get(this.CACHE_KEY);
    if (!cached) return null;

    const data: LikedSongsCacheData = JSON.parse(cached);
    const now = Date.now();

    // 检查缓存是否过期
    if (now - data.lastUpdated > this.CACHE_TTL) {
      return null;
    }

    return data;
  }

  /**
   * 保存数据到缓存
   */
  static saveCache(tracks: LikedSongItem[], totalCount: number): void {
    const cacheData: LikedSongsCacheData = {
      tracks,
      totalCount,
      lastUpdated: Date.now(),
      cacheVersion: "1.0.0",
    };
    Spicetify.LocalStorage.set(this.CACHE_KEY, JSON.stringify(cacheData));
  }

  /**
   * 获取 LikedSongs（优先使用缓存）
   */
  static async get(forceRefresh: boolean = false): Promise<LikedSongItem[]> {
    if (!forceRefresh) {
      const cached = this.getCached();
      if (cached) {
        console.log("使用缓存的 LikedSongs 数据");
        return cached.tracks;
      }
    }

    console.log("从 API 获取 LikedSongs 数据...");
    const tracks = await this.fetchAll();
    const totalCount = tracks.length;
    this.saveCache(tracks, totalCount);
    return tracks;
  }

  /**
   * 清除缓存
   */
  static clearCache(): void {
    Spicetify.LocalStorage.remove(this.CACHE_KEY);
  }
}
```

#### 任务 3.2：优化分页加载性能

- **目标**: 实现并发分页请求,提升大量歌曲加载速度
- **输入**:
  - 任务 3.1 的代码
- **输出**:
  - 优化后的 `fetchAll()` 方法
- **涉及文件**:
  - 修改 `src/managers/LikedSongsManager.ts`
- **预估工作量**: 1 小时

**优化策略**：

1. **首次请求**: 获取第一页以确定总数
2. **并发请求**: 根据总数计算需要的请求数量,并发发起（限制并发数为 3-5）
3. **结果合并**: 按 offset 顺序合并所有分页结果

**实现示例**：

```typescript
static async fetchAll(): Promise<LikedSongItem[]> {
  // 1. 获取第一页和总数
  const firstPage = await this.fetchPage(0);
  const totalCount = firstPage.totalLength;
  const allItems = [...firstPage.items];

  // 2. 计算剩余分页数量
  const remainingCount = totalCount - this.DEFAULT_LIMIT;
  if (remainingCount <= 0) return allItems;

  const pageCount = Math.ceil(remainingCount / this.DEFAULT_LIMIT);

  // 3. 并发请求剩余分页（限制并发数）
  const CONCURRENCY = 3;
  for (let i = 0; i < pageCount; i += CONCURRENCY) {
    const promises = [];
    for (let j = 0; j < CONCURRENCY && i + j < pageCount; j++) {
      const offset = (i + j + 1) * this.DEFAULT_LIMIT;
      promises.push(this.fetchPage(offset));
    }

    const results = await Promise.all(promises);
    results.forEach(res => allItems.push(...res.items));

    // 添加延迟避免速率限制
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return allItems;
}
```

#### 任务 3.3：实现增量更新机制

- **目标**: 支持仅获取新增的喜欢歌曲,而非每次全量刷新
- **输入**:
  - 任务 3.1 的缓存数据
- **输出**:
  - 增量更新方法
- **涉及文件**:
  - 修改 `src/managers/LikedSongsManager.ts`
- **预估工作量**: 1 小时

**实现思路**：

```typescript
/**
 * 增量更新 LikedSongs（仅获取新增歌曲）
 */
static async updateIncremental(): Promise<LikedSongItem[]> {
  const cached = this.getCached();
  if (!cached) {
    // 无缓存,执行全量获取
    return await this.get(true);
  }

  // 获取第一页以检查总数变化
  const firstPage = await this.fetchPage(0);
  const currentTotal = firstPage.totalLength;
  const cachedTotal = cached.totalCount;

  if (currentTotal === cachedTotal) {
    // 数量未变化,返回缓存数据
    console.log('LikedSongs 无更新');
    return cached.tracks;
  }

  // 计算新增歌曲数量
  const newCount = currentTotal - cachedTotal;
  console.log(`检测到 ${newCount} 首新增歌曲`);

  // 获取新增歌曲（通常在列表开头）
  const newItems = await this.fetchPage(0, newCount);

  // 合并缓存数据
  const updatedTracks = [...newItems.items, ...cached.tracks];
  this.saveCache(updatedTracks, currentTotal);

  return updatedTracks;
}
```

---

### 阶段 4：错误处理与用户反馈

#### 任务 4.1：实现错误处理机制

- **目标**: 处理网络错误、API 失败等异常情况
- **输入**:
  - 任务 2.1 和 3.x 的所有方法
- **输出**:
  - 添加完善的 try-catch 和错误处理
- **涉及文件**:
  - 修改 `src/managers/LikedSongsManager.ts`
- **预估工作量**: 1 小时

**错误类型**：

1. **网络错误**: CosmosAsync 请求失败
2. **超时错误**: 请求超时
3. **数据格式错误**: API 返回格式不符合预期
4. **权限错误**: 用户未登录或权限不足

**实现要点**：

```typescript
static async fetchPage(offset: number = 0, limit: number = DEFAULT_LIMIT): Promise<LikedSongsResponse> {
  try {
    const response = await Spicetify.CosmosAsync.get(
      `${this.API_ENDPOINT}?offset=${offset}&limit=${limit}`
    );

    // 验证响应数据格式
    if (!response || typeof response.totalLength !== 'number' || !Array.isArray(response.items)) {
      throw new Error('Invalid API response format');
    }

    return response as LikedSongsResponse;
  } catch (error) {
    console.error('[LikedSongsManager] 获取数据失败:', error);

    // 根据错误类型返回不同的错误信息
    if (error instanceof TypeError) {
      throw new Error('网络连接失败,请检查网络设置');
    } else if (error.message.includes('401')) {
      throw new Error('权限不足,请重新登录 Spotify');
    } else {
      throw new Error(`获取 LikedSongs 失败: ${error.message}`);
    }
  }
}
```

#### 任务 4.2：添加用户反馈通知

- **目标**: 在加载过程中向用户展示进度和状态
- **输入**:
  - Spicetify.showNotification API
  - 任务 3.2 的分页加载逻辑
- **输出**:
  - 友好的用户提示
- **涉及文件**:
  - 修改 `src/managers/LikedSongsManager.ts`
  - 修改 `src/app.tsx`（调用时显示通知）
- **预估工作量**: 30 分钟

**反馈时机**：

1. **开始加载**: "正在获取喜欢的歌曲..."
2. **加载进度**: "已加载 500/2000 首歌曲..."
3. **完成加载**: "成功加载 2000 首歌曲"
4. **错误提示**: "加载失败: [错误信息]"

**实现示例**：

```typescript
static async fetchAll(showProgress: boolean = true): Promise<LikedSongItem[]> {
  try {
    if (showProgress) {
      Spicetify.showNotification('正在获取喜欢的歌曲...', false, 2000);
    }

    const firstPage = await this.fetchPage(0);
    const totalCount = firstPage.totalLength;
    const allItems = [...firstPage.items];

    if (showProgress && totalCount > this.DEFAULT_LIMIT) {
      Spicetify.showNotification(
        `已加载 ${allItems.length}/${totalCount} 首歌曲...`,
        false,
        1500
      );
    }

    // ... 分页加载逻辑 ...

    if (showProgress) {
      Spicetify.showNotification(`成功加载 ${allItems.length} 首歌曲`, false, 3000);
    }

    return allItems;
  } catch (error) {
    if (showProgress) {
      Spicetify.showNotification(`加载失败: ${error.message}`, true, 5000);
    }
    throw error;
  }
}
```

#### 任务 4.3：集成到扩展主入口

- **目标**: 在 `app.tsx` 中集成 LikedSongsManager
- **输入**:
  - 完整的 LikedSongsManager
- **输出**:
  - 扩展启动时自动加载 LikedSongs
- **涉及文件**:
  - 修改 `src/app.tsx`
- **预估工作量**: 30 分钟

**实现示例**：

```typescript
// src/app.tsx
import { LikedSongsManager } from "./managers/LikedSongsManager";

async function main() {
  while (!Spicetify?.showNotification) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("[Spicetify Dedup] 扩展已启动");

  // 初始化加载 LikedSongs（使用缓存）
  try {
    const likedSongs = await LikedSongsManager.get(false);
    console.log(`[Spicetify Dedup] 已加载 ${likedSongs.length} 首喜欢的歌曲`);

    // 后续可在这里调用查重功能
    // DedupChecker.checkDuplicates(likedSongs);
  } catch (error) {
    console.error("[Spicetify Dedup] 初始化失败:", error);
  }
}

export default main;
```

---

## 需要进一步明确的问题

### 问题 1：LikedSongs API 端点

**推荐方案**：

- **方案 A**: 使用 `sp://core-collection/unstable/@/list/tracks`

  - **优点**: 这是 Spotify Web 实际使用的端点（根据常见 Spicetify 扩展经验）
  - **缺点**: 端点包含 `unstable`,未来可能变更

- **方案 B**: 使用 Spotify Web API (`https://api.spotify.com/v1/me/tracks`)

  - **优点**: 官方稳定的 REST API
  - **缺点**: 需要 OAuth Token,Spicetify 环境下不一定能直接访问

- **方案 C**: 使用 `Spicetify.Platform.LibraryAPI`（如可用）
  - **优点**: Spicetify 封装的高级 API
  - **缺点**: 需要确认 API 是否存在且可用

**等待用户选择**：

```
请选择您偏好的方案,或在调研后告知实际可用的 API 端点：
[ ] 方案 A - sp://core-collection/unstable/@/list/tracks
[ ] 方案 B - Spotify Web API
[ ] 方案 C - Spicetify.Platform.LibraryAPI
[ ] 其他方案：___________
```

### 问题 2：缓存策略

**推荐方案**：

- **方案 A**: 短期缓存（15 分钟）+ 增量更新

  - **优点**: 平衡性能与数据新鲜度
  - **缺点**: 需要实现增量更新逻辑

- **方案 B**: 长期缓存（24 小时）+ 用户手动刷新

  - **优点**: 实现简单,减少 API 请求
  - **缺点**: 数据可能不够实时

- **方案 C**: 不使用缓存,每次实时获取
  - **优点**: 数据始终最新
  - **缺点**: 频繁请求可能影响性能和速率限制

**等待用户选择**：

```
请选择您偏好的缓存策略：
[ ] 方案 A - 短期缓存 + 增量更新（推荐）
[ ] 方案 B - 长期缓存 + 手动刷新
[ ] 方案 C - 不使用缓存
[ ] 其他方案：___________
```

### 问题 3：分页加载的用户体验

**推荐方案**：

- **方案 A**: 后台静默加载,加载完成后通知

  - **优点**: 不打扰用户
  - **缺点**: 用户不知道加载进度

- **方案 B**: 显示加载进度通知

  - **优点**: 用户了解加载状态
  - **缺点**: 通知可能较频繁

- **方案 C**: 显示加载进度弹窗（使用 PopupModal）
  - **优点**: 提供详细的进度信息
  - **缺点**: 实现较复杂,可能干扰用户操作

**等待用户选择**：

```
请选择您偏好的加载反馈方式：
[ ] 方案 A - 后台静默加载
[ ] 方案 B - 进度通知（推荐）
[ ] 方案 C - 进度弹窗
[ ] 其他方案：___________
```

---

## 用户反馈区域

请在此区域补充您对整体规划的意见和建议：

```
用户补充内容：

---
1. 关于 API 端点的确认：


---
2. 关于性能和缓存的考虑：


---
3. 其他建议或需求：


---
```

---

## 附录：参考资源

### Spicetify 相关文档

- [Spicetify Creator 文档](https://spicetify.app/docs/development/spicetify-creator/the-basics)
- [Spicetify API 参考](https://spicetify.app/docs/development/api-wrapper/)
- [CosmosAsync API 示例](https://github.com/spicetify/spicetify-cli/wiki/CosmosAsync)

### 类似扩展参考

- [spicetify-playlist-dedup](https://github.com/topics/spicetify-extensions) (GitHub 搜索相关扩展)
- [Spotify Web API 文档](https://developer.spotify.com/documentation/web-api/reference/get-users-saved-tracks)

### 技术细节

- **Spotify URI 格式**: `spotify:track:xxxxx`
- **LocalStorage 限制**: 通常 5-10MB,需注意大量歌曲数据的存储
- **速率限制**: Spotify API 有速率限制,建议请求间隔 100-200ms

---

## 任务清单

### 阶段 1：API 调研与类型定义

- [ ] 任务 1.1：调研 Spotify LikedSongs API
- [ ] 任务 1.2：定义 TypeScript 类型

### 阶段 2：基础数据获取实现

- [ ] 任务 2.1：创建 LikedSongs 管理器核心类
- [ ] 任务 2.2：编写单元测试（可选）

### 阶段 3：分页加载与缓存优化

- [ ] 任务 3.1：实现本地缓存机制
- [ ] 任务 3.2：优化分页加载性能
- [ ] 任务 3.3：实现增量更新机制

### 阶段 4：错误处理与用户反馈

- [ ] 任务 4.1：实现错误处理机制
- [ ] 任务 4.2：添加用户反馈通知
- [ ] 任务 4.3：集成到扩展主入口

---

> **最后更新**: 2025-12-02
> **状态**: 待确认方案选择后开始实施
