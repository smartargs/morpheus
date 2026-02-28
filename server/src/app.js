import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import routes from './routes/index.js';
import { getOrCreateDefaultSession } from './services/session.service.js';
import { registerWsClient, removeWsClient } from './utils/broadcast.js';

export function createApp(server) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Mount API routes
  app.use('/api', routes);

  // Initialize WebSocket server if HTTP server is provided
  if (server) {
    const wss = new WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws) => {
      const session = getOrCreateDefaultSession();
      registerWsClient(ws);
      console.log(`[WS] Client connected (default session: ${session.id})`);

      ws.on('close', () => {
        removeWsClient(ws);
        console.log(`[WS] Client disconnected`);
      });

      ws.on('error', (err) => {
        console.error('[WS] Error:', err.message);
      });
    });
  }

  return app;
}
