const test = require('node:test');
const assert = require('node:assert/strict');
const {createRuntime} = require('../support/game-runtime.cjs');
function game(t) {
    const r = createRuntime({bridge:false});
    r.run('gameUI.commands.load();var s=gameUI.session,p=s.saveState.player,e=s.modRules.civilization;');
    r.run('Object.assign(p.civ.features,{huts:true,hunting:true,buyables:false});p.civ.improvements.crafting=true;p.organization.points=new Decimal(7)');
    t.after(() => { r.run('s.dispose()'); r.dispose(); });
    return r;
}
const read=(r,expression)=>JSON.parse(r.run('JSON.stringify('+expression+')'));
function prepared(r) {
    r.run('Object.assign(p.civ.features,{huts:true,hunting:true,buyables:false});p.civ.improvements.crafting=true;p.organization.points=new Decimal(7)');
    r.run('p.points=new Decimal(8);p.shelter.homes=1;p.shelter.points=new Decimal(12);p.food.points=new Decimal(50);p.water.points=new Decimal(50);p.craft.points=new Decimal(20);p.organization.points=new Decimal(6);p.organization.total=new Decimal(10);p.organization.points=new Decimal(10)');
}

test('fresh Population grows into housing, without automatic Food or Water production',t=>{
    const r=game(t);
    assert.deepEqual(read(r,'s.layerRegistry.LAYERS'),['food','water','shelter','craft','organization','money','freeTime','education','culture']);
    r.run('s.advance(40)');
    assert.equal(r.run('p.points.toNumber()'),8);
    assert.equal(r.run('e.supply().bottleneck'),'Shelter');
    assert.equal(r.run('p.civ.actions.gather.completed'),0);
    assert.equal(r.run('e.supply().production.food'),0);
    assert.equal(r.run('typeof p.time'),'number');
});

test('parallel expeditions reserve distinct crews, reject overbooking and release on completion',t=>{
    const r=game(t);prepared(r);r.run('p.points=new Decimal(6);e.startProject("water-storage")');
    assert.equal(r.run('e.dispatch("gather")'),true);
    assert.equal(r.run('e.dispatch("hunt")'),true);
    assert.equal(r.run('e.supply().workers.food'),4);
    assert.equal(r.run('e.dispatch("water")'),false);
    assert.equal(r.run('e.dispatch("gather")'),false);
    r.run('p.food.points=new Decimal(0);s.advance(10)');
    assert.equal(r.run('p.civ.actions.gather.completed'),1);
    assert.equal(r.run('p.civ.actions.hunt.completed'),0);
    assert.ok(r.run('p.food.points.gt(0)'));
    assert.equal(r.run('e.supply().workers.food'),3);
    assert.equal(r.run('e.dispatch("water")'),true);
    assert.ok(r.run('e.supply().laborUsed<=p.points.toNumber()+1e-9'));
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
    r.run('e.dispatch("hunt");var oldCrew=p.civ.actions.hunt.workers;var oldYield=p.civ.actions.hunt.reward;var gathering=e.actionDefinition("gather").reward;e.startProject("hunt-tools");s.advance(14)');
    assert.equal(r.run('p.food.routes.hunt'),1);
    assert.equal(r.run('p.civ.actions.hunt.workers'),3);
    assert.equal(r.run('p.civ.actions.hunt.reward'),r.run('oldYield'));
    assert.equal(r.run('e.actionDefinition("gather").reward'),r.run('gathering'));
    assert.equal(r.run('e.buyUpgrade("hunting")'),true);
    assert.equal(r.run('p.civ.actions.hunt.workers'),3);
    r.run('s.advance(11);e.dispatch("hunt")');
    assert.equal(r.run('p.civ.actions.hunt.workers'),3,'Coordinated base crew of two scales to three for bigger game');
    assert.ok(r.run('p.civ.actions.hunt.reward>oldYield'));
});

test('Water flow supplements hauling and needs manual trips above its baseline',t=>{
    const r=game(t);prepared(r);
    assert.equal(r.run('e.setRepeat("water",1)'),false);
    assert.equal(r.run('e.actionDefinition("water").workers'),2);
    r.run('p.civ.improvements.buckets=true');
    assert.equal(r.run('e.actionDefinition("water").workers'),1);
    r.run('p.water.points=new Decimal(0);e.dispatch("water");s.advance(8)');
    assert.equal(r.run('p.civ.actions.water.completed'),1);
    assert.equal(r.run('p.civ.actions.water.workers'),0);
    r.run('p.food.points=new Decimal(50);e.buyUpgrade("gravity");s.advance(10)');
    assert.equal(r.run('e.supply().workers.water'),0);
    assert.equal(r.run('e.dispatch("water")'),true);r.run('e.recall("water")');
    r.run('p.water.points=new Decimal(0);var before=p.water.points.toNumber();s.advance(10)');
    assert.equal(r.run('p.water.points.toNumber()'),0);r.run('e.dispatch("water");s.advance(8)');assert.ok(r.run('p.water.points.gt(0)'));
});

test('overseer repeats staffed Food and farming while purchases needing later resources stay locked',t=>{
    const r=game(t);prepared(r);
    assert.equal(r.run('e.dispatch("farm")'),false);
    assert.equal(r.run('e.buyUpgrade("autonomousFood")'),false);
    r.run('e.buyUpgrade("overseer");p.craft.points=new Decimal(0);e.setRepeat("gather",5);p.food.points=new Decimal(0);s.advance(35)');
    assert.ok(r.run('p.civ.actions.gather.completed')>=3);
    assert.equal(r.run('p.civ.actions.gather.workers'),1);
    r.run('p.craft.points=new Decimal(20);p.food.points=new Decimal(50);p.water.points=new Decimal(50);e.buyUpgrade("farming");e.recall("gather");e.dispatch("farm")');
    assert.equal(r.run('p.civ.actions.farm.workers'),3);
    r.run('p.money.points=new Decimal(120);p.freeTime.points=new Decimal(10);p.education.points=new Decimal(8);e.buyUpgrade("autonomousFood")');
    assert.equal(r.run('p.civ.actions.farm.workers'),3,'An active crew finishes its original contract');
    r.run('e.recall("farm");e.dispatch("farm")');
    assert.equal(r.run('p.civ.actions.farm.workers'),3);
    assert.equal(r.run('p.money.points.toNumber()'),120);
});

test('reservoir release protects household reserves and boosts Farming only',t=>{
 const r=game(t);prepared(r);r.run('p.civ.improvements.farming=true;p.water.points=new Decimal(20)');
 assert.equal(r.run('e.irrigate()'),false);r.run('p.water.points=new Decimal(50);var before=e.actionDefinition("gather").reward;var crop=e.actionDefinition("farm").reward');
 assert.equal(r.run('e.irrigate()'),true);assert.equal(r.run('e.actionDefinition("gather").reward'),r.run('before'));
 assert.equal(r.run('e.actionDefinition("farm").reward'),r.run('crop*1.35'));
 assert.equal(r.run('e.irrigate()'),false);r.run('s.advance(45)');assert.equal(r.run('p.civ.irrigation'),0);
});

test('Shelter buyables add housing and retired domestic improvements cannot reserve labor',t=>{
    const r=game(t);
    assert.equal(r.run('e.startProject("shelter-home")'),true);
    assert.equal(r.run('e.supply().builders'),1);
    assert.equal(r.run('e.startProject("shelter-comfort")'),false);
    r.run('s.advance(16)');
    assert.equal(r.run('p.shelter.points.toNumber()'),12);
    assert.equal(r.run('e.supply().availableWorkers'),r.run('p.points.toNumber()'));
    assert.equal(r.run('e.startProject("shelter-comfort")'),false);
    assert.equal(r.run('e.projects("shelter").length'),1);
    r.run('p.organization.total=new Decimal(3);p.organization.points=new Decimal(3);p.craft.points=new Decimal(2);p.food.points=new Decimal(25);p.civ.improvements.joinery=true;p.shelter.points=new Decimal(8+p.shelter.homes*4)');
    assert.equal(r.run('p.shelter.points.toNumber()'),12);
});

test('timely recovery crews restore empty stores before grace expires',t=>{
    const r=game(t);
    r.run('p.food.points=new Decimal(0);p.water.points=new Decimal(0)');
    assert.equal(r.run('e.startProject("shelter-home")'),true);
    assert.equal(r.run('e.dispatch("water")'),true);
    assert.equal(r.run('e.dispatch("gather")'),true);
    r.run('s.advance(20)');
    assert.ok(r.run('p.food.points.gte(0)&&p.water.points.gte(0)'));
    assert.ok(r.run('p.points.gte(5)'));
    assert.ok(r.run('p.civ.actions.water.completed>=1'));
});

test('prestige resets buyables, Population and construction while providing starting supplies',t=>{
    const r=game(t);prepared(r);
    r.run('p.organization.total=new Decimal(0);p.organization.points=new Decimal(0);p.points=new Decimal(12);p.food.routes.gather=3;p.civ.equipment.digging=2;p.shelter.comfort=3;p.civ.improvements.buckets=true;e.dispatch("gather");e.dispatch("water");e.startProject("shelter-home");s.advance(2);p.food.points=new Decimal(50);p.water.points=new Decimal(50)');
    assert.equal(r.run('e.prestige("craft")'),true);
    for(const field of ['p.food.routes.gather','p.shelter.homes','p.civ.projectWork','p.civ.actions.gather.remaining','p.civ.equipment.digging'])assert.equal(r.run(field),0,field);
    assert.equal(r.run('p.points.toNumber()'),5);
    assert.equal(r.run('p.shelter.points.toNumber()'),8);
    assert.equal(r.run('e.supply().bottleneck'),'Growing');
    assert.equal(r.run('p.civ.improvements.buckets'),true);
    assert.equal(r.run('p.civ.project'),'');
    assert.ok(r.run('e.supply().laborUsed<=p.points.toNumber()+1e-9'));
    assert.equal(r.run('s.saveCommands.saveCodec().encodePlayer(p).ok'),true);
});

test('milestones retain Food equipment, protected construction and trips while holding the required Organization',t=>{
    const r=game(t);prepared(r);r.run('p.points=new Decimal(12)');
    r.run('p.organization.total=new Decimal(7);p.organization.points=new Decimal(7);p.food.routes.gather=2;e.dispatch("gather");e.startProject("gather-tools");s.advance(2);p.food.points=new Decimal(50);p.water.points=new Decimal(50)');
    const remaining=r.run('p.civ.actions.gather.remaining'),work=r.run('p.civ.projectWork');
    assert.equal(r.run('e.prestige("craft")'),true);
    assert.equal(r.run('p.food.routes.gather'),2);

    assert.equal(r.run('p.food.sites'),0);

    assert.equal(r.run('p.civ.actions.gather.remaining'),remaining);
    assert.equal(r.run('p.civ.project'),'gather-tools');
    assert.equal(r.run('p.civ.projectWork'),work);
    assert.equal(r.run('p.shelter.homes'),0);
    assert.equal(r.run('e.summary().autoAvailable'),false);
});

test('milestone ten keeps only named buyables on both prestiges',t=>{
    for(const id of ['craft','organization']){
        const r=game(t);prepared(r);r.run('p.points=new Decimal(52)');
        r.run('p.organization.total=new Decimal(10);p.organization.points=new Decimal(10);p.food.routes.gather=2;p.food.routes.hunt=2;p.shelter.homes=11;p.shelter.points=new Decimal(52);p.shelter.comfort=2;e.startProject("shelter-home");s.advance(2);p.food.points=new Decimal(50);p.water.points=new Decimal(50)');
        const work=r.run('p.civ.projectWork');
        assert.equal(r.run('e.prestige("'+id+'")'),true);
        for(const field of ['p.food.routes.gather','p.food.routes.hunt'])assert.equal(r.run(field),2,field);
        for(const field of ['p.food.routes.farm','p.food.sites'])assert.equal(r.run(field),0,field);
        assert.equal(r.run('p.shelter.homes'),11);
        assert.equal(r.run('p.civ.project'),'shelter-home');
        assert.equal(r.run('p.civ.projectWork'),work);
        assert.equal(r.run('p.food.points.toNumber()'),10);
        assert.equal(r.run('p.water.points.toNumber()'),10);
        assert.equal(r.run('p.points.toNumber()'),5);
    }
});

test('prestige returns enough protected crews to fit the five-person workforce',t=>{
    const r=game(t);prepared(r);
    r.run('p.points=new Decimal(12);p.organization.total=new Decimal(9);p.organization.points=new Decimal(9);p.shelter.comfort=2;e.dispatch("gather");e.dispatch("hunt");e.dispatch("water")');
    assert.equal(r.run('e.supply().workers.food+e.supply().workers.water'),6);
    assert.deepEqual(read(r,'e.prestigePreview("craft").recalledActions'),['hunt']);
    r.run('e.prestige("craft")');
    assert.equal(r.run('p.civ.actions.hunt.remaining'),0);
    assert.ok(r.run('p.civ.actions.gather.remaining>0'));
    assert.ok(r.run('e.supply().laborUsed<=p.points.toNumber()+1e-9'));
    assert.equal(r.run('s.saveCommands.saveCodec().encodePlayer(p).ok'),true);
});

test('failed purchases and locked investments do not spend resources',t=>{
    const r=game(t);r.run('p.organization.points=new Decimal(0)');
    const before=r.run('JSON.stringify(p)');
    for(const command of ['e.buyUpgrade("missing")','e.buyUpgrade("gravity")','e.invest("education")','e.dispatch("farm")','e.setRepeat("gather",5)','e.prestige("money")'])assert.equal(r.run(command),false,command);
    assert.equal(r.run('JSON.stringify(p)'),before);
});

test('offline-like chunk sizes preserve batch completion, repeats, construction and irrigation',t=>{
    const a=game(t),b=game(t);
    for(const r of [a,b]){prepared(r);r.run('e.buyUpgrade("overseer");e.setRepeat("gather",5);e.dispatch("hunt");e.startProject("shelter-home");e.irrigate()');}
    a.run('s.advance(120.5)');
    b.run('for(let i=0;i<2410;i++)s.advance(.05)');
    for(const value of ['p.points.toString()','p.food.points.toString()','p.water.points.toString()','p.shelter.points.toString()','JSON.stringify(p.civ.actions)','p.civ.growth','p.civ.projectWork'])assert.equal(a.run(value),b.run(value),value);
    assert.ok(Math.abs(a.run('p.civ.tickRemainder')-b.run('p.civ.tickRemainder'))<1e-8);
});
