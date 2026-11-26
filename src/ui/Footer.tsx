import { useState } from 'react'
import { LogoMark, Wordmark } from './Logo'
import InstallButton from './InstallButton'
import { APP } from '../config'
const TEXT = {
  about: ['عن All Edit', ['أداة عربية لصناعة فيديوهات Reels وأغلفة المنشورات: «الماضي والحاضر»، نموذج الريلز بمربع فيديو وطلب للمتابع، وأغلفة جاهزة للأخبار والأفلام.', 'كل شيء يعمل داخل متصفحك أو التطبيق المثبّت، بدون حساب وبدون خادم.']]
} as const
export default function Footer() {
  const [open, setOpen] = useState<keyof typeof TEXT | null>(null)
  return <footer className="foot">
    <div className="foot-brand"><LogoMark size={44} /><div><Wordmark /><p className="muted">صانع الفيديو والأغلفة بالعربية</p></div></div>
    <div className="foot-links"><button onClick={() => setOpen('about')}>عن التطبيق</button><a href="privacy.html">سياسة الخصوصية</a><a href="terms.html">شروط الاستخدام</a><a href="licenses.html">التراخيص</a><a href={`mailto:${APP.contactEmail}`}>تواصل معنا</a><InstallButton /></div>
    <p className="muted foot-copy">© {new Date().getFullYear()} All Edit · الإصدار {APP.version} · ملفاتك تبقى على جهازك</p>
    {open && <div className="sheet-bg" onClick={e => { if (e.target === e.currentTarget) setOpen(null) }}><div className="sheet"><div className="grab" /><div className="stack"><h2>{TEXT[open][0]}</h2>{TEXT[open][1].map((t, i) => <p key={i} className="note">{t}</p>)}<button className="btn big" onClick={() => setOpen(null)}>إغلاق</button></div></div></div>}
  </footer>
}
