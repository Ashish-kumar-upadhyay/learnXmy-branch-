import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDatabase } from './config/database';
import { env } from './config/environment';
import { setRealtimeServer } from './realtime';
import { logger } from './utils/logger';

const DB_RETRY_MS = 7000;

async function connectDatabaseWithRetry() {
  // Keep retrying so dev server doesn't crash on transient Atlas issues/IP whitelist delay.
  while (true) {
    try {
      await connectDatabase();
      return;
    } catch (e) {
      logger.error(
        `MongoDB connection failed. Retrying in ${DB_RETRY_MS / 1000}s. ` +
          'If using Atlas, ensure current IP is allowed in Network Access.'
      );
      logger.error(String(e));
      await new Promise((resolve) => setTimeout(resolve, DB_RETRY_MS));
    }
  }
}

async function main() {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.corsOrigin === '*' ? '*' : env.corsOrigin.split(','), credentials: true },
  });

  setRealtimeServer(io);

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string | undefined;
    if (userId) socket.join(`user:${userId}`);
    socket.on('disconnect', () => undefined);
  });

  const port = Number(process.env.PORT) || env.port;
  console.log(`Starting server on port ${port} (PORT env: ${process.env.PORT})`);
  logger.info(`Starting server on port ${port} (PORT env: ${process.env.PORT})`);
  // Avoid localhost (::1) mismatch on systems where localhost resolves to IPv6 first.
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    logger.info(`LearnX API listening on port ${port}`);
    logger.info(`Server successfully started and listening!`);
  });
  // Keep API reachable while DB reconnect attempts continue.
  void connectDatabaseWithRetry();
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(
        `Port ${port} is already in use. Close the other LearnX / Node process using this port, or set PORT in .env to a free port. On Windows: Get-NetTCPConnection -LocalPort ${port} then Stop-Process -Id <OwningProcess> -Force`
      );
    } else {
      logger.error(String(err));
    }
    process.exit(1);
  });
}

main().catch((e) => {
  logger.error(String(e));
  process.exit(1);
});
