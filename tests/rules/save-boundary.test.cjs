const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { createRuntime, loadedRuntime, root, scripts } = require('../support/game-runtime.cjs');
const historical = require('../fixtures/historical-saves.json');
const representative = require('../fixtures/representative-save.json');

function encoded(value) { return btoa(JSON.stringify(value)); }
function snapshot(r) {
  r.run('var retainedPlayer = player; var retainedCollection = allSaves;');
  return r.data.get('ptr');
}
function preserved(r, before) {
  assert.equal(r.run('player === retainedPlayer && allSaves === retainedCollection && allSaves[allSaves.set] === player'), true);
  assert.equal(r.data.get('ptr'), before);
  assert.equal(r.io.reloads, 0);
}

test('codec is detached and pure with explicit defaults and no runtime I/O', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run(`var codec = saveCodec(123); var input = ${JSON.stringify(representative)};
    Object.freeze(input.p); Object.freeze(input); var original = JSON.stringify(input);
    var retainedPlayer = player; var retainedCollection = allSaves;
    Date.now = () => { throw new Error('clock effect'); };
    localStorage = new Proxy({}, {get() {throw new Error('storage effect');}});
    document = new Proxy({}, {get() {throw new Error('DOM effect');}});
    prompt = confirm = alert = setInterval = setTimeout = () => {throw new Error('UI/timer effect');};
    var decoded = codec.decodePlayer(input);
    var encoded = codec.encodePlayer(decoded.value);
    var roundTrip = codec.decodePlayer(encoded.text);`);
  assert.equal(r.run('decoded.ok && encoded.ok && roundTrip.ok'), true);
  assert.equal(r.run('JSON.stringify(input) === original && player === retainedPlayer && allSaves === retainedCollection'), true);
  assert.equal(r.run('roundTrip.value.points instanceof Decimal && roundTrip.value.points.eq("ee1000") && roundTrip.value.c.assigned[0].eq("1e1000")'), true);
  assert.equal(r.data.size, 0);
});

test('all normal durable methods are owned by the single storage adapter and wired on both pages', () => {
  const js = scripts.filter(file => file !== 'js/technical/break_eternity.js');
  const callers = js.filter(file => /\.(getItem|setItem|removeItem|clear)\(/.test(fs.readFileSync(path.join(root, file), 'utf8')));
  assert.deepEqual(callers, ['js/save-storage.js']);
  for (const page of ['index.html', 'demo.html']) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.ok(html.indexOf('js/save-codec.js') < html.indexOf('js/save-storage.js'));
    assert.ok(html.indexOf('js/save-storage.js') < html.indexOf('js/saves.js'));
  }
});

for (const fixture of historical.players) {
  test(`historical ${fixture.layout} version ${fixture.version} converts once, retains values and uses the current path`, t => {
    const source = fixture.layout === 'collection'
      ? {set: 'chosen', chosen: fixture.data, sibling: {points: '123', versionType: 'ptr'}} : fixture.data;
    const r = loadedRuntime({storage: {ptr: encoded(source)}}); t.after(r.dispose);
    assert.equal(r.run('player.points.eq("1e1000") && player.version === VERSION.num && allSaves[allSaves.set] === player'), true);
    if (fixture.version === '0.1') assert.equal(r.run('player.p.upgrades.includes(11) && player.c.assigned[0] instanceof Decimal && player.c.assigned[0].eq("1e500")'), true);
    if (fixture.version === '1.0') assert.equal(r.run('player.b.milestones.includes(0)'), true);
    if (fixture.version === '1.1') assert.equal(r.run('player.h.challenges[11] === 1 && player.h.activeChallenge === 11'), true);
    if (fixture.version === 1.2) assert.equal(r.run('player.ge.clickables[11].eq(0) && player.ge.clickables[12].eq(0) && player.ge.clickables[13].eq(0)'), true);
    if (fixture.version === '1.3') assert.equal(r.run('player.ma.mastered[0] === "p" && player.ma.current === "b"'), true);
    const migrated = r.data.get('ptr');
    const collection = JSON.parse(atob(migrated));
    assert.equal(collection[collection.set].version, '1.3');
    assert.equal(r.io.writes, 1);
    const again = loadedRuntime({storage: {ptr: migrated}}); t.after(again.dispose);
    assert.equal(again.io.writes, 0, 'Canonical reload must not rerun conversion writes');
    assert.equal(again.run('player.points.eq("1e1000") && allSaves[allSaves.set] === player'), true);
    if (fixture.layout === 'collection') assert.equal(again.run('allSaves.set === "chosen" && allSaves.sibling.points.eq(123)'), true);
  });
}

test('interrupted conversion retains original, blocks ticking/writes and retries without duplicating saves', t => {
  const original = encoded(historical.players[0].data);
  const r = createRuntime({storage: {ptr: original}}); t.after(r.dispose);
  r.io.storageError = true;
  assert.equal(r.run('load()'), false);
  assert.equal(r.data.get('ptr'), original);
  assert.equal(r.run('player === undefined && allSaves === undefined && saveRecovery.required'), true);
  assert.equal(r.elements['save-original'].value, original);
  assert.match(r.elements['save-status'].textContent, /full|blocked/i);
  const attempts = r.io.writes;
  r.fire(50); r.fire(5000);
  assert.equal(r.io.writes, attempts);
  r.io.storageError = false;
  assert.equal(r.run('load()'), true);
  assert.equal(r.run('player.points.eq("1e1000") && Object.keys(allSaves).length === 2'), true);
  assert.equal(r.elements['save-recovery'].hidden, true);
  assert.equal(r.elements.app.hidden, false);
  assert.notEqual(r.data.get('ptr'), original);
});

for (const original of ['!!!', encoded({set:'gone', save1:{points:'123'}}), encoded({points:'123',version:'99'}), encoded({points:'123',sp:{points:'100'}}), encoded({points:'123',h:{challenges:[]}})]) {
  test(`corrupt or unsupported startup preserves original ${original.slice(0, 16)}`, t => {
    const r = createRuntime({storage: {ptr: original}}); t.after(r.dispose);
    assert.equal(r.run('load()'), false);
    r.fire(50); r.fire(5000);
    assert.equal(r.data.get('ptr'), original);
    assert.equal(r.io.writes, 0);
    assert.equal(r.run('player === undefined && saveRecovery.required'), true);
    assert.equal(r.elements['save-original'].value, original);
  });
}

test('storage read denial preserves data and cannot be bypassed by ordinary save or recovery import', t => {
  const original = encoded(historical.players[0].data);
  const r = createRuntime({storage:{ptr:original}}); t.after(r.dispose);
  r.io.readError = true;
  assert.equal(r.run('load()'), false);
  assert.equal(r.run('save()'), false);
  assert.equal(r.run('importSave(btoa(JSON.stringify({points:"321"})))'), false);
  assert.equal(r.data.get('ptr'), original);
  assert.equal(r.io.writes, 0);
  r.io.readError = false;
  assert.equal(r.run('load()'), true);
  assert.equal(r.run('player.points.eq("1e1000")'), true);
});

for (const operation of ['save()', 'setLocalStorage()', 'loadSave("second")', 'newSave()', 'renameSave("save1")', 'renameSave("second")', 'deleteSave("save1")', 'deleteSave("second")', 'moveSave("second", -1)', 'hardReset()']) {
  test(`failed ${operation} retains active/durable data and selection, then can be retried`, t => {
    const r = loadedRuntime(); t.after(r.dispose);
    r.run('player.points = new Decimal(123); allSaves.second = getStartPlayer(); allSaves.second.points = new Decimal(456); save();');
    const before = snapshot(r);
    r.io.prompt = 'renamed'; r.io.confirm = true; r.io.storageError = true;
    assert.equal(r.run(operation), false);
    preserved(r, before);
    assert.equal(r.run('player.points.eq(123) && allSaves.set === "save1"'), true);
    assert.equal(r.run('saveStatus.state'), 'error');
    assert.match(r.elements['save-status'].textContent, /unsaved|unchanged/i);
    r.io.storageError = false;
    assert.equal(r.run(operation), true);
    assert.equal(r.run('saveStatus.state'), 'saved');
    assert.equal(r.run('allSaves[allSaves.set] === player'), true);
    const reload = loadedRuntime({storage:Object.fromEntries(r.data)}); t.after(reload.dispose);
    assert.equal(reload.run('saveRecovery.required'), false);
  });
}

test('ordinary manual/autosave failure retains newer active progress and prior durable snapshot, then saves on retry', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run('save(); player.points = new Decimal(777);');
  const before = snapshot(r);
  r.io.storageError = true;
  r.fire(5000);
  preserved(r, before);
  assert.equal(r.run('player.points.eq(777) && saveStatus.state === "error"'), true);
  r.io.storageError = false;
  r.fire(5000);
  assert.equal(JSON.parse(atob(r.data.get('ptr'))).save1.points, '777');
  assert.equal(r.run('player === retainedPlayer && saveStatus.state === "saved"'), true);
});

test('Options, Info and Help navigation state remains serializable through real tab callers', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  for (const tab of ['options','info','help']) {
    r.run(`showTab(${JSON.stringify(tab)});`);
    assert.equal(r.run('save()'), true);
    assert.equal(JSON.parse(atob(r.data.get('ptr'))).save1.tab, tab);
  }
});

const invalid = [
  {p:null}, {p:{upgrades:[999]}}, {h:{challenges:{11:-1}}}, {h:{activeChallenge:999}},
  {ma:{mastered:['unknown']}}, {ma:{current:'unknown'}}, {c:{assigned:['oops']}},
  {devSpeed:{}}, {notify:{p:{}}}, {subtabs:{ma:null}}, {version:'99'}, {theme:{}},
  {infoboxes:{p:null}}, {p:{buyables:{999:'2'}}}, {tmp:{points:'100'}}, {p:{tmp:{points:'100'}}},
];
for (const [index, fields] of invalid.entries()) {
  test(`malformed candidate ${index + 1} cannot overwrite the previous save`, t => {
    const r = loadedRuntime(); t.after(r.dispose);
    r.run('save();'); const before = snapshot(r);
    const writes = r.io.writes;
    assert.equal(r.run(`importSave(${JSON.stringify(encoded({points:'123',...fields}))})`), false);
    preserved(r, before);
    assert.equal(r.io.writes, writes);
  });
}

test('failed active validation and non-data values never reach storage', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run('save();'); const original = r.data.get('ptr'); const writes = r.io.writes;
  for (const change of ['player.p = null', 'player = getStartPlayer(); player.points = new Decimal(NaN)', 'player = getStartPlayer(); player.callback = () => 1', 'player = getStartPlayer(); player.tmp = document', 'player = getStartPlayer(); player.extra = player']) {
    r.run(change);
    assert.equal(r.run('save()'), false);
    assert.equal(r.data.get('ptr'), original);
    assert.equal(r.io.writes, writes);
  }
});

test('engine-added layer data retains Decimal totals, time and unlock order with typed boundaries', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  assert.equal(r.run('importSave(btoa(JSON.stringify({points:"100",a:{best:"1e500",total:"1e600",timePlayed:123},b:{unlockOrder:2}})))'), true);
  assert.equal(r.run('player.a.best instanceof Decimal && player.a.best.eq("1e500") && player.a.total.eq("1e600") && player.a.timePlayed === 123 && player.b.unlockOrder === 2'), true);
});

test('numeric configured versions use the same canonical string model as the game and shared demo caller', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run('VERSION.num = 1.3;');
  assert.equal(r.run('save()'), true);
  assert.equal(JSON.parse(atob(r.data.get('ptr'))).save1.version, '1.3');
  assert.equal(r.run('saveCodec().decodeCollection(saveCodec().encodeCollection(allSaves).text).ok'), true);
});

test('repeated valid imports preserve siblings, use one atomic write each and cancel/deny safely', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run('allSaves.second = getStartPlayer(); allSaves.second.points = new Decimal(999); save();');
  let writes = r.io.writes;
  for (let count = 0; count < 2; count++) {
    assert.equal(r.run('importSave(btoa(JSON.stringify({points:"123"})))'), true);
    assert.equal(r.io.writes, ++writes);
    assert.equal(r.run('allSaves.second.points.eq(999) && player.points.eq(123) && allSaves[allSaves.set] === player'), true);
  }
  const before = r.data.get('ptr');
  assert.equal(r.run('importSave()'), false);
  assert.equal(r.run('importSave(btoa(JSON.stringify({points:"456",versionType:"other"})))'), false);
  assert.equal(r.data.get('ptr'), before);
});

test('menu reorder/rename/inactive deletion refresh canonical state without losing active changes', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run('allSaves.second = getStartPlayer(); allSaves.third = getStartPlayer(); player.points = new Decimal(123); save(); moveSave("third", -1);');
  assert.deepEqual(Array.from(r.run('Object.keys(allSaves)')), ['set','save1','third','second']);
  r.io.prompt = 'renamed'; r.run('renameSave("third");');
  assert.deepEqual(Array.from(r.run('Object.keys(allSaves)')), ['set','save1','renamed','second']);
  r.io.confirm = true; r.run('deleteSave("second");');
  assert.equal(r.run('player.points.eq(123) && allSaves.set === "save1" && allSaves.second === undefined && allSaves[allSaves.set] === player'), true);
});

test('clipboard denial or failure reports export failure and permits retry without affecting saves', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run('save(); var copyCommand = document.execCommand;');
  const before = snapshot(r);
  for (const implementation of ['() => false', '() => {throw new Error("Synthetic clipboard denial")}']) {
    r.run(`document.execCommand = ${implementation};`);
    assert.equal(r.run('exportSave()'), false);
    assert.equal(r.run('saveStatus.state'), 'error');
    preserved(r,before);
  }
  r.run('document.execCommand = copyCommand;');
  assert.equal(r.run('exportSave()'), true);
  assert.equal(JSON.parse(atob(r.io.clipboard)).points, '10');
});
