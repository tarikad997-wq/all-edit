/* eslint-disable @typescript-eslint/no-explicit-any */
import { pipeline, env } from '@huggingface/transformers'
// يعمل في خيط منفصل حتى لا تتجمد الواجهة أثناء التفريغ
env.allowLocalModels = false
let asr: any = null, loaded = ''
const post = (m: unknown) => (self as unknown as Worker).postMessage(m)
async function load(ids: string[]) {
  if (asr && ids.includes(loaded)) return
  const gpu = !!(navigator as any).gpu; let last: unknown = new Error('تعذّر تحميل النموذج')
  const attempts: any[] = [...(gpu ? [{ device: 'webgpu', dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' } }] : []), { device: 'wasm', dtype: 'q8' }, { device: 'wasm', dtype: 'fp32' }]
  for (const id of ids) for (const opt of attempts) {
    try { asr = await (pipeline as any)('automatic-speech-recognition', id, { ...opt, progress_callback: (p: any) => post({ type: 'progress', ...p }) }); loaded = id; post({ type: 'model', id, device: opt.device }); return }
    catch (e) { last = e; asr = null }
  }
  throw last
}
self.onmessage = async (e: MessageEvent<{ audio: Float32Array; ids: string[]; language: string | null }>) => {
  try {
    const { audio, ids, language } = e.data
    await load(ids); post({ type: 'status', text: 'جارٍ كتابة الكابشن…' })
    const base: any = { task: 'transcribe', chunk_length_s: 29, stride_length_s: 5, ...(language ? { language } : {}) }
    let out: any, wordLevel = true
    try { out = await asr(audio, { ...base, return_timestamps: 'word' }) } catch { out = await asr(audio, { ...base, return_timestamps: true }); wordLevel = false }
    post({ type: 'done', chunks: out.chunks ?? [{ text: out.text, timestamp: [0, audio.length / 16000] }], wordLevel })
  } catch (err) { post({ type: 'error', message: String((err as Error)?.message ?? err) }) }
}
