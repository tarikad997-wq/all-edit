import { useEffect, useState } from 'react'
import type { Scene } from '../core/exporter'
import type { ExportApi } from '../core/hooks'
import type { Quality } from '../core/exporter'
const Q: { id: Quality; t: string; d: string }[] = [{ id: 'fast', t: 'سريع', d: '720×1280 — أخف وأسرع' }, { id: 'high', t: 'عالٍ', d: '1080×1920 — الأفضل' }]
export default function ExportSheet({ ex, build, name }: { ex: ExportApi; build: () => Promise<Scene> | Scene; name: string }) {
  const [q, setQ] = useState<Quality>(() => (localStorage.getItem('pp-quality') as Quality) || 'high')
  useEffect(() => { localStorage.setItem('pp-quality', q) }, [q])
  if (ex.phase === 'idle') return null
  const r = ex.result, canShare = !!r && !!navigator.canShare?.({ files: [new File([r.blob], name, { type: 'video/mp4' })] })
  return <div className="sheet-bg" onClick={e => { if (e.target === e.currentTarget && ex.phase !== 'running') ex.reset() }}><div className="sheet">
    <div className="grab" />
    {ex.phase === 'options' && <div className="stack"><h2>تصدير الفيديو</h2>
      <div className="seg">{Q.map(o => <button key={o.id} className={q === o.id ? 'on' : ''} onClick={() => setQ(o.id)}>{o.t}<br /><small>{o.d}</small></button>)}</div>
      <p className="muted">٣٠ إطاراً/ث · H.264 MP4 · يناسب إنستغرام وتيك توك وفيسبوك</p>
      <button className="btn primary big" onClick={() => ex.start(build, q)}>ابدأ التصدير</button><button className="btn big" onClick={ex.reset}>إلغاء</button></div>}
    {ex.phase === 'running' && <div className="stack ctr"><h2>جارٍ التصدير…</h2>
      <div className="ring" style={{ ['--p' as string]: `${Math.round((ex.prog?.f ?? 0) * 100)}%` }}><b>{Math.round((ex.prog?.f ?? 0) * 100)}%</b></div>
      <span className="muted">{ex.prog?.label}</span><p className="note">لا تغلق الصفحة ولا تغادر التطبيق حتى ينتهي.</p>
      <button className="btn danger big" onClick={ex.cancel}>إلغاء التصدير</button></div>}
    {ex.phase === 'done' && r && <div className="stack ctr"><h2>✅ تم التصدير</h2>
      <video src={r.url} controls playsInline className="result" />
      <span className="muted">الحجم <bdi>{(r.blob.size / 1e6).toFixed(1)} MB</bdi> · الدقة <bdi>{r.w}×{r.h}</bdi>{r.audio === 'ok' ? ' · مع صوت' : ' · بدون صوت'}</span>
      <span className="muted">{r.hw ? '⚡ ترميز بالعتاد' : 'ترميز بالبرمجيات'} · <bdi>{r.fps}</bdi> إطار/ث</span>
      {!r.hw && <p className="note">جهازك لا يوفّر ترميزاً بالعتاد لهذه الإعدادات، لذلك التصدير أبطأ. جرّب الجودة «سريع»، أو متصفح Chrome على جهاز أحدث.</p>}
      {r.audio === 'unsupported' && <p className="note">هذا المتصفح لا يدعم ترميز الصوت AAC، فصُدّر الفيديو بدون صوت. جرّب Chrome أو Edge.</p>}
      {r.audio === 'failed' && <p className="note">تعذّر قراءة صوت الملف (قد يكون كبيراً جداً) فصُدّر بدون صوت.</p>}
      <a className="btn primary big" href={r.url} download={name}>💾 حفظ في الجهاز</a>
      {canShare && <button className="btn big" onClick={() => navigator.share({ files: [new File([r.blob], name, { type: 'video/mp4' })], title: name }).catch(() => {})}>📤 مشاركة</button>}
      <button className="btn big" onClick={ex.reset}>إغلاق</button></div>}
    {ex.phase === 'error' && <div className="stack"><h2>تعذّر التصدير</h2><p className="note">{ex.error}</p><button className="btn big" onClick={ex.reset}>إغلاق</button></div>}
  </div></div>
}
