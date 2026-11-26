import { useEffect, useRef, useState } from 'react'
import { useAccount } from '../../core/account'
import { TextOpts, defaultTextOpts, postProcess } from '../../core/arabicText'
import { Cap, fromChunks, parseSrt, toSrt } from '../../core/captions'
import { W, H } from '../../core/exporter'
import { loadFont } from '../../core/fonts'
import { usePlayer, useExport } from '../../core/hooks'
import { ensureFonts, loadImgs, seekVideo } from '../../core/media'
import { uid } from '../../core/types'
import { fromVideo } from '../../core/videoSource'
import ColorField from '../../ui/ColorField'
import ExportSheet from '../../ui/ExportSheet'
import PickerSelect, { Opt } from '../../ui/PickerSelect'
import { ANIM_OPTS, CAP_PRESETS, WORDFX_OPTS } from './presets'
import FontPicker from '../../ui/FontPicker'
import { Card, ExportBar, Field, PlayerBar, Preview } from '../../ui/Kit'
import { CapStyle, defaultStyle, drawCapFrame, makeCaptionScene } from './scene'
import { Lang, MODELS, Quality, extractAudio, transcribe } from './transcribe'

const fxo = (l: [string, string, string][]): Opt[] => l.map(([id, label, sub]) => ({ id, label, sub }))
const PRESET_OPTS: Opt[] = CAP_PRESETS.map(c => ({ id: c.id, label: c.label, sub: c.sub, keywords: c.patch.font, style: { fontFamily: `"${c.patch.font}"` }, preview: <i className="tp" style={{ background: '#222', borderColor: 'transparent', color: c.patch.color, textShadow: c.patch.outline ? '0 0 3px #000,0 0 3px #000' : undefined }}><span style={{ color: c.patch.hi }}>ن</span>ص</i> }))
const MAX_LEN = 600
const load = <T,>(k: string, d: T): T => { try { return { ...d, ...JSON.parse(localStorage.getItem(k) || '{}') } } catch { return d } }
const dl = (name: string, text: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); a.download = name; a.click() }

export default function CaptionsPage({ active }: { active: boolean }) {
  const { acc } = useAccount()
  const [st, setSt] = useState<CapStyle>(() => { const s = load<CapStyle>('pp-capstyle', defaultStyle) as CapStyle & { karaoke?: boolean }; if (s.karaoke === false) s.wordFx = 'none'; return s })
  const [caps, setCaps] = useState<Cap[]>(() => { try { return JSON.parse(localStorage.getItem('pp-caps') || '[]') } catch { return [] } })
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('pp-lang') as Lang) || 'auto'), [quality, setQuality] = useState<Quality>('balanced')
  const [custom, setCustom] = useState(() => localStorage.getItem('pp-custommodel') ?? ''), [topts, setTopts] = useState<TextOpts>(() => load('pp-textopts', defaultTextOpts))
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState(''), [vd, setVd] = useState(0), [start, setStart] = useState(0), [length, setLength] = useState(30)
  const [job, setJob] = useState<{ label: string; f?: number } | null>(null), [err, setErr] = useState('')
  const cv = useRef<HTMLCanvasElement>(null), vid = useRef<HTMLVideoElement>(null), abort = useRef<AbortController | null>(null), ex = useExport()
  const set = (p: Partial<CapStyle>) => setSt(x => ({ ...x, ...p }))
  const pl = usePlayer(length, { onPlay: t => { const v = vid.current; if (v) { v.currentTime = start + t; v.muted = false; v.play().catch(() => {}) } }, onPause: () => vid.current?.pause() })
  useEffect(() => { try { localStorage.setItem('pp-capstyle', JSON.stringify(st)); localStorage.setItem('pp-caps', JSON.stringify(caps)) } catch { /* */ } }, [st, caps])
  useEffect(() => { try { localStorage.setItem('pp-lang', lang); localStorage.setItem('pp-custommodel', custom); localStorage.setItem('pp-textopts', JSON.stringify(topts)) } catch { /* */ } }, [lang, custom, topts])
  useEffect(() => { if (!active) pl.pause() }, [active])
  useEffect(() => { let off = false
    const draw = () => { if (!off && cv.current) drawCapFrame(cv.current.getContext('2d')!, st, acc, url ? fromVideo(vid.current) : null, caps, pl.tr.current) }
    Promise.all([ensureFonts(), loadFont(st.font, caps.map(c => c.text).join(' ')), loadImgs([acc.profileImg, acc.logoImg])]).then(async () => { if (url && vid.current && !pl.playing) await seekVideo(vid.current, start + pl.tr.current); draw() })
    return () => { off = true } }, [st, caps, acc, url, pl.t, vd, start])

  function pick(f: File) { pl.pause(); if (url) URL.revokeObjectURL(url); setFile(f); setUrl(URL.createObjectURL(f)); setVd(0); setErr('') }
  async function run() {
    if (!file) return; setErr(''); const ctl = new AbortController(); abort.current = ctl; setJob({ label: 'قراءة الصوت من الفيديو…' })
    try { const audio = await extractAudio(file, start, length); if (ctl.signal.aborted) return
      const r = await transcribe(audio, { quality, language: lang, customModel: custom, onStatus: (label, f) => setJob({ label, f }), signal: ctl.signal })
      const out = postProcess(fromChunks(r.chunks, r.wordLevel), { ...topts, dialect: topts.dialect || lang === 'ary' }); setCaps(out); if (!out.length) setErr('لم يُسمع كلام واضح في هذا المقطع.'); else if (!r.wordLevel) setErr('تم التفريغ بتوقيت تقريبي للجمل (وليس لكل كلمة).')
    } catch (e) { if ((e as Error).name !== 'AbortError') setErr('تعذّر التفريغ: ' + (e as Error).message + ' — تأكد من اتصالك بالإنترنت (التحميل الأول للنموذج فقط) ثم أعد المحاولة، أو استورد ملف SRT / اكتب الكابشن يدوياً.') }
    finally { setJob(null) }
  }
  const upd = (id: string, p: Partial<Cap>) => setCaps(cs => cs.map(c => c.id === id ? { ...c, ...p, words: 'text' in p || 's' in p || 'e' in p ? undefined : c.words } : c))
  const add = (after?: number) => setCaps(cs => { const prev = after === undefined ? cs[cs.length - 1] : cs[after], s = prev ? prev.e : pl.tr.current, n: Cap = { id: uid(), s, e: s + 2, text: 'نص جديد' }; const a = [...cs]; a.splice((after ?? cs.length - 1) + 1, 0, n); return a })
  const maxLen = Math.max(2, Math.min(MAX_LEN, vd ? vd - start : MAX_LEN)), cur = caps.find(c => pl.t >= c.s && pl.t < c.e)

  return <div className="page">
    <div className="col-side"><Card><Preview cref={cv} w={W} h={H} />
      <PlayerBar playing={pl.playing} t={pl.t} total={length} onToggle={pl.toggle} onSeek={pl.seek} />
      <ExportBar msg={ex.msg} disabled={!file} onExport={() => { pl.pause(); ex.open() }} />
      <ExportSheet ex={ex} name="all-edit-captions.mp4" build={() => makeCaptionScene({ st, caps, start, length, mute: false }, acc, vid.current!, file!)} /></Card></div>
    <div className="col-main">
      <Card title="١ — الفيديو">
        <label className="btn big">🎞 اختيار فيديو الريلز<input type="file" accept="video/*" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) pick(f) }} /></label>
        <span className="muted">{file ? `${file.name} — ${vd ? vd.toFixed(1) + ' ث' : '…'}` : 'لم يُختر فيديو'}</span>
        <video ref={vid} src={url || undefined} playsInline preload="auto" muted className="hidden" onLoadedMetadata={e => { const d = e.currentTarget.duration; setVd(d); setStart(0); setLength(Math.round(Math.min(d, MAX_LEN) * 10) / 10) }} />
        <div className="grid2"><Field label="بداية المقطع (ث)"><input type="number" min="0" max={Math.max(0, vd - 2)} step=".5" value={start} onChange={e => setStart(Math.max(0, Math.min(+e.target.value || 0, Math.max(0, vd - 2))))} /></Field>
          <Field label="المدة (ث)"><input type="number" min="2" max={maxLen} step=".5" value={length} onChange={e => setLength(Math.max(2, Math.min(+e.target.value || 2, maxLen)))} /></Field></div>
        <div className="seg"><button className={st.fit === 'cover' ? 'on' : ''} onClick={() => set({ fit: 'cover' })}>ملء الشاشة</button><button className={st.fit === 'contain' ? 'on' : ''} onClick={() => set({ fit: 'contain' })}>الفيديو كاملاً</button></div>
      </Card>
      <Card title="٢ — كتابة الكابشن تلقائياً">
        <div className="grid2"><Field label="لغة الكلام"><select value={lang} onChange={e => { const v = e.target.value as Lang; setLang(v); if (v === 'ary') { setTopts(o => ({ ...o, dialect: true })); setQuality(q => q === 'fast' ? 'best' : q) } }}><option value="auto">تلقائي (عربي / English / Français)</option><option value="ar">العربية (فصحى ولهجات)</option><option value="ary">الدارجة المغربية</option><option value="en">English</option><option value="fr">Français</option></select></Field>
          <Field label="الجودة"><select value={quality} onChange={e => setQuality(e.target.value as Quality)}>{Object.entries(MODELS).map(([k, v]) => <option key={k} value={k}>{v.label} — {v.size}</option>)}<option value="custom">نموذج مخصص (ONNX)</option></select></Field></div>
        {quality === 'custom' && <Field label="اسم النموذج على Hugging Face"><input dir="ltr" value={custom} placeholder="username/whisper-small-darija-onnx" onChange={e => setCustom(e.target.value)} /></Field>}
        {lang === 'ary' && <p className="note">الدارجة المغربية: Whisper لا يملك لغة مخصّصة لها، فيكتبها كعربية. للدقة الأعلى اختر «دقيق»، أو أدخل نموذجاً مدرَّباً على الدارجة بصيغة ONNX (انظر الدليل)، ثم صحّح الكلمات المتكررة عبر «قاموس التصحيح» أدناه.</p>}
        {job ? <div className="stack"><div className="bar"><div style={{ width: job.f != null ? job.f * 100 + '%' : '100%', opacity: job.f != null ? 1 : .35 }} /><span>{job.label}{job.f != null ? ` ${Math.round(job.f * 100)}%` : ''}</span></div><button className="btn danger" onClick={() => abort.current?.abort()}>إلغاء</button></div>
          : <button className="btn primary big" disabled={!file} onClick={run}>✨ ابدأ كتابة الكابشن</button>}
        <p className="muted">يعمل على جهازك: صوتك لا يُرفع لأي خادم. يحتاج إنترنت في أول مرة فقط لتحميل النموذج، ثم يُحفظ في المتصفح.</p>
        {err && <p className="note">{err}</p>}
        <div className="row"><label className="btn">📥 استيراد SRT<input type="file" accept=".srt,text/plain" hidden onChange={async e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { const c = parseSrt(await f.text()); if (c.length) setCaps(c); else setErr('الملف لا يحتوي كابشن صالحاً.') } }} /></label>
          <button className="btn" disabled={!caps.length} onClick={() => dl('captions.srt', toSrt(caps))}>📤 تنزيل SRT</button></div>
      </Card>
      <Card title="نص عربي ودارجة">
        <label className="check"><input type="checkbox" checked={topts.dialect} onChange={e => setTopts(o => ({ ...o, dialect: e.target.checked }))} /> توحيد تهجئة الدارجة المغربية (دبا ← دابا، بزااااف ← بزاف…)</label>
        <Field label="الأرقام"><div className="seg">{([['western', '123'], ['arabic', '١٢٣']] as const).map(([k, l]) => <button key={k} className={topts.digits === k ? 'on' : ''} onClick={() => setTopts(o => ({ ...o, digits: k }))}>{l}</button>)}</div></Field>
        <Field label="التشكيل"><div className="seg">{([['remove', 'إزالة'], ['keep', 'إبقاء']] as const).map(([k, l]) => <button key={k} className={topts.diacritics === k ? 'on' : ''} onClick={() => setTopts(o => ({ ...o, diacritics: k }))}>{l}</button>)}</div></Field>
        <Field label="قاموس التصحيح (سطر لكل كلمة: الخطأ=الصح)"><textarea rows={4} value={topts.glossary} placeholder={'مروك=المغرب\nواش كاين=واش كاين شي'} onChange={e => setTopts(o => ({ ...o, glossary: e.target.value }))} /></Field>
        <button className="btn" disabled={!caps.length} onClick={() => setCaps(cs => postProcess(cs, topts))}>🪄 تطبيق على النص الحالي</button>
        <p className="muted">يُحذف تلقائياً ما يختلقه Whisper عند الصمت (مثل «ترجمة نانسي قنقر»)، وتُصحَّح علامات الترقيم العربية.</p>
      </Card>
      <Card title={`٣ — النص والتوقيت (${caps.length})`} action={<button className="btn primary sm" onClick={() => add()}>＋ سطر</button>}>
        {!caps.length && <p className="muted">لا يوجد كابشن بعد. ابدأ الكتابة التلقائية أو أضف سطراً يدوياً.</p>}
        {caps.map((c, i) => <div key={c.id} className={'item' + (cur?.id === c.id ? ' cur' : '')}>
          <div className="item-h"><b className="badge" onClick={() => pl.seek(c.s)} style={{ cursor: 'pointer' }}>{i + 1}</b><span className="grow" />
            <button className="btn sm" aria-label="إضافة سطر بعد هذا السطر" onClick={() => add(i)}>＋</button><button className="btn sm danger" aria-label="حذف السطر" onClick={() => setCaps(cs => cs.filter(x => x.id !== c.id))}>🗑</button></div>
          <textarea rows={2} value={c.text} onChange={e => upd(c.id, { text: e.target.value })} />
          <div className="grid2"><Field label="من (ث)"><input type="number" step=".1" min="0" value={+c.s.toFixed(2)} onChange={e => upd(c.id, { s: Math.max(0, +e.target.value || 0) })} /></Field>
            <Field label="إلى (ث)"><input type="number" step=".1" min="0" value={+c.e.toFixed(2)} onChange={e => upd(c.id, { e: Math.max(c.s + .1, +e.target.value || 0) })} /></Field></div>
        </div>)}
      </Card>
      <Card title="٤ — شكل الكابشن والافكتات">
        <PickerSelect label={`القالب (${CAP_PRESETS.length})`} value="" options={PRESET_OPTS} search onChange={id => set(CAP_PRESETS.find(c => c.id === id)!.patch)} />
        <FontPicker value={st.font} onChange={id => set({ font: id })} />
        <Field label={`الحجم: ${st.size}`}><input type="range" min="40" max="130" step="2" value={st.size} onChange={e => set({ size: +e.target.value })} /></Field>
        <PickerSelect label="حركة ظهور الكابشن" value={st.anim} options={fxo(ANIM_OPTS)} onChange={id => set({ anim: id })} />
        <PickerSelect label="افكت الكلمة الحالية" value={st.wordFx} options={fxo(WORDFX_OPTS)} onChange={id => set({ wordFx: id })} />
        <div className="seg">{([['top', 'أعلى'], ['middle', 'وسط'], ['bottom', 'أسفل']] as const).map(([k, l]) => <button key={k} className={st.pos === k ? 'on' : ''} onClick={() => set({ pos: k })}>{l}</button>)}</div>
        <Field label={`إزاحة رأسية: ${st.offY}`}><input type="range" min="-300" max="300" step="10" value={st.offY} onChange={e => set({ offY: +e.target.value })} /></Field>
        <ColorField label="لون النص" value={st.color} onChange={v => set({ color: v })} />
        <ColorField label="لون الكلمة الحالية" value={st.hi} onChange={v => set({ hi: v })} />
        <label className="check"><input type="checkbox" checked={st.outline} onChange={e => set({ outline: e.target.checked })} /> حدّ أسود حول الحروف</label>
        <label className="check"><input type="checkbox" checked={st.bg} onChange={e => set({ bg: e.target.checked })} /> خلفية خلف النص</label>
        <label className="check"><input type="checkbox" checked={st.showAcc} onChange={e => set({ showAcc: e.target.checked })} /> إظهار صورة واسم الصفحة أعلى الفيديو</label>
      </Card>
    </div></div>
}
