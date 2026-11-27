// sg — super generators content. Registration: manifest.js.
function createSuperGeneratorsLayer() {
    return {
        name: "super generators", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "SG", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 4, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#248239",
        requires: new Decimal(200), // Can be a function that takes requirement increases into account
        resource: "super generators", // Name of prestige currency
        baseResource: "generators", // Name of resource prestige is based on
        baseAmount() {return player.g.points}, // Get the current amount of baseResource
		roundUpCost: true,
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		branches: ["g"],
        exponent() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.225:1.25 }, // Prestige currency exponent
		base() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.04:1.05 },
		gainMult() { 
			let mult = new Decimal(1);
			if (hasUpgrade("ss", 21)) mult = mult.div(1.2);
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) mult = mult.div(1.1);
			return mult;
		},
		autoPrestige() { return player.sg.auto && hasMilestone("q", 6) && player.ma.current!="sg" },
		update(diff) {
			player.sg.power = player.sg.power.plus(tmp.sg.effect.times(diff));
			player.sg.time = player.sg.time.plus(diff);
		},
		canBuyMax() { return hasMilestone("q", 7) },
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "G", description: "Press Shift+G to perform a super generator reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		layerShown(){return (hasUpgrade("q", 33)||player.ma.selectionActive)&&player.q.unlocked},
		resetsNothing() { return hasMilestone("q", 6) && player.ma.current!="sg" },
		effectBase() {
			let base = new Decimal(5);
			if (hasUpgrade("ss", 32)) base = base.plus(upgradeEffect("ss", 32));
			if (hasUpgrade("e", 31) && player.i.buyables[12].gte(3)) base = base.plus(buyableEffect("e", 11).second);
			
			if (hasUpgrade("g", 31) && player.i.buyables[12].gte(2)) base = base.times(upgradeEffect("g", 31));
			if (hasUpgrade("ba", 32)) base = base.times(upgradeEffect("ba", 32));
			if (hasUpgrade("hn", 52)) base = base.times(buyableEffect("o", 12));
			if (player.mc.unlocked) base = base.times(clickableEffect("mc", 21));
			if (tmp.m.buyables[16].unlocked) base = base.times(buyableEffect("m", 16));
			if (player.ne.unlocked) base = base.times(tmp.ne.thoughtEff2);
			return base;
		},
		effect() {
			if (!unl(this.layer)) return new Decimal(0);
			let eff = Decimal.pow(this.effectBase(), player.sg.points).sub(1).max(0);
			if (tmp.h.challenges[31].unlocked) eff = eff.times(challengeEffect("h", 31));
			return eff;
		},
		effectDescription() {
			return "which are generating "+format(tmp.sg.effect)+" Super Generator Power/sec"+(tmp.nerdMode?("\n ("+format(tmp.sg.effectBase)+"x each)"):"")
		},
		enEff() {
			if (!unl(this.layer)) return new Decimal(1);
			let eff = player.sg.power.plus(1).sqrt();
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("sg"):false) eff = eff.pow(2);
			return eff;
		},
		doReset(resettingLayer){ 
			let keep = []
            if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		spectralTotal() {
			if (!((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("sg"):false)) return new Decimal(0);
			return player.sg.time.plus(1).log10().times(player.sg.points.pow(2)).pow(.95).times(1.2).floor();
		},
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'You have ' + format(player.sg.power) + ' Super Generator Power, which multiplies the Generator base by '+format(tmp.sg.enEff)+'x'+(tmp.nerdMode?(" (sqrt(x+1))"):"")},
					{}],
			"blank",
			["display-text", function() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("sg"):false)?("Your Super Generators are providing you with <h3 style='color: #84b88a; text-shadow: #78c48f 0px 0px 10px;'>"+formatWhole(tmp.sg.spectralTotal)+"</h3> Spectral Generators"+(tmp.nerdMode?(" (((log(timeSinceRow4Reset+1)*(SG^2))^0.95)*1.2)"):"")+", which contribute to the Generator effect but not to any Generator-related upgrade effects."):"" }],
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
