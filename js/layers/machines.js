// Session-bound layer owner; composition supplies only the named ports.
// mc — machines content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveDefaults'|'saveState'>} ports */
function createMachinesLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveDefaults, saveState }) {
    return {
		name: "machines", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "MC", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 3, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			first: 0,
			mechEn: new Decimal(0),
			autoSE: false,
			auto: false,
        }},
        color: "#c99a6b",
		nodeStyle() { return {
			background: (saveState.player.mc.unlocked||gameRules.canReset("mc"))?((saveState.player.grad&&!saveState.player.oldStyle)?"radial-gradient(circle, #c99a6b 0%, #706d6d 100%)":"#c99a6b"):"#bf8f8f",
		}},
		componentStyles: {
			"prestige-button": {
				background() { return (gameRules.canReset("mc"))?((saveState.player.grad&&!saveState.player.oldStyle)?"radial-gradient(circle, #c99a6b 0%, #706d6d 100%)":"#c99a6b"):"#bf8f8f" },
			},
		},
        requires: new Decimal(128000), // Can be a function that takes requirement increases into account
        resource: "machine parts", // Name of prestige currency 
        baseResource: "hyperspatial bricks", // Name of resource prestige is based on
        baseAmount() {return saveState.player.i.hb}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(4), // Prestige currency exponent
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1);
			if (saveState.player.mc.upgrades.includes(11)) mult = mult.times(gameHelpers.buyableEffect("mc", 12));
			if (gameHelpers.hasMilestone("mc", 0)) mult = mult.times(saveState.player.ne.thoughts.max(1));
			if (gameHelpers.hasUpgrade("ai", 33)) mult = mult.times(gameHelpers.upgradeEffect("ai", 33));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 6, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "c", description: "Press C to Machine Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
		passiveGeneration() { return gameHelpers.hasMilestone("mc", 0)?0.01:0 },
        doReset(resettingLayer){ 
			let keep = [];
			if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
        },
        layerShown(){return saveState.player.ma.unlocked },
        branches: ["hs", "i", "id"],
		update(diff) {
			if (!saveState.player[this.layer].unlocked) return;
			saveState.player.mc.mechEn = saveState.player.mc.mechEn.plus(saveState.player.ge.rotations.times(derivedState.tmp.mc.mechPer).times(diff)).times(derivedState.tmp.mc.decayPower.pow(diff));
			if (gameHelpers.hasMilestone("id", 3) && saveState.player.mc.autoSE) layerRegistry.layers.mc.buyables[11].buyMax();
			if (gameHelpers.hasMilestone("mc", 1) && saveState.player.mc.auto) {
				saveState.player.mc.clickables[11] = saveState.player.mc.clickables[11].max(saveState.player.mc.mechEn.times(derivedState.tmp.mc.mechEnMult));
				saveState.player.mc.clickables[12] = saveState.player.mc.clickables[12].max(saveState.player.mc.mechEn.times(derivedState.tmp.mc.mechEnMult));
				saveState.player.mc.clickables[21] = saveState.player.mc.clickables[21].max(saveState.player.mc.mechEn.times(derivedState.tmp.mc.mechEnMult));
				saveState.player.mc.clickables[22] = saveState.player.mc.clickables[22].max(saveState.player.mc.mechEn.times(derivedState.tmp.mc.mechEnMult));
			}
		},
		mechEnMult() {
			let mult = new Decimal(1);
			if (saveState.player.id.unlocked) mult = mult.times(derivedState.tmp.id.revEff);
			if (saveState.player.c.unlocked) mult = mult.times(derivedState.tmp.c.eff4);
			return mult;
		},
		mechPer() { return derivedState.tmp.mc.buyables[11].effect.pow(derivedState.tmp.mc.buyables[11].buffExp).times(gameHelpers.clickableEffect("mc", 11)) },
		decayPower() { return saveState.player.mc.mechEn.plus(1).log10().div(gameHelpers.hasUpgrade("ai", 31)?2:1).plus(1).pow(-2) },
		mechEff() { return Decimal.pow(10, saveState.player.mc.mechEn.plus(1).log10().root(4).div(2)) },
		tabFormat: {
			"The Shell": {
				buttonStyle() { return {'background-color': '#706d6d'} },
				content: ["main-display",
				"prestige-button",
				"resource-display", "blank",
				"milestones",
				"blank", 
				"respec-button", "blank", ["buyable", 11],
			]},
			"The Motherboard": {
				buttonStyle() { return {'background-color': '#c99a6b', color: "black"} },
				content: ["blank", ["display-text", function() { return "Each Gear Rotation provides "+gameHelpers.format(derivedState.tmp.mc.mechPer)+" Mech-Energy, which adds to <h3>"+gameHelpers.format(saveState.player.mc.mechEn.times(derivedState.tmp.mc.mechEnMult))+" Mech-Energy</h3>" }],
				"blank", ["display-text", function() { return derivedState.tmp.mc.decayPower.eq(1)?"":("Due to inadequate storage, Mech-Energy is being lost by "+gameHelpers.format(derivedState.tmp.mc.decayPower.pow(-1).log10())+" OoMs per second.") }],
				"blank", ["display-text", function() { return "Your Mech-Energy is multiplying Gear Speed by "+gameHelpers.format(derivedState.tmp.mc.mechEff)+(derivedState.tmp.nerdMode?" (Formula: 10^((log(x+1)^0.25)/2))":"") }],
				"blank", ["upgrade", 11], "blank",
				"clickables",
			]},
			"The Core": {
				unlocked() { return saveState.player.mc.upgrades.includes(11) },
				buttonStyle() { return {'background-color': '#c76e6b', "border-color": "#c76e6b", color: "black"} },
				content: ["blank", ["buyable", 12]],
			},
		},
		milestones: {
			0: {
				requirementDescription: "125,000,000 Machine Parts & 1e9 Signals",
				unlocked() { return saveState.player.ne.unlocked && saveState.player.mc.unlocked },
				done() { return saveState.player.ne.unlocked && ((saveState.player.mc.best.gte(1.25e8) && saveState.player.ne.signals.gte(1e9)) || saveState.player.mc.milestones.includes(0)) },
				effectDescription: "Thoughts multiply Machine Part gain, and gain 1% of Machine Part gain every second.",
			},
			1: {
				requirementDescription: "1e50,000 Mech-Energy",
				unlocked() { return gameHelpers.hasUpgrade("ai", 31) },
				done() { return gameHelpers.hasUpgrade("ai", 31) && saveState.player.mc.mechEn.times(derivedState.tmp.mc.mechEnMult).gte("1e50000") },
				effectDescription: "CPU's effect is raised ^25, and unlock Auto-Motherboard.",
				toggles: [["mc", "auto"]],
			},
		},
		clickables: {
			rows: 2,
			cols: 2,
			activeLimit() { return gameHelpers.hasAchievement("a", 141)?4:(gameHelpers.hasAchievement("a", 133)?2:1) },
			11: {
				title: "CPU",
				display() { 
					return "Active Mech-Energy: "+gameHelpers.format(saveState.player.mc.clickables[this.id])+"<br><br>Currently: Kinetic Energy multiplies Mech-Energy gain by "+gameHelpers.format(derivedState.tmp.mc.clickables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: (kineticEnergy+1)^(1-1/sqrt(log(activeMechEnergy+1)+1)))":"");
				},
				effect() { 
					let eff = Decimal.pow(saveState.player.ge.energy.plus(1), Decimal.sub(1, Decimal.div(1, Decimal.add(saveState.player.mc.clickables[this.id], 1).log10().plus(1).sqrt())));
					if (gameHelpers.hasMilestone("mc", 1)) eff = eff.pow(25);
					if (!eff.eq(eff)) return new Decimal(1);
					return eff;
				},
				unlocked() { return saveState.player.mc.unlocked },
				canClick() { return saveState.player.mc.unlocked },
				onClick() {
					if (saveState.player.mc.clickables[this.id].eq(0)) {
						let activeClickables = Object.values(saveState.player.mc.clickables).filter(x => Decimal.gt(x, 0)).length;
						if (activeClickables>=derivedState.tmp.mc.clickables.activeLimit) {
							saveState.player.mc.clickables = saveDefaults.getStartClickables("mc");
							gameRules.doReset("mc", true);
						}
					}
					saveState.player.mc.clickables[this.id] = saveState.player.mc.clickables[this.id].max(saveState.player.mc.mechEn.times(derivedState.tmp.mc.mechEnMult));
					saveState.player.mc.mechEn = new Decimal(0);
				},
				style: {id: "11", "height": "200px", "width": "200px", "background-color": function() { return new Decimal(saveState.player.mc.clickables[this.id]).eq(0)?"#c99a6b":"#6ccc81" }},
			},
			12: {
				title: "The Port",
				display() { 
					return "Active Mech-Energy: "+gameHelpers.format(saveState.player.mc.clickables[this.id])+"<br><br>Currently: Phantom Souls multiply Gear gain by "+gameHelpers.format(derivedState.tmp.mc.clickables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: (phantomSouls+1)^(1-1/sqrt(log(activeMechEnergy+1)+1)))":"");
				},
				effect() { return Decimal.pow(saveState.player.ps.points.plus(1), Decimal.sub(1, Decimal.div(1, Decimal.add(saveState.player.mc.clickables[this.id], 1).log10().plus(1).sqrt()))) },
				unlocked() { return saveState.player.mc.unlocked },
				canClick() { return saveState.player.mc.unlocked },
				onClick() {
					if (saveState.player.mc.clickables[this.id].eq(0)) {
						let activeClickables = Object.values(saveState.player.mc.clickables).filter(x => Decimal.gt(x, 0)).length;
						if (activeClickables>=derivedState.tmp.mc.clickables.activeLimit) {
							saveState.player.mc.clickables = saveDefaults.getStartClickables("mc");
							gameRules.doReset("mc", true);
						}
					}
					saveState.player.mc.clickables[this.id] = saveState.player.mc.clickables[this.id].max(saveState.player.mc.mechEn.times(derivedState.tmp.mc.mechEnMult));
					saveState.player.mc.mechEn = new Decimal(0);
				},
				style: {id: "12", "height": "200px", "width": "200px", "background-color": function() { return new Decimal(saveState.player.mc.clickables[this.id]).eq(0)?"#c99a6b":"#6ccc81" }},
			},
			21: {
				title: "Northbridge",
				display() { 
					return "Active Mech-Energy: "+gameHelpers.format(saveState.player.mc.clickables[this.id])+"<br><br>Currently: Solarity multiplies the Super Generator base by "+gameHelpers.format(derivedState.tmp.mc.clickables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: (solarity+1)^("+gameHelpers.formatWhole(derivedState.tmp.mc.clickables[this.id].effExp)+"-"+gameHelpers.formatWhole(derivedState.tmp.mc.clickables[this.id].effExp)+"/((log(activeMechEnergy+1)+1)^0.125)))":"");
				},
				effExp() { return gameHelpers.hasAchievement("a", 133)?3:1 },
				effect() { return Decimal.pow(saveState.player.o.points.plus(1), Decimal.sub(derivedState.tmp.mc.clickables[this.id].effExp, Decimal.div(derivedState.tmp.mc.clickables[this.id].effExp, Decimal.add(saveState.player.mc.clickables[this.id], 1).log10().plus(1).root(8)))) },
				unlocked() { return saveState.player.mc.unlocked },
				canClick() { return saveState.player.mc.unlocked },
				onClick() {
					if (saveState.player.mc.clickables[this.id].eq(0)) {
						let activeClickables = Object.values(saveState.player.mc.clickables).filter(x => Decimal.gt(x, 0)).length;
						if (activeClickables>=derivedState.tmp.mc.clickables.activeLimit) {
							saveState.player.mc.clickables = saveDefaults.getStartClickables("mc");
							gameRules.doReset("mc", true);
						}
					}
					saveState.player.mc.clickables[this.id] = saveState.player.mc.clickables[this.id].max(saveState.player.mc.mechEn.times(derivedState.tmp.mc.mechEnMult));
					saveState.player.mc.mechEn = new Decimal(0);
				},
				style: {id: "21", "height": "200px", "width": "200px", "background-color": function() { return new Decimal(saveState.player.mc.clickables[this.id]).eq(0)?"#c99a6b":"#6ccc81" }},
			},
			22: {
				title: "Southbridge",
				display() { 
					return "Active Mech-Energy: "+gameHelpers.format(saveState.player.mc.clickables[this.id])+"<br><br>Currently: Hyperspace Energy multiplies Balance Energy gain by "+gameHelpers.format(derivedState.tmp.mc.clickables[this.id].effect)+(derivedState.tmp.nerdMode?" (Formula: (hyperspaceEnergy+1)^(1-1/cbrt(log(activeMechEnergy+1)+1)))":"");
				},
				effect() { return Decimal.pow(saveState.player.hs.points.plus(1), Decimal.sub(1, Decimal.div(1, Decimal.add(saveState.player.mc.clickables[this.id], 1).log10().plus(1).cbrt()))) },
				unlocked() { return saveState.player.mc.unlocked },
				canClick() { return saveState.player.mc.unlocked },
				onClick() {
					if (saveState.player.mc.clickables[this.id].eq(0)) {
						let activeClickables = Object.values(saveState.player.mc.clickables).filter(x => Decimal.gt(x, 0)).length;
						if (activeClickables>=derivedState.tmp.mc.clickables.activeLimit) {
							saveState.player.mc.clickables = saveDefaults.getStartClickables("mc");
							gameRules.doReset("mc", true);
						}
					}
					saveState.player.mc.clickables[this.id] = saveState.player.mc.clickables[this.id].max(saveState.player.mc.mechEn.times(derivedState.tmp.mc.mechEnMult));
					saveState.player.mc.mechEn = new Decimal(0);
				},
				style: {id: "22", "height": "200px", "width": "200px", "background-color": function() { return new Decimal(saveState.player.mc.clickables[this.id]).eq(0)?"#c99a6b":"#6ccc81" }},
			},
		},
		buyables: {
			showRespec() { return saveState.player.mc.unlocked },
            respec() { // Optional, reset things and give back your currency. Having this function makes a respec button appear
                gameRules.resetBuyables(this.layer)
                gameRules.doReset(this.layer, true) // Force a reset
            },
			rows: 1,
			cols: 2,
			11: {
				title: "Shell Expansion",
				costDiv() { return new Decimal(gameHelpers.hasAchievement("a", 132)?7:1) },
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    return x.div(10).plus(0.5).div(derivedState.tmp[this.layer].buyables[this.id].costDiv).ceil();
                },
				buffExp() { 
					let exp = gameHelpers.hasAchievement("a", 132)?25:5;
					if (gameHelpers.hasUpgrade("ai", 33)) exp *= 100;
					return exp;
				},
				effect() { return saveState.player[this.layer].buyables[this.id].plus(1).sqrt() },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id];
					let cost = data.cost;
					let amt = saveState.player[this.layer].buyables[this.id];
                    let display = "Req: "+gameHelpers.formatWhole(cost)+" Machine Parts"+(derivedState.tmp.nerdMode?" (Cost Formula: floor((x/10+0.5)^1.1)":"")+".<br><br><h3>Current Shell Size: "+gameHelpers.formatWhole(amt)+"m</h3>, which multiplies Mech-Energy gain by "+gameHelpers.format(data.effect.pow(data.buffExp))+(derivedState.tmp.nerdMode?" (Formula: (x+1)^2.5)":"")+" "+(gameHelpers.hasAchievement("a", 125)?"and also divides":"but also multiplies")+" Tooth Size of Gears by "+gameHelpers.format(data.effect)+(derivedState.tmp.nerdMode?" (Formula: sqrt(x+1))":"");
					return display;
                },
                unlocked() { return gameHelpers.unl(this.layer) },
                canAfford() {
					let cost = derivedState.tmp[this.layer].buyables[this.id].cost
                    return saveState.player[this.layer].unlocked && saveState.player.mc.points.gte(cost);
				},
                buy() { 
					let b = saveState.player[this.layer].buyables[this.id];
					let c = saveState.player.mc.points.times(derivedState.tmp[this.layer].buyables[this.id].costDiv);
					let n = b.pow(2).times(4).plus(b.times(36)).plus(c.times(80)).plus(81).sqrt().sub(11).div(2).plus(1).floor();
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].max(n)
					if (n.sub(b).eq(1)) saveState.player.mc.points = saveState.player.mc.points.sub(derivedState.tmp[this.layer].buyables[this.id].cost);
					else saveState.player.mc.points = saveState.player.mc.points.sub(n.sub(b).times(b.plus(n).plus(10)).times(0.05).max(n.sub(b)).div(derivedState.tmp[this.layer].buyables[this.id].costDiv).floor()).max(0);
                },
				buyMax() {
					let c = saveState.player.mc.points.times(derivedState.tmp[this.layer].buyables[this.id].costDiv);
					let n = c.sub(.5).times(10).plus(1).floor().max(0);
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].max(n);
				},
                style: {'height':'200px', 'width':'200px'},
				autoed() { return gameHelpers.hasMilestone("id", 3) && saveState.player.mc.autoSE },
			},
			12: {
				title: "The Core",
				cost(x=saveState.player[this.layer].buyables[this.id]) {
					if (x.gte(4)) x = x.pow(4).div(64);
					return Decimal.pow(10, Decimal.pow(1.5, x.plus(1).cbrt()).times(3e14))
				},
				effect() { return saveState.player[this.layer].buyables[this.id].times(1e4).plus(1).pow(.56) },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id];
					let cost = data.cost;
					let amt = saveState.player[this.layer].buyables[this.id];
                    let display = "Cost: "+gameHelpers.format(cost)+" Points"+(derivedState.tmp.nerdMode?" (Cost Formula: 10^((1.5^cbrt("+(amt.gte(4)?"(x^4)/64":"x")+"+1))*3e14)":"")+".<br><br>Level: "+gameHelpers.formatWhole(amt)+"<br><br>Effect: The Generator Power effect is raised ^"+gameHelpers.format(data.effect)+" and Gear gain, Machine Part gain, & Gear Speed are multiplied by "+gameHelpers.format(data.effect)+(derivedState.tmp.nerdMode?" (Formula: (10,000*level+1)^0.56)":"");
					return display;
                },
                unlocked() { return gameHelpers.unl(this.layer) && saveState.player.mc.upgrades.includes(11) },
                canAfford() {
					if (!derivedState.tmp[this.layer].buyables[this.id].unlocked) return false;
					let cost = derivedState.tmp[this.layer].buyables[this.id].cost
                    return saveState.player[this.layer].unlocked && saveState.player.points.gte(cost);
				},
                buy() { 
					saveState.player.points = saveState.player.points.sub(derivedState.tmp[this.layer].buyables[this.id].cost)
					saveState.player.mc.buyables[this.id] = saveState.player.mc.buyables[this.id].plus(1);
                },
                style: {'height':'250px', 'width':'250px', 'background-color'() { return derivedState.tmp.mc.buyables[12].canAfford?'#c76e6b':'#bf8f8f' }, "border-color": "#c76e6b"},
				autoed() { return false },
			},
		},
		upgrades: {
			rows: 1,
			cols: 1,
			11: {
				title: "Unlock The Core",
				unlocked() { return !saveState.player.mc.upgrades.includes(11) },
				multiRes: [
					{
						cost: new Decimal(5e3),
					},
					{
						currencyDisplayName: "mech-energy",
						currencyInternalName: "mechEn",
						currencyLayer: "mc",
						cost: new Decimal("1e420"),
					},
				],
			},
		},
};
}
