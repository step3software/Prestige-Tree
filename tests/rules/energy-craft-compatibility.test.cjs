const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
const fixtures=require('../fixtures/energy-craft-v093.json');

for(const name of ['energy','craft'])test('actual '+name+' 0.93 save migrates once into Energy with repeatable Craft equipment',t=>{
 const raw=JSON.parse(atob(fixtures[name].encoded));assert.equal(raw.version,'0.93');
 const engine=createBalanceEngine(fixtures[name].encoded);t.after(engine.dispose);const p=engine.player,e=engine.session.modRules.civilization,D=p.points.constructor;
 assert.equal(p.version,'0.94');assert.equal(Object.hasOwn(p.civ,'fireBuyables'),false);assert.equal(Object.hasOwn(p.civ,'cookingLevel'),false);
 assert.equal(Object.hasOwn(p.civ.improvements,'cooking'),false);assert.equal(p.points.toString(),String(raw.points));
 assert.deepEqual(p.civ.actions.gather,raw.civ.actions.gather);assert.equal(p.shelter.points.toString(),String(raw.shelter.points));
 assert.equal(p.food.points.toString(),String(raw.food.points));assert.equal(p.water.points.toString(),String(raw.water.points));
 if(name==='energy'){
  assert.equal(p.civ.cooks,3);assert.equal(p.tab,'energy');assert.equal(p.civ.project,'');assert.equal(e.supply().builders,0);
  assert.equal(p.civ.equipment.roofs,0);assert.equal(p.civ.equipment.bricks,1);
  assert.equal(p.civ.equipment['water-storage'],raw.water.storage);assert.equal(p.civ.equipment.jars,1);
  assert.equal(e.supply().storage.water,100+120*raw.water.storage);assert.equal(p.civ.equipment.copperPots,1);
  assert.ok(p.craft.points.eq(new D(raw.craft.points).add(6)),'Known Food/Fire recipe refunds occur once; Cooking grants no refund');
  assert.equal(p.civ.fire,10+2*p.shelter.homes);assert.equal(p.food.storage,0);
 }else{
  assert.equal(p.civ.cooks,0);assert.deepEqual(p.civ.equipment,raw.civ.equipment);
  assert.equal(p.civ.project,'roofs');assert.equal(p.civ.projectWork,raw.civ.projectWork);assert.equal(e.supply().builders,1);
  assert.equal(p.craft.points.toString(),String(raw.craft.points));assert.equal(p.civ.fire,raw.civ.fire);
 }
 const saved=engine.exportPlayer(),again=createBalanceEngine(saved);t.after(again.dispose);
 assert.equal(again.exportPlayer(),saved,'Reload does not replay conversion, refunds, staffing or work');
 assert.equal(again.session.modRules.civilization.setCooks(0),true);assert.equal(again.player.civ.cooks,0);
});

test('damaged, mixed and overbooked 0.93 saves reject before any refund or live replacement',t=>{
 const engine=createBalanceEngine();t.after(engine.dispose);const before=engine.exportPlayer();
 const legacy=JSON.parse(atob(fixtures.energy.encoded)),current=JSON.parse(atob(fixtures.craft.encoded));
 for(const [source,change]of [
  [legacy,x=>x.civ.projectWork=-1],
  [legacy,x=>x.civ.cooks=6],
  [legacy,x=>x.points='6'],
  [legacy,x=>x.civ.improvements.copperPots='yes'],
  [current,x=>x.civ.equipment.roofs=1.5],
  [current,x=>delete x.civ.equipment],
  [current,x=>x.civ.fireBuyables={fuel:1,hearths:0,charcoal:0}],
 ]){
  const bad=structuredClone(source);change(bad);assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(bad))).ok,false);
  assert.equal(engine.exportPlayer(),before);
 }
});
