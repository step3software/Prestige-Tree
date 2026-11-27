const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

// Test-only response adaptation: the production page continues using its shipped CDN.
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  const file = pathname === '/test-vue.js' ? require.resolve('vue/dist/vue.min.js')
    : path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  fs.readFile(file, (error, bytes) => {
    if (error) { response.writeHead(404).end(); return; }
    if (path.extname(file) === '.html') {
      bytes = Buffer.from(bytes.toString('utf8')
        .replace('https://cdn.jsdelivr.net/npm/vue@2.6.12', '/test-vue.js')
        .replace(/<link[^>]+fonts.googleapis.com[^>]*>/g, ''));
    }
    const type = mime[path.extname(file)] ?? 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type.startsWith('text/') ? type + '; charset=utf-8' : type, 'Cache-Control': 'no-store' });
    response.end(bytes);
  });
});
server.listen(4173, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
