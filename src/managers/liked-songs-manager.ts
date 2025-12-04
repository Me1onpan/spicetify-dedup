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
import { LIKED_SONGS_API_CONFIG } from "../config/api-config";
import type {
  LikedSongsCache,
  LikedSongItem,
  LikedSongsResponse,
  CacheStats,
} from "../types/liked-songs";

/**
 * LikedSongs 管理器
 *
 * 单例模式，全局唯一实例
 * 负责 LikedSongs 数据的获取、缓存和查询
 */
export class LikedSongsManager {
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
   * 初始化管理器
   *
   * 执行流程：
   * 1. 加载首批数据（50 首）
   * 2. 启动更新机制（定时轮询 + 事件监听）
   * 3. 显示加载完成通知
   *
   * @throws {Error} 如果 Spicetify.Platform.LibraryAPI 不可用
   */
  static async initialize(): Promise<void> {
    Logger.info("LikedSongsManager", "正在初始化...");

    try {
      // 检查 API 可用性
      if (!Spicetify.Platform?.LibraryAPI) {
        throw new Error("Spicetify.Platform.LibraryAPI 不可用");
      }

      // 首次加载数据
      await this.loadInitialData();

      // 启动更新机制（阶段 4 实现）
      this.initUpdateMechanism();

      Logger.info(
        "LikedSongsManager",
        `初始化完成，已加载 ${this.cache.tracks.size}/${this.cache.total} 首歌曲`
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
   *
   * 加载首批歌曲（默认 50 首）到缓存
   * 这是一个快速启动策略，完整加载将在后台进行（阶段 4）
   *
   * @private
   */
  private static async loadInitialData(): Promise<void> {
    Logger.debug("LikedSongsManager", "开始首次加载...");

    const firstBatch = await this.fetchLikedSongs(
      0,
      LIKED_SONGS_API_CONFIG.pagination.defaultLimit
    );

    // 更新缓存
    this.cache.total = firstBatch.total;
    firstBatch.items.forEach((item) => {
      this.cache.tracks.set(item.uri, item);
    });

    this.cache.lastUpdated = Date.now();

    Logger.debug(
      "LikedSongsManager",
      `首批加载完成: ${firstBatch.items.length}/${firstBatch.total} 首`
    );
  }

  /**
   * 获取 LikedSongs 数据
   *
   * 使用 Spicetify.Platform.LibraryAPI.getTracks() 获取数据
   * 包含性能测试和错误处理
   *
   * @param offset - 偏移量（从第几首开始）
   * @param limit - 每页数量
   * @returns LikedSongs 响应数据
   * @throws {Error} 如果 API 调用失败
   * @private
   */
  private static async fetchLikedSongs(
    offset: number,
    limit: number
  ): Promise<LikedSongsResponse> {
    const startTime = performance.now();

    try {
      Logger.debug(
        "LikedSongsManager",
        `正在获取数据 (offset=${offset}, limit=${limit})...`
      );

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

      Logger.debug(
        "LikedSongsManager",
        `数据获取成功: ${formattedResponse.items.length} 首`
      );

      return formattedResponse;
    } catch (error) {
      const duration = performance.now() - startTime;
      Logger.error(
        "LikedSongsManager",
        `获取数据失败 (offset=${offset}, 耗时=${duration.toFixed(2)}ms)`,
        error
      );
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
   * 初始化更新机制
   *
   * 占位方法，将在阶段 4 实现以下功能：
   * - 定时轮询（每 3 分钟检查更新）
   * - 事件监听（监听歌曲添加/删除事件）
   * - 增量更新（仅加载新增歌曲）
   *
   * @private
   */
  private static initUpdateMechanism(): void {
    Logger.debug("LikedSongsManager", "更新机制将在阶段 4 实现");
    // TODO: 阶段 4 - 实现定时轮询和事件监听
  }
}
