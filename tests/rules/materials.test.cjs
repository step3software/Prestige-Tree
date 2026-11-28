const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
function game(t,save){const engine=createBalanceEngine(save);t.after(engine.dispose);const p=engine.player;return {engine,p,e:engine.session.modRules.civilization,D:p.points.constructor};}
function funded(g){const {p,e,D}=g;p.craft.points=new D(500);p.organization.total=new D(10);p.organization.points=new D(10);p.points=new D(8);p.civ.improvements.gravity=true;p.food.points=new D(50);p.water.points=new D(50);for(const id of ['crafting','clay','copper'])assert.equal(e.buyUpgrade(id),true);}
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);

test('material unlocks cost 10/20/30 and reveal four choices without buying them',t=>{
 const g=game(t),{p,e,D}=g;
 assert.deepEqual(e.materialRows().map(row=>row.items.length),[0,0,0]);
 assert.equal(e.buyUpgrade('hunting'),false);
 for(const [id,cost] of [['crafting',10],['clay',20],['copper',30]]){
  p.craft.points=new D(cost-1);const before=JSON.stringify(p);assert.equal(e.buyUpgrade(id),false);assert.equal(JSON.stringify(p),before);
  p.craft.points=new D(cost);assert.equal(e.buyUpgrade(id),true);assert.equal(p.craft.points.toNumber(),0);assert.equal(e.buyUpgrade(id),false);
 }
 assert.deepEqual(e.materialRows().map(row=>row.items.length),[4,4,4]);assert.equal(p.civ.improvements.hunting,false);
});
test('Organization alone does not unlock new hunting or buyables; basic huts stay at one',t=>{
 const {p,e,D}=game(t);p.organization.total=new D(10);p.organization.points=new D(10);
 assert.equal(e.actionDefinition('hunt').unlocked,false);assert.equal(e.startProject('water-site'),false);assert.equal(e.startProject('shelter-home'),true);
 e.cancelProject();p.craft.points=new D(11);assert.equal(e.buyUpgrade('crafting'),true);assert.equal(e.buyUpgrade('hunting'),true);assert.equal(e.actionDefinition('hunt').workers,2);
});
test('baskets upgrade in place to jars while cooking vessels stay separate',t=>{
 const g=game(t),{p,e,engine}=g;funded(g);
 assert.equal(e.buyUpgrade('jars'),false);assert.equal(e.startProject('water-storage'),true);engine.advance(12);assert.equal(p.water.storage,1);assert.equal(e.supply().storage.water,90);
 const level=p.water.storage;assert.equal(e.buyUpgrade('jars'),true);assert.equal(p.water.storage,level);assert.equal(e.supply().storage.water,220);
 assert.equal(e.buyUpgrade('copperPots'),false);p.civ.fire=1;assert.equal(e.buyUpgrade('cooking'),true);assert.equal(e.buyUpgrade('clayPots'),true);
 const capacity=e.supply().storage.water;assert.equal(e.buyUpgrade('copperPots'),true);assert.equal(e.supply().storage.water,capacity);assert.equal(p.water.storage,1);
 const projects=e.projects('water').filter(x=>x.id==='water-storage');assert.equal(projects.length,1);assert.equal(projects[0].name,'Earthenware jars');
});
test('roof tiers replace rather than add housing bonuses and preserve hut work',t=>{
 const g=game(t),{p,e,engine}=g;funded(g);e.startProject('shelter-home');engine.advance(3);const work=p.civ.projectWork;
 assert.equal(e.buyUpgrade('bricks'),false);assert.equal(e.buyUpgrade('roofs'),true);assert.equal(e.buyUpgrade('bricks'),true);assert.equal(p.civ.projectWork,work);
 engine.advance(20);assert.equal(p.shelter.homes,1);assert.equal(p.shelter.points.toNumber(),14);assert.equal(e.buyUpgrade('roofs'),false);
});
test('spring supports eight actual-upkeep equivalents, pipes double it and hauling remains legal',t=>{
 const g=game(t),{p,e,D}=g;funded(g);
 for(const org of [0,5,20]){p.organization.points=new D(org);p.points=new D(8);near(e.supply().passiveProduction.water,e.supply().demand);p.points=new D(9);assert.ok(e.supply().passiveProduction.water<e.supply().demand);}
 p.points=new D(8);p.water.points=new D(0);assert.equal(e.dispatch('water'),true);e.recall('water');
 p.civ.fire=1.99;const before=JSON.stringify(p);assert.equal(e.buyUpgrade('pipes'),false);assert.equal(JSON.stringify(p),before);
 p.civ.fire=2;const flow=e.supply().passiveProduction.water;assert.equal(e.buyUpgrade('pipes'),true);near(e.supply().passiveProduction.water,flow*2);near(p.civ.fire,0);
 p.civ.improvements.gravity=false;assert.equal(e.supply().passiveProduction.water,0);assert.equal(e.dispatch('water'),true);
});
test('clay fuel savings and Copper bonus affect actual Cooking without changing raw rewards',t=>{
 const g=game(t),{p,e,engine}=g;funded(g);p.civ.fire=10;e.buyUpgrade('cooking');e.setCookingLevel(3);e.dispatch('gather');
 const raw=p.civ.actions.gather.reward,requested=e.fireStatus().consumption;
 e.buyUpgrade('clayPots');near(e.fireStatus().consumption,requested*.75);e.buyUpgrade('copperPots');near(e.fireStatus().cookingMultiplier,3.5);
 const fire=p.civ.fire;engine.advance(1);near(fire-p.civ.fire,requested*.75/60);near(p.civ.actions.gather.reward,raw);near(p.civ.actions.gather.cookingBonus,raw/10*2.5);
 e.setCookingLevel(1);near(e.fireStatus().consumption,0);near(e.fireStatus().cookingMultiplier,1);engine.exportPlayer();
});
test('sickles change only new Farming durations; axes speed actual hut work',t=>{
 const g=game(t),{p,e,engine}=g;funded(g);p.civ.improvements.farming=true;e.dispatch('farm');const duration=p.civ.actions.farm.duration;
 assert.equal(e.buyUpgrade('sickles'),true);assert.equal(p.civ.actions.farm.duration,duration);e.recall('farm');near(e.actionDefinition('farm').duration,duration*.75);
 e.startProject('shelter-home');engine.advance(1);const work=p.civ.projectWork;e.buyUpgrade('copperAxes');engine.advance(1);near(p.civ.projectWork-work,work*2);
});
test('Fire projects use builders, add no stock, improve output/efficiency and reset on prestige',t=>{
 const g=game(t),{p,e,engine,D}=g;funded(g);p.civ.fire=2;
 for(const [id,work] of [['fire-fuel',12],['fire-hearths',16],['fire-charcoal',24]]){const craft=p.craft.points.toNumber();assert.equal(e.startProject(id),true);assert.equal(e.supply().builders,1);assert.ok(p.craft.points.toNumber()<craft);assert.equal(e.startProject(id),false);engine.advance(work);}
 assert.deepEqual(p.civ.fireBuyables,{fuel:1,hearths:1,charcoal:1});near(p.civ.fire,2);assert.equal(e.fireStatus().maximum,20);near(e.fireStatus().gain,0);
 e.setFireTenders(1);near(e.fireStatus().gain,(.5+1.5*.1*.1)*1.2);e.setFireTenders(0);p.civ.fire=10;e.buyUpgrade('cooking');e.setCookingLevel(3);e.dispatch('gather');near(e.fireStatus().consumption,.96/1.15);
 e.recall('gather');p.points=new D(12);assert.equal(e.prestige('craft'),true);assert.deepEqual(p.civ.fireBuyables,{fuel:0,hearths:0,charcoal:0});assert.equal(p.civ.improvements.crafting,true);
});
test('legacy Fire save migrates without charging or discarding active paid work',t=>{
 const fixture=require('../fixtures/civ-pre-fire-v08.json');const g=game(t,fixture.player),{p,engine}=g;
 assert.equal(p.version,'0.92');assert.ok(p.civ.improvements.crafting);assert.deepEqual(p.civ.fireBuyables,{fuel:0,hearths:0,charcoal:0});
 const loaded=game(t,engine.exportPlayer());assert.equal(loaded.engine.exportPlayer(),engine.exportPlayer());
});
test('save validation rejects malformed material tiers and Fire levels without changing live state',t=>{
 const g=game(t),{p,engine}=g;funded(g);const encoded=engine.exportPlayer();
 for(const change of [raw=>raw.civ.fireBuyables.fuel=-1,raw=>raw.civ.improvements.copperPots=true]){const raw=JSON.parse(atob(encoded));change(raw);const result=engine.session.loadPlayer(btoa(JSON.stringify(raw)));assert.equal(result.ok,false);assert.equal(engine.exportPlayer(),encoded);}
});
test('historical malformed discovery flags reject before migration and preserve the live settlement',t=>{
 const g=game(t),{engine}=g;funded(g);const encoded=engine.exportPlayer();
 for(const field of ['buyables','hunting']){
  const raw=JSON.parse(atob(encoded));raw.version='0.8';raw.civ.features[field]='invalid';
  const result=engine.session.loadPlayer(btoa(JSON.stringify(raw)));
  assert.equal(result.ok,false,field+' must be validated before conversion');
  assert.equal(engine.exportPlayer(),encoded);
 }
});
test('material/Fire economy has identical saved state under chunked advancement',t=>{
 const g=game(t),{p,e,engine}=g;funded(g);p.civ.fire=10;e.buyUpgrade('cooking');e.buyUpgrade('clayPots');e.buyUpgrade('copperPots');e.setCookingLevel(3);e.setFireTenders(1);e.dispatch('gather');e.startProject('fire-fuel');
 const clone=game(t,engine.exportPlayer());engine.advance(15);for(let i=0;i<30;i++)clone.engine.advance(.5);assert.equal(engine.exportPlayer(),clone.engine.exportPlayer());
});


test('earned Fire stays available while spending lowers held balance and paid construction survives reload',t=>{
 const {engine,p,e,D}=game(t);p.organization.points=new D(4);p.organization.total=new D(100);p.craft.points=new D(11);
 e.buyUpgrade('crafting');assert.equal(e.startProject('fire-fuel'),true);assert.equal(e.setFireTenders(2),true);p.civ.fire=1;
 assert.equal(e.buyUpgrade('preparedMaterials'),true);assert.equal(p.organization.points.toNumber(),3);assert.equal(e.fireStatus().available,true);assert.ok(e.fireStatus().gain>0);assert.equal(e.supply().fireTenders,2);
 const loaded=game(t,engine.exportPlayer());loaded.engine.advance(12);assert.equal(loaded.p.civ.fireBuyables.fuel,1);assert.ok(loaded.p.civ.fire>1);
 assert.equal(loaded.e.fireStatus().tenders,2);assert.equal(loaded.e.fireStatus().available,true);
});

test('an imported active Fire project requires its permanent Craft material',t=>{
 const g=game(t),{p,e,engine}=g;funded(g);assert.equal(e.startProject('fire-fuel'),true);
 const encoded=engine.exportPlayer(),raw=JSON.parse(atob(encoded));raw.civ.improvements.crafting=false;
 assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(raw))).ok,false);assert.equal(engine.exportPlayer(),encoded);
});


test('saved pending supervisors share Fire and active crews without overbooking after permanent unlocks',t=>{
 const g=game(t),{p,e,engine,D}=g;funded(g);p.points=new D(7);p.civ.features.hunting=true;
 assert.equal(e.setFireTenders(2),true);assert.equal(e.dispatch('hunt'),true);assert.equal(e.dispatch('water'),true);
 p.food.points=new D(10);p.civ.actions.gather.repeat=4;p.civ.hutRepeat=4;
 const loaded=game(t,engine.exportPlayer());assert.equal(loaded.e.supply().overseerWorkers,0);assert.equal(loaded.e.supply().foremanWorkers,0);
 for(let i=0;i<30;i++){loaded.engine.advance(1);assert.ok(loaded.e.supply().laborUsed<=loaded.p.points.toNumber());}
 assert.ok(loaded.p.civ.actions.gather.repeat<4);loaded.engine.exportPlayer();
});
