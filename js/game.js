// Session-bound gameRules owner; composition supplies only the named ports.
function createGameRules({ derivedState, effects, gameHelpers, gameView, layerRegistry, modRules, runtimeServices, saveCommands, saveDefaults, saveState, softcapRules, treeCanvas }) {
let needCanvasUpdate = true;
// Vue observes this same rule-owned object; a computed scalar getter would
// otherwise cache its first value without seeing the endgame transition.
/** @type {{gameEnded:boolean|1}} */
const status = effects.observe({ gameEnded: false });

// Don't change this
const TMT_VERSION = {
	tmtNum: "2.2.1",
	tmtName: "Uprooted"
}

function getResetGain(layer, useType = null) {
	let type = useType
	if (!useType) type = derivedState.tmp[layer].type
	if(derivedState.tmp[layer].type == "none")
		return new Decimal (0)
	if (derivedState.tmp[layer].gainExp.eq(0)) return new Decimal(0)
	if (type=="static") {
		if ((!derivedState.tmp[layer].canBuyMax) || derivedState.tmp[layer].baseAmount.lt(derivedState.tmp[layer].requires)) return new Decimal(1)
		let gain = derivedState.tmp[layer].baseAmount.div(derivedState.tmp[layer].requires).div(derivedState.tmp[layer].gainMult).max(1).log(derivedState.tmp[layer].base).times(derivedState.tmp[layer].gainExp).pow(Decimal.pow(derivedState.tmp[layer].exponent, -1))
		gain = softcapRules.softcapStaticGain(gain, derivedState.tmp[layer].row)
		return gain.floor().sub(saveState.player[layer].points).add(1).max(1);
	} else if (type=="normal"){
		if (derivedState.tmp[layer].baseAmount.lt(derivedState.tmp[layer].requires)) return new Decimal(0)
		let gain = derivedState.tmp[layer].baseAmount.div(derivedState.tmp[layer].requires).pow(derivedState.tmp[layer].exponent).times(derivedState.tmp[layer].gainMult).pow(derivedState.tmp[layer].gainExp)
		gain = softcapRules.softcap("normal_layers_2", softcapRules.softcap("normal_layers", gain));
		if (layer=="e") gain = softcapRules.softcap("epGain", gain);
		return gain.floor().max(0);
	} else if (type=="custom"){
		return layerRegistry.layers[layer].getResetGain()
	} else {
		return new Decimal(0)
	}
}

function getNextAt(layer, canMax=false, useType = null) {
	let type = useType
	if (!useType) type = derivedState.tmp[layer].type
	if(derivedState.tmp[layer].type == "none")
		return new Decimal (Infinity)

	if (derivedState.tmp[layer].gainMult.lte(0)) return new Decimal(Infinity)
	if (derivedState.tmp[layer].gainExp.lte(0)) return new Decimal(Infinity)

	if (type=="static") 
	{
		if (!derivedState.tmp[layer].canBuyMax) canMax = false
		let amt = saveState.player[layer].points.plus((canMax&&derivedState.tmp[layer].baseAmount.gte(derivedState.tmp[layer].nextAt))?derivedState.tmp[layer].resetGain:0)
		amt = softcapRules.scaleStaticCost(amt, derivedState.tmp[layer].row)
		let extraCost = Decimal.pow(derivedState.tmp[layer].base, amt.pow(derivedState.tmp[layer].exponent).div(derivedState.tmp[layer].gainExp)).times(derivedState.tmp[layer].gainMult)
		let cost = extraCost.times(derivedState.tmp[layer].requires).max(derivedState.tmp[layer].requires)
		if (derivedState.tmp[layer].roundUpCost) cost = cost.ceil()
		return cost;
	} else if (type=="normal"){
		let next = derivedState.tmp[layer].resetGain.add(1)
		next = softcapRules.reverse_softcap("normal_layers", softcapRules.reverse_softcap("normal_layers_2", next));
		next = next.root(derivedState.tmp[layer].gainExp).div(derivedState.tmp[layer].gainMult).root(derivedState.tmp[layer].exponent).times(derivedState.tmp[layer].requires).max(derivedState.tmp[layer].requires)
		if (derivedState.tmp[layer].roundUpCost) next = next.ceil()
		return next;
	} else if (type=="custom"){
		return layerRegistry.layers[layer].getNextAt(canMax)
	} else {
		return new Decimal(0)
	}}

// Return true if the layer should be highlighted. By default checks for upgrades only.
function shouldNotify(layer){
	let id;
	if (saveState.player.tab == layer || saveState.player.navTab == layer) return false
	if (!saveState.player.redGlowActive) return false;
	for (id in derivedState.tmp[layer].upgrades){
		if (!isNaN(id)){
			if (gameHelpers.canAffordUpgrade(layer, id) && !gameHelpers.hasUpgrade(layer, id) && derivedState.tmp[layer].upgrades[id].unlocked){
				return true
			} else if (derivedState.tmp[layer].upgrades[id].pseudoUnl && derivedState.tmp[layer].upgrades[id].pseudoCan && !derivedState.tmp[layer].upgrades[id].unlocked) return true;
		}
	}
	
	for (id in derivedState.tmp[layer].buyables){
		if (!isNaN(id)){
			if (derivedState.tmp[layer].buyables[id].autoed) continue;
			if (derivedState.tmp[layer].buyables[id].unlocked && derivedState.tmp[layer].buyables[id].canAfford){
				if (layer=="s") {
					if (saveState.player.spaceGlow=="never") continue;
					if (saveState.player.spaceGlow!="normal") {
						let str = saveState.player.spaceGlow
						if (str.includes("+")) str = str.split("+")[0];
						str = Number(str);
						let trueId = id-10;
						if (str>trueId) continue;
					}
				} else if (layer=="o") {
					if (saveState.player.solGlow=="never") continue;
					if (saveState.player.solGlow!="normal") {
						let buyableData = { "solar cores onward": 11, "tachoclinal plasma onward": 12, "convectional energy": 13, "convectional energy onward": 13, "coronal waves": 21 }
						let str = buyableData[saveState.player.solGlow]
						if (str>id) continue;
					}
				} else if (layer=="m") {
					if (saveState.player.majGlow=="never" || (saveState.player.m.auto && gameHelpers.hasMilestone("hn", 2))) continue;
					if (saveState.player.majGlow=="uncasted") if (Object.values(saveState.player.m.spellTimes).some(x => Decimal.eq(x, 0))) continue;
				} else if (layer=="mc" && id==11 && !saveState.player.shellGlow) continue;
				return true
			}
		}
	}

	if (derivedState.tmp[layer].shouldNotify){
		return derivedState.tmp[layer].shouldNotify
	}
	else 
		return false
}

function canReset(layer)
{
	if(derivedState.tmp[layer].type == "normal")
		return derivedState.tmp[layer].baseAmount.gte(derivedState.tmp[layer].requires) && gameRules.getResetGain(layer).gt(0)
	else if(derivedState.tmp[layer].type== "static")
		return derivedState.tmp[layer].baseAmount.gte(derivedState.tmp[layer].nextAt)
	if(derivedState.tmp[layer].type == "none")
		return false
	else
		return layerRegistry.layers[layer].canReset()
}

function rowReset(row, layer) {
	let lr;
	for (lr in layerRegistry.ROW_LAYERS[row]){
		if(layerRegistry.layers[lr].doReset) {

			saveState.player[lr].activeChallenge = null // Exit challenges on any row reset on an equal or higher row
			layerRegistry.layers[lr].doReset(layer)
		}
		else
			if(derivedState.tmp[layer].row > derivedState.tmp[lr].row && row !== "side") gameRules.layerDataReset(lr)
	}
}

function layerDataReset(layer, keep = []) {
	let thing;
	let storedData = {unlocked: saveState.player[layer].unlocked, first: saveState.player[layer].first} // Always keep unlocked & time unlocked
	for (let i=0;i<modRules.alwaysKeepTheseVariables.length;i++) {
		let name = modRules.alwaysKeepTheseVariables[i];
		if (saveState.player[layer][name]) storedData[name] = saveState.player[layer][name];
	}

	for (thing in keep) {
		if (saveState.player[layer][keep[thing]] !== undefined && saveState.player[layer][keep[thing]] !== null) {
			if (saveState.player[layer][keep[thing]] instanceof Decimal) storedData[keep[thing]] = new Decimal(JSON.parse(JSON.stringify(saveState.player[layer][keep[thing]])));
			else storedData[keep[thing]] = saveState.player[layer][keep[thing]];
		}
	}

	gameHelpers.layOver(saveState.player[layer], layerRegistry.layers[layer].startData());
	saveState.player[layer].upgrades = []
	saveState.player[layer].milestones = []
	saveState.player[layer].challenges = saveDefaults.getStartChallenges(layer)
	gameRules.resetBuyables(layer)
	if (layerRegistry.layers[layer].clickables && !saveState.player[layer].clickables)
		saveState.player[layer].clickables = saveDefaults.getStartClickables(layer)

	for (thing in storedData) {
		saveState.player[layer][thing] = storedData[thing]
	}
}

function resetBuyables(layer){
	if (layerRegistry.layers[layer].buyables)
		saveState.player[layer].buyables = saveDefaults.getStartBuyables(layer)
	saveState.player[layer].spentOnBuyables = new Decimal(0)
}


function addPoints(layer, gain) {
	saveState.player[layer].points = saveState.player[layer].points.add(gain).max(0)
	if (saveState.player[layer].best) saveState.player[layer].best = saveState.player[layer].best.max(saveState.player[layer].points)
	if (saveState.player[layer].total) saveState.player[layer].total = saveState.player[layer].total.add(gain)
}

function generatePoints(layer, diff) {
	gameRules.addPoints(layer, derivedState.tmp[layer].resetGain.times(diff))
}

let prevOnReset

function doReset(layer, force=false) {
	let layerResetting, lr, lrs;
	let row = derivedState.tmp[layer].row
	if (!force) {
		if (derivedState.tmp[layer].baseAmount.lt(derivedState.tmp[layer].requires)) return;
		if (!gameRules.canReset(layer)) return;
		let gain = derivedState.tmp[layer].resetGain.max(0)
		if (derivedState.tmp[layer].type=="static") {
			if (derivedState.tmp[layer].baseAmount.lt(derivedState.tmp[layer].nextAt)) return;
			gain =(derivedState.tmp[layer].canBuyMax ? gain : 1)
		} 
		if (derivedState.tmp[layer].type=="custom") {
			if (!derivedState.tmp[layer].canReset) return;
		} 

		if (layerRegistry.layers[layer].onPrestige)
			layerRegistry.layers[layer].onPrestige(gain)
		
		gameRules.addPoints(layer, gain)
		gameHelpers.updateMilestones(layer)
		gameHelpers.updateAchievements(layer)

		if (!saveState.player[layer].unlocked) {
			saveState.player[layer].unlocked = true;
			needCanvasUpdate = true;

			if (derivedState.tmp[layer].increaseUnlockOrder){
				lrs = derivedState.tmp[layer].increaseUnlockOrder
				for (lr in lrs)
					if (!saveState.player[lrs[lr]].unlocked) saveState.player[lrs[lr]].unlockOrder = (saveState.player[lrs[lr]].unlockOrder||0)+1
			}
		}
	
		derivedState.tmp[layer].baseAmount = new Decimal(0) // quick fix
	}

	if (derivedState.tmp[layer].resetsNothing) return


	for (layerResetting in layerRegistry.layers) {
		if (row >= layerRegistry.layers[layerResetting].row && (!force || layerResetting != layer)) gameRules.completeChallenge(layerResetting)
	}

	prevOnReset = {...saveState.player} // Preserve pre-reset root references for reset hooks.
	saveState.player.points = (row == 0 ? new Decimal(0) : modRules.getStartPoints())

	for (let x = row; x >= 0; x--) gameRules.rowReset(x, layer)
	gameRules.rowReset("side", layer)
	prevOnReset = undefined

	derivedState.updateTemp()
	derivedState.updateTemp()
	derivedState.updateTemp()
}

function resetRow(row) {
	if (effects.prompt('Are you sure you want to reset this row? It is highly recommended that you wait until the end of your current run before doing this! Type "I WANT TO RESET THIS" to confirm')!="I WANT TO RESET THIS") return
	let pre_layers = layerRegistry.ROW_LAYERS[row-1]
	let layers = layerRegistry.ROW_LAYERS[row]
	let post_layers = layerRegistry.ROW_LAYERS[row+1]
	gameRules.rowReset(row+1, post_layers[0])
	gameRules.doReset(pre_layers[0], true)
	for (let layer in layers) {
		saveState.player[layer].unlocked = false
		if (saveState.player[layer].unlockOrder) saveState.player[layer].unlockOrder = 0
	}
	saveState.player.points = modRules.getStartPoints()
	derivedState.updateTemp()
	derivedState.updateTemp()
	derivedState.updateTemp()
	treeCanvas.resizeCanvas();
}

function startChallenge(layer, x) {
	let enter = false
	if (!saveState.player[layer].unlocked) return
	if (saveState.player[layer].activeChallenge == x) {
		gameRules.completeChallenge(layer, x)
		saveState.player[layer].activeChallenge = null;
	} else {
		enter = true
	}	
	gameRules.doReset(layer, true)
	if(enter) {
		saveState.player[layer].activeChallenge = x
		if (layerRegistry.layers[layer].challenges[x].onStart) layerRegistry.layers[layer].challenges[x].onStart(true);
	}

	derivedState.updateChallengeTemp(layer)
	gameView.app.$forceUpdate();
}

function canCompleteChallenge(layer, x)
{
	if (x != saveState.player[layer].activeChallenge) return

	let challenge = derivedState.tmp[layer].challenges[x]

	if (challenge.currencyInternalName){
		let name = challenge.currencyInternalName
		if (challenge.currencyLocation){
			return !(challenge.currencyLocation[name].lt(challenge.goal)) 
		}
		else if (challenge.currencyLayer){
			let lr = challenge.currencyLayer
			return !(saveState.player[lr][name].lt(layerRegistry.readData(challenge.goal)))
		}
		else {
			return !(saveState.player[name].lt(challenge.goal))
		}
	}
	else {
		return !(saveState.player.points.lt(challenge.goal))
	}

}

function completeChallenge(layer, x) {
	x = saveState.player[layer].activeChallenge
	if (!x) return
	if (! gameRules.canCompleteChallenge(layer, x)){
		saveState.player[layer].activeChallenge = null;
		return
	}
	if ((saveState.player[layer].challenges[x]||0) < derivedState.tmp[layer].challenges[x].completionLimit) {
		needCanvasUpdate = true
		saveState.player[layer].challenges[x] += 1
		if (layerRegistry.layers[layer].challenges[x].onComplete) layerRegistry.layers[layer].challenges[x].onComplete()
	}
	saveState.player[layer].activeChallenge = null;
	derivedState.updateChallengeTemp(layer)
}

modRules.VERSION.withoutName = "v" + modRules.VERSION.num + (modRules.VERSION.pre ? (" Pre-Release " + modRules.VERSION.pre) : modRules.VERSION.beta ? (" Beta " + modRules.VERSION.beta) : "") + (modRules.VERSION.patch ? (" Patch "+modRules.VERSION.patch) : "")
modRules.VERSION.withName = modRules.VERSION.withoutName + (modRules.VERSION.name ? ": " + modRules.VERSION.name : "")



function gameLoop(diff) {
	let item, layer, row, x;
	gameHelpers.styleCooldown = Math.max(gameHelpers.styleCooldown-diff, 0);
	
	if (modRules.isEndgame() || status.gameEnded) status.gameEnded = 1

	if (isNaN(diff)) diff = 0
	if (status.gameEnded && !saveState.player.keepGoing) {
		diff = 0
		saveState.player.tab = "gameEnded"
	}
	if (saveState.player.devSpeed) diff *= saveState.player.devSpeed

	let limit = modRules.maxTickLength()
	if(diff > limit)
		diff = limit

	gameHelpers.addTime(diff)
	saveState.player.points = saveState.player.points.add(derivedState.tmp.pointGen.times(diff)).max(0)

	for (x = 0; x <= layerRegistry.maxRow; x++){
		for (item in layerRegistry.TREE_LAYERS[x]) {
			let layer = layerRegistry.TREE_LAYERS[x][item]
			if (!saveState.player[layer].unlocked) saveState.player[layer].first += diff;
			if (!gameHelpers.unl(layer)) continue;
			let speed = (x<6&&layer!="en"&&layer!="ne"&&layer!="id"&&layer!="r")?derivedState.tmp.row1to6spd:new Decimal(1)
			if (derivedState.tmp[layer].passiveGeneration) gameRules.generatePoints(layer, speed.times(diff*derivedState.tmp[layer].passiveGeneration));
			if (layerRegistry.layers[layer].update) layerRegistry.layers[layer].update(speed.times(diff));
		}
	}

	for (row in layerRegistry.OTHER_LAYERS){
		for (item in layerRegistry.OTHER_LAYERS[row]) {
			let layer = layerRegistry.OTHER_LAYERS[row][item]
			if (derivedState.tmp[layer].passiveGeneration) gameRules.generatePoints(layer, diff*derivedState.tmp[layer].passiveGeneration);
			if (layerRegistry.layers[layer].update) layerRegistry.layers[layer].update(diff);
		}
	}	

	for (x = layerRegistry.maxRow; x >= 0; x--){
		for (item in layerRegistry.TREE_LAYERS[x]) {
			let layer = layerRegistry.TREE_LAYERS[x][item]
			if (!gameHelpers.unl(layer)) continue;
			if (derivedState.tmp[layer].autoPrestige && derivedState.tmp[layer].canReset) gameRules.doReset(layer);
			if (layerRegistry.layers[layer].automate) layerRegistry.layers[layer].automate();
		}
	}

	for (row in layerRegistry.OTHER_LAYERS){
		for (item in layerRegistry.OTHER_LAYERS[row]) {
			let layer = layerRegistry.OTHER_LAYERS[row][item]
			if (derivedState.tmp[layer].autoPrestige && derivedState.tmp[layer].canReset) gameRules.doReset(layer);
			if (layerRegistry.layers[layer].automate) layerRegistry.layers[layer].automate();
		}
	}

	for (layer in layerRegistry.layers){
		if (layerRegistry.layers[layer].milestones) gameHelpers.updateMilestones(layer);
		if (layerRegistry.layers[layer].achievements) gameHelpers.updateAchievements(layer)
	}

}

function hardReset() {
	if (!effects.confirm("Are you sure you want to do this? You will lose all your progress!")) return false;
	let candidate = saveCommands.currentSaveCollection();
	if (!candidate) return false;
	candidate[candidate.set] = saveCommands.getStartPlayer();
	if (!saveCommands.persistSaveCollection(candidate)) return false;
	effects.window.location.reload();
	return true;
}

let ticking = false
// A failed tick may leave partial mutations. Only a reload restores a safe state.
let tickFaulted = false

/** Advance this owner's identity-bound state by elapsed seconds, without I/O.
 * Rule/cache collaborators belong to this session. Callers own clock/offline
 * budgeting and effects; errors propagate to their lifecycle owner.
 * @param {GameIdentity} session @param {ElapsedSeconds} elapsedSeconds
 */
function advanceGame(session, elapsedSeconds) {
	if (!runtimeServices.isCurrentGameSession(session)) throw new Error("Superseded game session");
	if (tickFaulted) throw new Error("Reload required after runtime failure");
	if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) throw new Error("Expected finite nonnegative elapsed seconds");
	if (ticking) throw new Error("Game advancement is already in progress");
	if (status.gameEnded && !saveState.player.keepGoing) return;
	ticking = true;
	try {
		// Preserve the historical pre-loop multiplier as well as gameLoop's own
		// multiplier. Changing development-speed balance is outside SIM01.
		if (saveState.player.devSpeed) elapsedSeconds *= saveState.player.devSpeed;
		derivedState.updateTemp();
		gameRules.gameLoop(elapsedSeconds);
		gameHelpers.fixNaNs();
	} catch (error) {
		tickFaulted = true;
		throw error;
	} finally {
		ticking = false;
	}
}


const gameRules = {
 get needCanvasUpdate() { return needCanvasUpdate; },
 set needCanvasUpdate(value) { needCanvasUpdate = value; },
 get status() { return status; },
 get gameEnded() { return status.gameEnded; },
 get TMT_VERSION() { return TMT_VERSION; },
 getResetGain,
 getNextAt,
 shouldNotify,
 canReset,
 rowReset,
 layerDataReset,
 resetBuyables,
 addPoints,
 generatePoints,
 get prevOnReset() { return prevOnReset; },
 doReset,
 resetRow,
 startChallenge,
 canCompleteChallenge,
 completeChallenge,
 gameLoop,
 hardReset,
 get ticking() { return ticking; },
 set ticking(value) { ticking = value; },
 get tickFaulted() { return tickFaulted; },
 set tickFaulted(value) { tickFaulted = value; },
 advanceGame,
};
return gameRules;
}
