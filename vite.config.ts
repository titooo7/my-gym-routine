import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Defines a placeholder for process.env.API_KEY that will be replaced
    // by the entrypoint script at runtime in the Docker container.
    'process.env.API_KEY': JSON.stringify('__API_KEY_PLACEHOLDER__')
  }
});