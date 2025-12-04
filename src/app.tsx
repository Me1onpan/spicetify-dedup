import { LikedSongsAPITest } from './tests/liked-songs-api-test';
import { DEBUG_MODE } from './utils/logger';
import { TEST_CONFIG } from './utils/api-tester';

async function main() {
  // 等待 Spicetify 加载
  while (!Spicetify?.showNotification) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 开发模式下自动运行 API 测试
  if (DEBUG_MODE) {
    // 延迟确保 Spotify 完全加载（使用配置常量）
    setTimeout(async () => {
      await LikedSongsAPITest.runFullTest();
    }, TEST_CONFIG.APP_STARTUP_DELAY_MS);
  }
}

export default main;
