/* eslint-disable @typescript-eslint/no-explicit-any */
import { pipeline, env } from '@huggingface/transformers'
// يعمل في خيط منفصل حتى لا تتجمد الواجهة أثناء التفريغ
env.allowLocalModels = false
let asr: any = null, loaded = '', loadedDevice = '', ortReady = false
const post = (m: unknown) => (self as unknown as Worker).postMessage(m)
/** يجمّع أجزاء ملف WASM من نفس الموقع ويمرّره لمحرك ONNX مباشرة (بدون CDN وبدون ملف واحد كبير) */
async function setupOrt(base: string) {
  if (ortReady) return
  const man = await (await fetch(base + 'manifest.json', { cache: 'no-cache' })).json()
  post({ type: 'status', text: 'تجهيز محرك الذكاء الاصطناعي…' })
  const bufs = await Promise.all((man.parts as string[]).map(p => fetch(base + p).then(r => { if (!r.ok) throw new Error('تعذّر تحميل ملف المحرك ' + p); return r.arrayBuffer() })))
  const bytes = new Uint8Array(man.size); let o = 0; for (const b of bufs) { bytes.set(new Uint8Array(b), o); o += b.byteLength }
  const mjs = URL.createObjectURL(new Blob([await (await fetch(base + man.mjs)).text()], { type: 'text/javascript' }))
  const w = (env as any).backends.onnx.wasm; w.wasmBinary = bytes; w.wasmPaths = { mjs }
  ortReady = true
}
async function load(ids: string[], device: 'webgpu' | 'wasm') {
  if (asr && ids.includes(loaded) && loadedDevice === device) return
  let last: unknown = new Error('تعذّر تحميل النموذج')
  const attempts: any[] = device === 'webgpu' ? [{ device: 'webgpu', dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' } }] : [{ device: 'wasm', dtype: 'q8' }, { device: 'wasm', dtype: 'fp32' }]
  for (const id of ids) for (const opt of attempts) {
    try { asr = await (pipeline as any)('automatic-speech-recognition', id, { ...opt, progress_callback: (p: any) => post({ type: 'progress', ...p }) }); loaded = id; loadedDevice = device; post({ type: 'model', id, device: opt.device }); return }
    catch (e) { last = e; asr = null }
  }
  throw last
}
self.onmessage = async (e: MessageEvent<{ audio: Float32Array; ids: string[]; language: string | null; device: 'webgpu' | 'wasm'; ortBase: string }>) => {
  try {
    const { audio, ids, language, device, ortBase } = e.data
    await setupOrt(ortBase); await load(ids, device); post({ type: 'status', text: 'جارٍ كتابة الكابشن…' })
    const base: any = { task: 'transcribe', chunk_length_s: 29, stride_length_s: 5, ...(language ? { language } : {}) }
    let out: any, wordLevel = true
    try { out = await asr(audio, { ...base, return_timestamps: 'word' }) } catch { out = await asr(audio, { ...base, return_timestamps: true }); wordLevel = false }
    post({ type: 'done', chunks: out.chunks ?? [{ text: out.text, timestamp: [0, audio.length / 16000] }], wordLevel })
  } catch (err) { post({ type: 'error', message: String((err as Error)?.message ?? err) }) }
}
