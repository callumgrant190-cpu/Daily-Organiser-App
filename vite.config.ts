import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves a project site from /<repo-name>/, so built asset URLs
// must be prefixed with that path. In dev we keep the base at '/' for a clean
// localhost URL.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Daily-Organiser-App/' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
}));
