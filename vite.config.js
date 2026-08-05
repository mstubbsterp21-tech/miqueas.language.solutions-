import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import portalDocumentControls from './vite.portal-documents.js'
import adminDocumentUpload from './vite.admin-document-upload.js'
import notificationCenterEnhancements from './vite.notifications.js'
import seoStaticPages from './scripts/seo-static-pages.js'

// Vite configuration with React, Tailwind CSS, and MLS portal enhancements.
export default defineConfig({
  plugins: [portalDocumentControls(), adminDocumentUpload(), notificationCenterEnhancements(), react(), tailwindcss(), seoStaticPages()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'clerk-vendor',
              test: /node_modules[\\/]@clerk/,
              maxSize: 250_000,
              priority: 40,
              entriesAware: true,
            },
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
              maxSize: 250_000,
              priority: 30,
              entriesAware: true,
            },
            {
              name: 'ui-vendor',
              test: /node_modules[\\/](framer-motion|lucide-react|react-icons)[\\/]/,
              maxSize: 250_000,
              priority: 20,
              entriesAware: true,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              maxSize: 250_000,
              priority: 10,
              entriesAware: true,
            },
            {
              name: 'portal-features',
              test: /src[\\/](portal|pages[\\/]MLSWebAppHub)/,
              maxSize: 300_000,
              minSize: 50_000,
              priority: 5,
              includeDependenciesRecursively: false,
              entriesAware: true,
            },
          ],
        },
      },
    },
  },
})
