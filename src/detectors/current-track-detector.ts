/**
 * CurrentTrackDetector - 当前播放歌曲检测器
 *
 * 职责：
 * - 监听 Spicetify.Player 的 songchange 事件
 * - 检测扩展初始化时已在播放的歌曲
 * - 提供回调接口供外部注册歌曲变更处理逻辑
 * - 防止重复触发（防抖 + URI 去重）
 *
 * 设计模式：单例模式（使用静态方法）
 *
 * @example
 * // 初始化检测器
 * await CurrentTrackDetector.initialize();
 *
 * // 注册歌曲变更回调
 * const unsubscribe = CurrentTrackDetector.onTrackChange((track) => {
 *   console.log('歌曲切换:', track.name);
 * });
 *
 * // 取消注册
 * unsubscribe();
 *
 * // 清理资源
 * CurrentTrackDetector.dispose();
 */

import { Logger } from "../utils/logger";
import type {
  TrackChangeCallback,
  PlayPauseCallback,
} from "../types/current-track";

export class CurrentTrackDetector {
  // ========== 私有属性 ==========

  /** 是否已初始化 */
  private static initialized: boolean = false;

  /** 上一首歌曲的 URI（用于去重） */
  private static lastTrackUri: string | null = null;

  /** 防抖定时器 */
  private static debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** 防抖延迟时间（毫秒） */
  private static readonly DEBOUNCE_DELAY_MS = 300;

  /** 歌曲变更回调函数列表 */
  private static trackChangeCallbacks: TrackChangeCallback[] = [];

  /** 播放/暂停状态变更回调函数列表（预留） */
  private static playPauseCallbacks: PlayPauseCallback[] = [];

  /** songchange 事件处理器引用（用于清理） */
  private static songChangeHandler: ((event: any) => void) | null = null;

  /** 轮询定时器（预留） */
  private static pollingTimer: ReturnType<typeof setInterval> | null = null;

  // ========== 公共方法 ==========

  /**
   * 初始化检测器
   *
   * 流程：
   * 1. 检查是否已初始化（防止重复初始化）
   * 2. 等待 Spicetify.Player 加载完成
   * 3. 立即检测当前播放歌曲（如果有）
   * 4. 注册 songchange 事件监听器
   *
   * @throws {Error} 如果 Player 加载超时
   *
   * @example
   * try {
   *   await CurrentTrackDetector.initialize();
   *   console.log('检测器初始化成功');
   * } catch (error) {
   *   console.error('检测器初始化失败:', error);
   * }
   */
  static async initialize(): Promise<void> {
    // 1. 防止重复初始化
    if (this.initialized) {
      Logger.warn("CurrentTrackDetector", "检测器已初始化，跳过重复初始化");
      return;
    }

    Logger.info("CurrentTrackDetector", "开始初始化检测器...");

    try {
      // 2. 等待 Player 加载
      await this.waitForPlayer();
      Logger.info("CurrentTrackDetector", "✅ Player 加载完成");

      // 3. 立即检测当前播放歌曲
      this.checkCurrentTrack("initialization");

      // 4. 注册 songchange 事件监听器
      this.songChangeHandler = (event: any) => this.handleSongChange(event);
      Spicetify.Player.addEventListener("songchange", this.songChangeHandler);
      Logger.info("CurrentTrackDetector", "✅ songchange 事件监听器已注册");

      // 5. 标记为已初始化
      this.initialized = true;
      Logger.info("CurrentTrackDetector", "✅ 检测器初始化完成");
    } catch (error) {
      Logger.error("CurrentTrackDetector", "初始化失败", error);
      throw error;
    }
  }

  /**
   * 注册歌曲变更回调
   *
   * @param callback - 歌曲变更时的回调函数
   * @returns 取消注册的函数
   *
   * @example
   * const unsubscribe = CurrentTrackDetector.onTrackChange((track) => {
   *   console.log('歌曲切换:', track.name);
   *   console.log('艺术家:', track.artists?.map(a => a.name).join(', '));
   * });
   *
   * // 取消注册
   * unsubscribe();
   */
  static onTrackChange(callback: TrackChangeCallback): () => void {
    this.trackChangeCallbacks.push(callback);
    Logger.debug(
      "CurrentTrackDetector",
      `注册歌曲变更回调，当前回调数量: ${this.trackChangeCallbacks.length}`
    );

    // 返回取消注册函数
    return () => {
      const index = this.trackChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.trackChangeCallbacks.splice(index, 1);
        Logger.debug(
          "CurrentTrackDetector",
          `取消注册歌曲变更回调，当前回调数量: ${this.trackChangeCallbacks.length}`
        );
      }
    };
  }

  /**
   * 注册播放/暂停状态变更回调（预留接口）
   *
   * 注意：此接口为预留接口，当前版本不会触发回调
   * 未来可用于实现"仅在播放时检测"等高级功能
   *
   * @param callback - 播放/暂停状态变更时的回调函数
   * @returns 取消注册的函数
   *
   * @example
   * const unsubscribe = CurrentTrackDetector.onPlayPauseChange((isPlaying, track) => {
   *   if (isPlaying && track) {
   *     console.log('开始播放:', track.name);
   *   } else {
   *     console.log('暂停播放');
   *   }
   * });
   *
   * // 取消注册
   * unsubscribe();
   */
  static onPlayPauseChange(callback: PlayPauseCallback): () => void {
    this.playPauseCallbacks.push(callback);
    Logger.debug(
      "CurrentTrackDetector",
      `注册播放/暂停回调（预留接口），当前回调数量: ${this.playPauseCallbacks.length}`
    );

    // 返回取消注册函数
    return () => {
      const index = this.playPauseCallbacks.indexOf(callback);
      if (index > -1) {
        this.playPauseCallbacks.splice(index, 1);
        Logger.debug(
          "CurrentTrackDetector",
          `取消注册播放/暂停回调，当前回调数量: ${this.playPauseCallbacks.length}`
        );
      }
    };
  }

  /**
   * 获取当前播放歌曲
   *
   * @returns 当前播放的歌曲信息，如果没有则返回 null
   *
   * @example
   * const track = CurrentTrackDetector.getCurrentTrack();
   * if (track) {
   *   console.log('当前播放:', track.name);
   * } else {
   *   console.log('没有歌曲在播放');
   * }
   */
  static getCurrentTrack(): Spicetify.PlayerTrack | null {
    return Spicetify.Player?.data?.item ?? null;
  }

  /**
   * 手动触发检测
   *
   * 用于特殊场景下强制检测当前播放歌曲
   * 会触发所有注册的回调函数
   *
   * @example
   * // 手动触发检测
   * CurrentTrackDetector.forceCheck();
   */
  static forceCheck(): void {
    Logger.debug("CurrentTrackDetector", "手动触发检测");
    this.checkCurrentTrack("manual");
  }

  /**
   * 强制触发检测（忽略 URI 去重）
   *
   * 用于初始化后确保当前歌曲能触发回调，即使该歌曲已经被检测过
   * 会临时清空 lastTrackUri 缓存，确保回调能够触发
   *
   * @example
   * // 初始化后强制触发检测
   * CurrentTrackDetector.forceCheckIgnoreCache();
   */
  static forceCheckIgnoreCache(): void {
    Logger.debug("CurrentTrackDetector", "强制触发检测（忽略 URI 缓存）");

    const currentTrack = Spicetify.Player?.data?.item;
    if (!currentTrack) {
      Logger.debug("CurrentTrackDetector", "当前没有歌曲在播放");
      return;
    }

    // 临时清空 lastTrackUri，确保 checkCurrentTrack 能够触发回调
    this.lastTrackUri = null;

    // 触发检测
    this.checkCurrentTrack("manual-ignore-cache");
  }

  /**
   * 清理资源
   *
   * 移除所有事件监听器和回调函数
   * 用于扩展卸载或重载时清理资源
   *
   * @example
   * // 清理资源
   * CurrentTrackDetector.dispose();
   */
  static dispose(): void {
    Logger.info("CurrentTrackDetector", "开始清理资源...");

    // 移除 songchange 事件监听器
    if (this.songChangeHandler) {
      Spicetify.Player.removeEventListener(
        "songchange",
        this.songChangeHandler
      );
      this.songChangeHandler = null;
      Logger.debug("CurrentTrackDetector", "✅ 已移除 songchange 事件监听器");
    }

    // 清除防抖定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      Logger.debug("CurrentTrackDetector", "✅ 已清除防抖定时器");
    }

    // 停止轮询（如果启用）
    this.stopPolling();

    // 清空回调列表
    this.trackChangeCallbacks = [];
    this.playPauseCallbacks = [];
    Logger.debug("CurrentTrackDetector", "✅ 已清空回调列表");

    // 重置状态变量
    this.lastTrackUri = null;
    this.initialized = false;

    Logger.info("CurrentTrackDetector", "✅ 资源清理完成");
  }

  // ========== 私有方法 ==========

  /**
   * 等待 Spicetify.Player 加载完成
   *
   * 注意：只检查 Player API 是否可用，不检查 Player.data
   * 因为 Player.data 只有在有歌曲播放时才有值
   *
   * @param maxWaitTime - 最大等待时间（毫秒），默认 5000ms
   * @throws {Error} 如果超时
   */
  private static async waitForPlayer(maxWaitTime: number = 5000): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 100; // 每 100ms 检查一次

    Logger.debug("CurrentTrackDetector", "等待 Spicetify.Player 加载...");

    // 只检查 Player 对象和关键方法是否可用，不检查 data
    // Player.data 只有在有歌曲播放时才有值，不能作为加载完成的判断条件
    while (!Spicetify?.Player?.addEventListener) {
      // 检查是否超时
      if (Date.now() - startTime > maxWaitTime) {
        const error = new Error(
          `Player 加载超时（超过 ${maxWaitTime}ms）`
        );
        Logger.error("CurrentTrackDetector", "Player 加载超时", error);
        throw error;
      }

      // 等待一段时间后再次检查
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    const waitTime = Date.now() - startTime;
    Logger.debug(
      "CurrentTrackDetector",
      `Player 加载完成，等待时间: ${waitTime}ms`
    );
  }

  /**
   * 检测当前播放歌曲并触发回调
   *
   * @param source - 触发来源（用于日志）
   */
  private static checkCurrentTrack(source: string): void {
    try {
      const currentTrack = Spicetify.Player?.data?.item;

      if (!currentTrack) {
        Logger.debug(
          "CurrentTrackDetector",
          `[${source}] 当前没有歌曲在播放`
        );
        return;
      }

      const trackUri = currentTrack.uri;

      // URI 去重检测
      if (trackUri === this.lastTrackUri) {
        Logger.debug(
          "CurrentTrackDetector",
          `[${source}] 跳过重复歌曲: ${trackUri}`
        );
        return;
      }

      // 更新记录
      this.lastTrackUri = trackUri;

      // 记录日志（使用函数形式延迟计算，避免生产模式下的字符串拼接开销）
      Logger.info("CurrentTrackDetector", () => {
        const artistNames =
          currentTrack.artists?.map((a) => a.name).join(", ") || "未知艺术家";
        return `[${source}] 检测到歌曲: ${currentTrack.name} - ${artistNames}`;
      });

      // 触发回调
      this.triggerTrackChangeCallbacks(currentTrack);
    } catch (error) {
      Logger.error(
        "CurrentTrackDetector",
        `[${source}] 检测当前歌曲失败`,
        error
      );
    }
  }

  /**
   * 处理 songchange 事件
   *
   * 包含防抖和 URI 去重逻辑
   *
   * @param _event - songchange 事件对象（未使用，保留用于事件处理器签名）
   */
  private static handleSongChange(_event: any): void {
    // 清除旧的防抖定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // 设置新的防抖定时器
    this.debounceTimer = setTimeout(() => {
      this.checkCurrentTrack("songchange");
    }, this.DEBOUNCE_DELAY_MS);
  }

  /**
   * 触发所有歌曲变更回调
   *
   * @param track - 当前播放的歌曲信息
   */
  private static triggerTrackChangeCallbacks(
    track: Spicetify.PlayerTrack
  ): void {
    if (this.trackChangeCallbacks.length === 0) {
      Logger.debug("CurrentTrackDetector", "没有注册的回调函数");
      return;
    }

    Logger.debug(
      "CurrentTrackDetector",
      `触发 ${this.trackChangeCallbacks.length} 个回调函数`
    );

    // 隔离每个回调的错误，确保一个回调失败不影响其他回调
    this.trackChangeCallbacks.forEach((callback, index) => {
      try {
        callback(track);
      } catch (error) {
        Logger.error(
          "CurrentTrackDetector",
          `回调函数 #${index} 执行失败`,
          error
        );
      }
    });
  }

  /**
   * 启动轮询检测（预留接口，默认不启用）
   *
   * @internal 此方法为内部预留接口，当前版本不建议使用。
   * 仅在 songchange 事件不可靠时作为降级方案。
   * 未来版本可能会移除或更改此方法。
   *
   * @param intervalMs - 轮询间隔（毫秒）
   */
  private static startPolling(intervalMs: number): void {
    Logger.warn(
      "CurrentTrackDetector",
      `启动轮询检测（预留功能），间隔: ${intervalMs}ms`
    );

    // 停止现有轮询
    this.stopPolling();

    // 启动新的轮询
    this.pollingTimer = setInterval(() => {
      this.checkCurrentTrack("polling");
    }, intervalMs);
  }

  /**
   * 停止轮询检测
   */
  private static stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
      Logger.debug("CurrentTrackDetector", "✅ 已停止轮询检测");
    }
  }
}
