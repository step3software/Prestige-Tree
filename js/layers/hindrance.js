// h — hindrance content. Registration: manifest.js.
function createHindranceLayer() {
    return {
        name: "hindrance", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "H", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			chall31bought: 0,
			first: 0,
			auto: false,
        }},
        color: "#a14040",
        requires: new Decimal(1e30), // Can be a function that takes requirement increases into account
        resource: "hindrance spirit", // Name of prestige currency
        baseResource: "time energy", // Name of resource prestige is based on
        baseAmount() {return player.t.energy}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?.2:.125) }, // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (hasUpgrade("q", 14)) mult = mult.times(upgradeEffect("q", 14).h);
			if (player.m.unlocked) mult = mult.times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("m"):false)?tmp.m.mainHexEff:tmp.m.hexEff);
			if (hasUpgrade("ba", 22)) mult = mult.times(tmp.ba.negBuff);
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 3, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "h", description: "Press H to Hindrance Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			player.q.time = new Decimal(0);
			player.q.energy = new Decimal(0);
			player.h.chall31bought = 0;
			if (hasMilestone("m", 1)) keep.push("challenges")
			if (layers[resettingLayer].row > this.row) {
				layerDataReset(this.layer, keep)
			}
        },
		update(diff) {
			if (hasAchievement("a", 111)) {
				let cd = tmp[this.layer].challenges;
				let auto = hasMilestone("h", 0) && player.h.auto;
				if (cd[31].unlocked && (player.h.activeChallenge==31 || auto)) cd[31].completeInBulk()
				if (cd[32].unlocked && (player.h.activeChallenge==32 || auto)) cd[32].completeInBulk()
			}
		},
        layerShown(){return (player.t.unlocked&&hasMilestone("q", 4))||player.m.unlocked||player.ba.unlocked},
        branches: ["t"],
		effect() { 
			if (!unl(this.layer)) return new Decimal(1);
			let h = player.h.points.times(player.points.plus(1).log("1e1000").plus(1));
			h = softcap("hindr_base", h);
			let eff = h.plus(1).pow(3).pow(hasChallenge("h", 11)?1.2:1).pow(hasUpgrade("ba", 21)?8:1);
			if (hasUpgrade("q", 45) && player.i.buyables[12].gte(6)) eff = eff.pow(100);
			return eff;
		},
		effectDescription() {
			return "which are multiplying Point gain, Time Energy gain, & the Time Energy cap by "+format(tmp.h.effect)+" ("+(tmp.nerdMode?(tmp.h.effect.gte(15e4)?("(10^sqrt(log(hindranceSpirit/1e3*(log(points+1)+1))/log(1.5e5))+1)^("+((hasChallenge("h", 11)?3.6:3)*(hasUpgrade("ba", 21)?8:1))+")"):("(hindranceSpirit/1e3*(log(points+1)+1)+1)^("+((hasChallenge("h", 11)?3.6:3)*(hasUpgrade("ba", 21)?8:1))+")")):"boosted by Points")+")"
		},
		costMult11() {
			let mult = new Decimal(1);
			if (inChallenge("h", 11)) mult = mult.times(Decimal.pow(10, Decimal.pow(player.p.upgrades.length, 2)))
			return mult;
		},
		costExp11() {
			let exp = new Decimal(1);
			if (inChallenge("h", 11)) exp = exp.times(Math.pow(player.p.upgrades.length, 2)*4+1)
			return exp;
		},
		costMult11b() {
			let mult = new Decimal(1);
			if (inChallenge("h", 11)) mult = mult.times(player.b.upgrades.length*3+1)
			return mult;
		},
		baseDiv12() {
			let div = new Decimal(1);
			if (inChallenge("h", 12)) div = div.times(player.q.time.sqrt().times(player.sb.points.pow(3).times(3).plus(1)).plus(1))
			return div;
		},
		pointRoot31(x=challengeCompletions("h", 31)) {
			if (hasAchievement("a", 111)) x = 1;
			else if (player.h.activeChallenge==32) x = challengeCompletions("h", 32)*2
			if (x>=20) x = Math.pow(x-19, 1.5)+19
			let root = Decimal.add(2, Decimal.pow(x, 1.5).div(16))
			return root;
		},
		passiveGeneration() { return (hasMilestone("m", 2)&&player.ma.current!="h")?1:0 },
		milestones: {
			0: {
				unlocked() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("h"):false) },
				requirementDescription: "e300,000,000 Hindrance Spirit",
				done() { return player.h.points.gte("e3e8") },
				effectDescription: "Unlock the Repeatable Hindrance Automator.",
				toggles: [["h", "auto"]],
			},
		},
		challenges: {
			rows: 4,
			cols: 2,
			11: {
				name: "Upgrade Desert",
				completionLimit: 1,
				challengeDescription: "Prestige/Booster Upgrades are reset regardless of your milestones, and every Prestige/Booster Upgrade you buy drastically increases the costs of the others.",
				unlocked() { return player.h.unlocked },
				goal() { return new Decimal(player.ma.current=="h"?"e1.37e8":"1e1325") },
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription: "Unlock Quirk Upgrades, and the Hindrance Spirit effect is raised to the power of 1.2.",
				onStart(testInput=false) { 
					if (testInput && !(hasAchievement("a", 81)&&player.ma.current!="h")) {
						player.p.upgrades = []; 
						player.b.upgrades = [];
					}
				},
			},
			12: {
				name: "Speed Demon",
				completionLimit: 1,
				challengeDescription: "The Booster/Generator bases are divided more over time (this effect is magnified by your Super-Boosters).",
				unlocked() { return hasChallenge("h", 11) },
				goal() { return new Decimal(player.ma.current=="h"?"e5e8":"1e3550") },
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription() { return "Add 0.25 to the Super Booster base"+(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("h"):false)?(" and multiply it by your Hyperspace Energy"):"")+"." },
			},
			21: {
				name: "Out of Room",
				completionLimit: 1,
				challengeDescription: "Space Buildings are respecced, your Space is divided by 10, and Space Building Power is decreased by 90%.",
				unlocked() { return hasChallenge("h", 12) },
				goal() { return new Decimal(player.ma.current=="h"?"e5.7e7":"1e435") },
				currencyDisplayName: "generator power",
				currencyInternalName: "power",
				currencyLayer: "g",
				rewardDescription: "Space Energy boosts the strength of Space Buildings.",
				rewardEffect() { return player.s.points.div(2).times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("h"):false)?1.4:1) },
				rewardDisplay() { return format(this.rewardEffect())+"% stronger (additive)" },
				formula() { return "(x*"+format(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("h"):false)?.7:.5)+")%" },
				onStart(testInput=false) {
					if (testInput) {
						resetBuyables("s");
						player.s.spent = new Decimal(0);
					}
				},
			},
			22: {
				name: "Descension",
				completionLimit: 1,
				challengeDescription: "Prestige Upgrades, Achievement rewards, & the Primary Space Building are the only things that boost Point generation.",
				unlocked() { return hasChallenge("h", 21) },
				goal() { return new Decimal(player.ma.current=="h"?"e8.225e6":"1e3570") },
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription: "<b>Prestige Boost</b>'s hardcap is now a softcap.",
			},
			31: {
				name: "Timeless",
				scalePower() {
					let power = new Decimal(1);
					if (tmp.m.buyables[15].unlocked) power = power.times(Decimal.sub(1, buyableEffect("m", 15)));
					return power;
				},
				completionLimit() { 
					let lim = 10
					if (hasAchievement("a", 71)) lim += 10;
					if (hasAchievement("a", 74)) lim += 10;
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("h"):false) lim = Infinity;
					return lim
				},
				challengeDescription() {
					let lim = this.completionLimit();
					let infLim = !isFinite(lim);
					return "You can only buy 10 Enhancers & Extra Time Capsules (total), Enhancer/Extra Time Capsule automation is disabled, and Point generation is brought to the "+format(tmp.h.pointRoot31)+"th root<br>Completions: "+formatWhole(challengeCompletions("h", 31))+(infLim?"":("/"+lim));
				},
				unlocked() { return hasChallenge("h", 22) },
				goal() { 
					let comps = Decimal.mul(challengeCompletions("h", 31), tmp.h.challenges[this.id].scalePower);
					if (comps.gte(20)) comps = Decimal.pow(comps.sub(19), 1.95).plus(19);
					return Decimal.pow("1e50", Decimal.pow(comps, 2.5)).times("1e5325") 
				},
				completeInBulk() {
					if (challengeCompletions("h", 31)>=tmp[this.layer].challenges[this.id].completionLimit) return;
					let target = player.points.div("1e5325").max(1).log("1e50").root(2.5)
					if (target.gte(20)) target = target.sub(19).root(1.95).plus(19);
					target = target.div(tmp.h.challenges[this.id].scalePower).plus(1).floor();
					player.h.challenges[this.id] = Math.min(Math.max(player.h.challenges[this.id], target.toNumber()), tmp[this.layer].challenges[this.id].completionLimit);
					if (isNaN(player.h.challenges[this.id])) player.h.challenges[this.id] = 0;
				},
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription() { return "<b>Timeless</b> completions boost Super Generator Power gain based on your time "+(hasUpgrade("ss", 33)?"playing this game.":"in this Row 4 reset.") },
				rewardEffect() { 
					let eff = Decimal.div(9, Decimal.add((hasUpgrade("ss", 33)?(player.timePlayed||0):player.q.time), 1).cbrt().pow(hasUpgrade("ss", 23)?(-1):1)).plus(1).pow(challengeCompletions("h", 31)).times(tmp.n.realDustEffs2?tmp.n.realDustEffs2.blueOrange:new Decimal(1)).pow(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?5:1);
					if (!eff.eq(eff)) eff = new Decimal(1);
					return eff;
				},
				rewardDisplay() { return format(this.rewardEffect())+"x" },
				formula() { return "(9"+(hasUpgrade("ss", 23)?"*":"/")+"cbrt(time+1)+1)^completions" },
			},
			32: {
				name: "Option D",
				scalePower() {
					let power = new Decimal(1);
					if (tmp.m.buyables[15].unlocked) power = power.times(Decimal.sub(1, buyableEffect("m", 15)));
					return power;
				},
				completionLimit() { 
					let lim = 10;
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("h"):false) lim = Infinity;
					return lim;
				},
				challengeDescription() { 
					let lim = this.completionLimit();
					let infLim = !isFinite(lim);
					return 'All previous challenges are applied at once ("Timeless" is applied at difficulty level '+formatWhole(challengeCompletions("h", 32)*2+1)+')<br>Completions: '+formatWhole(challengeCompletions("h", 32))+(infLim?"":('/'+lim))
				},
				goal() {
					let comps = Decimal.mul(challengeCompletions("h", 32), tmp.h.challenges[this.id].scalePower);
					if (comps.gte(3)) comps = comps.sub(0.96);
					if (comps.gte(3.04)) comps = comps.times(1.425);
					return Decimal.pow("1e1000", Decimal.pow(comps, 3)).times("1e9000");
				},
				completeInBulk() {
					if (challengeCompletions("h", 32)>=tmp[this.layer].challenges[this.id].completionLimit) return;
					let target = player.points.div("1e9000").max(1).log("1e1000").cbrt();
					if (target.gte(3.04)) target = target.div(1.425);
					if (target.gte(3)) target = target.plus(.96);
					target = target.div(tmp.h.challenges[this.id].scalePower).plus(1).floor();
					player.h.challenges[this.id] = Math.min(Math.max(player.h.challenges[this.id], target.toNumber()), tmp[this.layer].challenges[this.id].completionLimit);
					if (isNaN(player.h.challenges[this.id])) player.h.challenges[this.id] = 0;
				},
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription: "<b>Option D</b> completions multiply the Time Energy gain base.",
				rewardEffect() { 
					let eff = softcap("option_d", Decimal.pow(100, Decimal.pow(challengeCompletions("h", 32), 2))).times(tmp.n.realDustEffs2?tmp.n.realDustEffs2.blueOrange:new Decimal(1));
					if (!eff.eq(eff)) eff = new Decimal(1);
					return eff;
				},
				rewardDisplay() { return format(tmp.h.challenges[32].rewardEffect)+"x" },
				formula: "100^(completions^2)",
				unlocked() { return tmp.ps.buyables[11].effects.hindr },
				countsAs: [11,12,21,22,31],
				onStart(testInput=false) { 
					if (testInput) {
						if (!hasAchievement("a", 81)) {
							player.p.upgrades = []; 
							player.b.upgrades = [];
						}
						resetBuyables("s");
						player.s.spent = new Decimal(0);
					}
				},
			},
			41: {
				name: "Central Madness",
				completionLimit: 1,
				challengeDescription: "Perform a Row 5 reset, Positivity & Negativity are reset, and Positivity & Negativity nerfs are extremely stronger.",
				goal: new Decimal("1e765000"),
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription: "Unlock 3 new Balance Upgrades.",
				unlocked() { return (tmp.ps.buyables[11].effects.hindr||0)>=2 },
				onStart(testInput=false) {
					if (testInput) {
						doReset("m", true);
						player.h.activeChallenge = 41;
						player.ba.pos = new Decimal(0);
						player.ba.neg = new Decimal(0);
						updateTemp();
						updateTemp();
						updateTemp();
					}
				},
			},
			42: {
				name: "Productionless",
				completionLimit: 1,
				challengeDescription: "Perform a Row 5 reset, you are trapped in <b>Descension</b>, and all row 2-4 static layers have much harsher cost scalings.",
				goal: new Decimal("1e19000"),
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription() { return "The Quirk Layer cost base is decreased by 0."+(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("h"):false)?"2":"15")+", and unlock 2 new Subspace Upgrades." },
				unlocked() { return (tmp.ps.buyables[11].effects.hindr||0)>=3 },
				countsAs: [22],
				onStart(testInput=false) {
					if (testInput) {
						doReset("m", true);
						player.h.activeChallenge = 42;
						updateTemp();
						updateTemp();
						updateTemp();
					}
				},
			},
		},
};
}
