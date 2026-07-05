import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {predictHandler, analyticsHandler, explainHandler} from './server-api';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'express-api-router',
        configureServer(server) {
          server.middlewares.use('/api/predict', (req: any, res, next) => {
            // Vite middleware: manually parse JSON body before forwarding to handler
            if (req.body !== undefined) {
              predictHandler(req, res);
              return;
            }
            let raw = '';
            req.on('data', (chunk: any) => { raw += chunk; });
            req.on('end', () => {
              try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
              predictHandler(req, res);
            });
          });
          server.middlewares.use('/api/explain', (req: any, res, next) => {
            // Vite middleware: manually parse JSON body before forwarding to handler
            if (req.body !== undefined) {
              explainHandler(req, res);
              return;
            }
            let raw = '';
            req.on('data', (chunk: any) => { raw += chunk; });
            req.on('end', () => {
              try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
              explainHandler(req, res);
            });
          });
          server.middlewares.use('/api/analytics', (req, res) => {
            analyticsHandler(req, res);
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
