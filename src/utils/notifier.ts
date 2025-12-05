/**
 * Notifier 通知工具类
 *
 * 封装 Spicetify 通知 API，提供用户友好的通知系统
 * 根据 DEBUG_MODE 控制通知显示策略
 */

import { Logger, DEBUG_MODE } from "./logger";

export class Notifier {
  /**
   * 私有构造函数，防止实例化
   * @throws {Error} 如果尝试实例化此类
   */
  private constructor() {
    throw new Error("Notifier 不能被实例化，请使用静态方法");
  }

  /**
   * 成功通知（仅生产模式）
   *
   * @param message - 通知消息
   *
   * @example
   * Notifier.success("LikedSongs 加载完成");
   */
  static success(message: string) {
    if (!DEBUG_MODE) {
      Spicetify.showNotification(message, false, 3000);
    }
    Logger.info("Notifier", `✅ ${message}`);
  }

  /**
   * 错误通知（始终显示）
   *
   * @param message - 错误消息
   *
   * @example
   * Notifier.error("数据加载失败");
   */
  static error(message: string) {
    Spicetify.showNotification(message, true, 5000);
    Logger.error("Notifier", message);
  }

  /**
   * 警告通知（仅生产模式）
   *
   * @param message - 警告消息
   *
   * @example
   * Notifier.warn("网络连接不稳定");
   */
  static warn(message: string) {
    if (!DEBUG_MODE) {
      Spicetify.showNotification(message, true, 4000);
    }
    Logger.warn("Notifier", message);
  }

  /**
   * 加载通知（仅开发模式）
   *
   * @param message - 加载消息
   *
   * @example
   * Notifier.loading("正在加载数据...");
   */
  static loading(message: string) {
    // 仅在开发模式下显示加载通知
    if (DEBUG_MODE) {
      Spicetify.showNotification(message, false, 2000);
    }
    Logger.debug("Notifier", `⏳ ${message}`);
  }
}
