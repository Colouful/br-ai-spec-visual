import WebSocket from 'ws';

import type { RealtimeEventEnvelope } from '../lib/contracts/realtime.ts';

function normalizeWebSocketUrl(serverUrl: string): string {
  const url = new URL(serverUrl);
  if (url.protocol === 'http:') {
    url.protocol = 'ws:';
  } else if (url.protocol === 'https:') {
    url.protocol = 'wss:';
  }

  if (!url.pathname || url.pathname === '/') {
    url.pathname = '/ws';
  }

  return url.toString();
}

export async function sendCollectorEvents(input: {
  serverUrl: string;
  handshake: RealtimeEventEnvelope;
  events: RealtimeEventEnvelope[];
}): Promise<{
  websocket_url: string;
  acknowledgements: unknown[];
}> {
  const websocketUrl = normalizeWebSocketUrl(input.serverUrl);

  return new Promise((resolve, reject) => {
    const acknowledgements: unknown[] = [];
    const socket = new WebSocket(websocketUrl);
    let handshakeAcknowledged = false;
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error('Collector handshake timed out'));
    }, 5_000);

    socket.on('open', () => {
      socket.send(JSON.stringify(input.handshake));
    });

    socket.on('message', (raw) => {
      const text = raw.toString();

      try {
        const parsed = JSON.parse(text);
        acknowledgements.push(parsed);

        if (
          !handshakeAcknowledged &&
          parsed &&
          typeof parsed === 'object' &&
          'event_type' in parsed &&
          parsed.event_type === 'session.ack'
        ) {
          handshakeAcknowledged = true;
          for (const event of input.events) {
            socket.send(JSON.stringify(event));
          }
          setTimeout(() => socket.close(1000, 'baseline complete'), 50);
        }
      } catch (error) {
        clearTimeout(timeout);
        socket.close();
        reject(error);
      }
    });

    socket.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    socket.on('close', () => {
      clearTimeout(timeout);
      if (!handshakeAcknowledged) {
        reject(new Error('Collector disconnected before handshake acknowledgement'));
        return;
      }

      resolve({
        websocket_url: websocketUrl,
        acknowledgements,
      });
    });
  });
}
