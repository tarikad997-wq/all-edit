import { useMemo } from 'react'
import { FONT_LIST, fontOf } from '../core/fonts'
import PickerSelect, { Opt } from './PickerSelect'
export default function FontPicker({ value, onChange, label = 'الخط' }: { value: string; onChange: (id: string) => void; label?: string }) {
  const options = useMemo<Opt[]>(() => FONT_LIST.map(f => ({ id: f.id, label: f.kind === 'ar' ? f.label : f.family, sub: f.kind === 'ar' ? f.family : 'خط أجنبي (حروف لاتينية)', group: f.kind === 'ar' ? 'خطوط عربية' : 'خطوط أجنبية',
    style: { fontFamily: `"${f.family}"`, fontWeight: f.weight as never }, preview: f.kind === 'ar' ? 'أبج' : 'Aa', keywords: f.family + ' ' + f.id })), [])
  return <PickerSelect label={label} value={fontOf(value).id} options={options} onChange={onChange} search />
}
