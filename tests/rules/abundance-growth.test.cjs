const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBalanceEngine} = require('../../scripts/balance/engine.cjs');
const Decimal = require('../../js/technical/break_eternity.js');
function game(t) {
    const engine = createBalanceEngine(); t.after(engine.dispose);
    const p = engine.player, e = engine.session.modRules.civilization;
    p.food.points = new Decimal(5); p.water.points = new Decimal(5);
    return {engine,p,e};
}
function housing(p, homes) { p.shelter.homes=homes; p.shelter.points=new Decimal(8+4*homes); }
function close(actual, expected) { assert.ok(Math.abs(actual-expected)<1e-9, actual+' != '+expected); }

test('Food, Water and Shelter independently add zero to three to the growth multiplier', t => {
    const {p,e} = game(t);
    close(e.supply().abundance.multiplier,1);
    p.food.points=new Decimal(50);
    close(e.supply().abundance.food.bonus,3);
    close(e.supply().abundance.water.bonus,0);
    close(e.supply().abundance.shelter.bonus,0);
    close(e.supply().abundance.multiplier,4);
    p.food.points=new Decimal(5);p.water.points=new Decimal(50);
    close(e.supply().abundance.food.bonus,0);
    close(e.supply().abundance.water.bonus,3);
    close(e.supply().abundance.multiplier,4);
    p.water.points=new Decimal(5);housing(p,6);
    close(e.supply().abundance.shelter.bonus,3);
    close(e.supply().abundance.multiplier,4);
    p.food.points=new Decimal(50);p.water.points=new Decimal(50);
    close(e.supply().abundance.multiplier,10);
    p.food.points=new Decimal(5);
    close(e.supply().abundance.water.bonus,3);
    close(e.supply().abundance.shelter.bonus,3);
    close(e.supply().abundance.multiplier,7,'No multiplication or weakest-input gate');
});

test('reserve curves are zero through sixty seconds of actual upkeep and full near capacity', t => {
    const {p,e} = game(t);
    for(const value of [0,4,5]) {
        p.food.points=new Decimal(value);
        close(e.supply().abundance.food.bonus,0);
    }
    p.food.points=new Decimal(5.01);
    assert.ok(e.supply().abundance.food.bonus>0);
    for(const [stock, bonus] of [[15.125,0.46875],[25.25,1.5],[35.375,2.53125],[45.5,3],[50,3]]) {
        p.food.points=new Decimal(stock);
        close(e.supply().abundance.food.bonus,bonus);
    }
    p.points=new Decimal(8);housing(p,1);p.organization.points=new Decimal(10);
    p.food.points=new Decimal(5);p.water.points=new Decimal(5);
    close(e.supply().abundance.food.threshold,5,'Eight people at 0.625 upkeep each');
    close(e.supply().abundance.food.coverageSeconds,60);
    close(e.supply().abundance.multiplier,1);
});

test('small full stores cannot claim abundance when they cannot hold sixty seconds of upkeep', t => {
    const {p,e} = game(t);
    p.points=new Decimal(90);housing(p,30);
    p.food.points=new Decimal(50);p.water.points=new Decimal(50);
    close(e.supply().abundance.food.bonus,0);
    close(e.supply().abundance.water.bonus,0);
    assert.ok(Number.isFinite(e.supply().abundance.multiplier));
});

test('housing curve uses unbuffed fill time, tapers at sixty seconds and accounts for partial growth', t => {
    const {p,e} = game(t);
    p.points=new Decimal(3);
    close(e.supply().abundance.shelter.fillSeconds,60);
    close(e.supply().abundance.shelter.bonus,0);
    housing(p,5);
    close(e.supply().abundance.shelter.fillSeconds,300);
    close(e.supply().abundance.shelter.bonus,3);
    p.points=new Decimal(1);housing(p,2);
    close(e.supply().abundance.shelter.fillSeconds,180);
    close(e.supply().abundance.shelter.bonus,1.5);
    p.food.points=new Decimal(50);p.water.points=new Decimal(50);
    close(e.supply().abundance.shelter.bonus,1.5,'Supply bonuses do not change the housing input');
    p.civ.growth=0.5;
    close(e.supply().abundance.shelter.fillSeconds,174);
    assert.ok(e.supply().abundance.shelter.bonus<1.5);
});

test('normal growth remains twelve seconds per person while full abundance reaches ten times that rate', t => {
    const baseline=game(t);housing(baseline.p,1);
    baseline.p.points=new Decimal(7);baseline.p.food.points=new Decimal(7);baseline.p.water.points=new Decimal(7);
    baseline.engine.advance(12);
    assert.equal(baseline.p.points.toNumber(),8);
    close(baseline.p.civ.growth,0);
    const rich=game(t);housing(rich.p,11);
    rich.p.food.storage=2;rich.p.water.storage=2;
    rich.p.food.points=new Decimal(130);rich.p.water.points=new Decimal(130);
    rich.engine.advance(12);
    assert.equal(rich.p.points.toNumber(),15);
    close(rich.p.civ.growth,0);
    close(rich.e.supply().abundance.multiplier,10);
});

test('abundance never bypasses empty supplies or housing capacity', t => {
    const {engine,p,e} = game(t);housing(p,11);
    p.food.points=new Decimal(0);p.water.points=new Decimal(50);
    assert.ok(e.supply().abundance.multiplier>1);
    assert.equal(e.supply().growing,false);
    engine.advance(1);
    assert.equal(p.points.toNumber(),5);close(p.civ.growth,0);
    p.points=new Decimal(8);housing(p,0);
    p.food.points=new Decimal(50);p.water.points=new Decimal(50);
    engine.advance(30);
    assert.equal(p.points.toNumber(),8);close(p.civ.growth,0);
});

test('raising only curve weights can produce multiple births per second without invalid progress or excess housing', t => {
    const {engine,p} = game(t);housing(p,11);
    p.food.storage=2;p.water.storage=2;
    p.food.points=new Decimal(130);p.water.points=new Decimal(130);
    // A source-only tuning experiment in memory; the actual game is unchanged.
    const fs=require('node:fs'),path=require('node:path');
    const source=fs.readFileSync(path.join(__dirname,'../../js/civilization.js'),'utf8').replaceAll('maxBonus: 3','maxBonus: 9');
    const createTunedRules=new Function('Decimal',source+'\nreturn createCivilizationRules;')(Decimal);
    const tuned=createTunedRules({saveState:{player:p}});
    close(tuned.supply().abundance.multiplier,28);
    tuned.advance(3);
    assert.equal(p.points.toNumber(),12);
    assert.ok(p.civ.growth>=0&&p.civ.growth<1);
    assert.equal(engine.session.saveCommands.saveCodec().encodePlayer(p).ok,true);
    housing(p,1);p.points=new Decimal(11);p.civ.growth=0.7;
    tuned.advance(1);
    assert.equal(p.points.toNumber(),12,'Stop at capacity during a multi-birth step');
    close(p.civ.growth,0);
    assert.equal(engine.session.saveCommands.saveCodec().encodePlayer(p).ok,true);
});

test('abundance and partial growth stay deterministic across offline chunks and save/load', t => {
    const a=game(t);housing(a.p,11);
    a.p.food.storage=2;a.p.water.storage=2;
    a.p.food.points=new Decimal(130);a.p.water.points=new Decimal(130);a.p.civ.growth=0.37;
    const seed=a.engine.exportPlayer();
    const b=createBalanceEngine(seed);t.after(b.dispose);
    const c=createBalanceEngine(seed);t.after(c.dispose);
    a.engine.advance(17.5);
    for(let step=0;step<350;step++)b.advance(0.05);
    c.advance(10);
    const restored=createBalanceEngine(c.exportPlayer());t.after(restored.dispose);restored.advance(7.5);
    for(const p of [b.player,restored.player]) {
        assert.equal(p.points.toString(),a.p.points.toString());
        assert.equal(p.food.points.toString(),a.p.food.points.toString());
        assert.equal(p.water.points.toString(),a.p.water.points.toString());
        close(p.civ.growth,a.p.civ.growth);
        assert.ok(p.civ.growth>=0&&p.civ.growth<1);
    }
});
