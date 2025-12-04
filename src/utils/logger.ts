/**
 * Logger 工具类
 *
 * 用于统一管理日志输出，支持 DEBUG 模式控制
 * 所有日志输出到 Chrome DevTools Console
 */

export const DEBUG_MODE = true; // 发布时改为 false

export class Logger {
  /**
   * 开发模式日志（仅在 DEBUG_MODE 为 true 时输出）
   */
  static debug(module: string, message: string, ...args: any[]) {
    if (DEBUG_MODE) {
      console.log(`[${module}] ${message}`, ...args);
    }
  }

  /**
   * 信息日志（始终输出）
   */
  static info(module: string, message: string, ...args: any[]) {
    console.info(`[${module}] ${message}`, ...args);
  }

  /**
   * 错误日志（始终输出）
   */
  static error(module: string, message: string, error?: any) {
    console.error(`[${module}] ${message}`, error);
  }

  /**
   * 性能测试日志
   */
  static perf(module: string, action: string, duration: number) {
    if (DEBUG_MODE) {
      console.log(`[${module}] ⚡ ${action} 耗时: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * 表格形式展示测试结果
   */
  static table(data: any[]) {
    if (DEBUG_MODE) {
      console.table(data);
    }
  }
}
