import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-vendor'
          }

          if (id.includes('node_modules/socket.io-client')) {
            return 'realtime-vendor'
          }

          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-hot-toast')) {
            return 'ui-vendor'
          }

          return undefined
        },
      },
    },
  },
})
