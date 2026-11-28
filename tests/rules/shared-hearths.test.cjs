const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBalanceEngine} = require('../../scripts/balance/engine.cjs');
const Decimal = require('../../js/technical/break_eternity.js');

function game(t, save) {
    const engine = createBalanceEngine(save);
    Object.assign(engine.player.civ.features,{huts:true,hunting:true,fishing:true,buyables:true});
    t.after(engine.dispose);
    return {engine, p: engine.player, e: engine.session.modRules.civilization};
}
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} expected ${expected}`);

test('Shared hearths keeps its guarded cost and never changes housing or labor', t => {
    const {p,e} = game(t);
    const before = JSON.stringify(p);
    assert.equal(e.buyUpgrade('hearth'), false);
    assert.equal(JSON.stringify(p), before);
    p.organization.total=new Decimal(6);
    p.points = new Decimal(12);
    p.food.points = new Decimal(30); p.water.points = new Decimal(25); p.craft.points = new Decimal(1);
    assert.equal(e.buyUpgrade('hearth'), true);
    assert.equal(p.food.points.toNumber(), 10); assert.equal(p.water.points.toNumber(), 10);
    assert.equal(p.craft.points.toNumber(), 0);
    assert.equal(e.buyUpgrade('hearth'), false);
    assert.equal(e.supply().support, 8);
    assert.equal(e.supply().availableWorkers, 12);
    assert.equal(e.supply().storage.food, 55);
    assert.equal(e.supply().production.food, 1);
});

test('Food benefits use whole tens of current Population, independently of huts and Timber frames', t => {
    const {p,e} = game(t);
    p.shelter.homes = 3; p.shelter.points = new Decimal(20); p.food.storage = 2;
    for (const population of [1,5,9,10,19,20,29,30,49,50,100,19,9]) {
        p.points = new Decimal(population);
        p.civ.improvements.hearth = false;
        assert.equal(e.supply().storage.food, 130);
        assert.equal(e.supply().production.food, 0);
        p.civ.improvements.hearth = true;
        const groups = Math.floor(population / 10);
        assert.equal(e.supply().storage.food, 130 + groups * 5);
        assert.equal(e.supply().production.food, groups);
        assert.equal(e.supply().storage.water, 50);
        assert.equal(e.supply().support, 20);
    }
    p.organization.total = new Decimal(3); p.food.points = new Decimal(25); p.craft.points = new Decimal(2);
    assert.equal(e.buyUpgrade('joinery'), true);
    assert.equal(e.supply().support, 26);
    assert.equal(e.supply().storage.food, 130);
});

test('hearths deliver real Food per minute, cap at storage and add to active crew income once', t => {
    const {engine,p,e} = game(t);
    p.points = new Decimal(10); p.civ.improvements.hearth = true;
    p.food.points = new Decimal(40); p.water.points = new Decimal(50);
    engine.advance(60);
    near(p.food.points.toNumber(), 31); // +1 production, -10 upkeep; housing blocks growth.
    near(p.food.total.toNumber(), 11);
    p.food.points = new Decimal(55);
    const total = p.food.total.toNumber();
    engine.advance(1);
    near(p.food.points.toNumber(), 55 - 10 / 60);
    near(p.food.total.toNumber(), total);
    p.food.points = new Decimal(10);
    assert.equal(e.dispatch('gather'), true);
    assert.equal(e.supply().production.food, 37);
    engine.advance(10);
    near(p.food.points.toNumber(), 14.5);
    assert.equal(p.civ.actions.gather.completed, 1);
    assert.equal(e.supply().production.food, 1);
    assert.equal(e.supply().availableWorkers, 10);
});

test('shortage population loss immediately lowers both hearth benefits and does not erase excess Food', t => {
    const {engine,p,e} = game(t);
    p.points = new Decimal(20); p.civ.improvements.hearth = true;
    p.food.points = new Decimal(60); p.water.points = new Decimal(0);
    engine.advance(10);
    assert.equal(p.points.toNumber(), 19);
    assert.equal(e.supply().storage.food, 55);
    assert.equal(e.supply().production.food, 1);
    assert.ok(p.food.points.gt(55), 'Capacity decrease preserves existing supplies for consumption');
    engine.advance(1);
    assert.equal(e.supply().production.food, 1);
});

test('both prestiges retain the upgrade but derive zero bonuses from the five-person restart', t => {
    for (const id of ['craft','organization']) {
        const {p,e} = game(t);
        p.points = new Decimal(id === 'organization' ? 48 : 20); p.civ.improvements.hearth = true;
        p.shelter.homes = 10; p.shelter.points = new Decimal(48);
        p.organization.total = new Decimal(9);
        assert.equal(e.prestige(id), true);
        assert.equal(p.civ.improvements.hearth, true);
        assert.equal(p.points.toNumber(), 5);
        assert.equal(p.food.points.toNumber(), 10);
        assert.equal(e.supply().storage.food, 50);
        assert.equal(e.supply().production.food, 0);
        assert.equal(e.supply().support, id === 'organization' ? 48 : 8);
    }
});

test('existing 0.6 hearth saves preserve stocks, construction and counts through the current codec', t => {
    const {engine,p} = game(t);
    p.points = new Decimal(12); p.civ.improvements.hearth = true;
    p.food.points = new Decimal(75); // Capacity under the former flat +25 effect.
    p.shelter.homes = 1; p.shelter.points = new Decimal(12);
    p.civ.project = 'shelter-home'; p.civ.projectWork = 5;
    const restored = game(t, engine.exportPlayer());
    assert.equal(restored.p.food.points.toNumber(), 75);
    assert.equal(restored.p.civ.projectWork, 5);
    assert.equal(restored.p.shelter.homes, 1);
    assert.equal(restored.e.supply().storage.food, 55);
    assert.equal(restored.e.supply().production.food, 1);
    restored.engine.advance(17);
    assert.equal(restored.p.shelter.homes, 2);
    assert.equal(restored.e.supply().support, 16);
    const again = game(t, restored.engine.exportPlayer());
    assert.equal(again.p.food.points.toString(), restored.p.food.points.toString());
    assert.equal(again.e.supply().production.food, 1);
});

test('hearth growth, threshold loss and Food accrual match across online and offline chunks', t => {
    const {engine,p} = game(t);
    p.points = new Decimal(19); p.civ.improvements.hearth = true;
    p.shelter.homes = 5; p.shelter.points = new Decimal(28);
    p.food.points = new Decimal(55); p.water.points = new Decimal(50);
    const input = engine.exportPlayer();
    const one = game(t,input), chunks = game(t,input);
    one.engine.advance(180);
    for (const seconds of [0.25,11.75,6,12,30,60,60]) chunks.engine.advance(seconds);
    assert.equal(JSON.stringify(one.p), JSON.stringify(chunks.p));
    assert.ok(one.p.points.lt(20), 'The run crosses growth and shortage thresholds');
});

test('hearth storage feeds the Food abundance curve while passive income cannot fake stored reserves', t => {
    const {p,e} = game(t);
    p.organization.total = new Decimal(5); e.buyUpgrade('abundance');
    p.points = new Decimal(20); p.food.points = new Decimal(50); p.water.points = new Decimal(50);
    p.shelter.homes = 12; p.shelter.points = new Decimal(56);
    const before = e.supply().abundance;
    p.civ.improvements.hearth = true;
    const after = e.supply();
    assert.equal(after.storage.food, 60);
    assert.equal(after.passiveProduction.food, 2);
    assert.equal(after.abundance.water.bonus, before.water.bonus);
    assert.equal(after.abundance.shelter.bonus, before.shelter.bonus);
    assert.ok(after.abundance.food.bonus < before.food.bonus, 'More capacity raises the near-full target at the same stock');
    p.food.points = new Decimal(0);
    assert.equal(e.supply().abundance.food.bonus, 0);
    assert.equal(e.supply().growing, false);
    assert.equal(e.supply().passiveProduction.food, 2);
});
