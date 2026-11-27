// Session-bound layer owner; composition supplies only the named ports.
// hs — hyperspace content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'|'softcapRules'>} ports */
function createHyperspaceLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState, softcapRules }) {
    return {
		name: "hyperspace", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "HS", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 3, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			spentHS: new Decimal(0),
			buildLim: new Decimal(1),
			first: 0,
			auto: false,
        }},
		roundUpCost: true,
        color: "#dfdfff",
        requires() { return new Decimal((saveState.player[this.layer].unlockOrder>0&&!gameHelpers.hasAchievement("a", 92))?420:360) }, // Can be a function that takes requirement increases into account
		increaseUnlockOrder: ["n"],
        resource: "hyperspace energy", // Name of prestige currency 
        baseResource: "space energy", // Name of resource prestige is based on
        baseAmount() {return saveState.player.s.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { 
			let exp = new Decimal(60);
			if (saveState.player.i.buyables[11].gte(4)) exp = exp.times(gameHelpers.buyableEffect("s", 19));
			return exp;
		}, // Prestige currency exponent
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1);
			if (gameHelpers.hasUpgrade("g", 35) && saveState.player.i.buyables[12].gte(2)) mult = mult.times(gameHelpers.upgradeEffect("g", 35));
			if (gameHelpers.hasUpgrade("e", 41) && saveState.player.i.buyables[12].gte(3)) mult = mult.times(gameHelpers.upgradeEffect("e", 41));
			if (gameHelpers.hasUpgrade("t", 41) && saveState.player.i.buyables[12].gte(4)) mult = mult.times(2.5e3);
			if (gameHelpers.hasUpgrade("s", 33) && saveState.player.i.buyables[12].gte(5)) mult = mult.times(gameHelpers.upgradeEffect("s", 33));
			if (saveState.player.ma.unlocked) mult = mult.times(derivedState.tmp.ma.effect);
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("i"):false) mult = mult.times(Decimal.pow(10, saveState.player.i.hb));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 5, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "ctrl+s", description: "Press Ctrl+S to Hyperspace Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
		passiveGeneration() { return (gameHelpers.hasMilestone("ma", 2)&&saveState.player.ma.current!="hs")?1:0 },
        doReset(resettingLayer){ 
			let keep = [];
			let hs = saveState.player.hs.buyables[11];
			if (gameHelpers.hasMilestone("ma", 2)) {
				keep.push("buyables");
				keep.push("spentHS");
			}
			if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
			if (layerRegistry.layers[resettingLayer].row == 6 && gameHelpers.hasMilestone("ma", 0)) saveState.player.hs.buyables[11] = hs;
        },
        layerShown(){return saveState.player.ss.unlocked && saveState.player.hn.unlocked },
        branches: ["ss", "ba"],
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			["display-text", function() { return "You have "+gameHelpers.formatWhole(saveState.player.ba.points)+" Balance Energy" }],
			"blank",
			["buyable", 11],
			"blank", "blank",
			"respec-button",
			"blank",
			["display-text", function() { return derivedState.tmp.hs.buildingPower.eq(1)?"":("Hyper Building Power: "+gameHelpers.format(derivedState.tmp.hs.buildingPower.times(100))+"%")}], "blank",
			["row", [["buyable", 21], ["buyable", 22], ["buyable", 23], ["buyable", 24], ["buyable", 25], ["buyable", 26], ["buyable", 27], ["buyable", 28], ["buyable", 29], ["buyable", 30]]],
			"blank",
			["display-text", function() { return "Hyper Building Limit: "+gameHelpers.formatWhole(saveState.player.hs.buildLim)+", Next: "+gameHelpers.formatWhole(saveState.player.sg.points)+" / "+gameHelpers.formatWhole(derivedState.tmp.hs.nextBuildLimit)+" Super-Generators" }], "blank",
		],
		update(diff) {
			saveState.player.hs.buildLim = saveState.player.hs.buildLim.max(derivedState.tmp.hs.buildLimit);
			if (gameHelpers.hasMilestone("ma", 5) && saveState.player.hs.auto && saveState.player.ma.current!="hs") derivedState.tmp.hs.buyables[11].buyMax();
		},
		hyperspace() {
			let total = saveState.player.hs.buyables[11];
			let amt = total.sub(saveState.player.hs.spentHS);
			return amt;
		},
		buildLimScaling() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?0.8:1 },
		nextBuildLimit() { return saveState.player.hs.buildLim.plus(1).times(derivedState.tmp.hs.buildLimScaling).pow(2).plus(20) },
		buildLimit() { return saveState.player.sg.points.sub(21).max(0).plus(1).sqrt().div(derivedState.tmp.hs.buildLimScaling).floor() },
		buildingPower() {
			if (!gameHelpers.unl(this.layer)) return new Decimal(0);
			let pow = new Decimal(1)
			if (gameHelpers.hasUpgrade("hn", 54)) pow = pow.times(gameHelpers.upgradeEffect("hn", 54));
			if (saveState.player.n.buyables[11].gte(5)) pow = pow.plus(gameHelpers.buyableEffect("o", 33));
			if (saveState.player.i.buyables[11].gte(5)) pow = pow.plus(gameHelpers.buyableEffect("s", 20));
			if (saveState.player.ma.unlocked) pow = pow.plus(derivedState.tmp.ma.effect.max(1).log10().div(40));
			if (gameHelpers.hasAchievement("a", 113)) pow = pow.plus(.1);
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) pow = pow.plus(saveState.player.hs.buyables[11].div(1000))
			if (saveState.player.c.unlocked && derivedState.tmp.c) pow = pow.plus(derivedState.tmp.c.eff1);
			return pow;
		},
		buyables: {
			rows: 2,
			cols: 10,
			showRespec() { return saveState.player.hs.unlocked },
            respec() { // Optional, reset things and give back your currency. Having this function makes a respec button appear
				saveState.player.hs.spentHS = new Decimal(0);
				let totalHS = saveState.player[this.layer].buyables[11]
                gameRules.resetBuyables(this.layer)
				saveState.player[this.layer].buyables[11] = totalHS;
                gameRules.doReset(this.layer, true) // Force a reset
            },
            respecText: "Respec Hyper Buildings", // Text on Respec button, optional
			11: {
				title: "Hyperspace",
				scaleRate() {
					let rate = new Decimal(1);
					if (gameHelpers.hasUpgrade("t", 32) && saveState.player.i.buyables[12].gte(4)) rate = new Decimal(2/3);
					if (saveState.player.ma.current=="hs") rate = rate.times(4)
					return rate;
				},
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    x = x.times(derivedState.tmp[this.layer].buyables[this.id].scaleRate);
					let y = x;
					if (y.gte(10)) y = y.pow(5).div(1e4);
					let cost = {hs: Decimal.pow(10, y.pow(0.9)).floor(), ba: Decimal.pow(10, x.max(x.div(1.5).pow(2)).times(40).add(360))}
					return cost;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
					let primeX = "x"+(data.scaleRate.eq(1)?"":("*"+gameHelpers.format(data.scaleRate)))
                    let display = ("Cost: " + gameHelpers.formatWhole(data.cost.hs) + " Hyperspace Energy"+(derivedState.tmp.nerdMode?" (Formula: (10^("+(saveState.player[this.layer].buyables[this.id].gte(10)?"(("+primeX+"^5)/1e4)":primeX)+"^0.9)))":"")+"\nCost: "+gameHelpers.formatWhole(data.cost.ba)+" Balance Energy"+(derivedState.tmp.nerdMode?" (Formula: (10^(((x*"+gameHelpers.format(data.scaleRate.div(1.5))+")^2)*40+360)))":"")+"\n\
					Amount: " + gameHelpers.formatWhole(derivedState.tmp.hs.hyperspace)+" / "+gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id]))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
					let cost = derivedState.tmp[this.layer].buyables[this.id].cost
                    return saveState.player.hs.unlocked && saveState.player.hs.points.gte(cost.hs) && saveState.player.ba.points.gte(cost.ba)
				},
                buy() {
	let cost;
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
					saveState.player.hs.points = saveState.player.hs.points.sub(cost.hs);
					saveState.player.ba.points = saveState.player.ba.points.sub(cost.ba);
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {
					let y = saveState.player.hs.points.max(1).log10().root(.9);
					if (y.gte(10)) y = y.times(1e4).root(5);
					let target = y.min(saveState.player.ba.points.max(1).log10().sub(360).div(40).sqrt().times(1.5)).div(derivedState.tmp[this.layer].buyables[this.id].scaleRate).plus(1).floor();
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].max(target);
				},
                style() { return {'height':'200px', 'width':'200px'}},
				autoed() { return gameHelpers.hasMilestone("ma", 5) && saveState.player.hs.auto && saveState.player.ma.current!="hs" },
			},
			21: {
				title: "Primary Hyper Building",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+" / "+gameHelpers.formatWhole(saveState.player.hs.buildLim)+"\n\n\
					Primary Space Building Effect: ^"+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: level*5e3+1)":""))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
					return saveState.player.hs.unlocked && saveState.player[this.layer].buyables[this.id].lt(saveState.player.hs.buildLim) && layerRegistry.layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcapRules.softcap("hsBuilds", saveState.player[this.layer].buyables[this.id]).times(derivedState.tmp.hs.buildingPower).times(5e3).plus(1);
				},
                buy() { 
					saveState.player.hs.spentHS = saveState.player.hs.spentHS.plus(1);
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].plus(1).min(saveState.player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			22: {
				title: "Secondary Hyper Building",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+" / "+gameHelpers.formatWhole(saveState.player.hs.buildLim)+"\n\n\
					Secondary Space Building Effect: ^"+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: level*40+1)":""))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
					return saveState.player.hs.unlocked && saveState.player[this.layer].buyables[this.id].lt(saveState.player.hs.buildLim) && layerRegistry.layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcapRules.softcap("hsBuilds", saveState.player[this.layer].buyables[this.id]).times(derivedState.tmp.hs.buildingPower).times(40).plus(1);
				},
                buy() { 
					saveState.player.hs.spentHS = saveState.player.hs.spentHS.plus(1);
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].plus(1).min(saveState.player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			23: {
				title: "Tertiary Hyper Building",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+" / "+gameHelpers.formatWhole(saveState.player.hs.buildLim)+"\n\n\
					Tertiary Space Building Effect: ^"+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: (level^0.8)*800+1)":""))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
					return saveState.player.hs.unlocked && saveState.player[this.layer].buyables[this.id].lt(saveState.player.hs.buildLim) && layerRegistry.layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcapRules.softcap("hsBuilds", saveState.player[this.layer].buyables[this.id]).times(derivedState.tmp.hs.buildingPower).pow(0.8).times(800).plus(1);
				},
                buy() { 
					saveState.player.hs.spentHS = saveState.player.hs.spentHS.plus(1);
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].plus(1).min(saveState.player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			24: {
				title: "Quaternary Hyper Building",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+" / "+gameHelpers.formatWhole(saveState.player.hs.buildLim)+"\n\n\
					Quaternary Space Building Effect: x"+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: (level^0.8)*5e3+1)":" (unaffected by softcap)"))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
					return saveState.player.hs.unlocked && saveState.player[this.layer].buyables[this.id].lt(saveState.player.hs.buildLim) && layerRegistry.layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcapRules.softcap("hsBuilds", saveState.player[this.layer].buyables[this.id]).times(derivedState.tmp.hs.buildingPower).pow(0.8).times(5e3).plus(1);
				},
                buy() { 
					saveState.player.hs.spentHS = saveState.player.hs.spentHS.plus(1);
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].plus(1).min(saveState.player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			25: {
				title: "Quinary Hyper Building",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+" / "+gameHelpers.formatWhole(saveState.player.hs.buildLim)+"\n\n\
					Quinary Space Building Effect: x"+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: (level^0.75)*0.25+1)":""))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
					return saveState.player.hs.unlocked && saveState.player[this.layer].buyables[this.id].lt(saveState.player.hs.buildLim) && layerRegistry.layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcapRules.softcap("hsBuilds", saveState.player[this.layer].buyables[this.id]).times(derivedState.tmp.hs.buildingPower).pow(0.75).times(0.25).plus(1);
				},
                buy() { 
					saveState.player.hs.spentHS = saveState.player.hs.spentHS.plus(1);
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].plus(1).min(saveState.player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			26: {
				title: "Senary Hyper Building",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+" / "+gameHelpers.formatWhole(saveState.player.hs.buildLim)+"\n\n\
					Senary Space Building Effect: ^"+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: (level^1.1)/1.2+1)":""))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked && saveState.player.i.buyables[11].gte(1) },
                canAfford() {
					return saveState.player.hs.unlocked && saveState.player[this.layer].buyables[this.id].lt(saveState.player.hs.buildLim) && layerRegistry.layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcapRules.softcap("hsBuilds", saveState.player[this.layer].buyables[this.id]).times(derivedState.tmp.hs.buildingPower).pow(1.1).div(1.2).plus(1);
				},
                buy() { 
					saveState.player.hs.spentHS = saveState.player.hs.spentHS.plus(1);
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].plus(1).min(saveState.player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			27: {
				title: "Septenary Hyper Building",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+" / "+gameHelpers.formatWhole(saveState.player.hs.buildLim)+"\n\n\
					Septenary Space Building Effect: ^"+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: level/5+1)":""))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked && saveState.player.i.buyables[11].gte(2) },
                canAfford() {
					return saveState.player.hs.unlocked && saveState.player[this.layer].buyables[this.id].lt(saveState.player.hs.buildLim) && layerRegistry.layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcapRules.softcap("hsBuilds", saveState.player[this.layer].buyables[this.id]).times(derivedState.tmp.hs.buildingPower).div(5).plus(1);
				},
                buy() { 
					saveState.player.hs.spentHS = saveState.player.hs.spentHS.plus(1);
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].plus(1).min(saveState.player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			28: {
				title: "Octonary Hyper Building",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+" / "+gameHelpers.formatWhole(saveState.player.hs.buildLim)+"\n\n\
					Octonary Space Building Effect: x"+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: level/1.15+1)":""))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked && saveState.player.i.buyables[11].gte(3) },
                canAfford() {
					return saveState.player.hs.unlocked && saveState.player[this.layer].buyables[this.id].lt(saveState.player.hs.buildLim) && layerRegistry.layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcapRules.softcap("hsBuilds", saveState.player[this.layer].buyables[this.id]).times(derivedState.tmp.hs.buildingPower).div(1.15).plus(1);
				},
                buy() { 
					saveState.player.hs.spentHS = saveState.player.hs.spentHS.plus(1);
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].plus(1).min(saveState.player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			29: {
				title: "Nonary Hyper Building",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+" / "+gameHelpers.formatWhole(saveState.player.hs.buildLim)+"\n\n\
					Nonary Space Building Effect: ^"+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: level/5+1)":""))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked && saveState.player.i.buyables[11].gte(4) && saveState.player.ma.current!="hs" },
                canAfford() {
					return saveState.player.hs.unlocked && saveState.player[this.layer].buyables[this.id].lt(saveState.player.hs.buildLim) && layerRegistry.layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcapRules.softcap("hsBuilds", saveState.player[this.layer].buyables[this.id]).times(derivedState.tmp.hs.buildingPower).div(5).plus(1);
				},
                buy() { 
					saveState.player.hs.spentHS = saveState.player.hs.spentHS.plus(1);
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].plus(1).min(saveState.player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			30: {
				title: "Decary Hyper Building",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+" / "+gameHelpers.formatWhole(saveState.player.hs.buildLim)+"\n\n\
					Decary Space Building Effect: x"+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: sqrt(level)/1.5+1)":""))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked && saveState.player.i.buyables[11].gte(5) },
                canAfford() {
					return saveState.player.hs.unlocked && saveState.player[this.layer].buyables[this.id].lt(saveState.player.hs.buildLim) && layerRegistry.layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcapRules.softcap("hsBuilds", saveState.player[this.layer].buyables[this.id]).times(derivedState.tmp.hs.buildingPower).sqrt().div(1.5).plus(1);
				},
                buy() { 
					saveState.player.hs.spentHS = saveState.player.hs.spentHS.plus(1);
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].plus(1).min(saveState.player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
		},
};
}
