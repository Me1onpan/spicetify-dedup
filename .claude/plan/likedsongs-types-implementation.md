# LikedSongs 类型定义实现计划

> **任务**: 实现类型定义与数据模型设计（阶段 2.1）
> **创建时间**: 2025-12-04
> **状态**: 执行中

---

## 任务概述

为 LikedSongs 功能创建完整的 TypeScript 类型定义，支持查重功能的核心数据结构。

### 目标

- 创建 `src/types/liked-songs.ts` 文件
- 定义 6 个核心类型接口
- 使用 Map 结构优化缓存查询性能
- 添加完整的 JSDoc 注释

---

## 技术上下文

### 已确定的技术决策

- **API 方案**: `Spicetify.Platform.LibraryAPI.getTracks()` (ADR-001)
- **数据源**: Platform.LibraryAPI 返回的简化结构
- **缓存策略**: 使用 Map<string, LikedSongItem> 优化查询

### 参考文档

- 规划文档: `.claude/plan/likedsongs-feature-1.md`
- API 测试报告: `.claude/plan/api-test-results.md`
- Spicetify 类型: `src/types/spicetify.d.ts`

---

## 执行步骤

### 步骤 1: 创建类型定义文件
- 创建 `src/types/liked-songs.ts`
- 添加文件头部注释

### 步骤 2: 定义基础类型
- `LikedSongArtist` - 艺术家信息
- `LikedSongAlbum` - 专辑信息

### 步骤 3: 定义单个歌曲项类型
- `LikedSongItem` - 包含所有必需字段

### 步骤 4: 定义 API 响应类型
- `LikedSongsResponse` - 支持分页

### 步骤 5: 定义缓存结构类型
- `LikedSongsCache` - 使用 Map 优化查询

### 步骤 6: 定义更新策略配置类型
- `UpdateStrategyConfig` - 控制更新行为

### 步骤 7: 添加类型导出和元信息
- 确保所有类型可导出
- 添加版本信息

### 步骤 8: 验证类型定义
- 运行 TypeScript 编译检查

---

## 验收标准

- [x] 文件创建成功
- [x] 6 个类型接口定义完整
- [x] 每个字段都有 JSDoc 注释
- [x] 使用 Map 结构优化缓存
- [x] TypeScript 编译无错误
- [x] 符合 strict mode

---

## 预期产出

**文件**: `src/types/liked-songs.ts`

**类型列表**:
1. LikedSongArtist
2. LikedSongAlbum
3. LikedSongItem
4. LikedSongsResponse
5. LikedSongsCache
6. UpdateStrategyConfig

**代码行数**: 约 80-100 行（含注释）

---

## 执行记录

- **开始时间**: 2025-12-04
- **执行者**: 浮浮酱 (AI Assistant)
- **批准者**: 主人

---

> 文档最后更新: 2025-12-04
