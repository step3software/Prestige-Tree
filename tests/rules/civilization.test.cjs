const test = require('node:test');
const assert = require('node:assert/strict');
const {createRuntime} = require('../support/game-runtime.cjs');
function game(t, options = {}) {
    const r = createRuntime({bridge:false, ...options});
    r.run('gameUI.commands.load(); var s=gameUI.session,p=s.saveState.player,e=s.modRules.civilization;');
    t.after(() => { r.run('s.dispose()'); r.dispose(); });
    return r;
}
const read = (r, expression) => JSON.parse(r.run('JSON.stringify(' + expression + ')'));

test('fresh game has only the nine resource nodes and grows within housing', t => {
    const r = game(t);
    assert.deepEqual(read(r, 's.layerRegistry.LAYERS'), ['food','water','shelter','craft','organization','money','freeTime','education','culture']);
    assert.equal(r.run('p.points.toNumber()'),5);
    assert.equal(r.run('p.shelter.points.toNumber()'),8);
    r.run('s.advance(120)');
    assert.equal(r.run('p.points.toNumber()'),8);
    assert.equal(r.run('e.supply().bottleneck'),'Shelter');
    assert.equal(r.run('typeof p.time'),'number');
    assert.equal(r.run('p.freeTime.points.toNumber()'),0);
    assert.equal(r.alerts.length,0);
    const start = read(r, '(()=>{var fresh=createGameSession();var values=fresh.modRules.civilization.supply();fresh.dispose();return values})()');
    assert.ok(Math.abs((start.workers.food-start.demand/start.efficiency.food)-(start.workers.water-start.demand/start.efficiency.water))<1e-9, 'Balanced allocates equal discretionary worker shares');
});

test('production, construction, money and free time share the same population labor', t => {
    const r = game(t);
    r.run('p.craft.points=new Decimal(2);p.organization.points=new Decimal(2);s.advance(1);e.startProject("food-site")');
    for (const priority of ['balanced','food','water','shelter']) {
        const value = read(r, `(()=>{p.civ.priority='${priority}';return e.supply()})()`);
        assert.ok(value.laborUsed <= value.population + 1e-9);
        assert.ok(value.builders > 0);
        assert.ok(value.moneyWorkers >= 0 && value.timeWorkers >= 0);
        assert.ok(Math.abs(value.moneyWorkers-value.timeWorkers)<1e-9, "Surplus labor is split without double counting");
        assert.ok(value.production.food <= value.capacity.food + 1e-9);
        assert.ok(value.production.water <= value.capacity.water + 1e-9);
    }
});

test('Food, Water and housing independently constrain growth despite huge reserves', t => {
    const r = game(t);
    r.run('p.points=new Decimal(8);p.shelter.homes=1;p.shelter.points=new Decimal(12);p.food.points=new Decimal(100);p.water.points=new Decimal(100)');
    assert.equal(r.run('e.supply().bottleneck'),'Food');
    r.run('p.food.sites=1');
    assert.equal(r.run('e.supply().bottleneck'),'Water');
    r.run('p.water.sites=1;s.advance(100)');
    assert.equal(r.run('p.points.toNumber()'),12);
    assert.equal(r.run('e.supply().bottleneck'),'Shelter');
});

test('zero stockpiles pause growth but labor-only construction restores a recovery route', t => {
    const r = game(t);
    r.run('p.points=new Decimal(8);p.food.points=new Decimal(0);p.water.points=new Decimal(0)');
    assert.equal(r.run('e.startProject("food-site")'),true);
    assert.equal(r.run('e.startProject("water-site")'),false);
    assert.equal(r.run('e.startProject("invented-project")'),false);
    r.run('s.advance(60)');
    assert.equal(r.run('p.food.sites'),1);
    assert.equal(r.run('p.points.toNumber()'),8);
    assert.equal(r.run('p.civ.project'),'');
    r.run('e.startProject("water-site");s.advance(60);e.startProject("shelter-home");s.advance(100)');
    assert.equal(r.run('p.shelter.homes'),1);
    assert.ok(r.run('p.points.toNumber()') > 8);
    assert.ok(r.run('p.food.points.gte(0)&&p.water.points.gte(0)'));
});

test('both prestige orders preserve Population, housing, infrastructure, construction and sibling', t => {
    for (const order of [['craft','organization'],['organization','craft']]) {
        const r = game(t);
        r.run('p.points=new Decimal(8);p.shelter.homes=1;p.shelter.points=new Decimal(12);p.food.sites=2;p.water.sites=2;e.startProject("food-storage");p.civ.projectWork=2');
        for (const id of order) {
            r.run('p.food.points=new Decimal(50);p.water.points=new Decimal(50);p.civ.growth=.5');
            assert.equal(r.run(`e.prestige('${id}')`),true);
            assert.equal(r.run(`e.prestige('${id}')`),false);
            assert.equal(r.run('p.points.toNumber()'),8);
            assert.equal(r.run('p.shelter.points.toNumber()'),12);
            assert.equal(r.run('p.food.sites'),2);
            assert.equal(r.run('p.food.points.toNumber()'),0);
            assert.equal(r.run('p.water.points.toNumber()'),0);
            assert.equal(r.run('p.civ.growth'),0);
            assert.equal(r.run('p.civ.projectWork'),2);
        }
        assert.ok(r.run('p.craft.points.gte(1)&&p.organization.points.gte(1)'));
        assert.ok(r.run('p.money.unlocked&&p.freeTime.unlocked'));
        r.run('s.advance(1200)');
        assert.ok(r.run('p.education.unlocked&&p.culture.unlocked'));
        const previous = r.run('e.supply().efficiency.food');
        assert.equal(r.run('e.invest("education")'),true);
        assert.ok(r.run('e.supply().efficiency.food') > previous);
        const upkeep = r.run('e.supply().upkeep');
        assert.equal(r.run('e.invest("culture")'),true);
        assert.ok(r.run('e.supply().upkeep') < upkeep);
    }
});

test('later investments reject locked/insufficient states without spending resources', t => {
    const r = game(t);
    assert.equal(r.run('e.invest("education")'),false);
    assert.equal(r.run('e.invest("food")'),false);
    assert.equal(r.run('e.prestige("money")'),false);
    r.run('p.education.unlocked=true');
    assert.equal(r.run('e.invest("education")'),false);
    assert.equal(r.run('p.education.points.toNumber()'),0);
    assert.equal(r.run('p.money.points.toNumber()'),0);
});

test('fixed simulation steps preserve the same economy across offline-like chunk sizes', t => {
    const a = game(t), b = game(t);
    a.run('e.startProject("shelter-home");s.advance(120)');
    b.run('e.startProject("shelter-home");for(let i=0;i<2400;i++)s.advance(.05)');
    for (const value of ['p.points.toNumber()','p.food.points.toNumber()','p.water.points.toNumber()','p.shelter.points.toNumber()','p.civ.growth']) assert.equal(a.run(value), b.run(value),value);
    assert.ok(a.run('p.civ.tickRemainder') < 1);
    assert.ok(b.run('p.civ.tickRemainder') < 1);
});

test('Organization automation requires its milestone and builds without repeated clicks', t => {
    const r = game(t);
    r.run('p.organization.points=new Decimal(2);p.civ.autoBuild=true;s.advance(180)');
    assert.ok(r.run('p.shelter.homes+p.food.sites+p.water.sites') >= 3);
    assert.ok(r.run('p.points.toNumber()') > 8);
});

test('a real fresh-game construction strategy reaches both prestige branches and later resources', t => {
    const r = game(t);
    const result = read(r, `(()=>{
        let seconds=0;
        for(;seconds<2400;seconds++){
            if(!p.civ.project){
                const next=p.food.sites<2?'food-site':p.water.sites<2?'water-site':p.shelter.homes<2?'shelter-home':null;
                if(next)e.startProject(next);
            }
            if(p.craft.points.lt(2)&&e.prestigeGain('craft'))e.prestige('craft');
            else if(p.organization.points.lt(2)&&e.prestigeGain('organization'))e.prestige('organization');
            s.advance(1);
            if(p.education.unlocked&&p.culture.unlocked)break;
        }
        return {seconds,craft:p.craft.points,organization:p.organization.points,education:p.education.unlocked,culture:p.culture.unlocked};
    })()`);
    assert.ok(Number(result.craft)>=1 && Number(result.organization)>=1);
    assert.equal(result.education,true);
    assert.equal(result.culture,true);
    console.log('Fresh-game strategy reached Education/Culture in '+result.seconds+' simulated seconds (synthetic strategy, not measured player pacing).');
});
