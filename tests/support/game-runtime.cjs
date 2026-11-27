const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)]
  .map(match => match[1]).filter(source => !source.startsWith('http'));

/** Fresh real-script engine. Adapters model only browser I/O, never game rules. */
function createRuntime({ storage = {}, sources = {} } = {}) {
  const data = new Map(Object.entries(storage));
  const intervals = new Map();
  const alerts = [];
  const clock = { now: 1700000000000 };
  const io = { prompt: null, confirm: false, storageError: false, reloads: 0, clipboard: '' };
  let nextTimer = 0;
  class ControlledDate extends Date { static now() { return clock.now; } }
  function Vue() {}
  Vue.component = () => {};
  Vue.set = (object, key, value) => { object[key] = value; };
  const context = vm.createContext({
    console, Date: ControlledDate, Vue,
    document: {
      body: { style: { setProperty() {} }, appendChild() {}, removeChild() {} },
      getElementById: id => id === 'styleStuff' ? {} : null,
      createElement: () => ({ value: '', select() { io.clipboard = this.value; }, setSelectionRange() {} }),
      execCommand: () => true,
    },
    window: { addEventListener() {}, location: { reload() { io.reloads++; } } },
    localStorage: {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => {
        if (io.storageError) throw new Error('Synthetic storage quota failure');
        data.set(key, value);
      },
    },
    // Use Node's standards-compatible implementations, including malformed base64 rejection.
    atob, btoa,
    setInterval: (fn, ms) => { const id = ++nextTimer; intervals.set(id, { fn, ms }); return id; },
    clearInterval: id => intervals.delete(id),
    setTimeout: () => ++nextTimer, clearTimeout() {},
    prompt: () => io.prompt, confirm: () => io.confirm,
    alert: message => alerts.push(message),
  });
  for (const script of scripts) {
    vm.runInContext(sources[script] ?? fs.readFileSync(path.join(root, script), 'utf8'), context, { filename: script });
  }
  const run = code => vm.runInContext(code, context, { timeout: 10000 });
  const fire = ms => {
    const timer = [...intervals.values()].find(item => item.ms === ms);
    if (!timer) throw new Error(`No ${ms}ms timer registered`);
    timer.fn();
  };
  return { run, fire, data, clock, io, alerts, dispose: () => intervals.clear() };
}

function loadedRuntime(options) {
  const runtime = createRuntime(options);
  runtime.run('load();');
  return runtime;
}

module.exports = { createRuntime, loadedRuntime, root, scripts };
