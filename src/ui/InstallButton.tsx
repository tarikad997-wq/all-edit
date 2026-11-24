import { useEffect, useState } from 'react'
interface BIP extends Event { prompt(): Promise<void> }
export default function InstallButton() {
  const [ev, setEv] = useState<BIP | null>(null), [ios, setIos] = useState(false), [done, setDone] = useState(false)
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setEv(e as BIP) }
    addEventListener('beforeinstallprompt', on); addEventListener('appinstalled', () => setDone(true))
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent)); return () => removeEventListener('beforeinstallprompt', on)
  }, [])
  if (standalone || done) return null
  if (ev) return <button className="btn primary sm" onClick={async () => { await ev.prompt(); setEv(null) }}>⬇ تثبيت التطبيق</button>
  if (ios) return <span className="muted" style={{ fontSize: '.75rem' }}>للتثبيت: مشاركة ← إضافة إلى الشاشة الرئيسية</span>
  return null
}
