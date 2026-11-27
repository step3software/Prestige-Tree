// g — generators content. Registration: manifest.js.
function createGeneratorsLayer() {
    return {
        name: "generators", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "G", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#a3d9a5",
        requires() { return new Decimal(200).times((player.g.unlockOrder&&!player.g.unlocked)?5000:1) }, // Can be a function that takes requirement increases into account
        resource: "generators", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		branches: ["p"],
        exponent() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.1:1.25 }, // Prestige currency exponent
		base() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?2.5:5 },
		gainMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("g", 22)) mult = mult.div(upgradeEffect("g", 22));
			if (player.s.unlocked) mult = mult.div(buyableEffect("s", 13));
			return mult;
		},
		canBuyMax() { return hasMilestone("g", 2) },
        row: 1, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "g", description: "Press G to perform a generator reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return player.p.unlocked},
		automate() {},
		resetsNothing() { return hasMilestone("s", 4)&&player.ma.current!="g" },
		effBase() {
			let base = new Decimal(2);
			
			// ADD
			if (hasUpgrade("g", 12)) base = base.plus(upgradeEffect("g", 12));
			if (hasUpgrade("g", 13)) base = base.plus(upgradeEffect("g", 13));
			if (hasUpgrade("e", 11)) base = base.plus(upgradeEffect("e", 11).g);
			if (player.e.unlocked) base = base.plus(layers.e.buyables[11].effect().second);
			if (player.s.unlocked) base = base.plus(buyableEffect("s", 12));
			
			// MULTIPLY
			if (hasUpgrade("q", 12)) base = base.times(upgradeEffect("q", 12));
			if (inChallenge("h", 12)) base = base.div(tmp.h.baseDiv12)
			if (player.sg.unlocked) base = base.times(tmp.sg.enEff)
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("t"):false) base = base.times(tmp.t.effLimBaseMult);
			
			return base;
		},
		effect() {
			if ((!unl(this.layer))||inChallenge("ne", 11)) return new Decimal(0);
			let eff = Decimal.pow(this.effBase(), player.g.points.plus(tmp.sg.spectralTotal)).sub(1).max(0);
			if (hasUpgrade("g", 21)) eff = eff.times(upgradeEffect("g", 21));
			if (hasUpgrade("g", 25)) eff = eff.times(upgradeEffect("g", 25));
			if (hasUpgrade("t", 15)) eff = eff.times(tmp.t.enEff);
			if (hasUpgrade("s", 12)) eff = eff.times(upgradeEffect("s", 12));
			if (hasUpgrade("s", 13)) eff = eff.times(upgradeEffect("s", 13));
			if (player.q.unlocked) eff = eff.times(tmp.q.enEff);
			return eff;
		},
		effectDescription() {
			return "which are generating "+format(tmp.g.effect)+" Generator Power/sec"+(tmp.nerdMode?(inChallenge("ne", 11)?"\n (DISABLED)":("\n ("+format(tmp.g.effBase)+"x each)")):"")
		},
		extraAmtDisplay() {
			if (tmp.sg.spectralTotal.eq(0)) return "";
			return "<h3 style='color: #84b88a; text-shadow: #78c48f 0px 0px 10px;'> + "+formatWhole(tmp.sg.spectralTotal)+"</h3>"
		},
		update(diff) {
			if (player.g.unlocked) player.g.power = player.g.power.plus(tmp.g.effect.times(diff));
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
		autoPrestige() { return (hasMilestone("s", 3) && player.g.auto)&&player.ma.current!="g" },
		powerExp() {
			let exp = new Decimal(1/3);
			if (hasUpgrade("b", 21)) exp = exp.times(2);
			if (hasUpgrade("b", 22)) exp = exp.times(1.2);
			if (hasUpgrade("q", 13)) exp = exp.times(1.25);
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) exp = exp.times(1.05);
			if (player.mc.upgrades.includes(11)) exp = exp.times(buyableEffect("mc", 12));
			if (hasAchievement("a", 152)) exp = exp.times(1.4);
			return exp;
		},
		powerEff() {
			if (!unl(this.layer)) return new Decimal(1);
			return player.g.power.plus(1).pow(this.powerExp());
		},
		doReset(resettingLayer) {
			let keep = [];
			player.g.power = new Decimal(0);
			if (hasMilestone("e", 0) && resettingLayer=="e") keep.push("milestones")
			if (hasMilestone("t", 0) && resettingLayer=="t") keep.push("milestones")
			if (hasMilestone("s", 0) && resettingLayer=="s") keep.push("milestones")
			if (hasMilestone("q", 0)) keep.push("milestones")
			if (hasMilestone("s", 2) || hasAchievement("a", 64)) keep.push("upgrades")
			if (hasMilestone("e", 2) && resettingLayer=="e") keep.push("upgrades")
			if (layers[resettingLayer].row > this.row) layerDataReset("g", keep)
		},
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'You have ' + format(player.g.power) + ' Generator Power, which boosts Point generation by '+format(tmp.g.powerEff)+'x'+(tmp.nerdMode?" ((x+1)^"+format(tmp.g.powerExp)+")":"")},
					{}],
			"blank",
			["display-text",
				function() {return 'Your best Generators is ' + formatWhole(player.g.best) + '<br>You have made a total of '+formatWhole(player.g.total)+" Generators."},
					{}],
			"blank",
			"milestones", "blank", "blank", "upgrades"],
		increaseUnlockOrder: ["b"],
		milestones: {
			0: {
				requirementDescription: "8 Generators",
				done() { return player.g.best.gte(8) || hasAchievement("a", 41) || hasAchievement("a", 71) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			1: {
				requirementDescription: "10 Generators",
				done() { return player.g.best.gte(10) || hasAchievement("a", 71) },
				effectDescription: "You gain 100% of Prestige Point gain every second.",
			},
			2: {
				requirementDescription: "15 Generators",
				done() { return player.g.best.gte(15) || hasAchievement("a", 71) },
				effectDescription: "You can buy max Generators.",
			},
		},
		upgrades: {
			rows: 3,
			cols: 5,
			11: {
				title: "GP Combo",
				description: "Best Generators boost Prestige Point gain.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?380:3) },
				effect() { return player.g.best.sqrt().plus(1).pow(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?5e5:1) },
				unlocked() { return player.g.unlocked },
				effectDisplay() { return format(tmp.g.upgrades[11].effect)+"x" },
				formula() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"(x+1)^250,000":"sqrt(x)+1" },
			},
			12: {
				title: "I Need More!",
				description: "Boosters add to the Generator base.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?375:7) },
				effect() { 
					let ret = player.b.points.add(1).log10().sqrt().div(3).times(hasUpgrade("e", 14)?upgradeEffect("e", 14):1);
					if (hasUpgrade("s", 24)) ret = ret.times(upgradeEffect("s", 24));
					return ret;
				},
				unlocked() { return player.b.unlocked&&player.g.unlocked },
				effectDisplay() { return "+"+format(tmp.g.upgrades[12].effect) },
				formula() { 
					let m = new Decimal(hasUpgrade("e", 14)?upgradeEffect("e", 14):1).div(3)
					if (hasUpgrade("s", 24)) m = upgradeEffect("s", 24).times(m);
					return "sqrt(log(x+1))"+(m.eq(1)?"":(m.gt(1)?("*"+format(m)):("/"+format(m.pow(-1)))));
				},
			},
			13: {
				title: "I Need More II",
				description: "Best Prestige Points add to the Generator base.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?381:8) },
				effect() { 
					let ret = player.p.best.add(1).log10().add(1).log10().div(3).times(hasUpgrade("e", 14)?upgradeEffect("e", 14):1);
					if (hasUpgrade("s", 24)) ret = ret.times(upgradeEffect("s", 24));
					return ret;
				},
				unlocked() { return player.g.best.gte(8) },
				effectDisplay() { return "+"+format(tmp.g.upgrades[13].effect) },
				formula() { 
					let m = new Decimal(hasUpgrade("e", 14)?upgradeEffect("e", 14):1).div(3)
					if (hasUpgrade("s", 24)) m = upgradeEffect("s", 24).times(m);
					return "log(log(x+1)+1)"+(m.eq(1)?"":(m.gt(1)?("*"+format(m)):("/"+format(m.pow(-1)))));
				},
			},
			14: {
				title: "Boost the Boost",
				description() { return "<b>Prestige Boost</b> is raised to the power of 1.5." },
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?378:13) },
				unlocked() { return player.g.best.gte(10) },
			},
			15: {
				title: "Outer Synergy",
				description: "<b>Self-Synergy</b> is stronger based on your Generators.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?382:15) },
				effect() { 
					let eff = player.g.points.sqrt().add(1);
					if (eff.gte(400)) eff = eff.cbrt().times(Math.pow(400, 2/3))
					return eff;
				},
				unlocked() { return hasUpgrade("g", 13) },
				effectDisplay() { return "^"+format(tmp.g.upgrades[15].effect) },
				formula() { return upgradeEffect("g", 15).gte(400)?"((x+1)^(1/6))*(400^(2/3))":"sqrt(x)+1" },
			},
			21: {
				title: "I Need More III",
				description: "Generator Power boost its own generation.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e314":1e10) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { 
					let ret = player.g.power.add(1).log10().add(1);
					if (hasUpgrade("s", 24)) ret = ret.pow(upgradeEffect("s", 24));
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) ret = ret.pow(1e4)
					return ret;
				},
				unlocked() { return hasUpgrade("g", 15) },
				effectDisplay() { return format(tmp.g.upgrades[21].effect)+"x" },
				formula() { 
					let exp = new Decimal(1);
					if (hasUpgrade("s", 24)) exp = exp.times(upgradeEffect("s", 24));
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) exp = exp.times(1e4);
					let f = "log(x+1)+1";
					if (exp.gt(1)) f = "("+f+")^"+format(exp);
					return f;
				},
			},
			22: {
				title: "Discount Two",
				description: "Generators are cheaper based on your Prestige Points.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"5e47141":1e11) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { 
					let eff = player.p.points.add(1).pow(0.25);
					if (hasUpgrade("g", 32) && player.i.buyables[12].gte(2)) eff = eff.pow(upgradeEffect("g", 32));
					return eff;
				},
				unlocked() { return hasUpgrade("g", 15) },
				effectDisplay() { return "/"+format(tmp.g.upgrades[22].effect) },
				formula: "(x+1)^0.25",
			},
			23: {
				title: "Double Reversal",
				description: "<b>Reverse Prestige Boost</b> is stronger based on your Boosters.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"2e47525":1e12) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { return player.b.points.pow(0.85).add(1) },
				unlocked() { return hasUpgrade("g", 15)&&player.b.unlocked },
				effectDisplay() { return "^"+format(tmp.g.upgrades[23].effect) },
				formula: "x^0.85+1",
			},
			24: {
				title: "Boost the Boost Again",
				description: "<b>Prestige Boost</b> is raised to the power of 1.467.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?690:20) },
				unlocked() { return hasUpgrade("g", 14)&&(hasUpgrade("g", 21)||hasUpgrade("g", 22)) },
			},
			25: {
				title: "I Need More IV",
				description: "Prestige Points boost Generator Power gain.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e47526":1e14) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { 
					let ret = player.p.points.add(1).log10().pow(3).add(1);
					if (hasUpgrade("s", 24)) ret = ret.pow(upgradeEffect("s", 24));
					return ret;
				},
				unlocked() { return hasUpgrade("g", 23)&&hasUpgrade("g", 24) },
				effectDisplay() { return format(tmp.g.upgrades[25].effect)+"x" },
				formula() { 
					let f = "log(x+1)^3+1";
					if (hasUpgrade("s", 24)) f = "("+f+")^"+format(upgradeEffect("s", 24));
					return f;
				},
			},
			31: {
				title: "Absurd Generation",
				description: "Generator Power multiplies the Super Generator base.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e47545":"e4.4e7") },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				pseudoUnl() { return player.i.buyables[12].gte(2)&&player.g.upgrades.length>=10 },
				pseudoReq: "Req: e73,600,000 Prestige Points without any Generator Power (after doing an Enhance reset).",
				pseudoCan() { return player.p.points.gte("e7.35e7") && player.g.power.eq(0) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return player.g.power.plus(1).log10().plus(1).pow(2) },
				effectDisplay() { return format(tmp[this.layer].upgrades[this.id].effect)+"x" },
				formula: "(log(x+1)+1)^2",
			},
			32: {
				title: "Primal Instincts",
				description: "The <b>Quaternary Space Building</b> also affects <b>Discount Two</b> at a reduced rate.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1260:2200) },
				pseudoUnl() { return player.i.buyables[12].gte(2)&&player.g.upgrades.length>=10 },
				pseudoReq: "Req: e47,500,000 Generator Power without any Boosters (after doing an Enhance reset).",
				pseudoCan() { return player.g.power.gte("e4.75e7") && player.b.best.eq(0) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return buyableEffect("s", 14).pow(0.8) },
				effectDisplay() { return "^"+format(tmp[this.layer].upgrades[this.id].effect) },
				formula: "eff^0.8",
				style: {"font-size": "9px"},
			},
			33: {
				title: "Dust Production",
				description: "Generators boost Dust gain.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e48000":"e5.6e7") },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				pseudoUnl() { return player.i.buyables[12].gte(2)&&player.g.upgrades.length>=10 },
				pseudoReq: "Req: 1e14 Nebula Energy",
				pseudoCan() { return player.n.points.gte(1e14) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return Decimal.pow(1.15, player.g.points.sqrt()) },
				effectDisplay() { return format(tmp[this.layer].upgrades[this.id].effect)+"x" },
				formula: "1.15^sqrt(x)",
			},
			34: {
				title: "Boost the Boost Again^2",
				description: "<b>Prestige Boost</b> is raised to the power of 1.433.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1257:2200) },
				pseudoUnl() { return player.i.buyables[12].gte(2)&&player.g.upgrades.length>=10 },
				pseudoReq: "Req: 36 Achievements.",
				pseudoCan() { return player.a.achievements.length>=36 },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			35: {
				title: "Into The Future",
				description: "Nebula Energy, Honour, and Hyperspace Energy gains are boosted by Generator Power.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e47540":"e4.4e7") },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				pseudoUnl() { return player.i.buyables[12].gte(2)&&player.g.upgrades.length>=10 },
				pseudoReq: "Req: 5e18 Honour & 5e17 Hyperspace Energy.",
				pseudoCan() { return player.hn.points.gte(5e18) && player.hs.points.gte(5e17) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return player.g.power.plus(1).log10().plus(1).sqrt() },
				effectDisplay() { return format(tmp[this.layer].upgrades[this.id].effect)+"x" },
				formula: "sqrt(log(x+1)+1)",
			},
		},
};
}
