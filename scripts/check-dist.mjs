// يفشل البناء إن وُجد ملف أكبر من حدّ Cloudflare Workers Assets (25MiB) أو ملف .wasm أو غاب مانيفست ORT
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
const LIMIT = 24 * 1024 * 1024, files = []
const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push([p, statSync(p).size]) } }
walk('dist'); files.sort((a, b) => b[1] - a[1])
const bad = files.filter(([p, s]) => s > LIMIT || p.endsWith('.wasm'))
console.log('[check-dist] أكبر الملفات:'); files.slice(0, 4).forEach(([p, s]) => console.log(`  ${(s / 1048576).toFixed(2)} MiB  ${p}`))
if (!existsSync('dist/ort/manifest.json')) bad.push(['dist/ort/manifest.json (مفقود — الكابشن لن يعمل)', 0])
if (bad.length) { console.error('[check-dist] فشل:'); bad.forEach(([p, s]) => console.error(`  ${p} ${s ? (s / 1048576).toFixed(2) + ' MiB' : ''}`)); process.exit(1) }
console.log(`[check-dist] ✅ ${files.length} ملفاً، كلها أقل من 24 MiB، ولا يوجد .wasm`)
