import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Account } from './types'
const KEY = 'pp-account', empty: Account = { pageName: 'اسم الصفحة', profileImg: '', logoImg: '' }
const Ctx = createContext<{ acc: Account; setAcc: (p: Partial<Account>) => void }>({ acc: empty, setAcc: () => {} })
function initial(): Account {
  try { const a = JSON.parse(localStorage.getItem(KEY) || ''); if (a) return { ...empty, ...a } } catch { /* ignore */ }
  try { const d = JSON.parse(localStorage.getItem('pp-draft') || ''); if (d?.pageName) return { pageName: d.pageName, profileImg: d.profileImg || '', logoImg: d.logoImg || '' } } catch { /* ignore */ }
  return empty
}
export function AccountProvider({ children }: { children: ReactNode }) {
  const [acc, set] = useState<Account>(initial)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(acc)) } catch { /* quota */ } }, [acc])
  return <Ctx.Provider value={{ acc, setAcc: p => set(a => ({ ...a, ...p })) }}>{children}</Ctx.Provider>
}
export const useAccount = () => useContext(Ctx)
