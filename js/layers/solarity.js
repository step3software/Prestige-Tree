// Session-bound layer owner; composition supplies only the named ports.
// o — solarity content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'|'softcapRules'>} ports */
function createSolarityLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState, softcapRules }) {
    return {
	name: "solarity", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "O", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			energy: new Decimal(0),
			first: 0,
        }},
		increaseUnlockOrder: ["ss"],
		roundUpCost: true,
        color: "#ffcd00",
		nodeStyle() {return {
			"background": (((saveState.player.o.unlocked||gameRules.canReset("o"))&&!(Array.isArray(derivedState.tmp.ma.canBeMastered)&&saveState.player.ma.selectionActive&&derivedState.tmp[this.layer].row<derivedState.tmp.ma.rowLimit&&!derivedState.tmp.ma.canBeMastered.includes(this.layer))))?((saveState.player.grad&&!saveState.player.oldStyle)?"radial-gradient(#ffcd00, #ff4300)":"#ff8200"):"#bf8f8f" ,
        }},
		componentStyles: {
			"prestige-button"() {return { "background": (gameRules.canReset("o"))?((saveState.player.grad&&!saveState.player.oldStyle)?"radial-gradient(#ffcd00, #ff4300)":"#ff8200"):"#bf8f8f" }},
		},
        requires() { 
			let req = new Decimal((saveState.player[this.layer].unlockOrder>0&&!gameHelpers.hasAchievement("a", 62))?16:14).sub(derivedState.tmp.o.solEnEff);
			if (gameHelpers.hasUpgrade("ba", 23)) req = req.div(derivedState.tmp.ba.posBuff.max(1));
			return req;
		},
        resource: "solarity", // Name of prestige currency
        baseResource: "super boosters", // Name of resource prestige is based on
        baseAmount() {return saveState.player.sb.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { 
			let exp = new Decimal(10);
			if (gameHelpers.hasUpgrade("p", 34)) exp = exp.times(gameHelpers.upgradeEffect("p", 34));
			if (gameHelpers.hasUpgrade("hn", 25)) exp = exp.times(gameHelpers.upgradeEffect("hn", 25));
			if (saveState.player.n.buyables[11].gte(4)) exp = exp.times(gameHelpers.buyableEffect("o", 32));
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) exp = exp.times(saveState.player.sb.points.times(0.5/100).plus(1))
			if (saveState.player.en.unlocked) exp = exp.plus(derivedState.tmp.en.owEff);
			return exp;
		}, // Prestige currency exponent
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = gameHelpers.buyableEffect("o", 11);
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1);
        },
        row: 3, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "o", description: "Press O to Solarity Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			saveState.player.q.time = new Decimal(0);
			saveState.player.q.energy = new Decimal(0);
			if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
        },
        layerShown(){return (saveState.player.sb.unlocked&&saveState.player.h.unlocked)||saveState.player.m.unlocked||saveState.player.ba.unlocked },
        branches: ["sb", "t"],
		effect() { 
			if (!gameHelpers.unl(this.layer)) return new Decimal(0);
			let sol = saveState.player.o.points;
			sol = softcapRules.softcap("sol_eff", sol);
			let eff = sol.plus(1).log10();
			let cap = 0.1;
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) cap = 0.15;
			if (eff.gt(10)) eff = eff.log10().times(3).plus(7)
			return eff.div(100).min(cap);
		},
		effect2() { return saveState.player.o.points.div(1e20).plus(1).sqrt().pow(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.1:1) },
		solEnGain() { 
			let gain = saveState.player.t.energy.max(1).pow(derivedState.tmp.o.effect).times(derivedState.tmp.o.effect2).sub(1);
			if (saveState.player.m.unlocked) gain = gain.times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("m"):false)?derivedState.tmp.m.mainHexEff:derivedState.tmp.m.hexEff);
			if (derivedState.tmp.q.impr[41].unlocked) gain = gain.times(gameHelpers.improvementEffect("q", 41));
			return gain;
		},
		solEnEff() { return Decimal.sub(4, Decimal.div(4, saveState.player.o.energy.plus(1).log10().plus(1))) },
		solEnEff2() { return saveState.player.o.energy.plus(1).pow(2) },
		effectDescription() { return "which are generating "+(derivedState.tmp.nerdMode?("(timeEnergy^"+gameHelpers.format(derivedState.tmp.o.effect)+(derivedState.tmp.o.effect.gt(1.01)?("*"+gameHelpers.format(derivedState.tmp.o.effect2)):"")+"-1)"):gameHelpers.format(derivedState.tmp.o.solEnGain))+" Solar Energy every second." },
		update(diff) {
			saveState.player.o.energy = saveState.player.o.energy.plus(derivedState.tmp.o.solEnGain.times(diff));
			if (gameHelpers.hasMilestone("m", 0) && saveState.player.ma.current!="o") {
				for (let i in derivedState.tmp.o.buyables) if (i!="rows" && i!="cols") if (derivedState.tmp.o.buyables[i].unlocked) saveState.player.o.buyables[i] = saveState.player.o.buyables[i].plus(derivedState.tmp.o.buyables[i].gain.times(diff));
			}
		},
		passiveGeneration() { return saveState.player.ma.current=="o"?0:(gameHelpers.hasMilestone("m", 0)?1:(gameHelpers.hasMilestone("o", 0)?0.05:0)) },
		solPow() {
			let pow = new Decimal(1);
			if (gameHelpers.hasUpgrade("ss", 33)) pow = pow.plus(gameHelpers.upgradeEffect("ss", 33));
			if (gameHelpers.hasUpgrade("ss", 41)) pow = pow.plus(gameHelpers.buyableEffect("o", 21));
			if (gameHelpers.hasUpgrade("ba", 11)) pow = pow.plus(gameHelpers.upgradeEffect("ba", 11));
			if (gameHelpers.hasUpgrade("hn", 55)) pow = pow.plus(gameHelpers.upgradeEffect("hn", 55));
			if (saveState.player.n.buyables[11].gte(5)) pow = pow.plus(gameHelpers.buyableEffect("o", 33));
			if (derivedState.tmp.ps.impr[11].unlocked) pow = pow.times(derivedState.tmp.ps.impr[11].effect);
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) pow = pow.plus(saveState.player.o.points.plus(1).log10().div(5));
			return softcapRules.softcap("solPow", pow);
		},
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			["display-text",
				function() {return 'You have ' + gameHelpers.format(saveState.player.o.energy) + ' Solar Energy, which is reducing the Solarity requirement by '+gameHelpers.format(derivedState.tmp.o.solEnEff)+(derivedState.tmp.nerdMode?(" (4-4/(log(x+1)+1))"):"")+' and multiplies the Time Energy limit by '+gameHelpers.format(derivedState.tmp.o.solEnEff2)+'.'+(derivedState.tmp.nerdMode?(" (x+1)^2"):"")},
					{}],
			"blank",
			"milestones",
			"blank",
			["display-text",
				function() { return "<b>Solar Power: "+gameHelpers.format(derivedState.tmp.o.solPow.times(100))+"%</b><br>" },
					{}],
			"buyables",
			"blank"
		],
		multiplyBuyables() {
			let mult = derivedState.tmp.n.dustEffs.orange;
			return mult;
		},
		buyableGainExp() {
			let exp = new Decimal(1);
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) exp = exp.times(2.6);
			return exp;
		},
		buyables: {
			rows: 3,
			cols: 3,
			11: {
				title: "Solar Cores",
				gain() { return saveState.player.o.points.div(2).root(1.5).pow(derivedState.tmp.o.buyableGainExp).floor() },
				effect() { 
					let amt = saveState.player[this.layer].buyables[this.id].times(derivedState.tmp.o.multiplyBuyables)
					amt = softcapRules.softcap("solCores2", softcapRules.softcap("solCores", amt));
					return Decimal.pow(gameHelpers.hasUpgrade("ss", 22)?(amt.plus(1).pow(derivedState.tmp.o.solPow).cbrt()):(amt.plus(1).pow(derivedState.tmp.o.solPow).log10().plus(1)), ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.1:1)
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
					let x = saveState.player[this.layer].buyables[this.id].gte(5e4)?"10^(sqrt(log(x)*log(5e4)))":"x"
                    let display = ("Sacrifice all of your Solarity for "+gameHelpers.formatWhole(derivedState.tmp[this.layer].buyables[this.id].gain)+" Solar Cores\n"+
					"Req: 2 Solarity\n"+
					"Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+((derivedState.tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+gameHelpers.format(derivedState.tmp.o.multiplyBuyables))))+"\n"+
					(derivedState.tmp.nerdMode?("Formula: "+(gameHelpers.hasUpgrade("ss", 22)?"cbrt("+x+"+1)":"log("+x+"+1)+1")+""):("Effect: Multiplies Solarity gain by "+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() { return saveState.player.o.points.gte(2) },
                buy() { 
                    saveState.player.o.points = new Decimal(0);
					saveState.player.o.buyables[this.id] = saveState.player.o.buyables[this.id].plus(derivedState.tmp[this.layer].buyables[this.id].gain);
                },
                buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px'},
				autoed() { return gameHelpers.hasMilestone("m", 0) },
			},
			12: {
				title: "Tachoclinal Plasma",
				gain() { return saveState.player.o.points.div(100).times(saveState.player.o.energy.div(2500)).root(3.5).pow(derivedState.tmp.o.buyableGainExp).floor() },
				effect() { return Decimal.pow(gameHelpers.hasUpgrade("p", 24)?Decimal.pow(10, saveState.player[this.layer].buyables[this.id].times(derivedState.tmp.o.multiplyBuyables).plus(1).log10().cbrt()):(saveState.player[this.layer].buyables[this.id].times(derivedState.tmp.o.multiplyBuyables).plus(1).pow(derivedState.tmp.o.solPow).log10().plus(1).log10().times(10).plus(1)), ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.1:1) },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ("Sacrifice all of your Solarity & Solar Energy for "+gameHelpers.formatWhole(derivedState.tmp[this.layer].buyables[this.id].gain)+" Tachoclinal Plasma\n"+
					"Req: 100 Solarity & 2,500 Solar Energy\n"+
					"Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+((derivedState.tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+gameHelpers.format(derivedState.tmp.o.multiplyBuyables))))+"\n"+
					(derivedState.tmp.nerdMode?("Formula: "+(gameHelpers.hasUpgrade("p", 24)?"10^cbrt(log(x+1))":"log(log(x+1)+1)*10+1")):("Effect: Multiplies the Super Booster base and each Quirk Layer by "+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() { return saveState.player.o.points.gte(100)&&saveState.player.o.energy.gte(2500) },
                buy() { 
                    saveState.player.o.points = new Decimal(0);
					saveState.player.o.energy = new Decimal(0);
					saveState.player.o.buyables[this.id] = saveState.player.o.buyables[this.id].plus(derivedState.tmp[this.layer].buyables[this.id].gain);
                },
                buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return gameHelpers.hasMilestone("m", 0) },
			},
			13: {
				title: "Convectional Energy",
				gain() { return saveState.player.o.points.div(1e3).times(saveState.player.o.energy.div(2e5)).times(saveState.player.ss.subspace.div(10)).root(6.5).pow(derivedState.tmp.o.buyableGainExp).floor() },
				effect() { return saveState.player[this.layer].buyables[this.id].times(derivedState.tmp.o.multiplyBuyables).plus(1).pow(derivedState.tmp.o.solPow).log10().plus(1).pow(2.5).pow(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?27.5:1) },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ("Sacrifice all of your Solarity, Solar Energy, & Subspace for "+gameHelpers.formatWhole(derivedState.tmp[this.layer].buyables[this.id].gain)+" Convectional Energy\n"+
					"Req: 1,000 Solarity, 200,000 Solar Energy, & 10 Subspace\n"+
					"Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+((derivedState.tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+gameHelpers.format(derivedState.tmp.o.multiplyBuyables))))+"\n"+
					(derivedState.tmp.nerdMode?("Formula: (log(x+1)+1)^2.5"):("Effect: Multiplies the Time Capsule base and Subspace gain by "+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked&&saveState.player.ss.unlocked },
                canAfford() { return saveState.player.o.points.gte(1e3)&&saveState.player.o.energy.gte(2e5)&&saveState.player.ss.subspace.gte(10) },
                buy() { 
                    saveState.player.o.points = new Decimal(0);
					saveState.player.o.energy = new Decimal(0);
					saveState.player.ss.subspace = new Decimal(0);
					saveState.player.o.buyables[this.id] = saveState.player.o.buyables[this.id].plus(derivedState.tmp[this.layer].buyables[this.id].gain);
                },
                buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return gameHelpers.hasMilestone("m", 0) },
			},
			21: {
				title: "Coronal Waves",
				gain() { return saveState.player.o.points.div(1e5).root(5).times(saveState.player.o.energy.div(1e30).root(30)).times(saveState.player.ss.subspace.div(1e8).root(8)).times(saveState.player.q.energy.div("1e675").root(675)).pow(derivedState.tmp.o.buyableGainExp).floor() },
				effect() { 
					let eff = saveState.player[this.layer].buyables[this.id].times(derivedState.tmp.o.multiplyBuyables).plus(1).pow(derivedState.tmp.o.solPow).log10().plus(1).log10();
					eff = softcapRules.softcap("corona", eff);
					if (gameHelpers.hasUpgrade("hn", 24)) eff = eff.times(2);
					if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) eff = eff.times(1.4);
					return eff;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = ("Sacrifice all of your Solarity, Solar Energy, Subspace, & Quirk Energy for "+gameHelpers.formatWhole(derivedState.tmp[this.layer].buyables[this.id].gain)+" Coronal Waves\n"+
					"Req: 100,000 Solarity, 1e30 Solar Energy, 500,000,000 Subspace, & 1e675 Quirk Energy\n"+
					"Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+((derivedState.tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+gameHelpers.format(derivedState.tmp.o.multiplyBuyables))))+"\n"+
					(derivedState.tmp.nerdMode?("Formula: log(log(x+1)+1)"):("Effect: +"+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect)+" to Subspace base & +"+gameHelpers.format(derivedState.tmp[this.layer].buyables[this.id].effect.times(100))+"% Solar Power"))
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked&&gameHelpers.hasUpgrade("ss", 41) },
                canAfford() { return saveState.player.o.points.gte(1e5)&&saveState.player.o.energy.gte(1e30)&&saveState.player.ss.subspace.gte(1e8)&&saveState.player.q.energy.gte("1e675") },
                buy() { 
                    saveState.player.o.points = new Decimal(0);
					saveState.player.o.energy = new Decimal(0);
					saveState.player.ss.subspace = new Decimal(0);
					saveState.player.q.energy = new Decimal(0);
					saveState.player.o.buyables[this.id] = saveState.player.o.buyables[this.id].plus(derivedState.tmp[this.layer].buyables[this.id].gain);
                },
                buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return gameHelpers.hasMilestone("m", 0) },
			},
			22: {
				title: "Noval Remnants",
				gain() { return saveState.player.o.buyables[11].div(1e150).pow(3).pow(derivedState.tmp.o.buyableGainExp).floor() },
				effect() {
					return saveState.player[this.layer].buyables[this.id].times(derivedState.tmp.o.multiplyBuyables).plus(1).pow(derivedState.tmp.o.solPow).log10().root(10).times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.4:1).plus(1)
				},
				display() {
					let data = derivedState.tmp[this.layer].buyables[this.id]
					return ("Sacrifice all of your Solar Cores for "+gameHelpers.formatWhole(data.gain)+" Noval Remnants\n"+
					"Req: 1e150 Solar Cores\n"+
					"Amount: "+gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+((derivedState.tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+gameHelpers.format(derivedState.tmp.o.multiplyBuyables)))+"\n"+
					(derivedState.tmp.nerdMode?("Formula: (log(x+1)^0.1)+1"):("Effect: Multiply Honour gain (unaffected by softcap) and Purple, Blue, & Orange Dust gain by "+gameHelpers.format(data.effect)+"x")))
				},
				unlocked() { return saveState.player.n.buyables[11].gte(1) },
				canAfford() { return saveState.player.o.buyables[11].gte(1e150) },
				buy() {
					saveState.player.o.buyables[11] = new Decimal(0);
					saveState.player.o.buyables[this.id] = saveState.player.o.buyables[this.id].plus(derivedState.tmp[this.layer].buyables[this.id].gain);
				},
				 buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return gameHelpers.hasMilestone("m", 0) },
			},
			23: {
				title: "Nuclear Forges",
				gain() { return saveState.player.o.buyables[11].div(1e175).times(saveState.player.o.energy.div("1e2500").root(10)).pow(derivedState.tmp.o.buyableGainExp).floor() },
				effect() {
					return saveState.player[this.layer].buyables[this.id].times(derivedState.tmp.o.multiplyBuyables).plus(1).pow(derivedState.tmp.o.solPow).log10().plus(1).log10().root(2.5).times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.4:1)
				},
				display() {
					let data = derivedState.tmp[this.layer].buyables[this.id]
					return ("Sacrifice all of your Solar Cores & Solar Energy for "+gameHelpers.formatWhole(data.gain)+" Nuclear Forges\n"+
					"Req: 1e175 Solar Cores & 1e2,500 Solar Energy\n"+
					"Amount: "+gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+((derivedState.tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+gameHelpers.format(derivedState.tmp.o.multiplyBuyables)))+"\n"+
					(derivedState.tmp.nerdMode?("Formula: (log(log(x+1)+1)^0.4)*100"):("Effect: Space Buildings are "+gameHelpers.format(data.effect.times(100))+"% stronger")))
				},
				unlocked() { return saveState.player.n.buyables[11].gte(2) },
				canAfford() { return saveState.player.o.buyables[11].gte(1e175)&&saveState.player.o.energy.gte("1e2500") },
				buy() {
					saveState.player.o.buyables[11] = new Decimal(0);
					saveState.player.o.energy = new Decimal(0);
					saveState.player.o.buyables[this.id] = saveState.player.o.buyables[this.id].plus(derivedState.tmp[this.layer].buyables[this.id].gain);
				},
				 buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return gameHelpers.hasMilestone("m", 0) },
			},
			31: {
				title: "Blueshifted Flares",
				gain() { return saveState.player.o.points.div("1e400").pow(10).pow(derivedState.tmp.o.buyableGainExp).floor() },
				effect() {
					return saveState.player[this.layer].buyables[this.id].times(derivedState.tmp.o.multiplyBuyables).plus(1).pow(derivedState.tmp.o.solPow).log10().plus(1).log10().root(5).div(10).times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.9:1)
				},
				display() {
					let data = derivedState.tmp[this.layer].buyables[this.id]
					return ("Sacrifice all of your Solarity for "+gameHelpers.formatWhole(data.gain)+" Blueshifted Flares\n"+
					"Req: 1e400 Solarity\n"+
					"Amount: "+gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+((derivedState.tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+gameHelpers.format(derivedState.tmp.o.multiplyBuyables)))+"\n"+
					(derivedState.tmp.nerdMode?("Formula: (log(log(x+1)+1)^0.2)*10"):("Effect: Spells are "+gameHelpers.format(data.effect.times(100))+"% stronger")))
				},
				unlocked() { return saveState.player.n.buyables[11].gte(3) },
				canAfford() { return saveState.player.o.points.gte("1e400") },
				buy() {
					saveState.player.o.points = new Decimal(0);
					saveState.player.o.buyables[this.id] = saveState.player.o.buyables[this.id].plus(derivedState.tmp[this.layer].buyables[this.id].gain);
				},
				 buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return gameHelpers.hasMilestone("m", 0) },
			},
			32: {
				title: "Combustion Gas",
				gain() { return saveState.player.o.energy.div("1e200000").root(100).pow(derivedState.tmp.o.buyableGainExp).floor() },
				effect() {
					return saveState.player[this.layer].buyables[this.id].times(derivedState.tmp.o.multiplyBuyables).plus(1).pow(derivedState.tmp.o.solPow).log10().plus(1).log10().plus(1).log10().div(1.6).times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.9:1).plus(1)
				},
				display() {
					let data = derivedState.tmp[this.layer].buyables[this.id]
					return ("Sacrifice all of your Solar Energy for "+gameHelpers.formatWhole(data.gain)+" Combustion Gas\n"+
					"Req: e200,000 Solar Energy\n"+
					"Amount: "+gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+((derivedState.tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+gameHelpers.format(derivedState.tmp.o.multiplyBuyables)))+"\n"+
					(derivedState.tmp.nerdMode?("Formula: log(log(log(x+1)+1)+1)/1.6+1"):("Effect: Multiply the Solarity gain exponent by "+gameHelpers.format(data.effect)+".")))
				},
				unlocked() { return saveState.player.n.buyables[11].gte(4) },
				canAfford() { return saveState.player.o.energy.gte("1e200000") },
				buy() {
					saveState.player.o.energy = new Decimal(0);
					saveState.player.o.buyables[this.id] = saveState.player.o.buyables[this.id].plus(derivedState.tmp[this.layer].buyables[this.id].gain);
				},
				 buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return gameHelpers.hasMilestone("m", 0) },
			},
			33: {
				title: "Thermonuclear Reactants",
				gain() { return saveState.player.o.points.div("1e500").pow(10).pow(derivedState.tmp.o.buyableGainExp).floor() },
				effect() {
					return saveState.player[this.layer].buyables[this.id].times(derivedState.tmp.o.multiplyBuyables).plus(1).pow(derivedState.tmp.o.solPow).log10().plus(1).log10().plus(1).log10().div(3).times(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?1.9:1);
				},
				display() {
					let data = derivedState.tmp[this.layer].buyables[this.id]
					return ("Sacrifice all of your Solarity for "+gameHelpers.formatWhole(data.gain)+" Thermonuclear Reactants\n"+
					"Req: 1e750 Solarity\n"+
					"Amount: "+gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+((derivedState.tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+gameHelpers.format(derivedState.tmp.o.multiplyBuyables)))+"\n"+
					(derivedState.tmp.nerdMode?("Formula: log(log(log(x+1)+1)+1)/3"):("Effect: Add "+gameHelpers.format(data.effect.times(100))+"% to Solar Power, Space Building Power, & Hyper Building Power.")))
				},
				unlocked() { return saveState.player.n.buyables[11].gte(5) },
				canAfford() { return saveState.player.o.points.gte("1e750") },
				buy() {
					saveState.player.o.points = new Decimal(0);
					saveState.player.o.buyables[this.id] = saveState.player.o.buyables[this.id].plus(derivedState.tmp[this.layer].buyables[this.id].gain);
				},
				 buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return gameHelpers.hasMilestone("m", 0) },
			},
		},
		milestones: {
			0: {
				requirementDescription: "50,000 Total Solarity",
				done() { return saveState.player.o.total.gte(5e4) || gameHelpers.hasAchievement("a", 71) },
				effectDescription: "Gain 5% of Solarity gain every second.",
			},
		},
};
}
