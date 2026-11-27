const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {assets} = require('./build.cjs');

const root = path.resolve(__dirname, '..');
/** Watch only build inputs and tooling, excluding generated dist and saves.
 * Node's foreground watch process owns restarts and child shutdown. */
function watchArguments() {
  const inputs = [...assets, 'package.json', 'package-lock.json',
    'scripts/build.cjs', 'scripts/serve.cjs', 'scripts/dev-server.cjs'];
  return ['--watch', '--watch-preserve-output',
    ...inputs.map(file => '--watch-path=' + path.join(root, file)),
    path.join(__dirname, 'dev-server.cjs')];
}

if (require.main === module) {
  const result = spawnSync(process.execPath, watchArguments(), {cwd:root, stdio:'inherit'});
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
module.exports = {watchArguments};
