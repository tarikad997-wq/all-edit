import { useEffect, useMemo, useState } from 'react'
import { NAMED_COLORS, colorName } from '../core/colors'
import PickerSelect, { Opt } from './PickerSelect'
const norm = (v: string) => { let h = v.trim().replace(/^#?/, '#'); if (/^#[0-9a-f]{3}$/i.test(h)) h = '#' + [...h.slice(1)].map(c => c + c).join(''); return /^#[0-9a-f]{6}$/i.test(h) ? h.toLowerCase() : null }
const Sw = ({ c }: { c: string }) => <i className="swatch" style={{ background: c }} />
/** اختيار لون من قائمة بأسماء عربية، مع إمكانية كتابة الكود (HEX) أو اختيار لون مخصص */
export default function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const v = value.toLowerCase(), [txt, setTxt] = useState(v.toUpperCase())
  useEffect(() => setTxt(v.toUpperCase()), [v])
  const options = useMemo<Opt[]>(() => {
    const base = NAMED_COLORS.map(c => ({ id: c.hex, label: c.name, sub: c.hex.toUpperCase(), group: c.group, preview: <Sw c={c.hex} />, keywords: c.hex }))
    return colorName(v) ? base : [{ id: v, label: 'لون مخصص', sub: v.toUpperCase(), group: 'الحالي', preview: <Sw c={v} /> }, ...base]
  }, [v])
  return <PickerSelect label={label} value={v} options={options} onChange={onChange} search triggerPreview={<Sw c={v} />}
    footer={close => <div className="colorfoot"><span className="muted">أو اكتب الكود / اختر لوناً مخصصاً:</span>
      <div className="colorrow"><input type="color" value={v} onChange={e => onChange(e.target.value)} aria-label="لون مخصص" />
        <input dir="ltr" className="hex" value={txt} maxLength={7} spellCheck={false} placeholder="#FFD166" onChange={e => { setTxt(e.target.value); const n = norm(e.target.value); if (n) onChange(n) }} />
        <button className="btn sm primary" onClick={close}>تم</button></div></div>} />
}
