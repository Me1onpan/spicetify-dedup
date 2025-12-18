/**
 * Detectors 模块导出
 *
 * 统一导出所有检测器类和相关类型定义
 */

// 导出 CurrentTrackDetector 类
export { CurrentTrackDetector } from "./current-track-detector";

// 导出类型定义
export type {
  TrackChangeCallback,
  PlayPauseCallback,
} from "../types/current-track";
