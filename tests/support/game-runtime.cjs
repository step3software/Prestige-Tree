const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)]
  .map(match => match[1]).filter(source => !source.startsWith('http'));

/** Fresh real-script engine. Adapters model only browser I/O, never game rules. */
function createRuntime({ storage = {}, sources = {}, scriptOrder = scripts } = {}) {
  const data = new Map(Object.entries(storage));
  const intervals = new Map();
  const alerts = [];
  const callbacks = [];
  const listeners = new Map();
  function eventTarget(name) {
    return {
      addEventListener(type, fn) {
        const key = `${name}:${type}`;
        if (!listeners.has(key)) listeners.set(key, new Set());
        listeners.get(key).add(fn);
      },
      removeEventListener(type, fn) { listeners.get(`${name}:${type}`)?.delete(fn); },
    };
  }
  const clock = { now: 1700000000000 };
  const io = { prompt: null, confirm: false, storageError: false, readError: false, writes: 0, reloads: 0, clipboard: '' };
  const elements = Object.fromEntries(['styleStuff', 'save-status', 'save-recovery', 'save-original', 'app'].map(id => [id, { hidden: true, textContent: '', value: '' }]));
  let nextTimer = 0;
  class ControlledDate extends Date { static now() { return clock.now; } }
  function Vue() {}
  Vue.component = () => {};
  Vue.set = (object, key, value) => { object[key] = value; };
  const context = vm.createContext({
    console, Date: ControlledDate, Vue,
    document: {
      ...eventTarget("document"),
      body: { style: { setProperty() {} }, appendChild() {}, removeChild() {} },
      getElementById: id => elements[id] ?? null,
      createElement: () => ({ value: '', select() { io.clipboard = this.value; }, setSelectionRange() {} }),
      execCommand: () => true,
    },
    window: { ...eventTarget("window"), location: { reload() { io.reloads++; } } },
    localStorage: {
      getItem: key => {
        if (io.readError) throw new Error('Synthetic storage read denial');
        return data.get(key) ?? null;
      },
      setItem: (key, value) => {
        io.writes++;
        if (io.storageError) throw new Error('Synthetic storage quota failure');
        data.set(key, value);
      },
    },
    // Use Node's standards-compatible implementations, including malformed base64 rejection.
    atob, btoa,
    setInterval: (fn, ms) => { const id = ++nextTimer; intervals.set(id, { fn, ms }); callbacks.push({fn, ms, id}); return id; },
    clearInterval: id => intervals.delete(id),
    setTimeout: () => ++nextTimer, clearTimeout() {},
    prompt: () => io.prompt, confirm: () => io.confirm,
    alert: message => alerts.push(message),
  });
  for (const script of scriptOrder) {
    vm.runInContext(sources[script] ?? fs.readFileSync(path.join(root, script), 'utf8'), context, { filename: script });
  }
  const run = code => vm.runInContext(code, context, { timeout: 10000 });
  const fire = ms => {
    const timer = [...intervals.values()].find(item => item.ms === ms);
    timer?.fn();
  };
  return { run, fire, data, clock, io, alerts, elements, intervals, callbacks, listeners,
    emit: (target, type, event = {}) => { for (const fn of [...(listeners.get(`${target}:${type}`) ?? [])]) fn(event); },
    dispose: () => { run('if (typeof gameRuntime !== "undefined" && gameRuntime) gameRuntime.dispose();'); intervals.clear(); },
  };
}

function loadedRuntime(options) {
  const runtime = createRuntime(options);
  runtime.run('load();');
  return runtime;
}

module.exports = { createRuntime, loadedRuntime, root, scripts };
