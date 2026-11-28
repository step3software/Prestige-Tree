const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBalanceEngine} = require('../../scripts/balance/engine.cjs');
const Decimal = require('../../js/technical/break_eternity.js');

function game(t) {
    const engine = createBalanceEngine();
    // Established-settlement fixture: retain activities already discovered before this test.
    Object.assign(engine.player.civ.features,{huts:true,hunting:true,buyables:false}); engine.player.civ.improvements.crafting=true; engine.player.organization.points=new Decimal(7);
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
    assert.equal(e.actionDefinition('hunt').reward, 24);
});

test('bigger game uses Craft access and rounds each successive crew without Organization gates', t => {
 const {p,e}=game(t);
 assert.equal(p.organization.total.toNumber(),0);assert.equal(e.startProject('hunt-tools'),true);e.cancelProject();
 for(const [level,workers] of [[0,3],[1,5],[2,8],[3,12]]){p.food.routes.hunt=level;assert.equal(e.actionDefinition('hunt').workers,workers);assert.equal(e.actionDefinition('hunt').reward,24*2**level);}
 p.food.routes.hunt=1;assert.equal(e.startProject('hunt-tools'),true);e.cancelProject();e.dispatch('gather');assert.equal(e.dispatch('hunt'),false);
 e.recall('gather');p.civ.improvements.hunting=true;
 for(const [level,workers] of [[0,2],[1,3],[2,5],[3,8]]){p.food.routes.hunt=level;assert.equal(e.actionDefinition('hunt').workers,workers);}
 p.civ.improvements.autonomousFood=true;assert.equal(e.actionDefinition('hunt').workers,0);
});

test('larger hunting crews round-trip, retain active contracts and wait safely on repeat', t => {
    const {engine, p, e} = game(t);
    p.points = new Decimal(12);
    p.shelter.homes = 1; p.shelter.points = new Decimal(12);
    p.food.points = new Decimal(50); p.water.points = new Decimal(50);
    p.organization.total=new Decimal(7);p.organization.points=new Decimal(7);
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
    assert.equal(e.setRepeat('hunt',1), true);
    engine.advance(1);
    assert.equal(p.civ.actions.hunt.repeat, 1);
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
    p.food.routes.hunt = 1;
    p.civ.project = 'hunt-tools'; p.civ.projectWork = 7;
    const codec = engine.session.saveCommands.saveCodec();
    const restored = createBalanceEngine(codec.encodePlayer(p).text); t.after(restored.dispose);
    const e = restored.session.modRules.civilization;
    close(e.actionDefinition('gather').duration, 14.4);
    restored.advance(7);
    assert.equal(restored.player.food.routes.hunt, 2);
    assert.equal(restored.player.craft.points.toNumber(), 0, 'No retroactive charge on saved construction');
    assert.equal(e.actionDefinition('hunt').reward, 96);
});
