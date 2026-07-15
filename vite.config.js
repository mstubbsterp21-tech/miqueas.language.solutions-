import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import portalDocumentControls from './vite.portal-documents.js'

// Vite configuration with React, Tailwind CSS, and MLS portal document controls.
export default defineConfig({
  plugins: [portalDocumentControls(), react(), tailwindcss()],
})
