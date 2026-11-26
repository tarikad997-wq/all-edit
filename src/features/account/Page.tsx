import { useAccount } from '../../core/account'
import { Card, Field, ImagePick } from '../../ui/Kit'
import Diagnostics from './Diagnostics'
import { APP } from '../../config'
/** يحذف كل ما خزّنه التطبيق على الجهاز: الإعدادات والمسودات والقوائم والنماذج المحمّلة والنسخة غير المتصلة */
async function wipeAll() {
  if (!confirm('سيُحذف كل ما خزّنه التطبيق على جهازك: بيانات الصفحة والمسودات والقوائم المحفوظة ونموذج الكابشن المحمّل. لا يمكن التراجع. متابعة؟')) return
  try { localStorage.clear(); sessionStorage.clear() } catch { /* */ }
  try { await new Promise<void>(r => { const q = indexedDB.deleteDatabase('past-present'); q.onsuccess = q.onerror = q.onblocked = () => r() }) } catch { /* */ }
  try { for (const k of await caches.keys()) await caches.delete(k) } catch { /* */ }
  try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister() } catch { /* */ }
  location.reload()
}
export default function AccountPage() {
  const { acc, setAcc } = useAccount()
  return <div className="page single"><Card title="هوية الصفحة">
    <p className="muted">تُستخدم هذه البيانات تلقائياً في كل الأدوات: الفيديو، نموذج الريلز، والأغلفة.</p>
    <div className="row"><div className="stack ctr"><ImagePick label="صورة البروفايل" round value={acc.profileImg} onChange={s => setAcc({ profileImg: s })} size={110} /><span className="muted">البروفايل</span></div>
      <div className="stack ctr"><ImagePick label="الشعار" value={acc.logoImg} onChange={s => setAcc({ logoImg: s })} size={110} /><span className="muted">شعار (اختياري)</span></div></div>
    <Field label="اسم الصفحة"><input value={acc.pageName} onChange={e => setAcc({ pageName: e.target.value })} /></Field>
    {(acc.profileImg || acc.logoImg) && <button className="btn danger" onClick={() => setAcc({ profileImg: '', logoImg: '' })}>إزالة الصور</button>}
  </Card><Diagnostics />
    <Card title="بياناتك"><p className="muted">كل بياناتك محفوظة على هذا الجهاز فقط ولا نملك نسخة منها.</p>
      <button className="btn danger" onClick={wipeAll}>🗑 مسح كل بياناتي من هذا الجهاز</button>
      <div className="row"><a className="btn" href="privacy.html">سياسة الخصوصية</a><a className="btn" href={`mailto:${APP.contactEmail}`}>تواصل معنا</a></div></Card></div>
}
