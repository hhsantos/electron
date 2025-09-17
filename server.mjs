import { handler as ssrHandler } from './dist/server/entry.mjs';
import express from 'express';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync, existsSync } from 'fs';

const app = express();
app.use(ssrHandler);

// Puertos no privilegiados
const PORT_HTTP = 3000;
const PORT_HTTPS = 3001;

// Servidor HTTP
const httpServer = createHttpServer(app);
httpServer.listen(PORT_HTTP, '0.0.0.0', () => {
  console.log(`HTTP Server running on port ${PORT_HTTP}`);
});

// Servidor HTTPS (solo si los certificados existen)
const certPath = '/var/www/ssl/fullchain.pem';
const keyPath = '/var/www/ssl/privkey.pem';

if (existsSync(certPath) && existsSync(keyPath)) {
  try {
    const sslOptions = {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath)
    };
    const httpsServer = createHttpsServer(sslOptions, app);
    httpsServer.listen(PORT_HTTPS, '0.0.0.0', () => {
      console.log(`HTTPS Server running on port ${PORT_HTTPS}`);
    });
  } catch (error) {
    console.error('Error starting HTTPS server:', error.message);
  }
} else {
  console.log('SSL certificates not found, running HTTP only');
}