import '@fontsource/cairo/700.css'; import '@fontsource/cairo/800.css'; import '@fontsource/cairo/900.css'
import '@fontsource/lalezar/400.css'; import '@fontsource/reem-kufi/700.css'
import './core/fontFaces'
import { createRoot } from 'react-dom/client'
import { AccountProvider } from './core/account'
import App from './App'; import './ui/styles.css'
createRoot(document.getElementById('root')!).render(<AccountProvider><App /></AccountProvider>)
if ('serviceWorker' in navigator && import.meta.env.PROD) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
