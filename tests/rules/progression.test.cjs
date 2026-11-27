const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { loadedRuntime, root } = require('../support/game-runtime.cjs');

test('fresh state, first prestige and upgrade drive actual point generation and reset', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  assert.equal(r.run('player.points instanceof Decimal && player.points.eq(10)'), true);
  assert.equal(r.run('player.p.unlocked'), false);
  r.run('buyUpg("p", 11);');
  assert.equal(r.run('player.p.upgrades.length'), 0);
  r.run('doReset("p");');
  assert.equal(r.run('player.p.unlocked && player.p.points.eq(1) && player.points.eq(0)'), true);
  r.run('buyUpg("p", 12);'); // locked despite enough currency
  assert.equal(r.run('player.p.upgrades.length'), 0);
  r.run('player.p.points = new Decimal(0); buyUpg("p", 11);');
  assert.equal(r.run('hasUpgrade("p", 11)'), false);
  r.run('player.p.points = new Decimal(1); buyUpg("p", 11); buyUpg("p", 11); updateTemp();');
  assert.equal(r.run('player.p.points.eq(0) && player.p.upgrades.length === 1'), true);
  r.clock.now += 1000;
  r.fire(50);
  assert.equal(r.run('player.points.eq(1)'), true);
  r.run('player.points = new Decimal(40); updateTemp(); doReset("p");');
  assert.equal(r.run('player.points.eq(0) && hasUpgrade("p",11) && player.p.points.gte(2)'), true);
});

test('versioned synthetic save retains huge Decimals, arrays, upgrades, milestones and sibling saves', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  const fixture = fs.readFileSync(path.join(root, 'tests/fixtures/representative-save.json'), 'utf8');
  r.run(`importSave(btoa(${JSON.stringify(fixture)}));`);
  assert.equal(r.io.reloads, 1);
  const reloaded = loadedRuntime({ storage: Object.fromEntries(r.data) }); t.after(reloaded.dispose);
  assert.equal(reloaded.run('player.points.eq("ee1000") && player.points instanceof Decimal'), true);
  assert.equal(reloaded.run('hasUpgrade("p",11) && hasMilestone("b",0)'), true);
  assert.equal(reloaded.run('player.c.assigned[0] instanceof Decimal && player.c.assigned[0].eq("1e1000")'), true);
  reloaded.run('exportSave();');
  const exported = JSON.parse(atob(reloaded.io.clipboard));
  assert.equal(exported.points, 'ee1000');
  reloaded.run('allSaves.second = getStartPlayer(); allSaves.second.points = new Decimal("1e500"); save();');
  const again = loadedRuntime({ storage: Object.fromEntries(reloaded.data) }); t.after(again.dispose);
  assert.equal(again.run('player.points.eq("ee1000") && new Decimal(allSaves.second.points).eq("1e500")'), true);
  again.run('save(); loadSave("second");');
  const selected = loadedRuntime({ storage: Object.fromEntries(again.data) }); t.after(selected.dispose);
  assert.equal(selected.run('allSaves.set === "second" && player.points.eq("1e500")'), true);
});

test('separate runtimes do not share globals, saves, clocks or timers', t => {
  const a = loadedRuntime(); const b = loadedRuntime(); t.after(a.dispose); t.after(b.dispose);
  a.run('doReset("p"); save();'); a.clock.now += 1000;
  assert.equal(b.run('player.p.unlocked'), false);
  assert.equal(b.data.size, 0);
  assert.notEqual(a.clock.now, b.clock.now);
});
