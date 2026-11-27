const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBalanceEngine} = require('../../scripts/balance/engine.cjs');
const Decimal = require('../../js/technical/break_eternity.js');

function game(t) {
    const engine = createBalanceEngine();
    t.after(engine.dispose);
    return {engine, p: engine.player, e: engine.session.modRules.civilization};
}
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, actual + ' != ' + expected);

test('exploring farther trades longer trips for compounded yields and rising work', t => {
    const {engine, p, e} = game(t);
    assert.equal(e.startProject('gather-tools'), true);
    assert.equal(e.dispatch('gather'), true);
    engine.advance(14);
    assert.equal(p.food.routes.gather, 1);
    assert.equal(e.actionDefinition('gather').workers, 1);
    close(e.actionDefinition('gather').duration, 12);
    close(e.actionDefinition('gather').reward, 9);
    close(e.projects('food').find(item => item.id === 'gather-tools').work, 18.9);
    assert.equal(e.startProject('gather-tools'), true);
    engine.advance(19);
    assert.equal(p.food.routes.gather, 2);
    close(e.actionDefinition('gather').duration, 14.4);
    close(e.actionDefinition('gather').reward, 13.5);
    assert.equal(e.actionDefinition('fish').reward, 14);
});

test('bigger game requires lifetime Organization and rounds up each successive crew', t => {
    const {p, e} = game(t);
    assert.equal(e.node('food').projects.find(item => item.id === 'hunt-tools').canStart, false);
    assert.equal(e.startProject('hunt-tools'), false);
    assert.equal(p.civ.project, '');
    p.organization.total = new Decimal(1);
    p.organization.points = new Decimal(0);
    assert.equal(e.startProject('hunt-tools'), true, 'Earned Organization remains valid after spending');
    e.cancelProject();
    for (const [level, workers] of [[0, 3], [1, 5], [2, 8], [3, 12]]) {
        p.food.routes.hunt = level;
        const action = e.actionDefinition('hunt');
        assert.equal(action.workers, workers);
        assert.equal(action.duration, 25);
        assert.equal(action.reward, 24 * 2 ** level);
        assert.equal(e.projects('food').find(item => item.id === 'hunt-tools').work, 14);
    }
    p.food.routes.hunt = 1;
    assert.equal(e.startProject('hunt-tools'), false, 'Next level needs two lifetime Organization');
    assert.equal(e.dispatch('gather'), true);
    assert.equal(e.dispatch('hunt'), false, 'The five-person party cannot start while a gatherer is away');
    e.recall('gather');
    p.civ.improvements.hunting = true;
    for (const [level, workers] of [[0, 2], [1, 3], [2, 5], [3, 8]]) {
        p.food.routes.hunt = level;
        assert.equal(e.actionDefinition('hunt').workers, workers);
    }
    p.civ.improvements.autonomousFood = true;
    assert.equal(e.actionDefinition('hunt').workers, 0);
});

test('river traps spend escalating Craft once at start and keep the same trip and crew', t => {
    const {engine, p, e} = game(t);
    assert.equal(e.startProject('fish-tools'), false);
    p.craft.points = new Decimal(1);
    assert.equal(e.startProject('fish-tools'), true);
    assert.equal(p.craft.points.toNumber(), 0);
    assert.equal(e.startProject('fish-tools'), false);
    engine.advance(14);
    assert.equal(p.food.routes.fish, 1);
    assert.equal(e.actionDefinition('fish').reward, 28);
    assert.equal(e.actionDefinition('fish').duration, 18);
    assert.equal(e.actionDefinition('fish').workers, 2);
    const next = e.projects('food').find(item => item.id === 'fish-tools');
    assert.equal(next.craftCost, 2);
    assert.equal(next.work, 14);
    p.craft.points = new Decimal(1);
    assert.equal(e.startProject('fish-tools'), false);
    assert.equal(p.craft.points.toNumber(), 1);
    p.craft.points = new Decimal(2);
    assert.equal(e.startProject('fish-tools'), true);
    e.cancelProject();
    assert.equal(p.craft.points.toNumber(), 0, 'Canceled equipment does not refund spent Craft');
    assert.equal(p.food.routes.fish, 1);
    assert.equal(p.civ.project, '');
});

test('larger hunting crews round-trip, retain active contracts and wait safely on repeat', t => {
    const {engine, p, e} = game(t);
    p.points = new Decimal(12);
    p.shelter.homes = 1; p.shelter.points = new Decimal(12);
    p.food.points = new Decimal(50); p.water.points = new Decimal(50);
    p.organization.total = new Decimal(2);
    p.food.routes.hunt = 1;
    p.civ.improvements.overseer = true;
    assert.equal(e.dispatch('hunt'), true);
    assert.equal(p.civ.actions.hunt.workers, 5);
    assert.equal(e.startProject('hunt-tools'), true);
    engine.advance(14);
    assert.equal(p.food.routes.hunt, 2);
    assert.equal(p.civ.actions.hunt.workers, 5);
    assert.equal(p.civ.actions.hunt.reward, 48);
    const codec = engine.session.saveCommands.saveCodec();
    const encoded = codec.encodePlayer(p);
    assert.equal(encoded.ok, true);
    const restored = createBalanceEngine(encoded.text); t.after(restored.dispose);
    assert.equal(restored.player.civ.actions.hunt.workers, 5);
    e.recall('hunt');
    p.points = new Decimal(5);
    assert.equal(e.toggleRepeat('hunt'), true);
    engine.advance(1);
    assert.equal(p.civ.actions.hunt.repeat, true);
    assert.equal(p.civ.actions.hunt.remaining, 0);
    p.points = new Decimal(12);
    engine.advance(1);
    assert.equal(p.civ.actions.hunt.workers, 8);
    const plan = e.prestigePreview('craft');
    assert.ok(plan.recalledActions.includes('hunt'));
});

test('existing saved route levels and unpaid in-flight construction use one current economy', t => {
    const {engine, p} = game(t);
    p.food.routes.gather = 2;
    p.food.routes.fish = 1;
    p.civ.project = 'fish-tools'; p.civ.projectWork = 7;
    const codec = engine.session.saveCommands.saveCodec();
    const restored = createBalanceEngine(codec.encodePlayer(p).text); t.after(restored.dispose);
    const e = restored.session.modRules.civilization;
    close(e.actionDefinition('gather').duration, 14.4);
    restored.advance(7);
    assert.equal(restored.player.food.routes.fish, 2);
    assert.equal(restored.player.craft.points.toNumber(), 0, 'No retroactive charge on saved construction');
    assert.equal(e.actionDefinition('fish').reward, 56);
});
