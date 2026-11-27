// Session-bound layer owner; composition supplies only the named ports.
// ge — gears content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'effects'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'|'softcapRules'>} ports */
function createGearsLayer({ derivedState, effects, gameHelpers, gameRules, layerRegistry, saveState, softcapRules }) {
    return {
		name: "gears", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "GE", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			first: 0,
			rotations: new Decimal(0),
			energy: new Decimal(0),
			toothPower: new Decimal(0),
			shrinkPower: new Decimal(0),
			boosted: new Decimal(0),
			maxToggle: false,
			auto: false,
			autoTime: new Decimal(0),
        }},
        color: "#bfbfbf",
		nodeStyle() { return {
			background: (saveState.player.ge.unlocked||gameRules.canReset("ge"))?((saveState.player.grad&&!saveState.player.oldStyle)?"radial-gradient(circle, #bfbfbf 0%, #838586 100%)":"#838586"):"#bf8f8f",
		}},
		componentStyles: {
			background() { return (saveState.player.ge.unlocked||gameRules.canReset("ge"))?((saveState.player.grad&&!saveState.player.oldStyle)?"radial-gradient(circle, #bfbfbf 0%, #838586 100%)":"#bfbfbf"):"#bf8f8f" },
		},
        requires: new Decimal(1e256), // Can be a function that takes requirement increases into account
        resource: "gears", // Name of prestige currency 
        baseResource: "dust product", // Name of resource prestige is based on
        baseAmount() {return derivedState.tmp.n.dustProduct}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(0.01), // Prestige currency exponent
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1);
			if (saveState.player.mc.unlocked) mult = mult.times(gameHelpers.clickableEffect("mc", 12));
			if (saveState.player.mc.upgrades.includes(11)) mult = mult.times(gameHelpers.buyableEffect("mc", 12));
			if (gameHelpers.hasMilestone("ge", 2)) mult = mult.times(saveState.player.en.total.max(1));
			if (saveState.player.r.unlocked) mult = mult.times(derivedState.tmp.r.buildingEff);
			if (gameHelpers.hasMilestone("id", 5) && derivedState.tmp.id) mult = mult.times(derivedState.tmp.id.rev.max(1));
			if (gameHelpers.hasUpgrade("ai", 33)) mult = mult.times(gameHelpers.upgradeEffect("ai", 33));
			if (gameHelpers.hasUpgrade("ai", 44)) mult = mult.times(gameHelpers.upgradeEffect("ai", 44));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            let exp = new Decimal(1)
			if (gameHelpers.hasUpgrade("ai", 34)) exp = exp.times(1.2);
			return exp;
        },
        row: 6, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "E", description: "Press Shift+E to Gear Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
		passiveGeneration() { return gameHelpers.hasMilestone("ge", 2)?0.01:0 },
        doReset(resettingLayer){ 
			let keep = [];
			if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
			if (layerRegistry.layers[resettingLayer].row >= this.row) {
				saveState.player.ge.energy = new Decimal(0);
				saveState.player.ge.toothPower = new Decimal(0);
				saveState.player.ge.shrinkPower = new Decimal(0);
				saveState.player.ge.rotations = new Decimal(0);
			}
        },
        layerShown(){return saveState.player.ma.unlocked },
        branches: ["n", "r"],
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display", "blank",
			"milestones",
			"blank", "blank", 
			["display-text", function() { return "<h3>Gear Speed: "+gameHelpers.format(derivedState.tmp.ge.gearSpeed)+"x</h3>"+(derivedState.tmp.nerdMode?" (cbrt(gears))":"") }],
			"blank",
			["display-text", function() { return "<b>Gear Radius: "+gameHelpers.format(derivedState.tmp.ge.radius)+"m</b>"+(derivedState.tmp.nerdMode?" (teeth*toothSize/6.28)":"") }], "blank",
			["row", [["display-text", function() { return "<h3>Rotations: "+gameHelpers.formatWhole(saveState.player.ge.rotations, true)+" ("+derivedState.tmp.ge.rotDesc+")</h3><br>Rotation Effect: Multiply Nebula Energy & Dust gain by "+gameHelpers.format(derivedState.tmp.ge.rotEff)+(derivedState.tmp.nerdMode?" ((x+1)^5)":"") }]]],
			"blank", "blank",
			["clickable", 21],
			"blank", "blank",
			["row", [["column", [["raw-html", function() { return "<h3>Teeth: "+(gameHelpers.hasMilestone("ge", 3)?gameHelpers.format(derivedState.tmp.ge.teeth):gameHelpers.formatWhole(derivedState.tmp.ge.teeth, true))+"</h3>" }], "blank", ["clickable", 11]], {"background-color": "#b0babf", color: "black", width: "12vw", padding: "10px", margin: "0 auto", "height": "250px"}], ["column", [["raw-html", function() { return "<h3>Kinetic Energy: "+gameHelpers.format(saveState.player.ge.energy)+" J</h3><br><br>Velocity: "+gameHelpers.format(derivedState.tmp.ge.speed)+"m/s"+(derivedState.tmp.nerdMode?" (sqrt(x))":"") }], "blank", ["clickable", 12]], {"background-color": "#dec895", color: "black", width: "12vw", padding: "10px", margin: "0 auto", "height": "250px"}], ["column", [["raw-html", function() { return "<h3>Tooth Size: "+gameHelpers.format(derivedState.tmp.ge.toothSize)+"m</h3><br><br>" }], "blank", ["clickable", 13]], {"background-color": "#bfa1b8", color: "black", width: "12vw", padding: "10px", margin: "0 auto", "height": "250px"}]]], "blank",
			["buyable", 11], "blank",
		],
		update(diff) {
			if (!saveState.player.ge.unlocked) return;
			let factor = derivedState.tmp.ge.gearSpeed
			saveState.player.ge.energy = saveState.player.ge.energy.plus(factor.times(diff).times(derivedState.tmp.ge.clickables[12].effect));
			saveState.player.ge.toothPower = saveState.player.ge.toothPower.plus(factor.times(diff));
			saveState.player.ge.shrinkPower = saveState.player.ge.shrinkPower.plus(factor.times(diff));
			saveState.player.ge.rotations = saveState.player.ge.rotations.plus(derivedState.tmp.ge.rps.times(diff));
			saveState.player.ge.autoTime = saveState.player.ge.autoTime.plus(diff);
			if (saveState.player.ge.auto && gameHelpers.hasMilestone("ge", 3) && saveState.player.ge.autoTime.gte(.5)) {
				saveState.player.ge.autoTime = new Decimal(0);
				if (layerRegistry.layers.ge.clickables[11].canClick()) layerRegistry.layers.ge.clickables[11].onClick();
				if (layerRegistry.layers.ge.clickables[12].canClick()) layerRegistry.layers.ge.clickables[12].onClick();
				if (layerRegistry.layers.ge.clickables[13].canClick()) layerRegistry.layers.ge.clickables[13].onClick();
			}
		},
		rotEff() {
			return softcapRules.softcap("rotEff", saveState.player.ge.rotations.round().plus(1).pow(5));
		},
		gearSpeed() {
			let speed = saveState.player.ge.points.cbrt().times(saveState.player.mc.unlocked?derivedState.tmp.mc.mechEff:1);
			if (saveState.player.mc.upgrades.includes(11)) speed = speed.times(gameHelpers.buyableEffect("mc", 12));
			return speed;
		},
		rps() {
			return derivedState.tmp.ge.speed.div(derivedState.tmp.ge.teeth.times(derivedState.tmp.ge.toothSize)).times(derivedState.tmp.ge.gearSpeed)
		},
		rotDesc() {
			let rps = derivedState.tmp.ge.rps;
			let desc = "";
			if (rps.lt(1)) desc = gameHelpers.format(rps.times(60))+" RPM";
			else desc = gameHelpers.format(rps)+" RPS";
			
			if (derivedState.tmp.nerdMode) desc += " </h3>((velocity*gearSpeed)/(radius*6.28))<h3>"
			return desc;
		},
		speed() {
			return saveState.player.ge.energy.sqrt();
		},
		teeth() {
			let t = saveState.player.ge.toothPower.pow(1.5).plus(100).div(derivedState.tmp.ge.clickables[11].unlocked?derivedState.tmp.ge.clickables[11].effect:1);
			if (gameHelpers.hasMilestone("ge", 3)) return t.max(0);
			else return t.floor().max(1);
		},
		toothSize() {
			return saveState.player.ge.shrinkPower.plus(1).pow(-0.5).div(derivedState.tmp.ge.clickables[13].effect).times(saveState.player.mc.unlocked?derivedState.tmp.mc.buyables[11].effect.pow(gameHelpers.hasAchievement("a", 125)?(-1):1):1);
		},
		radius() { return derivedState.tmp.ge.teeth.times(derivedState.tmp.ge.toothSize).div(2*Math.PI) },
		boostReducedPurch() { return derivedState.tmp.ge.buyables[11].effect.times(4) },
		boostReq() { 
			let x = saveState.player.ge.boosted.sub(derivedState.tmp.ge.boostReducedPurch);
			if (x.gte(20)) x = x.pow(2).div(20);
			return Decimal.pow(1e10, x.pow(1.2).times(x.lt(0)?(-1):1)).times(1e280) 
		},
		boostReqFormula() { return saveState.player.ge.boosted.sub(derivedState.tmp.ge.boostReducedPurch).gte(20)?"1e10^(((totalBought^2)/20)^1.2) * 1e280":"1e10^(totalBought^1.2) * 1e280" },
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Gear Evolution",
				costDiv() {
					let div = new Decimal(1);
					if (gameHelpers.hasAchievement("a", 124)) div = div.times(3);
					return div;
				},
				free() {
					let free = new Decimal(0);
					if (gameHelpers.hasAchievement("a", 132)) free = free.plus(2);
					return free;
				},
				power() {
					let pow = new Decimal(1);
					if (gameHelpers.hasAchievement("a", 124)) pow = pow.times(1.2);
					if (gameHelpers.hasUpgrade("ai", 14)) pow = pow.times(1.111);
					return pow;
				},
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    if (x.gte(15)) x = x.times(1.63);
					return Decimal.pow(125, x.pow(1.425)).times(1e3).div(derivedState.tmp.ge.buyables[this.id].costDiv)
                },
				effectPer() { return Decimal.div(derivedState.tmp.ge.buyables[this.id].power, 2) },
				effect() { return Decimal.mul(derivedState.tmp[this.layer].buyables[this.id].effectPer, saveState.player[this.layer].buyables[this.id].plus(derivedState.tmp.ge.buyables[this.id].free).times(gameHelpers.hasUpgrade("ai", 13)?1.5:1)) },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id];
					let cost = data.cost;
					let amt = saveState.player[this.layer].buyables[this.id];
                    let display = "Reset all Gear Upgrades and force a Row 7 reset to add "+gameHelpers.format(data.effectPer)+" to each of their effect bases and reduce their costs by "+gameHelpers.format(data.effectPer.times(4))+" purchases.<br><br>Req: "+gameHelpers.formatWhole(cost)+" Rotations"+(derivedState.tmp.nerdMode?" (Cost Formula: 125^(x^1.425)*1e3)":"")+".<br>Currently: +"+gameHelpers.format(data.effect)+" to bases, costs reduced by "+gameHelpers.format(data.effect.times(4))+" purchases";
					return display;
                },
                unlocked() { return gameHelpers.unl(this.layer) },
                canAfford() {
					let cost = derivedState.tmp[this.layer].buyables[this.id].cost
                    return saveState.player[this.layer].unlocked && saveState.player.ge.rotations.gte(cost);
				},
                buy() { 
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].add(1)
					saveState.player.ge.boosted = new Decimal(0);
					for (let i=11;i<=13;i++) saveState.player.ge.clickables[i] = "";
					if (!gameHelpers.hasMilestone("ge", 3)) gameRules.doReset("ge", true);
                },
                buyMax() {
					// later :)
				},
                style: {'height':'200px', 'width':'200px'},
				autoed() { return false },
			},
		},
		clickables: {
			rows: 2,
			cols: 3,
			11: {
				title() { return "Divide Teeth by "+gameHelpers.format(derivedState.tmp.ge.clickables[this.id].effectPer) },
				display() { 
					return "Req: "+gameHelpers.format(derivedState.tmp.ge.clickables[this.id].req)+" dust product"+(derivedState.tmp.nerdMode?" ("+derivedState.tmp.ge.boostReqFormula+")":"")+"<br><br>Currently: /"+gameHelpers.format(derivedState.tmp.ge.clickables[this.id].effect);
				},
				req() {
					if (gameHelpers.hasMilestone("ge", 1)) {
						let x = new Decimal(saveState.player.ge.clickables[this.id]||0).sub(derivedState.tmp.ge.boostReducedPurch);
						if (x.gte(20)) x = x.pow(2).div(20);
						return Decimal.pow(1e10, x.pow(1.2).times(x.lt(0)?(-1):1)).times(1e280) 
					} else return derivedState.tmp.ge.boostReq;
				},
				effectPer() { return Decimal.add(2, derivedState.tmp.ge.buyables[11].effect) },
				effect() { return Decimal.pow(derivedState.tmp.ge.clickables[this.id].effectPer, saveState.player.ge.clickables[this.id]) },
				unlocked() { return saveState.player.ge.unlocked && gameHelpers.hasAchievement("a", 133) },
				canClick() { return saveState.player.ge.unlocked && derivedState.tmp.n.dustProduct.gte(derivedState.tmp.ge.clickables[this.id].req) },
				onClick() { 
					if (saveState.player.ge.maxToggle && gameHelpers.hasMilestone("ge", 0)) {
						let x = derivedState.tmp.n.dustProduct.div(1e280).max(1).log(1e10).root(1.2);
						if (x.gte(20)) x = x.times(20).sqrt();
						x = x.plus(derivedState.tmp.ge.boostReducedPurch).plus(1).floor();
						let totalOther;
						if (gameHelpers.hasMilestone("ge", 1)) totalOther = 0;
						else totalOther = Object.keys(saveState.player.ge.clickables).filter(x => (x!=this.id && x<20)).map(x => saveState.player.ge.clickables[x]).reduce((a,c) => Decimal.add(a, c));
						let target = x.sub(totalOther).max(0);
						saveState.player.ge.boosted = saveState.player.ge.boosted.max(x);
						saveState.player.ge.clickables[this.id] = Decimal.max(saveState.player.ge.clickables[this.id], target);
					} else {
						saveState.player.ge.boosted = saveState.player.ge.boosted.plus(1);
						saveState.player.ge.clickables[this.id] = Decimal.add(saveState.player.ge.clickables[this.id], 1)
					}
				},
				style: {"height": "150px", "width": "150px"},
			},
			12: {
				title() { return "Multiply Kinetic Energy gain by "+gameHelpers.format(derivedState.tmp.ge.clickables[this.id].effectPer) },
				display() { 
					return "Req: "+gameHelpers.format(derivedState.tmp.ge.clickables[this.id].req)+" dust product"+(derivedState.tmp.nerdMode?" ("+derivedState.tmp.ge.boostReqFormula+")":"")+"<br><br>Currently: "+gameHelpers.format(derivedState.tmp.ge.clickables[this.id].effect)+"x";
				},
				req() {
					if (gameHelpers.hasMilestone("ge", 1)) {
						let x = new Decimal(saveState.player.ge.clickables[this.id]||0).sub(derivedState.tmp.ge.boostReducedPurch);
						if (x.gte(20)) x = x.pow(2).div(20);
						return Decimal.pow(1e10, x.pow(1.2).times(x.lt(0)?(-1):1)).times(1e280) 
					} else return derivedState.tmp.ge.boostReq;
				},
				effectPer() { return Decimal.add(6, derivedState.tmp.ge.buyables[11].effect).times(gameHelpers.hasAchievement("a", 123)?4:1) },
				effect() { return Decimal.pow(derivedState.tmp.ge.clickables[this.id].effectPer, saveState.player.ge.clickables[this.id]) },
				unlocked() { return saveState.player.ge.unlocked },
				canClick() { return saveState.player.ge.unlocked && derivedState.tmp.n.dustProduct.gte(derivedState.tmp.ge.clickables[this.id].req) },
				onClick() { 
					if (saveState.player.ge.maxToggle && gameHelpers.hasMilestone("ge", 0)) {
						let x = derivedState.tmp.n.dustProduct.div(1e280).max(1).log(1e10).root(1.2);
						if (x.gte(20)) x = x.times(20).sqrt();
						x = x.plus(derivedState.tmp.ge.boostReducedPurch).plus(1).floor();
						let totalOther;
						if (gameHelpers.hasMilestone("ge", 1)) totalOther = 0;
						else totalOther = Object.keys(saveState.player.ge.clickables).filter(x => (x!=this.id && x<20)).map(x => saveState.player.ge.clickables[x]).reduce((a,c) => Decimal.add(a, c));
						let target = x.sub(totalOther).max(0);
						saveState.player.ge.boosted = saveState.player.ge.boosted.max(x);
						saveState.player.ge.clickables[this.id] = Decimal.max(saveState.player.ge.clickables[this.id], target);
					} else {
						saveState.player.ge.boosted = saveState.player.ge.boosted.plus(1);
						saveState.player.ge.clickables[this.id] = Decimal.add(saveState.player.ge.clickables[this.id], 1)
					}
				},
				style: {"height": "150px", "width": "150px"},
			},
			13: {
				title() { return "Divide Tooth Size by "+gameHelpers.format(derivedState.tmp.ge.clickables[this.id].effectPer) },
				display() { 
					return "Req: "+gameHelpers.format(derivedState.tmp.ge.clickables[this.id].req)+" dust product"+(derivedState.tmp.nerdMode?" ("+derivedState.tmp.ge.boostReqFormula+")":"")+"<br><br>Currently: /"+gameHelpers.format(derivedState.tmp.ge.clickables[this.id].effect);
				},
				req() {
					if (gameHelpers.hasMilestone("ge", 1)) {
						let x = new Decimal(saveState.player.ge.clickables[this.id]||0).sub(derivedState.tmp.ge.boostReducedPurch);
						if (x.gte(20)) x = x.pow(2).div(20);
						return Decimal.pow(1e10, x.pow(1.2).times(x.lt(0)?(-1):1)).times(1e280) 
					} else return derivedState.tmp.ge.boostReq;
				},
				effectPer() { return Decimal.add(2, derivedState.tmp.ge.buyables[11].effect) },
				effect() { return Decimal.pow(derivedState.tmp.ge.clickables[this.id].effectPer, saveState.player.ge.clickables[this.id]) },
				unlocked() { return saveState.player.ge.unlocked },
				canClick() { return saveState.player.ge.unlocked && derivedState.tmp.n.dustProduct.gte(derivedState.tmp.ge.clickables[this.id].req) },
				onClick() { 
					if (saveState.player.ge.maxToggle && gameHelpers.hasMilestone("ge", 0)) {
						let x = derivedState.tmp.n.dustProduct.div(1e280).max(1).log(1e10).root(1.2);
						if (x.gte(20)) x = x.times(20).sqrt();
						x = x.plus(derivedState.tmp.ge.boostReducedPurch).plus(1).floor();
						let totalOther;
						if (gameHelpers.hasMilestone("ge", 1)) totalOther = 0;
						else totalOther = Object.keys(saveState.player.ge.clickables).filter(x => (x!=this.id && x<20)).map(x => saveState.player.ge.clickables[x]).reduce((a,c) => Decimal.add(a, c));
						let target = x.sub(totalOther).max(0);
						saveState.player.ge.boosted = saveState.player.ge.boosted.max(x);
						saveState.player.ge.clickables[this.id] = Decimal.max(saveState.player.ge.clickables[this.id], target);
					} else {
						saveState.player.ge.boosted = saveState.player.ge.boosted.plus(1);
						saveState.player.ge.clickables[this.id] = Decimal.add(saveState.player.ge.clickables[this.id], 1)
					}
				},
				style: {"height": "150px", "width": "150px"},
			},
			21: {
				title: "Reset Gear Upgrades",
				unlocked() { return saveState.player.ge.unlocked },
				canClick() { return saveState.player.ge.unlocked && saveState.player.ge.boosted.gt(0) },
				onClick() { 
					if (!effects.confirm("Are you sure you want to reset your Gear Upgrades? This will force a Gear reset!")) return;
					saveState.player.ge.boosted = new Decimal(0);
					for (let i=11;i<=13;i++) saveState.player.ge.clickables[i] = "";
					gameRules.doReset("ge", true);
				},
				style: {"height": "75px", "width": "100px"},
			},
		},
		milestones: {
			0: {
				requirementDescription: "1,000,000 Gears",
				done() { return saveState.player.ge.best.gte(1e6) },
				effectDescription: "You can buy max Gear Upgrades.",
				toggles: [["ge", "maxToggle"]],
			},
			1: {
				requirementDescription: "2e22 Gears",
				unlocked() { return saveState.player.ge.best.gte(1e6) },
				done() { return saveState.player.ge.best.gte(2e22) },
				effectDescription: "Gear Upgrade costs increase independently.",
			},
			2: {
				requirementDescription: "5e47 Gears & 25,000,000 Total Energy",
				unlocked() { return saveState.player.en.unlocked },
				done() { return saveState.player.en.unlocked && saveState.player.ge.best.gte(5e47) && saveState.player.en.total.gte(25e6) },
				effectDescription: "Total Energy multiplies Gear gain, and gain 1% of Gear gain every second.",
			},
			3: {
				requirementDescription: "1e141 Gears",
				unlocked() { return gameHelpers.hasUpgrade("ai", 13) },
				done() { return gameHelpers.hasUpgrade("ai", 13) && saveState.player.ge.best.gte(1e141) },
				effectDescription: "Teeth can be partial (can go below 1), Gear Evolution does not force a Row 7 reset, and unlock Auto-Gear Upgrades.",
				toggles: [["ge", "auto"]],
			},
		},
};
}
