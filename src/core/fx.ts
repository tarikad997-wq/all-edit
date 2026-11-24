export type Overlay = 'none' | 'vignette' | 'grain' | 'leak' | 'duotone' | 'glow'
export const OVERLAYS: { id: Overlay; label: string; sub: string }[] = [
  { id: 'none', label: 'بدون', sub: 'صورة نقية' }, { id: 'vignette', label: 'تعتيم الأطراف', sub: 'يركّز النظر على الوسط' }, { id: 'grain', label: 'حبيبات فيلم', sub: 'مظهر سينمائي' },
  { id: 'leak', label: 'تسرّب ضوء', sub: 'وهج دافئ على الحواف' }, { id: 'duotone', label: 'لونان (Duotone)', sub: 'يصبغ الصورة بلون التمييز' }, { id: 'glow', label: 'توهج ناعم', sub: 'إشراق حول المناطق الساطعة' }]
let tile: HTMLCanvasElement | null = null
const grainTile = () => { if (tile) return tile; const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d')!, d = x.createImageData(256, 256)
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 40 } x.putImageData(d, 0, 0); return (tile = c) }
/** تأثيرات فوق الصورة. 'duotone' يُطبَّق مباشرة بعد رسم الصورة، والبقية قبل النصوص */
export function drawOverlay(ctx: CanvasRenderingContext2D, kind: Overlay | string, w: number, h: number, accent: string, t = 0, y = 0) {
  if (kind === 'none') return
  ctx.save(); ctx.beginPath(); ctx.rect(0, y, w, h); ctx.clip()
  if (kind === 'vignette') { const g = ctx.createRadialGradient(w / 2, y + h / 2, Math.min(w, h) * .35, w / 2, y + h / 2, Math.max(w, h) * .72); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.62)'); ctx.fillStyle = g; ctx.fillRect(0, y, w, h) }
  else if (kind === 'grain') { const ox = Math.floor(t * 37) % 256, oy = Math.floor(t * 53) % 256; ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat')!; ctx.fillRect(ox, oy + y, w, h) }
  else if (kind === 'leak') { ctx.globalCompositeOperation = 'screen'
    const a = ctx.createRadialGradient(0, y + h * .15, 0, 0, y + h * .15, h * .55); a.addColorStop(0, accent + 'aa'); a.addColorStop(1, 'transparent'); ctx.fillStyle = a; ctx.fillRect(0, y, w, h)
    const b = ctx.createRadialGradient(w, y + h * .85, 0, w, y + h * .85, h * .5); b.addColorStop(0, '#ff8a3daa'); b.addColorStop(1, 'transparent'); ctx.fillStyle = b; ctx.fillRect(0, y, w, h) }
  else if (kind === 'duotone') { ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(0, y, w, h); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = accent; ctx.globalAlpha = .85; ctx.fillRect(0, y, w, h) }
  else if (kind === 'glow' && 'filter' in ctx) { ctx.filter = 'blur(28px)'; ctx.globalAlpha = .45; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(ctx.canvas, 0, y, w, h, 0, y, w, h) }
  ctx.restore()
}
