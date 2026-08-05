import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            return 'vendor';
          }
          
          // Feature chunks
          if (id.includes('/features/auth/')) {
            return 'auth';
          }
          if (id.includes('/features/dashboard/')) {
            return 'dashboard';
          }
          if (id.includes('/features/explorer/')) {
            return 'explorer';
          }
          if (id.includes('/features/resumes/')) {
            return 'resumes';
          }
          if (id.includes('/features/automation/')) {
            return 'automation';
          }
          if (id.includes('/features/admin/')) {
            return 'admin';
          }
          if (id.includes('/features/flashcards/')) {
            return 'flashcards';
          }
          
          return 'default';
        }
      }
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 600
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  }
})
