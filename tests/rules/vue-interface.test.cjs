const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const realVue = require('vue');
const {createRuntime,loadedRuntime,root} = require('../support/game-runtime.cjs');
const {historicalSources} = require('../support/historical-sources.cjs');
const {verifyPackage} = require('../../scripts/check-package.cjs');

// Real framework reactivity, with only DOM mounting omitted in rule fixtures.
const vue = {...realVue,createApp:()=>({config:{},component(){},mount:()=>({$forceUpdate(){}})})};

test('real Vue observes the canonical selected player, arrays, derived replacements, rule status and notifications',t=>{
  const r = loadedRuntime({vue}); t.after(r.dispose);
  r.run(`var session=gameUI.session, seen=[];
    var runner=Vue.effect(()=>seen.push([session.saveState.player.points.toString(),session.saveState.player.p.upgrades.length,
      session.derivedState.tmp.displayThings.length,session.gameRules.status.gameEnded,session.modRules.activeNotifications.length]));
    var initialPlayer=session.saveState.player;
    session.saveState.player.points=new Decimal(123);
    session.saveState.player.p.upgrades.push(11);
    session.derivedState.tmp.displayThings.push('reactive');
    session.gameRules.status.gameEnded=true;
    session.modRules.addNotification('none','message');`);
  assert.equal(r.run('seen.length >= 6 && seen.at(-1).join("|")==="123|1|1|true|1"'),true);
  assert.equal(r.run(`Vue.isReactive(session.saveState.player) && Vue.isReactive(session.derivedState.tmp) &&
    Vue.isReactive(session.modRules.activeNotifications) && session.saveState.player===session.saveState.allSaves[session.saveState.allSaves.set] &&
    session.saveState.player===initialPlayer && session.saveState.player.points instanceof Decimal &&
    !Vue.isProxy(session.saveState.player.points) && session.saveState.player.points.add(1).eq(124)`),true);
  r.run(`Vue.stop(runner); session.derivedState.setupTemp(); session.gameView.bind();
    var collection=session.saveState.allSaves, second=session.saveDefaults.createSavePlayer(1700000000000);
    second.points=new Decimal('ee1000'); session.saveState.activate({...collection, second, set:'second'}); session.gameView.bind();`);
  assert.equal(r.run('session.saveState.player===session.saveState.allSaves.second && session.saveState.player.points.eq("ee1000") && !Vue.isProxy(session.saveState.player.points)'),true);
  assert.equal(r.run('Object.keys(Decimal.prototype).includes("__v_skip")'),false,'Proxy opt-out metadata must not change serialized/enumerable fields');
});

test('reactive sessions remain independent and memory restoration retains failure/resource gates',t=>{
  const r = createRuntime({vue,bridge:false}); t.after(r.dispose);
  r.run(`var observe=value=>{Vue.markRaw(Decimal.prototype);return Vue.reactive(value);};
    var a=createGameSession({effects:{observe}}), b=createGameSession({effects:{observe}});
    a.gameRules.doReset('p');a.purchase('p',11);a.advance(1);
    var text=a.saveCommands.saveCodec().encodePlayer(a.saveState.player).text;
    var beforeA=JSON.stringify(a.saveState.player); b.loadPlayer(text);b.advance(2);`);
  assert.equal(r.run('beforeA===JSON.stringify(a.saveState.player) && a.saveState.player.points.eq(1) && b.saveState.player.points.eq(3)'),true);
  assert.equal(r.run('a.derivedState.tmp!==b.derivedState.tmp && a.layerRegistry.layers.p!==b.layerRegistry.layers.p && a.modRules.activeNotifications!==b.modRules.activeNotifications'),true);
  r.run('b.gameRules.tickFaulted=true;var beforeB=JSON.stringify(b.saveState.player);');
  assert.equal(r.run('b.loadPlayer(text).ok'),false);
  assert.equal(r.run('beforeB===JSON.stringify(b.saveState.player)'),true);
  r.run('a.dispose();b.dispose();');
});

test('real Vue memory restoration returns the canonical reactive player for subsequent callers',t=>{
  const r=createRuntime({vue,bridge:false});t.after(r.dispose);
  r.run(`var session=createGameSession({effects:{observe:value=>{Vue.markRaw(Decimal.prototype);return Vue.reactive(value);}}});
    var text=session.saveCommands.saveCodec().encodePlayer(session.saveState.player).text;
    var restored=session.loadPlayer(text);`);
  assert.equal(r.run('restored.ok && restored.value===session.saveState.player'),true,'Restoration must return the same canonical player consumers observe');
  r.run(`var updates=0;var runner=Vue.effect(()=>{session.saveState.player.points.toString();updates++;});restored.value.points=new Decimal(123);`);
  assert.equal(r.run('updates'),2,'Mutation through the returned player must trigger canonical observers');
  r.run('Vue.stop(runner);session.dispose();');
});

const checkpoints = [
  {name:'early',setup:`player.points=new Decimal('1e100');player.p.points=new Decimal('1e12');player.p.total=new Decimal('1e15');
    player.p.upgrades=[11,12];player.b.unlocked=player.g.unlocked=true;player.b.points=new Decimal(8);player.b.best=new Decimal(16);
    player.b.upgrades=[11,12];player.g.points=new Decimal(999);player.t.milestones=[3,4];player.b.auto=true;`},
  {name:'middle',setup:`player.g.power=new Decimal('1e1000');player.q.unlocked=player.e.unlocked=true;player.q.points=new Decimal(100);
    player.q.energy=new Decimal('1e20');player.ba.unlocked=true;player.ba.neg=new Decimal('1e30');player.ba.pos=new Decimal('1e24');
    player.o.unlocked=true;player.o.points=new Decimal(100);player.ba.milestones=[0,3];player.ba.upgrades=[11];`},
  {name:'late',setup:`for(let id of ['mc','ne','id','r','ai','ge','ma'])player[id].unlocked=true;
    player.ne.points=new Decimal(8);player.ne.thoughts=new Decimal(25);player.ne.signals=new Decimal('1e9');player.ne.buyables[11]=new Decimal(2);
    player.ss.subspace=new Decimal('1e10000000');player.en.total=new Decimal('1e20');player.r.points=new Decimal(10);
    player.ai.consc=new Decimal(161);player.ai.buyables[11]=new Decimal(2);player.id.points=new Decimal(500);
    player.ne.auto=true;player.ne.activeChallenge=11;player.ai.upgrades=[11];`},
];
for (const checkpoint of checkpoints) test(`real Vue ${checkpoint.name} state/tick/save bytes match immutable DEV01`,t=>{
  const before=loadedRuntime(historicalSources('51a9b96c9949e6d0f96a65d5650ecac575fb9da8'));
  const after=loadedRuntime({vue});t.after(before.dispose);t.after(after.dispose);
  const snapshots=[];
  for(const r of [before,after]) {
    r.run(`gameRuntime.stop();${checkpoint.setup}for(let pass=0;pass<5;pass++)updateTemp();`);
    const initial=r.run('JSON.stringify(player)');
    r.run('advanceActiveGame(captureGameIdentity(),0.5);for(let pass=0;pass<5;pass++)updateTemp();');
    const acted=r.run('JSON.stringify(player)');
    assert.notEqual(initial,acted,'Workload must execute actual game rules');
    r.run('save();');
    snapshots.push([initial,acted,r.data.get('ptr')]);
  }
  assert.deepEqual(snapshots[1],snapshots[0]);
});

test('package verification rejects a corrupted/old runtime and missing application assets after a valid package',t=>{
  assert.equal(verifyPackage().vue,'3.5.46');
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'prestige-ui01-package-'));
  t.after(()=>{
    assert.equal(path.dirname(path.resolve(directory)),path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('prestige-ui01-package-'));
    fs.rmSync(directory,{recursive:true,force:true});
  });
  fs.cpSync(path.join(root,'dist'),directory,{recursive:true});
  verifyPackage(directory);
  const file=path.join(directory,'vendor/vue.global.prod.js');
  const original=fs.readFileSync(file);
  fs.writeFileSync(file,'/* old or substituted Vue 2 runtime */');
  assert.throws(()=>verifyPackage(directory),/digest differs/);
  fs.writeFileSync(file,original);
  fs.rmSync(path.join(directory,'js/browser-entry.js'));
  assert.throws(()=>verifyPackage(directory));
});
