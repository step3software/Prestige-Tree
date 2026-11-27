// Session-bound layer owner; composition supplies only the named ports.
// ps — phantom souls content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'>} ports */
function createPhantomSoulsLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState }) {
    return {
		name: "phantom souls", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "PS", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 2, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			prevH: new Decimal(0),
			souls: new Decimal(0),
			power: new Decimal(0),
			auto: false,
			autoW: false,
			autoGhost: false,
			first: 0,
        }},
        color: "#b38fbf",
        requires() { return new Decimal("1e16000") }, // Can be a function that takes requirement increases into account
        resource: "phantom souls", // Name of prestige currency
        baseResource: "quirk energy", // Name of resource prestige is based on
        baseAmount() {return saveState.player.q.energy}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(1.5), // Prestige currency exponent
		base() { 
			let b = new Decimal("1e8000").root(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?2:1);
			if (derivedState.tmp.ps.impr[32].unlocked) b = b.root(gameHelpers.improvementEffect("ps", 32));
			return b;
		},
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (saveState.player.i.buyables[11].gte(2)) mult = mult.div(gameHelpers.buyableEffect("s", 17));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		canBuyMax() { return gameHelpers.hasMilestone("hn", 9) },
        row: 4, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "P", description: "Press Shift+P to Phantom Soul Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
		resetsNothing() { return gameHelpers.hasMilestone("hn", 6) },
        doReset(resettingLayer){ 
			let keep = [];
			saveState.player.ps.souls = new Decimal(0);
			let keptGS = new Decimal(0);
			if (layerRegistry.layers[resettingLayer].row <= this.row+1) keptGS = new Decimal(saveState.player.ps.buyables[21]);
            if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
			saveState.player.ps.buyables[21] = keptGS;
        },
		update(diff) {
			if (gameHelpers.hasMilestone("hn", 5)) {
				if (saveState.player.ps.autoW) layerRegistry.layers.ps.buyables[11].buyMax();
				saveState.player.ps.souls = saveState.player.ps.souls.max(derivedState.tmp.ps.soulGain.times(saveState.player.h.points.max(1).log10()))
			} else saveState.player.ps.souls = saveState.player.ps.souls.plus(saveState.player.h.points.max(1).log10().sub(saveState.player.ps.prevH.max(1).log10()).max(0).times(derivedState.tmp.ps.soulGain));
			saveState.player.ps.prevH = new Decimal(saveState.player.h.points);
			if (gameHelpers.hasMilestone("hn", 7)) saveState.player.ps.power = saveState.player.ps.power.root(derivedState.tmp.ps.powerExp).plus(derivedState.tmp.ps.powerGain.times(diff)).pow(derivedState.tmp.ps.powerExp);
			else saveState.player.ps.power = new Decimal(0);
			if (saveState.player.ps.autoGhost && gameHelpers.hasMilestone("ma", 0) && saveState.player.ma.current!="ps") layerRegistry.layers.ps.buyables[21].buyMax();
		},
		autoPrestige() { return gameHelpers.hasMilestone("hn", 4) && saveState.player.ps.auto && saveState.player.ma.current!="ps" },
        layerShown(){return saveState.player.m.unlocked && saveState.player.ba.unlocked},
        branches: ["q", ["h", 2]],
		soulGainExp() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.2:1.5 },
		soulGainMult() {
			let mult = new Decimal(1);
			if (derivedState.tmp.ps.buyables[11].effects.damned) mult = mult.times(derivedState.tmp.ps.buyables[11].effects.damned||1);
			if (saveState.player.i.buyables[11].gte(1)) mult = mult.times(gameHelpers.buyableEffect("s", 16));
			if (saveState.player.c.unlocked) mult = mult.times(derivedState.tmp.c.eff4);
			return mult.times(derivedState.tmp.n.dustEffs.purple);
		},
		soulGain() {
			let gain = (((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?Decimal.pow(derivedState.tmp.ps.soulGainExp, saveState.player.ps.points):Decimal.pow(saveState.player.ps.points, derivedState.tmp.ps.soulGainExp)).div(9.4).times(layerRegistry.layers.ps.soulGainMult());
			return gain;
		},
		gainDisplay() {
			let gain = derivedState.tmp.ps.soulGain;
			let display = "";
			if (gain.eq(0)) display = "0"
			else if (gain.gte(1)) display = gameHelpers.format(gain)+" per OoM of Hindrance Spirit"
			else display = "1 per "+gameHelpers.format(gain.pow(-1))+" OoMs of Hindrance Spirit"
			return display;
		},
		soulEffExp() {
			let exp = new Decimal(1.5e3);
			if (derivedState.tmp.ps.buyables[11].effects.damned) exp = exp.times(derivedState.tmp.ps.buyables[11].effects.damned||1);
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) exp = exp.times(100);
			return exp;
		},
		soulEff() {
			let eff = saveState.player.ps.souls.plus(1).pow(layerRegistry.layers.ps.soulEffExp());
			return eff;
		},
		powerGain() { return saveState.player.ps.souls.plus(1).times(derivedState.tmp.ps.buyables[21].effect).times(derivedState.tmp.n.dustEffs.purple) },
		powerExp() { return saveState.player.ps.points.sqrt().times(derivedState.tmp.ps.buyables[21].effect) },
		tabFormat: {
			"Main Tab": {
				content: ["main-display",
					"prestige-button",
					"resource-display",
					"blank",
					["display-text", function() { return "You have "+gameHelpers.formatWhole(saveState.player.ps.souls)+" Damned Souls "+(derivedState.tmp.nerdMode?("(Formula: ("+(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("ps"):false)?(gameHelpers.format(derivedState.tmp.ps.soulGainExp)+"^PS"):("PS^"+gameHelpers.format(derivedState.tmp.ps.soulGainExp)))+")*"+gameHelpers.format(derivedState.tmp.ps.soulGainMult.div(10))+")"):("(Gain: "+derivedState.tmp.ps.gainDisplay+")"))+": Divide Quirk Improvement requirements by "+gameHelpers.format(derivedState.tmp.ps.soulEff)+(derivedState.tmp.nerdMode?(" (x+1)^("+gameHelpers.formatWhole(derivedState.tmp.ps.soulEffExp)+")"):"") }],
					"blank",
					["buyable", 11],
				],
			},
			Boosters: {
				unlocked() { return gameHelpers.hasMilestone("hn", 7) },
				buttonStyle() { return {'background-color': '#b38fbf'} },
				content: [
					"main-display",
					"blank",
					["buyable", 21],
					"blank",
					["display-text",
						function() {return 'You have ' + gameHelpers.formatWhole(saveState.player.ps.power)+' Phantom Power'+(derivedState.tmp.nerdMode?(" (Gain Formula: (damned+1), Exp Formula: sqrt(ps))"):" (+"+gameHelpers.format(derivedState.tmp.ps.powerGain)+"/sec (based on Damned Souls), then raised to the power of "+gameHelpers.format(derivedState.tmp.ps.powerExp)+" (based on Phantom Souls))")+', which has provided the below Phantom Boosters (next at '+gameHelpers.format(derivedState.tmp.ps.impr.overallNextImpr)+')'},
							{}],
					"blank",
					"improvements"],
			},
		},
		buyables: {
			rows: 2,
			cols: 1,
			11: {
				title: "Wraiths",
				scaleSlow() {
					let speed = new Decimal(1);
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) speed = speed.times(2);
					return speed;
				},
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    let cost1 = x.div(derivedState.tmp.ps.buyables[this.id].scaleSlow).times(2).plus(1).floor();
					let cost2 = x.div(derivedState.tmp.ps.buyables[this.id].scaleSlow).plus(1).pow(4).times(174).plus(200).floor();
                    return { phantom: cost1, damned: cost2 };
                },
				effects(adj=0) {
					let data = {};
					let x = saveState.player[this.layer].buyables[this.id].plus(adj);
					if (x.gte(1)) data.hindr = x.min(3).toNumber();
					if (x.gte(2)) data.damned = x.sub(1).times(0.5).div(10/9.4).plus(1);
					if (x.gte(4)) data.quirkImpr = x.div(2).sub(1).floor().min(3).toNumber();
					return data;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ((derivedState.tmp.nerdMode?("Cost Formula: 2*x+1 Phantom Souls, (x+1)^4*174+200 Damned Souls"):("Cost: " + gameHelpers.formatWhole(data.cost.phantom) + " Phantom Souls, "+gameHelpers.formatWhole(data.cost.damned)+" Damned Souls"))+"\n\
                    Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+"\n\
					Effects: ")
					let curr = data.effects;
					let next = this.effects(1);
					if (Object.keys(next).length>0) {
						if (next.hindr) {
							display += "\n"
							if (curr.hindr) display += curr.hindr+" New Hindrance"+(curr.hindr==1?"":"s")+(curr.hindr>=3?" (MAXED)":"")
							else display += "<b>NEXT: Unlock a new Hindrance</b>"
						}
						if (next.damned) {
							display += "\n"
							if (curr.damned) display += "Multiply Damned Soul gain & effect exponent by "+gameHelpers.format(curr.damned)+(derivedState.tmp.nerdMode?" ((x-1)*0.5+1)":"");
							else display += "<b>NEXT: Multiply Damned Soul gain & effect exponent</b>"
						}
						if (next.quirkImpr) {
							display += "\n"
							if (curr.quirkImpr) display += curr.quirkImpr+" New Quirk Improvement"+(curr.quirkImpr==1?"":"s")+(curr.quirkImpr>=3?" (MAXED)":"")
							else if (next.quirkImpr>(curr.quirkImpr||0)) display += "<b>NEXT: Unlock a new Quirk Improvement</b>"
						}
					} else display += "None"
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
                    return saveState.player.ps.points.gte(derivedState.tmp[this.layer].buyables[this.id].cost.phantom)&&saveState.player.ps.souls.gte(derivedState.tmp[this.layer].buyables[this.id].cost.damned)},
                buy() {
	let cost;
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
					if (!gameHelpers.hasMilestone("hn", 4)) {
						saveState.player.ps.points = saveState.player.ps.points.sub(cost.phantom)
						saveState.player.ps.souls = saveState.player.ps.souls.sub(cost.damned)
					} 
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {
					let target = saveState.player.ps.points.sub(1).div(2).min(saveState.player.ps.souls.sub(200).div(174).root(4).sub(1)).times(derivedState.tmp.ps.buyables[this.id].scaleSlow).plus(1).floor().max(0)
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].max(target)
				},
                style: {'height':'200px', 'width':'200px'},
				autoed() { return gameHelpers.hasMilestone("hn", 5) && saveState.player.ps.autoW },
			},
			21: {
				title: "Ghost Spirit",
				scaleSlow() {
					let slow = new Decimal(1);
					if (gameHelpers.hasUpgrade("hn", 51)) slow = slow.times(2);
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) slow = slow.times(1.2);
					if (derivedState.tmp.ps.impr[31].unlocked) slow = slow.times(gameHelpers.improvementEffect("ps", 31));
					return slow;
				},
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    let cost = Decimal.pow(10, Decimal.pow(2, x.div(this.scaleSlow()))).times(x.eq(0)?1e21:1e22);
					if (gameHelpers.hasUpgrade("hn", 51)) cost = cost.div(gameHelpers.upgradeEffect("hn", 51));
					return cost;
                },
				effect() {
					return saveState.player[this.layer].buyables[this.id].div(25).plus(1).pow(2);
				},
				effect2() {
					return saveState.player[this.layer].buyables[this.id].div(10).plus(1);
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ((derivedState.tmp.nerdMode?("Cost Formula: (10^(2^x))*1e22"):("Cost: " + gameHelpers.formatWhole(data.cost) + " Phantom Power"))+"\n\
                    Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+"\n\
					Effect: "+(derivedState.tmp.nerdMode?("Formula 1: (x/25+1)^2, Formula 2: (x/10+1)"):("Multiply Phantom Power gain/exponent by "+gameHelpers.format(derivedState.tmp.ps.buyables[this.id].effect)+", and boost Phantom Booster effectiveness by "+gameHelpers.format(derivedState.tmp.ps.buyables[this.id].effect2.sub(1).times(100))+"%")))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
                    return saveState.player.ps.power.gte(derivedState.tmp[this.layer].buyables[this.id].cost)},
                buy() {
	let cost;
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
					saveState.player.ps.power = saveState.player.ps.power.sub(cost);
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {
					let target = saveState.player.ps.power.times(gameHelpers.hasUpgrade("hn", 51)?gameHelpers.upgradeEffect("hn", 51):1).div(1e22).max(1).log10().max(1).log(2).times(this.scaleSlow()).plus(1).floor();
					saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].max(target);
				},
                style: {'height':'200px', 'width':'200px'},
				autoed() { return saveState.player.ps.autoGhost && gameHelpers.hasMilestone("ma", 0) && saveState.player.ma.current!="ps" },
			},
		},
		impr: {
			baseReq() { 
				let req = new Decimal(1e20).div(99);
				return req;
			},
			amount() { 
				let amt = saveState.player.ps.power.div(this.baseReq()).plus(1).log10().div(4).root(1.5).max(0);
				//if (amt.gte(270)) amt = amt.log10().times(270/Math.log10(270));
				return amt.floor();
			},
			overallNextImpr() { 
				let impr = derivedState.tmp.ps.impr.amount.plus(1);
				//if (impr.gte(270)) impr = Decimal.pow(10, impr.div(270/Math.log10(270)));
				return Decimal.pow(10, impr.pow(1.5).times(4)).sub(1).times(this.baseReq()) 
			},
			nextAt(id=11) { 
				let impr = gameHelpers.getImprovements("ps", id).times(derivedState.tmp.ps.impr.activeRows*derivedState.tmp.ps.impr.activeCols).add(derivedState.tmp.ps.impr[id].num);
				//if (impr.gte(270)) impr = Decimal.pow(10, impr.div(270/Math.log10(270)));
				return Decimal.pow(10, impr.pow(1.5).times(4)).sub(1).times(this.baseReq());
			},
			power() { return derivedState.tmp.ps.buyables[21].effect2.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.1:1) },
			resName: "phantom power",
			rows: 3,
			cols: 2,
			activeRows: 2,
			activeCols: 2,
			11: {
				num: 1,
				title: "Phantom Booster I",
				description: "Boost Solar Power.",
				unlocked() { return gameHelpers.hasMilestone("hn", 7) },
				effect() { return gameHelpers.getImprovements("ps", 11).times(derivedState.tmp.ps.impr.power).div(20).plus(1).sqrt() },
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.ps.impr[11].effect.sub(1).times(100))+"% (multiplicative)" },
				formula: "sqrt(x*5%)",
				style: {height: "150px", width: "150px"},
			},
			12: {
				num: 2,
				title: "Phantom Booster II",
				description: "Boost Hex gain.",
				unlocked() { return gameHelpers.hasMilestone("hn", 7) },
				effect() { return Decimal.pow(10, gameHelpers.getImprovements("ps", 11).times(derivedState.tmp.ps.impr.power).pow(2.5)) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.ps.impr[12].effect)+"x" },
				formula: "10^(x^2.5)",
				style: {height: "150px", width: "150px"},
			},
			21: {
				num: 3,
				title: "Phantom Booster III",
				description: "Spells are more effective.",
				unlocked() { return gameHelpers.hasMilestone("hn", 7) },
				effect() { return gameHelpers.getImprovements("ps", 21).times(derivedState.tmp.ps.impr.power).div(10).plus(1) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.ps.impr[21].effect.sub(1).times(100))+"% stronger" },
				formula: "x*10%",
				style: {height: "150px", width: "150px"},
			},
			22: {
				num: 4,
				title: "Phantom Booster IV",
				description: "Quirk Improvement requirements increase slower.",
				unlocked() { return gameHelpers.hasMilestone("hn", 7) },
				effect() { return gameHelpers.getImprovements("ps", 22).times(derivedState.tmp.ps.impr.power).div(20).plus(1) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.ps.impr[22].effect)+"x slower" },
				formula: "x/20+1",
				style: {height: "150px", width: "150px"},
			},
			31: {
				num: 1500,
				title: "Phantom Booster V",
				description: "The Ghost Spirit cost scaling is weakened.",
				unlocked() { return gameHelpers.hasMilestone("hn", 7) && saveState.player.i.buyables[14].gte(1) },
				effect() { return gameHelpers.getImprovements("ps", 31).times(derivedState.tmp.ps.impr.power).plus(1).log10().div(25).plus(1) },
				effectDisplay() { return gameHelpers.format(Decimal.sub(1, derivedState.tmp.ps.impr[31].effect.pow(-1)).times(100))+"% slower" },
				formula: "log(x+1)/25+1",
				style: {height: "150px", width: "150px"},
			},
			32: {
				num: 1751,
				title: "Phantom Booster VI",
				description: "The Phantom Soul cost base is reduced based on your Phantom Souls.",
				unlocked() { return gameHelpers.hasMilestone("hn", 7) && saveState.player.i.buyables[14].gte(2) },
				effect() { return gameHelpers.getImprovements("ps", 31).times(derivedState.tmp.ps.impr.power).pow(2).times(saveState.player.ps.points).plus(1).log10().plus(1).pow(1.2) },
				effectDisplay() { return "brought to the "+gameHelpers.format(derivedState.tmp.ps.impr[32].effect)+"th root" },
				formula: "(log((x^2)*PS+1)+1)^1.2",
				style: {height: "150px", width: "150px"},
			},
		},
};
}
