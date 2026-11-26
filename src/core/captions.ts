import { uid } from './types'
export interface Word { w: string; s: number; e: number }
export interface Cap { id: string; s: number; e: number; text: string; words?: Word[] }
export const isArabic = (t: string) => /[\u0600-\u06FF]/.test(t)
// توزيع زمن السطر على كلماته بحسب عدد أحرف كل كلمة
export function textWords(text: string, s: number, e: number): Word[] {
  const ws = text.trim().split(/\s+/).filter(Boolean), total = ws.reduce((a, w) => a + w.length + 1, 0) || 1; let t = s
  return ws.map(w => { const d = (e - s) * (w.length + 1) / total, r = { w, s: t, e: t + d }; t += d; return r })
}
export const wordsOf = (c: Cap) => (c.words?.length ? c.words : textWords(c.text, c.s, c.e))
export function groupWords(words: Word[], o0?: { maxChars: number; maxWords: number; gap: number }): Cap[] {
  const arabic = words.filter(w => isArabic(w.w)).length > words.length / 2
  const o = o0 ?? (arabic ? { maxChars: 26, maxWords: 6, gap: 0.6 } : { maxChars: 32, maxWords: 7, gap: 0.6 })
  const out: Cap[] = []; let cur: Word[] = [], chars = 0
  const flush = () => { if (!cur.length) return; out.push({ id: uid(), s: cur[0].s, e: cur[cur.length - 1].e, text: cur.map(w => w.w).join(' '), words: cur }); cur = []; chars = 0 }
  for (const w of words) {
    const prev = cur[cur.length - 1]
    if (prev && (chars + w.w.length + 1 > o.maxChars || cur.length >= o.maxWords || w.s - prev.e > o.gap || /[.!?؟…]$/.test(prev.w))) flush()
    cur.push(w); chars += w.w.length + 1
  }
  flush()
  // لا تترك كلمة قصيرة وحدها في سطر: ادمجها مع السابق إن اتسع
  for (let i = out.length - 1; i > 0; i--) { const a = out[i - 1], b = out[i]; if ((b.words?.length ?? 0) === 1 && b.text.length <= 4 && a.text.length + 1 + b.text.length <= o.maxChars + 6 && b.s - a.e < o.gap) { a.text += ' ' + b.text; a.words = [...(a.words ?? []), ...(b.words ?? [])]; a.e = b.e; out.splice(i, 1) } }
  // أطِل ظهور كل سطر قليلاً حتى بداية التالي لتقليل الوميض
  out.forEach((c, i) => { const next = out[i + 1]; c.e = Math.max(c.e, Math.min(next ? next.s : c.e + .35, c.e + .35)) })
  return out
}
export interface Chunk { text: string; timestamp: [number, number | null] }
export function fromChunks(chunks: Chunk[], wordLevel: boolean): Cap[] {
  const words: Word[] = []
  for (const c of chunks) {
    const s = c.timestamp[0] ?? 0, text = c.text.trim(); if (!text) continue
    const e = c.timestamp[1] != null && c.timestamp[1] > s ? c.timestamp[1] : s + (wordLevel ? .3 : 3)
    if (wordLevel) words.push({ w: text, s, e }); else words.push(...textWords(text, s, e))
  }
  return groupWords(words)
}
const pad = (n: number, l = 2) => String(Math.floor(n)).padStart(l, '0')
const tc = (t: number) => `${pad(t / 3600)}:${pad(t % 3600 / 60)}:${pad(t % 60)},${pad((t % 1) * 1000, 3)}`
export const toSrt = (caps: Cap[]) => caps.map((c, i) => `${i + 1}\n${tc(c.s)} --> ${tc(c.e)}\n${c.text}\n`).join('\n')
const sec = (s: string) => { const m = /(\d+):(\d+):(\d+)[,.](\d+)/.exec(s.trim()); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4].padEnd(3, '0').slice(0, 3) / 1000 : NaN }
export function parseSrt(text: string): Cap[] {
  return text.replace(/\r/g, '').trim().split(/\n\s*\n/).flatMap(b => {
    const l = b.split('\n'), i = l.findIndex(x => x.includes('-->')); if (i < 0) return []
    const [a, z] = l[i].split('-->'), s = sec(a), e = sec(z), t = l.slice(i + 1).join(' ').replace(/<[^>]+>/g, '').trim()
    return t && !isNaN(s) && !isNaN(e) ? [{ id: uid(), s, e, text: t }] : []
  })
}
