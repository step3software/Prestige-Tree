/** Session-owned civilization rules. All rates use game minutes; advancement
 * consumes seconds. Production, upkeep and construction share one labor budget.
 * No storage, DOM, clock or timer access belongs in this owner. */
function createCivilizationRules({ saveState }) {
    const names = {food: "Food", water: "Water", shelter: "Shelter", craft: "Craft",
        organization: "Organization", money: "Money", freeTime: "Time", education: "Education", culture: "Culture"};
    const descriptions = {
        food: "Send gathering, hunting and fishing expeditions. Develop each route, then cultivate fields.",
        water: "Carry water into your reservoir, then replace hauling with reliable worker-free flow.",
        shelter: "Build more homes or improve domestic life to free workers. Housing survives early prestige.",
        craft: "Turn a well-supplied community into better tools and more productive work.",
        organization: "Coordinate shared labor. Keep useful knowledge and automate rebuilding.",
        money: "Exchange the output of specialized work and invest in the settlement.",
        freeTime: "Productivity creates free hours after essential work is done.",
        education: "Invest money and free time in knowledge that improves every worker.",
        culture: "Make time for shared expression. Culture strengthens cooperation.",
    };
    const icons = {food: "M12 21V5m0 8C4 13 4 6 4 6c8 0 8 7 8 7Zm0-4c0-7 8-7 8-7s0 7-8 7Z",
        water: "M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z",
        shelter: "m2 11 10-8 10 8M5 9v12h14V9M10 21v-7h4v7",
        craft: "m4 20 9-9m-4-5 5-4 8 8-4 5-9-9ZM2 18l4 4",
        organization: "M12 4v6M4 20v-7h16v7M12 13v7M9 4h6M1 20h6m2 0h6m2 0h6",
        money: "M19 7c-3-4-14-3-14 2s14 1 14 6-11 6-14 2M12 2v20",
        freeTime: "M12 7v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
        education: "M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2V4Zm9 2v15",
        culture: "M12 3c-6 0-10 4-10 10s5 9 8 9c3 0 1-5 4-5h3c6 0 6-14-5-14ZM7 8h.01M13 6h.01M18 10h.01M6 14h.01"};
    const player = () => saveState.player;
    const amount = id => player()[id].points.toNumber();
    const housing = () => amount("shelter");
    const tier = id => ["food", "water", "shelter"].includes(id) ? 0 :
        ["craft", "organization"].includes(id) ? 1 : ["money", "freeTime"].includes(id) ? 2 : 3;

    const actionNames = {gather: "Gather", hunt: "Hunt", fish: "Fish", farm: "Farm", water: "Collect water"};
    const actionBase = {
        gather: {resource: "food", workers: 1, duration: 10, reward: 6},
        hunt: {resource: "food", workers: 3, duration: 25, reward: 24},
        fish: {resource: "food", workers: 2, duration: 18, reward: 14},
        farm: {resource: "food", workers: 3, duration: 60, reward: 75},
        water: {resource: "water", workers: 2, duration: 8, reward: 14},
    };
    const improvementDefinitions = {
        buckets: {resource: "water", name: "Carrying yokes", description: "Collection needs 1 worker instead of 2.", costs: {food: 12, water: 10}},
        waterOrders: {resource: "water", name: "Water keeper", description: "Unlock repeat collection orders. The hauling worker is still needed.", costs: {food: 18, craft: 1}},
        gravity: {resource: "water", name: "Gravity-fed spring", description: "Continuous reservoir refill, without orders or workers. Wells improve the flow.", costs: {food: 30, craft: 2, organization: 1}},
        sluice: {resource: "water", name: "Automatic sluice", description: "Unlock automatic irrigation from surplus water.", costs: {money: 8, education: 1}},
        hunting: {resource: "food", name: "Coordinated hunting", description: "Hunting needs 2 workers instead of 3.", costs: {food: 20, craft: 1}},
        fishing: {resource: "food", name: "Fishing nets", description: "Fishing needs 1 worker instead of 2.", costs: {food: 20, craft: 1}},
        overseer: {resource: "food", name: "Expedition overseer", description: "Unlock separate repeat orders. Each expedition still reserves its crew.", costs: {food: 25, craft: 1, organization: 1}},
        farming: {resource: "food", name: "Cultivated fields", description: "Unlock long, high-yield farming cycles. Repeat with the overseer; 3 workers remain occupied per cycle.", costs: {food: 45, water: 25, craft: 3, organization: 2}},
        autonomousFood: {resource: "food", name: "Autonomous food production", description: "All Food crews become worker-free. Repeat orders keep production running.", costs: {money: 120, freeTime: 10, craft: 12, education: 8}},
        hearth: {resource: "shelter", name: "Shared hearths", description: "Reduce domestic work by 25% and add 25 Food storage.", costs: {food: 20, water: 15}},
        joinery: {resource: "shelter", name: "Timber frames", description: "Every purchased home provides 6 housing instead of 4, including existing homes.", costs: {food: 25, craft: 2}},
        builderTools: {resource: "shelter", name: "Construction tools", description: "Double construction speed. Projects still reserve a builder.", costs: {craft: 2, organization: 1}},
    };
    const owns = id => player().civ.improvements[id];
    const organizationRewards = [
        {id: "water-records", requirement: 1, name: "Water records", retains: "water", reward: "Keep wells and reservoirs through prestige."},
        {id: "building-orders", requirement: 2, name: "Building orders", retains: "", reward: "Unlock automatic construction permanently."},
        {id: "provisioning-records", requirement: 3, name: "Provisioning records", retains: "food", reward: "Keep all Food route equipment, provisioning and baskets through prestige."},
        {id: "settlement-records", requirement: 5, name: "Settlement records", retains: "shelter", reward: "Keep purchased homes and domestic improvements through prestige."},
    ];
    function organizationMilestones(total = amountTotal("organization")) {
        return organizationRewards.map(reward => ({...reward, earned: total >= reward.requirement}));
    }
    function amountTotal(id) { return player()[id].total.toNumber(); }
    function retention(resource, total = amountTotal("organization")) {
        return organizationMilestones(total).some(reward => reward.retains === resource && reward.earned);
    }
    function projectResource(id) {
        if (id.endsWith("-tools")) return "food";
        return id.split("-")[0];
    }
    function emptyAction() {
        return {remaining: 0, duration: 0, workers: 0, reward: 0, completed: 0, repeat: false};
    }
    function defaults() {
        return {growth: 0, tickRemainder: 0, project: "", projectWork: 0, projectWorkers: 1,
            priority: "balanced", autoBuild: false, irrigation: 0, autoIrrigate: false,
            improvements: Object.fromEntries(Object.keys(improvementDefinitions).map(id => [id, false])),
            actions: Object.fromEntries(Object.keys(actionBase).map(id => [id, emptyAction()])),
            message: "Send a Food expedition and collect Water. Busy workers return when their action finishes."};
    }
    const toolEffect = () => 1 + amount("craft") * 0.18 + amount("education") * 0.12;
    const storageCapacity = () => ({food: 50 + player().food.storage * 40 + (owns("hearth") ? 25 : 0), water: 50 + player().water.storage * 40});
    function actionDefinition(id) {
        const base = actionBase[id];
        if (!base) return null;
        const p = player(), state = p.civ.actions[id];
        const level = id === "water" ? p.water.sites : p.food.routes[id];
        let workers = base.workers;
        if (id === "water" && owns("buckets")) workers = 1;
        if (id === "hunt" && owns("hunting")) workers = 2;
        if (id === "fish" && owns("fishing")) workers = 1;
        if (base.resource === "food" && owns("autonomousFood")) workers = 0;
        const unlocked = id !== "farm" || owns("farming");
        const duration = Math.max(4, base.duration / (1 + level * 0.08));
        const irrigationBonus = base.resource === "food" && p.civ.irrigation > 0 ? 1.35 : 1;
        const reward = base.reward * (1 + level * 0.35) * toolEffect() * irrigationBonus *
            (base.resource === "food" ? 1 + p.food.sites * 0.15 : 1);
        return {id, name: actionNames[id], ...base, workers, duration, reward, level, unlocked,
            automatic: id === "water" && owns("gravity"),
            repeatAvailable: id === "water" ? owns("waterOrders") : owns("overseer"),
            active: state.remaining > 0, remaining: state.remaining, crew: state.workers,
            progress: state.duration ? 1 - state.remaining / state.duration : 0,
            runningReward: state.reward, repeat: state.repeat, completed: state.completed};
    }
    function occupiedWorkers() {
        const p = player();
        const domestic = Math.max(0, p.points.toNumber() * 0.12 - p.shelter.comfort * 0.5) * (owns("hearth") ? 0.75 : 1);
        const workers = {food: 0, water: 0};
        for (const [id, action] of Object.entries(p.civ.actions)) {
            if (action.remaining > 0) workers[actionBase[id].resource] += action.workers;
        }
        const builders = p.civ.project ? p.civ.projectWorkers : 0;
        const spare = Math.max(0, p.points.toNumber() - domestic - workers.food - workers.water - builders);
        return {domestic, workers, builders, spare, availableWorkers: Math.floor(spare + 1e-9)};
    }
    function canDispatch(id) {
        const action = actionDefinition(id);
        return !!action && action.unlocked && !action.active && !action.automatic && occupiedWorkers().availableWorkers >= action.workers;
    }
    function dispatch(id) {
        if (!canDispatch(id)) return false;
        const definition = actionDefinition(id), state = player().civ.actions[id];
        state.remaining = definition.duration;
        state.duration = definition.duration;
        state.workers = definition.workers;
        state.reward = definition.reward;
        player().civ.message = definition.name + " started. " + definition.workers + " workers reserved until completion.";
        return true;
    }
    function recall(id) {
        if (!actionBase[id] || !player().civ.actions[id].remaining) return false;
        const state = player().civ.actions[id];
        Object.assign(state, {remaining: 0, duration: 0, workers: 0, reward: 0, repeat: false});
        player().civ.message = actionNames[id] + " recalled. Workers are available; unfinished yield is lost.";
        return true;
    }
    function toggleRepeat(id) {
        const action = actionDefinition(id);
        if (!action || !action.repeatAvailable || !action.unlocked || action.automatic) return false;
        player().civ.actions[id].repeat = !player().civ.actions[id].repeat;
        return true;
    }
    /** A single derived labor ledger accounts for every reserved crew. Idle
     * workers can trade/rest, and become available immediately when dispatched. */
    function supply() {
        const p = player(), population = p.points.toNumber(), labor = occupiedWorkers();
        const upkeep = 1 / (1 + amount("organization") * 0.06 + amount("culture") * 0.04);
        const demand = population * upkeep, storage = storageCapacity();
        const production = {food: 0, water: owns("gravity") ? (24 + p.water.sites * 10) * toolEffect() : 0};
        for (const [id, state] of Object.entries(p.civ.actions)) {
            if (state.remaining > 0) production[actionBase[id].resource] += state.reward / state.duration * 60;
        }
        const reserve = Math.max(3, (population + 1) * upkeep * 0.25);
        let bottleneck = "Growing";
        if (population >= housing()) bottleneck = "Shelter";
        else if (p.food.points.lt(reserve)) bottleneck = "Food reserves";
        else if (p.water.points.lt(reserve)) bottleneck = "Water reserves";
        const moneyWorkers = p.money.unlocked ? labor.spare * 0.5 : 0;
        const timeWorkers = p.freeTime.unlocked ? labor.spare - moneyWorkers : 0;
        return {population, upkeep, demand, ...labor, production, storage, reserve, bottleneck,
            growing: bottleneck === "Growing", support: housing(), capacity: production,
            efficiency: {food: 3 * toolEffect(), water: 3.2 * toolEffect()},
            moneyWorkers, timeWorkers, idle: labor.spare - moneyWorkers - timeWorkers,
            laborUsed: labor.domestic + labor.workers.food + labor.workers.water + labor.builders + moneyWorkers + timeWorkers};
    }
    function projects(id) {
        const p = player(), work = (base, level) => base * Math.pow(1.35, level);
        if (id === "food") return [
            ...["gather", "hunt", "fish", "farm"].filter(route => route !== "farm" || owns("farming")).map(route => ({
                id: route + "-tools", name: {gather: "Gathering baskets", hunt: "Hunting equipment", fish: "Fishing equipment", farm: "Farming tools"}[route],
                description: "Route level " + p.food.routes[route] + ": +35% base yield and faster trips per level.", work: work(14, p.food.routes[route])})),
            {id: "food-site", name: "Improve provisioning", description: "+15% base yield for every Food route.", work: work(18, p.food.sites)},
            {id: "food-storage", name: "Weave food baskets", description: "+40 Food storage.", work: work(12, p.food.storage)},
        ];
        if (id === "water") return [
            {id: "water-site", name: "Improve the well", description: "Improve collection yield and speed; +10 base Water/min once gravity-fed.", work: work(16, p.water.sites)},
            {id: "water-storage", name: "Expand the reservoir", description: "+40 Water storage. Store more between collection trips.", work: work(12, p.water.storage)},
        ];
        if (id === "shelter") return [
            {id: "shelter-home", name: "Build a new hut", description: "+" + (owns("joinery") ? 6 : 4) + " housing. Owned: " + p.shelter.homes + ".", work: work(16, p.shelter.homes)},
            {id: "shelter-comfort", name: "Improve existing homes", description: "Free up to 0.5 workers from domestic work. Improvements: " + p.shelter.comfort + ".", work: work(20, p.shelter.comfort)},
        ];
        return [];
    }
    function projectDefinition(id) {
        return ["food", "water", "shelter"].flatMap(projects).find(item => item.id === id);
    }
    function startProject(id) {
        const p = player();
        if (p.civ.project || !projectDefinition(id) || occupiedWorkers().availableWorkers < 1) return false;
        p.civ.project = id;
        p.civ.projectWork = 0;
        p.civ.projectWorkers = 1;
        p.civ.message = projectDefinition(id).name + " started. One builder is reserved until completion.";
        return true;
    }
    function cancelProject() {
        player().civ.project = "";
        player().civ.projectWork = 0;
        player().civ.message = "Construction canceled. Builder released; no supplies were spent.";
    }
    function completeProject(id) {
        const name = projectDefinition(id).name, [resource, kind] = id.split("-");
        if (kind === "tools") player().food.routes[resource]++;
        else if (kind === "home") {
            player().shelter.homes++;
            player().shelter.points = new Decimal(8 + player().shelter.homes * (owns("joinery") ? 6 : 4));
        } else if (kind === "comfort") player().shelter.comfort++;
        else if (kind === "site") player()[resource].sites++;
        else player()[resource].storage++;
        player().civ.project = "";
        player().civ.projectWork = 0;
        player().civ.message = name + " completed. Builder available.";
    }
    function upgrades(resource) {
        return Object.entries(improvementDefinitions).filter(([, item]) => item.resource === resource).map(([id, item]) => ({
            id, ...item, owned: owns(id), canBuy: !owns(id) && Object.entries(item.costs).every(([key, cost]) => player()[key].points.gte(cost)),
            costText: Object.entries(item.costs).map(([key, cost]) => cost + " " + names[key]).join(" · ")
        }));
    }
    function buyUpgrade(id) {
        const definition = improvementDefinitions[id];
        if (!definition || owns(id)) return false;
        if (!Object.entries(definition.costs).every(([resource, cost]) => player()[resource].points.gte(cost))) return false;
        for (const [resource, cost] of Object.entries(definition.costs)) player()[resource].points = player()[resource].points.sub(cost);
        player().civ.improvements[id] = true;
        if (id === "joinery") player().shelter.points = new Decimal(8 + player().shelter.homes * 6);
        player().civ.message = definition.name + " unlocked. Upgrades apply to the next dispatched crew.";
        return true;
    }
    function irrigate() {
        const p = player(), reserve = supply().reserve;
        if (p.civ.irrigation > 0 || p.water.points.lt(20 + reserve)) return false;
        p.water.points = p.water.points.sub(20);
        p.civ.irrigation = 45;
        p.civ.message = "Irrigation: new Food expeditions and farming cycles gain 35% yield for 45 seconds.";
        return true;
    }
    function chooseAutomaticProject() {
        const p = player();
        if (p.points.toNumber() + 2 >= housing() && p.shelter.homes < 20) return startProject("shelter-home");
        if (p.food.sites < 2) return startProject("food-site");
        if (p.water.sites < 2) return startProject("water-site");
        if (p.shelter.comfort < 4) return startProject("shelter-comfort");
        if (p.food.storage < 3) return startProject("food-storage");
        if (p.water.storage < 3) return startProject("water-storage");
        return false;
    }
    function unlock() {
        const p = player();
        if (p.craft.points.gte(1) && p.organization.points.gte(1)) {
            p.money.unlocked = true; p.freeTime.unlocked = true;
        }
        if (p.money.total.gte(5) && p.freeTime.total.gte(3)) {
            p.education.unlocked = true; p.culture.unlocked = true;
        }
    }
    function addResource(id, gain) {
        const data = player()[id];
        data.points = data.points.add(gain);
        data.total = data.total.add(gain);
        data.best = data.best.max(data.points);
    }
    function advanceActions(seconds) {
        const p = player(), storage = storageCapacity();
        for (const [id, state] of Object.entries(p.civ.actions)) {
            if (state.remaining <= 0) continue;
            state.remaining = Math.max(0, state.remaining - seconds);
            if (state.remaining > 0) continue;
            const resource = actionBase[id].resource;
            addResource(resource, Math.min(state.reward, Math.max(0, storage[resource] - amount(resource))));
            state.completed++;
            Object.assign(state, {duration: 0, workers: 0, reward: 0});
            p.civ.message = actionNames[id] + " completed. Crew returned; yield stored up to capacity.";
        }
    }
    function automaticOrders() {
        const p = player();
        if (p.civ.autoIrrigate && owns("sluice")) irrigate();
        // Water gets first refusal; continuous flow needs no crew. Construction
        // then reserves its builder before Food can take the remaining workers.
        if (p.civ.actions.water.repeat && owns("waterOrders") && amount("water") < storageCapacity().water - 1) dispatch("water");
        if (p.civ.autoBuild && amountTotal("organization") >= 2 && !p.civ.project) chooseAutomaticProject();
        if (!owns("overseer")) return;
        const order = p.civ.priority === "food" ? ["farm", "hunt", "fish", "gather"] : ["gather", "fish", "hunt", "farm"];
        for (const id of order) if (p.civ.actions[id].repeat && amount("food") < storageCapacity().food - 1) dispatch(id);
    }
    function step(seconds) {
        const p = player();
        advanceActions(seconds);
        const s = supply(), minutes = seconds / 60;
        for (const id of ["food", "water"]) {
            const passive = id === "water" && owns("gravity") ? (24 + p.water.sites * 10) * toolEffect() : 0;
            if (passive) addResource(id, Math.min(passive * minutes, Math.max(0, s.storage[id] - amount(id))));
            p[id].points = p[id].points.sub(s.demand * minutes).max(0);
        }
        if (p.civ.project) {
            p.civ.projectWork += seconds * p.civ.projectWorkers * (1 + amount("organization") * 0.15) * (owns("builderTools") ? 2 : 1);
            if (p.civ.projectWork >= projectDefinition(p.civ.project).work) completeProject(p.civ.project);
        }
        if (supply().growing) {
            p.civ.growth += seconds / 12;
            if (p.civ.growth >= 1) {
                p.points = p.points.add(1);
                p.civ.growth -= 1;
                p.civ.message = "Your population has grown to " + p.points.toString() + ".";
            }
        }
        if (p.money.unlocked) addResource("money", s.moneyWorkers * 2 * (1 + amount("craft") * 0.15) * minutes);
        if (p.freeTime.unlocked) addResource("freeTime", s.timeWorkers * minutes);
        p.civ.irrigation = Math.max(0, p.civ.irrigation - seconds);
        unlock();
        automaticOrders();
    }
    /** Persist the subsecond remainder so offline/online chunk sizes use the
     * same bounded one-second steps and never skip consumption or growth caps. */
    function advance(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) throw new Error("Expected finite nonnegative civilization seconds");
        const p = player();
        let remaining = p.civ.tickRemainder + seconds;
        while (remaining + 1e-9 >= 1) { step(1); remaining -= 1; }
        p.civ.tickRemainder = Math.max(0, remaining);
    }
    function prestigeGain(id) {
        if (!["craft", "organization"].includes(id)) return 0;
        const p = player();
        if (p.points.lt(8) || (id === "organization" && housing() < 12)) return 0;
        const requirement = id === "craft" ? 25 : 35;
        return Math.max(0, Math.floor(Math.sqrt(Math.min(amount("food"), amount("water")) / requirement)));
    }
    function prestigeRequirements(id) {
        return id === "craft" ? "8 Population and 25 each of Food and Water" : "8 Population, 12 housing and 35 each of Food and Water";
    }
    /** The same prospective plan drives the UI, confirmation and reset. An
     * Organization reward earned by this prestige protects its buyables now. */
    function prestigePreview(id) {
        const p = player(), gain = prestigeGain(id);
        const organizationTotal = amountTotal("organization") + (id === "organization" ? gain : 0);
        const kept = Object.fromEntries(["food", "water", "shelter"].map(resource => [resource, retention(resource, organizationTotal)]));
        const resetBuyables = Object.keys(kept).filter(resource => !kept[resource]);
        const keptBuyables = Object.keys(kept).filter(resource => kept[resource]);
        const resetConstruction = !!p.civ.project && !kept[projectResource(p.civ.project)];
        const recalledActions = Object.keys(actionBase).filter(action => p.civ.actions[action].remaining > 0 && !kept[actionBase[action].resource]);
        // Losing domestic improvements can reclaim labor from otherwise retained
        // trips. Return only enough additional crews to keep the ledger valid.
        const comfort = kept.shelter ? p.shelter.comfort : 0;
        const domestic = Math.max(0, p.points.toNumber() * 0.12 - comfort * 0.5) * (owns("hearth") ? 0.75 : 1);
        let committed = domestic + (p.civ.project && !resetConstruction ? 1 : 0);
        const remaining = Object.keys(actionBase).filter(action => p.civ.actions[action].remaining > 0 && !recalledActions.includes(action));
        for (const action of remaining) committed += p.civ.actions[action].workers;
        for (const action of remaining.sort((a, b) => p.civ.actions[b].workers - p.civ.actions[a].workers)) {
            if (committed <= p.points.toNumber() + 1e-9) break;
            recalledActions.push(action);
            committed -= p.civ.actions[action].workers;
        }
        const reset = ["Food and Water stores", "growth and irrigation progress"];
        if (resetBuyables.length) reset.push(resetBuyables.map(resource => names[resource]).join(", ") + " buyables");
        if (!kept.shelter) reset.push("housing capacity returns to 8; Population stays");
        if (resetConstruction) reset.push("current construction progress");
        if (recalledActions.length) reset.push(recalledActions.map(action => actionNames[action]).join(", ") + " trips return without yield");
        const keep = ["Population", "permanent upgrades", "repeat orders", "every other resource"];
        if (keptBuyables.length) keep.push(keptBuyables.map(resource => names[resource]).join(", ") + " buyables");
        if (p.civ.project && !resetConstruction) keep.push("current construction");
        return {gain, organizationTotal, kept, resetBuyables, keptBuyables, resetConstruction, recalledActions,
            resetText: reset.join("; "), keepText: keep.join("; ")};
    }
    function prestige(id) {
        const plan = prestigePreview(id), gain = plan.gain;
        if (!gain) return false;
        addResource(id, gain);
        player()[id].unlocked = true;
        const p = player();
        if (!plan.kept.food) {
            p.food.sites = 0;
            p.food.storage = 0;
            for (const route of Object.keys(p.food.routes)) p.food.routes[route] = 0;
        }
        if (!plan.kept.water) { p.water.sites = 0; p.water.storage = 0; }
        if (!plan.kept.shelter) {
            p.shelter.homes = 0;
            p.shelter.comfort = 0;
            p.shelter.points = new Decimal(8);
        }
        if (plan.resetConstruction) { p.civ.project = ""; p.civ.projectWork = 0; }
        for (const action of plan.recalledActions) Object.assign(p.civ.actions[action], {remaining: 0, duration: 0, workers: 0, reward: 0});
        player().food.points = new Decimal(0);
        player().water.points = new Decimal(0);
        player().civ.growth = 0;
        p.civ.irrigation = 0;
        player().civ.message = names[id] + " increased by " + gain + ". " + (plan.resetBuyables.length ? "Unprotected buyables reset. " : "All buyables retained. ") + "Organization milestones use lifetime earnings.";
        unlock();
        return true;
    }
    function investments(id) {
        if (id === "education") return {money: 5 * Math.pow(1.6, amount(id)), freeTime: 2 * Math.pow(1.4, amount(id))};
        if (id === "culture") return {freeTime: 3 * Math.pow(1.4, amount(id)), craft: 1};
        return {};
    }
    function canInvest(id) {
        if (!["education", "culture"].includes(id) || !player()[id].unlocked) return false;
        return Object.entries(investments(id)).every(([resource, cost]) => player()[resource].points.gte(cost));
    }
    function invest(id) {
        if (!canInvest(id)) return false;
        for (const [resource, cost] of Object.entries(investments(id))) player()[resource].points = player()[resource].points.sub(cost);
        addResource(id, 1);
        player().civ.message = id === "education" ? "Knowledge improves every worker's tools and techniques." : "Shared culture improves cooperation and reduces upkeep.";
        return true;
    }
    function node(id) {
        const p = player(), isPrestige = tier(id) === 1;
        const unlocked = tier(id) === 0 || isPrestige || p[id].unlocked;
        const colors = {food:"#4BDC13",water:"#31aeb0",shelter:"#c79b58",craft:"#f5b942",organization:"#b16fd6",money:"#f2cf54",freeTime:"#64d4f0",education:"#698df0",culture:"#e776b4"};
        const symbols = {food:"F",water:"W",shelter:"S",craft:"C",organization:"O",money:"$",freeTime:"T",education:"E",culture:"Cu"};
        return {id, name: names[id], color:colors[id], symbol:symbols[id], tier: tier(id), icon: icons[id], description: descriptions[id], unlocked,
            value: p[id].points, unit: id === "shelter" ? "housing" : id === "freeTime" ? "free hours" :
                id === "organization" ? "coordination" : id === "education" ? "knowledge" : id === "culture" ? "influence" : "",
            requirement: isPrestige ? prestigeRequirements(id) : tier(id) === 2 ? "Earn Craft and Organization" : "Earn 5 Money and 3 free hours in total",
            canPrestige: prestigeGain(id) > 0, prestigeGain: prestigeGain(id), prestigePreview: isPrestige ? prestigePreview(id) : null,
            organizationMilestones: id === "organization" ? organizationMilestones() : [], organizationEarned: amountTotal("organization"),
            buyableRetention: organizationRewards.some(reward => reward.retains === id) ?
                retention(id) ? "These buyables are protected by your Organization milestone." :
                    "These buyables reset on prestige. Keep them at " + organizationRewards.find(reward => reward.retains === id).requirement + " lifetime Organization." : "",
            projects: projects(id), upgrades: upgrades(id),
            actions: Object.keys(actionBase).filter(key => actionBase[key].resource === id).map(key => ({...actionDefinition(key), canDispatch: canDispatch(key)})),
            costs: Object.entries(investments(id)).map(([resource, cost]) => ({name: names[resource], cost})), canInvest: canInvest(id)};
    }
    function summary() {
        const p = player(), s = supply(), project = projectDefinition(p.civ.project);
        const next = s.bottleneck.startsWith("Water") ? "water" : s.bottleneck.startsWith("Food") || s.bottleneck === "Production" ? "food" : "shelter";
        return {...s, irrigation: p.civ.irrigation, autoIrrigateAvailable: owns("sluice"), housing: housing(), growth: p.civ.growth, nodes: Object.keys(names).map(node),
            project: project ? {...project, progress: Math.min(1, p.civ.projectWork / project.work)} : null,
            next, advice: s.growing ? "Your supplies and housing support another person." :
                s.bottleneck.includes("reserves") ? "Send a crew or enable an earned repeat order. Existing people remain safe." :
                    "Build housing to support the next person.",
            toolBonus: (1 + amount("craft") * 0.18 + amount("education") * 0.12),
            autoAvailable: amountTotal("organization") >= 2};
    }
    /** Defaults add the new fields to 0.1 saves once at codec ingress. Old
     * infrastructure and in-flight construction retain their meaningful values;
     * every loaded game then uses this single current economy. */
    function validateData(data) {
        const count = value => Number.isSafeInteger(value) && value >= 0;
        const finite = value => Number.isFinite(value) && value >= 0;
        if (!Object.hasOwn(names, data.tab)) throw new Error("Invalid civilization resource selection");
        if (!count(data.points.toNumber()) || data.points.lt(1)) throw new Error("Invalid Population count");
        for (const id of Object.keys(names)) if (data[id].points.lt(0) || data[id].best.lt(0) || data[id].total.lt(0)) throw new Error("Negative " + names[id]);
        for (const id of ["food", "water"]) if (!count(data[id].sites) || !count(data[id].storage)) throw new Error("Invalid supply infrastructure");
        const civ = data.civ;
        // These 0.1 priorities belonged to continuous production. Current repeat
        // orders offer short-trip or large-harvest ordering only.
        if (["water", "shelter"].includes(civ.priority)) civ.priority = "balanced";
        if (Object.keys(civ.improvements).some(id => !Object.hasOwn(improvementDefinitions, id)) ||
            Object.values(civ.improvements).some(value => typeof value !== "boolean")) throw new Error("Invalid improvements");
        if (!count(data.shelter.homes) || !count(data.shelter.comfort) || !data.shelter.points.eq(8 + data.shelter.homes * (civ.improvements.joinery ? 6 : 4))) throw new Error("Invalid housing capacity");
        if (Object.keys(data.food.routes).sort().join() !== "farm,fish,gather,hunt" || !Object.values(data.food.routes).every(count)) throw new Error("Invalid Food routes");
        const projectIds = ["food-site", "food-storage", "water-site", "water-storage", "shelter-home", "shelter-comfort", "gather-tools", "hunt-tools", "fish-tools", "farm-tools"];
        if (!["balanced", "food"].includes(civ.priority) ||
            (civ.project !== "" && !projectIds.includes(civ.project)) || (civ.project === "farm-tools" && !civ.improvements.farming) ||
            !finite(civ.projectWork) || civ.projectWorkers !== 1 || !finite(civ.growth) || civ.growth >= 1 ||
            !finite(civ.tickRemainder) || civ.tickRemainder >= 1 + 1e-8 || !finite(civ.irrigation) || civ.irrigation > 45) throw new Error("Invalid civilization progress");
        if (Object.keys(civ.actions).sort().join() !== "farm,fish,gather,hunt,water") throw new Error("Invalid action types");
        let crews = civ.project ? civ.projectWorkers : 0;
        for (const [id, state] of Object.entries(civ.actions)) {
            if (![state.remaining, state.duration, state.reward].every(finite) || !count(state.workers) || !count(state.completed) ||
                state.workers > actionBase[id].workers || state.remaining > state.duration ||
                (state.remaining > 0 && state.workers === 0 && !(actionBase[id].resource === "food" && civ.improvements.autonomousFood)) ||
                (!state.remaining && (state.duration || state.workers || state.reward)) ||
                (id === "farm" && state.remaining && !civ.improvements.farming) ||
                typeof state.repeat !== "boolean" || (state.repeat && !(id === "water" ? civ.improvements.waterOrders : civ.improvements.overseer))) throw new Error("Invalid action state");
            crews += state.workers;
        }
        const domestic = Math.max(0, data.points.toNumber() * 0.12 - data.shelter.comfort * 0.5) * (civ.improvements.hearth ? 0.75 : 1);
        if (crews + domestic > data.points.toNumber() + 1e-9) throw new Error("Overcommitted workers");
    }
    return {defaults, supply, summary, node, projects, startProject, cancelProject, advance,
        actionDefinition, canDispatch, dispatch, recall, toggleRepeat, upgrades, buyUpgrade, irrigate,
        prestige, prestigeGain, prestigeRequirements, prestigePreview, organizationMilestones, investments, canInvest, invest, validateData};
}
