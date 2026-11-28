const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBalanceEngine} = require('../../scripts/balance/engine.cjs');
const fixture = require('../fixtures/civ-pre-fishing-removal-v091.json');

function game(t, input) {
    const engine = createBalanceEngine(input);
    t.after(engine.dispose);
    return {engine, p: engine.player, e: engine.session.modRules.civilization};
}

test('fishing commands and river traps are absent even at every earned milestone', t => {
    const {engine, p, e} = game(t, fixture.save);
    const before = engine.exportPlayer();
    assert.equal(e.actionDefinition('fish'), null);
    for (const command of [() => e.dispatch('fish'), () => e.recall('fish'),
        () => e.setRepeat('fish', 3), () => e.setExpeditionMultiplier('fish', 2),
        () => e.startProject('fish-tools'), () => e.buyUpgrade('fishing')]) assert.equal(command(), false);
    assert.equal(engine.exportPlayer(), before, 'Rejected commands do not mutate state');
    assert.deepEqual(Object.keys(p.food.routes), ['gather', 'hunt', 'farm']);
    assert.ok(e.node('food').actions.every(action => action.id !== 'fish'));
    assert.ok(e.projects('food').every(project => project.id !== 'fish-tools'));
    assert.ok(e.organizationMilestones().every(m => !/fish|trap/i.test(JSON.stringify(m))));
    assert.equal(e.organizationMilestones()[8].name, 'Irrigation');
    assert.equal(e.organizationMilestones()[8].earned, true);
});

test('v0.91 cancels fishing and paid trap work without compensation and preserves other progress', t => {
    const original = JSON.parse(atob(fixture.save));
    assert.equal(original.version, '0.91');
    assert.ok(original.civ.actions.fish.remaining > 0);
    assert.equal(original.civ.actions.fish.repeat, 3);
    assert.equal(original.civ.project, 'fish-tools');
    const {engine, p, e} = game(t, fixture.save);
    assert.equal(p.version, '0.93');
    for (const [record, key] of [[p.civ.actions, 'fish'], [p.food.routes, 'fish'],
        [p.civ.features, 'fishing'], [p.civ.expeditionMultipliers, 'fish']]) assert.equal(Object.hasOwn(record, key), false);
    assert.equal(p.civ.project, '');
    assert.equal(p.civ.projectWork, 0);
    assert.match(p.civ.message, /cancelled without compensation/);
    assert.equal(e.supply().builders, 0);
    assert.equal(e.supply().overseerWorkers, 0);
    assert.equal(e.supply().laborUsed, original.civ.actions.gather.workers);
    assert.deepEqual(p.civ.actions.gather, original.civ.actions.gather);
    for (const id of ['food', 'water', 'craft', 'organization', 'shelter']) {
        for (const field of ['points', 'best', 'total']) assert.equal(p[id][field].toString(), original[id][field], id + '.' + field);
    }
    assert.equal(p.points.toString(), original.points);
    const encoded = engine.exportPlayer();
    const restored = game(t, encoded);
    assert.equal(restored.engine.exportPlayer(), encoded, 'Canonical round trips are stable');
    restored.engine.advance(1);
    assert.equal(Object.hasOwn(restored.p.civ.actions, 'fish'), false);
});

test('retiring fishing leaves unrelated paid construction intact', t => {
    const {engine} = game(t);
    const raw = JSON.parse(atob(fixture.save));
    raw.civ.project = 'water-storage';
    const result = engine.session.saveCommands.saveCodec().decodePlayer(raw);
    assert.equal(result.ok, true, result.error);
    assert.equal(result.value.civ.project, 'water-storage');
    assert.equal(result.value.civ.projectWork, raw.civ.projectWork);
    assert.equal(result.value.civ.projectWorkers, raw.civ.projectWorkers);
});

test('malformed retired fishing fields reject atomically before any live replacement', t => {
    const {engine, p} = game(t);
    const before = engine.exportPlayer();
    const mutations = [
        raw => { raw.civ.features.fishing = 'yes'; },
        raw => { raw.food.routes.fish = -1; },
        raw => { raw.civ.expeditionMultipliers.fish = 6; },
        raw => { raw.civ.actions.fish = null; },
        raw => { raw.civ.actions.fish.reward = '14'; },
        raw => { raw.civ.actions.fish.remaining = 99; },
        raw => { raw.civ.actions.fish.workers = 3; },
        raw => { raw.civ.actions.fish.repeat = true; },
        raw => { raw.civ.actions.fish.extra = 1; },
        raw => { raw.points = '2'; },
        raw => { raw.civ.projectWork = -1; },
        raw => { raw.civ.projectWork = null; },
        raw => { raw.civ.projectWorkers = 2; },
        raw => { raw.civ.projectJobs = 2; },
        raw => { delete raw.civ.actions.fish; raw.points = '1'; },
        raw => { raw.civ.message = 42; },
    ];
    for (const mutate of mutations) {
        const raw = JSON.parse(atob(fixture.save));
        mutate(raw);
        const original = JSON.stringify(raw);
        const result = engine.session.loadPlayer(raw);
        assert.equal(result.ok, false, mutate.toString());
        assert.equal(engine.player, p);
        assert.equal(engine.exportPlayer(), before);
        assert.equal(JSON.stringify(raw), original, 'Ingress never mutates the input');
    }
});

test('pre-0.7 migration preserves other repeat orders when retiring fishing frees their Overseer', t => {
    const {engine} = game(t);
    const raw = JSON.parse(atob(fixture.save));
    raw.version = '0.6';
    raw.points = '4';
    raw.civ.actions.gather.repeat = true;
    raw.civ.actions.fish.repeat = false;
    raw.civ.improvements.overseer = true;
    const result = engine.session.saveCommands.saveCodec().decodePlayer(raw);
    assert.equal(result.ok, true, result.error);
    assert.equal(result.value.civ.actions.gather.repeat, 1);
    assert.equal(result.value.civ.actions.gather.remaining, raw.civ.actions.gather.remaining);
    const restored = game(t, engine.session.saveCommands.saveCodec().encodePlayer(result.value).text);
    assert.equal(restored.e.supply().overseerWorkers, 1);
    assert.equal(restored.p.civ.actions.gather.repeat, 1);
});

test('current saves reject reintroduced fishing instead of retaining an old runtime mode', t => {
    const {engine} = game(t);
    const codec = engine.session.saveCommands.saveCodec();
    const historical = JSON.parse(atob(fixture.save));
    for (const mutate of [
        raw => { raw.civ.actions.fish = historical.civ.actions.fish; },
        raw => { raw.food.routes.fish = 0; },
        raw => { raw.civ.features.fishing = false; },
        raw => { raw.civ.expeditionMultipliers.fish = 1; },
        raw => { raw.civ.project = 'fish-tools'; },
    ]) {
        const raw = JSON.parse(atob(engine.exportPlayer()));
        mutate(raw);
        assert.equal(codec.decodePlayer(raw).ok, false);
    }
});

test('missing current discovery fields hydrate current defaults without restoring fishing', t => {
    const {engine} = game(t);
    const raw = JSON.parse(atob(engine.exportPlayer()));
    delete raw.civ.features;
    const result = engine.session.saveCommands.saveCodec().decodePlayer(raw);
    assert.equal(result.ok, true, result.error);
    assert.deepEqual(result.value.civ.features, {huts: false, hunting: false, buyables: false});
});
