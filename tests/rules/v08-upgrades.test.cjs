const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
const Decimal=require('../../js/technical/break_eternity.js');
const fixtures=require('../fixtures/civ-v08-migration.json');
function game(t,input){const engine=createBalanceEngine(input);t.after(engine.dispose);return {engine,p:engine.player,e:engine.session.modRules.civilization};}

test('Abundance is unavailable before milestone eight and free in Shelter after it',t=>{
    const {p,e}=game(t);
    const before=JSON.stringify(p);
    assert.equal(e.buyUpgrade('abundance'),false);
    assert.equal(JSON.stringify(p),before);
    assert.equal(e.upgrades('shelter').some(u=>u.id==='abundance'),false);
    p.organization.total=new Decimal(8);p.organization.points=new Decimal(8);p.food.points=new Decimal(0);p.water.points=new Decimal(0);
    const upgrade=e.upgrades('shelter').find(u=>u.id==='abundance');
    assert.equal(upgrade.canBuy,true);assert.equal(upgrade.costText,'Free');
    assert.deepEqual(upgrade.costs,{});
    assert.equal(e.buyUpgrade('abundance'),true);
    for(const id of ['food','water','craft'])assert.equal(p[id].points.toNumber(),0);
    assert.equal(e.buyUpgrade('abundance'),false);
});

test('stock and housing cannot accelerate growth until Abundance is purchased',t=>{
    const {engine,p,e}=game(t);
    p.food.storage=2;p.water.storage=2;p.food.points=new Decimal(130);p.water.points=new Decimal(130);
    p.shelter.homes=11;p.shelter.points=new Decimal(52);
    assert.equal(e.supply().abundance.enabled,false);assert.equal(e.supply().abundance.multiplier,1);
    engine.advance(12);assert.equal(p.points.toNumber(),6);
    p.organization.total=new Decimal(8);p.organization.points=new Decimal(8);assert.equal(e.buyUpgrade('abundance'),true);
    assert.equal(e.supply().abundance.multiplier,10);
    engine.advance(12);assert.equal(p.points.toNumber(),16);
    assert.equal(e.prestige('craft'),true);
    assert.equal(p.civ.improvements.abundance,true);
});

test('both overseers unlock with milestone three without an extra purchase',t=>{
 const {p,e}=game(t);p.organization.total=new Decimal(2);p.organization.points=new Decimal(2);assert.equal(e.setRepeat('gather',5),false);assert.equal(e.setHutRepeat(5),false);
 p.organization.total=new Decimal(3);p.organization.points=new Decimal(3);assert.equal(e.setRepeat('gather',5),true);assert.equal(e.setHutRepeat(5),true);
 assert.equal(p.craft.points.toNumber(),0);assert.equal(p.organization.points.toNumber(),3);
 assert.equal(e.supply().overseerWorkers,1);assert.equal(e.supply().foremanWorkers,1);
});

test('actual v0.6 save loads into v0.9 without losing stocks, paid construction or active crews',t=>{
    const {engine,p,e}=game(t,fixtures.v06);
    const original=JSON.parse(atob(fixtures.v06));
    assert.equal(p.version,'0.91');assert.equal(p.points.toString(),original.points);
    assert.equal(p.craft.points.toString(),original.craft.points);
    assert.equal(p.civ.project,'water-storage');assert.equal(p.civ.projectWork,original.civ.projectWork);
    assert.equal(p.civ.actions.fish.remaining,original.civ.actions.fish.remaining);
    assert.equal(p.civ.actions.fish.workers,1,'An already dispatched reduced crew finishes its snapshot');
    assert.equal(p.civ.actions.fish.reward,original.civ.actions.fish.reward);
    assert.equal('fishing' in p.civ.improvements,false);assert.equal('wellLining' in p.civ.improvements,false);
    assert.equal('waterOrders' in p.civ.improvements,false);
    assert.equal(e.actionDefinition('fish').workers,2,'New fishing trips use the full crew');
    assert.equal(p.civ.improvements.abundance,false);
    engine.exportPlayer();
});

test('actual v0.7 save preserves the remaining repeat count and active job through v0.9 reload',t=>{
    const {engine,p}=game(t,fixtures.v07);
    const original=JSON.parse(atob(fixtures.v07));
    assert.equal(p.version,'0.91');assert.equal(p.civ.actions.gather.repeat,4);
    assert.equal(p.civ.actions.gather.remaining,original.civ.actions.gather.remaining);
    assert.equal(p.civ.actions.gather.reward,original.civ.actions.gather.reward);
    assert.equal(p.civ.improvements.overseer,true);
    const restored=game(t,engine.exportPlayer());restored.engine.advance(1);
    assert.equal(restored.p.civ.actions.gather.repeat,4,'Reloading a running job consumes no repeat');
});

test('malformed retired upgrade data is rejected before replacing the current save',t=>{
    const {engine,p}=game(t);
    engine.session.modRules.saveMigrationMode='prod';
    const old=JSON.parse(atob(fixtures.v07));old.civ.improvements.fishing='yes';
    const before=JSON.stringify(p);
    assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(old))).ok,false);
    assert.equal(JSON.stringify(engine.player),before);
});
