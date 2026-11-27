// Session-bound layer owner; composition supplies only the named ports.
// sb — super boosters content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'>} ports */
function createSuperBoostersLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState }) {
    return {
        name: "super boosters", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "SB", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#504899",
        requires: new Decimal(100), // Can be a function that takes requirement increases into account
        resource: "super boosters", // Name of prestige currency
        baseResource: "boosters", // Name of resource prestige is based on
        baseAmount() {return saveState.player.b.points}, // Get the current amount of baseResource
		roundUpCost: true,
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		branches: ["b"],
        exponent() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.075:1.25 }, // Prestige currency exponent
		base() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.025:1.05 },
		gainMult() { 
			let mult = new Decimal(1);
			if (gameHelpers.hasUpgrade("ss", 21)) mult = mult.div(1.2);
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) mult = mult.div(4/3);
			return mult;
		},
		autoPrestige() { return saveState.player.sb.auto && gameHelpers.hasMilestone("q", 4) && saveState.player.ma.current!="sb" },
		canBuyMax() { return gameHelpers.hasMilestone("q", 7) },
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "B", description: "Press Shift+B to perform a super booster reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
        layerShown(){return saveState.player.t.unlocked&&saveState.player.e.unlocked&&saveState.player.s.unlocked},
		automate() {},
		resetsNothing() { return gameHelpers.hasMilestone("q", 5)&&saveState.player.ma.current!="sb" },
		effectBase() {
			let base = new Decimal(5);
			if (gameHelpers.hasChallenge("h", 12)) base = base.plus(.25);
			if (gameHelpers.hasUpgrade("e", 31) && saveState.player.i.buyables[12].gte(3)) base = base.plus(gameHelpers.buyableEffect("e", 11).second);
			
			if (saveState.player.o.unlocked) base = base.times(gameHelpers.buyableEffect("o", 12));
			if (((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes('b'):false) && gameHelpers.hasUpgrade("b", 12)) base = base.times(gameHelpers.upgradeEffect("b", 12).max(1));
			if (((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes('b'):false) && gameHelpers.hasUpgrade("b", 13)) base = base.times(gameHelpers.upgradeEffect("b", 13).max(1));
			base = base.times(derivedState.tmp.n.dustEffs.blue);
			if (((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("h"):false) && gameHelpers.hasChallenge("h", 12)) base = base.times(saveState.player.hs.points.plus(1));
			if (saveState.player.en.unlocked) base = base.pow(derivedState.tmp.en.swEff);
			if (saveState.player.c.unlocked && derivedState.tmp.c) base = base.pow(derivedState.tmp.c.eff5);
			return base
		},
		effect() {
			if (!gameHelpers.unl(this.layer)) return new Decimal(1);
			return Decimal.pow(this.effectBase(), saveState.player.sb.points).max(0);
		},
		effectDescription() {
			return "which are multiplying the Booster base by "+gameHelpers.format(derivedState.tmp.sb.effect)+"x"+(derivedState.tmp.nerdMode?("\n ("+gameHelpers.format(derivedState.tmp.sb.effectBase)+"x each)"):"")
		},
		doReset(resettingLayer){ 
			let keep = []
            if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
        },
		spectralEach() {
			if (!((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)) return new Decimal(0);
			return saveState.player.sb.points;
		},
		spectralTotal() {
			return derivedState.tmp.sb.spectralEach.times(saveState.player.sb.points);
		},
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text", function() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("sb"):false)?("Your Super Boosters are providing you with <h3 style='color: #8882ba; text-shadow: #7f78c4 0px 0px 10px;'>"+gameHelpers.formatWhole(derivedState.tmp.sb.spectralTotal)+"</h3> Spectral Boosters"+(derivedState.tmp.nerdMode?(" ("+gameHelpers.formatWhole(derivedState.tmp.sb.spectralEach)+" per SB)"):"")+", which contribute to the Booster effect but not to any Booster-related upgrade effects."):"" }],
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
