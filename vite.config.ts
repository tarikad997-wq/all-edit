
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const onnxWasmCdn =
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'onnx-wasm-cdn',
      enforce: 'post',

      generateBundle(_options, bundle) {
        for (const [fileName, output] of Object.entries(bundle)) {
          if (
            output.type !== 'asset' ||
            !fileName.includes('ort-wasm-simd-threaded') ||
            !fileName.endsWith('.wasm')
          ) {
            continue
          }

          const fileBase = fileName.split('/').pop()!

          for (const item of Object.values(bundle)) {
            if (item.type === 'chunk') {
              item.code = item.code
                .split(fileName).join(onnxWasmCdn + 'ort-wasm-simd-threaded.asyncify.wasm')
                .split(fileBase).join('ort-wasm-simd-threaded.asyncify.wasm')
            }
          }

          delete bundle[fileName]
        }
      },
    },
  ],
  worker: {
    format: 'es',
  },
})
