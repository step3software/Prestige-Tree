// n — nebula content. Registration: manifest.js.
function createNebulaLayer() {
    return {
		name: "nebula", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "N", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			purpleDust: new Decimal(0),
			blueDust: new Decimal(0),
			orangeDust: new Decimal(0),
			activeSecondaries: {purpleBlue: false, blueOrange: false, orangePurple: false},
			first: 0,
        }},
        color: "#430082",
		nodeStyle() { return {
			"background-color": (((player.n.unlocked||canReset("n"))&&!(Array.isArray(tmp.ma.canBeMastered)&&player.ma.selectionActive&&tmp[this.layer].row<tmp.ma.rowLimit&&!tmp.ma.canBeMastered.includes(this.layer)))?"#430082":"#bf8f8f"),
			color: (player.oldStyle?"white":"rgba(255, 255, 255, 0.75)"),
		}},
		componentStyles() { return {
			"prestige-button": {
				color: (player.oldStyle?"white":"rgba(255, 255, 255, 0.75)"),
			},
		}},
        requires() { return new Decimal((player[this.layer].unlockOrder>0&&!hasAchievement("a", 92))?"1e288":"1e280") }, // Can be a function that takes requirement increases into account
		increaseUnlockOrder: ["hs"],
        resource: "nebula energy", // Name of prestige currency
        baseResource: "solarity", // Name of resource prestige is based on
        baseAmount() {return player.o.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?0.05:0.03) }, // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1);
			if (hasUpgrade("hn", 45)) mult = mult.times(upgradeEffect("hn", 45));
			if (hasUpgrade("g", 35) && player.i.buyables[12].gte(2)) mult = mult.times(upgradeEffect("g", 35));
			if (hasUpgrade("s", 33) && player.i.buyables[12].gte(5)) mult = mult.times(upgradeEffect("s", 33));
			if (hasUpgrade("q", 45) && player.i.buyables[12].gte(6)) mult = mult.times(200);
			if (player.ge.unlocked) mult = mult.times(tmp.ge.rotEff);
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes("i"):false) mult = mult.times(Decimal.pow(10, player.i.nb));
			if (hasUpgrade("ai", 24)) mult = mult.times(upgradeEffect("ai", 24));
            return mult
        },
		passiveGeneration() { return (hasMilestone("ma", 3)&&player.ma.current!="n")?1:0 },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 5, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "n", description: "Press N to Nebula Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			if (!hasUpgrade("hn", 53)) {
				player.n.purpleDust = new Decimal(0);
				player.n.blueDust = new Decimal(0);
				player.n.orangeDust = new Decimal(0);
			}
			if (layers[resettingLayer].row == 6 && hasMilestone("ma", 0)) keep.push("buyables");
			let as = JSON.parse(JSON.stringify(player.n.activeSecondaries));
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep);
			if (hasMilestone("ma", 0)) player.n.activeSecondaries = as;
        },
        layerShown(){return player.o.unlocked && player.hn.unlocked },
        branches: ["o", ["ps", 2]],
		tabFormat() { 
			let second = !(!tmp.n.secondariesAvailable);
			
			return ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			["column", 
				[(second?["clickable", 14]:[]),
				
				"blank",
				
				["display-text", (player.ma.unlocked?("Product of all Dusts: "+format(tmp.n.dustProduct)):"") ],
				
				"blank",
			
				["row", [["display-text", ("<span style='color: #bd6afc; font-size: 24px'>"+format(player.n.purpleDust)+"</span> Purple Dust"+(tmp.nerdMode?" (Gain Formula: (x^0.333)*"+format(tmp.n.dustGainMult.div(20))+")":((tmp.n.effect.purple||new Decimal(1)).lt("1e1000")?(" (+"+format(tmp.n.effect.purple||new Decimal(1))+"/sec)"):""))+"<br><br>Multiply Damned Soul and Phantom Power gain by <span style='color: #bd6afc; font-size: 24px'>"+format(tmp.n.dustEffs.purple)+"</span>"+(tmp.nerdMode?" (Effect Formula: 10^sqrt(log(x+1)))":""))]], {"background-color": "rgba(189, 106, 252, 0.25)", width: "50vw", padding: "10px", margin: "0 auto"}],
				
				(second?["column", [["clickable", 11], ["display-text", ("Multiply Magic gain by <span style='color: #ee82ee; font-size: 24px'>"+format(tmp.n.dustEffs2.purpleBlue)+"</span>"+(tmp.nerdMode?" (Effect Formula: (purple*blue+1)^10)":" (based on Purple & Blue Dust)"))]], {"background-color": "rgba(238, 130, 238, 0.25)", width: "50vw", padding: "10px", margin: "0 auto"}]:[]),
				
				["row", [["display-text", ("<span style='color: #7569ff; font-size: 24px'>"+format(player.n.blueDust)+"</span> Blue Dust"+(tmp.nerdMode?" (Gain Formula: (x^0.5)*"+format(tmp.n.dustGainMult.div(1e3))+")":((tmp.n.effect.blue||new Decimal(1)).lt("1e1000")?(" (+"+format(tmp.n.effect.blue||new Decimal(1))+"/sec)"):""))+"<br><br>Multiply Super-Booster base by <span style='color: #7569ff; font-size: 24px'>"+format(tmp.n.dustEffs.blue)+"</span>"+(tmp.nerdMode?" (Effect Formula: (x+1)^50)":""))]], {"background-color": "rgba(117, 105, 255, 0.25)", width: "50vw", padding: "10px", margin: "0 auto"}],
				
				(second?["column", [["clickable", 12], ["display-text", ("Multiply the <b>Timeless</b> and <b>Option D</b> rewards by <span style='color: #ba9397; font-size: 24px'>"+format(tmp.n.dustEffs2.blueOrange)+"</span><br>(unaffected by softcaps)"+(tmp.nerdMode?" (Effect Formula: (blue*orange+1)^5)":" (based on Blue & Orange Dust)"))]], {"background-color": "rgba(186, 147, 151, 0.25)", width: "50vw", padding: "10px", margin: "0 auto"}]:[]),
				
				["row", [["display-text", ("<span style='color: #ffbd2e; font-size: 24px'>"+format(player.n.orangeDust)+"</span> Orange Dust"+(tmp.nerdMode?" (Gain Formula: (x^0.2)*"+format(tmp.n.dustGainMult.div(5))+")":((tmp.n.effect.orange||new Decimal(1)).lt("1e1000")?(" (+"+format(tmp.n.effect.orange||new Decimal(1))+"/sec)"):""))+"<br><br>Multiply amounts of all Solarity buyables by <span style='color: #ffbd2e; font-size: 24px'>"+format(tmp.n.dustEffs.orange)+"</span>"+(tmp.nerdMode?" (Effect Formula: (x+1)^75)":""))]], {"background-color": "rgba(255, 189, 46, 0.25)", width: "50vw", padding: "10px", margin: "0 auto"}],
				
				(second?["column", [["clickable", 13], ["display-text", ("Multiply the Time Capsule limit base by <span style='color: #94de95; font-size: 24px'>"+format(tmp.n.dustEffs2.orangePurple)+"</span><br>"+(tmp.nerdMode?" (Effect Formula: (orange*purple+1)^0.6)":" (based on Orange & Purple Dust)"))]], {"background-color": "rgba(148, 222, 149, 0.25)", width: "50vw", padding: "10px", margin: "0 auto"}]:[]),
			]],
			"blank", "blank", ["buyable", 11], "blank", "blank",
		]},
		dustGainMult() {
			let mult = new Decimal(1);
			if (player.n.buyables[11].gte(1)) mult = mult.times(buyableEffect("o", 22));
			if (hasUpgrade("hn", 25)) mult = mult.times(upgradeEffect("hn", 25));
			if (hasUpgrade("g", 33) && player.i.buyables[12].gte(2)) mult = mult.times(upgradeEffect("g", 33));
			if (player.ge.unlocked) mult = mult.times(tmp.ge.rotEff);
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) mult = mult.times(1e30);
			return mult;
		},
		effect() {
			let amt = player.n.points;
			return {
				purple: amt.cbrt().div(20).times(tmp.n.dustGainMult),
				blue: amt.sqrt().div(1e3).times(tmp.n.dustGainMult),
				orange: amt.root(5).div(5).times(tmp.n.dustGainMult),
			};
		},
		dustProduct() { return player.n.purpleDust.times(player.n.blueDust).times(player.n.orangeDust) },
		dustEffs() {
			let mod = player.n.unlocked?1:0
			let exp = ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.6:1
			return {
				purple: Decimal.pow(10, player.n.purpleDust.times(mod).plus(1).log10().sqrt()).pow(exp),
				blue: player.n.blueDust.times(mod).plus(1).pow(50).pow(exp),
				orange: player.n.orangeDust.times(mod).plus(1).pow(75).pow(exp),
			}
		},
		dustEffs2() {
			let mod = hasUpgrade("hn", 53)?1:0
			let exp = ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?1.4:1
			return {
				purpleBlue: player.n.purpleDust.times(player.n.blueDust).plus(1).pow(10).pow(exp),
				blueOrange: player.n.blueDust.times(player.n.orangeDust).plus(1).pow(5).pow(exp),
				orangePurple: player.n.orangeDust.times(player.n.purpleDust).plus(1).pow(0.6).pow(exp),
			}
		},
		realDustEffs2() {
			let avail = player.n.activeSecondaries
			let data = tmp.n.dustEffs2;
			return {
				purpleBlue: avail.purpleBlue?data.purpleBlue:new Decimal(1),
				blueOrange: avail.blueOrange?data.blueOrange:new Decimal(1),
				orangePurple: avail.orangePurple?data.orangePurple:new Decimal(1),
			}
		},
		effectDescription: "which generate the dusts below",
		update(diff) {
			if (!player.n.unlocked) return;
			player.n.purpleDust = player.n.purpleDust.plus(tmp.n.effect.purple.times(diff));
			player.n.blueDust = player.n.blueDust.plus(tmp.n.effect.blue.times(diff));
			player.n.orangeDust = player.n.orangeDust.plus(tmp.n.effect.orange.times(diff));
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Stellar Clusters",
				cap() { return new Decimal(5) },
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let exp = (player.ma.current=="n")?26.5:1
					let cost = { purple: Decimal.pow(1e3, x.pow(2)).cbrt().times(50).pow(Math.pow(exp, 0.966)), blue: Decimal.pow(200, x.pow(2)).sqrt().pow(exp), orange: Decimal.pow(1e3, x.pow(2)).root(5).times(150).pow(exp) }
					return cost;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ((player[this.layer].buyables[this.id].gte(data.cap)?"MAXED":(("Cost: " + formatWhole(data.cost.purple) + " Purple Dust"+(tmp.nerdMode?" (Formula: ((1e3^(x^2))^0.333)*50)":"")+"\nCost: "+formatWhole(data.cost.blue)+" Blue Dust"+(tmp.nerdMode?" (Formula: ((200^(x^2))^0.5))":"")+"\nCost: "+formatWhole(data.cost.orange)+" Orange Dust")+(tmp.nerdMode?" (Formula: ((1e3^(x^2))^0.2)*150)":"")))+"\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id])+" / "+formatWhole(data.cap)+"\n\
					Unlocked "+formatWhole(player[this.layer].buyables[this.id])+" new Solarity Buyable"+(player[this.layer].buyables[this.id].eq(1)?"":"s"))
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
					let cost = tmp[this.layer].buyables[this.id].cost
                    return player.n.unlocked && player.n.purpleDust.gte(cost.purple) && player.n.blueDust.gte(cost.blue) && player.n.orangeDust.gte(cost.orange) && player[this.layer].buyables[this.id].lt(tmp[this.layer].buyables[this.id].cap)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
					player.n.purpleDust = player.n.purpleDust.sub(cost.purple)
					player.n.blueDust = player.n.blueDust.sub(cost.blue)
					player.n.orangeDust = player.n.orangeDust.sub(cost.orange)
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {
					// later :)
				},
                style() { return {'height':'200px', 'width':'200px', color:(tmp[this.layer].buyables[this.id].canAfford?"white":"black")}},
				autoed() { return false },
			},
		},
		secondariesAvailable() { return hasUpgrade("hn", 53)?((hasMilestone("hn", 8)&&player.ma.current!="n")?3:(hasUpgrade("hn", 15)?2:1)):0 },
		secondariesActive() { 
			let n = 0;
			Object.values(player.n.activeSecondaries).forEach(x => function() { n += x?1:0 }());
			return Math.min(n, layers.n.secondariesAvailable());
		},
		clickables: {
			rows: 1,
			cols: 4,
			11: {
				name: "purpleBlue",
				display() { return player.n.activeSecondaries[this.name]?"ON":((!this.canClick())?"LOCKED":"OFF") },
				unlocked() { return tmp.n.secondariesAvailable>0 },
				canClick() { return (layers.n.secondariesActive()<layers.n.secondariesAvailable()) },
				onClick() { player.n.activeSecondaries[this.name] = true },
				style: {"height": "50px", "width": "50px", "background-color": "#ee82ee"},
			},
			12: {
				name: "blueOrange",
				display() { return player.n.activeSecondaries[this.name]?"ON":((!this.canClick())?"LOCKED":"OFF") },
				unlocked() { return tmp.n.secondariesAvailable>0 },
				canClick() { return (layers.n.secondariesActive()<layers.n.secondariesAvailable()) },
				onClick() { player.n.activeSecondaries[this.name] = true },
				style: {"height": "50px", "width": "50px", "background-color": "#ba9397"},
			},
			13: {
				name: "orangePurple",
				display() { return player.n.activeSecondaries[this.name]?"ON":((!this.canClick())?"LOCKED":"OFF") },
				unlocked() { return tmp.n.secondariesAvailable>0 },
				canClick() { return (layers.n.secondariesActive()<layers.n.secondariesAvailable()) },
				onClick() { player.n.activeSecondaries[this.name] = true },
				style: {"height": "50px", "width": "50px", "background-color": "#94de95"},
			},
			14: {
				display: "Reset Secondary Dust Effects (forces a Row 6 reset)",
				unlocked() { return tmp.n.secondariesAvailable>0 },
				canClick() { return layers.n.secondariesActive()>0 },
				onClick() { 
					doReset("n", true);
					player.n.activeSecondaries = {purpleBlue: false, blueOrange: false, orangePurple: false}
				},
				style() { return {color: this.canClick()?"white":"black"}},
			},
		},
};
}
