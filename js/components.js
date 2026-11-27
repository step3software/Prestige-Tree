/** The Civ view observes the session's canonical player; it owns only UI state. */
function createGameView({derivedState, effects, gameHelpers, gameRules, helpContent, layerRegistry, modRules, saveCommands, saveState, runtimeServices}) {
    let app;
    const binding = effects.observe({player: undefined, allSaves: undefined, tmp: undefined, ruleStatus: gameRules.status});
    const ui = effects.observe({settings: false, about: false});
    function bind() {
        binding.player = saveState.player;
        binding.allSaves = saveState.allSaves;
        binding.tmp = derivedState.tmp;
    }
    function actionable(command) {
        if (gameRules.tickFaulted || !saveState.player) return false;
        return command();
    }
    const computed = {
        version() { return modRules.VERSION; },
        player() { return binding.player; }, allSaves() { return binding.allSaves; },
        civ() { return binding.player && modRules.civilization.summary(); },
        selected() { return modRules.civilization.node(binding.player.tab); },
        rows() { return [0,1,2,3].map(tier => this.civ.nodes.filter(node => node.tier === tier)); },
        frozen() { return binding.ruleStatus.gameEnded || gameRules.tickFaulted; },
    };
    const methods = {
        number(value, digits = 1) {
            const amount = value instanceof Decimal ? value.toNumber() : Number(value);
            return Number.isFinite(amount) ? amount.toLocaleString('en-US', {maximumFractionDigits: digits}) : gameHelpers.format(value);
        },
        signed(value) { return (value >= 0 ? '+' : '') + this.number(value); },
        select(id) { if (layerRegistry.layers[id] && modRules.civilization.summary().nodes.some(node => node.id === id)) binding.player.tab = id; },
        build(id) { return actionable(() => modRules.civilization.startProject(id)); },
        dispatch(id) { return actionable(() => modRules.civilization.dispatch(id)); },
        recall(id) { return actionable(() => modRules.civilization.recall(id)); },
        setRepeat(id, event) { return actionable(() => modRules.civilization.setRepeat(id, Number(event.target.value))); },
        setHutRepeat(event) { return actionable(() => modRules.civilization.setHutRepeat(Number(event.target.value))); },
        buyUpgrade(id) { return actionable(() => modRules.civilization.buyUpgrade(id)); },
        irrigate() { return actionable(() => modRules.civilization.irrigate()); },
        toggleIrrigation() { return actionable(() => { if (modRules.civilization.summary().autoIrrigateAvailable) binding.player.civ.autoIrrigate = !binding.player.civ.autoIrrigate; }); },
        cancelProject() { return actionable(() => modRules.civilization.cancelProject()); },
        invest(id) { return actionable(() => modRules.civilization.invest(id)); },
        prestige(id) {
            if (gameRules.tickFaulted || !modRules.civilization.prestigeGain(id)) return false;
            const plan = modRules.civilization.prestigePreview(id);
            if (!effects.confirm('Gain ' + plan.gain + ' ' + modRules.civilization.node(id).name + '? Restart ' + plan.resetText + '. Keep ' + plan.keepText + '.')) return false;
            return actionable(() => modRules.civilization.prestige(id));
        },
        setPriority(event) { return actionable(() => { binding.player.civ.priority = event.target.value; }); },
        toggleAutomation() { return actionable(() => { if (modRules.civilization.summary().autoAvailable) binding.player.civ.autoBuild = !binding.player.civ.autoBuild; }); },
        save() { return saveCommands.save(); },
        exportSave() { return saveCommands.exportSave(); },
        importSave() { return saveCommands.importSave(); },
        reset() { return gameRules.hardReset(); },
        openSaves() { saveCommands.showAllSaves(); },
        newSave() { return saveCommands.newSave(); },
        loadSave(name) { return saveCommands.loadSave(name); },
        renameSave(name) { return saveCommands.renameSave(name); },
        deleteSave(name) { return saveCommands.deleteSave(name); },
        closeSaves() { binding.player.saveMenuOpen = false; },
    };
    function loadVue() {
        bind();
        if (app) return app;
        const application = effects.Vue.createApp({data: () => ({ui}), computed, methods});
        application.config.errorHandler = error => {
            if (gameRules.tickFaulted) return;
            try { runtimeServices.disposeAll(); }
            finally { runtimeServices.reportRuntimeFault(error); }
        };
        application.component('resource-icon', {props: ['path'], template:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="path"/></svg>'});
        application.component('save-files', {
            data: () => ({binding}), computed: {player() { return this.binding.player; }, allSaves() { return this.binding.allSaves; }},
            methods,
            watch: {'player.saveMenuOpen'(open) {
                this.$nextTick(() => { if (open && !this.$refs.dialog.open) this.$refs.dialog.showModal(); else if (!open && this.$refs.dialog.open) this.$refs.dialog.close(); });
            }},
            template: `<dialog ref="dialog" aria-labelledby="save-files-title" @close="closeSaves" @cancel="closeSaves">
                <div class="dialog-heading"><h2 id="save-files-title">Your settlements</h2><button @click="closeSaves">Close</button></div>
                <p>Each settlement has its own Population and resource tree.</p>
                <div class="save-row" v-for="name in Object.keys(allSaves).filter(name => name !== 'set')" :key="name">
                    <strong>{{name}} <small v-if="allSaves.set === name">Current</small></strong>
                    <div><button @click="loadSave(name)">Load</button><button @click="renameSave(name)">Rename</button><button @click="deleteSave(name)">Delete</button></div>
                </div><button class="primary" @click="newSave">New settlement</button>
            </dialog>`
        });
        app = application.mount('#app');
        return app;
    }
    return {bind, loadVue, get app() { return app; }};
}
