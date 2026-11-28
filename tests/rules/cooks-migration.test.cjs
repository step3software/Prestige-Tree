const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
const fixture=require('../fixtures/cooks-v091.json');

test('actual v0.91 codec export removes paid Cooking without refund and preserves pots, work and accrued Food',t=>{
 const raw=JSON.parse(atob(fixture.encoded));assert.equal(raw.version,'0.91');assert.equal(raw.civ.improvements.cooking,true);
 assert.equal(raw.civ.cookingLevel,5);assert.ok(raw.civ.actions.gather.cookingBonus>0);
 const engine=createBalanceEngine(fixture.encoded);t.after(engine.dispose);const p=engine.player,e=engine.session.modRules.civilization;
 assert.equal(p.version,'0.94');assert.equal(p.civ.cooks,0);assert.equal(Object.hasOwn(p.civ,'cookingLevel'),false);
 assert.equal(Object.hasOwn(p.civ.improvements,'cooking'),false);assert.equal(e.buyUpgrade('cooking'),false);
 for(const id of ['crafting','clay','copper'])assert.equal(p.civ.improvements[id],raw.civ.improvements[id]);
 for(const id of ['roofs','clayPots','copperPots'])assert.equal(p.civ.equipment[id],raw.civ.improvements[id]?1:0);
 assert.equal(p.civ.fire,raw.civ.fire);assert.equal(p.craft.points.toString(),String(raw.craft.points));
 assert.deepEqual(p.civ.actions.gather,raw.civ.actions.gather);
 engine.exportPlayer();assert.equal(e.setCooks(3),true);assert.equal(e.supply().cooks,3);
});

for(const name of ['main','energy'])test('actual 0.92 '+name+' codec migrates into the combined format without replaying purchases or losing valid Cooks',t=>{
 const prior=require('../fixtures/cooks-v092.json')[name],raw=JSON.parse(atob(prior.encoded));assert.equal(raw.version,'0.92');
 const engine=createBalanceEngine(prior.encoded);t.after(engine.dispose);const p=engine.player;
 assert.equal(p.version,'0.94');assert.equal(p.civ.cooks,name==='energy'?3:0);
 assert.equal(Object.hasOwn(p.civ.improvements,'cooking'),false);assert.equal(Object.hasOwn(p.civ,'cookingLevel'),false);
 assert.equal(Object.hasOwn(p.civ.actions,'fish'),false);assert.equal(Object.hasOwn(p.food.routes,'fish'),false);
 assert.equal(p.civ.fire,raw.civ.fire);assert.equal(p.craft.points.toString(),String(raw.craft.points));
 assert.deepEqual(p.civ.actions.gather,raw.civ.actions.gather);engine.exportPlayer();
 if(name==='energy'){
  const invalid=structuredClone(raw);invalid.points='4';const before=engine.exportPlayer();
  assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(invalid))).ok,false,'Cook commitments count before retired Fish can release workers');
  assert.equal(engine.exportPlayer(),before);
  const hybrid=structuredClone(raw);hybrid.civ.cooks=0;hybrid.civ.cookingLevel=1;hybrid.civ.improvements.cooking=false;
  assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(hybrid))).ok,false,'A new staffing field cannot conceal invalid old Cooking ownership');
  assert.equal(engine.exportPlayer(),before);
 }
});
