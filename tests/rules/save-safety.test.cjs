const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadedRuntime } = require('../support/game-runtime.cjs');

const invalid = [
  '!!!', btoa('{'), btoa('null'), btoa('[]'), btoa('42'),
  btoa('{"versionType":"ptr","p":null}'),
  btoa('{"p":{"upgrades":{}}}'), btoa('{"p":{"upgrades":[{}]}}'),
  btoa('{"p":{"buyables":[]}}'), btoa('{"points":"NaN"}'),
  btoa('{"points":{}}'), btoa('{"subtabs":{"ma":null}}'),
  btoa('{"offTime":{"remain":"oops"}}'),
  btoa('{"p":{"__proto__":{"polluted":true}}}'),
  btoa('{"devSpeed":{}}'), btoa('{"h":{"activeChallenge":{}}}'),
];
for (const [index, input] of invalid.entries()) {
  // Present-field shape checks use a valid root, so a root check cannot mask them.
  let encoded = input;
  try {
    const parsed = JSON.parse(atob(input));
    if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') encoded = btoa(JSON.stringify({points:'10', ...parsed}));
  } catch {}
  test(`F1 invalid import ${index + 1} preserves active and durable valid progress through autosave`, t => {
    const r = loadedRuntime(); t.after(r.dispose);
    r.run('doReset("p"); buyUpg("p",11); updateTemp(); save(); var originalPlayer=player;');
    const before = r.data.get('ptr');
    r.run(`importSave(${JSON.stringify(encoded)});`);
    assert.equal(r.run('player === originalPlayer && hasUpgrade("p",11)'), true);
    assert.equal(r.data.get('ptr'), before);
    assert.equal(r.io.reloads, 0);
    assert.equal(r.alerts.length, 1);
    assert.match(r.alerts[0], /import|save/i);
    r.fire(50); r.fire(5000);
    assert.equal(r.run('ticking'), false);
    assert.equal(JSON.parse(atob(r.data.get('ptr'))).save1.p.upgrades[0], 11);
  });
}

test('F1 storage-write failure preserves active player and durable saves and permits retry', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run('save(); var originalPlayer=player;');
  const before = r.data.get('ptr');
  r.io.storageError = true;
  r.run('importSave(btoa(JSON.stringify({points:"1000",versionType:"ptr"})));');
  assert.equal(r.run('player === originalPlayer'), true);
  assert.equal(r.data.get('ptr'), before);
  assert.equal(r.io.reloads, 0);
  assert.equal(r.alerts.length, 1);
  r.io.storageError = false;
  r.fire(5000);
  assert.equal(r.data.get('ptr'), before);
  r.run('importSave(btoa(JSON.stringify({points:"1000",versionType:"ptr"})));');
  assert.equal(r.io.reloads, 1);
  const reload = loadedRuntime({storage: Object.fromEntries(r.data)}); t.after(reload.dispose);
  assert.equal(reload.run('player.points.eq(1000)'), true);
});

test('import cancellation and foreign-mod denial leave selection and contents unchanged', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run('save(); var originalPlayer=player;');
  const before = r.data.get('ptr');
  r.run('importSave(); importSave(btoa(JSON.stringify({versionType:"other",points:"1000"})));');
  assert.equal(r.run('player === originalPlayer'), true);
  assert.equal(r.data.get('ptr'), before);
  assert.equal(r.alerts.length, 0);
  assert.equal(r.io.reloads, 0);
  r.io.confirm = true;
  r.run('importSave(btoa(JSON.stringify({versionType:"other",points:"1000"})));');
  assert.equal(r.run('player.points.eq(1000) && player.versionType === "ptr"'), true);
});

test('F1 a failed tick clears its guard and latches mutations/autosave until reload', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run('save(); gameLoop = function() { player.points = new Decimal(999); throw new Error("Synthetic loop failure"); };');
  const before = r.data.get('ptr');
  assert.doesNotThrow(() => r.fire(50));
  assert.equal(r.run('ticking'), false);
  assert.equal(r.run('tickFaulted'), true);
  assert.match(r.alerts[0], /reload/i);
  r.run('var pointsAfterFailure = player.points;');
  r.fire(50); r.fire(5000);
  assert.equal(r.run('player.points === pointsAfterFailure'), true);
  assert.equal(r.data.get('ptr'), before);
  r.run('save();'); // Manual save cannot persist partially mutated tick state either.
  assert.equal(r.data.get('ptr'), before);
  r.run('setLocalStorage(); loadSave("save1");');
  assert.equal(r.data.get('ptr'), before);
  r.run('importSave(btoa(JSON.stringify({versionType:"ptr", points:"123"})));');
  assert.equal(r.data.get('ptr'), before);
  assert.match(r.alerts.at(-1), /reload/i);
});

for (const operation of ['newSave()', 'renameSave("save1")']) {
  test(`F3 cancelled ${operation} leaves active selection and save contents unchanged`, t => {
    const r = loadedRuntime(); t.after(r.dispose);
    r.run('save(); var beforePlayer=player;');
    const before = r.data.get('ptr');
    assert.doesNotThrow(() => r.run(operation));
    assert.equal(r.data.get('ptr'), before);
    assert.equal(r.run('player === beforePlayer && allSaves.set === "save1" && Object.keys(allSaves).length === 2'), true);
    assert.equal(r.io.reloads, 0);
  });
  for (const name of ['', '   ', '!!!', 'set', 'save1', 'constructor', 'x'.repeat(21)]) {
    test(`${operation} rejects invalid or reserved name ${JSON.stringify(name)} without a partial save`, t => {
      const r = loadedRuntime(); t.after(r.dispose);
      r.run('save();'); const before = r.data.get('ptr');
      r.io.prompt = name;
      r.run(operation);
      assert.equal(r.data.get('ptr'), before);
      assert.equal(r.run('allSaves.set === "save1" && Object.keys(allSaves).length === 2'), true);
      assert.equal(r.io.reloads, 0);
      assert.equal(r.alerts.length, 1);
    });
  }
}

test('valid creation, rename and selection survive reload while retaining the original save', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run('player.points = new Decimal(123); save();');
  r.io.prompt = 'second'; r.run('newSave();');
  const created = loadedRuntime({storage: Object.fromEntries(r.data)}); t.after(created.dispose);
  assert.equal(created.run('allSaves.set === "second" && player.points.eq(10) && new Decimal(allSaves.save1.points).eq(123)'), true);
  created.io.prompt = 'renamed'; created.run('renameSave("second");');
  const renamed = loadedRuntime({storage: Object.fromEntries(created.data)}); t.after(renamed.dispose);
  assert.equal(renamed.run('allSaves.set === "renamed" && allSaves.second === undefined && player.points.eq(10)'), true);
  renamed.run('loadSave("save1");');
  const selected = loadedRuntime({storage: Object.fromEntries(renamed.data)}); t.after(selected.dispose);
  assert.equal(selected.run('allSaves.set === "save1" && player.points.eq(123)'), true);
});
