import { useEffect, useState } from 'react'
import { Card } from '../../ui/Kit'
type Row = { ok: boolean | null; t: string; hint: string }
async function check(): Promise<Row[]> {
  const sup = async (f: () => Promise<{ supported?: boolean }>) => { try { return !!(await f()).supported } catch { return false } }
  const nav = navigator as Navigator & { gpu?: unknown; deviceMemory?: number }
  const rows: Row[] = []
  rows.push({ t: 'تصدير MP4 (H.264)', ok: typeof VideoEncoder !== 'undefined' && await sup(() => VideoEncoder.isConfigSupported({ codec: 'avc1.640033', width: 1080, height: 1920, bitrate: 8e6, framerate: 30 })), hint: 'مطلوب للتصدير. استخدم Chrome أو Edge.' })
  rows.push({ t: 'ترميز الصوت AAC', ok: typeof AudioEncoder !== 'undefined' && await sup(() => AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2 })), hint: 'بدونه يُصدَّر الفيديو بدون صوت.' })
  rows.push({ t: 'قراءة فيديو H.264 بدقة (بدون تقطيع)', ok: typeof VideoDecoder !== 'undefined' && await sup(() => VideoDecoder.isConfigSupported({ codec: 'avc1.640033', codedWidth: 1920, codedHeight: 1080 })), hint: 'بدونه يعمل التصدير بالطريقة الأبطأ.' })
  rows.push({ t: 'قراءة فيديو HEVC (تسجيلات آيفون)', ok: typeof VideoDecoder !== 'undefined' && await sup(() => VideoDecoder.isConfigSupported({ codec: 'hvc1.1.6.L120.B0', codedWidth: 1920, codedHeight: 1080 })), hint: 'إن لم يُدعم تُستخدم الطريقة الأبطأ لهذه الملفات.' })
  rows.push({ t: 'تسريع الذكاء الاصطناعي (WebGPU)', ok: !!nav.gpu, hint: 'يسرّع كتابة الكابشن كثيراً، وبدونه تعمل بطريقة أبطأ.' })
  rows.push({ t: 'مشاركة الملفات مباشرة', ok: typeof navigator.canShare === 'function', hint: 'لزر «مشاركة» بعد التصدير.' })
  rows.push({ t: `ذاكرة الجهاز${nav.deviceMemory ? ` (≈ ${nav.deviceMemory} جيجابايت)` : ''}`, ok: nav.deviceMemory ? nav.deviceMemory >= 4 : null, hint: 'الفيديوهات الطويلة تحتاج ٤ جيجابايت فأكثر.' })
  return rows
}
export default function Diagnostics() {
  const [rows, setRows] = useState<Row[] | null>(null)
  useEffect(() => { check().then(setRows) }, [])
  return <Card title="حالة جهازك">
    <p className="muted">تفحص ما يدعمه متصفحك لتعرف سبب أي بطء أو غياب صوت.</p>
    {!rows ? <p className="muted">جارٍ الفحص…</p> : rows.map(r => <div key={r.t} className="diag"><b>{r.ok === null ? '•' : r.ok ? '✅' : '⚠️'}</b><div><span>{r.t}</span>{r.ok === false && <small className="muted"> — {r.hint}</small>}</div></div>)}
  </Card>
}
