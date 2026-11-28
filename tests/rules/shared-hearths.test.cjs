const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
const Decimal=require('../../js/technical/break_eternity.js');
function game(t,save){const engine=createBalanceEngine(save);t.after(engine.dispose);const p=engine.player;Object.assign(p.civ.features,{huts:true,hunting:true,fishing:true,buyables:false});p.civ.improvements.crafting=true;return {engine,p,e:engine.session.modRules.civilization};}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} expected ${b}`);

test('hearth storage uses current whole tens and income uses Fire fullness, without housing or labor changes',t=>{
 const {p,e}=game(t);p.food.storage=2;p.shelter.homes=3;p.shelter.points=new Decimal(20);
 for(const population of [1,5,9,10,19,20,29,30,49,50,100,19,9])for(const fill of [0,.5,1]){
  p.points=new Decimal(population);p.civ.fire=16*fill;p.civ.improvements.hearth=true;
  const groups=Math.floor(population/10),s=e.supply();
  assert.equal(s.storage.food,130+25*groups);near(s.passiveProduction.food,4*groups*fill);
  assert.equal(s.support,20);assert.equal(s.availableWorkers,population);
 }
});

test('spending Fire reduces hearth income immediately while its storage stays',t=>{
 const {p,e}=game(t);p.points=new Decimal(20);p.organization.total=new Decimal(4);p.civ.improvements.hearth=true;p.civ.fire=10;
 assert.equal(e.supply().storage.food,100);near(e.supply().passiveProduction.food,8);
 assert.equal(e.buyUpgrade('cooking'),true);near(e.supply().passiveProduction.food,7.2);assert.equal(e.supply().storage.food,100);
 e.setCookingLevel(5);near(e.supply().passiveProduction.food,7.2);
 p.civ.fire=0;near(e.supply().passiveProduction.food,0);assert.equal(e.supply().storage.food,100);
});

test('hearths deliver real Food, cap at storage and stay outside Cooking',t=>{
 const {engine,p,e}=game(t);p.points=new Decimal(10);p.civ.improvements.hearth=true;p.civ.fire=10;p.food.points=new Decimal(40);p.water.points=new Decimal(50);
 engine.advance(60);near(p.food.points.toNumber(),34);near(p.food.total.toNumber(),14);
 p.food.points=new Decimal(75);const total=p.food.total.toNumber();engine.advance(1);near(p.food.points.toNumber(),75-10/60);near(p.food.total.toNumber(),total);
 p.food.points=new Decimal(10);p.civ.improvements.cooking=true;e.setCookingLevel(5);e.dispatch('gather');
 near(e.supply().production.food,184);engine.advance(10);
 assert.equal(p.civ.actions.gather.completed,1);near(e.supply().passiveProduction.food,4*(10-.64)/10);
 near(p.food.total.toNumber(),total+30+4*(10-3.84/60*5.5)/10/6);
});

test('shortage population loss lowers storage without erasing excess stored Food',t=>{
 const {engine,p,e}=game(t);p.points=new Decimal(20);p.civ.improvements.hearth=true;p.civ.fire=10;p.food.points=new Decimal(100);p.water.points=new Decimal(0);
 engine.advance(10);assert.equal(p.points.toNumber(),19);assert.equal(e.supply().storage.food,75);near(e.supply().passiveProduction.food,4);assert.ok(p.food.points.gt(75));
});

test('both prestiges retain hearth ownership and derive zero benefits at five people',t=>{
 for(const id of ['craft','organization']){
  const {p,e}=game(t);p.points=new Decimal(48);p.organization.total=new Decimal(9);p.organization.points=new Decimal(9);p.shelter.homes=10;p.shelter.points=new Decimal(48);p.civ.improvements.hearth=true;p.civ.fire=10;
  assert.equal(e.prestige(id),true);assert.equal(p.civ.improvements.hearth,true);assert.equal(p.civ.fire,0);assert.equal(e.supply().storage.food,50);assert.equal(e.supply().passiveProduction.food,0);
 }
});

test('hearths and partial Cooking remain deterministic across save and offline chunks',t=>{
 const {engine,p,e}=game(t);p.points=new Decimal(19);p.shelter.homes=5;p.shelter.points=new Decimal(28);p.organization.total=new Decimal(4);p.food.points=new Decimal(55);p.water.points=new Decimal(50);
 p.civ.improvements.hearth=true;p.civ.improvements.cooking=true;p.civ.fire=5;e.setFireTenders(2);e.setCookingLevel(5);e.dispatch('gather');
 const one=game(t,engine.exportPlayer()),chunks=game(t,engine.exportPlayer());one.engine.advance(180);
 for(const seconds of [.25,11.75,6,12,30,60,60])chunks.engine.advance(seconds);
 assert.equal(one.engine.exportPlayer(),chunks.engine.exportPlayer());
});

test('hearth-adjusted Food capacity changes only its abundance curve and cannot fake stored reserves',t=>{
 const {p,e}=game(t);p.organization.total=new Decimal(8);p.organization.points=new Decimal(8);e.buyUpgrade('abundance');p.points=new Decimal(20);p.food.points=new Decimal(50);p.water.points=new Decimal(50);p.shelter.homes=12;p.shelter.points=new Decimal(56);p.civ.fire=34;
 const before=e.supply().abundance;p.civ.improvements.hearth=true;const after=e.supply();
 assert.equal(after.storage.food,100);near(after.passiveProduction.food,8);assert.equal(after.abundance.water.bonus,before.water.bonus);assert.equal(after.abundance.shelter.bonus,before.shelter.bonus);assert.ok(after.abundance.food.bonus<before.food.bonus);
 p.food.points=new Decimal(0);assert.equal(e.supply().abundance.food.bonus,0);assert.equal(e.supply().growing,false);near(e.supply().passiveProduction.food,8);
});
