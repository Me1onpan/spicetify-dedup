/**
 * Spicetify Player API 探索测试
 *
 * 用于实践调研 Spicetify.Player 的各项 API 行为
 * 测试内容：
 * - songchange 事件的触发时机和数据结构
 * - Player.data 的可用性和数据完整性
 * - 初始化时序和加载顺序
 * - onplaypause 事件的触发场景
 */

import { Logger } from "../utils/logger";

/**
 * Player API 探索测试类
 */
export class PlayerAPIExploration {
  // 事件统计
  private static songChangeCount = 0;
  private static playPauseCount = 0;
  private static lastEventTimestamp = Date.now();
  private static lastTrackUri: string | null = null;

  /**
   * 运行所有 Player API 测试
   */
  static async runAllTests() {
    Logger.info("PlayerAPIExploration", "========== 开始 Player API 探索测试 ==========");

    // 等待 Player 加载
    await this.waitForPlayer();

    // 运行所有测试
    await this.testInitializationTiming();
    this.testPlayerData();
    this.testSongChangeEvent();
    this.testPlayPauseEvent();

    Logger.info("PlayerAPIExploration", "========== 测试已启动，请手动切换歌曲观察日志 ==========");
    Logger.info("PlayerAPIExploration", "提示：在 Spotify 中播放、暂停、切换歌曲，观察控制台输出");
  }

  /**
   * 等待 Spicetify.Player 加载完成
   */
  private static async waitForPlayer(): Promise<void> {
    Logger.info("PlayerAPIExploration", "等待 Spicetify.Player 加载...");

    const maxWaitTime = 5000;
    const startTime = Date.now();

    while (!Spicetify.Player) {
      if (Date.now() - startTime > maxWaitTime) {
        Logger.error("PlayerAPIExploration", "Player 加载超时（5秒）");
        throw new Error("Player initialization timeout");
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    Logger.info("PlayerAPIExploration", `✅ Player 加载完成（耗时 ${Date.now() - startTime}ms）`);
  }

  /**
   * 测试 1: 初始化时序
   * 测试扩展启动时 Player 对象的加载顺序和数据可用性
   */
  private static async testInitializationTiming() {
    Logger.info("PlayerAPIExploration", "\n========== 测试 1: 初始化时序 ==========");

    // 立即检测
    const immediateCheck = {
      playerAvailable: !!Spicetify.Player,
      dataAvailable: !!Spicetify.Player?.data,
      itemAvailable: !!Spicetify.Player?.data?.item,
      isPlaying: Spicetify.Player?.isPlaying?.() ?? false,
      currentTrack: Spicetify.Player?.data?.item
        ? {
            uri: Spicetify.Player.data.item.uri,
            name: Spicetify.Player.data.item.name,
            artists: Spicetify.Player.data.item.artists?.map((a) => a.name).join(", "),
          }
        : null,
    };

    Logger.info("PlayerAPIExploration", "[立即检测] 初始化时的 Player 状态:");
    console.log(JSON.stringify(immediateCheck, null, 2));

    // 延迟 500ms 检测
    await new Promise((resolve) => setTimeout(resolve, 500));

    const delayedCheck = {
      playerAvailable: !!Spicetify.Player,
      dataAvailable: !!Spicetify.Player?.data,
      itemAvailable: !!Spicetify.Player?.data?.item,
      isPlaying: Spicetify.Player?.isPlaying?.() ?? false,
      currentTrack: Spicetify.Player?.data?.item
        ? {
            uri: Spicetify.Player.data.item.uri,
            name: Spicetify.Player.data.item.name,
            artists: Spicetify.Player.data.item.artists?.map((a) => a.name).join(", "),
          }
        : null,
    };

    Logger.info("PlayerAPIExploration", "[延迟 500ms 检测] Player 状态:");
    console.log(JSON.stringify(delayedCheck, null, 2));

    // 对比分析
    const dataChanged = JSON.stringify(immediateCheck) !== JSON.stringify(delayedCheck);
    Logger.info(
      "PlayerAPIExploration",
      `📊 数据变化: ${dataChanged ? "是（建议使用延迟检测）" : "否（立即检测即可）"}`
    );
  }

  /**
   * 测试 2: Player.data 数据结构
   * 检查 Player.data 的可用性和数据完整性
   */
  private static testPlayerData() {
    Logger.info("PlayerAPIExploration", "\n========== 测试 2: Player.data 数据结构 ==========");

    const data = Spicetify.Player?.data;

    if (!data) {
      Logger.warn("PlayerAPIExploration", "⚠️ Player.data 不可用（可能没有歌曲在播放）");
      return;
    }

    // 提取关键字段
    const dataStructure = {
      available: !!data,
      topLevelKeys: Object.keys(data),
      item: data.item
        ? {
            uri: data.item.uri,
            name: data.item.name,
            artists: data.item.artists?.map((a) => ({ name: a.name, uri: a.uri })),
            album: data.item.album
              ? {
                  name: data.item.album.name,
                  uri: data.item.album.uri,
                }
              : null,
            duration: data.item.duration?.milliseconds,
            isLocal: data.item.isLocal,
            isExplicit: data.item.isExplicit,
          }
        : null,
      isPlaying: Spicetify.Player.isPlaying(),
      timestamp: data.timestamp,
      context: data.context
        ? {
            uri: data.context.uri,
            metadata: data.context.metadata,
          }
        : null,
    };

    Logger.info("PlayerAPIExploration", "📄 Player.data 完整结构:");
    console.log(JSON.stringify(dataStructure, null, 2));

    // 数据完整性检查
    const hasRequiredFields =
      data.item?.uri && data.item?.name && data.item?.artists && data.item?.album && data.item?.duration;

    Logger.info(
      "PlayerAPIExploration",
      `✅ 数据完整性: ${hasRequiredFields ? "完整（包含所有必需字段）" : "不完整（缺少部分字段）"}`
    );
  }

  /**
   * 测试 3: songchange 事件
   * 监听 songchange 事件并记录触发时机、频率、数据结构
   */
  private static testSongChangeEvent() {
    Logger.info("PlayerAPIExploration", "\n========== 测试 3: songchange 事件 ==========");
    Logger.info("PlayerAPIExploration", "开始监听 songchange 事件...");

    Spicetify.Player.addEventListener("songchange", (event) => {
      this.songChangeCount++;
      const now = Date.now();
      const interval = now - this.lastEventTimestamp;
      this.lastEventTimestamp = now;

      const currentTrack = Spicetify.Player?.data?.item;
      const trackUri = currentTrack?.uri || null;

      // URI 去重检测
      const isDuplicate = trackUri === this.lastTrackUri;
      this.lastTrackUri = trackUri;

      Logger.info("PlayerAPIExploration", `\n[songchange #${this.songChangeCount}] 事件触发`);
      Logger.info("PlayerAPIExploration", `⏱️  距离上次事件: ${interval}ms`);
      Logger.info("PlayerAPIExploration", `🔄 是否重复触发: ${isDuplicate ? "是（同一首歌）" : "否"}`);

      // 输出事件数据
      const eventData = {
        eventData: event?.data || null,
        playerData: currentTrack
          ? {
              uri: currentTrack.uri,
              name: currentTrack.name,
              artists: currentTrack.artists?.map((a) => a.name).join(", "),
              album: currentTrack.album?.name,
              duration: currentTrack.duration?.milliseconds,
            }
          : null,
        isPlaying: Spicetify.Player.isPlaying(),
      };

      console.log(JSON.stringify(eventData, null, 2));
    });

    Logger.info("PlayerAPIExploration", "✅ songchange 事件监听器已注册");
  }

  /**
   * 测试 4: onplaypause 事件
   * 监听 onplaypause 事件并记录暂停/恢复播放时的行为
   */
  private static testPlayPauseEvent() {
    Logger.info("PlayerAPIExploration", "\n========== 测试 4: onplaypause 事件 ==========");
    Logger.info("PlayerAPIExploration", "开始监听 onplaypause 事件...");

    Spicetify.Player.addEventListener("onplaypause", (event) => {
      this.playPauseCount++;
      const now = Date.now();
      const interval = now - this.lastEventTimestamp;
      this.lastEventTimestamp = now;

      const isPlaying = Spicetify.Player.isPlaying();
      const currentTrack = Spicetify.Player?.data?.item;

      Logger.info("PlayerAPIExploration", `\n[onplaypause #${this.playPauseCount}] 事件触发`);
      Logger.info("PlayerAPIExploration", `⏱️  距离上次事件: ${interval}ms`);
      Logger.info("PlayerAPIExploration", `▶️  播放状态: ${isPlaying ? "播放中" : "已暂停"}`);

      // 输出事件数据
      const eventData = {
        eventData: event?.data || null,
        isPlaying,
        currentTrack: currentTrack
          ? {
              uri: currentTrack.uri,
              name: currentTrack.name,
              artists: currentTrack.artists?.map((a) => a.name).join(", "),
            }
          : null,
      };

      console.log(JSON.stringify(eventData, null, 2));
    });

    Logger.info("PlayerAPIExploration", "✅ onplaypause 事件监听器已注册");
  }

  /**
   * 获取测试统计信息
   */
  static getTestStats() {
    return {
      songChangeCount: this.songChangeCount,
      playPauseCount: this.playPauseCount,
      lastTrackUri: this.lastTrackUri,
    };
  }
}
