/** Session-owned civilization rules. All rates use game minutes; advancement
 * consumes seconds. Production, upkeep and construction share one labor budget.
 * No storage, DOM, clock or timer access belongs in this owner. */
function createCivilizationRules({ saveState }) {
    const names = {food: "Food", water: "Water", shelter: "Shelter", craft: "Craft",
        organization: "Organization", money: "Money", freeTime: "Time", education: "Education", culture: "Culture"};
    const descriptions = {
        food: "Gather, cultivate and store enough food for a growing population.",
        water: "Reliable water supports every person. More food cannot replace it.",
        shelter: "Build room for your next neighbors. Housing lasts through early prestige.",
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

    function defaults() {
        return {growth: 0, tickRemainder: 0, project: "", projectWork: 0,
            priority: "balanced", autoBuild: false, message: "Your first five people are gathering supplies."};
    }

    /** Evaluate supply and allocation without mutating persistent state. */
    function supply() {
        const p = player(), population = p.points.toNumber();
        const knowledge = amount("education"), culture = amount("culture");
        const toolEffect = 1 + amount("craft") * 0.18 + knowledge * 0.12;
        const upkeep = 1 / (1 + amount("organization") * 0.06 + culture * 0.04);
        const efficiency = {food: 3 * toolEffect, water: 3.2 * toolEffect};
        const capacity = {food: (8 + p.food.sites * 5) * toolEffect,
            water: (8 + p.water.sites * 5) * toolEffect};
        const demand = population * upkeep;
        const needed = demand / efficiency.food + demand / efficiency.water;
        const coverage = Math.min(1, population / Math.max(needed, 0.001));
        const workers = {food: demand / efficiency.food * coverage, water: demand / efficiency.water * coverage};
        let spare = Math.max(0, population - workers.food - workers.water);
        const builders = p.civ.project ? spare * (p.civ.priority === "shelter" ? 0.8 : 0.45) : 0;
        spare -= builders;
        const storage = {food: 50 + p.food.storage * 40, water: 50 + p.water.storage * 40};
        const order = p.civ.priority === "water" ? ["water", "food"] : ["food", "water"];
        // Reserve equal discretionary shares in Balanced, within site throughput.
        const discretionary = spare;
        for (const id of order) {
            const focused = ["food", "water"].includes(p.civ.priority);
            const share = focused ? (p.civ.priority === id ? 0.8 : 0.2) : 0.5;
            const extra = p[id].points.lt(storage[id]) ? Math.min(spare, discretionary * share,
                Math.max(0, capacity[id] / efficiency[id] - workers[id])) : 0;
            workers[id] += extra;
            spare -= extra;
        }
        const production = {food: Math.min(capacity.food, workers.food * efficiency.food),
            water: Math.min(capacity.water, workers.water * efficiency.water)};
        const support = Math.floor(Math.min(housing(), capacity.food / upkeep,
            capacity.water / upkeep) + 1e-9);
        const reserve = Math.max(3, (population + 1) * upkeep * 0.25);
        let bottleneck = "Growing";
        if (population >= housing()) bottleneck = "Shelter";
        else if (population + 1 > capacity.food / upkeep + 1e-9) bottleneck = "Food";
        else if (population + 1 > capacity.water / upkeep + 1e-9) bottleneck = "Water";
        else if (coverage < 1) bottleneck = "Production";
        else if (p.food.points.lt(reserve)) bottleneck = "Food reserves";
        else if (p.water.points.lt(reserve)) bottleneck = "Water reserves";
        const moneyWorkers = p.money.unlocked ? spare * 0.5 : 0;
        const timeWorkers = p.freeTime.unlocked ? spare - moneyWorkers : 0;
        return {population, upkeep, demand, workers, builders, idle: spare - moneyWorkers - timeWorkers,
            moneyWorkers, timeWorkers, efficiency, capacity, production, storage, support, reserve,
            bottleneck, growing: bottleneck === "Growing", laborUsed: workers.food + workers.water + builders + moneyWorkers + timeWorkers};
    }

    function projects(id) {
        const p = player();
        if (id === "food" || id === "water") return [
            {id: id + "-site", name: id === "food" ? "Expand gathering grounds" : "Improve water collection",
                description: "+5 base supply per minute. Uses shared labor; no stockpile cost.",
                work: 10 * Math.pow(1.35, p[id].sites)},
            {id: id + "-storage", name: id === "food" ? "Weave food baskets" : "Build water containers",
                description: "+40 storage. Uses shared labor; no stockpile cost.",
                work: 8 * Math.pow(1.35, p[id].storage)},
        ];
        if (id === "shelter") return [{id: "shelter-home", name: "Build a new hut",
            description: "+4 housing capacity. People and housing survive early prestige.",
            work: 14 * Math.pow(1.3, p.shelter.homes)}];
        return [];
    }
    function projectDefinition(id) {
        return ["food", "water", "shelter"].flatMap(projects).find(item => item.id === id);
    }
    function startProject(id) {
        if (player().civ.project || !projectDefinition(id)) return false;
        player().civ.project = id;
        player().civ.projectWork = 0;
        player().civ.message = projectDefinition(id).name + " started.";
        return true;
    }
    function cancelProject() {
        player().civ.project = "";
        player().civ.projectWork = 0;
        player().civ.message = "Construction canceled. No resources were spent.";
    }
    function completeProject(id) {
        const [resource, kind] = id.split("-");
        if (kind === "home") { player().shelter.homes++; player().shelter.points = player().shelter.points.add(4); }
        else if (kind === "site") player()[resource].sites++;
        else player()[resource].storage++;
        player().civ.message = projectDefinition(id).name + " completed.";
        player().civ.project = "";
        player().civ.projectWork = 0;
    }
    function chooseAutomaticProject() {
        const s = supply();
        const target = s.bottleneck.startsWith("Water") ? "water-site" :
            s.bottleneck.startsWith("Food") ? "food-site" : "shelter-home";
        startProject(target);
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
    function step(seconds) {
        const p = player(), s = supply(), minutes = seconds / 60;
        for (const id of ["food", "water"]) {
            p[id].points = p[id].points.add((s.production[id] - s.demand) * minutes).max(0).min(s.storage[id]);
        }
        if (p.civ.project) {
            p.civ.projectWork += s.builders * 60 * (1 + amount("organization") * 0.15) * minutes;
            if (p.civ.projectWork >= projectDefinition(p.civ.project).work) completeProject(p.civ.project);
        }
        const after = supply();
        if (after.growing) {
            p.civ.growth += seconds / 12;
            if (p.civ.growth >= 1) {
                p.points = p.points.add(1);
                p.civ.growth -= 1;
                p.civ.message = "Your population has grown to " + p.points.toString() + ".";
            }
        }
        if (p.money.unlocked) addResource("money", s.moneyWorkers * 2 * (1 + amount("craft") * 0.15) * minutes);
        if (p.freeTime.unlocked) addResource("freeTime", s.timeWorkers * minutes);
        unlock();
        if (p.civ.autoBuild && p.organization.points.gte(2) && !p.civ.project) chooseAutomaticProject();
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
    function prestige(id) {
        const gain = prestigeGain(id);
        if (!gain) return false;
        addResource(id, gain);
        player()[id].unlocked = true;
        player().food.points = new Decimal(0);
        player().water.points = new Decimal(0);
        player().civ.growth = 0;
        player().civ.message = names[id] + " increased by " + gain + ". Supplies are rebuilding; people and infrastructure remain.";
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
            canPrestige: prestigeGain(id) > 0, prestigeGain: prestigeGain(id), projects: projects(id),
            costs: Object.entries(investments(id)).map(([resource, cost]) => ({name: names[resource], cost})), canInvest: canInvest(id)};
    }
    function summary() {
        const p = player(), s = supply(), project = projectDefinition(p.civ.project);
        const next = s.bottleneck.startsWith("Water") ? "water" : s.bottleneck.startsWith("Food") || s.bottleneck === "Production" ? "food" : "shelter";
        return {...s, housing: housing(), growth: p.civ.growth, nodes: Object.keys(names).map(node),
            project: project ? {...project, progress: Math.min(1, p.civ.projectWork / project.work)} : null,
            next, advice: s.growing ? "Your supplies and housing support another person." :
                s.bottleneck.includes("reserves") ? "Build a small supply buffer. Your existing population keeps working." :
                    "Improve " + s.bottleneck.toLowerCase() + " to support the next person.",
            toolBonus: (1 + amount("craft") * 0.18 + amount("education") * 0.12),
            autoAvailable: p.organization.points.gte(2)};
    }
    /** Content validation runs at the existing codec boundary before activation. */
    function validateData(data) {
        const validCount = value => Number.isSafeInteger(value) && value >= 0;
        if (!Object.hasOwn(names, data.tab)) throw new Error("Invalid civilization resource selection");
        if (!Number.isSafeInteger(data.points.toNumber()) || data.points.lt(1)) throw new Error("Invalid Population count");
        for (const id of Object.keys(names)) {
            if (data[id].points.lt(0) || data[id].best.lt(0) || data[id].total.lt(0)) throw new Error("Negative " + names[id]);
        }
        for (const id of ["food", "water"]) {
            if (!validCount(data[id].sites) || !validCount(data[id].storage)) throw new Error("Invalid supply infrastructure");
        }
        if (!validCount(data.shelter.homes) || !data.shelter.points.eq(8 + data.shelter.homes * 4)) throw new Error("Invalid housing capacity");
        const civ = data.civ;
        const projectIds = ["food-site", "food-storage", "water-site", "water-storage", "shelter-home"];
        if (!["balanced", "food", "water", "shelter"].includes(civ.priority) ||
            (civ.project !== "" && !projectIds.includes(civ.project)) || civ.projectWork < 0 ||
            civ.growth < 0 || civ.growth >= 1 || civ.tickRemainder < 0 || civ.tickRemainder >= 1 + 1e-8) throw new Error("Invalid civilization progress");
    }
    return {defaults, supply, summary, node, projects, startProject, cancelProject, advance,
        prestige, prestigeGain, prestigeRequirements, investments, canInvest, invest, validateData};
}
