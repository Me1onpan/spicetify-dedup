/**
 * LikedSongs API 配置
 *
 * 选型依据 (测试时间: 2025-12-03):
 * - 测试了 3 个候选 API:
 *   - API A (core-collection): 失败，返回 0 条数据
 *   - API B (Platform.LibraryAPI): 响应时间 22.7ms，100% 稳定性 ✅
 *   - API C (Spotify Web API): 响应时间 2525.8ms (慢 111 倍)，100% 稳定性
 *
 * - 🏆 最终选择: Spicetify.Platform.LibraryAPI
 * - 选择理由:
 *   1. 响应速度: 22.7ms (最快，用户体验流畅)
 *   2. 数据完整性: 包含所有必需字段（uri, name, artists, album, addedAt, duration）
 *   3. 稳定性: 100% (连续 5 次测试全部成功)
 *   4. 分页支持: 良好 (提供 totalLength 和 unfilteredTotalLength)
 *   5. 开发友好: 无需额外认证，本地调用可靠
 *
 * 详见完整测试报告: .claude/plan/api-test-results.md
 */

export const LIKED_SONGS_API_CONFIG = {
  /**
   * 选定的 API 类型
   * 使用 Spicetify.Platform.LibraryAPI.getTracks() 获取 LikedSongs 数据
   */
  apiType: 'Platform.LibraryAPI' as const,

  /**
   * 分页配置
   * - defaultLimit: 默认每页条数（基于测试结果，API 默认返回 50 条）
   * - maxLimit: 最大每页条数（根据 API 性能和内存考虑）
   */
  pagination: {
    defaultLimit: 50,
    maxLimit: 100
  },

  /**
   * 缓存配置
   * - updateInterval: 缓存更新间隔（3 分钟，平衡性能和数据新鲜度）
   * - enableEventListener: 是否启用事件监听增强（监听歌曲添加/删除事件实时更新缓存）
   */
  cache: {
    updateInterval: 3 * 60 * 1000, // 3 分钟
    enableEventListener: true
  },

  /**
   * 降级方案配置
   * 如果 Platform.LibraryAPI 不可用，可降级到 Spotify Web API
   */
  fallback: {
    enabled: true,
    apiType: 'Web API' as const,
    endpoint: 'https://api.spotify.com/v1/me/tracks'
  }
} as const;
