const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
const {createPolicy,strategies}=require('../../scripts/balance/policy.cjs');
const {simulate}=require('../../scripts/balance/simulate.cjs');
const {compareReference}=require('../../scripts/balance/report.cjs');
const {createRuntime}=require('../support/game-runtime.cjs');

test('legal active and regular play can fund and complete earthenware storage after the opening',t=>{
 for(const strategy of ['active-balanced','regular']){
  const run=simulate({strategy,horizonSeconds:14400});
  assert.equal(run.status,'endgame');
  const engine=createBalanceEngine(run.checkpoint);t.after(engine.dispose);
  const p=engine.player,e=engine.session.modRules.civilization;
  const policy=createPolicy(engine,strategies[strategy]);
  const cadence=strategy==='regular'?300:5;
  let started=false,time=0;
  for(;time<3600;time+=cadence){
   if(!started && e.canStartProject('water-storage'))started=e.startProject('water-storage');
   policy.act(time);
   engine.advance(cadence);
   if(started && p.water.storage>=1)break;
  }
  assert.equal(started,true);
  assert.ok(p.water.storage>=1);
  assert.ok(p.points.gte(5));
  assert.ok(e.supply().storage.water>=90);
  console.log(strategy+' legal earthenware jars: opening '+run.simulatedSeconds+'s; crafted within '+(time+cadence)+' additional seconds (synthetic).');
 }
});

test('legal active and regular settlements can develop all three distinct Food routes',t=>{
 for(const strategy of ['active-balanced','regular']){
  const engine=createBalanceEngine();t.after(engine.dispose);
  const economy=engine.session.modRules.civilization,p=engine.player;
  const policy=createPolicy(engine,strategies[strategy]);
  const cadence=strategy==='regular'?20:5;
  let time=0;
  // Reach the scenario by ordinary play; no granted currencies or route levels.
  for(;time<7200;time+=cadence){
   policy.act(time);
   if(p.organization.total.gte(1)&&p.craft.points.gte(2)&&p.points.gte(8)&&!p.civ.project)break;
   engine.advance(cadence);
  }
  assert.ok(time<7200,'Legally reached pre-buyable settlement');
  const enteredAt=time;
  const builds=['gather-tools','hunt-tools','fish-tools'];
  const started=new Set();
  for(;time<enteredAt+600;time+=cadence){
   if(!p.civ.project){
    const next=builds.find(id=>!started.has(id));
    if(next&&economy.startProject(next))started.add(next);
   }
   for(const id of ['water','gather','fish','hunt'])economy.dispatch(id);
   engine.advance(cadence);
   if(builds.every(id=>p.food.routes[id.split('-')[0]]>=1))break;
  }
  assert.equal(started.size,3);
  assert.ok(builds.every(id=>p.food.routes[id.split('-')[0]]>=1));
  assert.ok(p.points.gte(8),'Supplies sustain the settlement through the investment');
  assert.equal(economy.actionDefinition('gather').duration,12);
  assert.equal(economy.actionDefinition('hunt').workers,p.civ.improvements.hunting?3:5);
  assert.equal(economy.actionDefinition('fish').duration,18);
  console.log(strategy+' legal Food route scenario: entered '+enteredAt+'s; all three completed by '+(time+cadence)+'s (synthetic, no pacing target).');
 }
});

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
test('regular policy uses 20-second opening checks and five-minute checks after automation',()=>{
 const run=simulate({strategy:'regular',horizonSeconds:7200,stepSeconds:5});
 assert.equal(run.status,'endgame');
 assert.deepEqual(run.cadenceChanges.map(row=>row.seconds),[20,300]);
 const transition=run.cadenceChanges[1].time;
 assert.ok(run.recentActions.every(action=>action.time<=transition?action.time%20===0:(action.time-transition)%300===0));
 assert.ok(run.actions.construction>=4);
});
test('both active branch orders and adaptive regular play reach the opening using earned automation',()=>{
 for(const strategy of ['active-balanced','active-organization','regular']){
  const run=simulate({strategy,horizonSeconds:14400,wallBudgetSeconds:15});
  assert.equal(run.status,'endgame',strategy);
  assert.equal(run.sections.find(row=>row.id==='endgame').status,'reached');
  assert.ok(run.actions.prestige>=2&&run.actions.construction>=3);
  assert.ok(run.actions.automation>=1);
  for(const id of Array.from({length:10},(_,index)=>'organization-'+(index+1)))assert.equal(run.sections.find(row=>row.id===id).status,'reached',strategy+' '+id);
  assert.ok(run.sections.every(row=>row.sectionSeconds===null||row.sectionSeconds>=0));
  console.log(strategy+' opening complete at '+run.simulatedSeconds+' simulated seconds');
 }
});

test('earned automation supports idle survival and rebuilding after a legally reached tenth Organization',t=>{
 let input;
 const active=simulate({strategy:'active-balanced',horizonSeconds:14400,stopAt:'organization-10',onCheckpoint:row=>{if(row.id==='organization-10')input=row.encodedPlayer;}});
 assert.equal(active.status,'checkpoint');
 const engine=createBalanceEngine(input);t.after(engine.dispose);
 const policy=createPolicy(engine,strategies.regular);policy.act(0);
 const start=engine.player.points.toNumber();
 for(let second=0;second<600;second++){engine.advance(1);assert.ok(engine.player.points.gte(start));}
 assert.ok(engine.player.points.gt(start));
 assert.ok(engine.player.food.points.gt(0)&&engine.player.water.points.gt(0));
 assert.equal(engine.player.civ.autoBuild,true);
 assert.equal(engine.session.modRules.civilization.summary().autoAvailable,true);
});

test('continuous legal play keeps Food staffed and later currencies locked after the opening',t=>{
 const run=simulate({strategy:'active-balanced',horizonSeconds:14400});
 assert.equal(run.status,'endgame');
 const engine=createBalanceEngine(run.checkpoint);t.after(engine.dispose);
 const p=engine.player,e=engine.session.modRules.civilization;
 assert.ok(p.civ.improvements.gravity&&p.civ.improvements.farming);
 assert.ok(e.actionDefinition('farm').workers>0);
 assert.equal(p.civ.improvements.autonomousFood,false);
 engine.advance(300);
 for(const id of ['money','freeTime','education','culture']){
  assert.equal(p[id].unlocked,false);
  assert.equal(p[id].points.toNumber(),0);
  assert.equal(e.summary().nodes.some(node=>node.id===id),false);
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
