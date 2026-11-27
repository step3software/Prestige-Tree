// Session-bound layer owner; composition supplies only the named ports.
// p — prestige content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'|'softcapRules'>} ports */
function createPrestigeLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState, softcapRules }) {
    return {
        name: "prestige", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "P", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#31aeb0",
        requires: new Decimal(10), // Can be a function that takes requirement increases into account
        resource: "prestige points", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return saveState.player.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?0.75:0.5 }, // Prestige currency exponent
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (gameHelpers.hasAchievement("a", 13)) mult = mult.times(1.1);
			if (gameHelpers.hasAchievement("a", 32)) mult = mult.times(2);
			if (gameHelpers.hasUpgrade("p", 21)) mult = mult.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1e50:1.8);
			if (gameHelpers.hasUpgrade("p", 23)) mult = mult.times(gameHelpers.upgradeEffect("p", 23));
			if (gameHelpers.hasUpgrade("p", 41)) mult = mult.times(gameHelpers.upgradeEffect("p", 41));
			if (gameHelpers.hasUpgrade("b", 11)) mult = mult.times(gameHelpers.upgradeEffect("b", 11));
			if (gameHelpers.hasUpgrade("g", 11)) mult = mult.times(gameHelpers.upgradeEffect("g", 11));
			if (saveState.player.t.unlocked) mult = mult.times(derivedState.tmp.t.enEff);
			if (saveState.player.e.unlocked) mult = mult.times(derivedState.tmp.e.buyables[11].effect.first);
			if (saveState.player.s.unlocked) mult = mult.times(gameHelpers.buyableEffect("s", 11));
			if (gameHelpers.hasUpgrade("e", 12)) mult = mult.times(gameHelpers.upgradeEffect("e", 12));
			if (gameHelpers.hasUpgrade("b", 31)) mult = mult.times(gameHelpers.upgradeEffect("b", 31));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            let exp = new Decimal(1)
			if (gameHelpers.hasUpgrade("p", 31)) exp = exp.times(1.05);
			return exp;
        },
        row: 0, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "p", description: "Press P to Prestige.", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
        layerShown(){return true},
		passiveGeneration() { return (gameHelpers.hasMilestone("g", 1)&&saveState.player.ma.current!="p")?1:0 },
		doReset(resettingLayer) {
			let keep = [];
			if (gameHelpers.hasMilestone("b", 0) && resettingLayer=="b") keep.push("upgrades")
			if (gameHelpers.hasMilestone("g", 0) && resettingLayer=="g") keep.push("upgrades")
			if (gameHelpers.hasMilestone("e", 1) && resettingLayer=="e") keep.push("upgrades")
			if (gameHelpers.hasMilestone("t", 1) && resettingLayer=="t") keep.push("upgrades")
			if (gameHelpers.hasMilestone("s", 1) && resettingLayer=="s") keep.push("upgrades")
			if (gameHelpers.hasAchievement("a", 41)) keep.push("upgrades")
			if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset("p", keep)
		},
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			pseudoUpgs: [],
			first: 0,
		}},
		upgrades: {
			rows: 4,
			cols: 4,
			11: {
				title: "Begin",
				description: "Generate 1 Point every second.",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?2:1).pow(derivedState.tmp.h.costExp11) },
			},
			12: {
				title: "Prestige Boost",
				description: "Prestige Points boost Point generation.",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?10:1).pow(derivedState.tmp.h.costExp11) },
				effect() {
					if (gameHelpers.inChallenge("ne", 11)) return new Decimal(1);
					
					let eff = saveState.player.p.points.plus(2).pow(0.5);
					if (gameHelpers.hasUpgrade("g", 14)) eff = eff.pow(1.5);
					if (gameHelpers.hasUpgrade("g", 24)) eff = eff.pow(1.4666667);
					if (gameHelpers.hasUpgrade("g", 34) && saveState.player.i.buyables[12].gte(2)) eff = eff.pow(1.4333333)
					
					if (gameHelpers.hasChallenge("h", 22)) eff = softcapRules.softcap("p12_h22", eff);
					else eff = softcapRules.softcap("p12", eff);
					
					if (gameHelpers.hasUpgrade("p", 14)) eff = eff.pow(3);
					if (gameHelpers.hasUpgrade("hn", 14)) eff = eff.pow(1.05);
					if (gameHelpers.hasUpgrade("b", 34) && saveState.player.i.buyables[12].gte(1)) eff = eff.pow(gameHelpers.upgradeEffect("b", 34));
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) eff = eff.pow(1.1);
					
					return eff;
				},
				unlocked() { return gameHelpers.hasUpgrade("p", 11) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.p.upgrades[12].effect)+"x" },
				formula() { 
					if (gameHelpers.inChallenge("ne", 11)) return "DISABLED";
				
					let exp = new Decimal(0.5*(gameHelpers.hasUpgrade("g", 14)?1.5:1)*(gameHelpers.hasUpgrade("g", 24)?1.4666667:1));
					if (gameHelpers.hasUpgrade("g", 34) && saveState.player.i.buyables[12].gte(2)) exp = exp.times(1.4333333);
					if (gameHelpers.hasUpgrade("b", 34) && saveState.player.i.buyables[12].gte(1)) exp = exp.times(gameHelpers.upgradeEffect("b", 34));
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) exp = exp.times(1.1);
					let f = "(x+2)^"+gameHelpers.format(exp)
					if (gameHelpers.upgradeEffect("p", 12).gte("1e3500")) {
						if (gameHelpers.hasChallenge("h", 22)) f = "10^(sqrt(log(x+2))*"+gameHelpers.format(Decimal.mul(exp, 3500).sqrt())+")"
						else f = "log(x+2)*"+gameHelpers.format(Decimal.div("1e3500",3500).times(exp))
					}
					if (gameHelpers.hasUpgrade("p", 14)) f += "^"+(gameHelpers.hasUpgrade("hn", 14)?3.15:3)
					return f;
				},
			},
			13: {
				title: "Self-Synergy",
				description: "Points boost their own generation.",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?50:5).pow(derivedState.tmp.h.costExp11) },
				effect() { 
					let eff = saveState.player.points.plus(1).log10().pow(0.75).plus(1);
					if (gameHelpers.hasUpgrade("p", 33)) eff = eff.pow(gameHelpers.upgradeEffect("p", 33));
					if (gameHelpers.hasUpgrade("g", 15)) eff = eff.pow(gameHelpers.upgradeEffect("g", 15));
					if (gameHelpers.hasUpgrade("hn", 13)) eff = eff.pow(gameHelpers.upgradeEffect("hn", 13));
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) eff = eff.pow(75);
					return eff;
				},
				unlocked() { return gameHelpers.hasUpgrade("p", 12) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.p.upgrades[13].effect)+"x" },
				formula() { 
					let exp = new Decimal(1);
					if (gameHelpers.hasUpgrade("p", 33)) exp = exp.times(gameHelpers.upgradeEffect("p", 33));
					if (gameHelpers.hasUpgrade("g", 15)) exp = exp.times(gameHelpers.upgradeEffect("g", 15));
					if (gameHelpers.hasUpgrade("hn", 13)) exp = exp.times(gameHelpers.upgradeEffect("hn", 13));
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) exp = exp.times(75);
					return "(log(x+1)^0.75+1)"+(exp.gt(1)?("^"+gameHelpers.format(exp)):"")
				},
			},
			14: {
				title: "Prestigious Intensity",
				description: "<b>Prestige Boost</b>'s effect is cubed (unaffected by softcap).",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e589":"1e4070000").pow(derivedState.tmp.h.costExp11) },
				pseudoUnl() { return gameHelpers.hasUpgrade("hn", 11) && gameHelpers.hasUpgrade("p", 13) },
				pseudoReq: 'Req: 1e168,000 Prestige Points in the "Productionless" Hindrance',
				pseudoCan() { return saveState.player.p.points.gte("1e168000")&&gameHelpers.inChallenge("h", 42) },
				unlocked() { return saveState.player.p.pseudoUpgs.includes(Number(this.id)) },
			},
			21: {
				title: "More Prestige",
				description() { return "Prestige Point gain is increased by "+(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e52":"80")+"%." },
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1e171:20).pow(derivedState.tmp.h.costExp11) },
				unlocked() { return gameHelpers.hasAchievement("a", 21)&&gameHelpers.hasUpgrade("p", 11) },
			},
			22: {
				title: "Upgrade Power",
				description: "Point generation is faster based on your Prestige Upgrades bought.",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1e262:75).pow(derivedState.tmp.h.costExp11) },
				effect() {
					let eff = Decimal.pow(1.4, saveState.player.p.upgrades.length);
					if (gameHelpers.hasUpgrade("p", 32)) eff = eff.pow(2);
					if (gameHelpers.hasUpgrade("hn", 22)) eff = eff.pow(gameHelpers.upgradeEffect("hn", 22))
					if (gameHelpers.hasUpgrade("hn", 32)) eff = eff.pow(7);
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) eff = eff.pow(40);
					return eff;
				},
				unlocked() { return gameHelpers.hasAchievement("a", 21)&&gameHelpers.hasUpgrade("p", 12) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.p.upgrades[22].effect)+"x" },
				formula() { 
					let exp = new Decimal(gameHelpers.hasUpgrade("p", 32)?2:1);
					if (gameHelpers.hasUpgrade("hn", 22)) exp = exp.times(gameHelpers.upgradeEffect("hn", 22));
					if (gameHelpers.hasUpgrade("hn", 32)) exp = exp.times(7);
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) exp = exp.times(40);
					return exp.gt(1)?("(1.4^x)^"+gameHelpers.format(exp)):"1.4^x"
				},
			},
			23: {
				title: "Reverse Prestige Boost",
				description: "Prestige Point gain is boosted by your Points.",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1e305:5e3).pow(derivedState.tmp.h.costExp11) },
				effect() {
					let eff = saveState.player.points.plus(1).log10().cbrt().plus(1);
					if (gameHelpers.hasUpgrade("p", 33)) eff = eff.pow(gameHelpers.upgradeEffect("p", 33));
					if (gameHelpers.hasUpgrade("g", 23)) eff = eff.pow(gameHelpers.upgradeEffect("g", 23));
					if (gameHelpers.hasUpgrade("hn", 23)) eff = eff.pow(gameHelpers.upgradeEffect("hn", 23));
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) eff = eff.pow(1.5);
					return eff;
				},
				unlocked() { return gameHelpers.hasAchievement("a", 21)&&gameHelpers.hasUpgrade("p", 13) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.p.upgrades[23].effect)+"x" },
				formula() { 
					let exp = new Decimal(1);
					if (gameHelpers.hasUpgrade("p", 33)) exp = exp.times(gameHelpers.upgradeEffect("p", 33));
					if (gameHelpers.hasUpgrade("g", 23)) exp = exp.times(gameHelpers.upgradeEffect("g", 23));
					if (gameHelpers.hasUpgrade("hn", 23)) exp = exp.times(gameHelpers.upgradeEffect("hn", 23));
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) exp = exp.times(1.5);
					return exp.gt(1)?("(log(x+1)^(1/3)+1)^"+gameHelpers.format(exp)):"log(x+1)^(1/3)+1"
				},
			},
			24: {
				title: "Plasmic Energies",
				description: "The Tachoclinal Plasma effect uses a better formula (log(log(x+1)+1)*10+1 -> 10^cbrt(log(x+1))).",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e11435":"e5070000").pow(derivedState.tmp.h.costExp11) },
				pseudoUnl() { return gameHelpers.hasUpgrade("hn", 11) && (gameHelpers.hasUpgrade("p", 14)||gameHelpers.hasUpgrade("p", 23)) },
				pseudoReq: "Req: 41,250 Damned Souls without any Wraiths.",
				pseudoCan() { return saveState.player.ps.souls.gte(41250) && saveState.player.ps.buyables[11].eq(0) },
				unlocked() { return saveState.player.p.pseudoUpgs.includes(Number(this.id)) },
				style: {"font-size": "9px" },
			},
			31: {
				title: "WE NEED MORE PRESTIGE",
				description: "Prestige Point gain is raised to the power of 1.05.",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e316":1e45).pow(derivedState.tmp.h.costExp11) },
				unlocked() { return gameHelpers.hasAchievement("a", 23)&&gameHelpers.hasUpgrade("p", 21) },
			},
			32: {
				title: "Still Useless",
				description: "<b>Upgrade Power</b> is squared.",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e355":1e56).pow(derivedState.tmp.h.costExp11) },
				unlocked() { return gameHelpers.hasAchievement("a", 23)&&gameHelpers.hasUpgrade("p", 22) },
			},
			33: {
				title: "Column Leader",
				description: "Both above upgrades are stronger based on your Total Prestige Points.",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e436":1e60).pow(derivedState.tmp.h.costExp11) },
				effect() { return saveState.player.p.total.plus(1).log10().plus(1).log10().div(5).plus(1).times(gameHelpers.hasUpgrade("hn", 33) ? gameHelpers.upgradeEffect("hn", 33) : 1) },
				unlocked() { return gameHelpers.hasAchievement("a", 23)&&gameHelpers.hasUpgrade("p", 23) },
				effectDisplay() { return "^"+gameHelpers.format(derivedState.tmp.p.upgrades[33].effect) },
				formula() { return gameHelpers.hasUpgrade("hn", 33) ? ("(log(log(x+1)+1)/5+1)*"+gameHelpers.format(gameHelpers.upgradeEffect("hn", 33))) : "log(log(x+1)+1)/5+1" },
			},
			34: {
				title: "Solar Potential",
				description: "Solarity multiplies the Solarity gain exponent.",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e11467":"ee7").pow(derivedState.tmp.h.costExp11) },
				pseudoUnl() { return gameHelpers.hasUpgrade("hn", 11) && (gameHelpers.hasUpgrade("p", 24)||gameHelpers.hasUpgrade("p", 33)) },
				pseudoReq: "Req: 30 Achievements",
				pseudoCan() { return saveState.player.a.achievements.length>=30 },
				unlocked() { return saveState.player.p.pseudoUpgs.includes(Number(this.id)) },
				effect() { return saveState.player.o.points.plus(1).log10().plus(1).log10().plus(1).log10().plus(1).times((gameHelpers.hasUpgrade("hn", 34)) ? gameHelpers.upgradeEffect("hn", 34) : 1) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.p.upgrades[34].effect)+"x" },
				formula: "log(log(log(x+1)+1)+1)+1",
			},
			41: {
				title: "Prestige Recursion",
				description: "Prestige Points boost their own gain.",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e9570":"1e4460000").pow(derivedState.tmp.h.costExp11) },
				pseudoUnl() { return gameHelpers.hasUpgrade("hn", 11) && gameHelpers.hasUpgrade("p", 31) },
				pseudoReq: "Req: 25 Total Honour",
				pseudoCan() { return saveState.player.hn.total.gte(25) },
				unlocked() { return saveState.player.p.pseudoUpgs.includes(Number(this.id)) },
				effect() { 
					let eff = Decimal.pow(10, saveState.player.p.points.plus(1).log10().pow(.8));
					if (gameHelpers.hasUpgrade("hn", 41)) eff = eff.pow(gameHelpers.upgradeEffect("hn", 41));
					return eff;
				},
				effectDisplay() { return gameHelpers.format(derivedState.tmp.p.upgrades[41].effect)+"x" },
				formula() { return "10^(log(x+1)^0.8)"+(gameHelpers.hasUpgrade("hn", 41)?("^"+gameHelpers.format(gameHelpers.upgradeEffect("hn", 41))):"") },
			},
			42: {
				title: "Spatial Awareness",
				description: "Space Building costs scale 50% slower.",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e11445":"e5960000").pow(derivedState.tmp.h.costExp11) },
				pseudoUnl() { return gameHelpers.hasUpgrade("hn", 11) && gameHelpers.hasUpgrade("p", 32) },
				pseudoReq: "Req: 1e100 Solarity",
				pseudoCan() { return saveState.player.o.points.gte(1e100) },
				unlocked() { return saveState.player.p.pseudoUpgs.includes(Number(this.id)) },
			},
			43: {
				title: "Booster Potential",
				description: "Quirk Energy also affects the Booster effect.",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e11467":"e8888888").pow(derivedState.tmp.h.costExp11) },
				pseudoUnl() { return gameHelpers.hasUpgrade("hn", 11) && gameHelpers.hasUpgrade("p", 33) },
				pseudoReq: "Req: e10,000,000 Points",
				pseudoCan() { return saveState.player.points.gte("ee7") },
				unlocked() { return saveState.player.p.pseudoUpgs.includes(Number(this.id)) },
			},
			44: {
				title: "Spelling Dictionary",
				description: "The softcaps for the first two Spells start later based on your Boosters.",
				cost() { return derivedState.tmp.h.costMult11.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e11456":"e6500000").pow(derivedState.tmp.h.costExp11) },
				pseudoUnl() { return gameHelpers.hasUpgrade("hn", 11) && gameHelpers.hasUpgrade("p", 33) },
				pseudoReq: "Req: 150,000 Primary Space Buildings",
				pseudoCan() { return saveState.player.s.buyables[11].gte(1.5e5) },
				unlocked() { return saveState.player.p.pseudoUpgs.includes(Number(this.id)) },
				effect() { return saveState.player.b.points.plus(1).pow(3) },
				effectDisplay() { return gameHelpers.format(derivedState.tmp.p.upgrades[44].effect)+"x later" },
				formula: "(x+1)^3",
				style: {"font-size": "9px"},
			},
		},
};
}
