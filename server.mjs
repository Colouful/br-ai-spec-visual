import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';

import dotenv from 'dotenv';
import next from 'next';
import { tsImport } from 'tsx/esm/api';

// 让 `pnpm dev` / `pnpm start` 直接拉起 server.mjs 时也能读到 .env 中的 PORT、
// DATABASE_URL 等。优先级约定：
//   shell 已导出的变量 > .env.local > .env
// 因此先读 .env.local（override:false 表示不覆盖已设值），再读 .env 做兜底。
dotenv.config({ path: '.env.local', override: false, quiet: true });
dotenv.config({ path: '.env', override: false, quiet: true });

if (process.env.NODE_ENV === 'production' && process.env.VISUAL_AUTH_MODE === 'demo') {
  throw new Error('生产环境禁止开启演示登录模式');
}

const dev = process.env.NODE_ENV !== 'production';
/** 监听地址：优先 LISTEN_HOST，其次 HOST（常见于容器）、HOSTNAME，默认可从局域网访问 */
const hostname =
  process.env.LISTEN_HOST ?? process.env.HOST ?? process.env.HOSTNAME ?? '0.0.0.0';
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
const upgradeHandler = app.getUpgradeHandler?.bind(app);
await app.prepare();

const wsServerModule = await tsImport('./src/server/ws-server.ts', import.meta.url);
const attachWebSocketServer =
  wsServerModule.attachWebSocketServer ??
  wsServerModule.default?.attachWebSocketServer ??
  wsServerModule.default;

if (typeof attachWebSocketServer !== 'function') {
  throw new TypeError('attachWebSocketServer is not exported from src/server/ws-server.ts');
}

attachWebSocketServer(httpServer, {
  fallbackUpgrade: (request, socket, head) => {
    if (typeof upgradeHandler === 'function') {
      upgradeHandler(request, socket, head);
    } else {
      socket.destroy();
    }
  },
});

httpServer.on('request', (request, response) => {
  handle(request, response);
});

httpServer.listen(port, hostname, () => {
  console.log(`> Server listening at http://${hostname}:${port}`);
  if (dev) {
    const nics = networkInterfaces();
    const ipv4 = [];
    for (const list of Object.values(nics)) {
      if (!list) continue;
      for (const e of list) {
        if ((e.family === 'IPv4' || e.family === 4) && !e.internal) {
          ipv4.push(e.address);
        }
      }
    }
    const unique = [...new Set(ipv4)];
    for (const ip of unique) {
      console.log(`> 局域网: http://${ip}:${port}（next.config 已随开发模式放宽 allowedDevOrigins）`);
    }
  }
});
