// The sole ordered registration manifest for the main game. The page loads the
// factory definitions first; only this sequence registers content. Keep IDs/order
// stable: saved fields, temp evaluation, resets, hotkeys and tree consumers use them.
const gameLayerManifest = Object.freeze([
    Object.freeze({ id: "info-tab", create: createInfoTabLayer }),
    Object.freeze({ id: "options-tab", create: createOptionsTabLayer }),
    Object.freeze({ id: "blank", create: createBlankLayer, node: true }),
    Object.freeze({ id: "tree-tab", create: createTreeTabLayer }),
    Object.freeze({ id: "p", create: createPrestigeLayer }),
    Object.freeze({ id: "b", create: createBoostersLayer }),
    Object.freeze({ id: "g", create: createGeneratorsLayer }),
    Object.freeze({ id: "t", create: createTimeLayer }),
    Object.freeze({ id: "e", create: createEnhanceLayer }),
    Object.freeze({ id: "s", create: createSpaceLayer }),
    Object.freeze({ id: "sb", create: createSuperBoostersLayer }),
    Object.freeze({ id: "sg", create: createSuperGeneratorsLayer }),
    Object.freeze({ id: "h", create: createHindranceLayer }),
    Object.freeze({ id: "q", create: createQuirksLayer }),
    Object.freeze({ id: "o", create: createSolarityLayer }),
    Object.freeze({ id: "ss", create: createSubspaceLayer }),
    Object.freeze({ id: "m", create: createMagicLayer }),
    Object.freeze({ id: "ba", create: createBalanceLayer }),
    Object.freeze({ id: "ps", create: createPhantomSoulsLayer }),
    Object.freeze({ id: "hn", create: createHonourLayer }),
    Object.freeze({ id: "n", create: createNebulaLayer }),
    Object.freeze({ id: "hs", create: createHyperspaceLayer }),
    Object.freeze({ id: "i", create: createImperiumLayer }),
    Object.freeze({ id: "ma", create: createMasteryLayer }),
    Object.freeze({ id: "ge", create: createGearsLayer }),
    Object.freeze({ id: "mc", create: createMachinesLayer }),
    Object.freeze({ id: "en", create: createEnergyLayer }),
    Object.freeze({ id: "ne", create: createNeuronsLayer }),
    Object.freeze({ id: "id", create: createIdeasLayer }),
    Object.freeze({ id: "r", create: createRobotsLayer }),
    Object.freeze({ id: "ai", create: createArtificialIntelligenceLayer }),
    Object.freeze({ id: "c", create: createCivilizationsLayer }),
    Object.freeze({ id: "a", create: createAchievementsLayer }),
    Object.freeze({ id: "sc", create: createSoftcapsLayer }),
    Object.freeze({ id: "ab", create: createAutobuyersLayer }),
]);

function registerGameLayers() {
    // Reject the complete invalid manifest before changing the existing registry.
    const seen = new Set();
    for (const entry of gameLayerManifest) {
        if (seen.has(entry.id)) throw new Error("Duplicate layer ID: " + entry.id);
        if (Object.prototype.hasOwnProperty.call(layers, entry.id)) {
            throw new Error("Layer already registered: " + entry.id);
        }
        if (typeof entry.create !== "function") throw new Error("Missing layer factory: " + entry.id);
        seen.add(entry.id);
    }
    for (const entry of gameLayerManifest) {
        if (entry.node) addNode(entry.id, entry.create());
        else addLayer(entry.id, entry.create());
    }
}

registerGameLayers();
