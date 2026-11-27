// tree-tab — tree tab content. Registration: manifest.js.
function createTreeTabLayer() {
    return {
    tabFormat: [["tree", function() {return (layoutInfo.treeLayout ? layoutInfo.treeLayout : TREE_LAYERS)}]]
};
}
