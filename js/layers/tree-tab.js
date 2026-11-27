// Session-bound layer owner; composition supplies only the named ports.
// tree-tab — tree tab content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'layerRegistry'|'treeLayout'>} ports */
function createTreeTabLayer({ layerRegistry, treeLayout }) {
    return {
    tabFormat: [["tree", function() {return (treeLayout.layoutInfo.treeLayout ? treeLayout.layoutInfo.treeLayout : layerRegistry.TREE_LAYERS)}]]
};
}
