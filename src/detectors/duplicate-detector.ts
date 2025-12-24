/**
 * @file duplicate-detector.ts
 * @description 歌曲查重检测器
 * @version 1.0.0
 * @date 2025-12-24
 *
 * 职责：
 * - 检测当前播放歌曲是否与 LikedSongs 中的歌曲重复
 * - 支持精确匹配、强匹配、弱匹配三种级别
 *
 * @see 设计文档: .zcf/plan/history/duplicate-detection-algorithm-design-2025-12-24.md
 */

import { Logger } from "../utils/logger";
import { LikedSongsManager } from "../managers/liked-songs-manager";
import type { LikedSongItem } from "../types/liked-songs";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 匹配级别枚举
 */
export enum MatchLevel {
  /** 精确匹配：URI 完全相同，置信度 100% */
  EXACT = "EXACT",
  /** 强匹配：规范化歌名相同 + 艺术家匹配，置信度 95% */
  STRONG = "STRONG",
  /** 弱匹配：歌名相似度 > 0.7 + 艺术家匹配，置信度 70-94% */
  WEAK = "WEAK",
  /** 无匹配 */
  NONE = "NONE",
}

/**
 * 查重结果接口
 */
export interface DuplicateResult {
  /** 匹配级别 */
  level: MatchLevel;
  /** 置信度 (0-1) */
  confidence: number;
  /** 匹配到的歌曲（如果有） */
  matchedTrack: LikedSongItem | null;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 字符串规范化
 * 移除括号内容（如 Live、Remix）和版本标记
 *
 * @param name - 原始歌名
 * @returns 规范化后的歌名
 */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\(\[【].*?[\)\]】]/g, "") // 移除括号内容
    .replace(/\s*[-–—]\s*(remix|live|acoustic|remaster).*/i, "") // 移除版本标记
    .trim();
}

/**
 * 检查两首歌是否有共同艺术家
 *
 * @param track - 当前播放歌曲
 * @param item - LikedSongs 中的歌曲
 * @returns 是否有共同艺术家
 */
function hasCommonArtist(
  track: Spicetify.PlayerTrack,
  item: LikedSongItem
): boolean {
  // 边界处理：无艺术家信息时跳过艺术家条件
  if (!track.artists?.length || !item.artists?.length) {
    return true;
  }
  const uris = new Set(track.artists.map((x) => x.uri));
  return item.artists.some((x) => uris.has(x.uri));
}

/**
 * Levenshtein 编辑距离算法
 *
 * @param a - 字符串 a
 * @param b - 字符串 b
 * @returns 编辑距离
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // 边界情况
  if (m === 0) return n;
  if (n === 0) return m;

  // 使用一维数组优化空间复杂度
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // 删除
        curr[j - 1] + 1, // 插入
        prev[j - 1] + cost // 替换
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/**
 * 计算字符串相似度
 *
 * @param a - 字符串 a
 * @param b - 字符串 b
 * @returns 相似度 (0-1)
 */
function similarity(a: string, b: string): number {
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length, 1);
}

// ============================================================================
// 检测器类
// ============================================================================

/**
 * 歌曲查重检测器
 *
 * 静态类，提供歌曲查重功能
 * 支持三种匹配级别：精确匹配、强匹配、弱匹配
 */
export class DuplicateDetector {
  private static readonly MODULE_NAME = "DuplicateDetector";

  /** 私有构造函数，防止实例化 */
  private constructor() {
    throw new Error("DuplicateDetector 不能被实例化，请使用静态方法");
  }

  /**
   * 检测歌曲是否与 LikedSongs 中的歌曲重复
   *
   * @param track - 当前播放的歌曲
   * @returns 查重结果
   */
  static check(track: Spicetify.PlayerTrack): DuplicateResult {
    const startTime = performance.now();

    // 边界处理：空歌名
    if (!track.name?.trim()) {
      Logger.debug(this.MODULE_NAME, "歌名为空，跳过检测");
      return { level: MatchLevel.NONE, confidence: 0, matchedTrack: null };
    }

    const cache = LikedSongsManager.getStats();

    // 边界处理：缓存未加载，仅精确匹配
    if (cache.loaded === 0) {
      Logger.debug(this.MODULE_NAME, "缓存未加载，仅执行精确匹配");
      return this.checkExactOnly(track);
    }

    // 执行完整检测
    const result = this.checkFull(track);

    const duration = performance.now() - startTime;
    Logger.perf(this.MODULE_NAME, `检测 "${track.name}"`, duration);

    return result;
  }

  /**
   * 仅精确匹配（缓存未加载时使用）
   */
  private static checkExactOnly(track: Spicetify.PlayerTrack): DuplicateResult {
    if (LikedSongsManager.isLiked(track.uri)) {
      return {
        level: MatchLevel.EXACT,
        confidence: 1,
        matchedTrack: null, // 缓存未加载，无法获取详情
      };
    }
    return { level: MatchLevel.NONE, confidence: 0, matchedTrack: null };
  }

  /**
   * 完整检测逻辑
   */
  private static checkFull(track: Spicetify.PlayerTrack): DuplicateResult {
    // 1. 精确匹配
    if (LikedSongsManager.isLiked(track.uri)) {
      Logger.debug(this.MODULE_NAME, () => `精确匹配: ${track.uri}`);
      return {
        level: MatchLevel.EXACT,
        confidence: 1,
        matchedTrack: LikedSongsManager.getCache().tracks.get(track.uri) ?? null,
      };
    }

    // 2. 相似匹配
    const normalized = normalize(track.name);
    const tracks = LikedSongsManager.getCache().tracks;

    for (const [uri, item] of tracks) {
      // 跳过艺术家不匹配的歌曲
      if (!hasCommonArtist(track, item)) continue;

      const itemNorm = normalize(item.name);

      // 强匹配：规范化歌名完全相同
      if (normalized === itemNorm) {
        Logger.debug(this.MODULE_NAME, () => `强匹配: "${track.name}" ≈ "${item.name}"`);
        return {
          level: MatchLevel.STRONG,
          confidence: 0.95,
          matchedTrack: item,
        };
      }

      // 弱匹配：相似度 > 0.7
      const sim = similarity(normalized, itemNorm);
      if (sim > 0.7) {
        Logger.debug(this.MODULE_NAME, () => `弱匹配: "${track.name}" ~ "${item.name}" (${(sim * 100).toFixed(1)}%)`);
        return {
          level: MatchLevel.WEAK,
          confidence: sim,
          matchedTrack: item,
        };
      }
    }

    return { level: MatchLevel.NONE, confidence: 0, matchedTrack: null };
  }
}
