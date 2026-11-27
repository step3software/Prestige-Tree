const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadedRuntime } = require('../support/game-runtime.cjs');

for (const seconds of [0, 1, 3599, 3600, 3601, 7200]) {
  test(`offline bank of ${seconds} seconds respects the one-hour cap before consumption`, t => {
    const r = loadedRuntime(); t.after(r.dispose);
    r.run(`doReset("p"); buyUpg("p", 11); updateTemp(); player.offTime = {remain:${seconds}};`);
    r.fire(50);
    const capped = Math.min(seconds, 3600);
    assert.equal(r.run('player.offTime === null ? 0 : player.offTime.remain'), capped * 0.9);
    assert.equal(r.run('player.points.toNumber()'), capped / 10);
  });
}

test('no elapsed time and backwards clock do not grant or subtract progress', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run('doReset("p"); buyUpg("p",11); updateTemp(); player.offTime = null;');
  r.fire(50); r.clock.now -= 1000; r.fire(50);
  assert.equal(r.run('player.points.eq(0)'), true);
});

test('load clamps elapsed seconds, backwards clock and disabled offline production', t => {
  for (const [elapsed, enabled, expected] of [[7200,true,3600], [-100,true,0], [7200,false,0]]) {
    const r = loadedRuntime(); t.after(r.dispose);
    r.run(`player.time = Date.now() - ${elapsed} * 1000; player.offTime = {remain:0}; player.offlineProd=${enabled}; save(); load();`);
    assert.equal(r.run('player.offTime === null ? 0 : player.offTime.remain'), expected);
  }
});

test('disabled offline production discards a bank before applying any progress', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run('doReset("p"); buyUpg("p",11); updateTemp(); player.offlineProd=false; player.offTime={remain:7200};');
  r.fire(50);
  assert.equal(r.run('player.points.eq(0) && player.offTime === null'), true);
});

test('catch-up ticks consume each banked second once, including tiny remainder', t => {
  const r = loadedRuntime(); t.after(r.dispose);
  r.run('doReset("p"); buyUpg("p",11); updateTemp(); player.offTime={remain:10};');
  for (let i = 0; i < 6; i++) r.fire(50);
  assert.ok(Math.abs(r.run('player.points.toNumber() + player.offTime.remain') - 10) < 1e-9);
  r.run('player.offTime={remain:0.01}; player.points=new Decimal(0);');
  r.clock.now += 1000; r.fire(50);
  assert.ok(Math.abs(r.run('player.points.toNumber()') - 1.01) < 1e-9);
  r.fire(50);
  assert.ok(Math.abs(r.run('player.points.toNumber()') - 1.01) < 1e-9);
});
