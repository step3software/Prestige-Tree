// Session-bound layer owner; composition supplies only the named ports.
// t — time content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'|'softcapRules'>} ports */
function createTimeLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState, softcapRules }) {
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
        requires() { return new Decimal(1e120).times(Decimal.pow("1e180", Decimal.pow(saveState.player[this.layer].unlockOrder, 1.415038))) }, // Can be a function that takes requirement increases into account
        resource: "time capsules", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return saveState.player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?new Decimal(1.4):new Decimal(1.85) }, // Prestige currency exponent
		base() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?new Decimal(10):new Decimal(1e15) },
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		canBuyMax() { return gameHelpers.hasMilestone("q", 1) },
		enCapMult() {
			let mult = new Decimal(1);
			if (gameHelpers.hasUpgrade("t", 12)) mult = mult.times(gameHelpers.upgradeEffect("t", 12));
			if (gameHelpers.hasUpgrade("t", 21)) mult = mult.times(100);
			if (gameHelpers.hasUpgrade("t", 22)) mult = mult.times(gameHelpers.upgradeEffect("t", 22));
			if (saveState.player.h.unlocked) mult = mult.times(derivedState.tmp.h.effect);
			if (saveState.player.o.unlocked) mult = mult.times(derivedState.tmp.o.solEnEff2);
			return mult;
		},
		enGainMult() {
			let mult = new Decimal(1);
			if (gameHelpers.hasUpgrade("t", 22)) mult = mult.times(gameHelpers.upgradeEffect("t", 22));
			if (saveState.player.h.unlocked) mult = mult.times(derivedState.tmp.h.effect);
			return mult;
		},
		effBaseMult() {
			let mult = new Decimal(1);
			if (saveState.player.o.unlocked) mult = mult.times(gameHelpers.buyableEffect("o", 13));
			if (saveState.player.ba.unlocked) mult = mult.times(derivedState.tmp.ba.posBuff);
			if (saveState.player.m.unlocked) mult = mult.times(derivedState.tmp.m.buyables[12].effect);
			return mult;
		},
		effBasePow() {
			let exp = new Decimal(1);
			if (saveState.player.m.unlocked) exp = exp.times(saveState.player.m.spellTimes[12].gt(0)?1.1:1);
			return exp;
		},
		effGainBaseMult() {
			let mult = new Decimal(1);
			if (saveState.player.ps.unlocked) mult = mult.times(gameHelpers.challengeEffect("h", 32));
			if (((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) && gameHelpers.hasUpgrade("t", 11)) mult = mult.times(gameHelpers.upgradeEffect("t", 11).max(1));
			if (((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) && gameHelpers.hasUpgrade("t", 25)) mult = mult.times(gameHelpers.upgradeEffect("t", 25).max(1))
			return mult;
		},
		effLimBaseMult() {
			let mult = derivedState.tmp.n.realDustEffs2?new Decimal(derivedState.tmp.n.realDustEffs2.orangePurple||1):new Decimal(1);
			if (gameHelpers.hasUpgrade("t", 33) && saveState.player.i.buyables[12].gte(4)) mult = mult.times(gameHelpers.upgradeEffect("t", 33));
			return mult;
		},
		nonExtraTCPow() {
			let pow = new Decimal(1);
			if (saveState.player.en.unlocked) pow = pow.times(derivedState.tmp.en.twEff);
			return pow;
		},
		effect() { 
			if (!gameHelpers.unl(this.layer)) return {gain: new Decimal(0), limit: new Decimal(0)};
			else return {
				gain: Decimal.pow(derivedState.tmp.t.effBaseMult.times(derivedState.tmp.t.effGainBaseMult).times(3).pow(derivedState.tmp.t.effBasePow), saveState.player.t.points.times(derivedState.tmp.t.nonExtraTCPow).plus(saveState.player.t.buyables[11]).plus(derivedState.tmp.t.freeExtraTimeCapsules)).sub(1).max(0).times(saveState.player.t.points.times(derivedState.tmp.t.nonExtraTCPow).plus(saveState.player.t.buyables[11]).gt(0)?1:0).times(derivedState.tmp.t.enGainMult).max(0),
				limit: Decimal.pow(derivedState.tmp.t.effBaseMult.times(derivedState.tmp.t.effLimBaseMult).times(2).pow(derivedState.tmp.t.effBasePow), saveState.player.t.points.times(derivedState.tmp.t.nonExtraTCPow).plus(saveState.player.t.buyables[11]).plus(derivedState.tmp.t.freeExtraTimeCapsules)).sub(1).max(0).times(100).times(saveState.player.t.points.times(derivedState.tmp.t.nonExtraTCPow).plus(saveState.player.t.buyables[11]).gt(0)?1:0).times(derivedState.tmp.t.enCapMult).max(0),
			}
		},
		effect2() {
			if (!((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) || !gameHelpers.unl(this.layer)) return new Decimal(1);
			let c = saveState.player.t.points.plus(saveState.player.t.buyables[11]).plus(derivedState.tmp.t.freeExtraTimeCapsules);
			return Decimal.pow(1.01, c.sqrt());
		},
		effectDescription() {
			return "which are generating "+gameHelpers.format(derivedState.tmp.t.effect.gain)+" Time Energy/sec, but with a limit of "+gameHelpers.format(derivedState.tmp.t.effect.limit)+" Time Energy"+(derivedState.tmp.nerdMode?("\n("+gameHelpers.format(derivedState.tmp.t.effBaseMult.times(derivedState.tmp.t.effGainBaseMult).times(3))+"x gain each, "+gameHelpers.format(derivedState.tmp.t.effBaseMult.times(2))+"x limit each)"):"")+(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?(", and which multiply the speed of all layers before Mastery by "+gameHelpers.format(derivedState.tmp.t.effect2)+(derivedState.tmp.nerdMode?(" (1.01^sqrt(x))"):"")):"")
		},
		enEff() {
			if (!gameHelpers.unl(this.layer)) return new Decimal(1);
			let eff = saveState.player.t.energy.add(1).pow(1.2);
			if (gameHelpers.hasUpgrade("t", 14)) eff = eff.pow(1.3);
			if (gameHelpers.hasUpgrade("q", 24)) eff = eff.pow(7.5);
			return softcapRules.softcap("timeEnEff", eff);
		},
		enEff2() {
			if (!gameHelpers.unl(this.layer)) return new Decimal(0);
			if (!gameHelpers.hasUpgrade("t", 24)) return new Decimal(0);
			let exp = 5/9
			if (gameHelpers.hasUpgrade("t", 35) && saveState.player.i.buyables[12].gte(4)) exp = .565;
			let eff = saveState.player.t.energy.max(0).plus(1).log10().pow(exp);
			return softcapRules.softcap("timeEnEff2", eff).floor();
		},
		nextEnEff2() {
			if (!gameHelpers.hasUpgrade("t", 24)) return new Decimal(1/0);
			let next = Decimal.pow(10, softcapRules.reverse_softcap("timeEnEff2", derivedState.tmp.t.enEff2.plus(1)).pow(1.8)).sub(1);
			return next;
		},
		autoPrestige() { return (saveState.player.t.auto && gameHelpers.hasMilestone("q", 3))&&saveState.player.ma.current!="t" },
		update(diff) {
			if (saveState.player.t.unlocked) saveState.player.t.energy = saveState.player.t.energy.plus(this.effect().gain.times(diff)).min(this.effect().limit).max(0);
			if (saveState.player.t.autoExt && gameHelpers.hasMilestone("q", 1) && !gameHelpers.inChallenge("h", 31)) this.buyables[11].buyMax();
		},
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "t", description: "Press T to Time Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
		resetsNothing() { return gameHelpers.hasMilestone("q", 5)&&saveState.player.ma.current!="t" },
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'You have ' + gameHelpers.format(saveState.player.t.energy) + ' Time Energy, which boosts Point & Prestige Point gain by '+gameHelpers.format(derivedState.tmp.t.enEff)+'x'+(derivedState.tmp.nerdMode?" ((x+1)^"+gameHelpers.format(1.2*(gameHelpers.hasUpgrade("t", 14)?1.3:1)*(gameHelpers.hasUpgrade("q", 24)?7.5:1))+")":"")+(gameHelpers.hasUpgrade("t", 24)?(", and provides "+gameHelpers.formatWhole(derivedState.tmp.t.enEff2)+" free Extra Time Capsules ("+(derivedState.tmp.nerdMode?"log(x+1)^0.556":("next at "+gameHelpers.format(derivedState.tmp.t.nextEnEff2)))+")."):"")},
					{}],
			"blank",
			["display-text",
				function() {return 'Your best Time Capsules is ' + gameHelpers.formatWhole(saveState.player.t.best)},
					{}],
			"blank",
			"milestones", "blank", "buyables", "blank", "upgrades"],
        increaseUnlockOrder: ["e", "s"],
        doReset(resettingLayer){ 
			let keep = [];
			if (gameHelpers.hasMilestone("q", 0)) keep.push("milestones")
			if (gameHelpers.hasMilestone("q", 2) || gameHelpers.hasAchievement("a", 64)) keep.push("upgrades")
            if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
        },
        layerShown(){return saveState.player.b.unlocked},
        branches: ["b"],
		upgrades: {
			rows: 4,
			cols: 5,
			11: {
				title: "Pseudo-Boost",
				description: "Non-extra Time Capsules add to the Booster base.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?750:2) },
				unlocked() { return saveState.player.t.unlocked },
				effect() { 
					return saveState.player.t.points.pow(0.9).add(0.5).plus(gameHelpers.hasUpgrade("t", 13)?gameHelpers.upgradeEffect("t", 13):0).pow(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?3:1);
				},
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.t.upgrades[11].effect) },
				formula() { 
					let f = "x^0.9"+(gameHelpers.hasUpgrade("t", 13)?("+"+gameHelpers.format(gameHelpers.upgradeEffect("t", 13).plus(0.5))):"+0.5")
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) f = "("+f+")^3"
					return f;
				},
			},
			12: {
				title: "Limit Stretcher",
				description: "Time Energy cap starts later based on Boosters, and +1 Extra Time Capsule.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1e262:([5e4,2e5,2.5e6][saveState.player[this.layer].unlockOrder||0])) },
				currencyDisplayName: "time energy",
                currencyInternalName: "energy",
                currencyLayer: "t",
				unlocked() { return saveState.player.t.best.gte(2) },
				effect() { 
					return saveState.player.b.points.pow(0.95).add(1)
				},
				effectDisplay() { return gameHelpers.format(derivedState.tmp.t.upgrades[12].effect)+"x" },
				formula: "x^0.95+1",
			},
			13: {
				title: "Pseudo-Pseudo-Boost",
				description: "Extra Time Capsules add to the <b>Pseudo-Boost</b>'s effect.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1e265:([3e6,3e7,3e8][saveState.player[this.layer].unlockOrder||0])) },
				currencyDisplayName: "time energy",
                currencyInternalName: "energy",
                currencyLayer: "t",
				unlocked() { return gameHelpers.hasUpgrade("t", 12) },
				effect() { 
					return saveState.player.t.buyables[11].add(derivedState.tmp.t.freeExtraTimeCapsules).pow(0.95);
				},
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.t.upgrades[13].effect) },
				formula: "x^0.95",
			},
			14: {
				title: "More Time",
				description: "The Time Energy effect is raised to the power of 1.3.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?760:(saveState.player.t.unlockOrder>=2?5:4)) },
				unlocked() { return gameHelpers.hasUpgrade("t", 13) },
			},
			15: {
				title: "Time Potency",
				description: "Time Energy affects Generator Power gain.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1e267:([1.25e7,(saveState.player.s.unlocked?3e8:6e7),1.5e9][saveState.player[this.layer].unlockOrder||0])) },
				currencyDisplayName: "time energy",
                currencyInternalName: "energy",
                currencyLayer: "t",
				unlocked() { return gameHelpers.hasUpgrade("t", 13) },
			},
			21: {
				title: "Weakened Chains",
				description: "The Time Energy limit is multiplied by 100.",
				cost() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?759:12 },
				unlocked() { return gameHelpers.hasAchievement("a", 33) },
			},
			22: {
				title: "Enhanced Time",
				description: "Enhance Points boost Time Energy's generation and limit.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?765:9) },
				unlocked() { return gameHelpers.hasAchievement("a", 33) },
				effect() { 
					return saveState.player.e.points.plus(1).root(10).pow(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.1:1);
				},
				effectDisplay() { return gameHelpers.format(derivedState.tmp.t.upgrades[22].effect)+"x" },
				formula() { return "(x+1)^"+(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"0.11":"0.1") },
			},
			23: {
				title: "Reverting Time",
				description: "Time acts as if you chose it first.",
				cost() { return new Decimal(saveState.player[this.layer].unlockOrder>=2?3e9:(saveState.player.s.unlocked?6.5e8:1.35e8)) },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				unlocked() { return (saveState.player[this.layer].unlockOrder>0||gameHelpers.hasUpgrade("t", 23))&&gameHelpers.hasUpgrade("t", 13) },
				onPurchase() { saveState.player[this.layer].unlockOrder = 0; },
			},
			24: {
				title: "Time Dilation",
				description: "Unlock a new Time Energy effect.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1e267:2e17) },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				unlocked() { return gameHelpers.hasAchievement("a", 33) },
			},
			25: {
				title: "Basic",
				description: "Time Energy adds to the Booster base.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?'1e9000':3e19) },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				unlocked() { return gameHelpers.hasAchievement("a", 33) },
				effect() { return saveState.player.t.energy.plus(1).log10().div(1.2).pow(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?3:1) },
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.t.upgrades[25].effect) },
				formula() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"(log(x+1)/1.2)^3":"log(x+1)/1.2" },
			},
			31: {
				title: "Cheap Time",
				description: "Extra Time Capsule cost scaling is removed, and their cost exponent is decreased by 0.2.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e16400":"e3600000") },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				pseudoUnl() { return saveState.player.i.buyables[12].gte(4)&&saveState.player.t.upgrades.length>=9 },
				pseudoReq: "Req: 1e42 Honour",
				pseudoCan() { return saveState.player.hn.points.gte(1e42) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			32: {
				title: "The Hypertime Continuum",
				description: "Hyperspace cost scales 33.33% slower.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e39000":"e4240000") },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				pseudoUnl() { return saveState.player.i.buyables[12].gte(4)&&saveState.player.t.upgrades.length>=9 },
				pseudoReq: "Req: 1e31 Hyperspace Energy",
				pseudoCan() { return saveState.player.hs.points.gte(1e31) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			33: {
				title: "Virtually Limitless",
				description: "Time Energy boosts the Time Energy limit base.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?759:750) },
				pseudoUnl() { return saveState.player.i.buyables[12].gte(4)&&saveState.player.t.upgrades.length>=9 },
				pseudoReq: "Req: 30 Phantom Souls",
				pseudoCan() { return saveState.player.ps.points.gte(30) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return saveState.player.t.energy.plus(1).log10().plus(1).pow(3.5) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.t.upgrades[33].effect)+"x" },
				formula: "(log(x+1)+1)^3.5",
			},
			34: {
				title: "Scalings Galore",
				description: "Post-1,225 Booster & Generator cost scalings start at 1,400 instead.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e39000":"e4240000") },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				pseudoUnl() { return saveState.player.i.buyables[12].gte(4)&&saveState.player.t.upgrades.length>=9 },
				pseudoReq: 'Req: Reach e124,000,000 Prestige Points while in the "Productionless" Hindrance and without any Hyper Buildings.',
				pseudoCan() { return saveState.player.p.points.gte("e1.24e8") && gameHelpers.inChallenge("h", 42) && saveState.player.hs.spentHS.eq(0) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			35: {
				title: "Don't Kill Time",
				description: "Time Energy's second effect exponent is increased (0.556 -> 0.565)",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e38000":"e3600000") },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				pseudoUnl() { return saveState.player.i.buyables[12].gte(4)&&saveState.player.t.upgrades.length>=9 },
				pseudoReq: "Req: 1e13 Purple Dust",
				pseudoCan() { return saveState.player.n.purpleDust.gte(1e13) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			41: {
				title: "Subtemporal Power",
				description: "Raise the Subspace base to the power of 1.5, and gain 2,500x more Hyperspace Energy.",
				cost: new Decimal(1050),
				pseudoUnl() { return saveState.player.i.buyables[12].gte(4)&&saveState.player.t.upgrades.length>=9 },
				pseudoReq: "Req: 1e60 Honour & 1e575 Phantom Power",
				pseudoCan() { return saveState.player.hn.points.gte(1e60) && saveState.player.ps.power.gte("1e575") },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
		},
		freeExtraTimeCapsules() {
			let free = new Decimal(0);
			if (gameHelpers.hasUpgrade("t", 12)) free = free.plus(1);
			if (gameHelpers.hasUpgrade("t", 24)) free = free.plus(derivedState.tmp.t.enEff2);
			if (gameHelpers.hasUpgrade("q", 22)) free = free.plus(gameHelpers.upgradeEffect("q", 22));
			return free;
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Extra Time Capsules",
				costScalingEnabled() {
					return !(gameHelpers.hasUpgrade("t", 31) && saveState.player.i.buyables[12].gte(4))
				},
				costExp() {
					let exp = new Decimal(1.2);
					if (gameHelpers.hasUpgrade("t", 31) && saveState.player.i.buyables[12].gte(4)) exp = exp.sub(.2);
					return exp;
				},
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    if (x.gte(25) && derivedState.tmp[this.layer].buyables[this.id].costScalingEnabled) x = x.pow(2).div(25)
                    let cost = x.times(0.4).pow(derivedState.tmp[this.layer].buyables[this.id].costExp).add(1).times(10)
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) cost = cost.pow(.9);
                    return cost.floor()
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
					let e = derivedState.tmp.t.freeExtraTimeCapsules;
                    let display = (derivedState.tmp.nerdMode?("Cost Formula: "+((saveState.player[this.layer].buyables[this.id].gte(25)&&data.costScalingEnabled)?"(((x^2)/25":"((x")+"*0.4)^"+gameHelpers.format(data.costExp)+"+1)*10"):("Cost: " + gameHelpers.formatWhole(data.cost) + " Boosters"))+"\n\
                    Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+(e.gt(0)?(" + "+gameHelpers.formatWhole(e)):"")+(gameHelpers.inChallenge("h", 31)?("\nPurchases Left: "+String(10-saveState.player.h.chall31bought)):"")
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
                    return saveState.player.b.points.gte(derivedState.tmp[this.layer].buyables[this.id].cost) && (gameHelpers.inChallenge("h", 31) ? saveState.player.h.chall31bought<10 : true)},
                buy() {
	let cost;
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
                    saveState.player.b.points = saveState.player.b.points.sub(cost)
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].add(1)
					if (gameHelpers.inChallenge("h", 31)) saveState.player.h.chall31bought++;
                },
                buyMax() {
					if (!this.canAfford()) return;
					if (gameHelpers.inChallenge("h", 31)) return;
					let b = saveState.player.b.points.plus(1);
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) b = b.root(.9);
					let tempBuy = b.div(10).sub(1).max(0).root(derivedState.tmp[this.layer].buyables[this.id].costExp).div(0.4);
					if (tempBuy.gte(25) && derivedState.tmp[this.layer].buyables[this.id].costScalingEnabled) tempBuy = tempBuy.times(25).sqrt();
					let target = tempBuy.plus(1).floor();
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].max(target);
				},
				autoed() { return saveState.player.t.autoExt && gameHelpers.hasMilestone("q", 1) && !gameHelpers.inChallenge("h", 31) },
                style: {'height':'222px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Time Capsules",
				done() { return saveState.player.t.best.gte(2) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "3 Time Capsules",
				done() { return saveState.player.t.best.gte(3) || gameHelpers.hasAchievement("a", 41) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "4 Time Capsules",
				done() { return saveState.player.t.best.gte(4) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Keep Booster Upgrades on all resets.",
			},
			3: {
				requirementDescription: "5 Time Capsules",
				done() { return saveState.player.t.best.gte(5) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Unlock Auto-Boosters.",
				toggles: [["b", "auto"]],
			},
			4: {
				requirementDescription: "8 Time Capsules",
				done() { return saveState.player.t.best.gte(8) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Boosters reset nothing.",
			},
		},
};
}
