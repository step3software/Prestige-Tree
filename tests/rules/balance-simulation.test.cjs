const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
const {createPolicy,strategies}=require('../../scripts/balance/policy.cjs');
const {simulate}=require('../../scripts/balance/simulate.cjs');
const {compareReference}=require('../../scripts/balance/report.cjs');
const {createRuntime}=require('../support/game-runtime.cjs');

test('Timber frames rebuilds from retained huts on active and regular checks with fixed-step parity',t=>{
 // Synthetic section start grants MS3, five huts and 2 Craft, skipping the prefix.
 // Buy the upgrade and use real reset/build commands; no accepted pacing target.
 const seed=createBalanceEngine();t.after(seed.dispose);
 const p=seed.player,D=p.points.constructor,e=seed.session.modRules.civilization;
 p.organization.best=new D(3);p.craft.points=new D(2);
 p.shelter.homes=5;p.shelter.points=new D(28);p.points=new D(12);
 assert.equal(e.buyUpgrade('joinery'),true);
 const start=seed.exportPlayer();
 for(const [profile,cadence] of [['active',5],['regular',20]]){
  const outcomes=[];
  for(const step of [1,5]){
   const engine=createBalanceEngine(start);t.after(engine.dispose);
   const rules=engine.session.modRules.civilization;
   assert.equal(rules.prestige('craft'),true);
   assert.equal(engine.player.shelter.homes,3);
   assert.equal(rules.startProject('shelter-home'),true);
   let elapsed=0;
   while(engine.player.shelter.homes===3&&elapsed<120){
    for(let time=0;time<cadence;time+=step)engine.advance(Math.min(step,cadence-time));
    elapsed+=cadence;
   }
   assert.equal(engine.player.shelter.homes,4);
   assert.equal(engine.player.shelter.points.toNumber(),24);
   assert.ok(elapsed<=120,'Rebuild finishes before the bounded section horizon');
   outcomes.push([elapsed,engine.exportPlayer()]);
   engine.assertIsolated();
  }
  assert.deepEqual(outcomes[0],outcomes[1]);
  console.log(profile+' Timber frames section: keep 3/5 huts, rebuild to 4 in '+outcomes[0][0]+'s; 1s/5s advancement identical (synthetic).');
 }
});

test('abundance rebuilds legally reached high shelter after actual starvation with recovery staffing and short repeat orders',t=>{
 for(const strategy of ['active-balanced','regular']){
  const run=simulate({strategy,horizonSeconds:14400});
  assert.equal(run.status,'endgame');
  const engine=createBalanceEngine(run.checkpoint);t.after(engine.dispose);
  const p=engine.player,e=engine.session.modRules.civilization;
  p.civ.autoBuild=false; // The existing user toggle freezes the reached housing target.
  if(p.civ.project)e.cancelProject();
  for(const id of ['gather','fish','hunt','farm']){
   if(p.civ.actions[id].remaining)e.recall(id);
   e.setRepeat(id,0);
  }
  let shortageSeconds=0;
  while(p.points.gt(1)&&shortageSeconds<7200){engine.advance(1);shortageSeconds++;}
  assert.equal(p.points.toNumber(),1,'Actual Food depletion reaches one survivor without state grants');
  assert.ok(p.food.points.lte(0));
  const target=p.shelter.points.toNumber();
  const baselineMinimum=(target-p.points.toNumber()-p.civ.growth)*e.growthSettings.secondsPerPerson;
  assert.ok(target>=44);
  assert.equal(e.setRepeat('gather',1),false,'One survivor cannot staff both Overseer and a crew');
  assert.equal(e.setOverseers('food',1),true);
  for(const id of ['gather','hunt','farm'])e.setExpeditionMultiplier(id,1);
  assert.equal(e.dispatch('gather'),true);
  let manualRecoverySeconds=0;
  while(p.points.lt(2)&&manualRecoverySeconds<60){engine.advance(1);manualRecoverySeconds++;}
  assert.ok(p.points.gte(2),'One manual Gather restores room for an Overseer');
  let orders=0;
  for(const id of ['gather','fish','hunt','farm']){
   const action=e.actionDefinition(id);
   if(action.unlocked&&action.repeatAvailable&&!action.repeat&&e.setRepeat(id,1))orders++;
  }
  assert.ok(orders>=3);
  let recoverySeconds=manualRecoverySeconds,peak=1;
  while(p.points.lt(target)&&recoverySeconds<300){
   if(recoverySeconds%5===0)e.dispatch('water');engine.advance(1);recoverySeconds++;
   peak=Math.max(peak,e.supply().abundance.multiplier);
  }
  assert.equal(p.points.toNumber(),target);
  assert.ok(recoverySeconds<baselineMinimum/3,'Recovery is materially quicker than even uninterrupted old growth');
  assert.ok(peak>1&&peak<=10, "Larger hearth storage changes fullness; recovery still must beat one-third of unbuffed time");
  assert.ok(p.food.points.gt(0)&&p.water.points.gt(0));
  console.log(strategy+' actual-starvation recovery: 1 -> '+target+' in '+recoverySeconds+'s after '+orders+' repeat orders; old unbuffed minimum '+baselineMinimum+'s; peak '+peak.toFixed(2)+'x (synthetic).');
 }
});

test('legal active and regular play drain five-repeat Food and hut queues without extra jobs',t=>{
 for(const strategy of ['active-balanced','regular']){
  const run=simulate({strategy,horizonSeconds:14400});
  assert.equal(run.status,'endgame');
  const engine=createBalanceEngine(run.checkpoint);t.after(engine.dispose);
  const p=engine.player,e=engine.session.modRules.civilization;
  const cadence=strategy==='regular'?20:5;
  const routes=['gather','hunt','farm'];
  const support=except=>{e.dispatch('water');for(const id of routes)if(id!==except)e.setRepeat(id,5);};
  for(let time=0;time<3600&&p.points.lt(20);time+=cadence){support();engine.advance(cadence);}
  assert.ok(p.points.gte(20));
  for(const id of routes){
   const completed=p.civ.actions[id].completed;
   assert.equal(e.setRepeat(id,5),true);
   for(let wait=0;wait<1800;wait+=cadence){
    support(id);engine.advance(cadence);
    const state=p.civ.actions[id];
    assert.ok(state.jobs<=1,'Automatic queues start one job at a time');
    if(state.repeat===0&&state.remaining===0)break;
   }
   assert.equal(p.civ.actions[id].repeat,0,id+' queue drained');
   assert.equal(p.civ.actions[id].remaining,0,id+' final job finished');
   assert.ok(p.civ.actions[id].completed>=completed+5,id+' completed five queued repeats');
  }
  const huts=p.shelter.homes;
  const requiredWells=p.water.sites+1;
  for(let wait=0;wait<3600&&p.water.sites<requiredWells;wait+=cadence){support();if(!p.civ.project)e.startProject('water-site');engine.advance(cadence);}
  assert.ok(p.water.sites>=requiredWells,'Earn enough Water infrastructure for five additional huts');
  assert.equal(e.setHutRepeat(5),true);
  for(let wait=0;wait<3600&&p.shelter.homes<huts+5;wait+=cadence){support();engine.advance(cadence);}
  assert.equal(p.shelter.homes,huts+5);
  assert.equal(p.civ.hutRepeat,0);
  support();engine.advance(cadence);
  assert.equal(p.shelter.homes,huts+5,'No sixth hut after the queue stops');
  assert.ok(p.food.points.gt(0)&&p.water.points.gt(0));
  assert.ok(e.supply().laborUsed<=p.points.toNumber());
  engine.exportPlayer();engine.assertIsolated();
  console.log(strategy+' legal finite Food/hut queues: five repeats each, all stopped at zero; opening '+run.simulatedSeconds+'s.');
 }
});

test('legal active and regular play earn hearths and scale their Food benefits to twenty people',t=>{
 for(const strategy of ['active-balanced','regular']){
  const engine=createBalanceEngine();t.after(engine.dispose);
  const p=engine.player,e=engine.session.modRules.civilization;
  const policy=createPolicy(engine,strategies[strategy]);
  const cadence=strategy==='regular'?20:5;
  let time=0;
  for(;time<7200;time+=cadence){
   policy.act(time);
   if(p.civ.improvements.hearth && p.points.gte(10))break;
   engine.advance(cadence);
  }
  assert.ok(time<7200,'Purchased hearths and reached ten people without grants');
  for(const id of ['cooking','hearth'])assert.equal(p.civ.improvements[id],true, 'Fire upgrades are bought through real commands');
  const enteredAt=time;
  // Keep this earned settlement instead of prestiging: build housing and send
  // real crews at the same manual cadence to measure the next Food threshold.
  for(;time<enteredAt+1800;time+=cadence){
   if(!p.civ.project && e.supply().support<24)e.startProject('shelter-home');
   for(const id of ['water','gather','fish','hunt','farm'])e.dispatch(id);
   engine.advance(cadence);
   if(p.points.gte(20))break;
  }
  assert.ok(p.points.gte(20));
  assert.equal(e.supply().hearth.foodStorage,50);
  assert.ok(Math.abs(e.supply().passiveProduction.food-8*e.fireStatus().fill)<1e-8);
  assert.ok(e.supply().passiveProduction.food<e.supply().demand,'Hearths supplement staffed Food routes');
  assert.ok(p.food.points.gt(0)&&p.water.points.gt(0));
  assert.ok(p.civ.actions.gather.completed>0);
  engine.assertIsolated();
  console.log(strategy+' legal hearths: ten people by '+enteredAt+'s, twenty by '+(time+cadence)+'s; +50 storage/up to +8 Food per minute with Fire fullness.');
 }
});

test('legal active and regular play can fund and complete earthenware storage after the opening',t=>{
 for(const strategy of ['active-balanced','regular']){
  const run=simulate({strategy,horizonSeconds:14400});
  assert.equal(run.status,'endgame');
  const engine=createBalanceEngine(run.checkpoint);t.after(engine.dispose);
  const p=engine.player,e=engine.session.modRules.civilization;
  const policy=createPolicy(engine,strategies[strategy]);
  const cadence=strategy==='regular'?20:5;
  const startingStorage=p.water.storage;
  let started=false,time=0;
  for(;time<3600;time+=cadence){
   if(!started && e.canStartProject('water-storage'))started=e.startProject('water-storage');
   policy.act(time);
   engine.advance(cadence);
   if(p.water.storage>startingStorage)break;
  }
  assert.ok(p.water.storage>startingStorage,'Manual or earned automatic construction must finish a paid jar purchase');
  assert.ok(p.points.gte(5));
  assert.ok(e.supply().storage.water>=90);
  console.log(strategy+' legal earthenware jars: opening '+run.simulatedSeconds+'s; crafted within '+(time+cadence)+' additional seconds ('+(started?'manual start':'earned auto-builder')+', synthetic).');
 }
});

test('legal active and regular settlements can develop gathering, hunting and farming buyables after their unlocks',t=>{
 for(const strategy of ['active-balanced','regular']){
  const engine=createBalanceEngine();t.after(engine.dispose);
  const economy=engine.session.modRules.civilization,p=engine.player;
  const policy=createPolicy(engine,strategies[strategy]);
  const cadence=strategy==='regular'?20:5;
  let time=0;
  // Reach the scenario by ordinary play; no granted currencies or route levels.
  for(;time<14400;time+=cadence){
   policy.act(time);
   if(p.organization.points.gte(10)&&p.civ.improvements.copperPots&&p.civ.improvements.farming&&p.craft.points.gte(2)&&p.points.gte(20)&&!p.civ.project)break;
   engine.advance(cadence);
  }
  assert.ok(time<14400,'Legally reached pre-buyable settlement');
  const enteredAt=time;
  const builds=['gather-tools','hunt-tools','farm-tools'];
  const started=new Set();
  for(;time<enteredAt+600;time+=cadence){
   if(!p.civ.project){
    const next=builds.find(id=>!started.has(id));
    if(next&&economy.startProject(next))started.add(next);
   }
   for(const id of ['water','gather','farm','hunt'])economy.dispatch(id);
   engine.advance(cadence);
   if(builds.every(id=>p.food.routes[id.split('-')[0]]>=1))break;
  }
  assert.equal(started.size,3);
  assert.ok(builds.every(id=>p.food.routes[id.split('-')[0]]>=1));
  assert.ok(p.points.gte(8),'Supplies sustain the settlement through the investment');
  assert.equal(economy.actionDefinition('gather').duration/economy.actionDefinition('gather').expeditionMultiplier,12);
  assert.equal(economy.actionDefinition('hunt').workers,p.civ.improvements.hunting?3:5);
  assert.equal(economy.actionDefinition('fish').unlocked,false,'Fishing has no assigned new-game milestone yet');
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
test('regular policy keeps 20-second hauling checks when spring supply cannot sustain full housing',()=>{
 const run=simulate({strategy:'regular',horizonSeconds:14400,stepSeconds:5});
 assert.equal(run.status,'endgame');
 assert.deepEqual(run.cadenceChanges.map(row=>row.seconds),[20]);
 const transition=Infinity;
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
  assert.ok(run.actions['council-scale']>=1,'Legal policy assigns Council workers');
  assert.equal(run.sections.find(row=>row.id==='council-staffed').status,'reached');
  for(const id of Array.from({length:10},(_,index)=>'organization-'+(index+1)))assert.equal(run.sections.find(row=>row.id===id).status,'reached',strategy+' '+id);
  assert.ok(run.sections.every(row=>row.sectionSeconds===null||row.sectionSeconds>=0));
  console.log(strategy+' opening complete at '+run.simulatedSeconds+' simulated seconds');
 }
});

test('legal developed settlements need hauling above sustainable spring supply and recover Water through real crews',t=>{
 const run=simulate({strategy:'active-balanced',horizonSeconds:14400});assert.equal(run.status,'endgame');
 const engine=createBalanceEngine(run.checkpoint);t.after(engine.dispose);const p=engine.player,e=engine.session.modRules.civilization;
 p.civ.autoBuild=false;
 for(let time=0;time<600&&p.points.lt(e.supply().support);time+=5){for(const id of ['gather','hunt','farm'])e.setRepeat(id,5);e.dispatch('water');engine.advance(5);}
 assert.ok(e.supply().passiveProduction.water<e.supply().demand,'Eight-person baseline and finite wells do not supply unlimited population');
 p.civ.autoBuild=false;for(const id of ['gather','hunt','farm'])e.setRepeat(id,0);
 // Finish a real haul before measuring drawdown. No in-flight delivery may
 // mask passive insufficiency, and the shorter window avoids a population
 // collapse changing upkeep into a surplus during the measurement itself.
 e.setFireTenders(0);if(p.civ.actions.water.remaining>0)e.recall('water');assert.equal(e.dispatch('water'),true);
 engine.advance(Math.ceil(e.actionDefinition('water').duration)+1);
 assert.equal(p.civ.actions.water.remaining,0);
 const before=p.water.points.toNumber();assert.ok(before>0);engine.advance(10);assert.ok(p.water.points.toNumber()<before);
 assert.equal(e.dispatch('water'),true);
 const returning=p.civ.actions.water.reward;engine.advance(Math.ceil(e.actionDefinition('water').duration)+1);assert.ok(returning>0);assert.ok(p.water.points.gt(0));
 assert.equal(e.summary().autoAvailable,true);engine.exportPlayer();
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
  const options={strategy,horizonSeconds:14400,wallBudgetSeconds:30};
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

test('Council supports exactly 125 finite repeats with 25 paid supervisors across active/regular cadences and reload',t=>{
 // Constructed section fixture grants MS8, nine lifetime Organization, rosters,
 // 40 people, eight huts and supply stores. This isolates capacity/exhaustion;
 // the fresh-game policy test above establishes legal Council reachability.
 const seed=createBalanceEngine();t.after(seed.dispose);
 const p=seed.player,D=p.points.constructor,e=seed.session.modRules.civilization;
 p.organization.total=new D(9);p.organization.best=new D(8);p.organization.points=new D(3);
 p.civ.improvements.workRosters=true;p.points=new D(40);p.shelter.homes=8;p.shelter.points=new D(40);
 p.food.storage=50;p.water.storage=50;p.food.points=new D(1500);p.water.points=new D(1500);
 assert.equal(e.setCouncilScale(5),true);assert.equal(e.setOverseers('food',25),true);
 assert.equal(e.setRepeat('gather',125),true);assert.equal(e.setRepeat('gather',126),false);
 assert.equal(e.supply().overseerWorkers,25);assert.equal(e.supply().councilWorkers,5);assert.equal(e.supply().availableWorkers,10);
 const start=seed.exportPlayer();
 for(const cadence of [5,20]){
  const outcomes=[];
  for(const step of [1,5]){
   let engine=createBalanceEngine(start);t.after(()=>engine.dispose());
   for(let elapsed=0;elapsed<1400;elapsed+=cadence){
    for(let time=0;time<cadence;time+=step)engine.advance(Math.min(step,cadence-time));
    if(elapsed+cadence===700){const save=engine.exportPlayer();engine.dispose();engine=createBalanceEngine(save);}
   }
   assert.equal(engine.player.civ.actions.gather.completed,125);assert.equal(engine.player.civ.actions.gather.repeat,0);
   assert.equal(engine.player.civ.actions.gather.remaining,0);assert.equal(engine.player.points.toNumber(),40);
   assert.equal(engine.session.modRules.civilization.supply().overseerWorkers,0);
   outcomes.push(engine.exportPlayer());engine.assertIsolated();
  }
  assert.equal(outcomes[0],outcomes[1]);
 }
});

test('completed calibration keeps a delayed terminal observation instead of falsely censoring coverage',()=>{
 const rough={strategy:'regular',status:'endgame',horizonSeconds:7200,simulatedSeconds:5755,sections:[{id:'endgame',entrySeconds:5755}]};
 const fixed={...rough,simulatedSeconds:5745,sections:[{id:'endgame',entrySeconds:5745}]};
 const row=compareReference(rough,fixed).rows[0];assert.equal(row.coverageMismatch,false);assert.equal(row.roughSeconds-row.fixedSeconds,10);
 const incomplete=compareReference(rough,{...fixed,status:'wall-budget'}).rows[0];assert.equal(incomplete.roughSeconds,null);assert.equal(incomplete.coverageMismatch,true);
});
