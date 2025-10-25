import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Replace 'forest-side-presentoire' with your GitHub repository name.
  base: '/forest-side-presentoire/',
})
