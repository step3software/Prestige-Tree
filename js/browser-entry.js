/** Browser-only composition. The engine factories never read this adapter.
 * Native HTML handlers use commands; debugging/inspection uses the selected
 * session's named owners. There are no player/tmp globals or ambient setters.
 */
function createBrowserGame(options = {}) {
    const effects = {
        get Date() { return Date; },
        get document() { return document; },
        get window() { return window; },
        get localStorage() { return localStorage; },
        get Vue() { return Vue; },
        // Decimal methods return class instances. Keep them outside proxy identity
        // while making each canonical plain state owner reactive, before use.
        observe: value => { Vue.markRaw(Decimal.prototype); return Vue.reactive(value); },
        setValue: (object, key, value) => { Reflect.set(object, key, value); },
        setInterval: (callback, milliseconds) => setInterval(callback, milliseconds),
        clearInterval: id => clearInterval(id),
        prompt: message => prompt(message),
        confirm: message => confirm(message),
        alert: message => alert(message),
    };
    // Preserve lazy browser reads: construction must not evaluate storage/DOM.
    let active;
    function getSession(configuration = {}) {
        if (!active) active = createGameSession({ ...options, ...configuration, effects, initialize: false });
        return active;
    }
    return {
        get session() { return getSession(); },
        commands: {
            load: configuration => getSession(configuration).saveCommands.load(),
            save: () => getSession().saveCommands.save(),
            exportSave: () => getSession().saveCommands.exportSave(),
            importSave: () => getSession().saveCommands.importSave(),
            newSave: () => getSession().saveCommands.newSave(),
            showAllSaves: () => getSession().saveCommands.showAllSaves(),
            hardReset: () => getSession().gameRules.hardReset(),
            adjustGlow: type => getSession().gameHelpers.adjustGlow(type),
            adjustMSDisp: () => getSession().gameHelpers.adjustMSDisp(),
            goBack: () => getSession().gameHelpers.goBack(),
            keepGoing: () => getSession().gameHelpers.keepGoing(),
            showTab: name => getSession().gameHelpers.showTab(name),
            switchTheme: () => getSession().gameHelpers.switchTheme(),
            toggleOpt: name => getSession().gameHelpers.toggleOpt(name),
        },
    };
}

const gameUI = createBrowserGame();
