import { useAccount } from '../../core/account'
import { Card, Field, ImagePick } from '../../ui/Kit'
import Diagnostics from './Diagnostics'
export default function AccountPage() {
  const { acc, setAcc } = useAccount()
  return <div className="page single"><Card title="هوية الصفحة">
    <p className="muted">تُستخدم هذه البيانات تلقائياً في كل الأدوات: الفيديو، نموذج الريلز، والأغلفة.</p>
    <div className="row"><div className="stack ctr"><ImagePick label="صورة البروفايل" round value={acc.profileImg} onChange={s => setAcc({ profileImg: s })} size={110} /><span className="muted">البروفايل</span></div>
      <div className="stack ctr"><ImagePick label="الشعار" value={acc.logoImg} onChange={s => setAcc({ logoImg: s })} size={110} /><span className="muted">شعار (اختياري)</span></div></div>
    <Field label="اسم الصفحة"><input value={acc.pageName} onChange={e => setAcc({ pageName: e.target.value })} /></Field>
    {(acc.profileImg || acc.logoImg) && <button className="btn danger" onClick={() => setAcc({ profileImg: '', logoImg: '' })}>إزالة الصور</button>}
  </Card><Diagnostics /></div>
}
