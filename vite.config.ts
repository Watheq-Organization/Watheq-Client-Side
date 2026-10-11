import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// In-memory barcode relay buffer for cross-device mobile scanner
const barcodeRelayPlugin = (): Plugin => {
  const pendingBarcodes: { barcode: string; timestamp: number }[] = [];

  return {
    name: 'barcode-relay-plugin',
    configureServer(server) {
      server.middlewares.use('/api/local-scanner/push', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (data?.barcode) {
                pendingBarcodes.push({ barcode: String(data.barcode).trim(), timestamp: Date.now() });
                // Keep only last 20
                if (pendingBarcodes.length > 20) pendingBarcodes.shift();
              }
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });

      server.middlewares.use('/api/local-scanner/pull', (req, res) => {
        if (req.method === 'GET') {
          const items = [...pendingBarcodes];
          // Clear returned items
          pendingBarcodes.length = 0;
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ items }));
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    },
  };
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
    barcodeRelayPlugin(),
  ],
  server: {
    host: true,
    proxy: {
      '/api/local-scanner': {
        // Handled directly by middleware before proxy
        bypass: (req) => {
          if (req.url?.startsWith('/api/local-scanner')) {
            return req.url;
          }
        },
      },
      '/api': {
        target: 'https://whateq.runasp.net',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})