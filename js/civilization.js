/** Session-owned civilization rules. All rates use game minutes; advancement
 * consumes seconds. Production, upkeep and construction share one labor budget.
 * No storage, DOM, clock or timer access belongs in this owner. */
function createCivilizationRules({ saveState }) {
    const names = {food: "Food", water: "Water", shelter: "Shelter", craft: "Craft",
        organization: "Organization", money: "Money", freeTime: "Time", education: "Education", culture: "Culture"};
    const descriptions = {
        food: "Send gathering, hunting and fishing expeditions. Develop each route, then cultivate fields.",
        water: "Carry water into storage jars, then replace hauling with reliable worker-free flow.",
        shelter: "Build more homes to make room for growth. Organization can eventually preserve your huts.",
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
    const startingSettlement = Object.freeze({population: 5, food: 10, water: 10});
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
        buckets: {resource: "water", name: "Carrying yokes", description: "Collection needs 1 worker instead of 2.", costs: {food: 12, water: 10, craft: 1}},
        wellLining: {resource: "water", name: "Well lining", description: "Increase collection yield and gravity-fed flow by 25%.", costs: {food: 15, craft: 1}},
        waterOrders: {resource: "water", name: "Water keeper", description: "Unlock repeat collection orders. The hauling worker is still needed.", costs: {food: 18, craft: 1}},
        gravity: {resource: "water", name: "Gravity-fed spring", description: "Continuous reservoir refill, without orders or workers. Wells improve the flow.", costs: {food: 30, craft: 2, organization: 1}},
        sluice: {resource: "water", name: "Automatic sluice", description: "Unlock automatic irrigation from surplus water.", costs: {money: 8, education: 1, craft: 3}},
        waterReserves: {resource: "water", name: "Emergency cistern", description: "Double Water shortage grace and subsequent loss intervals: 20 seconds before the first loss.", costs: {water: 20, craft: 2}},
        rationing: {resource: "food", name: "Emergency rations", description: "Double Food shortage grace and subsequent loss intervals: 20 seconds before the first loss.", costs: {food: 20, craft: 2}},
        relief: {resource: "shelter", name: "Mutual aid", description: "Loss intervals shrink by 10% instead of 20%, with at least 4 seconds between later losses.", costs: {craft: 3, organization: 1}},
        hunting: {resource: "food", name: "Coordinated hunting", description: "Reduce the base hunting crew from 3 to 2 before bigger-game scaling.", costs: {food: 20, craft: 1}},
        fishing: {resource: "food", name: "Fishing nets", description: "Fishing needs 1 worker instead of 2.", costs: {food: 20, craft: 1}},
        overseer: {resource: "food", name: "Expedition overseer", description: "Unlock separate repeat orders. Each expedition still reserves its crew.", costs: {food: 25, craft: 1, organization: 1}},
        farming: {resource: "food", name: "Cultivated fields", description: "Unlock long, high-yield farming cycles. Repeat with the overseer; 3 workers remain occupied per cycle.", costs: {food: 45, water: 25, craft: 3, organization: 2}},
        autonomousFood: {resource: "food", name: "Autonomous food production", description: "All Food crews become worker-free. Repeat orders keep production running.", costs: {money: 120, freeTime: 10, craft: 12, education: 8}},
        hearth: {resource: "shelter", name: "Shared hearths", description: "Add 25 Food storage.", costs: {food: 20, water: 15, craft: 1}},
        joinery: {resource: "shelter", name: "Timber frames", description: "Every purchased home provides 6 housing instead of 4, including existing homes.", costs: {food: 25, craft: 2}},
        builderTools: {resource: "shelter", name: "Construction tools", description: "Double construction speed. Projects still reserve a builder.", costs: {craft: 2, organization: 1}},
    };
    const owns = id => player().civ.improvements[id];
    const buyableNames = {
        "gather-tools": "Explore farther afield", "hunt-tools": "Hunt bigger game", "fish-tools": "Weave river traps",
        "farm-tools": "Farming tools", "food-site": "Provisioning", "food-storage": "Food baskets",
        "water-site": "Well improvements", "water-storage": "Earthenware jars",
        "shelter-home": "Huts",
    };
    // This one progression table owns unlock gates, specific retention and the
    // late auto-builder. Lifetime earnings survive spending Organization.
    const organizationRewards = [
        {id: "fishing-craft", requirement: 1, name: "Fishing craft", upgrades: ["fishing"], retains: "", reward: "Unlock the Fishing nets Craft upgrade."},
        {id: "water-craft", requirement: 2, name: "Water craft", upgrades: ["wellLining"], retains: "", reward: "Unlock the Well lining Craft upgrade."},
        {id: "building-craft", requirement: 3, name: "Building craft", upgrades: ["joinery"], retains: "", reward: "Unlock the Timber frames Craft upgrade."},
        {id: "reservoir-records", requirement: 4, name: "Water-storage records", upgrades: ["waterOrders", "waterReserves"], retains: "water-storage", reward: "Unlock Water keeper and Emergency cistern. Keep water-storage jars only."},
        {id: "storehouse-records", requirement: 5, name: "Storehouse records", upgrades: ["overseer", "rationing"], retains: "food-storage", reward: "Unlock Expedition overseer and Emergency rations. Keep Food baskets only."},
        {id: "well-records", requirement: 6, name: "Well records", upgrades: ["gravity"], retains: "water-site", reward: "Unlock Gravity-fed spring. Keep well improvements."},
        {id: "gathering-records", requirement: 7, name: "Gathering records", upgrades: ["farming"], retains: "gather-tools", reward: "Unlock Cultivated fields. Keep exploration levels only."},
        {id: "hunting-records", requirement: 8, name: "Hunting records", upgrades: ["builderTools", "relief"], retains: "hunt-tools", reward: "Unlock Construction tools and Mutual aid. Keep bigger-game levels only."},
        {id: "fishing-records", requirement: 9, name: "Fishing records", upgrades: ["sluice"], retains: "fish-tools", reward: "Keep river trap levels only."},
        {id: "settlement-orders", requirement: 10, name: "Settlement orders", upgrades: ["autonomousFood"], retains: "shelter-home", reward: "Unlock auto-building. Keep huts only."},
    ];
    function organizationMilestones(total = amountTotal("organization")) {
        return organizationRewards.map(reward => ({...reward, earned: total >= reward.requirement}));
    }
    function amountTotal(id) { return player()[id].total.toNumber(); }
    function retention(buyable, total = amountTotal("organization")) {
        return organizationMilestones(total).some(reward => reward.retains === buyable && reward.earned);
    }
    function upgradeRequirement(id) {
        const milestone = organizationRewards.find(reward => reward.upgrades.includes(id));
        return milestone ? milestone.requirement : 0;
    }
    function autoBuildingAvailable() { return amountTotal("organization") >= 10; }
    function buyableLevel(id) {
        const [resource, kind] = id.split("-");
        if (kind === "tools") return player().food.routes[resource];
        if (kind === "home") return player().shelter.homes;
        return player()[resource][kind === "site" ? "sites" : "storage"];
    }
    function resetBuyable(id) {
        const [resource, kind] = id.split("-");
        if (kind === "tools") player().food.routes[resource] = 0;
        else if (kind === "home") player().shelter.homes = 0;
        else player()[resource][kind === "site" ? "sites" : "storage"] = 0;
    }
    function buyableRetentionText(resource) {
        const listed = projects(resource).map(project => project.id);
        const kept = listed.filter(id => retention(id)).map(id => buyableNames[id]);
        const resets = listed.filter(id => !retention(id)).map(id => buyableNames[id]);
        return (kept.length ? "Keep: " + kept.join(", ") + ". " : "") +
            (resets.length ? "Reset on prestige: " + resets.join(", ") + "." : "");
    }
    function emptyAction() {
        return {remaining: 0, duration: 0, workers: 0, reward: 0, completed: 0, repeat: false};
    }
    function defaults() {
        return {growth: 0, tickRemainder: 0, project: "", projectWork: 0, projectWorkers: 1,
            priority: "balanced", autoBuild: false, irrigation: 0, autoIrrigate: false, shortage: {elapsed: 0, losses: 0},
            improvements: Object.fromEntries(Object.keys(improvementDefinitions).map(id => [id, false])),
            actions: Object.fromEntries(Object.keys(actionBase).map(id => [id, emptyAction()])),
            message: "Send a Food expedition and collect Water. Busy workers return when their action finishes."};
    }
    const toolEffect = () => 1 + amount("craft") * 0.18 + amount("education") * 0.12;
    const waterFlow = () => (24 + player().water.sites * 10) * toolEffect() * (owns("wellLining") ? 1.25 : 1);
    const storageCapacity = () => ({food: 50 + player().food.storage * 40 + (owns("hearth") ? 25 : 0), water: 50 + player().water.storage * 40});
    function shortageStatus() {
        const p = player(), state = p.civ.shortage;
        const resources = ["food", "water"].filter(id => p[id].points.lte(0));
        const graceFor = id => 10 * (owns(id === "food" ? "rationing" : "waterReserves") ? 2 : 1);
        const grace = resources.length ? Math.min(...resources.map(graceFor)) : 10;
        const decay = owns("relief") ? 0.9 : 0.8;
        const minimum = owns("relief") ? 4 : 2;
        const interval = state.losses ? Math.max(minimum, grace * Math.pow(decay, state.losses)) : grace;
        return {active: resources.length > 0, resources: resources.map(id => names[id]), grace, decay, minimum, interval,
            elapsed: state.elapsed, losses: state.losses, remaining: Math.max(0, interval - state.elapsed),
            progress: Math.min(1, state.elapsed / interval), lastSurvivor: p.points.lte(1)};
    }
    function releaseUnavailableWorkers() {
        const p = player(), returned = [];
        const overbooked = () => {
            const labor = occupiedWorkers();
            return labor.workers.food + labor.workers.water + labor.builders > p.points.toNumber() + 1e-9;
        };
        let paused = false, keeperStopped = false;
        if (overbooked() && p.civ.project && p.civ.projectWorkers) {
            p.civ.projectWorkers = 0;
            paused = true;
        }
        if ((overbooked() || p.points.lte(2)) && p.civ.actions.water.repeat) {
            p.civ.actions.water.repeat = false;
            keeperStopped = true;
        }
        // Prefer keeping crews bringing back the missing supply. Within a group,
        // return the slowest trip first so near-complete recovery can finish.
        const active = Object.keys(actionBase).filter(id => p.civ.actions[id].remaining > 0 && p.civ.actions[id].workers > 0);
        active.sort((a, b) => {
            const criticalA = amount(actionBase[a].resource) <= 0 ? 1 : 0;
            const criticalB = amount(actionBase[b].resource) <= 0 ? 1 : 0;
            return criticalA - criticalB || p.civ.actions[b].remaining - p.civ.actions[a].remaining ||
                p.civ.actions[b].workers - p.civ.actions[a].workers;
        });
        for (const id of active) {
            if (!overbooked()) break;
            Object.assign(p.civ.actions[id], {remaining: 0, duration: 0, workers: 0, reward: 0});
            returned.push(actionNames[id]);
        }
        return {returned, paused, keeperStopped};
    }
    function advanceShortage(seconds) {
        const p = player(), state = p.civ.shortage;
        if (!shortageStatus().active) {
            if (state.elapsed || state.losses) p.civ.message = "Food and Water restored. The shortage countdown has reset.";
            state.elapsed = 0;
            state.losses = 0;
            return;
        }
        state.elapsed += seconds;
        while (p.points.gt(1) && state.elapsed + 1e-9 >= shortageStatus().interval) {
            state.elapsed = Math.max(0, state.elapsed - shortageStatus().interval);
            state.losses++;
            p.points = p.points.sub(1);
            p.civ.growth = 0;
            const released = releaseUnavailableWorkers();
            p.civ.message = "Shortage: Population fell to " + p.points.toString() + "." +
                (released.paused ? " Construction paused; progress kept." : "") +
                (released.keeperStopped ? " Water Keeper switched off to release its worker." : "") +
                (released.returned.length ? " Returned crews: " + released.returned.join(", ") + "." : "");
        }
        if (p.points.lte(1)) state.elapsed = Math.min(state.elapsed, shortageStatus().interval);
    }
    function resumeConstruction() {
        const p = player();
        if (p.civ.project && !p.civ.projectWorkers && !shortageStatus().active && occupiedWorkers().availableWorkers >= 1) p.civ.projectWorkers = 1;
    }
    function huntingCrew(base, level) {
        let workers = base;
        // Round each larger party up before planning the next tier. Stop once
        // a loaded extreme level exceeds any safely representable workforce.
        for (let tier = 0; tier < level; tier++) {
            workers = Math.ceil(workers * 1.5);
            if (!Number.isSafeInteger(workers)) return Infinity;
        }
        return workers;
    }
    function actionDefinition(id) {
        const base = actionBase[id];
        if (!base) return null;
        const p = player(), state = p.civ.actions[id];
        const level = id === "water" ? p.water.sites : p.food.routes[id];
        let workers = base.workers;
        if (id === "water" && owns("buckets")) workers = 1;
        if (id === "hunt" && owns("hunting")) workers = 2;
        if (id === "hunt") workers = huntingCrew(workers, level);
        if (id === "fish" && owns("fishing")) workers = 1;
        if (base.resource === "food" && owns("autonomousFood")) workers = 0;
        const unlocked = id !== "farm" || owns("farming");
        const soloWater = id === "water" && workers > p.points.toNumber();
        const crewSpeed = soloWater ? workers : 1;
        if (soloWater) workers = 1;
        let duration = base.duration;
        let yieldMultiplier = 1;
        if (id === "gather") {
            duration *= Math.pow(1.2, level);
            yieldMultiplier = Math.pow(1.5, level);
        } else if (id === "hunt" || id === "fish") {
            yieldMultiplier = Math.pow(2, level);
        } else {
            duration = Math.max(4, duration / (1 + level * 0.08));
            yieldMultiplier = 1 + level * 0.35;
        }
        duration *= crewSpeed;
        const irrigationBonus = base.resource === "food" && p.civ.irrigation > 0 ? 1.35 : 1;
        const reward = base.reward * yieldMultiplier * toolEffect() * irrigationBonus *
            (base.resource === "food" ? 1 + p.food.sites * 0.15 : owns("wellLining") ? 1.25 : 1);
        return {id, name: actionNames[id], ...base, workers, duration, reward, level, unlocked,
            automatic: id === "water" && owns("gravity"),
            repeatAvailable: id === "water" ? owns("waterOrders") : owns("overseer"),
            repeatCanToggle: id !== "water" || state.repeat || (occupiedWorkers().availableWorkers >= 1 && p.points.gt(1)),
            active: state.remaining > 0, remaining: state.remaining, crew: state.workers,
            progress: state.duration ? 1 - state.remaining / state.duration : 0,
            runningReward: state.reward, repeat: state.repeat, completed: state.completed};
    }
    function occupiedWorkers() {
        const p = player();
        const keeperWorkers = owns("waterOrders") && p.civ.actions.water.repeat ? 1 : 0;
        const workers = {food: 0, water: keeperWorkers};
        for (const [id, action] of Object.entries(p.civ.actions)) {
            if (action.remaining > 0) workers[actionBase[id].resource] += action.workers;
        }
        const builders = p.civ.project ? p.civ.projectWorkers : 0;
        const spare = Math.max(0, p.points.toNumber() - workers.food - workers.water - builders);
        return {workers, keeperWorkers, builders, spare, availableWorkers: Math.floor(spare + 1e-9)};
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
        if (id === "water" && !action.repeat && (occupiedWorkers().availableWorkers < 1 || player().points.lte(1))) return false;
        player().civ.actions[id].repeat = !player().civ.actions[id].repeat;
        return true;
    }
    /** A single derived labor ledger accounts for every reserved crew. Idle
     * workers are available immediately when dispatched. */
    function supply() {
        const p = player(), population = p.points.toNumber(), labor = occupiedWorkers();
        const upkeep = 1 / (1 + amount("organization") * 0.06 + amount("culture") * 0.04);
        const demand = population * upkeep, storage = storageCapacity();
        const production = {food: 0, water: owns("gravity") ? waterFlow() : 0};
        for (const [id, state] of Object.entries(p.civ.actions)) {
            if (state.remaining > 0) production[actionBase[id].resource] += state.reward / state.duration * 60;
        }
        const reserve = Math.max(3, (population + 1) * upkeep * 0.25);
        let bottleneck = "Growing";
        if (population >= housing()) bottleneck = "Shelter";
        else if (p.food.points.lt(reserve)) bottleneck = "Food reserves";
        else if (p.water.points.lt(reserve)) bottleneck = "Water reserves";
        return {population, upkeep, demand, ...labor, production, storage, reserve, bottleneck,
            growing: bottleneck === "Growing", support: housing(), capacity: production,
            efficiency: {food: 3 * toolEffect(), water: 3.2 * toolEffect()},
            idle: labor.spare, laborUsed: labor.workers.food + labor.workers.water + labor.builders};
    }
    function projects(id) {
        const p = player(), work = (base, level) => base * Math.pow(1.35, level);
        if (id === "food") return [
            {id: "gather-tools", name: buyableNames["gather-tools"],
                description: "Exploration level " + p.food.routes.gather + ": reach richer ground. Each level multiplies trip time by 1.2 and yield by 1.5; crew unchanged.", work: work(14, p.food.routes.gather)},
            {id: "hunt-tools", name: buyableNames["hunt-tools"], organizationRequired: 1 + p.food.routes.hunt,
                description: "Bigger-game level " + p.food.routes.hunt + ": each level multiplies the crew by 1.5, rounded up, and yield by 2; trip time unchanged. Requires " + (1 + p.food.routes.hunt) + " lifetime Organization (not spent).", work: 14},
            {id: "fish-tools", name: buyableNames["fish-tools"], craftCost: Math.pow(2, p.food.routes.fish),
                description: "River trap level " + p.food.routes.fish + ": each level doubles the catch with the same crew and trip time. Costs " + Math.pow(2, p.food.routes.fish) + " Craft, paid when construction starts.", work: 14},
            ...(owns("farming") ? [{id: "farm-tools", name: buyableNames["farm-tools"],
                description: "Route level " + p.food.routes.farm + ": +35% base yield and faster trips per level.", work: work(14, p.food.routes.farm)}] : []),
            {id: "food-site", name: "Improve provisioning", description: "+15% base yield for every Food route.", work: work(18, p.food.sites)},
            {id: "food-storage", name: "Weave food baskets", craftCost: 1, description: "+40 Food storage. Costs 1 Craft per basket, paid when construction starts.", work: work(12, p.food.storage)},
        ];
        if (id === "water") return [
            {id: "water-site", name: "Improve the well", description: "Improve collection yield and speed; +10 base Water/min once gravity-fed.", work: work(16, p.water.sites)},
            {id: "water-storage", name: "Craft earthenware jars", craftCost: 1, description: "Hand-shaped, fired clay jars. +40 Water storage. Costs 1 Craft per purchase, paid when construction starts.", work: work(12, p.water.storage)},
        ];
        if (id === "shelter") return [
            {id: "shelter-home", name: "Build a new hut", description: "+" + (owns("joinery") ? 6 : 4) + " housing. Owned: " + p.shelter.homes + ".", work: work(16, p.shelter.homes)},
        ];
        return [];
    }
    function projectDefinition(id) {
        return ["food", "water", "shelter"].flatMap(projects).find(item => item.id === id);
    }
    function canStartProject(id) {
        const project = projectDefinition(id);
        return !!project && !player().civ.project && occupiedWorkers().availableWorkers >= 1 &&
            amountTotal("organization") >= (project.organizationRequired || 0) &&
            player().craft.points.gte(project.craftCost || 0);
    }
    function startProject(id) {
        const p = player();
        if (!canStartProject(id)) return false;
        const project = projectDefinition(id);
        if (project.craftCost) p.craft.points = p.craft.points.sub(project.craftCost);
        p.civ.project = id;
        p.civ.projectWork = 0;
        p.civ.projectWorkers = 1;
        p.civ.message = project.name + " started. One builder is reserved until completion." + (project.craftCost ? " Spent " + project.craftCost + " Craft; canceling will not refund it." : "");
        return true;
    }
    function cancelProject() {
        player().civ.project = "";
        player().civ.projectWork = 0;
        player().civ.projectWorkers = 1;
        player().civ.message = "Construction canceled. Builder released; any Craft spent is not refunded.";
    }
    function completeProject(id) {
        const name = projectDefinition(id).name, [resource, kind] = id.split("-");
        if (kind === "tools") player().food.routes[resource]++;
        else if (kind === "home") {
            player().shelter.homes++;
            player().shelter.points = new Decimal(8 + player().shelter.homes * (owns("joinery") ? 6 : 4));
        } else if (kind === "site") player()[resource].sites++;
        else player()[resource].storage++;
        player().civ.project = "";
        player().civ.projectWork = 0;
        player().civ.projectWorkers = 1;
        player().civ.message = name + " completed. Builder available.";
    }
    function upgrades(resource) {
        return Object.entries(improvementDefinitions).filter(([, item]) => item.resource === resource).map(([id, item]) => {
            const available = owns(id) || (amountTotal("organization") >= upgradeRequirement(id) && Object.keys(item.costs).every(resourceAvailable));
            return {id, ...item, available, organizationRequired: upgradeRequirement(id), owned: owns(id),
                canBuy: available && !owns(id) && Object.entries(item.costs).every(([key, cost]) => player()[key].points.gte(cost)),
                costText: Object.entries(item.costs).map(([key, cost]) => cost + " " + names[key]).join(" · ")};
        }).filter(upgrade => upgrade.available);
    }
    function buyUpgrade(id) {
        const definition = improvementDefinitions[id];
        if (!definition || owns(id) || amountTotal("organization") < upgradeRequirement(id) || !Object.keys(definition.costs).every(resourceAvailable)) return false;
        if (!Object.entries(definition.costs).every(([resource, cost]) => player()[resource].points.gte(cost))) return false;
        for (const [resource, cost] of Object.entries(definition.costs)) player()[resource].points = player()[resource].points.sub(cost);
        player().civ.improvements[id] = true;
        if (id === "gravity") player().civ.actions.water.repeat = false;
        if (id === "joinery") player().shelter.points = new Decimal(8 + player().shelter.homes * 6);
        player().civ.message = definition.name + " purchased. Upgrades apply to the next dispatched crew.";
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
        if (p.food.storage < 3 && canStartProject("food-storage")) return startProject("food-storage");
        if (p.water.storage < 3) return startProject("water-storage");
        return false;
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
        if (p.civ.autoBuild && autoBuildingAvailable() && !p.civ.project && !shortageStatus().active) chooseAutomaticProject();
        if (!owns("overseer")) return;
        const order = p.civ.priority === "food" ? ["farm", "hunt", "fish", "gather"] : ["gather", "fish", "hunt", "farm"];
        for (const id of order) if (p.civ.actions[id].repeat && amount("food") < storageCapacity().food - 1) dispatch(id);
    }
    function step(seconds) {
        const p = player();
        advanceActions(seconds);
        const before = supply(), minutes = seconds / 60;
        for (const id of ["food", "water"]) {
            const passive = id === "water" && owns("gravity") ? waterFlow() : 0;
            if (passive) addResource(id, Math.min(passive * minutes, Math.max(0, before.storage[id] - amount(id))));
            p[id].points = p[id].points.sub(before.demand * minutes).max(0);
        }
        advanceShortage(seconds);
        const s = supply();
        if (p.civ.project && p.civ.projectWorkers) {
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
        p.civ.irrigation = Math.max(0, p.civ.irrigation - seconds);
        automaticOrders();
        resumeConstruction();
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
        if (id === "craft") return Math.max(0, 1 + Math.floor((player().points.toNumber() - 12) / 2));
        if (id === "organization") return housing() >= organizationHousingRequirement() ? 1 : 0;
        return 0;
    }
    function organizationHousingRequirement() { return 12 + 4 * amountTotal("organization"); }
    function prestigeRequirements(id) {
        return id === "craft" ? "12 Population gives 1 Craft, then +1 per 2 Population (14 gives 2, 16 gives 3)" : organizationHousingRequirement() + " housing; gain exactly 1 Organization";
    }
    /** The same prospective plan drives the UI, confirmation and reset. An
     * Organization reward earned by this prestige protects its buyables now. */
    function prestigePreview(id) {
        const p = player(), gain = prestigeGain(id);
        const organizationTotal = amountTotal("organization") + (id === "organization" ? gain : 0);
        const kept = Object.fromEntries(Object.keys(buyableNames).map(buyable => [buyable, retention(buyable, organizationTotal)]));
        const resetBuyables = Object.keys(kept).filter(resource => !kept[resource]);
        const keptBuyables = Object.keys(kept).filter(resource => kept[resource]);
        const resetConstruction = !!p.civ.project && !kept[p.civ.project];
        const recalledActions = Object.keys(actionBase).filter(action => {
            if (!p.civ.actions[action].remaining) return false;
            if (action === "water") return !kept["water-site"] && p.water.sites > 0;
            return (!kept[action + "-tools"] && p.food.routes[action] > 0) || (!kept["food-site"] && p.food.sites > 0);
        });
        // Return enough retained crews to fit the smaller founding workforce.
        let committed = p.civ.project && !resetConstruction ? p.civ.projectWorkers : 0;
        const remaining = Object.keys(actionBase).filter(action => p.civ.actions[action].remaining > 0 && !recalledActions.includes(action));
        for (const action of remaining) committed += p.civ.actions[action].workers;
        for (const action of remaining.sort((a, b) => p.civ.actions[b].workers - p.civ.actions[a].workers)) {
            if (committed <= startingSettlement.population + 1e-9) break;
            recalledActions.push(action);
            committed -= p.civ.actions[action].workers;
        }
        const reset = ["Population returns to " + startingSettlement.population, "Food and Water stores restart at " + startingSettlement.food + " each", "growth, irrigation and shortage countdown", "Water Keeper switches off"];
        const ownedResetBuyables = resetBuyables.filter(buyable => buyableLevel(buyable) > 0);
        reset.push(ownedResetBuyables.length ? "buyables: " + ownedResetBuyables.map(buyable => buyableNames[buyable]).join(", ") : "unprotected buyables (none currently owned)");
        if (!kept["shelter-home"] && p.shelter.homes > 0) reset.push("housing capacity returns to 8");
        if (resetConstruction) reset.push("current construction progress");
        if (recalledActions.length) reset.push(recalledActions.map(action => actionNames[action]).join(", ") + " trips return without yield");
        const keep = ["permanent upgrades", "repeat orders", "Craft, Organization and later resources"];
        if (keptBuyables.length) keep.push("protected buyables: " + keptBuyables.map(buyable => buyableNames[buyable]).join(", "));
        if (p.civ.project && !resetConstruction) keep.push("current construction");
        return {gain, organizationTotal, kept, resetBuyables, keptBuyables, resetConstruction, recalledActions, startingSettlement,
            resetText: reset.join("; "), keepText: keep.join("; ")};
    }
    function prestige(id) {
        const plan = prestigePreview(id), gain = plan.gain;
        if (!gain) return false;
        addResource(id, gain);
        player()[id].unlocked = true;
        const p = player();
        for (const buyable of plan.resetBuyables) resetBuyable(buyable);
        p.shelter.points = new Decimal(8 + p.shelter.homes * (owns("joinery") ? 6 : 4));
        if (plan.resetConstruction) { p.civ.project = ""; p.civ.projectWork = 0; p.civ.projectWorkers = 1; }
        for (const action of plan.recalledActions) Object.assign(p.civ.actions[action], {remaining: 0, duration: 0, workers: 0, reward: 0});
        p.points = new Decimal(startingSettlement.population);
        player().food.points = new Decimal(startingSettlement.food);
        player().water.points = new Decimal(startingSettlement.water);
        p.civ.shortage = {elapsed: 0, losses: 0};
        p.civ.actions.water.repeat = false;
        player().civ.growth = 0;
        p.civ.irrigation = 0;
        player().civ.message = names[id] + " increased by " + gain + ". " + (plan.resetBuyables.length ? "Unprotected buyables reset. " : "All buyables retained. ") + "Organization milestones use lifetime earnings.";
        return true;
    }
    function investments(id) {
        if (id === "education") return {money: 5 * Math.pow(1.6, amount(id)), freeTime: 2 * Math.pow(1.4, amount(id))};
        if (id === "culture") return {freeTime: 3 * Math.pow(1.4, amount(id)), craft: 1};
        return {};
    }
    function canInvest(id) {
        if (!["education", "culture"].includes(id) || !resourceAvailable(id) || !player()[id].unlocked) return false;
        return Object.entries(investments(id)).every(([resource, cost]) => player()[resource].points.gte(cost));
    }
    function invest(id) {
        if (!canInvest(id)) return false;
        for (const [resource, cost] of Object.entries(investments(id))) player()[resource].points = player()[resource].points.sub(cost);
        addResource(id, 1);
        player().civ.message = id === "education" ? "Knowledge improves every worker's tools and techniques." : "Shared culture improves cooperation and reduces upkeep.";
        return true;
    }
    // Later resource unlocks are intentionally not part of this opening yet.
    const resourceAvailable = id => tier(id) <= 1;
    function node(id) {
        const p = player(), isPrestige = tier(id) === 1;
        const unlocked = resourceAvailable(id) && (tier(id) === 0 || isPrestige || p[id].unlocked);
        const colors = {food:"#4BDC13",water:"#31aeb0",shelter:"#c79b58",craft:"#f5b942",organization:"#b16fd6",money:"#f2cf54",freeTime:"#64d4f0",education:"#698df0",culture:"#e776b4"};
        const symbols = {food:"F",water:"W",shelter:"S",craft:"C",organization:"O",money:"$",freeTime:"T",education:"E",culture:"Cu"};
        return {id, name: names[id], color:colors[id], symbol:symbols[id], tier: tier(id), icon: icons[id], description: descriptions[id], unlocked,
            value: p[id].points, unit: id === "shelter" ? "housing" : id === "freeTime" ? "free hours" :
                id === "organization" ? "coordination" : id === "education" ? "knowledge" : id === "culture" ? "influence" : "",
            requirement: isPrestige ? prestigeRequirements(id) : tier(id) === 2 ? "Earn Craft and Organization" : "Earn 5 Money and 3 free hours in total",
            canPrestige: prestigeGain(id) > 0, prestigeGain: prestigeGain(id), prestigePreview: isPrestige ? prestigePreview(id) : null,
            organizationMilestones: id === "organization" ? organizationMilestones() : [], organizationEarned: amountTotal("organization"),
            buyableRetention: buyableRetentionText(id),
            projects: projects(id).map(project => ({...project, canStart: canStartProject(project.id)})), upgrades: upgrades(id),
            actions: Object.keys(actionBase).filter(key => actionBase[key].resource === id).map(key => ({...actionDefinition(key), canDispatch: canDispatch(key)})),
            costs: Object.entries(investments(id)).map(([resource, cost]) => ({name: names[resource], cost})), canInvest: canInvest(id)};
    }
    function summary() {
        const p = player(), s = supply(), project = projectDefinition(p.civ.project);
        const next = s.bottleneck.startsWith("Water") ? "water" : s.bottleneck.startsWith("Food") || s.bottleneck === "Production" ? "food" : "shelter";
        return {...s, shortage: shortageStatus(), irrigation: p.civ.irrigation, autoIrrigateAvailable: owns("sluice"), housing: housing(), growth: p.civ.growth, nodes: Object.keys(names).filter(resourceAvailable).map(node),
            project: project ? {...project, paused: p.civ.projectWorkers === 0, progress: Math.min(1, p.civ.projectWork / project.work)} : null,
            next, advice: s.growing ? "Your supplies and housing support another person." :
                s.bottleneck.includes("reserves") ? "Restore supplies before the shortage countdown runs out." :
                    "Build housing to support the next person.",
            toolBonus: (1 + amount("craft") * 0.18 + amount("education") * 0.12),
            autoAvailable: autoBuildingAvailable()};
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
        if (Number(data.version) < 0.6) {
            // Preserve earned balances and retired improvement counts while
            // retiring their automatic unlock and unfinished labor-only project.
            for (const id of ["money", "freeTime", "education", "culture"]) data[id].unlocked = false;
            if (civ.project === "shelter-comfort") {
                civ.project = "";
                civ.projectWork = 0;
                civ.projectWorkers = 1;
            }
        }
        if (!resourceAvailable(data.tab)) data.tab = "food";
        // Old repeat toggles did not reserve a keeper. Migrate them off before
        // validating current worker commitments; future writes use this model.
        if (Number(data.version) < 0.5) civ.actions.water.repeat = false;
        if (civ.improvements.gravity && civ.actions.water.repeat) throw new Error("Water Keeper must be off with gravity flow");
        // These 0.1 priorities belonged to continuous production. Current repeat
        // orders offer short-trip or large-harvest ordering only.
        if (["water", "shelter"].includes(civ.priority)) civ.priority = "balanced";
        if (Object.keys(civ.improvements).some(id => !Object.hasOwn(improvementDefinitions, id)) ||
            Object.values(civ.improvements).some(value => typeof value !== "boolean")) throw new Error("Invalid improvements");
        if (!count(data.shelter.homes) || !count(data.shelter.comfort) || !data.shelter.points.eq(8 + data.shelter.homes * (civ.improvements.joinery ? 6 : 4))) throw new Error("Invalid housing capacity");
        if (Object.keys(data.food.routes).sort().join() !== "farm,fish,gather,hunt" || !Object.values(data.food.routes).every(count)) throw new Error("Invalid Food routes");
        const projectIds = ["food-site", "food-storage", "water-site", "water-storage", "shelter-home", "gather-tools", "hunt-tools", "fish-tools", "farm-tools"];
        if (!["balanced", "food"].includes(civ.priority) ||
            (civ.project !== "" && !projectIds.includes(civ.project)) || (civ.project === "farm-tools" && !civ.improvements.farming) ||
            !finite(civ.projectWork) || (![0, 1].includes(civ.projectWorkers) || (!civ.project && civ.projectWorkers !== 1)) || !finite(civ.growth) || civ.growth >= 1 ||
            !finite(civ.tickRemainder) || civ.tickRemainder >= 1 + 1e-8 || !finite(civ.irrigation) || civ.irrigation > 45) throw new Error("Invalid civilization progress");
        if (Object.keys(civ.actions).sort().join() !== "farm,fish,gather,hunt,water") throw new Error("Invalid action types");
        if (!count(civ.shortage.losses) || !finite(civ.shortage.elapsed) || civ.shortage.elapsed > 20) throw new Error("Invalid shortage countdown");
        let crews = (civ.project ? civ.projectWorkers : 0) + (civ.improvements.waterOrders && civ.actions.water.repeat ? 1 : 0);
        for (const [id, state] of Object.entries(civ.actions)) {
            if (![state.remaining, state.duration, state.reward].every(finite) || !count(state.workers) || !count(state.completed) ||
                state.workers > (id === "hunt" ? huntingCrew(actionBase.hunt.workers, data.food.routes.hunt) : actionBase[id].workers) || state.remaining > state.duration ||
                (state.remaining > 0 && state.workers === 0 && !(actionBase[id].resource === "food" && civ.improvements.autonomousFood)) ||
                (!state.remaining && (state.duration || state.workers || state.reward)) ||
                (id === "farm" && state.remaining && !civ.improvements.farming) ||
                typeof state.repeat !== "boolean" || (state.repeat && !(id === "water" ? civ.improvements.waterOrders : civ.improvements.overseer))) throw new Error("Invalid action state");
            crews += state.workers;
        }
        if (crews > data.points.toNumber() + 1e-9) throw new Error("Overcommitted workers");
    }
    return {startingSettlement, defaults, supply, summary, node, projects, canStartProject, startProject, cancelProject, advance, shortageStatus,
        actionDefinition, canDispatch, dispatch, recall, toggleRepeat, upgrades, buyUpgrade, irrigate,
        prestige, prestigeGain, prestigeRequirements, prestigePreview, organizationMilestones, organizationHousingRequirement, investments, canInvest, invest, validateData};
}
