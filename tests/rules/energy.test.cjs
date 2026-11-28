const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');

test('Energy is the first foundation node and derives its amount from the existing Fire owner',t=>{
 const engine=createBalanceEngine();t.after(engine.dispose);const p=engine.player,e=engine.session.modRules.civilization;
 assert.deepEqual(e.summary().nodes.filter(n=>n.tier===0).map(n=>n.id),['energy','food','water','shelter']);
 const energy=e.node('energy');assert.equal(energy.symbol,'E');assert.equal(energy.color,'#f2cf54');assert.equal(energy.unlocked,true);
 assert.equal(engine.session.layerRegistry.layers.energy.isLayer,false);assert.equal(Object.hasOwn(p.energy,'points'),false);
 p.civ.fire=3;assert.equal(e.node('energy').value.toNumber(),3);assert.equal(e.prestigeGain('energy'),0);
});

test('Energy selection round-trips while old saves gain only navigation defaults and invalid tabs remain atomic',t=>{
 const engine=createBalanceEngine();t.after(engine.dispose);const p=engine.player,D=p.points.constructor;
 p.organization.best=new D(4);p.civ.fire=3;p.tab='energy';
 const saved=engine.exportPlayer(),loaded=createBalanceEngine(saved);t.after(loaded.dispose);
 assert.equal(loaded.player.tab,'energy');assert.equal(loaded.player.civ.fire,3);
 const old=JSON.parse(atob(saved));delete old.energy;old.tab='food';
 assert.equal(loaded.session.loadPlayer(btoa(JSON.stringify(old))).ok,true);assert.equal(loaded.player.civ.fire,3);
 const before=loaded.exportPlayer();old.tab='unknown-energy';assert.equal(loaded.session.loadPlayer(btoa(JSON.stringify(old))).ok,false);assert.equal(loaded.exportPlayer(),before);
});
