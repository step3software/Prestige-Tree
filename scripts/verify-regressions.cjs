const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { historicalSources } = require('../tests/support/historical-sources.cjs');
const { loadedRuntime, root } = require('../tests/support/game-runtime.cjs');
const baseline = '077861d2d4479d77e6079fd5c8bdf5e4fe7821f8';

const checks = {
  F1(r) {
    r.run('save(); var originalPlayer=player;');
    const before = r.data.get('ptr');
    r.run('importSave(btoa(JSON.stringify({versionType:"ptr",points:"10",p:null})));');
    assert.equal(r.run('player === originalPlayer'), true, 'Rejected import replaced active progress');
    assert.equal(r.data.get('ptr'), before, 'Rejected import replaced durable progress');
    r.fire(50); r.fire(5000);
    assert.equal(r.run('player.p !== null && ticking === false'), true);
  },
  F2(r) {
    r.run('player.offTime={remain:7200};'); r.fire(50);
    assert.equal(r.run('player.offTime.remain'), 3240, 'One-hour bank must cap to 3600 seconds before 10% consumption');
  },
  F3(r) {
    r.run('save();'); const before = r.data.get('ptr');
    r.run('newSave(); renameSave("save1");');
    assert.equal(r.data.get('ptr'), before, 'Cancelled prompt changed durable saves');
  },
};

function exercise(check, options) {
  const r = loadedRuntime(options);
  try { check(r); } finally { r.dispose(); }
}
// Loading must succeed before the expected behavioral failure. A missing moved
// file or mixed-version script graph must never count as sensitivity evidence.
function expectBehaviorFailure(check, options, message) {
  const r = loadedRuntime(options);
  try { assert.throws(() => check(r), undefined, message); } finally { r.dispose(); }
}
const baselineOptions = historicalSources(baseline);
for (const [id, check] of Object.entries(checks)) {
  exercise(check, {});
  expectBehaviorFailure(check, baselineOptions, `${id} did not fail at the immutable baseline`);
  console.log(`${id}: fixed PASS; immutable ${baseline.slice(0, 7)} baseline FAIL detected`);
}
const predecessorOptions = historicalSources('379241bd94cf50ca6423e07f1ad68c567edcb6a0');
const failedSelection = r => {
  r.run('allSaves.second = getStartPlayer(); save(); var previousPlayer = player;');
  const durable = r.data.get('ptr');
  r.io.storageError = true;
  assert.doesNotThrow(() => r.run('loadSave("second");'), 'Selection storage error escaped without a recovery outcome');
  assert.equal(r.run('allSaves.set === "save1" && player === previousPlayer'), true, 'Failed selection changed active state');
  assert.equal(r.data.get('ptr'), durable);
};
exercise(failedSelection, {});
expectBehaviorFailure(failedSelection, predecessorOptions, 'SAV01 selection boundary did not fail on TST01 source');
console.log('SAV01 failed selection: current PASS; immutable TST01 379241b FAIL detected');

function mutation(file, before, after, check) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal(source.split(before).length, 2, `Mutation anchor must occur exactly once: ${before}`);
  expectBehaviorFailure(check, {sources: {[file]: source.replace(before, after)}}, 'Mutation escaped the behavioral assertion');
}
mutation('js/saves.js', 'let decoded = saveCodec().decodePlayer(imported);', 'player = JSON.parse(atob(imported)); let decoded = saveCodec().decodePlayer(imported);', checks.F1);
console.log('Save-preservation mutation: FAIL detected (in-memory source only)');
mutation('js/save-storage.js', 'if (!encoded.ok) return encoded;', 'if (!encoded.ok) return { ok: true, value: collection };', r => {
  r.run('save(); player.p = null;');
  const before = r.data.get('ptr');
  assert.equal(r.run('save()'), false, 'Invalid candidate was reported saved');
  assert.equal(r.data.get('ptr'), before, 'Invalid candidate overwrote durable progress');
});
console.log('Candidate-validation mutation: FAIL detected (in-memory source only)');
mutation('js/game-runtime.js', 'Math.max(state.offTime.remain, 0), offlineLimitHours * 3600', 'Math.max(state.offTime.remain, 0), offlineLimitHours * 3600000', checks.F2);
console.log('Offline-cap mutation: FAIL detected (in-memory source only)');

const stoppedCallback = r => {
  r.run('doReset("p"); buyUpg("p",11); updateTemp(); player.offTime = null;');
  const queued = r.callbacks.find(item => item.ms === 50).fn;
  r.run('gameRuntime.stop();');
  const before = r.run('JSON.stringify(player)');
  r.clock.now += 1000;
  queued();
  assert.equal(r.run('JSON.stringify(player)'), before, 'Stopped callback mutated progress');
  assert.equal(r.io.writes, 0);
  r.run('gameRuntime.start();');
  const restarted = r.run('JSON.stringify(player)');
  queued();
  assert.equal(r.run('JSON.stringify(player)'), restarted, 'Old generation mutated restarted progress');
};
exercise(stoppedCallback, {});
mutation('js/game-runtime.js', 'if (state !== "running" || token !== generation || busy) return;', 'if (busy) return;', stoppedCallback);
console.log('Stopped-generation mutation: FAIL detected (in-memory source only)');

mutation('js/game-runtime.js', 'token !== generation || ', '', stoppedCallback);
console.log('Restart-generation mutation: FAIL detected (in-memory source only)');
