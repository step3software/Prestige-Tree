// Session-bound gameHelpers owner; composition supplies only the named ports.
function createGameHelpers({ derivedState, effects, gameRules, layerRegistry, modRules, saveState, softcapRules, treeCanvas, treeLayout }) {
// ************ Number formatting ************

function exponentialFormat(num, precision) {
	let e = num.exponent;
	let m = num.mantissa;
	if (Number(new Decimal(m).toStringWithDecimalPlaces(precision))==10) {
		m = 1
		e++;
	}
	e = ((e>=1000) ? gameHelpers.commaFormat(new Decimal(e), 0) : new Decimal(e).toStringWithDecimalPlaces(0))
	return new Decimal(m).toStringWithDecimalPlaces(precision)+"e"+e
}

function commaFormat(num, precision) {
	if (num === null || num === undefined) return "NaN"
	if (num.mag < 0.001) return (0).toFixed(precision)
	return num.toStringWithDecimalPlaces(precision).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}


function regularFormat(num, precision) {
	if (num === null || num === undefined) return "NaN"
	if (num.mag < 0.001) return (0).toFixed(precision)
	return num.toStringWithDecimalPlaces(precision)
}

function fixValue(x, y = 0) {
	return x || new Decimal(y)
}

function sumValues(x) {
	x = Object.values(x)
	if (!x[0]) return new Decimal(0)
	return x.reduce((a, b) => Decimal.add(a, b))
}

function format(decimal, precision=2, whole=false) {
	decimal = new Decimal(decimal)
	if (isNaN(decimal.sign)||isNaN(decimal.layer)||isNaN(decimal.mag)) {
		saveState.player.hasNaN = true;
		return "NaN"
	}
	if (decimal.sign<0) return "-"+gameHelpers.format(decimal.neg(), precision)
	if (decimal.mag == Number.POSITIVE_INFINITY) return "Infinity"
	if (decimal.eq(0)) return "0"
	if (decimal.gte("eeee1000")) {
		let slog = decimal.slog()
		if (slog.gte(1e3)) return "10^^" + gameHelpers.formatWhole(slog)
		else return "10^^" + gameHelpers.regularFormat(slog, 3)
	} else if (decimal.gte("eee100000")) return "eee"+gameHelpers.format(decimal.log10().log10().log10(), 3)
	else if (decimal.gte("ee100000")) return "ee"+gameHelpers.format(decimal.log10().log10(), 3)
	else if (decimal.gte("1e100000")) return "e"+gameHelpers.format(decimal.log10(), 3)
	else if (decimal.gte("1e1000")) return gameHelpers.exponentialFormat(decimal, 0)
	else if (decimal.gte(1e9)) return gameHelpers.exponentialFormat(decimal, precision)
	else if (decimal.gte(1e3)) return gameHelpers.commaFormat(decimal, 0)
	else if (decimal.gte(Decimal.pow(0.1, precision)) || whole) return gameHelpers.regularFormat(decimal, precision)
	else if (decimal.gt("1e-100000")) return gameHelpers.exponentialFormat(decimal, decimal.gte("1e-1000")?precision:0)
	else return "1/("+gameHelpers.format(decimal.pow(-1), precision)+")"
}

function formatWhole(decimal, reallyWhole=false) {
	decimal = new Decimal(decimal)
	if (decimal.gte(1e9)) return gameHelpers.format(decimal, 2)
	if (decimal.lte(0.95) && !decimal.eq(0) && !reallyWhole) return gameHelpers.format(decimal, 2)
	else return gameHelpers.format(decimal, 0, true)
}

function formatTime(s) {
	s = new Decimal(s);
	if (s.gte(1/0)) return "Forever"
	else if (s.lt(60)) return gameHelpers.format(s)+"s"
	else if (s.lt(3600)) return gameHelpers.formatWhole(s.div(60).floor())+"m "+gameHelpers.format(s.toNumber()%60)+"s"
	else if (s.lt(86400)) return gameHelpers.formatWhole(s.div(3600).floor())+"h "+gameHelpers.format(s.div(60).floor().toNumber()%60)+"m"
	else if (s.lt(31536000)) return gameHelpers.formatWhole(s.div(84600).floor())+"d " + gameHelpers.formatWhole(s.div(3600).floor().toNumber()%24)+"h"
	else if (s.lt(31536000000)) return gameHelpers.formatWhole(s.div(31536000).floor())+"y "+gameHelpers.formatWhole(s.div(84600).floor().toNumber()%365)+"d"
	else return gameHelpers.formatWhole(s.div(31536000).floor())+"y"
}

function toPlaces(x, precision, maxAccepted) {
	x = new Decimal(x)
	let result = x.toStringWithDecimalPlaces(precision)
	if (new Decimal(result).gte(maxAccepted)) {
		result = new Decimal(maxAccepted-Math.pow(0.1, precision)).toStringWithDecimalPlaces(precision)
	}
	return result
}
function fixNaNs() {
	gameHelpers.NaNcheck(saveState.player)
}

function NaNcheck(data) {
	let item;
	for (item in data){
		if (data[item] == null) {
		}
		else if (Array.isArray(data[item])) {
			gameHelpers.NaNcheck(data[item])
		}
		else if (data[item] !== data[item] || data[item] === layerRegistry.decimalNaN || (data[item] instanceof Decimal && [data[item].sign, data[item].layer, data[item].mag].some(Number.isNaN))){
			throw new Error("Invalid value in player: " + item);
		}
		else if (data[item] instanceof Decimal) { // Convert to Decimal
		}
		else if ((!!data[item]) && (data[item].constructor === Object)) {
			gameHelpers.NaNcheck(data[item])
		}
	}	
}


// ************ Themes ************

const themes = {
	1: "aqua"
}
const theme_names = {
	aqua: "Aqua"
}

function changeTheme() {
	let aqua = saveState.player.theme == "aqua"
	treeCanvas.colors_theme = treeCanvas.colors[saveState.player.theme || "default"]
	effects.document.body.style.setProperty('--background', aqua ? "#001f3f" : "#0f0f0f")
	effects.document.body.style.setProperty('--background_tooltip', aqua ? "rgba(0, 15, 31, 0.75)" : "rgba(0, 0, 0, 0.75)")
	effects.document.body.style.setProperty('--color', aqua ? "#bfdfff" : "#dfdfdf")
	effects.document.body.style.setProperty('--points', aqua ? "#dfefff" : "#ffffff")
	effects.document.body.style.setProperty("--locked", aqua ? "#c4a7b3" : "#bf8f8f")
}

function getThemeName() {
	return saveState.player.theme ? theme_names[saveState.player.theme] : "Default"
}

function switchTheme() {
	if (saveState.player.theme === undefined || saveState.player.theme === null) saveState.player.theme = themes[1]
	else {
		saveState.player.theme = themes[Object.keys(themes)[saveState.player.theme] + 1]
		if (!saveState.player.theme) saveState.player.theme = null;
	}
	gameHelpers.changeTheme()
	treeCanvas.resizeCanvas()
}

// ************ Options ************

function toggleOpt(name) {
	if (name == "oldStyle" && styleCooldown>0) return;

	saveState.player[name] = !saveState.player[name]
	if (name == "hqTree") gameHelpers.changeTreeQuality()
	if (name == "oldStyle") gameHelpers.updateStyle()
}

function adjustGlow(type) {
	let glowData = {
		slight() { return ["normal", "never"] },
		space() { 
			let data = ["normal", "2+", "3"];
			if (gameHelpers.hasUpgrade("s", 14)) {
				data[2] = "3+"
				data.push("4")
				if (gameHelpers.hasUpgrade("s", 25)) {
					data[3] = "4+"
					data.push("5")
				}
			}
			data.push("never")
			return data;
		},
		sol() { 
			let data = ["normal"]
			if (saveState.player.ss.unlocked) {
				data.push("tachoclinal plasma onward")
				if (gameHelpers.hasUpgrade("ss", 41)) {
					data.push("convectional energy onward")
					data.push("coronal waves")
				} else data.push("convectional energy")
			} else data.push("tachoclinal plasma")
			data.push("never")
			return data;
		},
		maj() { return ["normal", "uncasted", "never"] },
	}
	let data = glowData[type]()
	let index = data.indexOf(saveState.player[type+"Glow"]);
	saveState.player[type+"Glow"] = data[(index+1)%data.length]
}

let styleCooldown = 0;


function updateStyle() {
	styleCooldown = 1;
	let css = effects.document.getElementById("styleStuff")
	css.href = saveState.player.oldStyle?"oldStyle.css":"style.css"
	gameRules.needCanvasUpdate = true;
}

function changeTreeQuality() {
	let on = saveState.player.hqTree && !saveState.player.oldStyle
	effects.document.body.style.setProperty('--hqProperty1', on ? "2px solid" : "4px solid")
	effects.document.body.style.setProperty('--hqProperty2a', on ? "-4px -4px 4px rgba(0, 0, 0, 0.25) inset" : "-4px -4px 4px rgba(0, 0, 0, 0) inset")
	effects.document.body.style.setProperty('--hqProperty2b', on ? "0px 0px 20px var(--background)" : "")
	effects.document.body.style.setProperty('--hqProperty3', on ? "2px 2px 4px rgba(0, 0, 0, 0.25)" : "none")
}

function toggleAuto(toggle) {
	if (!(toggle instanceof Array)) {
		saveState.player[toggle.layer][toggle.varName] = toggle.options[(toggle.options.indexOf(saveState.player[toggle.layer][toggle.varName])+1)%toggle.options.length]
	} else saveState.player[toggle[0]][toggle[1]] = !saveState.player[toggle[0]][toggle[1]]
}

function adjustMSDisp() {
	let displays = ["always", "automation", "incomplete", "never"];
	saveState.player.msDisplay = displays[(displays.indexOf(saveState.player.msDisplay)+1)%4]
}

function milestoneShown(layer, id) {
	let auto, complete;
	complete = saveState.player[layer].milestones.includes(id)
	auto = layerRegistry.layers[layer].milestones[id].toggles

	switch(saveState.player.msDisplay) {
		case "always": 
			return true;
			break;
		case "automation": 
			return (auto)||!complete
			break;
		case "incomplete":
			return !complete
			break;
		case "never": 
			return false;
			break;
	}
	return false;
}



// ************ Big Feature related ************

function respecBuyables(layer) {
	if (!layerRegistry.layers[layer].buyables) return
	if (!layerRegistry.layers[layer].buyables.respec) return
	if (!effects.confirm("Are you sure you want to respec? This will force you to do a \"" + (derivedState.tmp[layer].name ? derivedState.tmp[layer].name : layer) + "\" reset as well!")) return
	layerRegistry.layers[layer].buyables.respec()
	derivedState.updateBuyableTemp(layer)
}

function canAffordUpgrade(layer, id, skipAfford=false) {
	let upg = derivedState.tmp[layer].upgrades[id]
	if (layerRegistry.layers[layer].upgrades[id].canAfford!==undefined && !skipAfford) return upg.canAfford;
	else if (upg.multiRes) {
		for (let i=0;i<upg.multiRes.length;i++) {
			let cost = upg.multiRes[i].cost
			if (!gameHelpers.canAffordPurchase(layer, upg.multiRes[i], cost)) return false;
		}
		return true;
	} else {
		let cost = upg.cost
		return gameHelpers.canAffordPurchase(layer, upg, cost)
	}
}

function hasUpgrade(layer, id){
	return (saveState.player[layer].upgrades.includes(gameHelpers.toNumber(id)) || saveState.player[layer].upgrades.includes(id.toString())) && gameHelpers.unl(layer)
}

function hasMilestone(layer, id){
	return (saveState.player[layer].milestones.includes(gameHelpers.toNumber(id)) || saveState.player[layer].milestones.includes(id.toString()))
}

function hasAchievement(layer, id){
	return (saveState.player[layer].achievements.includes(gameHelpers.toNumber(id)) || saveState.player[layer].achievements.includes(id.toString())) && gameHelpers.unl(layer)
}

function hasChallenge(layer, id){
	return (saveState.player[layer].challenges[id]>=derivedState.tmp[layer].challenges[id].completionLimit) && gameHelpers.unl(layer)
}

function maxedChallenge(layer, id){
	return (saveState.player[layer].challenges[id] >= derivedState.tmp[layer].challenges[id].completionLimit)
}

function challengeCompletions(layer, id){
	return gameHelpers.unl(layer)?(saveState.player[layer].challenges[id]||0):0
}

function getBuyableAmount(layer, id){
	return gameHelpers.unl(layer)?(saveState.player[layer].buyables[id]):0
}

function setBuyableAmount(layer, id, amt){
	saveState.player[layer].buyables[id] = amt
}

function getClickableState(layer, id){
	return (saveState.player[layer].clickables[id])
}

function setClickableState(layer, id, state){
	saveState.player[layer].clickables[id] = state
}

function upgradeEffect(layer, id){
	return (derivedState.tmp[layer].upgrades[id].effect);
}

function challengeEffect(layer, id){
	return (derivedState.tmp[layer].challenges[id].rewardEffect)
}

function buyableEffect(layer, id){
	return (derivedState.tmp[layer].buyables[id].effect)
}

function clickableEffect(layer, id){
	return (derivedState.tmp[layer].clickables[id].effect)
}

function achievementEffect(layer, id){
	return (derivedState.tmp[layer].achievements[id].effect)
}

function getImprovements(layer, id) {
	if (!gameHelpers.unl(layer)) return new Decimal(0);
	return derivedState.tmp[layer].impr[id].unlocked?(derivedState.tmp[layer].impr.amount.sub(derivedState.tmp[layer].impr[id].num).div(derivedState.tmp[layer].impr.activeRows*derivedState.tmp[layer].impr.activeCols).plus(1).floor().max(0)):new Decimal(0);
}

function getNextImpr(layer, id) {
	return layerRegistry.layers[layer].impr.nextAt(id);
}

function improvementEffect(layer, id) {
	return derivedState.tmp[layer].impr[id].effect
}

function canAffordPurchase(layer, thing, cost) {

	if (thing.currencyInternalName){
		let name = thing.currencyInternalName
		if (thing.currencyLocation){
			return !(thing.currencyLocation[name].lt(cost)) 
		}
		else if (thing.currencyLayer){
			let lr = thing.currencyLayer
			return !(saveState.player[lr][name].lt(cost))
		}
		else {
			return !(saveState.player[name].lt(cost))
		}
	}
	else {
		return !(saveState.player[layer].points.lt(cost))
	}
}

function buyUpgrade(layer, id) {
	gameHelpers.buyUpg(layer, id)
}

function buyUpg(layer, id) {
	if (!saveState.player[layer].unlocked) return
	if (!derivedState.tmp[layer].upgrades[id].unlocked) return
	if (saveState.player[layer].upgrades.includes(id)) return
	if (!gameHelpers.canAffordUpgrade(layer, id)) return;
	let upg = derivedState.tmp[layer].upgrades[id]
	let cost = derivedState.tmp[layer].upgrades[id].cost

	if (upg.multiRes) {
		let doReturn = false;
		for (let i=0;i<upg.multiRes.length;i++) {
			let data = upg.multiRes[i]
			let cost = data.cost;
			if (data.currencyInternalName){
				let name = data.currencyInternalName
				if (data.currencyLocation){
					if (data.currencyLocation[name].lt(cost)) doReturn = true;
					data.currencyLocation[name] = data.currencyLocation[name].sub(cost)
				}
				else if (data.currencyLayer){
					let lr = data.currencyLayer
					if (saveState.player[lr][name].lt(cost)) doReturn = true;
					saveState.player[lr][name] = saveState.player[lr][name].sub(cost)
				}
				else {
					if (saveState.player[name].lt(cost)) doReturn = true;
					saveState.player[name] = saveState.player[name].sub(cost)
				}
			}
			else {
				if (saveState.player[layer].points.lt(cost)) doReturn = true;
				saveState.player[layer].points = saveState.player[layer].points.sub(cost)
			}
		}
		if (doReturn) {
			return;
		}
	} else {
		if (upg.currencyInternalName){
			let name = upg.currencyInternalName
			if (upg.currencyLocation){
				if (upg.currencyLocation[name].lt(cost)) return
				upg.currencyLocation[name] = upg.currencyLocation[name].sub(cost)
			}
			else if (upg.currencyLayer){
				let lr = upg.currencyLayer
				if (saveState.player[lr][name].lt(cost)) return
				saveState.player[lr][name] = saveState.player[lr][name].sub(cost)
			}
			else {
				if (saveState.player[name].lt(cost)) return
				saveState.player[name] = saveState.player[name].sub(cost)
			}
		}
		else {
			if (saveState.player[layer].points.lt(cost)) return
			saveState.player[layer].points = saveState.player[layer].points.sub(cost)
		}
	}
	saveState.player[layer].upgrades.push(id);
	if (upg.onPurchase != undefined)
		upg.onPurchase()
}

function unlockUpg(layer, id) {
	if (!saveState.player[layer].unlocked) return
	if (!derivedState.tmp[layer].upgrades[id].pseudoUnl) return
	if (derivedState.tmp[layer].upgrades[id].unlocked) return
	if (saveState.player[layer].pseudoUpgs.includes(id)) return
	let upg = derivedState.tmp[layer].upgrades[id]
	if (!upg.pseudoCan) return;
	saveState.player[layer].pseudoUpgs.push(id);
}

function pseudoUnl(layer, id) {
	return derivedState.tmp[layer].upgrades[id].pseudoUnl && !derivedState.tmp[layer].upgrades[id].unlocked;
}

function buyMaxBuyable(layer, id) {
	if (!saveState.player[layer].unlocked) return
	if (!derivedState.tmp[layer].buyables[id].unlocked) return
	if (!derivedState.tmp[layer].buyables[id].canAfford) return
	if (!layerRegistry.layers[layer].buyables[id].buyMax) return

	layerRegistry.layers[layer].buyables[id].buyMax()
	derivedState.updateBuyableTemp(layer)
}

function buyBuyable(layer, id) {
	if (!saveState.player[layer].unlocked) return
	if (!derivedState.tmp[layer].buyables[id].unlocked) return
	if (!derivedState.tmp[layer].buyables[id].canAfford) return

	layerRegistry.layers[layer].buyables[id].buy()
	derivedState.updateBuyableTemp(layer)
}

function clickClickable(layer, id) {
	if (!saveState.player[layer].unlocked) return
	if (!derivedState.tmp[layer].clickables[id].unlocked) return
	if (!derivedState.tmp[layer].clickables[id].canClick) return

	layerRegistry.layers[layer].clickables[id].onClick()
	derivedState.updateClickableTemp(layer)
}

// Function to determine if the player is in a challenge
function inChallenge(layer, id){
	let challenge = saveState.player[layer].activeChallenge
	if (!challenge) return false
	id = gameHelpers.toNumber(id)
	if (challenge==id) return true

	if (layerRegistry.layers[layer].challenges[challenge].countsAs)
		return derivedState.tmp[layer].challenges[challenge].countsAs.includes(id)
}

// ************ Misc ************

let onTreeTab = true
function showTab(name) {
	if (layerRegistry.LAYERS.includes(name) && !gameHelpers.layerunlocked(name)) return

	let toTreeTab = name == "none"
	saveState.player.tab = name
	if (saveState.player.navTab == "none") saveState.player.lastSafeTab = name
	saveState.player.notify[name] = false
	gameRules.needCanvasUpdate = true
	derivedState.updateTempData(layerRegistry.layers[name], derivedState.tmp[name], name)
}

function showNavTab(name) {
	if (layerRegistry.LAYERS.includes(name) && !gameHelpers.layerunlocked(name)) return

	let toTreeTab = name == "tree"
	saveState.player.navTab = name
	saveState.player.notify[name] = false
	gameRules.needCanvasUpdate = true
}

function goBack() {
	if (saveState.player.navTab !== "none") gameHelpers.showTab("none")
	else gameHelpers.showTab(saveState.player.lastSafeTab)
}

function prestigeNotify(layer) {
	if (saveState.player.slightGlow=="never") return false;
	else if (layerRegistry.layers[layer].prestigeNotify) return layerRegistry.layers[layer].prestigeNotify()
	else if (derivedState.tmp[layer].autoPrestige || derivedState.tmp[layer].passiveGeneration) return false
	else if (derivedState.tmp[layer].type == "static") return derivedState.tmp[layer].canReset
	else if (derivedState.tmp[layer].type == "normal") return (derivedState.tmp[layer].canReset && (derivedState.tmp[layer].resetGain.gte(saveState.player[layer].points.div(10))))
	else return false
}

function notifyLayer(name) {
	if (saveState.player.tab == name || !gameHelpers.layerunlocked(name)) return
	saveState.player.notify[name] = 1
}

function subtabShouldNotify(layer, family, id){
	let subtab = {}
	if (family == "mainTabs") subtab = derivedState.tmp[layer].tabFormat[id]
	else subtab = derivedState.tmp[layer].microtabs[family][id]
	if (saveState.player.subtabs[layer][family] === id) return false
	else if (subtab.embedLayer) return derivedState.tmp[subtab.embedLayer].notify
	else return subtab.shouldNotify
}

function subtabResetNotify(layer, family, id){
	let subtab = {}
	if (family == "mainTabs") subtab = derivedState.tmp[layer].tabFormat[id]
	else subtab = derivedState.tmp[layer].microtabs[family][id]
	if (subtab.embedLayer) return derivedState.tmp[subtab.embedLayer].prestigeNotify
	else return false
}

function nodeShown(layer) {
	if (derivedState.tmp[layer].layerShown) return true
	switch(layer) {
		case "idk":
			return saveState.player.idk.unlocked
			break;
	}
	return false
}

function unl(layer) {
	if (Array.isArray(derivedState.tmp.ma.canBeMastered)) if (saveState.player.ma.selectionActive&&derivedState.tmp[layer].row<6&&!derivedState.tmp.ma.canBeMastered.includes(layer)) return false;
	return saveState.player[layer].unlocked;
}

function layerunlocked(layer) {
	if (saveState.player.ma.selectionActive&&derivedState.tmp[layer].row<6&&!derivedState.tmp.ma.canBeMastered.includes(layer)) return false;
	if (derivedState.tmp[layer] && derivedState.tmp[layer].type == "none") return (saveState.player[layer].unlocked)
	return layerRegistry.LAYERS.includes(layer) && (saveState.player[layer].unlocked || (derivedState.tmp[layer].canReset && derivedState.tmp[layer].layerShown))
}

function keepGoing() {
	saveState.player.keepGoing = true;
	gameRules.needCanvasUpdate = true;
	saveState.player.tab = treeLayout.layoutInfo.startTab;
}

function toNumber(x) {
	if (x.mag !== undefined) return x.toNumber()
	if (x + 0 !== x) return parseFloat(x)
	return x
}

function updateMilestones(layer){
	let id;
	for (id in layerRegistry.layers[layer].milestones){
		let done = layerRegistry.layers[layer].milestones[id].done();
		if (!saveState.player[layer].primeMiles.includes(id) && done) {
			saveState.player[layer].primeMiles.push(id);
			if (saveState.player.milNotify && !saveState.player[layer].milestones.includes(id)) modRules.addNotification("milestone", derivedState.tmp[layer].milestones[id].requirementDescription, "Milestone Gotten!");
		}
		if (!(saveState.player[layer].milestones.includes(id)) && done) {
			saveState.player[layer].milestones.push(id)
		}
	}
}

function updateAchievements(layer){
	let id;
	for (id in layerRegistry.layers[layer].achievements){
		if (!isNaN(id) && !(saveState.player[layer].achievements.includes(id)) && layerRegistry.layers[layer].achievements[id].done()) {
			saveState.player[layer].achievements.push(id)
			if (layerRegistry.layers[layer].achievements[id].onComplete) layerRegistry.layers[layer].achievements[id].onComplete()
			modRules.addNotification("achievement", layerRegistry.layers[layer].achievements[id].name, "Achievement Gotten!");
		}
	}
}

function addTime(diff, layer) {
	let data = saveState.player
	let time = data.timePlayed
	if (!layer && !saveState.player.p.unlocked) return;
	if (layer) {
		data = data[layer]
		time = data.time
	}

	//I am not that good to perfectly fix that leak. ~ DB Aarex
	if (time + 0 !== time) {
		console.log("Memory leak detected. Trying to fix...")
		time = gameHelpers.toNumber(time)
		if (isNaN(time) || time == 0) {
			console.log("Couldn't fix! Resetting...")
			time = layer ? saveState.player.timePlayed : 0
			if (!layer) saveState.player.timePlayedReset = true
		}
	}
	time += gameHelpers.toNumber(diff)

	if (layer) data.time = time
	else data.timePlayed = time
}

function layOver(obj1, obj2) {
	for (let x in obj2) {
		if (obj2[x] instanceof Object) gameHelpers.layOver(obj1[x], obj2[x]);
		else obj1[x] = obj2[x];
	}
}

let minusHeld = false;

function gameKeyDown(e) {
	if (saveState.player===undefined) return;
	if (gameRules.gameEnded&&!saveState.player.keepGoing) return;
	let ctrlDown = e.ctrlKey
	let key = e.key
	derivedState.tmp.nerdMode = saveState.player.tapNerd?((e.key=="-"&&!minusHeld) ? !derivedState.tmp.nerdMode : derivedState.tmp.nerdMode):(e.key=="-")
	if (e.shiftKey) minusHeld = true;
	if (ctrlDown) key = "ctrl+" + key
	if (onFocused) return
	if (ctrlDown && layerRegistry.hotkeys[key]) e.preventDefault()
	if(layerRegistry.hotkeys[key]){
		if (saveState.player[layerRegistry.hotkeys[key].layer].unlocked)
			layerRegistry.hotkeys[key].onPress()
	}
}

function gameKeyUp(e) {
	if (saveState.player === undefined) return;
	if (e.key=="-" && !saveState.player.tapNerd) derivedState.tmp.nerdMode = false;
	if (e.key=="-") minusHeld = false;
}

let onFocused = false
function focused(x) {
	onFocused = x
}

function gainFormulaNormal(layer) {
	let start = derivedState.tmp[layer].requires;
	let mult = derivedState.tmp[layer].gainMult;
	let exp1 = derivedState.tmp[layer].exponent;
	let exp2 = derivedState.tmp[layer].gainExp;
	let f = "(x / "+gameHelpers.format(start)+")^"+gameHelpers.format(exp1)+(mult.eq(1)?"":(mult.lt(1)?(" / "+gameHelpers.format(mult.pow(-1))):(" * "+gameHelpers.format(mult))));
	if (!exp2.eq(1)) f = "("+f+")^"+gameHelpers.format(exp2)
	return f;
}

function costFormulaStatic(layer) {
	let row;
	let start = derivedState.tmp[layer].requires;
	let mult = derivedState.tmp[layer].gainMult.times(start);
	if (!mult) mult = new Decimal(1);
	let exp = new Decimal(derivedState.tmp[layer].exponent).times(derivedState.tmp[layer].gainExp);
	let base = derivedState.tmp[layer].base;
	let resDiv = new Decimal(1);
	
	for (let scale=softcapRules.STATIC_SCALE_DATA.length-1;scale>=0;scale--) {
		let scaleStart = softcapRules.getStaticScaleStart(scale, row+1)
		let scaleExp = softcapRules.getStaticScaleExp(scale, row+1)
		if (saveState.player[layer].points.gte(scaleStart)) {
			exp = exp.times(scaleExp);
			resDiv = resDiv.times(scaleStart.pow(exp.sub(1)));
		}
	}
	
	return "("+gameHelpers.format(base)+"^(x^"+gameHelpers.format(exp)+")"+(resDiv.eq(1)?"":(" / "+gameHelpers.format(resDiv)))+")"+(mult.eq(1)?"":(mult.gt(1)?(" * ("+gameHelpers.format(mult)+")"):(" / ("+gameHelpers.format(mult.pow(-1))+")")))
}

function prestigeButtonText(layer)
{
	if(derivedState.tmp[layer].type == "normal") {
		if (derivedState.tmp.nerdMode) return "Gain Formula: "+gameHelpers.gainFormulaNormal(layer);
		else return `${ saveState.player[layer].points.lt(1e3) ? (derivedState.tmp[layer].resetDescription !== undefined ? derivedState.tmp[layer].resetDescription : "Reset for ") : ""}+<b>${gameHelpers.formatWhole(derivedState.tmp[layer].resetGain)}</b> ${derivedState.tmp[layer].resource} ${derivedState.tmp[layer].resetGain.lt(100) && saveState.player[layer].points.lt(1e3) ? `<br><br>Next at ${ (derivedState.tmp[layer].roundUpCost ? gameHelpers.formatWhole(derivedState.tmp[layer].nextAt) : gameHelpers.format(derivedState.tmp[layer].nextAt))} ${ derivedState.tmp[layer].baseResource }` : ""}`
	} else if(derivedState.tmp[layer].type== "static") {
		if (derivedState.tmp.nerdMode) return "Cost Formula: "+gameHelpers.costFormulaStatic(layer);
		else return `${derivedState.tmp[layer].resetDescription !== undefined ? derivedState.tmp[layer].resetDescription : "Reset for "}+<b>${gameHelpers.formatWhole(derivedState.tmp[layer].resetGain)}</b> ${derivedState.tmp[layer].resource}<br><br>${saveState.player[layer].points.lt(30) ? (derivedState.tmp[layer].baseAmount.gte(derivedState.tmp[layer].nextAt)&&(derivedState.tmp[layer].canBuyMax !== undefined) && derivedState.tmp[layer].canBuyMax?"Next:":"Req:") : ""} ${gameHelpers.formatWhole(derivedState.tmp[layer].baseAmount)} / ${(derivedState.tmp[layer].roundUpCost ? gameHelpers.formatWhole(derivedState.tmp[layer].nextAtDisp) : gameHelpers.format(derivedState.tmp[layer].nextAtDisp))} ${ derivedState.tmp[layer].baseResource }
		`
	} else if(derivedState.tmp[layer].type == "none")
		return ""
	else
		return layerRegistry.layers[layer].prestigeButtonText()
}

function isFunction(obj) {
	return !!(obj && obj.constructor && obj.call && obj.apply);
  };


const gameHelpers = {
 exponentialFormat,
 commaFormat,
 regularFormat,
 fixValue,
 sumValues,
 format,
 formatWhole,
 formatTime,
 toPlaces,
 fixNaNs,
 NaNcheck,
 get themes() { return themes; },
 get theme_names() { return theme_names; },
 changeTheme,
 getThemeName,
 switchTheme,
 toggleOpt,
 adjustGlow,
 get styleCooldown() { return styleCooldown; },
 set styleCooldown(value) { styleCooldown = value; },
 updateStyle,
 changeTreeQuality,
 toggleAuto,
 adjustMSDisp,
 milestoneShown,
 respecBuyables,
 canAffordUpgrade,
 hasUpgrade,
 hasMilestone,
 hasAchievement,
 hasChallenge,
 maxedChallenge,
 challengeCompletions,
 getBuyableAmount,
 setBuyableAmount,
 getClickableState,
 setClickableState,
 upgradeEffect,
 challengeEffect,
 buyableEffect,
 clickableEffect,
 achievementEffect,
 getImprovements,
 getNextImpr,
 improvementEffect,
 canAffordPurchase,
 buyUpgrade,
 buyUpg,
 unlockUpg,
 pseudoUnl,
 buyMaxBuyable,
 buyBuyable,
 clickClickable,
 inChallenge,
 get onTreeTab() { return onTreeTab; },
 showTab,
 showNavTab,
 goBack,
 prestigeNotify,
 notifyLayer,
 subtabShouldNotify,
 subtabResetNotify,
 nodeShown,
 unl,
 layerunlocked,
 keepGoing,
 toNumber,
 updateMilestones,
 updateAchievements,
 addTime,
 layOver,
 get minusHeld() { return minusHeld; },
 set minusHeld(value) { minusHeld = value; },
 gameKeyDown,
 gameKeyUp,
 get onFocused() { return onFocused; },
 set onFocused(value) { onFocused = value; },
 focused,
 gainFormulaNormal,
 costFormulaStatic,
 prestigeButtonText,
 isFunction,
};
return gameHelpers;
}
