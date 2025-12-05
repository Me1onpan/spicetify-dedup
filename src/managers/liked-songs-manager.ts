/**
 * @file liked-songs-manager.ts
 * @description LikedSongs 数据管理器
 * @version 1.0.0
 * @date 2025-12-04
 *
 * 职责：
 * - 管理用户的 LikedSongs（喜欢的音乐）缓存
 * - 提供快速查询接口（isLiked）
 * - 支持增量更新和完整加载
 * - 统计信息展示
 *
 * 基于 Spicetify.Platform.LibraryAPI 实现
 *
 * @see 规划文档: .claude/plan/likedsongs-feature-1.md (阶段 3.1)
 * @see API 配置: ../config/api-config.ts
 * @see 类型定义: ../types/liked-songs.ts
 */

import { Logger, DEBUG_MODE } from "../utils/logger";
import { RetryHelper } from "../utils/retry-helper";
import { LIKED_SONGS_API_CONFIG } from "../config/api-config";
import type { LikedSongsCache, LikedSongItem, LikedSongsResponse, CacheStats } from "../types/liked-songs";

/**
 * LikedSongs 管理器
 *
 * 单例模式（静态类），全局唯一实例
 * 负责 LikedSongs 数据的获取、缓存和查询
 *
 * @remarks 此类不应被实例化，所有方法均为静态方法
 */
export class LikedSongsManager {
  /**
   * 私有构造函数，防止实例化
   * @throws {Error} 如果尝试实例化此类
   */
  private constructor() {
    throw new Error("LikedSongsManager 不能被实例化，请使用静态方法");
  }

  /**
   * 缓存对象
   * 使用 Map 结构优化查询性能（O(1) 时间复杂度）
   */
  private static cache: LikedSongsCache = {
    tracks: new Map(),
    total: 0,
    lastUpdated: 0,
    isFullyLoaded: false,
  };

  /**
   * 加载状态标志
   * 防止并发加载导致的重复请求
   */
  private static isLoading = false;

  /**
   * 定时轮询的 interval ID
   * 用于清理和防止重复启动
   * @private
   */
  private static pollingIntervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * 更新机制是否已初始化
   * 防止重复初始化导致的多个轮询实例
   * @private
   */
  private static isUpdateMechanismInitialized = false;

  /**
   * 初始化管理器
   *
   * 执行流程：
   * 1. 检查是否已初始化或正在初始化
   * 2. 加载首批数据（50 首）
   * 3. 启动更新机制（定时轮询 + 事件监听）
   * 4. 显示加载完成通知
   *
   * @throws {Error} 如果 Spicetify.Platform.LibraryAPI 不可用
   */
  static async initialize(): Promise<void> {
    // 防止并发初始化
    if (this.isLoading) {
      Logger.info("LikedSongsManager", "初始化已在进行中，跳过重复调用");
      return;
    }

    // 检查是否已初始化
    if (this.cache.tracks.size > 0) {
      Logger.info("LikedSongsManager", "管理器已初始化，跳过重复初始化");
      return;
    }

    this.isLoading = true;
    Logger.info("LikedSongsManager", "正在初始化...");

    try {
      // 检查 API 可用性
      if (!Spicetify.Platform?.LibraryAPI) {
        throw new Error("Spicetify.Platform.LibraryAPI 不可用。请确保 Spicetify 已正确安装并完全加载。");
      }

      // 首次加载数据
      await this.loadInitialData();

      // 启动更新机制（阶段 4 实现）
      this.initUpdateMechanism();

      Logger.info("LikedSongsManager", `初始化完成，已加载 ${this.cache.tracks.size}/${this.cache.total} 首歌曲`);

      // 生产模式下显示通知
      if (!DEBUG_MODE) {
        Spicetify.showNotification(`LikedSongs 已加载 (${this.cache.total} 首)`);
      }
    } catch (error) {
      Logger.error("LikedSongsManager", "初始化失败", error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 首次加载数据
   *
   * 加载首批歌曲（默认 50 首）到缓存
   * 这是一个快速启动策略，完整加载将在后台进行（阶段 4）
   *
   * @private
   */
  private static async loadInitialData(): Promise<void> {
    Logger.debug("LikedSongsManager", "开始首次加载...");

    const firstBatch = await this.fetchLikedSongs(0, LIKED_SONGS_API_CONFIG.pagination.defaultLimit);

    // 更新缓存
    this.cache.total = firstBatch.total;
    firstBatch.items.forEach((item) => {
      this.cache.tracks.set(item.uri, item);
    });

    this.cache.lastUpdated = Date.now();

    Logger.debug("LikedSongsManager", `首批加载完成: ${firstBatch.items.length}/${firstBatch.total} 首`);
  }

  /**
   * 获取 LikedSongs 数据
   *
   * 使用 Spicetify.Platform.LibraryAPI.getTracks() 获取数据
   * 包含性能测试、错误处理和自动重试机制
   *
   * @param offset - 偏移量（从第几首开始）
   * @param limit - 每页数量
   * @returns LikedSongs 响应数据
   * @throws {Error} 如果 API 调用失败（重试 3 次后仍失败）
   * @private
   */
  private static async fetchLikedSongs(offset: number, limit: number): Promise<LikedSongsResponse> {
    return RetryHelper.withRetry(
      async () => {
        const startTime = performance.now();

        try {
          Logger.debug("LikedSongsManager", `正在获取数据 (offset=${offset}, limit=${limit})...`);

          // 调用 Platform.LibraryAPI
          const response = await Spicetify.Platform.LibraryAPI.getTracks({
            offset,
            limit,
          });

          const duration = performance.now() - startTime;
          Logger.perf("LikedSongsManager", `获取数据 (offset=${offset})`, duration);

          // 转换为标准格式
          const formattedResponse: LikedSongsResponse = {
            items: response.items.map((item: any) => ({
              uri: item.uri,
              name: item.name,
              artists: item.artists.map((artist: any) => ({
                name: artist.name,
                uri: artist.uri,
              })),
              album: {
                name: item.album.name,
                uri: item.album.uri,
              },
              addedAt: item.addedAt,
              duration: item.duration,
            })),
            total: response.totalLength || response.unfilteredTotalLength || 0,
            offset,
            limit,
          };

          Logger.debug("LikedSongsManager", `数据获取成功: ${formattedResponse.items.length} 首`);

          return formattedResponse;
        } catch (error) {
          const duration = performance.now() - startTime;
          Logger.error("LikedSongsManager", `获取数据失败 (offset=${offset}, 耗时=${duration.toFixed(2)}ms)`, error);
          throw error;
        }
      },
      {
        maxRetries: 3,
        delay: 2000,
        onRetry: (attempt, error) => {
          Logger.warn("LikedSongsManager", `数据获取失败 (offset=${offset}),正在重试...`, error);
        },
      }
    );
  }

  /**
   * 清空缓存并重新加载全部数据
   *
   * 用于调试或强制刷新数据
   * 会清空当前缓存，重新初始化并加载全部 LikedSongs
   *
   * @internal 此方法主要用于开发调试
   *
   * @example
   * ```typescript
   * // 在 DevTools Console 中执行
   * await LikedSongsManager.reloadAll();
   * ```
   */
  static async reloadAll(): Promise<void> {
    // 防止并发重新加载
    if (this.isLoading) {
      Logger.info("LikedSongsManager", "⚠️ 正在加载中，跳过重复的 reloadAll 请求");
      return;
    }

    Logger.info("LikedSongsManager", "清空缓存并重新加载全部数据...");

    try {
      // 清空缓存
      this.cache.tracks.clear();
      this.cache.total = 0;
      this.cache.lastUpdated = 0;
      this.cache.isFullyLoaded = false;

      Logger.debug("LikedSongsManager", "缓存已清空");

      // 重新初始化（加载首批数据）
      await this.loadInitialData();

      Logger.info("LikedSongsManager", `重新初始化完成，已加载 ${this.cache.tracks.size}/${this.cache.total} 首`);

      // 加载全部数据
      await this.loadAllData();

      Logger.info("LikedSongsManager", `✅ 重新加载完成！共 ${this.cache.tracks.size} 首歌曲`);
    } catch (error) {
      Logger.error("LikedSongsManager", "重新加载失败", error);
      throw error;
    }
  }

  /**
   * 检查歌曲是否在 LikedSongs 中
   *
   * 使用 Map 结构实现 O(1) 时间复杂度的快速查询
   *
   * @param trackUri - 歌曲 URI (spotify:track:xxx)
   * @returns 如果歌曲在 LikedSongs 中返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * const isLiked = LikedSongsManager.isLiked("spotify:track:3n3Ppam7vgaVa1iaRUc9Lp");
   * if (isLiked) {
   *   console.log("这首歌已经在 LikedSongs 中了");
   * }
   * ```
   */
  static isLiked(trackUri: string): boolean {
    return this.cache.tracks.has(trackUri);
  }

  /**
   * 获取缓存统计信息
   *
   * 返回当前缓存的状态信息，用于调试和监控
   *
   * @returns 缓存统计对象
   *
   * @example
   * ```typescript
   * const stats = LikedSongsManager.getStats();
   * console.log(`已加载: ${stats.loaded}/${stats.total}`);
   * console.log(`最后更新: ${stats.lastUpdated}`);
   * ```
   */
  static getStats(): CacheStats {
    return {
      total: this.cache.total,
      loaded: this.cache.tracks.size,
      lastUpdated: new Date(this.cache.lastUpdated).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      isFullyLoaded: this.cache.isFullyLoaded,
    };
  }

  /**
   * 加载全部数据（分页加载）
   *
   * 从当前缓存大小继续加载，直到加载完所有 LikedSongs
   * 支持断点续传：如果中途中断，下次调用会从上次停止的位置继续
   *
   * 性能优化：
   * - 每批加载后等待 500ms，避免触发 API 限流
   * - 使用 Map 结构存储，O(1) 时间复杂度查询
   *
   * @throws {Error} 如果 API 调用失败
   *
   * @example
   * ```typescript
   * // 加载全部 LikedSongs
   * await LikedSongsManager.loadAllData();
   * console.log(`已加载 ${LikedSongsManager.getStats().loaded} 首歌曲`);
   * ```
   */
  static async loadAllData(): Promise<void> {
    // 防止并发加载
    if (this.isLoading) {
      Logger.debug("LikedSongsManager", "正在加载中，跳过重复请求");
      return;
    }

    this.isLoading = true;
    Logger.info("LikedSongsManager", "开始加载全部数据...");

    try {
      const { defaultLimit } = LIKED_SONGS_API_CONFIG.pagination;
      let offset = this.cache.tracks.size; // 从已加载位置继续（断点续传）
      const total = this.cache.total;

      // 如果已经全部加载，直接返回
      if (offset >= total) {
        Logger.info("LikedSongsManager", "数据已全部加载，无需重复加载");
        this.cache.isFullyLoaded = true;
        return;
      }

      Logger.debug("LikedSongsManager", `从 offset=${offset} 继续加载，目标总数=${total}`);

      // 循环加载直到全部完成
      while (offset < total) {
        const batch = await this.fetchLikedSongs(offset, defaultLimit);

        // 将数据存入缓存
        batch.items.forEach((item) => {
          this.cache.tracks.set(item.uri, item);
        });

        offset += batch.items.length;

        // 输出加载进度
        Logger.debug("LikedSongsManager", `加载进度: ${offset}/${total} (${((offset / total) * 100).toFixed(1)}%)`);

        // 间隔配置的延迟时间，避免频繁请求触发限流
        if (offset < total) {
          await new Promise((resolve) => setTimeout(resolve, LIKED_SONGS_API_CONFIG.performance.batchLoadDelay));
        }
      }

      // 标记为已完全加载
      this.cache.isFullyLoaded = true;
      this.cache.lastUpdated = Date.now();

      Logger.info("LikedSongsManager", `全部数据加载完成: ${this.cache.tracks.size} 首`);
    } catch (error) {
      Logger.error("LikedSongsManager", "加载全部数据失败", error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 增量更新（仅加载新增歌曲）
   *
   * 通过对比 total 判断是否有新增歌曲
   * 如果有新增，只加载首批数据并检测新增项
   *
   * 性能优化：
   * - 仅加载首批数据（默认 50 首），不加载全部
   * - 使用 Map.has() 快速检测新增（O(1) 时间复杂度）
   * - 如果新增数量超过首批大小，自动触发完整加载
   *
   * @example
   * ```typescript
   * // 检查并加载新增歌曲
   * await LikedSongsManager.updateIncremental();
   * ```
   */
  static async updateIncremental(): Promise<void> {
    Logger.debug("LikedSongsManager", "开始增量更新...");

    try {
      // 获取最新的首批数据
      const firstBatch = await this.fetchLikedSongs(0, LIKED_SONGS_API_CONFIG.pagination.defaultLimit);

      const currentTotal = this.cache.total;
      const newTotal = firstBatch.total;

      // 如果总数没变，说明没有变化
      if (newTotal === currentTotal) {
        Logger.debug("LikedSongsManager", "无变化");
        return;
      }

      // 处理歌曲数量减少的情况（用户取消喜欢）
      if (newTotal < currentTotal) {
        Logger.info(
          "LikedSongsManager",
          `检测到歌曲减少: ${currentTotal - newTotal} 首，触发完整重新加载以同步删除...`
        );
        // 清空缓存并重新加载全部数据，确保数据一致性
        await this.reloadAll();
        return;
      }

      // 处理歌曲数量增加的情况
      const addedCount = newTotal - currentTotal;
      Logger.info("LikedSongsManager", `检测到新增歌曲: ${addedCount} 首`);

      // 如果新增数量超过首批大小，触发完整加载
      if (addedCount > LIKED_SONGS_API_CONFIG.pagination.defaultLimit) {
        Logger.info("LikedSongsManager", `新增歌曲较多 (${addedCount} 首)，触发完整加载以确保数据完整性...`);
        this.cache.total = newTotal;
        await this.loadAllData();
        return;
      }

      // 更新总数
      this.cache.total = newTotal;

      // 遍历首批数据，查找新增歌曲
      // 注意：此处假设所有新添加的喜欢的歌曲都会出现在列表的开头（offset=0），
      // 即 Spotify API 返回的 items 按添加时间倒序排列（最新的在前）。
      // 如果 API 行为改变（例如改为正序或其他排序方式），此逻辑需要调整。
      // 当前实现的限制：如果用户添加的歌曲不在首批数据中（例如批量导入旧歌曲），
      // 这些歌曲可能不会被立即检测到，需要等待完整加载或手动触发 loadAllData()。
      const newTracks: LikedSongItem[] = [];
      for (const item of firstBatch.items) {
        if (!this.cache.tracks.has(item.uri)) {
          newTracks.push(item);
          this.cache.tracks.set(item.uri, item);
        }
      }

      this.cache.lastUpdated = Date.now();

      if (newTracks.length > 0) {
        Logger.info("LikedSongsManager", `增量更新完成: 新增 ${newTracks.length} 首`);

        // 开发模式下显示新增歌曲列表
        if (DEBUG_MODE) {
          Logger.debug(
            "LikedSongsManager",
            "新增歌曲:",
            newTracks.map((t) => `${t.name} - ${t.artists[0]?.name}`)
          );
        }
      }
    } catch (error) {
      Logger.error("LikedSongsManager", "增量更新失败", error);
      // 不抛出错误，避免影响定时轮询
    }
  }

  /**
   * 最后一次检查更新的时间戳
   * 用于防抖机制，避免频繁触发更新
   * @private
   */
  private static lastCheckTime = 0;

  /**
   * 判断是否应该检查更新
   *
   * 防抖机制：使用配置的防抖间隔
   * 避免事件监听器频繁触发导致的性能问题
   *
   * @returns 如果距离上次检查超过防抖间隔，返回 true
   * @private
   */
  private static shouldCheckUpdate(): boolean {
    const now = Date.now();
    const minInterval = LIKED_SONGS_API_CONFIG.performance.debounceInterval;

    if (now - this.lastCheckTime < minInterval) {
      return false;
    }

    this.lastCheckTime = now;
    return true;
  }

  /**
   * 启动定时轮询
   *
   * 每 3 分钟自动触发一次增量更新
   * 这是更新机制的基础保障，确保数据最终一致性
   *
   * @private
   */
  private static startPolling(): void {
    // 防止重复启动轮询
    if (this.pollingIntervalId !== null) {
      Logger.info("LikedSongsManager", "⚠️ 定时轮询已在运行，跳过重复启动");
      return;
    }

    const interval = LIKED_SONGS_API_CONFIG.cache.updateInterval;

    Logger.debug("LikedSongsManager", `启动定时轮询（间隔: ${interval / 1000} 秒）`);

    this.pollingIntervalId = setInterval(async () => {
      Logger.debug("LikedSongsManager", "定时轮询触发");
      await this.updateIncremental();
    }, interval);
  }

  /**
   * 停止定时轮询
   *
   * 清理定时器，防止内存泄漏
   * 主要用于测试或需要重新初始化的场景
   *
   * @internal 此方法主要用于开发调试和测试
   *
   * @example
   * ```typescript
   * // 在 DevTools Console 中执行
   * LikedSongsManager.stopPolling();
   * ```
   */
  static stopPolling(): void {
    if (this.pollingIntervalId !== null) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
      Logger.info("LikedSongsManager", "定时轮询已停止");
    } else {
      Logger.debug("LikedSongsManager", "定时轮询未运行，无需停止");
    }
  }

  /**
   * 尝试设置事件监听（增强功能）
   *
   * 根据 Spicetify API 分析结果：
   * - Player.songchange: 歌曲变更时触发，但无法直接检测喜欢操作
   * - Platform.LibraryAPI.events: API 中未找到相关事件
   *
   * TODO: Spicetify API 暂无合适的 like/unlike 事件
   * 已尝试的方案：
   * - Player.songchange: 无法直接检测喜欢操作
   * - Platform.LibraryAPI.events: API 中未找到相关事件
   *
   * 后续可能的方案：
   * 1. 监听 DOM 变化（hack 方案，不稳定）
   * 2. 等待 Spicetify 更新提供相关事件
   * 3. 使用更短的轮询间隔作为替代
   *
   * @private
   */
  private static setupEventListeners(): void {
    if (!LIKED_SONGS_API_CONFIG.cache.enableEventListener) {
      Logger.debug("LikedSongsManager", "事件监听已禁用");
      return;
    }

    Logger.debug("LikedSongsManager", "尝试设置事件监听...");

    // TODO: 暂无可用的事件监听 API
    // 经过分析 spicetify.d.ts (第 300-330 行)，发现：
    // - songchange: 歌曲变更时触发（无法直接检测喜欢操作）
    // - onplaypause: 播放/暂停时触发（与喜欢操作无关）
    // - onprogress: 进度变化时触发（与喜欢操作无关）
    // - appchange: 页面切换时触发（与喜欢操作无关）
    //
    // Platform.LibraryAPI 中也未找到相关的事件监听接口

    Logger.debug("LikedSongsManager", "⚠️ 暂无可用的事件监听 API，仅使用定时轮询");

    // 注意：以下是实验性的事件监听代码，已被注释掉
    // 原因：songchange 事件无法直接检测喜欢操作，可靠性不足
    // 如果需要启用实验性功能，请取消注释以下代码块
    //
    // try {
    //   Spicetify.Player.addEventListener('songchange', async () => {
    //     if (this.shouldCheckUpdate()) {
    //       Logger.debug('LikedSongsManager', '歌曲变更事件触发，检查更新');
    //       await this.updateIncremental();
    //     }
    //   });
    //   Logger.debug('LikedSongsManager', '✅ 已注册 songchange 事件监听（实验性）');
    // } catch (error) {
    //   Logger.debug('LikedSongsManager', 'songchange 事件监听失败', error);
    // }
  }

  /**
   * 初始化更新机制
   *
   * 混合策略：定时轮询 + 事件监听
   * - 定时轮询：基础保障，每 3 分钟检查一次（必定启动）
   * - 事件监听：可选增强，失败不影响核心功能（当前标记为 TODO）
   *
   * @private
   */
  private static initUpdateMechanism(): void {
    // 防止重复初始化
    if (this.isUpdateMechanismInitialized) {
      Logger.info("LikedSongsManager", "⚠️ 更新机制已初始化，跳过重复初始化");
      return;
    }

    Logger.info("LikedSongsManager", "初始化更新机制（事件监听 + 定时轮询）");

    // 1. 启动定时轮询（基础保障）
    this.startPolling();

    // 2. 尝试事件监听（可选增强）
    try {
      this.setupEventListeners();
    } catch (error) {
      Logger.error("LikedSongsManager", "事件监听初始化失败，仅使用定时轮询", error);
    }

    // 标记为已初始化
    this.isUpdateMechanismInitialized = true;
  }
}
