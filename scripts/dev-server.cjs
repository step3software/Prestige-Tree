const {build} = require('./build.cjs');
const {serve} = require('./serve.cjs');

/** Each watch restart builds successfully before accepting local requests. */
function startDevServer({buildPackage = build, startServer = serve} = {}) {
  buildPackage();
  const server = startServer();
  server.once('listening', () => console.log('Dev server: http://127.0.0.1:8000/ — watching source files. Refresh after a rebuild; Ctrl+C stops it.'));
  return server;
}

if (require.main === module) startDevServer();
module.exports = {startDevServer};
