// @ts-check
/** One selected collection; only activation replaces its player identity.
 * Callers supply saveDefaults or codec-validated collections. Nothing is serialized
 * from this owner itself: SAV01 continues to own validation and persistence.
 * @param {ObserveState} [observe]
 */
function createSaveState(observe = value => value) {
    /** @type {SaveCollection|undefined} */
    let collection;
    return {
        get allSaves() { return collection; },
        get player() {
            const selected = collection && collection[collection.set];
            return typeof selected === 'string' ? undefined : selected;
        },
        /** @param {SaveCollection} next */
        activate(next) { collection = observe(next); },
    };
}

/** Connect cyclic collaborators once. Forward to the owner rather than copying
 * mutable fields or methods: internal and external callers see the same values.
 * Each private port links one named owner; there is no mutable global context.
 * @template {object} T
 * @param {T} port
 * @param {T} owner
 */
function connectGamePort(port, owner) {
    for (const key of Object.keys(owner)) {
        Object.defineProperty(port, key, {
            enumerable: true,
            get: () => Reflect.get(owner, key),
            set: value => { Reflect.set(owner, key, value); },
        });
    }
}

/** Create an independent engine in this JavaScript realm. No clock is sampled,
 * no storage is touched and no scheduler/listener/UI is started here.
 * @param {{now?: number, effects?: HeadlessEffects, content?: typeof registerGameLayers, modFactory?: typeof createModRules, layoutFactory?: typeof createTreeLayout, initialize?: boolean}} [options]
 */
function createGameSession({ now = 0, effects = {}, content = registerGameLayers,
    modFactory = createModRules, layoutFactory = createTreeLayout, initialize = true } = {}) {
    /** @type {ObserveState} */
    const observe = effects.observe || (value => value);
    const saveState = createSaveState(observe);
    let disposed = false;
    // Circular collaborators are allocated before construction. Their shapes
    // come from the actual owners, not hand-maintained shadow interfaces.
    /** @type {ReturnType<typeof createLayerRegistry>} */ const layerRegistry = Object.create(null);
    /** @type {ReturnType<typeof createDerivedState>} */ const derivedState = Object.create(null);
    /** @type {ReturnType<typeof createGameRules>} */ const gameRules = Object.create(null);
    /** @type {ReturnType<typeof createGameHelpers>} */ const gameHelpers = Object.create(null);
    /** @type {ReturnType<typeof createSaveDefaults>} */ const saveDefaults = Object.create(null);
    /** @type {ReturnType<typeof createModRules>} */ const modRules = Object.create(null);
    /** @type {ReturnType<typeof createSoftcapRules>} */ const softcapRules = Object.create(null);
    /** @type {ReturnType<typeof createHelpData>} */ const helpContent = Object.create(null);
    /** @type {ReturnType<typeof createSaveCommands>} */ const saveCommands = Object.create(null);
    /** @type {GameViewPort} */ const gameView = Object.create(null);
    /** @type {ReturnType<typeof createTreeCanvas>} */ const treeCanvas = Object.create(null);
    /** @type {ReturnType<typeof createRuntimeServices>} */ const runtimeServices = Object.create(null);
    // Headless rule evaluation needs a property setter, not Vue or a fake DOM.
    /** @type {HeadlessEffects} */
    const integration = Object.create(effects);
    integration.observe = observe;
    if (!('Date' in integration)) integration.Date = { now: () => now };
    if (!('setValue' in integration)) integration.setValue = (object, key, value) => { Reflect.set(object, key, value); };
    const treeLayout = layoutFactory({});

    connectGamePort(layerRegistry, createLayerRegistry({ gameHelpers, gameRules, saveState }));
    connectGamePort(modRules, modFactory({ derivedState, effects: integration, gameHelpers, saveState }));
    connectGamePort(softcapRules, createSoftcapRules({ derivedState, gameHelpers, saveState }));
    connectGamePort(helpContent, createHelpData({ saveState }));
    connectGamePort(saveDefaults, createSaveDefaults({ treeLayout, modRules, layerRegistry }));
    connectGamePort(gameHelpers, createGameHelpers({ treeCanvas, derivedState, effects: integration, treeLayout, modRules, layerRegistry, gameRules, softcapRules, saveState }));
    connectGamePort(gameRules, createGameRules({ treeCanvas, saveDefaults, derivedState, effects: integration, gameHelpers, modRules, layerRegistry, runtimeServices, saveCommands, softcapRules, saveState, gameView }));
    connectGamePort(derivedState, createDerivedState({ effects: integration, helpContent, gameHelpers, modRules, layerRegistry, gameRules, saveState }));
    connectGamePort(treeCanvas, createTreeCanvas({ derivedState, effects: integration, layerRegistry, gameRules }));
    const componentDefinitions = createSystemComponents({});
    connectGamePort(gameView, createGameView({ componentDefinitions, derivedState, effects: integration, gameHelpers, modRules, layerRegistry, gameRules, saveState, helpContent, saveCommands, runtimeServices }));
    connectGamePort(saveCommands, createSaveCommands({ saveDefaults, derivedState, effects: integration, gameHelpers, modRules, layerRegistry, gameRules, runtimeServices, saveState, gameView }));
    connectGamePort(runtimeServices, createRuntimeServices({ treeCanvas, derivedState, effects: integration, gameHelpers, modRules, gameRules, saveCommands, saveState, isLive: () => !disposed }));

    content(layerRegistry, { saveDefaults, derivedState, effects: integration, gameHelpers, treeLayout, modRules, layerRegistry, gameRules, softcapRules, saveState });
    // Browser startup must read and validate storage before activating defaults.
    if (initialize) {
        layerRegistry.updateLayers();
        saveState.activate({ set: 'save1', save1: saveDefaults.createSavePlayer(now) });
        settleDerived();
    }

    function settleDerived() {
        derivedState.setupTemp();
        for (let pass = 0; pass < 3; pass++) derivedState.updateTemp();
        gameView.bind();
    }
    function requireLive() { if (disposed) throw new Error('Disposed game session'); }
    const session = {
        saveState, layerRegistry, derivedState, gameRules, gameHelpers, saveDefaults, modRules, softcapRules, helpContent, saveCommands, gameView, treeCanvas, runtimeServices, treeLayout,
        get disposed() { return disposed; },
        /** Advance by finite nonnegative seconds, without clock or I/O.
         * @param {number} elapsedSeconds
         */
        advance(elapsedSeconds) {
            requireLive();
            gameRules.advanceGame(runtimeServices.captureGameIdentity(), elapsedSeconds);
        },
        /** @param {string} layer @param {number} id */
        purchase(layer, id) {
            requireLive();
            gameHelpers.buyUpg(layer, id);
        },
        /** Restore a codec-validated player in memory for simulation callers.
         * Browser imports still use saveCommands.importSave and its atomic storage gate.
         * @param {string} encoded
         * @returns {SaveOutcome<GameState>}
         */
        loadPlayer(encoded) {
            requireLive();
            if (gameRules.tickFaulted) return {ok:false,error:'Reload required after runtime failure'};
            const collection = saveState.allSaves;
            if (!collection) return {ok:false,error:'No active save collection'};
            const result = saveCommands.saveCodec().decodePlayer(encoded);
            if (!result.ok) return result;
            runtimeServices.disposeAll();
            // The result is also a public state reference. Return the canonical
            // observed identity, so mutations by its caller remain visible.
            result.value = observe(result.value);
            saveState.activate({ ...collection, [collection.set]: result.value });
            settleDerived();
            return result;
        },
        dispose() {
            if (disposed) return;
            disposed = true;
            runtimeServices.disposeAll();
        },
    };
    return session;
}

/** @param {ReturnType<typeof createGameSession>} session @param {number} elapsedSeconds */
function advanceGame(session, elapsedSeconds) { session.advance(elapsedSeconds); }
