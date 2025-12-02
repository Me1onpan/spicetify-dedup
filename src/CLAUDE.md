[根目录](../CLAUDE.md) > **src**

# 源代码模块

> Spicetify Dedup 扩展的核心实现代码

## 变更记录 (Changelog)

### 2025-12-02 13:36:16
- 初始化源代码模块文档

---

## 模块职责

`src/` 目录是扩展的核心代码库，包含：
- 扩展入口逻辑 (`app.tsx`)
- TypeScript 类型定义 (`types/`)
- 扩展配置文件 (`settings.json`)

该模块负责与 Spicetify API 交互，实现歌曲查重的核心功能。

---

## 入口与启动

### 主入口：`app.tsx`

**当前实现（模板）：**
```typescript
async function main() {
  while (!Spicetify?.showNotification) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Show message on start.
  Spicetify.showNotification("Hello!");
}

export default main;
```

**职责：**
- 等待 Spicetify API 加载完成
- 初始化扩展逻辑
- 注册事件监听器

**启动流程：**
1. Spicetify 加载扩展脚本
2. 轮询检查 `Spicetify` 对象是否可用
3. API 就绪后执行初始化逻辑
4. 显示启动通知（当前为 "Hello!"）

---

## 对外接口

### Spicetify API 交互

扩展通过全局 `Spicetify` 对象与 Spotify 客户端交互。主要接口包括：

#### 播放器事件
- `Spicetify.Player.addEventListener("songchange", callback)` - 监听歌曲变更
- `Spicetify.Player.data` - 当前播放状态

#### 数据获取
- `Spicetify.CosmosAsync.get(url)` - 异步获取 Spotify 数据
- `Spicetify.CosmosAsync.post(url, body)` - 发送数据请求

#### UI 交互
- `Spicetify.showNotification(message, isError, timeout)` - 显示通知
- `Spicetify.PopupModal.display(content)` - 显示弹窗
- `Spicetify.ContextMenu.Item` - 添加右键菜单项

#### URI 处理
- `Spicetify.URI.fromString(uri)` - 解析 Spotify URI
- `Spicetify.URI.isTrack(uri)` - 检查 URI 类型

---

## 关键依赖与配置

### 外部依赖

#### 运行时依赖
- **Spicetify API**: 由 Spicetify CLI 注入，提供与 Spotify 客户端的接口
- **React**: 通过 `Spicetify.React` 访问
- **ReactDOM**: 通过 `Spicetify.ReactDOM` 访问

#### 开发依赖（`package.json`）
```json
{
  "@types/react": "^19.2.7",
  "@types/react-dom": "^19.2.3",
  "spicetify-creator": "^1.0.17"
}
```

### 配置文件

#### `settings.json`
```json
{
  "nameId": "spicetify-dedup"
}
```
- **用途**: 定义扩展的唯一标识符
- **nameId**: 在 Spicetify 中注册的扩展名称

#### TypeScript 配置（继承自根 `tsconfig.json`）
- **target**: ES2017
- **jsx**: react
- **module**: commonjs
- **strict**: true
- **esModuleInterop**: true

---

## 数据模型

### 类型定义位置
所有类型定义位于 `src/types/` 目录。

### 1. CSS Modules 类型 (`css-modules.d.ts`)
```typescript
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}
```
**用途**: 支持 CSS Modules 的 TypeScript 类型提示。

### 2. Spicetify API 类型 (`spicetify.d.ts`)
完整的 Spicetify API TypeScript 定义（2354 行），包括：

#### 核心类型
- `Spicetify.PlayerState` - 播放器状态
- `Spicetify.PlayerTrack` - 歌曲信息
- `Spicetify.ContextTrack` - 上下文歌曲
- `Spicetify.Metadata` - 元数据键值对

#### 重要接口
```typescript
type PlayerTrack = {
  type: string;
  uri: string;
  uid: string;
  name: string;
  mediaType: string;
  duration: { milliseconds: number };
  album: Album;
  artists?: ArtistsEntity[];
  isLocal: boolean;
  isExplicit: boolean;
  metadata: TrackMetadata;
  images?: ImagesEntity[];
}
```

#### 查重相关的关键字段
- `track.name` - 歌曲名称
- `track.artists` - 艺术家列表
- `track.album` - 专辑信息
- `track.uri` - 唯一标识符
- `track.metadata.title` - 元数据标题

---

## 测试与质量

### 当前状态
- **单元测试**: 无
- **集成测试**: 无
- **代码检查**: 无配置

### 建议的测试方法

#### 手动测试清单
1. 扩展加载测试
   - [ ] Spicetify 能否正确加载扩展
   - [ ] 启动通知是否显示

2. 播放器事件测试
   - [ ] 歌曲变更事件能否触发
   - [ ] 能否正确获取当前歌曲信息

3. 查重逻辑测试（待实现）
   - [ ] 完全相同的歌曲能否被识别
   - [ ] 相似版本（混音、现场）能否被识别
   - [ ] 误判率测试

#### 开发者工具
- **控制台**: 在 Spotify 中按 `Ctrl + Shift + I` 打开 DevTools
- **日志输出**: 使用 `console.log()` 或 `Spicetify.showNotification()`
- **断点调试**: 在 DevTools 中设置断点

---

## 常见问题 (FAQ)

### Q: 如何调试扩展？
**A**:
1. 在 Spotify 中按 `Ctrl + Shift + I` 打开开发者工具
2. 在 Console 标签中查看日志
3. 在 Sources 标签中查找扩展代码并设置断点

### Q: `Spicetify` 对象未定义怎么办？
**A**:
确保在 `app.tsx` 中使用轮询等待机制：
```typescript
while (!Spicetify?.showNotification) {
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### Q: 如何访问歌单数据？
**A**:
使用 CosmosAsync API：
```typescript
const data = await Spicetify.CosmosAsync.get(
  `sp://core-playlist/v1/playlist/${playlistUri}`
);
```

### Q: 如何拦截添加到歌单的操作？
**A**:
建议使用以下方法之一：
1. 监听 `ContextMenu` 点击事件
2. 使用 `Spicetify.Platform.PlaylistAPI` 拦截（如可用）
3. 通过 CosmosAsync 监听歌单变更事件

### Q: 样式文件如何使用？
**A**:
创建 `.module.css` 或 `.module.scss` 文件，然后导入：
```typescript
import styles from './MyComponent.module.css';

// 使用
<div className={styles.myClass}>...</div>
```

---

## 相关文件清单

### 核心文件
- `app.tsx` - 扩展主入口（48 字节，11 行）
- `settings.json` - 扩展配置（32 字节）

### 类型定义
- `types/css-modules.d.ts` - CSS Modules 类型（179 字节）
- `types/spicetify.d.ts` - Spicetify API 完整类型定义（58,842 字节，2354 行）

### 预期增加的文件
- `DeduplicateLogic.ts` - 查重核心逻辑
- `PlaylistManager.ts` - 歌单管理
- `SimilarityMatcher.ts` - 相似度匹配算法
- `ConfigUI.tsx` - 配置界面组件
- `styles/` - 样式文件目录

---

## 实现建议

### 查重算法设计

#### 第一阶段：精确匹配
```typescript
function isDuplicate(track: PlayerTrack, playlistTracks: PlayerTrack[]): boolean {
  return playlistTracks.some(existing =>
    existing.uri === track.uri
  );
}
```

#### 第二阶段：相似匹配
```typescript
function isSimilar(track: PlayerTrack, playlistTracks: PlayerTrack[]): boolean {
  return playlistTracks.some(existing => {
    // 相同歌名和艺术家
    const sameName = normalizeString(existing.name) === normalizeString(track.name);
    const sameArtist = existing.artists?.some(a1 =>
      track.artists?.some(a2 => a1.uri === a2.uri)
    );

    return sameName && sameArtist;
  });
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\(\[].*?[\)\]]/g, '') // 移除括号内容（如 "Live"、"Remix"）
    .trim();
}
```

#### 第三阶段：高级匹配
- 使用 Levenshtein 距离计算字符串相似度
- 支持用户自定义匹配规则
- 考虑专辑、发行年份等因素

---

## 架构演进路线图

### 当前状态 (v0.1.0 - 模板)
```
app.tsx (模板代码)
  └─ 显示 "Hello!" 通知
```

### 阶段 1: 基础功能 (v0.2.0)
```
app.tsx
  ├─ 初始化扩展
  ├─ 注册上下文菜单项
  └─ 监听添加操作
DeduplicateLogic.ts
  └─ 精确 URI 匹配
```

### 阶段 2: 相似匹配 (v0.3.0)
```
app.tsx
DeduplicateLogic.ts
  └─ 歌名 + 艺术家匹配
SimilarityMatcher.ts
  └─ 字符串规范化
```

### 阶段 3: 高级特性 (v1.0.0)
```
app.tsx
DeduplicateLogic.ts
SimilarityMatcher.ts
  └─ 模糊匹配算法
ConfigUI.tsx
  └─ 用户配置界面
PlaylistManager.ts
  └─ 歌单缓存管理
```

---

> 文档最后更新：2025-12-02 13:36:16
