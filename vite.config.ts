import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Local internal tool: Konva + React make up the main bundle
  build: { chunkSizeWarningLimit: 1200 },
});
