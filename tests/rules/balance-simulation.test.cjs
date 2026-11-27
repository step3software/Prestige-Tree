const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createBalanceEngine } = require('../../scripts/balance/engine.cjs');
const { createPolicy, strategies } = require('../../scripts/balance/policy.cjs');
const { simulate } = require('../../scripts/balance/simulate.cjs');
const { createRuntime } = require('../support/game-runtime.cjs');
const {resetTarget} = require('../../scripts/balance/rough.cjs');
const {compareReference} = require('../../scripts/balance/report.cjs');
const {options} = require('../../scripts/balance/run.cjs');

test('native offline loader matches the existing VM at complete player/reset/purchase/tick checkpoints', t=>{
  const native=createBalanceEngine(); t.after(native.dispose);
  const runtime=createRuntime({bridge:false}); t.after(runtime.dispose);
  const session=runtime.run('createGameSession({now:0,effects:{Vue,confirm:()=>true}})');
  session.gameView.loadVue(); t.after(()=>session.dispose());
  const vm={session,get player(){return session.saveState.player;},get tmp(){return session.derivedState.tmp;},refresh(){session.derivedState.updateTemp();}};
  const policies=[createPolicy(native,strategies['active-generators']),createPolicy(vm,strategies['active-generators'])];
  for (let time=0;time<=180;time+=5) {
    policies[0].act(time); policies[1].act(time);
    assert.equal(JSON.stringify(native.player),JSON.stringify(vm.player),'at '+time+' seconds');
    native.advance(5);session.advance(5);
  }
  native.assertIsolated();
  assert.equal(native.player.g.unlocked,true,'Parity must include the first higher-row reset');
  assert.equal(runtime.io.writes,0); assert.equal(runtime.intervals.size,0);
});

test('native simulation sessions do not share progress, caches, clocks or effects',t=>{
  const a=createBalanceEngine(), b=createBalanceEngine();t.after(a.dispose);t.after(b.dispose);
  const original=JSON.stringify(b.player);
  createPolicy(a,strategies.regular).act(0);a.advance(5);
  assert.equal(JSON.stringify(b.player),original);
  assert.notEqual(a.session.derivedState.tmp,b.session.derivedState.tmp);
  assert.equal(a.player.points.gt(0),true);a.assertIsolated();b.assertIsolated();
});

test('five-minute regular decisions and timestep splitting do not acquire extra manual actions',()=>{
  const coarse=simulate({strategy:'regular',horizonSeconds:10,stepSeconds:5});
  const fine=simulate({strategy:'regular',horizonSeconds:10,stepSeconds:1});
  assert.equal(coarse.decisions,1);assert.equal(fine.decisions,1);
  assert.deepEqual(coarse.actions,fine.actions);
  assert.equal(coarse.stateSha256,fine.stateSha256);
  assert.equal(coarse.sections[0].entrySeconds,0);
  assert.equal(coarse.sections[1].entrySeconds,null);
  assert.equal(coarse.sections[1].censored,true);
});

test('repeated runs retain exact timestamps, action counts and player bytes',()=>{
  const options={strategy:'active-generators',horizonSeconds:20,stepSeconds:5};
  const a=simulate(options), b=simulate(options);
  assert.equal(a.stateSha256,b.stateSha256);assert.deepEqual(a.sections,b.sections);assert.deepEqual(a.actions,b.actions);
});

test('saved section input is codec-validated and development speed cannot falsify play times',t=>{
  const engine=createBalanceEngine();t.after(engine.dispose);
  const encoded=engine.exportPlayer();const reloaded=createBalanceEngine(encoded);t.after(reloaded.dispose);
  assert.equal(JSON.stringify(engine.player),JSON.stringify(reloaded.player));
  assert.throws(()=>createBalanceEngine('!!!'));
  assert.throws(()=>createBalanceEngine(''));
  const raw=JSON.parse(atob(encoded));raw.devSpeed=2;
  assert.throws(()=>createBalanceEngine(btoa(JSON.stringify(raw))),/devSpeed 1/);
});

test('rough mode coalesces quiet steps but keeps regular actions on the five-minute grid',()=>{
  const rough=simulate({strategy:'regular',mode:'rough',horizonSeconds:600});
  const fixed=simulate({strategy:'regular',mode:'fixed',horizonSeconds:600});
  assert.equal(rough.decisions,3);assert.equal(fixed.decisions,3);
  assert.ok(rough.steps<fixed.steps);
  assert.ok(rough.recentActions.every(action=>action.time%300===0));
  assert.match(rough.interpretation,/Rough/);
});

test('event forecasts restore derived inputs on both success and failure',t=>{
  const engine=createBalanceEngine();t.after(engine.dispose);
  createPolicy(engine,strategies.regular).act(0);
  const state=JSON.stringify(engine.player),gain=engine.tmp.p.resetGain;
  assert.ok(resetTarget(engine,'p',4).gt(0));
  assert.equal(engine.tmp.p.resetGain,gain);assert.equal(JSON.stringify(engine.player),state);
  const original=engine.session.gameRules.getNextAt;
  engine.session.gameRules.getNextAt=()=>{throw new Error('forecast failure');};
  assert.throws(()=>resetTarget(engine,'p',4),/forecast failure/);
  assert.equal(engine.tmp.p.resetGain,gain);assert.equal(JSON.stringify(engine.player),state);
  engine.session.gameRules.getNextAt=original;
});

test('calibration reports missing coverage instead of turning an unreached section into zero',()=>{
  const run=simulate({horizonSeconds:5});
  const rough={...run,sections:run.sections.map(row=>row.id==='boosters-generators'?{...row,entrySeconds:4}:row)};
  const comparison=compareReference(rough,run);
  const row=comparison.rows.find(item=>item.id==='boosters-generators');
  assert.equal(row.fixedSeconds,null);assert.equal(row.relativeDifference,null);assert.equal(row.coverageMismatch,true);
});

test('CLI validates estimates and bounded work rather than silently accepting mistyped flags',()=>{
  assert.equal(options([]).mode,'rough');assert.equal(options([]).calibrateMinutes,10);
  for(const args of [['--hours','-1'],['--budget','Infinity'],['--profiles','unknown'],['--mode','unknown'],['--mistyped','1'],['--out']]) assert.throws(()=>options(args));
});

test('invalid time budgets, strategies and targets fail before simulation',()=>{
  for(const options of [{stepSeconds:0},{stepSeconds:Infinity},{horizonSeconds:-1},{wallBudgetSeconds:NaN},{decisionSeconds:0},{strategy:'invented'},{stopAt:'invented'}]) {
    assert.throws(()=>simulate(options));
  }
});
