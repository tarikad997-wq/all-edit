import { ReactNode } from 'react'
import { fileToDataUrl } from '../core/media'
import { exportSupported } from '../core/exporter'

export const Card = ({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) =>
  <section className="card">{title && <header className="card-h"><h2>{title}</h2>{action}</header>}<div className="stack">{children}</div></section>
export const Field = ({ label, children }: { label: string; children: ReactNode }) => <label className="field"><span>{label}</span>{children}</label>

export function ImagePick({ label, value, onChange, round, size = 88, max }: { label: string; value: string; onChange: (s: string) => void; round?: boolean; size?: number; max?: number }) {
  return <label className="pick" style={{ width: size, height: size, borderRadius: round ? '50%' : 14, backgroundImage: value ? `url(${value})` : undefined }}>
    {!value && <span>{label}</span>}
    <input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) try { onChange(await fileToDataUrl(f, max)) } catch { alert('تعذر قراءة الصورة') } }} /></label>
}
export function Preview({ cref, w, h }: { cref: React.RefObject<HTMLCanvasElement>; w: number; h: number }) {
  return <canvas ref={cref} width={w} height={h} className="cv" style={{ aspectRatio: `${w}/${h}`, width: `min(100%, calc(60vh * ${w / h}))` }} />
}
export function PlayerBar({ playing, t, total, onToggle, onSeek }: { playing: boolean; t: number; total: number; onToggle: () => void; onSeek: (v: number) => void }) {
  return <div className="player"><button className="btn primary icon" onClick={onToggle} aria-label="تشغيل/إيقاف">{playing ? '⏸' : '▶'}</button>
    <input type="range" aria-label="موضع التشغيل" min="0" max={total || 1} step=".05" value={t} onChange={e => onSeek(+e.target.value)} /><span className="muted num" dir="ltr">{t.toFixed(1)} / {total.toFixed(1)}</span></div>
}
export function ExportBar({ msg, onExport, disabled }: { msg: string; onExport: () => void; disabled?: boolean }) {
  return <div className="stack">
    <button className="btn primary big" disabled={disabled || !exportSupported()} onClick={onExport}>⬇ تصدير الفيديو</button>
    {msg && <p className="note">{msg}</p>}
    {!exportSupported() && <p className="note">التصدير يتطلب Chrome أو Edge حديثاً.</p>}</div>
}
