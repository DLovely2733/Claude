// Minimal static file server for local use: `npm start` then open
// http://localhost:8080. The app is fully static and can also be hosted on any
// static web host (e.g. a school web server or GitHub Pages).

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const port = Number(process.env.PORT) || 8080;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = normalize(join(root, urlPath === '/' ? 'index.html' : urlPath));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try {
    let body = await readFile(file);
    // index.html is written as artifact page content (no document skeleton);
    // add the same minimal skeleton the artifact host adds when published.
    if (extname(file) === '.html' && !/^\s*<!doctype/i.test(body.toString('utf8', 0, 64))) {
      body = Buffer.concat([Buffer.from('<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), body, Buffer.from('</body></html>')]);
    }
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`Student site: http://localhost:${port}/  ·  Teacher tools: http://localhost:${port}/teacher.html`));
