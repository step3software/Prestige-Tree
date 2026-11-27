const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createRuntime} = require('../support/game-runtime.cjs');

test('two sessions interleave real advance, purchase and validated load in one JavaScript realm', t => {
  const r = createRuntime({bridge:false}); t.after(r.dispose);
  r.run(`gameUI.commands.load(); gameUI.session.runtimeServices.gameRuntime.stop();
    var activeBefore = JSON.stringify(gameUI.session.saveState.player);
    var a = createGameSession(), b = createGameSession();
    var bBefore = JSON.stringify(b.saveState.player);
    var bCache = b.derivedState.tmp;
    a.gameRules.doReset('p'); a.purchase('p', 11); advanceGame(a, 1);`);
  assert.equal(r.run('a.saveState.player.points.eq(1) && b.saveState.player.points.eq(10)'), true);
  assert.equal(r.run('bBefore === JSON.stringify(b.saveState.player) && b.derivedState.tmp === bCache'), true);
  assert.equal(r.run(`a.saveState.player !== b.saveState.player && a.saveState.allSaves !== b.saveState.allSaves &&
    a.derivedState.tmp !== b.derivedState.tmp && a.derivedState.tmp.p !== b.derivedState.tmp.p &&
    a.layerRegistry.layers !== b.layerRegistry.layers && a.layerRegistry.layers.p !== b.layerRegistry.layers.p &&
    a.layerRegistry.layers.p.gainMult !== b.layerRegistry.layers.p.gainMult &&
    a.modRules.activeNotifications !== b.modRules.activeNotifications`), true);
  r.run(`var encoded = a.saveCommands.saveCodec().encodePlayer(a.saveState.player).text;
    var aBeforeLoad = JSON.stringify(a.saveState.player); var oldBCache = b.derivedState.tmp;
    var loaded = b.loadPlayer(encoded);`);
  assert.equal(r.run('loaded.ok && b.saveState.player.points.eq(1) && b.gameHelpers.hasUpgrade("p",11)'), true);
  assert.equal(r.run('b.derivedState.tmp !== oldBCache && aBeforeLoad === JSON.stringify(a.saveState.player)'), true);
  r.run('b.advance(2);');
  assert.equal(r.run('b.saveState.player.points.eq(3) && a.saveState.player.points.eq(1)'), true);
  const before = r.run('JSON.stringify(b.saveState.player)');
  assert.equal(r.run('b.loadPlayer("!!!").ok'), false);
  assert.equal(r.run('JSON.stringify(b.saveState.player)'), before);
  assert.equal(r.run('activeBefore === JSON.stringify(gameUI.session.saveState.player)'), true);
  assert.equal(r.run('typeof player === "undefined" && typeof tmp === "undefined" && typeof allSaves === "undefined"'), true);
  assert.equal(r.intervals.size, 0);
  assert.throws(()=>r.run('a.gameRules.advanceGame(b.runtimeServices.captureGameIdentity(),1)'),/Superseded/);
  r.run('a.dispose();');
  assert.throws(() => r.run('a.advance(1)'), /Disposed/);
  assert.doesNotThrow(() => r.run('b.advance(0)'));
});

test('construction samples no clock/storage/DOM and registers no unmanaged resources', t => {
  const r = createRuntime({bridge:false}); t.after(r.dispose);
  const writes = r.io.writes;
  assert.doesNotThrow(() => r.run(`var inert = createGameSession({effects:{
    Date:{now(){throw new Error('clock');}},
    get document(){throw new Error('DOM');}, get localStorage(){throw new Error('storage');},
    setInterval(){throw new Error('timer');}, addEventListener(){throw new Error('listener');}
  }}); inert.advance(0);`));
  assert.equal(r.io.writes, writes);
  assert.equal(r.intervals.size, 0);
  assert.equal(r.listeners.size, 0);
});

test('memory restoration preserves the inherited reload-only fault gate and optional unloaded state', t => {
  const r=createRuntime({bridge:false}); t.after(r.dispose);
  r.run(`var session=createGameSession(), unloaded=createGameSession({initialize:false});
    var text=session.saveCommands.saveCodec().encodePlayer(session.saveState.player).text;
    session.gameRules.gameLoop=()=>{session.saveState.player.points=new Decimal(999);throw new Error('partial failure');};`);
  assert.throws(()=>r.run('session.advance(1)'),/partial failure/);
  const before=r.run('JSON.stringify(session.saveState.player)');
  assert.equal(r.run('session.loadPlayer(text).ok'),false);
  assert.equal(r.run('JSON.stringify(session.saveState.player)'),before);
  assert.equal(r.run('session.gameRules.tickFaulted'),true);
  assert.equal(r.run('unloaded.loadPlayer(text).ok'),false);
  assert.equal(r.run('unloaded.saveState.player===undefined'),true);
});

test('session runtimes own separate injected timers/listeners and reject each others stale callbacks', t => {
  const r = createRuntime({bridge:false}); t.after(r.dispose);
  r.run(`function fixture() {
    const timers = new Map(), queued = [], listeners = new Set(); let id = 0, now = 0;
    const target = {addEventListener(type, callback){listeners.add(callback);}, removeEventListener(type, callback){listeners.delete(callback);}};
    const session = createGameSession({effects:{ Date:{now:()=>now},
      document:{...target,getElementById:()=>null}, window:target,
      setInterval(callback, ms){const token=++id; timers.set(token,{callback,ms});queued.push(callback);return token;},
      clearInterval(token){timers.delete(token);}, alert(){} }});
    session.gameRules.doReset('p'); session.purchase('p',11); session.saveState.player.offTime=null;
    return {session,timers,queued,listeners,setNow(value){now=value;}};
  }
  var first=fixture(),second=fixture();
  first.session.runtimeServices.startGameRuntime(); second.session.runtimeServices.startGameRuntime();
  var secondBefore=JSON.stringify(second.session.saveState.player);
  first.setNow(1000); first.queued[0]();`);
  assert.equal(r.run('first.timers.size===3 && second.timers.size===3 && first.listeners.size===5 && second.listeners.size===5'), true);
  assert.equal(r.run('first.session.saveState.player.points.eq(1) && secondBefore===JSON.stringify(second.session.saveState.player)'), true);
  r.run('first.session.dispose(); var firstBefore=JSON.stringify(first.session.saveState.player); for(const callback of first.queued) callback();');
  assert.equal(r.run('first.timers.size===0 && first.listeners.size===0 && second.timers.size===3 && second.listeners.size===5'), true);
  assert.equal(r.run('firstBefore===JSON.stringify(first.session.saveState.player)'), true);
  r.run('second.setNow(2000); second.queued[0]();');
  assert.equal(r.run('second.session.saveState.player.points.eq(2)'), true);
  r.run('second.session.dispose();');
});

test('session disposal and player replacement stop every directly created runtime handle', t => {
  const r=createRuntime({bridge:false});t.after(r.dispose);
  r.run(`var session=createGameSession(), handles=new Set(), callbacks=[], next=0;
    var scheduler={setInterval(callback){const id=++next;handles.add(id);callbacks.push(callback);return id;},clearInterval(id){handles.delete(id);}};
    function driver(){return session.runtimeServices.createGameRuntime({session:session.runtimeServices.captureGameIdentity(),clock:{now:()=>0},scheduler,
      resume(){},tick(){session.advance(1);},refresh(){},autosave(){},onError(){}});}
    var first=driver(), second=driver();first.start();second.start();
    var encoded=session.saveCommands.saveCodec().encodePlayer(session.saveState.player).text;
    session.loadPlayer(encoded);`);
  assert.equal(r.run('handles.size===0 && first.state==="disposed" && second.state==="disposed"'),true);
  r.run('var third=driver();third.start();session.dispose();var before=JSON.stringify(session.saveState.player);for(const callback of callbacks)callback();');
  assert.equal(r.run('handles.size===0 && third.state==="disposed" && before===JSON.stringify(session.saveState.player)'),true);
  assert.equal(r.run('session.runtimeServices.startGameRuntime()'),false);
  assert.throws(()=>r.run('driver()'),/Disposed/);
  r.run(`session=createGameSession();
    var failing=session.runtimeServices.createGameRuntime({session:session.runtimeServices.captureGameIdentity(),clock:{now:()=>0},scheduler,
      resume(){},tick(){},refresh(){},autosave(){},onError(){},onStop(){throw new Error('cleanup failure');}});
    var remaining=driver();failing.start();remaining.start();`);
  assert.throws(()=>r.run('session.dispose()'),/cleanup failure/);
  assert.equal(r.run('handles.size===0 && failing.state==="disposed" && remaining.state==="disposed" && session.disposed'),true);
});
