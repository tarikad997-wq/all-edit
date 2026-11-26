// يقسّم ملف WASM الكبير (≈25.6MB) إلى أجزاء أصغر من حدّ Cloudflare (25MiB) ويضعها في public/ort
// يعمل تلقائياً قبل dev وقبل build. الملفات الناتجة لا تُرفع إلى Git (public/ort في .gitignore).
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const pkgDir = join(process.cwd(), 'node_modules', 'onnxruntime-web') // الحزمة تمنع require.resolve لملف package.json
const { version } = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
const src = join(pkgDir, 'dist', 'ort-wasm-simd-threaded.asyncify.wasm'), mjs = join(pkgDir, 'dist', 'ort-wasm-simd-threaded.asyncify.mjs')
if (!existsSync(src)) { console.error('[prepare-ort] لم أجد', src); process.exit(1) }
const out = 'public/ort', MAX = 12 * 1024 * 1024
const bytes = readFileSync(src), hash = createHash('sha256').update(bytes).digest('hex').slice(0, 10)
const manifestPath = join(out, 'manifest.json')
if (existsSync(manifestPath)) { try { if (JSON.parse(readFileSync(manifestPath, 'utf8')).hash === hash) { console.log('[prepare-ort] جاهز مسبقاً'); process.exit(0) } } catch { /* أعد الإنشاء */ } }
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true })
const n = Math.ceil(bytes.length / MAX), step = Math.ceil(bytes.length / n), parts = []
for (let i = 0; i < n; i++) { const name = `ort-${hash}-${i}.bin`; writeFileSync(join(out, name), bytes.subarray(i * step, (i + 1) * step)); parts.push(name) }
const mjsName = `ort-${hash}.mjs`; copyFileSync(mjs, join(out, mjsName))
writeFileSync(manifestPath, JSON.stringify({ version, hash, size: bytes.length, parts, mjs: mjsName }))
console.log(`[prepare-ort] ${parts.length} أجزاء (${(step / 1048576).toFixed(1)} MiB لكل جزء) — ORT ${version}`)
