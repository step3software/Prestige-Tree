// sc — softcaps content. Registration: manifest.js.
function createSoftcapsLayer() {
    return {
	startData() { return {unlocked: true}},
	color: "#e6ff69",
	symbol: "SC",
	row: "side",
	layerShown() { return hasAchievement("a", 21) && player.scShown },
	tooltip: "Softcaps",
	tabFormat: [
		"blank", "blank", "blank",
		["raw-html", function() {
			let html = ""
			for (let id in SOFTCAPS) {
				let data = SOFTCAPS[id];
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
