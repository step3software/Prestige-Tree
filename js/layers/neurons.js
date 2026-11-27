// ne — neurons content. Registration: manifest.js.
function createNeuronsLayer() {
    return {
		name: "neurons", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "NE", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 4, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			first: 0,
			signals: new Decimal(0),
			thoughts: new Decimal(0),
			auto: false,
			autoNN: false,
        }},
        color: "#ded9ff",
        requires() { return (player[this.layer].unlockOrder>0&&!player.ne.unlocked)?new Decimal("1e1160000"):new Decimal("1e1000000") }, // Can be a function that takes requirement increases into account
		increaseUnlockOrder: ["en"],
        resource: "neurons", // Name of prestige currency
        baseResource: "subspace", // Name of resource prestige is based on
        baseAmount() {return player.ss.subspace}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(2.5), // Prestige currency exponent
		base: new Decimal("1e10000"),
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
		canBuyMax() { return false },
        row: 4, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "u", description: "Press U to Neuron Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		resetsNothing() { return player.ne.auto },
        doReset(resettingLayer){ 
			let keep = [];
			if (layers[resettingLayer].row<7&&resettingLayer!="id"&&resettingLayer!="ai"&&resettingLayer!="c") {
				keep.push("thoughts")
				keep.push("buyables")
				if (hasMilestone("ne", 1)) keep.push("milestones");
			}
            if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		effect() {
			let eff = player[this.layer].points.div(2).plus(1).pow(0.75).sub(1);
			if (hasMilestone("ne", 3)) eff = eff.times(Decimal.pow(1.5, player[this.layer].points.sqrt()).plus(player[this.layer].points));
			if (hasMilestone("ne", 6)) eff = eff.pow(2);
			if (hasMilestone("id", 1)) eff = eff.pow(2).times(player[this.layer].buyables[11].max(1));
			return eff;
		},
		effectDescription() { return "which multiply Signal gain speed by <h2 style='color: #ded9ff; text-shadow: #ded9ff 0px 0px 10px;'>"+format(tmp[this.layer].effect)+"</h2>." },
		autoPrestige() { return player.ne.auto },
        layerShown(){return player.mc.unlocked},
        branches: ["ss", "sg"],
		update(diff) {
			if (player.ne.unlocked && (player.ne.activeChallenge==11||hasAchievement("a", 151))) {
				player.ne.signals = player.ne.signals.plus(tmp.ne.challenges[11].amt.times(diff)).min((hasMilestone("ne", 4)||hasMilestone("id", 0))?(1/0):tmp.ne.signalLim);
				if (player.ne.signals.gte(tmp.ne.signalLim.times(0.999))) {
					if (hasMilestone("id", 0)) player.ne.thoughts = player.ne.thoughts.max(tmp.ne.thoughtTarg);
					else {
						if (!hasMilestone("ne", 4) && !hasUpgrade("ai", 14)) player.ne.signals = new Decimal(0);
						player.ne.thoughts = player.ne.thoughts.plus(1);
					}
				}
				if (player.ne.autoNN && hasMilestone("ne", 7)) layers.ne.buyables[11].buyMax();
			}
		},
		signalLimThresholdInc() {
			let inc = new Decimal(hasMilestone("ne", 4)?2:(hasMilestone("ne", 3)?2.5:(hasMilestone("ne", 2)?3:5)));
			if (player.id.unlocked) inc = inc.sub(tmp.id.effect);
			return inc;
		},
		signalLimThresholdDiv() {
			let div = new Decimal(1);
			if (player.c.unlocked && tmp.c) div = div.times(tmp.c.eff2);
			return div;
		},
		signalLim() { return Decimal.pow(tmp[this.layer].signalLimThresholdInc, player.ne.thoughts).times(100).div(tmp[this.layer].signalLimThresholdDiv) },
		thoughtTarg() { return player.ne.signals.times(tmp[this.layer].signalLimThresholdDiv).div(100).max(1).log(tmp[this.layer].signalLimThresholdInc).plus(1).floor() },
		thoughtPower() {
			let pow = new Decimal(1);
			if (player.en.unlocked && hasMilestone("en", 3)) pow = pow.times(tmp.en.mwEff);
			if (hasMilestone("id", 1)) pow = pow.times(1.2);
			return pow;
		},
		thoughtEff1() { return player.ne.thoughts.times(tmp.ne.thoughtPower).plus(1).log10().plus(1).pow(hasMilestone("ne", 1)?2:1) },
		thoughtEff2() { return Decimal.pow("1e800", player.ne.thoughts.times(tmp.ne.thoughtPower).pow(.75)).pow(hasMilestone("ne", 2)?2:1) },
		thoughtEff3() { return Decimal.pow(1.2, player.ne.thoughts.times(hasMilestone("ne", 5)?tmp.ne.thoughtPower:0).sqrt()) },
		challenges: {
			rows: 1,
			cols: 1,
			11: {
				name: "The Brain",
				challengeDescription: "Prestige Upgrade 2, Boosters, & Generators are disabled.<br>",
				unlocked() { return player.ne.unlocked && player.ne.points.gt(0) },
				goal() { return new Decimal(1/0) },
				currencyDisplayName: "",
				currencyInternalName: "points",
				gainMult() { 
					let mult = tmp.ne.effect.times(player.ne.signals.plus(1).log10().plus(1));
					if (hasMilestone("ne", 0)) mult = mult.times(player.ss.points.plus(1).sqrt());
					if (hasMilestone("ne", 2)) mult = mult.times(player.ne.points.max(1));
					if (player.en.unlocked && hasMilestone("en", 3)) mult = mult.times(tmp.en.mwEff.pow(40));
					if (hasAchievement("a", 143)) mult = mult.times(3);
					if (hasMilestone("r", 0)) mult = mult.times(player.r.maxMinibots.max(1));
					if (hasMilestone("r", 4) && tmp.r) mult = mult.times(tmp.r.producerEff.max(1));
					if (hasMilestone("id", 3) && tmp.mc) mult = mult.times(Decimal.pow(2, player.mc.buyables[11].max(1).log10()));
					if (player.ai.unlocked && tmp.ai) mult = mult.times(tmp.ai.conscEff1);
					if (player.c.unlocked && tmp.c) mult = mult.times(tmp.c.eff3);
					if (hasUpgrade("ai", 42)) mult = mult.times(upgradeEffect("ai", 42));
					return mult;
				},
				amt() { 
					let a = Decimal.pow(10, player.points.plus(1).log10().plus(1).log10().div(player.ne.activeChallenge==11?11:14).pow(3)).pow(tmp.ne.buyables[11].effect).times(tmp.ne.challenges[11].gainMult).floor();
					if (!a.eq(a)) return new Decimal(0);
					return a;
				},
				next() { return Decimal.pow(10, Decimal.pow(10, new Decimal((player.ne.activeChallenge==11||hasAchievement("a", 151))?tmp.ne.challenges[11].amt:0).plus(1).div(tmp.ne.challenges[11].gainMult).root(tmp.ne.buyables[11].effect).log10().root(3).times(11)).sub(1)).sub(1) },
				rewardDescription() { return "<br>Signals: <h3 style='color: #ded9ff'>"+formatWhole(player.ne.signals)+"/"+formatWhole(tmp.ne.signalLim)+"</h3> "+(tmp.nerdMode?("(Gain Formula: 10^((log(log(points+1)+1)/11)^3)*"+format(tmp.ne.challenges[11].gainMult)+")"):("(+"+formatWhole((player.ne.activeChallenge==11||hasAchievement("a", 151))?tmp.ne.challenges[11].amt:0)+"/s"+(tmp.ne.challenges[11].amt.lt(1e3)?(", next gain at "+format(tmp.ne.challenges[11].next)+" Points)"):")")))+"<br><br><br>Thoughts: <h3 style='color: #ffbafa'>"+formatWhole(player.ne.thoughts)+"</h3> (Next at "+formatWhole(tmp.ne.signalLim)+" Signals)<br><br>Effects"+(tmp.ne.thoughtPower.eq(1)?"":(" (Power: "+format(tmp.ne.thoughtPower.times(100))+"%)"))+"<br>Cheapen Subspace Energy by "+(tmp.nerdMode?" (Formula: (log(thoughts+1)+1)"+(hasMilestone("ne", 1)?"^2":"")+")":(format(tmp.ne.thoughtEff1)+"x"))+"<br>Multiply Subspace & SG bases by "+(tmp.nerdMode?" (Formula: (1e800^(thoughts^0.75))"+(hasMilestone("ne", 2)?"^2":"")+")":format(tmp.ne.thoughtEff2)+"x")+(hasMilestone("ne", 5)?("<br>Multiply Energy gain by "+(tmp.nerdMode?" (Formula: (1.2^sqrt(thoughts)))":(format(tmp.ne.thoughtEff3)+"x"))):"") },
				style() { return {'background-color': "#484659", filter: "brightness("+(100+player.ne.signals.plus(1).log10().div(tmp.ne.signalLim.plus(1).log10()).times(50).toNumber())+"%)", color: "white", 'border-radius': "25px", height: "400px", width: "400px"}},
				onStart(testInput=false) {
					if (testInput && player.ne.auto) {
						doReset("m", true);
						player.ne.activeChallenge = 11;
						updateTemp();
					}
				},
			},
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "The Neural Network",
				ss() { return hasMilestone("id", 0)?12:10 },
				cost(x=player[this.layer].buyables[this.id]) {
					if (x.gte(tmp[this.layer].buyables[this.id].ss)) x = Decimal.pow(tmp[this.layer].buyables[this.id].ss, x.log(tmp[this.layer].buyables[this.id].ss).pow(hasMilestone("id", 0)?Math.sqrt(2):2));
					return Decimal.pow(4, x.pow(1.2)).times(2e4);
				},
				bulk(r=player.ne.signals) {
					let b = r.div(2e4).max(1).log(4).root(1.2);
					if (b.gte(tmp[this.layer].buyables[this.id].ss)) b = Decimal.pow(tmp[this.layer].buyables[this.id].ss, b.log(tmp[this.layer].buyables[this.id].ss).root(hasMilestone("id", 0)?Math.sqrt(2):2));
					return b.plus(1).floor();
				},
				power() {
					let p = new Decimal(hasUpgrade("ai", 11)?1.5:1);
					if (player.c.unlocked && tmp.c) p = p.times(tmp.c.eff5);
					return p;
				},
				effect() { return player[this.layer].buyables[this.id].times(tmp.ne.buyables[11].power).div(3).plus(1) },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id];
					let cost = data.cost;
					let amt = player[this.layer].buyables[this.id];
                    let display = "Cost: "+format(cost)+" Signals"+(tmp.nerdMode?(" (Cost Formula: 4^("+(amt.gte(data.ss)?(formatWhole(data.ss)+"^(log"+formatWhole(data.ss)+"(x)^"+format(hasMilestone("id", 0)?Math.sqrt(2):2)+")"):"x")+"^1.2)*2e4)"):"")+".<br><br>Level: "+formatWhole(amt)+"<br><br>Effect: Signal gain from Points is raised ^"+format(data.effect)+(tmp.nerdMode?" (Formula: x/3+1)":"");
					return display;
                },
                unlocked() { return unl(this.layer) && hasMilestone("ne", 0) }, 
                canAfford() {
					if (!tmp[this.layer].buyables[this.id].unlocked) return false;
                    return player[this.layer].unlocked && player.ne.signals.gte(layers[this.layer].buyables[this.id].cost());
				},
                buy() { 
					player.ne.signals = player.ne.signals.sub(tmp[this.layer].buyables[this.id].cost).max(0)
					player.ne.buyables[this.id] = player.ne.buyables[this.id].plus(1);
                },
				buyMax() { player.ne.buyables[this.id] = player.ne.buyables[this.id].max(tmp.ne.buyables[11].bulk) },
                style: {'height':'250px', 'width':'250px', 'background-color'() { return tmp.ne.buyables[11].canAfford?'#a2cade':'#bf8f8f' }, "border-color": "#a2cade"},
				autoed() { return hasMilestone("ne", 7)&&player.ne.autoNN },
			},
		},
		milestones: {
			0: {
				requirementDescription: "2,750 Signals",
				done() { return player.ne.signals.gte(2750) || player.ne.milestones.includes(0) },
				effectDescription() { return "Subspace Energy multiplies Signal gain ("+format(player.ss.points.plus(1).sqrt())+"x), and unlock The Neural Network" },
			},
			1: {
				requirementDescription: "50,000 Signals",
				done() { return player.ne.signals.gte(5e4) || player.ne.milestones.includes(1) },
				effectDescription() { return "The first Thought effect is squared, and Neuron milestones are kept on all resets up to Row 7 (except Ideas)" },
			},
			2: {
				requirementDescription: "3,000,000 Signals",
				done() { return player.ne.signals.gte(3e6) || player.ne.milestones.includes(2) },
				effectDescription() { return "The Thought requirement increases slower (5x -> 3x), the second Thought effect is squared, and multiply Signal gain by your Neurons" },
			},
			3: {
				requirementDescription: "150,000,000 Signals",
				done() { return player.ne.signals.gte(1.5e8) || player.ne.milestones.includes(3) },
				effectDescription() { return "The Thought requirement increases even slower (3x -> 2.5x), and the Neuron effect uses a better formula (becomes exponential instead of sub-linear)" },
			},
			4: {
				requirementDescription: "2.5e9 Signals",
				done() { return player.ne.signals.gte(2.5e9) || player.ne.milestones.includes(4) },
				effectDescription() { return "The Thought requirement increases even slower (2.5x -> 2x), and getting a Thought does not reset Signals" },
			},
			5: {
				unlocked() { return player.en.unlocked && player.ne.unlocked },
				requirementDescription() { return "8 Neurons"+(player.id.unlocked?"":" & 2,500,000 Energy in one reset") },
				done() { return (player.ne.best.gte(8) && (player.id.unlocked||player.en.bestOnReset.gte(2.5e6)))||hasAchievement("a", 161) },
				effectDescription() { return "Neurons reset nothing, and unlock Auto-Neurons & a third Thought effect." },
				toggles: [["ne", "auto"]],
			},
			6: {
				unlocked() { return player.id.unlocked },
				requirementDescription: "1e21 Signals",
				done() { return player.ne.signals.gte(1e21) || player.ne.milestones.includes(6) },
				effectDescription() { return "The Neuron effect is squared & multiplied by your Neural Network level" },
			},
			7: {
				unlocked() { return hasUpgrade("ai", 11) },
				requirementDescription: "9 Neurons",
				done() { return hasUpgrade("ai", 11) && player.ne.best.gte(9) },
				effectDescription: "Unlock Auto-Neural Networks.",
				toggles: [["ne", "autoNN"]],
			},
		},
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display", "blank", 
			"milestones", "blank", "blank",
			"challenges", "blank",
			"buyables",
			"blank", "blank", "blank",
		],
};
}
