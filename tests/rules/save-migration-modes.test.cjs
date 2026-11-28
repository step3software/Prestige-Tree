const test = require('node:test');
const assert = require('node:assert/strict');
const {createBalanceEngine} = require('../../scripts/balance/engine.cjs');
const {createRuntime} = require('../support/game-runtime.cjs');

function game(t, mode) {
    const engine = createBalanceEngine();
    t.after(engine.dispose);
    if (mode) engine.session.modRules.saveMigrationMode = mode;
    const raw = JSON.parse(atob(engine.exportPlayer()));
    return {engine, raw, codec: engine.session.saveCommands.saveCodec()};
}

function removedContent(raw) {
    raw.retiredResource = {points: '100'};
    raw.food.retiredCounter = 12;
    raw.food.routes.retiredRoute = 9;
    raw.food.upgrades.push('retired-upgrade');
    raw.food.buyables.retiredBuyable = '10';
    raw.civ.improvements.retiredUpgrade = true;
    raw.civ.actions.retiredJob = {workers: 400, reward: 999};
    raw.civ.fireBuyables.retiredFuel = 7;
    raw.civ.features.retiredFeature = true;
    raw.civ.project = 'retired-construction';
    raw.civ.projectWork = 40;
    raw.civ.projectJobs = 3;
    raw.civ.projectWorkers = 3;
    raw.civ.preparedHut = true;
    raw.craft.points = '17';
    raw.water.points = '23';
}

test('current release uses dev save migration independently of the server or saved policy', t => {
    const {engine, raw, codec} = game(t);
    assert.equal(engine.session.modRules.saveMigrationMode, 'dev');
    raw.saveMigrationMode = 'prod';
    raw.civ.improvements.removed = true;
    const result = codec.decodePlayer(raw);
    assert.equal(result.ok, true, result.error);
    assert.equal('saveMigrationMode' in result.value, false);
    assert.equal('removed' in result.value.civ.improvements, false);
});

test('dev drops removed content and paid construction without a refund or replacement', t => {
    const {engine, raw, codec} = game(t);
    removedContent(raw);
    const before = JSON.stringify(raw);
    const result = codec.decodePlayer(raw);
    assert.equal(result.ok, true, result.error);
    assert.equal(JSON.stringify(raw), before, 'Ingress edits only a detached candidate');
    const p = result.value;
    assert.equal('retiredResource' in p, false);
    assert.equal('retiredCounter' in p.food, false);
    assert.equal('retiredRoute' in p.food.routes, false);
    assert.deepEqual(p.food.upgrades, []);
    assert.equal('retiredBuyable' in p.food.buyables, false);
    assert.equal('retiredUpgrade' in p.civ.improvements, false);
    assert.equal('retiredJob' in p.civ.actions, false);
    assert.equal('retiredFuel' in p.civ.fireBuyables, false);
    assert.equal('retiredFeature' in p.civ.features, false);
    assert.equal(p.civ.project, '');
    assert.equal(p.civ.projectWork, 0);
    assert.equal(p.civ.projectWorkers, 1);
    assert.equal(p.civ.projectJobs, 1);
    assert.equal(p.civ.preparedHut, false);
    assert.equal(p.craft.points.toNumber(), 17);
    assert.equal(p.water.points.toNumber(), 23);
    assert.equal(p.points.toString(), raw.points);
    assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(raw))).ok, true);
    engine.advance(1);
    const once = engine.exportPlayer();
    assert.equal(codec.encodePlayer(codec.decodePlayer(once).value).text, once);
});

test('dev retains existing paid work and acquires missing defaults', t => {
    const {engine} = game(t);
    const e = engine.session.modRules.civilization;
    engine.player.civ.improvements.crafting = true;
    assert.equal(e.startProject('water-site'), true);
    assert.equal(e.dispatch('gather'), true);
    engine.advance(2.5);
    const raw = JSON.parse(atob(engine.exportPlayer()));
    delete raw.civ.shortage;
    raw.civ.actions.removed = {remaining: 30, workers: 10};
    assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(raw))).ok, true);
    assert.equal(engine.player.civ.projectWork, raw.civ.projectWork);
    assert.equal(engine.player.civ.actions.gather.remaining, raw.civ.actions.gather.remaining);
    assert.equal(engine.player.civ.tickRemainder, .5);
    assert.deepEqual(engine.player.civ.shortage, {elapsed: 0, losses: 0});
});

test('dev repairs removed display references while retaining current notifications', t => {
    const {raw, codec} = game(t);
    raw.tab = raw.navTab = raw.lastSafeTab = 'removed-layer';
    raw.notify = {food: true, 'removed-layer': true};
    raw.infoboxes.removed = {story: true};
    raw.subtabs.removed = {mainTabs: 'old'};
    raw.food.activeChallenge = 'retired';
    const result = codec.decodePlayer(raw);
    assert.equal(result.ok, true, result.error);
    assert.equal(result.value.tab, 'food');
    assert.equal(result.value.food.activeChallenge, null);
    assert.deepEqual(result.value.notify, {food: true});
    assert.equal('removed' in result.value.infoboxes, false);
    assert.equal('removed' in result.value.subtabs, false);
});

test('prod rejects unhandled removed content before replacing the live settlement', t => {
    const {engine, raw} = game(t, 'prod');
    const before = engine.exportPlayer();
    for (const mutate of [
        p => { p.retiredLayer = {}; },
        p => { p.civ.improvements.retiredUpgrade = true; },
        p => { p.civ.project = 'retired-construction'; },
        p => { p.food.upgrades.push('retired-upgrade'); },
    ]) {
        const candidate = structuredClone(raw);
        mutate(candidate);
        assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(candidate))).ok, false);
        assert.equal(engine.exportPlayer(), before);
    }
});

test('retired Water keeper is dropped in dev and explicitly converted in prod', t => {
    for (const mode of ['dev', 'prod']) {
        const {raw, codec} = game(t, mode);
        raw.version = '0.6';
        raw.civ.improvements.waterOrders = true;
        raw.civ.actions.water.repeat = true;
        const result = codec.decodePlayer(raw);
        assert.equal(result.ok, true, result.error);
        assert.equal('waterOrders' in result.value.civ.improvements, false);
        assert.equal(result.value.civ.improvements.hutForeman, mode === 'prod');
        assert.equal(result.value.civ.hutRepeat, 0);
        assert.equal(result.value.civ.actions.water.repeat, 0);
        assert.equal(result.value.craft.points.toString(), raw.craft.points);
    }
});

test('both modes reject malformed current content, foreign identity and newer versions', t => {
    for (const mode of ['dev', 'prod']) {
        const {raw, codec} = game(t, mode);
        for (const mutate of [
            p => { p.civ.improvements.crafting = 'yes'; },
            p => { p.food.points = '-1'; },
            p => { p.civ.actions.gather.workers = 99; },
            p => { p.food.activeChallenge = {}; },
            p => { p.versionType = 'ptr'; },
            p => { p.version = '999'; },
        ]) {
            const candidate = structuredClone(raw);
            mutate(candidate);
            assert.equal(codec.decodePlayer(candidate).ok, false, mode);
        }
    }
});

test('dev startup and import normalize whole collections before saving', t => {
    const {raw} = game(t);
    removedContent(raw);
    const original = btoa(JSON.stringify({set: 'save1', save1: raw, spare: raw}));
    const r = createRuntime({bridge: false, storage: {'civ-prestige-tree': original, ptr: 'untouched'}});
    t.after(() => { r.run('gameUI.session.dispose()'); r.dispose(); });
    r.run('gameUI.commands.load(); var s=gameUI.session;');
    assert.equal(r.run('s.saveState.player.civ.project'), '');
    assert.equal(r.run('gameUI.commands.save()'), true);
    const stored = JSON.parse(atob(r.data.get('civ-prestige-tree')));
    assert.equal('retiredResource' in stored.save1, false);
    assert.equal('retiredResource' in stored.spare, false);
    assert.equal(stored.save1.craft.points, '17');
    assert.equal(r.data.get('ptr'), 'untouched');
    r.io.prompt = btoa(JSON.stringify(raw));
    assert.equal(r.run('gameUI.commands.importSave()'), true);
    assert.equal(r.run('s.saveState.player.craft.points.toNumber()'), 17);
});

test('a malformed retained save prevents partial dev collection migration', t => {
    const {raw} = game(t);
    removedContent(raw);
    const broken = structuredClone(raw);
    broken.civ.improvements.crafting = 'invalid';
    const original = btoa(JSON.stringify({set: 'save1', save1: raw, broken}));
    const r = createRuntime({bridge: false, storage: {'civ-prestige-tree': original}});
    t.after(() => { r.run('gameUI.session.dispose()'); r.dispose(); });
    r.run('gameUI.commands.load()');
    assert.equal(r.run('gameUI.session.saveState.player'), undefined);
    assert.equal(r.data.get('civ-prestige-tree'), original);
    assert.equal(r.io.writes, 0);
    assert.equal(r.intervals.size, 0);
    assert.equal(r.elements['save-recovery'].hidden, false);
});
