export const SR = 48000
export interface Layer { buf: ArrayBuffer; vol: number; offset?: number; loop?: boolean; fadeOut?: boolean }
export interface Decoded { l: Layer; buf: AudioBuffer }
export async function decodeLayers(layers: Layer[]): Promise<Decoded[]> {
  const ctx = new OfflineAudioContext(2, 1, SR), out: Decoded[] = []
  for (const l of layers) { try { out.push({ l, buf: await ctx.decodeAudioData(l.buf.slice(0)) }) } catch { /* مسار غير قابل للقراءة */ } }
  return out
}
// يرندر مقطعاً صغيراً (len ثانية يبدأ من s) كي لا نحتاج ذاكرة للمزيج الكامل في الفيديوهات الطويلة
export function renderSegment(dec: Decoded[], duration: number, s: number, len: number): Promise<AudioBuffer> {
  const off = new OfflineAudioContext(2, Math.ceil(len * SR), SR)
  for (const { l, buf } of dec) {
    const src = off.createBufferSource(); src.buffer = buf; src.loop = !!l.loop
    const g = off.createGain(); g.gain.setValueAtTime(l.vol, 0)
    if (l.fadeOut) { const fs = duration - 1.5 - s; if (fs < len) { g.gain.setValueAtTime(l.vol, Math.max(0, fs)); g.gain.linearRampToValueAtTime(0, Math.max(0.001, duration - s)) } }
    src.connect(g).connect(off.destination)
    const pos = (l.offset ?? 0) + s; src.start(0, l.loop ? pos % buf.duration : Math.min(pos, buf.duration))
  }
  return off.startRendering()
}
