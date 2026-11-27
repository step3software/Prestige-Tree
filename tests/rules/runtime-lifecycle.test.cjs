const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const { createHash } = require('node:crypto');
const { createRuntime, loadedRuntime, root, scripts } = require('../support/game-runtime.cjs');

const listenerCount = r => [...r.listeners.values()].reduce((sum, set) => sum + set.size, 0);
const callbacks = r => [...r.callbacks.map(item => item.fn), ...[...r.listeners.values()].flatMap(set => [...set])];
const prepareProgress = r => r.run('doReset("p"); buyUpg("p",11); updateTemp(); player.offTime = null;');

test('script evaluation owns no timers, runtime listeners or title effects; failed load stays inert', t => {
  const r = createRuntime({storage: {ptr:'!!!'}}); t.after(r.dispose);
  assert.equal(r.intervals.size, 0);
  assert.equal(listenerCount(r), 0);
  assert.equal(r.run('document.title === undefined && document.onkeydown === undefined && document.onkeyup === undefined'), true);
  assert.equal(r.run('load()'), false);
  assert.equal(r.intervals.size, 0);
  assert.equal(listenerCount(r), 0);
  assert.equal(r.io.writes, 0);
  for (const page of ['index.html','demo.html']) {
    const html = fs.readFileSync(path.join(root,page),'utf8');
    assert.ok(html.includes('src="js/game-runtime.js"'));
    assert.ok(html.includes('onload="load()"'));
  }
});

test('explicit elapsed advancement replays real rules without clock, DOM, storage, timers or dialogs', t => {
  const results = [];
  for (let repeat = 0; repeat < 2; repeat++) {
    const r = loadedRuntime(); t.after(r.dispose); prepareProgress(r);
    r.run(`gameRuntime.stop(); var session = createGameSession();
      Date.now = () => { throw new Error('clock'); };
      document = localStorage = new Proxy({}, {get() {throw new Error('I/O');}});
      alert = prompt = confirm = setInterval = setTimeout = () => {throw new Error('effect');};
      for (let seconds of [0, 0.05, 1, 2]) advanceGame(session, seconds);
      player.points = new Decimal(40); updateTemp(); doReset('p');
      advanceGame(session, 1);`);
    assert.equal(r.run('player.points.eq(1) && player.p.upgrades.includes(11) && player.p.points.gte(2)'), true);
    assert.equal(r.run('ticking'), false);
    assert.equal(r.intervals.size, 0);
    results.push(r.run('JSON.stringify(player)'));
  }
  assert.equal(results[0], results[1]);
});

test('elapsed argument and session identity are validated before mutation', t => {
  const r = loadedRuntime(); t.after(r.dispose); prepareProgress(r);
  r.run('gameRuntime.stop(); var session = createGameSession();');
  const before = r.run('JSON.stringify(player)');
  for (const elapsed of ['NaN','Infinity','-1','"1"']) assert.throws(() => r.run(`advanceGame(session, ${elapsed})`), /elapsed seconds/);
  r.run('session.disposed = true;');
  assert.throws(() => r.run('advanceGame(session, 1)'), /Superseded/);
  assert.equal(r.run('JSON.stringify(player)'), before);
});

test('a direct advancement failure propagates without I/O while latching save protection', t => {
  const r = loadedRuntime(); t.after(r.dispose); prepareProgress(r);
  r.run('save(); gameRuntime.stop(); var session = createGameSession(); gameLoop = () => { player.points = new Decimal(999); throw new Error("direct failure"); };');
  const original = r.data.get('ptr');
  assert.throws(() => r.run('advanceGame(session, 1)'), /direct failure/);
  assert.equal(r.run('tickFaulted && !ticking'), true);
  assert.equal(r.alerts.length, 0);
  assert.equal(r.run('save()'), false);
  assert.equal(r.run('startGameRuntime()'), false);
  assert.equal(r.data.get('ptr'), original);
});

test('start/stop/dispose are idempotent and queued timers/listeners are fenced across restart', t => {
  const r = loadedRuntime(); t.after(r.dispose); prepareProgress(r);
  assert.equal(r.intervals.size, 3); assert.equal(listenerCount(r), 5);
  r.run('startGameRuntime(); gameRuntime.start(); gameRuntime.start();');
  assert.equal(r.intervals.size, 3); assert.equal(listenerCount(r), 5);
  const stale = callbacks(r);
  r.run('minusHeld = true; onFocused = true; gameRuntime.stop(); gameRuntime.stop();');
  assert.equal(r.intervals.size, 0); assert.equal(listenerCount(r), 0);
  assert.equal(r.run('minusHeld'), false);
  assert.equal(r.run('onFocused'), true, 'Stopping must retain the current input focus context');
  r.clock.now += 1000;
  const stopped = r.run('JSON.stringify(player)');
  for (const fn of stale) fn({key:'p'});
  assert.equal(r.run('JSON.stringify(player)'), stopped); assert.equal(r.io.writes, 0);
  assert.equal(r.run('gameRuntime.start()'), true);
  assert.equal(r.intervals.size, 3); assert.equal(listenerCount(r), 5);
  const restarted = r.run('JSON.stringify(player)');
  for (const fn of stale) fn({key:'p'});
  assert.equal(r.run('JSON.stringify(player)'), restarted);
  r.fire(50);
  assert.equal(r.run('player.points.eq(0.1) && player.offTime.remain === 0.9'), true);
  const pending = callbacks(r);
  r.run('gameRuntime.dispose(); gameRuntime.dispose();');
  const disposed = r.run('JSON.stringify(player)');
  for (const fn of pending) fn({key:'p'});
  assert.equal(r.run('gameRuntime.start()'), false);
  assert.equal(r.run('JSON.stringify(player)'), disposed);
  assert.equal(r.intervals.size, 0); assert.equal(listenerCount(r), 0);
});

test('reload, successful import and direct replacement supersede every old callback', t => {
  for (const operation of ['save(); load();', 'importSave(btoa(JSON.stringify({points:"123"})));', 'player = getStartPlayer();']) {
    const r = loadedRuntime(); t.after(r.dispose); prepareProgress(r);
    const stale = callbacks(r);
    r.run(`var originalRuntime = gameRuntime; ${operation}`);
    const before = r.run('JSON.stringify(player)'); const writes = r.io.writes;
    r.clock.now += 1000;
    for (const fn of stale) fn({key:'p'});
    assert.equal(r.run('JSON.stringify(player)'), before);
    assert.equal(r.io.writes, writes);
    assert.equal(r.run('originalRuntime.state'), 'disposed');
    assert.equal(r.intervals.size, operation.includes('load()') ? 3 : 0);
  }
});

test('backwards clock keeps a high-water mark across tick and restart without duplicate time', t => {
  const r = loadedRuntime(); t.after(r.dispose); prepareProgress(r);
  r.clock.now += 1000; r.fire(50);
  const earned = r.run('player.points.toNumber()');
  r.clock.now -= 1000; r.fire(50);
  r.run('gameRuntime.stop(); gameRuntime.start();');
  r.clock.now += 1000; r.fire(50);
  assert.equal(r.run('player.points.toNumber()'), earned);
  r.clock.now += 1000; r.fire(50);
  assert.equal(r.run('player.points.toNumber()'), earned + 1);
});

test('restart banks stopped seconds once, caps existing bank, and respects disabled offline production', t => {
  for (const [seconds, enabled, bank] of [[0,true,0],[1,true,1],[3599,true,3599],[3600,true,3600],[7200,true,3600],[7200,false,0]]) {
    const r = loadedRuntime(); t.after(r.dispose); prepareProgress(r);
    r.run(`player.offlineProd = ${enabled}; gameRuntime.stop();`);
    r.clock.now += seconds * 1000;
    r.run('gameRuntime.start(); gameRuntime.start();');
    assert.equal(r.run('player.offTime ? player.offTime.remain : 0'), bank);
    r.fire(50); r.fire(50);
    assert.ok(Math.abs(r.run('player.points.toNumber() + (player.offTime ? player.offTime.remain : 0)') - bank) < 1e-9);
  }
});

for (const [name, injection, milliseconds] of [
  ['calculation','gameLoop = () => {player.points = new Decimal(999); throw new Error("calculation");}',50],
  ['derived state','updateTemp = () => {throw new Error("derived");}',50],
  ['render','needCanvasUpdate = true; resizeCanvas = () => {throw new Error("render");}',50],
  ['invalid player number','gameLoop = () => {player.points = new Decimal(NaN);}',50],
  ['invalid derived number','layers.p.effect = () => NaN;',50],
  ['autosave callback','save = () => {throw new Error("save callback");}',5000],
]) {
  test(`${name} exception stops all callbacks, clears guard and protects durable progress until real reload`, t => {
    const r = loadedRuntime(); t.after(r.dispose); prepareProgress(r);
    r.run('save(); var originalSave = save;'); const durable = r.data.get('ptr'); const stale = callbacks(r);
    r.run(injection); r.clock.now += 1000;
    assert.doesNotThrow(() => r.fire(milliseconds));
    assert.equal(r.run('gameRuntime.state'), 'error');
    assert.equal(r.run('tickFaulted && !ticking'), true);
    assert.equal(r.intervals.size, 0); assert.equal(listenerCount(r), 0);
    assert.match(r.alerts[0], /reload/i);
    assert.match(r.elements['save-status'].textContent, /reload/i);
    const after = r.run('JSON.stringify(player)');
    for (const fn of stale) fn({key:'p'});
    assert.equal(r.run('gameRuntime.start()'), false);
    assert.equal(r.run('load()'), false);
    r.run('save = originalSave; setLocalStorage(); importSave("invalid");');
    assert.equal(r.run('JSON.stringify(player)'), after);
    assert.equal(r.data.get('ptr'), durable);
    const reload = loadedRuntime({storage:{ptr:durable}}); t.after(reload.dispose);
    assert.equal(reload.run('gameRuntime.state'), 'running');
    assert.equal(reload.run('tickFaulted'), false);
    reload.clock.now += 1000; reload.fire(50);
    assert.equal(reload.run('player.points.eq(1)'), true);
  });
}

test('partial startup resource failure cleans acquired timers and listeners', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run(`gameRuntime.dispose(); var scheduled = 0;
    gameRuntime = createGameRuntime({session:createGameSession(),clock:{now:()=>123},
      scheduler:{setInterval:(fn,ms)=>{if (++scheduled === 2) throw new Error('scheduler'); return setInterval(fn,ms);},clearInterval},
      resume:()=>{}, tick:()=>{}, refresh:()=>{}, autosave:()=>{}, onError:reportRuntimeFault});`);
  assert.equal(r.run('gameRuntime.start()'), false);
  assert.equal(r.run('gameRuntime.state'), 'error'); assert.equal(r.intervals.size,0);
  assert.equal(listenerCount(r),0); assert.equal(r.run('tickFaulted'), true);
});

test('input and refresh errors use the same lifecycle fault boundary; reporting failure cannot resume it', t => {
  for (const event of ['input','refresh']) {
    const r = loadedRuntime(); t.after(r.dispose);
    r.run(`gameRuntime.dispose(); gameRuntime = createGameRuntime({session:createGameSession(),clock:{now:()=>123},
      scheduler:{setInterval,clearInterval},resume:()=>{},tick:()=>{},autosave:()=>{},
      refresh:()=>{throw new Error('refresh');}, listeners:[[document,'keydown',()=>{throw new Error('input');}]],
      onError:()=>{reportRuntimeFault(); throw new Error('report');}}); gameRuntime.start();`);
    if (event === 'input') r.emit('document','keydown',{}); else r.fire(500);
    assert.equal(r.run('gameRuntime.state'), 'error'); assert.equal(r.intervals.size,0); assert.equal(listenerCount(r),0);
    assert.equal(r.run('gameRuntime.start()'),false);
  }
});

test('load initialization exception starts no runtime or unsafe autosave and supports reload recovery', t => {
  const r = createRuntime(); t.after(r.dispose);
  r.run('changeTheme = () => {throw new Error("startup render");};');
  assert.equal(r.run('load()'),false);
  assert.equal(r.run('tickFaulted && !ticking'),true);
  assert.equal(r.intervals.size,0); assert.equal(listenerCount(r),0);
  assert.equal(r.run('save()'),false); assert.equal(r.io.writes,0);
});

test('independent contexts retain separate lifecycle, clock and save ownership', t => {
  const a = loadedRuntime(); const b = loadedRuntime(); t.after(a.dispose); t.after(b.dispose);
  prepareProgress(a); prepareProgress(b);
  a.run('gameRuntime.stop();'); b.clock.now += 1000; b.fire(50); b.fire(5000);
  assert.equal(a.run('player.points.eq(0)'),true); assert.equal(a.data.size,0); assert.equal(a.intervals.size,0);
  assert.equal(b.run('player.points.eq(1)'),true); assert.equal(b.data.size,1); assert.equal(b.intervals.size,3);
});

const parent = '199b14e622f2fdf7c2d1d2363874b0e38744121a';
const beforeSources = Object.fromEntries(scripts.map(file => [file, file === 'js/game-runtime.js' ? ''
  : execFileSync('git',['show',`${parent}:${file}`],{cwd:root,encoding:'utf8'})]));
for (const scenario of ['progression-reset','offline-return','huge-decimals']) {
  test(`before/after ${scenario} preserves complete player state for the same ordered actions/time`, t => {
    const outcomes = [];
    for (const sources of [beforeSources,{}]) {
      const r = loadedRuntime({sources}); t.after(r.dispose);
      prepareProgress(r);
      if (scenario === 'huge-decimals') {
        const fixture = require('../fixtures/representative-save.json');
        r.run(`importSave(btoa(${JSON.stringify(JSON.stringify(fixture))})); load();`);
      }
      if (scenario === 'offline-return') {
        r.run('save();'); r.clock.now += 7200 * 1000; r.run('load();');
      }
      const checkpoints = [];
      for (const seconds of [0,0.05,1,2]) {
        r.clock.now += seconds * 1000; r.fire(50);
        checkpoints.push(r.run('JSON.stringify(player)'));
      }
      if (scenario === 'progression-reset') {
        r.run('player.points = new Decimal(40); updateTemp(); doReset("p"); player.devSpeed = 2;');
        r.clock.now += 1000; r.fire(50);
        checkpoints.push(r.run('JSON.stringify(player)'));
      }
      outcomes.push(checkpoints);
    }
    assert.deepEqual(outcomes[1],outcomes[0]);
    const last = JSON.parse(outcomes[1].at(-1));
    t.diagnostic(JSON.stringify({scenario, checkpoints:outcomes[1].length,
      identicalPlayerSnapshotsSha256:createHash('sha256').update(JSON.stringify(outcomes[1])).digest('hex'),
      final:{points:last.points,prestige:last.p.points,upgrades:last.p.upgrades,timePlayed:last.timePlayed,
        offline:last.offTime,devSpeed:last.devSpeed,autosave:last.autosave,offlineProd:last.offlineProd}}));
  });
}
