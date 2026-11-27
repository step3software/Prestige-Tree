// ge — gears content. Registration: manifest.js.
function createGearsLayer() {
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
			background: (player.ge.unlocked||canReset("ge"))?((player.grad&&!player.oldStyle)?"radial-gradient(circle, #bfbfbf 0%, #838586 100%)":"#838586"):"#bf8f8f",
		}},
		componentStyles: {
			background() { return (player.ge.unlocked||canReset("ge"))?((player.grad&&!player.oldStyle)?"radial-gradient(circle, #bfbfbf 0%, #838586 100%)":"#bfbfbf"):"#bf8f8f" },
		},
        requires: new Decimal(1e256), // Can be a function that takes requirement increases into account
        resource: "gears", // Name of prestige currency 
        baseResource: "dust product", // Name of resource prestige is based on
        baseAmount() {return tmp.n.dustProduct}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(0.01), // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1);
			if (player.mc.unlocked) mult = mult.times(clickableEffect("mc", 12));
			if (player.mc.upgrades.includes(11)) mult = mult.times(buyableEffect("mc", 12));
			if (hasMilestone("ge", 2)) mult = mult.times(player.en.total.max(1));
			if (player.r.unlocked) mult = mult.times(tmp.r.buildingEff);
			if (hasMilestone("id", 5) && tmp.id) mult = mult.times(tmp.id.rev.max(1));
			if (hasUpgrade("ai", 33)) mult = mult.times(upgradeEffect("ai", 33));
			if (hasUpgrade("ai", 44)) mult = mult.times(upgradeEffect("ai", 44));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            let exp = new Decimal(1)
			if (hasUpgrade("ai", 34)) exp = exp.times(1.2);
			return exp;
        },
        row: 6, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "E", description: "Press Shift+E to Gear Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		passiveGeneration() { return hasMilestone("ge", 2)?0.01:0 },
        doReset(resettingLayer){ 
			let keep = [];
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
			if (layers[resettingLayer].row >= this.row) {
				player.ge.energy = new Decimal(0);
				player.ge.toothPower = new Decimal(0);
				player.ge.shrinkPower = new Decimal(0);
				player.ge.rotations = new Decimal(0);
			}
        },
        layerShown(){return player.ma.unlocked },
        branches: ["n", "r"],
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display", "blank",
			"milestones",
			"blank", "blank", 
			["display-text", function() { return "<h3>Gear Speed: "+format(tmp.ge.gearSpeed)+"x</h3>"+(tmp.nerdMode?" (cbrt(gears))":"") }],
			"blank",
			["display-text", function() { return "<b>Gear Radius: "+format(tmp.ge.radius)+"m</b>"+(tmp.nerdMode?" (teeth*toothSize/6.28)":"") }], "blank",
			["row", [["display-text", function() { return "<h3>Rotations: "+formatWhole(player.ge.rotations, true)+" ("+tmp.ge.rotDesc+")</h3><br>Rotation Effect: Multiply Nebula Energy & Dust gain by "+format(tmp.ge.rotEff)+(tmp.nerdMode?" ((x+1)^5)":"") }]]],
			"blank", "blank",
			["clickable", 21],
			"blank", "blank",
			["row", [["column", [["raw-html", function() { return "<h3>Teeth: "+(hasMilestone("ge", 3)?format(tmp.ge.teeth):formatWhole(tmp.ge.teeth, true))+"</h3>" }], "blank", ["clickable", 11]], {"background-color": "#b0babf", color: "black", width: "12vw", padding: "10px", margin: "0 auto", "height": "250px"}], ["column", [["raw-html", function() { return "<h3>Kinetic Energy: "+format(player.ge.energy)+" J</h3><br><br>Velocity: "+format(tmp.ge.speed)+"m/s"+(tmp.nerdMode?" (sqrt(x))":"") }], "blank", ["clickable", 12]], {"background-color": "#dec895", color: "black", width: "12vw", padding: "10px", margin: "0 auto", "height": "250px"}], ["column", [["raw-html", function() { return "<h3>Tooth Size: "+format(tmp.ge.toothSize)+"m</h3><br><br>" }], "blank", ["clickable", 13]], {"background-color": "#bfa1b8", color: "black", width: "12vw", padding: "10px", margin: "0 auto", "height": "250px"}]]], "blank",
			["buyable", 11], "blank",
		],
		update(diff) {
			if (!player.ge.unlocked) return;
			let factor = tmp.ge.gearSpeed
			player.ge.energy = player.ge.energy.plus(factor.times(diff).times(tmp.ge.clickables[12].effect));
			player.ge.toothPower = player.ge.toothPower.plus(factor.times(diff));
			player.ge.shrinkPower = player.ge.shrinkPower.plus(factor.times(diff));
			player.ge.rotations = player.ge.rotations.plus(tmp.ge.rps.times(diff));
			player.ge.autoTime = player.ge.autoTime.plus(diff);
			if (player.ge.auto && hasMilestone("ge", 3) && player.ge.autoTime.gte(.5)) {
				player.ge.autoTime = new Decimal(0);
				if (layers.ge.clickables[11].canClick()) layers.ge.clickables[11].onClick();
				if (layers.ge.clickables[12].canClick()) layers.ge.clickables[12].onClick();
				if (layers.ge.clickables[13].canClick()) layers.ge.clickables[13].onClick();
			}
		},
		rotEff() {
			return softcap("rotEff", player.ge.rotations.round().plus(1).pow(5));
		},
		gearSpeed() {
			let speed = player.ge.points.cbrt().times(player.mc.unlocked?tmp.mc.mechEff:1);
			if (player.mc.upgrades.includes(11)) speed = speed.times(buyableEffect("mc", 12));
			return speed;
		},
		rps() {
			return tmp.ge.speed.div(tmp.ge.teeth.times(tmp.ge.toothSize)).times(tmp.ge.gearSpeed)
		},
		rotDesc() {
			let rps = tmp.ge.rps;
			let desc = "";
			if (rps.lt(1)) desc = format(rps.times(60))+" RPM";
			else desc = format(rps)+" RPS";
			
			if (tmp.nerdMode) desc += " </h3>((velocity*gearSpeed)/(radius*6.28))<h3>"
			return desc;
		},
		speed() {
			return player.ge.energy.sqrt();
		},
		teeth() {
			let t = player.ge.toothPower.pow(1.5).plus(100).div(tmp.ge.clickables[11].unlocked?tmp.ge.clickables[11].effect:1);
			if (hasMilestone("ge", 3)) return t.max(0);
			else return t.floor().max(1);
		},
		toothSize() {
			return player.ge.shrinkPower.plus(1).pow(-0.5).div(tmp.ge.clickables[13].effect).times(player.mc.unlocked?tmp.mc.buyables[11].effect.pow(hasAchievement("a", 125)?(-1):1):1);
		},
		radius() { return tmp.ge.teeth.times(tmp.ge.toothSize).div(2*Math.PI) },
		boostReducedPurch() { return tmp.ge.buyables[11].effect.times(4) },
		boostReq() { 
			let x = player.ge.boosted.sub(tmp.ge.boostReducedPurch);
			if (x.gte(20)) x = x.pow(2).div(20);
			return Decimal.pow(1e10, x.pow(1.2).times(x.lt(0)?(-1):1)).times(1e280) 
		},
		boostReqFormula() { return player.ge.boosted.sub(tmp.ge.boostReducedPurch).gte(20)?"1e10^(((totalBought^2)/20)^1.2) * 1e280":"1e10^(totalBought^1.2) * 1e280" },
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Gear Evolution",
				costDiv() {
					let div = new Decimal(1);
					if (hasAchievement("a", 124)) div = div.times(3);
					return div;
				},
				free() {
					let free = new Decimal(0);
					if (hasAchievement("a", 132)) free = free.plus(2);
					return free;
				},
				power() {
					let pow = new Decimal(1);
					if (hasAchievement("a", 124)) pow = pow.times(1.2);
					if (hasUpgrade("ai", 14)) pow = pow.times(1.111);
					return pow;
				},
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    if (x.gte(15)) x = x.times(1.63);
					return Decimal.pow(125, x.pow(1.425)).times(1e3).div(tmp.ge.buyables[this.id].costDiv)
                },
				effectPer() { return Decimal.div(tmp.ge.buyables[this.id].power, 2) },
				effect() { return Decimal.mul(tmp[this.layer].buyables[this.id].effectPer, player[this.layer].buyables[this.id].plus(tmp.ge.buyables[this.id].free).times(hasUpgrade("ai", 13)?1.5:1)) },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id];
					let cost = data.cost;
					let amt = player[this.layer].buyables[this.id];
                    let display = "Reset all Gear Upgrades and force a Row 7 reset to add "+format(data.effectPer)+" to each of their effect bases and reduce their costs by "+format(data.effectPer.times(4))+" purchases.<br><br>Req: "+formatWhole(cost)+" Rotations"+(tmp.nerdMode?" (Cost Formula: 125^(x^1.425)*1e3)":"")+".<br>Currently: +"+format(data.effect)+" to bases, costs reduced by "+format(data.effect.times(4))+" purchases";
					return display;
                },
                unlocked() { return unl(this.layer) }, 
                canAfford() {
					let cost = tmp[this.layer].buyables[this.id].cost
                    return player[this.layer].unlocked && player.ge.rotations.gte(cost);
				},
                buy() { 
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
					player.ge.boosted = new Decimal(0);
					for (let i=11;i<=13;i++) player.ge.clickables[i] = "";
					if (!hasMilestone("ge", 3)) doReset("ge", true);
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
				title() { return "Divide Teeth by "+format(tmp.ge.clickables[this.id].effectPer) },
				display() { 
					return "Req: "+format(tmp.ge.clickables[this.id].req)+" dust product"+(tmp.nerdMode?" ("+tmp.ge.boostReqFormula+")":"")+"<br><br>Currently: /"+format(tmp.ge.clickables[this.id].effect);
				},
				req() {
					if (hasMilestone("ge", 1)) {
						let x = new Decimal(player.ge.clickables[this.id]||0).sub(tmp.ge.boostReducedPurch);
						if (x.gte(20)) x = x.pow(2).div(20);
						return Decimal.pow(1e10, x.pow(1.2).times(x.lt(0)?(-1):1)).times(1e280) 
					} else return tmp.ge.boostReq;
				},
				effectPer() { return Decimal.add(2, tmp.ge.buyables[11].effect) },
				effect() { return Decimal.pow(tmp.ge.clickables[this.id].effectPer, player.ge.clickables[this.id]) },
				unlocked() { return player.ge.unlocked && hasAchievement("a", 133) },
				canClick() { return player.ge.unlocked && tmp.n.dustProduct.gte(tmp.ge.clickables[this.id].req) },
				onClick() { 
					if (player.ge.maxToggle && hasMilestone("ge", 0)) {
						let x = tmp.n.dustProduct.div(1e280).max(1).log(1e10).root(1.2);
						if (x.gte(20)) x = x.times(20).sqrt();
						x = x.plus(tmp.ge.boostReducedPurch).plus(1).floor();
						let totalOther;
						if (hasMilestone("ge", 1)) totalOther = 0;
						else totalOther = Object.keys(player.ge.clickables).filter(x => (x!=this.id && x<20)).map(x => player.ge.clickables[x]).reduce((a,c) => Decimal.add(a, c));
						let target = x.sub(totalOther).max(0);
						player.ge.boosted = player.ge.boosted.max(x);
						player.ge.clickables[this.id] = Decimal.max(player.ge.clickables[this.id], target);
					} else {
						player.ge.boosted = player.ge.boosted.plus(1);
						player.ge.clickables[this.id] = Decimal.add(player.ge.clickables[this.id], 1)
					}
				},
				style: {"height": "150px", "width": "150px"},
			},
			12: {
				title() { return "Multiply Kinetic Energy gain by "+format(tmp.ge.clickables[this.id].effectPer) },
				display() { 
					return "Req: "+format(tmp.ge.clickables[this.id].req)+" dust product"+(tmp.nerdMode?" ("+tmp.ge.boostReqFormula+")":"")+"<br><br>Currently: "+format(tmp.ge.clickables[this.id].effect)+"x";
				},
				req() {
					if (hasMilestone("ge", 1)) {
						let x = new Decimal(player.ge.clickables[this.id]||0).sub(tmp.ge.boostReducedPurch);
						if (x.gte(20)) x = x.pow(2).div(20);
						return Decimal.pow(1e10, x.pow(1.2).times(x.lt(0)?(-1):1)).times(1e280) 
					} else return tmp.ge.boostReq;
				},
				effectPer() { return Decimal.add(6, tmp.ge.buyables[11].effect).times(hasAchievement("a", 123)?4:1) },
				effect() { return Decimal.pow(tmp.ge.clickables[this.id].effectPer, player.ge.clickables[this.id]) },
				unlocked() { return player.ge.unlocked },
				canClick() { return player.ge.unlocked && tmp.n.dustProduct.gte(tmp.ge.clickables[this.id].req) },
				onClick() { 
					if (player.ge.maxToggle && hasMilestone("ge", 0)) {
						let x = tmp.n.dustProduct.div(1e280).max(1).log(1e10).root(1.2);
						if (x.gte(20)) x = x.times(20).sqrt();
						x = x.plus(tmp.ge.boostReducedPurch).plus(1).floor();
						let totalOther;
						if (hasMilestone("ge", 1)) totalOther = 0;
						else totalOther = Object.keys(player.ge.clickables).filter(x => (x!=this.id && x<20)).map(x => player.ge.clickables[x]).reduce((a,c) => Decimal.add(a, c));
						let target = x.sub(totalOther).max(0);
						player.ge.boosted = player.ge.boosted.max(x);
						player.ge.clickables[this.id] = Decimal.max(player.ge.clickables[this.id], target);
					} else {
						player.ge.boosted = player.ge.boosted.plus(1);
						player.ge.clickables[this.id] = Decimal.add(player.ge.clickables[this.id], 1)
					}
				},
				style: {"height": "150px", "width": "150px"},
			},
			13: {
				title() { return "Divide Tooth Size by "+format(tmp.ge.clickables[this.id].effectPer) },
				display() { 
					return "Req: "+format(tmp.ge.clickables[this.id].req)+" dust product"+(tmp.nerdMode?" ("+tmp.ge.boostReqFormula+")":"")+"<br><br>Currently: /"+format(tmp.ge.clickables[this.id].effect);
				},
				req() {
					if (hasMilestone("ge", 1)) {
						let x = new Decimal(player.ge.clickables[this.id]||0).sub(tmp.ge.boostReducedPurch);
						if (x.gte(20)) x = x.pow(2).div(20);
						return Decimal.pow(1e10, x.pow(1.2).times(x.lt(0)?(-1):1)).times(1e280) 
					} else return tmp.ge.boostReq;
				},
				effectPer() { return Decimal.add(2, tmp.ge.buyables[11].effect) },
				effect() { return Decimal.pow(tmp.ge.clickables[this.id].effectPer, player.ge.clickables[this.id]) },
				unlocked() { return player.ge.unlocked },
				canClick() { return player.ge.unlocked && tmp.n.dustProduct.gte(tmp.ge.clickables[this.id].req) },
				onClick() { 
					if (player.ge.maxToggle && hasMilestone("ge", 0)) {
						let x = tmp.n.dustProduct.div(1e280).max(1).log(1e10).root(1.2);
						if (x.gte(20)) x = x.times(20).sqrt();
						x = x.plus(tmp.ge.boostReducedPurch).plus(1).floor();
						let totalOther;
						if (hasMilestone("ge", 1)) totalOther = 0;
						else totalOther = Object.keys(player.ge.clickables).filter(x => (x!=this.id && x<20)).map(x => player.ge.clickables[x]).reduce((a,c) => Decimal.add(a, c));
						let target = x.sub(totalOther).max(0);
						player.ge.boosted = player.ge.boosted.max(x);
						player.ge.clickables[this.id] = Decimal.max(player.ge.clickables[this.id], target);
					} else {
						player.ge.boosted = player.ge.boosted.plus(1);
						player.ge.clickables[this.id] = Decimal.add(player.ge.clickables[this.id], 1)
					}
				},
				style: {"height": "150px", "width": "150px"},
			},
			21: {
				title: "Reset Gear Upgrades",
				unlocked() { return player.ge.unlocked },
				canClick() { return player.ge.unlocked && player.ge.boosted.gt(0) },
				onClick() { 
					if (!confirm("Are you sure you want to reset your Gear Upgrades? This will force a Gear reset!")) return;
					player.ge.boosted = new Decimal(0);
					for (let i=11;i<=13;i++) player.ge.clickables[i] = "";
					doReset("ge", true);
				},
				style: {"height": "75px", "width": "100px"},
			},
		},
		milestones: {
			0: {
				requirementDescription: "1,000,000 Gears",
				done() { return player.ge.best.gte(1e6) },
				effectDescription: "You can buy max Gear Upgrades.",
				toggles: [["ge", "maxToggle"]],
			},
			1: {
				requirementDescription: "2e22 Gears",
				unlocked() { return player.ge.best.gte(1e6) },
				done() { return player.ge.best.gte(2e22) },
				effectDescription: "Gear Upgrade costs increase independently.",
			},
			2: {
				requirementDescription: "5e47 Gears & 25,000,000 Total Energy",
				unlocked() { return player.en.unlocked },
				done() { return player.en.unlocked && player.ge.best.gte(5e47) && player.en.total.gte(25e6) },
				effectDescription: "Total Energy multiplies Gear gain, and gain 1% of Gear gain every second.",
			},
			3: {
				requirementDescription: "1e141 Gears",
				unlocked() { return hasUpgrade("ai", 13) },
				done() { return hasUpgrade("ai", 13) && player.ge.best.gte(1e141) },
				effectDescription: "Teeth can be partial (can go below 1), Gear Evolution does not force a Row 7 reset, and unlock Auto-Gear Upgrades.",
				toggles: [["ge", "auto"]],
			},
		},
};
}
