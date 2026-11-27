// Session-bound derivedState owner; composition supplies only the named ports.
function createDerivedState({ effects, gameHelpers, gameRules, helpContent, layerRegistry, modRules, saveState }) {
	let item;
/** Derived values are optional until setup/update complete; arbitrary layer
 * properties are dynamically evaluated by this one canonical cache owner.
 * @type {Record<string,unknown> & Partial<{nerdMode:boolean,pointGen:DecimalValue,row1to6spd:DecimalValue,displayThings:string[]}>}
 */
let tmp = effects.observe({})

// Tmp will not call these
let activeFunctions = [
	"startData", "onPrestige", "doReset", "update", "automate",
	"buy", "buyMax", "respec", "onComplete", "onPurchase", "onPress", "onClick", "masterButtonPress",
	"sellOne", "sellAll",
]

let noCall = modRules.doNotCallTheseFunctionsEveryTick
for (item in noCall) {
	activeFunctions.push(noCall[item])
}

function setupTemp() {
	let layer;
	tmp = effects.observe({})
	tmp.helpTab = NaN;
	tmp.helpData = {};
	tmp.nerdMode = false
	tmp.pointGen = {}
	tmp.row1to6spd = new Decimal(1)
	tmp.displayThings = []

	derivedState.setupTempData(layerRegistry.layers, tmp)
	for (layer in layerRegistry.layers){
		tmp[layer].resetGain = {}
		tmp[layer].nextAt = {}
		tmp[layer].nextAtDisp = {}
		tmp[layer].canReset = {}
		tmp[layer].notify = {}
		tmp[layer].prestigeNotify = {}
		tmp[layer].prestigeButtonText = {}
		derivedState.setupBarStyles(layer)
	}
	if (typeof helpContent.help_data != "undefined") derivedState.setupTempData(helpContent.help_data, tmp.helpData);
}

function setupTempData(layerData, tmpData) {
	let item;
	for (item in layerData){
		if (layerData[item] == null) {
			tmpData[item] = null
		}
		else if (layerData[item] instanceof Decimal)
			tmpData[item] = layerData[item]
		else if (Array.isArray(layerData[item])) {
			tmpData[item] = []
			derivedState.setupTempData(layerData[item], tmpData[item])
		}
		else if ((!!layerData[item]) && (layerData[item].constructor === Object)) {
			tmpData[item] = {}
			derivedState.setupTempData(layerData[item], tmpData[item])
		}
		else if (gameHelpers.isFunction(layerData[item]) && !activeFunctions.includes(item)){
			tmpData[item] = new Decimal(1) // Safest thing to put probably?
		} else {
			tmpData[item] = layerData[item]
		}
	}	
}

function updateTemp() {
	let layer, thing;
	if (tmp === undefined)
		derivedState.setupTemp()

	for (layer in layerRegistry.layers) {derivedState.updateTempData(layerRegistry.layers[layer], tmp[layer], layer)}

	for (layer in layerRegistry.layers){
		tmp[layer].resetGain = gameRules.getResetGain(layer)
		tmp[layer].nextAt = gameRules.getNextAt(layer)
		tmp[layer].nextAtDisp = gameRules.getNextAt(layer, true)
		tmp[layer].canReset = gameRules.canReset(layer)
		tmp[layer].notify = gameRules.shouldNotify(layer)
		tmp[layer].prestigeNotify = gameHelpers.prestigeNotify(layer)
		tmp[layer].prestigeButtonText = gameHelpers.prestigeButtonText(layer)
		derivedState.constructBarStyles(layer)
	}

	tmp.pointGen = modRules.getPointGen()
	tmp.row1to6spd = modRules.getRow1to6Speed()
	tmp.displayThings = []
	for (thing in modRules.displayThings){
		let text = modRules.displayThings[thing]
		if (gameHelpers.isFunction(text)) text = text()
		tmp.displayThings.push(text) 
	}
	
	if (typeof helpContent.help_data != "undefined" && saveState.player.tab=='help') {
		derivedState.updateTempData(helpContent.help_data, tmp.helpData, "help");
	}
}

function updateTempData(layerData, tmpData, layer, pre, pre2, isArr) {
	let item;
	
	for (item in layerData){
		if ((item.toLowerCase().includes("display") || (item.toLowerCase().includes("tabformat")&&layer!="tree-tab") || item.toLowerCase().includes("description") || (item == "unlocked" && pre2 != "upgrades")) && saveState.player.tab != layer) continue;
		if (Array.isArray(layerData[item])) {
			derivedState.updateTempData(layerData[item], tmpData[item], layer, item, pre, true)
		}
		else if ((!!layerData[item]) && (layerData[item].constructor === Object)) {
			derivedState.updateTempData(layerData[item], tmpData[item], layer, item, pre, isArr)
		}
		else if (gameHelpers.isFunction(layerData[item]) && !activeFunctions.includes(item)){
			let value = layerData[item]()
			if (value !== value || value === layerRegistry.decimalNaN){
				throw new Error("Invalid derived value: " + layer + "." + item);
			}


			if (isArr) effects.setValue(tmpData, item, value); else tmpData[item] = value
		}
	}	
}

function updateChallengeTemp(layer)
{
	derivedState.updateTempData(layerRegistry.layers[layer].challenges, tmp[layer].challenges)
}

function updateBuyableTemp(layer)
{
	derivedState.updateTempData(layerRegistry.layers[layer].buyables, tmp[layer].buyables)
}

function updateClickableTemp(layer)
{
	derivedState.updateTempData(layerRegistry.layers[layer].clickables, tmp[layer].clickables)
}


let DIR_MARGINS = ["margin-bottom", "margin-top", "margin-right", "margin-left"]

function constructBarStyles(layer){
	let id;
	if (layerRegistry.layers[layer].bars === undefined)
		return
	for (id in layerRegistry.layers[layer].bars){
		if (id !== "layer") {
			let bar = tmp[layer].bars[id]
			if (bar.progress instanceof Decimal)
				bar.progress = bar.progress.toNumber()
			bar.progress = (1 -Math.min(Math.max(bar.progress, 0), 1)) * 100

			bar.dims = {'width': bar.width + "px", 'height': bar.height + "px"}
			let dir = bar.direction
			bar.fillDims = {'width': (bar.width + 0.5) + "px", 'height': (bar.height + 0.5)  + "px"}
			if (dir !== undefined)
			{
				bar.fillDims['clip-path'] = 'inset(0% 50% 0% 0%)'
				if(dir == layerRegistry.UP){
					bar.fillDims['clip-path'] = 'inset(' + bar.progress + '% 0% 0% 0%)'
				}
				else if(dir == layerRegistry.DOWN){
					bar.fillDims['clip-path'] = 'inset(0% 0% ' + bar.progress + '% 0%)'
				}
				else if(dir == layerRegistry.RIGHT){
					bar.fillDims['clip-path'] = 'inset(0% ' + bar.progress + '% 0% 0%)'
				}
				else if(dir == layerRegistry.LEFT){
					bar.fillDims['clip-path'] = 'inset(0% 0% 0% ' + bar.progress + '%)'
				}

			}
		}

	}
}

function setupBarStyles(layer){
	let id;
	if (layerRegistry.layers[layer].bars === undefined)
		return
	for (id in layerRegistry.layers[layer].bars){
		let bar = tmp[layer].bars[id]
		bar.dims = {}
		let dir = bar.direction
		bar.fillDims = {}
	}
}


const derivedState = {
 get tmp() { return tmp; },
 get activeFunctions() { return activeFunctions; },
 get noCall() { return noCall; },
 setupTemp,
 setupTempData,
 updateTemp,
 updateTempData,
 updateChallengeTemp,
 updateBuyableTemp,
 updateClickableTemp,
 get DIR_MARGINS() { return DIR_MARGINS; },
 constructBarStyles,
 setupBarStyles,
};
return derivedState;
}
