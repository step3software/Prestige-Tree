// Session-bound layer owner; composition supplies only the named ports.
// ne — neurons content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'>} ports */
function createNeuronsLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState }) {
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
        requires() { return (saveState.player[this.layer].unlockOrder>0&&!saveState.player.ne.unlocked)?new Decimal("1e1160000"):new Decimal("1e1000000") }, // Can be a function that takes requirement increases into account
		increaseUnlockOrder: ["en"],
        resource: "neurons", // Name of prestige currency
        baseResource: "subspace", // Name of resource prestige is based on
        baseAmount() {return saveState.player.ss.subspace}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(2.5), // Prestige currency exponent
		base: new Decimal("1e10000"),
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
		canBuyMax() { return false },
        row: 4, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "u", description: "Press U to Neuron Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
		resetsNothing() { return saveState.player.ne.auto },
        doReset(resettingLayer){ 
			let keep = [];
			if (layerRegistry.layers[resettingLayer].row<7&&resettingLayer!="id"&&resettingLayer!="ai"&&resettingLayer!="c") {
				keep.push("thoughts")
				keep.push("buyables")
				if (gameHelpers.hasMilestone("ne", 1)) keep.push("milestones");
			}
            if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
        },
		effect() {
			let eff = saveState.player[this.layer].points.div(2).plus(1).pow(0.75).sub(1);
			if (gameHelpers.hasMilestone("ne", 3)) eff = eff.times(Decimal.pow(1.5, saveState.player[this.layer].points.sqrt()).plus(saveState.player[this.layer].points));
			if (gameHelpers.hasMilestone("ne", 6)) eff = eff.pow(2);
			if (gameHelpers.hasMilestone("id", 1)) eff = eff.pow(2).times(saveState.player[this.layer].buyables[11].max(1));
			return eff;
		},
		effectDescription() { return "which multiply Signal gain speed by <h2 style='color: #ded9ff; text-shadow: #ded9ff 0px 0px 10px;'>"+gameHelpers.format(derivedState.tmp[this.layer].effect)+"</h2>." },
		autoPrestige() { return saveState.player.ne.auto },
        layerShown(){return saveState.player.mc.unlocked},
        branches: ["ss", "sg"],
		update(diff) {
			if (saveState.player.ne.unlocked && (saveState.player.ne.activeChallenge==11||gameHelpers.hasAchievement("a", 151))) {
				saveState.player.ne.signals = saveState.player.ne.signals.plus(derivedState.tmp.ne.challenges[11].amt.times(diff)).min((gameHelpers.hasMilestone("ne", 4)||gameHelpers.hasMilestone("id", 0))?(1/0):derivedState.tmp.ne.signalLim);
				if (saveState.player.ne.signals.gte(derivedState.tmp.ne.signalLim.times(0.999))) {
					if (gameHelpers.hasMilestone("id", 0)) saveState.player.ne.thoughts = saveState.player.ne.thoughts.max(derivedState.tmp.ne.thoughtTarg);
					else {
						if (!gameHelpers.hasMilestone("ne", 4) && !gameHelpers.hasUpgrade("ai", 14)) saveState.player.ne.signals = new Decimal(0);
						saveState.player.ne.thoughts = saveState.player.ne.thoughts.plus(1);
					}
				}
				if (saveState.player.ne.autoNN && gameHelpers.hasMilestone("ne", 7)) layerRegistry.layers.ne.buyables[11].buyMax();
			}
		},
		signalLimThresholdInc() {
			let inc = new Decimal(gameHelpers.hasMilestone("ne", 4)?2:(gameHelpers.hasMilestone("ne", 3)?2.5:(gameHelpers.hasMilestone("ne", 2)?3:5)));
			if (saveState.player.id.unlocked) inc = inc.sub(derivedState.tmp.id.effect);
			return inc;
		},
		signalLimThresholdDiv() {
			let div = new Decimal(1);
			if (saveState.player.c.unlocked && derivedState.tmp.c) div = div.times(derivedState.tmp.c.eff2);
			return div;
		},
		signalLim() { return Decimal.pow(derivedState.tmp[this.layer].signalLimThresholdInc, saveState.player.ne.thoughts).times(100).div(derivedState.tmp[this.layer].signalLimThresholdDiv) },
		thoughtTarg() { return saveState.player.ne.signals.times(derivedState.tmp[this.layer].signalLimThresholdDiv).div(100).max(1).log(derivedState.tmp[this.layer].signalLimThresholdInc).plus(1).floor() },
		thoughtPower() {
			let pow = new Decimal(1);
			if (saveState.player.en.unlocked && gameHelpers.hasMilestone("en", 3)) pow = pow.times(derivedState.tmp.en.mwEff);
			if (gameHelpers.hasMilestone("id", 1)) pow = pow.times(1.2);
			return pow;
		},
		thoughtEff1() { return saveState.player.ne.thoughts.times(derivedState.tmp.ne.thoughtPower).plus(1).log10().plus(1).pow(gameHelpers.hasMilestone("ne", 1)?2:1) },
		thoughtEff2() { return Decimal.pow("1e800", saveState.player.ne.thoughts.times(derivedState.tmp.ne.thoughtPower).pow(.75)).pow(gameHelpers.hasMilestone("ne", 2)?2:1) },
		thoughtEff3() { return Decimal.pow(1.2, saveState.player.ne.thoughts.times(gameHelpers.hasMilestone("ne", 5)?derivedState.tmp.ne.thoughtPower:0).sqrt()) },
		challenges: {
			rows: 1,
			cols: 1,
			11: {
				name: "The Brain",
				challengeDescription: "Prestige Upgrade 2, Boosters, & Generators are disabled.<br>",
				unlocked() { return saveState.player.ne.unlocked && saveState.player.ne.points.gt(0) },
				goal() { return new Decimal(1/0) },
				currencyDisplayName: "",
				currencyInternalName: "points",
				gainMult() { 
					let mult = derivedState.tmp.ne.effect.times(saveState.player.ne.signals.plus(1).log10().plus(1));
					if (gameHelpers.hasMilestone("ne", 0)) mult = mult.times(saveState.player.ss.points.plus(1).sqrt());
					if (gameHelpers.hasMilestone("ne", 2)) mult = mult.times(saveState.player.ne.points.max(1));
					if (saveState.player.en.unlocked && gameHelpers.hasMilestone("en", 3)) mult = mult.times(derivedState.tmp.en.mwEff.pow(40));
					if (gameHelpers.hasAchievement("a", 143)) mult = mult.times(3);
					if (gameHelpers.hasMilestone("r", 0)) mult = mult.times(saveState.player.r.maxMinibots.max(1));
					if (gameHelpers.hasMilestone("r", 4) && derivedState.tmp.r) mult = mult.times(derivedState.tmp.r.producerEff.max(1));
					if (gameHelpers.hasMilestone("id", 3) && derivedState.tmp.mc) mult = mult.times(Decimal.pow(2, saveState.player.mc.buyables[11].max(1).log10()));
					if (saveState.player.ai.unlocked && derivedState.tmp.ai) mult = mult.times(derivedState.tmp.ai.conscEff1);
					if (saveState.player.c.unlocked && derivedState.tmp.c) mult = mult.times(derivedState.tmp.c.eff3);
					if (gameHelpers.hasUpgrade("ai", 42)) mult = mult.times(gameHelpers.upgradeEffect("ai", 42));
					return mult;
				},
				amt() { 
					let a = Decimal.pow(10, saveState.player.points.plus(1).log10().plus(1).log10().div(saveState.player.ne.activeChallenge==11?11:14).pow(3)).pow(derivedState.tmp.ne.buyables[11].effect).times(derivedState.tmp.ne.challenges[11].gainMult).floor();
					if (!a.eq(a)) return new Decimal(0);
					return a;
				},
				next() { return Decimal.pow(10, Decimal.pow(10, new Decimal((saveState.player.ne.activeChallenge==11||gameHelpers.hasAchievement("a", 151))?derivedState.tmp.ne.challenges[11].amt:0).plus(1).div(derivedState.tmp.ne.challenges[11].gainMult).root(derivedState.tmp.ne.buyables[11].effect).log10().root(3).times(11)).sub(1)).sub(1) },
				rewardDescription() { return "<br>Signals: <h3 style='color: #ded9ff'>"+gameHelpers.formatWhole(saveState.player.ne.signals)+"/"+gameHelpers.formatWhole(derivedState.tmp.ne.signalLim)+"</h3> "+(derivedState.tmp.nerdMode?("(Gain Formula: 10^((log(log(points+1)+1)/11)^3)*"+gameHelpers.format(derivedState.tmp.ne.challenges[11].gainMult)+")"):("(+"+gameHelpers.formatWhole((saveState.player.ne.activeChallenge==11||gameHelpers.hasAchievement("a", 151))?derivedState.tmp.ne.challenges[11].amt:0)+"/s"+(derivedState.tmp.ne.challenges[11].amt.lt(1e3)?(", next gain at "+gameHelpers.format(derivedState.tmp.ne.challenges[11].next)+" Points)"):")")))+"<br><br><br>Thoughts: <h3 style='color: #ffbafa'>"+gameHelpers.formatWhole(saveState.player.ne.thoughts)+"</h3> (Next at "+gameHelpers.formatWhole(derivedState.tmp.ne.signalLim)+" Signals)<br><br>Effects"+(derivedState.tmp.ne.thoughtPower.eq(1)?"":(" (Power: "+gameHelpers.format(derivedState.tmp.ne.thoughtPower.times(100))+"%)"))+"<br>Cheapen Subspace Energy by "+(derivedState.tmp.nerdMode?" (Formula: (log(thoughts+1)+1)"+(gameHelpers.hasMilestone("ne", 1)?"^2":"")+")":(gameHelpers.format(derivedState.tmp.ne.thoughtEff1)+"x"))+"<br>Multiply Subspace & SG bases by "+(derivedState.tmp.nerdMode?" (Formula: (1e800^(thoughts^0.75))"+(gameHelpers.hasMilestone("ne", 2)?"^2":"")+")":gameHelpers.format(derivedState.tmp.ne.thoughtEff2)+"x")+(gameHelpers.hasMilestone("ne", 5)?("<br>Multiply Energy gain by "+(derivedState.tmp.nerdMode?" (Formula: (1.2^sqrt(thoughts)))":(gameHelpers.format(derivedState.tmp.ne.thoughtEff3)+"x"))):"") },
				style() { return {'background-color': "#484659", filter: "brightness("+(100+saveState.player.ne.signals.plus(1).log10().div(derivedState.tmp.ne.signalLim.plus(1).log10()).times(50).toNumber())+"%)", color: "white", 'border-radius': "25px", height: "400px", width: "400px"}},
				onStart(testInput=false) {
					if (testInput && saveState.player.ne.auto) {
						gameRules.doReset("m", true);
						saveState.player.ne.activeChallenge = 11;
						derivedState.updateTemp();
					}
				},
			},
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "The Neural Network",
				ss() { return gameHelpers.hasMilestone("id", 0)?12:10 },
				cost(x=saveState.player[this.layer].buyables[this.id]) {
					if (x.gte(derivedState.tmp[this.layer].buyables[this.id].ss)) x = Decimal.pow(derivedState.tmp[this.layer].buyables[this.id].ss, x.log(derivedState.tmp[this.layer].buyables[this.id].ss).pow(gameHelpers.hasMilestone("id", 0)?Math.sqrt(2):2));
					return Decimal.pow(4, x.pow(1.2)).times(2e4);
				},
				bulk(r=saveState.player.ne.signals) {
					let b = r.div(2e4).max(1).log(4).root(1.2);
					if (b.gte(derivedState.tmp[this.layer].buyables[this.id].ss)) b = Decimal.pow(derivedState.tmp[this.layer].buyables[this.id].ss, b.log(derivedState.tmp[this.layer].buyables[this.id].ss).root(gameHelpers.hasMilestone("id", 0)?Math.sqrt(2):2));
					return b.plus(1).floor();
				},
				power() {
					let p = new Decimal(gameHelpers.hasUpgrade("ai", 11)?1.5:1);
					if (saveState.player.c.unlocked && derivedState.tmp.c) p = p.times(derivedState.tmp.c.eff5);
					return p;
				},
				effect() { return saveState.player[this.layer].buyables[this.id].times(derivedState.tmp.ne.buyables[11].power).div(3).plus(1) },
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id];
					let cost = data.cost;
					let amt = saveState.player[this.layer].buyables[this.id];
                    let display = "Cost: "+gameHelpers.format(cost)+" Signals"+(derivedState.tmp.nerdMode?(" (Cost Formula: 4^("+(amt.gte(data.ss)?(gameHelpers.formatWhole(data.ss)+"^(log"+gameHelpers.formatWhole(data.ss)+"(x)^"+gameHelpers.format(gameHelpers.hasMilestone("id", 0)?Math.sqrt(2):2)+")"):"x")+"^1.2)*2e4)"):"")+".<br><br>Level: "+gameHelpers.formatWhole(amt)+"<br><br>Effect: Signal gain from Points is raised ^"+gameHelpers.format(data.effect)+(derivedState.tmp.nerdMode?" (Formula: x/3+1)":"");
					return display;
                },
                unlocked() { return gameHelpers.unl(this.layer) && gameHelpers.hasMilestone("ne", 0) },
                canAfford() {
					if (!derivedState.tmp[this.layer].buyables[this.id].unlocked) return false;
                    return saveState.player[this.layer].unlocked && saveState.player.ne.signals.gte(layerRegistry.layers[this.layer].buyables[this.id].cost());
				},
                buy() { 
					saveState.player.ne.signals = saveState.player.ne.signals.sub(derivedState.tmp[this.layer].buyables[this.id].cost).max(0)
					saveState.player.ne.buyables[this.id] = saveState.player.ne.buyables[this.id].plus(1);
                },
				buyMax() { saveState.player.ne.buyables[this.id] = saveState.player.ne.buyables[this.id].max(derivedState.tmp.ne.buyables[11].bulk) },
                style: {'height':'250px', 'width':'250px', 'background-color'() { return derivedState.tmp.ne.buyables[11].canAfford?'#a2cade':'#bf8f8f' }, "border-color": "#a2cade"},
				autoed() { return gameHelpers.hasMilestone("ne", 7)&&saveState.player.ne.autoNN },
			},
		},
		milestones: {
			0: {
				requirementDescription: "2,750 Signals",
				done() { return saveState.player.ne.signals.gte(2750) || saveState.player.ne.milestones.includes(0) },
				effectDescription() { return "Subspace Energy multiplies Signal gain ("+gameHelpers.format(saveState.player.ss.points.plus(1).sqrt())+"x), and unlock The Neural Network" },
			},
			1: {
				requirementDescription: "50,000 Signals",
				done() { return saveState.player.ne.signals.gte(5e4) || saveState.player.ne.milestones.includes(1) },
				effectDescription() { return "The first Thought effect is squared, and Neuron milestones are kept on all resets up to Row 7 (except Ideas)" },
			},
			2: {
				requirementDescription: "3,000,000 Signals",
				done() { return saveState.player.ne.signals.gte(3e6) || saveState.player.ne.milestones.includes(2) },
				effectDescription() { return "The Thought requirement increases slower (5x -> 3x), the second Thought effect is squared, and multiply Signal gain by your Neurons" },
			},
			3: {
				requirementDescription: "150,000,000 Signals",
				done() { return saveState.player.ne.signals.gte(1.5e8) || saveState.player.ne.milestones.includes(3) },
				effectDescription() { return "The Thought requirement increases even slower (3x -> 2.5x), and the Neuron effect uses a better formula (becomes exponential instead of sub-linear)" },
			},
			4: {
				requirementDescription: "2.5e9 Signals",
				done() { return saveState.player.ne.signals.gte(2.5e9) || saveState.player.ne.milestones.includes(4) },
				effectDescription() { return "The Thought requirement increases even slower (2.5x -> 2x), and getting a Thought does not reset Signals" },
			},
			5: {
				unlocked() { return saveState.player.en.unlocked && saveState.player.ne.unlocked },
				requirementDescription() { return "8 Neurons"+(saveState.player.id.unlocked?"":" & 2,500,000 Energy in one reset") },
				done() { return (saveState.player.ne.best.gte(8) && (saveState.player.id.unlocked||saveState.player.en.bestOnReset.gte(2.5e6)))||gameHelpers.hasAchievement("a", 161) },
				effectDescription() { return "Neurons reset nothing, and unlock Auto-Neurons & a third Thought effect." },
				toggles: [["ne", "auto"]],
			},
			6: {
				unlocked() { return saveState.player.id.unlocked },
				requirementDescription: "1e21 Signals",
				done() { return saveState.player.ne.signals.gte(1e21) || saveState.player.ne.milestones.includes(6) },
				effectDescription() { return "The Neuron effect is squared & multiplied by your Neural Network level" },
			},
			7: {
				unlocked() { return gameHelpers.hasUpgrade("ai", 11) },
				requirementDescription: "9 Neurons",
				done() { return gameHelpers.hasUpgrade("ai", 11) && saveState.player.ne.best.gte(9) },
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
