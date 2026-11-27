// Session-bound layer owner; composition supplies only the named ports.
// i — imperium content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'>} ports */
function createImperiumLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState }) {
    return {
		name: "imperium", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "I", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 4, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			nb: new Decimal(0),
			hb: new Decimal(0),
			auto: false,
			first: 0,
        }},
        color: "#e5dab7",
        requires() { return new Decimal("1e11750") }, // Can be a function that takes requirement increases into account
        resource: "imperium bricks", // Name of prestige currency
        baseResource: "subspace", // Name of resource prestige is based on
        baseAmount() {return saveState.player.ss.subspace}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(1.8), // Prestige currency exponent
		base() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?"1e100":"1e250") },
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		canBuyMax() { return gameHelpers.hasMilestone("ma", 1) },
        row: 5, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "i", description: "Press I to Imperium Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
		resetsNothing() { return gameHelpers.hasMilestone("ma", 1) },
        doReset(resettingLayer){ 
			let keep = [];
			let i2 = saveState.player.i.buyables[12];
			if (gameHelpers.hasMilestone("ma", 2)) keep.push("buyables")
            if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
			saveState.player.i.buyables[12] = i2;
        },
		autoPrestige() { return saveState.player.i.auto && gameHelpers.hasMilestone("ma", 4) && saveState.player.ma.current!="i" },
        layerShown(){return saveState.player.hn.unlocked},
        branches: ["ss"],
		update(diff) {
			if (!saveState.player.i.unlocked) return;
			saveState.player.i.nb = saveState.player.i.nb.max(derivedState.tmp.i.nbAmt);
			saveState.player.i.hb = saveState.player.i.hb.max(derivedState.tmp.i.hbAmt);
		},
		nbAmt() {
			let amt = saveState.player.n.points.div(2e3).plus(1).log10().root(1.25)
			return amt.floor();
		},
		nextNB() {
			let next = Decimal.pow(10, saveState.player.i.nb.plus(1).pow(1.25)).sub(1).times(2e3);
			return next;
		},
		hbAmt() {
			let amt = saveState.player.hs.points.div(1e6).plus(1).log10().root(1.35)
			return amt.floor();
		},
		nextHB() {
			let next = Decimal.pow(10, saveState.player.i.hb.plus(1).pow(1.35)).sub(1).times(1e6);
			return next;
		},
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			["display-text", function() { return saveState.player.i.unlocked?("You have "+gameHelpers.formatWhole(saveState.player.i.nb)+" Nebulaic Bricks "+(derivedState.tmp.nerdMode?"(Formula: log(N/2e3+1)^0.8)":("(next at "+gameHelpers.format(derivedState.tmp.i.nextNB)+" Nebula Energy)"))):"" }],
			["display-text", function() { return saveState.player.i.unlocked?("You have "+gameHelpers.formatWhole(saveState.player.i.hb)+" Hyperspatial Bricks "+(derivedState.tmp.nerdMode?"(Formula: log(HS/1e6+1)^0.74)":("(next at "+gameHelpers.format(derivedState.tmp.i.nextHB)+" Hyperspace Energy)"))):"" }],
			"blank",
			["display-text", function() { return (saveState.player.ma.current=="i"&&saveState.player.i.unlocked)?"NOTICE: While Mastering Imperium, Imperium Buildings make each other more expensive!":"" }],
			"blank",
			"buyables",
		],
		buyables: {
			rows: 1,
			cols: 4,
			11: {
				title: "Imperium Building I",
				cap() { return new Decimal(5) },
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    let cost = { ib: x.times(1.4).pow(1.2).plus(1).pow(saveState.player.ma.current=="i"?saveState.player.i.buyables[12].div(4).plus(1):1).floor(), nb: x.pow(1.4).times(2).plus(4).pow(saveState.player.ma.current=="i"?saveState.player.i.buyables[12].div(6).plus(1):1).floor() }
					return cost;
                },
				formulas: {
					ib: "(x*1.4)^1.2+1",
					nb: "(x^1.4)*2+4",
					hb: "N/A",
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id];
					let cost = data.cost;
                    let display = ((saveState.player[this.layer].buyables[this.id].gte(data.cap)?"MAXED":((cost.ib?("Cost: "+gameHelpers.formatWhole(cost.ib)+" Imperium Bricks"+(derivedState.tmp.nerdMode?(" (Formula: "+data.formulas.ib+")"):"")+"\n"):"") + (cost.nb?("Cost: "+gameHelpers.formatWhole(cost.nb)+" Nebulaic Bricks"+(derivedState.tmp.nerdMode?(" (Formula: "+data.formulas.nb+")"):"")+"\n"):"") + (cost.hb?("Cost: "+gameHelpers.formatWhole(cost.hb)+" Hyperspatial Bricks"+(derivedState.tmp.nerdMode?(" (Formula: "+data.formulas.hb+")"):"")+"\n"):"")))+"\n\
                    Amount: " + gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+" / "+gameHelpers.formatWhole(data.cap)+"\n\
					Unlocked "+gameHelpers.formatWhole(saveState.player[this.layer].buyables[this.id])+" new Space Building"+(saveState.player[this.layer].buyables[this.id].eq(1)?"":"s")+" (which are not impacted by extra Space Buildings)")
					return display;
                },
                unlocked() { return gameHelpers.unl(this.layer) },
                canAfford() {
					let cost = derivedState.tmp[this.layer].buyables[this.id].cost
                    return saveState.player.i.unlocked && (cost.ib?saveState.player.i.points.gte(cost.ib):true) && (cost.nb?saveState.player.i.nb.gte(cost.nb):true) && (cost.hb?saveState.player.i.hb.gte(cost.hb):true) && saveState.player[this.layer].buyables[this.id].lt(derivedState.tmp[this.layer].buyables[this.id].cap)},
                buy() {
	let cost;
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
					if (cost.ib) saveState.player.i.points = saveState.player.i.points.sub(cost.ib);
					if (cost.nb) saveState.player.i.nb = saveState.player.i.nb.sub(cost.nb);
					if (cost.hb) saveState.player.i.hb = saveState.player.i.hb.sub(cost.hb);
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {
					// later :)
				},
                style: {'height':'200px', 'width':'200px'},
				autoed() { return false },
			},
			12: {
				title: "Imperium Building II",
				cap() { return new Decimal(6) },
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    let cost = { ib: x.pow(1.2).plus(1).pow(saveState.player.ma.current=="i"?saveState.player.i.buyables[11].div(2).plus(1):1).floor(), hb: x.pow(1.6).plus(5).pow(saveState.player.ma.current=="i"?saveState.player.i.buyables[11].div(5).plus(1):1).floor() }
					return cost;
                },
				formulas: {
					ib: "x^1.2+1",
					nb: "N/A",
					hb: "x^1.6+5",
				},
				displayData() {
					let amt = saveState.player[this.layer].buyables[this.id];
					let disp = ""
					if (amt.gte(1)) disp += "3 new Booster Upgrades\n";
					if (amt.gte(2)) disp += "5 new Generator Upgrades\n";
					if (amt.gte(3)) disp += "5 new Enhance Upgrades\n";
					if (amt.gte(4)) disp += "6 new Time Upgrades\n";
					if (amt.gte(5)) disp += "5 new Space Upgrades\n";
					if (amt.gte(6)) disp += "4 new Quirk Upgrades\n";
					if (disp=="") disp = "Nothing yet"
					return disp;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id];
					let cost = data.cost;
					let amt = saveState.player[this.layer].buyables[this.id];
                    let display = ((amt.gte(data.cap)?"MAXED":((cost.ib?("Cost: "+gameHelpers.formatWhole(cost.ib)+" Imperium Bricks"+(derivedState.tmp.nerdMode?(" (Formula: "+data.formulas.ib+")"):"")+"\n"):"") + (cost.nb?("Cost: "+gameHelpers.formatWhole(cost.nb)+" Nebulaic Bricks"+(derivedState.tmp.nerdMode?(" (Formula: "+data.formulas.nb+")"):"")+"\n"):"") + (cost.hb?("Cost: "+gameHelpers.formatWhole(cost.hb)+" Hyperspatial Bricks"+(derivedState.tmp.nerdMode?(" (Formula: "+data.formulas.hb+")"):"")+"\n"):"")))+"\n\
                    Amount: " + gameHelpers.formatWhole(amt)+" / "+gameHelpers.formatWhole(data.cap)+"\n\
					Unlocked: \n"
					+data.displayData)
					return display;
                },
                unlocked() { return gameHelpers.unl(this.layer) },
                canAfford() {
					let cost = derivedState.tmp[this.layer].buyables[this.id].cost
                    return saveState.player.i.unlocked && (cost.ib?saveState.player.i.points.gte(cost.ib):true) && (cost.nb?saveState.player.i.nb.gte(cost.nb):true) && (cost.hb?saveState.player.i.hb.gte(cost.hb):true) && saveState.player[this.layer].buyables[this.id].lt(derivedState.tmp[this.layer].buyables[this.id].cap)},
                buy() {
	let cost;
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
					if (cost.ib) saveState.player.i.points = saveState.player.i.points.sub(cost.ib);
					if (cost.nb) saveState.player.i.nb = saveState.player.i.nb.sub(cost.nb);
					if (cost.hb) saveState.player.i.hb = saveState.player.i.hb.sub(cost.hb);
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {
					// later :)
				},
                style: {'height':'200px', 'width':'200px'},
				autoed() { return false },
			},
			13: {
				title: "Imperium Building III",
				cap() { return new Decimal(3) },
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    let cost = { nb: x.pow(.6).times(15).plus(380).floor(), hb: x.pow(.825).times(9e4).plus(8.2e5).floor() }
					return cost;
                },
				formulas: {
					ib: "N/A",
					nb: "(x^0.6)*15+380",
					hb: "(x^0.8)*90,000+820,000",
				},
				displayData() {
					let amt = saveState.player[this.layer].buyables[this.id];
					let disp = gameHelpers.formatWhole(amt)+" new Spells"
					return disp;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id];
					let cost = data.cost;
					let amt = saveState.player[this.layer].buyables[this.id];
                    let display = ((amt.gte(data.cap)?"MAXED":((cost.ib?("Cost: "+gameHelpers.formatWhole(cost.ib)+" Imperium Bricks"+(derivedState.tmp.nerdMode?(" (Formula: "+data.formulas.ib+")"):"")+"\n"):"") + (cost.nb?("Cost: "+gameHelpers.formatWhole(cost.nb)+" Nebulaic Bricks"+(derivedState.tmp.nerdMode?(" (Formula: "+data.formulas.nb+")"):"")+"\n"):"") + (cost.hb?("Cost: "+gameHelpers.formatWhole(cost.hb)+" Hyperspatial Bricks"+(derivedState.tmp.nerdMode?(" (Formula: "+data.formulas.hb+")"):"")+"\n"):"")))+"\n\
                    Amount: " + gameHelpers.formatWhole(amt)+" / "+gameHelpers.formatWhole(data.cap)+"\n\
					Unlocked: "
					+data.displayData)
					return display;
                },
                unlocked() { return gameHelpers.unl(this.layer) && ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) },
                canAfford() {
					let cost = derivedState.tmp[this.layer].buyables[this.id].cost
                    return saveState.player.i.unlocked && ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) && (cost.ib?saveState.player.i.points.gte(cost.ib):true) && (cost.nb?saveState.player.i.nb.gte(cost.nb):true) && (cost.hb?saveState.player.i.hb.gte(cost.hb):true) && saveState.player[this.layer].buyables[this.id].lt(derivedState.tmp[this.layer].buyables[this.id].cap)},
                buy() {
	let cost;
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
					if (cost.ib) saveState.player.i.points = saveState.player.i.points.sub(cost.ib);
					if (cost.nb) saveState.player.i.nb = saveState.player.i.nb.sub(cost.nb);
					if (cost.hb) saveState.player.i.hb = saveState.player.i.hb.sub(cost.hb);
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {
					// later :)
				},
                style: {'height':'200px', 'width':'200px'},
				autoed() { return false },
			},
			14: {
				title: "Imperium Building IV",
				cap() { return new Decimal(2) },
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    let cost = { ib: x.pow(2).plus(44), nb: x.pow(1.3).times(6).plus(390).floor(), hb: x.pow(2.25).times(9e4).plus(8.75e5).floor() }
					return cost;
                },
				formulas: {
					ib: "x^2+44",
					nb: "(x^1.3)*6+390",
					hb: "(x^2.25)*90,000+875,000",
				},
				displayData() {
					let amt = saveState.player[this.layer].buyables[this.id];
					let disp = gameHelpers.formatWhole(amt)+" new Phantom Boosters"
					return disp;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id];
					let cost = data.cost;
					let amt = saveState.player[this.layer].buyables[this.id];
                    let display = ((amt.gte(data.cap)?"MAXED":((cost.ib?("Cost: "+gameHelpers.formatWhole(cost.ib)+" Imperium Bricks"+(derivedState.tmp.nerdMode?(" (Formula: "+data.formulas.ib+")"):"")+"\n"):"") + (cost.nb?("Cost: "+gameHelpers.formatWhole(cost.nb)+" Nebulaic Bricks"+(derivedState.tmp.nerdMode?(" (Formula: "+data.formulas.nb+")"):"")+"\n"):"") + (cost.hb?("Cost: "+gameHelpers.formatWhole(cost.hb)+" Hyperspatial Bricks"+(derivedState.tmp.nerdMode?(" (Formula: "+data.formulas.hb+")"):"")+"\n"):"")))+"\n\
                    Amount: " + gameHelpers.formatWhole(amt)+" / "+gameHelpers.formatWhole(data.cap)+"\n\
					Unlocked: "
					+data.displayData)
					return display;
                },
                unlocked() { return gameHelpers.unl(this.layer) && ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) },
                canAfford() {
					let cost = derivedState.tmp[this.layer].buyables[this.id].cost
                    return saveState.player.i.unlocked && ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) && (cost.ib?saveState.player.i.points.gte(cost.ib):true) && (cost.nb?saveState.player.i.nb.gte(cost.nb):true) && (cost.hb?saveState.player.i.hb.gte(cost.hb):true) && saveState.player[this.layer].buyables[this.id].lt(derivedState.tmp[this.layer].buyables[this.id].cap)},
                buy() {
	let cost;
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
					if (cost.ib) saveState.player.i.points = saveState.player.i.points.sub(cost.ib);
					if (cost.nb) saveState.player.i.nb = saveState.player.i.nb.sub(cost.nb);
					if (cost.hb) saveState.player.i.hb = saveState.player.i.hb.sub(cost.hb);
                    saveState.player[this.layer].buyables[this.id] = saveState.player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {
					// later :)
				},
                style: {'height':'200px', 'width':'200px'},
				autoed() { return false },
			},
		},
};
}
