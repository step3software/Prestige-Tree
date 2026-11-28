const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBalanceEngine} = require('../../scripts/balance/engine.cjs');
const Decimal = require('../../js/technical/break_eternity.js');
function game(t, save) {
    const engine = createBalanceEngine(save);
    Object.assign(engine.player.civ.features,{huts:true,hunting:true,fishing:true,buyables:true}); t.after(engine.dispose);
    return {engine, p:engine.player, e:engine.session.modRules.civilization};
}

test('all five people can join crews with no domestic reservation or home improvement purchase', t => {
    const {p,e} = game(t);
    assert.equal(e.supply().availableWorkers, 5);
    assert.equal('domestic' in e.supply(), false);
    p.shelter.comfort = 20; p.civ.improvements.hearth = true;
    assert.equal(e.supply().availableWorkers, 5, 'Saved improvements do not change labor');
    assert.equal(e.startProject('shelter-comfort'), false);
    assert.deepEqual(e.projects('shelter').map(item => item.id), ['shelter-home']);
    assert.equal(e.dispatch('hunt'), true);
    assert.equal(e.dispatch('fish'), true);
    assert.equal(e.supply().availableWorkers, 0);
    assert.equal(e.startProject('shelter-home'), false);
    assert.equal(e.supply().laborUsed, 5);
    e.recall('fish');
    assert.equal(e.supply().availableWorkers, 2);
});

test('every Food basket spends exactly one Craft and adds forty storage on completion', t => {
    const {engine,p,e} = game(t);
    p.craft.points = new Decimal(2);
    for (const [level, seconds] of [[1,12],[2,17]]) {
        assert.equal(e.projects('food').find(item => item.id === 'food-storage').craftCost, 1);
        assert.equal(e.startProject('food-storage'), true);
        assert.equal(p.craft.points.toNumber(), 2-level);
        assert.equal(e.startProject('food-storage'), false, 'Cannot charge twice while busy');
        engine.advance(seconds);
        assert.equal(p.food.storage, level);
        assert.equal(e.supply().storage.food, 50+40*level);
    }
    assert.equal(e.startProject('food-storage'), false);
    assert.equal(p.craft.points.toNumber(), 0);
});

test('unfunded and unstaffed basket starts have no side effects', t => {
    const {p,e} = game(t);
    const before = JSON.stringify(p);
    assert.equal(e.startProject('food-storage'), false);
    assert.equal(JSON.stringify(p), before);
    p.craft.points = new Decimal(1);
    e.dispatch('hunt'); e.dispatch('fish');
    assert.equal(e.startProject('food-storage'), false);
    assert.equal(p.craft.points.toNumber(), 1);
    assert.equal(p.civ.project, '');
});

test('earthenware jars cost one Craft at every level and retain their full scaling work requirement', t => {
    const {engine,p,e} = game(t);
    const before = JSON.stringify(p);
    assert.equal(e.startProject('water-storage'), false);
    assert.equal(JSON.stringify(p), before);
    p.craft.points = new Decimal(3);
    for (let level = 0; level < 3; level++) {
        const project = e.projects('water').find(item => item.id === 'water-storage');
        assert.equal(project.name, 'Craft earthenware jars');
        assert.equal(project.craftCost, 1);
        assert.equal(project.work, 12 * 1.35 ** level);
        assert.equal(e.startProject('water-storage'), true);
        assert.equal(p.craft.points.toNumber(), 2-level);
        assert.equal(e.startProject('water-storage'), false);
        engine.advance(Math.ceil(project.work)-1);
        assert.equal(p.water.storage, level, 'Paid Craft does not bypass the work');
        assert.equal(e.supply().builders, 1);
        engine.advance(1);
        assert.equal(p.water.storage, level+1);
        assert.equal(e.supply().storage.water, 50+40*(level+1));
    }
    assert.equal(e.startProject('water-storage'), false);
    p.craft.points = new Decimal(1);
    assert.equal(e.startProject('water-storage'), true);
    e.cancelProject();
    assert.equal(p.craft.points.toNumber(), 0);
    assert.equal(p.water.storage, 3);
});

test('earlier Water storage projects finish without retroactive Craft costs and paid jars resume without double charging', t => {
    const {engine} = game(t);
    const raw = JSON.parse(atob(engine.exportPlayer()));
    raw.civ.project = 'water-storage'; raw.civ.projectWork = 5;
    const old = game(t,btoa(JSON.stringify(raw)));
    old.engine.advance(7);
    assert.equal(old.p.water.storage, 1);
    assert.equal(old.p.craft.points.toNumber(), 0);
    old.p.craft.points = new Decimal(1);
    assert.equal(old.e.startProject('water-storage'), true);
    old.engine.advance(2);
    const paid = game(t,old.engine.exportPlayer());
    assert.equal(paid.p.civ.projectWork, 2);
    paid.engine.advance(15);
    assert.equal(paid.p.water.storage, 2);
    assert.equal(paid.p.craft.points.toNumber(), 0);
    paid.p.points = new Decimal(12);
    paid.p.organization.total = new Decimal(4);
    assert.equal(paid.e.prestigePreview('craft').kept['water-storage'], true);
    assert.match(paid.e.prestigePreview('craft').keepText, /Earthenware jars/);
    assert.equal(paid.e.prestige('craft'), true);
    assert.equal(paid.p.water.storage, 2);
});

test('Craft and Organization never unlock or produce later resources, even with saved unlock flags', t => {
    const {engine,p,e} = game(t);
    p.craft.points = new Decimal(10); p.organization.points = new Decimal(10);
    for (const id of ['money','freeTime','education','culture']) p[id].unlocked = true;
    engine.advance(600);
    for (const id of ['money','freeTime','education','culture']) {
        assert.equal(p[id].points.toNumber(), 0);
        assert.equal(p[id].total.toNumber(), 0);
        assert.equal(e.node(id).unlocked, false);
        assert.equal(e.summary().nodes.some(node => node.id === id), false);
    }
    assert.equal(e.canInvest('education'), false);
    assert.equal(e.canInvest('culture'), false);
    assert.ok(!e.node('food').upgrades.some(item => item.id === 'autonomousFood'));
    assert.ok(!e.node('water').upgrades.some(item => item.id === 'sluice'));
});

test('0.5 saves retain balances and progress while retiring domestic construction and later tabs', t => {
    const {engine} = game(t);
    const raw = JSON.parse(atob(engine.exportPlayer()));
    raw.version = '0.5'; raw.tab = 'money'; raw.shelter.comfort = 3;
    raw.civ.project = 'shelter-comfort'; raw.civ.projectWork = 7;
    for (const [id,value] of [['money',7],['freeTime',4],['education',1],['culture',1]]) {
        raw[id].unlocked = true; raw[id].points = String(value); raw[id].total = String(value);
    }
    const {engine:restored,p,e} = game(t,btoa(JSON.stringify(raw)));
    assert.equal(p.tab, 'food');
    assert.equal(p.civ.project, ''); assert.equal(p.civ.projectWork, 0);
    assert.equal(p.shelter.comfort, 3, 'Historical purchased count is preserved without an active effect');
    assert.equal(e.supply().availableWorkers, 5);
    for (const id of ['money','freeTime','education','culture']) assert.equal(p[id].unlocked, false);
    restored.advance(10);
    assert.equal(p.money.points.toNumber(), 7); assert.equal(p.freeTime.points.toNumber(), 4);
    const roundTrip = game(t,restored.exportPlayer());
    assert.equal(roundTrip.p.money.points.toNumber(), 7);
    assert.equal(roundTrip.p.shelter.comfort, 3);
});

test('already-started baskets finish without retroactive charges, while paid baskets do not charge on reload', t => {
    const {engine} = game(t);
    const raw = JSON.parse(atob(engine.exportPlayer()));
    raw.version = '0.5'; raw.civ.project = 'food-storage'; raw.civ.projectWork = 5;
    const old = game(t,btoa(JSON.stringify(raw)));
    old.engine.advance(7);
    assert.equal(old.p.food.storage, 1); assert.equal(old.p.craft.points.toNumber(), 0);
    old.p.craft.points = new Decimal(1);
    assert.equal(old.e.startProject('food-storage'), true);
    const paid = game(t,old.engine.exportPlayer());
    paid.engine.advance(17);
    assert.equal(paid.p.food.storage, 2); assert.equal(paid.p.craft.points.toNumber(), 0);
});
