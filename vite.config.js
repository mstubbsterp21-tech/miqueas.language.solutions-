import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import portalDocumentControls from './vite.portal-documents.js'
import adminDocumentUpload from './vite.admin-document-upload.js'
import notificationCenterEnhancements from './vite.notifications.js'

// Vite configuration with React, Tailwind CSS, and MLS portal enhancements.
export default defineConfig({
  plugins: [portalDocumentControls(), adminDocumentUpload(), notificationCenterEnhancements(), react(), tailwindcss()],
})
