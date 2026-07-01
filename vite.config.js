import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves from /restaurant-demo/, Vercel serves from root.
  base: process.env.VERCEL ? '/' : '/restaurant-demo/',
})
