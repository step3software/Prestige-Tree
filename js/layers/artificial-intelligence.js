// Session-bound layer owner; composition supplies only the named ports.
// ai — artificial intelligence content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'effects'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'>} ports */
function createArtificialIntelligenceLayer({ derivedState, effects, gameHelpers, gameRules, layerRegistry, saveState }) {
    return {
		name: "AI", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "AI", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			first: 0,
			time: new Decimal(0),
			consc: new Decimal(0),
        }},
        color: "#e6ffcc",
		nodeStyle() { return {
			background: (saveState.player.ai.unlocked||gameRules.canReset("ai"))?((saveState.player.grad&&!saveState.player.oldStyle)?"radial-gradient(circle, #e6ffcc 0%, #566b65 100%)":"#e6ffcc"):"#bf8f8f",
		}},
		componentStyles: {
			"prestige-button": {
				background() { return (gameRules.canReset("ai"))?((saveState.player.grad&&!saveState.player.oldStyle)?"radial-gradient(circle, #e6ffcc 0%, #566b65 100%)":"#e6ffcc"):"#bf8f8f" },
			},
		},
        requires: new Decimal(408), // Can be a function that takes requirement increases into account
        resource: "superintelligence", // Name of prestige currency 
        baseResource: "revelations", // Name of resource prestige is based on
        baseAmount() {return derivedState.tmp.id.rev}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(2), // Prestige currency exponent
		roundUpCost: true,
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1);
			if (gameHelpers.hasUpgrade("ai", 22)) mult = mult.times(3);
			if (gameHelpers.hasUpgrade("ai", 41)) mult = mult.times(gameHelpers.upgradeEffect("ai", 41));
			if (gameHelpers.hasUpgrade("ai", 43)) mult = mult.times(gameHelpers.upgradeEffect("ai", 43));
			if (gameHelpers.hasUpgrade("ai", 44)) mult = mult.times(saveState.player.ai.buyables[11].max(1));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 6, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "R", description: "Press Shift+R to AI Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
		passiveGeneration() { return 0 },
        doReset(resettingLayer){ 
			let keep = [];
			if (layerRegistry.layers[resettingLayer].row == this.row) {
				saveState.player.ai.time = new Decimal(0);
				saveState.player.ai.consc = new Decimal(0);
			}
			if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
        },
        layerShown(){return saveState.player.r.unlocked && saveState.player.id.unlocked },
        branches: ["r", ["id", 3]],
		update(diff) {
			if (!saveState.player[this.layer].unlocked) return;
			saveState.player.ai.time = saveState.player.ai.time.plus(diff);
			// player.ai.consc = player.ai.consc.plus(tmp.ai.buyables[11].effect.times(diff)).div(Decimal.pow(tmp.ai.divConsc, diff));
			if (derivedState.tmp.ai.divConsc.lte(1.00001)) saveState.player.ai.consc = saveState.player.ai.consc.add(derivedState.tmp.ai.buyables[11].effect.mul(diff));
			else saveState.player.ai.consc = saveState.player.ai.consc.add(derivedState.tmp.ai.buyables[11].effect.mul(0.001).sub(saveState.player.ai.consc.mul(derivedState.tmp.ai.divConsc.pow(0.001).sub(1))).mul(derivedState.tmp.ai.divConsc.pow(0.001).sub(1).recip().mul(Decimal.sub(1, derivedState.tmp.ai.divConsc.pow(0.001).recip().pow(diff*1000)))))
		},
		divConsc() { return saveState.player.ai.time.plus(1).log10().plus(1).sqrt() },
		conscEff1() { return saveState.player.ai.consc.plus(1) },
		conscEff2() { return saveState.player.ai.consc.plus(1).log(3).plus(1) },
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display", "blank",
			["buyable", 11], "blank",
			["display-text", function() { return "<h3>"+gameHelpers.format(saveState.player.ai.consc)+"</h3> Artificial Consciousness (divided by "+gameHelpers.format(derivedState.tmp.ai.divConsc)+" each second, based on time in this Row 7 run)" }],
			["display-text", function() { return "Effect: Multiplies Energy, Signal, & Robot gain by "+gameHelpers.format(derivedState.tmp.ai.conscEff1)+(derivedState.tmp.nerdMode?" (x+1)":"")+", and divides the Robot & Idea req by "+gameHelpers.format(derivedState.tmp.ai.conscEff2)+(derivedState.tmp.nerdMode?" (log3(x+1)+1)":".") }],"blank", "blank",
			["clickable", 11],
			["display-text", function() { return "Nodes: "+gameHelpers.formatWhole(saveState.player.ai.upgrades.length)+" / "+gameHelpers.formatWhole(derivedState.tmp.ai.nodeSlots) }], "blank",
			"upgrades", "blank",
		],
		nodeSlots() { return saveState.player.ai.buyables[11].div(2).plus(saveState.player.ai.buyables[11].sub(6).div(2).max(0)).plus(saveState.player.ai.buyables[11].gte(1)?1:0).floor().min(16).toNumber() },
		upgrades: {
			rows: 4,
			cols: 4,
			11: {
				title: "Node AA",
				description: "Neural Networks are 50% stronger, and unlock a new Neuron milestone.",
				multiRes: [
					{
						cost: new Decimal(2),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(5),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked },
				style: {height: '150px', width: '150px'},
			},
			12: {
				title: "Node AB",
				description: "Each Minibot that transforms into a Robot grants you 5% of your Robot gain, and start with 5 of each Robot specialization.",
				multiRes: [
					{
						cost: new Decimal(10),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(180),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && gameHelpers.hasUpgrade("ai", 11) },
				style: {height: '150px', width: '150px'},
			},
			13: {
				title: "Node AC",
				description: "Gear Evolution is 50% stronger, and unlock a new Gear milestone.",
				multiRes: [
					{
						cost: new Decimal(300),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(48e3),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && saveState.player.ai.upgrades.length>=4 },
				style: {height: '150px', width: '150px'},
			},
			14: {
				title: "Node AD",
				description: "Improve Revelation gain by 50% & improve Gear Evolution power by 11.1%.",
				multiRes: [
					{
						cost: new Decimal(5e3),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(5e8),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && saveState.player.ai.upgrades.length>=9 },
				style: {height: '150px', width: '150px'},
			},
			21: {
				title: "Node BA",
				description: "Minibot growth is 5x as fast, and unlock a new Robot milestone, but Miniboth death is 20x as fast.",
				multiRes: [
					{
						cost: new Decimal(15),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(190),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && gameHelpers.hasUpgrade("ai", 11) },
				style: {height: '150px', width: '150px'},
			},
			22: {
				title: "Node BB",
				description: "Triple Superintelligence gain, start with 4 Ideas, and unlock two new Idea milestones.",
				multiRes: [
					{
						cost: new Decimal(50),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(2e3),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && gameHelpers.hasUpgrade("ai", 11) },
				style: {height: '150px', width: '150px'},
			},
			23: {
				title: "Node BC",
				description: "When a Minibot grows up into a Robot, the requirement for the next Minibot is reduced by 0.5 more levels & the Producer effect is 40% stronger (additive).",
				multiRes: [
					{
						cost: new Decimal(500),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(196000),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && saveState.player.ai.upgrades.length>=4 },
				style: {height: '150px', width: '150px'},
			},
			24: {
				title: "Node BD",
				description: "Gears boost Nebula Energy gain.",
				multiRes: [
					{
						cost: new Decimal(2e4),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(2e9),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && saveState.player.ai.upgrades.length>=9 },
				style: {height: '150px', width: '150px'},
				effect() { return saveState.player.ge.points.max(1).pow(5) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.ai.upgrades[24].effect)+"x" },
				formula: "x^5",
			},
			31: {
				title: "Node CA",
				description: "Mech-Energy loss is halved, and unlock a new Machine milestone.",
				multiRes: [
					{
						cost: new Decimal(300),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(48e3),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && saveState.player.ai.upgrades.length>=4 },
				style: {height: '150px', width: '150px'},
			},
			32: {
				title: "Node CB",
				description: "The Idea effect is increased by 0.04, and gain 50% more Revelations.",
				multiRes: [
					{
						cost: new Decimal(500),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(196000),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && saveState.player.ai.upgrades.length>=4 },
				style: {height: '150px', width: '150px'},
			},
			33: {
				title: "Node CC",
				description: "Superintelligence boosts Gear, Machine Part, & Robot gain, & Shell Expansion's boost to Mech-Energy gain is raised ^100.",
				multiRes: [
					{
						cost: new Decimal(1500),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(790000),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && saveState.player.ai.upgrades.length>=4 },
				style: {height: '150px', width: '150px'},
				effect() { return saveState.player.ai.points.plus(1).pow(1.5) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.ai.upgrades[33].effect)+"x" },
				formula: "(x+1)^1.5",
			},
			34: {
				title: "Node CD",
				description: "Super Watts, Mind Watts, & Gear gain are raised ^1.2.",
				multiRes: [
					{
						cost: new Decimal(5e4),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(1e10),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && saveState.player.ai.upgrades.length>=9 },
				style: {height: '150px', width: '150px'},
			},
			41: {
				title: "Node DA",
				description: "Mastery boosts Superintelligence gain.",
				multiRes: [
					{
						cost: new Decimal(5e3),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(5e8),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && saveState.player.ai.upgrades.length>=9 },
				style: {height: '150px', width: '150px'},
				effect() { return Decimal.pow(1.05, saveState.player.ma.points) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.ai.upgrades[41].effect)+"x" },
				formula: "1.05^x",
			},
			42: {
				title: "Node DB",
				description: "Each Active AI Node multiplies Signal gain by 100x.",
				multiRes: [
					{
						cost: new Decimal(2e4),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(2e9),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && saveState.player.ai.upgrades.length>=9 },
				style: {height: '150px', width: '150px'},
				effect() { return Decimal.pow(100, saveState.player.ai.upgrades.length) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.ai.upgrades[42].effect)+"x" },
				formula: "100^x",
			},
			43: {
				title: "Node DC",
				description: "Ideas boosts Superintelligence gain.",
				multiRes: [
					{
						cost: new Decimal(5e4),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(1e10),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && saveState.player.ai.upgrades.length>=9 },
				style: {height: '150px', width: '150px'},
				effect() { return Decimal.pow(1.075, saveState.player.id.points) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.ai.upgrades[43].effect)+"x" },
				formula: "1.075^x",
			},
			44: {
				title: "Node DD",
				description: "Artificial Consciousness boosts Gear gain, and AI Networks multiply Superintelligence gain.",
				multiRes: [
					{
						cost: new Decimal(1e6),
					},
					{
						currencyDisplayName: "artificial consciousness",
						currencyInternalName: "consc",
						currencyLayer: "ai",
						cost: new Decimal(5e11),
					},
				],
				canAfford() {
					let a = gameHelpers.canAffordUpgrade(this.layer, this.id, true);
					return a && (saveState.player.ai.upgrades.length<derivedState.tmp.ai.nodeSlots)
				},
				unlocked() { return saveState.player.ai.unlocked && saveState.player.ai.upgrades.length>=9 },
				style: {height: '150px', width: '150px'},
				effect() { return saveState.player.ai.consc.plus(1).pow(5) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.ai.upgrades[44].effect)+"x" },
				formula: "x^5",
			},
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "AI Network",
				cost(x=saveState.player[this.layer].buyables[this.id]) {
					return {
						ai: Decimal.pow(2, x),
						ge: Decimal.pow(100, x.pow(1.8)).times(1e78),
						mc: Decimal.pow('1e525', x.pow(2.5)).times('1e750'),
					};
				},
				effect() { return Decimal.pow(4, saveState.player[this.layer].buyables[this.id]).sub(1).times(gameHelpers.hasAchievement("a", 163)?saveState.player.id.points.max(1):1) },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id];
					let cost = data.cost;
					let amt = saveState.player[this.layer].buyables[this.id];
                    let display = gameHelpers.formatWhole(saveState.player.ai.points)+" / "+gameHelpers.formatWhole(cost.ai)+" Superintelligence"+(derivedState.tmp.nerdMode?(" (2^x)"):"")+"<br>"+gameHelpers.formatWhole(saveState.player.ge.points)+" / "+gameHelpers.formatWhole(cost.ge)+" Gears"+(derivedState.tmp.nerdMode?(" (100^(x^1.8)*1e78)"):"")+"<br>"+gameHelpers.formatWhole(saveState.player.mc.mechEn.times(derivedState.tmp.mc.mechEnMult))+" / "+gameHelpers.formatWhole(cost.mc)+" Mech-Energy"+(derivedState.tmp.nerdMode?(" (1e525^(x^2.5)*1e750)"):"")+"<br><br>Level: "+gameHelpers.formatWhole(amt)+"<br><br>Reward: Generates "+gameHelpers.formatWhole(data.effect)+" Artificial Consciousness/sec"+(derivedState.tmp.nerdMode?" (4^x-1)":".");
					return display;
                },
                unlocked() { return gameHelpers.unl(this.layer) },
                canAfford() {
					if (!derivedState.tmp[this.layer].buyables[this.id].unlocked) return false;
					let cost = layerRegistry.layers[this.layer].buyables[this.id].cost();
                    return saveState.player[this.layer].unlocked && saveState.player.ai.points.gte(cost.ai) && saveState.player.ge.points.gte(cost.ge) && saveState.player.mc.mechEn.times(derivedState.tmp.mc.mechEnMult).gte(cost.mc) && saveState.player.ai.time>=1;
				},
                buy() { 
					let cost = derivedState.tmp[this.layer].buyables[this.id].cost;
					saveState.player.ai.points = saveState.player.ai.points.sub(cost.ai);
					saveState.player.ge.points = saveState.player.ge.points.sub(cost.ge);
					saveState.player.mc.points = saveState.player.mc.points.sub(cost.mc);
					saveState.player.ai.buyables[this.id] = saveState.player.ai.buyables[this.id].plus(1);
                },
                style: {'height':'200px', 'width':'200px'},
				autoed() { return false },
			},
		},
		clickables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Delete all AI Nodes",
				display: "",
				unlocked() { return saveState.player.ai.unlocked },
				canClick() { return saveState.player.ai.unlocked && saveState.player.ai.upgrades.length>0 },
				onClick() { 
					if (!effects.confirm("Are you sure you want to delete all AI Nodes? This will force an AI reset!")) return;
					saveState.player.ai.upgrades = [];
					gameRules.doReset("ai", true);
				},
				style: {width: "80px", height: "80px"},
			},
		},
};
}
