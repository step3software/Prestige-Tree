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
 assert.deepEqual(e.materialRows().map(row=>row.items.length),[4,4,4]);assert.equal(p.civ.equipment.hunting,0);
});
test('historical malformed discovery flags reject before migration and preserve the live settlement',t=>{
 const g=game(t),{engine}=g;funded(g);const encoded=engine.exportPlayer();
 for(const field of ['buyables','hunting']){
  const raw=JSON.parse(atob(encoded));raw.version='0.8'; delete raw.civ.equipment;raw.civ.features[field]='invalid';
  const result=engine.session.loadPlayer(btoa(JSON.stringify(raw)));
  assert.equal(result.ok,false,field+' must be validated before conversion');
  assert.equal(engine.exportPlayer(),encoded);
 }
});
test('saved pending supervisors share Fire and active crews without overbooking after permanent unlocks',t=>{
 const g=game(t),{p,e,engine,D}=g;funded(g);p.points=new D(7);p.civ.features.hunting=true;
 assert.equal(e.setFireTenders(2),true);assert.equal(e.dispatch('hunt'),true);assert.equal(e.dispatch('water'),true);
 p.food.points=new D(10);p.civ.actions.gather.repeat=4;p.civ.hutRepeat=4;
 const loaded=game(t,engine.exportPlayer());assert.equal(loaded.e.supply().overseerWorkers,0);assert.equal(loaded.e.supply().foremanWorkers,0);
 for(let i=0;i<30;i++){loaded.engine.advance(1);assert.ok(loaded.e.supply().laborUsed<=loaded.p.points.toNumber());}
 assert.ok(loaded.p.civ.actions.gather.repeat<4);loaded.engine.exportPlayer();
});
