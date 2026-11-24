import type { Account } from '../../core/types'
import type { Scene } from '../../core/exporter'
import { calcAge, ageWord, deathYear } from '../../core/age'
import { getImg, loadImgs, ease, shadowText, accountBadge, drawLogo, ensureFonts } from '../../core/media'
import { drawOverlay } from '../../core/fx'
import { cssFont, loadFont } from '../../core/fonts'
import type { Actor, Project } from './types'
interface Style { font: string; accent: string; look: string; overlay: string }
let TRANS_FX = 'wipe'
const styleOf = (p: Project): Style => ({ font: p.font ?? 'cairo', accent: p.accent ?? '#ffd166', look: p.look ?? 'classic', overlay: p.overlay ?? 'none' })
export const W = 1080, H = 1920, MID = H / 2, TRANS = 1.0, SLANT = 170
export const preload = (p: Project, acc: Account) => loadImgs([acc.profileImg, acc.logoImg, ...p.actors.flatMap(a => [a.oldImg, a.newImg])])
export const guessSecs = (p: Project) => p.guessMode ? (p.guessSecs ?? 3) : 0
export const actorDur = (p: Project, a: Actor) => a.duration + guessSecs(p)
export const totalDuration = (p: Project) => p.actors.reduce((s, a) => s + actorDur(p, a), 0)

function cover(ctx: CanvasRenderingContext2D, src: string, y: number, h: number, zoom: number, drift: number) {
  const img = getImg(src)
  if (img) { const s = Math.max(W / img.width, h / img.height) * zoom; const dw = img.width * s, dh = img.height * s; ctx.drawImage(img, (W - dw) / 2 + drift, y + (h - dh) / 2, dw, dh) }
  else { ctx.fillStyle = '#222a3d'; ctx.fillRect(0, y, W, h) }
}
// كشف بمسح مائل مع خط ضوء على الحافة؛ fromRight يحدد اتجاه المسح
function reveal(ctx: CanvasRenderingContext2D, src: string, y: number, h: number, e: number, fromRight: boolean, local: number, dur: number, dir: number, custom?: () => void) {
  if (e <= 0) return
  if (TRANS_FX !== 'wipe') {
    ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, h); ctx.clip(); const base = 1.04 + 0.08 * Math.min(1, local / dur); let z = base
    if (TRANS_FX === 'fade') { ctx.globalAlpha = e; z = base * (1 + .1 * (1 - e)) }
    else if (TRANS_FX === 'zoom') { ctx.globalAlpha = Math.min(1, e * 1.6); z = base * (1 + .5 * (1 - e)) }
    else if (TRANS_FX === 'slide') ctx.translate((fromRight ? 1 : -1) * W * (1 - e), 0)
    if (custom) custom(); else cover(ctx, src, y, h, z, dir * 30 * Math.min(1, local / dur))
    ctx.restore(); return
  }
  const xt = W + SLANT - e * (W + SLANT), X = (x: number) => fromRight ? x : W - x
  ctx.save(); ctx.beginPath()
  ctx.moveTo(X(xt), y); ctx.lineTo(X(W), y); ctx.lineTo(X(W), y + h); ctx.lineTo(X(xt - SLANT), y + h); ctx.closePath(); ctx.clip()
  const zoom = (1.04 + 0.08 * Math.min(1, local / dur)) * (1 + 0.22 * (1 - e))
  if (custom) custom(); else cover(ctx, src, y, h, zoom, dir * (1 - e) * 60 + dir * 30 * Math.min(1, local / dur))
  ctx.restore()
  if (e < 1) { ctx.save(); ctx.globalAlpha = 1 - e; ctx.lineWidth = 6; ctx.strokeStyle = '#fff3c4'; ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 30
    ctx.beginPath(); ctx.moveTo(X(xt), y); ctx.lineTo(X(xt - SLANT), y + h); ctx.stroke(); ctx.restore() }
}
function divider(ctx: CanvasRenderingContext2D, y: number, k: number, alpha: number, color = '#ffd166') {
  if (k <= 0) return
  const half = 150 * k; ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 10
  ctx.beginPath(); ctx.moveTo(W / 2 - half, y); ctx.lineTo(W / 2 - 18, y); ctx.moveTo(W / 2 + 18, y); ctx.lineTo(W / 2 + half, y); ctx.stroke()
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(W / 2, y - 9); ctx.lineTo(W / 2 + 9, y); ctx.lineTo(W / 2, y + 9); ctx.lineTo(W / 2 - 9, y); ctx.fill(); ctx.restore()
}
const tiny = document.createElement('canvas'); tiny.width = 18; tiny.height = 32
function mystery(ctx: CanvasRenderingContext2D, a: Actor, y: number, h: number, local: number, fade: number, accent: string) {
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#171b34'); g.addColorStop(1, '#2d2150'); ctx.fillStyle = g; ctx.fillRect(0, y, W, h)
  const im = getImg(a.newImg)
  if (im) { const tc = tiny.getContext('2d')!; tc.drawImage(im, 0, 0, tiny.width, tiny.height); ctx.save(); ctx.globalAlpha = .35; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(tiny, 0, y, W, h); ctx.restore() }
  ctx.fillStyle = 'rgba(8,10,25,.55)'; ctx.fillRect(0, y, W, h)
  ctx.save(); ctx.globalAlpha = .18 * fade; ctx.fillStyle = accent; ctx.font = '900 760px Cairo'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'
  ctx.translate(W / 2, y + h / 2 + 40); ctx.rotate(Math.sin(local * 2) * .04); ctx.fillText('؟', 0, 0); ctx.restore()
}
function drawActor(ctx: CanvasRenderingContext2D, a: Actor, local: number, textFade: number, textStart: number, guess = 0, dur = a.duration, st: Style = styleOf({ actors: [] })) {
  const h = H / 2, inGuess = local < guess, g = local - guess
  reveal(ctx, a.oldImg, 0, h, ease(local / 0.8), true, local, dur, 1)
  if (guess > 0 && inGuess) {
    reveal(ctx, a.newImg, MID, h, ease((local - 0.2) / 0.7), false, local, dur, -1, () => mystery(ctx, a, MID, h, local, 1, st.accent))
    const k = Math.min(1, Math.max(0, (local - 0.5) / 0.4)) * Math.min(1, (guess - local) / 0.15 + 0.0001)
    const r = guess - local, rem = Math.ceil(r - 1e-6), pop = 1 + .35 * Math.pow(r % 1 || 1, 3)
    shadowText(ctx, 'من هو؟', MID - 120, '900 110px Cairo', '#ffffff', 940, k, 0)
    divider(ctx, MID - 40, k, 1, st.accent)
    ctx.save(); ctx.translate(W / 2, MID + 120); ctx.scale(pop, pop); ctx.translate(-W / 2, -MID - 120)
    shadowText(ctx, String(Math.max(rem, 1)), MID + 120, '900 190px Cairo', st.accent, 400, k, 0); ctx.restore()
    return
  }
  const gl = guess > 0 ? g : local
  reveal(ctx, a.newImg, MID, h, ease((gl - (guess > 0 ? 0 : 0.2)) / 0.9), false, local, dur, -1)
  if (guess > 0 && g < 0.3) { ctx.save(); ctx.globalAlpha = (1 - g / 0.3) * .8; ctx.fillStyle = '#fff'; ctx.fillRect(0, MID, W, h); ctx.restore() }
  const e = ease((gl - textStart) / 0.7) * textFade, dy = (1 - e) * 36
  const gr = ctx.createLinearGradient(0, MID - 70, 0, MID + 40); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#ffe9a8')
  const bold = st.look === 'bold', neon = st.look === 'neon'
  shadowText(ctx, a.name, MID - 40, cssFont(st.font, bold ? 112 : 94), neon || bold ? '#ffffff' : gr, 940, e, dy, neon ? st.accent : undefined)
  if (bold) { ctx.save(); ctx.globalAlpha = textFade; ctx.fillStyle = st.accent; ctx.beginPath(); ctx.roundRect(W / 2 - 110 * e, MID + 30, 220 * e, 12, 6); ctx.fill(); ctx.restore() } else divider(ctx, MID + 28, e, textFade, st.accent)
  const age = calcAge(a.birth, a.death), dead = !!deathYear(a.death)
  if (age !== null) shadowText(ctx, dead ? `عن عمر ${age} ${ageWord(age)}` : `العمر: ${age} ${ageWord(age)}`, MID + 90, '700 50px Cairo', bold || neon ? st.accent : '#ffffff', 940, e, dy)
  if (dead) shadowText(ctx, `توفي في ${deathYear(a.death)}`, MID + (age !== null ? 154 : 90), '700 46px Cairo', '#ffb3b3', 940, e, dy)
}
function header(ctx: CanvasRenderingContext2D, acc: Account, accent: string) {
  const g = ctx.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 300)
  accountBadge(ctx, acc, { y: 150, R: 84, size: 42, align: 'center', accent })
}
export function drawFrame(ctx: CanvasRenderingContext2D, p: Project, acc: Account, t: number) {
  const st = styleOf(p); TRANS_FX = p.trans ?? 'wipe'
  ctx.fillStyle = '#0b0f1a'; ctx.fillRect(0, 0, W, H)
  const total = totalDuration(p)
  if (p.actors.length) {
    t = Math.min(Math.max(0, t), total - 0.001); let start = 0, i = 0
    for (; i < p.actors.length; i++) { if (t < start + actorDur(p, p.actors[i])) break; start += actorDur(p, p.actors[i]) }
    const a = p.actors[i], local = t - start
    if (i > 0 && local < TRANS) { const pr = p.actors[i - 1]; drawActor(ctx, pr, actorDur(p, pr) + local, 1 - ease(local / 0.35), 0, guessSecs(p), actorDur(p, pr), st) }
    drawActor(ctx, a, local, 1, guessSecs(p) ? 0.3 : i > 0 ? 0.55 : 0.35, guessSecs(p), actorDur(p, a), st)
  } else { ctx.fillStyle = '#8b93b5'; ctx.font = '700 54px Cairo'; ctx.textAlign = 'center'; ctx.direction = 'rtl'; ctx.fillText('أضف ممثلين لبدء المعاينة', W / 2, H / 2) }
  drawOverlay(ctx, st.overlay, W, H, st.accent, t)
  header(ctx, acc, st.accent)
  drawLogo(ctx, acc, 'right', 150, 40, H)
}

export function makeScene(p: Project, acc: Account, music: { buf: ArrayBuffer; vol: number } | null): Scene {
  const duration = totalDuration(p)
  return { duration, prepare: async () => { await ensureFonts(); await loadFont(p.font, p.actors.map(a => a.name).join(' ')); await preload(p, acc) }, draw: (ctx, t) => drawFrame(ctx, p, acc, t),
    audioLayers: music ? async () => [{ buf: music.buf, vol: music.vol, loop: true, fadeOut: true }] : undefined }
}
