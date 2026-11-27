// Session-bound layer owner; composition supplies only the named ports.
// e — enhance content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'|'softcapRules'>} ports */
function createEnhanceLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState, softcapRules }) {
    return {
        name: "enhance", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "E", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 2, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			first: 0,
			auto: false,
			pseudoUpgs: [],
        }},
        color: "#b82fbd",
        requires() { return new Decimal(1e120).times(Decimal.pow("1e180", Decimal.pow(saveState.player[this.layer].unlockOrder, 1.415038))) }, // Can be a function that takes requirement increases into account
        resource: "enhance points", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return saveState.player.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?.025:.02) }, // Prestige currency exponent
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (gameHelpers.hasUpgrade("e", 24)) mult = mult.times(gameHelpers.upgradeEffect("e", 24));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		passiveGeneration() { return (gameHelpers.hasMilestone("q", 1)&&saveState.player.ma.current!="e")?1:0 },
		update(diff) {
			if (saveState.player.e.auto && gameHelpers.hasMilestone("q", 1) && !gameHelpers.inChallenge("h", 31)) this.buyables[11].buyMax();
		},
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "e", description: "Press E to Enhance Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
        increaseUnlockOrder: ["t", "s"],
        doReset(resettingLayer){ 
			let keep = []
			if (gameHelpers.hasMilestone("q", 2) || gameHelpers.hasAchievement("a", 64)) keep.push("upgrades")
			if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
        },
		freeEnh() {
			let enh = new Decimal(0);
			if (gameHelpers.hasUpgrade("e", 13)) enh = enh.plus(1);
			if (gameHelpers.hasUpgrade("e", 21)) enh = enh.plus(2);
			if (gameHelpers.hasUpgrade("e", 23)) enh = enh.plus(gameHelpers.upgradeEffect("e", 23));
			if (gameHelpers.hasUpgrade("q", 22)) enh = enh.plus(gameHelpers.upgradeEffect("q", 22));
			if (gameHelpers.hasUpgrade("e", 32) && saveState.player.i.buyables[12].gte(3)) enh = enh.plus(gameHelpers.upgradeEffect("e", 32));
			return enh;
		},
        layerShown(){return saveState.player.b.unlocked&&saveState.player.g.unlocked},
        branches: ["b","g"],
		upgrades: {
			rows: 4,
			cols: 4,
			11: {
				title: "Row 2 Synergy",
				description: "Boosters & Generators boost each other.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e98000":((saveState.player.e.unlockOrder>=2)?25:100)) },
				unlocked() { return saveState.player.e.unlocked },
				effect() { 
					let exp = 1
					return {g: saveState.player.b.points.add(1).log10().pow(exp), b: saveState.player.g.points.add(1).log10().pow(exp)}
				},
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.e.upgrades[11].effect.g)+" to Generator base, +"+gameHelpers.format(derivedState.tmp.e.upgrades[11].effect.b)+" to Booster base" },
				formula: "log(x+1)",
			},
			12: {
				title: "Enhanced Prestige",
				description: "Total Enhance Points boost Prestige Point gain.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e98000":(saveState.player.e.unlockOrder>=2?400:1e3)) },
				unlocked() { return gameHelpers.hasUpgrade("e", 11) },
				effect() { 
					let ret = saveState.player.e.total.add(1).pow(1.5)
					ret = softcapRules.softcap("e12", ret);
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) ret = ret.pow(1.5);
					return ret
				},
				effectDisplay() { return gameHelpers.format(derivedState.tmp.e.upgrades[12].effect)+"x" },
				formula() { 
					let f = gameHelpers.upgradeEffect("e", 12).gte("1e1500")?"(x+1)^0.75*1e750":"(x+1)^1.5"
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) f = "("+f+")^1.5"
					return f;
				},
			},
			13: {
				title: "Enhance Plus",
				description: "Get a free Enhancer.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"e1e5":2.5e3) },
				unlocked() { return gameHelpers.hasUpgrade("e", 11) },
			},
			14: {
				title: "More Additions",
				description: "Any Booster/Generator Upgrades that add to the Booster/Generator base are quadrupled.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"e1.01e5":3e23) },
				unlocked() { return gameHelpers.hasAchievement("a", 33) },
				effect() {
					let e = new Decimal(4)
					if (gameHelpers.hasUpgrade("b", 33)) e = e.times(gameHelpers.upgradeEffect("b", 33))
					return e;
				},
				effectDisplay() { return gameHelpers.format(derivedState.tmp.e.upgrades[14].effect)+"x" },
				noFormula: true,
			},
			21: {
				title: "Enhance Plus Plus",
				description: "Get another two free Enhancers",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"e1.01e5":(saveState.player.e.unlockOrder>0?1e4:1e9)) },
				unlocked() { return gameHelpers.hasUpgrade("e", 13) && ((!saveState.player.s.unlocked||(saveState.player.s.unlocked&&saveState.player.t.unlocked))&&saveState.player.t.unlocked) },
			},
			22: {
				title: "Enhanced Reversion",
				description: "Enhance acts as if you chose it first.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"e1.01e5":(saveState.player.e.unlockOrder>=2?1e3:3e4)) },
				unlocked() { return (saveState.player[this.layer].unlockOrder>0||gameHelpers.hasUpgrade("e", 22))&&gameHelpers.hasUpgrade("e", 12) },
				onPurchase() { saveState.player[this.layer].unlockOrder = 0; },
			},
			23: {
				title: "Enter the E-Space",
				description: "Space Energy provides free Enhancers.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"e1.01e5":2e20) },
				unlocked() { return gameHelpers.hasAchievement("a", 33) },
				effect() {
					let eff = saveState.player.s.points.pow(2).div(25);
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) eff = eff.times(3.5);
					return eff.floor();
				},
				effectDisplay() { return "+"+gameHelpers.formatWhole(derivedState.tmp.e.upgrades[23].effect) },
				formula() { return "floor(x^2"+(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"/7.14":"/25")+")" },
			},
			24: {
				title: "Monstrous Growth",
				description: "Boosters & Generators boost Enhance Point gain.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"e1.011e5":2.5e28) },
				unlocked() { return gameHelpers.hasAchievement("a", 33) },
				effect() { return Decimal.pow(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e2000":1.1, saveState.player.b.points.plus(saveState.player.g.points).pow(0.9)) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.e.upgrades[24].effect)+"x" },
				formula() { return (((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e2,000":"1.1")+"^((boosters+generators)^0.9)" },
			},
			31: {
				title: "Amplification",
				description: "The second effect of Enhancers also adds to the Super-Booster, Super-Generator, and Subspace bases.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"e3450000":"e4125000") },
				pseudoUnl() { return saveState.player.i.buyables[12].gte(3)&&saveState.player.e.upgrades.length>=7 },
				pseudoReq: "Req: e2,464,000 Enhance Points without any Super-Boosters or Super-Generators (after a Row 4 reset).",
				pseudoCan() { return saveState.player.sb.best.eq(0) && saveState.player.sg.best.eq(0) && saveState.player.e.points.gte("e2.464e6") },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			32: {
				title: "Supplementation",
				description: "Best Honour provides free Enhancers.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"e3460000":"e4500000") },
				pseudoUnl() { return saveState.player.i.buyables[12].gte(3)&&saveState.player.e.upgrades.length>=7 },
				pseudoReq: "Req: 30,300 Free Enhancers.",
				pseudoCan() { return derivedState.tmp.e.freeEnh.gte(30300) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return softcapRules.softcap("e32", saveState.player.hn.best.plus(1).log10().pow(3.25)).floor() },
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp[this.layer].upgrades[this.id].effect) },
				formula: "log(x+1)^3.25",
			},
			33: {
				title: "Augmentation",
				description: "Both Enhancer effect exponents are 20% higher.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"e3460000":"e4500000") },
				pseudoUnl() { return saveState.player.i.buyables[12].gte(3)&&saveState.player.e.upgrades.length>=7 },
				pseudoReq: "Req: 60,600 Bought Enhancers.",
				pseudoCan() { return saveState.player.e.buyables[11].gte(60600) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			34: {
				title: "Intensification",
				description: "Enhancer cost scaling is disabled.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"e3450000":"e4125000") },
				pseudoUnl() { return saveState.player.i.buyables[12].gte(3)&&saveState.player.e.upgrades.length>=7 },
				pseudoReq: "Req: e3,050,000 Enhance Points without any purchased Quirk Layers (After a Row 5 reset).",
				pseudoCan() { return saveState.player.e.points.gte("e3.05e6") && saveState.player.q.buyables[11].eq(0) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			41: {
				title: "To the Next Level",
				description: "Enhance Points boost Hyperspace Energy gain.",
				cost() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"e3460000":"e5750000") },
				pseudoUnl() { return saveState.player.i.buyables[12].gte(3)&&saveState.player.e.upgrades.length>=7 },
				pseudoReq: "Req: 44,900 Bought Enhancers without any Hyper Buildings.",
				pseudoCan() { return saveState.player.e.buyables[11].gte(44900) && saveState.player.hs.spentHS.eq(0) },
				unlocked() { return saveState.player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return saveState.player.e.points.plus(1).log10().plus(1).pow(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?.45:.15) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp[this.layer].upgrades[this.id].effect)+"x" },
				formula() { return "(log(x+1)+1)^"+(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"0.45":"0.15") },
			},
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Enhancers",
				costScalingEnabled() {
					return !(gameHelpers.hasUpgrade("e", 34) && saveState.player.i.buyables[12].gte(3));
				},
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    if (x.gte(25) && derivedState.tmp[this.layer].buyables[this.id].costScalingEnabled) x = x.pow(2).div(25)
                    let cost = Decimal.pow(2, x.pow(1.5))
                    return cost.floor()
                },
				power() {
					let pow = new Decimal(1);
					if (gameHelpers.hasUpgrade("e", 33) && saveState.player.i.buyables[12].gte(3)) pow = pow.times(1.2);
					return pow;
				},
				effect(x=saveState.player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let power = derivedState.tmp[this.layer].buyables[this.id].power
					x = x.plus(derivedState.tmp.e.freeEnh);
					if (!gameHelpers.unl(this.layer)) x = new Decimal(0);
					
                    let eff = {}
                    if (x.gte(0)) eff.first = Decimal.pow(25, x.pow(power.times(1.1)))
                    else eff.first = Decimal.pow(1/25, x.times(-1).pow(power.times(1.1)))
					if (gameHelpers.hasUpgrade("q", 24)) eff.first = eff.first.pow(7.5);
					eff.first = softcapRules.softcap("enh1", eff.first)
                
                    if (x.gte(0)) eff.second = x.pow(power.times(0.8))
                    else eff.second = x.times(-1).pow(power.times(0.8)).times(-1)
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) eff.second = eff.second.pow(50);
                    return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    return (derivedState.tmp.nerdMode?("Cost Formula: 2^("+((saveState.player[this.layer].buyables[this.id].gte(25)&&data.costScalingEnabled)?"((x^2)/25)":"x")+"^1.5)"):("Cost: " + gameHelpers.formatWhole(data.cost) + " Enhance Points"))+"\n\
                    Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+(derivedState.tmp.e.freeEnh.gt(0)?(" + "+gameHelpers.formatWhole(derivedState.tmp.e.freeEnh)):"") + "\n\
                   "+(derivedState.tmp.nerdMode?(" Formula 1: 25^(x^"+gameHelpers.format(data.power.times(1.1))+")\n\ Formula 2: x^"+gameHelpers.format(data.power.times(0.8))):(" Boosts Prestige Point gain by " + gameHelpers.format(data.effect.first) + "x and adds to the Booster/Generator base by " + gameHelpers.format(data.effect.second)))+(gameHelpers.inChallenge("h", 31)?("\nPurchases Left: "+String(10-saveState.player.h.chall31bought)):"")
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
                    return saveState.player[this.layer].points.gte(derivedState.tmp[this.layer].buyables[this.id].cost) && (gameHelpers.inChallenge("h", 31) ? saveState.player.h.chall31bought<10 : true)},
                buy() {
	let cost;
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
                    saveState.player[this.layer].points = saveState.player[this.layer].points.sub(cost)
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].add(1)
					if (gameHelpers.inChallenge("h", 31)) saveState.player.h.chall31bought++;
                },
                buyMax() {
					if (!this.canAfford()) return;
					if (gameHelpers.inChallenge("h", 31)) return;
					let tempBuy = saveState.player[this.layer].points.max(1).log2().root(1.5)
					if (tempBuy.gte(25) && derivedState.tmp[this.layer].buyables[this.id].costScalingEnabled) tempBuy = tempBuy.times(25).sqrt();
					let target = tempBuy.plus(1).floor();
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].max(target);
				},
				autoed() { return saveState.player.e.auto && gameHelpers.hasMilestone("q", 1) && !gameHelpers.inChallenge("h", 31) },
                style: {'height':'222px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Enhance Points",
				done() { return saveState.player.e.best.gte(2) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "5 Enhance Points",
				done() { return saveState.player.e.best.gte(5) || gameHelpers.hasAchievement("a", 41) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "25 Enhance Points",
				done() { return saveState.player.e.best.gte(25) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Keep Booster/Generator Upgrades on reset.",
			},
		},
};
}
