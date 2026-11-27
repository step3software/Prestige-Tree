const { execFileSync } = require('node:child_process');
const { root } = require('./game-runtime.cjs');

/** A historical comparison must execute that revision's own complete script graph. */
function historicalSources(revision) {
  const read = file => execFileSync('git', ['show', `${revision}:${file}`], {cwd: root, encoding: 'utf8'});
  const html = read('index.html');
  const scriptOrder = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)]
    .map(match => match[1]).filter(source => !source.startsWith('http'));
  const sources = Object.fromEntries(scriptOrder.map(file => [file, read(file)]));
  return {scriptOrder, sources};
}

module.exports = { historicalSources };
