/** Test-only names retain the inherited assertions while using actual modules.
 * Browser tests use qualified ports, so this cannot hide global template leaks.
 * Historical graphs retain their own global API; loading is never mixed.
 */
function installSessionBridge() {
  if (typeof gameUI === 'undefined') {
    if (typeof createGameSession === 'function') globalThis.captureGameIdentity = (...args) => createGameSession(...args);
    if (typeof advanceGame === 'function') globalThis.advanceActiveGame = (...args) => advanceGame(...args);
    return;
  }
  const session = gameUI.session;
  for (const port of Object.values(session)) {
    if (!port || typeof port !== 'object') continue;
    for (const name of Object.keys(port)) {
      if (['createGameSession', 'advanceGame'].includes(name)) continue;
      Object.defineProperty(globalThis, name, {
        configurable: true,
        get: () => port[name],
        set: value => {
          if (name === 'player') session.saveState.activate({ ...session.saveState.allSaves, [session.saveState.allSaves.set]: value });
          else if (name === 'allSaves') session.saveState.activate(value);
          else port[name] = value;
        },
      });
    }
  }
  globalThis.advanceActiveGame = (...args) => session.gameRules.advanceGame(...args);
  globalThis.registerActiveGameLayers = () => registerGameLayers(session.layerRegistry, {});
}

module.exports = { installSessionBridge };
