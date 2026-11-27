// ba — balance content. Registration: manifest.js.
function createBalanceLayer() {
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
        baseAmount() {return player.q.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?0.0125:0.005) }, // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1);
			if (hasAchievement("a", 74)) mult = mult.times(challengeEffect("h", 32));
			if (player.mc.unlocked) mult = mult.times(clickableEffect("mc", 22));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 4, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "a", description: "Press A to Balance Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			if (!(hasMilestone("ba", 4) && player.ba.keepPosNeg)) {
				player.ba.pos = new Decimal(0);
				player.ba.neg = new Decimal(0);
			}
			if (hasMilestone("hn", 0)) keep.push("milestones")
			if (hasMilestone("hn", 3)) keep.push("upgrades")
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
        layerShown(){return player.q.unlocked&&player.ss.unlocked },
        branches: ["q","ss"],
		update(diff) {
			if (!player.ba.unlocked) return;
			player.ba.pos = player.ba.pos.plus(tmp.ba.posGain.times(diff));
			player.ba.neg = player.ba.neg.plus(tmp.ba.negGain.times(diff));
		},
		passiveGeneration() { return (hasMilestone("hn", 1)&&player.ma.current!="ba")?1:0 },
		dirBase() { return player.ba.points.times(10) },
		posGainMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("ba", 24)) mult = mult.times(upgradeEffect("ba", 24).pos);
			return mult;
		},
		posGain() { return Decimal.pow(tmp.ba.dirBase, (hasMilestone("hn", 2)&&player.ma.current!="ba")?1:player.ba.allotted).times((hasMilestone("hn", 2)&&player.ma.current!="ba")?1:(player.ba.allotted)).times(tmp.ba.posGainMult) },
		posBuff() { 
			let eff = player.ba.pos.plus(1).log10().plus(1).div(tmp.ba.negNerf); 
			eff = softcap("posBuff", eff);
			return eff;
		},
		noNerfs() {
			return ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)
		},
		posNerf() { return tmp.ba.noNerfs?new Decimal(1):(player.ba.pos.plus(1).sqrt().pow(inChallenge("h", 41)?100:1)) },
		negGainMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("ba", 24)) mult = mult.times(upgradeEffect("ba", 24).neg);
			return mult;
		},
		negGain() { return Decimal.pow(tmp.ba.dirBase, (hasMilestone("hn", 2)&&player.ma.current!="ba")?1:(1-player.ba.allotted)).times((hasMilestone("hn", 2)&&player.ma.current!="ba")?1:(1-player.ba.allotted)).times(tmp.ba.negGainMult) },
		negBuff() { 
			let eff = player.ba.neg.plus(1).pow((hasUpgrade("ba", 13))?10:1).div(tmp.ba.posNerf);
			eff = softcap("negBuff", eff);
			return eff;
		},
		negNerf() { return tmp.ba.noNerfs?new Decimal(1):(player.ba.neg.plus(1).log10().plus(1).sqrt().pow(inChallenge("h", 41)?100:1).div(hasUpgrade("ba", 14)?2:1).max(1)) },
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			"milestones",
			"blank",
			["clickable", 31],
			["row", [["clickable", 21], ["clickable", 11], "blank", ["bar", "balanceBar"], "blank", ["clickable", 12], ["clickable", 22]]],
			["row", [
				["column", [["display-text", function() {return tmp.nerdMode?("Gain Formula: "+format(tmp.ba.dirBase)+"^(1-barPercent/100)*(1-barBercent/100)"+(tmp.ba.negGainMult.eq(1)?"":("*"+format(tmp.ba.negGainMult)))):("+"+format(tmp.ba.negGain)+"/sec")}, {}], ["display-text", function() {return "Negativity: "+format(player.ba.neg)}, {}], ["display-text", function() {return (tmp.nerdMode?("Buff Formula: "+((hasUpgrade("ba", 13))?"(x+1)^10":"x+1")):("Buff: Multiply each Quirk Layer by "+format(tmp.ba.negBuff)))}, {}], ["display-text", function() {return tmp.ba.noNerfs?"":(tmp.nerdMode?("Nerf Formula: "+(hasUpgrade("ba", 14)?"sqrt(log(x+1)+1)"+(inChallenge("h", 41)?"^100":"")+"/2":"sqrt(log(x+1)+1)")):("Nerf: Divide the Positivity buff by "+format(tmp.ba.negNerf)))}, {}], "blank", ["row", [["upgrade", 11], ["upgrade", 13]]]], {"max-width": "240px"}], 
				"blank", "blank", "blank", 
				["column", 
				[["display-text", function() {return tmp.nerdMode?("Gain Formula: "+format(tmp.ba.dirBase)+"^(barPercent/100)*(barBercent/100)"+(tmp.ba.posGainMult.eq(1)?"":("*"+format(tmp.ba.posGainMult)))):("+"+format(tmp.ba.posGain)+"/sec")}, {}], ["display-text", function() {return "Positivity: "+format(player.ba.pos)}, {}], ["display-text", function() {return (tmp.nerdMode?("Buff Formula: log(x+1)+1"):("Buff: Multiply the Subspace & Time base by "+format(tmp.ba.posBuff)))}, {}], ["display-text", function() {return tmp.ba.noNerfs?"":(tmp.nerdMode?("Nerf Formula: sqrt(x+1)"+(inChallenge("h", 41)?"^100":"")):("Nerf: Divide the Negativity buff by "+format(tmp.ba.posNerf)))}, {}], "blank", ["row", [["upgrade", 14], ["upgrade", 12]]]], {"max-width": "240px"}]], {"visibility": function() { return player.ba.unlocked?"visible":"hidden" }}],
			["row", [["upgrade", 22], ["upgrade", 21], ["upgrade", 23]]],
			["row", [["upgrade", 31], ["upgrade", 24], ["upgrade", 32]]],
			["upgrade", 33],
			"blank", "blank"
		],
		bars: {
			balanceBar: {
				direction: RIGHT,
				width: 400,
				height: 20,
				progress() { return player.ba.allotted },
				unlocked() { return player.ba.unlocked },
				fillStyle() { 
					let r = 235 + (162 - 235) * tmp.ba.bars.balanceBar.progress;
					let g = 64 + (249 - 64) * tmp.ba.bars.balanceBar.progress;
					let b = 52 + (252 - 52) * tmp.ba.bars.balanceBar.progress;
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
				unlocked() { return player.ba.unlocked },
				canClick() { return player.ba.allotted>0 },
				onClick() { player.ba.allotted = Math.max(player.ba.allotted-0.05, 0) },
				style: {"height": "50px", "width": "50px", "background-color": "rgb(235, 64, 52)"},
			},
			12: {
				title: "+",
				unlocked() { return player.ba.unlocked },
				canClick() { return player.ba.allotted<1 },
				onClick() { player.ba.allotted = Math.min(player.ba.allotted+0.05, 1) },
				style: {"height": "50px", "width": "50px", "background-color": "rgb(162, 249, 252)"},
			},
			21: {
				title: "&#8592;",
				unlocked() { return player.ba.unlocked },
				canClick() { return player.ba.allotted>0 },
				onClick() { player.ba.allotted = 0 },
				style: {"height": "50px", "width": "50px", "background-color": "rgb(235, 64, 52)"},
			},
			22: {
				title: "&#8594;",
				unlocked() { return player.ba.unlocked },
				canClick() { return player.ba.allotted<1 },
				onClick() { player.ba.allotted = 1 },
				style: {"height": "50px", "width": "50px", "background-color": "rgb(162, 249, 252)"},
			},
			31: {
				title: "C",
				unlocked() { return player.ba.unlocked },
				canClick() { return player.ba.allotted!=.5 },
				onClick() { player.ba.allotted = .5 },
				style: {"height": "50px", "width": "50px", "background-color": "yellow"},
			},
		},
		upgrades: {
			rows: 3,
			cols: 4,
			11: {
				title: "Negative Ion",
				description: "Negativity boosts Solar Power.",
				cost() { return new Decimal(player.ma.current=="ba"?"1e166666":5e7) },
				currencyDisplayName: "negativity",
				currencyInternalName: "neg",
				currencyLayer: "ba",
				unlocked() { return hasMilestone("ba", 3) },
				effect() { 
					let ret = player.ba.neg.plus(1).log10().sqrt().div(10);
					ret = softcap("ba11", ret);
					return ret;
				},
				effectDisplay() { return "+"+format(tmp.ba.upgrades[11].effect.times(100))+"%" },
				formula: "sqrt(log(x+1))*10",
			},
			12: {
				title: "Positive Ion",
				description: "Positivity boosts Space Building Power & all Subspace effects.",
				cost() { return new Decimal(player.ma.current=="ba"?"1e166666":5e7) },
				currencyDisplayName: "positivity",
				currencyInternalName: "pos",
				currencyLayer: "ba",
				unlocked() { return hasMilestone("ba", 3) },
				effect() { return softcap("ba12", player.ba.pos.plus(1).log10().cbrt().div(10)) },
				effectDisplay() { return "+"+format(tmp.ba.upgrades[12].effect.times(100))+"%" },
				formula: "cbrt(log(x+1))*10",
			},
			13: {
				title: "Negative Energy",
				description: "Raise the Negativity buff to the power of 10.",
				cost() { return new Decimal(player.ma.current=="ba"?"1e189500":25e7) },
				currencyDisplayName: "negativity",
				currencyInternalName: "neg",
				currencyLayer: "ba",
				unlocked() { return hasMilestone("ba", 3) },
			},
			14: {
				title: "Positive Vibe",
				description: "Halve the Negativity nerf.",
				cost() { return new Decimal(player.ma.current=="ba"?"1e189500":25e7) },
				currencyDisplayName: "positivity",
				currencyInternalName: "pos",
				currencyLayer: "ba",
				unlocked() { return hasMilestone("ba", 3) },
			},
			21: {
				title: "Neutral Atom",
				description: "The Hindrance Spirit effect is raised to the power of 8.",
				cost() { return new Decimal(player.ma.current=="ba"?"1e189500":25e7) },
				unlocked() { return hasUpgrade("ba", 13)&&hasUpgrade("ba", 14) },
			},
			22: {
				title: "Negative Mass",
				description: "The Negativity buff also multiplies Hindrance Spirit & Quirk gain.",
				cost() { return new Decimal(player.ma.current=="ba"?"1e203000":2.5e11) },
				currencyDisplayName: "negativity",
				currencyInternalName: "neg",
				currencyLayer: "ba",
				unlocked() { return hasUpgrade("ba", 21) },
			},
			23: {
				title: "Complete Plus",
				description: "The Positivity buff also divides the Solarity requirement.",
				cost() { return new Decimal(player.ma.current=="ba"?"1e203000":2.5e11) },
				currencyDisplayName: "positivity",
				currencyInternalName: "pos",
				currencyLayer: "ba",
				unlocked() { return hasUpgrade("ba", 21) },
			},
			24: {
				title: "Net Neutrality",
				description: "Positivity and Negativity boost each other's generation.",
				cost() { return new Decimal(player.ma.current=="ba"?"1e205000":2.5e12) },
				unlocked() { return hasUpgrade("ba", 22) && hasUpgrade("ba", 23) },
				effect() { 
					let ret = {
						pos: player.ba.neg.div(1e12).plus(1).log10().plus(1).pow(hasUpgrade("ba", 33)?15:5),
						neg: player.ba.pos.div(1e12).plus(1).log10().plus(1).pow(hasUpgrade("ba", 33)?15:5),
					} 
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) {
						ret.pos = Decimal.pow(10, ret.pos.log10().pow(1.5));
						ret.neg = Decimal.pow(10, ret.neg.log10().pow(1.5));
					}
					return ret;
				},
				effectDisplay() { return "Pos: "+format(tmp.ba.upgrades[24].effect.pos)+"x, Neg: "+format(tmp.ba.upgrades[24].effect.neg)+"x" },
				formula() { return "Pos: (log(neg/1e12+1)+1)^"+(hasUpgrade("ba", 33)?15:5)+", Neg: (log(pos/1e12+1)+1)^"+(hasUpgrade("ba", 33)?15:5) },
				style: {"font-size": "9px"},
			},
			31: {
				title: "Tangible Degeneration",
				description: "The first two Spells use better formulas.",
				cost() { return new Decimal(player.ma.current=="ba"?"1e205500":1e52) },
				currencyDisplayName: "negativity",
				currencyInternalName: "neg",
				currencyLayer: "ba",
				unlocked() { return hasChallenge("h", 41) },
			},
			32: {
				title: "Visible Regeneration",
				description: "Positivity multiplies the Super-Generator base.",
				cost() { return new Decimal(player.ma.current=="ba"?"1e205500":1e52) },
				currencyDisplayName: "positivity",
				currencyInternalName: "pos",
				currencyLayer: "ba",
				unlocked() { return hasChallenge("h", 41) },
				effect() { 
					let eff = softcap("ba32", player.ba.pos.plus(1).log10().div(50).plus(1).pow(10));
					if (hasUpgrade("hn", 44)) eff = eff.times(upgradeEffect("p", 44));
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) eff = eff.pow(10);
					return eff;
				},
				effectDisplay() { return format(tmp.ba.upgrades[32].effect)+"x" },
				formula: "(log(x+1)/50+1)^10",
				style: {"font-size": "9px"},
			},
			33: {
				title: "True Equality",
				description: "Both <b>Net Neutrality</b> effects are cubed.",
				cost() { return new Decimal(player.ma.current=="ba"?"1e207500":2.5e51) },
				unlocked() { return hasChallenge("h", 41) },
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Total Balance Energy",
				done() { return player.ba.total.gte(2) || (hasMilestone("hn", 0)) },
				effectDescription: "Gain 100% of Quirks gained every second, and keep Quirk Upgrades on all resets.",
			},
			1: {
				requirementDescription: "3 Total Balance Energy",
				done() { return player.ba.total.gte(3) || (hasMilestone("hn", 0)) },
				effectDescription: "Unlock Auto-Quirk Layers.",
				toggles: [["q", "auto"]],
			},
			2: {
				requirementDescription: "10 Total Balance Energy",
				done() { return player.ba.total.gte(10) || (hasMilestone("hn", 0)) },
				effectDescription: "Keep Subspace Upgrades on all resets, unlock Auto-Subspace Energy, and Subspace Energy resets nothing.",
				toggles: [["ss", "auto"]],
			},
			3: {
				unlocked() { return hasMilestone("ba", 2) },
				requirementDescription: "200,000 Total Balance Energy",
				done() { return player.ba.total.gte(2e5) || (hasMilestone("hn", 0)) },
				effectDescription: "Unlock Balance Upgrades.",
			},
			4: {
				unlocked() { return hasMilestone("ba", 3) },
				requirementDescription: "1e12 Total Balance Energy",
				done() { return player.ba.total.gte(1e12) || (hasMilestone("hn", 0)) },
				effectDescription: "You can keep Positivity & Negativity on reset.",
				toggles: [["ba", "keepPosNeg"]],
			},
		},
};
}
