import { lum } from '../../core/colors'
import { drawOverlay } from '../../core/fx'
import type { Account } from '../../core/types'
import { cssFamily, fontOf } from '../../core/fonts'
import { getImg, richText, accountBadge, drawLogo } from '../../core/media'
export type Tpl = 'news' | 'movie' | 'quote' | 'neon' | 'split' | 'banner' | 'poster' | 'bold'
export const SIZES = { cover: [1080, 1920, 'غلاف Reel (1080×1920)'], post34: [1080, 1440, 'منشور 3:4 (1080×1440)'], post45: [1080, 1350, 'منشور 4:5 (1080×1350)'] } as const
export type SizeKey = keyof typeof SIZES
export interface Thumb { preset: string; tpl: Tpl; size: SizeKey; img: string; tag: string; title: string; sub: string; accent: string; font: string; fx: string }
export interface Preset { id: string; label: string; tpl: Tpl; accent: string; font: string; fx: string; tag: string }
const P = (id: string, label: string, tpl: Tpl, accent: string, font: string, fx: string, tag: string): Preset => ({ id, label, tpl, accent, font, fx, tag })
export const PRESETS: Preset[] = [
  P('news-red', '📰 خبر عاجل', 'news', '#ffd166', 'cairo', 'vignette', 'عاجل'), P('news-blue', '📰 أخبار زرقاء', 'split', '#38bdf8', 'noto-kufi-arabic', 'none', 'أخبار'),
  P('movie-gold', '🎬 فيلم ذهبي', 'movie', '#e9c46a', 'amiri', 'grain', 'مشهد من فيلم'), P('movie-noir', '🎞 فيلم أبيض وأسود', 'movie', '#ffffff', 'noto-naskh-arabic', 'grain', 'كلاسيكيات'),
  P('quote-gold', '❝ اقتباس ذهبي', 'quote', '#ffd166', 'amiri', 'vignette', 'اقتباس'), P('quote-modern', '❝ اقتباس عصري', 'quote', '#ff6b6b', 'tajawal', 'none', 'حكمة'),
  P('neon-cyan', '💠 نيون سماوي', 'neon', '#00e5ff', 'changa', 'glow', 'جديد'), P('neon-pink', '💗 نيون وردي', 'neon', '#ff2d95', 'changa', 'glow', 'ترند'),
  P('split-red', '◧ تقرير أحمر', 'split', '#ff6b6b', 'cairo', 'none', 'تقرير'), P('banner-yellow', '▬ شريط أصفر', 'banner', '#ffd166', 'lalezar', 'none', 'جديد'),
  P('banner-red', '▬ شريط أحمر', 'banner', '#ff3b3b', 'baloo-bhaijaan-2', 'none', 'هام'), P('poster-royal', '🖼 ملصق ملكي', 'poster', '#d4af37', 'el-messiri', 'vignette', 'حصرياً'),
  P('poster-sport', '⚽ ملصق رياضي', 'poster', '#a3ff12', 'baloo-bhaijaan-2', 'leak', 'رياضة'), P('bold-impact', '🔠 عنوان ضخم', 'bold', '#ffe600', 'lalezar', 'vignette', 'لا تفوّت'),
  P('bold-red', '🔠 ضخم أحمر', 'bold', '#ff3b3b', 'changa', 'grain', 'ترند'), P('bold-clean', '🔠 ضخم نظيف', 'bold', '#ffffff', 'tajawal', 'none', ''),
  P('duo-teal', '🎨 لونان أخضر', 'banner', '#14b8a6', 'almarai', 'duotone', 'مميز'), P('sunset', '🌅 غروب', 'poster', '#ff8a5b', 'aref-ruqaa', 'leak', ''),
  P('tech', '💻 تقني', 'neon', '#38bdf8', 'ibm-plex-sans-arabic', 'glow', 'تقنية'), P('ramadan', '🌙 رمضان', 'poster', '#fbbf24', 'aref-ruqaa', 'glow', 'رمضان كريم'),
  P('eid', '🎉 عيد', 'banner', '#f472b6', 'lalezar', 'leak', 'عيد مبارك'), P('duo-purple', '🎨 لونان بنفسجي', 'bold', '#a855f7', 'changa', 'duotone', 'جديد'),
]
export const SIZE_KEYS = Object.keys(SIZES) as SizeKey[]

function cover(ctx: CanvasRenderingContext2D, src: string, x: number, y: number, w: number, h: number) {
  const im = getImg(src); ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  if (im) { const s = Math.max(w / im.width, h / im.height); ctx.drawImage(im, x + (w - im.width * s) / 2, y + (h - im.height * s) / 2, im.width * s, im.height * s) }
  ctx.restore()
}
const grad = (ctx: CanvasRenderingContext2D, y0: number, y1: number, c0: string, c1: string, from = y0, to = y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(0, from, ctx.canvas.width, to - from) }

export function drawThumb(ctx: CanvasRenderingContext2D, t: Thumb, acc: Account) {
  const [W, H] = SIZES[t.size], isCover = t.size === 'cover', fo = fontOf(t.font), fam = cssFamily(t.font), right = W - 70
  ctx.canvas.width = W; ctx.canvas.height = H; ctx.direction = 'rtl'; ctx.fillStyle = '#0b0f1a'; ctx.fillRect(0, 0, W, H)
  const tpl = t.tpl, movie = tpl === 'movie', centered = movie || tpl === 'quote' || tpl === 'neon' || tpl === 'poster'
  const bar = movie ? (isCover ? 240 : 90) : 0, panel = tpl === 'split' ? Math.round(H * .4) : 0
  const bandTop = Math.round(H * .6), bandH = Math.round(H * .26)
  cover(ctx, t.img, 0, 0, W, H - panel)
  if (t.fx === 'duotone') drawOverlay(ctx, 'duotone', W, H - panel, t.accent)
  if (movie) { const r = ctx.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .75); r.addColorStop(0, 'rgba(10,25,35,.1)'); r.addColorStop(1, 'rgba(0,0,0,.65)'); ctx.fillStyle = r; ctx.fillRect(0, 0, W, H) }
  if (tpl === 'news' || movie || tpl === 'banner') grad(ctx, H * .35, H, 'rgba(0,0,0,0)', 'rgba(0,0,0,.9)')
  if (tpl === 'bold') grad(ctx, H * .25, H, 'rgba(0,0,0,0)', 'rgba(0,0,0,.95)')
  if (tpl === 'poster') { ctx.fillStyle = 'rgba(5,8,20,.45)'; ctx.fillRect(0, 0, W, H); drawOverlay(ctx, 'vignette', W, H, t.accent) }
  if (tpl === 'quote') { ctx.fillStyle = 'rgba(5,8,20,.64)'; ctx.fillRect(0, 0, W, H) }
  if (tpl === 'neon') grad(ctx, 0, H, 'rgba(40,0,90,.45)', 'rgba(0,0,0,.92)')
  if (tpl === 'split') { ctx.fillStyle = '#0d1224'; ctx.fillRect(0, H - panel, W, panel); ctx.fillStyle = t.accent; ctx.fillRect(0, H - panel - 6, W, 12) }
  if (tpl === 'banner') { ctx.fillStyle = t.accent; ctx.fillRect(0, bandTop, W, bandH); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, bandTop + bandH, W, 8) }
  grad(ctx, 0, H * .22, 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)', 0, H * .22)
  if (t.fx !== 'none' && t.fx !== 'duotone') drawOverlay(ctx, t.fx, W, H, t.accent)
  if (bar) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar) }
  if (tpl === 'neon' || tpl === 'poster') { ctx.save(); ctx.strokeStyle = t.accent; ctx.lineWidth = tpl === 'neon' ? 6 : 5; if (tpl === 'neon') { ctx.shadowColor = t.accent; ctx.shadowBlur = 40 } ctx.beginPath(); ctx.roundRect(36, 36, W - 72, H - 72, tpl === 'neon' ? 36 : 6); ctx.stroke(); if (tpl === 'poster') { ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(54, 54, W - 108, H - 108, 2); ctx.stroke() } ctx.restore() }
  const inset = tpl === 'neon' || tpl === 'poster' ? 20 : 0
  accountBadge(ctx, acc, { y: bar + (isCover ? 50 : 60) + 38 + inset, R: 76, size: 36, align: 'right', right: W - 70 - inset, accent: t.accent })

  const body = { family: fam, weight: fo.weight, accent: t.accent }, onBand = lum(t.accent) > .55 ? '#111111' : '#ffffff'
  let top: number
  if (tpl === 'quote') {
    ctx.save(); ctx.font = '900 340px Cairo'; ctx.fillStyle = t.accent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = .9; ctx.fillText('❝', W / 2, H * .3); ctx.restore()
    const r = richText(ctx, t.title, { ...body, size: 92, maxW: 900, maxLines: 6, align: 'center', x: W / 2, y: H * .55, anchor: 'middle' }); top = r.top
    ctx.fillStyle = t.accent; ctx.fillRect(W / 2 - 60, r.bottom + 40, 120, 8)
    if (t.sub) { ctx.save(); ctx.font = '700 44px Cairo'; ctx.fillStyle = '#eef1ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 14; ctx.fillText(t.sub, W / 2, r.bottom + 100, 900); ctx.restore() }
  } else if (tpl === 'split') {
    const r = richText(ctx, t.title, { ...body, size: 84, maxW: 940, maxLines: 4, align: 'right', x: right, y: H - panel / 2 - (t.sub ? 30 : 0), anchor: 'middle', shadow: false })
    if (t.sub) { ctx.save(); ctx.font = '700 40px Cairo'; ctx.fillStyle = t.accent; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(t.sub, right, r.bottom + 44, 940); ctx.restore() }
    top = H - panel - 6 - 20
  } else if (tpl === 'banner') {
    richText(ctx, t.title, { ...body, size: fo.kind === 'en' ? 96 : 90, maxW: 940, maxLines: 3, align: 'right', x: right, y: bandTop + bandH / 2, anchor: 'middle', fill: onBand, accent: lum(t.accent) > .55 ? '#7f1d1d' : '#111111', shadow: false })
    if (t.sub) { ctx.save(); ctx.font = '700 42px Cairo'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 14; ctx.fillText(t.sub, right, bandTop + bandH + 64, 940); ctx.restore() }
    top = bandTop
  } else if (tpl === 'poster') {
    const r = richText(ctx, t.title, { ...body, size: 100, maxW: 880, maxLines: 4, align: 'center', x: W / 2, y: H * .56, anchor: 'middle', glow: t.fx === 'glow' ? t.accent : undefined })
    ctx.fillStyle = t.accent; ctx.fillRect(W / 2 - 90, r.bottom + 36, 180, 6)
    if (t.sub) { ctx.save(); ctx.font = '700 44px Cairo'; ctx.fillStyle = t.accent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 14; ctx.fillText(t.sub, W / 2, r.bottom + 96, 880); ctx.restore() }
    top = H * .2 + 76
  } else {
    let y = H - bar - 80
    if (t.sub) { ctx.save(); ctx.font = '700 42px Cairo'; ctx.textBaseline = 'middle'; ctx.fillStyle = movie || tpl === 'neon' ? t.accent : '#eef1ff'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 14
      if (centered) { ctx.textAlign = 'center'; ctx.fillText(t.sub, W / 2, y - 20, 940) } else { ctx.textAlign = 'right'; ctx.fillText(t.sub, right - 26, y - 20, 900); ctx.fillStyle = t.accent; ctx.fillRect(right - 10, y - 44, 10, 50) }
      ctx.restore(); y -= 90 }
    const bold = tpl === 'bold', r = richText(ctx, t.title, { ...body, size: bold ? 132 : movie ? 108 : fo.kind === 'en' ? 104 : 96, maxW: 940, maxLines: bold ? 3 : 4, align: centered ? 'center' : 'right', x: centered ? W / 2 : right, y: bold ? y - 30 : y, anchor: 'bottom', glow: tpl === 'neon' ? t.accent : undefined })
    if (bold) { ctx.fillStyle = t.accent; ctx.fillRect(right - 260, y - 14, 260, 14) }
    top = r.top
  }
  if (t.tag) { ctx.font = '800 46px Cairo'; const bw = ctx.measureText(t.tag).width + 70, bh = 76
    const by = tpl === 'quote' ? H * .12 : tpl === 'split' ? H - panel - 6 - bh - 24 : tpl === 'poster' ? H * .2 : tpl === 'banner' ? bandTop - bh - 22 : top - 36 - bh, bx = centered ? (W - bw) / 2 : right - bw
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    if (movie || tpl === 'neon') { ctx.strokeStyle = t.accent; ctx.lineWidth = 3; if (tpl === 'neon') { ctx.shadowColor = t.accent; ctx.shadowBlur = 24 } ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.stroke(); ctx.fillStyle = t.accent }
    else { ctx.fillStyle = tpl === 'news' ? '#e11d2e' : t.accent; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10); ctx.fill(); ctx.fillStyle = tpl === 'news' ? '#fff' : onBand }
    ctx.fillText(t.tag, bx + bw / 2, by + bh / 2 + 3); ctx.restore() }
  drawLogo(ctx, acc, 'left', 120, 50, H - bar)
}
