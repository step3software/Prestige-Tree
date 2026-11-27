// s — space content. Registration: manifest.js.
function createSpaceLayer() {
    return {
        name: "space", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "S", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 3, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			spent: new Decimal(0),
			first: 0,
			auto: false,
			autoBld: false,
			pseudoUpgs: [],
        }},
        color: "#dfdfdf",
        requires() { return new Decimal(1e120).times(Decimal.pow("1e180", Decimal.pow(player[this.layer].unlockOrder, 1.415038))) }, // Can be a function that takes requirement increases into account
        resource: "space energy", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.4:1.85) }, // Prestige currency exponent
        base() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?10:(hasUpgrade("ss", 11)?1e10:1e15)) },
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "s", description: "Press S to Space Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		resetsNothing() { return hasMilestone("q", 5)&&player.ma.current!="s" },
        increaseUnlockOrder: ["t", "e"],
        doReset(resettingLayer){ 
            let keep = []
			if (hasMilestone("q", 0)) keep.push("milestones")
			if (hasMilestone("q", 2) || hasAchievement("a", 64)) keep.push("upgrades")
			if (hasMilestone("q", 2) && (resettingLayer=="q"||resettingLayer=="h")) {
				keep.push("buyables");
				keep.push("spent");
			}
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		space() {
			let space = player.s.best.pow(1.1).times(3);
			if (hasUpgrade("s", 13)) space = space.plus(2);
			if (hasAchievement("a", 53)) space = space.plus(2);
			if (player.ss.unlocked) space = space.plus(tmp.ss.eff1);
			
			if (inChallenge("h", 21)) space = space.div(10);
			return space.floor().sub(player.s.spent).max(0);
		},
		buildingBaseRoot() {
			let root = new Decimal(1);
			if (hasUpgrade("s", 34) && player.i.buyables[12].gte(5)) root = root.times(upgradeEffect("s", 34));
			return root;
		},
		buildingBaseCosts() { 
			let rt = tmp.s.buildingBaseRoot;
			return {
				11: new Decimal(1e3).root(rt),
				12: new Decimal(1e10).root(rt),
				13: new Decimal(1e25).root(rt),
				14: new Decimal(1e48).root(rt),
				15: new Decimal(1e250).root(rt),
				16: new Decimal("e3e7").root(rt),
				17: new Decimal("e4.5e7").root(rt),
				18: new Decimal("e6e7").root(rt),
				19: new Decimal("e3.5e8").root(rt),
				20: new Decimal("e1.5e9").root(rt),
		}},
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'Your best Space Energy is ' + formatWhole(player.s.best)},
					{}],
			"blank",
			"milestones", "blank", 
			["display-text",
				function() {return 'You have ' + format(player.g.power) + ' Generator Power'},
					{}],
			["display-text",
				function() {return 'Your Space Energy has provided you with ' + formatWhole(tmp.s.space) + ' Space'},
					{}],
			["display-text",
				function() {return tmp.s.buildingPower.eq(1)?"":("Space Building Power: "+format(tmp.s.buildingPower.times(100))+"%")},
					{}],
			"blank",
			"buyables", "blank", "upgrades"],
        layerShown(){return player.g.unlocked},
        branches: ["g"],
		canBuyMax() { return hasMilestone("q", 1) },
		freeSpaceBuildings() {
			let x = new Decimal(0);
			if (hasUpgrade("s", 11)) x = x.plus(1);
			if (hasUpgrade("s", 22)) x = x.plus(upgradeEffect("s", 22));
			if (hasUpgrade("q", 22)) x = x.plus(upgradeEffect("q", 22));
			if (hasUpgrade("ss", 31)) x = x.plus(upgradeEffect("ss", 31));
			return x;
		},
		freeSpaceBuildings1to4() {
			let x = new Decimal(0);
			if (player.s.unlocked) x = x.plus(buyableEffect("s", 15));
			return x;
		},
		totalBuildingLevels() {
			let len = Object.keys(player.s.buyables).length
			if (len==0) return new Decimal(0);
			if (len==1) return Object.values(player.s.buyables)[0].plus(tmp.s.freeSpaceBuildings).plus(toNumber(Object.keys(player.s.buyables))<15?tmp.s.freeSpaceBuildings1to4:0)
			let l = Object.values(player.s.buyables).reduce((a,c,i) => Decimal.add(a, c).plus(toNumber(Object.keys(player.s.buyables)[i])<15?tmp.s.freeSpaceBuildings1to4:0)).plus(tmp.s.freeSpaceBuildings.times(len));
			return l;
		},
		manualBuildingLevels() {
			let len = Object.keys(player.s.buyables).length
			if (len==0) return new Decimal(0);
			if (len==1) return Object.values(player.s.buyables)[0]
			let l = Object.values(player.s.buyables).reduce((a,c) => Decimal.add(a, c));
			return l;
		},
		buildingPower() {
			if (!unl(this.layer)) return new Decimal(0);
			let pow = new Decimal(1);
			if (hasUpgrade("s", 21)) pow = pow.plus(0.08);
			if (hasChallenge("h", 21)) pow = pow.plus(challengeEffect("h", 21).div(100));
			if (player.ss.unlocked) pow = pow.plus(tmp.ss.eff2);
			if (hasUpgrade("ss", 42)) pow = pow.plus(1);
			if (hasUpgrade("ba", 12)) pow = pow.plus(upgradeEffect("ba", 12));
			if (player.n.buyables[11].gte(2)) pow = pow.plus(buyableEffect("o", 23));
			if (hasAchievement("a", 103)) pow = pow.plus(.1);
			if (inChallenge("h", 21)) pow = pow.sub(0.9);
			if (player.n.buyables[11].gte(5)) pow = pow.plus(buyableEffect("o", 33));
			
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) pow = pow.div(5);
			return pow;
		},
		autoPrestige() { return player.s.auto&&hasMilestone("q", 3)&&player.ma.current!="s" },
		update(diff) {
			if (player.s.autoBld && hasMilestone("q", 7)) for (let i=(5+player.i.buyables[11].toNumber());i>=1;i--) layers.s.buyables[10+i].buyMax();
		},
		upgrades: {
			rows: 3,
			cols: 5,
			11: {
				title: "Space X",
				description: "Add a free level to all Space Buildings.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?758:2) },
				unlocked() { return player[this.layer].unlocked }
			},
			12: {
				title: "Generator Generator",
				description: "Generator Power boosts its own generation.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?758:3) },
				unlocked() { return hasUpgrade("s", 11) },
				effect() { return player.g.power.add(1).log10().add(1) },
				effectDisplay() { return format(tmp.s.upgrades[12].effect)+"x" },
				formula: "log(x+1)+1",
			},
			13: {
				title: "Shipped Away",
				description: "Space Building Levels boost Generator Power gain, and you get 2 extra Space.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e48900":([1e37,1e59,1e94][player[this.layer].unlockOrder||0])) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				unlocked() { return hasUpgrade("s", 11) },
				effect() { return softcap("s13", Decimal.pow(20, tmp.s.totalBuildingLevels)) },
				effectDisplay() { return format(tmp.s.upgrades[13].effect)+"x" },
				formula: "20^x",
			},
			14: {
				title: "Into The Repeated",
				description: "Unlock the <b>Quaternary Space Building</b>.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?759:4) },
				unlocked() { return hasUpgrade("s", 12)||hasUpgrade("s", 13) }
			},
			15: {
				title: "Four Square",
				description: "The <b>Quaternary Space Building</b> cost is cube rooted, is 3x as strong, and also affects <b>BP Combo</b> (brought to the 2.7th root).",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e55000":([1e65,(player.e.unlocked?1e94:1e88),1e129][player[this.layer].unlockOrder||0])) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				unlocked() { return hasUpgrade("s", 14) },
			},
			21: {
				title: "Spacious",
				description: "All Space Buildings are 8% stronger.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?759:13) },
				unlocked() { return hasAchievement("a", 33) },
			},
			22: {
				title: "Spacetime Anomaly",
				description: "Non-extra Time Capsules provide free Space Buildings.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e55225":2.5e207) },
				currencyDisplayName: "generator power",
				currencyInternalName: "power",
				currencyLayer: "g",
				unlocked() { return hasAchievement("a", 33) },
				effect() { return player.t.points.cbrt().floor() },
				effectDisplay() { return "+"+formatWhole(tmp.s.upgrades[22].effect) },
				formula: "floor(cbrt(x))",
			},
			23: {
				title: "Revert Space",
				description() { return (player.e.unlocked&&player.t.unlocked&&(player.s.unlockOrder||0)==0)?"All Space Building costs are divided by 1e20.":("Space acts as if you chose it first"+(player.t.unlocked?", and all Space Building costs are divided by 1e20.":".")) },
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e55300":(player.s.unlockOrder>=2?1e141:(player.e.unlocked?1e105:1e95))) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				unlocked() { return ((player.e.unlocked&&player.t.unlocked&&(player.s.unlockOrder||0)==0)||player[this.layer].unlockOrder>0||hasUpgrade("s", 23))&&hasUpgrade("s", 13) },
				onPurchase() { player[this.layer].unlockOrder = 0; },
			},
			24: {
				title: "Want More?",
				description: "All four of the <b>I Need More</b> upgrades are stronger based on your Total Space Buildings.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"1e55555":1e177) },
				currencyDisplayName: "generator power",
				currencyInternalName: "power",
				currencyLayer: "g",
				unlocked() { return hasAchievement("a", 33) },
				effect() {
					return tmp.s.totalBuildingLevels.sqrt().div(5).plus(1);
				},
				effectDisplay() { return format(tmp.s.upgrades[24].effect.sub(1).times(100))+"% stronger" },
				formula: "sqrt(x)/5+1",
			},
			25: {
				title: "Another One?",
				description: "Unlock the Quinary Space Building.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e8e5":1e244) },
				currencyDisplayName: "generator power",
				currencyInternalName: "power",
				currencyLayer: "g",
				unlocked() { return hasAchievement("a", 33) },
			},
			31: {
				title: "Useful Dimensionality",
				description: "The first four Space Buildings' cost exponents are decreased by 0.04*(5-n), where n is the Space Building number.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?815:1225) },
				pseudoUnl() { return player.i.buyables[12].gte(5)&&player.s.upgrades.length>=9 },
				pseudoReq: "Req: 1,200% Space Building Power",
				pseudoCan() { return tmp.s.buildingPower.gte(12) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				style: {"font-size": "9px"},
			},
			32: {
				title: "Poincaré Recurrence",
				description: "Each Space Building's bought Level adds to the previous building's Extra Level.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e9e5":"e2.25e8") },
				currencyDisplayName: "generator power",
				currencyInternalName: "power",
				currencyLayer: "g",
				pseudoUnl() { return player.i.buyables[12].gte(5)&&player.s.upgrades.length>=9 },
				pseudoReq: "Req: e1e9 Points",
				pseudoCan() { return player.points.gte("e1e9") },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
			},
			33: {
				title: "Noncontinuous Spectrum",
				description: "<b>Contiguous Dimension</b> multiplies Nebula Energy & Hyperspace Energy gain at a reduced rate.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e1e6":"e2.75e8") },
				currencyDisplayName: "generator power",
				currencyInternalName: "power",
				currencyLayer: "g",
				pseudoUnl() { return player.i.buyables[12].gte(5)&&player.s.upgrades.length>=9 },
				pseudoReq: "Req: Have at least 13 Space Upgrades, 39 Achievements, and the upgrade <b>Contiguous Dimension</b>.",
				pseudoCan() { return player.a.achievements.length>=39 && player.s.upgrades.length>=13 && hasUpgrade("s", 35) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return upgradeEffect("s", 35).sqrt() },
				effectDisplay() { return format(upgradeEffect("s", 33))+"x" },
				formula: "sqrt(x)",
				style: {"font-size": "8px"},
			},
			34: {
				title: "Energetic Reduction",
				description: "The first five Space Buildings' cost bases are reduced based on your Space Energy.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e9.01e5":"e1.95e8") },
				currencyDisplayName: "generator power",
				currencyInternalName: "power",
				currencyLayer: "g",
				pseudoUnl() { return player.i.buyables[12].gte(5)&&player.s.upgrades.length>=9 },
				pseudoReq: "Req: e160,000,000 Generator Power without any bought Space Buildings (Hint: respec Space Buildings).",
				pseudoCan() { return player.g.power.gte("e1.6e8") && tmp.s.manualBuildingLevels.eq(0) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return player.s.points.plus(1).log10().plus(1).log10().plus(1) },
				effectDisplay() { return "brought to the "+format(tmp.s.upgrades[this.id].effect)+"th root" },
				formula: "log(log(x+1)+1)+1",
				style: {"font-size": "9px"},
			},
			35: {
				title: "Contiguous Dimension",
				description: "Unspent Space multiplies Honour gain.",
				cost() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?825:1255) },
				pseudoUnl() { return player.i.buyables[12].gte(5)&&player.s.upgrades.length>=9 },
				pseudoReq: "Req: 9e16 Space",
				pseudoCan() { return tmp.s.space.gte(9e16) },
				unlocked() { return player[this.layer].pseudoUpgs.includes(Number(this.id)) },
				effect() { return tmp.s.space.plus(1) },
				effectDisplay() { return format(tmp.s.upgrades[this.id].effect)+"x" },
				formula: "x+1",
			},
		},
		divBuildCosts() {
			let div = new Decimal(1);
			if (hasUpgrade("s", 23) && player.t.unlocked) div = div.times(1e20);
			if (player.ss.unlocked) div = div.times(tmp.ss.eff3);
			return div;
		},
		buildScalePower() {
			let scale = new Decimal(1);
			if (hasUpgrade("p", 42)) scale = scale.times(.5);
			if (hasUpgrade("hn", 42)) scale = scale.times(.8);
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) scale = scale.div(3.85);
			if (tmp.m.buyables[14].unlocked) scale = scale.times(Decimal.sub(1, tmp.m.buyables[14].effect));
			return scale;
		},
		buyables: {
			rows: 1,
			cols: 10,
			showRespec() { return player.s.unlocked },
            respec() { // Optional, reset things and give back your currency. Having this function makes a respec button appear
				player[this.layer].spent = new Decimal(0);
                resetBuyables(this.layer)
                doReset(this.layer, true) // Force a reset
            },
            respecText: "Respec Space Buildings", // Text on Respec button, optional
			11: {
				title: "Primary Space Building",
				costExp() { 
					let exp = 1.35;
					if (hasUpgrade("s", 31) && player.i.buyables[12].gte(5)) exp -= 0.04*(15-this.id);
					return exp;
				},
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					if (x.eq(0)) return new Decimal(0);
					return Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(tmp[this.layer].buyables[this.id].costExp)).times(base).div(tmp.s.divBuildCosts);
                },
				freeLevels() {
					let levels = tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4);
					if (hasUpgrade("s", 32) && player.i.buyables[12].gte(5)) levels = levels.plus(player.s.buyables[11+1]||0);
					return levels;
				},
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let eff = Decimal.pow(x.plus(1).plus(tmp.s.freeSpaceBuildings).times(tmp.s.buildingPower), player.s.points.sqrt()).times(x.plus(tmp.s.buyables[this.id].freeLevels).times(tmp.s.buildingPower).max(1).times(4)).max(1);
					if (player.hs.unlocked) eff = eff.pow(buyableEffect("hs", 21));
					return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x"+("*"+format(tmp.s.buildScalePower))+")^"+format(tmp[this.layer].buyables[this.id].costExp)+")*"+format(tmp.s.buildingBaseCosts[this.id])+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(data.freeLevels.gt(0)?(" + "+formatWhole(data.freeLevels)):"") + "\n\
                   "+(tmp.nerdMode?("Formula: level^sqrt(spaceEnergy)*level*4"):(" Space Energy boosts Point gain & Prestige Point gain by " + format(data.effect) +"x"))
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
				target() { return player.g.power.times(tmp.s.divBuildCosts).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(tmp[this.layer].buyables[this.id].costExp).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
			12: {
				title: "Secondary Space Building",
				costExp() { 
					let exp = 1.35;
					if (hasUpgrade("s", 31) && player.i.buyables[12].gte(5)) exp -= 0.04*(15-this.id);
					return exp;
				},
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					return Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(tmp[this.layer].buyables[this.id].costExp)).times(base).div(tmp.s.divBuildCosts);
                },
				freeLevels() {
					let levels = tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4);
					if (hasUpgrade("s", 32) && player.i.buyables[12].gte(5)) levels = levels.plus(player.s.buyables[12+1]||0);
					return levels;
				},
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let eff = x.plus(tmp.s.buyables[this.id].freeLevels).times(tmp.s.buildingPower).sqrt();
					if (player.hs.unlocked) eff = eff.pow(buyableEffect("hs", 22));
					return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x*"+format(tmp.s.buildScalePower)+")^"+format(tmp[this.layer].buyables[this.id].costExp)+")*"+format(tmp.s.buildingBaseCosts[this.id])+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(data.freeLevels.gt(0)?(" + "+formatWhole(data.freeLevels)):"") + "\n\
                    "+(tmp.nerdMode?("Formula: sqrt(level)"):("Adds to base of Booster/Generator effects by +" + format(data.effect)))
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
				target() { return player.g.power.times(tmp.s.divBuildCosts).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(tmp[this.layer].buyables[this.id].costExp).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
			13: {
				title: "Tertiary Space Building",
				costExp() { 
					let exp = 1.35;
					if (hasUpgrade("s", 31) && player.i.buyables[12].gte(5)) exp -= 0.04*(15-this.id);
					return exp;
				},
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					return Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(tmp[this.layer].buyables[this.id].costExp)).times(base).div(tmp.s.divBuildCosts);
                },
				freeLevels() {
					let levels = tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4);
					if (hasUpgrade("s", 32) && player.i.buyables[12].gte(5)) levels = levels.plus(player.s.buyables[13+1]||0);
					return levels;
				},
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let eff = Decimal.pow(1e18, x.plus(tmp.s.buyables[this.id].freeLevels).times(tmp.s.buildingPower).pow(0.9))
					if (player.hs.unlocked) eff = eff.pow(buyableEffect("hs", 23));
					eff = softcap("spaceBuilding3", eff);
					return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x*"+format(tmp.s.buildScalePower)+")^"+format(tmp[this.layer].buyables[this.id].costExp)+")*"+format(tmp.s.buildingBaseCosts[this.id])+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(data.freeLevels.times(tmp.s.buildingPower).gt(0)?(" + "+formatWhole(data.freeLevels)):"") + "\n\
                    "+(tmp.nerdMode?("Formula: "+(data.effect.gte("e3e9")?"10^((level^0.3)*5.45e6)":"1e18^(level^0.9)")):("Divide Booster/Generator cost by " + format(data.effect)))
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                target() { return player.g.power.times(tmp.s.divBuildCosts).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(tmp[this.layer].buyables[this.id].costExp).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
			14: {
				title: "Quaternary Space Building",
				costExp() { 
					let exp = 1.35;
					if (hasUpgrade("s", 31) && player.i.buyables[12].gte(5)) exp -= 0.04*(15-this.id);
					return exp;
				},
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					let cost = Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(tmp[this.layer].buyables[this.id].costExp)).times(base);
					if (hasUpgrade("s", 15)) cost = cost.root(3);
					return cost.div(tmp.s.divBuildCosts);
                },
				freeLevels() {
					let levels = tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4);
					if (hasUpgrade("s", 32) && player.i.buyables[12].gte(5)) levels = levels.plus(player.s.buyables[14+1]||0);
					return levels;
				},
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let ret = x.plus(tmp.s.buyables[this.id].freeLevels).times(tmp.s.buildingPower).times((hasUpgrade("s", 15))?3:1).add(1).pow(1.25);
					ret = softcap("spaceBuilding4", ret);
					if (player.hs.unlocked) ret = ret.times(buyableEffect("hs", 24));
					return ret;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
					let extForm = hasUpgrade("s", 15)?3:1
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x*"+format(tmp.s.buildScalePower)+")^"+format(tmp[this.layer].buyables[this.id].costExp)+")*"+format(tmp.s.buildingBaseCosts[this.id])+(hasUpgrade("s", 15)?"^(1/3)":"")+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(data.freeLevels.gt(0)?(" + "+formatWhole(data.freeLevels)):"") + "\n\
					"+(tmp.nerdMode?("Formula: "+(data.effect.gte(1e6)?("log(level"+(extForm==1?"":"*3")+"+1)*2.08e5"):("(level"+(extForm==1?"":"*3")+"+1)^1.25"))):("<b>Discount One</b> is raised to the power of " + format(data.effect)))
                },
                unlocked() { return player[this.layer].unlocked&&hasUpgrade("s", 14) }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                target() { return player.g.power.times(tmp.s.divBuildCosts).pow(hasUpgrade("s", 15)?3:1).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(tmp[this.layer].buyables[this.id].costExp).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
			15: {
				title: "Quinary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					let cost = Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(1.35)).times(base);
					return cost.div(tmp.s.divBuildCosts);
                },
				freeLevels() {
					let levels = tmp.s.freeSpaceBuildings;
					if (hasUpgrade("s", 32) && player.i.buyables[12].gte(5)) levels = levels.plus(player.s.buyables[15+1]||0);
					return levels;
				},
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let ret = x.plus(tmp.s.buyables[this.id].freeLevels).times(tmp.s.buildingPower).div(2);
					if (hasUpgrade("q", 32)) ret = ret.times(2);
					if (player.hs.unlocked) ret = ret.times(buyableEffect("hs", 25));
					return ret.floor();
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x*"+format(tmp.s.buildScalePower)+")^1.35)*"+format(tmp.s.buildingBaseCosts[this.id])+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(data.freeLevels.gt(0)?(" + "+formatWhole(data.freeLevels)):"") + "\n\
					"+(tmp.nerdMode?("Formula: level"+(hasUpgrade("q", 32)?"":"/2")):("Add " + formatWhole(data.effect)+" levels to all previous Space Buildings."))
                },
                unlocked() { return player[this.layer].unlocked&&hasUpgrade("s", 25) }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                target() { return player.g.power.times(tmp.s.divBuildCosts).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(1.35).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
			16: {
				title: "Senary Space Building",
				costExp() { return 1.35+(this.id-15)*0.3 },
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					let cost = Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(tmp.s.buyables[this.id].costExp)).times(base);
					return cost.div(tmp.s.divBuildCosts);
                },
				freeLevels() {
					let levels = new Decimal(0);
					if (hasUpgrade("s", 32) && player.i.buyables[12].gte(5)) levels = levels.plus(player.s.buyables[16+1]||0);
					return levels;
				},
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let ret = x.plus(tmp.s.buyables[this.id].freeLevels).times(tmp.s.buildingPower).plus(1).sqrt();
					if (player.hs.unlocked) ret = ret.pow(buyableEffect("hs", 26));
					return ret.floor();
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x*"+format(tmp.s.buildScalePower)+")^"+format(data.costExp)+")*"+format(tmp.s.buildingBaseCosts[this.id])+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id]) + (data.freeLevels.gt(0)?(" + "+formatWhole(data.freeLevels)):"") + "\n\
					"+(tmp.nerdMode?("Formula: sqrt(level+1)"):("Multiply Damned Soul gain by " + format(data.effect)+"."))
                },
                unlocked() { return player[this.layer].unlocked&&player.i.buyables[11].gte(1) }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                target() { return player.g.power.times(tmp.s.divBuildCosts).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(tmp.s.buyables[this.id].costExp).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
			17: {
				title: "Septenary Space Building",
				costExp() { return 1.35+(this.id-15)*0.3 },
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					let cost = Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(tmp.s.buyables[this.id].costExp)).times(base);
					return cost.div(tmp.s.divBuildCosts);
                },
				freeLevels() {
					let levels = new Decimal(0);
					if (hasUpgrade("s", 32) && player.i.buyables[12].gte(5)) levels = levels.plus(player.s.buyables[17+1]||0);
					return levels;
				},
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let ret = Decimal.pow("1e20000", x.plus(tmp.s.buyables[this.id].freeLevels).times(tmp.s.buildingPower).pow(1.2));
					if (player.hs.unlocked) ret = ret.pow(buyableEffect("hs", 27));
					return ret.floor();
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x*"+format(tmp.s.buildScalePower)+")^"+format(data.costExp)+")*"+format(tmp.s.buildingBaseCosts[this.id])+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id]) + (data.freeLevels.gt(0)?(" + "+formatWhole(data.freeLevels)):"") + "\n\
					"+(tmp.nerdMode?("Formula: 1e20,000^(level^1.2)"):("Divide the requirement of Phantom Souls by " + format(data.effect)+"."))
                },
                unlocked() { return player[this.layer].unlocked&&player.i.buyables[11].gte(2) }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                target() { return player.g.power.times(tmp.s.divBuildCosts).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(tmp.s.buyables[this.id].costExp).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
			18: {
				title: "Octonary Space Building",
				costExp() { return 1.35+(this.id-15)*0.3 },
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					let cost = Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(tmp.s.buyables[this.id].costExp)).times(base);
					return cost.div(tmp.s.divBuildCosts);
                },
				freeLevels() {
					let levels = new Decimal(0);
					if (hasUpgrade("s", 32) && player.i.buyables[12].gte(5)) levels = levels.plus(player.s.buyables[18+1]||0);
					return levels;
				},
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let ret = x.plus(tmp.s.buyables[this.id].freeLevels).times(tmp.s.buildingPower).div(1.5)
					if (player.hs.unlocked) ret = ret.times(buyableEffect("hs", 28));
					return ret;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x*"+format(tmp.s.buildScalePower)+")^"+format(data.costExp)+")*"+format(tmp.s.buildingBaseCosts[this.id])+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id]) + (data.freeLevels.gt(0)?(" + "+formatWhole(data.freeLevels)):"") + "\n\
					"+(tmp.nerdMode?("Formula: level/1.5"):("Get " + format(data.effect)+" more Free Quirk Layers."))
                },
                unlocked() { return player[this.layer].unlocked&&player.i.buyables[11].gte(3) }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                target() { return player.g.power.times(tmp.s.divBuildCosts).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(tmp.s.buyables[this.id].costExp).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
			19: {
				title: "Nonary Space Building",
				costExp() { return 1.35+(this.id-15)*0.3 },
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					let cost = Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(tmp.s.buyables[this.id].costExp)).times(base);
					return cost.div(tmp.s.divBuildCosts);
                },
				freeLevels() {
					let levels = new Decimal(0);
					if (hasUpgrade("s", 32) && player.i.buyables[12].gte(5)) levels = levels.plus(player.s.buyables[19+1]||0);
					return levels;
				},
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let ret = x.plus(tmp.s.buyables[this.id].freeLevels).times(tmp.s.buildingPower).div(1e3).plus(1)
					if (player.hs.unlocked) ret = ret.pow(buyableEffect("hs", 29));
					return softcap("spaceBuilding9_2", softcap("spaceBuilding9", ret));
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x*"+format(tmp.s.buildScalePower)+")^"+format(data.costExp)+")*"+format(tmp.s.buildingBaseCosts[this.id])+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id]) + (data.freeLevels.gt(0)?(" + "+formatWhole(data.freeLevels)):"") + "\n\
					"+(tmp.nerdMode?("Formula: level/1,000+1"):("The Hyperspace Energy gain exponent is multiplied by " + format(data.effect)+"."))
                },
                unlocked() { return player[this.layer].unlocked&&player.i.buyables[11].gte(4) }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                target() { return player.g.power.times(tmp.s.divBuildCosts).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(tmp.s.buyables[this.id].costExp).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
			20: {
				title: "Decary Space Building",
				costExp() { return 1.35+(this.id-15)*0.3 },
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					let cost = Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(tmp.s.buyables[this.id].costExp)).times(base);
					return cost.div(tmp.s.divBuildCosts);
                },
				freeLevels() {
					let levels = new Decimal(0);
					return levels;
				},
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let ret = x.plus(tmp.s.buyables[this.id].freeLevels).times(tmp.s.buildingPower).div(250)
					if (player.hs.unlocked) ret = ret.times(buyableEffect("hs", 30));
					return ret;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x*"+format(tmp.s.buildScalePower)+")^"+format(data.costExp)+")*"+format(tmp.s.buildingBaseCosts[this.id])+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id]) + (data.freeLevels.gt(0)?(" + "+formatWhole(data.freeLevels)):"") + "\n\
					"+(tmp.nerdMode?("Formula: (level/2.5)%"):("Hyper Building Power is increased by " + format(data.effect.times(100))+"%."))
                },
                unlocked() { return player[this.layer].unlocked&&player.i.buyables[11].gte(5) }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                target() { return player.g.power.times(tmp.s.divBuildCosts).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(tmp.s.buyables[this.id].costExp).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Space Energy",
				done() { return player.s.best.gte(2) || hasAchievement("a", 71) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "3 Space Energy",
				done() { return player.s.best.gte(3) || hasAchievement("a", 41) || hasAchievement("a", 71) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "4 Space Energy",
				done() { return player.s.best.gte(4) || hasAchievement("a", 71) },
				effectDescription: "Keep Generator Upgrades on all resets.",
			},
			3: {
				requirementDescription: "5 Space Energy",
				done() { return player.s.best.gte(5) || hasAchievement("a", 71) },
				effectDescription: "Unlock Auto-Generators.",
				toggles: [["g", "auto"]],
			},
			4: {
				requirementDescription: "8 Space Energy",
				done() { return player.s.best.gte(8) || hasAchievement("a", 71) },
				effectDescription: "Generators reset nothing.",
			},
		},
};
}
