const gameLayerManifest = Object.freeze([
    "food", "water", "shelter", "craft", "organization", "money", "freeTime", "education", "culture",
].map(id => Object.freeze({id, create: ports => createResourceLayer(id, ports)})));
function registerGameLayers(registry, ports) {
    for (const entry of gameLayerManifest) {
        if (Object.hasOwn(registry.layers, entry.id)) throw new Error("Layer already registered: " + entry.id);
    }
    for (const entry of gameLayerManifest) registry.addLayer(entry.id, entry.create(ports));
}
