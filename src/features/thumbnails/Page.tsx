import { useEffect, useRef, useState } from 'react'
import { useAccount } from '../../core/account'
import { OVERLAYS } from '../../core/fx'
import { loadFont } from '../../core/fonts'
import { ensureFonts, loadImgs } from '../../core/media'
import ColorField from '../../ui/ColorField'
import FontPicker from '../../ui/FontPicker'
import { Card, Field, ImagePick } from '../../ui/Kit'
import PickerSelect, { Opt } from '../../ui/PickerSelect'
import { PRESETS, SIZES, SizeKey, Thumb, drawThumb } from './thumb'

const LAYOUT: Record<string, string> = { news: 'خبر', movie: 'فيلم', quote: 'اقتباس', neon: 'نيون', split: 'مقسّم', banner: 'شريط', poster: 'ملصق', bold: 'عنوان ضخم' }
const PRESET_OPTS: Opt[] = PRESETS.map(p => ({ id: p.id, label: p.label, sub: `تخطيط ${LAYOUT[p.tpl]}`, keywords: p.tpl + ' ' + p.font,
  preview: <i className="tp" style={{ background: `linear-gradient(135deg,#0b0f1a,${p.accent}66)`, borderColor: p.accent, color: p.accent }}>Aa</i> }))
const FX_OPTS: Opt[] = OVERLAYS.map(o => ({ id: o.id, label: o.label, sub: o.sub }))
const SIZE_OPTS: Opt[] = (Object.keys(SIZES) as SizeKey[]).map(k => ({ id: k, label: SIZES[k][2] }))
const fromPreset = (id: string): Partial<Thumb> => { const p = PRESETS.find(x => x.id === id)!; return { preset: id, tpl: p.tpl, accent: p.accent, font: p.font, fx: p.fx, tag: p.tag } }

export default function ThumbnailsPage() {
  const { acc } = useAccount()
  const [t, setT] = useState<Thumb>({ img: '', size: 'cover', title: 'انتشار *تفاصيل* جديدة حول الخبر الذي شغل الجميع', sub: 'المصدر: وكالة الأنباء', ...fromPreset('news-red') } as Thumb)
  const [guides, setGuides] = useState(true), ref = useRef<HTMLCanvasElement>(null)
  const set = (patch: Partial<Thumb>) => setT(x => ({ ...x, ...patch }))
  useEffect(() => { let off = false; Promise.all([ensureFonts(), loadFont(t.font, t.title), loadImgs([t.img, acc.profileImg, acc.logoImg])]).then(() => { if (!off && ref.current) drawThumb(ref.current.getContext('2d')!, t, acc) }); return () => { off = true } }, [t, acc])
  const [W, H] = SIZES[t.size]
  const download = () => ref.current?.toBlob(b => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `all-edit-${t.tpl}-${t.size}.png`; a.click() }, 'image/png')
  return <div className="page">
    <div className="col-side"><Card>
      <div className="tw"><canvas ref={ref} width={W} height={H} className="cv" style={{ aspectRatio: `${W}/${H}`, width: `min(100%, calc(60vh * ${W / H}))` }} />
        {guides && t.size === 'cover' && <><i className="g" style={{ top: 0, height: '12.5%' }} /><i className="g" style={{ bottom: 0, height: '12.5%' }} /></>}</div>
      <label className="check"><input type="checkbox" checked={guides} onChange={e => setGuides(e.target.checked)} /> إظهار منطقة اقتصاص الشبكة (3:4)</label>
      <button className="btn primary big" onClick={download}>⬇ تنزيل PNG</button></Card></div>
    <div className="col-main"><Card title="القالب والمقاس">
      <PickerSelect label={`القالب (${PRESETS.length})`} value={t.preset} options={PRESET_OPTS} onChange={id => set(fromPreset(id))} search />
      <PickerSelect label="المقاس" value={t.size} options={SIZE_OPTS} onChange={id => set({ size: id as SizeKey })} /></Card>
      <Card title="المحتوى">
        <ImagePick label="الصورة" value={t.img} onChange={s => set({ img: s })} max={2200} size={110} />
        <Field label="الوسم"><input value={t.tag} onChange={e => set({ tag: e.target.value })} /></Field>
        <Field label="العنوان"><textarea rows={3} value={t.title} onChange={e => set({ title: e.target.value })} /></Field>
        <p className="muted">لتلوين كلمة أو أكثر ضعها بين نجمتين: *عاجل*</p>
        <Field label="السطر الثانوي (المصدر / السنة / القائل)"><input value={t.sub} onChange={e => set({ sub: e.target.value })} /></Field>
        <p className="muted">اسم الصفحة والصورة والشعار من تبويب «الحساب».</p></Card>
      <Card title="الخط والألوان والافكتات">
        <FontPicker value={t.font} onChange={id => set({ font: id })} />
        <ColorField label="لون التمييز" value={t.accent} onChange={v => set({ accent: v })} />
        <PickerSelect label="افكت الصورة" value={t.fx} options={FX_OPTS} onChange={id => set({ fx: id })} /></Card></div></div>
}
