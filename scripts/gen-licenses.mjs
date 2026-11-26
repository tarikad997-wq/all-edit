// يولّد public/licenses.html من تبعيات المشروع الفعلية (الخطوط OFL وغيرها)
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
const pkg = JSON.parse(readFileSync('package.json', 'utf8')), rows = []
const add = (name) => { const p = join('node_modules', name, 'package.json'); if (!existsSync(p)) return; const j = JSON.parse(readFileSync(p, 'utf8')); rows.push([name, j.version, typeof j.license === 'string' ? j.license : j.license?.type ?? '—']) }
Object.keys(pkg.dependencies).forEach(add)
for (const d of existsSync('node_modules/@fontsource') ? readdirSync('node_modules/@fontsource') : []) if (!rows.find(r => r[0] === '@fontsource/' + d)) add('@fontsource/' + d)
rows.sort((a, b) => a[0].localeCompare(b[0]))
const esc = s => String(s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))
const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0a0e1a"><title>التراخيص — All Edit</title><style>:root{color-scheme:dark}body{margin:0;background:#0a0e1a;color:#eef1ff;font:16px/1.8 system-ui,sans-serif}main{max-width:760px;margin:auto;padding:24px 18px 60px}a{color:#ffd166}table{width:100%;border-collapse:collapse;font-size:.85rem;direction:ltr}td,th{border-bottom:1px solid #262f52;padding:6px;text-align:left}h1{font-size:1.5rem}</style></head><body><main><a href="./">← العودة إلى التطبيق</a><h1>تراخيص المكوّنات مفتوحة المصدر</h1>
<p>يستخدم All Edit مكتبات وخطوطاً مفتوحة المصدر، وهذه قائمتها. الخطوط مرخّصة بـ SIL Open Font License (OFL-1.1) وتصلح للاستخدام التجاري. نماذج Whisper من OpenAI برخصة MIT، وتحويلات ONNX لها تراخيصها في صفحات نماذجها على Hugging Face.</p>
<table><tr><th>الحزمة</th><th>الإصدار</th><th>الرخصة</th></tr>${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table></main></body></html>`
writeFileSync('public/licenses.html', html); console.log(`[licenses] ${rows.length} حزمة`)
