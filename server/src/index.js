import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './app.js';
import { initMcpClient, closeMcpClient } from './services/mcp.service.js';
import { loadSessions } from './services/session.service.js';

const PORT = process.env.PORT || 3001;
const NETWORK = process.env.NEO_NETWORK || 'testnet';

async function bootstrap() {
  const httpServer = createServer();
  const app = createApp(httpServer);

  // Attach Express app to HTTP server
  httpServer.on('request', app);

  // Initialize DB sessions
  loadSessions();

  httpServer.listen(PORT, () => {
    console.log(`[Server] Running at http://localhost:${PORT}`);
    console.log(`[Server] Network: ${NETWORK}`);

    // Lazy load MCP in background
    initMcpClient(NETWORK).catch((err) => {
      console.warn(`[MCP] Connection failed: ${err.message}`);
      console.warn('[MCP] Tool calls will be unavailable.');
    });
  });

  // Graceful shutdown logic
  const shutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}, shutting down...`);
    await closeMcpClient();
    httpServer.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[Server] Critical failure during bootstrap:', err);
  process.exit(1);
});
