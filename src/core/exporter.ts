import { Muxer, ArrayBufferTarget, FileSystemWritableFileStreamTarget } from 'mp4-muxer'
import { SR, Layer, decodeLayers, renderSegment, Decoded } from './audio'
import type { AudioCopy } from './demux'
export const W = 1080, H = 1920, FPS = 30
export type Quality = 'fast' | 'high'
export type AudioStatus = 'none' | 'ok' | 'unsupported' | 'failed'
export interface Scene {
  duration: number; prepare?(): Promise<void>; draw(ctx: CanvasRenderingContext2D, t: number): void   // الرسم دائماً بإحداثيات 1080×1920
  seek?(t: number): Promise<void>                                                                      // قفز دقيق احتياطي
  play?(emit: (t: number) => Promise<void>, signal?: AbortSignal): Promise<boolean | void>             // فك ترميز دقيق؛ يرجع false إن لم يكن متاحاً
  audioCopy?(): Promise<AudioCopy | null>                                                              // نسخ صوت الفيديو كما هو (الأفضل)
  audioLayers?(): Promise<Layer[]>                                                                     // بديل: فك ترميز ثم ترميز AAC
}
export interface ExportOutput { blob: Blob; audio: AudioStatus; w: number; h: number; hw: boolean; fps: number; cleanup: () => Promise<void>; sink: 'disk' | 'memory'; audioMode: 'copy' | 'encode' | 'none' }
export const exportSupported = () => typeof VideoEncoder !== 'undefined'
export const isPhone = () => { try { return matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820 } catch { return false } }
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const yieldNow = () => new Promise<void>(r => { const c = new MessageChannel(); c.port1.onmessage = () => { c.port1.close(); r() }; c.port2.postMessage(0) })
// ينتظر حتى يفرغ المُرمِّز جزءاً من طابوره (حدث dequeue) بدل الفحص بمؤقتات تتباطأ في الخلفية
const dequeued = (e: VideoEncoder | AudioEncoder) => new Promise<void>(r => { const done = () => { e.removeEventListener('dequeue', done); clearTimeout(tm); r() }; const tm = setTimeout(done, 40); e.addEventListener('dequeue', done) })
type WL = { release(): Promise<void> }

/** على الهاتف نكتب الملف مباشرة إلى مساحة التطبيق الخاصة (OPFS) بدل تجميعه في الذاكرة، فلا ينهار مع الفيديوهات الطويلة */
async function openSink() {
  try {
    const root = await navigator.storage.getDirectory(), name = `all-edit-${Date.now()}.mp4`
    const fh = await root.getFileHandle(name, { create: true }) as FileSystemFileHandle & { createWritable?: () => Promise<FileSystemWritableFileStream> }
    if (typeof fh.createWritable !== 'function') throw new Error('no writable')
    const ws = await fh.createWritable(), rm = async () => { try { await root.removeEntry(name) } catch { /* */ } }
    return { kind: 'disk' as const, target: new FileSystemWritableFileStreamTarget(ws, { chunkSize: 8 * 1024 * 1024 }), fastStart: false as const,
      finish: async () => { await ws.close(); const f = await fh.getFile(); return f.slice(0, f.size, 'video/mp4') }, cleanup: rm, abort: async () => { try { await ws.abort() } catch { /* */ } await rm() } }
  } catch {
    const t = new ArrayBufferTarget()
    return { kind: 'memory' as const, target: t, fastStart: 'in-memory' as const, finish: async () => new Blob([t.buffer], { type: 'video/mp4' }), cleanup: async () => {}, abort: async () => {} }
  }
}
/** يجرّب عدة إعدادات حتى يجد ما يدعمه الجهاز: ترميز بالعتاد أولاً (الأسرع) ثم بالبرمجيات */
async function pickConfig(w: number, h: number, bitrate: number): Promise<VideoEncoderConfig & { hw: boolean }> {
  const codecs = h >= 1920 ? ['avc1.640033', 'avc1.64002a', 'avc1.4d002a', 'avc1.42002a'] : ['avc1.640028', 'avc1.4d0028', 'avc1.42001f']
  for (const hw of ['prefer-hardware', 'no-preference'] as const) for (const codec of codecs) {
    const cfg: VideoEncoderConfig = { codec, width: w, height: h, bitrate, framerate: FPS, hardwareAcceleration: hw, latencyMode: 'realtime' }
    try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return { ...cfg, hw: hw === 'prefer-hardware' } } catch { /* جرّب التالي */ }
  }
  throw new Error('هذا الجهاز لا يدعم ترميز H.264 بهذه الدقة. جرّب الجودة «سريع» أو متصفح Chrome/Edge حديثاً.')
}
export async function exportMp4(scene: Scene, onProgress: (f: number, label: string) => void, opt: { quality?: Quality; signal?: AbortSignal } = {}): Promise<ExportOutput> {
  if (!exportSupported()) throw new Error('المتصفح لا يدعم WebCodecs. استخدم Chrome أو Edge حديثاً.')
  const fast = opt.quality === 'fast', OW = fast ? 720 : W, OH = fast ? 1280 : H, sx = OW / W
  const chk = () => { if (opt.signal?.aborted) throw new DOMException('أُلغي التصدير', 'AbortError') }
  onProgress(0, 'تجهيز الملفات'); await scene.prepare?.(); chk()
  const dur = scene.duration, frames = Math.max(1, Math.round(dur * FPS)), vcfg = await pickConfig(OW, OH, fast ? 4_000_000 : dur > 180 ? 4_000_000 : 8_000_000)
  // ---- الصوت: نسخ مباشر أولاً، ثم فك ترميز + ترميز AAC كبديل ----
  const aCfg: AudioEncoderConfig = { codec: 'mp4a.40.2', sampleRate: SR, numberOfChannels: 2, bitrate: 192_000 }
  let copy: AudioCopy | null = null, dec: Decoded[] | null = null, status: AudioStatus = 'none'
  if (scene.audioCopy) { onProgress(0, 'قراءة الصوت'); copy = await scene.audioCopy().catch(() => null); if (copy) status = 'ok' }
  if (!copy && scene.audioLayers) {
    const ok = typeof AudioEncoder !== 'undefined' && (await AudioEncoder.isConfigSupported(aCfg).catch(() => ({ supported: false }))).supported
    if (!ok) status = 'unsupported'
    else try { onProgress(0, 'تجهيز الصوت'); const d = await decodeLayers(await scene.audioLayers()); if (d.length) { dec = d; status = 'ok' } else status = 'failed' } catch { status = 'failed' }
  }
  const sink = await openSink()
  const muxer = new Muxer({ target: sink.target, video: { codec: 'avc', width: OW, height: OH }, fastStart: sink.fastStart,
    ...(copy ? { audio: { codec: 'aac' as const, numberOfChannels: copy.channels, sampleRate: copy.sampleRate } } : dec ? { audio: { codec: 'aac' as const, numberOfChannels: 2, sampleRate: SR } } : {}) })
  let ai = 0
  const pushAudio = (upTo: number) => { if (!copy) return  // يُدمج الصوت متداخلاً مع الفيديو
    while (ai < copy.chunks.length && copy.chunks[ai].ts <= upTo) { const c = copy.chunks[ai]
      muxer.addAudioChunkRaw(c.data, 'key', c.ts, c.dur, ai === 0 ? { decoderConfig: { codec: 'mp4a.40.2', sampleRate: copy.sampleRate, numberOfChannels: copy.channels, description: copy.description } } : undefined); ai++ } }
  let err: unknown = null; const wl: { cur: WL | null } = { cur: null }
  const lock = async () => { try { wl.cur = await (navigator as unknown as { wakeLock?: { request(t: string): Promise<WL> } }).wakeLock?.request('screen') ?? null } catch { /* اختياري */ } }
  const onVis = () => { if (!document.hidden) lock() }       // الشاشة تُطفأ عند مغادرة الصفحة فيُعاد طلب القفل عند العودة
  await lock(); document.addEventListener('visibilitychange', onVis)
  let venc: VideoEncoder | null = null, aenc: AudioEncoder | null = null, finished = false
  const t0 = performance.now(); let drawMs = 0, waitMs = 0
  try {
    const { hw, ...cfg } = vcfg
    venc = new VideoEncoder({ output: (c, m) => { muxer.addVideoChunk(c, m); pushAudio(c.timestamp) }, error: e => (err = e) }); venc.configure(cfg)
    const enc = venc, cv = document.createElement('canvas'); cv.width = OW; cv.height = OH
    const ctx = cv.getContext('2d', { alpha: false })!      // الرسم مباشرة بدقة التصدير
    let last = -1
    const emit = async (t: number) => {
      const idx = Math.min(frames - 1, Math.round(t * FPS)); if (idx <= last) return
      chk(); const a = performance.now(); ctx.setTransform(sx, 0, 0, sx, 0, 0); scene.draw(ctx, t); drawMs += performance.now() - a
      while (last < idx) { last++
        const f = new VideoFrame(cv, { timestamp: Math.round(last * 1e6 / FPS), duration: Math.round(1e6 / FPS) })
        enc.encode(f, { keyFrame: last % 90 === 0 }); f.close(); if (err) throw err
        const b = performance.now(); while (enc.encodeQueueSize > 20) await dequeued(enc); waitMs += performance.now() - b }
      if (last % 10 === 0) { const f = last / frames, el = (performance.now() - t0) / 1000
        onProgress(f * (dec ? .9 : .98), f > .03 ? `ترميز الفيديو — متبقٍ ≈ ${Math.max(1, Math.round(el / f * (1 - f)))} ث` : 'ترميز الفيديو'); await yieldNow() }
    }
    const usedPlay = scene.play ? (await scene.play(emit, opt.signal)) !== false : false
    if (usedPlay) await emit(dur)
    else for (let i = 0; i < frames; i++) { await scene.seek?.(i / FPS); await emit(i / FPS) }
    await enc.flush(); pushAudio(Infinity)
    if (dec) {
      aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => (err = e) }); aenc.configure(aCfg); const ae = aenc
      for (let s = 0; s < dur; s += 30) {
        chk(); onProgress(.9 + .09 * s / dur, 'ترميز الصوت')
        const ab = await renderSegment(dec, dur, s, Math.min(30, dur - s)), L = ab.getChannelData(0), R = ab.getChannelData(1), CH = 4800
        for (let o = 0; o < L.length; o += CH) {
          const n = Math.min(CH, L.length - o), d = new Float32Array(n * 2); d.set(L.subarray(o, o + n), 0); d.set(R.subarray(o, o + n), n)
          const ad = new AudioData({ format: 'f32-planar', sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((s + o / SR) * 1e6), data: d })
          ae.encode(ad); ad.close(); while (ae.encodeQueueSize > 20) await dequeued(ae)
        }
      }
      await ae.flush()
    }
    if (err) throw err
    onProgress(.99, 'إنهاء الملف'); muxer.finalize(); const blob = await sink.finish(); finished = true; onProgress(1, 'اكتمل')
    const total = performance.now() - t0, fps = +(frames / (total / 1000)).toFixed(1)
    console.info('[All Edit] export', { frames, size: `${OW}x${OH}`, codec: cfg.codec, hardware: hw, totalSec: +(total / 1000).toFixed(1), drawMs: Math.round(drawMs), encodeWaitMs: Math.round(waitMs), fps, decodePath: usedPlay, sink: sink.kind, audio: copy ? 'copy' : dec ? 'encode' : 'none' })
    return { blob, audio: status, w: OW, h: OH, hw, fps, cleanup: sink.cleanup, sink: sink.kind, audioMode: copy ? 'copy' : dec ? 'encode' : 'none' }
  } catch (e) { await sink.abort(); throw e }
  finally { document.removeEventListener('visibilitychange', onVis); wl.cur?.release().catch(() => {}); try { if (venc && venc.state !== 'closed') venc.close() } catch { /* */ } try { if (aenc && aenc.state !== 'closed') aenc.close() } catch { /* */ } void finished; void wait }
}
