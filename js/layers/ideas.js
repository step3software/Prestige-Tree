// Session-bound layer owner; composition supplies only the named ports.
// id — ideas content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'>} ports */
function createIdeasLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState }) {
    return {
		name: "ideas", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "ID", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 5, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			first: 0,
			auto: false,
        }},
        color: "#fad682",
        requires() { 
			let req = new Decimal(44);
			if (saveState.player.ai.unlocked && derivedState.tmp.ai) req = req.div(derivedState.tmp.ai.conscEff2);
			return req.max(2);
		}, // Can be a function that takes requirement increases into account
        resource: "ideas", // Name of prestige currency
        baseResource: "thoughts", // Name of resource prestige is based on
        baseAmount() {return saveState.player.ne.thoughts}, // Get the current amount of baseResource
		roundUpCost: true,
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(1.4), // Prestige currency exponent
		base: new Decimal(1.2),
		effect() { return Decimal.sub((gameHelpers.hasAchievement("a", 155)?0.005:0)+(gameHelpers.hasUpgrade("ai", 32)?0.99:0.95), Decimal.div(0.95, saveState.player.id.points.plus(1).log10().times(gameHelpers.hasMilestone("id", 4)?1.5:1).times(gameHelpers.hasMilestone("id", 5)?1.75:1).plus(1))) },
		effectDescription() { return "which reduce the Thought threshold's increase by <h2 style='color: #fad682; text-shadow: #fad682 0px 0px 10px;'>"+gameHelpers.format(derivedState.tmp[this.layer].effect)+"</h2>"+(derivedState.tmp.nerdMode?" (0.95-0.95/(log(x+1)+1)).":".") },
		rev() { return saveState.player.ne.signals.plus(1).log10().div(10).pow(.75).times(saveState.player.id.points).pow(gameHelpers.hasMilestone("id", 0)?2:1).times(gameHelpers.hasUpgrade("ai", 32)?1.5:1).times(gameHelpers.hasUpgrade("ai", 14)?1.5:1).floor() },
		revEff() { return Decimal.pow(1e25, derivedState.tmp.id.rev.pow(.95)) },
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (gameHelpers.hasMilestone("id", 2)) mult = mult.div(saveState.player.ne.points.plus(1).log10().plus(1));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		canBuyMax() { return gameHelpers.hasMilestone("id", 4) && saveState.player.id.auto },
        row: 5, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "I", description: "Press Shift+I to Idea Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
		resetsNothing() { return gameHelpers.hasMilestone("id", 4) && saveState.player.id.auto },
        doReset(resettingLayer){ 
			let keep = [];
			if (layerRegistry.layers[resettingLayer].row<7&&resettingLayer!="ai"&&resettingLayer!="c") {
				keep.push("points");
				keep.push("best");
				keep.push("milestones");
			}
            if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
			if (gameHelpers.hasUpgrade("ai", 22) && !(layerRegistry.layers[resettingLayer].row<7&&resettingLayer!="ai"&&resettingLayer!="c")) gameRules.addPoints("id", 4);
        },
		autoPrestige() { return gameHelpers.hasMilestone("id", 4) && saveState.player.id.auto },
        layerShown(){return saveState.player.en.unlocked&&saveState.player.ne.unlocked},
        branches: ["ne"],
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display", "blank", 
			"milestones", "blank", "blank",
			["display-text", function() { return "Revelations: <h2>"+gameHelpers.formatWhole(derivedState.tmp.id.rev)+"</h2>"+(derivedState.tmp.nerdMode?(gameHelpers.hasMilestone("id", 0)?" ((ideas^2)*(log(signals+1)/10)^1.5)":" (ideas*(log(signals+1)/10)^0.75)"):" (based on Ideas & Signals)") }],
			["display-text", function() { return "Effect: Multiply Mech-Energy by <h2>"+gameHelpers.format(derivedState.tmp.id.revEff)+"</h2>"+(derivedState.tmp.nerdMode?" (1e25^(x^0.95))":".") } ], "blank",
		],
		milestones: {
			0: {
				requirementDescription: "2 Ideas & 2 Revelations",
				done() { return (saveState.player.id.points.gte(2) && derivedState.tmp.id.rev.gte(2))||gameHelpers.hasAchievement("a", 161) },
				effectDescription: "Neural Network cost scaling starts 2 purchases later & is 50% weaker, Thoughts can be gained in bulk, and Revelations are squared.",
			},
			1: {
				unlocked() { return gameHelpers.hasMilestone("id", 0) },
				requirementDescription: "2 Ideas & 8 Revelations",
				done() { return saveState.player.id.points.gte(2) && derivedState.tmp.id.rev.gte(8) },
				effectDescription: "The Neuron effect is squared, and Thought effects are all 20% stronger.",
			},
			2: {
				unlocked() { return gameHelpers.hasMilestone("id", 1) },
				requirementDescription: "3 Ideas & 22 Revelations",
				done() { return saveState.player.id.points.gte(3) && derivedState.tmp.id.rev.gte(22) },
				effectDescription() { return "The Idea cost is divided based on your Neurons (/"+gameHelpers.format(saveState.player.ne.points.plus(1).log10().plus(1))+")" },
			},
			3: {
				unlocked() { return gameHelpers.hasMilestone("id", 2)||gameHelpers.hasAchievement("a", 161) },
				requirementDescription: "6 Ideas & 245 Revelations",
				done() { return (saveState.player.id.points.gte(6) && derivedState.tmp.id.rev.gte(245))||gameHelpers.hasAchievement("a", 161) },
				effectDescription() { return "Unlock Auto-Shell Expansion, which is much more efficient than normal purchasing, and each OoM of Shell Expansions double Signal gain ("+gameHelpers.format(Decimal.pow(2, saveState.player.mc.buyables[11].max(1).log10()))+"x)." },
				toggles: [["mc", "autoSE"]],
			},
			4: {
				unlocked() { return gameHelpers.hasUpgrade("ai", 22)||gameHelpers.hasAchievement("a", 164) },
				requirementDescription: "132 Revelations",
				done() { return ((derivedState.tmp.id.rev.gte(132)||gameHelpers.hasMilestone("id", 4))&&gameHelpers.hasUpgrade("ai", 22))||gameHelpers.hasAchievement("a", 164) },
				effectDescription: "Unlock Auto-Ideas, you can buy max Ideas, & the Idea effect is 50% more effective.",
				toggles: [["id", "auto"]],
			},
			5: {
				unlocked() { return gameHelpers.hasUpgrade("ai", 22) },
				requirementDescription: "1,800 Revelations",
				done() { return (derivedState.tmp.id.rev.gte(1800)||gameHelpers.hasMilestone("id", 5))&&gameHelpers.hasUpgrade("ai", 22) },
				effectDescription: "The Idea effect is 75% more effective, and Revelations multiply Gear & Building gain.",
			},
		},
};
}
