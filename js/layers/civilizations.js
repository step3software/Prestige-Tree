// c — civilizations content. Registration: manifest.js.
function createCivilizationsLayer() {
    return {
		name: "civilizations", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "C", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 4, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			assigned: [new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)],
			gainedPower: [new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)],
			first: 0,
        }},
        color: "#edb3ff",
        requires() { return Decimal.sub(108, hasAchievement("a", 164)?player.c.buyables[11].times(2):0).max(8) }, // Can be a function that takes requirement increases into account
        resource: "civilization power", // Name of prestige currency
        baseResource: "imperium bricks", // Name of resource prestige is based on
        baseAmount() {return player.i.points}, // Get the current amount of baseResource
		roundUpCost: true,
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(1.2), // Prestige currency exponent
		base: new Decimal(1.025),
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		canBuyMax() { return false },
        row: 6, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "C", description: "Press Shift+C to Civilization Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		resetsNothing() { return false },
        doReset(resettingLayer){ 
			let keep = [];
            if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		autoPrestige() { return false },
        layerShown(){return player.ai.unlocked},
        branches: [["i", 2], "id"],
		update(diff) {
			if (!player.c.unlocked) return;
			for (let i=0;i<5;i++) player.c.gainedPower[i] = Decimal.pow(2, player.c.gainedPower[i]).pow(3).plus(Decimal.pow(2, player.c.assigned[i]).sub(1).max(0).times(diff/100)).cbrt().log2();
		},
		power() {
			let data = [];
			for (let i=1;i<=5;i++) data[i] = player.c.points.sub(i).div(5).plus(1).floor().max(0).sqrt().plus(player.c.gainedPower[i-1]);
			return data;
		},
		totalAssigned() { return player.c.assigned.reduce((a,c) => Decimal.add(a, c)) },
		minAssigned() { return player.c.assigned.reduce((a,c) => Decimal.min(a, c)) },
		eff1() { return tmp.c.power[1].times(50) },
		eff2() { return Decimal.pow(1e20, tmp.c.power[2]) },
		eff3() { return Decimal.pow(1e15, tmp.c.power[3]) },
		eff4() { return Decimal.pow("1e1000", tmp.c.power[4]) },
		eff5() { return tmp.c.power[5].plus(1).log(4).plus(1) },
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display", "blank",
			["row", [
				["column", [
					["display-text", "<h3>Civ<sub>1</sub></h3>"],
					["display-text", function() { return (player.c.assigned[0].gt(0)?("Population: "+formatWhole(player.c.assigned[0])+"<br>"):"")+"Power: "+format(tmp.c.power[1].times(100))+"%" }], "blank",
					["display-text", function() { return "Effect: +"+format(tmp.c.eff1.times(100))+"% Hyper Building Power" }],
					"blank", ["clickable", 11],
				], function() { return {width: "9em", visibility: player.c.points.gte(1)?"visible":"hidden"}}],
				["tall-display-text", "<div class='vl2'></div>", function() { return {height: "223.667px", visibility: player.c.points.gte(2)?"visible":"hidden"}}],
				["column", [
					["display-text", "<h3>Civ<sub>2</sub></h3>"],
					["display-text", function() { return (player.c.assigned[1].gt(0)?("Population: "+formatWhole(player.c.assigned[1])+"<br>"):"")+"Power: "+format(tmp.c.power[2].times(100))+"%" }], "blank",
					["display-text", function() { return "Effect: Divide Thought requirement by "+format(tmp.c.eff2) }],
					"blank", ["clickable", 12],
				], function() { return {width: "9em", visibility: player.c.points.gte(2)?"visible":"hidden"}}],
				["tall-display-text", "<div class='vl2'></div>", function() { return {height: "223.667px", visibility: player.c.points.gte(3)?"visible":"hidden"}}],
				["column", [
					["display-text", "<h3>Civ<sub>3</sub></h3>"],
					["display-text", function() { return (player.c.assigned[2].gt(0)?("Population: "+formatWhole(player.c.assigned[2])+"<br>"):"")+"Power: "+format(tmp.c.power[3].times(100))+"%" }], "blank",
					["display-text", function() { return "Effect: Multiply Signal gain by "+format(tmp.c.eff3) }],
					"blank", ["clickable", 13],
				], function() { return {width: "9em", visibility: player.c.points.gte(3)?"visible":"hidden"}}],
				["tall-display-text", "<div class='vl2'></div>", function() { return {height: "223.667px", visibility: player.c.points.gte(4)?"visible":"hidden"}}],
				["column", [
					["display-text", "<h3>Civ<sub>4</sub></h3>"],
					["display-text", function() { return (player.c.assigned[3].gt(0)?("Population: "+formatWhole(player.c.assigned[3])+"<br>"):"")+"Power: "+format(tmp.c.power[4].times(100))+"%" }], "blank",
					["display-text", function() { return "Effect: Multiply Damned Soul & Mech-Energy gain by "+format(tmp.c.eff4) }],
					"blank", ["clickable", 14],
				], function() { return {width: "9em", visibility: player.c.points.gte(4)?"visible":"hidden"}}],
				["tall-display-text", "<div class='vl2'></div>", function() { return {height: "223.667px", visibility: player.c.points.gte(5)?"visible":"hidden"}}],
				["column", [
					["display-text", "<h3>Civ<sub>5</sub></h3>"],
					["display-text", function() { return (player.c.assigned[4].gt(0)?("Population: "+formatWhole(player.c.assigned[4])+"<br>"):"")+"Power: "+format(tmp.c.power[5].times(100))+"%" }], "blank",
					["display-text", function() { return "Effect: Super Boosters & Neural Networks are "+format(tmp.c.eff5.sub(1).times(100))+"% stronger" }],
					"blank", ["clickable", 15],
				], function() { return {width: "9em", visibility: player.c.points.gte(5)?"visible":"hidden"}}],
			], function() { return {visibility: player.c.unlocked?"visible":"hidden"} }], "blank", "blank",
			"buyables",
		],
		buyables: {
			showRespec() { return player.c.points.gte(6) },
            respec() {
                player[this.layer].points = player[this.layer].points.add(player[this.layer].spentOnBuyables);
				player.c.assigned = [new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)];
				player.c.gainedPower = [new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)];
                doReset(this.layer, true);
            },
			respecText: "Reset Populations",
			rows: 1,
			cols: 1,
			11: {
				title: "Population",
				cost(x=player[this.layer].buyables[this.id]) {
					return Decimal.pow(1.5, x.pow(1.1)).times(4e5).round();
				},
				cap() { 
					let cap = player.c.points.sub(4).max(0);
					cap = cap.plus(player.c.points.div(5).sub(1).max(0).floor().times(2));
					cap = cap.plus(player.c.points.div(12).max(0).floor());
					return cap;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id];
					let cost = data.cost;
					let amt = player[this.layer].buyables[this.id];
                    let display = formatWhole(player.ai.points)+" / "+formatWhole(cost)+" Superintelligence"+(tmp.nerdMode?(" (1.5^(x^1.1))*400,000"):"")+"<br><br>Population: "+formatWhole(amt)+" / "+formatWhole(data.cap);
					return display;
                },
                unlocked() { return unl(this.layer) && player.c.points.gte(6) }, 
                canAfford() {
					if (!tmp[this.layer].buyables[this.id].unlocked) return false;
					let cost = layers[this.layer].buyables[this.id].cost();
                    return player[this.layer].unlocked && player.ai.points.gte(cost) && player.c.buyables[this.id].lt(tmp[this.layer].buyables[this.id].cap);
				},
                buy() { 
					let cost = tmp[this.layer].buyables[this.id].cost;
					player.ai.points = player.ai.points.sub(cost);
					player.c.buyables[this.id] = player.c.buyables[this.id].plus(1);
                },
                style: {'height':'140px', 'width':'140px'},
				autoed() { return false },
			},
		},
		clickables: {
			rows: 1,
			cols: 5,
			11: {
				title: "+1 Population",
				display: "",
				unlocked() { return player.c.unlocked && player.c.points.gte(6) },
				canClick() { return player.c.unlocked && player.c.points.gte(6) && layers.c.totalAssigned().lt(player.c.buyables[11]) && layers.c.minAssigned().eq(player.c.assigned[0]) },
				onClick() { 
					player.c.assigned[0] = player.c.assigned[0].plus(1);
				},
				style: {width: "120px", height: "50px", "border-radius": "0px"},
			},
			12: {
				title: "+1 Population",
				display: "",
				unlocked() { return player.c.unlocked && player.c.points.gte(6) },
				canClick() { return player.c.unlocked && player.c.points.gte(6) && layers.c.totalAssigned().lt(player.c.buyables[11]) && layers.c.minAssigned().eq(player.c.assigned[1]) },
				onClick() { 
					player.c.assigned[1] = player.c.assigned[1].plus(1);
				},
				style: {width: "120px", height: "50px", "border-radius": "0px"},
			},
			13: {
				title: "+1 Population",
				display: "",
				unlocked() { return player.c.unlocked && player.c.points.gte(6) },
				canClick() { return player.c.unlocked && player.c.points.gte(6) && layers.c.totalAssigned().lt(player.c.buyables[11]) && layers.c.minAssigned().eq(player.c.assigned[2]) },
				onClick() { 
					player.c.assigned[2] = player.c.assigned[2].plus(1);
				},
				style: {width: "120px", height: "50px", "border-radius": "0px"},
			},
			14: {
				title: "+1 Population",
				display: "",
				unlocked() { return player.c.unlocked && player.c.points.gte(6) },
				canClick() { return player.c.unlocked && player.c.points.gte(6) && layers.c.totalAssigned().lt(player.c.buyables[11]) && layers.c.minAssigned().eq(player.c.assigned[3]) },
				onClick() { 
					player.c.assigned[3] = player.c.assigned[3].plus(1);
				},
				style: {width: "120px", height: "50px", "border-radius": "0px"},
			},
			15: {
				title: "+1 Population",
				display: "",
				unlocked() { return player.c.unlocked && player.c.points.gte(6) },
				canClick() { return player.c.unlocked && player.c.points.gte(6) && layers.c.totalAssigned().lt(player.c.buyables[11]) && layers.c.minAssigned().eq(player.c.assigned[4]) },
				onClick() { 
					player.c.assigned[4] = player.c.assigned[4].plus(1);
				},
				style: {width: "120px", height: "50px", "border-radius": "0px"},
			},
		},
};
}
