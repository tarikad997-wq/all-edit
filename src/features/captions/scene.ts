import type { Account } from '../../core/types'
import type { Scene } from '../../core/exporter'
import { W, H } from '../../core/exporter'
import { Cap, isArabic, wordsOf } from '../../core/captions'
import { fontOf, loadFont } from '../../core/fonts'
import { lum } from '../../core/colors'
import { ease, easeOutBack, ensureFonts, loadImgs, accountBadge, drawLogo } from '../../core/media'
import { Src, drawSrc, makeVideoIO } from '../../core/videoSource'
export interface CapStyle { font: string; size: number; color: string; hi: string; anim: string; wordFx: string; outline: boolean; bg: boolean; pos: 'top' | 'middle' | 'bottom'; offY: number; fit: 'cover' | 'contain'; showAcc: boolean }
export const defaultStyle: CapStyle = { font: 'cairo', size: 76, color: '#ffffff', hi: '#ffd166', anim: 'pop', wordFx: 'color', outline: true, bg: false, pos: 'bottom', offY: 0, fit: 'cover', showAcc: false }

const LAYOUT = new Map<string, { sp: number; idx: { i: number; x: number }[][] }>() // تخزين مؤقت لتقسيم الأسطر: يوفّر قياس النص في كل إطار
// عند اختلاط اللغتين: تُعكس كلمات المقطع المخالف للاتجاه الأساسي حتى تُقرأ بترتيبها الصحيح
function visual<T extends { w: { w: string } }>(ln: T[], rtl: boolean): T[] {
  const odd = (x: T) => (rtl ? !isArabic(x.w.w) : isArabic(x.w.w)), out: T[] = []
  for (let i = 0; i < ln.length;) { if (!odd(ln[i])) { out.push(ln[i++]); continue } let j = i; while (j < ln.length && odd(ln[j])) j++; out.push(...ln.slice(i, j).reverse()); i = j }
  return out
}
export function drawCaption(ctx: CanvasRenderingContext2D, cap: Cap, t: number, st: CapStyle) {
  const words = wordsOf(cap); if (!words.length) return
  const fo = fontOf(st.font), rtl = isArabic(cap.text), A = st.anim
  ctx.save(); ctx.font = `${fo.weight} ${st.size}px "${fo.family}"`; ctx.direction = rtl ? 'rtl' : 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = rtl ? 'right' : 'left'
  const key = `${fo.id}|${st.size}|${cap.text}|${words.length}`, hit = LAYOUT.get(key)
  const sp = hit?.sp ?? ctx.measureText(' ').width, maxW = 920
  const idx: { i: number; x: number }[][] = hit?.idx ?? []
  if (!hit) { let cur: { i: number; x: number }[] = [], width = 0
    words.forEach((w, i) => { const x = ctx.measureText(w.w).width; if (cur.length && width + sp + x > maxW) { idx.push(cur); cur = []; width = 0 } cur.push({ i, x }); width += (cur.length > 1 ? sp : 0) + x })
    if (cur.length) idx.push(cur); if (LAYOUT.size > 400) LAYOUT.clear(); LAYOUT.set(key, { sp, idx }) }
  const lines = idx.map(l => l.map(o => ({ w: words[o.i], x: o.x })))
  const lh = st.size * 1.34, h = lines.length * lh
  const base = st.pos === 'top' ? 340 : st.pos === 'middle' ? H / 2 - h / 2 : 1490 - h, y0 = Math.max(120, Math.min(H - 120 - h, base + st.offY))
  const k = ease((t - cap.s) / 0.14), cy0 = y0 + h / 2
  ctx.globalAlpha = A === 'none' || A === 'word' ? 1 : k; ctx.translate(W / 2, cy0 + (A === 'slide' ? (1 - k) * 50 : 0)); const sc = A === 'pop' ? .92 + .08 * k : 1; ctx.scale(sc, sc); ctx.translate(-W / 2, -cy0)
  const dark = lum(st.hi) > .55 ? '#111111' : '#ffffff'
  lines.forEach((ln, i) => {
    const tot = ln.reduce((a2, l, j) => a2 + l.x + (j ? sp : 0), 0), cy = y0 + i * lh + lh / 2
    if (st.bg && (A !== 'word' || t >= ln[0].w.s - .02)) { ctx.fillStyle = 'rgba(0,0,0,.58)'; ctx.beginPath(); ctx.roundRect(W / 2 - tot / 2 - 30, cy - lh / 2 + 5, tot + 60, lh - 10, 24); ctx.fill() }
    let x = rtl ? W / 2 + tot / 2 : W / 2 - tot / 2
    for (const { w, x: ww } of visual(ln, rtl)) {
      const next = x + (rtl ? -(ww + sp) : ww + sp), shown = A !== 'word' || t >= w.s - .02
      if (!shown) { x = next; continue }
      const active = st.wordFx !== 'none' && t >= w.s && t < w.e, pop = A === 'word' ? .7 + .3 * easeOutBack((t - (w.s - .02)) / .16) : 1, cx = rtl ? x - ww / 2 : x + ww / 2
      ctx.save(); ctx.translate(cx, cy); const scl = pop * (active && st.wordFx === 'scale' ? 1.18 : 1); ctx.scale(scl, scl); ctx.translate(-cx, -cy)
      const box = active && st.wordFx === 'box'
      if (box) { ctx.fillStyle = st.hi; ctx.beginPath(); ctx.roundRect(cx - ww / 2 - 14, cy - st.size * .52, ww + 28, st.size * 1.04, 18); ctx.fill() }
      if (st.outline && !box) { ctx.lineWidth = st.size * .17; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.92)'; ctx.strokeText(w.w, x, cy) }
      else if (!st.bg && !box) { ctx.shadowColor = 'rgba(0,0,0,.85)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 3 }
      ctx.fillStyle = box ? dark : active ? st.hi : st.color; ctx.fillText(w.w, x, cy); ctx.shadowColor = 'transparent'
      if (active && st.wordFx === 'underline') { ctx.fillStyle = st.hi; ctx.fillRect(cx - ww / 2, cy + st.size * .5, ww, st.size * .09) }
      ctx.restore(); x = next
    }
  })
  ctx.restore()
}
export const capAt = (caps: Cap[], t: number) => caps.find(c => t >= c.s && t < c.e)
export function drawCapFrame(ctx: CanvasRenderingContext2D, st: CapStyle, acc: Account, src: Src | null, caps: Cap[], t: number) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
  if (src) drawSrc(ctx, src, 0, 0, W, H, st.fit)
  else { ctx.fillStyle = '#8b93b5'; ctx.font = '700 52px Cairo'; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎞 اختر فيديو لبدء الكابشن', W / 2, H / 2) }
  if (st.pos === 'bottom' && !st.bg) { const g = ctx.createLinearGradient(0, H * .6, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.5)'); ctx.fillStyle = g; ctx.fillRect(0, H * .6, W, H * .4) }
  if (st.showAcc) { const g = ctx.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 300); accountBadge(ctx, acc, { y: 150, R: 84, size: 42, align: 'center', accent: st.hi }) }
  const c = capAt(caps, t); if (c) drawCaption(ctx, c, t, st)
  drawLogo(ctx, acc, 'right', 110, 40, H)
}
export function makeCaptionScene(o: { st: CapStyle; caps: Cap[]; start: number; length: number; mute: boolean }, acc: Account, video: HTMLVideoElement, file: File): Scene {
  const io = makeVideoIO(video, file, o.start, o.length, o.mute)
  return { duration: o.length,
    prepare: async () => { await ensureFonts(); await loadFont(o.st.font, o.caps.map(c => c.text).join(' ')); await loadImgs([acc.profileImg, acc.logoImg]); await io.prepare() },
    draw: (ctx, t) => drawCapFrame(ctx, o.st, acc, io.current(), o.caps, t), play: io.play, seek: io.seek, audioCopy: io.audioCopy, audioLayers: io.audioLayers }
}
