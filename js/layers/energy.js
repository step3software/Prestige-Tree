// Session-bound layer owner; composition supplies only the named ports.
// en — energy content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'>} ports */
function createEnergyLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState }) {
    return {
		name: "energy", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "EN", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			bestOnReset: new Decimal(0),
			total: new Decimal(0),
			stored: new Decimal(0),
			target: 0,
			tw: new Decimal(0),
			ow: new Decimal(0),
			sw: new Decimal(0),
			mw: new Decimal(0),
			first: 0,
        }},
        color: "#fbff05",
		nodeStyle() {return {
			"background-color": (((saveState.player.en.unlocked||gameRules.canReset("en"))&&!(Array.isArray(derivedState.tmp.ma.canBeMastered)&&saveState.player.ma.selectionActive&&derivedState.tmp[this.layer].row<derivedState.tmp.ma.rowLimit&&!derivedState.tmp.ma.canBeMastered.includes(this.layer)))?"#fbff05":"#bf8f8f"),
        }},
        resource: "energy", // Name of prestige currency
        type: "custom", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		baseResource: "solarity",
		baseAmount() { return saveState.player.o.points },
		req() { return (saveState.player[this.layer].unlockOrder>0&&!saveState.player.en.unlocked)?new Decimal("1e15825"):new Decimal("1e15000") },
		requires() { return this.req() },
		increaseUnlockOrder: ["ne"],
		exp() { return Decimal.add(.8, derivedState.tmp.en.clickables[11].eff) },
		exponent() { return derivedState.tmp[this.layer].exp },
		gainMult() {
			let mult = new Decimal(1);
			if (gameHelpers.hasMilestone("en", 0)) mult = mult.times(2);
			if (gameHelpers.hasMilestone("en", 2)) mult = mult.times(saveState.player.o.points.plus(1).log10().plus(1).log10().plus(1));
			if (saveState.player.ne.unlocked && gameHelpers.hasMilestone("ne", 5)) mult = mult.times(derivedState.tmp.ne.thoughtEff3);
			if (saveState.player.r.unlocked) mult = mult.times(derivedState.tmp.r.producerEff);
			if (gameHelpers.hasMilestone("r", 0)) mult = mult.times(saveState.player.r.maxMinibots.max(1));
			if (saveState.player.ai.unlocked && derivedState.tmp.ai) mult = mult.times(derivedState.tmp.ai.conscEff1);
			return mult;
		},
		getResetGain() {
			let gain = saveState.player.o.points.div(derivedState.tmp.en.req).plus(1).log2().pow(derivedState.tmp.en.exp);
			return gain.times(derivedState.tmp.en.gainMult).floor();
		},
		resetGain() { return this.getResetGain() },
		getNextAt() {
			let gain = derivedState.tmp.en.getResetGain.div(derivedState.tmp.en.gainMult).plus(1)
			return Decimal.pow(2, gain.root(derivedState.tmp.en.exp)).times(derivedState.tmp.en.req);
		},
		passiveGeneration() { return gameHelpers.hasMilestone("en", 0)?0.1:0 },
		canReset() {
			return saveState.player.o.points.gte(derivedState.tmp.en.req) && derivedState.tmp.en.getResetGain.gt(0) && (gameHelpers.hasMilestone("en", 0)?saveState.player.en.points.lt(derivedState.tmp.en.getResetGain):saveState.player.en.points.eq(0))
		},
		dispGainFormula() {
			let start = derivedState.tmp.en.req;
			let exp = derivedState.tmp.en.exp;
			return "log2(x / "+gameHelpers.format(start)+")^"+gameHelpers.format(exp)
		},
		prestigeButtonText() {
			if (derivedState.tmp.nerdMode) return "Gain Formula: "+derivedState.tmp.en.dispGainFormula;
			else return `${ saveState.player.en.points.lt(1e3) ? (derivedState.tmp.en.resetDescription !== undefined ? derivedState.tmp.en.resetDescription : "Reset for ") : ""}+<b>${gameHelpers.formatWhole(derivedState.tmp.en.getResetGain)}</b> ${derivedState.tmp.en.resource} ${derivedState.tmp.en.resetGain.lt(100) && saveState.player.en.points.lt(1e3) ? `<br><br>Next at ${gameHelpers.format(derivedState.tmp.en.nextAt)}` : ""}`
		},
		prestigeNotify() {
			if (!gameRules.canReset("en")) return false;
			if (derivedState.tmp.en.getResetGain.gte(saveState.player.o.points.times(0.1).max(1)) && !derivedState.tmp.en.passiveGeneration) return true;
			else return false;
		},
		tooltip() { return gameHelpers.formatWhole(saveState.player.en.points)+" Energy" },
		tooltipLocked() { return "Reach "+gameHelpers.formatWhole(derivedState.tmp.en.req)+" Solarity to unlock (You have "+gameHelpers.formatWhole(saveState.player.o.points)+" Solarity)" },
        row: 4, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "y", description: "Press Y to Energy Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			if (resettingLayer==this.layer) saveState.player.en.target = saveState.player.en.target%(gameHelpers.hasMilestone("en", 3)?4:3)+1;
			if (layerRegistry.layers[resettingLayer].row<7 && resettingLayer!="r" && resettingLayer!="ai" && resettingLayer!="c") {
				keep.push("tw");
				keep.push("sw");
				keep.push("ow");
				keep.push("mw");		
				if (gameHelpers.hasMilestone("en", 1)) keep.push("milestones");
			}
			if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
        },
		onPrestige(gain) { saveState.player.en.bestOnReset = saveState.player.en.bestOnReset.max(gain) },
        layerShown(){return saveState.player.mc.unlocked },
        branches: ["sb","o"],
		update(diff) {
			if (!saveState.player[this.layer].unlocked) return;
			let subbed = new Decimal(0);
			if (saveState.player.en.points.gt(0)) {
				subbed = saveState.player.en.points.times(Decimal.sub(1, Decimal.pow(0.75, diff))).plus(diff);
				saveState.player.en.points = saveState.player.en.points.times(Decimal.pow(0.75, diff)).sub(diff).max(0);
				if (gameHelpers.hasMilestone("en", 1)) saveState.player.en.stored = saveState.player.en.stored.plus(subbed.div(5));
			}
			let sw_mw_exp = gameHelpers.hasUpgrade("ai", 34)?0.8:1
			if (gameHelpers.hasMilestone("r", 1)) {
				subbed = subbed.times(saveState.player.r.total.max(1));
				if (gameHelpers.hasMilestone("r", 4) && derivedState.tmp.r) subbed = subbed.times(derivedState.tmp.r.producerEff.max(1));
				saveState.player.en.tw = saveState.player.en.tw.pow(1.5).plus(subbed.div(saveState.player.en.target==1?1:3)).root(1.5);
				saveState.player.en.ow = saveState.player.en.ow.pow(1.5).plus(subbed.div(saveState.player.en.target==2?1:3)).root(1.5);
				saveState.player.en.sw = saveState.player.en.sw.pow(sw_mw_exp*(gameHelpers.hasMilestone("en", 4)?2.5:4)).plus(subbed.div(saveState.player.en.target==3?1:3)).root(sw_mw_exp*(gameHelpers.hasMilestone("en", 4)?2.5:4));
				if (gameHelpers.hasMilestone("en", 3)) saveState.player.en.mw = saveState.player.en.mw.pow(sw_mw_exp*(gameHelpers.hasMilestone("en", 4)?5.5:7)).plus(subbed.div(saveState.player.en.target==4?1:3)).root(sw_mw_exp*(gameHelpers.hasMilestone("en", 4)?5.5:7));
				
			} else switch(saveState.player.en.target) {
				case 1: 
					saveState.player.en.tw = saveState.player.en.tw.pow(1.5).plus(subbed).root(1.5);
					break;
				case 2: 
					saveState.player.en.ow = saveState.player.en.ow.pow(1.5).plus(subbed).root(1.5);
					break;
				case 3: 
					saveState.player.en.sw = saveState.player.en.sw.pow(sw_mw_exp*(gameHelpers.hasMilestone("en", 4)?2.5:4)).plus(subbed).root(sw_mw_exp*(gameHelpers.hasMilestone("en", 4)?2.5:4));
					break;
				case 4: 
					if (gameHelpers.hasMilestone("en", 3)) saveState.player.en.mw = saveState.player.en.mw.pow(sw_mw_exp*(gameHelpers.hasMilestone("en", 4)?5.5:7)).plus(subbed).root(sw_mw_exp*(gameHelpers.hasMilestone("en", 4)?5.5:7));
					break;
			}
		},
		storageLimit() { return saveState.player.en.total.div(2) },
		twEff() { return saveState.player.en.tw.plus(1).log10().plus(1).log10().times(10).plus(1).pow(4) },
		owEff() { return saveState.player.en.ow.plus(1).log10().plus(1).log10().times(40).pow(1.8) },
		swEff() { return saveState.player.en.sw.plus(1).log10().plus(1).log10().plus(1).log10().plus(1) },
		mwEff() { return gameHelpers.hasMilestone("en", 3)?saveState.player.en.mw.plus(1).log10().plus(1).log10().div(5).plus(1).pow(2):new Decimal(1) },
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display", "blank",
			"milestones",
			"blank", "blank", 
			"clickables",
			"blank", "blank",
			["row", [
				["column", [["display-text", function() { return "<h3 style='color: "+(saveState.player.en.target==1?"#e1ffde;":"#8cfa82;")+"'>"+(saveState.player.en.target==1?"TIME WATTS":"Time Watts")+"</h3>" }], ["display-text", function() { return "<h4 style='color: #8cfa82;'>"+gameHelpers.formatWhole(saveState.player.en.tw)+"</h4><br><br>Strengthens Non-Extra Time Capsules by <span style='color: #8cfa82; font-weight: bold; font-size: 20px;'>"+gameHelpers.format(derivedState.tmp.en.twEff.sub(1).times(100))+"</span>%" }]], {width: "100%"}],
				]], "blank", "blank", ["row", [
				["column", [["display-text", function() { return "<h3 style='color: "+(saveState.player.en.target==2?"#fff0d9":"#ffd187;")+"'>"+(saveState.player.en.target==2?"SOLAR WATTS":"Solar Watts")+"</h3>" }], ["display-text", function() { return "<h4 style='color: #ffd187;'>"+gameHelpers.formatWhole(saveState.player.en.ow)+"</h4><br><br>Adds <span style='color: #ffd187; font-weight: bold; font-size: 20px;'>"+gameHelpers.format(derivedState.tmp.en.owEff)+"</span> to Solarity gain exponent" }]], {width: "50%"}],
				["column", [["display-text", function() { return "<h3 style='color: "+(saveState.player.en.target==3?"#dbfcff;":"#8cf5ff;")+"'>"+(saveState.player.en.target==3?"SUPER WATTS":"Super Watts")+"</h3>" }], ["display-text", function() { return "<h4 style='color: #8cf5ff;'>"+gameHelpers.formatWhole(saveState.player.en.sw)+"</h4><br><br>Strengthens Super Boosters by <span style='color: #8cf5ff; font-weight: bold: font-size: 20px;'>"+gameHelpers.format(derivedState.tmp.en.swEff.sub(1).times(100))+"</span>%" }]], {width: "50%"}],
				]], "blank", "blank", ["row", [
				["column", [["display-text", function() { return gameHelpers.hasMilestone("en", 3)?("<h3 style='color: "+(saveState.player.en.target==4?"#f4deff;":"#d182ff;")+"'>"+(saveState.player.en.target==4?"MIND WATTS":"Mind Watts")+"</h3>"):"" }], ["display-text", function() { return gameHelpers.hasMilestone("en", 3)?("<h4 style='color: #d182ff;'>"+gameHelpers.formatWhole(saveState.player.en.mw)+"</h4><br><br>Strengthens Thought effects by <span style='color: #d182ff; font-weight: bold; font-size: 20px;'>"+gameHelpers.format(derivedState.tmp.en.mwEff.sub(1).times(100))+"</span>%, and multiplies Signal gain by <span style='color: #d182ff; font-weight: bold; font-size: 20px;'>"+gameHelpers.format(derivedState.tmp.en.mwEff.pow(40))+"</span>x"):"" }]], {width: "75%"}],
			], function() { return {display: gameHelpers.hasMilestone("en", 3)?"none":""} }],
			"blank", "blank", "blank",
		],
		milestones: {
			0: {
				requirementDescription: "8,750 Energy in one reset",
				done() { return saveState.player.en.bestOnReset.gte(8750) || gameHelpers.hasAchievement("a", 151) },
				effectDescription: "Gain 10% of Energy gain every second, you can always Energy reset when under 100% of Energy gain, and Energy gain is doubled.",
			},
			1: {
				requirementDescription: "22,500 Energy in one reset",
				done() { return saveState.player.en.bestOnReset.gte(22500) || gameHelpers.hasAchievement("a", 151) },
				effectDescription: "20% of Energy that's lost over time becomes stored, Energy milestones are kept on all resets up to Row 7 (except Robots & AI), and when below 1, the Stored Energy effect is square rooted.",
			},
			2: {
				requirementDescription: "335,000 Energy in one reset",
				done() { return saveState.player.en.bestOnReset.gte(335e3) || gameHelpers.hasAchievement("a", 151) },
				effectDescription() { return "Energy gain is multiplied by the double-log of your Solarity ("+gameHelpers.format(saveState.player.o.points.plus(1).log10().plus(1).log10().plus(1))+"x)." },
			},
			3: {
				unlocked() { return saveState.player.en.unlocked && saveState.player.ne.unlocked },
				requirementDescription: "250,000,000 Total Energy & 26 Thoughts",
				done() { return (saveState.player.en.total.gte(2.5e8) && saveState.player.ne.thoughts.gte(26)) || saveState.player.en.milestones.includes(3) },
				effectDescription() { return "Unlock Mind Watts." },
			},
			4: {
				unlocked() { return gameHelpers.hasMilestone("en", 3) || gameHelpers.hasAchievement("a", 151) },
				requirementDescription: "10,000,000 Energy in one reset",
				done() { return saveState.player.en.bestOnReset.gte(1e7) || gameHelpers.hasAchievement("a", 151) },
				effectDescription() { return "The Mind Watt & Super Watt gain roots are decreased by 1.5" },
			},
		},
		clickables: {
			rows: 1,
			cols: 2,
			11: {
				title: "Store Energy",
				display(){
					return "Stored Energy: <span style='font-size: 20px; font-weight: bold;'>"+gameHelpers.formatWhole(saveState.player.en.stored)+" / "+gameHelpers.formatWhole(derivedState.tmp.en.storageLimit)+"</span><br><br>"+(derivedState.tmp.nerdMode?("Effect Formula: log(log(x+1)+1)/5"):("Increases Energy gain exponent by <span style='font-size: 20px; font-weight: bold;'>"+gameHelpers.format(derivedState.tmp.en.clickables[11].eff)+"</span>"))
				},
				eff() { 
					let e = saveState.player.en.stored.plus(1).log10().plus(1).log10().div(5);
					if (gameHelpers.hasMilestone("en", 1) && e.lt(1)) e = e.sqrt();
					return e;
				},
				unlocked() { return saveState.player.en.unlocked },
				canClick() { return saveState.player.en.unlocked && saveState.player.en.points.gt(0) },
				onClick() { 
					saveState.player.en.stored = saveState.player.en.stored.plus(saveState.player.en.points).min(derivedState.tmp.en.storageLimit);
					saveState.player.en.points = new Decimal(0);
				},
				style: {width: "160px", height: "160px"},
			},
			12: {
				title: "Release Energy",
				display: "",
				unlocked() { return saveState.player.en.unlocked },
				canClick() { return saveState.player.en.unlocked && saveState.player.en.stored.gt(0) },
				onClick() { 
					saveState.player.en.points = saveState.player.en.points.plus(saveState.player.en.stored);
					saveState.player.en.best = saveState.player.en.best.max(saveState.player.en.points);
					saveState.player.en.stored = new Decimal(0);
				},
				style: {width: "80px", height: "80px"},
			},
		},
};
}
