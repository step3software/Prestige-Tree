// Session-bound layer owner; composition supplies only the named ports.
// g — generators content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'>} ports */
function createGeneratorsLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState }) {
    return {
        name: "generators", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "G", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#a3d9a5",
        requires() { return new Decimal(200).times((saveState.player.g.unlockOrder&&!saveState.player.g.unlocked)?5000:1) }, // Can be a function that takes requirement increases into account
        resource: "generators", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return saveState.player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		branches: ["p"],
        exponent() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.1:1.25 }, // Prestige currency exponent
		base() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?2.5:5 },
		gainMult() {
			let mult = new Decimal(1);
			if (gameHelpers.hasUpgrade("g", 22)) mult = mult.div(gameHelpers.upgradeEffect("g", 22));
			if (saveState.player.s.unlocked) mult = mult.div(gameHelpers.buyableEffect("s", 13));
			return mult;
		},
		canBuyMax() { return gameHelpers.hasMilestone("g", 2) },
        row: 1, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "g", description: "Press G to perform a generator reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
        layerShown(){return saveState.player.p.unlocked},
		automate() {},
		resetsNothing() { return gameHelpers.hasMilestone("s", 4)&&saveState.player.ma.current!="g" },
		effBase() {
			let base = new Decimal(2);
			
			// ADD
			if (gameHelpers.hasUpgrade("g", 12)) base = base.plus(gameHelpers.upgradeEffect("g", 12));
			if (gameHelpers.hasUpgrade("g", 13)) base = base.plus(gameHelpers.upgradeEffect("g", 13));
			if (gameHelpers.hasUpgrade("e", 11)) base = base.plus(gameHelpers.upgradeEffect("e", 11).g);
			if (saveState.player.e.unlocked) base = base.plus(layerRegistry.layers.e.buyables[11].effect().second);
			if (saveState.player.s.unlocked) base = base.plus(gameHelpers.buyableEffect("s", 12));
			
			// MULTIPLY
			if (gameHelpers.hasUpgrade("q", 12)) base = base.times(gameHelpers.upgradeEffect("q", 12));
			if (gameHelpers.inChallenge("h", 12)) base = base.div(derivedState.tmp.h.baseDiv12)
			if (saveState.player.sg.unlocked) base = base.times(derivedState.tmp.sg.enEff)
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("t"):false) base = base.times(derivedState.tmp.t.effLimBaseMult);
			
			return base;
		},
		effect() {
			if ((!gameHelpers.unl(this.layer))||gameHelpers.inChallenge("ne", 11)) return new Decimal(0);
			let eff = Decimal.pow(this.effBase(), saveState.player.g.points.plus(derivedState.tmp.sg.spectralTotal)).sub(1).max(0);
			if (gameHelpers.hasUpgrade("g", 21)) eff = eff.times(gameHelpers.upgradeEffect("g", 21));
			if (gameHelpers.hasUpgrade("g", 25)) eff = eff.times(gameHelpers.upgradeEffect("g", 25));
			if (gameHelpers.hasUpgrade("t", 15)) eff = eff.times(derivedState.tmp.t.enEff);
			if (gameHelpers.hasUpgrade("s", 12)) eff = eff.times(gameHelpers.upgradeEffect("s", 12));
			if (gameHelpers.hasUpgrade("s", 13)) eff = eff.times(gameHelpers.upgradeEffect("s", 13));
			if (saveState.player.q.unlocked) eff = eff.times(derivedState.tmp.q.enEff);
			return eff;
		},
		effectDescription() {
			return "which are generating "+gameHelpers.format(derivedState.tmp.g.effect)+" Generator Power/sec"+(derivedState.tmp.nerdMode?(gameHelpers.inChallenge("ne", 11)?"\n (DISABLED)":("\n ("+gameHelpers.format(derivedState.tmp.g.effBase)+"x each)")):"")
		},
		extraAmtDisplay() {
			if (derivedState.tmp.sg.spectralTotal.eq(0)) return "";
			return "<h3 style='color: #84b88a; text-shadow: #78c48f 0px 0px 10px;'> + "+gameHelpers.formatWhole(derivedState.tmp.sg.spectralTotal)+"</h3>"
		},
		update(diff) {
			if (saveState.player.g.unlocked) saveState.player.g.power = saveState.player.g.power.plus(derivedState.tmp.g.effect.times(diff));
		},
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			power: new Decimal(0),
			pseudoUpgs: [],
			first: 0,
			auto: false,
		}},
		autoPrestige() { return (gameHelpers.hasMilestone("s", 3) && saveState.player.g.auto)&&saveState.player.ma.current!="g" },
		powerExp() {
			let exp = new Decimal(1/3);
			if (gameHelpers.hasUpgrade("b", 21)) exp = exp.times(2);
			if (gameHelpers.hasUpgrade("b", 22)) exp = exp.times(1.2);
			if (gameHelpers.hasUpgrade("q", 13)) exp = exp.times(1.25);
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) exp = exp.times(1.05);
			if (saveState.player.mc.upgrades.includes(11)) exp = exp.times(gameHelpers.buyableEffect("mc", 12));
			if (gameHelpers.hasAchievement("a", 152)) exp = exp.times(1.4);
			return exp;
		},
		powerEff() {
			if (!gameHelpers.unl(this.layer)) return new Decimal(1);
			return saveState.player.g.power.plus(1).pow(this.powerExp());
		},
		doReset(resettingLayer) {
			let keep = [];
			saveState.player.g.power = new Decimal(0);
			if (gameHelpers.hasMilestone("e", 0) && resettingLayer=="e") keep.push("milestones")
			if (gameHelpers.hasMilestone("t", 0) && resettingLayer=="t") keep.push("milestones")
			if (gameHelpers.hasMilestone("s", 0) && resettingLayer=="s") keep.push("milestones")
			if (gameHelpers.hasMilestone("q", 0)) keep.push("milestones")
			if (gameHelpers.hasMilestone("s", 2) || gameHelpers.hasAchievement("a", 64)) keep.push("upgrades")
			if (gameHelpers.hasMilestone("e", 2) && resettingLayer=="e") keep.push("upgrades")
			if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset("g", keep)
		},
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'You have ' + gameHelpers.format(saveState.player.g.power) + ' Generator Power, which boosts Point generation by '+gameHelpers.format(derivedState.tmp.g.powerEff)+'x'+(derivedState.tmp.nerdMode?" ((x+1)^"+gameHelpers.format(derivedState.tmp.g.powerExp)+")":"")},
					{}],
			"blank",
			["display-text",
				function() {return 'Your best Generators is ' + gameHelpers.formatWhole(saveState.player.g.best) + '<br>You have made a total of '+gameHelpers.formatWhole(saveState.player.g.total)+" Generators."},
					{}],
			"blank",
			"milestones", "blank", "blank", "upgrades"],
		increaseUnlockOrder: ["b"],
		milestones: {
			0: {
				requirementDescription: "8 Generators",
				done() { return saveState.player.g.best.gte(8) || gameHelpers.hasAchievement("a", 41) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			1: {
				requirementDescription: "10 Generators",
				done() { return saveState.player.g.best.gte(10) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "You gain 100% of Prestige Point gain every second.",
			},
			2: {
				requirementDescription: "15 Generators",
				done() { return saveState.player.g.best.gte(15) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "You can buy max Generators.",
			},
		},
		upgrades: {
			rows: 3,
			cols: 5,
			11: {
				title: "GP Combo",
				description: "Best Generators boost Prestige Point gain.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?380:3) },
				effect() { return saveState.player.g.best.sqrt().plus(1).pow(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?5e5:1) },
				unlocked() { return saveState.player.g.unlocked },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.g.upgrades[11].effect)+"x" },
				formula() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"(x+1)^250,000":"sqrt(x)+1" },
			},
			12: {
				title: "I Need More!",
				description: "Boosters add to the Generator base.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?375:7) },
				effect() { 
					let ret = saveState.player.b.points.add(1).log10().sqrt().div(3).times(gameHelpers.hasUpgrade("e", 14)?gameHelpers.upgradeEffect("e", 14):1);
					if (gameHelpers.hasUpgrade("s", 24)) ret = ret.times(gameHelpers.upgradeEffect("s", 24));
					return ret;
				},
				unlocked() { return saveState.player.b.unlocked&&saveState.player.g.unlocked },
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.g.upgrades[12].effect) },
				formula() { 
					let m = new Decimal(gameHelpers.hasUpgrade("e", 14)?gameHelpers.upgradeEffect("e", 14):1).div(3)
					if (gameHelpers.hasUpgrade("s", 24)) m = gameHelpers.upgradeEffect("s", 24).times(m);
					return "sqrt(log(x+1))"+(m.eq(1)?"":(m.gt(1)?("*"+gameHelpers.format(m)):("/"+gameHelpers.format(m.pow(-1)))));
				},
			},
			13: {
				title: "I Need More II",
				description: "Best Prestige Points add to the Generator base.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?381:8) },
				effect() { 
					let ret = saveState.player.p.best.add(1).log10().add(1).log10().div(3).times(gameHelpers.hasUpgrade("e", 14)?gameHelpers.upgradeEffect("e", 14):1);
					if (gameHelpers.hasUpgrade("s", 24)) ret = ret.times(gameHelpers.upgradeEffect("s", 24));
					return ret;
				},
				unlocked() { return saveState.player.g.best.gte(8) },
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.g.upgrades[13].effect) },
				formula() { 
					let m = new Decimal(gameHelpers.hasUpgrade("e", 14)?gameHelpers.upgradeEffect("e", 14):1).div(3)
					if (gameHelpers.hasUpgrade("s", 24)) m = gameHelpers.upgradeEffect("s", 24).times(m);
					return "log(log(x+1)+1)"+(m.eq(1)?"":(m.gt(1)?("*"+gameHelpers.format(m)):("/"+gameHelpers.format(m.pow(-1)))));
				},
			},
			14: {
				title: "Boost the Boost",
				description() { return "<b>Prestige Boost</b> is raised to the power of 1.5." },
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?378:13) },
				unlocked() { return saveState.player.g.best.gte(10) },
			},
			15: {
				title: "Outer Synergy",
				description: "<b>Self-Synergy</b> is stronger based on your Generators.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?382:15) },
				effect() { 
					let eff = saveState.player.g.points.sqrt().add(1);
					if (eff.gte(400)) eff = eff.cbrt().times(Math.pow(400, 2/3))
					return eff;
				},
				unlocked() { return gameHelpers.hasUpgrade("g", 13) },
				effectDisplay() { return "^"+gameHelpers.format(derivedState.tmp.g.upgrades[15].effect) },
				formula() { return gameHelpers.upgradeEffect("g", 15).gte(400)?"((x+1)^(1/6))*(400^(2/3))":"sqrt(x)+1" },
			},
			21: {
				title: "I Need More III",
				description: "Generator Power boost its own generation.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e314":1e10) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { 
					let ret = saveState.player.g.power.add(1).log10().add(1);
					if (gameHelpers.hasUpgrade("s", 24)) ret = ret.pow(gameHelpers.upgradeEffect("s", 24));
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) ret = ret.pow(1e4)
					return ret;
				},
				unlocked() { return gameHelpers.hasUpgrade("g", 15) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.g.upgrades[21].effect)+"x" },
				formula() { 
					let exp = new Decimal(1);
					if (gameHelpers.hasUpgrade("s", 24)) exp = exp.times(gameHelpers.upgradeEffect("s", 24));
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) exp = exp.times(1e4);
					let f = "log(x+1)+1";
					if (exp.gt(1)) f = "("+f+")^"+gameHelpers.format(exp);
					return f;
				},
			},
			22: {
				title: "Discount Two",
				description: "Generators are cheaper based on your Prestige Points.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"5e47141":1e11) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { 
					let eff = saveState.player.p.points.add(1).pow(0.25);
					if (gameHelpers.hasUpgrade("g", 32) && saveState.player.i.buyables[12].gte(2)) eff = eff.pow(gameHelpers.upgradeEffect("g", 32));
					return eff;
				},
				unlocked() { return gameHelpers.hasUpgrade("g", 15) },
				effectDisplay() { return "/"+gameHelpers.format(derivedState.tmp.g.upgrades[22].effect) },
				formula: "(x+1)^0.25",
			},
			23: {
				title: "Double Reversal",
				description: "<b>Reverse Prestige Boost</b> is stronger based on your Boosters.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"2e47525":1e12) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { return saveState.player.b.points.pow(0.85).add(1) },
				unlocked() { return gameHelpers.hasUpgrade("g", 15)&&saveState.player.b.unlocked },
				effectDisplay() { return "^"+gameHelpers.format(derivedState.tmp.g.upgrades[23].effect) },
				formula: "x^0.85+1",
			},
			24: {
				title: "Boost the Boost Again",
				description: "<b>Prestige Boost</b> is raised to the power of 1.467.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?690:20) },
				unlocked() { return gameHelpers.hasUpgrade("g", 14)&&(gameHelpers.hasUpgrade("g", 21)||gameHelpers.hasUpgrade("g", 22)) },
			},
			25: {
				title: "I Need More IV",
				description: "Prestige Points boost Generator Power gain.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e47526":1e14) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { 
					let ret = saveState.player.p.points.add(1).log10().pow(3).add(1);
					if (gameHelpers.hasUpgrade("s", 24)) ret = ret.pow(gameHelpers.upgradeEffect("s", 24));
					return ret;
				},
				unlocked() { return gameHelpers.hasUpgrade("g", 23)&&gameHelpers.hasUpgrade("g", 24) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.g.upgrades[25].effect)+"x" },
				formula() { 
					let f = "log(x+1)^3+1";
					if (gameHelpers.hasUpgrade("s", 24)) f = "("+f+")^"+gameHelpers.format(gameHelpers.upgradeEffect("s", 24));
					return f;
				},
			},
			31: {
				title: "Absurd Generation",
				description: "Generator Power multiplies the Super Generator base.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e47545":"e4.4e7") },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				pseudoUnl() { return saveState.player.i.buyables[12].gte(2)&&saveState.player.g.upgrades.length>=10 },
				pseudoReq: "Req: e73,600,000 Prestige Points without any Generator Power (after doing an Enhance reset).",
				pseudoCan() { return saveState.player.p.points.gte("e7.35e7") && saveState.player.g.power.eq(0) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return saveState.player.g.power.plus(1).log10().plus(1).pow(2) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp[this.layer].upgrades[this.id].effect)+"x" },
				formula: "(log(x+1)+1)^2",
			},
			32: {
				title: "Primal Instincts",
				description: "The <b>Quaternary Space Building</b> also affects <b>Discount Two</b> at a reduced rate.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1260:2200) },
				pseudoUnl() { return saveState.player.i.buyables[12].gte(2)&&saveState.player.g.upgrades.length>=10 },
				pseudoReq: "Req: e47,500,000 Generator Power without any Boosters (after doing an Enhance reset).",
				pseudoCan() { return saveState.player.g.power.gte("e4.75e7") && saveState.player.b.best.eq(0) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return gameHelpers.buyableEffect("s", 14).pow(0.8) },
				effectDisplay() { return "^"+gameHelpers.format(derivedState.tmp[this.layer].upgrades[this.id].effect) },
				formula: "eff^0.8",
				style: {"font-size": "9px"},
			},
			33: {
				title: "Dust Production",
				description: "Generators boost Dust gain.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e48000":"e5.6e7") },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				pseudoUnl() { return saveState.player.i.buyables[12].gte(2)&&saveState.player.g.upgrades.length>=10 },
				pseudoReq: "Req: 1e14 Nebula Energy",
				pseudoCan() { return saveState.player.n.points.gte(1e14) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return Decimal.pow(1.15, saveState.player.g.points.sqrt()) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp[this.layer].upgrades[this.id].effect)+"x" },
				formula: "1.15^sqrt(x)",
			},
			34: {
				title: "Boost the Boost Again^2",
				description: "<b>Prestige Boost</b> is raised to the power of 1.433.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1257:2200) },
				pseudoUnl() { return saveState.player.i.buyables[12].gte(2)&&saveState.player.g.upgrades.length>=10 },
				pseudoReq: "Req: 36 Achievements.",
				pseudoCan() { return saveState.player.a.achievements.length>=36 },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			35: {
				title: "Into The Future",
				description: "Nebula Energy, Honour, and Hyperspace Energy gains are boosted by Generator Power.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e47540":"e4.4e7") },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				pseudoUnl() { return saveState.player.i.buyables[12].gte(2)&&saveState.player.g.upgrades.length>=10 },
				pseudoReq: "Req: 5e18 Honour & 5e17 Hyperspace Energy.",
				pseudoCan() { return saveState.player.hn.points.gte(5e18) && saveState.player.hs.points.gte(5e17) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return saveState.player.g.power.plus(1).log10().plus(1).sqrt() },
				effectDisplay() { return gameHelpers.format(derivedState.tmp[this.layer].upgrades[this.id].effect)+"x" },
				formula: "sqrt(log(x+1)+1)",
			},
		},
};
}
