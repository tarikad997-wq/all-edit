import { useEffect, useRef, useState } from 'react'
import { exportMp4, Scene, Quality, AudioStatus } from './exporter'
export function usePlayer(duration: number, h: { onPlay?: (t: number) => void; onPause?: () => void } = {}) {
  const [t, setT] = useState(0), [playing, setPlaying] = useState(false), tr = useRef(0), hr = useRef(h), dur = useRef(duration)
  hr.current = h; dur.current = duration
  useEffect(() => {
    if (!playing) { hr.current.onPause?.(); return }
    if (tr.current >= dur.current - 0.05) tr.current = 0
    hr.current.onPlay?.(tr.current)
    let last = performance.now(), raf = 0
    const tick = (n: number) => { tr.current += (n - last) / 1000; last = n
      if (tr.current >= dur.current) { tr.current = dur.current; setT(dur.current); setPlaying(false); return }
      setT(tr.current); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [playing])
  return { t, playing, tr, toggle: () => setPlaying(p => !p), pause: () => setPlaying(false), seek: (v: number) => { setPlaying(false); tr.current = v; setT(v) } }
}
export interface ExportResult { blob: Blob; url: string; audio: AudioStatus; w: number; h: number; hw: boolean; fps: number }
export function useExport() {
  const [phase, setPhase] = useState<'idle' | 'options' | 'running' | 'done' | 'error'>('idle')
  const [prog, setProg] = useState<{ f: number; label: string } | null>(null), [result, setResult] = useState<ExportResult | null>(null)
  const [error, setError] = useState(''), [msg, setMsg] = useState(''), ctl = useRef<AbortController | null>(null)
  const reset = () => { if (result) URL.revokeObjectURL(result.url); setResult(null); setProg(null); setPhase('idle') }
  async function start(build: () => Promise<Scene> | Scene, quality: Quality) {
    setPhase('running'); setProg({ f: 0, label: 'تجهيز الملفات' }); ctl.current = new AbortController(); setMsg('')
    try { const r = await exportMp4(await build(), (f, label) => setProg({ f, label }), { quality, signal: ctl.current.signal })
      setResult({ ...r, url: URL.createObjectURL(r.blob) }); setPhase('done')
    } catch (e) { if ((e as Error).name === 'AbortError') setPhase('idle'); else { setError((e as Error).message); setPhase('error') } }
  }
  return { phase, prog, result, error, msg, setMsg, open: () => setPhase('options'), start, reset, cancel: () => ctl.current?.abort() }
}
export type ExportApi = ReturnType<typeof useExport>
