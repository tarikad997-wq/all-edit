import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
// يمنع Vite من نسخ ملف ONNX WASM الكامل (≈25.6MB) إلى dist؛ يُحمَّل بدلاً منه مقسّماً من /ort (انظر scripts/prepare-ort.mjs)
const dropWasm = (): Plugin => ({ name: 'drop-wasm', generateBundle(_o, bundle) { for (const k of Object.keys(bundle)) if (k.endsWith('.wasm')) delete bundle[k] } })
export default defineConfig({ base: './', plugins: [react(), dropWasm()], worker: { format: 'es', plugins: () => [dropWasm()] } })
