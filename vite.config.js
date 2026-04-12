import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite configuration with React and Tailwind CSS plugins.
// See https://vitejs.dev/config/ for more details.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
