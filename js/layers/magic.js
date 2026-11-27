// m — magic content. Registration: manifest.js.
function createMagicLayer() {
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
        baseAmount() {return player.h.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent() { return new Decimal(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?0.0085:0.007) }, // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1);
			if (hasAchievement("a", 74)) mult = mult.times(challengeEffect("h", 32));
            return mult.times(tmp.n.realDustEffs2?tmp.n.realDustEffs2.purpleBlue:new Decimal(1));
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 4, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "m", description: "Press M to Magic Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			if (hasMilestone("hn", 0)) keep.push("milestones")
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		passiveGeneration() { return (hasMilestone("hn", 1)&&player.ma.current!="m")?1:0 },
        layerShown(){return player.h.unlocked&&player.o.unlocked },
        branches: ["o","h","q"],
		spellTime() { 
			let time = new Decimal(60);
			if (hasMilestone("m", 3)) time = time.times(tmp.m.spellInputAmt.div(100).plus(1).log10().plus(1));
			return time;
		},
		spellPower() { 
			if (!unl(this.layer)) return new Decimal(0);
			let power = new Decimal(1);
			if (tmp.ps.impr[21].unlocked) power = power.plus(tmp.ps.impr[21].effect.sub(1));
			if (player.n.buyables[11].gte(3)) power = power.plus(buyableEffect("o", 31));
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) power = power.plus(.5);
			return power;
		},
		hexGain() { 
			let gain = new Decimal(1);
			if (tmp.ps.impr[12].unlocked) gain = gain.times(tmp.ps.impr[12].effect);
			return gain;
		},
		mainHexEff() { return player.m.hexes.times(2).plus(1).pow(((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false)?5:10) },
		hexEff() { return softcap("hex", tmp.m.mainHexEff) },
		update(diff) {
			if (!player.m.unlocked) return;
			if (player.m.auto && hasMilestone("hn", 2) && player.m.distrAll && player.ma.current!="m") layers.m.castAllSpells(true, diff);
			for (let i=11;i<=(10+tmp.m.spellsUnlocked);i++) {
				if (tmp.m.buyables[i].unlocked && player.m.auto && hasMilestone("hn", 2) && (!player.m.distrAll||tmp.t.effect2.gt(1)) && player.ma.current!="m") {
					player.m.spellInputs[i] = (player.m.spellTimes[i].gt(0)?player.m.spellInputs[i].max(tmp.m.spellInputAmt):tmp.m.spellInputAmt);
                    player.m.hexes = player.m.hexes.plus(softcap("hexGain", tmp.m.hexGain.times(player.m.spellInputs[i]).times(diff)));
					player.m.spellTimes[i] = tmp.m.spellTime;
				} else if (player.m.spellTimes[i].gt(0)) player.m.spellTimes[i] = player.m.spellTimes[i].sub(diff).max(0);
			}
		},
		spellInputAmt() {
			if (hasMilestone("m", 3) && player.m.spellInput!="1") {
				let factor = new Decimal(player.m.spellInput.split("%")[0]).div(100);
				return player.m.points.times(factor.max(0.01)).floor().max(1);
			} else return new Decimal(1);
		},
		hexEffDesc() {
			let nerd = (tmp.nerdMode?" (2*x+1)^5":"")
			if ((Array.isArray(tmp.ma.mastered))?tmp.ma.mastered.includes(this.layer):false) return "which are multiplying Hindrance Spirit, Quirk, & Solar Energy gain by "+format(tmp.m.mainHexEff)+", and are multiplying Subspace gain by "+format(tmp.m.hexEff)+nerd
			else return "which are multiplying Hindrance Spirit, Quirk, Solar Energy, & Subspace gain by "+format(tmp.m.hexEff)+nerd
		},
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			"milestones",
			"blank",
			["display-text", function() { return tmp.m.spellPower.eq(1)?"":("Spell Power: "+format(tmp.m.spellPower.times(100))+"%") }], "blank",
			"buyables",
			["display-text",
				function() {return "You have "+formatWhole(player.m.hexes)+" Hexes, "+tmp.m.hexEffDesc },
					{}],
		],
		spellsUnlocked() { return 3+player.i.buyables[13].toNumber() },
		castAllSpells(noSpend=false, diff=1) {
			let cost = tmp.m.spellInputAmt;
			let input = tmp.m.spellInputAmt.div(tmp.m.spellsUnlocked);
			for (let i=11;i<=(10+tmp.m.spellsUnlocked);i++) {
				player.m.spellInputs[i] = (player.m.spellTimes[i].gt(0)?player.m.spellInputs[i].max(input):input);
				player.m.spellTimes[i] = tmp.m.spellTime;
			}
			if (!noSpend) player.m.points = player.m.points.sub(cost)
            player.m.hexes = player.m.hexes.plus(softcap("hexGain", tmp.m.hexGain.times(cost).times(diff)))
		},
		buyables: {
			rows: 1,
			cols: 6,
			11: {
				title: "Booster Launch",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					return tmp.m.spellInputAmt;
                },
				effect() {
					let power = tmp.m.spellPower.times(player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = power.div(2).plus(1)
					if (hasUpgrade("ba", 31)) eff = Decimal.pow(1.1, power).times(eff);
					eff = softcap("spell1", eff);
					return eff.div(1.5).max(1);
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = "Effect: Booster base ^1.05, x" + format(data.effect)+"\n\
					Time: "+formatTime(player.m.spellTimes[this.id]||0);
					if (hasMilestone("m", 3)) display += "\n "+(tmp.nerdMode?("Formula: ((log(inserted+1)+1)/2+1)/1.5"):("To Insert: "+formatWhole(tmp.m.spellInputAmt.div((player.m.distrAll && hasMilestone("m", 4))?tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.m.points.gte(tmp[this.layer].buyables[this.id].cost)
				},
                buy() { 
					if (player.m.distrAll && hasMilestone("m", 4)) {
						layers.m.castAllSpells();
						return;
					}
                    cost = tmp[this.layer].buyables[this.id].cost
					player.m.spellInputs[this.id] = (player.m.spellTimes[this.id].gt(0)?player.m.spellInputs[this.id].max(tmp.m.spellInputAmt):tmp.m.spellInputAmt);
                    player.m.points = player.m.points.sub(cost)
                    player.m.hexes = player.m.hexes.plus(softcap("hexGain", tmp.m.hexGain.times(cost)))
					player.m.spellTimes[this.id] = tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
			12: {
				title: "Time Warp",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                  return tmp.m.spellInputAmt;
                },
				effect() {
					let power = tmp.m.spellPower.times(player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = power.div(5).plus(1)
					if (hasUpgrade("ba", 31)) eff = Decimal.pow(1.1, power).times(eff);
					eff = softcap("spell2", eff);
					return eff.div(1.2).max(1);
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = "Effect: Time Capsule base ^1.1, x" + format(data.effect)+"\n\
					Time: "+formatTime(player.m.spellTimes[this.id]||0);
					if (hasMilestone("m", 3)) display += "\n "+(tmp.nerdMode?("Formula: ((log(inserted+1)+1)/5+1)/1.2"):("To Insert: "+formatWhole(tmp.m.spellInputAmt.div((player.m.distrAll && hasMilestone("m", 4))?tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.m.points.gte(tmp[this.layer].buyables[this.id].cost)
				},
                buy() { 
					if (player.m.distrAll && hasMilestone("m", 4)) {
						layers.m.castAllSpells();
						return;
					}
                    cost = tmp[this.layer].buyables[this.id].cost
					player.m.spellInputs[this.id] = (player.m.spellTimes[this.id].gt(0)?player.m.spellInputs[this.id].max(tmp.m.spellInputAmt):tmp.m.spellInputAmt);
                    player.m.points = player.m.points.sub(cost)
                    player.m.hexes = player.m.hexes.plus(softcap("hexGain", tmp.m.hexGain.times(cost)))
					player.m.spellTimes[this.id] = tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
			13: {
				title: "Quirk Amplification",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return tmp.m.spellInputAmt;
                },
				effect() {
					let power = tmp.m.spellPower.times(player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = power.times(1.25)
					eff = softcap("spell3", eff);
					return eff;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = "Effect: +" + format(data.effect)+" Free Quirk Layers\n\
					Time: "+formatTime(player.m.spellTimes[this.id]||0);
					if (hasMilestone("m", 3)) display += "\n "+(tmp.nerdMode?("Formula: (log(inserted+1)+1)*1.25"):("To Insert: "+formatWhole(tmp.m.spellInputAmt.div((player.m.distrAll && hasMilestone("m", 4))?tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.m.points.gte(tmp[this.layer].buyables[this.id].cost)
				},
                buy() { 
					if (player.m.distrAll && hasMilestone("m", 4)) {
						layers.m.castAllSpells();
						return;
					}
                    cost = tmp[this.layer].buyables[this.id].cost
					player.m.spellInputs[this.id] = (player.m.spellTimes[this.id].gt(0)?player.m.spellInputs[this.id].max(tmp.m.spellInputAmt):tmp.m.spellInputAmt);
                    player.m.points = player.m.points.sub(cost)
                    player.m.hexes = player.m.hexes.plus(softcap("hexGain", tmp.m.hexGain.times(cost)))
					player.m.spellTimes[this.id] = tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
			14: {
				title: "Spatial Compression",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return tmp.m.spellInputAmt;
                },
				effect() {
					let power = tmp.m.spellPower.times(player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = Decimal.sub(1, Decimal.div(1, power.plus(1).log10().div(500).plus(1).sqrt()));
					return eff;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = "Effect: Space Building costs scale " + format(data.effect.times(100))+"% slower\n\
					Time: "+formatTime(player.m.spellTimes[this.id]||0);
					if (hasMilestone("m", 3)) display += "\n "+(tmp.nerdMode?("Formula: 1-1/sqrt(log(log(inserted+1)+1)/500+1)"):("To Insert: "+formatWhole(tmp.m.spellInputAmt.div((player.m.distrAll && hasMilestone("m", 4))?tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return player[this.layer].unlocked && player.i.buyables[13].gte(1) }, 
                canAfford() {
                    return player.m.points.gte(tmp[this.layer].buyables[this.id].cost)
				},
                buy() { 
					if (player.m.distrAll && hasMilestone("m", 4)) {
						layers.m.castAllSpells();
						return;
					}
                    cost = tmp[this.layer].buyables[this.id].cost
					player.m.spellInputs[this.id] = (player.m.spellTimes[this.id].gt(0)?player.m.spellInputs[this.id].max(tmp.m.spellInputAmt):tmp.m.spellInputAmt);
                    player.m.points = player.m.points.sub(cost)
                    player.m.hexes = player.m.hexes.plus(softcap("hexGain", tmp.m.hexGain.times(cost)))
					player.m.spellTimes[this.id] = tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
			15: {
				title: "Obstacle Override",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return tmp.m.spellInputAmt;
                },
				effect() {
					let power = tmp.m.spellPower.times(player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = Decimal.sub(1, Decimal.div(1, power.plus(1).log10().times(140).plus(1).sqrt()));
					return eff;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = "Effect: Repeatable Hindrance requirements scale " + format(data.effect.times(100))+"% slower\n\
					Time: "+formatTime(player.m.spellTimes[this.id]||0);
					if (hasMilestone("m", 3)) display += "\n "+(tmp.nerdMode?("Formula: 1-1/sqrt(log(log(inserted+1)+1)*140+1)"):("To Insert: "+formatWhole(tmp.m.spellInputAmt.div((player.m.distrAll && hasMilestone("m", 4))?tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return player[this.layer].unlocked && player.i.buyables[13].gte(2) }, 
                canAfford() {
                    return player.m.points.gte(tmp[this.layer].buyables[this.id].cost)
				},
                buy() { 
					if (player.m.distrAll && hasMilestone("m", 4)) {
						layers.m.castAllSpells();
						return;
					}
                    cost = tmp[this.layer].buyables[this.id].cost
					player.m.spellInputs[this.id] = (player.m.spellTimes[this.id].gt(0)?player.m.spellInputs[this.id].max(tmp.m.spellInputAmt):tmp.m.spellInputAmt);
                    player.m.points = player.m.points.sub(cost)
                    player.m.hexes = player.m.hexes.plus(softcap("hexGain", tmp.m.hexGain.times(cost)))
					player.m.spellTimes[this.id] = tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
			16: {
				title: "Generator Augmentation",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return tmp.m.spellInputAmt;
                },
				effect() {
					let power = tmp.m.spellPower.times(player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = power.plus(1).pow(400);
					return eff;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = "Effect: Multiply the Super Generator base by " + format(data.effect)+"\n\
					Time: "+formatTime(player.m.spellTimes[this.id]||0);
					if (hasMilestone("m", 3)) display += "\n "+(tmp.nerdMode?("Formula: (log(inserted+1)+1)^400"):("To Insert: "+formatWhole(tmp.m.spellInputAmt.div((player.m.distrAll && hasMilestone("m", 4))?tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return player[this.layer].unlocked && player.i.buyables[13].gte(3) }, 
                canAfford() {
                    return player.m.points.gte(tmp[this.layer].buyables[this.id].cost)
				},
                buy() { 
					if (player.m.distrAll && hasMilestone("m", 4)) {
						layers.m.castAllSpells();
						return;
					}
                    cost = tmp[this.layer].buyables[this.id].cost
					player.m.spellInputs[this.id] = (player.m.spellTimes[this.id].gt(0)?player.m.spellInputs[this.id].max(tmp.m.spellInputAmt):tmp.m.spellInputAmt);
                    player.m.points = player.m.points.sub(cost)
                    player.m.hexes = player.m.hexes.plus(softcap("hexGain", tmp.m.hexGain.times(cost)))
					player.m.spellTimes[this.id] = tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Total Magic",
				done() { return player.m.total.gte(2) || (hasMilestone("hn", 0)) },
				effectDescription: "Automatically gain 100% of Solarity gain & Solarity buyables every second.",
			},
			1: {
				requirementDescription: "3 Total Magic",
				done() { return player.m.total.gte(3) || (hasMilestone("hn", 0)) },
				effectDescription: 'Keep all Hindrance completions on all resets.',
			},
			2: {
				requirementDescription: "10 Total Magic",
				done() { return player.m.total.gte(10) || (hasMilestone("hn", 0)) },
				effectDescription: "Automatically gain 100% of Hindrance Spirit gain every second.",
			},
			3: {
				requirementDescription: "5,000 Total Magic",
				done() { return player.m.total.gte(5e3) || (hasMilestone("hn", 0)) },
				effectDescription: "You can insert more Magic into your Spells to make them stronger & last longer.",
				toggles: [{
					layer: "m",
					varName: "spellInput",
					options: ["1","10%","50%","100%"],
				}],
			},
			4: {
				unlocked() { return hasMilestone("m", 3) },
				requirementDescription: "1e10 Total Magic",
				done() { return player.m.total.gte(1e10) || (hasMilestone("hn", 0)) },
				effectDescription: "When casting a Spell, all Spells are casted equally (magic is distributed).",
				toggles: [["m", "distrAll"]],
			},
		},
};
}
