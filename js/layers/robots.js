// Session-bound layer owner; composition supplies only the named ports.
// r — robots content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'>} ports */
function createRobotsLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState }) {
    return {
		name: "robots", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "R", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			allotted: {
				breeders: new Decimal((saveState.player && derivedState.tmp.ma && gameHelpers.hasUpgrade("ai", 12))?5:0),
				farmers: new Decimal((saveState.player && derivedState.tmp.ma && gameHelpers.hasUpgrade("ai", 12))?5:0),
				builders: new Decimal((saveState.player && derivedState.tmp.ma && gameHelpers.hasUpgrade("ai", 12))?5:0),
				growers: new Decimal((saveState.player && derivedState.tmp.ma && gameHelpers.hasUpgrade("ai", 12))?5:0),
				producers: new Decimal((saveState.player && derivedState.tmp.ma && gameHelpers.hasUpgrade("ai", 12))?5:0),
			},
			maxMinibots: new Decimal(0),
			spentMinibots: new Decimal(0),
			grownMinibots: new Decimal(0),
			fuel: new Decimal(0),
			buildings: new Decimal(1),
			growTime: new Decimal(0),
			deathTime: new Decimal(0),
			first: 0,
        }},
        color: "#00ccff",
		nodeStyle() { return {
			background: (saveState.player.r.unlocked||gameRules.canReset("r"))?((saveState.player.grad&&!saveState.player.oldStyle)?"radial-gradient(circle, #00ccff 0%, #b0b0b0 75%)":"#b0b0b0"):"#bf8f8f",
		}},
		componentStyles: {
			background() { return (saveState.player.r.unlocked||gameRules.canReset("r"))?((saveState.player.grad&&!saveState.player.oldStyle)?"radial-gradient(circle, #00ccff 0%, #b0b0b0 75%)":"#b0b0b0"):"#bf8f8f" },
		},
        resource: "robots", // Name of prestige currency
        type: "custom", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		baseResource: "total energy",
		baseAmount() { return saveState.player.en.total },
		req() { 
			let req = Decimal.root(5e8, saveState.player[this.layer].total.plus(1).log10().plus(1).log10().plus(1).log10().plus(1))
			if (saveState.player.ai.unlocked && derivedState.tmp.ai) req = req.div(derivedState.tmp.ai.conscEff2);
			return req.max(2);
		},
		requires() { return this.req() },
		exp: new Decimal(0.4),
		exponent() { return derivedState.tmp[this.layer].exp },
		gainMult() {
			let mult = new Decimal(1);
			if (gameHelpers.hasMilestone("r", 3)) mult = mult.times(2);
			if (saveState.player.ai.unlocked && derivedState.tmp.ai) mult = mult.times(derivedState.tmp.ai.conscEff1);
			if (gameHelpers.hasUpgrade("ai", 33)) mult = mult.times(gameHelpers.upgradeEffect("ai", 33));
			return mult;
		},
		getResetGain() {
			let gain = Decimal.pow(derivedState.tmp.r.req, saveState.player.en.total.plus(1).log(derivedState.tmp.r.req).pow(derivedState.tmp.r.exp)).div(derivedState.tmp.r.req);
			return gain.times(derivedState.tmp.r.gainMult).floor();
		},
		resetGain() { return this.getResetGain() },
		getNextAt() {
			let gain = derivedState.tmp.r.getResetGain.div(derivedState.tmp.r.gainMult).plus(1)
			return Decimal.pow(derivedState.tmp.r.req, gain.times(derivedState.tmp.r.req).max(1).log(derivedState.tmp.r.req).root(derivedState.tmp.r.exp)).sub(1)
		},
		passiveGeneration() { return false },
		canReset() {
			return saveState.player.en.total.gte(derivedState.tmp.r.req) && derivedState.tmp.r.getResetGain.gt(0)
		},
		dispGainFormula() {
			let start = derivedState.tmp.r.req;
			let exp = derivedState.tmp.r.exp;
			return "("+gameHelpers.format(start)+" ^ (log(x+1) / log("+gameHelpers.format(derivedState.tmp.r.req)+") ^ "+gameHelpers.format(exp)+")) / "+gameHelpers.format(start)
		},
		prestigeButtonText() {
			if (derivedState.tmp.nerdMode) return "Gain Formula: "+derivedState.tmp.r.dispGainFormula;
			else return `${ saveState.player.r.points.lt(1e3) ? (derivedState.tmp.r.resetDescription !== undefined ? derivedState.tmp.r.resetDescription : "Reset for ") : ""}+<b>${gameHelpers.formatWhole(derivedState.tmp.r.getResetGain)}</b> ${derivedState.tmp.r.resource} ${derivedState.tmp.r.resetGain.lt(100) && saveState.player.r.points.lt(1e3) ? `<br><br>Next at ${gameHelpers.format(derivedState.tmp.r.nextAt)} Energy` : ""}`
		},
		prestigeNotify() {
			if (!gameRules.canReset("r")) return false;
			if (derivedState.tmp.r.getResetGain.gte(saveState.player.en.total.times(0.1).max(1)) && !derivedState.tmp.r.passiveGeneration) return true;
			else return false;
		},
		tooltip() { return gameHelpers.formatWhole(saveState.player.r.points)+" Robots" },
		tooltipLocked() { return "Reach "+gameHelpers.formatWhole(derivedState.tmp.r.req)+" Total Energy to unlock (You have "+gameHelpers.formatWhole(saveState.player.en.total)+" Total Energy)" },
        row: 5, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "r", description: "Press R to Robot Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			if (layerRegistry.layers[resettingLayer].row==5||layerRegistry.layers[resettingLayer].row==6) {
				saveState.player.r.maxMinibots = new Decimal(0);
				saveState.player.r.spentMinibots = new Decimal(0);
				saveState.player.r.grownMinibots = new Decimal(0);
				saveState.player.r.fuel = new Decimal(0);
				saveState.player.r.buildings = new Decimal(1);
				saveState.player.r.growTime = new Decimal(0);
				saveState.player.r.deathTime = new Decimal(0);
			}
			
			if (layerRegistry.layers[resettingLayer].row > this.row+1 || resettingLayer=="ai") gameRules.layerDataReset(this.layer, keep)
        },
        layerShown(){return saveState.player.id.unlocked },
        branches: ["en"],
		update(diff) {
			if (!saveState.player[this.layer].unlocked) return;
			saveState.player.r.maxMinibots = saveState.player.r.maxMinibots.max(derivedState.tmp.r.totalMinibots);
			saveState.player.r.fuel = saveState.player.r.fuel.pow(1.5).plus(saveState.player.r.allotted.farmers.div(4).times(diff)).root(1.5);
			saveState.player.r.buildings = saveState.player.r.buildings.pow(2).plus(saveState.player.r.allotted.builders.times((gameHelpers.hasMilestone("id", 5)&&derivedState.tmp.id)?derivedState.tmp.id.rev.max(1):1).div(3).times(diff)).sqrt();
			if (derivedState.tmp.r.minibots.gt(0)) {
				saveState.player.r.deathTime = saveState.player.r.deathTime.plus(diff);
				saveState.player.r.growTime = saveState.player.r.growTime.plus(diff);
			}
			if (Decimal.gte(saveState.player.r.deathTime, derivedState.tmp.r.deathTime)) {
				let bulk = saveState.player.r.growTime.div(derivedState.tmp.r.growTime).min(derivedState.tmp.r.minibots).floor();
				saveState.player.r.deathTime = new Decimal(0);
				if (derivedState.tmp.r.minibots.gt(0)) {
					saveState.player.r.spentMinibots = saveState.player.r.spentMinibots.plus(bulk);
				}
			}
			if (Decimal.gte(saveState.player.r.growTime, derivedState.tmp.r.growTime)) {
				let bulk = saveState.player.r.growTime.div(derivedState.tmp.r.growTime).min(derivedState.tmp.r.minibots).floor();
				saveState.player.r.growTime = new Decimal(0);
				if (derivedState.tmp.r.minibots.gt(0)) {
					gameRules.addPoints("r", gameHelpers.hasUpgrade("ai", 12)?bulk.times(derivedState.tmp.r.getResetGain.div(20)):bulk);
					saveState.player.r.spentMinibots = saveState.player.r.spentMinibots.plus(bulk);
					saveState.player.r.grownMinibots = saveState.player.r.grownMinibots.plus(bulk);
				}
			}
			if (gameHelpers.hasMilestone("r", 5)) {
				saveState.player.r.allotted.breeders = saveState.player.r.allotted.breeders.plus(saveState.player.r.points.div(50).times(diff));
				saveState.player.r.allotted.farmers = saveState.player.r.allotted.farmers.plus(saveState.player.r.points.div(50).times(diff));
				saveState.player.r.allotted.builders = saveState.player.r.allotted.builders.plus(saveState.player.r.points.div(50).times(diff));
				saveState.player.r.allotted.growers = saveState.player.r.allotted.growers.plus(saveState.player.r.points.div(50).times(diff));
				saveState.player.r.allotted.producers = saveState.player.r.allotted.producers.plus(saveState.player.r.points.div(50).times(diff));
			}
		},
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display", "blank",
			"milestones",
			"blank", "blank", 
			["clickable", 16], "blank",
			["row", [
				["column", [
					["display-text", function() { return "<h3>"+gameHelpers.formatWhole(saveState.player.r.allotted.breeders)+"<br>Breeders</h3><br><br><br>" }], "blank",
					["row", [["clickable", 11], ["clickable", 21]]], "blank", "blank",
					["display-text", function() { return "Next Minibot at "+gameHelpers.format(derivedState.tmp.r.nextMinibot)+" Total Energy"+(derivedState.tmp.nerdMode?" (Formula: log(EN/1e5 * breeders^"+gameHelpers.formatWhole(derivedState.tmp.r.breederExp)+") ^ (2/3))":".") }],
				], {width: "9em"}],
				["tall-display-text", "<div class='vl2'></div>", {height: "223.667px"}],
				["column", [
					["display-text", function() { return "<h3>"+gameHelpers.formatWhole(saveState.player.r.allotted.farmers)+"<br>Farmers</h3><br>(Req: 1 Breeder)<br><br>" }], "blank",
					["row", [["clickable", 12], ["clickable", 22]]], "blank", "blank",
					["display-text", function() { return "Fuel: "+gameHelpers.format(saveState.player.r.fuel)+", which improves the next Minibot's lifespan to "+gameHelpers.formatTime(derivedState.tmp.r.deathTime.sub(saveState.player.r.deathTime))+"." }],
				], {width: "9em"}],
				["tall-display-text", "<div class='vl2'></div>", {height: "223.667px"}],
				["column", [
					["display-text", function() { return "<h3>"+gameHelpers.formatWhole(saveState.player.r.allotted.builders)+"<br>Builders</h3><br>(Req: 1 Breeder)<br><br>" }], "blank",
					["row", [["clickable", 13], ["clickable", 23]]], "blank", "blank",
					["display-text", function() { return "Buildings: "+gameHelpers.formatWhole(saveState.player.r.buildings.floor())+", which caps your Minibots at "+gameHelpers.formatWhole(derivedState.tmp.r.minibotCap)+(derivedState.tmp.nerdMode?" (Formula: log2(x)+3)":"")+" and multiplies Gear gain by "+gameHelpers.formatWhole(derivedState.tmp.r.buildingEff)+(derivedState.tmp.nerdMode?" (Formula: (x-1)^3*100+1)":".") }],
				], {width: "9em"}],
				["tall-display-text", "<div class='vl2'></div>", {height: "223.667px"}],
				["column", [
					["display-text", function() { return "<h3>"+gameHelpers.formatWhole(saveState.player.r.allotted.growers)+"<br>Growth Experts</h3><br>(Req: 1 Breeder)<br>" }], "blank",
					["row", [["clickable", 14], ["clickable", 24]]], "blank", "blank",
					["display-text", function() { return "Next Minibot transforms into Robot in "+gameHelpers.formatTime(derivedState.tmp.r.growTime.sub(saveState.player.r.growTime))+"." }],
				], {width: "9em"}],
				["tall-display-text", "<div class='vl2'></div>", {height: "223.667px"}],
				["column", [
					["display-text", function() { return "<h3>"+gameHelpers.formatWhole(saveState.player.r.allotted.producers)+"<br>Producers</h3><br><br><br>" }], "blank",
					["row", [["clickable", 15], ["clickable", 25]]], "blank", "blank",
					["display-text", function() { return "Multiply Energy gain by "+gameHelpers.format(derivedState.tmp.r.producerEff)+(derivedState.tmp.nerdMode?" (Formula: ((x^1.5)/4+1))":"") }],
				], {width: "9em"}],
			], function() { return {display: saveState.player.r.unlocked?"":"none"} }], "blank", "blank",
			["display-text", function() { return "You have <h2 style='color: #00ccff; text-shadow: 0px 0px 7px #00ccff;'>"+gameHelpers.formatWhole(derivedState.tmp.r.minibots)+" / "+gameHelpers.formatWhole(derivedState.tmp.r.minibotCap)+"</h2> Minibots" }],
		],
		breederExp() {
			let exp = new Decimal(3);
			if (gameHelpers.hasMilestone("r", 2)) exp = exp.times(2);
			return exp;
		},
		reduceMinibotReqMult() {
			let mult = new Decimal(0);
			if (gameHelpers.hasMilestone("r", 3)) mult = mult.plus(.5);
			if (gameHelpers.hasUpgrade("ai", 23)) mult = mult.plus(.5);
			return mult;
		},
		nextMinibot() { 
			if (saveState.player.r.allotted.breeders.lt(1)||derivedState.tmp.r.totalMinibots.gte(derivedState.tmp.r.minibotCap.plus(saveState.player.r.spentMinibots))) return new Decimal(1/0);
			else return Decimal.pow(10, derivedState.tmp.r.totalMinibots.sub(saveState.player.r.grownMinibots.times(derivedState.tmp.r.reduceMinibotReqMult)).plus(1).pow(1.5)).times(1e5).div(saveState.player.r.allotted.breeders.max(1).pow(derivedState.tmp.r.breederExp));
		},
		totalMinibots() { 
			if (saveState.player.r.allotted.breeders.lt(1)) return new Decimal(0);
			else return saveState.player.en.total.times(saveState.player.r.allotted.breeders.pow(derivedState.tmp.r.breederExp)).div(1e5).max(1).log10().root(1.5).plus(saveState.player.r.grownMinibots.times(derivedState.tmp.r.reduceMinibotReqMult)).floor().min(derivedState.tmp.r.minibotCap.plus(saveState.player.r.spentMinibots))
		},
		minibots() { return saveState.player.r.maxMinibots.sub(saveState.player.r.spentMinibots).max(0) },
		deathTime() { return saveState.player.r.fuel.plus(1).log2().div(3).plus(1).times(20).div(gameHelpers.hasUpgrade("ai", 21)?20:1) },
		minibotCap() { return saveState.player.r.buildings.floor().max(1).log2().plus(3).floor() },
		buildingEff() { return saveState.player.r.buildings.sub(1).max(0).floor().pow(3).times(100).plus(1) },
		growTime() { return saveState.player.r.allotted.growers.lt(1)?new Decimal(1/0):Decimal.div(30, saveState.player.r.allotted.growers.log10().plus(1)).div(gameHelpers.hasUpgrade("ai", 21)?5:1) },
		producerEff() { 
			let mult = gameHelpers.hasMilestone("r", 3) ? saveState.player.r.grownMinibots.div(4).plus(1) : new Decimal(1);
			if (gameHelpers.hasUpgrade("ai", 23)) mult = mult.times(saveState.player.r.grownMinibots.times(.4).plus(1));
			return saveState.player.r.allotted.producers.pow(1.5).div(4).plus(1).times(mult);
		},
		clickables: {
			rows: 2,
			cols: 6,
			11: {
				title: "+1",
				unlocked() { return saveState.player.r.unlocked },
				canClick() { return saveState.player.r.unlocked && saveState.player.r.points.gt(0) },
				onClick() { 
					saveState.player.r.allotted.breeders = saveState.player.r.allotted.breeders.plus(1);
					saveState.player.r.points = saveState.player.r.points.sub(1).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			12: {
				title: "+1",
				unlocked() { return saveState.player.r.unlocked },
				canClick() { return saveState.player.r.unlocked && saveState.player.r.points.gt(0) && saveState.player.r.allotted.breeders.gte(1) },
				onClick() { 
					saveState.player.r.allotted.farmers = saveState.player.r.allotted.farmers.plus(1);
					saveState.player.r.points = saveState.player.r.points.sub(1).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			13: {
				title: "+1",
				unlocked() { return saveState.player.r.unlocked },
				canClick() { return saveState.player.r.unlocked && saveState.player.r.points.gt(0) && saveState.player.r.allotted.breeders.gte(1) },
				onClick() { 
					saveState.player.r.allotted.builders = saveState.player.r.allotted.builders.plus(1);
					saveState.player.r.points = saveState.player.r.points.sub(1).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			14: {
				title: "+1",
				unlocked() { return saveState.player.r.unlocked },
				canClick() { return saveState.player.r.unlocked && saveState.player.r.points.gt(0) && saveState.player.r.allotted.breeders.gte(1) },
				onClick() { 
					saveState.player.r.allotted.growers = saveState.player.r.allotted.growers.plus(1);
					saveState.player.r.points = saveState.player.r.points.sub(1).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			15: {
				title: "+1",
				unlocked() { return saveState.player.r.unlocked },
				canClick() { return saveState.player.r.unlocked && saveState.player.r.points.gt(0) },
				onClick() { 
					saveState.player.r.allotted.producers = saveState.player.r.allotted.producers.plus(1);
					saveState.player.r.points = saveState.player.r.points.sub(1).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			16: {
				title: "Distribute",
				unlocked() { return saveState.player.r.unlocked },
				canClick() { return saveState.player.r.unlocked && saveState.player.r.points.gte(5) && saveState.player.r.allotted.breeders.gte(1) },
				onClick() { 
					let spendEach = saveState.player.r.points.div(5).floor()
					saveState.player.r.allotted.breeders = saveState.player.r.allotted.breeders.plus(spendEach);
					saveState.player.r.allotted.farmers = saveState.player.r.allotted.farmers.plus(spendEach);
					saveState.player.r.allotted.builders = saveState.player.r.allotted.builders.plus(spendEach);
					saveState.player.r.allotted.growers = saveState.player.r.allotted.growers.plus(spendEach);
					saveState.player.r.allotted.producers = saveState.player.r.allotted.producers.plus(spendEach);
					saveState.player.r.points = saveState.player.r.points.sub(spendEach.times(5)).max(0);
				},
				style: {width: "120px", height: "50px"},
			},
			21: {
				title: "50%",
				unlocked() { return saveState.player.r.unlocked },
				canClick() { return saveState.player.r.unlocked && saveState.player.r.points.gte(2) },
				onClick() { 
					let spend = saveState.player.r.points.div(2).floor();
					saveState.player.r.allotted.breeders = saveState.player.r.allotted.breeders.plus(spend);
					saveState.player.r.points = saveState.player.r.points.sub(spend).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			22: {
				title: "50%",
				unlocked() { return saveState.player.r.unlocked },
				canClick() { return saveState.player.r.unlocked && saveState.player.r.points.gte(2) && saveState.player.r.allotted.breeders.gte(1) },
				onClick() { 
					let spend = saveState.player.r.points.div(2).floor();
					saveState.player.r.allotted.farmers = saveState.player.r.allotted.farmers.plus(spend);
					saveState.player.r.points = saveState.player.r.points.sub(spend).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			23: {
				title: "50%",
				unlocked() { return saveState.player.r.unlocked },
				canClick() { return saveState.player.r.unlocked && saveState.player.r.points.gte(2) && saveState.player.r.allotted.breeders.gte(1) },
				onClick() { 
					let spend = saveState.player.r.points.div(2).floor();
					saveState.player.r.allotted.builders = saveState.player.r.allotted.builders.plus(spend);
					saveState.player.r.points = saveState.player.r.points.sub(spend).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			24: {
				title: "50%",
				unlocked() { return saveState.player.r.unlocked },
				canClick() { return saveState.player.r.unlocked && saveState.player.r.points.gte(2) && saveState.player.r.allotted.breeders.gte(1) },
				onClick() { 
					let spend = saveState.player.r.points.div(2).floor();
					saveState.player.r.allotted.growers = saveState.player.r.allotted.growers.plus(spend);
					saveState.player.r.points = saveState.player.r.points.sub(spend).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			25: {
				title: "50%",
				unlocked() { return saveState.player.r.unlocked },
				canClick() { return saveState.player.r.unlocked && saveState.player.r.points.gte(2) },
				onClick() { 
					let spend = saveState.player.r.points.div(2).floor();
					saveState.player.r.allotted.producers = saveState.player.r.allotted.producers.plus(spend);
					saveState.player.r.points = saveState.player.r.points.sub(spend).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
		},
		milestones: {
			0: {
				requirementDescription: "50 Total Robots",
				done() { return saveState.player.r.total.gte(50) },
				effectDescription: "Minibots multiply Energy & Signal gain",
			},
			1: {
				requirementDescription: "100 Total Robots",
				done() { return saveState.player.r.total.gte(100)||gameHelpers.hasAchievement("a", 161) },
				effectDescription: "Non-selected Watts are still generated (but 3x slower), and Total Robots multiply Watt generation speed",
			},
			2: {
				requirementDescription: "360 Total Robots",
				done() { return saveState.player.r.total.gte(360) },
				effectDescription: "Effective Breeders are squared",
			},
			3: {
				requirementDescription: "500 Total Robots",
				done() { return saveState.player.r.total.gte(500) },
				effectDescription: "Double Robot gain, and when a Minibot is transformed into a Robot, the requirement for the next Minibot is reduced by 0.5 levels & the Producer effect is 25% stronger (additive)",
			},
			4: {
				unlocked() { return saveState.player.id.unlocked||gameHelpers.hasAchievement("a", 161) },
				requirementDescription: "2,000 Total Robots",
				done() { return saveState.player.r.total.gte(2e3)||gameHelpers.hasAchievement("a", 161) },
				effectDescription: "Triple Robot gain, and the Producer effect also multiplies Watt generation speed & Signal gain",
			},
			5: {
				unlocked() { return gameHelpers.hasUpgrade("ai", 21) },
				requirementDescription: "4,000,000 Total Robots",
				done() { return saveState.player.r.total.gte(4e6) && gameHelpers.hasUpgrade("ai", 21) },
				effectDescription: "Automatically distribute 10% of your Robots every second without actually spending any Robots.",
			},
		},
};
}
