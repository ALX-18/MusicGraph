import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_API_URL is read at runtime from import.meta.env (see src/api/client.ts).
// We expose the dev server on 5173 to match docker-compose / the brief.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 5173,
  },
});
