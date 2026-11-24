import * as MP4NS from 'mp4box'
const MP4Box: any = MP4NS // eslint-disable-line @typescript-eslint/no-explicit-any
// فك ترميز دقيق إطاراً إطاراً لملفات MP4/MOV عبر WebCodecs — بدون تقطيع وأسرع من التشغيل الفعلي
export const isMp4 = (f: File) => /mp4|quicktime/i.test(f.type) || /\.(mp4|m4v|mov)$/i.test(f.name)
export const canDecode = (f: File) => typeof VideoDecoder !== 'undefined' && isMp4(f)
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
/* eslint-disable @typescript-eslint/no-explicit-any */
function description(mp4: any, track: any): Uint8Array | undefined {
  for (const e of mp4.getTrackById(track.id).mdia.minf.stbl.stsd.entries) {
    const box = e.avcC || e.hvcC || e.vpcC || e.av1C
    if (box) { const ds = new MP4Box.DataStream(undefined, 0, MP4Box.Endianness.BIG_ENDIAN); box.write(ds); return new Uint8Array(ds.buffer, 8) }
  }
}
export type OnFrame = (f: VideoFrame, t: number, rot: number) => Promise<void>
/** يفكّ الفيديو بين start وend ويستدعي onFrame بالترتيب. يرمي خطأ إن لم يكن الترميز مدعوماً. */
export async function decodeMp4(file: File, start: number, end: number, onFrame: OnFrame, signal?: AbortSignal): Promise<void> {
  const mp4 = MP4Box.createFile(); let dec: VideoDecoder | null = null, track: any, rot = 0, err: unknown = null, ready = false, finished = false
  const pending: VideoFrame[] = [], q: any[] = []; let gop: any[] = [], streaming = false
  const cts = (s: any) => s.cts / s.timescale
  mp4.onError = (e: unknown) => { err = e }
  // مهم: start() يجب أن يُستدعى داخل onReady بشكل متزامن، وإلا لا تُسلَّم العينات المستلمة سابقاً
  mp4.onReady = (info: any) => {
    try {
      track = info.videoTracks[0]; if (!track) throw new Error('لا يوجد مسار فيديو')
      const m = track.matrix as ArrayLike<number> | undefined; if (m) rot = ((Math.round(Math.atan2(m[1] / 65536, m[0] / 65536) * 180 / Math.PI) % 360) + 360) % 360
      const cfg: VideoDecoderConfig = { codec: track.codec, codedWidth: track.video.width, codedHeight: track.video.height, description: description(mp4, track) }
      mp4.setExtractionOptions(track.id, null, { nbSamples: 64 }); mp4.start()
      const hw: VideoDecoderConfig = { ...cfg, hardwareAcceleration: 'prefer-hardware' }
      VideoDecoder.isConfigSupported(hw).then(r => r.supported ? hw : VideoDecoder.isConfigSupported(cfg).then(r2 => { if (!r2.supported) throw new Error('ترميز الفيديو غير مدعوم'); return cfg })).then(use => {
        dec = new VideoDecoder({ output: f => pending.push(f), error: e => { err = e } }); dec.configure(use); ready = true
      }).catch(e => { err = e })
    } catch (e) { err = e }
  }
  mp4.onSamples = (_id: number, _u: unknown, samples: any[]) => {
    for (const s of samples) {
      if (streaming) q.push(s)
      else if (s.is_sync) { if (cts(s) > start + 1e-4) { q.push(...gop, s); gop = []; streaming = true } else gop = [s] }
      else gop.push(s)
    }
  }
  const check = () => { if (err) throw err; if (signal?.aborted) throw new DOMException('أُلغي التصدير', 'AbortError') }
  const drain = async () => {
    while (pending.length) {
      const f = pending.shift()!, t = f.timestamp / 1e6
      if (t < start - 1 / 120) { f.close(); continue }
      if (t >= end) { f.close(); finished = true; continue }
      try { await onFrame(f, t - start, rot) } finally { f.close() }
    }
  }
  const pump = async () => {
    while (q.length && !finished) {
      check()
      while (dec && (dec.decodeQueueSize > 16 || pending.length > 8)) { await drain(); await wait(1); check() }
      const s = q.shift()
      dec!.decode(new EncodedVideoChunk({ type: s.is_sync ? 'key' : 'delta', timestamp: Math.round(cts(s) * 1e6), duration: Math.round(s.duration / s.timescale * 1e6), data: s.data }))
      mp4.releaseUsedSamples(track.id, s.number + 1)
    }
    await drain()
  }
  const CH = 4 * 1024 * 1024; let pos = 0, guard = 0
  while (pos < file.size && !finished && guard++ < 100000) {
    const buf: any = await file.slice(pos, pos + CH).arrayBuffer(); buf.fileStart = pos
    const next = mp4.appendBuffer(buf); pos = typeof next === 'number' ? next : pos + buf.byteLength
    for (let i = 0; i < 200 && !ready && !err; i++) await wait(0)   // onReady غير متزامن
    check(); if (ready) await pump()
  }
  check(); if (!ready) throw new Error('تعذّر قراءة ملف الفيديو')
  mp4.flush(); if (!streaming) q.push(...gop); await pump()
  const d = dec as VideoDecoder | null
  if (d && !finished) { await d.flush(); await drain() }
  check(); try { d?.close() } catch { /* */ } pending.forEach(f => f.close())
}
