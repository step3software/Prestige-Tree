/** Integer selection stays controlled by the caller, including rejected commands. */
function createRangeControl() {
    return {
        props: {
            id: {type: String, required: true}, label: {type: String, required: true},
            value: {type: Number, required: true}, min: {type: Number, default: 0},
            max: {type: Number, required: true}, color: {type: String, default: 'var(--points)'},
            disabled: {type: Boolean, default: false},
        },
        emits: ['change'],
        methods: {
            choose(value, event) {
                if (this.disabled || value < this.min || value > this.max) return;
                this.$emit('change', value);
                // A command can reject without changing props; restore native input state too.
                this.$nextTick(() => {
                    if (event.target.type === 'checkbox') event.target.checked = Number(event.target.value) <= this.value;
                    else event.target.value = String(this.value);
                });
            },
            toggle(level, event) {
                const next = level === this.value ? Math.max(this.min, level - 1) : level;
                this.choose(next, event);
            },
        },
        template: `<div :id="id" class="range-control" role="group" :aria-labelledby="id + '-label'" :style="{'--range-color': color}">
            <span :id="id + '-label'" class="range-label">{{label}}</span>
            <div v-if="max <= 5" class="range-steps">
                <label v-for="level in max" :key="level" class="range-step">
                    <input type="checkbox" :value="level" :checked="level <= value" :disabled="disabled || level < min"
                        :aria-label="label + ': set ' + level" @change="toggle(level, $event)">
                    <span>{{level}}</span>
                </label>
            </div>
            <input v-else type="range" :min="min" :max="max" step="1" :value="value" :disabled="disabled"
                :aria-labelledby="id + '-label'" @change="choose(Number($event.target.value), $event)">
        </div>`,
    };
}

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
        overseerStaffing() {
            const food = this.selected.id === 'food';
            const kind = food ? 'food' : 'huts';
            const repeats = food ? Math.max(...Object.values(this.player.civ.actions).map(action => action.repeat)) : this.player.civ.hutRepeat;
            const occupied = food ? this.civ.overseerWorkers : this.civ.foremanWorkers;
            const workers = this.player.civ.overseers[kind];
            return {kind, name: food ? 'Expedition planner' : 'Hut foreman', workers,
                min: Math.max(1, Math.ceil(repeats / 5)),
                max: occupied ? Math.min(5, occupied + this.civ.availableWorkers) : 5};
        },
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
        setRepeat(id, value) { return actionable(() => modRules.civilization.setRepeat(id, value)); },
        setFireTenders(value) {
            const changed = actionable(() => modRules.civilization.setFireTenders(value));
            if (!changed) saveState.player.civ.message = "Fire tending needs available workers. Release a crew or choose fewer tenders.";
            return changed;
        },
        setCookingLevel(value) { return actionable(() => modRules.civilization.setCookingLevel(value)); },
        setHutRepeat(value) { return actionable(() => modRules.civilization.setHutRepeat(value)); },
        setOverseers(kind, value) { return actionable(() => modRules.civilization.setOverseers(kind, value)); },
        setExpeditionMultiplier(id, event) { return actionable(() => modRules.civilization.setExpeditionMultiplier(id, Number(event.target.value))); },
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
        application.component('range-control', createRangeControl());
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
