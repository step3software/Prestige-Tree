const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
function game(t,save){const engine=createBalanceEngine(save);t.after(engine.dispose);const p=engine.player;return {engine,p,e:engine.session.modRules.civilization,D:p.points.constructor};}
function stage(p,D){p.organization.points=new D(4);p.organization.best=new D(4);p.points=new D(8);p.food.points=new D(50);p.water.points=new D(50);p.civ.improvements.crafting=true;}

test('Cooks unlock directly at four, reserve one worker each, and zero releases them without spending Fire',t=>{
 const {p,e,D}=game(t);assert.equal(e.setCooks(1),false);assert.equal(e.setCooks(0),true);
 stage(p,D);p.civ.fire=10;assert.equal(e.buyUpgrade('cooking'),false);assert.equal(e.upgrades('fire').some(u=>u.id==='cooking'),false);
 for(let workers=0;workers<=5;workers++){
  assert.equal(e.setCooks(workers),true);assert.equal(e.supply().cooks,workers);assert.equal(e.supply().availableWorkers,8-workers);
  assert.equal(e.fireStatus().cookingMultiplier,Math.max(1,workers));assert.equal(p.civ.fire,10);
 }
 assert.equal(e.setCooks(0),true);assert.equal(e.supply().availableWorkers,8);assert.equal(e.fireStatus().cookingMultiplier,1);
});

test('cook staffing, Fire tenders, crews and builders share the same whole-worker budget and reject atomically',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);e.setCooks(5);e.dispatch('gather');e.startProject('shelter-home');
 assert.equal(e.supply().laborUsed,7);
 const before=engine.exportPlayer();
 for(const bad of [-1,6,1.5,NaN,Infinity]){assert.equal(e.setCooks(bad),false);assert.equal(engine.exportPlayer(),before);}
 assert.equal(e.setFireTenders(2),false);assert.equal(e.dispatch('water'),false);assert.equal(engine.exportPlayer(),before);
 assert.equal(e.setCooks(4),true);assert.equal(e.setFireTenders(2),true);assert.equal(e.supply().availableWorkers,0);
 assert.equal(e.setCooks(5),false);engine.exportPlayer();
});

test('Population loss pauses cooks before tenders and survival crews, leaving a valid settlement',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.civ.features.hunting=true;p.food.points=new D(0);p.water.points=new D(0);
 assert.equal(e.setCooks(4),true);assert.equal(e.setFireTenders(1),true);assert.equal(e.dispatch('hunt'),true);
 engine.advance(10);assert.equal(p.points.toNumber(),7);assert.equal(p.civ.cooks,3);assert.equal(p.civ.fireTenders,1);
 assert.equal(p.civ.actions.hunt.workers,3);assert.equal(e.supply().laborUsed,7);engine.exportPlayer();
});

test('both tier 2 resets release cooks to zero; rejected prestige leaves staffing unchanged',t=>{
 for(const id of ['craft','organization']){
  const {engine,p,e,D}=game(t);stage(p,D);e.setCooks(3);
  p.points=new D(5);assert.equal(e.prestige(id),false);assert.equal(p.civ.cooks,3);
  p.points=new D(28);e.setFireTenders(2);e.dispatch('gather');p.civ.fire=10;engine.advance(2);
  const bonus=p.civ.actions.gather.cookingBonus;
  assert.match(e.prestigePreview(id).resetText,/Cooks released \(0 assigned\)/);assert.equal(e.prestige(id),true);
  assert.equal(p.civ.cooks,0);assert.equal(p.civ.fireTenders,0);assert.equal(p.civ.actions.gather.cookingBonus,bonus);engine.exportPlayer();
 }
});

test('old Cooking purchases retire without refund, preserving other upgrades, stocks and earned Food bonuses',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);p.civ.fire=2;p.civ.improvements.hearth=true;p.craft.points=new D(7);e.setCooks(3);e.dispatch('gather');engine.advance(2);
 const raw=JSON.parse(atob(engine.exportPlayer()));raw.version='0.91';delete raw.civ.equipment;delete raw.civ.cooks;raw.civ.cookingLevel=5;raw.civ.improvements.cooking=true;
 const loaded=game(t,btoa(JSON.stringify(raw)));
 assert.equal(loaded.p.civ.cooks,0);assert.equal(Object.hasOwn(loaded.p.civ,'cookingLevel'),false);assert.equal(Object.hasOwn(loaded.p.civ.improvements,'cooking'),false);
 assert.equal(loaded.p.civ.improvements.hearth,true);assert.equal(loaded.p.civ.fire,raw.civ.fire);assert.equal(loaded.p.craft.points.toString(),String(raw.craft.points));
 assert.equal(loaded.p.civ.actions.gather.cookingBonus,raw.civ.actions.gather.cookingBonus);assert.equal(loaded.p.civ.actions.gather.remaining,raw.civ.actions.gather.remaining);
 loaded.engine.exportPlayer();
 for(const corrupt of [r=>r.civ.improvements.cooking='yes',r=>r.civ.cookingLevel=6]){
  const bad=structuredClone(raw);corrupt(bad);const before=loaded.engine.exportPlayer();assert.equal(loaded.engine.session.loadPlayer(btoa(JSON.stringify(bad))).ok,false);assert.equal(loaded.engine.exportPlayer(),before);
 }
});

test('current cook counts round-trip; invalid and overbooked staffing rejects atomically',t=>{
 const {engine,p,e,D}=game(t);stage(p,D);e.setCooks(5);e.dispatch('gather');
 const encoded=engine.exportPlayer(),loaded=game(t,encoded);assert.equal(loaded.p.civ.cooks,5);
 for(const bad of [-1,6,1.5]){
  const raw=JSON.parse(atob(encoded));raw.civ.cooks=bad;assert.equal(loaded.engine.session.loadPlayer(btoa(JSON.stringify(raw))).ok,false);assert.equal(loaded.engine.exportPlayer(),encoded);
 }
 const raw=JSON.parse(atob(encoded));raw.points='5';assert.equal(loaded.engine.session.loadPlayer(btoa(JSON.stringify(raw))).ok,false);assert.equal(loaded.engine.exportPlayer(),encoded);
});
