import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'PUBLIC_');
  return {
    plugins: [react()],
    server: {
      port: 4321,
      strictPort: false,
      host: true
    },
    preview: {
      port: 4173,
      strictPort: false,
      host: true,
      allowedHosts: true
    },
    define: {
      'import.meta.env.PUBLIC_BACKEND_URL': JSON.stringify(env.PUBLIC_BACKEND_URL || 'http://localhost:5000')
    }
  };
});


