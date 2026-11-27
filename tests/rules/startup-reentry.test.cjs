const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadedRuntime } = require('../support/game-runtime.cjs');

// The same public driver contract spans pre/post-DEV01 session composition.
const identity = 'typeof captureGameIdentity === "function" ? captureGameIdentity() : createGameSession()';
for (const [name, action, expected] of [
  ['dispose', 'driver.dispose()', 'disposed'],
  ['stop', 'driver.stop()', 'stopped'],
  ['replace player', 'player = getStartPlayer()', 'disposed'],
  ['stop and restart', 'driver.stop(); driver.start()', 'running'],
]) {
  test(`resume can ${name} without registering resources for the abandoned start`, t => {
    const r = loadedRuntime(); t.after(r.dispose);
    r.run(`gameRuntime.stop(); var handles = new Map(), bindings = new Set(), pending = [], next = 0, resumes = 0, ticks = 0, driver;
      driver = createGameRuntime({session:(${identity}), clock:{now:()=>123},
        scheduler:{setInterval(fn){const id=++next;handles.set(id,fn);pending.push(fn);return id;},clearInterval(id){handles.delete(id);}},
        listeners:[[{addEventListener(type,fn){bindings.add(fn);},removeEventListener(type,fn){bindings.delete(fn);}},'event',()=>ticks++]],
        resume(){if (++resumes === 1) {${action};}},tick(){ticks++;},refresh(){},autosave(){},onError(error){throw error;}});
      var started = driver.start();`);
    assert.equal(r.run('started'), false);
    assert.equal(r.run('driver.state'), expected);
    assert.equal(r.run('handles.size'), expected === 'running' ? 3 : 0);
    assert.equal(r.run('bindings.size'), expected === 'running' ? 1 : 0);
    if (name === 'stop') {
      assert.equal(r.run('driver.start()'), true);
      assert.equal(r.run('handles.size === 3 && bindings.size === 1'), true);
    }
    r.run('driver.dispose(); driver.dispose(); for (const fn of pending) fn();');
    assert.equal(r.run('handles.size === 0 && bindings.size === 0 && ticks === 0'), true);
  });
}

for (const port of ['clock','scheduler','listener']) {
  test(`disposal from the injected ${port} port leaves no post-disposal resources`, t => {
    const r = loadedRuntime(); t.after(r.dispose);
    r.run(`gameRuntime.stop(); var handles = new Set(), bindings = new Set(), next = 0, resumes = 0, driver;
      driver = createGameRuntime({session:(${identity}),
        clock:{now(){${port === 'clock' ? 'driver.dispose();' : ''}return 123;}},
        scheduler:{setInterval(){const id=++next;handles.add(id);${port === 'scheduler' ? 'driver.dispose();' : ''}return id;},clearInterval(id){handles.delete(id);}},
        listeners:[[{addEventListener(type,fn){bindings.add(fn);${port === 'listener' ? 'driver.dispose();' : ''}},removeEventListener(type,fn){bindings.delete(fn);}},'event',()=>{}]],
        resume(){resumes++;},tick(){},refresh(){},autosave(){},onError(error){throw error;}});
      var started = driver.start(); driver.dispose();`);
    assert.equal(r.run('started'), false);
    assert.equal(r.run('driver.state'), 'disposed');
    assert.equal(r.run('handles.size === 0 && bindings.size === 0'), true);
    if (port === 'clock') assert.equal(r.run('resumes'), 0);
  });
}
