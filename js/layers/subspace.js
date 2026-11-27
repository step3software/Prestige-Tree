// ss — subspace content. Registration: manifest.js.
function createSubspaceLayer() {
    return {
        name: "subspace", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "SS", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 3, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			subspace: new Decimal(0),
			auto: false,
			first: 0,
        }},
        color: "#e8ffff",
        requires() { return new Decimal((player[this.layer].unlockOrder>0&&!hasAchievement("a", 62))?30:28) }, // Can be a function that takes requirement increases into account
		roundUpCost: true,
        resource: "subspace energy", // Name of prestige currency
        baseResource: "space energy", // Name of resource prestige is based on
        baseAmount() {return player.s.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.07:1.1) }, // Prestige currency exponent
		base() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.1:1.15) },
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (player.ne.unlocked) mult = mult.div(tmp.ne.thoughtEff1);
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		canBuyMax() { return hasMilestone("hn", 3) },
		effBase() {
			let base = new Decimal(2);
			if (hasUpgrade("ss", 32)) base = base.plus(upgradeEffect("ss", 32));
			if (hasUpgrade("ss", 41)) base = base.plus(buyableEffect("o", 21));
			if (hasUpgrade("e", 31) && player.i.buyables[12].gte(3)) base = base.plus(buyableEffect("e", 11).second);
			
			if (player.ba.unlocked) base = base.times(tmp.ba.posBuff);
			if (tmp.q.impr[42].unlocked) base = base.times(improvementEffect("q", 42));
			if (hasUpgrade("hn", 35)) base = base.times(upgradeEffect("hn", 35));
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) base = base.times(Decimal.pow(1e10, player.ss.points));
			if (player.ne.unlocked) base = base.times(tmp.ne.thoughtEff2);
			
			if (hasUpgrade("t", 41) && player.i.buyables[12].gte(4)) base = base.pow(1.5);
			return base;
		},
		effect() { 
			if (!unl(this.layer)) return new Decimal(1);
			let gain = Decimal.pow(tmp.ss.effBase, player.ss.points).sub(1);
			if (hasUpgrade("ss", 13)) gain = gain.times(upgradeEffect("ss", 13));
			if (player.o.unlocked) gain = gain.times(buyableEffect("o", 13));
			if (player.m.unlocked) gain = gain.times(tmp.m.hexEff);
			return gain;
		},
		autoPrestige() { return player.ss.auto && hasMilestone("ba", 2) && player.ma.current!="ss" },
		effectDescription() {
			return "which are generating "+format(tmp.ss.effect)+" Subspace/sec"+(tmp.nerdMode?("\n\("+format(tmp.ss.effBase)+"x each)"):"")
		},
		update(diff) {
			if (player.ss.unlocked) player.ss.subspace = player.ss.subspace.plus(tmp.ss.effect.times(diff));
		},
        row: 3, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "S", description: "Press Shift+S to Subspace Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		resetsNothing() { return hasMilestone("ba", 2) },
		effPow() {
			let pow = new Decimal(1);
			if (hasUpgrade("ss", 12)) pow = pow.times(upgradeEffect("ss", 12));
			if (hasUpgrade("ba", 12)) pow = pow.times(upgradeEffect("ba", 12).plus(1));
			return pow;
		},
		eff1() { return player.ss.subspace.plus(1).pow(tmp.ss.effPow).log10().pow(3).times(100).floor() },
		eff2() { return player.ss.subspace.plus(1).pow(tmp.ss.effPow).log10().plus(1).log10().div(6) },
		eff3() { return player.ss.subspace.plus(1).pow(tmp.ss.effPow).pow(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?3e3:1e3) },
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			["display-text",
				function() {return 'You have ' + format(player.ss.subspace) + ' Subspace, which is providing '+formatWhole(tmp.ss.eff1)+' extra Space'+(tmp.nerdMode?(" ((log(x+1)^3)*"+format(tmp.ss.effPow.pow(3).times(100))+")"):"")+', makes Space Buildings '+format(tmp.ss.eff2.times(100))+'% stronger'+(tmp.nerdMode?(" (log(log(x+1)*"+format(tmp.ss.effPow)+"+1)/6)"):"")+', and cheapens Space Buildings by '+format(tmp.ss.eff3)+'x.'+(tmp.nerdMode?(" ((x+1)^"+format(tmp.ss.effPow.times(1e3))+")"):"")},
					{}],
			"blank",
			"upgrades",
		],
        increaseUnlockOrder: ["o"],
        doReset(resettingLayer){ 
			let keep = [];
			if (hasMilestone("ba", 2)) keep.push("upgrades");
            if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
        layerShown(){return (player.s.unlocked&&player.h.unlocked)||player.m.unlocked||player.ba.unlocked},
        branches: ["s"],
		upgrades: {
			rows: 4,
			cols: 3,
			11: {
				title: "Spatial Awakening",
				description: "The Space Energy cost base is reduced (1e15 -> 1e10).",
				cost() { return new Decimal((player.ma.current=="ss")?"1e14326":180) },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return player.ss.unlocked },
			},
			12: {
				title: "Subspatial Awakening",
				description: "Subspace Energy boosts all Subspace effects.",
				cost() { return new Decimal((player.ma.current=="ss")?20:2) },
				unlocked() { return hasUpgrade("ss", 11) },
				effect() { 
					let eff = player.ss.points.div(2.5).plus(1).sqrt();
					if (((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) && eff.gte(2)) eff = eff.sub(1).times(100).pow(3).div(1e6).plus(1);
					return eff;
				},
				effectDisplay() { return format(tmp.ss.upgrades[12].effect.sub(1).times(100))+"% stronger" },
				formula: "sqrt(x/2.5)*100",
			},
			13: {
				title: "Emissary of Smash",
				description: "Quirks boost Subspace gain.",
				cost() { return new Decimal((player.ma.current=="ss")?"2e14382":1e3) },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasUpgrade("ss", 11) },
				effect() { return player.q.points.plus(1).log10().div(10).plus(1).pow(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?400:1) },
				effectDisplay() { return format(tmp.ss.upgrades[13].effect)+"x" },
				formula: "log(x+1)/10+1",
			},
			21: {
				title: "Illegal Upgrade",
				description: "Super Boosters & Super Generators are 20% cheaper.",
				cost() { return new Decimal((player.ma.current=="ss")?"1e16708":1e4) },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasUpgrade("ss", 13) },
			},
			22: {
				title: "Underneath The Sun",
				description: "<b>Solar Cores</b> use a better effect formula.",
				cost() { return new Decimal((player.ma.current=="ss")?"1e17768":4e5) },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasUpgrade("ss", 21)&&player.o.unlocked },
			},
			23: {
				title: "Anti-Timeless",
				description: "<b>Timeless</b>'s effect increases over time instead of decreasing.",
				cost() { return new Decimal((player.ma.current=="ss")?"5e17768":1e6) },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasUpgrade("ss", 21)&&player.o.unlocked },
			},
			31: {
				title: "No More Progress",
				description: "Unspent Space provides free Space Buildings.",
				cost() { return new Decimal((player.ma.current=="ss")?1626:42) },
				currencyDisplayName: "space energy",
				currencyInternalName: "points",
				currencyLayer: "s",
				unlocked() { return hasUpgrade("ss", 22)||hasUpgrade("ss", 23) },
				effect() { return tmp.s.space.plus(1).cbrt().sub(1).times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?2:1).floor() },
				effectDisplay() { return "+"+formatWhole(tmp.ss.upgrades[31].effect) },
				formula: "cbrt(x+1)-1",
			},
			32: {
				title: "Beyond Infinity",
				description: "Add to the Subspace Energy & Super-Generator bases based on your Quirk Layers.",
				cost() { return new Decimal((player.ma.current=="ss")?1628:43) },
				currencyDisplayName: "space energy",
				currencyInternalName: "points",
				currencyLayer: "s",
				unlocked() { return hasUpgrade("ss", 31) },
				effect() { return player.q.buyables[11].sqrt().div(1.25) },
				effectDisplay() { return "+"+format(tmp.ss.upgrades[32].effect) },
				formula: "sqrt(x)/1.25",
			},
			33: {
				title: "Timeless Solarity",
				description: "<b>Timeless</b>'s effect is now based on your total time playing this game, and Solar Cores boost Solar Power.",
				cost() { return new Decimal((player.ma.current=="ss")?"1e17796":2.5e7) },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasUpgrade("ss", 23)&&hasUpgrade("ss", 31) },
				effect() { return player.o.buyables[11].plus(1).log10().div(10) },
				effectDisplay() { return "+"+format(tmp.ss.upgrades[33].effect.times(100))+"%" },
				formula: "log(x+1)*10",
				style: {"font-size": "9px"},
			},
			41: {
				title: "More Sun",
				description: "Unlock Coronal Waves.",
				cost() { return new Decimal((player.ma.current=="ss")?1628:46) },
				currencyDisplayName: "space energy",
				currencyInternalName: "points",
				currencyLayer: "s",
				unlocked() { return hasUpgrade("ss", 33) },
			},
			42: {
				title: "Sub-Subspace",
				description: "Space Buildings are 100% stronger (additive).",
				cost() { return new Decimal((player.ma.current=="ss")?"1e17799":"1e936") },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasChallenge("h", 42) },
			},
			43: {
				title: "Challenging Speedup",
				endpoint() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?"e1e11":"e1e6") },
				description() { return "When below "+format(tmp.ss.upgrades[43].endpoint)+", Point gain is raised to the power of 1.1. Otherwise, it is raised to the power of 1.01." },
				cost() { return new Decimal((player.ma.current=="ss")?"1e17800":"1e990") },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasChallenge("h", 42) },
				style: {"font-size": "9px"},
			},
		},
};
}
