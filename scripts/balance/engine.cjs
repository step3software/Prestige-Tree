const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { scripts, root } = require('../../tests/support/game-runtime.cjs');
const Decimal = require('../../js/technical/break_eternity.js');

let compiled;
function engineFactory() {
  if (compiled) return compiled;
  // Same ordered authored graph as the page/harness. Decimal uses its own
  // shipped CommonJS export; only the browser composition entry is omitted.
  const files = scripts.filter(file=>!['js/technical/break_eternity.js','js/browser-entry.js'].includes(file));
  const source = files.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
  compiled = new Function('Decimal', source+'\nreturn createGameSession;')(Decimal);
  return compiled;
}

function sourceIdentity() {
  return Object.fromEntries(scripts.map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
}

/** Load the shipped script graph with inert UI ports. No load(),
 * storage, timer or real Vue render is started. Rules remain the actual engine.
 */
function createBalanceEngine(encodedPlayer) {
  const effects = {count:0};
  const forbidden = () => {effects.count++; throw new Error('Balance simulation attempted browser or persistence I/O');};
  const Vue = {createApp:()=>({config:{},component(){},mount:()=>({$forceUpdate(){}})})};
  const session = engineFactory()({now:0,effects:{Vue,confirm:()=>true,alert:forbidden,
    setInterval:forbidden,setTimeout:forbidden,localStorage:new Proxy({}, {get:()=>forbidden})}});
  // The challenge command notifies its view. The harness's inert Vue mount gives
  // it that existing port, without a DOM, browser, listener or driver.
  session.gameView.loadVue();
  if (encodedPlayer!==undefined) {
    const loaded = session.loadPlayer(encodedPlayer);
    if (!loaded.ok) { session.dispose(); throw new Error(loaded.error); }
  }
  if (session.saveState.player.devSpeed!==undefined && session.saveState.player.devSpeed !== 1) {
    session.dispose(); throw new Error('Balance inputs must use devSpeed 1');
  }
  return {
    session,
    get player() { return session.saveState.player; },
    get tmp() { return session.derivedState.tmp; },
    refresh() { session.derivedState.updateTemp(); },
    advance(seconds) { session.advance(seconds); },
    exportPlayer() {
      const result = session.saveCommands.saveCodec().encodePlayer(session.saveState.player);
      if (!result.ok) throw new Error(result.error);
      return result.text;
    },
    assertIsolated() {
      if (effects.count) throw new Error('Balance simulation attempted browser runtime or persistence effects');
    },
    dispose() { session.dispose(); },
  };
}

module.exports = { createBalanceEngine, sourceIdentity };
