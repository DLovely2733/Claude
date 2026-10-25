// NovelVerse classroom server.
//
// Serves the built app (dist/) and relays live-session messages between the
// teacher's browser (the host) and student devices on the same network.
// It stores nothing: rooms live in memory, hold no names beyond the call signs
// passing through, and disappear when empty or after four idle hours.
//
//   npm run build && npm run classroom            # port 8787
//   PORT=9000 npm run classroom
//
// Students open the "Join at" address printed below on their devices.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT ?? 8787);
const ROOT = fileURLToPath(new URL('../dist/', import.meta.url));
const MAX_MESSAGE = 32 * 1024;
const MAX_PER_ROOM = 80;
const IDLE_MS = 4 * 60 * 60 * 1000;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  if (url.pathname.endsWith('/api/classroom')) {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ relay: true, rooms: rooms.size }));
    return;
  }
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '').replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, rel || 'index.html');
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found. Did you run `npm run build`?');
  }
});

/** code -> { sockets: Set<WebSocket>, last: number } */
const rooms = new Map();
const wss = new WebSocketServer({ server, path: '/relay', maxPayload: MAX_MESSAGE });

wss.on('connection', (ws, req) => {
  const code = new URL(req.url ?? '', 'http://x').searchParams.get('code')?.toUpperCase() ?? '';
  if (!/^[A-Z0-9]{4,8}$/.test(code)) { ws.close(1008, 'bad code'); return; }
  const room = rooms.get(code) ?? { sockets: new Set(), last: Date.now() };
  if (room.sockets.size >= MAX_PER_ROOM) { ws.close(1013, 'room full'); return; }
  room.sockets.add(ws);
  rooms.set(code, room);
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (data, isBinary) => {
    if (isBinary) return;
    room.last = Date.now();
    for (const peer of room.sockets) if (peer !== ws && peer.readyState === 1) peer.send(data.toString());
  });
  ws.on('close', () => {
    room.sockets.delete(ws);
    if (!room.sockets.size) rooms.delete(code);
  });
});

setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
  for (const [code, room] of rooms) if (Date.now() - room.last > IDLE_MS) { room.sockets.forEach((s) => s.close()); rooms.delete(code); }
}, 30_000).unref();

server.listen(PORT, () => {
  const addrs = Object.values(networkInterfaces()).flat().filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => a.address);
  console.log(`NovelVerse classroom server on port ${PORT}`);
  console.log(`  Teacher:  http://localhost:${PORT}/#/teacher/live`);
  for (const a of addrs) console.log(`  Join at:  http://${a}:${PORT}/#/join`);
  console.log('Rooms are kept in memory only. Stop the server to clear everything.');
});
