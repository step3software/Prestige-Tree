const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
function game(t,save){const engine=createBalanceEngine(save);t.after(engine.dispose);const p=engine.player;return {engine,p,e:engine.session.modRules.civilization,D:p.points.constructor};}
function stage(p,D,total=3){p.organization.total=new D(total);p.organization.points=new D(total);p.organization.points=new D(10);p.craft.points=new D(20);p.points=new D(30);p.shelter.homes=10;p.shelter.points=new D(48);p.food.points=new D(50);p.water.points=new D(50);}

test('the actual pre-redesign v0.8 codec export keeps discovered activities and paid work',t=>{
 const fixture=require('../fixtures/civ-pre-ms123-v08.json'),raw=JSON.parse(atob(fixture.player));
 const {engine,p,e}=game(t,fixture.player);
 assert.equal(p.version,'0.93');assert.equal(p.points.toString(),raw.points);
 assert.equal(p.food.points.toString(),raw.food.points);assert.equal(p.craft.points.toString(),raw.craft.points);
 assert.equal(p.civ.project,raw.civ.project);assert.equal(p.civ.projectWork,raw.civ.projectWork);
 assert.equal(p.civ.preparedHut,false);
 assert.equal(p.civ.actions.hunt.reward,raw.civ.actions.hunt.reward);assert.equal(p.civ.actions.hunt.remaining,raw.civ.actions.hunt.remaining);
 assert.equal(p.civ.actions.gather.repeat,raw.civ.actions.gather.repeat);
 assert.equal(e.actionDefinition('fish'),null);assert.ok(e.projects('food').length>0,'Paid historical equipment migrates to Craft capability');
 assert.deepEqual(p.civ.overseers,{food:1,huts:1});
 const loaded=game(t,engine.exportPlayer());assert.deepEqual(loaded.p.civ.features,p.civ.features);
});

test('twenty-five repeats exhaust once each with five overseers, including a mid-queue reload',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.points=new D(8);p.shelter.homes=0;p.shelter.points=new D(8);p.civ.improvements.workRosters=true;p.civ.improvements.gravity=true;
 e.setOverseers('food',5);assert.equal(e.setRepeat('gather',25),true);
 engine.advance(126);const loaded=game(t,engine.exportPlayer());
 engine.advance(1200);loaded.engine.advance(1200);
 for(const state of [p,loaded.p]){assert.equal(state.civ.actions.gather.completed,25);assert.equal(state.civ.actions.gather.repeat,0);assert.equal(state.civ.actions.gather.remaining,0);}
 assert.equal(e.supply().overseerWorkers,0);assert.equal(engine.exportPlayer(),loaded.engine.exportPlayer());
});

test('fresh play retains eight-person hut bootstrap and moves hunting to Craft spending',t=>{
 const {engine,p,e,D}=game(t);assert.deepEqual(e.projects('shelter'),[]);assert.equal(e.dispatch('hunt'),false);
 engine.advance(36);assert.equal(e.prestige('organization'),true);assert.equal(e.startProject('shelter-home'),true);e.cancelProject();
 p.organization.total=new D(2);p.organization.points=new D(2);assert.equal(e.dispatch('hunt'),false);p.craft.points=new D(11);assert.equal(e.buyUpgrade('crafting'),true);assert.equal(e.buyUpgrade('hunting'),true);engine.advance(12);assert.equal(e.dispatch('hunt'),true);e.recall('hunt');
 p.organization.total=new D(3);p.organization.points=new D(3);assert.equal(e.setRepeat('gather',5),true);assert.equal(e.setHutRepeat(5),true);engine.exportPlayer();
});

test('material equipment and retained Organization upgrades charge their actual currencies once',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.craft.points=new D(100);e.buyUpgrade('crafting');e.buyUpgrade('clay');e.buyUpgrade('copper');
 const buy=(id,currency,cost)=>{const before=p[currency].points.toNumber(),total=p.organization.total.toNumber();assert.equal(e.buyUpgrade(id),true);assert.equal(p[currency].points.toNumber(),before-cost);assert.equal(p.organization.total.toNumber(),total);assert.equal(e.buyUpgrade(id),false);if(Object.hasOwn(p.civ.equipment,id))engine.advance(12);};
 buy('roofs','craft',1);buy('bricks','craft',2);buy('copperAxes','craft',3);buy('digging','craft',1);buy('hunting','craft',1);buy('butchery','craft',3);
 assert.equal(e.actionDefinition('gather').reward,7.5);assert.equal(e.actionDefinition('hunt').reward,36);assert.equal(e.actionDefinition('hunt').workers,2);
 for(const [id,cost] of [['preparedMaterials',1],['extendedExpeditions',2],['workRosters',3]])buy(id,'organization',cost);
});

test('extended expeditions snapshot 1-5x time and yield, unchanged crews and one repeat',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.civ.improvements.extendedExpeditions=true;
 for(const bad of [0,6,1.5,NaN])assert.equal(e.setExpeditionMultiplier('gather',bad),false);
 assert.equal(e.setExpeditionMultiplier('water',2),false);
 const base=e.actionDefinition('gather');assert.equal(e.setExpeditionMultiplier('gather',5),true);
 const scaled=e.actionDefinition('gather');assert.equal(scaled.duration,base.duration*5);assert.equal(scaled.reward,base.reward*5);assert.equal(scaled.workers,base.workers);
 assert.equal(e.setRepeat('gather',5),true);p.food.points=new D(10);engine.advance(1);
 assert.equal(p.civ.actions.gather.repeat,4);assert.equal(p.civ.actions.gather.jobs,1);assert.equal(p.civ.actions.gather.duration,50);
 e.setExpeditionMultiplier('gather',1);assert.equal(p.civ.actions.gather.duration,50);assert.equal(p.civ.actions.gather.reward,30);
 const loaded=game(t,engine.exportPlayer());assert.equal(loaded.p.civ.actions.gather.duration,50);
 assert.equal(loaded.p.civ.expeditionMultipliers.gather,1);
});

test('separate 1-5 overseer assignments support finite 5-25 repeat caps and cannot erase orders',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.civ.improvements.workRosters=true;
 assert.equal(e.setOverseers('food',5),true);assert.equal(e.setOverseers('huts',3),true);
 assert.equal(e.setRepeat('gather',25),true);assert.equal(e.setHutRepeat(15),true);
 assert.equal(e.supply().overseerWorkers,5);assert.equal(e.supply().foremanWorkers,3);
 assert.equal(e.setRepeat('gather',26),false);assert.equal(e.setHutRepeat(16),false);
 const before=JSON.stringify(p);assert.equal(e.setOverseers('food',4),false);assert.equal(JSON.stringify(p),before);
 e.setRepeat('gather',0);assert.equal(e.supply().overseerWorkers,0);assert.equal(e.supply().foremanWorkers,3);
 e.setHutRepeat(0);assert.equal(e.supply().foremanWorkers,0);
 p.points=new D(8);assert.equal(e.setOverseers('huts',5),true);e.setRepeat('gather',25);
 assert.equal(e.setHutRepeat(25),false,'Separate managers cannot overbook the same workers');
 e.setRepeat('gather',0);p.points=new D(30);e.setRepeat('gather',1);e.setHutRepeat(1);
 p.food.points=new D(10);engine.advance(1);assert.equal(p.civ.actions.gather.repeat,0);assert.equal(p.civ.hutRepeat,0);
 assert.equal(e.supply().overseerWorkers,0);assert.equal(e.supply().foremanWorkers,0);
 engine.exportPlayer();
});

test('Prepared materials discounts automatic hut work only and survives save/reload',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.civ.improvements.preparedMaterials=true;
 assert.equal(e.startProject('shelter-home'),true);const manual=e.summary().project.work;
 assert.equal(p.civ.preparedHut,false);e.cancelProject();e.setHutRepeat(1);engine.advance(1);
 assert.equal(p.civ.preparedHut,true);assert.equal(e.summary().project.work,manual*.75);
 const loaded=game(t,engine.exportPlayer());assert.equal(loaded.e.summary().project.work,e.summary().project.work);
 loaded.e.cancelProject();assert.equal(loaded.p.civ.preparedHut,false);
});

test('Work rosters does not carry queues across resets and invalid staffing loads are atomic',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.civ.improvements.workRosters=true;
 e.setOverseers('food',3);e.setRepeat('gather',15);e.setHutRepeat(5);
 const save=engine.exportPlayer(),raw=JSON.parse(atob(save));
 for(const modify of [r=>r.civ.overseers.food=6,r=>r.civ.overseers.huts=0,r=>r.civ.actions.gather.repeat=16,r=>r.civ.expeditionMultipliers.gather=5]){
  const candidate=structuredClone(raw);modify(candidate);const before=engine.exportPlayer();
  assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(candidate))).ok,false);assert.equal(engine.exportPlayer(),before);
 }
 assert.equal(e.prestige('craft'),true);assert.equal(p.civ.actions.gather.repeat,0);assert.equal(p.civ.hutRepeat,0);assert.equal(e.supply().overseerWorkers,0);
});

test('irrigation affects Farming only, including with extended expeditions',t=>{
 const {p,e,D}=game(t);stage(p,D,9);p.civ.improvements.farming=true;p.civ.improvements.extendedExpeditions=true;
 const before=Object.fromEntries(['gather','hunt','farm'].map(id=>[id,e.actionDefinition(id).reward]));
 assert.equal(e.irrigate(),true);
 for(const id of ['gather','hunt'])assert.equal(e.actionDefinition(id).reward,before[id]);
 assert.equal(e.actionDefinition('farm').reward,before.farm*1.35);
 e.setExpeditionMultiplier('farm',5);assert.ok(Math.abs(e.actionDefinition('farm').reward-before.farm*1.35*5)<1e-8);
});
