export type Deco = 'none' | 'dots' | 'grid' | 'stripes' | 'rays' | 'waves'
export interface Theme { font: string; accent: string; bg1: string; bg2: string; text: string; radius: number; borderW: number; glow: boolean; tag: string; deco: Deco }
const T = (label: string, font: string, accent: string, bg1: string, bg2: string, text: string, radius: number, borderW: number, glow: boolean, tag: string, deco: Deco): { label: string; theme: Theme } => ({ label, theme: { font, accent, bg1, bg2, text, radius, borderW, glow, tag, deco } })
const ROWS: [string, { label: string; theme: Theme }][] = [
  ['classic', T('✨ كلاسيكي', 'lalezar', '#ffd166', '#0b0f1a', '#1b1a3a', '#ffffff', 40, 6, false, '', 'none')],
  ['cinema', T('🎬 سينمائي', 'amiri', '#e9c46a', '#050505', '#1c130a', '#fff4dc', 6, 3, false, 'مشهد من فيلم', 'none')],
  ['neon', T('💜 نيون', 'changa', '#00e5ff', '#0a0420', '#1a0050', '#ffffff', 48, 6, true, '', 'grid')],
  ['news', T('📰 أخبار', 'noto-kufi-arabic', '#ff3b3b', '#08101f', '#14284a', '#ffffff', 14, 5, false, 'عاجل', 'stripes')],
  ['light', T('☀️ فاتح', 'almarai', '#d97706', '#f6f2ea', '#e2d9c8', '#1b1b1b', 36, 5, false, '', 'none')],
  ['sport', T('⚽ رياضة', 'baloo-bhaijaan-2', '#a3ff12', '#06140b', '#0e3a1c', '#ffffff', 24, 7, true, 'رياضة', 'stripes')],
  ['royal', T('👑 ملكي', 'el-messiri', '#d4af37', '#0d0221', '#2b0a4d', '#fff7e0', 28, 5, false, '', 'dots')],
  ['ocean', T('🌊 محيط', 'tajawal', '#22d3ee', '#03123a', '#0c4a6e', '#ffffff', 36, 5, true, '', 'waves')],
  ['sunset', T('🌅 غروب', 'aref-ruqaa', '#ffb703', '#2b1055', '#d4561e', '#fff7ed', 34, 5, false, '', 'rays')],
  ['forest', T('🌲 غابة', 'almarai', '#a3e635', '#052e16', '#14532d', '#ecfccb', 30, 5, false, '', 'dots')],
  ['candy', T('🍬 حلوى', 'lemonada', '#ff2d95', '#ffe4f1', '#ffc2e0', '#4a0d2f', 44, 6, false, '', 'dots')],
  ['mono', T('⚫ أسود فاخر', 'vazirmatn', '#ffffff', '#000000', '#141414', '#ffffff', 18, 3, false, '', 'none')],
  ['drama', T('🎭 دراما', 'reem-kufi', '#ef4444', '#120305', '#3b0a10', '#ffffff', 12, 5, true, 'دراما', 'rays')],
  ['tech', T('💻 تقني', 'ibm-plex-sans-arabic', '#38bdf8', '#020617', '#0f172a', '#e2e8f0', 16, 4, true, 'تقنية', 'grid')],
  ['ramadan', T('🌙 رمضان', 'aref-ruqaa', '#fbbf24', '#0b1d3a', '#1e3a5f', '#fff7d6', 36, 5, true, 'رمضان كريم', 'dots')],
  ['eid', T('🎉 عيد', 'lalezar', '#f472b6', '#312e81', '#be185d', '#ffffff', 40, 6, false, 'عيد مبارك', 'rays')],
  ['gaming', T('🎮 ألعاب', 'changa', '#a855f7', '#0a0a1f', '#1e1b4b', '#ffffff', 20, 6, true, 'Gaming', 'grid')],
  ['food', T('🍳 طبخ', 'tajawal', '#fb923c', '#fff7ed', '#fed7aa', '#431407', 40, 6, false, 'وصفة', 'dots')],
  ['travel', T('✈️ سفر', 'alexandria', '#0ea5e9', '#e0f2fe', '#7dd3fc', '#082f49', 40, 5, false, 'رحلة', 'waves')],
  ['edu', T('📚 تعليمي', 'kufam', '#facc15', '#172554', '#1e3a8a', '#ffffff', 30, 5, false, 'تعلّم', 'grid')],
  ['desert', T('🏜 صحراء', 'amiri', '#92400e', '#fde68a', '#f59e0b', '#451a03', 30, 5, false, '', 'rays')],
  ['snow', T('❄️ ثلج', 'readex-pro', '#60a5fa', '#f8fafc', '#dbeafe', '#0f172a', 34, 4, false, '', 'dots')],
  ['luxury', T('💎 فخم', 'noto-naskh-arabic', '#c0c0c0', '#0a0a0a', '#262626', '#f5f5f5', 10, 3, true, '', 'none')],
  ['retro', T('📼 ريترو', 'rakkas', '#f97316', '#2b1b17', '#7c2d12', '#ffedd5', 20, 6, false, '', 'stripes')],
  ['fire', T('🔥 نار', 'changa', '#ff6b00', '#1a0500', '#7f1d1d', '#ffffff', 20, 6, true, 'ترند', 'rays')],
  ['mint', T('🌿 نعناع', 'mada', '#10b981', '#ecfdf5', '#a7f3d0', '#064e3b', 40, 5, false, '', 'dots')],
  ['comic', T('💥 كوميك', 'baloo-bhaijaan-2', '#facc15', '#dc2626', '#7f1d1d', '#ffffff', 8, 8, false, 'واااو', 'stripes')],
  ['midnight', T('🌌 منتصف الليل', 'tajawal', '#818cf8', '#020617', '#1e1b4b', '#e0e7ff', 40, 4, true, '', 'dots')],
]
export const REEL_TEMPLATES = ROWS.map(([id, v]) => ({ id, ...v }))
type FxList = [string, string, string][]
export const TITLE_FX: FxList = [['slide', 'انزلاق', 'يدخل من الأسفل'], ['pop', 'ظهور نابض', 'يكبر بارتداد'], ['fade', 'تلاشٍ', 'ظهور هادئ'], ['typewriter', 'آلة كاتبة', 'يُكتب تدريجياً'], ['glitch', 'تشويش رقمي', 'وميض وانزياح'], ['none', 'بدون', 'ثابت']]
export const VID_FX: FxList = [['zoom', 'تقريب ناعم', 'يكبر قليلاً'], ['slide', 'صعود من الأسفل', 'مع تلاشٍ'], ['bounce', 'ارتداد', 'يقفز ثم يستقر'], ['flip', 'انقلاب', 'يفتح من الوسط'], ['none', 'بدون', 'ثابت']]
export const LOOP_FX: FxList = [['none', 'ثابت', ''], ['float', 'طفو', 'يتحرك لأعلى وأسفل'], ['breath', 'تنفّس', 'يكبر ويصغر قليلاً'], ['glow', 'نبض التوهج', 'الإطار يتوهج']]
export const BG_FX: FxList = [['none', 'بدون', ''], ['particles', 'جزيئات صاعدة', 'نقاط تطفو'], ['rays', 'أشعة دوّارة', 'ضوء يدور'], ['bokeh', 'أضواء ضبابية', 'بقع ناعمة'], ['confetti', 'قصاصات ملونة', 'للاحتفال']]
export const CTA_FX: FxList = [['pulse', 'نبض', 'يكبر ويصغر'], ['bounce', 'قفز', 'يقفز للأعلى'], ['shake', 'اهتزاز دوري', 'ينبّه المشاهد'], ['none', 'ثابت', '']]
export { lum } from '../../core/colors'
