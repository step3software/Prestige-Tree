// r — robots content. Registration: manifest.js.
function createRobotsLayer() {
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
				breeders: new Decimal((player && tmp.ma && hasUpgrade("ai", 12))?5:0),
				farmers: new Decimal((player && tmp.ma && hasUpgrade("ai", 12))?5:0),
				builders: new Decimal((player && tmp.ma && hasUpgrade("ai", 12))?5:0),
				growers: new Decimal((player && tmp.ma && hasUpgrade("ai", 12))?5:0),
				producers: new Decimal((player && tmp.ma && hasUpgrade("ai", 12))?5:0),
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
			background: (player.r.unlocked||canReset("r"))?((player.grad&&!player.oldStyle)?"radial-gradient(circle, #00ccff 0%, #b0b0b0 75%)":"#b0b0b0"):"#bf8f8f",
		}},
		componentStyles: {
			background() { return (player.r.unlocked||canReset("r"))?((player.grad&&!player.oldStyle)?"radial-gradient(circle, #00ccff 0%, #b0b0b0 75%)":"#b0b0b0"):"#bf8f8f" },
		},
        resource: "robots", // Name of prestige currency
        type: "custom", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		baseResource: "total energy",
		baseAmount() { return player.en.total },
		req() { 
			let req = Decimal.root(5e8, player[this.layer].total.plus(1).log10().plus(1).log10().plus(1).log10().plus(1))
			if (player.ai.unlocked && tmp.ai) req = req.div(tmp.ai.conscEff2);
			return req.max(2);
		},
		requires() { return this.req() },
		exp: new Decimal(0.4),
		exponent() { return tmp[this.layer].exp },
		gainMult() {
			let mult = new Decimal(1);
			if (hasMilestone("r", 3)) mult = mult.times(2);
			if (player.ai.unlocked && tmp.ai) mult = mult.times(tmp.ai.conscEff1);
			if (hasUpgrade("ai", 33)) mult = mult.times(upgradeEffect("ai", 33));
			return mult;
		},
		getResetGain() {
			let gain = Decimal.pow(tmp.r.req, player.en.total.plus(1).log(tmp.r.req).pow(tmp.r.exp)).div(tmp.r.req);
			return gain.times(tmp.r.gainMult).floor();
		},
		resetGain() { return this.getResetGain() },
		getNextAt() {
			let gain = tmp.r.getResetGain.div(tmp.r.gainMult).plus(1)
			return Decimal.pow(tmp.r.req, gain.times(tmp.r.req).max(1).log(tmp.r.req).root(tmp.r.exp)).sub(1)
		},
		passiveGeneration() { return false },
		canReset() {
			return player.en.total.gte(tmp.r.req) && tmp.r.getResetGain.gt(0)
		},
		dispGainFormula() {
			let start = tmp.r.req;
			let exp = tmp.r.exp;
			return "("+format(start)+" ^ (log(x+1) / log("+format(tmp.r.req)+") ^ "+format(exp)+")) / "+format(start)
		},
		prestigeButtonText() {
			if (tmp.nerdMode) return "Gain Formula: "+tmp.r.dispGainFormula;
			else return `${ player.r.points.lt(1e3) ? (tmp.r.resetDescription !== undefined ? tmp.r.resetDescription : "Reset for ") : ""}+<b>${formatWhole(tmp.r.getResetGain)}</b> ${tmp.r.resource} ${tmp.r.resetGain.lt(100) && player.r.points.lt(1e3) ? `<br><br>Next at ${format(tmp.r.nextAt)} Energy` : ""}`
		},
		prestigeNotify() {
			if (!canReset("r")) return false;
			if (tmp.r.getResetGain.gte(player.en.total.times(0.1).max(1)) && !tmp.r.passiveGeneration) return true;
			else return false;
		},
		tooltip() { return formatWhole(player.r.points)+" Robots" },
		tooltipLocked() { return "Reach "+formatWhole(tmp.r.req)+" Total Energy to unlock (You have "+formatWhole(player.en.total)+" Total Energy)" },
        row: 5, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "r", description: "Press R to Robot Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			if (layers[resettingLayer].row==5||layers[resettingLayer].row==6) {
				player.r.maxMinibots = new Decimal(0);
				player.r.spentMinibots = new Decimal(0);
				player.r.grownMinibots = new Decimal(0);
				player.r.fuel = new Decimal(0);
				player.r.buildings = new Decimal(1);
				player.r.growTime = new Decimal(0);
				player.r.deathTime = new Decimal(0);
			}
			
			if (layers[resettingLayer].row > this.row+1 || resettingLayer=="ai") layerDataReset(this.layer, keep)
        },
        layerShown(){return player.id.unlocked },
        branches: ["en"],
		update(diff) {
			if (!player[this.layer].unlocked) return;
			player.r.maxMinibots = player.r.maxMinibots.max(tmp.r.totalMinibots);
			player.r.fuel = player.r.fuel.pow(1.5).plus(player.r.allotted.farmers.div(4).times(diff)).root(1.5);
			player.r.buildings = player.r.buildings.pow(2).plus(player.r.allotted.builders.times((hasMilestone("id", 5)&&tmp.id)?tmp.id.rev.max(1):1).div(3).times(diff)).sqrt();
			if (tmp.r.minibots.gt(0)) {
				player.r.deathTime = player.r.deathTime.plus(diff);
				player.r.growTime = player.r.growTime.plus(diff);
			}
			if (Decimal.gte(player.r.deathTime, tmp.r.deathTime)) {
				let bulk = player.r.growTime.div(tmp.r.growTime).min(tmp.r.minibots).floor();
				player.r.deathTime = new Decimal(0);
				if (tmp.r.minibots.gt(0)) {
					player.r.spentMinibots = player.r.spentMinibots.plus(bulk);
				}
			}
			if (Decimal.gte(player.r.growTime, tmp.r.growTime)) {
				let bulk = player.r.growTime.div(tmp.r.growTime).min(tmp.r.minibots).floor();
				player.r.growTime = new Decimal(0);
				if (tmp.r.minibots.gt(0)) {
					addPoints("r", hasUpgrade("ai", 12)?bulk.times(tmp.r.getResetGain.div(20)):bulk);
					player.r.spentMinibots = player.r.spentMinibots.plus(bulk);
					player.r.grownMinibots = player.r.grownMinibots.plus(bulk);
				}
			}
			if (hasMilestone("r", 5)) {
				player.r.allotted.breeders = player.r.allotted.breeders.plus(player.r.points.div(50).times(diff));
				player.r.allotted.farmers = player.r.allotted.farmers.plus(player.r.points.div(50).times(diff));
				player.r.allotted.builders = player.r.allotted.builders.plus(player.r.points.div(50).times(diff));
				player.r.allotted.growers = player.r.allotted.growers.plus(player.r.points.div(50).times(diff));
				player.r.allotted.producers = player.r.allotted.producers.plus(player.r.points.div(50).times(diff));
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
					["display-text", function() { return "<h3>"+formatWhole(player.r.allotted.breeders)+"<br>Breeders</h3><br><br><br>" }], "blank",
					["row", [["clickable", 11], ["clickable", 21]]], "blank", "blank",
					["display-text", function() { return "Next Minibot at "+format(tmp.r.nextMinibot)+" Total Energy"+(tmp.nerdMode?" (Formula: log(EN/1e5 * breeders^"+formatWhole(tmp.r.breederExp)+") ^ (2/3))":".") }],
				], {width: "9em"}],
				["tall-display-text", "<div class='vl2'></div>", {height: "223.667px"}],
				["column", [
					["display-text", function() { return "<h3>"+formatWhole(player.r.allotted.farmers)+"<br>Farmers</h3><br>(Req: 1 Breeder)<br><br>" }], "blank",
					["row", [["clickable", 12], ["clickable", 22]]], "blank", "blank",
					["display-text", function() { return "Fuel: "+format(player.r.fuel)+", which improves the next Minibot's lifespan to "+formatTime(tmp.r.deathTime.sub(player.r.deathTime))+"." }],
				], {width: "9em"}],
				["tall-display-text", "<div class='vl2'></div>", {height: "223.667px"}],
				["column", [
					["display-text", function() { return "<h3>"+formatWhole(player.r.allotted.builders)+"<br>Builders</h3><br>(Req: 1 Breeder)<br><br>" }], "blank",
					["row", [["clickable", 13], ["clickable", 23]]], "blank", "blank",
					["display-text", function() { return "Buildings: "+formatWhole(player.r.buildings.floor())+", which caps your Minibots at "+formatWhole(tmp.r.minibotCap)+(tmp.nerdMode?" (Formula: log2(x)+3)":"")+" and multiplies Gear gain by "+formatWhole(tmp.r.buildingEff)+(tmp.nerdMode?" (Formula: (x-1)^3*100+1)":".") }],
				], {width: "9em"}],
				["tall-display-text", "<div class='vl2'></div>", {height: "223.667px"}],
				["column", [
					["display-text", function() { return "<h3>"+formatWhole(player.r.allotted.growers)+"<br>Growth Experts</h3><br>(Req: 1 Breeder)<br>" }], "blank",
					["row", [["clickable", 14], ["clickable", 24]]], "blank", "blank",
					["display-text", function() { return "Next Minibot transforms into Robot in "+formatTime(tmp.r.growTime.sub(player.r.growTime))+"." }],
				], {width: "9em"}],
				["tall-display-text", "<div class='vl2'></div>", {height: "223.667px"}],
				["column", [
					["display-text", function() { return "<h3>"+formatWhole(player.r.allotted.producers)+"<br>Producers</h3><br><br><br>" }], "blank",
					["row", [["clickable", 15], ["clickable", 25]]], "blank", "blank",
					["display-text", function() { return "Multiply Energy gain by "+format(tmp.r.producerEff)+(tmp.nerdMode?" (Formula: ((x^1.5)/4+1))":"") }],
				], {width: "9em"}],
			], function() { return {display: player.r.unlocked?"":"none"} }], "blank", "blank",
			["display-text", function() { return "You have <h2 style='color: #00ccff; text-shadow: 0px 0px 7px #00ccff;'>"+formatWhole(tmp.r.minibots)+" / "+formatWhole(tmp.r.minibotCap)+"</h2> Minibots" }],
		],
		breederExp() {
			let exp = new Decimal(3);
			if (hasMilestone("r", 2)) exp = exp.times(2);
			return exp;
		},
		reduceMinibotReqMult() {
			let mult = new Decimal(0);
			if (hasMilestone("r", 3)) mult = mult.plus(.5);
			if (hasUpgrade("ai", 23)) mult = mult.plus(.5);
			return mult;
		},
		nextMinibot() { 
			if (player.r.allotted.breeders.lt(1)||tmp.r.totalMinibots.gte(tmp.r.minibotCap.plus(player.r.spentMinibots))) return new Decimal(1/0);
			else return Decimal.pow(10, tmp.r.totalMinibots.sub(player.r.grownMinibots.times(tmp.r.reduceMinibotReqMult)).plus(1).pow(1.5)).times(1e5).div(player.r.allotted.breeders.max(1).pow(tmp.r.breederExp));
		},
		totalMinibots() { 
			if (player.r.allotted.breeders.lt(1)) return new Decimal(0);
			else return player.en.total.times(player.r.allotted.breeders.pow(tmp.r.breederExp)).div(1e5).max(1).log10().root(1.5).plus(player.r.grownMinibots.times(tmp.r.reduceMinibotReqMult)).floor().min(tmp.r.minibotCap.plus(player.r.spentMinibots))
		},
		minibots() { return player.r.maxMinibots.sub(player.r.spentMinibots).max(0) },
		deathTime() { return player.r.fuel.plus(1).log2().div(3).plus(1).times(20).div(hasUpgrade("ai", 21)?20:1) },
		minibotCap() { return player.r.buildings.floor().max(1).log2().plus(3).floor() },
		buildingEff() { return player.r.buildings.sub(1).max(0).floor().pow(3).times(100).plus(1) },
		growTime() { return player.r.allotted.growers.lt(1)?new Decimal(1/0):Decimal.div(30, player.r.allotted.growers.log10().plus(1)).div(hasUpgrade("ai", 21)?5:1) },
		producerEff() { 
			let mult = hasMilestone("r", 3) ? player.r.grownMinibots.div(4).plus(1) : new Decimal(1);
			if (hasUpgrade("ai", 23)) mult = mult.times(player.r.grownMinibots.times(.4).plus(1));
			return player.r.allotted.producers.pow(1.5).div(4).plus(1).times(mult);
		},
		clickables: {
			rows: 2,
			cols: 6,
			11: {
				title: "+1",
				unlocked() { return player.r.unlocked },
				canClick() { return player.r.unlocked && player.r.points.gt(0) },
				onClick() { 
					player.r.allotted.breeders = player.r.allotted.breeders.plus(1);
					player.r.points = player.r.points.sub(1).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			12: {
				title: "+1",
				unlocked() { return player.r.unlocked },
				canClick() { return player.r.unlocked && player.r.points.gt(0) && player.r.allotted.breeders.gte(1) },
				onClick() { 
					player.r.allotted.farmers = player.r.allotted.farmers.plus(1);
					player.r.points = player.r.points.sub(1).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			13: {
				title: "+1",
				unlocked() { return player.r.unlocked },
				canClick() { return player.r.unlocked && player.r.points.gt(0) && player.r.allotted.breeders.gte(1) },
				onClick() { 
					player.r.allotted.builders = player.r.allotted.builders.plus(1);
					player.r.points = player.r.points.sub(1).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			14: {
				title: "+1",
				unlocked() { return player.r.unlocked },
				canClick() { return player.r.unlocked && player.r.points.gt(0) && player.r.allotted.breeders.gte(1) },
				onClick() { 
					player.r.allotted.growers = player.r.allotted.growers.plus(1);
					player.r.points = player.r.points.sub(1).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			15: {
				title: "+1",
				unlocked() { return player.r.unlocked },
				canClick() { return player.r.unlocked && player.r.points.gt(0) },
				onClick() { 
					player.r.allotted.producers = player.r.allotted.producers.plus(1);
					player.r.points = player.r.points.sub(1).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			16: {
				title: "Distribute",
				unlocked() { return player.r.unlocked },
				canClick() { return player.r.unlocked && player.r.points.gte(5) && player.r.allotted.breeders.gte(1) },
				onClick() { 
					let spendEach = player.r.points.div(5).floor()
					player.r.allotted.breeders = player.r.allotted.breeders.plus(spendEach);
					player.r.allotted.farmers = player.r.allotted.farmers.plus(spendEach);
					player.r.allotted.builders = player.r.allotted.builders.plus(spendEach);
					player.r.allotted.growers = player.r.allotted.growers.plus(spendEach);
					player.r.allotted.producers = player.r.allotted.producers.plus(spendEach);
					player.r.points = player.r.points.sub(spendEach.times(5)).max(0);
				},
				style: {width: "120px", height: "50px"},
			},
			21: {
				title: "50%",
				unlocked() { return player.r.unlocked },
				canClick() { return player.r.unlocked && player.r.points.gte(2) },
				onClick() { 
					let spend = player.r.points.div(2).floor();
					player.r.allotted.breeders = player.r.allotted.breeders.plus(spend);
					player.r.points = player.r.points.sub(spend).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			22: {
				title: "50%",
				unlocked() { return player.r.unlocked },
				canClick() { return player.r.unlocked && player.r.points.gte(2) && player.r.allotted.breeders.gte(1) },
				onClick() { 
					let spend = player.r.points.div(2).floor();
					player.r.allotted.farmers = player.r.allotted.farmers.plus(spend);
					player.r.points = player.r.points.sub(spend).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			23: {
				title: "50%",
				unlocked() { return player.r.unlocked },
				canClick() { return player.r.unlocked && player.r.points.gte(2) && player.r.allotted.breeders.gte(1) },
				onClick() { 
					let spend = player.r.points.div(2).floor();
					player.r.allotted.builders = player.r.allotted.builders.plus(spend);
					player.r.points = player.r.points.sub(spend).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			24: {
				title: "50%",
				unlocked() { return player.r.unlocked },
				canClick() { return player.r.unlocked && player.r.points.gte(2) && player.r.allotted.breeders.gte(1) },
				onClick() { 
					let spend = player.r.points.div(2).floor();
					player.r.allotted.growers = player.r.allotted.growers.plus(spend);
					player.r.points = player.r.points.sub(spend).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
			25: {
				title: "50%",
				unlocked() { return player.r.unlocked },
				canClick() { return player.r.unlocked && player.r.points.gte(2) },
				onClick() { 
					let spend = player.r.points.div(2).floor();
					player.r.allotted.producers = player.r.allotted.producers.plus(spend);
					player.r.points = player.r.points.sub(spend).max(0);
				},
				style: {width: "50px", height: "50px"},
			},
		},
		milestones: {
			0: {
				requirementDescription: "50 Total Robots",
				done() { return player.r.total.gte(50) },
				effectDescription: "Minibots multiply Energy & Signal gain",
			},
			1: {
				requirementDescription: "100 Total Robots",
				done() { return player.r.total.gte(100)||hasAchievement("a", 161) },
				effectDescription: "Non-selected Watts are still generated (but 3x slower), and Total Robots multiply Watt generation speed",
			},
			2: {
				requirementDescription: "360 Total Robots",
				done() { return player.r.total.gte(360) },
				effectDescription: "Effective Breeders are squared",
			},
			3: {
				requirementDescription: "500 Total Robots",
				done() { return player.r.total.gte(500) },
				effectDescription: "Double Robot gain, and when a Minibot is transformed into a Robot, the requirement for the next Minibot is reduced by 0.5 levels & the Producer effect is 25% stronger (additive)",
			},
			4: {
				unlocked() { return player.id.unlocked||hasAchievement("a", 161) },
				requirementDescription: "2,000 Total Robots",
				done() { return player.r.total.gte(2e3)||hasAchievement("a", 161) },
				effectDescription: "Triple Robot gain, and the Producer effect also multiplies Watt generation speed & Signal gain",
			},
			5: {
				unlocked() { return hasUpgrade("ai", 21) },
				requirementDescription: "4,000,000 Total Robots",
				done() { return player.r.total.gte(4e6) && hasUpgrade("ai", 21) },
				effectDescription: "Automatically distribute 10% of your Robots every second without actually spending any Robots.",
			},
		},
};
}
