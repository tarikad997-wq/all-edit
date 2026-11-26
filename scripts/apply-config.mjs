// يولّد public/privacy.html و public/terms.html من القوالب ببريد التواصل المكتوب في src/config.ts
import { readFileSync, writeFileSync } from 'node:fs'
const email = /contactEmail:\s*'([^']+)'/.exec(readFileSync('src/config.ts', 'utf8'))?.[1] ?? 'support@example.com'
for (const f of ['privacy', 'terms']) writeFileSync(`public/${f}.html`, readFileSync(`scripts/legal/${f}.html`, 'utf8').replaceAll('__EMAIL__', email))
if (email === 'support@example.com') console.warn('[config] ⚠ لم تغيّر contactEmail في src/config.ts — Google Play يتطلب بريد تواصل حقيقياً')
else console.log('[config] بريد التواصل:', email)
