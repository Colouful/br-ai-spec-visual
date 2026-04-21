import { createServer } from 'node:http';

import next from 'next';
import { tsImport } from 'tsx/esm/api';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME ?? '0.0.0.0';
const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const httpServer = createServer();
const app = next({
  dev,
  dir: '.',
  hostname,
  port,
  httpServer,
});

const handle = app.getRequestHandler();
await app.prepare();

const wsServerModule = await tsImport('./src/server/ws-server.ts', import.meta.url);
const attachWebSocketServer =
  wsServerModule.attachWebSocketServer ??
  wsServerModule.default?.attachWebSocketServer ??
  wsServerModule.default;

if (typeof attachWebSocketServer !== 'function') {
  throw new TypeError('attachWebSocketServer is not exported from src/server/ws-server.ts');
}

attachWebSocketServer(httpServer);

httpServer.on('request', (request, response) => {
  handle(request, response);
});

httpServer.listen(port, hostname, () => {
  console.log(`> Server listening at http://${hostname}:${port}`);
});
