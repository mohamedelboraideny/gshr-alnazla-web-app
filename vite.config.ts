import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Development Port
    open: true
  },
  preview: {
    port: 8080, // Production Port
    open: true
  }
});