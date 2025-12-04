import { LikedSongsAPITest } from './tests/liked-songs-api-test'; // 保留用于可选的 API 测试
import { DEBUG_MODE, Logger } from './utils/logger';
import { TEST_CONFIG } from './utils/api-tester'; // 保留用于可选的 API 测试
import { LikedSongsManager } from './managers/liked-songs-manager';

async function main() {
  // 等待 Spicetify 加载
  while (!Spicetify?.showNotification) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  Logger.info('App', 'Spicetify Dedup 扩展已启动');

  try {
    // 初始化 LikedSongs 管理器
    await LikedSongsManager.initialize();

    // 开发模式下输出统计信息
    if (DEBUG_MODE) {
      const stats = LikedSongsManager.getStats();
      Logger.table([stats]);

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
