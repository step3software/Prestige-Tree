/** Session-owned civilization rules. All rates use game minutes; advancement
 * consumes seconds. Production, upkeep and construction share one labor budget.
 * No storage, DOM, clock or timer access belongs in this owner. */
function createCivilizationRules({ saveState }) {
    const names = {food: "Food", water: "Water", shelter: "Shelter", craft: "Craft",
        organization: "Organization", money: "Money", freeTime: "Time", education: "Education", culture: "Culture"};
    const descriptions = {
        food: "Gather Food, unlock hunting at Organization 2, then plan expeditions with overseers at Organization 3.",
        water: "Haul Water into woven baskets and jars; a spring supplements manual collection.",
        shelter: "Organization milestone 1 unlocks huts. Build more homes to make room for growth; later milestones preserve your huts.",
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
    // Each input has its own cap/range/shape. Bonuses add to normal growth;
    // using baseline fill time avoids a feedback loop between their curves.
    const growthSettings = Object.freeze({
        secondsPerPerson: 12,
        food: Object.freeze({maxBonus: 3, reserveSeconds: 60, fullSurplusFraction: 0.9, exponent: 1}),
        water: Object.freeze({maxBonus: 3, reserveSeconds: 60, fullSurplusFraction: 0.9, exponent: 1}),
        shelter: Object.freeze({maxBonus: 3, thresholdSeconds: 60, fullSeconds: 300, exponent: 1}),
    });
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
        crafting: {resource: "craft", name: "Crafting", description: "Unlock basic equipment and Food/Water buyables.", costs: {craft: 10}},
        clay: {resource: "craft", name: "Clay", description: "Unlock ceramic storage, bricks, cooking vessels and pipes.", costs: {craft: 20}},
        copper: {resource: "craft", name: "Copper working", description: "Unlock axes, knives, upgraded cooking vessels and sickles.", costs: {craft: 30}},
        roofs: {resource: "shelter", name: "Thatched roofs", description: "+1 housing per existing and future hut. Upgrades to Bricks.", costs: {craft: 1}},
        bricks: {resource: "shelter", name: "Bricks", description: "Upgrade Thatched roofs: +2 housing per hut replaces +1. Hut counts and work are kept.", costs: {craft: 2}},
        clayPots: {resource: "fire", name: "Clay cooking pots", description: "Cooking consumes 25% less Fire. These vessels are separate from Water-storage jars.", costs: {craft: 2}},
        copperPots: {resource: "fire", name: "Copper pots", description: "Upgrade Clay cooking pots: retain fuel savings and add 25% to the fueled Cooking bonus.", costs: {craft: 3}},
        copperAxes: {resource: "shelter", name: "Copper axes", description: "Double hut construction speed; builders are still required.", costs: {craft: 3}},
        sickles: {resource: "food", name: "Copper sickles", description: "New Farming trips take 25% less time with the same crew and reward.", costs: {craft: 3}},
        pipes: {resource: "water", name: "Fired-clay pipes", description: "Double spring flow. Manual hauling remains available. Pay Fire once, without ongoing fuel use.", costs: {craft: 2, fire: 2}},
        lashings: {resource: "shelter", name: "Cord lashings", description: "Hut construction work scales by 1.25 per hut instead of 1.35.", costs: {craft: 1}},
        digging: {resource: "food", name: "Digging sticks", description: "Gathering returns 25% more Food with the same crew and duration.", costs: {craft: 1}},
        butchery: {resource: "food", name: "Copper knives", description: "Hunting returns 50% more Food with the same crew and duration.", costs: {craft: 3}},
        preparedMaterials: {resource: "shelter", name: "Prepared materials", description: "Overseer-started huts require 25% less construction work.", costs: {organization: 1}},
        extendedExpeditions: {resource: "food", name: "Extended expeditions", description: "Choose 1-5 times duration and Food yield for each expedition. Crew size and repeats spent stay unchanged.", costs: {organization: 2}},
        workRosters: {resource: "organization", name: "Work rosters", description: "Assign 1-5 overseers separately to Food and huts. Each assigned worker supports 5 queued repeats, up to 25 per slider.", costs: {organization: 3}},
        abundance: {resource: "shelter", name: "Abundance", description: "Surplus Food, Water and spare housing independently accelerate population growth, up to 10 times normal. Free after Organization milestone 5.", costs: {}},
        buckets: {resource: "water", name: "Carrying yokes", description: "Collection needs 1 worker instead of 2.", costs: {food: 12, water: 10, craft: 1}},
        hutForeman: {resource: "shelter", name: "Hut foreman", description: "Queue up to 5 hut repeats, one at a time. Each successful start uses one repeat. Queued orders reserve one foreman; construction still needs its builder and full scaling work.", costs: {food: 18, craft: 1}},
        gravity: {resource: "water", name: "Gravity-fed spring", description: "Continuous reservoir refill, without orders or workers. Wells improve the flow.", costs: {food: 30, craft: 2, organization: 1}},
        sluice: {resource: "water", name: "Automatic sluice", description: "Unlock automatic irrigation from surplus water.", costs: {money: 8, education: 1, craft: 3}},
        waterReserves: {resource: "water", name: "Emergency cistern", description: "Double Water shortage grace and subsequent loss intervals: 20 seconds before the first loss.", costs: {water: 20, craft: 2}},
        rationing: {resource: "food", name: "Emergency rations", description: "Double Food shortage grace and subsequent loss intervals: 20 seconds before the first loss.", costs: {food: 20, craft: 2}},
        relief: {resource: "shelter", name: "Mutual aid", description: "Loss intervals shrink by 10% instead of 20%, with at least 4 seconds between later losses.", costs: {craft: 3, organization: 1}},
        hunting: {resource: "food", name: "Wooden spears", description: "Unlock hunting with a base crew of 2 before bigger-game scaling.", costs: {craft: 1}},
        overseer: {resource: "food", name: "Expedition overseer", description: "Queue up to 5 repeats per Food route, one job at a time. Each successful start uses one repeat. Queues reserve one shared Overseer, plus every running job's full crew.", costs: {food: 25, craft: 1, organization: 1}},
        farming: {resource: "food", name: "Cultivated fields", description: "Unlock long, high-yield farming cycles. Repeat with the overseer; 3 workers remain occupied per cycle.", costs: {food: 45, water: 25, craft: 3, organization: 2}},
        autonomousFood: {resource: "food", name: "Autonomous food production", description: "All Food crews become worker-free. Repeat orders keep production running.", costs: {money: 120, freeTime: 10, craft: 12, education: 8}},
        cooking: {resource: "fire", name: "Cooking", description: "Choose 1–5× Food yields while jobs work. Higher settings consume more Fire; unfueled work still delivers its base yield.", costs: {fire: 1}},
        jars: {resource: "fire", name: "Earthenware jars", description: "Raise base Water capacity to 100 and each storage purchase to +120. New jars also spend scaling Fire when construction starts.", costs: {craft: 2}},
        hearth: {resource: "fire", name: "Shared hearths", description: "Every 10 current Population adds +25 Food storage and up to +4 Food/min, scaled by Fire fullness. Income is outside Cooking.", costs: {fire: 3}},
        joinery: {resource: "shelter", name: "Timber frames", description: "Every purchased home provides 6 housing instead of 4, including existing homes.", costs: {craft: 2}},
        builderTools: {resource: "shelter", name: "Construction tools", description: "Double construction speed. Projects still reserve a builder.", costs: {craft: 3}},
    };
    const owns = id => player().civ.improvements[id];
    const materialDefinitions = [
        {id: "crafting", items: ["roofs", "hunting", "water-storage", "digging"]},
        {id: "clay", items: ["jars", "bricks", "clayPots", "pipes"]},
        {id: "copper", items: ["copperAxes", "butchery", "copperPots", "sickles"]},
    ];
    const materialFor = id => materialDefinitions.find(row => row.items.includes(id));
    const materialItem = id => materialFor(id) || materialDefinitions.some(row => row.id === id);
    const fireProjectDefinitions = {
        fuel: {name: "Fuel stores", craftCost: 1, baseWork: 12, description: "+10 Fire capacity per level; no free fuel."},
        hearths: {name: "Improved hearths", craftCost: 1, baseWork: 16, description: "+20% base tender production per level; tenders still required."},
        charcoal: {name: "Charcoal clamps", craftCost: 2, baseWork: 24, description: "Fuel use divided by 1 + 0.15 per level. Fixed technology costs stay unchanged."},
    };
    const housingPerHut = improvements => 4 + (improvements.joinery ? 2 : 0) + (improvements.bricks ? 2 : improvements.roofs ? 1 : 0);
    function updateHousing() { player().shelter.points = new Decimal(8 + player().shelter.homes * housingPerHut(player().civ.improvements)); }
    const personUpkeep = () => 1 / (1 + amount("organization") * 0.06 + amount("culture") * 0.04);
    const fuelEfficiency = () => 1 + player().civ.fireBuyables.charcoal * 0.15;
    const vesselDiscount = () => owns("clayPots") || owns("copperPots") ? 0.75 : 1;
    const cookingBonusFactor = () => owns("copperPots") ? 1.25 : 1;
    const buyableNames = {
        "gather-tools": "Explore farther afield", "hunt-tools": "Hunt bigger game", "fish-tools": "Weave river traps",
        "farm-tools": "Farming tools", "food-site": "Provisioning", "food-storage": "Food baskets",
        "water-site": "Well improvements", get "water-storage"() { return owns("jars") ? "Earthenware jars" : "Woven baskets"; },
        "shelter-home": "Huts", "fire-fuel": "Fuel stores", "fire-hearths": "Improved hearths", "fire-charcoal": "Charcoal clamps",
    };
    // This one progression table owns unlock gates, specific retention and the
    // late auto-builder. The saved peak held balance preserves earned unlocks.
    const organizationRewards = [
        {id: "hut-building", requirement: 1, name: "Build huts", upgrades: [], retains: "", reward: "Build basic huts. Crafting unlocks their material improvements."},
        {id: "hunting", requirement: 2, name: "Growing community", upgrades: [], retains: "", reward: "Material purchases in Craft unlock hunting and equipment; this milestone does not purchase them."},
        {id: "overseers", requirement: 3, name: "Overseers", upgrades: ["preparedMaterials", "extendedExpeditions", "workRosters"], retains: "", reward: "Queue Food expeditions and huts. Unlock Prepared materials (1 Organization), Extended expeditions (2 Organization) and Work rosters (3 Organization)."},
        {id: "reservoir-records", requirement: 4, name: "Fire", upgrades: ["cooking", "hearth"], retains: "water-storage", reward: "Assign 0–5 Fire tenders. Unlock Cooking (1 Fire) and Shared hearths (3 Fire). Clay upgrades Water jars separately. Keep water-storage jars."},
        {id: "storehouse-records", requirement: 5, name: "Gravity-fed spring", upgrades: ["gravity", "waterReserves"], retains: "food-storage", reward: "Unlock Gravity-fed spring and Emergency cistern. Keep Food baskets."},
        {id: "well-records", requirement: 6, name: "Well records", upgrades: [], retains: "water-site", reward: "Keep well improvements. Craft spending unlocks buyables."},
        {id: "gathering-records", requirement: 7, name: "Farming", upgrades: ["farming"], retains: "gather-tools", reward: "Unlock Cultivated fields. Keep exploration levels."},
        {id: "hunting-records", requirement: 8, name: "Abundance", upgrades: ["abundance", "rationing", "relief"], retains: "hunt-tools", reward: "Unlock free Abundance, Emergency rations and Mutual aid. Keep bigger-game levels."},
        {id: "fishing-records", requirement: 9, name: "Irrigation", upgrades: ["sluice"], retains: "fish-tools", reward: "Irrigate Farming cycles. Keep river trap levels."},
        {id: "settlement-orders", requirement: 10, name: "Settlement orders", upgrades: ["autonomousFood"], retains: "shelter-home", reward: "Unlock auto-building. Keep huts."},
    ];
    function organizationProgress(held = amount("organization")) {
        return Math.max(player().organization.best.toNumber(), held);
    }
    function organizationMilestones(held = amount("organization")) {
        const progress = organizationProgress(held);
        return organizationRewards.map(reward => ({...reward, earned: progress >= reward.requirement}));
    }
    function amountTotal(id) { return player()[id].total.toNumber(); }
    function retention(buyable, held = amount("organization")) {
        return organizationMilestones(held).some(reward => reward.retains === buyable && reward.earned);
    }
    function featureAvailable(id) {
        if (id === "hunting") return owns("hunting") || (owns("crafting") && player().civ.features.hunting);
        if (id === "buyables") return owns("crafting");
        if (id === "huts") return organizationProgress() >= 1;
        return !!player().civ.features[id];
    }
    function foodOrdersAvailable() { return organizationProgress() >= 3; }
    function hutOrdersAvailable() { return organizationProgress() >= 3; }
    function repeatCap(kind) { return 5 * (owns("workRosters") ? player().civ.overseers[kind] : 1); }
    function upgradeRequirement(id) {
        if (materialItem(id)) return 0;
        if (["overseer", "hutForeman"].includes(id)) return 3;
        if (id === "buckets") return Infinity;
        const milestone = organizationRewards.find(reward => reward.upgrades.includes(id));
        return milestone ? milestone.requirement : Infinity;
    }
    function autoBuildingAvailable() { return organizationProgress() >= 10; }
    function buyableLevel(id) {
        const [resource, kind] = id.split("-");
        if (resource === "fire") return player().civ.fireBuyables[kind];
        if (kind === "tools") return player().food.routes[resource];
        if (kind === "home") return player().shelter.homes;
        return player()[resource][kind === "site" ? "sites" : "storage"];
    }
    function resetBuyable(id) {
        const [resource, kind] = id.split("-");
        if (resource === "fire") player().civ.fireBuyables[kind] = 0;
        else if (kind === "tools") player().food.routes[resource] = 0;
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
        return {remaining: 0, duration: 0, workers: 0, reward: 0, cookingBonus: 0, jobs: 0, completed: 0, repeat: 0};
    }
    function defaults() {
        return {fireBuyables: {fuel: 0, hearths: 0, charcoal: 0}, fire: 0, fireTenders: 0, cookingLevel: 1, growth: 0, tickRemainder: 0, project: "", projectWork: 0, projectWorkers: 1, projectJobs: 1, hutRepeat: 0,
            features: {huts: false, hunting: false, fishing: false, buyables: false},
            overseers: {food: 1, huts: 1}, expeditionMultipliers: {gather: 1, hunt: 1, fish: 1, farm: 1},
            preparedHut: false, priority: "balanced", autoBuild: false, irrigation: 0, autoIrrigate: false, shortage: {elapsed: 0, losses: 0},
            improvements: Object.fromEntries(Object.keys(improvementDefinitions).map(id => [id, false])),
            actions: Object.fromEntries(Object.keys(actionBase).map(id => [id, emptyAction()])),
            message: "Send a Food expedition and collect Water. Busy workers return when their action finishes."};
    }
    const knowledgeEffect = () => 1 + amount("education") * 0.12;
    const waterFlow = () => personUpkeep() * (8 + player().water.sites) * knowledgeEffect() * (owns("pipes") ? 2 : 1);
    function fireAvailable(data = player()) {
        const improvements = data.civ.improvements;
        return data.organization.points.gte(4) || improvements.cooking || improvements.jars || improvements.hearth;
    }
    const fireCapacity = () => 10 + 2 * player().shelter.homes + 10 * player().civ.fireBuyables.fuel;
    function fireStatus() {
        const p = player(), maximum = fireCapacity(), fill = Math.min(1, p.civ.fire / maximum);
        const tenders = fireAvailable() ? p.civ.fireTenders : 0;
        const gain = tenders * (0.5 + 1.5 * fill * fill) * (1 + 0.2 * p.civ.fireBuyables.hearths);
        let uncookedProduction = 0;
        for (const [id, state] of Object.entries(p.civ.actions)) {
            if (actionBase[id].resource === "food" && state.remaining > 0) uncookedProduction += state.reward / state.duration * 60;
        }
        const level = owns("cooking") ? p.civ.cookingLevel : 1;
        const consumption = 0.2 * Math.pow(level - 1, 2) * uncookedProduction / 30 * vesselDiscount() / fuelEfficiency();
        const suppliedFraction = consumption > 0 ? Math.min(1, (p.civ.fire * 60 + gain) / consumption) : 1;
        const actualConsumption = consumption * suppliedFraction;
        return {available: fireAvailable(), current: p.civ.fire, maximum, fill, gain, consumption, actualConsumption,
            net: gain - actualConsumption, tenders, level, uncookedProduction,
            cookingMultiplier: 1 + (level - 1) * suppliedFraction * cookingBonusFactor(), cookingAvailable: owns("cooking"),
            fuelLimited: suppliedFraction < 1};
    }
    function setFireTenders(workers) {
        const p = player();
        if (!Number.isInteger(workers) || workers < 0 || workers > 5 || (workers > 0 && !fireAvailable()) ||
            workers - occupiedWorkers().fireTenders > occupiedWorkers().availableWorkers) return false;
        p.civ.fireTenders = workers;
        return true;
    }
    function setCookingLevel(level) {
        if (!owns("cooking") || !Number.isInteger(level) || level < 1 || level > 5) return false;
        player().civ.cookingLevel = level;
        return true;
    }
    /** Fuel and bonus accrue during work, using each job's uncooked snapshot.
     * Partial fuel cooks the same fraction of that step; the base yield is safe. */
    function advanceFire(seconds) {
        const p = player(), status = fireStatus(), level = status.level;
        let uncookedFood = 0;
        for (const [id, state] of Object.entries(p.civ.actions)) {
            if (actionBase[id].resource === "food" && state.remaining > 0) {
                uncookedFood += state.reward / state.duration * Math.min(seconds, state.remaining);
            }
        }
        const needed = 0.2 * Math.pow(level - 1, 2) * uncookedFood / 30 * vesselDiscount() / fuelEfficiency();
        const available = p.civ.fire + status.gain * seconds / 60;
        const consumed = Math.min(available, needed);
        const fraction = needed > 0 ? consumed / needed : 1;
        for (const [id, state] of Object.entries(p.civ.actions)) {
            if (actionBase[id].resource === "food" && state.remaining > 0) {
                state.cookingBonus += state.reward / state.duration * Math.min(seconds, state.remaining) * (level - 1) * fraction * cookingBonusFactor();
            }
        }
        p.civ.fire = Math.max(0, Math.min(status.maximum, available - consumed));
    }
    function hearthBenefits() {
        const groups = owns("hearth") ? Math.floor(player().points.toNumber() / 10) : 0;
        const fill = Math.min(1, player().civ.fire / fireCapacity());
        return {foodStorage: groups * 25, foodProduction: groups * 4 * fill};
    }
    const storageCapacity = () => ({food: 50 + player().food.storage * 40 + hearthBenefits().foodStorage,
        water: (owns("jars") ? 100 : 50) + player().water.storage * (owns("jars") ? 120 : 40)});
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
            const foodManager = foodOrdersAvailable() && Object.values(p.civ.actions).some(action => action.repeat > 0) ? p.civ.overseers.food : 0;
            const hutManager = hutOrdersAvailable() && p.civ.hutRepeat > 0 ? p.civ.overseers.huts : 0;
            return labor.workers.food + labor.workers.water + labor.builders - labor.overseerWorkers + foodManager + hutManager + labor.fireTenders > p.points.toNumber() + 1e-9;
        };
        // Fire tending yields to survival crews after a Population loss.
        if (p.points.lte(2)) p.civ.fireTenders = 0;
        if (overbooked()) p.civ.fireTenders = Math.max(0, p.civ.fireTenders - Math.ceil(occupiedWorkers().laborUsed - p.points.toNumber()));
        let paused = false, overseerStopped = false, foremanStopped = false;
        if (overbooked() && p.civ.project && p.civ.projectWorkers) {
            p.civ.projectWorkers = 0;
            paused = true;
        }
        if ((overbooked() || p.points.lte(2)) && foodOrdersAvailable() && Object.values(p.civ.actions).some(action => action.repeat > 0)) {
            for (const id of ["gather", "hunt", "fish", "farm"]) p.civ.actions[id].repeat = 0;
            overseerStopped = true;
        }
        if ((overbooked() || p.points.lte(2)) && p.civ.hutRepeat > 0) {
            p.civ.hutRepeat = 0;
            foremanStopped = true;
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
            Object.assign(p.civ.actions[id], {remaining: 0, duration: 0, workers: 0, reward: 0, cookingBonus: 0, jobs: 0});
            returned.push(actionNames[id]);
        }
        return {returned, paused, overseerStopped, foremanStopped};
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
                (released.overseerStopped ? " Food repeat orders switched off to release the Overseer." : "") +
                (released.foremanStopped ? " Hut repeat orders switched off to release the foreman." : "") +
                (released.returned.length ? " Returned crews: " + released.returned.join(", ") + "." : "");
        }
        if (p.points.lte(1)) state.elapsed = Math.min(state.elapsed, shortageStatus().interval);
    }
    function resumeConstruction() {
        const p = player();
        if (p.civ.project && !p.civ.projectWorkers && !shortageStatus().active && occupiedWorkers().availableWorkers >= p.civ.projectJobs) p.civ.projectWorkers = p.civ.projectJobs;
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
        if (base.resource === "food" && owns("autonomousFood")) workers = 0;
        const unlocked = id === "hunt" ? featureAvailable("hunting") : id === "fish" ? featureAvailable("fishing") : id !== "farm" || owns("farming");
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
        if (id === "farm" && owns("sickles")) duration *= 0.75;
        duration *= crewSpeed;
        const irrigationBonus = id === "farm" && p.civ.irrigation > 0 ? 1.35 : 1;
        const expeditionMultiplier = base.resource === "food" && owns("extendedExpeditions") ? p.civ.expeditionMultipliers[id] : 1;
        duration *= expeditionMultiplier;
        const toolBonus = id === "gather" && owns("digging") ? 1.25 : id === "hunt" && owns("butchery") ? 1.5 : 1;
        const reward = base.reward * expeditionMultiplier * toolBonus * yieldMultiplier * knowledgeEffect() * irrigationBonus *
            (base.resource === "food" ? 1 + p.food.sites * 0.15 : 1);
        return {id, name: actionNames[id], ...base, workers, duration, reward, level, unlocked,
            automatic: false,
            repeatAvailable: base.resource === "food" && foodOrdersAvailable() && unlocked,
            repeatCap: repeatCap("food"), expeditionMultiplier, extendedAvailable: base.resource === "food" && owns("extendedExpeditions"),
            repeatCanSet: state.repeat > 0 || occupiedWorkers().overseerWorkers > 0 || (occupiedWorkers().availableWorkers >= p.civ.overseers.food && p.points.gt(p.civ.overseers.food)),
            active: state.remaining > 0, remaining: state.remaining, crew: state.workers,
            progress: state.duration ? 1 - state.remaining / state.duration : 0,
            runningReward: state.reward + state.cookingBonus, cookingMultiplier: base.resource === "food" ? fireStatus().cookingMultiplier : 1, jobs: state.jobs, repeat: state.repeat, completed: state.completed};
    }
    /** Old saves can contain orders paused by spending, with their former
     * managers reassigned to paid work. Reserve managers as crews return. */
    function orderStaffing(data) {
        if (data.organization.best.max(data.organization.points).lt(3)) return {food: 0, huts: 0};
        let spare = data.points.toNumber() - (data.civ.project ? data.civ.projectWorkers : 0) - data.civ.fireTenders;
        for (const action of Object.values(data.civ.actions)) spare -= action.workers;
        const food = Object.values(data.civ.actions).some(action => action.repeat > 0) && spare >= data.civ.overseers.food ? data.civ.overseers.food : 0;
        spare -= food;
        const huts = data.civ.hutRepeat > 0 && spare >= data.civ.overseers.huts ? data.civ.overseers.huts : 0;
        return {food, huts};
    }
    function occupiedWorkers() {
        const p = player();
        const staffing = orderStaffing(p);
        const overseerWorkers = staffing.food;
        const foremanWorkers = staffing.huts;
        const workers = {food: overseerWorkers, water: 0};
        for (const [id, action] of Object.entries(p.civ.actions)) {
            if (action.remaining > 0) workers[actionBase[id].resource] += action.workers;
        }
        const builders = p.civ.project ? p.civ.projectWorkers : 0;
        const fireTenders = fireAvailable() ? p.civ.fireTenders : 0;
        const laborUsed = workers.food + workers.water + builders + foremanWorkers + fireTenders;
        const spare = Math.max(0, p.points.toNumber() - laborUsed);
        return {workers, overseerWorkers, foremanWorkers, builders, fireTenders, laborUsed, spare, availableWorkers: Math.floor(spare + 1e-9)};
    }
    function canDispatch(id) {
        const action = actionDefinition(id);
        return !!action && action.unlocked && !action.active && !action.automatic && occupiedWorkers().availableWorkers >= action.workers;
    }
    function dispatch(id, requestedJobs = 1) {
        if (!Number.isInteger(requestedJobs) || requestedJobs < 1 || requestedJobs > 5 ||
            (requestedJobs > 1 && (id === "water" || !foodOrdersAvailable())) || !canDispatch(id)) return false;
        const definition = actionDefinition(id), state = player().civ.actions[id];
        const jobs = definition.workers ? Math.min(requestedJobs, Math.floor(occupiedWorkers().availableWorkers / definition.workers)) : requestedJobs;
        state.cookingBonus = 0;
        state.remaining = definition.duration;
        state.duration = definition.duration;
        state.jobs = jobs;
        state.workers = definition.workers * jobs;
        state.reward = definition.reward * jobs;
        player().civ.message = definition.name + ": " + jobs + " jobs started. " + state.workers + " workers reserved until completion.";
        return true;
    }
    function recall(id) {
        if (!actionBase[id] || !player().civ.actions[id].remaining) return false;
        const state = player().civ.actions[id];
        Object.assign(state, {remaining: 0, duration: 0, workers: 0, reward: 0, cookingBonus: 0, jobs: 0, repeat: 0});
        player().civ.message = actionNames[id] + " recalled. Workers are available; unfinished yield is lost.";
        return true;
    }
    function setRepeat(id, jobs) {
        const action = actionDefinition(id);
        if (!action || !Number.isInteger(jobs) || jobs < 0 || jobs > repeatCap("food") || id === "water") return false;
        if (jobs > 0 && (!action.repeatAvailable || !action.repeatCanSet)) return false;
        player().civ.actions[id].repeat = jobs;
        return true;
    }
    function setHutRepeat(jobs) {
        if (!Number.isInteger(jobs) || jobs < 0 || jobs > repeatCap("huts")) return false;
        if (jobs > 0 && (!hutOrdersAvailable() || player().points.lte(player().civ.overseers.huts) || (!player().civ.hutRepeat && occupiedWorkers().availableWorkers < player().civ.overseers.huts))) return false;
        player().civ.hutRepeat = jobs;
        return true;
    }
    function setExpeditionMultiplier(id, multiplier) {
        if (!owns("extendedExpeditions") || !Object.hasOwn(player().civ.expeditionMultipliers, id) ||
            !Number.isInteger(multiplier) || multiplier < 1 || multiplier > 5 || !actionDefinition(id).unlocked) return false;
        player().civ.expeditionMultipliers[id] = multiplier;
        return true;
    }
    function setOverseers(kind, workers) {
        if (!["food", "huts"].includes(kind) || !Number.isInteger(workers) || workers < 1 || workers > 5 ||
            (workers > 1 && !owns("workRosters")) || !(kind === "food" ? foodOrdersAvailable() : hutOrdersAvailable())) return false;
        const civ = player().civ;
        const repeats = kind === "food" ? Object.values(civ.actions).map(action => action.repeat) : [civ.hutRepeat];
        // Never discard already queued orders when reducing staffing.
        if (repeats.some(value => value > workers * 5)) return false;
        const occupied = kind === "food" ? occupiedWorkers().overseerWorkers : occupiedWorkers().foremanWorkers;
        if (occupied && workers - occupied > occupiedWorkers().availableWorkers) return false;
        civ.overseers[kind] = workers;
        return true;
    }
    /** A bounded smoothstep, with an independently tunable input exponent. */
    function abundanceCurve(value, threshold, full, exponent) {
        if (full <= threshold) return 0;
        const normalized = Math.max(0, Math.min(1, (value - threshold) / (full - threshold)));
        const shaped = Math.pow(normalized, exponent);
        return shaped * shaped * (3 - 2 * shaped);
    }
    function growthAbundance(population, demand, storage) {
        const enabled = owns("abundance");
        function supplyBonus(id) {
            const curve = growthSettings[id];
            const threshold = demand * curve.reserveSeconds / 60;
            const full = threshold + (storage[id] - threshold) * curve.fullSurplusFraction;
            return {bonus: enabled ? curve.maxBonus * abundanceCurve(amount(id), threshold, full, curve.exponent) : 0,
                threshold, full, maxBonus: curve.maxBonus, thresholdSeconds: curve.reserveSeconds,
                coverageSeconds: demand > 0 ? amount(id) / demand * 60 : Infinity};
        }
        const food = supplyBonus("food"), water = supplyBonus("water");
        const curve = growthSettings.shelter;
        const freePlaces = Math.max(0, housing() - population);
        const fillSeconds = Math.max(0, freePlaces - player().civ.growth) * growthSettings.secondsPerPerson;
        const shelter = {bonus: enabled ? curve.maxBonus * abundanceCurve(fillSeconds, curve.thresholdSeconds, curve.fullSeconds, curve.exponent) : 0,
            freePlaces, fillSeconds, maxBonus: curve.maxBonus, thresholdSeconds: curve.thresholdSeconds, fullSeconds: curve.fullSeconds};
        return {enabled, food, water, shelter, multiplier: 1 + food.bonus + water.bonus + shelter.bonus,
            maximumMultiplier: 1 + growthSettings.food.maxBonus + growthSettings.water.maxBonus + curve.maxBonus,
            secondsPerPerson: growthSettings.secondsPerPerson};
    }
    /** One derived ledger owns current upkeep, labor and abundance inputs. */
    function supply() {
        const p = player(), population = p.points.toNumber(), labor = occupiedWorkers();
        const upkeep = personUpkeep();
        const demand = population * upkeep, storage = storageCapacity();
        const hearth = hearthBenefits();
        const passiveProduction = {food: hearth.foodProduction, water: owns("gravity") ? waterFlow() : 0};
        const production = {...passiveProduction};
        const fire = fireStatus();
        for (const [id, state] of Object.entries(p.civ.actions)) {
            if (state.remaining > 0) production[actionBase[id].resource] += state.reward / state.duration * 60 * (actionBase[id].resource === "food" ? fire.cookingMultiplier : 1);
        }
        const reserve = Math.max(3, (population + 1) * upkeep * 0.25);
        let bottleneck = "Growing";
        if (population >= housing()) bottleneck = "Shelter";
        else if (p.food.points.lt(reserve)) bottleneck = "Food reserves";
        else if (p.water.points.lt(reserve)) bottleneck = "Water reserves";
        return {population, upkeep, demand, ...labor, fire, production, passiveProduction, hearth, storage, reserve, bottleneck,
            abundance: growthAbundance(population, demand, storage),
            growing: bottleneck === "Growing", support: housing(), capacity: production,
            efficiency: {food: 3 * knowledgeEffect(), water: 3.2 * knowledgeEffect()},
            idle: labor.spare, laborUsed: labor.laborUsed};
    }
    function projects(id, includeLocked = false) {
        const p = player(), work = (base, level) => base * Math.pow(1.35, level);
        if (!includeLocked && ["food", "water"].includes(id) && !featureAvailable("buyables")) return [];
        if (id === "fire") return includeLocked || fireAvailable() && owns("crafting") ? Object.entries(fireProjectDefinitions)
            .filter(([kind]) => includeLocked || kind !== "charcoal" || owns("clay"))
            .map(([kind, item]) => ({...item, id: "fire-" + kind, name: item.name + " · Level " + p.civ.fireBuyables[kind], work: work(item.baseWork, p.civ.fireBuyables[kind])})) : [];
        if (id === "food") return [
            {id: "gather-tools", name: buyableNames["gather-tools"],
                description: "Exploration level " + p.food.routes.gather + ": reach richer ground. Each level multiplies trip time by 1.2 and yield by 1.5; crew unchanged.", work: work(14, p.food.routes.gather)},
            {id: "hunt-tools", name: buyableNames["hunt-tools"],
                description: "Bigger-game level " + p.food.routes.hunt + ": each level multiplies the crew by 1.5, rounded up, and yield by 2; trip time unchanged. Craft equipment replaces Organization-level requirements.", work: 14},
            {id: "fish-tools", name: buyableNames["fish-tools"], craftCost: Math.pow(2, p.food.routes.fish),
                description: "River trap level " + p.food.routes.fish + ": each level doubles the catch with the same crew and trip time. Costs " + Math.pow(2, p.food.routes.fish) + " Craft, paid when construction starts.", work: 14},
            ...(owns("farming") ? [{id: "farm-tools", name: buyableNames["farm-tools"],
                description: "Route level " + p.food.routes.farm + ": +35% base yield and faster trips per level.", work: work(14, p.food.routes.farm)}] : []),
            {id: "food-site", name: "Improve provisioning", description: "+15% base yield for every Food route.", work: work(18, p.food.sites)},
            {id: "food-storage", name: "Weave food baskets", craftCost: 1, description: "+40 Food storage. Costs 1 Craft per basket, paid when construction starts.", work: work(12, p.food.storage)},
        ];
        if (id === "water") return [
            {id: "water-site", name: "Improve the well", description: "Improve manual collection; +1 upkeep-equivalent Water/min from the spring.", work: work(16, p.water.sites)},
            {id: "water-storage", name: owns("jars") ? "Earthenware jars" : "Woven baskets", craftCost: owns("jars") ? 2 : 1, fireCost: owns("jars") ? 0.5 * Math.pow(1.5, p.water.storage) / fuelEfficiency() : 0,
                description: (owns("jars") ? "Upgrade woven baskets with fired clay. +" : "Tightly woven Water baskets. +") + (owns("jars") ? 120 : 40) + " Water storage. Costs " + (owns("jars") ? 2 : 1) + " Craft" + (owns("jars") ? " and " + (0.5 * Math.pow(1.5, p.water.storage) / fuelEfficiency()).toFixed(3) + " Fire" : "") + ", paid when construction starts.", work: work(12, p.water.storage)},
        ];
        if (id === "shelter" && (includeLocked || featureAvailable("huts"))) return [
            {id: "shelter-home", name: "Build a new hut", description: "+" + housingPerHut(p.civ.improvements) + " housing. Owned: " + p.shelter.homes + ".", work: 16 * Math.pow(owns("lashings") ? 1.25 : 1.35, p.shelter.homes) * (p.civ.preparedHut && p.civ.project === "shelter-home" ? 0.75 : 1)},
        ];
        return [];
    }
    function projectDefinition(id) {
        const project = ["food", "water", "shelter", "fire"].flatMap(resource => projects(resource, true)).find(item => item.id === id);
        if (project && id === "shelter-home" && player().civ.project === id) {
            let work = 0;
            for (let job = 0; job < player().civ.projectJobs; job++) work += project.work * Math.pow(owns("lashings") ? 1.25 : 1.35, job);
            return {...project, work, name: player().civ.projectJobs + " hut-building jobs"};
        }
        return project;
    }
    function canStartProject(id) {
        const project = projectDefinition(id);
        const prefix = id.split("-")[0];
        const resource = Object.hasOwn(actionBase, prefix) ? actionBase[prefix].resource : prefix;
        return !!project && projects(resource).some(item => item.id === id) && !player().civ.project && occupiedWorkers().availableWorkers >= 1 &&
            amount("organization") >= (project.organizationRequired || 0) &&
            player().craft.points.gte(project.craftCost || 0) && player().civ.fire >= (project.fireCost || 0);
    }
    function startProject(id, requestedJobs = 1, supervised = false) {
        const p = player();
        if (!Number.isInteger(requestedJobs) || requestedJobs < 1 || requestedJobs > 5 ||
            (requestedJobs > 1 && (id !== "shelter-home" || !hutOrdersAvailable())) || !canStartProject(id)) return false;
        if (supervised && (id !== "shelter-home" || !hutOrdersAvailable() || !p.civ.hutRepeat)) return false;
        const project = projectDefinition(id);
        const jobs = Math.min(requestedJobs, occupiedWorkers().availableWorkers);
        if (project.fireCost) p.civ.fire -= project.fireCost;
        if (project.craftCost) p.craft.points = p.craft.points.sub(project.craftCost);
        p.civ.preparedHut = id === "shelter-home" && supervised && owns("preparedMaterials");
        p.civ.project = id;
        p.civ.projectWork = 0;
        p.civ.projectJobs = jobs;
        p.civ.projectWorkers = jobs;
        p.civ.message = project.name + " started. " + jobs + " builders reserved until completion." + (project.craftCost ? " Spent " + project.craftCost + " Craft; canceling will not refund it." : "") + (project.fireCost ? " Spent " + project.fireCost + " Fire; canceling will not refund it." : "");
        return true;
    }
    function cancelProject() {
        player().civ.project = "";
        player().civ.preparedHut = false;
        player().civ.projectWork = 0;
        player().civ.projectWorkers = 1;
        player().civ.projectJobs = 1;
        player().civ.message = "Construction canceled. Builder released; any Craft or Fire spent is not refunded.";
    }
    function completeProject(id) {
        const name = projectDefinition(id).name, [resource, kind] = id.split("-");
        if (resource === "fire") player().civ.fireBuyables[kind]++;
        else if (kind === "tools") player().food.routes[resource]++;
        else if (kind === "home") {
            player().shelter.homes += player().civ.projectJobs;
            updateHousing();
        } else if (kind === "site") player()[resource].sites++;
        else player()[resource].storage++;
        player().civ.project = "";
        player().civ.preparedHut = false;
        player().civ.projectWork = 0;
        player().civ.projectWorkers = 1;
        player().civ.projectJobs = 1;
        player().civ.message = name + " completed. Builder available.";
    }
    const costAmount = resource => resource === "fire" ? player().civ.fire : amount(resource);
    function spendCost(resource, cost) {
        if (resource === "fire") player().civ.fire -= cost;
        else player()[resource].points = player()[resource].points.sub(cost);
    }
    function upgradeRequirementMet(id) {
        const row = materialFor(id);
        if (row && !owns(row.id)) return false;
        if (id === "jars" && (!fireAvailable() || player().water.storage < 1)) return false;
        if (id === "bricks" && !owns("roofs")) return false;
        if (id === "clayPots" && !owns("cooking")) return false;
        if (id === "copperPots" && !owns("clayPots")) return false;
        if (id === "pipes" && !fireAvailable()) return false;
        if (id === "sickles" && !owns("farming")) return false;
        return amount("organization") >= upgradeRequirement(id);
    }
    function upgradeView(id) {
        const item = improvementDefinitions[id];
        const available = owns(id) || (upgradeRequirementMet(id) && Object.keys(item.costs).every(resourceAvailable));
        const superseded = id === "roofs" && owns("bricks") || id === "clayPots" && owns("copperPots");
        const prerequisite = id === "jars" ? "Needs a completed Water basket and Fire." : id === "bricks" ? "Needs Thatched roofs." :
            id === "copperPots" ? "Needs Clay cooking pots." : id === "clayPots" ? "Needs Cooking." : id === "sickles" ? "Needs Farming." : "Needs its material capability.";
        const currentItem = id === "roofs" && owns("bricks") ? improvementDefinitions.bricks : id === "clayPots" && owns("copperPots") ? improvementDefinitions.copperPots : item;
        return {id, ...item, name: currentItem.name, description: currentItem.description, available, organizationRequired: upgradeRequirement(id), owned: owns(id), superseded,
            requirement: available ? "" : prerequisite,
            canBuy: available && !owns(id) && Object.entries(item.costs).every(([key, cost]) => costAmount(key) >= cost),
            costText: Object.entries(item.costs).map(([key, cost]) => cost + " " + (key === "fire" ? "Fire" : names[key])).join(" · ") || "Free"};
    }
    function materialRows() {
        return materialDefinitions.map(row => ({...upgradeView(row.id), items: owns(row.id) ? row.items.map(id => {
            if (id !== "water-storage") return {...upgradeView(id), kind: "upgrade"};
            const project = projects("water").find(item => item.id === id);
            return {...project, kind: "project", canBuy: canStartProject(id), owned: false, level: player().water.storage,
                costText: project.craftCost + " Craft" + (project.fireCost ? " + " + project.fireCost.toFixed(3) + " Fire" : ""),
                requirement: "Construction uses one builder."};
        }) : []}));
    }
    function upgrades(resource) {
        return Object.entries(improvementDefinitions).filter(([id, item]) => item.resource === resource && !materialItem(id) && !["overseer", "hutForeman"].includes(id))
            .map(([id]) => upgradeView(id)).filter(item => item.available).sort((a, b) => a.organizationRequired - b.organizationRequired);
    }
    function buyUpgrade(id) {
        if (!Object.hasOwn(improvementDefinitions, id) || ["overseer", "hutForeman"].includes(id)) return false;
        const upgrade = upgradeView(id);
        if (!upgrade.canBuy) return false;
        player().organization.best = player().organization.best.max(player().organization.points);
        for (const [resource, cost] of Object.entries(upgrade.costs)) spendCost(resource, cost);
        player().civ.improvements[id] = true;
        if (["joinery", "roofs", "bricks"].includes(id)) updateHousing();
        player().civ.message = upgrade.name + " purchased. Existing equipment counts and paid work were kept.";
        return true;
    }
    function irrigate() {
        const p = player(), reserve = supply().reserve;
        if (organizationProgress() < 9 || !owns("farming") || p.civ.irrigation > 0 || p.water.points.lt(20 + reserve)) return false;
        p.water.points = p.water.points.sub(20);
        p.civ.irrigation = 45;
        p.civ.message = "Irrigation: new Farming cycles gain 35% yield for 45 seconds.";
        return true;
    }
    function chooseAutomaticProject() {
        const p = player();
        // Hut automation belongs exclusively to its finite repeat queue.
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
            addResource(resource, Math.min(state.reward + state.cookingBonus, Math.max(0, storage[resource] - amount(resource))));
            state.completed += state.jobs;
            Object.assign(state, {duration: 0, workers: 0, reward: 0, cookingBonus: 0, jobs: 0});
            p.civ.message = actionNames[id] + " completed. Crew returned; yield stored up to capacity.";
        }
    }
    function automaticOrders() {
        const p = player();
        if (p.civ.autoIrrigate && owns("sluice")) irrigate();
        // Construction reserves its builder before Food takes remaining workers.
        if (p.civ.hutRepeat > 0 && occupiedWorkers().foremanWorkers > 0 && !p.civ.project && !shortageStatus().active && startProject("shelter-home", 1, true)) p.civ.hutRepeat--;
        if (p.civ.autoBuild && autoBuildingAvailable() && !p.civ.project && !shortageStatus().active) chooseAutomaticProject();
        if (!foodOrdersAvailable() || !occupiedWorkers().overseerWorkers) return;
        const order = p.civ.priority === "food" ? ["farm", "hunt", "fish", "gather"] : ["gather", "fish", "hunt", "farm"];
        // Consume a queued repeat only after its single job actually starts.
        // Busy routes, full stores and unavailable crews leave the count intact.
        for (const id of order) {
            const action = p.civ.actions[id];
            if (action.repeat > 0 && amount("food") < storageCapacity().food - 1 && dispatch(id)) action.repeat--;
        }
    }
    /** Spend only eligible growth time. Birth boundaries recheck the curves and
     * limits, so later tuning can exceed one person per simulation second. */
    function advanceGrowth(seconds) {
        const p = player();
        let remaining = seconds;
        while (remaining > 1e-9) {
            const growth = supply();
            if (!growth.growing) return;
            const rate = growth.abundance.multiplier / growthSettings.secondsPerPerson;
            const untilBirth = (1 - p.civ.growth) / rate;
            if (remaining + 1e-9 < untilBirth) {
                p.civ.growth += remaining * rate;
                return;
            }
            remaining = Math.max(0, remaining - untilBirth);
            p.points = p.points.add(1);
            p.civ.growth = 0;
            p.civ.message = "Your population has grown to " + p.points.toString() + ".";
        }
    }
    function step(seconds) {
        const p = player();
        advanceFire(seconds);
        advanceActions(seconds);
        const before = supply(), minutes = seconds / 60;
        for (const id of ["food", "water"]) {
            const passive = before.passiveProduction[id];
            if (passive) addResource(id, Math.min(passive * minutes, Math.max(0, before.storage[id] - amount(id))));
            p[id].points = p[id].points.sub(before.demand * minutes).max(0);
        }
        advanceShortage(seconds);
        if (p.civ.project && p.civ.projectWorkers) {
            p.civ.projectWork += seconds * p.civ.projectWorkers * (1 + amount("organization") * 0.15) * (owns("builderTools") ? 2 : 1) * (p.civ.project === "shelter-home" && owns("copperAxes") ? 2 : 1);
            if (p.civ.projectWork >= projectDefinition(p.civ.project).work) completeProject(p.civ.project);
        }
        advanceGrowth(seconds);
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
        if (id === "organization") return player().points.gte(organizationPopulationRequirement()) ? 1 : 0;
        return 0;
    }
    function organizationPopulationRequirement() { return 8 + 4 * amount("organization"); }
    function prestigeRequirements(id) {
        return id === "craft" ? "12 Population gives 1 Craft, then +1 per 2 Population (14 gives 2, 16 gives 3)" : organizationPopulationRequirement() + " Population; gain exactly 1 Organization";
    }
    /** The same prospective plan drives the UI, confirmation and reset. An
     * Organization reward earned by this prestige protects its buyables now. */
    function prestigePreview(id) {
        const p = player(), gain = prestigeGain(id);
        const organizationTotal = amountTotal("organization") + (id === "organization" ? gain : 0);
        const organizationHeld = amount("organization") + (id === "organization" ? gain : 0);
        const kept = Object.fromEntries(Object.keys(buyableNames).map(buyable => [buyable, retention(buyable, organizationHeld)]));
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
        const reset = ["Population returns to " + startingSettlement.population, "Food and Water stores restart at " + startingSettlement.food + " each", "growth, irrigation and shortage countdown", "stored Fire resets to 0; Fire tenders released", "Food and hut repeat orders switch off; Overseer and foreman released"];
        const ownedResetBuyables = resetBuyables.filter(buyable => buyableLevel(buyable) > 0);
        reset.push(ownedResetBuyables.length ? "buyables: " + ownedResetBuyables.map(buyable => buyableNames[buyable]).join(", ") : "unprotected buyables (none currently owned)");
        if (!kept["shelter-home"] && p.shelter.homes > 0) reset.push("housing capacity returns to 8");
        if (resetConstruction) reset.push("current construction progress");
        if (recalledActions.length) reset.push(recalledActions.map(action => actionNames[action]).join(", ") + " trips return without yield");
        const keep = ["permanent upgrades", "Craft, Organization and later resources"];
        if (keptBuyables.length) keep.push("protected buyables: " + keptBuyables.map(buyable => buyableNames[buyable]).join(", "));
        if (p.civ.project && !resetConstruction) keep.push("current construction");
        return {gain, organizationTotal, organizationHeld, kept, resetBuyables, keptBuyables, resetConstruction, recalledActions, startingSettlement,
            resetText: reset.join("; "), keepText: keep.join("; ")};
    }
    function prestige(id) {
        const plan = prestigePreview(id), gain = plan.gain;
        if (!gain) return false;
        addResource(id, gain);
        player()[id].unlocked = true;
        const p = player();
        if (organizationProgress() >= 3) { p.civ.improvements.overseer = true; p.civ.improvements.hutForeman = true; }
        for (const buyable of plan.resetBuyables) resetBuyable(buyable);
        p.shelter.points = new Decimal(8 + p.shelter.homes * housingPerHut(p.civ.improvements));
        if (plan.resetConstruction) { p.civ.preparedHut = false; p.civ.project = ""; p.civ.projectWork = 0; p.civ.projectWorkers = 1; p.civ.projectJobs = 1; }
        for (const action of plan.recalledActions) Object.assign(p.civ.actions[action], {remaining: 0, duration: 0, workers: 0, reward: 0, cookingBonus: 0, jobs: 0});
        p.points = new Decimal(startingSettlement.population);
        player().food.points = new Decimal(startingSettlement.food);
        player().water.points = new Decimal(startingSettlement.water);
        p.civ.shortage = {elapsed: 0, losses: 0};
        for (const action of Object.values(p.civ.actions)) action.repeat = 0;
        p.civ.hutRepeat = 0;
        p.civ.fire = 0;
        p.civ.fireTenders = 0;
        player().civ.growth = 0;
        p.civ.irrigation = 0;
        player().civ.message = names[id] + " increased by " + gain + ". " + (plan.resetBuyables.length ? "Unprotected buyables reset. " : "All buyables retained. ") + "Earned Organization milestones stay unlocked. The next Population requirement uses current held Coordination.";
        return true;
    }
    function investments(id) {
        if (id === "education") return {money: 5 * Math.pow(1.6, amount(id)), freeTime: 2 * Math.pow(1.4, amount(id))};
        if (id === "culture") return {freeTime: 3 * Math.pow(1.4, amount(id)), craft: 1};
        return {};
    }
    function canInvest(id) {
        if (!["education", "culture"].includes(id) || !resourceAvailable(id) || !player()[id].unlocked) return false;
        return Object.entries(investments(id)).every(([resource, cost]) => costAmount(resource) >= cost);
    }
    function invest(id) {
        if (!canInvest(id)) return false;
        for (const [resource, cost] of Object.entries(investments(id))) player()[resource].points = player()[resource].points.sub(cost);
        addResource(id, 1);
        player().civ.message = id === "education" ? "Knowledge improves every worker's tools and techniques." : "Shared culture improves cooperation and reduces upkeep.";
        return true;
    }
    // Later resource unlocks are intentionally not part of this opening yet.
    const resourceAvailable = id => id === "fire" ? fireAvailable() : tier(id) <= 1;
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
            organizationMilestones: id === "organization" ? organizationMilestones() : [], organizationEarned: amountTotal("organization"), organizationHeld: amount("organization"),
            buyableRetention: buyableRetentionText(id),
            projects: projects(id).map(project => ({...project, canStart: canStartProject(project.id)})), upgrades: upgrades(id),
            actions: Object.keys(actionBase).filter(key => actionBase[key].resource === id && (actionDefinition(key).unlocked || player().civ.actions[key].remaining > 0)).map(key => ({...actionDefinition(key), canDispatch: canDispatch(key)})),
            costs: Object.entries(investments(id)).map(([resource, cost]) => ({name: names[resource], cost})), canInvest: canInvest(id)};
    }
    function summary() {
        const p = player(), s = supply(), project = projectDefinition(p.civ.project);
        const next = s.bottleneck.startsWith("Water") ? "water" : s.bottleneck.startsWith("Food") || s.bottleneck === "Production" ? "food" : "shelter";
        return {...s, fireUpgrades: upgrades("fire"), fireProjects: projects("fire").map(project => ({...project, canStart: canStartProject(project.id)})), materialRows: materialRows(), shortage: shortageStatus(), irrigation: p.civ.irrigation, autoIrrigateAvailable: owns("sluice"), hutRepeatAvailable: hutOrdersAvailable(), foodOrdersAvailable: foodOrdersAvailable(), foodOrdersPaused: !s.overseerWorkers && Object.values(p.civ.actions).some(action => action.repeat > 0), hutOrdersPaused: !s.foremanWorkers && p.civ.hutRepeat > 0, rostersAvailable: owns("workRosters"), hutRepeatCap: repeatCap("huts"), foodRepeatCap: repeatCap("food"), irrigationAvailable: organizationProgress() >= 9 && owns("farming"), housing: housing(), growth: p.civ.growth, nodes: Object.keys(names).filter(resourceAvailable).map(node),
            project: project ? {...project, jobs: p.civ.projectJobs, workers: p.civ.projectWorkers, paused: p.civ.projectWorkers === 0, progress: Math.min(1, p.civ.projectWork / project.work)} : null,
            next, advice: s.growing ? "Your supplies and housing support another person." :
                s.bottleneck.includes("reserves") ? "Restore supplies before the shortage countdown runs out." :
                    "Build housing to support the next person.",
            autoAvailable: autoBuildingAvailable()};
    }
    /** Convert historical action/upgrade records before typed hydration. Never
     * touch live state: the codec owns the detached candidate and atomic commit. */
    function migrateData(data) {
        const old = data.civ;
        if (old && Number(data.version || 0) < 0.9) {
            if (Object.hasOwn(old, "features") && (!old.features || typeof old.features !== "object" || Array.isArray(old.features) ||
                Object.values(old.features).some(value => typeof value !== "boolean"))) throw new Error("Invalid historical feature discoveries");
            if (!Object.hasOwn(old, "improvements")) old.improvements = {};
            const improvements = old.improvements;
            if (improvements && typeof improvements === "object" && !Array.isArray(improvements)) {
                if (Object.values(improvements).some(value => typeof value !== "boolean")) throw new Error("Invalid historical improvement");
                const broadAccess = !Object.hasOwn(old, "features") || old.features?.buyables || Number(data.organization?.points) >= 6;
                const ownsEquipment = ["jars", "hunting", "digging", "butchery"].some(id => improvements[id]) ||
                    Number(data.water?.storage) > 0 || Number(data.water?.sites) > 0 || Number(data.food?.storage) > 0 ||
                    (old.project && old.project !== "shelter-home");
                if (broadAccess || ownsEquipment) improvements.crafting = true;
                if (improvements.jars) { improvements.clay = true; improvements.crafting = true; }
                if (improvements.butchery) improvements.copper = true;
                if (old.features) old.features.hunting = Number(data.organization?.points) >= 2;
            }
            if (old.features && Object.hasOwn(old.features, "buyables")) old.features.buyables = false;
        }
        if (data.civ && !Object.hasOwn(data.civ, "features")) {
            data.civ.features = {huts: false, hunting: Number(data.organization?.points) >= 2, fishing: true, buyables: false};
        }
        if (Number(data.version || 0) >= 0.8) return;
        const civ = data.civ;
        if (!civ || typeof civ !== "object" || Array.isArray(civ)) return;
        const improvements = civ.improvements;
        for (const id of ["fishing", "wellLining"]) {
            if (improvements && Object.hasOwn(improvements, id)) {
                if (typeof improvements[id] !== "boolean") throw new Error("Invalid retired upgrade");
                delete improvements[id];
            }
        }
        if (Number(data.version || 0) >= 0.7) return;
        const waterRepeat = civ.actions?.water?.repeat === true;
        const oldKeeper = waterRepeat && improvements?.waterOrders && Number(data.version) >= 0.5 ? 1 : 0;
        if (waterRepeat && (!improvements?.waterOrders || improvements.gravity)) throw new Error("Invalid historical Water orders");
        if (improvements && Object.hasOwn(improvements, "waterOrders")) {
            if (typeof improvements.waterOrders !== "boolean") throw new Error("Invalid historical Water keeper");
            if (improvements.waterOrders) improvements.hutForeman = true;
            delete improvements.waterOrders;
        }
        if (!civ.actions || typeof civ.actions !== "object" || Array.isArray(civ.actions)) return;
        let crews = civ.project ? Number(civ.projectWorkers ?? 1) : 0;
        for (const [id, action] of Object.entries(civ.actions)) {
            if (!action || typeof action !== "object" || Array.isArray(action)) continue;
            crews += Number(action.workers || 0);
            if (typeof action.repeat === "boolean") {
                if (id !== "water" && action.repeat && !improvements?.overseer) throw new Error("Invalid historical repeat order");
                action.repeat = id !== "water" && action.repeat ? 1 : 0;
            }
            if (id === "water") action.repeat = 0;
            if (!Object.hasOwn(action, "jobs")) action.jobs = action.remaining > 0 ? 1 : 0;
        }
        if (crews + oldKeeper > Number(data.points)) throw new Error("Overcommitted historical workers");
        const repeating = ["gather", "hunt", "fish", "farm"].some(id => civ.actions[id]?.repeat > 0);
        if (repeating && Number(data.organization?.points) >= 3 && crews + 1 > Number(data.points)) {
            for (const id of ["gather", "hunt", "fish", "farm"]) if (civ.actions[id]) civ.actions[id].repeat = 0;
            civ.message = "Food repeat orders paused to make room for their dedicated Overseer. Existing crews and progress were kept.";
        }
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
        if (Object.keys(civ.fireBuyables).sort().join() !== "charcoal,fuel,hearths" || !Object.values(civ.fireBuyables).every(count)) throw new Error("Invalid Fire buyables");
        const imp = civ.improvements;
        if (civ.project.startsWith("fire-") && !imp.crafting) throw new Error("Construction material is locked");
        if ((civ.fireBuyables.charcoal > 0 || civ.project === "fire-charcoal") && !imp.clay) throw new Error("Charcoal material is locked");
        if (imp.bricks && !imp.roofs || imp.copperPots && !imp.clayPots || imp.clayPots && !imp.cooking) throw new Error("Invalid equipment tier");
        if (Number(data.version) >= 0.9 && ((imp.jars || imp.bricks || imp.clayPots || imp.pipes) && !imp.clay ||
            (imp.copperAxes || imp.butchery || imp.copperPots || imp.sickles) && !imp.copper ||
            (imp.roofs || imp.hunting || imp.digging || Object.values(civ.fireBuyables).some(value => value > 0)) && !imp.crafting)) throw new Error("Equipment material is locked");
        if (!finite(civ.fire) || civ.fire > 10 + 2 * data.shelter.homes + 10 * civ.fireBuyables.fuel || !count(civ.fireTenders) || civ.fireTenders > 5 ||
            !Number.isInteger(civ.cookingLevel) || civ.cookingLevel < 1 || civ.cookingLevel > 5 ||
            (!civ.improvements.cooking && civ.cookingLevel !== 1)) throw new Error("Invalid Fire state");
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
        // These 0.1 priorities belonged to continuous production. Current repeat
        // orders offer short-trip or large-harvest ordering only.
        if (["water", "shelter"].includes(civ.priority)) civ.priority = "balanced";
        if (Object.keys(civ.improvements).some(id => !Object.hasOwn(improvementDefinitions, id)) ||
            Object.values(civ.improvements).some(value => typeof value !== "boolean")) throw new Error("Invalid improvements");
        if (Object.keys(civ.features).sort().join() !== "buyables,fishing,hunting,huts" || Object.values(civ.features).some(value => typeof value !== "boolean")) throw new Error("Invalid feature discoveries");
        if (Object.keys(civ.overseers).sort().join() !== "food,huts" || Object.values(civ.overseers).some(value => !Number.isInteger(value) || value < 1 || value > (civ.improvements.workRosters ? 5 : 1))) throw new Error("Invalid overseer staffing");
        if (Object.keys(civ.expeditionMultipliers).sort().join() !== "farm,fish,gather,hunt" || Object.values(civ.expeditionMultipliers).some(value => !Number.isInteger(value) || value < 1 || value > (civ.improvements.extendedExpeditions ? 5 : 1))) throw new Error("Invalid expedition multiplier");
        if (typeof civ.preparedHut !== "boolean" || (civ.preparedHut && (civ.project !== "shelter-home" || !civ.improvements.preparedMaterials))) throw new Error("Invalid prepared construction");
        if (!count(data.shelter.homes) || !count(data.shelter.comfort) || !data.shelter.points.eq(8 + data.shelter.homes * housingPerHut(civ.improvements))) throw new Error("Invalid housing capacity");
        if (Object.keys(data.food.routes).sort().join() !== "farm,fish,gather,hunt" || !Object.values(data.food.routes).every(count)) throw new Error("Invalid Food routes");
        const projectIds = ["food-site", "food-storage", "water-site", "water-storage", "shelter-home", "gather-tools", "hunt-tools", "fish-tools", "farm-tools", "fire-fuel", "fire-hearths", "fire-charcoal"];
        if (!["balanced", "food"].includes(civ.priority) ||
            (civ.project !== "" && !projectIds.includes(civ.project)) || (civ.project === "farm-tools" && !civ.improvements.farming) ||
            !finite(civ.projectWork) || !count(civ.projectJobs) || civ.projectJobs < 1 || civ.projectJobs > 5 ||
            ![0, civ.projectJobs].includes(civ.projectWorkers) || (!civ.project && (civ.projectWorkers !== 1 || civ.projectJobs !== 1)) ||
            (civ.project !== "shelter-home" && civ.projectJobs !== 1) ||
            !count(civ.hutRepeat) || civ.hutRepeat > 5 * civ.overseers.huts || !finite(civ.growth) || civ.growth >= 1 ||
            !finite(civ.tickRemainder) || civ.tickRemainder >= 1 + 1e-8 || !finite(civ.irrigation) || civ.irrigation > 45) throw new Error("Invalid civilization progress");
        if (Object.keys(civ.actions).sort().join() !== "farm,fish,gather,hunt,water") throw new Error("Invalid action types");
        if (!count(civ.shortage.losses) || !finite(civ.shortage.elapsed) || civ.shortage.elapsed > 20) throw new Error("Invalid shortage countdown");
        let crews = civ.fireTenders + (civ.project ? civ.projectWorkers : 0);
        for (const [id, state] of Object.entries(civ.actions)) {
            if (![state.remaining, state.duration, state.reward, state.cookingBonus].every(finite) || state.cookingBonus > state.reward * (civ.improvements.copperPots ? 5 : 4) + 1e-8 || (state.cookingBonus > 0 && (!civ.improvements.cooking || id === "water")) || !count(state.workers) || !count(state.completed) ||
                !count(state.jobs) || state.jobs > (id === "water" ? 1 : 5) || (state.remaining > 0 && state.jobs < 1) ||
                state.workers > state.jobs * (id === "hunt" ? huntingCrew(actionBase.hunt.workers, data.food.routes.hunt) : actionBase[id].workers) || state.remaining > state.duration ||
                (state.remaining > 0 && state.workers === 0 && !(actionBase[id].resource === "food" && civ.improvements.autonomousFood)) ||
                (!state.remaining && (state.duration || state.workers || state.reward || state.cookingBonus || state.jobs)) ||
                (id === "farm" && state.remaining && !civ.improvements.farming) ||
                !count(state.repeat) || state.repeat > 5 * civ.overseers.food || (id === "water" && state.repeat !== 0) ||
                (state.repeat > 0 && id === "farm" && !civ.improvements.farming)) throw new Error("Invalid action state");
            crews += state.workers;
        }
        if (crews > data.points.toNumber() + 1e-9) throw new Error("Overcommitted workers");
    }
    return {startingSettlement, growthSettings, defaults, supply, summary, node, projects, canStartProject, startProject, cancelProject, advance, shortageStatus,
        materialRows, fireStatus, setFireTenders, setCookingLevel, actionDefinition, canDispatch, dispatch, recall, setRepeat, setHutRepeat, setOverseers, setExpeditionMultiplier, upgrades, buyUpgrade, irrigate,
        prestige, prestigeGain, prestigeRequirements, prestigePreview, organizationMilestones, organizationPopulationRequirement, investments, canInvest, invest, migrateData, validateData};
}
