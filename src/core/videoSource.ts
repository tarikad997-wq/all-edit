import type { Layer } from './audio'
import { canDecode, decodeMp4, extractAudioCopy, isMp4 } from './demux'
import { seekVideo, frameReady } from './media'
/** مصدر الصورة: عنصر video (للمعاينة) أو VideoFrame (للتصدير الدقيق) مع زاوية التدوير */
export interface Src { img: CanvasImageSource; w: number; h: number; rot: number }
export const fromVideo = (v: HTMLVideoElement | null): Src | null => (v && v.readyState >= 2 && v.videoWidth ? { img: v, w: v.videoWidth, h: v.videoHeight, rot: 0 } : null)
export function drawSrc(ctx: CanvasRenderingContext2D, src: Src, X: number, Y: number, w: number, h: number, fit: 'cover' | 'contain') {
  const sw = src.rot % 180 ? src.h : src.w, sh = src.rot % 180 ? src.w : src.h, k = (fit === 'cover' ? Math.max : Math.min)(w / sw, h / sh)
  ctx.save(); ctx.translate(X + w / 2, Y + h / 2); ctx.rotate(src.rot * Math.PI / 180); ctx.drawImage(src.img, -src.w * k / 2, -src.h * k / 2, src.w * k, src.h * k); ctx.restore()
}
/** إدخال/إخراج الفيديو لأي مشهد: معاينة، تصدير دقيق (MP4/MOV) أو قفز دقيق احتياطي، وصوت الفيديو */
export function makeVideoIO(video: HTMLVideoElement, file: File, start: number, length: number, mute: boolean) {
  let src: Src | null = null
  return {
    current: () => src ?? fromVideo(video),
    prepare: async () => { video.muted = true; video.pause() },
    play: canDecode(file) ? async (emit: (t: number) => Promise<void>, signal?: AbortSignal) => { let started = false
      try { await decodeMp4(file, start, start + length, async (fr, t, rot) => { started = true; src = { img: fr, w: fr.displayWidth, h: fr.displayHeight, rot }; await emit(t) }, signal); return true }
      catch (e) { if (started || (e as Error).name === 'AbortError') throw e; return false } finally { src = null } } : undefined,
    seek: async (t: number) => { await seekVideo(video, start + t); await frameReady(video) },
    audioCopy: mute || !isMp4(file) ? undefined : () => extractAudioCopy(file, start, start + length),
    audioLayers: mute ? undefined : async (): Promise<Layer[]> => [{ buf: await file.arrayBuffer(), vol: 1, offset: start }],
  }
}
