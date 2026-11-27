const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
const {createPolicy,strategies}=require('../../scripts/balance/policy.cjs');
const {simulate}=require('../../scripts/balance/simulate.cjs');
const {compareReference}=require('../../scripts/balance/report.cjs');
const {createRuntime}=require('../support/game-runtime.cjs');

test('native balance loader matches the VM through real construction, growth and prestige',t=>{
 const native=createBalanceEngine();t.after(native.dispose);
 const r=createRuntime({bridge:false});t.after(r.dispose);
 const session=r.run('createGameSession({now:0,effects:{Vue,confirm:()=>true}})');t.after(()=>session.dispose());
 const vm={session,get player(){return session.saveState.player;},get tmp(){return session.derivedState.tmp;},refresh(){session.derivedState.updateTemp();}};
 const policies=[createPolicy(native,strategies['active-balanced']),createPolicy(vm,strategies['active-balanced'])];
 for(let time=0;time<=900;time+=5){
  policies[0].act(time);policies[1].act(time);
  assert.equal(JSON.stringify(native.player),JSON.stringify(vm.player),'at '+time);
  native.advance(5);session.advance(5);
 }
 assert.ok(native.player.craft.total.gte(1)&&native.player.organization.total.gte(1));
 native.assertIsolated();assert.equal(r.io.writes,0);assert.equal(r.intervals.size,0);
});
test('five-minute policy never gains extra manual actions between its checks',()=>{
 const run=simulate({strategy:'regular',horizonSeconds:1500,stepSeconds:5});
 assert.equal(run.decisions,6);assert.ok(run.recentActions.every(action=>action.time%300===0));
 assert.ok(run.actions.construction>=4);assert.equal(run.sections.find(x=>x.id==='endgame').entrySeconds,null);
});
test('both active branch orders and regular play reach the actual opening completion',()=>{
 for(const strategy of ['active-balanced','active-organization','regular']){
  const run=simulate({strategy,horizonSeconds:14400,wallBudgetSeconds:15});
  assert.equal(run.status,'endgame',strategy);
  assert.equal(run.sections.find(row=>row.id==='endgame').status,'reached');
  assert.ok(run.actions.prestige>=2&&run.actions.investment>=2&&run.actions.construction>=3);
  assert.ok(run.actions.automation>=1);
  assert.ok(run.sections.every(row=>row.sectionSeconds===null||row.sectionSeconds>=0));
  console.log(strategy+' opening complete at '+run.simulatedSeconds+' simulated seconds');
 }
});
test('rough and fixed runs have matching progression coverage and bounded observation drift',()=>{
 for(const strategy of ['active-balanced','regular']){
  const options={strategy,horizonSeconds:3600,wallBudgetSeconds:15};
  const rough=simulate({...options,mode:'rough'}),fixed=simulate({...options,mode:'fixed'});
  const calibration=compareReference(rough,fixed);
  assert.ok(calibration.rows.every(row=>!row.coverageMismatch));
  for(const row of calibration.rows)if(row.fixedSeconds!==null)assert.ok(Math.abs(row.roughSeconds-row.fixedSeconds)<=15,row.id);
  assert.deepEqual(rough.actions,fixed.actions);
 }
});
test('saved checkpoints are validated, isolated and cannot inject development speed',t=>{
 const a=createBalanceEngine();t.after(a.dispose);const b=createBalanceEngine(a.exportPlayer());t.after(b.dispose);
 a.advance(60);assert.equal(b.player.points.toNumber(),5);a.assertIsolated();b.assertIsolated();
 assert.throws(()=>createBalanceEngine('invalid'));
 const raw=JSON.parse(atob(a.exportPlayer()));raw.devSpeed=2;
 assert.throws(()=>createBalanceEngine(btoa(JSON.stringify(raw))),/devSpeed 1/);
});
