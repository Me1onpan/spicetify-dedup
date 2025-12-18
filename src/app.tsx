import { LikedSongsAPITest } from './tests/liked-songs-api-test'; // 保留用于可选的 API 测试
import { DEBUG_MODE, Logger } from './utils/logger';
import { TEST_CONFIG } from './utils/api-tester'; // 保留用于可选的 API 测试
import { LikedSongsManager } from './managers/liked-songs-manager';
import { CurrentTrackDetector } from './detectors/current-track-detector';

async function main() {
  // 等待 Spicetify 加载
  while (!Spicetify?.showNotification) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  Logger.info('App', 'Spicetify Dedup 扩展已启动');

  try {
    // 初始化 LikedSongs 管理器
    await LikedSongsManager.initialize();

    // 初始化 CurrentTrackDetector
    await CurrentTrackDetector.initialize();

    // 注册歌曲变更回调（暂时只输出日志）
    CurrentTrackDetector.onTrackChange((track) => {
      Logger.info('App', () =>
        `🎵 歌曲切换: ${track.name} - ${track.artists?.map(a => a.name).join(', ')}`
      );
      // TODO: 在此处添加查重逻辑
    });

    // 如果初始化时检测到歌曲，手动触发一次回调
    // 这样可以确保扩展启动时已在播放的歌曲也能触发回调
    // 使用 forceCheckIgnoreCache() 忽略 URI 去重，确保回调能够触发
    const currentTrack = CurrentTrackDetector.getCurrentTrack();
    if (currentTrack) {
      Logger.info('App', '检测到初始化时有歌曲在播放，手动触发回调');
      CurrentTrackDetector.forceCheckIgnoreCache();
    }

    // 开发模式下输出统计信息
    if (DEBUG_MODE) {
      const stats = LikedSongsManager.getStats();
      Logger.table([stats]);

      // ⚠️ 开发模式警告：暴露管理器到全局
      // 注意：此功能仅用于开发和调试，不应在生产环境中启用
      // 确保在发布前将 DEBUG_MODE 设置为 false
      Logger.info('App', '⚠️ 开发模式已启用 - 仅用于开发和调试');
      Logger.info('App', '⚠️ 发布前请确保 DEBUG_MODE = false');

      // 暴露管理器到全局，便于在 DevTools 中手动测试
      (window as any).LikedSongsManager = LikedSongsManager;
      Logger.info('App', '✅ LikedSongsManager 已暴露到全局 (window.LikedSongsManager)');
      Logger.info('App', '💡 可在 Console 中执行: await LikedSongsManager.loadAllData()');

      // 暴露 CurrentTrackDetector 到全局
      (window as any).CurrentTrackDetector = CurrentTrackDetector;
      Logger.info('App', '✅ CurrentTrackDetector 已暴露到全局 (window.CurrentTrackDetector)');
      Logger.info('App', '💡 可在 Console 中执行: CurrentTrackDetector.forceCheck()');

      // 延迟确保 Spotify 完全加载后运行 API 测试（可选）
      // 注释掉以避免重复测试，如需测试请取消注释
      /*
      setTimeout(async () => {
        await LikedSongsAPITest.runFullTest();
      }, TEST_CONFIG.APP_STARTUP_DELAY_MS);
      */
    }
  } catch (error) {
    Logger.error('App', '初始化失败', error);
    Spicetify.showNotification('Dedup 扩展初始化失败', true);
  }
}

export default main;
