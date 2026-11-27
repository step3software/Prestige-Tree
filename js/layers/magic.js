// Session-bound layer owner; composition supplies only the named ports.
// m — magic content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'derivedState'|'gameHelpers'|'gameRules'|'layerRegistry'|'saveState'|'softcapRules'>} ports */
function createMagicLayer({ derivedState, gameHelpers, gameRules, layerRegistry, saveState, softcapRules }) {
    return {
		name: "magic", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "M", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			spellTimes: {
				11: new Decimal(0),
				12: new Decimal(0),
				13: new Decimal(0),
				14: new Decimal(0),
				15: new Decimal(0),
				16: new Decimal(0),
			},
			spellInputs: {
				11: new Decimal(1),
				12: new Decimal(1),
				13: new Decimal(1),
				14: new Decimal(1),
				15: new Decimal(1),
				16: new Decimal(1),
			},
			spellInput: "1",
			distrAll: false,
			hexes: new Decimal(0),
			auto: false,
			first: 0,
        }},
        color: "#eb34c0",
        requires: new Decimal(1e285), // Can be a function that takes requirement increases into account
        resource: "magic", // Name of prestige currency
        baseResource: "hindrance spirit", // Name of resource prestige is based on
        baseAmount() {return saveState.player.h.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return new Decimal(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?0.0085:0.007) }, // Prestige currency exponent
        gainMult() {
	let mult; // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1);
			if (gameHelpers.hasAchievement("a", 74)) mult = mult.times(gameHelpers.challengeEffect("h", 32));
            return mult.times(derivedState.tmp.n.realDustEffs2?derivedState.tmp.n.realDustEffs2.purpleBlue:new Decimal(1));
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 4, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "m", description: "Press M to Magic Reset", onPress(){if (gameRules.canReset(this.layer)) gameRules.doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			if (gameHelpers.hasMilestone("hn", 0)) keep.push("milestones")
			if (layerRegistry.layers[resettingLayer].row > this.row) gameRules.layerDataReset(this.layer, keep)
        },
		passiveGeneration() { return (gameHelpers.hasMilestone("hn", 1)&&saveState.player.ma.current!="m")?1:0 },
        layerShown(){return saveState.player.h.unlocked&&saveState.player.o.unlocked },
        branches: ["o","h","q"],
		spellTime() { 
			let time = new Decimal(60);
			if (gameHelpers.hasMilestone("m", 3)) time = time.times(derivedState.tmp.m.spellInputAmt.div(100).plus(1).log10().plus(1));
			return time;
		},
		spellPower() { 
			if (!gameHelpers.unl(this.layer)) return new Decimal(0);
			let power = new Decimal(1);
			if (derivedState.tmp.ps.impr[21].unlocked) power = power.plus(derivedState.tmp.ps.impr[21].effect.sub(1));
			if (saveState.player.n.buyables[11].gte(3)) power = power.plus(gameHelpers.buyableEffect("o", 31));
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) power = power.plus(.5);
			return power;
		},
		hexGain() { 
			let gain = new Decimal(1);
			if (derivedState.tmp.ps.impr[12].unlocked) gain = gain.times(derivedState.tmp.ps.impr[12].effect);
			return gain;
		},
		mainHexEff() { return saveState.player.m.hexes.times(2).plus(1).pow(((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false)?5:10) },
		hexEff() { return softcapRules.softcap("hex", derivedState.tmp.m.mainHexEff) },
		update(diff) {
			if (!saveState.player.m.unlocked) return;
			if (saveState.player.m.auto && gameHelpers.hasMilestone("hn", 2) && saveState.player.m.distrAll && saveState.player.ma.current!="m") layerRegistry.layers.m.castAllSpells(true, diff);
			for (let i=11;i<=(10+derivedState.tmp.m.spellsUnlocked);i++) {
				if (derivedState.tmp.m.buyables[i].unlocked && saveState.player.m.auto && gameHelpers.hasMilestone("hn", 2) && (!saveState.player.m.distrAll||derivedState.tmp.t.effect2.gt(1)) && saveState.player.ma.current!="m") {
					saveState.player.m.spellInputs[i] = (saveState.player.m.spellTimes[i].gt(0)?saveState.player.m.spellInputs[i].max(derivedState.tmp.m.spellInputAmt):derivedState.tmp.m.spellInputAmt);
                    saveState.player.m.hexes = saveState.player.m.hexes.plus(softcapRules.softcap("hexGain", derivedState.tmp.m.hexGain.times(saveState.player.m.spellInputs[i]).times(diff)));
					saveState.player.m.spellTimes[i] = derivedState.tmp.m.spellTime;
				} else if (saveState.player.m.spellTimes[i].gt(0)) saveState.player.m.spellTimes[i] = saveState.player.m.spellTimes[i].sub(diff).max(0);
			}
		},
		spellInputAmt() {
			if (gameHelpers.hasMilestone("m", 3) && saveState.player.m.spellInput!="1") {
				let factor = new Decimal(saveState.player.m.spellInput.split("%")[0]).div(100);
				return saveState.player.m.points.times(factor.max(0.01)).floor().max(1);
			} else return new Decimal(1);
		},
		hexEffDesc() {
			let nerd = (derivedState.tmp.nerdMode?" (2*x+1)^5":"")
			if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes(this.layer):false) return "which are multiplying Hindrance Spirit, Quirk, & Solar Energy gain by "+gameHelpers.format(derivedState.tmp.m.mainHexEff)+", and are multiplying Subspace gain by "+gameHelpers.format(derivedState.tmp.m.hexEff)+nerd
			else return "which are multiplying Hindrance Spirit, Quirk, Solar Energy, & Subspace gain by "+gameHelpers.format(derivedState.tmp.m.hexEff)+nerd
		},
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			"milestones",
			"blank",
			["display-text", function() { return derivedState.tmp.m.spellPower.eq(1)?"":("Spell Power: "+gameHelpers.format(derivedState.tmp.m.spellPower.times(100))+"%") }], "blank",
			"buyables",
			["display-text",
				function() {return "You have "+gameHelpers.formatWhole(saveState.player.m.hexes)+" Hexes, "+derivedState.tmp.m.hexEffDesc },
					{}],
		],
		spellsUnlocked() { return 3+saveState.player.i.buyables[13].toNumber() },
		castAllSpells(noSpend=false, diff=1) {
			let cost = derivedState.tmp.m.spellInputAmt;
			let input = derivedState.tmp.m.spellInputAmt.div(derivedState.tmp.m.spellsUnlocked);
			for (let i=11;i<=(10+derivedState.tmp.m.spellsUnlocked);i++) {
				saveState.player.m.spellInputs[i] = (saveState.player.m.spellTimes[i].gt(0)?saveState.player.m.spellInputs[i].max(input):input);
				saveState.player.m.spellTimes[i] = derivedState.tmp.m.spellTime;
			}
			if (!noSpend) saveState.player.m.points = saveState.player.m.points.sub(cost)
            saveState.player.m.hexes = saveState.player.m.hexes.plus(softcapRules.softcap("hexGain", derivedState.tmp.m.hexGain.times(cost).times(diff)))
		},
		buyables: {
			rows: 1,
			cols: 6,
			11: {
				title: "Booster Launch",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					return derivedState.tmp.m.spellInputAmt;
                },
				effect() {
					let power = derivedState.tmp.m.spellPower.times(saveState.player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (saveState.player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = power.div(2).plus(1)
					if (gameHelpers.hasUpgrade("ba", 31)) eff = Decimal.pow(1.1, power).times(eff);
					eff = softcapRules.softcap("spell1", eff);
					return eff.div(1.5).max(1);
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = "Effect: Booster base ^1.05, x" + gameHelpers.format(data.effect)+"\n\
					Time: "+gameHelpers.formatTime(saveState.player.m.spellTimes[this.id]||0);
					if (gameHelpers.hasMilestone("m", 3)) display += "\n "+(derivedState.tmp.nerdMode?("Formula: ((log(inserted+1)+1)/2+1)/1.5"):("To Insert: "+gameHelpers.formatWhole(derivedState.tmp.m.spellInputAmt.div((saveState.player.m.distrAll && gameHelpers.hasMilestone("m", 4))?derivedState.tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
                    return saveState.player.m.points.gte(derivedState.tmp[this.layer].buyables[this.id].cost)
				},
                buy() {
	let cost;
					if (saveState.player.m.distrAll && gameHelpers.hasMilestone("m", 4)) {
						layerRegistry.layers.m.castAllSpells();
						return;
					}
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
					saveState.player.m.spellInputs[this.id] = (saveState.player.m.spellTimes[this.id].gt(0)?saveState.player.m.spellInputs[this.id].max(derivedState.tmp.m.spellInputAmt):derivedState.tmp.m.spellInputAmt);
                    saveState.player.m.points = saveState.player.m.points.sub(cost)
                    saveState.player.m.hexes = saveState.player.m.hexes.plus(softcapRules.softcap("hexGain", derivedState.tmp.m.hexGain.times(cost)))
					saveState.player.m.spellTimes[this.id] = derivedState.tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
			12: {
				title: "Time Warp",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                  return derivedState.tmp.m.spellInputAmt;
                },
				effect() {
					let power = derivedState.tmp.m.spellPower.times(saveState.player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (saveState.player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = power.div(5).plus(1)
					if (gameHelpers.hasUpgrade("ba", 31)) eff = Decimal.pow(1.1, power).times(eff);
					eff = softcapRules.softcap("spell2", eff);
					return eff.div(1.2).max(1);
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = "Effect: Time Capsule base ^1.1, x" + gameHelpers.format(data.effect)+"\n\
					Time: "+gameHelpers.formatTime(saveState.player.m.spellTimes[this.id]||0);
					if (gameHelpers.hasMilestone("m", 3)) display += "\n "+(derivedState.tmp.nerdMode?("Formula: ((log(inserted+1)+1)/5+1)/1.2"):("To Insert: "+gameHelpers.formatWhole(derivedState.tmp.m.spellInputAmt.div((saveState.player.m.distrAll && gameHelpers.hasMilestone("m", 4))?derivedState.tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
                    return saveState.player.m.points.gte(derivedState.tmp[this.layer].buyables[this.id].cost)
				},
                buy() {
	let cost;
					if (saveState.player.m.distrAll && gameHelpers.hasMilestone("m", 4)) {
						layerRegistry.layers.m.castAllSpells();
						return;
					}
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
					saveState.player.m.spellInputs[this.id] = (saveState.player.m.spellTimes[this.id].gt(0)?saveState.player.m.spellInputs[this.id].max(derivedState.tmp.m.spellInputAmt):derivedState.tmp.m.spellInputAmt);
                    saveState.player.m.points = saveState.player.m.points.sub(cost)
                    saveState.player.m.hexes = saveState.player.m.hexes.plus(softcapRules.softcap("hexGain", derivedState.tmp.m.hexGain.times(cost)))
					saveState.player.m.spellTimes[this.id] = derivedState.tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
			13: {
				title: "Quirk Amplification",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return derivedState.tmp.m.spellInputAmt;
                },
				effect() {
					let power = derivedState.tmp.m.spellPower.times(saveState.player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (saveState.player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = power.times(1.25)
					eff = softcapRules.softcap("spell3", eff);
					return eff;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = "Effect: +" + gameHelpers.format(data.effect)+" Free Quirk Layers\n\
					Time: "+gameHelpers.formatTime(saveState.player.m.spellTimes[this.id]||0);
					if (gameHelpers.hasMilestone("m", 3)) display += "\n "+(derivedState.tmp.nerdMode?("Formula: (log(inserted+1)+1)*1.25"):("To Insert: "+gameHelpers.formatWhole(derivedState.tmp.m.spellInputAmt.div((saveState.player.m.distrAll && gameHelpers.hasMilestone("m", 4))?derivedState.tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked },
                canAfford() {
                    return saveState.player.m.points.gte(derivedState.tmp[this.layer].buyables[this.id].cost)
				},
                buy() {
	let cost;
					if (saveState.player.m.distrAll && gameHelpers.hasMilestone("m", 4)) {
						layerRegistry.layers.m.castAllSpells();
						return;
					}
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
					saveState.player.m.spellInputs[this.id] = (saveState.player.m.spellTimes[this.id].gt(0)?saveState.player.m.spellInputs[this.id].max(derivedState.tmp.m.spellInputAmt):derivedState.tmp.m.spellInputAmt);
                    saveState.player.m.points = saveState.player.m.points.sub(cost)
                    saveState.player.m.hexes = saveState.player.m.hexes.plus(softcapRules.softcap("hexGain", derivedState.tmp.m.hexGain.times(cost)))
					saveState.player.m.spellTimes[this.id] = derivedState.tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
			14: {
				title: "Spatial Compression",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return derivedState.tmp.m.spellInputAmt;
                },
				effect() {
					let power = derivedState.tmp.m.spellPower.times(saveState.player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (saveState.player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = Decimal.sub(1, Decimal.div(1, power.plus(1).log10().div(500).plus(1).sqrt()));
					return eff;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = "Effect: Space Building costs scale " + gameHelpers.format(data.effect.times(100))+"% slower\n\
					Time: "+gameHelpers.formatTime(saveState.player.m.spellTimes[this.id]||0);
					if (gameHelpers.hasMilestone("m", 3)) display += "\n "+(derivedState.tmp.nerdMode?("Formula: 1-1/sqrt(log(log(inserted+1)+1)/500+1)"):("To Insert: "+gameHelpers.formatWhole(derivedState.tmp.m.spellInputAmt.div((saveState.player.m.distrAll && gameHelpers.hasMilestone("m", 4))?derivedState.tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked && saveState.player.i.buyables[13].gte(1) },
                canAfford() {
                    return saveState.player.m.points.gte(derivedState.tmp[this.layer].buyables[this.id].cost)
				},
                buy() {
	let cost;
					if (saveState.player.m.distrAll && gameHelpers.hasMilestone("m", 4)) {
						layerRegistry.layers.m.castAllSpells();
						return;
					}
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
					saveState.player.m.spellInputs[this.id] = (saveState.player.m.spellTimes[this.id].gt(0)?saveState.player.m.spellInputs[this.id].max(derivedState.tmp.m.spellInputAmt):derivedState.tmp.m.spellInputAmt);
                    saveState.player.m.points = saveState.player.m.points.sub(cost)
                    saveState.player.m.hexes = saveState.player.m.hexes.plus(softcapRules.softcap("hexGain", derivedState.tmp.m.hexGain.times(cost)))
					saveState.player.m.spellTimes[this.id] = derivedState.tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
			15: {
				title: "Obstacle Override",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return derivedState.tmp.m.spellInputAmt;
                },
				effect() {
					let power = derivedState.tmp.m.spellPower.times(saveState.player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (saveState.player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = Decimal.sub(1, Decimal.div(1, power.plus(1).log10().times(140).plus(1).sqrt()));
					return eff;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = "Effect: Repeatable Hindrance requirements scale " + gameHelpers.format(data.effect.times(100))+"% slower\n\
					Time: "+gameHelpers.formatTime(saveState.player.m.spellTimes[this.id]||0);
					if (gameHelpers.hasMilestone("m", 3)) display += "\n "+(derivedState.tmp.nerdMode?("Formula: 1-1/sqrt(log(log(inserted+1)+1)*140+1)"):("To Insert: "+gameHelpers.formatWhole(derivedState.tmp.m.spellInputAmt.div((saveState.player.m.distrAll && gameHelpers.hasMilestone("m", 4))?derivedState.tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked && saveState.player.i.buyables[13].gte(2) },
                canAfford() {
                    return saveState.player.m.points.gte(derivedState.tmp[this.layer].buyables[this.id].cost)
				},
                buy() {
	let cost;
					if (saveState.player.m.distrAll && gameHelpers.hasMilestone("m", 4)) {
						layerRegistry.layers.m.castAllSpells();
						return;
					}
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
					saveState.player.m.spellInputs[this.id] = (saveState.player.m.spellTimes[this.id].gt(0)?saveState.player.m.spellInputs[this.id].max(derivedState.tmp.m.spellInputAmt):derivedState.tmp.m.spellInputAmt);
                    saveState.player.m.points = saveState.player.m.points.sub(cost)
                    saveState.player.m.hexes = saveState.player.m.hexes.plus(softcapRules.softcap("hexGain", derivedState.tmp.m.hexGain.times(cost)))
					saveState.player.m.spellTimes[this.id] = derivedState.tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
			16: {
				title: "Generator Augmentation",
				cost(x=saveState.player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return derivedState.tmp.m.spellInputAmt;
                },
				effect() {
					let power = derivedState.tmp.m.spellPower.times(saveState.player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (saveState.player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = power.plus(1).pow(400);
					return eff;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = derivedState.tmp[this.layer].buyables[this.id]
                    let display = "Effect: Multiply the Super Generator base by " + gameHelpers.format(data.effect)+"\n\
					Time: "+gameHelpers.formatTime(saveState.player.m.spellTimes[this.id]||0);
					if (gameHelpers.hasMilestone("m", 3)) display += "\n "+(derivedState.tmp.nerdMode?("Formula: (log(inserted+1)+1)^400"):("To Insert: "+gameHelpers.formatWhole(derivedState.tmp.m.spellInputAmt.div((saveState.player.m.distrAll && gameHelpers.hasMilestone("m", 4))?derivedState.tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return saveState.player[this.layer].unlocked && saveState.player.i.buyables[13].gte(3) },
                canAfford() {
                    return saveState.player.m.points.gte(derivedState.tmp[this.layer].buyables[this.id].cost)
				},
                buy() {
	let cost;
					if (saveState.player.m.distrAll && gameHelpers.hasMilestone("m", 4)) {
						layerRegistry.layers.m.castAllSpells();
						return;
					}
                    cost = derivedState.tmp[this.layer].buyables[this.id].cost
					saveState.player.m.spellInputs[this.id] = (saveState.player.m.spellTimes[this.id].gt(0)?saveState.player.m.spellInputs[this.id].max(derivedState.tmp.m.spellInputAmt):derivedState.tmp.m.spellInputAmt);
                    saveState.player.m.points = saveState.player.m.points.sub(cost)
                    saveState.player.m.hexes = saveState.player.m.hexes.plus(softcapRules.softcap("hexGain", derivedState.tmp.m.hexGain.times(cost)))
					saveState.player.m.spellTimes[this.id] = derivedState.tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Total Magic",
				done() { return saveState.player.m.total.gte(2) || (gameHelpers.hasMilestone("hn", 0)) },
				effectDescription: "Automatically gain 100% of Solarity gain & Solarity buyables every second.",
			},
			1: {
				requirementDescription: "3 Total Magic",
				done() { return saveState.player.m.total.gte(3) || (gameHelpers.hasMilestone("hn", 0)) },
				effectDescription: 'Keep all Hindrance completions on all resets.',
			},
			2: {
				requirementDescription: "10 Total Magic",
				done() { return saveState.player.m.total.gte(10) || (gameHelpers.hasMilestone("hn", 0)) },
				effectDescription: "Automatically gain 100% of Hindrance Spirit gain every second.",
			},
			3: {
				requirementDescription: "5,000 Total Magic",
				done() { return saveState.player.m.total.gte(5e3) || (gameHelpers.hasMilestone("hn", 0)) },
				effectDescription: "You can insert more Magic into your Spells to make them stronger & last longer.",
				toggles: [{
					layer: "m",
					varName: "spellInput",
					options: ["1","10%","50%","100%"],
				}],
			},
			4: {
				unlocked() { return gameHelpers.hasMilestone("m", 3) },
				requirementDescription: "1e10 Total Magic",
				done() { return saveState.player.m.total.gte(1e10) || (gameHelpers.hasMilestone("hn", 0)) },
				effectDescription: "When casting a Spell, all Spells are casted equally (magic is distributed).",
				toggles: [["m", "distrAll"]],
			},
		},
};
}
