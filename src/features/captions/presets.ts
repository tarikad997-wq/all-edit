import type { CapStyle } from './scene'
export type CapPreset = { id: string; label: string; sub: string; patch: Partial<CapStyle> }
const P = (id: string, label: string, sub: string, patch: Partial<CapStyle>): CapPreset => ({ id, label, sub, patch })
export const CAP_PRESETS: CapPreset[] = [
  P('classic', 'أبيض كلاسيكي', 'تلوين الكلمة بالذهبي', { font: 'cairo', size: 76, color: '#ffffff', hi: '#ffd166', outline: true, bg: false, anim: 'pop', wordFx: 'color', pos: 'bottom' }),
  P('hormozi', 'جريء أصفر (ترند)', 'الكلمات تظهر واحدة واحدة', { font: 'baloo-bhaijaan-2', size: 96, color: '#ffffff', hi: '#ffe600', outline: true, bg: false, anim: 'word', wordFx: 'color', pos: 'middle' }),
  P('box', 'مربع ملوّن', 'مربع خلف الكلمة الحالية', { font: 'tajawal', size: 82, color: '#ffffff', hi: '#ffd166', outline: false, bg: false, anim: 'fade', wordFx: 'box', pos: 'bottom' }),
  P('neon', 'نيون سماوي', 'وهج وتكبير للكلمة', { font: 'changa', size: 84, color: '#ffffff', hi: '#00e5ff', outline: true, bg: false, anim: 'pop', wordFx: 'scale', pos: 'bottom' }),
  P('pill', 'خلفية سوداء', 'مناسب لأي فيديو', { font: 'almarai', size: 66, color: '#ffffff', hi: '#ffd166', outline: false, bg: true, anim: 'slide', wordFx: 'color', pos: 'bottom' }),
  P('elegant', 'أنيق', 'خط نسخ هادئ', { font: 'amiri', size: 72, color: '#fff4dc', hi: '#e9c46a', outline: false, bg: false, anim: 'fade', wordFx: 'color', pos: 'bottom' }),
  P('red', 'أحمر قوي', 'للتنبيه والإثارة', { font: 'lalezar', size: 88, color: '#ffffff', hi: '#ff3b3b', outline: true, bg: false, anim: 'pop', wordFx: 'color', pos: 'bottom' }),
  P('minimal', 'بسيط', 'بدون تلوين', { font: 'almarai', size: 58, color: '#ffffff', hi: '#ffffff', outline: false, bg: false, anim: 'fade', wordFx: 'none', pos: 'bottom' }),
  P('gaming', 'ألعاب', 'أخضر ليموني', { font: 'changa', size: 88, color: '#ffffff', hi: '#a3ff12', outline: true, bg: false, anim: 'word', wordFx: 'scale', pos: 'bottom' }),
  P('candy', 'وردي حلو', 'خط مرح', { font: 'lemonada', size: 70, color: '#ffffff', hi: '#ff2d95', outline: true, bg: false, anim: 'pop', wordFx: 'underline', pos: 'bottom' }),
  P('news', 'شريط أخبار', 'خلفية وكلمة حمراء', { font: 'noto-kufi-arabic', size: 64, color: '#ffffff', hi: '#ff3b3b', outline: false, bg: true, anim: 'slide', wordFx: 'color', pos: 'bottom' }),
  P('impact', 'English Impact', 'للكلام الإنجليزي', { font: 'anton', size: 100, color: '#ffffff', hi: '#ffe600', outline: true, bg: false, anim: 'word', wordFx: 'color', pos: 'middle' }),
  P('bebas', 'Bebas نظيف', 'للكلام الإنجليزي', { font: 'bebas-neue', size: 110, color: '#ffffff', hi: '#00e5ff', outline: true, bg: false, anim: 'pop', wordFx: 'box', pos: 'bottom' }),
  P('hand', 'خط يد', 'Caveat للإنجليزية', { font: 'caveat', size: 96, color: '#ffffff', hi: '#fbbf24', outline: true, bg: false, anim: 'fade', wordFx: 'color', pos: 'bottom' }),
  P('ruqaa', 'رقعة عربية', 'خط تراثي', { font: 'aref-ruqaa', size: 86, color: '#ffffff', hi: '#fbbf24', outline: true, bg: false, anim: 'fade', wordFx: 'color', pos: 'bottom' }),
  P('top', 'عنوان علوي', 'في أعلى الفيديو', { font: 'cairo', size: 70, color: '#ffffff', hi: '#ffd166', outline: true, bg: true, anim: 'slide', wordFx: 'color', pos: 'top' }),
]
export const ANIM_OPTS: [string, string, string][] = [['pop', 'ظهور نابض', 'السطر يكبر قليلاً'], ['word', 'كلمة بكلمة', 'تظهر الكلمة عند نطقها'], ['slide', 'انزلاق', 'يصعد من الأسفل'], ['fade', 'تلاشٍ', 'ظهور ناعم'], ['none', 'بدون', 'فوري']]
export const WORDFX_OPTS: [string, string, string][] = [['color', 'تلوين الكلمة', 'بلون التمييز'], ['box', 'مربع خلف الكلمة', 'أسلوب الترند'], ['scale', 'تكبير الكلمة', 'مع تلوين'], ['underline', 'خط تحتها', 'تسطير ملوّن'], ['none', 'بدون', 'نص ثابت']]
