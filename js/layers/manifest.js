const gameLayerManifest = Object.freeze([
    "food", "water", "shelter", "craft", "organization", "money", "freeTime", "education", "culture",
].map(id => Object.freeze({id, create: ports => createResourceLayer(id, ports)})));
function registerGameLayers(registry, ports) {
    if (Object.hasOwn(registry.layers, "energy")) throw new Error("Node already registered: energy");
    for (const entry of gameLayerManifest) {
        if (Object.hasOwn(registry.layers, entry.id)) throw new Error("Layer already registered: " + entry.id);
    }
    for (const entry of gameLayerManifest) registry.addLayer(entry.id, entry.create(ports));
    // Navigation only: Fire remains owned by player.civ, with no Energy currency.
    registry.addNode("energy", {name: "Energy", symbol: "E", color: "#f2cf54", row: 0, layerShown: true});
}
