import type { Account } from '../../core/types'
import type { Scene } from '../../core/exporter'
import { W, H } from '../../core/exporter'
import { cssFamily, fontOf, loadFont } from '../../core/fonts'
import { ease, easeOutBack, ensureFonts, loadImgs, richText, accountBadge, drawLogo } from '../../core/media'
import { isArabic } from '../../core/captions'
import { Src, drawSrc, makeVideoIO } from '../../core/videoSource'
import { REEL_TEMPLATES, Theme, lum } from './templates'
export interface ReelForm extends Theme { tpl: string; title: string; cta: string; ctaSub: string; fit: 'cover' | 'contain'; start: number; length: number; mute: boolean; size: number; offY: number; titleFx: string; vidFx: string; loopFx: string; bgFx: string; ctaFx: string }
export const defaultForm: ReelForm = { ...REEL_TEMPLATES[0].theme, tpl: 'classic', title: 'اكتب عنوان الفيديو هنا', cta: 'تابعنا لمزيد من المحتوى 🔔', ctaSub: '', fit: 'cover', start: 0, length: 30, mute: false, size: 100, offY: 0, titleFx: 'slide', vidFx: 'zoom', loopFx: 'none', bgFx: 'none', ctaFx: 'pulse' }
export const CTA_PRESETS = ['تابعنا لمزيد من المحتوى 🔔', 'اكتب رأيك في التعليقات 👇', 'شارك الفيديو مع صديقك ↗', 'هل أعجبك الفيديو؟ ضع لايك ❤️', 'فعّل الإشعارات كي لا يفوتك جديدنا 🔔']
interface Geo { S: number; X: number; Y: number }
// حجم المربع (٪ من 920) وموضعه الرأسي قابلان للتعديل
export const geo = (f: ReelForm): Geo => { const S = Math.round(920 * f.size / 100); return { S, X: Math.round((W - S) / 2), Y: Math.round(1100 - S / 2 + f.offY) } }

const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
function paintDeco(ctx: CanvasRenderingContext2D, d: string, accent: string) {
  if (d === 'none') return
  ctx.save(); ctx.strokeStyle = accent; ctx.fillStyle = accent
  if (d === 'dots') { ctx.globalAlpha = .13; for (let y = 40; y < H; y += 90) for (let x = (y / 90 % 2 ? 40 : 85); x < W; x += 90) { ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill() } }
  else if (d === 'grid') { ctx.globalAlpha = .1; ctx.lineWidth = 2; for (let x = 0; x <= W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() } for (let y = 0; y <= H; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() } }
  else if (d === 'stripes') { ctx.globalAlpha = .07; ctx.lineWidth = 26; for (let k = -H; k < W + H; k += 90) { ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + H, H); ctx.stroke() } }
  else if (d === 'rays') { ctx.globalAlpha = .08; ctx.translate(W / 2, 380); for (let i = 0; i < 18; i++) { ctx.rotate(Math.PI / 9); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-110, -2200); ctx.lineTo(110, -2200); ctx.fill() } }
  else if (d === 'waves') { ctx.globalAlpha = .14; ctx.lineWidth = 4; for (let r = 0; r < 9; r++) { ctx.beginPath(); for (let x = 0; x <= W; x += 20) { const y = 130 + r * 34 + Math.sin(x / 110 + r) * 18; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y) } ctx.stroke() }
    for (let r = 0; r < 9; r++) { ctx.beginPath(); for (let x = 0; x <= W; x += 20) { const y = H - 150 - r * 34 + Math.sin(x / 110 + r) * 18; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y) } ctx.stroke() } }
  ctx.restore()
}
function paintBase(ctx: CanvasRenderingContext2D, f: ReelForm, acc: Account) {
  const light = lum(f.bg1) > .6
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, f.bg1); bg.addColorStop(1, f.bg2); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W / 2, 120, 0, W / 2, 120, 700); glow.addColorStop(0, f.accent + (light ? '22' : '33')); glow.addColorStop(1, 'transparent'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, 900)
  paintDeco(ctx, f.deco, f.accent); ctx.direction = 'rtl'
  accountBadge(ctx, acc, { y: 150, R: 96, size: 46, align: 'center', accent: f.accent, color: f.text, shadow: !light })
  if (f.ctaSub) { ctx.save(); ctx.globalAlpha = .9; ctx.font = '700 40px Cairo'; ctx.fillStyle = f.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; if (!light) { ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 10 } ctx.fillText(f.ctaSub, W / 2, 1810, 940); ctx.restore() }
  drawLogo(ctx, acc, 'right', 110, 40, H)
}
function makeTitle(f: ReelForm) {
  const c = document.createElement('canvas'); c.width = W; c.height = 440; const x = c.getContext('2d')!, fo = fontOf(f.font), light = lum(f.bg1) > .6
  richText(x, f.title || ' ', { family: cssFamily(f.font), weight: fo.weight, size: fo.kind === 'en' ? 110 : 100, maxW: 900, maxLines: 3, align: 'center', x: W / 2, y: 220, anchor: 'middle', accent: f.accent, fill: f.text, shadow: !light, glow: f.glow ? f.accent + 'cc' : undefined })
  return c
}
function paintTitle(ctx: CanvasRenderingContext2D, spr: HTMLCanvasElement, f: ReelForm, t: number) {
  const fx = f.titleFx; ctx.save()
  if (fx === 'fade') ctx.globalAlpha = ease(t / .7)
  else if (fx === 'slide') { const e = ease(t / .6); ctx.globalAlpha = e; ctx.translate(0, (1 - e) * 40) }
  else if (fx === 'pop') { const k = .4 + .6 * easeOutBack(t / .55); ctx.globalAlpha = Math.min(1, t / .2); ctx.translate(W / 2, 420); ctx.scale(k, k); ctx.translate(-W / 2, -420) }
  else if (fx === 'typewriter') { const p = ease(t / 1.4), rtl = isArabic(f.title); ctx.beginPath(); ctx.rect(rtl ? W / 2 + 470 - p * 940 : W / 2 - 470, 200, p * 940, 440); ctx.clip() }
  else if (fx === 'glitch' && t < .8) { const n = Math.floor(t * 28), a = 1 - t / .8
    ctx.globalAlpha = .35; ctx.drawImage(spr, -10 * a, 200); ctx.drawImage(spr, 10 * a, 200); ctx.globalAlpha = 1
    for (let s = 0; s < 8; s++) { const dx = (rnd(n * 7 + s) - .5) * 100 * a; ctx.drawImage(spr, 0, s * 55, W, 55, dx, 200 + s * 55, W, 55) }
    ctx.restore(); return }
  ctx.drawImage(spr, 0, 200); ctx.restore()
}
function paintBgFx(ctx: CanvasRenderingContext2D, f: ReelForm, t: number) {
  const k = f.bgFx; if (k === 'none') return
  ctx.save(); ctx.fillStyle = f.accent
  if (k === 'particles') for (let i = 0; i < 40; i++) { const y = H - ((t * (40 + rnd(i + 9) * 80) + rnd(i + 3) * H) % (H + 60)); ctx.globalAlpha = .15 + .4 * rnd(i + 7); ctx.beginPath(); ctx.arc(rnd(i) * W + Math.sin(t * .8 + i) * 30, y, 3 + rnd(i + 5) * 7, 0, 7); ctx.fill() }
  else if (k === 'rays') { ctx.globalAlpha = .08; ctx.translate(W / 2, 380); ctx.rotate(t * .12); for (let i = 0; i < 14; i++) { ctx.rotate(Math.PI * 2 / 14); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-140, -2200); ctx.lineTo(140, -2200); ctx.fill() } }
  else if (k === 'bokeh') for (let i = 0; i < 9; i++) { const x = W * (.1 + .8 * rnd(i)) + Math.sin(t * .4 + i) * 60, y = H * rnd(i + 4) + Math.cos(t * .3 + i) * 80, r = 90 + rnd(i + 8) * 160, g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, f.accent + '38'); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2) }
  else if (k === 'confetti') { const cols = [f.accent, '#ffffff', '#ff3b3b', '#3b82f6', '#22c55e']; for (let i = 0; i < 46; i++) { ctx.save(); ctx.translate(rnd(i) * W + Math.sin(t + i) * 40, ((t * (120 + rnd(i + 2) * 180) + rnd(i + 6) * H) % (H + 80)) - 40); ctx.rotate(t * 3 + i); ctx.fillStyle = cols[i % 5]; ctx.fillRect(-8, -4, 16, 8); ctx.restore() } }
  ctx.restore()
}
const sqPath = (ctx: CanvasRenderingContext2D, g: Geo, r: number) => { ctx.beginPath(); ctx.roundRect(g.X, g.Y, g.S, g.S, r) }
function paintShadow(ctx: CanvasRenderingContext2D, f: ReelForm) {
  const g = geo(f)
  ctx.save(); ctx.shadowColor = f.glow ? f.accent : 'rgba(0,0,0,.6)'; ctx.shadowBlur = f.glow ? 60 : 40; ctx.shadowOffsetY = f.glow ? 0 : 14; ctx.fillStyle = '#000'; sqPath(ctx, g, f.radius); ctx.fill(); ctx.restore()
}
function paintVideo(ctx: CanvasRenderingContext2D, f: ReelForm, src: Src | null, glowT = -1) {
  const { S, X, Y } = geo(f), g = { S, X, Y }
  ctx.save(); sqPath(ctx, g, f.radius); ctx.clip(); ctx.fillStyle = '#000'; ctx.fillRect(X, Y, S, S)
  if (src) drawSrc(ctx, src, X, Y, S, S, f.fit)
  else { ctx.fillStyle = '#12182c'; ctx.fillRect(X, Y, S, S); ctx.fillStyle = '#8b93b5'; ctx.font = '700 48px Cairo'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎞 اختر فيديو من مكتبتك', W / 2, Y + S / 2) }
  ctx.restore(); ctx.save(); ctx.lineWidth = f.borderW + (glowT >= 0 ? 2 : 0); ctx.strokeStyle = f.accent; if (glowT >= 0) { ctx.shadowColor = f.accent; ctx.shadowBlur = 26 + 16 * Math.sin(glowT * 3) } sqPath(ctx, g, f.radius); ctx.stroke(); ctx.restore()
}
function paintTag(ctx: CanvasRenderingContext2D, f: ReelForm) {
  if (!f.tag) return
  ctx.save(); ctx.font = '800 42px Cairo'; ctx.direction = 'rtl'; const { S, X, Y } = geo(f), bw = ctx.measureText(f.tag).width + 64, bh = 70, x = X + S - 36 - bw, y = Y - bh / 2
  ctx.fillStyle = f.accent; ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 12); ctx.fill(); ctx.fillStyle = lum(f.accent) > .6 ? '#1b1500' : '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(f.tag, x + bw / 2, y + bh / 2 + 3); ctx.restore()
}
function ctaSprite(f: ReelForm) {
  const c = document.createElement('canvas'), x = c.getContext('2d')!; x.font = '800 52px Cairo'
  const bw = Math.min(940, x.measureText(f.cta).width + 120), bh = 120, pad = 60; c.width = bw + pad * 2; c.height = bh + pad * 2; x.translate(c.width / 2, c.height / 2)
  x.fillStyle = f.accent; x.shadowColor = f.accent + '88'; x.shadowBlur = 30; x.beginPath(); x.roundRect(-bw / 2, -bh / 2, bw, bh, 60); x.fill(); x.shadowColor = 'transparent'
  x.font = '800 52px Cairo'; x.fillStyle = lum(f.accent) > .6 ? '#1b1500' : '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = 'rtl'; x.fillText(f.cta, 0, 4, bw - 80); return c
}
// تخزين مؤقت للطبقات الثابتة (الخلفية والعنوان وزر الطلب): أسرع بكثير في التصدير الطويل
let cache: { sig: string; base: HTMLCanvasElement; title: HTMLCanvasElement; cta: HTMLCanvasElement | null } | null = null
function cached(f: ReelForm, acc: Account) {
  const sig = JSON.stringify([f.title, f.font, f.accent, f.bg1, f.bg2, f.text, f.radius, f.glow, f.deco, f.size, f.offY, f.cta, f.ctaSub, acc.pageName, acc.profileImg.length, acc.profileImg.slice(-24), acc.logoImg.length])
  if (cache?.sig === sig) return cache
  const base = document.createElement('canvas'); base.width = W; base.height = H; const bx = base.getContext('2d')!
  paintBase(bx, f, acc); paintShadow(bx, f)
  return (cache = { sig, base, title: makeTitle(f), cta: f.cta ? ctaSprite(f) : null })
}
export function drawReel(ctx: CanvasRenderingContext2D, f: ReelForm, acc: Account, src: Src | null, t: number) {
  ctx.direction = 'rtl'
  const c = cached(f, acc), g = geo(f), cy = g.Y + g.S / 2, D = .9, intro = f.vidFx !== 'none' && t < D
  if (intro) paintBase(ctx, f, acc); else ctx.drawImage(c.base, 0, 0)
  paintBgFx(ctx, f, t); paintTitle(ctx, c.title, f, t)
  ctx.save()
  if (intro) { const e = ease(t / D); let sx = 1, ty = 0, al = 1, sy = 1
    if (f.vidFx === 'zoom') sx = sy = .94 + .06 * e; else if (f.vidFx === 'slide') { ty = (1 - e) * 340; al = e } else if (f.vidFx === 'bounce') { sx = sy = .55 + .45 * easeOutBack(t / D); al = Math.min(1, t / .25) } else if (f.vidFx === 'flip') { sx = Math.max(.02, e); al = e }
    ctx.globalAlpha = al; ctx.translate(W / 2, cy + ty); ctx.scale(sx, sy); ctx.translate(-W / 2, -cy); paintShadow(ctx, f)
  } else if (f.loopFx === 'float') ctx.translate(0, Math.sin(t * 2.2) * 14)
  else if (f.loopFx === 'breath') { const k = 1 + .015 * Math.sin(t * 2.5); ctx.translate(W / 2, cy); ctx.scale(k, k); ctx.translate(-W / 2, -cy) }
  paintVideo(ctx, f, src, !intro && f.loopFx === 'glow' ? t : -1); paintTag(ctx, f); ctx.restore()
  if (c.cta) { const fx = f.ctaFx; let k = 1, ty = 0, rot = 0
    if (fx === 'pulse') k = 1 + .025 * Math.sin(t * 4.5); else if (fx === 'bounce') ty = -Math.abs(Math.sin(t * 5)) * 18; else if (fx === 'shake' && t % 2.4 < .5) rot = Math.sin(t * 50) * .035
    ctx.save(); ctx.translate(W / 2, 1700 + ty); ctx.rotate(rot); ctx.scale(k, k); ctx.drawImage(c.cta, -c.cta.width / 2, -c.cta.height / 2); ctx.restore() }
}
export function makeReelScene(f: ReelForm, acc: Account, video: HTMLVideoElement, file: File): Scene {
  const io = makeVideoIO(video, file, f.start, f.length, f.mute)
  return { duration: f.length,
    prepare: async () => { await ensureFonts(); await loadFont(f.font, f.title); await loadImgs([acc.profileImg, acc.logoImg]); await io.prepare() },
    draw: (ctx, t) => drawReel(ctx, f, acc, io.current(), t), play: io.play, seek: io.seek, audioCopy: io.audioCopy, audioLayers: io.audioLayers }
}
