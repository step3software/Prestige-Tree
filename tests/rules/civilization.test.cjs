const test = require('node:test');
const assert = require('node:assert/strict');
const {createRuntime} = require('../support/game-runtime.cjs');
function game(t) {
    const r = createRuntime({bridge:false});
    r.run('gameUI.commands.load();var s=gameUI.session,p=s.saveState.player,e=s.modRules.civilization;');
    t.after(() => { r.run('s.dispose()'); r.dispose(); });
    return r;
}
const read=(r,expression)=>JSON.parse(r.run('JSON.stringify('+expression+')'));
function prepared(r) {
    r.run('p.points=new Decimal(8);p.shelter.homes=1;p.shelter.points=new Decimal(12);p.food.points=new Decimal(50);p.water.points=new Decimal(50);p.craft.points=new Decimal(20);p.organization.points=new Decimal(6)');
}

test('fresh Population grows into housing, without automatic Food or Water production',t=>{
    const r=game(t);
    assert.deepEqual(read(r,'s.layerRegistry.LAYERS'),['food','water','shelter','craft','organization','money','freeTime','education','culture']);
    r.run('s.advance(120)');
    assert.equal(r.run('p.points.toNumber()'),8);
    assert.equal(r.run('e.supply().bottleneck'),'Shelter');
    assert.equal(r.run('p.civ.actions.gather.completed'),0);
    assert.equal(r.run('e.supply().production.food'),0);
    assert.equal(r.run('typeof p.time'),'number');
});

test('parallel expeditions reserve distinct crews, reject overbooking and release on completion',t=>{
    const r=game(t);prepared(r);
    assert.equal(r.run('e.dispatch("gather")'),true);
    assert.equal(r.run('e.dispatch("hunt")'),true);
    assert.equal(r.run('e.dispatch("fish")'),true);
    assert.equal(r.run('e.supply().workers.food'),6);
    assert.equal(r.run('e.dispatch("water")'),false);
    assert.equal(r.run('e.dispatch("gather")'),false);
    r.run('p.food.points=new Decimal(0);s.advance(10)');
    assert.equal(r.run('p.civ.actions.gather.completed'),1);
    assert.equal(r.run('p.civ.actions.hunt.completed'),0);
    assert.ok(r.run('p.food.points.gt(0)'));
    assert.equal(r.run('e.supply().workers.food'),5);
    assert.equal(r.run('e.dispatch("water")'),true);
    assert.ok(r.run('e.supply().laborUsed<=p.points.toNumber()'));
});

test('recall forfeits unfinished yield, disables repeat and immediately frees workers',t=>{
    const r=game(t);
    r.run('e.dispatch("hunt");s.advance(3)');
    const food=r.run('p.food.points.toNumber()');
    assert.equal(r.run('e.recall("hunt")'),true);
    assert.equal(r.run('p.food.points.toNumber()'),food);
    assert.equal(r.run('e.supply().workers.food'),0);
    assert.equal(r.run('e.recall("hunt")'),false);
    assert.equal(r.run('e.dispatch("water")'),true);
});

test('route equipment improves only its route and active crews keep their dispatch contract',t=>{
    const r=game(t);prepared(r);
    r.run('e.dispatch("hunt");var oldCrew=p.civ.actions.hunt.workers;var oldYield=p.civ.actions.hunt.reward;var fishing=e.actionDefinition("fish").reward;e.startProject("hunt-tools");s.advance(14)');
    assert.equal(r.run('p.food.routes.hunt'),1);
    assert.equal(r.run('p.civ.actions.hunt.workers'),3);
    assert.equal(r.run('p.civ.actions.hunt.reward'),r.run('oldYield'));
    assert.equal(r.run('e.actionDefinition("fish").reward'),r.run('fishing'));
    assert.equal(r.run('e.buyUpgrade("hunting")'),true);
    assert.equal(r.run('p.civ.actions.hunt.workers'),3);
    r.run('s.advance(11);e.dispatch("hunt")');
    assert.equal(r.run('p.civ.actions.hunt.workers'),2);
    assert.ok(r.run('p.civ.actions.hunt.reward>oldYield'));
});

test('Water automation progresses from fewer workers to repeat orders to worker-free flow',t=>{
    const r=game(t);prepared(r);
    assert.equal(r.run('e.toggleRepeat("water")'),false);
    assert.equal(r.run('e.actionDefinition("water").workers'),2);
    r.run('e.buyUpgrade("buckets")');
    assert.equal(r.run('e.actionDefinition("water").workers'),1);
    r.run('e.buyUpgrade("waterOrders");e.toggleRepeat("water");p.water.points=new Decimal(0);s.advance(40)');
    assert.ok(r.run('p.civ.actions.water.completed')>=2);
    assert.equal(r.run('p.civ.actions.water.workers'),1);
    r.run('p.food.points=new Decimal(50);e.buyUpgrade("gravity");s.advance(10)');
    assert.equal(r.run('e.supply().workers.water'),0);
    assert.equal(r.run('e.dispatch("water")'),false);
    r.run('p.water.points=new Decimal(0);var before=p.water.points.toNumber();s.advance(10)');
    assert.ok(r.run('p.water.points.toNumber()>before'));
});

test('overseer repeats Food with workers, farming is gated, full autonomy requires late investment',t=>{
    const r=game(t);prepared(r);
    assert.equal(r.run('e.dispatch("farm")'),false);
    assert.equal(r.run('e.buyUpgrade("autonomousFood")'),false);
    r.run('e.buyUpgrade("overseer");p.craft.points=new Decimal(0);e.toggleRepeat("gather");p.food.points=new Decimal(0);s.advance(35)');
    assert.ok(r.run('p.civ.actions.gather.completed')>=3);
    assert.equal(r.run('p.civ.actions.gather.workers'),1);
    r.run('p.craft.points=new Decimal(20);p.food.points=new Decimal(50);p.water.points=new Decimal(50);e.buyUpgrade("farming");e.recall("gather");e.dispatch("farm")');
    assert.equal(r.run('p.civ.actions.farm.workers'),3);
    r.run('p.money.points=new Decimal(120);p.freeTime.points=new Decimal(10);p.education.points=new Decimal(8);e.buyUpgrade("autonomousFood")');
    assert.equal(r.run('p.civ.actions.farm.workers'),3,'An active crew finishes its original contract');
    r.run('e.recall("farm");e.dispatch("farm")');
    assert.equal(r.run('p.civ.actions.farm.workers'),0);
    assert.equal(r.run('p.money.points.toNumber()'),0);
});

test('reservoir release protects household reserves and boosts new Food trips only',t=>{
    const r=game(t);
    r.run('p.water.points=new Decimal(20)');
    assert.equal(r.run('e.irrigate()'),false);
    r.run('p.water.points=new Decimal(50);var base=e.actionDefinition("gather").reward;e.dispatch("gather");var dispatched=p.civ.actions.gather.reward');
    assert.equal(r.run('e.irrigate()'),true);
    assert.equal(r.run('e.irrigate()'),false);
    assert.equal(r.run('p.water.points.toNumber()'),30);
    assert.equal(r.run('p.civ.actions.gather.reward'),r.run('dispatched'));
    assert.ok(Math.abs(r.run('e.actionDefinition("gather").reward/base')-1.35)<1e-9);
    r.run('s.advance(45)');
    assert.equal(r.run('p.civ.irrigation'),0);
});

test('Shelter buyables add capacity or free domestic labor and upgrades improve owned homes',t=>{
    const r=game(t);
    assert.equal(r.run('e.startProject("shelter-home")'),true);
    assert.equal(r.run('e.supply().builders'),1);
    assert.equal(r.run('e.startProject("shelter-comfort")'),false);
    r.run('s.advance(16)');
    assert.equal(r.run('p.shelter.points.toNumber()'),12);
    const domestic=r.run('e.supply().domestic');
    r.run('e.startProject("shelter-comfort");s.advance(20)');
    assert.ok(r.run('e.supply().domestic')<domestic);
    assert.equal(r.run('p.shelter.points.toNumber()'),12);
    r.run('p.craft.points=new Decimal(2);p.food.points=new Decimal(25);e.buyUpgrade("joinery")');
    assert.equal(r.run('p.shelter.points.toNumber()'),14);
});

test('empty stores never kill people or block labor-only recovery actions',t=>{
    const r=game(t);
    r.run('p.food.points=new Decimal(0);p.water.points=new Decimal(0)');
    assert.equal(r.run('e.startProject("shelter-comfort")'),true);
    assert.equal(r.run('e.dispatch("water")'),true);
    assert.equal(r.run('e.dispatch("gather")'),true);
    r.run('s.advance(20)');
    assert.ok(r.run('p.food.points.gte(0)&&p.water.points.gte(0)'));
    assert.ok(r.run('p.points.gte(5)'));
    assert.ok(r.run('p.civ.actions.water.completed>=1'));
});

test('both prestige orders retain Population, jobs, buildings, upgrades and sibling resources',t=>{
    for(const order of [['craft','organization'],['organization','craft']]){
        const r=game(t);prepared(r);
        r.run('e.buyUpgrade("buckets");e.dispatch("hunt");e.startProject("food-storage");s.advance(2)');
        const remaining=r.run('p.civ.actions.hunt.remaining');
        for(const id of order){
            r.run('p.food.points=new Decimal(50);p.water.points=new Decimal(50)');
            assert.equal(r.run('e.prestige("'+id+'")'),true);
            assert.equal(r.run('e.prestige("'+id+'")'),false);
            assert.equal(r.run('p.points.toNumber()'),8);
            assert.equal(r.run('p.shelter.points.toNumber()'),12);
            assert.equal(r.run('p.civ.actions.hunt.remaining'),remaining);
            assert.equal(r.run('p.civ.improvements.buckets'),true);
            assert.equal(r.run('p.civ.project'),'food-storage');
        }
    }
});

test('failed purchases and locked investments do not spend resources',t=>{
    const r=game(t);
    const before=r.run('JSON.stringify(p)');
    for(const command of ['e.buyUpgrade("missing")','e.buyUpgrade("gravity")','e.invest("education")','e.dispatch("farm")','e.toggleRepeat("gather")','e.prestige("money")'])assert.equal(r.run(command),false,command);
    assert.equal(r.run('JSON.stringify(p)'),before);
});

test('offline-like chunk sizes preserve batch completion, repeats, construction and irrigation',t=>{
    const a=game(t),b=game(t);
    for(const r of [a,b]){prepared(r);r.run('e.buyUpgrade("overseer");e.toggleRepeat("gather");e.dispatch("hunt");e.startProject("shelter-comfort");e.irrigate()');}
    a.run('s.advance(120.5)');
    b.run('for(let i=0;i<2410;i++)s.advance(.05)');
    for(const value of ['p.points.toString()','p.food.points.toString()','p.water.points.toString()','p.shelter.points.toString()','JSON.stringify(p.civ.actions)','p.civ.growth','p.civ.projectWork'])assert.equal(a.run(value),b.run(value),value);
    assert.ok(Math.abs(a.run('p.civ.tickRemainder')-b.run('p.civ.tickRemainder'))<1e-8);
});
