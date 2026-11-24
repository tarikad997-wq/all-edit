import { useEffect, useRef, useState } from 'react'
import { useAccount } from '../../core/account'
import { calcAge } from '../../core/age'
import { usePlayer, useExport } from '../../core/hooks'
import { ensureFonts } from '../../core/media'
import { W, H } from '../../core/exporter'
import { saveList, loadList, listNames, deleteList } from '../../core/storage'
import { uid } from '../../core/types'
import { Card, Field, ImagePick, Preview, PlayerBar, ExportBar } from '../../ui/Kit'
import ColorField from '../../ui/ColorField'
import PickerSelect, { Opt } from '../../ui/PickerSelect'
import { OVERLAYS } from '../../core/fx'
import { LOOK_OPTS, PP_PRESETS, TRANS_OPTS } from './presets'
import FontPicker from '../../ui/FontPicker'
import ExportSheet from '../../ui/ExportSheet'
import { loadFont } from '../../core/fonts'
import { Actor, Project, newActor } from './types'
import { drawFrame, makeScene, preload, totalDuration } from './scene'

const fxo = (l: [string, string, string][]): Opt[] => l.map(([id, label, sub]) => ({ id, label, sub }))
const PRESET_OPTS: Opt[] = PP_PRESETS.map(p => ({ id: p.id, label: p.label, sub: `خط: ${p.font}`, keywords: p.look, style: { fontFamily: `"${p.font}"` }, preview: <i className="tp" style={{ borderColor: p.accent, color: p.accent, background: '#0b0f1a' }}>اسم</i> }))
const OVERLAY_OPTS: Opt[] = OVERLAYS.filter(o => o.id !== 'glow').map(o => ({ id: o.id, label: o.label, sub: o.sub }))
export default function PastPresentPage({ active }: { active: boolean }) {
  const { acc } = useAccount()
  const [p, setP] = useState<Project>(() => { try { const d = JSON.parse(localStorage.getItem('pp-draft') || ''); return { actors: d.actors ?? [], guessMode: d.guessMode, guessSecs: d.guessSecs, font: d.font, accent: d.accent, look: d.look, preset: d.preset, trans: d.trans, overlay: d.overlay } } catch { return { actors: [newActor()] } } })
  const [music, setMusic] = useState<{ name: string; url: string; buf: ArrayBuffer } | null>(null), [vol, setVol] = useState(.6)
  const [names, setNames] = useState<string[]>([]), [note, setNote] = useState('')
  const cv = useRef<HTMLCanvasElement>(null), audio = useRef<HTMLAudioElement>(null), ex = useExport()
  const total = totalDuration(p)
  const pl = usePlayer(total, { onPlay: t => { const a = audio.current; if (a && music) { a.currentTime = t; a.volume = vol; a.play().catch(() => {}) } }, onPause: () => audio.current?.pause() })
  const upd = (patch: Partial<Project>) => setP(d => ({ ...d, ...patch }))
  const setActor = (id: string, patch: Partial<Actor>) => setP(d => ({ ...d, actors: d.actors.map(a => a.id === id ? { ...a, ...patch } : a) }))
  const move = (i: number, d: number) => setP(x => { const a = [...x.actors], j = i + d; if (j < 0 || j >= a.length) return x; [a[i], a[j]] = [a[j], a[i]]; return { ...x, actors: a } })

  useEffect(() => { try { localStorage.setItem('pp-draft', JSON.stringify(p)) } catch { setNote('تعذر الحفظ التلقائي (الصور كبيرة). استخدم «حفظ قائمة».') } }, [p])
  useEffect(() => { listNames().then(setNames) }, [])
  useEffect(() => { if (!active) pl.pause() }, [active])
  useEffect(() => { let off = false; ensureFonts().then(() => loadFont(p.font, p.actors.map(a => a.name).join(' '))).then(() => preload(p, acc)).then(() => { if (!off && cv.current) drawFrame(cv.current.getContext('2d')!, p, acc, pl.tr.current) }); return () => { off = true } }, [p, acc, pl.t])

  async function doExport() {
    pl.pause()
    if (!p.actors.length) return ex.setMsg('أضف ممثلاً واحداً على الأقل.')
    const bad = p.actors.findIndex(a => !a.name || !a.oldImg || !a.newImg)
    if (bad >= 0) return ex.setMsg(`الممثل رقم ${bad + 1} ينقصه اسم أو صورة.`)
    ex.open()
  }
  async function save() { const n = prompt('اسم القائمة:'); if (!n) return; await saveList(n, p); setNames(await listNames()); setNote('تم حفظ القائمة') }

  return <div className="page">
    <div className="col-side"><Card><Preview cref={cv} w={W} h={H} />
      <PlayerBar playing={pl.playing} t={pl.t} total={total} onToggle={pl.toggle} onSeek={pl.seek} />
      <ExportBar msg={ex.msg} onExport={doExport} />
      <ExportSheet ex={ex} name="all-edit-past-present.mp4" build={() => makeScene(p, acc, music ? { buf: music.buf, vol } : null)} /></Card></div>
    <div className="col-main">
      <Card title="المظهر والافكتات">
        <PickerSelect label={`القالب (${PP_PRESETS.length})`} value={p.preset ?? 'gold'} options={PRESET_OPTS} search onChange={id => { const x = PP_PRESETS.find(q => q.id === id)!; upd({ preset: id, look: x.look, font: x.font, accent: x.accent }) }} />
        <PickerSelect label="نمط النص" value={p.look ?? 'classic'} options={fxo(LOOK_OPTS)} onChange={id => upd({ look: id as Project['look'] })} />
        <FontPicker label="خط الاسم" value={p.font ?? 'cairo'} onChange={id => upd({ font: id })} />
        <ColorField label="لون التمييز" value={p.accent ?? '#ffd166'} onChange={v => upd({ accent: v })} />
        <PickerSelect label="انتقال الصور" value={p.trans ?? 'wipe'} options={fxo(TRANS_OPTS)} onChange={id => upd({ trans: id })} />
        <PickerSelect label="افكت الصورة" value={p.overlay ?? 'none'} options={OVERLAY_OPTS} onChange={id => upd({ overlay: id })} />
      </Card>
      <Card title="الإعدادات">
        <label className="check"><input type="checkbox" checked={!!p.guessMode} onChange={e => upd({ guessMode: e.target.checked })} /> 🎯 وضع «خمّن من هو؟»</label>
        {p.guessMode && <Field label="مدة التخمين (ثوانٍ)"><input type="number" min="2" max="6" value={p.guessSecs ?? 3} onChange={e => upd({ guessSecs: Math.min(6, Math.max(2, Math.round(+e.target.value) || 3)) })} /></Field>}
        <div className="row"><label className="btn">🎵 موسيقى خلفية<input type="file" accept="audio/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (f) setMusic({ name: f.name, url: URL.createObjectURL(f), buf: await f.arrayBuffer() }) }} /></label>
          <span className="muted grow">{music?.name ?? 'لا توجد'}</span>{music && <button className="btn" onClick={() => setMusic(null)}>✕</button>}</div>
        <Field label="مستوى الصوت"><input type="range" min=".05" max="1" step=".05" value={vol} onChange={e => { setVol(+e.target.value); if (audio.current) audio.current.volume = +e.target.value }} /></Field>
        <audio ref={audio} src={music?.url} loop />
      </Card>
      <Card title={`الممثلون (${p.actors.length})`} action={<button className="btn primary" onClick={() => upd({ actors: [...p.actors, newActor()] })}>＋ إضافة</button>}>
        {p.actors.map((a, i) => { const age = calcAge(a.birth, a.death); return <div className="item" key={a.id}>
          <div className="item-h"><b className="badge">{i + 1}</b><span className="grow" />
            <button className="btn sm" onClick={() => move(i, -1)}>▲</button><button className="btn sm" onClick={() => move(i, 1)}>▼</button>
            <button className="btn sm" onClick={() => upd({ actors: [...p.actors.slice(0, i + 1), { ...a, id: uid() }, ...p.actors.slice(i + 1)] })}>⧉</button>
            <button className="btn sm danger" onClick={() => upd({ actors: p.actors.filter(x => x.id !== a.id) })}>🗑</button></div>
          <div className="row"><ImagePick label="الماضي" value={a.oldImg} onChange={s => setActor(a.id, { oldImg: s })} size={96} /><ImagePick label="الحاضر" value={a.newImg} onChange={s => setActor(a.id, { newImg: s })} size={96} />
            <div className="stack grow"><input value={a.name} placeholder="اسم الممثل" onChange={e => setActor(a.id, { name: e.target.value })} /><span className="muted">{age !== null ? `العمر: ${age}` : 'أدخل تاريخ الميلاد'}</span></div></div>
          <div className="grid2"><Field label="الميلاد"><input dir="ltr" value={a.birth} placeholder="1960 أو 1960-05-20" onChange={e => setActor(a.id, { birth: e.target.value })} /></Field>
            <Field label="الوفاة (اختياري)"><input dir="ltr" value={a.death} placeholder="2016" onChange={e => setActor(a.id, { death: e.target.value })} /></Field></div>
          <Field label={p.guessMode ? 'مدة الكشف (ث)' : 'المدة (ث)'}><input type="number" min="2" max="30" step=".5" value={a.duration} onChange={e => setActor(a.id, { duration: Math.max(2, +e.target.value || 5) })} /></Field>
        </div> })}
      </Card>
      <Card title="القوائم المحفوظة">
        <div className="row"><button className="btn" onClick={save}>💾 حفظ القائمة الحالية</button>
          <select className="grow" value="" onChange={async e => { const v = e.target.value; if (v) { const l = await loadList<Project>(v); if (l) setP({ ...l, actors: l.actors ?? [] }) } }}><option value="">📂 تحميل قائمة…</option>{names.map(n => <option key={n}>{n}</option>)}</select>
          <button className="btn danger" onClick={async () => { const n = prompt('اسم القائمة المراد حذفها:'); if (n) { await deleteList(n); setNames(await listNames()) } }}>🗑</button></div>
        {note && <p className="note">{note}</p>}
      </Card>
    </div></div>
}
