import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Important: Ensures assets are linked relatively for GitHub Pages
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 8080,
    open: true
  }
});