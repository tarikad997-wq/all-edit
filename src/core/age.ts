type D = { y: number; m: number; d: number; full: boolean }
export function parseDate(s: string): D | null {
  const f = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim()); if (f) return { y: +f[1], m: +f[2], d: +f[3], full: true }
  const y = /^\d{4}$/.exec(s.trim()); return y ? { y: +s, m: 1, d: 1, full: false } : null
}
export function calcAge(birth: string, death: string, now = new Date()): number | null {
  const b = parseDate(birth); if (!b) return null
  const e = death ? parseDate(death) : { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate(), full: true }
  if (!e) return null
  let age = e.y - b.y
  if (b.full && e.full && (e.m < b.m || (e.m === b.m && e.d < b.d))) age--
  return age < 0 ? null : age
}
export function ageWord(n: number) { return n === 1 ? 'سنة' : n === 2 ? 'سنتان' : n >= 3 && n <= 10 ? 'سنوات' : 'سنة' }
export const deathYear = (d: string) => parseDate(d)?.y ?? null
