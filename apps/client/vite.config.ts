import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["shared-models"],
  },
  build: {
    commonjsOptions: {
      include: [/shared-models/, /node_modules/],
    },
  },
})
