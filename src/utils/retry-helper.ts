/**
 * RetryHelper 重试工具类
 *
 * 提供通用的重试机制，包含指数退避策略，用于处理网络错误、API 失败等异常情况
 */

import { Logger } from "./logger";

/**
 * 重试选项配置
 */
interface RetryOptions {
  /** 最大重试次数，默认 3 */
  maxRetries?: number;
  /** 初始重试延迟（毫秒），默认 1000 */
  delay?: number;
  /** 是否启用指数退避策略，默认 true */
  useExponentialBackoff?: boolean;
  /** 重试回调函数 */
  onRetry?: (attempt: number, error: unknown) => void;
}

export class RetryHelper {
  /**
   * 私有构造函数，防止实例化
   * @throws {Error} 如果尝试实例化此类
   */
  private constructor() {
    throw new Error("RetryHelper 不能被实例化，请使用静态方法");
  }

  /**
   * 带重试的异步操作
   *
   * @param fn - 要执行的异步函数
   * @param options - 重试选项配置
   * @returns 函数执行结果
   *
   * @example
   * // 使用指数退避策略（默认）
   * const data = await RetryHelper.withRetry(
   *   async () => await fetchData(),
   *   {
   *     maxRetries: 3,
   *     delay: 1000,
   *     onRetry: (attempt, error) => {
   *       console.log(`重试第 ${attempt} 次`, error);
   *     }
   *   }
   * );
   *
   * @example
   * // 使用固定延迟
   * const data = await RetryHelper.withRetry(
   *   async () => await fetchData(),
   *   {
   *     maxRetries: 3,
   *     delay: 2000,
   *     useExponentialBackoff: false
   *   }
   * );
   */
  static async withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const { maxRetries = 3, delay = 1000, useExponentialBackoff = true, onRetry } = options;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          // 计算实际延迟时间：指数退避或固定延迟
          const actualDelay = useExponentialBackoff ? delay * Math.pow(2, attempt - 1) : delay;

          Logger.warn(
            "RetryHelper",
            `操作失败，${actualDelay}ms 后重试 (${attempt}/${maxRetries})`
          );

          onRetry?.(attempt, error);

          await new Promise((resolve) => setTimeout(resolve, actualDelay));
        }
      }
    }

    throw lastError;
  }
}
