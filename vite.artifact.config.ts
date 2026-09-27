import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** Build a single HTML file (JS, CSS and fonts inlined) for publishing as a link */
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: { outDir: 'dist-single', chunkSizeWarningLimit: 5000, assetsInlineLimit: 100_000_000 },
});
