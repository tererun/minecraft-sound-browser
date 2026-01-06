import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'
import { builtinModules } from 'module'

const projectRoot = __dirname

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: resolve(projectRoot, 'src/main/index.ts'),
        vite: {
          build: {
            outDir: resolve(projectRoot, 'dist-electron/main'),
            rollupOptions: {
              external: ['electron', 'electron-store', ...builtinModules, ...builtinModules.map(m => `node:${m}`)]
            }
          }
        }
      },
      {
        entry: resolve(projectRoot, 'src/preload/index.ts'),
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: resolve(projectRoot, 'dist-electron/preload'),
            rollupOptions: {
              external: ['electron', ...builtinModules, ...builtinModules.map(m => `node:${m}`)],
              output: {
                format: 'cjs'
              }
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src/renderer/src')
    }
  },
  root: resolve(projectRoot, 'src/renderer'),
  build: {
    outDir: resolve(projectRoot, 'dist'),
    emptyOutDir: true
  }
})
