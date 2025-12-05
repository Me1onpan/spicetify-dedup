/**
 * LikedSongs API 对比测试
 *
 * 测试 3 个候选 API 的可用性、性能和稳定性
 * 并自动生成推荐结论
 */

import { Logger } from "../utils/logger";
import { APITester, TEST_CONFIG } from "../utils/api-tester";

/**
 * API 测试函数类型定义
 */
type APITestFunction = () => Promise<any>;

/**
 * API 名称枚举（用于类型安全）
 */
enum APIName {
  CoreCollection = "API A (core-collection)",
  PlatformLibrary = "API B (Platform.LibraryAPI)",
  SpotifyWeb = "API C (Spotify Web API)",
}

export class LikedSongsAPITest {
  /**
   * API 测试函数映射表
   * 使用 Map 统一管理所有 API 测试函数，避免重复的条件判断
   */
  private static readonly apiTestFunctions = new Map<string, APITestFunction>([
    [APIName.CoreCollection, () => LikedSongsAPITest.testCoreCollectionAPI()],
    [APIName.PlatformLibrary, () => LikedSongsAPITest.testPlatformLibraryAPI()],
    [APIName.SpotifyWeb, () => LikedSongsAPITest.testSpotifyWebAPI()],
  ]);
  /**
   * 执行完整的 API 对比测试
   */
  static async runFullTest() {
    Logger.info("LikedSongsAPITest", "========== 开始 LikedSongs API 对比测试 ==========");

    const results = [];
    const rawDataMap = new Map<string, any>(); // 存储原始数据

    // 使用枚举类型迭代所有 API 进行测试
    for (const [apiName, testFunction] of this.apiTestFunctions.entries()) {
      Logger.info("LikedSongsAPITest", `\n========== 测试 ${apiName} ==========`);

      const result = await APITester.testAPI(apiName, async () => {
        const data = await testFunction();
        rawDataMap.set(apiName, data);
        return data;
      });

      results.push(result);
      this.printRawDataSample(apiName, rawDataMap.get(apiName));
    }

    // 展示对比结果
    Logger.info("LikedSongsAPITest", "\n========== 测试结果对比 ==========");
    Logger.table(results);

    // 稳定性测试（对成功的 API 进行）
    for (const result of results) {
      if (result.success) {
        await this.runStabilityTest(result.name);
      }
    }

    Logger.info("LikedSongsAPITest", "========== 测试完成 ==========");
    this.printRecommendation(results);
  }

  /**
   * API A: sp://core-collection/unstable/@/list/tracks
   */
  private static async testCoreCollectionAPI() {
    const response = await Spicetify.CosmosAsync.get("sp://core-collection/unstable/@/list/tracks", {
      limit: 50,
      offset: 0,
    });
    return response;
  }

  /**
   * API B: Spicetify.Platform.LibraryAPI
   */
  private static async testPlatformLibraryAPI() {
    if (!Spicetify.Platform?.LibraryAPI) {
      throw new Error("Platform.LibraryAPI 不可用");
    }

    const response = await Spicetify.Platform.LibraryAPI.getTracks({
      limit: 50,
      offset: 0,
    });
    return response;
  }

  /**
   * API C: Spotify Web API (通过 CosmosAsync 调用)
   */
  private static async testSpotifyWebAPI() {
    const response = await Spicetify.CosmosAsync.get("https://api.spotify.com/v1/me/tracks", { limit: 50, offset: 0 });
    return response;
  }

  /**
   * 稳定性测试
   * 使用映射表查找对应的测试函数，避免字符串匹配
   */
  private static async runStabilityTest(apiName: string) {
    Logger.info("LikedSongsAPITest", `开始稳定性测试: ${apiName}`);

    // 从映射表中获取测试函数
    const fetchFn = this.apiTestFunctions.get(apiName);

    if (!fetchFn) {
      Logger.error("LikedSongsAPITest", `未找到 API 测试函数: ${apiName}`);
      return 0;
    }

    const successRate = await APITester.stabilityTest(apiName, fetchFn, TEST_CONFIG.DEFAULT_STABILITY_TEST_TIMES);
    return successRate;
  }

  /**
   * 打印原始数据样本
   * 输出完整的响应结构和前 2 条数据，方便填写测试文档
   */
  private static printRawDataSample(apiName: string, data: any) {
    if (!data) {
      Logger.error("LikedSongsAPITest", `${apiName} - 无数据返回`);
      return;
    }

    Logger.info("LikedSongsAPITest", `\n📄 ${apiName} - 原始响应结构:`);

    // 输出顶层结构
    const topLevelKeys = Object.keys(data);
    Logger.info("LikedSongsAPITest", `顶层字段: ${topLevelKeys.join(", ")}`);

    // 输出完整的 JSON 数据（格式化）
    Logger.info("LikedSongsAPITest", "\n完整响应数据 (JSON):");
    console.log(JSON.stringify(data, null, 2));

    // 如果有 items 数组，输出前 2 条数据的结构
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      Logger.info("LikedSongsAPITest", `\n📦 数据项结构 (共 ${data.items.length} 条，展示前 2 条):`);
      const sampleItems = data.items.slice(0, 2);
      console.log(JSON.stringify(sampleItems, null, 2));
    } else if (Array.isArray(data) && data.length > 0) {
      Logger.info("LikedSongsAPITest", `\n📦 数据项结构 (共 ${data.length} 条，展示前 2 条):`);
      const sampleItems = data.slice(0, 2);
      console.log(JSON.stringify(sampleItems, null, 2));
    }

    Logger.info("LikedSongsAPITest", "\n-----------------------------------\n");
  }

  /**
   * 打印推荐结论
   */
  private static printRecommendation(results: any[]) {
    const successfulAPIs = results.filter((r) => r.success);

    if (successfulAPIs.length === 0) {
      Logger.error("LikedSongsAPITest", "所有 API 测试均失败！");
      return;
    }

    // 按响应时间排序
    successfulAPIs.sort((a, b) => a.responseTime - b.responseTime);

    Logger.info("LikedSongsAPITest", "========== 推荐方案 ==========");
    Logger.info("LikedSongsAPITest", `🏆 推荐使用: ${successfulAPIs[0].name}`);
    Logger.info("LikedSongsAPITest", `   原因: 响应最快 (${successfulAPIs[0].responseTime.toFixed(2)}ms), 数据完整`);
  }
}
