import { useEffect, useRef, useState } from 'react'
import { useAccount } from '../../core/account'
import { usePlayer, useExport } from '../../core/hooks'
import { ensureFonts, loadImgs, seekVideo } from '../../core/media'
import { W, H } from '../../core/exporter'
import { Card, Field, Preview, PlayerBar, ExportBar } from '../../ui/Kit'
import { CTA_PRESETS, ReelForm, defaultForm, drawReel, makeReelScene } from './scene'
import { fromVideo } from '../../core/videoSource'
import { BG_FX, CTA_FX, LOOP_FX, REEL_TEMPLATES, TITLE_FX, VID_FX } from './templates'
import PickerSelect, { Opt } from '../../ui/PickerSelect'
import ColorField from '../../ui/ColorField'
import FontPicker from '../../ui/FontPicker'
import ExportSheet from '../../ui/ExportSheet'
import { loadFont } from '../../core/fonts'

const fxOpts = (l: [string, string, string][]): Opt[] => l.map(([id, label, sub]) => ({ id, label, sub }))
const TPL_OPTS: Opt[] = REEL_TEMPLATES.map(t => ({ id: t.id, label: t.label, sub: t.theme.tag ? `وسم: ${t.theme.tag}` : undefined, keywords: t.theme.font,
  preview: <i className="tp" style={{ background: `linear-gradient(${t.theme.bg1},${t.theme.bg2})`, borderColor: t.theme.accent, color: t.theme.accent }}>Aa</i> }))
const MAX_LEN = 600 // 10 دقائق
export default function ReelFormPage({ active }: { active: boolean }) {
  const { acc } = useAccount()
  const [f, setF] = useState<ReelForm>(() => { try { return { ...defaultForm, ...JSON.parse(localStorage.getItem('pp-reel') || '{}') } } catch { return defaultForm } })
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState(''), [vd, setVd] = useState(0)
  const cv = useRef<HTMLCanvasElement>(null), vid = useRef<HTMLVideoElement>(null), ex = useExport()
  const set = (p: Partial<ReelForm>) => setF(x => ({ ...x, ...p }))
  const pl = usePlayer(f.length, { onPlay: t => { const v = vid.current; if (v) { v.currentTime = f.start + t; v.muted = f.mute; v.play().catch(() => {}) } }, onPause: () => vid.current?.pause() })
  useEffect(() => { try { localStorage.setItem('pp-reel', JSON.stringify(f)) } catch { /* ignore */ } }, [f])
  useEffect(() => { if (!active) pl.pause() }, [active])
  useEffect(() => { let off = false
    const draw = () => { if (!off && cv.current) drawReel(cv.current.getContext('2d')!, f, acc, url ? fromVideo(vid.current) : null, pl.tr.current) }
    Promise.all([ensureFonts(), loadFont(f.font, f.title), loadImgs([acc.profileImg, acc.logoImg])]).then(async () => { if (url && vid.current && !pl.playing) await seekVideo(vid.current, f.start + pl.tr.current); draw() })
    return () => { off = true } }, [f, acc, url, pl.t, vd])

  function pick(fl: File) { pl.pause(); if (url) URL.revokeObjectURL(url); setFile(fl); setUrl(URL.createObjectURL(fl)); setVd(0) }
  const maxLen = Math.max(2, Math.min(MAX_LEN, vd ? vd - f.start : MAX_LEN))
  return <div className="page">
    <div className="col-side"><Card><Preview cref={cv} w={W} h={H} />
      <PlayerBar playing={pl.playing} t={pl.t} total={f.length} onToggle={pl.toggle} onSeek={pl.seek} />
      <ExportBar msg={ex.msg} disabled={!file} onExport={() => { pl.pause(); ex.open() }} />
      <ExportSheet ex={ex} name="all-edit-reel.mp4" build={() => makeReelScene(f, acc, vid.current!, file!)} /></Card></div>
    <div className="col-main">
      <Card title="الفيديو">
        <label className="btn big">🎞 اختيار فيديو من المكتبة<input type="file" accept="video/*" hidden onChange={e => { const fl = e.target.files?.[0]; e.target.value = ''; if (fl) pick(fl) }} /></label>
        <span className="muted">{file ? `${file.name} — ${vd ? vd.toFixed(1) + ' ث' : '…'}` : 'لم يُختر فيديو'}</span>
        <video ref={vid} src={url || undefined} playsInline preload="auto" muted className="hidden" onLoadedMetadata={e => { const d = e.currentTarget.duration; setVd(d); set({ start: 0, length: Math.round(Math.min(d, MAX_LEN) * 10) / 10 }) }} />
        <div className="grid2"><Field label="بداية المقطع (ث)"><input type="number" min="0" max={Math.max(0, vd - 2)} step=".5" value={f.start} onChange={e => set({ start: Math.max(0, Math.min(+e.target.value || 0, Math.max(0, vd - 2))) })} /></Field>
          <Field label="المدة (ث)"><input type="number" min="2" max={maxLen} step=".5" value={f.length} onChange={e => set({ length: Math.max(2, Math.min(+e.target.value || 2, maxLen)) })} /></Field></div>
        {f.length > 180 && <p className="note">⚠ الفيديو أطول من 3 دقائق: التصدير يستغرق قرابة مدة الفيديو نفسها ويستهلك ذاكرة كبيرة. يُفضَّل الحاسوب، وابقَ في هذه الصفحة حتى ينتهي.</p>}
        <Field label={`حجم المربع: ${f.size}%`}><input type="range" min="55" max="115" step="1" value={f.size} onChange={e => set({ size: +e.target.value })} /></Field>
        <Field label={`الموضع الرأسي: ${f.offY > 0 ? '+' : ''}${f.offY}`}><input type="range" min="-250" max="250" step="5" value={f.offY} onChange={e => set({ offY: +e.target.value })} /></Field>
        {(f.size !== 100 || f.offY !== 0) && <button className="btn sm" onClick={() => set({ size: 100, offY: 0 })}>↺ إعادة الحجم والموضع</button>}
        <div className="seg"><button className={f.fit === 'cover' ? 'on' : ''} onClick={() => set({ fit: 'cover' })}>ملء المربع</button><button className={f.fit === 'contain' ? 'on' : ''} onClick={() => set({ fit: 'contain' })}>الفيديو كاملاً</button></div>
        <label className="check"><input type="checkbox" checked={f.mute} onChange={e => set({ mute: e.target.checked })} /> كتم صوت الفيديو</label>
      </Card>
      <Card title="القالب">
        <PickerSelect label={`القالب (${REEL_TEMPLATES.length})`} value={f.tpl} options={TPL_OPTS} onChange={id => { const t = REEL_TEMPLATES.find(x => x.id === id); if (t) set({ ...t.theme, tpl: id }) }} search />
        <ColorField label="لون التمييز" value={f.accent} onChange={v => set({ accent: v })} />
        <ColorField label="لون النص" value={f.text} onChange={v => set({ text: v })} />
        <div className="grid2"><ColorField label="الخلفية (أعلى)" value={f.bg1} onChange={v => set({ bg1: v })} /><ColorField label="الخلفية (أسفل)" value={f.bg2} onChange={v => set({ bg2: v })} /></div>
        <Field label="وسم فوق الفيديو (اختياري)"><input value={f.tag} placeholder="مثال: عاجل" onChange={e => set({ tag: e.target.value })} /></Field>
      </Card>
      <Card title="العنوان">
        <Field label="عنوان الفيديو"><textarea rows={2} value={f.title} onChange={e => set({ title: e.target.value })} /></Field>
        <p className="muted">لتلوين كلمة ضعها بين نجمتين: *مفاجأة*</p>
        <FontPicker value={f.font} onChange={id => set({ font: id })} />
      </Card>
      <Card title="الافكتات ✨">
        <PickerSelect label="حركة العنوان" value={f.titleFx} options={fxOpts(TITLE_FX)} onChange={id => set({ titleFx: id })} />
        <PickerSelect label="دخول الفيديو" value={f.vidFx} options={fxOpts(VID_FX)} onChange={id => set({ vidFx: id })} />
        <PickerSelect label="حركة الفيديو المستمرة" value={f.loopFx} options={fxOpts(LOOP_FX)} onChange={id => set({ loopFx: id })} />
        <PickerSelect label="افكت الخلفية" value={f.bgFx} options={fxOpts(BG_FX)} onChange={id => set({ bgFx: id })} />
        <PickerSelect label="حركة زر الطلب" value={f.ctaFx} options={fxOpts(CTA_FX)} onChange={id => set({ ctaFx: id })} />
      </Card>
      <Card title="طلب للمتابع (أسفل الفيديو)">
        <Field label="نص جاهز"><select value={CTA_PRESETS.includes(f.cta) ? f.cta : ''} onChange={e => e.target.value && set({ cta: e.target.value })}><option value="">مخصص…</option>{CTA_PRESETS.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="النص"><input value={f.cta} onChange={e => set({ cta: e.target.value })} /></Field>
        <Field label="سطر صغير تحته (اختياري)"><input value={f.ctaSub} placeholder="مثال: نزل كل يوم فيديو جديد" onChange={e => set({ ctaSub: e.target.value })} /></Field>
      </Card></div></div>
}
