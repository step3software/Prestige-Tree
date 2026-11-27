// Session-bound layer owner; composition supplies only the named ports.
// ss — subspace content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'>} ports */
function createSubspaceLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState }) {
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
        requires() { return new Decimal((saveState.player[this.layer].unlockOrder>0&&!gameHelpers.hasAchievement("a", 62))?30:28) }, // Can be a function that takes requirement increases into account
		roundUpCost: true,
        resource: "subspace energy", // Name of prestige currency
        baseResource: "space energy", // Name of resource prestige is based on
        baseAmount() {return saveState.player.s.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.07:1.1) }, // Prestige currency exponent
		base() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.1:1.15) },
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (saveState.player.ne.unlocked) mult = mult.div(derivedState.tmp.ne.thoughtEff1);
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		canBuyMax() { return gameHelpers.hasMilestone("hn", 3) },
		effBase() {
			let base = new Decimal(2);
			if (gameHelpers.hasUpgrade("ss", 32)) base = base.plus(gameHelpers.upgradeEffect("ss", 32));
			if (gameHelpers.hasUpgrade("ss", 41)) base = base.plus(gameHelpers.buyableEffect("o", 21));
			if (gameHelpers.hasUpgrade("e", 31) && saveState.player.i.buyables[12].gte(3)) base = base.plus(gameHelpers.buyableEffect("e", 11).second);
			
			if (saveState.player.ba.unlocked) base = base.times(derivedState.tmp.ba.posBuff);
			if (derivedState.tmp.q.impr[42].unlocked) base = base.times(gameHelpers.improvementEffect("q", 42));
			if (gameHelpers.hasUpgrade("hn", 35)) base = base.times(gameHelpers.upgradeEffect("hn", 35));
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) base = base.times(Decimal.pow(1e10, saveState.player.ss.points));
			if (saveState.player.ne.unlocked) base = base.times(derivedState.tmp.ne.thoughtEff2);
			
			if (gameHelpers.hasUpgrade("t", 41) && saveState.player.i.buyables[12].gte(4)) base = base.pow(1.5);
			return base;
		},
		effect() { 
			if (!gameHelpers.unl(this.layer)) return new Decimal(1);
			let gain = Decimal.pow(derivedState.tmp.ss.effBase, saveState.player.ss.points).sub(1);
			if (gameHelpers.hasUpgrade("ss", 13)) gain = gain.times(gameHelpers.upgradeEffect("ss", 13));
			if (saveState.player.o.unlocked) gain = gain.times(gameHelpers.buyableEffect("o", 13));
			if (saveState.player.m.unlocked) gain = gain.times(derivedState.tmp.m.hexEff);
			return gain;
		},
		autoPrestige() { return saveState.player.ss.auto && gameHelpers.hasMilestone("ba", 2) && saveState.player.ma.current!="ss" },
		effectDescription() {
			return "which are generating "+gameHelpers.format(derivedState.tmp.ss.effect)+" Subspace/sec"+(derivedState.tmp.nerdMode?("\n\("+gameHelpers.format(derivedState.tmp.ss.effBase)+"x each)"):"")
		},
		update(diff) {
			if (saveState.player.ss.unlocked) saveState.player.ss.subspace = saveState.player.ss.subspace.plus(derivedState.tmp.ss.effect.times(diff));
		},
        row: 3, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "S", description: "Press Shift+S to Subspace Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
		resetsNothing() { return gameHelpers.hasMilestone("ba", 2) },
		effPow() {
			let pow = new Decimal(1);
			if (gameHelpers.hasUpgrade("ss", 12)) pow = pow.times(gameHelpers.upgradeEffect("ss", 12));
			if (gameHelpers.hasUpgrade("ba", 12)) pow = pow.times(gameHelpers.upgradeEffect("ba", 12).plus(1));
			return pow;
		},
		eff1() { return saveState.player.ss.subspace.plus(1).pow(derivedState.tmp.ss.effPow).log10().pow(3).times(100).floor() },
		eff2() { return saveState.player.ss.subspace.plus(1).pow(derivedState.tmp.ss.effPow).log10().plus(1).log10().div(6) },
		eff3() { return saveState.player.ss.subspace.plus(1).pow(derivedState.tmp.ss.effPow).pow(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?3e3:1e3) },
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			["display-text",
				function() {return 'You have ' + gameHelpers.format(saveState.player.ss.subspace) + ' Subspace, which is providing '+gameHelpers.formatWhole(derivedState.tmp.ss.eff1)+' extra Space'+(derivedState.tmp.nerdMode?(" ((log(x+1)^3)*"+gameHelpers.format(derivedState.tmp.ss.effPow.pow(3).times(100))+")"):"")+', makes Space Buildings '+gameHelpers.format(derivedState.tmp.ss.eff2.times(100))+'% stronger'+(derivedState.tmp.nerdMode?(" (log(log(x+1)*"+gameHelpers.format(derivedState.tmp.ss.effPow)+"+1)/6)"):"")+', and cheapens Space Buildings by '+gameHelpers.format(derivedState.tmp.ss.eff3)+'x.'+(derivedState.tmp.nerdMode?(" ((x+1)^"+gameHelpers.format(derivedState.tmp.ss.effPow.times(1e3))+")"):"")},
					{}],
			"blank",
			"upgrades",
		],
        increaseUnlockOrder: ["o"],
        doReset(resettingLayer){ 
			let keep = [];
			if (gameHelpers.hasMilestone("ba", 2)) keep.push("upgrades");
            if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
        },
        layerShown(){return (saveState.player.s.unlocked&&saveState.player.h.unlocked)||saveState.player.m.unlocked||saveState.player.ba.unlocked},
        branches: ["s"],
		upgrades: {
			rows: 4,
			cols: 3,
			11: {
				title: "Spatial Awakening",
				description: "The Space Energy cost base is reduced (1e15 -> 1e10).",
				cost() { return new Decimal((saveState.player.ma.current=="ss")?"1e14326":180) },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return saveState.player.ss.unlocked },
			},
			12: {
				title: "Subspatial Awakening",
				description: "Subspace Energy boosts all Subspace effects.",
				cost() { return new Decimal((saveState.player.ma.current=="ss")?20:2) },
				unlocked() { return gameHelpers.hasUpgrade("ss", 11) },
				effect() { 
					let eff = saveState.player.ss.points.div(2.5).plus(1).sqrt();
					if (((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) && eff.gte(2)) eff = eff.sub(1).times(100).pow(3).div(1e6).plus(1);
					return eff;
				},
				effectDisplay() { return gameHelpers.format(derivedState.tmp.ss.upgrades[12].effect.sub(1).times(100))+"% stronger" },
				formula: "sqrt(x/2.5)*100",
			},
			13: {
				title: "Emissary of Smash",
				description: "Quirks boost Subspace gain.",
				cost() { return new Decimal((saveState.player.ma.current=="ss")?"2e14382":1e3) },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return gameHelpers.hasUpgrade("ss", 11) },
				effect() { return saveState.player.q.points.plus(1).log10().div(10).plus(1).pow(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?400:1) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.ss.upgrades[13].effect)+"x" },
				formula: "log(x+1)/10+1",
			},
			21: {
				title: "Illegal Upgrade",
				description: "Super Boosters & Super Generators are 20% cheaper.",
				cost() { return new Decimal((saveState.player.ma.current=="ss")?"1e16708":1e4) },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return gameHelpers.hasUpgrade("ss", 13) },
			},
			22: {
				title: "Underneath The Sun",
				description: "<b>Solar Cores</b> use a better effect formula.",
				cost() { return new Decimal((saveState.player.ma.current=="ss")?"1e17768":4e5) },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return gameHelpers.hasUpgrade("ss", 21)&&saveState.player.o.unlocked },
			},
			23: {
				title: "Anti-Timeless",
				description: "<b>Timeless</b>'s effect increases over time instead of decreasing.",
				cost() { return new Decimal((saveState.player.ma.current=="ss")?"5e17768":1e6) },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return gameHelpers.hasUpgrade("ss", 21)&&saveState.player.o.unlocked },
			},
			31: {
				title: "No More Progress",
				description: "Unspent Space provides free Space Buildings.",
				cost() { return new Decimal((saveState.player.ma.current=="ss")?1626:42) },
				currencyDisplayName: "space energy",
				currencyInternalName: "points",
				currencyLayer: "s",
				unlocked() { return gameHelpers.hasUpgrade("ss", 22)||gameHelpers.hasUpgrade("ss", 23) },
				effect() { return derivedState.tmp.s.space.plus(1).cbrt().sub(1).times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?2:1).floor() },
				effectDisplay() { return "+"+gameHelpers.formatWhole(derivedState.tmp.ss.upgrades[31].effect) },
				formula: "cbrt(x+1)-1",
			},
			32: {
				title: "Beyond Infinity",
				description: "Add to the Subspace Energy & Super-Generator bases based on your Quirk Layers.",
				cost() { return new Decimal((saveState.player.ma.current=="ss")?1628:43) },
				currencyDisplayName: "space energy",
				currencyInternalName: "points",
				currencyLayer: "s",
				unlocked() { return gameHelpers.hasUpgrade("ss", 31) },
				effect() { return saveState.player.q.buyables[11].sqrt().div(1.25) },
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.ss.upgrades[32].effect) },
				formula: "sqrt(x)/1.25",
			},
			33: {
				title: "Timeless Solarity",
				description: "<b>Timeless</b>'s effect is now based on your total time playing this game, and Solar Cores boost Solar Power.",
				cost() { return new Decimal((saveState.player.ma.current=="ss")?"1e17796":2.5e7) },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return gameHelpers.hasUpgrade("ss", 23)&&gameHelpers.hasUpgrade("ss", 31) },
				effect() { return saveState.player.o.buyables[11].plus(1).log10().div(10) },
				effectDisplay() { return "+"+gameHelpers.format(derivedState.tmp.ss.upgrades[33].effect.times(100))+"%" },
				formula: "log(x+1)*10",
				style: {"font-size": "9px"},
			},
			41: {
				title: "More Sun",
				description: "Unlock Coronal Waves.",
				cost() { return new Decimal((saveState.player.ma.current=="ss")?1628:46) },
				currencyDisplayName: "space energy",
				currencyInternalName: "points",
				currencyLayer: "s",
				unlocked() { return gameHelpers.hasUpgrade("ss", 33) },
			},
			42: {
				title: "Sub-Subspace",
				description: "Space Buildings are 100% stronger (additive).",
				cost() { return new Decimal((saveState.player.ma.current=="ss")?"1e17799":"1e936") },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return gameHelpers.hasChallenge("h", 42) },
			},
			43: {
				title: "Challenging Speedup",
				endpoint() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"e1e11":"e1e6") },
				description() { return "When below "+gameHelpers.format(derivedState.tmp.ss.upgrades[43].endpoint)+", Point gain is raised to the power of 1.1. Otherwise, it is raised to the power of 1.01." },
				cost() { return new Decimal((saveState.player.ma.current=="ss")?"1e17800":"1e990") },
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return gameHelpers.hasChallenge("h", 42) },
				style: {"font-size": "9px"},
			},
		},
};
}
