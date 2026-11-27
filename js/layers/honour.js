// hn — honour content. Registration: manifest.js.
function createHonourLayer() {
    return {
		name: "honour", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "HN", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 2, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			first: 0,
        }},
        color: "#ffbf00",
		nodeStyle() {return {
			"background-color": (((player.hn.unlocked||canReset("hn"))&&!(Array.isArray(tmp.ma.canBeMastered)&&player.ma.selectionActive&&tmp[this.layer].row<tmp.ma.rowLimit&&!tmp.ma.canBeMastered.includes(this.layer)))?"#ffbf00":"#bf8f8f"),
        }},
        resource: "honour", // Name of prestige currency
        type: "custom", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		baseResource: "magic and balance energy",
		baseAmount() { return new Decimal(0) },
		req: {m: new Decimal(1e150), ba: new Decimal(1e179)},
		requires() { return this.req },
		exp() { return {m: new Decimal(0.025), ba: new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?0.05:0.02)} },
		exponent() { return tmp[this.layer].exp },
		gainMult() {
			let mult = new Decimal(1);
			if (player.n.buyables[11].gte(1)) mult = mult.times(buyableEffect("o", 22));
			if (hasAchievement("a", 91)) mult = mult.times(1.1);
			if (hasUpgrade("g", 35) && player.i.buyables[12].gte(2)) mult = mult.times(upgradeEffect("g", 35));
			if (hasUpgrade("s", 35) && player.i.buyables[12].gte(5)) mult = mult.times(upgradeEffect("s", 35));
			if (player.ma.unlocked) mult = mult.times(tmp.ma.effect);
			return mult;
		},
		getResetGain() {
			let gain = player.m.points.div(tmp.hn.req.m).pow(tmp.hn.exp.m).times(player.ba.points.div(tmp.hn.req.ba).pow(tmp.hn.exp.ba));
			if (gain.gte(1e5)) gain = softcap("HnG", gain);
			return gain.times(tmp.hn.gainMult).floor();
		},
		resetGain() { return this.getResetGain() },
		getNextAt() {
			let gain = tmp.hn.getResetGain.div(tmp.hn.gainMult)
			gain = reverse_softcap("HnG", gain).plus(1);
			let next = {m: gain.sqrt().root(tmp.hn.exp.m).times(tmp.hn.req.m), ba: gain.sqrt().root(tmp.hn.exp.ba).times(tmp.hn.req.ba)};
			return next;
		},
		passiveGeneration() { return (hasMilestone("ma", 1)&&player.ma.current!="hn")?1:0 },
		canReset() {
			return player.m.points.gte(tmp.hn.req.m) && player.ba.points.gte(tmp.hn.req.ba) && tmp.hn.getResetGain.gt(0) 
		},
		dispGainFormula() {
			let vars = ["m", "ba"]
			let txt = "";
			for (let i=0;i<vars.length;i++) {
				let layer = vars[i];
				let start = tmp.hn.req[layer];
				let exp = tmp.hn.exp[layer];
				if (i>0) txt += ", "
				txt += layer.toUpperCase()+": (x / "+format(start)+")^"+format(exp)
			}
			return txt;
		},
		prestigeButtonText() {
			if (tmp.nerdMode) return "Gain Formula: "+tmp.hn.dispGainFormula;
			else return `${ player.hn.points.lt(1e3) ? (tmp.hn.resetDescription !== undefined ? tmp.hn.resetDescription : "Reset for ") : ""}+<b>${formatWhole(tmp.hn.getResetGain)}</b> ${tmp.hn.resource} ${tmp.hn.resetGain.lt(100) && player.hn.points.lt(1e3) ? `<br><br>Next at ${ ('Magic: '+format(tmp.hn.nextAt.m)+', Balance Energy: '+format(tmp.hn.nextAt.ba))}` : ""}`
		},
		prestigeNotify() {
			if (!canReset("hn")) return false;
			if (tmp.hn.getResetGain.gte(player.hn.points.times(0.1).max(1)) && !tmp.hn.passiveGeneration) return true;
			else return false;
		},
		tooltip() { return formatWhole(player.hn.points)+" Honour" },
		tooltipLocked() { return "Reach "+formatWhole(tmp.hn.req.m)+" Magic & "+formatWhole(tmp.hn.req.ba)+" Balance Energy to unlock (You have "+formatWhole(player.m.points)+" Magic & "+formatWhole(player.ba.points)+" Balance Energy)" },
        row: 5, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "H", description: "Press Shift+H to Honour Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			if (hasMilestone("ma", 1)) {
				keep.push("milestones")
				keep.push("upgrades")
			}
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
        layerShown(){return player.m.unlocked&&player.ba.unlocked },
        branches: ["m","ba"],
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			["display-text", function() { return player.hn.unlocked?("You have "+formatWhole(player.p.points)+" Prestige Points"):"" }],
			"blank",
			"milestones",
			"blank",
			"upgrades"
		],
		milestones: {
			0: {
				requirementDescription: "1 Total Honour",
				done() { return player.hn.total.gte(1) },
				effectDescription: "Always have all Magic/Balance milestones.",
			},
			1: {
				requirementDescription: "2 Total Honour",
				done() { return player.hn.total.gte(2) },
				effectDescription: "Gain 100% of Magic & Balance Energy every second.",
			},
			2: {
				requirementDescription: "3 Total Honour",
				done() { return player.hn.total.gte(3) },
				effectDescription: "The Balance bar behaves as if it is always at the two extremes, and unlock Auto-Spells.",
				toggles: [["m", "auto"]],
			},
			3: {
				requirementDescription: "4 Total Honour",
				done() { return player.hn.total.gte(4) },
				effectDescription: "You can buy max Subspace Energy, and keep Balance Upgrades on all resets.",
			},
			4: {
				requirementDescription: "5 Total Honour",
				done() { return player.hn.total.gte(5) },
				effectDescription: "Buying Wraiths does not spend Phantom Souls or Damned Souls, and unlock Auto-Phantom Souls.",
				toggles: [["ps", "auto"]],
			},
			5: {
				requirementDescription: "6 Total Honour",
				done() { return player.hn.total.gte(6) },
				effectDescription: "Unlock Auto-Wraiths.",
				toggles: [["ps", "autoW"]],
			},
			6: {
				requirementDescription: "10 Total Honour",
				done() { return player.hn.total.gte(10) },
				effectDescription: "Phantom Souls reset nothing.",
			},
			7: {
				requirementDescription: "100,000 Total Honour & e11,000,000 Prestige Points",
				unlocked() { return hasMilestone("hn", 6) },
				done() { return player.hn.total.gte(1e5) && player.p.points.gte("e11000000") },
				effectDescription: "Unlock Phantom Boosters & more Honour Upgrades.",
			},
			8: {
				requirementDescription: "1e30 Total Honour",
				unlocked() { return hasMilestone("hn", 7) && hasUpgrade("hn", 15) },
				done() { return player.hn.total.gte(1e30) },
				effectDescription: "You can activate all 3 secondary Dust effects at once.",
			},
			9: {
				requirementDescription: "1e300 Total Honour",
				unlocked() { return hasMilestone("hn", 8) },
				done() { return player.hn.total.gte(1e300) },
				effectDescription: "You can buy max Phantom Souls.",
			},
		},
		upgrades: {
			rows: 5,
			cols: 5,
			11: {
				title: "Begin Again",
				description: "You can explore further Prestige Upgrades.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e1000":4) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"ee10":"1e4000000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 11) },
			},
			12: {
				title: "Honour Boost",
				description: "<b>Prestige Boost</b>'s softcap starts later based on your Total Honour.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e6800":1) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e4.175e10":"1e1000000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 12) },
				effect() { return softcap("hn12", player.hn.total.plus(1).pow(1e4)) },
				effectDisplay() { return format(tmp.hn.upgrades[12].effect)+"x later" },
				formula: "(x+1)^1e4",
			},
			13: {
				title: "Self-Self-Synergy",
				description: "<b>Self-Synergy</b> is stronger based on its effect.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e7000":2) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e4.5e10":"1e3900000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 13) },
				effect() { return tmp.p.upgrades[13].effect.max(1).log10().plus(1).log10().times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("hn"):false)?200:40).plus(1) },
				effectDisplay() { return "^"+format(tmp.hn.upgrades[13].effect) },
				formula: "log(log(x+1)+1)*40+1",
			},
			14: {
				title: "Anti-Calm",
				description: "<b>Prestigious Intensity</b>'s effect is 5% stronger.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e7010":1e5) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e4.55e10":"1e11000000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 14) && hasMilestone("hn", 7) },
			},
			15: {
				title: "Lightspeed Black Hole",
				description: "You can activate two secondary Dust effects at once.",
				multiRes: [
					{
						cost: new Decimal(3.5e10),
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("1e30000000"),
					},
				],
				unlocked() { return hasUpgrade("hn", 53) && hasUpgrade("hn", 54) && player.n.unlocked },
			},
			21: {
				title: "Point Efficiency",
				description: "<b>Prestige Boost</b>'s softcap is weaker based on your Hexes.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e7025":25) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e4.58e10":"1e4700000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 21) },
				cap() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("hn"):false)?.92:.9) },
				effect() { return player.m.hexes.plus(1).log10().plus(1).log10().times(0.15).min(tmp.hn.upgrades[this.id].cap) },
				effectDisplay() { return format(tmp.hn.upgrades[21].effect.times(100))+"% weaker"+(tmp.hn.upgrades[21].effect.gte(tmp.hn.upgrades[this.id].cap)?" (MAXED)":"") },
				formula() { return "log(log(x+1)+1)*15, maxed at "+format(tmp.hn.upgrades[this.id].cap.times(100))+"%" },
			},
			22: {
				title: "Superpowered Upgrades",
				description: "<b>Upgrade Power</b> is stronger based on your Damned Souls.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e12640":4) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e6e11":"1e4000000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 22) },
				effect() { return Decimal.pow(10, player.ps.souls.plus(1).log10().plus(1).log10().sqrt().times(5)).times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("hn"):false)?3:1) },
				effectDisplay() { return "^"+format(tmp.hn.upgrades[22].effect) },
				formula: "10^(sqrt(log(log(x+1)+1))*5)",
			},
			23: {
				title: "Reversal Sensational",
				description: "<b>Reverse Prestige Boost</b> is stronger based on your Balance Energy.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e12625":100) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e6e11":"1e5400000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 23) },
				effect() { return player.ba.points.plus(1).log10().plus(1).pow(.75).times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("hn"):false)?1.1:1) },
				effectDisplay() { return "^"+format(tmp.hn.upgrades[23].effect) },
				formula: "(log(x+1)+1)^0.75",
			},
			24: {
				title: "Coronal Energies",
				description: "Both Coronal Wave effects are doubled (unaffected by softcap).",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e12645":1.5e5) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e6.05e11":"1e12000000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 24) && hasMilestone("hn", 7) },
			},
			25: {
				title: "Imploded Hypernova",
				description: "Hyperspace Energy & Nebula Energy multiply the Solarity gain exponent & Dust gain.",
				multiRes: [
					{
						cost: new Decimal(5e10),
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("1e32500000"),
					},
				],
				unlocked() { return hasUpgrade("hn", 53) && hasUpgrade("hn", 54) && player.n.unlocked && player.hs.unlocked },
				effect() { return player.hs.points.times(player.n.points.pow(3)).plus(1).log10().plus(1).log10().plus(1) },
				effectDisplay() { return format(tmp.hn.upgrades[25].effect)+"x" },
				formula: "log(log(HS*(N^3)+1)+1)+1",
				style: {"font-size": "9px"},
			},
			31: {
				title: "Exponential Drift",
				description: "Point gain is raised to the power of 1.05.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e12650":64) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e6.06e11":"1e5600000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 31) },
			},
			32: {
				title: "Less Useless",
				description: "<b>Upgrade Power</b> is raised ^7.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e12800":1e4) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e6.3e11":"1e10250000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 32) },
			},
			33: {
				title: "Column Leader Leader",
				description: "<b>Column Leader</b> is stronger based on your Best Honour.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e12900":500) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e6.325e11":"1e6900000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 33) },
				effect() { return Decimal.pow(10, player.hn.best.plus(1).log10().plus(1).log10().sqrt()).times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("hn"):false)?1.1:1) },
				effectDisplay() { return format(tmp.hn.upgrades[33].effect)+"x" },
				formula: "10^sqrt(log(log(x+1)+1))",
			},
			34: {
				title: "Solar Exertion",
				description: "The <b>Solar Potential</b> effect is boosted by your Total Honour.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e12820":5e5) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e6.32e11":"1e12500000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 34) && hasMilestone("hn", 7) },
				effect() { return player.hn.total.plus(1).log10().plus(1).log10().plus(1).log10().plus(1) },
				effectDisplay() { return format(tmp.hn.upgrades[34].effect)+"x" },
				formula: "log(log(log(x+1)+1)+1)+1",
			},
			35: {
				title: "Below Death",
				description: "Purple & Blue Dust multiply the Subspace base.",
				multiRes: [
					{
						cost: new Decimal(1.5e13),
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("1e40000000"),
					},
				],
				unlocked() { return hasUpgrade("hn", 53) && hasUpgrade("hn", 54) && player.n.unlocked },
				effect() { return player.n.purpleDust.times(player.n.blueDust).plus(1).pow(10) },
				effectDisplay() { return format(tmp.hn.upgrades[35].effect)+"x" },
				formula: "(B*P+1)^10",
			},
			41: {
				title: "Again and Again",
				description: "<b>Prestige Recursion</b> is stronger based on your Phantom Power.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e13050":1e5) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e6.75e11":"1e11000000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 41) && hasMilestone("hn", 7) },
				effect() { return player.ps.power.plus(1).log10().plus(1).log10().times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("hn"):false)?4.8:2.4).plus(1) },
				effectDisplay() { return "^"+format(tmp.hn.upgrades[41].effect) },
				formula: "log(log(x+1)+1)*2.4+1",
				style: {"font-size": "9px"},
			},
			42: {
				title: "Spatial Awareness II",
				description: "Space Building costs scale 20% slower.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e13100":1.5e5) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e6.8e11":"1e12000000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 42) && hasMilestone("hn", 7) },
			},
			43: {
				title: "Quir-cursion",
				description: "Quirk Energy boosts Quirk gain at a reduced rate.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e14300":5e5) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e6.9e11":"1e12500000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 43) && hasMilestone("hn", 7) },
				effect() { return Decimal.pow(10, tmp.q.enEff.max(1).log10().root(1.8)).pow(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("hn"):false)?50:1) },
				effectDisplay() { return format(tmp.hn.upgrades[43].effect)+"x" },
				formula() { return "10^(log(quirkEnergyEff)^"+((hasUpgrade("t", 35) && player.i.buyables[12].gte(4))?"0.565":"0.556")+")" },
			},
			44: {
				title: "Numerical Lexicon",
				description: "<b>Spelling Dictionary</b> also affects <b>Visible Regeneration</b> (a Balance Upgrade)'s effect (unaffected by softcap).",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e14275":5e5) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e6.95e11":"1e12500000") },
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 44) && hasMilestone("hn", 7) },
				style: {"font-size": "8px"},
			},
			45: {
				title: "Under the Fridge",
				description: "Blue & Orange Dust multiply Nebula Energy gain.",
				multiRes: [
					{
						cost: new Decimal(1e14),
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("1e42500000"),
					},
				],
				unlocked() { return hasUpgrade("hn", 53) && hasUpgrade("hn", 54) && player.n.unlocked },
				effect() { return player.n.blueDust.times(player.n.orangeDust).plus(1).log10().plus(1).pow(3) },
				effectDisplay() { return format(tmp.hn.upgrades[45].effect)+"x" },
				formula: "(log(B*O+1)+1)^3",
			},
			51: {
				title: "Ghostly Reduction",
				description: "The Ghost Spirit cost is divided based on your Total Honour, and cost scales half as fast.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e14500":1e6) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e6.975e11":"1e12800000") },
					},
				],
				unlocked() { return player.hn.upgrades.length>=16 },
				effect() { return player.hn.total.plus(1).pow(5) },
				effectDisplay() { return "/"+format(tmp.hn.upgrades[51].effect) },
				formula: "(x+1)^5",
				style: {"font-size": "8px"},
			},
			52: {
				title: "Circular Growth",
				description: "<b>Tachoclinal Plasma</b> affects the Super-Generator base.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e30000":1e7) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost() { return new Decimal(player.ma.current=="hn"?"e7.5e11":"e16000000") },
					},
				],
				unlocked() { return player.hn.upgrades.length>=16 && (player.n.unlocked||player.hs.unlocked) },
				style: {"font-size": "9px"},
			},
			53: {
				title: "Nebulaic Luminosity",
				description: "There are 3 new Nebula Dust effects, but you can only have 1 active at a time, and keep dusts on Row 6 resets.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e40000":2.5e7) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("e17250000"),
					},
				],
				unlocked() { return hasUpgrade("hn", 52) && player.n.unlocked },
				style: {"font-size": "9px"},
			},
			54: {
				title: "Hypersonic Masterpiece",
				description: "Hyper Buildings are stronger based on your Total Hyperspace Energy.",
				multiRes: [
					{
						cost() { return new Decimal(player.ma.current=="hn"?"1e40000":2.5e7) },
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("e17250000"),
					},
				],
				unlocked() { return hasUpgrade("hn", 52) && player.hs.unlocked },
				style: {"font-size": "9px"},
				effect() { return player.hs.total.pow(2).plus(1).log10().plus(1).log10().plus(1).log10().times(4).plus(1) },
				effectDisplay() { return format(tmp.hn.upgrades[54].effect.sub(1).times(100))+"% stronger" },
				formula: "log(log(log(x^2+1)+1)+1)*400",
			},
			55: {
				title: "Beneath The Sun",
				description: "Orange & Purple Dust boost Solar Power.",
				multiRes: [
					{
						cost: new Decimal(2.5e14),
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("1e45000000"),
					},
				],
				unlocked() { return hasUpgrade("hn", 53) && hasUpgrade("hn", 54) && player.n.unlocked },
				effect() { return player.n.orangeDust.times(player.n.purpleDust).plus(1).log10() },
				effectDisplay() { return "+"+format(tmp.hn.upgrades[55].effect.times(100))+"%" },
				formula: "log(O*P+1)*100",
			},
		},
};
}
