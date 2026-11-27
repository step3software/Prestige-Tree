// sb — super boosters content. Registration: manifest.js.
function createSuperBoostersLayer() {
    return {
        name: "super boosters", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "SB", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#504899",
        requires: new Decimal(100), // Can be a function that takes requirement increases into account
        resource: "super boosters", // Name of prestige currency
        baseResource: "boosters", // Name of resource prestige is based on
        baseAmount() {return player.b.points}, // Get the current amount of baseResource
		roundUpCost: true,
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		branches: ["b"],
        exponent() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.075:1.25 }, // Prestige currency exponent
		base() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.025:1.05 },
		gainMult() { 
			let mult = new Decimal(1);
			if (hasUpgrade("ss", 21)) mult = mult.div(1.2);
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) mult = mult.div(4/3);
			return mult;
		},
		autoPrestige() { return player.sb.auto && hasMilestone("q", 4) && player.ma.current!="sb" },
		canBuyMax() { return hasMilestone("q", 7) },
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "B", description: "Press Shift+B to perform a super booster reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return player.t.unlocked&&player.e.unlocked&&player.s.unlocked},
		automate() {},
		resetsNothing() { return hasMilestone("q", 5)&&player.ma.current!="sb" },
		effectBase() {
			let base = new Decimal(5);
			if (hasChallenge("h", 12)) base = base.plus(.25);
			if (hasUpgrade("e", 31) && player.i.buyables[12].gte(3)) base = base.plus(buyableEffect("e", 11).second);
			
			if (player.o.unlocked) base = base.times(buyableEffect("o", 12));
			if (((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes('b'):false) && hasUpgrade("b", 12)) base = base.times(upgradeEffect("b", 12).max(1));
			if (((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes('b'):false) && hasUpgrade("b", 13)) base = base.times(upgradeEffect("b", 13).max(1));
			base = base.times(tmp.n.dustEffs.blue);
			if (((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("h"):false) && hasChallenge("h", 12)) base = base.times(player.hs.points.plus(1));
			if (player.en.unlocked) base = base.pow(tmp.en.swEff);
			if (player.c.unlocked && tmp.c) base = base.pow(tmp.c.eff5);
			return base
		},
		effect() {
			if (!unl(this.layer)) return new Decimal(1);
			return Decimal.pow(this.effectBase(), player.sb.points).max(0);
		},
		effectDescription() {
			return "which are multiplying the Booster base by "+format(tmp.sb.effect)+"x"+(tmp.nerdMode?("\n ("+format(tmp.sb.effectBase)+"x each)"):"")
		},
		doReset(resettingLayer){ 
			let keep = []
            if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		spectralEach() {
			if (!((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)) return new Decimal(0);
			return player.sb.points;
		},
		spectralTotal() {
			return tmp.sb.spectralEach.times(player.sb.points);
		},
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text", function() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("sb"):false)?("Your Super Boosters are providing you with <h3 style='color: #8882ba; text-shadow: #7f78c4 0px 0px 10px;'>"+formatWhole(tmp.sb.spectralTotal)+"</h3> Spectral Boosters"+(tmp.nerdMode?(" ("+formatWhole(tmp.sb.spectralEach)+" per SB)"):"")+", which contribute to the Booster effect but not to any Booster-related upgrade effects."):"" }],
		],
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			first: 0,
			auto: false,
		}},
};
}
