export interface PPPreset { id: string; label: string; look: 'classic' | 'bold' | 'neon'; font: string; accent: string }
const P = (id: string, label: string, look: PPPreset['look'], font: string, accent: string): PPPreset => ({ id, label, look, font, accent })
export const PP_PRESETS: PPPreset[] = [
  P('gold', '✨ كلاسيكي ذهبي', 'classic', 'cairo', '#ffd166'), P('yellow', '🔠 جريء أصفر', 'bold', 'lalezar', '#ffe600'), P('cyan', '💠 نيون سماوي', 'neon', 'changa', '#00e5ff'),
  P('pink', '💗 نيون وردي', 'neon', 'changa', '#ff2d95'), P('cinema', '🎬 سينمائي', 'classic', 'amiri', '#e9c46a'), P('royal', '👑 ملكي', 'classic', 'el-messiri', '#d4af37'),
  P('sport', '⚽ رياضي أخضر', 'bold', 'baloo-bhaijaan-2', '#a3ff12'), P('news', '📰 أخبار أحمر', 'bold', 'noto-kufi-arabic', '#ff3b3b'), P('ramadan', '🌙 رمضان', 'classic', 'aref-ruqaa', '#fbbf24'),
  P('blue', '💙 عصري أزرق', 'bold', 'tajawal', '#38bdf8'), P('drama', '🎭 دراما', 'neon', 'reem-kufi', '#ef4444'), P('rose', '🌸 أنيق وردي', 'classic', 'lemonada', '#f472b6'),
  P('mint', '🌿 نعناعي', 'bold', 'mada', '#10b981'), P('violet', '🔮 بنفسجي', 'neon', 'kufam', '#a855f7'),
]
export const TRANS_OPTS: [string, string, string][] = [['wipe', 'مسح مائل', 'مع خط ضوء'], ['fade', 'تلاشٍ', 'ظهور ناعم'], ['zoom', 'تقريب', 'يكبر ثم يستقر'], ['slide', 'انزلاق', 'من الجانب']]
export const LOOK_OPTS: [string, string, string][] = [['classic', 'كلاسيكي', 'خط ذهبي تحت الاسم'], ['bold', 'جريء', 'اسم ضخم وشريط ملوّن'], ['neon', 'نيون', 'توهج حول الحروف']]
