import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 5173 },
  publicDir: 'public'
});
