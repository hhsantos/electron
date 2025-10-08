import { handler as ssrHandler } from './dist/server/entry.mjs';
import express from 'express';
import { createServer as createHttpServer } from 'http';

const app = express();

// Trust proxy - NECESARIO para que Express confíe en nginx
// Permite que req.ip, req.secure, req.protocol funcionen correctamente
app.set('trust proxy', 1);

app.use(ssrHandler);

// Puerto HTTP - nginx manejará HTTPS
const PORT_HTTP = 3001;

// Servidor HTTP
const httpServer = createHttpServer(app);
httpServer.listen(PORT_HTTP, '0.0.0.0', () => {
  console.log(`HTTP Server running on port ${PORT_HTTP}`);
  console.log(`External access via nginx at https://electron.finance`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Server shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed.');
  });
});

process.on('SIGINT', () => {
  console.log('Server shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});