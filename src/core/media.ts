import type { Account } from './types'
const LW = 1080 // العرض المنطقي: التصدير قد يرسم بدقة أقل مع تحويل تكبير
const cache = new Map<string, HTMLImageElement>()
export function loadImg(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null)
  const c = cache.get(src); if (c?.complete) return Promise.resolve(c)
  return new Promise(res => { const i = new Image(); i.onload = () => { cache.set(src, i); res(i) }; i.onerror = () => res(null); i.src = src })
}
export const getImg = (s: string) => (s ? cache.get(s) : undefined)
export const loadImgs = (a: string[]) => Promise.all(a.map(loadImg))
export const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3)
export const easeOutBack = (k: number) => { const x = Math.min(1, Math.max(0, k)) - 1; return 1 + 2.70158 * x * x * x + 1.70158 * x * x }
export const ensureFonts = () => Promise.all(['900 90px Cairo', '800 40px Cairo', '700 40px Cairo', '400 90px Lalezar', '700 90px "Reem Kufi"'].map(f => document.fonts.load(f)))
export function fileToDataUrl(f: File, max = 1600): Promise<string> {
  return new Promise((res, rej) => { const u = URL.createObjectURL(f), i = new Image()
    i.onload = () => { const s = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement('canvas'); c.width = i.width * s; c.height = i.height * s; c.getContext('2d')!.drawImage(i, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', .9)) }
    i.onerror = () => rej(new Error('تعذر قراءة الصورة')); i.src = u })
}
export function seekVideo(v: HTMLVideoElement, t: number) {
  return new Promise<void>(res => {
    const t0 = Math.min(Math.max(0, t), Math.max(0, (v.duration || t) - 0.001))
    if (v.readyState >= 2 && Math.abs(v.currentTime - t0) < 0.0005) return res()
    let fin = false
    const done = () => { if (fin) return; fin = true; v.removeEventListener('seeked', onSeeked); res() }
    // بعد 'seeked' ننتظر عرض الإطار فعلياً (إن توفر) كي يقرأ drawImage الإطار الصحيح
    const onSeeked = () => { if ('requestVideoFrameCallback' in v) { v.requestVideoFrameCallback(() => done()); setTimeout(done, 250) } else done() }
    v.addEventListener('seeked', onSeeked); v.currentTime = t0; setTimeout(done, 3000)
  })
}
// ينتظر وصول الإطار الجديد فعلاً بعد القفز (لا يكفي حدث seeked)
export const frameReady = (v: HTMLVideoElement) => new Promise<void>(res => { const t = setTimeout(res, 500); if ('requestVideoFrameCallback' in v) v.requestVideoFrameCallback(() => { clearTimeout(t); res() }); else { clearTimeout(t); res() } })
export function shadowText(ctx: CanvasRenderingContext2D, text: string, y: number, font: string, fill: string | CanvasGradient, maxW: number, alpha: number, dy: number, glow?: string) {
  const x = LW / 2
  ctx.save(); ctx.globalAlpha *= alpha; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = font
  const m = ctx.measureText(text).width; if (m > maxW) { const px = parseInt(/(\d+)px/.exec(font)![1]); ctx.font = font.replace(/\d+px/, Math.floor(px * maxW / m) + 'px') }
  ctx.fillStyle = fill; ctx.shadowColor = glow ?? 'rgba(0,0,0,.8)'; ctx.shadowBlur = glow ? 34 : 20; ctx.shadowOffsetY = glow ? 0 : 4
  ctx.fillText(text, x, y + dy); ctx.shadowBlur = glow ? 12 : 6; ctx.shadowOffsetY = 2; ctx.fillText(text, x, y + dy); ctx.restore()
}
type Tok = { w: string; hl: boolean; x: number }
function wrapTokens(ctx: CanvasRenderingContext2D, words: string[], maxW: number) {
  const sp = ctx.measureText(' ').width, out: Tok[][] = []; let cur: Tok[] = [], width = 0, on = false
  for (const r0 of words) {
    // *كلمة* أو *عدة كلمات* تُلوَّن بلون التمييز
    let raw = r0, hl = on; if (raw.startsWith('*')) { on = true; hl = true; raw = raw.slice(1) } if (raw.endsWith('*')) { raw = raw.slice(0, -1); on = false; hl = true }
    if (!raw) continue; const w = raw, m = ctx.measureText(w).width
    if (cur.length && width + sp + m > maxW) { out.push(cur); cur = []; width = 0 }
    cur.push({ w, hl, x: m }); width += (cur.length > 1 ? sp : 0) + m }
  if (cur.length) out.push(cur); return out
}
export interface RichOpts { family: string; weight: string; size: number; maxW: number; maxLines: number; align: 'center' | 'right'; x: number; y: number; anchor: 'top' | 'middle' | 'bottom'; accent: string; fill?: string; alpha?: number; dy?: number; shadow?: boolean; glow?: string }
// نص عربي متعدد الأسطر؛ الكلمة بين نجمتين *هكذا* تُلوَّن بلون التمييز
export function richText(ctx: CanvasRenderingContext2D, text: string, o: RichOpts) {
  const words = text.trim().split(/\s+/).filter(Boolean); let size = o.size, ls: Tok[][]
  ctx.direction = 'rtl'
  for (;;) { ctx.font = `${o.weight} ${size}px ${o.family}`; ls = wrapTokens(ctx, words, o.maxW); if (ls.length <= o.maxLines || size <= 48) break; size -= 4 }
  const lh = size * 1.28, h = ls.length * lh, top = o.anchor === 'top' ? o.y : o.anchor === 'middle' ? o.y - h / 2 : o.y - h
  const sp = ctx.measureText(' ').width
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.textBaseline = 'middle'; ctx.textAlign = 'right'
  ls.forEach((ln, i) => { const tot = ln.reduce((s, t, k) => s + t.x + (k ? sp : 0), 0), ly = top + i * lh + lh / 2 + (o.dy ?? 0)
    let x = o.align === 'center' ? o.x + tot / 2 : o.x
    ln.forEach(t => { ctx.fillStyle = t.hl ? o.accent : o.fill ?? '#fff'
      if (o.shadow !== false) { ctx.shadowColor = o.glow ?? 'rgba(0,0,0,.85)'; ctx.shadowBlur = o.glow ? 34 : 20; ctx.shadowOffsetY = o.glow ? 0 : 4; ctx.fillText(t.w, x, ly); ctx.shadowBlur = o.glow ? 12 : 5; ctx.shadowOffsetY = o.glow ? 0 : 1 }
      ctx.fillText(t.w, x, ly); x -= t.x + sp }) })
  ctx.restore(); return { top, bottom: top + h, size }
}
export function accountBadge(ctx: CanvasRenderingContext2D, acc: Account, o: { y: number; R: number; size: number; align: 'center' | 'right'; right?: number; accent: string; color?: string; shadow?: boolean }) {
  const W = LW, { y: cy, R } = o
  ctx.save(); ctx.direction = 'rtl'; ctx.font = `800 ${o.size}px Cairo`
  const tw = Math.min(ctx.measureText(acc.pageName).width, 620), total = R + 20 + tw
  const cx = o.align === 'center' ? (W + total) / 2 - R / 2 : (o.right ?? W - 70) - R / 2
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 14; ctx.fillStyle = '#394065'; ctx.beginPath(); ctx.arc(cx, cy, R / 2, 0, 7); ctx.fill(); ctx.shadowBlur = 0
  const im = getImg(acc.profileImg)
  if (im) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R / 2, 0, 7); ctx.clip(); const s = Math.max(R / im.width, R / im.height); ctx.drawImage(im, cx - im.width * s / 2, cy - im.height * s / 2, im.width * s, im.height * s); ctx.restore() }
  ctx.lineWidth = 4; ctx.strokeStyle = o.accent; ctx.beginPath(); ctx.arc(cx, cy, R / 2, 0, 7); ctx.stroke()
  ctx.fillStyle = o.color ?? '#fff'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 2 } else ctx.shadowColor = 'transparent'
  ctx.fillText(acc.pageName, cx - R / 2 - 20, cy + 2, 620); ctx.restore()
}
export function drawLogo(ctx: CanvasRenderingContext2D, acc: Account, side: 'left' | 'right', size: number, pad: number, bottom: number) {
  const lg = getImg(acc.logoImg); if (!lg) return
  const s = size / Math.max(lg.width, lg.height), w = lg.width * s, h = lg.height * s
  ctx.save(); ctx.globalAlpha = .75; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 10
  ctx.drawImage(lg, side === 'right' ? LW - pad - w : pad, bottom - pad - h, w, h); ctx.restore()
}
