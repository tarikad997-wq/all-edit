import { useState } from 'react'
import PastPresentPage from './features/past-present/Page'
import ReelFormPage from './features/reel-form/Page'
import CaptionsPage from './features/captions/Page'
import ThumbnailsPage from './features/thumbnails/Page'
import { LogoMark, Wordmark } from './ui/Logo'
import Footer from './ui/Footer'
import AccountPage from './features/account/Page'
const TABS = [['pp', '🎬', 'الماضي والحاضر'], ['reel', '📱', 'نموذج الريلز'], ['cap', '💬', 'الكابشن'], ['thumb', '🖼', 'الأغلفة'], ['acc', '👤', 'الحساب']] as const
type Tab = typeof TABS[number][0]
export default function App() {
  const [tab, setTab] = useState<Tab>(() => (localStorage.getItem('pp-tab') as Tab) || 'pp')
  const go = (t: Tab) => { setTab(t); localStorage.setItem('pp-tab', t); window.scrollTo(0, 0) }
  const show = (t: Tab) => ({ hidden: tab !== t })
  return <div className="shell">
    <header className="top"><h1 className="brand"><LogoMark size={38} /><Wordmark /></h1>
      <nav className="nav">{TABS.map(([k, ic, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => go(k)}><i>{ic}</i><span>{l}</span></button>)}</nav></header>
    <main>
      <div {...show('pp')}><PastPresentPage active={tab === 'pp'} /></div>
      <div {...show('reel')}><ReelFormPage active={tab === 'reel'} /></div>
      <div {...show('cap')}><CaptionsPage active={tab === 'cap'} /></div>
      <div {...show('thumb')}><ThumbnailsPage /></div>
      <div {...show('acc')}><AccountPage /></div>
    </main>
    <Footer /></div>
}
