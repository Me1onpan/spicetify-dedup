# Spicetify Dedup Extension

> Spotify PC 端查重插件 - 防止重复添加相似音乐到歌单

## 变更记录 (Changelog)

### 2025-12-05 18:30

- ✅ 完成当前播放歌曲检测功能的优化与文档（阶段 4）
- ⚡ 性能优化：
  - 修改 Logger 系统，所有日志级别都受 DEBUG_MODE 控制
  - 优化字符串拼接，使用函数形式延迟计算（避免生产模式下的无用开销）
  - 优化涉及文件：`logger.ts`、`current-track-detector.ts`、`app.tsx`、`liked-songs-manager.ts`、`api-tester.ts`
  - 预计性能提升：生产模式下减少 100% 的日志开销
- 📚 文档完善：
  - 创建使用指南：`.claude/docs/current-track-detector-usage.md`
  - 包含快速开始、基础用法、进阶用法、API 参考、常见问题、最佳实践
  - 提供 3 个完整示例：基础使用、查重集成、多回调函数
- 🎯 优化细节：
  - Logger 新增 `resolveMessage()` 方法，支持 `string | (() => string)` 类型
  - 所有高频日志调用改为函数形式，延迟计算字符串拼接
  - 保持 Player.data 访问不变（必须获取最新数据）
- 📝 文档更新：
  - 更新 CLAUDE.md 变更记录
  - 更新规划文档标记阶段 4 完成

### 2025-12-05 16:00

- ✅ 完成当前播放歌曲检测功能的集成与测试（阶段 3）
- 🎯 核心功能实现：
  - 集成 CurrentTrackDetector 到 app.tsx
  - 实现歌曲变更回调机制
  - DEBUG_MODE 下暴露到全局对象
- 🔧 问题修复：
  - 修复初始化时回调未触发问题
  - 添加 `forceCheckIgnoreCache()` 方法，忽略 URI 去重缓存
  - 确保扩展启动时已播放的歌曲能触发回调
- 🧪 测试验证：
  - 完成 5 个核心测试用例（通过率 100%）
  - 测试报告：`.claude/test/current-track-detector-test-report.md`
  - 验证场景：正常切歌、扩展重载、跨设备播放、暂停/恢复、手动触发
- 📁 新增文件：
  - `src/detectors/current-track-detector.ts` - 检测器实现
  - `src/types/current-track.ts` - 类型定义
  - `.claude/test/current-track-detector-test-report.md` - 测试报告
- 📝 文档更新：
  - 更新规划文档验收标准
  - 记录阶段 3 完成情况

### 2025-12-05 早些时候

- ✅ 完成当前播放歌曲检测功能的技术调研与方案设计（阶段 1）
- 🔬 完成 Spicetify Player API 实践调研
  - 创建测试代码：`src/tests/player-api-exploration.ts`
  - 测试报告：`.claude/research/player-api-test-results.md`
- 🏗️ 完成 CurrentTrackDetector 架构设计
  - 设计文档：`.claude/design/current-track-detector-design.md`
  - 包含类结构、时序图、错误处理策略、边界情况处理方案
- 🎯 关键设计决策：
  - 采用立即检测策略（移除延迟复查）
  - 使用 300ms 防抖 + URI 去重机制
  - 主要监听 songchange 事件
  - 暂不实现轮询备份（预留接口）

### 2025-12-03 15:59:23

- ✅ 完成 API 端点测试与选型（阶段 1.1-1.4）
- 🏆 确定使用 `Spicetify.Platform.LibraryAPI` 作为 LikedSongs 数据源
- 📊 测试报告：`.claude/plan/api-test-results.md`
- 🔧 更新 API 配置：`src/config/api-config.ts`

### 2025-12-02 13:36:16

- 初始化 AI 上下文文档
- 创建项目架构索引

---

## 项目愿景

这是一个基于 Spicetify Creator 的 Spotify 桌面扩展，旨在为 PC 端 Spotify 用户提供智能查重功能。当用户尝试将歌曲添加到歌单时，扩展会自动检测该歌曲的类似版本是否已存在于歌单中，如存在则禁止重复添加，避免歌单中出现重复或相似的音乐版本。

### 核心功能

- 实时监听音乐播放事件
- 智能识别歌曲相似版本（原版、混音、现场版等）
- 拦截重复添加操作并提供友好提示
- 支持用户自定义查重规则

---

## 架构总览

### 技术栈

- **框架**: Spicetify Creator
- **语言**: TypeScript
- **UI 库**: React (通过 Spicetify API)
- **构建工具**: esbuild (via spicetify-creator)
- **编译目标**: ES2017, CommonJS

### 项目特性

- 使用 Spicetify Creator 提供的现代化开发工作流
- 支持 TypeScript/JSX 语法和 React 组件
- 支持 CSS/SCSS 模块化样式
- 极速编译（esbuild）
- 热重载开发模式

---

## 模块结构图

```mermaid
graph TD
    Root["(根) spicetify-dedup"] --> Src["src/"];
    Src --> App["app.tsx - 扩展入口"];
    Src --> Types["types/ - 类型定义"];
    Types --> CSSTypes["css-modules.d.ts"];
    Types --> SpicetifyTypes["spicetify.d.ts"];
    Src --> Settings["settings.json"];

    Root --> Config["配置文件"];
    Config --> Package["package.json"];
    Config --> TSConfig["tsconfig.json"];
    Config --> GitIgnore[".gitignore"];

    Root --> Workflow[".spec-workflow/"];
    Workflow --> Templates["模板文件"];

    click App "./src/CLAUDE.md" "查看源代码模块文档"
```

---

## 模块索引

| 模块路径          | 职责                | 入口文件                             | 状态     |
| ----------------- | ------------------- | ------------------------------------ | -------- |
| `src/`            | 扩展源代码          | `app.tsx`                            | 模板代码 |
| `src/types/`      | TypeScript 类型定义 | `css-modules.d.ts`, `spicetify.d.ts` | 完整     |
| `.spec-workflow/` | 开发规范与模板      | -                                    | 可选     |

---

## 运行与开发

### 前置要求

- 已安装 Spicetify CLI
- Node.js 环境（用于构建）
- PC 端 Spotify 客户端

### 安装依赖

```bash
npm install
```

### 开发命令

#### 监听模式（热重载）

```bash
npm run watch
```

自动监听文件变更并重新编译，适合开发时使用。

#### 构建（生产）

```bash
npm run build
```

构建优化后的扩展代码。

#### 构建到本地（压缩）

```bash
npm run build-local
```

构建到 `dist/` 目录并进行代码压缩。

### 部署

构建完成后，扩展会自动部署到 Spicetify 扩展目录。使用以下命令应用更改：

```bash
spicetify apply
```

---

## 测试策略

### 当前状态

- 项目尚未包含自动化测试框架

### 推荐测试方法

1. **手动测试**

   - 在 Spotify 客户端中实际操作验证功能
   - 测试不同场景下的查重逻辑

2. **开发工具**

   - 使用 Chrome DevTools 调试（Spotify 基于 Electron）
   - 通过 `Spicetify.showNotification()` 输出调试信息

3. **未来改进**
   - 考虑引入 Jest 或 Vitest 进行单元测试
   - 使用 Playwright 进行 E2E 测试

---

## 技术决策记录 (ADR)

### ADR-001: LikedSongs API 选型（2025-12-03 15:59:23）

**决策**: 使用 `Spicetify.Platform.LibraryAPI` 作为获取 LikedSongs 数据的主要 API

**背景**:
项目需要访问用户的 LikedSongs（喜欢的歌曲）列表以实现查重功能。经过调研，发现有 3 个候选 API：

- API A: `sp://core-collection/unstable/@/list/tracks` (CosmosAsync)
- API B: `Spicetify.Platform.LibraryAPI.getTracks()`
- API C: Spotify Web API (`https://api.spotify.com/v1/me/tracks`)

**测试方法**:

- 创建了完整的测试框架（`src/utils/api-tester.ts`）
- 测试指标：响应时间、数据完整性、稳定性、分页支持
- 每个 API 进行 5 次连续测试验证稳定性

**测试结果总结**:

| API                     | 响应时间   | 数据量 | 稳定性   | addedAt | 分页 | 状态    |
| ----------------------- | ---------- | ------ | -------- | ------- | ---- | ------- |
| A (core-collection)     | 49.5ms     | 0 条   | 0%       | ❌      | ❌   | ❌ 失败 |
| B (Platform.LibraryAPI) | **22.7ms** | 50 条  | **100%** | ✅      | ✅   | ✅ 成功 |
| C (Web API)             | 2525.8ms   | 50 条  | 100%     | ✅      | ✅   | ✅ 成功 |

**决策理由**:

1. **性能卓越** 🚀

   - API B 响应时间仅 22.7ms，是 API C 的 1/111
   - 在查重场景中需要频繁查询，性能优势至关重要

2. **数据完整性充分** ✅

   - 包含所有必需字段：uri, name, artists, album, addedAt, duration
   - 提供准确的分页信息（totalLength, unfilteredTotalLength）

3. **稳定性极佳** 💪

   - 连续 5 次测试成功率 100%
   - 本地调用，不受网络影响

4. **开发体验友好** 😊
   - 无需额外认证，代码简洁
   - 直接通过 Spicetify API 调用

**风险与缓解措施**:

- **风险**: API B 属于 Spicetify 内部接口，未来可能变更
- **缓解**: 实现降级方案，当 API B 不可用时自动切换到 Web API（API C）

**实施细节**:

- 配置文件：`src/config/api-config.ts`
- 测试代码：`src/tests/liked-songs-api-test.ts`
- 测试报告：`.claude/plan/api-test-results.md`

**参考资料**:

- [完整测试报告](./.claude/plan/api-test-results.md)
- [测试执行计划](./.claude/plan/api-endpoint-testing-execution-plan.md)

---

## 编码规范

### TypeScript 配置

- **目标**: ES2017
- **模块系统**: CommonJS
- **严格模式**: 已启用 (`strict: true`)
- **JSX**: React

### 代码风格建议

1. **命名约定**

   - 组件名使用 PascalCase
   - 变量和函数使用 camelCase
   - 常量使用 UPPER_SNAKE_CASE

2. **文件组织**

   - 每个 React 组件一个文件
   - 相关样式使用 CSS Modules (`.module.css` / `.module.scss`)
   - 类型定义集中在 `types/` 目录

3. **Spicetify API 使用**
   - 等待 `Spicetify` 对象加载完成再执行逻辑
   - 使用异步/等待模式处理 API 调用
   - 适当使用 `Spicetify.showNotification()` 提供用户反馈

### Git 规范

- 遵循 `.gitignore` 中的忽略规则
- 不提交 `node_modules/`、`dist/`、日志文件等
- 提交信息使用清晰的中文描述

---

## AI 使用指引

### 项目上下文

当 AI 协助开发此项目时，应重点关注：

1. **核心功能实现**

   - 歌曲查重算法设计
   - Spotify API 交互（通过 Spicetify）
   - 用户交互与通知

2. **关键 API 参考**

   - `Spicetify.Player` - 播放器状态与事件
   - `Spicetify.CosmosAsync` - Spotify 内部 API 调用
   - `Spicetify.ContextMenu` - 上下文菜单扩展
   - `Spicetify.showNotification()` - 用户通知

3. **开发建议**

   - 参考 `src/types/spicetify.d.ts` 了解可用 API
   - 使用 `Player.addEventListener()` 监听播放事件
   - 通过 `CosmosAsync.get()` 获取歌单数据
   - 使用 `URI` 类解析和处理 Spotify URI

4. **性能考虑**
   - 查重算法应高效，避免阻塞 UI
   - 考虑缓存已查重的结果
   - 异步处理网络请求

### 推荐的实现路径

```
1. 监听添加到歌单的操作
   ↓
2. 获取目标歌单的所有曲目
   ↓
3. 对比当前歌曲与歌单中的曲目
   ↓
4. 如发现相似：阻止添加并显示通知
   ↓
5. 如无相似：允许正常添加
```

### 常用代码模式

#### 监听播放器事件

```typescript
Spicetify.Player.addEventListener("songchange", (event) => {
  const track = event?.data?.item;
  // 处理歌曲变更
});
```

#### 获取歌单内容

```typescript
const playlistUri = "spotify:playlist:xxxxx";
const data = await Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${playlistUri}`);
```

#### 显示通知

```typescript
Spicetify.showNotification("发现重复歌曲！", true, 3000);
```

---

## 相关资源

- [Spicetify 官方文档](https://spicetify.app/docs/)
- [Spicetify Creator 文档](https://spicetify.app/docs/development/spicetify-creator/the-basics)
- [Spicetify GitHub](https://github.com/spicetify/spicetify-cli)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [React 文档](https://react.dev/)

---

## 下一步建议

### 待实现功能

1. 实现核心查重逻辑
2. 集成到 Spotify 添加歌曲流程
3. 设计用户配置界面
4. 添加歌曲相似度匹配算法
5. 支持自定义查重规则

### 优先级

- **高**: 基础查重功能（精确匹配）
- **中**: 相似度算法（模糊匹配）
- **低**: 高级配置选项

---

> 文档最后更新：2025-12-02 13:36:16
