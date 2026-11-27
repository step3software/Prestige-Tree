const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {EventEmitter} = require('node:events');
const {assets} = require('../../scripts/build.cjs');
const {watchArguments} = require('../../scripts/dev.cjs');
const {startDevServer} = require('../../scripts/dev-server.cjs');
const root = path.resolve(__dirname, '../..');

test('dev watches every packaged input, nested JS and build tooling without watching generated output', () => {
  assert.equal(require('../../package.json').scripts.dev, 'node scripts/dev.cjs');
  const args = watchArguments();
  assert.ok(args.includes('--watch'));
  assert.ok(args.includes('--watch-preserve-output'));
  const watched = args.filter(arg => arg.startsWith('--watch-path=')).map(arg => arg.slice('--watch-path='.length));
  for (const input of [...assets, 'package.json', 'package-lock.json', 'scripts/build.cjs', 'scripts/serve.cjs', 'scripts/dev-server.cjs']) {
    assert.ok(watched.includes(path.join(root, input)), input);
  }
  assert.ok(!watched.includes(root), 'Watching the entire checkout would rebuild on dist writes');
  assert.ok(!watched.some(file => ['dist', 'node_modules', '.git', 'test-results'].includes(path.relative(root, file).split(path.sep)[0])));
  assert.equal(args.at(-1), path.join(root, 'scripts/dev-server.cjs'));
});

test('dev builds before serving; injected server starts no listener or watcher', () => {
  const order = [];
  const server = new EventEmitter();
  const result = startDevServer({buildPackage:() => order.push('build'), startServer:() => {order.push('serve'); return server;}});
  assert.deepEqual(order, ['build', 'serve']);
  assert.equal(result, server);
  assert.equal(server.listenerCount('listening'), 1);
});

test('failed dev build does not serve a partial package and a later restart can recover', () => {
  let serves = 0;
  const startServer = () => {serves++; return new EventEmitter();};
  assert.throws(() => startDevServer({buildPackage:() => {throw new Error('Broken source');}, startServer}), /Broken source/);
  assert.equal(serves, 0);
  startDevServer({buildPackage:() => {}, startServer});
  assert.equal(serves, 1);
});
