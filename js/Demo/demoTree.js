// Shared-engine adapter only; demo definitions/order retain their original meaning.
function createDemoTree({}) {
var layoutInfo = {
    startTab: "c",
	showTree: true,

    //treeLayout: ""

    
}
function register({ layerRegistry, saveState }) {
// Shared engine tabs retain their original first registration positions in this standalone example.
layerRegistry.addLayer("info-tab", createInfoTabLayer({}));
layerRegistry.addLayer("options-tab", createOptionsTabLayer({}));

// treeLayout will override the default tree's layout if used


// A "ghost" layer which offsets f in the tree
layerRegistry.addNode("spook", {
    row: 1,
    layerShown: "ghost",
}, 
)


// A "ghost" layer which offsets f in the tree
layerRegistry.addNode("g", {
    symbol: "TH",
    branches: ["c"],
    color: '#6d3678',
    layerShown: true,
    canClick() {return saveState.player.points.gte(10)},
    tooltip: "Thanos your points",
    tooltipLocked: "Thanos your points",
    onClick() {saveState.player.points = saveState.player.points.div(2)}

}, 
)


// A "ghost" layer which offsets f in the tree
layerRegistry.addNode("h", {
    branches: ["g"],
    layerShown: true,
    tooltip: "Restore your points to 10",
    tooltipLocked: "Restore your points to 10",

    canClick() {return saveState.player.points.lt(10)},
    onClick() {saveState.player.points = new Decimal(10)}
}, 
)

layerRegistry.addLayer("tree-tab", {
    tabFormat: [["tree", function() {return (layoutInfo.treeLayout ? layoutInfo.treeLayout : layerRegistry.TREE_LAYERS)}]]
})
}
return {layoutInfo,register};
}
function registerDemoContent(layerRegistry, ports) {
    ports.treeLayout.register(ports);
    registerDemoLayers(ports);
}
