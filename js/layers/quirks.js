// Session-bound layer owner; composition supplies only the named ports.
// q — quirks content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'|'softcapRules'>} ports */
function createQuirksLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState, softcapRules }) {
    return {
        name: "quirks", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "Q", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 2, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			energy: new Decimal(0),
			time: new Decimal(0),
			auto: false,
			first: 0,
			pseudoUpgs: [],
        }},
        color: "#c20282",
        requires: new Decimal("1e512"), // Can be a function that takes requirement increases into account
        resource: "quirks", // Name of prestige currency
        baseResource: "generator power", // Name of resource prestige is based on
        baseAmount() {return saveState.player.g.power}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?.008:.0075) }, // Prestige currency exponent
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (gameHelpers.hasUpgrade("q", 14)) mult = mult.times(gameHelpers.upgradeEffect("q", 14).q);
			mult = mult.times(gameHelpers.improvementEffect("q", 33));
			if (saveState.player.m.unlocked) mult = mult.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("m"):false)?derivedState.tmp.m.mainHexEff:derivedState.tmp.m.hexEff);
			if (gameHelpers.hasUpgrade("ba", 22)) mult = mult.times(derivedState.tmp.ba.negBuff);
			if (gameHelpers.hasUpgrade("hn", 43)) mult = mult.times(gameHelpers.upgradeEffect("hn", 43));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 3, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "q", description: "Press Q to Quirk Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			saveState.player.q.time = new Decimal(0);
			saveState.player.q.energy = new Decimal(0);
			if (gameHelpers.hasMilestone("ba", 0)) keep.push("upgrades");
			if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
        },
        layerShown(){return saveState.player.e.unlocked},
        branches: ["e"],
		enGainMult() {
			let mult = new Decimal(1);
			if (gameHelpers.hasUpgrade("q", 11)) mult = mult.times(gameHelpers.upgradeEffect("q", 11));
			if (gameHelpers.hasUpgrade("q", 21)) mult = mult.times(gameHelpers.upgradeEffect("q", 21));
			if (saveState.player.o.unlocked) mult = mult.times(gameHelpers.buyableEffect("o", 12));
			if (saveState.player.ba.unlocked) mult = mult.times(derivedState.tmp.ba.negBuff);
			return mult;
		},
		enGainExp() {
			let exp = saveState.player.q.buyables[11].plus(derivedState.tmp.q.freeLayers).sub(1);
			return exp;
		},
		enEff() {
			if (!gameHelpers.unl(this.layer)) return new Decimal(1);
			let eff = saveState.player.q.energy.plus(1).pow(2);
			if (gameHelpers.hasUpgrade("q", 23)) eff = eff.pow(3);
			return softcapRules.softcap("qe", eff.times(gameHelpers.improvementEffect("q", 23)));
		},
		update(diff) {
			saveState.player.q.time = saveState.player.q.time.plus(diff);
			if (derivedState.tmp.q.enGainExp.gte(0)) saveState.player.q.energy = saveState.player.q.energy.plus(saveState.player.q.time.times(derivedState.tmp.q.enGainMult).pow(derivedState.tmp.q.enGainExp).times(diff));
			if (gameHelpers.hasMilestone("ba", 1) && saveState.player.q.auto && saveState.player.ma.current!="q") layerRegistry.layers.q.buyables[11].buyMax();
		},
		passiveGeneration() { return (gameHelpers.hasMilestone("ba", 0)&&saveState.player.ma.current!="q")?1:0 },
		tabFormat: {
			"Main Tab": {
				content: [
					"main-display",
					"prestige-button",
					"blank",
					["display-text",
						function() {return 'You have ' + gameHelpers.formatWhole(saveState.player.g.power)+' Generator Power'},
							{}],
					["display-text",
						function() {return 'You have ' + gameHelpers.formatWhole(saveState.player.q.best)+' Best Quirks'},
							{}],
					["display-text",
						function() {return 'You have ' + gameHelpers.formatWhole(saveState.player.q.total)+' Total Quirks'},
							{}],
					"blank",
					["display-text",
						function() {return 'You have ' + gameHelpers.formatWhole(saveState.player.q.energy)+' Quirk Energy ('+(derivedState.tmp.nerdMode?('Base Gain: (timeInRun^(quirkLayers-1))'):'generated by Quirk Layers')+'), which multiplies Point and Generator Power gain by ' + gameHelpers.format(derivedState.tmp.q.enEff)+(derivedState.tmp.nerdMode?(" ((x+1)^"+gameHelpers.format(gameHelpers.hasUpgrade("q", 23)?6:2)+"*"+gameHelpers.format(gameHelpers.improvementEffect("q", 23))+")"):"")},
							{}],
					"blank",
					"milestones", "blank",
					"blank",
					"buyables", "blank",
					["display-text", "Note: Most Quirk Upgrade costs increase over time, but reset on a Quirk reset."], "blank",
					"upgrades"],
			},
			Improvements: {
				unlocked() { return gameHelpers.hasUpgrade("q", 41) },
				buttonStyle() { return {'background-color': '#f25ed7'} },
				content: [
					"main-display",
					"blank",
					["display-text",
						function() {return 'You have ' + gameHelpers.formatWhole(saveState.player.q.energy)+' Quirk Energy ('+(derivedState.tmp.nerdMode?('Base Gain: (timeInRun^(quirkLayers-1))'):'generated by Quirk Layers')+'), which has provided the below Quirk Improvements (next at '+gameHelpers.format(derivedState.tmp.q.impr.overallNextImpr)+')'},
							{}],
					"blank",
					"improvements"],
			},
		},
		freeLayers() {
			let l = new Decimal(0);
			if (saveState.player.m.unlocked) l = l.plus(derivedState.tmp.m.buyables[13].effect);
			if (derivedState.tmp.q.impr[43].unlocked) l = l.plus(gameHelpers.improvementEffect("q", 43));
			if (saveState.player.i.buyables[11].gte(3)) l = l.plus(gameHelpers.buyableEffect("s", 18));
			return l;
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Quirk Layers",
				costBase() {
					let base = new Decimal(2);
					if (gameHelpers.hasUpgrade("q", 43)) base = base.sub(.25);
					if (gameHelpers.hasChallenge("h", 42)) base = base.sub(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("h"):false)?.2:.15);
					if (gameHelpers.hasAchievement("a", 101)) base = base.sub(.2);
					if (gameHelpers.hasUpgrade("q", 25) && saveState.player.i.buyables[12].gte(6)) base = base.root(gameHelpers.upgradeEffect("q", 25));
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) base = base.pow(.75);
					return base;
				},
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = this.costBase();
                    let cost = Decimal.pow(base, Decimal.pow(base, x).sub(1));
                    return cost.floor()
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = (derivedState.tmp.nerdMode?("Cost Formula: "+gameHelpers.format(data.costBase)+"^("+gameHelpers.format(data.costBase)+"^x-1)"):("Cost: " + gameHelpers.formatWhole(data.cost) + " Quirks")+"\n\
                    Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+(derivedState.tmp.q.freeLayers?(derivedState.tmp.q.freeLayers.gt(0)?(" + "+gameHelpers.format(derivedState.tmp.q.freeLayers)):""):""))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
                    return saveState.player.q.points.gte(derivedState.tmp[this.layer].buyables[this.id].cost)},
                buy() {
	let cost;
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
                    saveState.player.q.points = saveState.player.q.points.sub(cost)
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {
					if (!this.unlocked || !this.canAfford()) return;
					let base = this.costBase();
					let target = saveState.player.q.points.max(1).log(base).plus(1).log(base);
					target = target.plus(1).floor();
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].max(target);
				},
                style: {'height':'222px'},
				autoed() { return gameHelpers.hasMilestone("ba", 1) && saveState.player.q.auto },
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Total Quirks",
				done() { return saveState.player.q.total.gte(2) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Keep Booster, Generator, Space, & Time milestones on all resets.",
			},
			1: {
				requirementDescription: "3 Total Quirks",
				done() { return saveState.player.q.total.gte(3) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "You can buy max Time & Space, gain 100% of Enhance Point gain every second, and unlock Auto-Enhancers & Auto-Extra Time Capsules.",
				toggles: [["e", "auto"], ["t", "autoExt"]],
			},
			2: {
				requirementDescription: "4 Total Quirks",
				done() { return saveState.player.q.total.gte(4) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Keep Time, Enhance, & Space Upgrades on all resets, and keep Space Buildings on Quirk/Hindrance resets.",
			},
			3: {
				requirementDescription: "6 Total Quirks",
				done() { return saveState.player.q.total.gte(6) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Unlock Auto-Time Capsules & Auto-Space Energy.",
				toggles: [["t", "auto"], ["s", "auto"]],
			},
			4: {
				requirementDescription: "10 Total Quirks",
				done() { return saveState.player.q.total.gte(10) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Unlock Hindrances & Auto-Super Boosters.",
				toggles: [["sb", "auto"]],
			},
			5: {
				requirementDescription: "25 Total Quirks",
				done() { return saveState.player.q.total.gte(25) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Time, Space, & Super-Boosters reset nothing, and you can destroy individual Space Buildings.",
			},
			6: {
				unlocked() { return saveState.player.sg.unlocked },
				requirementDescription: "1e22 Total Quirks",
				done() { return saveState.player.q.total.gte(1e22) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Unlock Auto-Super Generators & Super-Generators reset nothing.",
				toggles: [["sg", "auto"]],
			},
			7: {
				unlocked() { return saveState.player.sg.unlocked },
				requirementDescription: "1e60 Total Quirks",
				done() { return saveState.player.q.total.gte(1e60) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "You can buy max Super Boosters & Super Generators, and unlock Auto-Space Buildings.",
				toggles: [["s", "autoBld"]],
			},
		},
		upgrades: {
			rows: 4,
			cols: 5,
			11: {
				title: "Quirk Central",
				description: "Total Quirks multiply each Quirk Layer's production (boosted by Quirk Upgrades bought).",
				cost() { return saveState.player.q.time.plus(1).pow(1.2).times(100).pow(saveState.player.ma.current=="q"?this.id:1) },
				costFormula: "100*(time+1)^1.2",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasChallenge("h", 11)||((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("q"):false) },
				effect() { return saveState.player.q.total.plus(1).log10().plus(1).pow(saveState.player.q.upgrades.length).pow(gameHelpers.improvementEffect("q", 11)) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.q.upgrades[11].effect)+"x" },
				formula: "(log(quirks+1)+1)^upgrades",
			},
			12: {
				title: "Back To Row 2",
				description: "Total Quirks multiply the Booster/Generator bases.",
				cost() { return saveState.player.q.time.plus(1).pow(1.4).times(500).pow(saveState.player.ma.current=="q"?(Math.pow(this.id, this.id/10)*(this.id-10)):1) },
				costFormula: "500*(time+1)^1.4",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 11) },
				effect() { return saveState.player.q.total.plus(1).log10().plus(1).pow(1.25).times(gameHelpers.improvementEffect("q", 12)) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.q.upgrades[12].effect)+"x" },
				formula: "(log(x+1)+1)^1.25",
			},
			13: {
				title: "Skip the Skip the Second",
				description: "The Generator Power effect is raised to the power of 1.25.",
				cost() { return saveState.player.q.time.plus(1).pow(1.8).times(750).pow(saveState.player.ma.current=="q"?(Math.pow(this.id, this.id/10)*(this.id-10)):1) },
				costFormula: "750*(time+1)^1.8",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 11) },
			},
			14: {
				title: "Row 4 Synergy",
				description: "Hindrance Spirit & Quirks boost each other's gain.",
				cost() { return saveState.player.q.time.plus(1).pow(2.4).times(1e6).pow(saveState.player.ma.current=="q"?(this.id*6):1) },
				costFormula: "1e6*(time+1)^2.4",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 12)||gameHelpers.hasUpgrade("q", 13) },
				effect() { 
					let q = saveState.player.q.points;
					let h = saveState.player.h.points;
					h = softcapRules.softcap("q14_h", h);
					q = softcapRules.softcap("q14_q", q);
					return {
						h: q.plus(1).cbrt().pow(gameHelpers.improvementEffect("q", 13)),
						q: h.plus(1).root(4).pow(gameHelpers.improvementEffect("q", 13)),
					};
				},
				effectDisplay() { return "H: "+gameHelpers.format(derivedState.tmp.q.upgrades[14].effect.h)+"x, Q: "+gameHelpers.format(derivedState.tmp.q.upgrades[14].effect.q)+"x" },
				formula() { return "H: "+(saveState.player.q.points.gte("1e1100")?"log(cbrt(Q+1))^366.67":"cbrt(Q+1)")+", Q: "+(saveState.player.h.points.gte("1e1000")?"log(H+1)^83.33":"(H+1)^0.25") },
			},
			15: {
				title: "Quirk Extension",
				description: "Quirks make the Quirk Energy effect softcap start later.",
				cost() { return Decimal.pow("e1e6", saveState.player.q.time.times(10).plus(1).log10().pow(2)).times("e1.5e7") },
				costFormula: "(e1,000,000^(log(time*10+1)^2))*e15,000,000",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				pseudoUnl() { return saveState.player.i.buyables[12].gte(6) },
				pseudoReq: "Req: 40 Achievements",
				pseudoCan() { return saveState.player.a.achievements.length>=40 },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return saveState.player.q.points.plus(1) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.q.upgrades[this.id].effect)+"x later" },
				formula: "x+1",
			},
			21: {
				title: "Quirk City",
				description: "Super Boosters multiply each Quirk Layer's production.",
				cost() { return saveState.player.q.time.plus(1).pow(3.2).times(1e8).pow(saveState.player.ma.current=="q"?(this.id*1.5):1) },
				costFormula: "1e8*(time+1)^3.2",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 11)&&gameHelpers.hasUpgrade("q", 13) },
				effect() { return Decimal.pow(1.25, saveState.player.sb.points).pow(gameHelpers.improvementEffect("q", 21)) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.q.upgrades[21].effect)+"x" },
				formula: "1.25^x",
			},
			22: {
				title: "Infinite Possibilities",
				description: "Total Quirks provide free Extra Time Capsules, Enhancers, & Space Buildings.",
				cost() { return saveState.player.q.time.plus(1).pow(4.2).times(2e11).pow(saveState.player.ma.current=="q"?(this.id*2):1) },
				costFormula: "2e11*(time+1)^4.2",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 12)&&gameHelpers.hasUpgrade("q", 14) },
				effect() { return saveState.player.q.total.plus(1).log10().sqrt().times(gameHelpers.improvementEffect("q", 22)).floor() },
				effectDisplay() { return "+"+gameHelpers.formatWhole(derivedState.tmp.q.upgrades[22].effect) },
				formula: "floor(sqrt(log(x+1)))",
			},
			23: {
				title: "The Waiting Game",
				description: "The Quirk Energy effect is cubed.",
				cost() { return saveState.player.q.time.plus(1).pow(5.4).times(5e19).pow(saveState.player.ma.current=="q"?this.id:1) },
				costFormula: "5e19*(time+1)^5.4",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 13)&&gameHelpers.hasUpgrade("q", 21) },
			},
			24: {
				title: "Exponential Madness",
				description: "The first Time Energy effect & the first Enhancer effect are raised ^7.5.",
				cost() { return saveState.player.q.time.plus(1).pow(6.8).times(1e24).pow(saveState.player.ma.current=="q"?(this.id*1.95):1) },
				costFormula: "1e24*(time+1)^6.8",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 14)&&gameHelpers.hasUpgrade("q", 22) },
			},
			25: {
				title: "Advanced Onion",
				description: "Nebulaic Bricks reduce the Quirk Layer cost base.",
				cost() { return Decimal.pow("e3e6", saveState.player.q.time.times(4).plus(1).log10().pow(2)).times("e2e7") },
				costFormula: "(e3,000,000^(log(time*4+1)^2))*e20,000,000",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				pseudoUnl() { return saveState.player.i.buyables[12].gte(6) },
				pseudoReq: "Req: 1e200 Honour.",
				pseudoCan() { return saveState.player.hn.points.gte(1e200) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return saveState.player.i.nb.plus(1).log10().plus(1).pow(3) },
				effectDisplay() { return "brought to the "+gameHelpers.format(gameHelpers.upgradeEffect("q", 25))+"th root" },
				formula: "(log(x+1)+1)^3",
			},
			31: {
				title: "Scale Softening",
				description: "Post-12 scaling for static layers in rows 2-3 starts later based on your Quirk Layers.",
				cost() { return saveState.player.q.time.plus(1).pow(8.4).times(1e48).pow(saveState.player.ma.current=="q"?(this.id/1.25):1) },
				costFormula: "1e48*(time+1)^8.4",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 21)&&gameHelpers.hasUpgrade("q", 23) },
				effect() { return saveState.player.q.buyables[11].sqrt().times(0.4).times(gameHelpers.improvementEffect("q", 31)) },
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.q.upgrades[31].effect) },
				formula: "sqrt(x)*0.4",
			},
			32: {
				title: "Quinary Superspace",
				description: "The Quinary Space Building's effect is twice as strong.",
				cost() { return saveState.player.q.time.plus(1).pow(10).times(1e58).pow(saveState.player.ma.current=="q"?(this.id/1.6):1) },
				costFormula: "1e58*(time+1)^10",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 22)&&gameHelpers.hasUpgrade("q", 24) },
			},
			33: {
				title: "Generated Progression",
				description: "Unlock Super Generators.",
				cost() { return saveState.player.q.time.plus(1).pow(12).times(1e81).pow(saveState.player.ma.current=="q"?(this.id/1.85):1) },
				costFormula: "1e81*(time+1)^12",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 23)&&gameHelpers.hasUpgrade("q", 31) },
			},
			34: {
				title: "Booster Madness",
				description: "Anything that adds to the Booster base also multiplies it at a reduced rate.",
				cost() { return saveState.player.q.time.plus(1).pow(15).times(2.5e94).pow(saveState.player.ma.current=="q"?(this.id/1.85):1) },
				costFormula: "2.5e94*(time+1)^15",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 24)&&gameHelpers.hasUpgrade("q", 32) },
				effect() { return derivedState.tmp.b.addToBase.plus(1).root(2.5).times(gameHelpers.improvementEffect("q", 32)) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.q.upgrades[34].effect)+"x" },
				formula: "(x+1)^0.4",
			},
			35: {
				title: "Millennial Abilities",
				description: "Hyperspatial Bricks make Quirk Improvements scale slower.",
				cost() { return Decimal.pow("e2e6", saveState.player.q.time.times(4).plus(1).log10().pow(3)).times("e3.5e7") },
				costFormula: "(e2,000,000^(log(time*4+1)^3))*e35,000,000",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				pseudoUnl() { return saveState.player.i.buyables[12].gte(6) },
				pseudoReq: "Req: e5,000,000 Quirk Energy without any bought Quirk Layers (After a Row 5 reset).",
				pseudoCan() { return saveState.player.q.energy.gte("e5e6") && saveState.player.q.buyables[11].eq(0) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return saveState.player.i.hb.sqrt().div(25).times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.5:1).plus(1) },
				effectDisplay() { return gameHelpers.format(gameHelpers.upgradeEffect("q", 35).sub(1).times(100))+"% slower" },
				formula: "sqrt(x)*4%",
			},
			41: {
				title: "Quirkier",
				description: "Unlock Quirk Improvements.",
				cost() { return new Decimal((saveState.player.ma.current=="q")?"1e2325":1e125) },
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 33) && gameHelpers.hasUpgrade("q", 34) },
			},
			42: {
				title: "Improvement Boost",
				description: "Unlock 3 more Quirk Improvements.",
				cost() { return new Decimal((saveState.player.ma.current=="q")?"1e3675":1e150) },
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 41) },
			},
			43: {
				title: "More Layers",
				description: "Quirk Layers cost scale 25% slower.",
				cost() { return new Decimal((saveState.player.ma.current=="q")?"1e5340":1e175) },
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 42) },
			},
			44: {
				title: "Improvements Galore",
				description: "Unlock another 3 Quirk Improvements.",
				cost() { return new Decimal((saveState.player.ma.current=="q")?"1e8725":1e290) },
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return gameHelpers.hasUpgrade("q", 43) },
			},
			45: {
				title: "Anti-Hindrance",
				description: "The Hindrance Spirit effect is raised to the power of 100 (after softcaps), and gain 200x more Nebula Energy.",
				cost: new Decimal("e55555555"),
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				pseudoUnl() { return saveState.player.i.buyables[12].gte(6) },
				pseudoReq: "Req: e1.7e10 Prestige Points.",
				pseudoCan() { return saveState.player.p.points.gte("e1.7e10") },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
		},
		impr: {
			scaleSlow() {
				let slow = new Decimal(1);
				if (derivedState.tmp.ps.impr[22].unlocked) slow = slow.times(derivedState.tmp.ps.impr[22].effect);
				if (gameHelpers.hasUpgrade("q", 35) && saveState.player.i.buyables[12].gte(6)) slow = slow.times(gameHelpers.upgradeEffect("q", 35));
				return slow;
			},
			baseReq() { 
				let req = new Decimal(1e128);
				if (saveState.player.ps.unlocked) req = req.div(derivedState.tmp.ps.soulEff);
				return req;
			},
			amount() { 
				let amt = saveState.player.q.energy.div(this.baseReq()).plus(1).log10().div(2).root(layerRegistry.layers.q.impr.scaleSlow().pow(-1).plus(1)).max(0);
				if (amt.gte(270)) amt = amt.log10().times(270/Math.log10(270));
				return amt.floor();
			},
			overallNextImpr() { 
				let impr = derivedState.tmp.q.impr.amount.plus(1);
				if (impr.gte(270)) impr = Decimal.pow(10, impr.div(270/Math.log10(270)));
				return Decimal.pow(10, impr.pow(layerRegistry.layers.q.impr.scaleSlow().pow(-1).plus(1)).times(2)).sub(1).times(this.baseReq())
			},
			nextAt(id=11) { 
				let impr = gameHelpers.getImprovements("q", id).times(derivedState.tmp.q.impr.activeRows*derivedState.tmp.q.impr.activeCols).add(derivedState.tmp.q.impr[id].num);
				if (impr.gte(270)) impr = Decimal.pow(10, impr.div(270/Math.log10(270)));
				return Decimal.pow(10, impr.pow(layerRegistry.layers.q.impr.scaleSlow().pow(-1).plus(1)).times(2)).sub(1).times(this.baseReq());
			},
			free() {
				let free = new Decimal(0);
				if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes('q'):false) free = free.plus(Decimal.div(saveState.player.s.buyables[20]||0, 4));
				return free.floor();
			},
			resName: "quirk energy",
			rows: 4,
			cols: 3,
			activeRows: 3,
			activeCols: 3,
			11: {
				num: 1,
				title: "Central Improvement",
				description: "<b>Quirk Central</b> is stronger.",
				unlocked() { return gameHelpers.hasUpgrade("q", 41) },
				effect() { return Decimal.mul(0.1, gameHelpers.getImprovements("q", 11).plus(derivedState.tmp.q.impr.free)).plus(1) },
				effectDisplay() { return "^"+gameHelpers.format(derivedState.tmp.q.impr[11].effect) },
				formula: "1+0.1*x",
			},
			12: {
				num: 2,
				title: "Secondary Improvement",
				description: "<b>Back to Row 2</b> is stronger.",
				unlocked() { return gameHelpers.hasUpgrade("q", 41) },
				effect() { return Decimal.mul(0.05, gameHelpers.getImprovements("q", 12).plus(derivedState.tmp.q.impr.free)).plus(1) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.q.impr[12].effect)+"x" },
				formula: "1+0.05*x",
			},
			13: {
				num: 3,
				title: "Level 4 Improvement",
				description: "<b>Row 4 Synergy</b> is stronger.",
				unlocked() { return gameHelpers.hasUpgrade("q", 41) },
				effect() { return Decimal.mul(0.25, gameHelpers.getImprovements("q", 13).plus(derivedState.tmp.q.impr.free)).plus(1) },
				effectDisplay() { return "^"+gameHelpers.format(derivedState.tmp.q.impr[13].effect) },
				formula: "1+0.25*x",
			},
			21: {
				num: 4,
				title: "Developmental Improvement",
				description: "<b>Quirk City</b> is stronger.",
				unlocked() { return gameHelpers.hasUpgrade("q", 42) },
				effect() { return Decimal.mul(1.5, gameHelpers.getImprovements("q", 21).plus(derivedState.tmp.q.impr.free)).plus(1) },
				effectDisplay() { return "^"+gameHelpers.format(derivedState.tmp.q.impr[21].effect) },
				formula: "1+1.5*x",
			},
			22: {
				num: 5,
				title: "Transfinite Improvement",
				description: "<b>Infinite Possibilities</b> is stronger.",
				unlocked() { return gameHelpers.hasUpgrade("q", 42) },
				effect() { return Decimal.mul(0.2, gameHelpers.getImprovements("q", 22).plus(derivedState.tmp.q.impr.free)).plus(1) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.q.impr[22].effect)+"x" },
				formula: "1+0.2*x",
			},
			23: {
				num: 6,
				title: "Energy Improvement",
				description: "The Quirk Energy effect is stronger.",
				unlocked() { return gameHelpers.hasUpgrade("q", 42) },
				effect() { return Decimal.pow(1e25, Decimal.pow(gameHelpers.getImprovements("q", 23).plus(derivedState.tmp.q.impr.free), 1.5)) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.q.impr[23].effect)+"x" },
				formula: "1e25^(x^1.5)",
			},
			31: {
				num: 7,
				title: "Scale Improvement",
				description: "<b>Scale Softening</b> is stronger.",
				unlocked() { return gameHelpers.hasUpgrade("q", 44) },
				effect() { return Decimal.mul(0.5, gameHelpers.getImprovements("q", 31).plus(derivedState.tmp.q.impr.free)).plus(1) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.q.impr[31].effect)+"x" },
				formula: "1+0.5*x",
			},
			32: {
				num: 8,
				title: "Booster Improvement",
				description: "<b>Booster Madness</b> is stronger.",
				unlocked() { return gameHelpers.hasUpgrade("q", 44) },
				effect() { return Decimal.mul(0.2, gameHelpers.getImprovements("q", 32).plus(derivedState.tmp.q.impr.free)).plus(1) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.q.impr[32].effect)+"x" },
				formula: "1+0.2*x",
			},
			33: {
				num: 9,
				title: "Quirk Improvement",
				description: "Quirk gain is stronger.",
				unlocked() { return gameHelpers.hasUpgrade("q", 44) },
				effect() { return Decimal.pow(1e8, Decimal.pow(gameHelpers.getImprovements("q", 33).plus(derivedState.tmp.q.impr.free), 1.2)) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.q.impr[33].effect)+"x" },
				formula: "1e8^(x^1.2)",
			},
			41: {
				num: 271,
				title: "Solar Improvement",
				description: "Solar Energy gain is stronger.",
				unlocked() { return (derivedState.tmp.ps.buyables[11].effects.quirkImpr||0)>=1 },
				effect() { return Decimal.pow("1e400", Decimal.pow(gameHelpers.getImprovements("q", 41).plus(derivedState.tmp.q.impr.free), 0.9)) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.q.impr[41].effect)+"x" },
				formula: "1e400^(x^0.9)",
			},
			42: {
				num: 281,
				title: "Subspatial Improvement",
				description: "The Subspace base is stronger.",
				unlocked() { return (derivedState.tmp.ps.buyables[11].effects.quirkImpr||0)>=2 },
				effect() { return Decimal.pow(10, Decimal.pow(gameHelpers.getImprovements("q", 42).plus(derivedState.tmp.q.impr.free), 0.75)) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.q.impr[42].effect)+"x" },
				formula: "10^(x^0.75)",
			},
			43: {
				num: 301,
				title: "Layer Improvement",
				description: "Add free Quirk Layers.",
				unlocked() { return (derivedState.tmp.ps.buyables[11].effects.quirkImpr||0)>=3 },
				effect() { return Decimal.mul(Decimal.pow(gameHelpers.getImprovements("q", 43).plus(derivedState.tmp.q.impr.free), 0.8), 1.25) },
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.q.impr[43].effect) },
				formula: "1.25*(x^0.8)",
			},
		},
};
}
