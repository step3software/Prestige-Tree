const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
function game(t,save){const engine=createBalanceEngine(save);t.after(engine.dispose);const p=engine.player;return {engine,p,e:engine.session.modRules.civilization,D:p.points.constructor};}
function stage(p,D,total=4){p.organization.total=new D(total);p.points=new D(8);p.shelter.homes=0;p.shelter.points=new D(8);p.civ.improvements.gravity=true;p.food.points=new D(50);p.water.points=new D(50);}
const near=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<tolerance,`${a} expected ${b}`);

test('Fire unlocks at MS4 with exact 1/2/3 Fire purchases and revised milestones',t=>{
 const {p,e,D}=game(t);p.civ.fire=10;
 assert.equal(e.fireStatus().available,false);assert.equal(e.setFireTenders(1),false);
 for(const id of ['cooking','jars','hearth'])assert.equal(e.buyUpgrade(id),false);
 p.civ.fire=0;p.organization.total=new D(4);
 assert.deepEqual(e.organizationMilestones().slice(3,9).map(x=>x.name),['Fire','Gravity-fed spring','Food and Water buyables','Farming','Abundance','Irrigation']);
 assert.deepEqual(e.upgrades('fire').map(x=>[x.id,x.costs.fire]),[['cooking',1],['jars',2],['hearth',3]]);
 for(const [id,cost] of [['cooking',1],['jars',2],['hearth',3]]){
  const before=JSON.stringify(p);assert.equal(e.buyUpgrade(id),false);assert.equal(JSON.stringify(p),before);
  p.civ.fire=cost;assert.equal(e.buyUpgrade(id),true);assert.equal(p.civ.fire,0);assert.equal(e.buyUpgrade(id),false);
 }
 assert.equal(e.projects('water').length,0);assert.equal(e.supply().storage.water,100);
 p.organization.total=new D(6);assert.ok(e.projects('water').length);
 assert.equal(e.buyUpgrade('abundance'),false);p.organization.total=new D(8);assert.equal(e.buyUpgrade('abundance'),true);
});

test('tending uses shared whole workers, accepts zero and preserves hut-based Fire capacity',t=>{
 const {p,e,D}=game(t);stage(p,D);p.shelter.homes=2;p.shelter.points=new D(16);
 for(const bad of [-1,6,1.5,NaN,Infinity])assert.equal(e.setFireTenders(bad),false);
 assert.equal(e.fireStatus().maximum,14);p.civ.fire=7;
 assert.equal(e.setFireTenders(5),true);assert.equal(e.supply().availableWorkers,3);
 assert.equal(e.dispatch('hunt'),true);assert.equal(e.supply().availableWorkers,0);
 assert.equal(e.dispatch('water'),false);assert.equal(e.startProject('shelter-home'),false);
 assert.equal(e.setFireTenders(0),true);assert.equal(e.supply().availableWorkers,5);assert.equal(p.civ.fire,7);assert.equal(e.fireStatus().maximum,14);
});

test('empty, half and full Fire use the proposed gain formula and never exceed capacity',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);
 for(const workers of [1,2,3,5])for(const fill of [0,.5,1]){
  assert.equal(e.setFireTenders(workers),true);p.civ.fire=10*fill;
  near(e.fireStatus().gain,workers*(.5+1.5*fill*fill));
 }
 p.civ.fire=0;e.setFireTenders(3);engine.advance(1);near(p.civ.fire,.025);
 p.civ.fire=10;engine.advance(1);assert.equal(p.civ.fire,10);
});

test('Cooking follows 45 Food/min cost table and consumes nothing without Food work',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.civ.improvements.cooking=true;p.civ.improvements.digging=true;p.civ.fire=10;
 assert.equal(e.setCookingLevel(5),true);engine.advance(2);assert.equal(p.civ.fire,10);
 assert.equal(e.dispatch('gather'),true);
 for(let level=1;level<=5;level++){
  e.setCookingLevel(level);near(e.fireStatus().uncookedProduction,45);near(e.fireStatus().consumption,.3*(level-1)**2);near(e.supply().production.food,45*level);
 }
 for(const bad of [0,6,2.5,NaN])assert.equal(e.setCookingLevel(bad),false);
});

test('Cooking spends during work, stores bonus until completion, and keeps base Food after fuel depletion',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.civ.improvements.cooking=true;p.civ.fire=.016;e.setCookingLevel(5);p.food.points=new D(0);
 assert.equal(e.dispatch('gather'),true);engine.advance(1);
 near(p.civ.fire,0);near(p.civ.actions.gather.cookingBonus,.6);assert.equal(p.food.points.toNumber(),0);
 assert.equal(e.fireStatus().fuelLimited,true);near(e.supply().production.food,36);
 engine.advance(9);near(p.food.total.toNumber(),16.6);assert.equal(p.civ.actions.gather.completed,1);assert.equal(p.civ.actions.gather.cookingBonus,0);
});

test('fivefold expeditions plus fivefold Cooking pay 25x Food over 5x time, with scaling fuel cost',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.civ.improvements.cooking=true;p.civ.improvements.extendedExpeditions=true;
 p.civ.fire=10;p.food.storage=10;p.food.points=new D(0);e.setCookingLevel(5);e.setExpeditionMultiplier('gather',5);
 const base=e.actionDefinition('gather');assert.equal(base.duration,50);assert.equal(base.reward,30);assert.equal(base.workers,1);
 e.dispatch('gather');near(e.fireStatus().consumption,3.84);engine.advance(50);
 near(p.food.total.toNumber(),160);near(p.civ.fire,6.8);
});

test('changing Cooking mid-job applies only to fueled work and recall forfeits its accumulated bonus',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.civ.improvements.cooking=true;p.civ.fire=10;p.food.points=new D(0);
 e.setCookingLevel(5);e.dispatch('gather');engine.advance(5);near(p.civ.actions.gather.cookingBonus,12);
 e.setCookingLevel(1);engine.advance(5);near(p.food.total.toNumber(),28);near(p.civ.fire,9.68);
 e.setCookingLevel(5);e.dispatch('gather');engine.advance(2);assert.ok(p.civ.actions.gather.cookingBonus>0);e.recall('gather');assert.equal(p.civ.actions.gather.cookingBonus,0);
});

test('jar purchases keep Craft/work, spend scaling Fire once and reject atomically when either currency is short',t=>{
 const {engine,p,e,D}=game(t);stage(p,D,6);p.civ.improvements.jars=true;p.craft.points=new D(10);p.civ.fire=10;
 for(let owned=0;owned<4;owned++){
  p.water.storage=owned;const jar=e.projects('water').find(x=>x.id==='water-storage'),cost=.5*1.5**owned;
  near(jar.fireCost,cost);near(jar.work,12*1.35**owned);assert.equal(jar.craftCost,1);assert.equal(e.supply().storage.water,100+120*owned);
  p.civ.fire=cost-.001;const before=JSON.stringify(p);assert.equal(e.startProject(jar.id),false);assert.equal(JSON.stringify(p),before);
  p.civ.fire=cost;const craft=p.craft.points.toNumber();assert.equal(e.startProject(jar.id),true);near(p.civ.fire,0);near(p.craft.points.toNumber(),craft-1);
  e.cancelProject();near(p.civ.fire,0);near(p.craft.points.toNumber(),craft-1);
 }
 p.civ.fire=10;p.craft.points=new D(0);assert.equal(e.startProject('water-storage'),false);assert.equal(p.civ.fire,10);
});

test('both prestiges clear Fire and tenders, retaining upgrades and safe accumulated active Food',t=>{
 for(const id of ['craft','organization']){
  const {engine,p,e,D}=game(t);stage(p,D);p.points=new D(28);p.civ.fire=10;
  for(const key of ['cooking','jars','hearth'])p.civ.improvements[key]=true;
  e.setFireTenders(3);e.setCookingLevel(5);e.dispatch('gather');engine.advance(2);
  assert.match(e.prestigePreview(id).resetText,/stored Fire resets to 0/);assert.equal(e.prestige(id),true);
  assert.equal(p.civ.fire,0);assert.equal(p.civ.fireTenders,0);assert.equal(e.fireStatus().maximum,10);
  for(const key of ['cooking','jars','hearth'])assert.equal(p.civ.improvements[key],true);
  assert.equal(e.supply().storage.water,100);engine.exportPlayer();
 }
});

test('Population loss releases tenders before survival crews and leaves a valid save',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.food.points=new D(0);p.water.points=new D(0);p.civ.improvements.gravity=false;
 e.setFireTenders(5);e.dispatch('hunt');engine.advance(10);
 assert.equal(p.points.toNumber(),7);assert.equal(p.civ.fireTenders,4);assert.equal(p.civ.actions.hunt.workers,3);assert.equal(e.supply().laborUsed,7);engine.exportPlayer();
});

test('actual PR12 codec export migrates once without retroactive fuel charges or changes to paid work',t=>{
 const fixture=require('../fixtures/civ-pre-fire-v08.json'),raw=JSON.parse(atob(fixture.player));
 const {engine,p,e}=game(t,fixture.player);
 assert.equal(p.civ.fire,0);assert.equal(p.civ.fireTenders,0);assert.equal(p.civ.cookingLevel,1);
 assert.equal(p.civ.project,'water-storage');assert.equal(p.civ.projectWork,raw.civ.projectWork);
 assert.equal(p.civ.actions.gather.reward,raw.civ.actions.gather.reward);assert.equal(p.civ.actions.gather.remaining,raw.civ.actions.gather.remaining);assert.equal(p.civ.actions.gather.cookingBonus,0);
 assert.equal(p.civ.improvements.hearth,true);assert.equal(e.supply().storage.food,100);assert.equal(e.supply().passiveProduction.food,0);
 engine.advance(10);assert.equal(p.water.storage,1);assert.equal(p.civ.fire,0);game(t,engine.exportPlayer());
});

test('invalid Fire and cooked snapshots reject without changing live state; chunks and reloads stay identical',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.civ.improvements.cooking=true;p.civ.fire=1;e.setFireTenders(2);e.setCookingLevel(5);e.dispatch('gather');engine.advance(2.25);
 const encoded=engine.exportPlayer();
 for(const change of [x=>x.civ.fire=-1,x=>x.civ.fire=11,x=>x.civ.fireTenders=6,x=>x.civ.fireTenders=2.5,x=>x.civ.cookingLevel=6,x=>x.civ.actions.water.cookingBonus=1,x=>x.civ.actions.gather.cookingBonus=25,x=>x.points='2']){
  const raw=JSON.parse(atob(encoded));change(raw);assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(raw))).ok,false);assert.equal(engine.exportPlayer(),encoded);
 }
 const one=game(t,encoded),chunks=game(t,encoded);one.engine.advance(70.75);
 for(const seconds of [.25,.5,3,7,60])chunks.engine.advance(seconds);
 assert.equal(one.engine.exportPlayer(),chunks.engine.exportPlayer());
});

test('two huts and three tenders reproduce the proposed fill and upgrade timing without Cooking spend',t=>{
 for(const spend of [false,true]){
  const {engine,p,e,D}=game(t);stage(p,D);p.points=new D(16);p.shelter.homes=2;p.shelter.points=new D(16);p.food.points=new D(1000);p.water.points=new D(1000);e.setFireTenders(3);
  let elapsed=0;
  while(elapsed<600){
   engine.advance(1);elapsed++;
   if(spend)for(const id of ['cooking','jars','hearth']){if(!p.civ.improvements[id]){e.buyUpgrade(id);break;}}
   if(spend?p.civ.improvements.hearth:p.civ.fire===14)break;
  }
  assert.ok(spend?elapsed>=230&&elapsed<=240:elapsed>=338&&elapsed<=341);
  console.log(`Synthetic two-hut/three-tender ${spend?'three upgrade purchases':'full Fire'}: ${elapsed}s; 1× Cooking, one-second simulation.`);
 }
});
