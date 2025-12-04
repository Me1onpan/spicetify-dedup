/**
 * @file liked-songs.ts
 * @description LikedSongs 功能的 TypeScript 类型定义
 * @version 1.0.0
 * @date 2025-12-04
 *
 * 本文件定义了 LikedSongs 功能所需的完整类型系统：
 * - 5 个类型别名 (Type Aliases): ISODateString, UnixTimestamp, TrackURI, ArtistURI, AlbumURI
 * - 6 个核心接口 (Core Interfaces): LikedSongArtist, LikedSongAlbum, LikedSongItem, LikedSongsResponse, LikedSongsCache, UpdateStrategyConfig
 * - 3 个辅助接口 (Helper Interfaces): PaginationParams, DuplicateCheckResult, CacheStats
 *
 * 基于 Spicetify.Platform.LibraryAPI 的响应结构设计，用于查重功能的类型定义。
 *
 * @see 规划文档: .claude/plan/likedsongs-feature-1.md (阶段 2.1)
 * @see API 测试报告: .claude/plan/api-test-results.md
 * @see ADR-001: LikedSongs API 选型
 */

// ============================================================================
// 类型别名 (Type Aliases)
// ============================================================================

/**
 * ISO 8601 格式的日期时间字符串
 * @example "2025-12-04T10:30:00.000Z"
 */
export type ISODateString = string;

/**
 * Unix 时间戳（毫秒）
 * @example 1733308200000
 */
export type UnixTimestamp = number;

/**
 * Spotify Track URI
 * @example "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp"
 */
export type TrackURI = string;

/**
 * Spotify Artist URI
 * @example "spotify:artist:0TnOYISbd1XYRBk9myaseg"
 */
export type ArtistURI = string;

/**
 * Spotify Album URI
 * @example "spotify:album:6DEjYFkNZh67HP7R9PSZvv"
 */
export type AlbumURI = string;

// ============================================================================
// 核心数据类型 (Core Data Types)
// ============================================================================

/**
 * 喜欢的歌曲中的艺术家信息
 */
export interface LikedSongArtist {
	/** 艺术家名称 */
	name: string;

	/** 艺术家 URI (spotify:artist:xxx) */
	uri: ArtistURI;
}

/**
 * 喜欢的歌曲中的专辑信息
 */
export interface LikedSongAlbum {
	/** 专辑名称 */
	name: string;

	/** 专辑 URI (spotify:album:xxx) */
	uri: AlbumURI;
}

/**
 * 单个喜欢的歌曲项
 *
 * 包含查重所需的核心信息
 */
export interface LikedSongItem {
	/** 歌曲 URI (spotify:track:xxx) */
	uri: TrackURI;

	/** 歌曲名称 */
	name: string;

	/** 艺术家列表 */
	artists: LikedSongArtist[];

	/** 专辑信息 */
	album: LikedSongAlbum;

	/** 添加到 LikedSongs 的时间（ISO 8601 格式） */
	addedAt: ISODateString;

	/** 歌曲时长（毫秒） */
	duration: number;
}

/**
 * LikedSongs API 响应数据
 *
 * 对应 Platform.LibraryAPI.getTracks() 的返回结构
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
 *
 * 使用 Map 结构优化查询性能
 * key 为歌曲 URI，value 为完整歌曲信息
 */
export interface LikedSongsCache {
	/** 歌曲列表（以 URI 为 key 的 Map） */
	tracks: Map<TrackURI, LikedSongItem>;

	/** 总数量 */
	total: number;

	/** 最后更新时间（Unix 时间戳） */
	lastUpdated: UnixTimestamp;

	/** 是否已完整加载 */
	isFullyLoaded: boolean;
}

/**
 * 更新策略配置
 *
 * 控制 LikedSongs 缓存的更新行为
 */
export interface UpdateStrategyConfig {
	/** 轮询间隔（毫秒） */
	pollingInterval: number;

	/** 是否启用事件监听 */
	enableEventListener: boolean;

	/** 单次加载数量 */
	batchSize: number;
}

// ============================================================================
// 辅助类型 (Helper Types)
// ============================================================================

/**
 * 分页查询参数
 *
 * 用于 API 请求的分页控制
 */
export interface PaginationParams {
	/** 偏移量 */
	offset: number;

	/** 每页数量 */
	limit: number;
}

/**
 * 查重结果
 *
 * 用于表示歌曲查重的结果信息
 */
export interface DuplicateCheckResult {
	/** 是否重复 */
	isDuplicate: boolean;

	/** 重复的歌曲 URI（如果存在） */
	duplicateUri?: TrackURI;

	/** 相似度（0-1，1 表示完全相同） */
	similarity?: number;
}

/**
 * 缓存统计信息
 *
 * 对应 LikedSongsManager.getStats() 的返回类型
 * @see .claude/plan/likedsongs-feature-1.md (阶段 3.1 - 第 903-910 行)
 */
export interface CacheStats {
	/** 总数量 */
	total: number;

	/** 已加载数量 */
	loaded: number;

	/** 最后更新时间（本地化字符串） */
	lastUpdated: string;

	/** 是否已完整加载 */
	isFullyLoaded: boolean;
}
