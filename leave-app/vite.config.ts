import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Completely erase all console logs from the browser
  esbuild: {
    // This tells esbuild to remove these specific calls
    // 'console' removes log, info, warn, error. 
    // 'debugger' removes debugger statements.
    // drop: ['console', 'debugger'],
  },
})