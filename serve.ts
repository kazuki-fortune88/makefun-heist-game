// Midnight Vault — local development server.
//
// Serves game/ as static files on http://localhost:8080 so the game can be
// played in desktop Chrome exactly as the grader's static server will serve
// it. Standard library only; run with `node serve.ts`.

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 8080;
const GAME_DIR = join(fileURLToPath(new URL('.', import.meta.url)), 'game');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');
  const path = join(GAME_DIR, rel);
  // Never serve a path that climbs out of game/.
  if (!path.startsWith(GAME_DIR) || !existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  const ext = rel.slice(rel.lastIndexOf('.'));
  res.writeHead(200, { 'content-type': MIME_TYPES[ext] ?? 'application/octet-stream' });
  createReadStream(path).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Midnight Vault dev server: http://localhost:${PORT}`);
});
