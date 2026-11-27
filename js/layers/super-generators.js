// Session-bound layer owner; composition supplies only the named ports.
// sg — super generators content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'>} ports */
function createSuperGeneratorsLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState }) {
    return {
        name: "super generators", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "SG", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 4, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#248239",
        requires: new Decimal(200), // Can be a function that takes requirement increases into account
        resource: "super generators", // Name of prestige currency
        baseResource: "generators", // Name of resource prestige is based on
        baseAmount() {return saveState.player.g.points}, // Get the current amount of baseResource
		roundUpCost: true,
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		branches: ["g"],
        exponent() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.225:1.25 }, // Prestige currency exponent
		base() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.04:1.05 },
		gainMult() { 
			let mult = new Decimal(1);
			if (gameHelpers.hasUpgrade("ss", 21)) mult = mult.div(1.2);
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) mult = mult.div(1.1);
			return mult;
		},
		autoPrestige() { return saveState.player.sg.auto && gameHelpers.hasMilestone("q", 6) && saveState.player.ma.current!="sg" },
		update(diff) {
			saveState.player.sg.power = saveState.player.sg.power.plus(derivedState.tmp.sg.effect.times(diff));
			saveState.player.sg.time = saveState.player.sg.time.plus(diff);
		},
		canBuyMax() { return gameHelpers.hasMilestone("q", 7) },
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "G", description: "Press Shift+G to perform a super generator reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
		layerShown(){return (gameHelpers.hasUpgrade("q", 33)||saveState.player.ma.selectionActive)&&saveState.player.q.unlocked},
		resetsNothing() { return gameHelpers.hasMilestone("q", 6) && saveState.player.ma.current!="sg" },
		effectBase() {
			let base = new Decimal(5);
			if (gameHelpers.hasUpgrade("ss", 32)) base = base.plus(gameHelpers.upgradeEffect("ss", 32));
			if (gameHelpers.hasUpgrade("e", 31) && saveState.player.i.buyables[12].gte(3)) base = base.plus(gameHelpers.buyableEffect("e", 11).second);
			
			if (gameHelpers.hasUpgrade("g", 31) && saveState.player.i.buyables[12].gte(2)) base = base.times(gameHelpers.upgradeEffect("g", 31));
			if (gameHelpers.hasUpgrade("ba", 32)) base = base.times(gameHelpers.upgradeEffect("ba", 32));
			if (gameHelpers.hasUpgrade("hn", 52)) base = base.times(gameHelpers.buyableEffect("o", 12));
			if (saveState.player.mc.unlocked) base = base.times(gameHelpers.clickableEffect("mc", 21));
			if (derivedState.tmp.m.buyables[16].unlocked) base = base.times(gameHelpers.buyableEffect("m", 16));
			if (saveState.player.ne.unlocked) base = base.times(derivedState.tmp.ne.thoughtEff2);
			return base;
		},
		effect() {
			if (!gameHelpers.unl(this.layer)) return new Decimal(0);
			let eff = Decimal.pow(this.effectBase(), saveState.player.sg.points).sub(1).max(0);
			if (derivedState.tmp.h.challenges[31].unlocked) eff = eff.times(gameHelpers.challengeEffect("h", 31));
			return eff;
		},
		effectDescription() {
			return "which are generating "+gameHelpers.format(derivedState.tmp.sg.effect)+" Super Generator Power/sec"+(derivedState.tmp.nerdMode?("\n ("+gameHelpers.format(derivedState.tmp.sg.effectBase)+"x each)"):"")
		},
		enEff() {
			if (!gameHelpers.unl(this.layer)) return new Decimal(1);
			let eff = saveState.player.sg.power.plus(1).sqrt();
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("sg"):false) eff = eff.pow(2);
			return eff;
		},
		doReset(resettingLayer){ 
			let keep = []
            if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
        },
		spectralTotal() {
			if (!((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("sg"):false)) return new Decimal(0);
			return saveState.player.sg.time.plus(1).log10().times(saveState.player.sg.points.pow(2)).pow(.95).times(1.2).floor();
		},
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'You have ' + gameHelpers.format(saveState.player.sg.power) + ' Super Generator Power, which multiplies the Generator base by '+gameHelpers.format(derivedState.tmp.sg.enEff)+'x'+(derivedState.tmp.nerdMode?(" (sqrt(x+1))"):"")},
					{}],
			"blank",
			["display-text", function() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("sg"):false)?("Your Super Generators are providing you with <h3 style='color: #84b88a; text-shadow: #78c48f 0px 0px 10px;'>"+gameHelpers.formatWhole(derivedState.tmp.sg.spectralTotal)+"</h3> Spectral Generators"+(derivedState.tmp.nerdMode?(" (((log(timeSinceRow4Reset+1)*(SG^2))^0.95)*1.2)"):"")+", which contribute to the Generator effect but not to any Generator-related upgrade effects."):"" }],
		],
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			power: new Decimal(0),
			first: 0,
			auto: false,
			time: new Decimal(0),
		}},
};
}
