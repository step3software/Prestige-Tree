const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
function game(t,save){const engine=createBalanceEngine(save);t.after(engine.dispose);const p=engine.player;return {engine,p,e:engine.session.modRules.civilization,D:p.points.constructor};}
function stage(p,D){
 p.organization.total=new D(9);p.organization.best=new D(8);p.organization.points=new D(3);
 p.points=new D(100);p.shelter.homes=23;p.shelter.points=new D(100);
 p.civ.improvements.workRosters=true;p.civ.improvements.crafting=true;
}
test('Council alone unlocks automatically at nine lifetime Organization, independent of spending',t=>{
 const {p,e,D}=game(t);assert.equal(p.civ.councilScale,1);
 p.organization.points=new D(9);p.organization.best=new D(9);p.organization.total=new D(8);
 assert.equal(e.councilAvailable(),false);assert.equal(e.setCouncilScale(2),false);
 p.organization.total=new D(9);p.organization.points=new D(0);p.organization.best=new D(3);
 assert.equal(e.councilAvailable(),true);assert.equal(e.organizationMilestones()[8].earned,true);
 assert.equal(e.supply().councilWorkers,1);assert.equal(e.supply().availableWorkers,4);
 assert.equal(e.workerLimit(),5);
});
test('every scale raises real-worker limits without assigning staff or changing multiplier controls',t=>{
 const {p,e,D}=game(t);stage(p,D);p.civ.improvements.extendedExpeditions=true;p.civ.improvements.cooking=true;
 for(let scale=1;scale<=5;scale++){
  assert.equal(e.setCouncilScale(scale),true);assert.equal(e.workerLimit(),scale*5);
  assert.equal(e.summary().workerLimit,scale*5);assert.equal(e.supply().councilWorkers,scale);
  assert.deepEqual(p.civ.overseers,{food:1,huts:1});assert.equal(p.civ.fireTenders,0);
  assert.equal(e.setOverseers('food',scale*5),true);assert.equal(e.setOverseers('huts',scale*5),true);
  assert.equal(e.setFireTenders(scale*5),true);assert.equal(e.setFireTenders(scale*5+1),false);
  assert.equal(e.setRepeat('gather',scale*25),true);assert.equal(e.setHutRepeat(scale*25),true);
  assert.equal(e.summary().foodRepeatCap,scale*25);assert.equal(e.summary().hutRepeatCap,scale*25);
  assert.equal(e.supply().availableWorkers,100-scale*16);
  assert.equal(e.setRepeat('gather',scale*25+1),false);
  assert.equal(e.setHutRepeat(scale*25+1),false);
  assert.equal(e.setExpeditionMultiplier('gather',6),false);assert.equal(e.setCookingLevel(6),false);
  e.setRepeat('gather',0);e.setHutRepeat(0);e.setOverseers('food',1);e.setOverseers('huts',1);e.setFireTenders(0);
 }
 p.civ.improvements.workRosters=false;
 assert.equal(e.setOverseers('food',2),false);assert.equal(e.setOverseers('huts',2),false);
 assert.equal(e.summary().foodRepeatCap,5);assert.equal(e.setCouncilScale(6),false);
});
test('unsafe reductions explain each assignment and queue, reject atomically, and preserve snapshots',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);e.setCouncilScale(5);
 e.setOverseers('food',25);e.setOverseers('huts',20);e.setFireTenders(15);
 e.setRepeat('gather',125);e.setHutRepeat(100);assert.equal(e.dispatch('gather'),true);assert.equal(e.startProject('shelter-home'),true);
 const snapshot=JSON.stringify({action:p.civ.actions.gather,work:p.civ.projectWork,project:p.civ.project});
 const before=engine.exportPlayer();assert.equal(e.setCouncilScale(2),false);assert.equal(engine.exportPlayer(),before);
 for(const text of ['Food overseers to 10','Hut overseers to 10','Fire tenders to 10','Gather repeats to 50','Hut repeats to 50'])assert.ok(e.councilScaleProblem(2).includes(text));
 e.setRepeat('gather',50);e.setHutRepeat(50);assert.equal(e.setCouncilScale(2),false);
 e.setOverseers('food',10);e.setOverseers('huts',10);e.setFireTenders(10);
 assert.equal(e.setCouncilScale(2),true);
 assert.equal(JSON.stringify({action:{...p.civ.actions.gather,repeat:125},work:p.civ.projectWork,project:p.civ.project}),snapshot);
 assert.equal(p.civ.actions.gather.repeat,50);assert.equal(p.civ.hutRepeat,50);
});
test('Council and independent supervisors spend the shared workforce, and increases need real free labor',t=>{
 const {p,e,D}=game(t);stage(p,D);p.points=new D(16);assert.equal(e.setCouncilScale(2),true);
 e.setOverseers('food',5);e.setOverseers('huts',4);e.setRepeat('gather',25);e.setHutRepeat(20);e.setFireTenders(3);
 assert.equal(e.supply().laborUsed,14);assert.equal(e.supply().availableWorkers,2);
 assert.equal(e.setCouncilScale(4),false);assert.equal(e.setOverseers('huts',7),false);
 assert.equal(e.setFireTenders(6),false);
 assert.equal(e.dispatch('hunt'),false);assert.equal(e.dispatch('water'),true);
 assert.ok(e.supply().laborUsed<=16);
});
test('Council staffing suspends before touching paid work and recovers after crew return or prestige',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);e.setCouncilScale(5);e.setOverseers('food',25);e.setRepeat('gather',125);
 e.setRepeat('gather',0);e.setOverseers('food',1);e.dispatch('gather');const action=structuredClone(p.civ.actions.gather);
 p.points=new D(5);assert.equal(e.supply().councilWorkers,0);assert.deepEqual(p.civ.actions.gather,action);
 assert.equal(p.civ.councilScale,5);p.points=new D(7);assert.equal(e.supply().councilWorkers,5);
 p.points=new D(12);assert.equal(e.prestige('craft'),true);assert.equal(p.civ.councilScale,5);assert.equal(e.supply().councilWorkers,0);
 e.recall('gather');p.points=new D(1);assert.equal(e.dispatch('gather'),true);e.recall('gather');assert.equal(e.dispatch('water'),true);
 engine.exportPlayer();
});
test('missing Council field migrates to one; scaled staffing, queues and work reload through the normal codec',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);
 const old=JSON.parse(atob(engine.exportPlayer()));delete old.civ.councilScale;
 const migrated=game(t,btoa(JSON.stringify(old)));assert.equal(migrated.p.civ.councilScale,1);
 assert.equal(migrated.p.organization.total.toString(),p.organization.total.toString());
 e.setCouncilScale(5);e.setOverseers('food',25);e.setOverseers('huts',25);e.setRepeat('gather',125);e.setHutRepeat(125);e.setFireTenders(25);e.dispatch('gather');e.startProject('shelter-home');
 const save=engine.exportPlayer(),loaded=game(t,save);assert.equal(loaded.engine.exportPlayer(),save);
 assert.equal(loaded.e.summary().foodRepeatCap,125);assert.equal(loaded.e.supply().councilWorkers,5);
 for(const change of [r=>r.civ.councilScale=0,r=>r.civ.councilScale=6,r=>r.civ.councilScale=1.5,r=>r.civ.councilScale='2',r=>r.civ.councilScale=null,r=>r.organization.total='8',r=>r.civ.overseers.food=26,r=>r.civ.fireTenders=26,r=>r.civ.actions.gather.repeat=126,r=>r.civ.hutRepeat=126]){
  const candidate=JSON.parse(atob(save));change(candidate);assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(candidate))).ok,false);assert.equal(engine.exportPlayer(),save);
 }
 for(const bad of [0,6,1.5,NaN,Infinity,'2',null,undefined]){assert.equal(e.setCouncilScale(bad),false);assert.equal(engine.exportPlayer(),save);}
});
test('progression exposes Farming, Abundance, Irrigation and Council at the planned thresholds',t=>{
 const {p,e,D}=game(t);
 p.organization.best=new D(5);assert.equal(e.upgrades('food').some(x=>x.id==='farming'),false);
 p.organization.best=new D(6);assert.equal(e.upgrades('food').some(x=>x.id==='farming'),true);
 assert.equal(e.upgrades('shelter').some(x=>x.id==='abundance'),false);
 p.civ.improvements.farming=true;
 p.organization.best=new D(7);assert.equal(e.upgrades('shelter').some(x=>x.id==='abundance'),true);assert.equal(e.summary().irrigationAvailable,false);
 p.organization.best=new D(8);assert.equal(e.summary().irrigationAvailable,true);assert.equal(e.councilAvailable(),false);
 p.organization.total=new D(9);assert.equal(e.councilAvailable(),true);
 assert.deepEqual(e.organizationMilestones().slice(3,9).map(x=>x.name),['Fire','Gravity-fed spring','Farming','Abundance','Irrigation','Settlement Council']);
});

test('lifetime Council does not bypass the Fire gate in commands or detached save validation',t=>{
 const {engine,p,e,D}=game(t);p.organization.total=new D(9);p.organization.best=new D(3);p.organization.points=new D(0);
 assert.equal(e.setCouncilScale(2),true);assert.equal(e.setFireTenders(1),false);
 const before=engine.exportPlayer(),candidate=JSON.parse(atob(before));candidate.civ.fireTenders=1;
 assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(candidate))).ok,false);assert.equal(engine.exportPlayer(),before);
});
