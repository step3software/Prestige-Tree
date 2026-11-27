// o — solarity content. Registration: manifest.js.
function createSolarityLayer() {
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
			"background": (((player.o.unlocked||canReset("o"))&&!(Array.isArray(tmp.ma.canBeMastered)&&player.ma.selectionActive&&tmp[this.layer].row<tmp.ma.rowLimit&&!tmp.ma.canBeMastered.includes(this.layer))))?((player.grad&&!player.oldStyle)?"radial-gradient(#ffcd00, #ff4300)":"#ff8200"):"#bf8f8f" ,
        }},
		componentStyles: {
			"prestige-button"() {return { "background": (canReset("o"))?((player.grad&&!player.oldStyle)?"radial-gradient(#ffcd00, #ff4300)":"#ff8200"):"#bf8f8f" }},
		},
        requires() { 
			let req = new Decimal((player[this.layer].unlockOrder>0&&!hasAchievement("a", 62))?16:14).sub(tmp.o.solEnEff);
			if (hasUpgrade("ba", 23)) req = req.div(tmp.ba.posBuff.max(1));
			return req;
		},
        resource: "solarity", // Name of prestige currency
        baseResource: "super boosters", // Name of resource prestige is based on
        baseAmount() {return player.sb.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { 
			let exp = new Decimal(10);
			if (hasUpgrade("p", 34)) exp = exp.times(upgradeEffect("p", 34));
			if (hasUpgrade("hn", 25)) exp = exp.times(upgradeEffect("hn", 25));
			if (player.n.buyables[11].gte(4)) exp = exp.times(buyableEffect("o", 32));
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) exp = exp.times(player.sb.points.times(0.5/100).plus(1))
			if (player.en.unlocked) exp = exp.plus(tmp.en.owEff);
			return exp;
		}, // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = buyableEffect("o", 11);
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1);
        },
        row: 3, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "o", description: "Press O to Solarity Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			player.q.time = new Decimal(0);
			player.q.energy = new Decimal(0);
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
        layerShown(){return (player.sb.unlocked&&player.h.unlocked)||player.m.unlocked||player.ba.unlocked },
        branches: ["sb", "t"],
		effect() { 
			if (!unl(this.layer)) return new Decimal(0);
			let sol = player.o.points;
			sol = softcap("sol_eff", sol);
			let eff = sol.plus(1).log10();
			let cap = 0.1;
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) cap = 0.15;
			if (eff.gt(10)) eff = eff.log10().times(3).plus(7)
			return eff.div(100).min(cap);
		},
		effect2() { return player.o.points.div(1e20).plus(1).sqrt().pow(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.1:1) },
		solEnGain() { 
			let gain = player.t.energy.max(1).pow(tmp.o.effect).times(tmp.o.effect2).sub(1);
			if (player.m.unlocked) gain = gain.times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("m"):false)?tmp.m.mainHexEff:tmp.m.hexEff);
			if (tmp.q.impr[41].unlocked) gain = gain.times(improvementEffect("q", 41));
			return gain;
		},
		solEnEff() { return Decimal.sub(4, Decimal.div(4, player.o.energy.plus(1).log10().plus(1))) },
		solEnEff2() { return player.o.energy.plus(1).pow(2) },
		effectDescription() { return "which are generating "+(tmp.nerdMode?("(timeEnergy^"+format(tmp.o.effect)+(tmp.o.effect.gt(1.01)?("*"+format(tmp.o.effect2)):"")+"-1)"):format(tmp.o.solEnGain))+" Solar Energy every second." },
		update(diff) {
			player.o.energy = player.o.energy.plus(tmp.o.solEnGain.times(diff));
			if (hasMilestone("m", 0) && player.ma.current!="o") {
				for (let i in tmp.o.buyables) if (i!="rows" && i!="cols") if (tmp.o.buyables[i].unlocked) player.o.buyables[i] = player.o.buyables[i].plus(tmp.o.buyables[i].gain.times(diff));
			}
		},
		passiveGeneration() { return player.ma.current=="o"?0:(hasMilestone("m", 0)?1:(hasMilestone("o", 0)?0.05:0)) },
		solPow() {
			let pow = new Decimal(1);
			if (hasUpgrade("ss", 33)) pow = pow.plus(upgradeEffect("ss", 33));
			if (hasUpgrade("ss", 41)) pow = pow.plus(buyableEffect("o", 21));
			if (hasUpgrade("ba", 11)) pow = pow.plus(upgradeEffect("ba", 11));
			if (hasUpgrade("hn", 55)) pow = pow.plus(upgradeEffect("hn", 55));
			if (player.n.buyables[11].gte(5)) pow = pow.plus(buyableEffect("o", 33));
			if (tmp.ps.impr[11].unlocked) pow = pow.times(tmp.ps.impr[11].effect);
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) pow = pow.plus(player.o.points.plus(1).log10().div(5));
			return softcap("solPow", pow);
		},
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			["display-text",
				function() {return 'You have ' + format(player.o.energy) + ' Solar Energy, which is reducing the Solarity requirement by '+format(tmp.o.solEnEff)+(tmp.nerdMode?(" (4-4/(log(x+1)+1))"):"")+' and multiplies the Time Energy limit by '+format(tmp.o.solEnEff2)+'.'+(tmp.nerdMode?(" (x+1)^2"):"")},
					{}],
			"blank",
			"milestones",
			"blank",
			["display-text",
				function() { return "<b>Solar Power: "+format(tmp.o.solPow.times(100))+"%</b><br>" },
					{}],
			"buyables",
			"blank"
		],
		multiplyBuyables() {
			let mult = tmp.n.dustEffs.orange;
			return mult;
		},
		buyableGainExp() {
			let exp = new Decimal(1);
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) exp = exp.times(2.6);
			return exp;
		},
		buyables: {
			rows: 3,
			cols: 3,
			11: {
				title: "Solar Cores",
				gain() { return player.o.points.div(2).root(1.5).pow(tmp.o.buyableGainExp).floor() },
				effect() { 
					let amt = player[this.layer].buyables[this.id].times(tmp.o.multiplyBuyables)
					amt = softcap("solCores2", softcap("solCores", amt));
					return Decimal.pow(hasUpgrade("ss", 22)?(amt.plus(1).pow(tmp.o.solPow).cbrt()):(amt.plus(1).pow(tmp.o.solPow).log10().plus(1)), ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.1:1)
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
					let x = player[this.layer].buyables[this.id].gte(5e4)?"10^(sqrt(log(x)*log(5e4)))":"x"
                    let display = ("Sacrifice all of your Solarity for "+formatWhole(tmp[this.layer].buyables[this.id].gain)+" Solar Cores\n"+
					"Req: 2 Solarity\n"+
					"Amount: " + formatWhole(player[this.layer].buyables[this.id])+((tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+format(tmp.o.multiplyBuyables))))+"\n"+
					(tmp.nerdMode?("Formula: "+(hasUpgrade("ss", 22)?"cbrt("+x+"+1)":"log("+x+"+1)+1")+""):("Effect: Multiplies Solarity gain by "+format(tmp[this.layer].buyables[this.id].effect)))
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() { return player.o.points.gte(2) },
                buy() { 
                    player.o.points = new Decimal(0);
					player.o.buyables[this.id] = player.o.buyables[this.id].plus(tmp[this.layer].buyables[this.id].gain);
                },
                buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px'},
				autoed() { return hasMilestone("m", 0) },
			},
			12: {
				title: "Tachoclinal Plasma",
				gain() { return player.o.points.div(100).times(player.o.energy.div(2500)).root(3.5).pow(tmp.o.buyableGainExp).floor() },
				effect() { return Decimal.pow(hasUpgrade("p", 24)?Decimal.pow(10, player[this.layer].buyables[this.id].times(tmp.o.multiplyBuyables).plus(1).log10().cbrt()):(player[this.layer].buyables[this.id].times(tmp.o.multiplyBuyables).plus(1).pow(tmp.o.solPow).log10().plus(1).log10().times(10).plus(1)), ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.1:1) },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Sacrifice all of your Solarity & Solar Energy for "+formatWhole(tmp[this.layer].buyables[this.id].gain)+" Tachoclinal Plasma\n"+
					"Req: 100 Solarity & 2,500 Solar Energy\n"+
					"Amount: " + formatWhole(player[this.layer].buyables[this.id])+((tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+format(tmp.o.multiplyBuyables))))+"\n"+
					(tmp.nerdMode?("Formula: "+(hasUpgrade("p", 24)?"10^cbrt(log(x+1))":"log(log(x+1)+1)*10+1")):("Effect: Multiplies the Super Booster base and each Quirk Layer by "+format(tmp[this.layer].buyables[this.id].effect)))
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() { return player.o.points.gte(100)&&player.o.energy.gte(2500) },
                buy() { 
                    player.o.points = new Decimal(0);
					player.o.energy = new Decimal(0);
					player.o.buyables[this.id] = player.o.buyables[this.id].plus(tmp[this.layer].buyables[this.id].gain);
                },
                buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return hasMilestone("m", 0) },
			},
			13: {
				title: "Convectional Energy",
				gain() { return player.o.points.div(1e3).times(player.o.energy.div(2e5)).times(player.ss.subspace.div(10)).root(6.5).pow(tmp.o.buyableGainExp).floor() },
				effect() { return player[this.layer].buyables[this.id].times(tmp.o.multiplyBuyables).plus(1).pow(tmp.o.solPow).log10().plus(1).pow(2.5).pow(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?27.5:1) },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Sacrifice all of your Solarity, Solar Energy, & Subspace for "+formatWhole(tmp[this.layer].buyables[this.id].gain)+" Convectional Energy\n"+
					"Req: 1,000 Solarity, 200,000 Solar Energy, & 10 Subspace\n"+
					"Amount: " + formatWhole(player[this.layer].buyables[this.id])+((tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+format(tmp.o.multiplyBuyables))))+"\n"+
					(tmp.nerdMode?("Formula: (log(x+1)+1)^2.5"):("Effect: Multiplies the Time Capsule base and Subspace gain by "+format(tmp[this.layer].buyables[this.id].effect)))
					return display;
                },
                unlocked() { return player[this.layer].unlocked&&player.ss.unlocked }, 
                canAfford() { return player.o.points.gte(1e3)&&player.o.energy.gte(2e5)&&player.ss.subspace.gte(10) },
                buy() { 
                    player.o.points = new Decimal(0);
					player.o.energy = new Decimal(0);
					player.ss.subspace = new Decimal(0);
					player.o.buyables[this.id] = player.o.buyables[this.id].plus(tmp[this.layer].buyables[this.id].gain);
                },
                buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return hasMilestone("m", 0) },
			},
			21: {
				title: "Coronal Waves",
				gain() { return player.o.points.div(1e5).root(5).times(player.o.energy.div(1e30).root(30)).times(player.ss.subspace.div(1e8).root(8)).times(player.q.energy.div("1e675").root(675)).pow(tmp.o.buyableGainExp).floor() },
				effect() { 
					let eff = player[this.layer].buyables[this.id].times(tmp.o.multiplyBuyables).plus(1).pow(tmp.o.solPow).log10().plus(1).log10();
					eff = softcap("corona", eff);
					if (hasUpgrade("hn", 24)) eff = eff.times(2);
					if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) eff = eff.times(1.4);
					return eff;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Sacrifice all of your Solarity, Solar Energy, Subspace, & Quirk Energy for "+formatWhole(tmp[this.layer].buyables[this.id].gain)+" Coronal Waves\n"+
					"Req: 100,000 Solarity, 1e30 Solar Energy, 500,000,000 Subspace, & 1e675 Quirk Energy\n"+
					"Amount: " + formatWhole(player[this.layer].buyables[this.id])+((tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+format(tmp.o.multiplyBuyables))))+"\n"+
					(tmp.nerdMode?("Formula: log(log(x+1)+1)"):("Effect: +"+format(tmp[this.layer].buyables[this.id].effect)+" to Subspace base & +"+format(tmp[this.layer].buyables[this.id].effect.times(100))+"% Solar Power"))
					return display;
                },
                unlocked() { return player[this.layer].unlocked&&hasUpgrade("ss", 41) }, 
                canAfford() { return player.o.points.gte(1e5)&&player.o.energy.gte(1e30)&&player.ss.subspace.gte(1e8)&&player.q.energy.gte("1e675") },
                buy() { 
                    player.o.points = new Decimal(0);
					player.o.energy = new Decimal(0);
					player.ss.subspace = new Decimal(0);
					player.q.energy = new Decimal(0);
					player.o.buyables[this.id] = player.o.buyables[this.id].plus(tmp[this.layer].buyables[this.id].gain);
                },
                buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return hasMilestone("m", 0) },
			},
			22: {
				title: "Noval Remnants",
				gain() { return player.o.buyables[11].div(1e150).pow(3).pow(tmp.o.buyableGainExp).floor() },
				effect() {
					return player[this.layer].buyables[this.id].times(tmp.o.multiplyBuyables).plus(1).pow(tmp.o.solPow).log10().root(10).times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.4:1).plus(1)
				},
				display() {
					let data = tmp[this.layer].buyables[this.id]
					return ("Sacrifice all of your Solar Cores for "+formatWhole(data.gain)+" Noval Remnants\n"+
					"Req: 1e150 Solar Cores\n"+
					"Amount: "+formatWhole(player[this.layer].buyables[this.id])+((tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+format(tmp.o.multiplyBuyables)))+"\n"+
					(tmp.nerdMode?("Formula: (log(x+1)^0.1)+1"):("Effect: Multiply Honour gain (unaffected by softcap) and Purple, Blue, & Orange Dust gain by "+format(data.effect)+"x")))
				},
				unlocked() { return player.n.buyables[11].gte(1) },
				canAfford() { return player.o.buyables[11].gte(1e150) },
				buy() {
					player.o.buyables[11] = new Decimal(0);
					player.o.buyables[this.id] = player.o.buyables[this.id].plus(tmp[this.layer].buyables[this.id].gain);
				},
				 buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return hasMilestone("m", 0) },
			},
			23: {
				title: "Nuclear Forges",
				gain() { return player.o.buyables[11].div(1e175).times(player.o.energy.div("1e2500").root(10)).pow(tmp.o.buyableGainExp).floor() },
				effect() {
					return player[this.layer].buyables[this.id].times(tmp.o.multiplyBuyables).plus(1).pow(tmp.o.solPow).log10().plus(1).log10().root(2.5).times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.4:1)
				},
				display() {
					let data = tmp[this.layer].buyables[this.id]
					return ("Sacrifice all of your Solar Cores & Solar Energy for "+formatWhole(data.gain)+" Nuclear Forges\n"+
					"Req: 1e175 Solar Cores & 1e2,500 Solar Energy\n"+
					"Amount: "+formatWhole(player[this.layer].buyables[this.id])+((tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+format(tmp.o.multiplyBuyables)))+"\n"+
					(tmp.nerdMode?("Formula: (log(log(x+1)+1)^0.4)*100"):("Effect: Space Buildings are "+format(data.effect.times(100))+"% stronger")))
				},
				unlocked() { return player.n.buyables[11].gte(2) },
				canAfford() { return player.o.buyables[11].gte(1e175)&&player.o.energy.gte("1e2500") },
				buy() {
					player.o.buyables[11] = new Decimal(0);
					player.o.energy = new Decimal(0);
					player.o.buyables[this.id] = player.o.buyables[this.id].plus(tmp[this.layer].buyables[this.id].gain);
				},
				 buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return hasMilestone("m", 0) },
			},
			31: {
				title: "Blueshifted Flares",
				gain() { return player.o.points.div("1e400").pow(10).pow(tmp.o.buyableGainExp).floor() },
				effect() {
					return player[this.layer].buyables[this.id].times(tmp.o.multiplyBuyables).plus(1).pow(tmp.o.solPow).log10().plus(1).log10().root(5).div(10).times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.9:1)
				},
				display() {
					let data = tmp[this.layer].buyables[this.id]
					return ("Sacrifice all of your Solarity for "+formatWhole(data.gain)+" Blueshifted Flares\n"+
					"Req: 1e400 Solarity\n"+
					"Amount: "+formatWhole(player[this.layer].buyables[this.id])+((tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+format(tmp.o.multiplyBuyables)))+"\n"+
					(tmp.nerdMode?("Formula: (log(log(x+1)+1)^0.2)*10"):("Effect: Spells are "+format(data.effect.times(100))+"% stronger")))
				},
				unlocked() { return player.n.buyables[11].gte(3) },
				canAfford() { return player.o.points.gte("1e400") },
				buy() {
					player.o.points = new Decimal(0);
					player.o.buyables[this.id] = player.o.buyables[this.id].plus(tmp[this.layer].buyables[this.id].gain);
				},
				 buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return hasMilestone("m", 0) },
			},
			32: {
				title: "Combustion Gas",
				gain() { return player.o.energy.div("1e200000").root(100).pow(tmp.o.buyableGainExp).floor() },
				effect() {
					return player[this.layer].buyables[this.id].times(tmp.o.multiplyBuyables).plus(1).pow(tmp.o.solPow).log10().plus(1).log10().plus(1).log10().div(1.6).times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.9:1).plus(1)
				},
				display() {
					let data = tmp[this.layer].buyables[this.id]
					return ("Sacrifice all of your Solar Energy for "+formatWhole(data.gain)+" Combustion Gas\n"+
					"Req: e200,000 Solar Energy\n"+
					"Amount: "+formatWhole(player[this.layer].buyables[this.id])+((tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+format(tmp.o.multiplyBuyables)))+"\n"+
					(tmp.nerdMode?("Formula: log(log(log(x+1)+1)+1)/1.6+1"):("Effect: Multiply the Solarity gain exponent by "+format(data.effect)+".")))
				},
				unlocked() { return player.n.buyables[11].gte(4) },
				canAfford() { return player.o.energy.gte("1e200000") },
				buy() {
					player.o.energy = new Decimal(0);
					player.o.buyables[this.id] = player.o.buyables[this.id].plus(tmp[this.layer].buyables[this.id].gain);
				},
				 buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return hasMilestone("m", 0) },
			},
			33: {
				title: "Thermonuclear Reactants",
				gain() { return player.o.points.div("1e500").pow(10).pow(tmp.o.buyableGainExp).floor() },
				effect() {
					return player[this.layer].buyables[this.id].times(tmp.o.multiplyBuyables).plus(1).pow(tmp.o.solPow).log10().plus(1).log10().plus(1).log10().div(3).times(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.9:1);
				},
				display() {
					let data = tmp[this.layer].buyables[this.id]
					return ("Sacrifice all of your Solarity for "+formatWhole(data.gain)+" Thermonuclear Reactants\n"+
					"Req: 1e750 Solarity\n"+
					"Amount: "+formatWhole(player[this.layer].buyables[this.id])+((tmp.o.multiplyBuyables||new Decimal(1)).eq(1)?"":(" x "+format(tmp.o.multiplyBuyables)))+"\n"+
					(tmp.nerdMode?("Formula: log(log(log(x+1)+1)+1)/3"):("Effect: Add "+format(data.effect.times(100))+"% to Solar Power, Space Building Power, & Hyper Building Power.")))
				},
				unlocked() { return player.n.buyables[11].gte(5) },
				canAfford() { return player.o.points.gte("1e750") },
				buy() {
					player.o.points = new Decimal(0);
					player.o.buyables[this.id] = player.o.buyables[this.id].plus(tmp[this.layer].buyables[this.id].gain);
				},
				 buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return hasMilestone("m", 0) },
			},
		},
		milestones: {
			0: {
				requirementDescription: "50,000 Total Solarity",
				done() { return player.o.total.gte(5e4) || hasAchievement("a", 71) },
				effectDescription: "Gain 5% of Solarity gain every second.",
			},
		},
};
}
