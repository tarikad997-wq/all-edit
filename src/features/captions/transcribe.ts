import type { Chunk } from '../../core/captions'
export type Quality = 'fast' | 'balanced' | 'best' | 'custom'
export type Lang = 'auto' | 'ar' | 'ary' | 'en' | 'fr'
export const MODELS: Record<Exclude<Quality, 'custom'>, { label: string; size: string; ids: string[] }> = {
  fast: { label: 'سريع', size: '≈ 60 ميغابايت', ids: ['onnx-community/whisper-tiny_timestamped', 'onnx-community/whisper-base_timestamped'] },
  balanced: { label: 'متوازن (موصى به)', size: '≈ 110 ميغابايت', ids: ['onnx-community/whisper-base_timestamped'] },
  best: { label: 'دقيق (الأفضل للعربية)', size: '≈ 300 ميغابايت', ids: ['onnx-community/whisper-small_timestamped', 'onnx-community/whisper-base_timestamped'] },
}
// Whisper لا يملك رمز لغة للدارجة: تُنسخ كعربية (arabic) ثم تُحسَّن بالمعالجة اللاحقة والقاموس
const LANG: Record<Lang, string | null> = { auto: null, ar: 'arabic', ary: 'arabic', en: 'english', fr: 'french' }
/** يستخرج الصوت من الفيديو بصيغة mono 16kHz المطلوبة للتفريغ، ضمن المدى المحدد فقط */
export async function extractAudio(file: File, start: number, length: number): Promise<Float32Array> {
  const buf = await new OfflineAudioContext(1, 1, 16000).decodeAudioData(await file.arrayBuffer()).catch(() => { throw new Error('تعذّر قراءة الصوت من هذا الملف (قد لا يحتوي صوتاً أو أنه كبير جداً).') })
  const n = buf.length, mono = new Float32Array(n)
  for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) mono[i] += d[i] / buf.numberOfChannels }
  return mono.slice(Math.floor(start * 16000), Math.min(n, Math.floor((start + length) * 16000)))
}
type Chunks = { chunks: Chunk[]; wordLevel: boolean }
function runWorker(audio: Float32Array, ids: string[], device: 'webgpu' | 'wasm', o: { language: Lang; onStatus: (label: string, f?: number) => void; signal?: AbortSignal }): Promise<Chunks> {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('./whisper.worker.ts', import.meta.url), { type: 'module' }), files = new Map<string, { l: number; t: number }>()
    const end = (fn: () => void) => { w.terminate(); fn() }
    o.signal?.addEventListener('abort', () => end(() => reject(new DOMException('أُلغي', 'AbortError'))))
    w.onerror = e => end(() => reject(new Error(e.message || 'تعذّر تشغيل محرك التفريغ')))
    w.onmessage = e => { const m = e.data
      if (m.type === 'progress' && m.status === 'progress' && m.file) { files.set(m.file, { l: m.loaded ?? 0, t: m.total ?? 0 }); let l = 0, t = 0; files.forEach(v => { l += v.l; t += v.t }); o.onStatus('تحميل النموذج (مرة واحدة فقط)', t ? l / t : undefined) }
      else if (m.type === 'status') o.onStatus(m.text)
      else if (m.type === 'done') end(() => resolve({ chunks: m.chunks, wordLevel: m.wordLevel }))
      else if (m.type === 'error') end(() => reject(new Error(m.message))) }
    o.onStatus('تحضير النموذج…')
    w.postMessage({ audio, ids, language: LANG[o.language], device, ortBase: new URL('ort/', document.baseURI).href }, [audio.buffer])
  })
}
/** يجرّب WebGPU أولاً (أسرع)، وإن فشل لسبب غير الشبكة يعيد المحاولة بالمعالج */
export async function transcribe(audio: Float32Array, o: { quality: Quality; language: Lang; customModel?: string; onStatus: (label: string, f?: number) => void; signal?: AbortSignal }): Promise<Chunks> {
  const custom = o.quality === 'custom' ? o.customModel?.trim() : ''
  const ids = custom ? [custom] : MODELS[o.quality === 'custom' ? 'balanced' : o.quality].ids
  const gpu = !!(navigator as unknown as { gpu?: unknown }).gpu
  if (!gpu) return runWorker(audio, ids, 'wasm', o)
  try { return await runWorker(audio.slice(), ids, 'webgpu', o) }
  catch (e) { const msg = String((e as Error).message); if ((e as Error).name === 'AbortError' || /fetch|network|404|401|403|not found|unauthorized/i.test(msg)) throw e; o.onStatus('إعادة المحاولة بالمعالج…'); return runWorker(audio, ids, 'wasm', o) }
}
