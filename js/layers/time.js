// t — time content. Registration: manifest.js.
function createTimeLayer() {
    return {
        name: "time", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "T", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			energy: new Decimal(0),
			first: 0,
			auto: false,
			pseudoUpgs: [],
			autoExt: false,
        }},
        color: "#006609",
        requires() { return new Decimal(1e120).times(Decimal.pow("1e180", Decimal.pow(player[this.layer].unlockOrder, 1.415038))) }, // Can be a function that takes requirement increases into account
        resource: "time capsules", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?new Decimal(1.4):new Decimal(1.85) }, // Prestige currency exponent
		base() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?new Decimal(10):new Decimal(1e15) },
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		canBuyMax() { return hasMilestone("q", 1) },
		enCapMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("t", 12)) mult = mult.times(upgradeEffect("t", 12));
			if (hasUpgrade("t", 21)) mult = mult.times(100);
			if (hasUpgrade("t", 22)) mult = mult.times(upgradeEffect("t", 22));
			if (player.h.unlocked) mult = mult.times(tmp.h.effect);
			if (player.o.unlocked) mult = mult.times(tmp.o.solEnEff2);
			return mult;
		},
		enGainMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("t", 22)) mult = mult.times(upgradeEffect("t", 22));
			if (player.h.unlocked) mult = mult.times(tmp.h.effect);
			return mult;
		},
		effBaseMult() {
			let mult = new Decimal(1);
			if (player.o.unlocked) mult = mult.times(buyableEffect("o", 13));
			if (player.ba.unlocked) mult = mult.times(tmp.ba.posBuff);
			if (player.m.unlocked) mult = mult.times(tmp.m.buyables[12].effect);
			return mult;
		},
		effBasePow() {
			let exp = new Decimal(1);
			if (player.m.unlocked) exp = exp.times(player.m.spellTimes[12].gt(0)?1.1:1);
			return exp;
		},
		effGainBaseMult() {
			let mult = new Decimal(1);
			if (player.ps.unlocked) mult = mult.times(challengeEffect("h", 32));
			if (((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) && hasUpgrade("t", 11)) mult = mult.times(upgradeEffect("t", 11).max(1));
			if (((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) && hasUpgrade("t", 25)) mult = mult.times(upgradeEffect("t", 25).max(1))
			return mult;
		},
		effLimBaseMult() {
			let mult = tmp.n.realDustEffs2?new Decimal(tmp.n.realDustEffs2.orangePurple||1):new Decimal(1);
			if (hasUpgrade("t", 33) && player.i.buyables[12].gte(4)) mult = mult.times(upgradeEffect("t", 33));
			return mult;
		},
		nonExtraTCPow() {
			let pow = new Decimal(1);
			if (player.en.unlocked) pow = pow.times(tmp.en.twEff);
			return pow;
		},
		effect() { 
			if (!unl(this.layer)) return {gain: new Decimal(0), limit: new Decimal(0)};
			else return {
				gain: Decimal.pow(tmp.t.effBaseMult.times(tmp.t.effGainBaseMult).times(3).pow(tmp.t.effBasePow), player.t.points.times(tmp.t.nonExtraTCPow).plus(player.t.buyables[11]).plus(tmp.t.freeExtraTimeCapsules)).sub(1).max(0).times(player.t.points.times(tmp.t.nonExtraTCPow).plus(player.t.buyables[11]).gt(0)?1:0).times(tmp.t.enGainMult).max(0),
				limit: Decimal.pow(tmp.t.effBaseMult.times(tmp.t.effLimBaseMult).times(2).pow(tmp.t.effBasePow), player.t.points.times(tmp.t.nonExtraTCPow).plus(player.t.buyables[11]).plus(tmp.t.freeExtraTimeCapsules)).sub(1).max(0).times(100).times(player.t.points.times(tmp.t.nonExtraTCPow).plus(player.t.buyables[11]).gt(0)?1:0).times(tmp.t.enCapMult).max(0),
			}
		},
		effect2() {
			if (!((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) || !unl(this.layer)) return new Decimal(1);
			let c = player.t.points.plus(player.t.buyables[11]).plus(tmp.t.freeExtraTimeCapsules);
			return Decimal.pow(1.01, c.sqrt());
		},
		effectDescription() {
			return "which are generating "+format(tmp.t.effect.gain)+" Time Energy/sec, but with a limit of "+format(tmp.t.effect.limit)+" Time Energy"+(tmp.nerdMode?("\n("+format(tmp.t.effBaseMult.times(tmp.t.effGainBaseMult).times(3))+"x gain each, "+format(tmp.t.effBaseMult.times(2))+"x limit each)"):"")+(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?(", and which multiply the speed of all layers before Mastery by "+format(tmp.t.effect2)+(tmp.nerdMode?(" (1.01^sqrt(x))"):"")):"")
		},
		enEff() {
			if (!unl(this.layer)) return new Decimal(1);
			let eff = player.t.energy.add(1).pow(1.2);
			if (hasUpgrade("t", 14)) eff = eff.pow(1.3);
			if (hasUpgrade("q", 24)) eff = eff.pow(7.5);
			return softcap("timeEnEff", eff);
		},
		enEff2() {
			if (!unl(this.layer)) return new Decimal(0);
			if (!hasUpgrade("t", 24)) return new Decimal(0);
			let exp = 5/9
			if (hasUpgrade("t", 35) && player.i.buyables[12].gte(4)) exp = .565;
			let eff = player.t.energy.max(0).plus(1).log10().pow(exp);
			return softcap("timeEnEff2", eff).floor();
		},
		nextEnEff2() {
			if (!hasUpgrade("t", 24)) return new Decimal(1/0);
			let next = Decimal.pow(10, reverse_softcap("timeEnEff2", tmp.t.enEff2.plus(1)).pow(1.8)).sub(1);
			return next;
		},
		autoPrestige() { return (player.t.auto && hasMilestone("q", 3))&&player.ma.current!="t" },
		update(diff) {
			if (player.t.unlocked) player.t.energy = player.t.energy.plus(this.effect().gain.times(diff)).min(this.effect().limit).max(0);
			if (player.t.autoExt && hasMilestone("q", 1) && !inChallenge("h", 31)) this.buyables[11].buyMax();
		},
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "t", description: "Press T to Time Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		resetsNothing() { return hasMilestone("q", 5)&&player.ma.current!="t" },
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'You have ' + format(player.t.energy) + ' Time Energy, which boosts Point & Prestige Point gain by '+format(tmp.t.enEff)+'x'+(tmp.nerdMode?" ((x+1)^"+format(1.2*(hasUpgrade("t", 14)?1.3:1)*(hasUpgrade("q", 24)?7.5:1))+")":"")+(hasUpgrade("t", 24)?(", and provides "+formatWhole(tmp.t.enEff2)+" free Extra Time Capsules ("+(tmp.nerdMode?"log(x+1)^0.556":("next at "+format(tmp.t.nextEnEff2)))+")."):"")},
					{}],
			"blank",
			["display-text",
				function() {return 'Your best Time Capsules is ' + formatWhole(player.t.best)},
					{}],
			"blank",
			"milestones", "blank", "buyables", "blank", "upgrades"],
        increaseUnlockOrder: ["e", "s"],
        doReset(resettingLayer){ 
			let keep = [];
			if (hasMilestone("q", 0)) keep.push("milestones")
			if (hasMilestone("q", 2) || hasAchievement("a", 64)) keep.push("upgrades")
            if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
        layerShown(){return player.b.unlocked},
        branches: ["b"],
		upgrades: {
			rows: 4,
			cols: 5,
			11: {
				title: "Pseudo-Boost",
				description: "Non-extra Time Capsules add to the Booster base.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?750:2) },
				unlocked() { return player.t.unlocked },
				effect() { 
					return player.t.points.pow(0.9).add(0.5).plus(hasUpgrade("t", 13)?upgradeEffect("t", 13):0).pow(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?3:1);
				},
				effectDisplay() { return "+"+format(tmp.t.upgrades[11].effect) },
				formula() { 
					let f = "x^0.9"+(hasUpgrade("t", 13)?("+"+format(upgradeEffect("t", 13).plus(0.5))):"+0.5") 
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) f = "("+f+")^3"
					return f;
				},
			},
			12: {
				title: "Limit Stretcher",
				description: "Time Energy cap starts later based on Boosters, and +1 Extra Time Capsule.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1e262:([5e4,2e5,2.5e6][player[this.layer].unlockOrder||0])) },
				currencyDisplayName: "time energy",
                currencyInternalName: "energy",
                currencyLayer: "t",
				unlocked() { return player.t.best.gte(2) },
				effect() { 
					return player.b.points.pow(0.95).add(1)
				},
				effectDisplay() { return format(tmp.t.upgrades[12].effect)+"x" },
				formula: "x^0.95+1",
			},
			13: {
				title: "Pseudo-Pseudo-Boost",
				description: "Extra Time Capsules add to the <b>Pseudo-Boost</b>'s effect.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1e265:([3e6,3e7,3e8][player[this.layer].unlockOrder||0])) },
				currencyDisplayName: "time energy",
                currencyInternalName: "energy",
                currencyLayer: "t",
				unlocked() { return hasUpgrade("t", 12) },
				effect() { 
					return player.t.buyables[11].add(tmp.t.freeExtraTimeCapsules).pow(0.95);
				},
				effectDisplay() { return "+"+format(tmp.t.upgrades[13].effect) },
				formula: "x^0.95",
			},
			14: {
				title: "More Time",
				description: "The Time Energy effect is raised to the power of 1.3.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?760:(player.t.unlockOrder>=2?5:4)) },
				unlocked() { return hasUpgrade("t", 13) },
			},
			15: {
				title: "Time Potency",
				description: "Time Energy affects Generator Power gain.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1e267:([1.25e7,(player.s.unlocked?3e8:6e7),1.5e9][player[this.layer].unlockOrder||0])) },
				currencyDisplayName: "time energy",
                currencyInternalName: "energy",
                currencyLayer: "t",
				unlocked() { return hasUpgrade("t", 13) },
			},
			21: {
				title: "Weakened Chains",
				description: "The Time Energy limit is multiplied by 100.",
				cost() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?759:12 },
				unlocked() { return hasAchievement("a", 33) },
			},
			22: {
				title: "Enhanced Time",
				description: "Enhance Points boost Time Energy's generation and limit.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?765:9) },
				unlocked() { return hasAchievement("a", 33) },
				effect() { 
					return player.e.points.plus(1).root(10).pow(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.1:1);
				},
				effectDisplay() { return format(tmp.t.upgrades[22].effect)+"x" },
				formula() { return "(x+1)^"+(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"0.11":"0.1") },
			},
			23: {
				title: "Reverting Time",
				description: "Time acts as if you chose it first.",
				cost() { return new Decimal(player[this.layer].unlockOrder>=2?3e9:(player.s.unlocked?6.5e8:1.35e8)) },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				unlocked() { return (player[this.layer].unlockOrder>0||hasUpgrade("t", 23))&&hasUpgrade("t", 13) },
				onPurchase() { player[this.layer].unlockOrder = 0; },
			},
			24: {
				title: "Time Dilation",
				description: "Unlock a new Time Energy effect.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1e267:2e17) },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				unlocked() { return hasAchievement("a", 33) },
			},
			25: {
				title: "Basic",
				description: "Time Energy adds to the Booster base.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?'1e9000':3e19) },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				unlocked() { return hasAchievement("a", 33) },
				effect() { return player.t.energy.plus(1).log10().div(1.2).pow(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?3:1) },
				effectDisplay() { return "+"+format(tmp.t.upgrades[25].effect) },
				formula() { return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"(log(x+1)/1.2)^3":"log(x+1)/1.2" },
			},
			31: {
				title: "Cheap Time",
				description: "Extra Time Capsule cost scaling is removed, and their cost exponent is decreased by 0.2.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e16400":"e3600000") },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				pseudoUnl() { return player.i.buyables[12].gte(4)&&player.t.upgrades.length>=9 },
				pseudoReq: "Req: 1e42 Honour",
				pseudoCan() { return player.hn.points.gte(1e42) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			32: {
				title: "The Hypertime Continuum",
				description: "Hyperspace cost scales 33.33% slower.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e39000":"e4240000") },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				pseudoUnl() { return player.i.buyables[12].gte(4)&&player.t.upgrades.length>=9 },
				pseudoReq: "Req: 1e31 Hyperspace Energy",
				pseudoCan() { return player.hs.points.gte(1e31) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			33: {
				title: "Virtually Limitless",
				description: "Time Energy boosts the Time Energy limit base.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?759:750) },
				pseudoUnl() { return player.i.buyables[12].gte(4)&&player.t.upgrades.length>=9 },
				pseudoReq: "Req: 30 Phantom Souls",
				pseudoCan() { return player.ps.points.gte(30) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return player.t.energy.plus(1).log10().plus(1).pow(3.5) },
				effectDisplay() { return format(tmp.t.upgrades[33].effect)+"x" },
				formula: "(log(x+1)+1)^3.5",
			},
			34: {
				title: "Scalings Galore",
				description: "Post-1,225 Booster & Generator cost scalings start at 1,400 instead.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e39000":"e4240000") },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				pseudoUnl() { return player.i.buyables[12].gte(4)&&player.t.upgrades.length>=9 },
				pseudoReq: 'Req: Reach e124,000,000 Prestige Points while in the "Productionless" Hindrance and without any Hyper Buildings.',
				pseudoCan() { return player.p.points.gte("e1.24e8") && inChallenge("h", 42) && player.hs.spentHS.eq(0) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			35: {
				title: "Don't Kill Time",
				description: "Time Energy's second effect exponent is increased (0.556 -> 0.565)",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e38000":"e3600000") },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				pseudoUnl() { return player.i.buyables[12].gte(4)&&player.t.upgrades.length>=9 },
				pseudoReq: "Req: 1e13 Purple Dust",
				pseudoCan() { return player.n.purpleDust.gte(1e13) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			41: {
				title: "Subtemporal Power",
				description: "Raise the Subspace base to the power of 1.5, and gain 2,500x more Hyperspace Energy.",
				cost: new Decimal(1050),
				pseudoUnl() { return player.i.buyables[12].gte(4)&&player.t.upgrades.length>=9 },
				pseudoReq: "Req: 1e60 Honour & 1e575 Phantom Power",
				pseudoCan() { return player.hn.points.gte(1e60) && player.ps.power.gte("1e575") },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
		},
		freeExtraTimeCapsules() {
			let free = new Decimal(0);
			if (hasUpgrade("t", 12)) free = free.plus(1);
			if (hasUpgrade("t", 24)) free = free.plus(tmp.t.enEff2);
			if (hasUpgrade("q", 22)) free = free.plus(upgradeEffect("q", 22));
			return free;
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Extra Time Capsules",
				costScalingEnabled() {
					return !(hasUpgrade("t", 31) && player.i.buyables[12].gte(4))
				},
				costExp() {
					let exp = new Decimal(1.2);
					if (hasUpgrade("t", 31) && player.i.buyables[12].gte(4)) exp = exp.sub(.2);
					return exp;
				},
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    if (x.gte(25) && tmp[this.layer].buyables[this.id].costScalingEnabled) x = x.pow(2).div(25)
                    let cost = x.times(0.4).pow(tmp[this.layer].buyables[this.id].costExp).add(1).times(10)
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) cost = cost.pow(.9);
                    return cost.floor()
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
					let e = tmp.t.freeExtraTimeCapsules;
                    let display = (tmp.nerdMode?("Cost Formula: "+((player[this.layer].buyables[this.id].gte(25)&&data.costScalingEnabled)?"(((x^2)/25":"((x")+"*0.4)^"+format(data.costExp)+"+1)*10"):("Cost: " + formatWhole(data.cost) + " Boosters"))+"\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id])+(e.gt(0)?(" + "+formatWhole(e)):"")+(inChallenge("h", 31)?("\nPurchases Left: "+String(10-player.h.chall31bought)):"")
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.b.points.gte(tmp[this.layer].buyables[this.id].cost) && (inChallenge("h", 31) ? player.h.chall31bought<10 : true)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.b.points = player.b.points.sub(cost)	
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
					if (inChallenge("h", 31)) player.h.chall31bought++;
                },
                buyMax() {
					if (!this.canAfford()) return;
					if (inChallenge("h", 31)) return;
					let b = player.b.points.plus(1);
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) b = b.root(.9);
					let tempBuy = b.div(10).sub(1).max(0).root(tmp[this.layer].buyables[this.id].costExp).div(0.4);
					if (tempBuy.gte(25) && tmp[this.layer].buyables[this.id].costScalingEnabled) tempBuy = tempBuy.times(25).sqrt();
					let target = tempBuy.plus(1).floor();
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				},
				autoed() { return player.t.autoExt && hasMilestone("q", 1) && !inChallenge("h", 31) },
                style: {'height':'222px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Time Capsules",
				done() { return player.t.best.gte(2) || hasAchievement("a", 71) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "3 Time Capsules",
				done() { return player.t.best.gte(3) || hasAchievement("a", 41) || hasAchievement("a", 71) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "4 Time Capsules",
				done() { return player.t.best.gte(4) || hasAchievement("a", 71) },
				effectDescription: "Keep Booster Upgrades on all resets.",
			},
			3: {
				requirementDescription: "5 Time Capsules",
				done() { return player.t.best.gte(5) || hasAchievement("a", 71) },
				effectDescription: "Unlock Auto-Boosters.",
				toggles: [["b", "auto"]],
			},
			4: {
				requirementDescription: "8 Time Capsules",
				done() { return player.t.best.gte(8) || hasAchievement("a", 71) },
				effectDescription: "Boosters reset nothing.",
			},
		},
};
}
