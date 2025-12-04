# LikedSongs 分页加载与缓存优化 - 执行计划

> **任务来源**: `.claude/plan/likedsongs-feature-1.md` 阶段 4
> **执行时间**: 2025-12-04
> **执行者**: 幽浮喵 (AI 助手)

---

## 任务概述

实现 LikedSongs 的分页加载、增量更新和混合更新机制（定时轮询 + 事件监听）。

### 核心目标

1. **任务 4.1**: 实现分页加载完整数据
2. **任务 4.2**: 实现增量更新逻辑
3. **任务 4.3**: 实现混合更新机制（事件监听 + 定时轮询）

### 技术约束

- 分页间隔: 500ms
- 定时轮询: 3 分钟
- 防抖间隔: 5 秒
- 事件监听失败不影响核心功能

---

## 执行方案

### 方案选择: 渐进式实现

按照 4.1 → 4.2 → 4.3 的顺序逐步实现，每个任务完成后进行测试验证。

### 特殊处理

1. **事件监听**: 先分析 `spicetify.d.ts`，如无合适 API 则标记 TODO
2. **错误处理**: 添加基础 try-catch，详细重试机制留到阶段 5
3. **日志输出**: 使用 `Logger.debug()` 便于手动测试
4. **断点续传**: 简单实现，从 `cache.tracks.size` 继续加载

---

## 任务 4.1: 分页加载完整数据

### 实现内容

在 `src/managers/LikedSongsManager.ts` 中添加 `loadAllData()` 方法。

### 关键功能

- 支持加载全部 LikedSongs
- 从当前缓存大小继续加载（断点续传）
- 500ms 间隔防止限流
- 详细的进度日志输出

### 代码结构

```typescript
static async loadAllData(): Promise<void> {
  // 1. 检查加载锁
  // 2. 获取配置参数
  // 3. 计算起始偏移量
  // 4. 循环加载
  //    - 调用 fetchLikedSongs()
  //    - 存入 cache.tracks
  //    - 输出进度日志
  //    - 等待 500ms
  // 5. 标记完成状态
}
```

---

## 任务 4.2: 增量更新逻辑

### 实现内容

在 `src/managers/LikedSongsManager.ts` 中添加 `updateIncremental()` 方法。

### 关键功能

- 仅加载首批数据（offset=0）
- 对比 total 判断是否有新增
- 快速检测新增歌曲（Map.has()）
- DEBUG 模式下显示新增歌曲列表

### 代码结构

```typescript
static async updateIncremental(): Promise<void> {
  // 1. 获取首批数据
  // 2. 对比 total
  // 3. 如无变化则返回
  // 4. 遍历检测新增歌曲
  // 5. 更新缓存和时间戳
}
```

---

## 任务 4.3: 混合更新机制

### 实现内容

实现定时轮询 + 事件监听的混合策略。

### 子任务

1. **分析 Spicetify API**: 查找可用的事件监听接口
2. **实现 initUpdateMechanism()**: 初始化更新机制
3. **实现 startPolling()**: 启动定时轮询
4. **实现 setupEventListeners()**: 尝试事件监听（可能标记 TODO）
5. **实现 shouldCheckUpdate()**: 防抖机制

### 代码结构

```typescript
// 初始化更新机制
private static initUpdateMechanism(): void {
  this.startPolling();
  try {
    this.setupEventListeners();
  } catch (error) {
    // 失败不影响核心功能
  }
}

// 定时轮询
private static startPolling(): void {
  setInterval(async () => {
    await this.updateIncremental();
  }, 3 * 60 * 1000);
}

// 事件监听（可能标记 TODO）
private static setupEventListeners(): void {
  // 根据 API 分析结果实现
}

// 防抖机制
private static shouldCheckUpdate(): boolean {
  // 5 秒最小间隔
}
```

---

## 涉及文件

### 需要修改
- `src/managers/LikedSongsManager.ts` - 主要实现文件

### 需要参考
- `src/types/spicetify.d.ts` - API 分析
- `src/config/api-config.ts` - 配置参数
- `src/types/liked-songs.ts` - 类型定义
- `src/utils/logger.ts` - 日志工具

---

## 测试验证

### 任务 4.1 测试
- [ ] 调用 `loadAllData()` 观察进度日志
- [ ] 验证最终数量与 Spotify 一致
- [ ] 测试断点续传（中途刷新）

### 任务 4.2 测试
- [ ] 喜欢新歌后调用 `updateIncremental()`
- [ ] 验证日志显示新增歌曲
- [ ] 验证缓存正确更新

### 任务 4.3 测试
- [ ] 验证定时轮询启动
- [ ] 等待 3 分钟观察自动更新
- [ ] 如有事件监听，测试事件响应
- [ ] 验证防抖机制

---

## 预期成果

- ✅ 完整的分页加载功能
- ✅ 高效的增量更新机制
- ✅ 可靠的定时轮询
- ⚠️ 事件监听（根据 API 可用性）

---

## 风险与缓解

1. **事件监听不可用**: 定时轮询作为基础保障
2. **性能问题**: 500ms 间隔 + 进度日志
3. **API 限流**: 间隔控制 + 防抖机制

---

> 执行计划创建时间: 2025-12-04
> 最后更新: 2025-12-04
