/** One update owner advances the shared economy, never once per resource. */
function createResourceLayer(id, {modRules, saveState}) {
    const foundation = ["food", "water", "shelter"].includes(id);
    const row = foundation ? 0 : ["craft", "organization"].includes(id) ? 1 : ["money", "freeTime"].includes(id) ? 2 : 3;
    const starts = {food: modRules.civilization.startingSettlement.food, water: modRules.civilization.startingSettlement.water, shelter: 8};
    const layer = {
        name: id.charAt(0).toUpperCase() + id.slice(1), row, type: "none", layerShown: true,
        startData() {
            const data = {first: 0, unlocked: foundation, points: new Decimal(starts[id] || 0),
                best: new Decimal(starts[id] || 0), total: new Decimal(starts[id] || 0)};
            if (id === "food" || id === "water") { data.sites = 0; data.storage = 0; }
            if (id === "food") data.routes = {gather: 0, hunt: 0, farm: 0};
            if (id === "shelter") { data.homes = 0; data.comfort = 0; }
            return data;
        },
    };
    if (id === "food") layer.update = seconds => modRules.civilization.advance(Number(seconds));
    layer.effect = () => saveState.player[id].points;
    return layer;
}
