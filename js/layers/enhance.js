// e — enhance content. Registration: manifest.js.
function createEnhanceLayer() {
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
        requires() { return new Decimal(1e120).times(Decimal.pow("1e180", Decimal.pow(player[this.layer].unlockOrder, 1.415038))) }, // Can be a function that takes requirement increases into account
        resource: "enhance points", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?.025:.02) }, // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (hasUpgrade("e", 24)) mult = mult.times(upgradeEffect("e", 24));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		passiveGeneration() { return (hasMilestone("q", 1)&&player.ma.current!="e")?1:0 },
		update(diff) {
			if (player.e.auto && hasMilestone("q", 1) && !inChallenge("h", 31)) this.buyables[11].buyMax();
		},
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "e", description: "Press E to Enhance Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        increaseUnlockOrder: ["t", "s"],
        doReset(resettingLayer){ 
			let keep = []
			if (hasMilestone("q", 2) || hasAchievement("a", 64)) keep.push("upgrades")
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		freeEnh() {
			let enh = new Decimal(0);
			if (hasUpgrade("e", 13)) enh = enh.plus(1);
			if (hasUpgrade("e", 21)) enh = enh.plus(2);
			if (hasUpgrade("e", 23)) enh = enh.plus(upgradeEffect("e", 23));
			if (hasUpgrade("q", 22)) enh = enh.plus(upgradeEffect("q", 22));
			if (hasUpgrade("e", 32) && player.i.buyables[12].gte(3)) enh = enh.plus(upgradeEffect("e", 32));
			return enh;
		},
        layerShown(){return player.b.unlocked&&player.g.unlocked},
        branches: ["b","g"],
		upgrades: {
			rows: 4,
			cols: 4,
			11: {
				title: "Row 2 Synergy",
				description: "Boosters & Generators boost each other.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e98000":((player.e.unlockOrder>=2)?25:100)) },
				unlocked() { return player.e.unlocked },
				effect() { 
					let exp = 1
					return {g: player.b.points.add(1).log10().pow(exp), b: player.g.points.add(1).log10().pow(exp)} 
				},
				effectDisplay() { return "+"+format(tmp.e.upgrades[11].effect.g)+" to Generator base, +"+format(tmp.e.upgrades[11].effect.b)+" to Booster base" },
				formula: "log(x+1)",
			},
			12: {
				title: "Enhanced Prestige",
				description: "Total Enhance Points boost Prestige Point gain.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e98000":(player.e.unlockOrder>=2?400:1e3)) },
				unlocked() { return hasUpgrade("e", 11) },
				effect() { 
					let ret = player.e.total.add(1).pow(1.5) 
					ret = softcap("e12", ret);
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) ret = ret.pow(1.5);
					return ret
				},
				effectDisplay() { return format(tmp.e.upgrades[12].effect)+"x" },
				formula() { 
					let f = upgradeEffect("e", 12).gte("1e1500")?"(x+1)^0.75*1e750":"(x+1)^1.5" 
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) f = "("+f+")^1.5"
					return f;
				},
			},
			13: {
				title: "Enhance Plus",
				description: "Get a free Enhancer.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e1e5":2.5e3) },
				unlocked() { return hasUpgrade("e", 11) },
			},
			14: {
				title: "More Additions",
				description: "Any Booster/Generator Upgrades that add to the Booster/Generator base are quadrupled.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e1.01e5":3e23) },
				unlocked() { return hasAchievement("a", 33) },
				effect() {
					let e = new Decimal(4)
					if (hasUpgrade("b", 33)) e = e.times(upgradeEffect("b", 33))
					return e;
				},
				effectDisplay() { return format(tmp.e.upgrades[14].effect)+"x" },
				noFormula: true,
			},
			21: {
				title: "Enhance Plus Plus",
				description: "Get another two free Enhancers",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e1.01e5":(player.e.unlockOrder>0?1e4:1e9)) },
				unlocked() { return hasUpgrade("e", 13) && ((!player.s.unlocked||(player.s.unlocked&&player.t.unlocked))&&player.t.unlocked) },
			},
			22: {
				title: "Enhanced Reversion",
				description: "Enhance acts as if you chose it first.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e1.01e5":(player.e.unlockOrder>=2?1e3:3e4)) },
				unlocked() { return (player[this.layer].unlockOrder>0||hasUpgrade("e", 22))&&hasUpgrade("e", 12) },
				onPurchase() { player[this.layer].unlockOrder = 0; },
			},
			23: {
				title: "Enter the E-Space",
				description: "Space Energy provides free Enhancers.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e1.01e5":2e20) },
				unlocked() { return hasAchievement("a", 33) },
				effect() {
					let eff = player.s.points.pow(2).div(25);
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) eff = eff.times(3.5);
					return eff.floor();
				},
				effectDisplay() { return "+"+formatWhole(tmp.e.upgrades[23].effect) },
				formula() { return "floor(x^2"+(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"/7.14":"/25")+")" },
			},
			24: {
				title: "Monstrous Growth",
				description: "Boosters & Generators boost Enhance Point gain.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e1.011e5":2.5e28) },
				unlocked() { return hasAchievement("a", 33) },
				effect() { return Decimal.pow(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e2000":1.1, player.b.points.plus(player.g.points).pow(0.9)) },
				effectDisplay() { return format(tmp.e.upgrades[24].effect)+"x" },
				formula() { return (((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e2,000":"1.1")+"^((boosters+generators)^0.9)" },
			},
			31: {
				title: "Amplification",
				description: "The second effect of Enhancers also adds to the Super-Booster, Super-Generator, and Subspace bases.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e3450000":"e4125000") },
				pseudoUnl() { return player.i.buyables[12].gte(3)&&player.e.upgrades.length>=7 },
				pseudoReq: "Req: e2,464,000 Enhance Points without any Super-Boosters or Super-Generators (after a Row 4 reset).",
				pseudoCan() { return player.sb.best.eq(0) && player.sg.best.eq(0) && player.e.points.gte("e2.464e6") },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			32: {
				title: "Supplementation",
				description: "Best Honour provides free Enhancers.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e3460000":"e4500000") },
				pseudoUnl() { return player.i.buyables[12].gte(3)&&player.e.upgrades.length>=7 },
				pseudoReq: "Req: 30,300 Free Enhancers.",
				pseudoCan() { return tmp.e.freeEnh.gte(30300) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return softcap("e32", player.hn.best.plus(1).log10().pow(3.25)).floor() },
				effectDisplay() { return "+"+format(tmp[this.layer].upgrades[this.id].effect) },
				formula: "log(x+1)^3.25",
			},
			33: {
				title: "Augmentation",
				description: "Both Enhancer effect exponents are 20% higher.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e3460000":"e4500000") },
				pseudoUnl() { return player.i.buyables[12].gte(3)&&player.e.upgrades.length>=7 },
				pseudoReq: "Req: 60,600 Bought Enhancers.",
				pseudoCan() { return player.e.buyables[11].gte(60600) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			34: {
				title: "Intensification",
				description: "Enhancer cost scaling is disabled.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e3450000":"e4125000") },
				pseudoUnl() { return player.i.buyables[12].gte(3)&&player.e.upgrades.length>=7 },
				pseudoReq: "Req: e3,050,000 Enhance Points without any purchased Quirk Layers (After a Row 5 reset).",
				pseudoCan() { return player.e.points.gte("e3.05e6") && player.q.buyables[11].eq(0) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			41: {
				title: "To the Next Level",
				description: "Enhance Points boost Hyperspace Energy gain.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e3460000":"e5750000") },
				pseudoUnl() { return player.i.buyables[12].gte(3)&&player.e.upgrades.length>=7 },
				pseudoReq: "Req: 44,900 Bought Enhancers without any Hyper Buildings.",
				pseudoCan() { return player.e.buyables[11].gte(44900) && player.hs.spentHS.eq(0) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return player.e.points.plus(1).log10().plus(1).pow(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?.45:.15) },
				effectDisplay() { return format(tmp[this.layer].upgrades[this.id].effect)+"x" },
				formula() { return "(log(x+1)+1)^"+(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"0.45":"0.15") },
			},
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Enhancers",
				costScalingEnabled() {
					return !(hasUpgrade("e", 34) && player.i.buyables[12].gte(3));
				},
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    if (x.gte(25) && tmp[this.layer].buyables[this.id].costScalingEnabled) x = x.pow(2).div(25)
                    let cost = Decimal.pow(2, x.pow(1.5))
                    return cost.floor()
                },
				power() {
					let pow = new Decimal(1);
					if (hasUpgrade("e", 33) && player.i.buyables[12].gte(3)) pow = pow.times(1.2);
					return pow;
				},
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let power = tmp[this.layer].buyables[this.id].power
					x = x.plus(tmp.e.freeEnh);
					if (!unl(this.layer)) x = new Decimal(0);
					
                    let eff = {}
                    if (x.gte(0)) eff.first = Decimal.pow(25, x.pow(power.times(1.1)))
                    else eff.first = Decimal.pow(1/25, x.times(-1).pow(power.times(1.1)))
					if (hasUpgrade("q", 24)) eff.first = eff.first.pow(7.5);
					eff.first = softcap("enh1", eff.first)
                
                    if (x.gte(0)) eff.second = x.pow(power.times(0.8))
                    else eff.second = x.times(-1).pow(power.times(0.8)).times(-1)
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) eff.second = eff.second.pow(50);
                    return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: 2^("+((player[this.layer].buyables[this.id].gte(25)&&data.costScalingEnabled)?"((x^2)/25)":"x")+"^1.5)"):("Cost: " + formatWhole(data.cost) + " Enhance Points"))+"\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id])+(tmp.e.freeEnh.gt(0)?(" + "+formatWhole(tmp.e.freeEnh)):"") + "\n\
                   "+(tmp.nerdMode?(" Formula 1: 25^(x^"+format(data.power.times(1.1))+")\n\ Formula 2: x^"+format(data.power.times(0.8))):(" Boosts Prestige Point gain by " + format(data.effect.first) + "x and adds to the Booster/Generator base by " + format(data.effect.second)))+(inChallenge("h", 31)?("\nPurchases Left: "+String(10-player.h.chall31bought)):"")
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost) && (inChallenge("h", 31) ? player.h.chall31bought<10 : true)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player[this.layer].points = player[this.layer].points.sub(cost)	
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
					if (inChallenge("h", 31)) player.h.chall31bought++;
                },
                buyMax() {
					if (!this.canAfford()) return;
					if (inChallenge("h", 31)) return;
					let tempBuy = player[this.layer].points.max(1).log2().root(1.5)
					if (tempBuy.gte(25) && tmp[this.layer].buyables[this.id].costScalingEnabled) tempBuy = tempBuy.times(25).sqrt();
					let target = tempBuy.plus(1).floor();
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				},
				autoed() { return player.e.auto && hasMilestone("q", 1) && !inChallenge("h", 31) },
                style: {'height':'222px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Enhance Points",
				done() { return player.e.best.gte(2) || hasAchievement("a", 71) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "5 Enhance Points",
				done() { return player.e.best.gte(5) || hasAchievement("a", 41) || hasAchievement("a", 71) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "25 Enhance Points",
				done() { return player.e.best.gte(25) || hasAchievement("a", 71) },
				effectDescription: "Keep Booster/Generator Upgrades on reset.",
			},
		},
};
}
