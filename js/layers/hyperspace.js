// hs — hyperspace content. Registration: manifest.js.
function createHyperspaceLayer() {
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
        requires() { return new Decimal((player[this.layer].unlockOrder>0&&!hasAchievement("a", 92))?420:360) }, // Can be a function that takes requirement increases into account
		increaseUnlockOrder: ["n"],
        resource: "hyperspace energy", // Name of prestige currency 
        baseResource: "space energy", // Name of resource prestige is based on
        baseAmount() {return player.s.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { 
			let exp = new Decimal(60);
			if (player.i.buyables[11].gte(4)) exp = exp.times(buyableEffect("s", 19));
			return exp;
		}, // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1);
			if (hasUpgrade("g", 35) && player.i.buyables[12].gte(2)) mult = mult.times(upgradeEffect("g", 35));
			if (hasUpgrade("e", 41) && player.i.buyables[12].gte(3)) mult = mult.times(upgradeEffect("e", 41));
			if (hasUpgrade("t", 41) && player.i.buyables[12].gte(4)) mult = mult.times(2.5e3);
			if (hasUpgrade("s", 33) && player.i.buyables[12].gte(5)) mult = mult.times(upgradeEffect("s", 33));
			if (player.ma.unlocked) mult = mult.times(tmp.ma.effect);
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("i"):false) mult = mult.times(Decimal.pow(10, player.i.hb));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 5, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "ctrl+s", description: "Press Ctrl+S to Hyperspace Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		passiveGeneration() { return (hasMilestone("ma", 2)&&player.ma.current!="hs")?1:0 },
        doReset(resettingLayer){ 
			let keep = [];
			let hs = player.hs.buyables[11];
			if (hasMilestone("ma", 2)) {
				keep.push("buyables");
				keep.push("spentHS");
			}
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
			if (layers[resettingLayer].row == 6 && hasMilestone("ma", 0)) player.hs.buyables[11] = hs;
        },
        layerShown(){return player.ss.unlocked && player.hn.unlocked },
        branches: ["ss", "ba"],
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			["display-text", function() { return "You have "+formatWhole(player.ba.points)+" Balance Energy" }],
			"blank",
			["buyable", 11],
			"blank", "blank",
			"respec-button",
			"blank",
			["display-text", function() { return tmp.hs.buildingPower.eq(1)?"":("Hyper Building Power: "+format(tmp.hs.buildingPower.times(100))+"%")}], "blank",
			["row", [["buyable", 21], ["buyable", 22], ["buyable", 23], ["buyable", 24], ["buyable", 25], ["buyable", 26], ["buyable", 27], ["buyable", 28], ["buyable", 29], ["buyable", 30]]],
			"blank",
			["display-text", function() { return "Hyper Building Limit: "+formatWhole(player.hs.buildLim)+", Next: "+formatWhole(player.sg.points)+" / "+formatWhole(tmp.hs.nextBuildLimit)+" Super-Generators" }], "blank",
		],
		update(diff) {
			player.hs.buildLim = player.hs.buildLim.max(tmp.hs.buildLimit);
			if (hasMilestone("ma", 5) && player.hs.auto && player.ma.current!="hs") tmp.hs.buyables[11].buyMax();
		},
		hyperspace() {
			let total = player.hs.buyables[11];
			let amt = total.sub(player.hs.spentHS);
			return amt;
		},
		buildLimScaling() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?0.8:1 },
		nextBuildLimit() { return player.hs.buildLim.plus(1).times(tmp.hs.buildLimScaling).pow(2).plus(20) },
		buildLimit() { return player.sg.points.sub(21).max(0).plus(1).sqrt().div(tmp.hs.buildLimScaling).floor() },
		buildingPower() {
			if (!unl(this.layer)) return new Decimal(0);
			let pow = new Decimal(1)
			if (hasUpgrade("hn", 54)) pow = pow.times(upgradeEffect("hn", 54));
			if (player.n.buyables[11].gte(5)) pow = pow.plus(buyableEffect("o", 33));
			if (player.i.buyables[11].gte(5)) pow = pow.plus(buyableEffect("s", 20));
			if (player.ma.unlocked) pow = pow.plus(tmp.ma.effect.max(1).log10().div(40));
			if (hasAchievement("a", 113)) pow = pow.plus(.1);
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) pow = pow.plus(player.hs.buyables[11].div(1000))
			if (player.c.unlocked && tmp.c) pow = pow.plus(tmp.c.eff1);
			return pow;
		},
		buyables: {
			rows: 2,
			cols: 10,
			showRespec() { return player.hs.unlocked },
            respec() { // Optional, reset things and give back your currency. Having this function makes a respec button appear
				player.hs.spentHS = new Decimal(0);
				let totalHS = player[this.layer].buyables[11]
                resetBuyables(this.layer)
				player[this.layer].buyables[11] = totalHS;
                doReset(this.layer, true) // Force a reset
            },
            respecText: "Respec Hyper Buildings", // Text on Respec button, optional
			11: {
				title: "Hyperspace",
				scaleRate() {
					let rate = new Decimal(1);
					if (hasUpgrade("t", 32) && player.i.buyables[12].gte(4)) rate = new Decimal(2/3);
					if (player.ma.current=="hs") rate = rate.times(4)
					return rate;
				},
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    x = x.times(tmp[this.layer].buyables[this.id].scaleRate);
					let y = x;
					if (y.gte(10)) y = y.pow(5).div(1e4);
					let cost = {hs: Decimal.pow(10, y.pow(0.9)).floor(), ba: Decimal.pow(10, x.max(x.div(1.5).pow(2)).times(40).add(360))}
					return cost;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
					let primeX = "x"+(data.scaleRate.eq(1)?"":("*"+format(data.scaleRate)))
                    let display = ("Cost: " + formatWhole(data.cost.hs) + " Hyperspace Energy"+(tmp.nerdMode?" (Formula: (10^("+(player[this.layer].buyables[this.id].gte(10)?"(("+primeX+"^5)/1e4)":primeX)+"^0.9)))":"")+"\nCost: "+formatWhole(data.cost.ba)+" Balance Energy"+(tmp.nerdMode?" (Formula: (10^(((x*"+format(data.scaleRate.div(1.5))+")^2)*40+360)))":"")+"\n\
					Amount: " + formatWhole(tmp.hs.hyperspace)+" / "+formatWhole(player[this.layer].buyables[this.id]))
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
					let cost = tmp[this.layer].buyables[this.id].cost
                    return player.hs.unlocked && player.hs.points.gte(cost.hs) && player.ba.points.gte(cost.ba)
				},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
					player.hs.points = player.hs.points.sub(cost.hs);
					player.ba.points = player.ba.points.sub(cost.ba);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {
					let y = player.hs.points.max(1).log10().root(.9);
					if (y.gte(10)) y = y.times(1e4).root(5);
					let target = y.min(player.ba.points.max(1).log10().sub(360).div(40).sqrt().times(1.5)).div(tmp[this.layer].buyables[this.id].scaleRate).plus(1).floor();
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				},
                style() { return {'height':'200px', 'width':'200px'}},
				autoed() { return hasMilestone("ma", 5) && player.hs.auto && player.ma.current!="hs" },
			},
			21: {
				title: "Primary Hyper Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + formatWhole(player[this.layer].buyables[this.id])+" / "+formatWhole(player.hs.buildLim)+"\n\n\
					Primary Space Building Effect: ^"+format(tmp[this.layer].buyables[this.id].effect)+(tmp.nerdMode?" (Formula: level*5e3+1)":""))
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
					return player.hs.unlocked && player[this.layer].buyables[this.id].lt(player.hs.buildLim) && layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcap("hsBuilds", player[this.layer].buyables[this.id]).times(tmp.hs.buildingPower).times(5e3).plus(1);
				},
                buy() { 
					player.hs.spentHS = player.hs.spentHS.plus(1);
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].plus(1).min(player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			22: {
				title: "Secondary Hyper Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + formatWhole(player[this.layer].buyables[this.id])+" / "+formatWhole(player.hs.buildLim)+"\n\n\
					Secondary Space Building Effect: ^"+format(tmp[this.layer].buyables[this.id].effect)+(tmp.nerdMode?" (Formula: level*40+1)":""))
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
					return player.hs.unlocked && player[this.layer].buyables[this.id].lt(player.hs.buildLim) && layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcap("hsBuilds", player[this.layer].buyables[this.id]).times(tmp.hs.buildingPower).times(40).plus(1);
				},
                buy() { 
					player.hs.spentHS = player.hs.spentHS.plus(1);
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].plus(1).min(player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			23: {
				title: "Tertiary Hyper Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + formatWhole(player[this.layer].buyables[this.id])+" / "+formatWhole(player.hs.buildLim)+"\n\n\
					Tertiary Space Building Effect: ^"+format(tmp[this.layer].buyables[this.id].effect)+(tmp.nerdMode?" (Formula: (level^0.8)*800+1)":""))
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
					return player.hs.unlocked && player[this.layer].buyables[this.id].lt(player.hs.buildLim) && layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcap("hsBuilds", player[this.layer].buyables[this.id]).times(tmp.hs.buildingPower).pow(0.8).times(800).plus(1);
				},
                buy() { 
					player.hs.spentHS = player.hs.spentHS.plus(1);
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].plus(1).min(player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			24: {
				title: "Quaternary Hyper Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + formatWhole(player[this.layer].buyables[this.id])+" / "+formatWhole(player.hs.buildLim)+"\n\n\
					Quaternary Space Building Effect: x"+format(tmp[this.layer].buyables[this.id].effect)+(tmp.nerdMode?" (Formula: (level^0.8)*5e3+1)":" (unaffected by softcap)"))
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
					return player.hs.unlocked && player[this.layer].buyables[this.id].lt(player.hs.buildLim) && layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcap("hsBuilds", player[this.layer].buyables[this.id]).times(tmp.hs.buildingPower).pow(0.8).times(5e3).plus(1);
				},
                buy() { 
					player.hs.spentHS = player.hs.spentHS.plus(1);
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].plus(1).min(player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			25: {
				title: "Quinary Hyper Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + formatWhole(player[this.layer].buyables[this.id])+" / "+formatWhole(player.hs.buildLim)+"\n\n\
					Quinary Space Building Effect: x"+format(tmp[this.layer].buyables[this.id].effect)+(tmp.nerdMode?" (Formula: (level^0.75)*0.25+1)":""))
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
					return player.hs.unlocked && player[this.layer].buyables[this.id].lt(player.hs.buildLim) && layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcap("hsBuilds", player[this.layer].buyables[this.id]).times(tmp.hs.buildingPower).pow(0.75).times(0.25).plus(1);
				},
                buy() { 
					player.hs.spentHS = player.hs.spentHS.plus(1);
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].plus(1).min(player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			26: {
				title: "Senary Hyper Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + formatWhole(player[this.layer].buyables[this.id])+" / "+formatWhole(player.hs.buildLim)+"\n\n\
					Senary Space Building Effect: ^"+format(tmp[this.layer].buyables[this.id].effect)+(tmp.nerdMode?" (Formula: (level^1.1)/1.2+1)":""))
					return display;
                },
                unlocked() { return player[this.layer].unlocked && player.i.buyables[11].gte(1) }, 
                canAfford() {
					return player.hs.unlocked && player[this.layer].buyables[this.id].lt(player.hs.buildLim) && layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcap("hsBuilds", player[this.layer].buyables[this.id]).times(tmp.hs.buildingPower).pow(1.1).div(1.2).plus(1);
				},
                buy() { 
					player.hs.spentHS = player.hs.spentHS.plus(1);
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].plus(1).min(player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			27: {
				title: "Septenary Hyper Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + formatWhole(player[this.layer].buyables[this.id])+" / "+formatWhole(player.hs.buildLim)+"\n\n\
					Septenary Space Building Effect: ^"+format(tmp[this.layer].buyables[this.id].effect)+(tmp.nerdMode?" (Formula: level/5+1)":""))
					return display;
                },
                unlocked() { return player[this.layer].unlocked && player.i.buyables[11].gte(2) }, 
                canAfford() {
					return player.hs.unlocked && player[this.layer].buyables[this.id].lt(player.hs.buildLim) && layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcap("hsBuilds", player[this.layer].buyables[this.id]).times(tmp.hs.buildingPower).div(5).plus(1);
				},
                buy() { 
					player.hs.spentHS = player.hs.spentHS.plus(1);
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].plus(1).min(player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			28: {
				title: "Octonary Hyper Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + formatWhole(player[this.layer].buyables[this.id])+" / "+formatWhole(player.hs.buildLim)+"\n\n\
					Octonary Space Building Effect: x"+format(tmp[this.layer].buyables[this.id].effect)+(tmp.nerdMode?" (Formula: level/1.15+1)":""))
					return display;
                },
                unlocked() { return player[this.layer].unlocked && player.i.buyables[11].gte(3) }, 
                canAfford() {
					return player.hs.unlocked && player[this.layer].buyables[this.id].lt(player.hs.buildLim) && layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcap("hsBuilds", player[this.layer].buyables[this.id]).times(tmp.hs.buildingPower).div(1.15).plus(1);
				},
                buy() { 
					player.hs.spentHS = player.hs.spentHS.plus(1);
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].plus(1).min(player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			29: {
				title: "Nonary Hyper Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + formatWhole(player[this.layer].buyables[this.id])+" / "+formatWhole(player.hs.buildLim)+"\n\n\
					Nonary Space Building Effect: ^"+format(tmp[this.layer].buyables[this.id].effect)+(tmp.nerdMode?" (Formula: level/5+1)":""))
					return display;
                },
                unlocked() { return player[this.layer].unlocked && player.i.buyables[11].gte(4) && player.ma.current!="hs" }, 
                canAfford() {
					return player.hs.unlocked && player[this.layer].buyables[this.id].lt(player.hs.buildLim) && layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcap("hsBuilds", player[this.layer].buyables[this.id]).times(tmp.hs.buildingPower).div(5).plus(1);
				},
                buy() { 
					player.hs.spentHS = player.hs.spentHS.plus(1);
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].plus(1).min(player.hs.buildLim);
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'100px'}},
				autoed() { return false },
			},
			30: {
				title: "Decary Hyper Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return new Decimal(1);
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Cost: 1 Hyperspace\n\
					Amount: " + formatWhole(player[this.layer].buyables[this.id])+" / "+formatWhole(player.hs.buildLim)+"\n\n\
					Decary Space Building Effect: x"+format(tmp[this.layer].buyables[this.id].effect)+(tmp.nerdMode?" (Formula: sqrt(level)/1.5+1)":""))
					return display;
                },
                unlocked() { return player[this.layer].unlocked && player.i.buyables[11].gte(5) }, 
                canAfford() {
					return player.hs.unlocked && player[this.layer].buyables[this.id].lt(player.hs.buildLim) && layers.hs.hyperspace().gte(1);
				},
				effect() {
					return softcap("hsBuilds", player[this.layer].buyables[this.id]).times(tmp.hs.buildingPower).sqrt().div(1.5).plus(1);
				},
                buy() { 
					player.hs.spentHS = player.hs.spentHS.plus(1);
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].plus(1).min(player.hs.buildLim);
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
