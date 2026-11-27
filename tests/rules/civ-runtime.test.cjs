const test=require('node:test');
const assert=require('node:assert/strict');
const {createRuntime}=require('../support/game-runtime.cjs');
function open(t){const r=createRuntime({bridge:false});r.run('gameUI.commands.load();var s=gameUI.session,p=s.saveState.player;');t.after(()=>{r.run('s.dispose()');r.dispose();});return r;}
test('independent sessions own their population, production and mutable layer definitions',t=>{
    const r=open(t);r.run('var other=createGameSession();other.modRules.civilization.startProject("food-site");other.advance(100);');
    assert.equal(r.run('p.food.sites'),0);
    assert.equal(r.run('other.saveState.player.food.sites'),1);
    assert.equal(r.run('other.layerRegistry.layers.food===s.layerRegistry.layers.food'),false);
    assert.throws(()=>r.run('advanceGame(other,-1)'),/nonnegative/);
    r.run('other.dispose()');assert.throws(()=>r.run('other.advance(1)'),/Disposed/);
});
test('repeated load does not duplicate drivers and pagehide disposes resources',t=>{
    const r=open(t);assert.equal(r.intervals.size,3);
    r.run('gameUI.commands.load();p=s.saveState.player');assert.equal(r.intervals.size,3);
    r.clock.now+=1000;r.fire(50);
    assert.ok(r.run('p.timePlayed')>=1);
    r.emit('window','pagehide',{persisted:false});assert.equal(r.intervals.size,0);
});
test('clock high-water marks and disabled offline production cannot create free elapsed time',t=>{
    const r=open(t);r.run('p.time=10000');
    assert.equal(r.run('s.runtimeServices.observeGameTime(p,9000)'),0);
    assert.equal(r.run('s.runtimeServices.observeGameTime(p,11000)'),1);
    assert.equal(r.run('s.runtimeServices.observeGameTime(p,11000)'),0);
    r.run('p.offlineProd=false;p.offTime={remain:500}');
    assert.equal(r.run('s.runtimeServices.budgetGameTime(p,1,1)'),1);
    assert.equal(r.run('p.offTime'),null);
});
test('offline bank applies actual economy growth within housing and is consumed once',t=>{
    const r=open(t);r.run('p.offTime={remain:600}');
    r.clock.now+=1000;r.fire(50);
    assert.equal(r.run('p.points.toNumber()'),8);
    assert.ok(r.run('p.offTime.remain')<600);
    assert.ok(r.run('p.food.points.gte(0)&&p.water.points.gte(0)'));
});
test('a rule fault stops all drivers and blocks every subsequent save until reload',t=>{
    const r=open(t);r.run('gameUI.commands.save()');const durable=r.data.get('civ-prestige-tree');
    r.run('s.layerRegistry.layers.food.update=()=>{throw new Error("synthetic economy failure")};');
    r.clock.now+=1000;r.fire(50);
    assert.equal(r.intervals.size,0);
    assert.equal(r.run('s.gameRules.tickFaulted'),true);
    assert.equal(r.run('gameUI.commands.save()'),false);
    assert.equal(r.data.get('civ-prestige-tree'),durable);
    assert.match(r.elements['save-status'].textContent,/Reload/);
});
