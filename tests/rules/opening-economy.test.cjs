const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBalanceEngine} = require('../../scripts/balance/engine.cjs');
const Decimal = require('../../js/technical/break_eternity.js');
function game(t, save) {
    const engine = createBalanceEngine(save);
    Object.assign(engine.player.civ.features,{huts:true,hunting:true,buyables:false}); engine.player.civ.improvements.crafting=true; engine.player.organization.points=new Decimal(7); t.after(engine.dispose);
    return {engine, p:engine.player, e:engine.session.modRules.civilization};
}

test('all five people can join crews with no domestic reservation or home improvement purchase', t => {
    const {p,e} = game(t);
    assert.equal(e.supply().availableWorkers, 5);
    assert.equal('domestic' in e.supply(), false);
    p.shelter.comfort = 20; p.civ.improvements.hearth = true;
    assert.equal(e.supply().availableWorkers, 5, 'Saved improvements do not change labor');
    assert.equal(e.startProject('shelter-comfort'), false);
    assert.deepEqual(e.projects('shelter').map(item => item.id), ['shelter-home','roofs']);
    assert.equal(e.dispatch('hunt'), true);
    assert.equal(e.dispatch('water'), true);
    assert.equal(e.supply().availableWorkers, 0);
    assert.equal(e.startProject('shelter-home'), false);
    assert.equal(e.supply().laborUsed, 5);
    e.recall('water');
    assert.equal(e.supply().availableWorkers, 2);
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
    raw.version = '0.5'; delete raw.civ.equipment; raw.tab = 'money'; raw.shelter.comfort = 3;
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
