// Session-bound layer owner; composition supplies only the named ports.
// sc — softcaps content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'gameHelpers'|'saveState'|'softcapRules'>} ports */
function createSoftcapsLayer({ gameHelpers, saveState, softcapRules }) {
    return {
	startData() { return {unlocked: true}},
	color: "#e6ff69",
	symbol: "SC",
	row: "side",
	layerShown() { return gameHelpers.hasAchievement("a", 21) && saveState.player.scShown },
	tooltip: "Softcaps",
	tabFormat: [
		"blank", "blank", "blank",
		["raw-html", function() {
			let html = ""
			for (let id in softcapRules.SOFTCAPS) {
				let data = softcapRules.SOFTCAPS[id];
				if (data.display) if (data.display()) {
					html += "<div><h3>"+data.title+"</h3><br>"+data.info();
					html += "</div><br><br>";
				}
			}
			return html;
		}],
	],
};
}
