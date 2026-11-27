// Session-bound treeLayout owner; composition supplies only the named ports.
function createTreeLayout({  }) {
let layoutInfo = {
    startTab: "none",
	showTree: true,

    treeLayout: ""

    
}


const treeLayout = {
 get layoutInfo() { return layoutInfo; },
};
return treeLayout;
}
