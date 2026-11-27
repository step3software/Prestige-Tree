// Session-bound layer owner; composition supplies only the named ports.
// b — boosters content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'>} ports */
function createBoostersLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState }) {
    return {
        name: "boosters", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "B", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#6e64c4",
        requires() { return new Decimal(200).times((saveState.player.b.unlockOrder&&!saveState.player.b.unlocked)?5000:1) }, // Can be a function that takes requirement increases into account
        resource: "boosters", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return saveState.player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		branches: ["p"],
        exponent() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?0.75:1.25 }, // Prestige currency exponent
		base() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.5:5 },
		gainMult() { 
			let mult = new Decimal(1);
			if (gameHelpers.hasUpgrade("b", 23)) mult = mult.div(gameHelpers.upgradeEffect("b", 23));
			if (saveState.player.s.unlocked) mult = mult.div(gameHelpers.buyableEffect("s", 13));
			return mult;
		},
		canBuyMax() { return gameHelpers.hasMilestone("b", 1) },
        row: 1, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "b", description: "Press B to perform a booster reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
        layerShown(){return saveState.player.p.unlocked},
		automate() {},
		resetsNothing() { return gameHelpers.hasMilestone("t", 4)&&saveState.player.ma.current!="b" },
		addToBase() {
			let base = new Decimal(0);
			if (gameHelpers.hasUpgrade("b", 12)) base = base.plus(gameHelpers.upgradeEffect("b", 12));
			if (gameHelpers.hasUpgrade("b", 13)) base = base.plus(gameHelpers.upgradeEffect("b", 13));
			if (gameHelpers.hasUpgrade("t", 11)) base = base.plus(gameHelpers.upgradeEffect("t", 11));
			if (gameHelpers.hasUpgrade("e", 11)) base = base.plus(gameHelpers.upgradeEffect("e", 11).b);
			if (saveState.player.e.unlocked) base = base.plus(layerRegistry.layers.e.buyables[11].effect().second);
			if (saveState.player.s.unlocked) base = base.plus(gameHelpers.buyableEffect("s", 12));
			if (gameHelpers.hasUpgrade("t", 25)) base = base.plus(gameHelpers.upgradeEffect("t", 25));
			return base;
		},
		effectBase() {
			let base = new Decimal(2);
			
			// ADD
			base = base.plus(derivedState.tmp.b.addToBase);
			
			// MULTIPLY
			if (saveState.player.sb.unlocked) base = base.times(derivedState.tmp.sb.effect);
			if (gameHelpers.hasUpgrade("q", 12)) base = base.times(gameHelpers.upgradeEffect("q", 12));
			if (gameHelpers.hasUpgrade("q", 34)) base = base.times(gameHelpers.upgradeEffect("q", 34));
			if (saveState.player.m.unlocked) base = base.times(derivedState.tmp.m.buyables[11].effect);
			if (gameHelpers.hasUpgrade("b", 24) && saveState.player.i.buyables[12].gte(1)) base = base.times(gameHelpers.upgradeEffect("b", 24));
			if (gameHelpers.inChallenge("h", 12)) base = base.div(derivedState.tmp.h.baseDiv12);
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("t"):false) base = base.times(derivedState.tmp.t.effLimBaseMult);
			
			return base.pow(derivedState.tmp.b.power);
		},
		power() {
			let power = new Decimal(1);
			if (saveState.player.m.unlocked) power = power.times(saveState.player.m.spellTimes[12].gt(0)?1.05:1);
			return power;
		},
		effect() {
			if ((!gameHelpers.unl(this.layer))||gameHelpers.inChallenge("ne", 11)) return new Decimal(1);
			return Decimal.pow(derivedState.tmp.b.effectBase, saveState.player.b.points.plus(derivedState.tmp.sb.spectralTotal)).max(0).times(gameHelpers.hasUpgrade("p", 43)?derivedState.tmp.q.enEff:1);
		},
		effectDescription() {
			return "which are boosting Point generation by "+gameHelpers.format(derivedState.tmp.b.effect)+"x"+(derivedState.tmp.nerdMode?(gameHelpers.inChallenge("ne", 11)?"\n (DISABLED)":("\n ("+gameHelpers.format(derivedState.tmp.b.effectBase)+"x each)")):"")
		},
		doReset(resettingLayer) {
			let keep = [];
			if (gameHelpers.hasMilestone("e", 0) && resettingLayer=="e") keep.push("milestones")
			if (gameHelpers.hasMilestone("t", 0) && resettingLayer=="t") keep.push("milestones")
			if (gameHelpers.hasMilestone("s", 0) && resettingLayer=="s") keep.push("milestones")
			if (gameHelpers.hasMilestone("q", 0)) keep.push("milestones")
			if (gameHelpers.hasMilestone("t", 2) || gameHelpers.hasAchievement("a", 64)) keep.push("upgrades")
			if (gameHelpers.hasMilestone("e", 2) && resettingLayer=="e") keep.push("upgrades")
			if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset("b", keep)
		},
		extraAmtDisplay() {
			if (derivedState.tmp.sb.spectralTotal.eq(0)) return "";
			return "<h3 style='color: #8882ba; text-shadow: #7f78c4 0px 0px 10px;'> + "+gameHelpers.formatWhole(derivedState.tmp.sb.spectralTotal)+"</h3>"
		},
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			pseudoUpgs: [],
			first: 0,
			auto: false,
		}},
		autoPrestige() { return (gameHelpers.hasMilestone("t", 3) && saveState.player.b.auto)&&saveState.player.ma.current!="b" },
		increaseUnlockOrder: ["g"],
		milestones: {
			0: {
				requirementDescription: "8 Boosters",
				done() { return saveState.player.b.best.gte(8) || gameHelpers.hasAchievement("a", 41) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			1: {
				requirementDescription: "15 Boosters",
				done() { return saveState.player.b.best.gte(15) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "You can buy max Boosters.",
			},
		},
		upgrades: {
			rows: 3,
			cols: 4,
			11: {
				title: "BP Combo",
				description: "Best Boosters boost Prestige Point gain.",
				cost() { return derivedState.tmp.h.costMult11b.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1438:3) },
				effect() { 
					let ret = saveState.player.b.best.sqrt().plus(1);
					if (gameHelpers.hasUpgrade("b", 32)) ret = Decimal.pow(1.125, saveState.player.b.best).times(ret);
					if (gameHelpers.hasUpgrade("s", 15)) ret = ret.pow(gameHelpers.buyableEffect("s", 14).root(2.7));
					if (gameHelpers.hasUpgrade("b", 14) && saveState.player.i.buyables[12].gte(1)) ret = ret.pow(gameHelpers.upgradeEffect("b", 14));
					if (((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)) ret = ret.pow(1.5);
					return ret;
				},
				unlocked() { return saveState.player.b.unlocked },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.b.upgrades[11].effect)+"x" },
				formula() { 
					let base = "sqrt(x)+1"
					if (gameHelpers.hasUpgrade("b", 32)) base = "(sqrt(x)+1)*(1.125^x)"
					let exp = new Decimal(1)
					if (gameHelpers.hasUpgrade("s", 15)) exp = exp.times(gameHelpers.buyableEffect("s", 14).root(2.7));
					if (gameHelpers.hasUpgrade("b", 14) && saveState.player.i.buyables[12].gte(1)) exp = exp.times(gameHelpers.upgradeEffect("b", 14));
					if (((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)) exp = exp.times(1.5);
					let f = exp.gt(1)?("("+base+")^"+gameHelpers.format(exp)):base;
					return f;
				},
			},
			12: {
				title: "Cross-Contamination",
				description: "Generators add to the Booster effect base.",
				cost() { return derivedState.tmp.h.costMult11b.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1250:7) },
				effect() {
					let ret = saveState.player.g.points.add(1).log10().sqrt().div(3).times(gameHelpers.hasUpgrade("e", 14)?gameHelpers.upgradeEffect("e", 14):1);
					if (gameHelpers.hasUpgrade("b", 14) && saveState.player.i.buyables[12].gte(1)) ret = ret.pow(gameHelpers.upgradeEffect("b", 14));
					return ret;
				},
				unlocked() { return saveState.player.b.unlocked&&saveState.player.g.unlocked },
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.b.upgrades[12].effect) },
				formula() { 
					let exp = new Decimal(1);
					if (gameHelpers.hasUpgrade("b", 14) && saveState.player.i.buyables[12].gte(1)) exp = exp.times(gameHelpers.upgradeEffect("b", 14));
					let f = "sqrt(log(x+1))"+(gameHelpers.hasUpgrade("e", 14)?("*"+gameHelpers.format(gameHelpers.upgradeEffect("e", 14).div(3))):"/3")
					if (exp.gt(1)) f = "("+f+")^"+gameHelpers.format(exp);
					return f;
				},
			},
			13: {
				title: "PB Reversal",
				description: "Total Prestige Points add to the Booster effect base.",
				cost() { return derivedState.tmp.h.costMult11b.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1436:8) },
				effect() { 
					let ret = saveState.player.p.total.add(1).log10().add(1).log10().div(3).times(gameHelpers.hasUpgrade("e", 14)?gameHelpers.upgradeEffect("e", 14):1)
					if (gameHelpers.hasUpgrade("b", 14) && saveState.player.i.buyables[12].gte(1)) ret = ret.pow(gameHelpers.upgradeEffect("b", 14));
					return ret;
				},
				unlocked() { return saveState.player.b.unlocked&&saveState.player.b.best.gte(7) },
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.b.upgrades[13].effect) },
				formula() { 
					let exp = new Decimal(1)
					if (gameHelpers.hasUpgrade("b", 14) && saveState.player.i.buyables[12].gte(1)) exp = exp.times(gameHelpers.upgradeEffect("b", 14));
					let f = "log(log(x+1)+1)"+(gameHelpers.hasUpgrade("e", 14)?("*"+gameHelpers.format(gameHelpers.upgradeEffect("e", 14).div(3))):"/3")
					if (exp.gt(1)) f = "("+f+")^"+gameHelpers.format(exp);
					return f;
				},
			},
			14: {
				title: "Meta-Combo",
				description: "The first 3 Booster Upgrades are stronger based on your Super Boosters, and <b>BP Combo</b> directly multiplies Point gain.",
				cost() { return derivedState.tmp.h.costMult11b.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?2088:2250) },
				pseudoUnl() { return saveState.player.i.buyables[12].gte(1)&&gameHelpers.hasUpgrade("b", 13) },
				pseudoReq: "Req: 30 Super Boosters.",
				pseudoCan() { return saveState.player.sb.points.gte(30) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return saveState.player.sb.points.plus(1) },
				effectDisplay() { return "^"+gameHelpers.format(derivedState.tmp[this.layer].upgrades[this.id].effect) },
				formula: "x+1",
				style: {"font-size": "9px"},
			},
			21: {
				title: "Gen Z^2",
				description: "Square the Generator Power effect.",
				cost() { return derivedState.tmp.h.costMult11b.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?2000:9) },
				unlocked() { return gameHelpers.hasUpgrade("b", 11) && gameHelpers.hasUpgrade("b", 12) },
			},
			22: {
				title: "Up to the Fifth Floor",
				description: "Raise the Generator Power effect ^1.2.",
				cost() { return derivedState.tmp.h.costMult11b.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?2075:15) },
				unlocked() { return gameHelpers.hasUpgrade("b", 12) && gameHelpers.hasUpgrade("b", 13) },
			},
			23: {
				title: "Discount One",
				description: "Boosters are cheaper based on your Points.",
				cost() { return derivedState.tmp.h.costMult11b.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?2088:18) },
				effect() { 
					let ret = saveState.player.points.add(1).log10().add(1).pow(3.2);
					if (saveState.player.s.unlocked) ret = ret.pow(gameHelpers.buyableEffect("s", 14));
					if (((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)) ret = ret.pow(1.5);
					return ret;
				},
				unlocked() { return gameHelpers.hasUpgrade("b", 21) || gameHelpers.hasUpgrade("b", 22) },
				effectDisplay() { return "/"+gameHelpers.format(derivedState.tmp.b.upgrades[23].effect) },
				formula() { return "(log(x+1)+1)^"+(saveState.player.s.unlocked?gameHelpers.format(gameHelpers.buyableEffect("s", 14).times(3.2).times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.5:1)):"3.2") },
			},
			24: {
				title: "Boost Recursion",
				description: "Boosters multiply their own base.",
				cost() { return derivedState.tmp.h.costMult11b.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1438:2225) },
				pseudoUnl() { return saveState.player.i.buyables[12].gte(1)&&gameHelpers.hasUpgrade("b", 23) },
				pseudoReq: "Req: 2,150 Boosters without any Hexes.",
				pseudoCan() { return saveState.player.b.points.gte(2150) && saveState.player.m.hexes.eq(0) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return saveState.player.b.points.plus(1).pow(500) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp[this.layer].upgrades[this.id].effect)+"x" },
				formula: "(x+1)^500",
			},
			31: {
				title: "Worse BP Combo",
				description: "Super Boosters boost Prestige Point gain.",
				cost() { return derivedState.tmp.h.costMult11b.times(103) },
				unlocked() { return gameHelpers.hasAchievement("a", 41) },
				effect() { 
					let exp = ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?2e4:1
					return Decimal.pow(1e20, saveState.player.sb.points.pow(1.5)).pow(exp);
				},
				effectDisplay() { return gameHelpers.format(derivedState.tmp.b.upgrades[31].effect)+"x" },
				formula() { 
					let exp = ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?2e4:1
					return "1e20^(x^1.5)"+(exp==1?"":("^"+gameHelpers.format(exp)));
				},
			},
			32: {
				title: "Better BP Combo",
				description() { return "<b>BP Combo</b> uses a better formula"+(derivedState.tmp.nerdMode?" (sqrt(x+1) -> (1.125^x)*sqrt(x+1))":"")+"." },
				cost() { return derivedState.tmp.h.costMult11b.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1438:111) },
				unlocked() { return gameHelpers.hasAchievement("a", 41) },
			},
			33: {
				title: "Even More Additions",
				description: "<b>More Additions</b> is stronger based on your Super Boosters.",
				cost() { return derivedState.tmp.h.costMult11b.times(118) },
				unlocked() { return gameHelpers.hasAchievement("a", 41) },
				effect() { return saveState.player.sb.points.times(saveState.player.sb.points.gte(4)?2.6:2).plus(1).pow(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?3:1) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.b.upgrades[33].effect)+"x" },
				formula() { 
					let exp = ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?3:1
					let f = "x*"+(saveState.player.sb.points.gte(4)?"2.6":"2")+"+1"
					if (exp==1) return f;
					else return "("+f+")^"+gameHelpers.format(exp);
				},
			},
			34: {
				title: "Anti-Metric",
				description: "Imperium Bricks raise <b>Prestige Boost</b> to an exponent (unaffected by softcap).",
				cost() { return derivedState.tmp.h.costMult11b.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?2021:2275) },
				pseudoUnl() { return saveState.player.i.buyables[12].gte(1)&&gameHelpers.hasUpgrade("b", 33) },
				pseudoReq: "Req: 1e15,000,000 Prestige Points while in the <b>Productionless</b> Hindrance.",
				pseudoCan() { return saveState.player.p.points.gte("e1.5e7") && gameHelpers.inChallenge("h", 42) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return saveState.player.i.points.plus(1).root(4) },
				effectDisplay() { return "^"+gameHelpers.format(derivedState.tmp[this.layer].upgrades[this.id].effect) },
				formula: "(x+1)^0.25",
			},
		},
};
}
