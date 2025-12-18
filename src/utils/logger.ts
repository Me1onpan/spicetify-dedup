/**
 * Logger 工具类
 *
 * 用于统一管理日志输出，支持 DEBUG 模式控制
 * 所有日志输出到 Chrome DevTools Console
 */

export const DEBUG_MODE = true; // 发布时改为 false

export class Logger {
  private static readonly PREFIX = "[Spicetify-Dedup]";

  /**
   * 解析消息（支持字符串或函数）
   * 函数形式用于延迟计算，避免不必要的字符串拼接
   */
  private static resolveMessage(message: string | (() => string)): string {
    return typeof message === "function" ? message() : message;
  }

  /**
   * 开发模式日志（仅在 DEBUG_MODE 为 true 时输出）
   */
  static debug(module: string, message: string | (() => string), ...args: any[]) {
    if (DEBUG_MODE) {
      console.log(`${this.PREFIX} [DEBUG] [${module}] ${this.resolveMessage(message)}`, ...args);
    }
  }

  /**
   * 信息日志（仅在 DEBUG_MODE 为 true 时输出）
   */
  static info(module: string, message: string | (() => string), ...args: any[]) {
    if (DEBUG_MODE) {
      console.info(`${this.PREFIX} [INFO] [${module}] ${this.resolveMessage(message)}`, ...args);
    }
  }

  /**
   * 警告日志（仅在 DEBUG_MODE 为 true 时输出）
   */
  static warn(module: string, message: string | (() => string), ...args: any[]) {
    if (DEBUG_MODE) {
      console.warn(`${this.PREFIX} [WARN] [${module}] ${this.resolveMessage(message)}`, ...args);
    }
  }

  /**
   * 错误日志（仅在 DEBUG_MODE 为 true 时输出）
   */
  static error(module: string, message: string | (() => string), error?: any) {
    if (DEBUG_MODE) {
      console.error(`${this.PREFIX} [ERROR] [${module}] ${this.resolveMessage(message)}`, error);
    }
  }

  /**
   * 性能测试日志
   */
  static perf(module: string, action: string, duration: number) {
    if (DEBUG_MODE) {
      const emoji = duration < 100 ? "⚡" : duration < 500 ? "🚀" : "🐢";
      console.log(`${this.PREFIX} [PERF] [${module}] ${emoji} ${action} 耗时: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * 表格形式展示数据
   */
  static table(data: any[]) {
    if (DEBUG_MODE) {
      console.log(`${this.PREFIX} [TABLE]`);
      console.table(data);
    }
  }

  /**
   * 分组日志（方便折叠查看）
   */
  static group(title: string, fn: () => void) {
    if (DEBUG_MODE) {
      console.group(`${this.PREFIX} ${title}`);
      fn();
      console.groupEnd();
    }
  }

  /**
   * 统计信息展示
   */
  static stats(module: string, stats: Record<string, any>) {
    if (DEBUG_MODE) {
      this.group(`[${module}] 统计信息`, () => {
        Object.entries(stats).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    }
  }
}
