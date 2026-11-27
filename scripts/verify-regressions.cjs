const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
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

function exercise(check, sources) {
  const r = loadedRuntime({sources});
  try { check(r); } finally { r.dispose(); }
}
const files = ['js/game.js', 'js/utils.js'];
const baselineSources = Object.fromEntries(files.map(file => [file,
  execFileSync('git', ['show', `${baseline}:${file}`], {cwd: root, encoding: 'utf8'})]));
for (const [id, check] of Object.entries(checks)) {
  exercise(check, {});
  assert.throws(() => exercise(check, baselineSources), undefined, `${id} did not fail at the immutable baseline`);
  console.log(`${id}: fixed PASS; immutable ${baseline.slice(0, 7)} baseline FAIL detected`);
}

function mutation(file, before, after, check) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal(source.split(before).length, 2, `Mutation anchor must occur exactly once: ${before}`);
  assert.throws(() => exercise(check, {[file]: source.replace(before, after)}), undefined, 'Mutation escaped the behavioral assertion');
}
mutation('js/utils.js', 'validateImportedSave(parsed);', 'player = parsed; validateImportedSave(parsed);', checks.F1);
console.log('Save-preservation mutation: FAIL detected (in-memory source only)');
mutation('js/game.js', 'modInfo.offlineLimit * 3600', 'modInfo.offlineLimit * 3600000', checks.F2);
console.log('Offline-cap mutation: FAIL detected (in-memory source only)');
