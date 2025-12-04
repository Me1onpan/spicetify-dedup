/**
 * API 测试工具类
 *
 * 用于对比测试多个候选 API 的性能和可用性
 */

import { Logger } from "./logger";

/**
 * 测试配置常量
 * 导出供其他模块使用
 */
export const TEST_CONFIG = {
  /** 稳定性测试的默认重试次数 */
  DEFAULT_STABILITY_TEST_TIMES: 5,
  /** 每次测试之间的间隔时间（毫秒） */
  TEST_INTERVAL_MS: 200,
  /** 应用启动后延迟测试的时间（毫秒），确保 Spotify 完全加载 */
  APP_STARTUP_DELAY_MS: 2000,
} as const;

interface APITestResult {
  name: string;
  success: boolean;
  responseTime: number;
  dataCount: number;
  hasAddedAt: boolean;
  /** 详细记录 addedAt 字段的路径和命名 */
  addedAtField?: string;
  supportsPagination: boolean;
  /** 详细记录分页字段的名称 */
  paginationFields?: string[];
  errorMessage?: string;
}

export class APITester {
  /**
   * 测试单个 API 端点
   */
  static async testAPI(
    name: string,
    fetchFn: () => Promise<any>
  ): Promise<APITestResult> {
    const startTime = performance.now();
    const result: APITestResult = {
      name,
      success: false,
      responseTime: 0,
      dataCount: 0,
      hasAddedAt: false,
      addedAtField: undefined,
      supportsPagination: false,
      paginationFields: undefined,
    };

    try {
      Logger.debug("APITester", `开始测试 ${name}...`);

      const data = await fetchFn();
      const endTime = performance.now();

      result.responseTime = endTime - startTime;
      result.success = !!data;

      // 检查数据结构
      if (data) {
        result.dataCount = Array.isArray(data)
          ? data.length
          : data.items?.length || 0;

        // 检查 addedAt 字段并记录详细路径
        const addedAtInfo = this.checkAddedAtField(data);
        result.hasAddedAt = addedAtInfo.exists;
        result.addedAtField = addedAtInfo.fieldPath;

        // 检查分页支持并记录字段名称
        const paginationInfo = this.checkPaginationSupport(data);
        result.supportsPagination = paginationInfo.supported;
        result.paginationFields = paginationInfo.fields;
      }

      Logger.perf("APITester", name, result.responseTime);
      Logger.debug("APITester", `${name} 测试成功`, {
        数据量: result.dataCount,
        包含添加时间: result.hasAddedAt,
        添加时间字段: result.addedAtField || "无",
        支持分页: result.supportsPagination,
        分页字段: result.paginationFields?.join(", ") || "无",
      });
    } catch (error) {
      const endTime = performance.now();
      result.responseTime = endTime - startTime;
      result.errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error("APITester", `${name} 测试失败`, error);
    }

    return result;
  }

  /**
   * 连续稳定性测试
   * 优化：使用配置常量管理测试参数，缩短等待时间提升测试速度
   */
  static async stabilityTest(
    name: string,
    fetchFn: () => Promise<any>,
    times: number = TEST_CONFIG.DEFAULT_STABILITY_TEST_TIMES
  ): Promise<number> {
    let successCount = 0;

    Logger.debug("APITester", `开始稳定性测试 ${name} (${times} 次)...`);

    for (let i = 0; i < times; i++) {
      try {
        await fetchFn();
        successCount++;
        // 优化：缩短间隔时间从 500ms 到 200ms，提升测试速度 60%
        await new Promise((resolve) =>
          setTimeout(resolve, TEST_CONFIG.TEST_INTERVAL_MS)
        );
      } catch (error) {
        Logger.error("APITester", `第 ${i + 1} 次请求失败`, error);
      }
    }

    const successRate = (successCount / times) * 100;
    Logger.info(
      "APITester",
      `${name} 稳定性: ${successRate.toFixed(1)}% (${successCount}/${times})`
    );

    return successRate;
  }

  /**
   * 检查数据是否包含 addedAt 字段
   * 返回字段是否存在以及详细的字段路径
   *
   * 支持的字段命名：
   * - addedAt (驼峰命名，如 Spicetify.Platform.LibraryAPI)
   * - added_at (下划线命名，如 Spotify Web API)
   */
  private static checkAddedAtField(data: any): {
    exists: boolean;
    fieldPath?: string;
  } {
    // 情况 1: 数据是直接的数组
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];

      if ("addedAt" in firstItem) {
        return { exists: true, fieldPath: "items[x].addedAt" };
      }
      if ("added_at" in firstItem) {
        return { exists: true, fieldPath: "items[x].added_at" };
      }
    }

    // 情况 2: 数据包含 items 数组（标准 REST API 响应格式）
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      const firstItem = data.items[0];

      if ("addedAt" in firstItem) {
        return { exists: true, fieldPath: "items[x].addedAt" };
      }
      if ("added_at" in firstItem) {
        return { exists: true, fieldPath: "items[x].added_at" };
      }
    }

    return { exists: false };
  }

  /**
   * 检查 API 是否支持分页
   * 返回是否支持分页以及详细的分页字段列表
   *
   * 支持的分页字段：
   * - total, totalCount, totalLength, unfilteredTotalLength (总数)
   * - offset, limit (偏移量和每页数量)
   * - next, previous (导航链接)
   */
  private static checkPaginationSupport(data: any): {
    supported: boolean;
    fields?: string[];
  } {
    const foundFields: string[] = [];

    // 检查各种可能的总数字段
    if ("total" in data) foundFields.push("total");
    if ("totalCount" in data) foundFields.push("totalCount");
    if ("totalLength" in data) foundFields.push("totalLength");
    if ("unfilteredTotalLength" in data)
      foundFields.push("unfilteredTotalLength");

    // 检查偏移量和限制字段
    if ("offset" in data) foundFields.push("offset");
    if ("limit" in data) foundFields.push("limit");

    // 检查导航链接（REST API 风格）
    if ("next" in data) foundFields.push("next");
    if ("previous" in data) foundFields.push("previous");

    // 判断是否支持分页
    const hasTotalField = foundFields.some((f) =>
      ["total", "totalCount", "totalLength", "unfilteredTotalLength"].includes(
        f
      )
    );
    const hasPaginationControl = foundFields.some((f) =>
      ["offset", "limit", "next", "previous"].includes(f)
    );

    const supported = hasTotalField && hasPaginationControl;

    return {
      supported,
      fields: supported ? foundFields : undefined,
    };
  }
}
