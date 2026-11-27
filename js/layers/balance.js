// Session-bound layer owner; composition supplies only the named ports.
// ba — balance content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'|'softcapRules'>} ports */
function createBalanceLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState, softcapRules }) {
    return {
		name: "balance", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "BA", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 3, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			allotted: 0.5,
			pos: new Decimal(0),
			neg: new Decimal(0),
			keepPosNeg: false,
			first: 0,
        }},
        color: "#fced9f",
        requires: new Decimal("1e365"), // Can be a function that takes requirement increases into account
        resource: "balance energy", // Name of prestige currency
        baseResource: "quirks", // Name of resource prestige is based on
        baseAmount() {return saveState.player.q.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?0.0125:0.005) }, // Prestige currency exponent
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1);
			if (gameHelpers.hasAchievement("a", 74)) mult = mult.times(gameHelpers.challengeEffect("h", 32));
			if (saveState.player.mc.unlocked) mult = mult.times(gameHelpers.clickableEffect("mc", 22));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 4, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "a", description: "Press A to Balance Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			if (!(gameHelpers.hasMilestone("ba", 4) && saveState.player.ba.keepPosNeg)) {
				saveState.player.ba.pos = new Decimal(0);
				saveState.player.ba.neg = new Decimal(0);
			}
			if (gameHelpers.hasMilestone("hn", 0)) keep.push("milestones")
			if (gameHelpers.hasMilestone("hn", 3)) keep.push("upgrades")
			if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
        },
        layerShown(){return saveState.player.q.unlocked&&saveState.player.ss.unlocked },
        branches: ["q","ss"],
		update(diff) {
			if (!saveState.player.ba.unlocked) return;
			saveState.player.ba.pos = saveState.player.ba.pos.plus(derivedState.tmp.ba.posGain.times(diff));
			saveState.player.ba.neg = saveState.player.ba.neg.plus(derivedState.tmp.ba.negGain.times(diff));
		},
		passiveGeneration() { return (gameHelpers.hasMilestone("hn", 1)&&saveState.player.ma.current!="ba")?1:0 },
		dirBase() { return saveState.player.ba.points.times(10) },
		posGainMult() {
			let mult = new Decimal(1);
			if (gameHelpers.hasUpgrade("ba", 24)) mult = mult.times(gameHelpers.upgradeEffect("ba", 24).pos);
			return mult;
		},
		posGain() { return Decimal.pow(derivedState.tmp.ba.dirBase, (gameHelpers.hasMilestone("hn", 2)&&saveState.player.ma.current!="ba")?1:saveState.player.ba.allotted).times((gameHelpers.hasMilestone("hn", 2)&&saveState.player.ma.current!="ba")?1:(saveState.player.ba.allotted)).times(derivedState.tmp.ba.posGainMult) },
		posBuff() { 
			let eff = saveState.player.ba.pos.plus(1).log10().plus(1).div(derivedState.tmp.ba.negNerf);
			eff = softcapRules.softcap("posBuff", eff);
			return eff;
		},
		noNerfs() {
			return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)
		},
		posNerf() { return derivedState.tmp.ba.noNerfs?new Decimal(1):(saveState.player.ba.pos.plus(1).sqrt().pow(gameHelpers.inChallenge("h", 41)?100:1)) },
		negGainMult() {
			let mult = new Decimal(1);
			if (gameHelpers.hasUpgrade("ba", 24)) mult = mult.times(gameHelpers.upgradeEffect("ba", 24).neg);
			return mult;
		},
		negGain() { return Decimal.pow(derivedState.tmp.ba.dirBase, (gameHelpers.hasMilestone("hn", 2)&&saveState.player.ma.current!="ba")?1:(1-saveState.player.ba.allotted)).times((gameHelpers.hasMilestone("hn", 2)&&saveState.player.ma.current!="ba")?1:(1-saveState.player.ba.allotted)).times(derivedState.tmp.ba.negGainMult) },
		negBuff() { 
			let eff = saveState.player.ba.neg.plus(1).pow((gameHelpers.hasUpgrade("ba", 13))?10:1).div(derivedState.tmp.ba.posNerf);
			eff = softcapRules.softcap("negBuff", eff);
			return eff;
		},
		negNerf() { return derivedState.tmp.ba.noNerfs?new Decimal(1):(saveState.player.ba.neg.plus(1).log10().plus(1).sqrt().pow(gameHelpers.inChallenge("h", 41)?100:1).div(gameHelpers.hasUpgrade("ba", 14)?2:1).max(1)) },
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			"milestones",
			"blank",
			["clickable", 31],
			["row", [["clickable", 21], ["clickable", 11], "blank", ["bar", "balanceBar"], "blank", ["clickable", 12], ["clickable", 22]]],
			["row", [
				["column", [["display-text", function() {return derivedState.tmp.nerdMode?("Gain Formula: "+gameHelpers.format(derivedState.tmp.ba.dirBase)+"^(1-barPercent/100)*(1-barBercent/100)"+(derivedState.tmp.ba.negGainMult.eq(1)?"":("*"+gameHelpers.format(derivedState.tmp.ba.negGainMult)))):("+"+gameHelpers.format(derivedState.tmp.ba.negGain)+"/sec")}, {}], ["display-text", function() {return "Negativity: "+gameHelpers.format(saveState.player.ba.neg)}, {}], ["display-text", function() {return (derivedState.tmp.nerdMode?("Buff Formula: "+((gameHelpers.hasUpgrade("ba", 13))?"(x+1)^10":"x+1")):("Buff: Multiply each Quirk Layer by "+gameHelpers.format(derivedState.tmp.ba.negBuff)))}, {}], ["display-text", function() {return derivedState.tmp.ba.noNerfs?"":(derivedState.tmp.nerdMode?("Nerf Formula: "+(gameHelpers.hasUpgrade("ba", 14)?"sqrt(log(x+1)+1)"+(gameHelpers.inChallenge("h", 41)?"^100":"")+"/2":"sqrt(log(x+1)+1)")):("Nerf: Divide the Positivity buff by "+gameHelpers.format(derivedState.tmp.ba.negNerf)))}, {}], "blank", ["row", [["upgrade", 11], ["upgrade", 13]]]], {"max-width": "240px"}],
				"blank", "blank", "blank", 
				["column", 
				[["display-text", function() {return derivedState.tmp.nerdMode?("Gain Formula: "+gameHelpers.format(derivedState.tmp.ba.dirBase)+"^(barPercent/100)*(barBercent/100)"+(derivedState.tmp.ba.posGainMult.eq(1)?"":("*"+gameHelpers.format(derivedState.tmp.ba.posGainMult)))):("+"+gameHelpers.format(derivedState.tmp.ba.posGain)+"/sec")}, {}], ["display-text", function() {return "Positivity: "+gameHelpers.format(saveState.player.ba.pos)}, {}], ["display-text", function() {return (derivedState.tmp.nerdMode?("Buff Formula: log(x+1)+1"):("Buff: Multiply the Subspace & Time base by "+gameHelpers.format(derivedState.tmp.ba.posBuff)))}, {}], ["display-text", function() {return derivedState.tmp.ba.noNerfs?"":(derivedState.tmp.nerdMode?("Nerf Formula: sqrt(x+1)"+(gameHelpers.inChallenge("h", 41)?"^100":"")):("Nerf: Divide the Negativity buff by "+gameHelpers.format(derivedState.tmp.ba.posNerf)))}, {}], "blank", ["row", [["upgrade", 14], ["upgrade", 12]]]], {"max-width": "240px"}]], {"visibility": function() { return saveState.player.ba.unlocked?"visible":"hidden" }}],
			["row", [["upgrade", 22], ["upgrade", 21], ["upgrade", 23]]],
			["row", [["upgrade", 31], ["upgrade", 24], ["upgrade", 32]]],
			["upgrade", 33],
			"blank", "blank"
		],
		bars: {
			balanceBar: {
				direction: layerRegistry.RIGHT,
				width: 400,
				height: 20,
				progress() { return saveState.player.ba.allotted },
				unlocked() { return saveState.player.ba.unlocked },
				fillStyle() { 
					let r = 235 + (162 - 235) * derivedState.tmp.ba.bars.balanceBar.progress;
					let g = 64 + (249 - 64) * derivedState.tmp.ba.bars.balanceBar.progress;
					let b = 52 + (252 - 52) * derivedState.tmp.ba.bars.balanceBar.progress;
					return {"background-color": ("rgb("+r+", "+g+", "+b+")") } 
				},
				borderStyle() { return {"border-color": "#fced9f"} },
			},
		},
		clickables: {
			rows: 3,
			cols: 2,
			11: {
				title: "-",
				unlocked() { return saveState.player.ba.unlocked },
				canClick() { return saveState.player.ba.allotted>0 },
				onClick() { saveState.player.ba.allotted = Math.max(saveState.player.ba.allotted-0.05, 0) },
				style: {"height": "50px", "width": "50px", "background-color": "rgb(235, 64, 52)"},
			},
			12: {
				title: "+",
				unlocked() { return saveState.player.ba.unlocked },
				canClick() { return saveState.player.ba.allotted<1 },
				onClick() { saveState.player.ba.allotted = Math.min(saveState.player.ba.allotted+0.05, 1) },
				style: {"height": "50px", "width": "50px", "background-color": "rgb(162, 249, 252)"},
			},
			21: {
				title: "&#8592;",
				unlocked() { return saveState.player.ba.unlocked },
				canClick() { return saveState.player.ba.allotted>0 },
				onClick() { saveState.player.ba.allotted = 0 },
				style: {"height": "50px", "width": "50px", "background-color": "rgb(235, 64, 52)"},
			},
			22: {
				title: "&#8594;",
				unlocked() { return saveState.player.ba.unlocked },
				canClick() { return saveState.player.ba.allotted<1 },
				onClick() { saveState.player.ba.allotted = 1 },
				style: {"height": "50px", "width": "50px", "background-color": "rgb(162, 249, 252)"},
			},
			31: {
				title: "C",
				unlocked() { return saveState.player.ba.unlocked },
				canClick() { return saveState.player.ba.allotted!=.5 },
				onClick() { saveState.player.ba.allotted = .5 },
				style: {"height": "50px", "width": "50px", "background-color": "yellow"},
			},
		},
		upgrades: {
			rows: 3,
			cols: 4,
			11: {
				title: "Negative Ion",
				description: "Negativity boosts Solar Power.",
				cost() { return new Decimal(saveState.player.ma.current=="ba"?"1e166666":5e7) },
				currencyDisplayName: "negativity",
				currencyInternalName: "neg",
				currencyLayer: "ba",
				unlocked() { return gameHelpers.hasMilestone("ba", 3) },
				effect() { 
					let ret = saveState.player.ba.neg.plus(1).log10().sqrt().div(10);
					ret = softcapRules.softcap("ba11", ret);
					return ret;
				},
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.ba.upgrades[11].effect.times(100))+"%" },
				formula: "sqrt(log(x+1))*10",
			},
			12: {
				title: "Positive Ion",
				description: "Positivity boosts Space Building Power & all Subspace effects.",
				cost() { return new Decimal(saveState.player.ma.current=="ba"?"1e166666":5e7) },
				currencyDisplayName: "positivity",
				currencyInternalName: "pos",
				currencyLayer: "ba",
				unlocked() { return gameHelpers.hasMilestone("ba", 3) },
				effect() { return softcapRules.softcap("ba12", saveState.player.ba.pos.plus(1).log10().cbrt().div(10)) },
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.ba.upgrades[12].effect.times(100))+"%" },
				formula: "cbrt(log(x+1))*10",
			},
			13: {
				title: "Negative Energy",
				description: "Raise the Negativity buff to the power of 10.",
				cost() { return new Decimal(saveState.player.ma.current=="ba"?"1e189500":25e7) },
				currencyDisplayName: "negativity",
				currencyInternalName: "neg",
				currencyLayer: "ba",
				unlocked() { return gameHelpers.hasMilestone("ba", 3) },
			},
			14: {
				title: "Positive Vibe",
				description: "Halve the Negativity nerf.",
				cost() { return new Decimal(saveState.player.ma.current=="ba"?"1e189500":25e7) },
				currencyDisplayName: "positivity",
				currencyInternalName: "pos",
				currencyLayer: "ba",
				unlocked() { return gameHelpers.hasMilestone("ba", 3) },
			},
			21: {
				title: "Neutral Atom",
				description: "The Hindrance Spirit effect is raised to the power of 8.",
				cost() { return new Decimal(saveState.player.ma.current=="ba"?"1e189500":25e7) },
				unlocked() { return gameHelpers.hasUpgrade("ba", 13)&&gameHelpers.hasUpgrade("ba", 14) },
			},
			22: {
				title: "Negative Mass",
				description: "The Negativity buff also multiplies Hindrance Spirit & Quirk gain.",
				cost() { return new Decimal(saveState.player.ma.current=="ba"?"1e203000":2.5e11) },
				currencyDisplayName: "negativity",
				currencyInternalName: "neg",
				currencyLayer: "ba",
				unlocked() { return gameHelpers.hasUpgrade("ba", 21) },
			},
			23: {
				title: "Complete Plus",
				description: "The Positivity buff also divides the Solarity requirement.",
				cost() { return new Decimal(saveState.player.ma.current=="ba"?"1e203000":2.5e11) },
				currencyDisplayName: "positivity",
				currencyInternalName: "pos",
				currencyLayer: "ba",
				unlocked() { return gameHelpers.hasUpgrade("ba", 21) },
			},
			24: {
				title: "Net Neutrality",
				description: "Positivity and Negativity boost each other's generation.",
				cost() { return new Decimal(saveState.player.ma.current=="ba"?"1e205000":2.5e12) },
				unlocked() { return gameHelpers.hasUpgrade("ba", 22) && gameHelpers.hasUpgrade("ba", 23) },
				effect() { 
					let ret = {
						pos: saveState.player.ba.neg.div(1e12).plus(1).log10().plus(1).pow(gameHelpers.hasUpgrade("ba", 33)?15:5),
						neg: saveState.player.ba.pos.div(1e12).plus(1).log10().plus(1).pow(gameHelpers.hasUpgrade("ba", 33)?15:5),
					} 
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) {
						ret.pos = Decimal.pow(10, ret.pos.log10().pow(1.5));
						ret.neg = Decimal.pow(10, ret.neg.log10().pow(1.5));
					}
					return ret;
				},
				effectDisplay() { return "Pos: "+gameHelpers.format(derivedState.tmp.ba.upgrades[24].effect.pos)+"x, Neg: "+gameHelpers.format(derivedState.tmp.ba.upgrades[24].effect.neg)+"x" },
				formula() { return "Pos: (log(neg/1e12+1)+1)^"+(gameHelpers.hasUpgrade("ba", 33)?15:5)+", Neg: (log(pos/1e12+1)+1)^"+(gameHelpers.hasUpgrade("ba", 33)?15:5) },
				style: {"font-size": "9px"},
			},
			31: {
				title: "Tangible Degeneration",
				description: "The first two Spells use better formulas.",
				cost() { return new Decimal(saveState.player.ma.current=="ba"?"1e205500":1e52) },
				currencyDisplayName: "negativity",
				currencyInternalName: "neg",
				currencyLayer: "ba",
				unlocked() { return gameHelpers.hasChallenge("h", 41) },
			},
			32: {
				title: "Visible Regeneration",
				description: "Positivity multiplies the Super-Generator base.",
				cost() { return new Decimal(saveState.player.ma.current=="ba"?"1e205500":1e52) },
				currencyDisplayName: "positivity",
				currencyInternalName: "pos",
				currencyLayer: "ba",
				unlocked() { return gameHelpers.hasChallenge("h", 41) },
				effect() { 
					let eff = softcapRules.softcap("ba32", saveState.player.ba.pos.plus(1).log10().div(50).plus(1).pow(10));
					if (gameHelpers.hasUpgrade("hn", 44)) eff = eff.times(gameHelpers.upgradeEffect("p", 44));
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) eff = eff.pow(10);
					return eff;
				},
				effectDisplay() { return gameHelpers.format(derivedState.tmp.ba.upgrades[32].effect)+"x" },
				formula: "(log(x+1)/50+1)^10",
				style: {"font-size": "9px"},
			},
			33: {
				title: "True Equality",
				description: "Both <b>Net Neutrality</b> effects are cubed.",
				cost() { return new Decimal(saveState.player.ma.current=="ba"?"1e207500":2.5e51) },
				unlocked() { return gameHelpers.hasChallenge("h", 41) },
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Total Balance Energy",
				done() { return saveState.player.ba.total.gte(2) || (gameHelpers.hasMilestone("hn", 0)) },
				effectDescription: "Gain 100% of Quirks gained every second, and keep Quirk Upgrades on all resets.",
			},
			1: {
				requirementDescription: "3 Total Balance Energy",
				done() { return saveState.player.ba.total.gte(3) || (gameHelpers.hasMilestone("hn", 0)) },
				effectDescription: "Unlock Auto-Quirk Layers.",
				toggles: [["q", "auto"]],
			},
			2: {
				requirementDescription: "10 Total Balance Energy",
				done() { return saveState.player.ba.total.gte(10) || (gameHelpers.hasMilestone("hn", 0)) },
				effectDescription: "Keep Subspace Upgrades on all resets, unlock Auto-Subspace Energy, and Subspace Energy resets nothing.",
				toggles: [["ss", "auto"]],
			},
			3: {
				unlocked() { return gameHelpers.hasMilestone("ba", 2) },
				requirementDescription: "200,000 Total Balance Energy",
				done() { return saveState.player.ba.total.gte(2e5) || (gameHelpers.hasMilestone("hn", 0)) },
				effectDescription: "Unlock Balance Upgrades.",
			},
			4: {
				unlocked() { return gameHelpers.hasMilestone("ba", 3) },
				requirementDescription: "1e12 Total Balance Energy",
				done() { return saveState.player.ba.total.gte(1e12) || (gameHelpers.hasMilestone("hn", 0)) },
				effectDescription: "You can keep Positivity & Negativity on reset.",
				toggles: [["ba", "keepPosNeg"]],
			},
		},
};
}
