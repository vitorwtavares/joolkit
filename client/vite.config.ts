import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { seoPlugin } from './plugins/seoPlugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@joolkit/billing/plans': path.resolve(
        __dirname,
        '../server/src/billing/plans.ts',
      ),
    },
  },
})
