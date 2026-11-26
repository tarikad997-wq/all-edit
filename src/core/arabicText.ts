import type { Cap, Word } from './captions'
import { isArabic, textWords } from './captions'
export interface TextOpts { dialect: boolean; digits: 'western' | 'arabic'; diacritics: 'remove' | 'keep'; glossary: string }
export const defaultTextOpts: TextOpts = { dialect: false, digits: 'western', diacritics: 'remove', glossary: '' }
const TASHKEEL = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g, TATWEEL = /\u0640/g
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩', EN_DIGITS = '0123456789'
const WORD_CH = '\\u0600-\\u06FFA-Za-z0-9'
// توحيد تهجئات الدارجة المغربية الشائعة (يُطبَّق بعد إزالة التشكيل). القاموس الشخصي يتفوق على هذا.
const DARIJA: Record<string, string> = { دبا: 'دابا', دابا: 'دابا', شنوا: 'شنو', شنو: 'شنو', واخّا: 'واخا', واخا: 'واخا', دغيا: 'دغيا', دغية: 'دغيا', ياكا: 'ياك', كيفاش: 'كيفاش', كيفاش_: 'كيفاش',
  بزاف: 'بزاف', بزاااف: 'بزاف', ديالي: 'ديالي', ديالك: 'ديالك', ديالو: 'ديالو', ديالها: 'ديالها', ديالنا: 'ديالنا', ديالهم: 'ديالهم', مزيان: 'مزيان', مزيانة: 'مزيانة', علاش: 'علاش', علاه: 'علاش', فاش: 'فاش', فين: 'فين', منين: 'منين', غادي: 'غادي', غدي: 'غادي', بغيت: 'بغيت', كاين: 'كاين', كاينة: 'كاينة', هاكا: 'هكا', هكاك: 'هكا' }
// عبارات تُولَّد خطأً من Whisper عند الصمت أو الموسيقى (معروفة بالعربية)
const HALLU = ['ترجمة نانسي قنقر', 'ترجمه نانسي قنقر', 'اشترك في القناة', 'اشتركوا في القناة', 'اشترك بالقناة', 'اشتركوا بالقناة', 'amara.org', 'subtitles by', 'transcribed by']
const strip = (s: string) => s.replace(TASHKEEL, '').replace(TATWEEL, '').replace(/[^\u0600-\u06FFA-Za-z0-9 ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

function parseGlossary(g: string): [string, string][] {
  return g.split(/\r?\n/).map(l => l.split(/\s*(?:=>|->|→|=|:)\s*/)).filter(p => p.length >= 2 && p[0].trim()).map(p => [p[0].trim(), p.slice(1).join(' ').trim()] as [string, string])
}
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const wholeWord = (s: string) => new RegExp(`(?<![${WORD_CH}])${esc(s)}(?![${WORD_CH}])`, 'g')

export function normToken(w: string, o: TextOpts): string {
  let t = w.replace(TATWEEL, '')
  if (o.diacritics === 'remove') t = t.replace(TASHKEEL, '')
  t = t.replace(/(.)\1{2,}/g, '$1')                       // إطالة الحروف: بزااااف → بزاف
  t = o.digits === 'western' ? t.replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d))) : t.replace(/[0-9]/g, d => AR_DIGITS[EN_DIGITS.indexOf(d)])
  if (isArabic(t)) t = t.replace(/,/g, '،').replace(/\?/g, '؟').replace(/;/g, '؛')   // علامات الترقيم العربية
  if (o.dialect) { const m = /^([^\u0600-\u06FF]*)([\u0600-\u06FF]+)([^\u0600-\u06FF]*)$/.exec(t); if (m && DARIJA[m[2]]) t = m[1] + DARIJA[m[2]] + m[3] }
  return t
}
export function postProcess(caps: Cap[], o: TextOpts): Cap[] {
  const gl = parseGlossary(o.glossary), single = new Map(gl.filter(([a]) => !/\s/.test(a)).map(([a, b]) => [a, b])), multi = gl.filter(([a]) => /\s/.test(a))
  const out: Cap[] = []
  for (const c of caps) {
    const hall = strip(c.text); if (HALLU.some(h => hall.includes(h))) continue
    let words: Word[] | undefined = c.words?.map(w => ({ ...w, w: single.get(w.w) ?? single.get(normToken(w.w, o)) ?? normToken(w.w, o) })).filter(w => w.w.trim())
    let text = words ? words.map(w => w.w).join(' ') : c.text.split(/\s+/).map(w => single.get(w) ?? single.get(normToken(w, o)) ?? normToken(w, o)).join(' ')
    for (const [a, b] of multi) { const t2 = text.replace(wholeWord(a), b); if (t2 !== text) { text = t2; words = undefined } }
    text = text.replace(/\s+([،؛؟.!?,;:])/g, '$1').trim(); if (!text) continue
    out.push({ ...c, text, words })
  }
  return out
}
/** يعيد توزيع زمن كلمات سطر عُدّل نصه يدوياً */
export const rebuildWords = (c: Cap): Word[] => textWords(c.text, c.s, c.e)
