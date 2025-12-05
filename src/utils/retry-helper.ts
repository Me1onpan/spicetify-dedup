/**
 * RetryHelper 重试工具类
 *
 * 提供通用的重试机制，用于处理网络错误、API 失败等异常情况
 */

import { Logger } from "./logger";

/**
 * 重试选项配置
 */
interface RetryOptions {
  /** 最大重试次数，默认 3 */
  maxRetries?: number;
  /** 重试延迟（毫秒），默认 1000 */
  delay?: number;
  /** 重试回调函数 */
  onRetry?: (attempt: number, error: any) => void;
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
   * const data = await RetryHelper.withRetry(
   *   async () => await fetchData(),
   *   {
   *     maxRetries: 3,
   *     delay: 2000,
   *     onRetry: (attempt, error) => {
   *       console.log(`重试第 ${attempt} 次`, error);
   *     }
   *   }
   * );
   */
  static async withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const { maxRetries = 3, delay = 1000, onRetry } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          Logger.warn("RetryHelper", `操作失败,${delay}ms 后重试 (${attempt}/${maxRetries})`);

          onRetry?.(attempt, error);

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}
