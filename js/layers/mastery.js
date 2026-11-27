// ma — mastery content. Registration: manifest.js.
function createMasteryLayer() {
    return {
		name: "mastery", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "MA", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 2, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			first: 0,
			mastered: [],
			selectionActive: false,
			current: null,
        }},
        color: "#ff9f7f",
        requires() { return new Decimal(100) }, // Can be a function that takes requirement increases into account
        resource: "mastery", // Name of prestige currency
        baseResource: "phantom souls", // Name of resource prestige is based on
        baseAmount() {return player.ps.points}, // Get the current amount of baseResource
		roundUpCost: true,
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(1.1), // Prestige currency exponent
		base: new Decimal(1.05),
		effectBase() {
			return new Decimal(1e20);
		},
		effect() {
			return Decimal.pow(tmp.ma.effectBase, player.ma.points);
		},
		effectDescription() {
			return "which multiplies Honour & Hyperspace Energy gain by "+format(tmp.ma.effect)+(tmp.nerdMode?(" ("+format(tmp.ma.effectBase)+"x each)"):"")+", and adds "+format(tmp.ma.effect.max(1).log10().times(2.5))+"% to Hyper Building Power"+(tmp.nerdMode?(" (+"+format(tmp.ma.effectBase.max(1).log10().times(2.5))+"% each)"):"")
		},
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (hasAchievement("a", 131)) mult = mult.div(1.1);
			if (hasAchievement("a", 95)) mult = mult.div(1.15);
			if (hasAchievement("a", 134)) mult = mult.times(Decimal.pow(.999925, player.ps.points));
			if (hasAchievement("a", 163)) mult = mult.div(Decimal.pow(1.1, player.a.achievements.filter(x => x>160).length));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		canBuyMax() { return false },
        row: 6, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "A", description: "Press Shift+A to Mastery Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		resetsNothing() { return false },
        doReset(resettingLayer){ 
			let keep = [];
            if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		autoPrestige() { return false },
        layerShown(){return player.ps.unlocked && player.i.unlocked},
        branches: ["hn", "hs", ["ps", 2]],
		tabFormat: {
			Mastery: {
				content: ["main-display",
					"prestige-button",
					"resource-display",
					"blank", "milestones",
					"blank", "blank",
					"clickables",
				],
			}, 
			"Mastery Rewards": {
				buttonStyle() { return {'background-color': '#ff9f7f', 'color': 'black'} },
				content: ["blank", "blank", "blank", ["raw-html", function() { return tmp.ma.rewardDesc }]],
			},
		},
		rewardDesc() {
			let desc = "";
			if (player.ma.mastered.includes("p")) desc += "<h2>Prestige</h2><br><br><ul><li>Base Prestige gain exponent is better (0.5 -> 0.75)</li><li><b>Prestige Boost</b> is raised ^1.1 (after softcaps)</li><li><b>Self Synergy</b> is raised ^75</li><li><b>More Prestige</b> is much stronger (+80% -> +1e52%)</li><li><b>Upgrade Power</b> is raised ^40</li><li><b>Reverse Prestige Boost</b> is raised ^1.5</li></ul><br><br>";
			if (player.ma.mastered.includes("b")) desc += "<h2>Boosters</h2><br><br><ul><li>Booster cost base is reduced (5 -> 1.5)</li><li>Base Booster cost exponent is reduced (1.25 -> 0.75)</li><li><b>BP Combo</b> & <b>Discount One</b> are raised ^1.5</li><li><b>Cross Contamination</b> & <b>PB Reversal</b> also multiply the SB base</li><li><b>Worse BP Combo</b> is raised ^20,000</li><li><b>Even More Additions</b> is cubed</li></ul><br><br>";
			if (player.ma.mastered.includes("g")) desc += "<h2>Generators</h2><br><br><ul><li>Generator cost base is reduced (5 -> 2.5)</li><li>Base Generator cost exponent is reduced (1.25 -> 1.1)</li><li>Generator Power effect is raised ^1.05</li><li><b>GP Combo</b> is raised ^500,000</li><li><b>I Need More III</b> is raised ^10,000</li></ul><br><br>";
			if (player.ma.mastered.includes("t")) desc += "<h2>Time</h2><br><br><ul><li>Time cost base is reduced (1e15 -> 10)</li><li>Base Time cost exponent is reduced (1.85 -> 1.4)</li><li>Time Capsules have a new effect</li><li>Anything that multiplies the Time Energy limit base now multiplies the Booster & Generator bases</li><li>The first Time Energy effect softcaps later (e3.1e9)</li><li>The Extra Time Capsule cost is raised ^0.9</li><li><b>Pseudo-Boost</b> & <b>Basic</b> also multiply the Time Energy gain base, and are both cubed</li><li><b>Enhanced Time</b> is raised to the power of 1.1</li></ul><br><br>";
			if (player.ma.mastered.includes("e")) desc += "<h2>Enhance</h2><br><br><ul><li>Enhance gain exponent is increased (0.02 -> 0.025)</li><li>The second Enhancer effect is raised to the power of 100</li><li><b>Enhanced Prestige</b> also affects Point gain, and it is raised ^1.5</li><li><b>Enter the E-Space</b> is 250% stronger</li><li><b>Monstrous Growth</b>'s base is much better (1.1 -> 1e2,000)</li><li><b>To the Next Level</b> is cubed</li></ul><br><br>";
			if (player.ma.mastered.includes("s")) desc += "<h2>Space</h2><br><br><ul><li>Space cost base is reduced (1e10 -> 10)</li><li>Base Space cost exponent is reduced (1.85 -> 1.4)</li><li>Space Building Power is divided by 3.85, but Space Buildings cost scale 5x slower</li></ul><br><br>";
			if (player.ma.mastered.includes("sb")) desc += "<h2>Super Boosters</h2><br><br><ul><li>Super Booster cost base is reduced (1.05 -> 1.025)</li><li>Base Super Booster cost exponent is reduced (1.25 -> 1.075)</li><li>The Super Booster cost is divided by 1.333</li><li>Super Boosters provide Spectral Boosters</li></ul><br><br>";
			if (player.ma.mastered.includes("sg")) desc += "<h2>Super Generators</h2><br><br><ul><li>Super Generator cost base is reduced (1.05 -> 1.04)</li><li>Base Super Generator cost exponent is reduced (1.25 -> 1.225)</li><li>The Super Generator cost is divided by 1.1</li><li>The Super Generator Power effect is squared</li><li>Super Generators give Spectral Generators over time</li></ul><br><br>";
			if (player.ma.mastered.includes("q")) desc += "<h2>Quirks</h2><br><br><ul><li>Quirk gain exponent is increased (7.5e-3 -> 8e-3)</li><li>The Quirk Energy effect softcap start is raised ^1.5</li><li>The Quirk Layer cost base is raised ^0.75</li><li><b>Millennial Abilities</b> is 50% stronger</li><li>Bought Decary Space Building Levels add free Quirk Improvements (equal to the Level/4)</li></ul><br><br>";
			if (player.ma.mastered.includes("h")) desc += "<h2>Hindrances</h2><br><br><ul><li>Hindrance Spirit gain exponent is increased (0.125 -> 0.2)</li><li>The Hindrance Spirit effect softcap is much weaker (exponent to the 4th root -> exponent to the 2.5th root)</li><li>Unlock a Hindrance milestone</li><li><b>Speed Demon</b> has a secondary effect</li><li><b>Out of Room</b>'s effect is 40% stronger</li><li><b>Timeless</b> & <b>Option D</b> no longer have a completion limit</li><li><b>Timeless</b>'s effect is raised ^5</li><li><b>Productionless</b>'s reduction to the Quirk Layer cost base is stronger (0.15 -> 0.2)</li></ul><br><br>";
			if (player.ma.mastered.includes("o")) desc += "<h2>Solarity</h2><br><br><ul><li>The Solarity gain exponent is increased by 0.5% for every Super Booster you have (additive)</li><li>The Solar Energy gain exponent limit is increased to 0.15, but beyond 0.1 it grows much slower</li><li>Solar Energy's second effect is 10% stronger</li><li>Solar Power is increased by 20% for every OoM of Solarity you have</li><li>Solarity buyable gain is raised ^2.6</li><li>All effects of the first row of Solarity buyables are raised ^1.1</li><li><b>Convectional Energy</b>'s effect is raised ^25</li><li>All effects of the second row of Solarity buyables are multiplied by 1.4</li><li>All effects of the third row of Solarity buyables are multiplied by 1.9</li></ul><br><br>";
			if (player.ma.mastered.includes("ss")) desc += "<h2>Subspace</h2><br><br><ul><li>The Subspace cost base is reduced (1.15 -> 1.1)</li><li>The base Subspace cost exponent is reduced (1.1 -> 1.07)</li><li>The Subspace base is multiplied by 1e10 for each Subspace Energy you have</li><li>The third Subspace effect is raised ^3</li><li>If <b>Subspatial Awakening</b>'s effect is above 100%, it is cubed but divided by 10,000</li><li><b>Emissary of Smash</b>'s effect is raised ^400</li><li><b>No More Progress</b>'s effect is doubled</li><li><b>Challenging Speedup</b>'s endpoint is much higher (e1,000,000 -> e1e11)</li></ul><br><br>";
			if (player.ma.mastered.includes("m")) desc += "<h2>Magic</h2><br><br><ul><li>The Magic gain exponent is increased (7e-3 -> 8.5e-3)</li><li>Add 50% to Spell Power</li><li>The Hex effect softcap does not apply to the boost to Hindrance Spirit, Quirk, and Solar Energy gain, but this effect is square rooted</li><li>The Hex effect softcap starts 1e-3% later for every OoM of Magic you have</li><li>The Hex effect softcap exponent is increased (10 -> 2e3)</li></ul><br><br>";
			if (player.ma.mastered.includes("ba")) desc += "<h2>Balance</h2><br><br><ul><li>The Balance Energy gain exponent is increased (5e-3 -> 0.0125)</li><li>There are no Positivity/Negativity nerfs</li><li>Both <b>Net Neutrality</b> effects have their exponents raised ^2.5</li><li><b>Visible Regeneration</b> is raised ^10</li></ul><br><br>";
			if (player.ma.mastered.includes("ps")) desc += "<h2>Phantom Souls</h2><br><br><ul><li>The Phantom Soul cost base is square rooted</li><li>The base Damned Soul gain formula is improved (PS^1.5 -> 1.2^PS)</li><li>The Damned Soul effect is raised ^100</li><li>Wraiths cost scale 50% slower</li><li>Ghost Spirit cost scales 20% slower</li><li>Phantom Boosters are 10% stronger</li></ul><br><br>";
			if (player.ma.mastered.includes("hn")) desc += "<h2>Honour</h2><br><br><ul><li>The Honour gain exponent for its Balance Energy requirement is improved (0.02 -> 0.05)</li><li>Remove the softcap to the second Honour Upgrade</li><li><b>Self-Self-Synergy</b>'s effect is multiplied by 5</li><li><b>Point Efficiency</b> is maxed at 92% instead of 90%</li><li><b>Superpowered Upgrades</b>'s effect is tripled</li><li><b>Reversal Sensational</b> is 10% stronger</li><li><b>Column Leader Leader</b> is 10% stronger</li><li><b>Again and Again</b>'s effect is doubled</li><li><b>Quir-cursion</b>'s effect is raised ^50</li></ul><br><br>";
			if (player.ma.mastered.includes("n")) desc += "<h2>Nebula</h2><br><br><ul><li>The Nebula gain exponent is improved (0.03 -> 0.05)</li><li>All primary dust effects are raised ^1.6</li><li>All secondary dust effects are raised ^1.4</li><li>Gain 1e30x more Dust</li></ul><br><br>";
			if (player.ma.mastered.includes("hs")) desc += "<h2>Hyperspace</h2><br><br><ul><li>The Hyper Building Limit requirement scales 20% slower</li><li>Add 0.1% to Hyper Building Power for every Hyperspace bought</li><li>The Hyper Building softcap starts 0.1 Levels later</li></ul><br><br>";
			if (player.ma.mastered.includes("i")) desc += "<h2>Imperium</h2><br><br><ul><li>The Imperium Building cost base is reduced (1e250 -> 1e100)</li><li>Each Nebulaic Brick multiplies Nebula Energy gain by 10</li><li>Each Hyperspatial Brick multiplies Hyperspace Energy gain by 10</li><li>There are 2 new Imperium Buildings</li></ul><br><br>";
			return desc;
		},
		milestones: {
			0: {
				requirementDescription: "1 Mastery",
				done() { return player.ma.best.gte(1) },
				effectDescription: "Keep Hyperspace & Stellar Clusters on all Row 7 resets, and unlock Auto-Ghost Spirit.",
				toggles: [["ps", "autoGhost"]],
			},
			1: {
				requirementDescription: "2 Mastery",
				done() { return player.ma.best.gte(2) },
				effectDescription: "You can buy max Imperium Bricks (which now reset nothing), gain 100% of Honour gain every second, and keep all Honour milestones & upgrades on all resets.",
			},
			2: {
				requirementDescription: "3 Mastery",
				done() { return player.ma.best.gte(3) },
				effectDescription: "Keep Imperium Building I & Hyper Buildings on reset, and gain 100% of Hyperspace Energy gain every second.",
			},
			3: {
				requirementDescription: "4 Mastery",
				done() { return player.ma.best.gte(4) },
				effectDescription: "Gain 100% of Nebula Energy every second.",
			},
			4: {
				requirementDescription: "5 Mastery",
				done() { return player.ma.best.gte(5) },
				effectDescription: "Unlock Auto-Imperium Bricks.",
				toggles: [["i", "auto"]],
			},
			5: {
				unlocked() { return hasMilestone("ma", 4) },
				requirementDescription: "16 Mastery",
				done() { return player.ma.best.gte(16) },
				effectDescription: "Unlock Auto-Hyperspace.",
				toggles: [["hs", "auto"]],
			},
		},
		clickables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Mastery",
				cap: 19,
				display() {
					if (player.ma.current!==null) return "Currently Mastering: "+tmp[player.ma.current].name+". Click to exit the run.";
					else return player.ma.selectionActive?"You are in a Mastery Search. Click the node of the layer you wish to attempt to Master. Click to exit this search.":("Begin a Mastery Search.<br><br>"+((tmp.ma.amtMastered>=this.cap)?"MAXED":("Req: "+formatWhole(tmp[this.layer].clickables[this.id].req)+" Mastery.")));
				},
				unlocked() { return player.ma.unlocked },
				req() { return [2,5,7,8,9,9,10,10,11,12,14,14,15,16,18,20,21,22,23,(1e300)][tmp.ma.amtMastered||0] },
				canClick() { return player.ma.unlocked && (player.ma.selectionActive?true:(tmp.ma.amtMastered<this.cap&&player.ma.points.gte(tmp[this.layer].clickables[this.id].req))) },
				onClick() { 
					if (player.ma.current !== null) {
						if (!confirm("Are you sure you want to exit this Mastery run?")) return;
						player.ma.selectionActive = false;
						player.ma.current = null;
						doReset("ma", true);
					} else player.ma.selectionActive = !player.ma.selectionActive;
				},
				style: {"height": "200px", "width": "200px"},
			},
		},
		amtMastered() {
			let amt = tmp.ma.mastered.length;
			if (player.ma.current!==null) if (player.ma.mastered.includes(player.ma.current)) amt--;
			return amt;
		},
		mastered() {
			if (player.ma.current!==null) return player.ma.mastered.concat(player.ma.current);
			return player.ma.mastered;
		},
		canBeMastered() {
			if (!player.ma.selectionActive) return [];
			if (player.ma.mastered.length==0) return ["p"];
			let rows = player.ma.mastered.map(x => tmp[x].row)
			let realRows = rows.filter(y => Object.keys(ROW_LAYERS[y]).every(z => player.ma.mastered.includes(z) || tmp.ma.masteryGoal[z]===undefined));
			let furthestRow = Math.max(...realRows)+((player.ma.current !== null)?0:1);
			let m = Object.keys(layers).filter(x => (tmp[x].row<=furthestRow&&tmp.ma.masteryGoal[x]!==undefined&&(tmp.ma.specialReqs[x]?tmp.ma.specialReqs[x].every(y => player.ma.mastered.includes(y)):true))||player.ma.mastered.includes(x));
			if (player.ma.current !== null) m.push(player.ma.current);
			
			return m;
		},
		startMastery(layer) {
			if (!confirm("Are you sure you want to start Mastering "+tmp[layer].name+"? This will force a Row 7 reset and put you in a run where only Mastered Layers & this layer will be active!")) return;
			player.ma.current = layer;
			
			if (player[layer].upgrades) player[layer].upgrades = [];
			if (player[layer].challenges) for (let n in player[layer].challenges) player[layer].challenges[n] = null;
			if (player.subtabs[layer]) player.subtabs[layer].mainTabs = "Main Tab";
			if (layer=="n") {
				resetBuyables("n");
				player.n.activeSecondaries = {purpleBlue: false, blueOrange: false, orangePurple: false};
			}
			if (layer=="hs") {
				resetBuyables("hs")
				player.hs.spentHS = new Decimal(0);
			}
			if (layer=="i") resetBuyables("i");
			
			doReset("ma", true);
		},
		completeMastery(layer) {
			let data = tmp.ma;
			if (player[layer].points.lt(data.masteryGoal[layer])) return;
			if (!player.ma.mastered.includes(layer)) player.ma.mastered.push(layer);
			player.ma.selectionActive = false;
			player.ma.current = null;
			doReset("ma", true);
		},
		specialReqs: {
			sb: ["t","e","s"],
			sg: ["t","e","s"],
			h: ["q"],
			o: ["q","h"],
			ss: ["q","h"],
			ps: ["m","ba"],
			n: ["hn"],
			hs: ["hn"],
			i: ["n","hs"],
		},
		masteryGoal: {
			p: new Decimal("1e11488"),
			b: new Decimal(2088),
			g: new Decimal(1257),
			t: new Decimal(814),
			e: new Decimal("e3469000"),
			s: new Decimal(817),
			sb: new Decimal(36),
			sg: new Decimal(20),
			q: new Decimal("e480000"),
			h: new Decimal("e416000"),
			o: new Decimal(1e34),
			ss: new Decimal(21),
			m: new Decimal("1e107350"),
			ba: new Decimal("1e207500"),
			ps: new Decimal(115),
			hn: new Decimal("1e31100"),
			n: new Decimal("1e397"),
			hs: new Decimal("1e512"),
			i: new Decimal(43),
		},
		rowLimit: 6,
};
}
