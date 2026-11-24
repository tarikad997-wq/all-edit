import { CSSProperties, ReactNode, useEffect, useMemo, useState } from 'react'
export interface Opt { id: string; label: string; sub?: string; group?: string; preview?: ReactNode; style?: CSSProperties; keywords?: string }
interface Props { label: string; value: string; options: Opt[]; onChange: (id: string) => void; search?: boolean; footer?: (close: () => void) => ReactNode; triggerPreview?: ReactNode }
/** قائمة منسدلة احترافية: زر يعرض الخيار الحالي، وورقة سفلية فيها بحث ومعاينة لكل خيار ومجموعات */
export default function PickerSelect({ label, value, options, onChange, search, footer, triggerPreview }: Props) {
  const [open, setOpen] = useState(false), [q, setQ] = useState('')
  const cur = options.find(o => o.id === value)
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [open])
  const list = useMemo(() => { const s = q.trim().toLowerCase(); return s ? options.filter(o => (o.label + ' ' + (o.sub ?? '') + ' ' + (o.keywords ?? '')).toLowerCase().includes(s)) : options }, [q, options])
  const groups = useMemo(() => { const m = new Map<string, Opt[]>(); list.forEach(o => { const g = o.group ?? ''; m.set(g, [...(m.get(g) ?? []), o]) }); return [...m] }, [list])
  const close = () => { setOpen(false); setQ('') }
  return <div className="field"><span>{label}</span>
    <button type="button" className="psel" onClick={() => setOpen(true)}>
      <span className="psel-pv" style={cur?.style}>{triggerPreview ?? cur?.preview}</span>
      <span className="psel-tx"><b style={cur?.style}>{cur?.label ?? '—'}</b>{cur?.sub && <small>{cur.sub}</small>}</span><i>▾</i></button>
    {open && <div className="sheet-bg" onClick={e => { if (e.target === e.currentTarget) close() }}><div className="sheet picker">
      <div className="grab" /><div className="picker-h"><h2>{label}</h2><button className="btn sm" onClick={close}>✕</button></div>
      {(search ?? options.length > 8) && <input className="picker-q" placeholder="🔍 ابحث…" value={q} onChange={e => setQ(e.target.value)} autoFocus />}
      <div className="plist">{groups.map(([g, os]) => <div key={g}>{g && <div className="pgroup">{g}</div>}
        {os.map(o => <button type="button" key={o.id} className={'popt' + (o.id === value ? ' on' : '')} onClick={() => { onChange(o.id); close() }}>
          <span className="popt-pv" style={o.style}>{o.preview}</span><span className="popt-tx"><b style={o.style}>{o.label}</b>{o.sub && <small>{o.sub}</small>}</span>{o.id === value && <em>✓</em>}</button>)}</div>)}
        {!list.length && <p className="muted">لا نتائج.</p>}</div>
      {footer?.(close)}
    </div></div>}
  </div>
}
