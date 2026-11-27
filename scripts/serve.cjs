const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png',
  '.svg':'image/svg+xml', '.ico':'image/x-icon', '.json':'application/json', '.md':'text/plain'};
/** Serve built bytes unchanged on loopback. No game data or browser profile I/O. */
function serve({port = 8000, root = path.resolve(__dirname, '../dist')} = {}) {
  if (!fs.existsSync(path.join(root,'package-manifest.json'))) throw new Error('Run npm run build before serving');
  const server = http.createServer((request,response)=>{
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname); }
    catch { response.writeHead(400).end(); return; }
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file,(error,bytes)=>{
      if (error) { response.writeHead(404).end(); return; }
      const type = mime[path.extname(file)] || 'application/octet-stream';
      response.writeHead(200, {'Content-Type':type + (type.startsWith('text/')?'; charset=utf-8':''), 'Cache-Control':'no-store'});
      response.end(bytes);
    });
  });
  server.listen(port,'127.0.0.1');
  for (const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>server.close(()=>process.exit(0)));
  return server;
}
if (require.main === module) serve();
module.exports = {serve};
