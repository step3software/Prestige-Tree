// en — energy content. Registration: manifest.js.
function createEnergyLayer() {
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
			"background-color": (((player.en.unlocked||canReset("en"))&&!(Array.isArray(tmp.ma.canBeMastered)&&player.ma.selectionActive&&tmp[this.layer].row<tmp.ma.rowLimit&&!tmp.ma.canBeMastered.includes(this.layer)))?"#fbff05":"#bf8f8f"),
        }},
        resource: "energy", // Name of prestige currency
        type: "custom", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		baseResource: "solarity",
		baseAmount() { return player.o.points },
		req() { return (player[this.layer].unlockOrder>0&&!player.en.unlocked)?new Decimal("1e15825"):new Decimal("1e15000") },
		requires() { return this.req() },
		increaseUnlockOrder: ["ne"],
		exp() { return Decimal.add(.8, tmp.en.clickables[11].eff) },
		exponent() { return tmp[this.layer].exp },
		gainMult() {
			let mult = new Decimal(1);
			if (hasMilestone("en", 0)) mult = mult.times(2);
			if (hasMilestone("en", 2)) mult = mult.times(player.o.points.plus(1).log10().plus(1).log10().plus(1));
			if (player.ne.unlocked && hasMilestone("ne", 5)) mult = mult.times(tmp.ne.thoughtEff3);
			if (player.r.unlocked) mult = mult.times(tmp.r.producerEff);
			if (hasMilestone("r", 0)) mult = mult.times(player.r.maxMinibots.max(1));
			if (player.ai.unlocked && tmp.ai) mult = mult.times(tmp.ai.conscEff1);
			return mult;
		},
		getResetGain() {
			let gain = player.o.points.div(tmp.en.req).plus(1).log2().pow(tmp.en.exp);
			return gain.times(tmp.en.gainMult).floor();
		},
		resetGain() { return this.getResetGain() },
		getNextAt() {
			let gain = tmp.en.getResetGain.div(tmp.en.gainMult).plus(1)
			return Decimal.pow(2, gain.root(tmp.en.exp)).times(tmp.en.req);
		},
		passiveGeneration() { return hasMilestone("en", 0)?0.1:0 },
		canReset() {
			return player.o.points.gte(tmp.en.req) && tmp.en.getResetGain.gt(0) && (hasMilestone("en", 0)?player.en.points.lt(tmp.en.getResetGain):player.en.points.eq(0))
		},
		dispGainFormula() {
			let start = tmp.en.req;
			let exp = tmp.en.exp;
			return "log2(x / "+format(start)+")^"+format(exp)
		},
		prestigeButtonText() {
			if (tmp.nerdMode) return "Gain Formula: "+tmp.en.dispGainFormula;
			else return `${ player.en.points.lt(1e3) ? (tmp.en.resetDescription !== undefined ? tmp.en.resetDescription : "Reset for ") : ""}+<b>${formatWhole(tmp.en.getResetGain)}</b> ${tmp.en.resource} ${tmp.en.resetGain.lt(100) && player.en.points.lt(1e3) ? `<br><br>Next at ${format(tmp.en.nextAt)}` : ""}`
		},
		prestigeNotify() {
			if (!canReset("en")) return false;
			if (tmp.en.getResetGain.gte(player.o.points.times(0.1).max(1)) && !tmp.en.passiveGeneration) return true;
			else return false;
		},
		tooltip() { return formatWhole(player.en.points)+" Energy" },
		tooltipLocked() { return "Reach "+formatWhole(tmp.en.req)+" Solarity to unlock (You have "+formatWhole(player.o.points)+" Solarity)" },
        row: 4, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "y", description: "Press Y to Energy Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			if (resettingLayer==this.layer) player.en.target = player.en.target%(hasMilestone("en", 3)?4:3)+1;
			if (layers[resettingLayer].row<7 && resettingLayer!="r" && resettingLayer!="ai" && resettingLayer!="c") {
				keep.push("tw");
				keep.push("sw");
				keep.push("ow");
				keep.push("mw");		
				if (hasMilestone("en", 1)) keep.push("milestones");
			}
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		onPrestige(gain) { player.en.bestOnReset = player.en.bestOnReset.max(gain) },
        layerShown(){return player.mc.unlocked },
        branches: ["sb","o"],
		update(diff) {
			if (!player[this.layer].unlocked) return;
			let subbed = new Decimal(0);
			if (player.en.points.gt(0)) {
				subbed = player.en.points.times(Decimal.sub(1, Decimal.pow(0.75, diff))).plus(diff);
				player.en.points = player.en.points.times(Decimal.pow(0.75, diff)).sub(diff).max(0);
				if (hasMilestone("en", 1)) player.en.stored = player.en.stored.plus(subbed.div(5));
			}
			let sw_mw_exp = hasUpgrade("ai", 34)?0.8:1
			if (hasMilestone("r", 1)) {
				subbed = subbed.times(player.r.total.max(1));
				if (hasMilestone("r", 4) && tmp.r) subbed = subbed.times(tmp.r.producerEff.max(1));
				player.en.tw = player.en.tw.pow(1.5).plus(subbed.div(player.en.target==1?1:3)).root(1.5);
				player.en.ow = player.en.ow.pow(1.5).plus(subbed.div(player.en.target==2?1:3)).root(1.5);
				player.en.sw = player.en.sw.pow(sw_mw_exp*(hasMilestone("en", 4)?2.5:4)).plus(subbed.div(player.en.target==3?1:3)).root(sw_mw_exp*(hasMilestone("en", 4)?2.5:4));
				if (hasMilestone("en", 3)) player.en.mw = player.en.mw.pow(sw_mw_exp*(hasMilestone("en", 4)?5.5:7)).plus(subbed.div(player.en.target==4?1:3)).root(sw_mw_exp*(hasMilestone("en", 4)?5.5:7));
				
			} else switch(player.en.target) {
				case 1: 
					player.en.tw = player.en.tw.pow(1.5).plus(subbed).root(1.5);
					break;
				case 2: 
					player.en.ow = player.en.ow.pow(1.5).plus(subbed).root(1.5);
					break;
				case 3: 
					player.en.sw = player.en.sw.pow(sw_mw_exp*(hasMilestone("en", 4)?2.5:4)).plus(subbed).root(sw_mw_exp*(hasMilestone("en", 4)?2.5:4));
					break;
				case 4: 
					if (hasMilestone("en", 3)) player.en.mw = player.en.mw.pow(sw_mw_exp*(hasMilestone("en", 4)?5.5:7)).plus(subbed).root(sw_mw_exp*(hasMilestone("en", 4)?5.5:7));
					break;
			}
		},
		storageLimit() { return player.en.total.div(2) },
		twEff() { return player.en.tw.plus(1).log10().plus(1).log10().times(10).plus(1).pow(4) },
		owEff() { return player.en.ow.plus(1).log10().plus(1).log10().times(40).pow(1.8) },
		swEff() { return player.en.sw.plus(1).log10().plus(1).log10().plus(1).log10().plus(1) },
		mwEff() { return hasMilestone("en", 3)?player.en.mw.plus(1).log10().plus(1).log10().div(5).plus(1).pow(2):new Decimal(1) },
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display", "blank",
			"milestones",
			"blank", "blank", 
			"clickables",
			"blank", "blank",
			["row", [
				["column", [["display-text", function() { return "<h3 style='color: "+(player.en.target==1?"#e1ffde;":"#8cfa82;")+"'>"+(player.en.target==1?"TIME WATTS":"Time Watts")+"</h3>" }], ["display-text", function() { return "<h4 style='color: #8cfa82;'>"+formatWhole(player.en.tw)+"</h4><br><br>Strengthens Non-Extra Time Capsules by <span style='color: #8cfa82; font-weight: bold; font-size: 20px;'>"+format(tmp.en.twEff.sub(1).times(100))+"</span>%" }]], {width: "100%"}],
				]], "blank", "blank", ["row", [
				["column", [["display-text", function() { return "<h3 style='color: "+(player.en.target==2?"#fff0d9":"#ffd187;")+"'>"+(player.en.target==2?"SOLAR WATTS":"Solar Watts")+"</h3>" }], ["display-text", function() { return "<h4 style='color: #ffd187;'>"+formatWhole(player.en.ow)+"</h4><br><br>Adds <span style='color: #ffd187; font-weight: bold; font-size: 20px;'>"+format(tmp.en.owEff)+"</span> to Solarity gain exponent" }]], {width: "50%"}],
				["column", [["display-text", function() { return "<h3 style='color: "+(player.en.target==3?"#dbfcff;":"#8cf5ff;")+"'>"+(player.en.target==3?"SUPER WATTS":"Super Watts")+"</h3>" }], ["display-text", function() { return "<h4 style='color: #8cf5ff;'>"+formatWhole(player.en.sw)+"</h4><br><br>Strengthens Super Boosters by <span style='color: #8cf5ff; font-weight: bold: font-size: 20px;'>"+format(tmp.en.swEff.sub(1).times(100))+"</span>%" }]], {width: "50%"}],
				]], "blank", "blank", ["row", [
				["column", [["display-text", function() { return hasMilestone("en", 3)?("<h3 style='color: "+(player.en.target==4?"#f4deff;":"#d182ff;")+"'>"+(player.en.target==4?"MIND WATTS":"Mind Watts")+"</h3>"):"" }], ["display-text", function() { return hasMilestone("en", 3)?("<h4 style='color: #d182ff;'>"+formatWhole(player.en.mw)+"</h4><br><br>Strengthens Thought effects by <span style='color: #d182ff; font-weight: bold; font-size: 20px;'>"+format(tmp.en.mwEff.sub(1).times(100))+"</span>%, and multiplies Signal gain by <span style='color: #d182ff; font-weight: bold; font-size: 20px;'>"+format(tmp.en.mwEff.pow(40))+"</span>x"):"" }]], {width: "75%"}],
			], function() { return {display: hasMilestone("en", 3)?"none":""} }],
			"blank", "blank", "blank",
		],
		milestones: {
			0: {
				requirementDescription: "8,750 Energy in one reset",
				done() { return player.en.bestOnReset.gte(8750) || hasAchievement("a", 151) },
				effectDescription: "Gain 10% of Energy gain every second, you can always Energy reset when under 100% of Energy gain, and Energy gain is doubled.",
			},
			1: {
				requirementDescription: "22,500 Energy in one reset",
				done() { return player.en.bestOnReset.gte(22500) || hasAchievement("a", 151) },
				effectDescription: "20% of Energy that's lost over time becomes stored, Energy milestones are kept on all resets up to Row 7 (except Robots & AI), and when below 1, the Stored Energy effect is square rooted.",
			},
			2: {
				requirementDescription: "335,000 Energy in one reset",
				done() { return player.en.bestOnReset.gte(335e3) || hasAchievement("a", 151) },
				effectDescription() { return "Energy gain is multiplied by the double-log of your Solarity ("+format(player.o.points.plus(1).log10().plus(1).log10().plus(1))+"x)." },
			},
			3: {
				unlocked() { return player.en.unlocked && player.ne.unlocked },
				requirementDescription: "250,000,000 Total Energy & 26 Thoughts",
				done() { return (player.en.total.gte(2.5e8) && player.ne.thoughts.gte(26)) || player.en.milestones.includes(3) },
				effectDescription() { return "Unlock Mind Watts." },
			},
			4: {
				unlocked() { return hasMilestone("en", 3) || hasAchievement("a", 151) },
				requirementDescription: "10,000,000 Energy in one reset",
				done() { return player.en.bestOnReset.gte(1e7) || hasAchievement("a", 151) },
				effectDescription() { return "The Mind Watt & Super Watt gain roots are decreased by 1.5" },
			},
		},
		clickables: {
			rows: 1,
			cols: 2,
			11: {
				title: "Store Energy",
				display(){
					return "Stored Energy: <span style='font-size: 20px; font-weight: bold;'>"+formatWhole(player.en.stored)+" / "+formatWhole(tmp.en.storageLimit)+"</span><br><br>"+(tmp.nerdMode?("Effect Formula: log(log(x+1)+1)/5"):("Increases Energy gain exponent by <span style='font-size: 20px; font-weight: bold;'>"+format(tmp.en.clickables[11].eff)+"</span>"))
				},
				eff() { 
					let e = player.en.stored.plus(1).log10().plus(1).log10().div(5);
					if (hasMilestone("en", 1) && e.lt(1)) e = e.sqrt();
					return e;
				},
				unlocked() { return player.en.unlocked },
				canClick() { return player.en.unlocked && player.en.points.gt(0) },
				onClick() { 
					player.en.stored = player.en.stored.plus(player.en.points).min(tmp.en.storageLimit);
					player.en.points = new Decimal(0);
				},
				style: {width: "160px", height: "160px"},
			},
			12: {
				title: "Release Energy",
				display: "",
				unlocked() { return player.en.unlocked },
				canClick() { return player.en.unlocked && player.en.stored.gt(0) },
				onClick() { 
					player.en.points = player.en.points.plus(player.en.stored);
					player.en.best = player.en.best.max(player.en.points);
					player.en.stored = new Decimal(0);
				},
				style: {width: "80px", height: "80px"},
			},
		},
};
}
