const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBalanceEngine} = require('../../scripts/balance/engine.cjs');

function game(t, milestones, homes, purchased = true) {
    const engine = createBalanceEngine(); t.after(engine.dispose);
    const p = engine.player, D = p.points.constructor;
    p.organization.best = new D(milestones);
    p.organization.total = new D(100); // Lifetime earnings must not set the cap.
    p.shelter.homes = homes; p.shelter.points = new D(8 + homes * 4);
    p.civ.improvements.joinery = purchased;
    p.points = new D(12);
    return {engine, p, D, e: engine.session.modRules.civilization};
}

test('Timber frames caps built hut retention at earned milestones on both tier 2 resets', t => {
    for (const id of ['craft', 'organization']) {
        for (let milestones = 0; milestones <= 10; milestones++) {
            for (const homes of [0, 1, 4, 12]) {
                const {engine,p,e} = game(t, milestones, homes);
                const earned = Math.max(milestones, id === 'organization' ? 1 : 0);
                const expected = earned === 10 ? homes : Math.min(homes, earned);
                const plan = e.prestigePreview(id);
                assert.equal(plan.retainedHuts, expected);
                if (expected) assert.ok(plan.keepText.includes(expected + ' built huts'));
                if (homes > expected) assert.ok(plan.resetText.includes((homes - expected) + ' built huts'));
                assert.equal(p.shelter.homes, homes, 'Preview is read-only');
                assert.equal(e.prestige(id), true);
                assert.equal(p.shelter.homes, expected);
                assert.equal(p.shelter.points.toNumber(), 8 + 4 * expected);
                assert.equal(p.points.toNumber(), 5);
                assert.equal(p.civ.improvements.joinery, true);
                const loaded = createBalanceEngine(engine.exportPlayer()); t.after(loaded.dispose);
                assert.equal(loaded.player.shelter.homes, expected);
                assert.equal(loaded.exportPlayer(), engine.exportPlayer());
            }
        }
    }
});

test('prospective Organization milestone counts immediately and spending does not reduce the cap', t => {
    const {p,e,D} = game(t, 3, 8);
    p.organization.points = new D(3); p.points = new D(20);
    assert.equal(e.prestigePreview('organization').retainedHuts, 4);
    assert.equal(e.prestige('organization'), true);
    assert.equal(p.shelter.homes, 4);
    p.organization.points = new D(0); p.points = new D(12);
    assert.equal(e.prestigePreview('craft').retainedHuts, 4);
    assert.equal(e.prestige('craft'), true);
    assert.equal(p.shelter.homes, 4, 'Repeated resets never manufacture huts');
});

test('unbought Timber frames resets huts until milestone ten; partial retention cancels unfinished work', t => {
    for (const purchased of [false, true]) {
        const {engine,p,e,D} = game(t, 3, 4, purchased);
        assert.equal(e.startProject('shelter-home'), true);
        engine.advance(1);
        assert.equal(e.prestigePreview('craft').resetConstruction, true);
        assert.equal(e.prestige('craft'), true);
        assert.equal(p.shelter.homes, purchased ? 3 : 0);
        assert.equal(p.civ.project, '');
        p.organization.best = new D(10); p.points = new D(12);
        assert.equal(e.startProject('shelter-home'), true);
        engine.advance(1);
        const work = p.civ.projectWork;
        assert.equal(e.prestige('craft'), true);
        assert.equal(p.civ.project, 'shelter-home');
        assert.equal(p.civ.projectWork, work);
    }
});

test('invalid resets preserve built huts and active work', t => {
    const {engine,p,e,D} = game(t, 3, 4);
    assert.equal(e.startProject('shelter-home'), true); engine.advance(1);
    p.points = new D(5);
    const before = engine.exportPlayer();
    assert.equal(e.prestige('craft'), false);
    assert.equal(e.prestige('organization'), false);
    assert.equal(e.prestige('money'), false);
    assert.equal(engine.exportPlayer(), before);
});

test('v0.8 Timber frames housing converts once without changing huts, Population or paid work', t => {
    const {engine,p,e} = game(t, 3, 4);
    assert.equal(e.startProject('shelter-home'), true); engine.advance(1);
    const raw = JSON.parse(Buffer.from(engine.exportPlayer(), 'base64').toString());
    raw.version = '0.8'; raw.shelter.points = '32';
    const original = JSON.stringify(raw);
    const codec = engine.session.saveCommands.saveCodec();
    const result = codec.decodePlayer(raw);
    assert.equal(result.ok, true, result.error);
    assert.equal(JSON.stringify(raw), original, 'Detached conversion preserves the original');
    const loaded = createBalanceEngine(codec.encodePlayer(result.value).text); t.after(loaded.dispose);
    assert.equal(loaded.player.version, '0.9');
    assert.equal(loaded.player.shelter.homes, 4);
    assert.equal(loaded.player.shelter.points.toNumber(), 24);
    assert.equal(loaded.player.points.toNumber(), p.points.toNumber());
    assert.equal(loaded.player.civ.projectWork, p.civ.projectWork);
    const again = createBalanceEngine(loaded.exportPlayer()); t.after(again.dispose);
    assert.equal(again.exportPlayer(), loaded.exportPlayer());
    raw.shelter.points = '999';
    assert.equal(codec.decodePlayer(raw).ok, false);
    assert.equal(p.shelter.homes, 4);
    assert.equal(p.shelter.points.toNumber(), 24);
});
