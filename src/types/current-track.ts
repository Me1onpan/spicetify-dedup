/**
 * CurrentTrackDetector 类型定义
 *
 * 定义当前播放歌曲检测器相关的回调函数类型
 */

/**
 * 歌曲变更回调函数类型
 *
 * 当检测到歌曲切换时，会调用此类型的回调函数
 *
 * @param track - 当前播放的歌曲信息
 *
 * @example
 * const callback: TrackChangeCallback = (track) => {
 *   console.log('歌曲切换:', track.name);
 *   console.log('艺术家:', track.artists?.map(a => a.name).join(', '));
 * };
 */
export type TrackChangeCallback = (track: Spicetify.PlayerTrack) => void;

/**
 * 播放/暂停状态变更回调函数类型（预留接口）
 *
 * 当播放/暂停状态发生变化时，会调用此类型的回调函数
 *
 * @param isPlaying - 是否正在播放
 * @param track - 当前歌曲信息，如果没有歌曲则为 null
 *
 * @example
 * const callback: PlayPauseCallback = (isPlaying, track) => {
 *   if (isPlaying && track) {
 *     console.log('开始播放:', track.name);
 *   } else {
 *     console.log('暂停播放');
 *   }
 * };
 */
export type PlayPauseCallback = (
  isPlaying: boolean,
  track: Spicetify.PlayerTrack | null
) => void;
