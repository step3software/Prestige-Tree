// Session-bound layerRegistry owner; composition supplies only the named ports.
function createLayerRegistry({ gameHelpers, gameRules, saveState }) {
let layers = {}

const decimalZero = new Decimal(0)
const decimalOne = new Decimal(1)
const decimalNaN = new Decimal(NaN)

function layerShown(layer){
    return layers[layer].layerShown();
}

let LAYERS = Object.keys(layers);

let hotkeys = {};

let maxRow = 0;

function updateHotkeys()
{
	let hk, id, layer;
    hotkeys = {};
    for (layer in layers){
        hk = layers[layer].hotkeys
        if (hk){
            for (id in hk){
				hotkeys[hk[id].key] = hk[id]
				hotkeys[hk[id].key].layer = layer
            }
        }
    }
}

let ROW_LAYERS = {}
let TREE_LAYERS = {}
let OTHER_LAYERS = {}

function updateLayers(){
	let data, layer, row, thing, x;
    LAYERS = Object.keys(layers);
    ROW_LAYERS = {}
    TREE_LAYERS = {}
    OTHER_LAYERS = {}
    for (layer in layers){
        layers[layer].layer = layer
        if (layers[layer].upgrades){
            for (thing in layers[layer].upgrades){
                if (!isNaN(thing)){
                    layers[layer].upgrades[thing].id = thing
                    layers[layer].upgrades[thing].layer = layer
                    if (layers[layer].upgrades[thing].unlocked === undefined)
                        layers[layer].upgrades[thing].unlocked = true
                }
            }
        }
        if (layers[layer].milestones){
            for (thing in layers[layer].milestones){
                if (!isNaN(thing)){
                    layers[layer].milestones[thing].id = thing
                    layers[layer].milestones[thing].layer = layer
                    if (layers[layer].milestones[thing].unlocked === undefined)
                        layers[layer].milestones[thing].unlocked = true
                }
            }
        }
        if (layers[layer].achievements){
            for (thing in layers[layer].achievements){
                if (!isNaN(thing)){
                    layers[layer].achievements[thing].id = thing
                    layers[layer].achievements[thing].layer = layer
                    if (layers[layer].achievements[thing].unlocked === undefined)
                        layers[layer].achievements[thing].unlocked = true
                }
            }
        }
        if (layers[layer].challenges){
            for (thing in layers[layer].challenges){
                if (!isNaN(thing)){
                    layers[layer].challenges[thing].id = thing
                    layers[layer].challenges[thing].layer = layer
                    if (layers[layer].challenges[thing].unlocked === undefined)
                        layers[layer].challenges[thing].unlocked = true
                    if (layers[layer].challenges[thing].completionLimit === undefined)
                        layers[layer].challenges[thing].completionLimit = 1

                }
            }
        }
        if (layers[layer].buyables){
            layers[layer].buyables.layer = layer
            for (thing in layers[layer].buyables){
                if (!isNaN(thing)){
                    layers[layer].buyables[thing].id = thing
                    layers[layer].buyables[thing].layer = layer
                    if (layers[layer].buyables[thing].unlocked === undefined)
                        layers[layer].buyables[thing].unlocked = true
                }
            }  
        }

        if (layers[layer].clickables){
            layers[layer].clickables.layer = layer
            for (thing in layers[layer].clickables){
                if (!isNaN(thing)){
                    layers[layer].clickables[thing].id = thing
                    layers[layer].clickables[thing].layer = layer
                    if (layers[layer].clickables[thing].unlocked === undefined)
                        layers[layer].clickables[thing].unlocked = true
                }
            }  
        }

        if (layers[layer].bars){
            layers[layer].bars.layer = layer
            for (thing in layers[layer].bars){
                layers[layer].bars[thing].id = thing
                layers[layer].bars[thing].layer = layer
                if (layers[layer].bars[thing].unlocked === undefined)
                    layers[layer].bars[thing].unlocked = true
            }  
        }

        if (layers[layer].infoboxes){
            for (thing in layers[layer].infoboxes){
                layers[layer].infoboxes[thing].id = thing
                layers[layer].infoboxes[thing].layer = layer
                if (layers[layer].infoboxes[thing].unlocked === undefined)
                    layers[layer].infoboxes[thing].unlocked = true
            }  
        }
        
        if (layers[layer].startData) {
            data = layers[layer].startData()
            if (data.best !== undefined && data.showBest === undefined) layers[layer].showBest = true
            if (data.total !== undefined && data.showTotal === undefined) layers[layer].showTotal = true
        }

        if(!layers[layer].componentStyles) layers[layer].componentStyles = {}
        if(layers[layer].symbol === undefined) layers[layer].symbol = layer.charAt(0).toUpperCase() + layer.slice(1)
        if(layers[layer].unlockOrder === undefined) layers[layer].unlockOrder = []
        if(layers[layer].gainMult === undefined) layers[layer].gainMult = new Decimal(1)
        if(layers[layer].gainExp === undefined) layers[layer].gainExp = new Decimal(1)
        if(layers[layer].type === undefined) layers[layer].type = "none"
        if(layers[layer].base === undefined || layers[layer].base <= 1) layers[layer].base = 2

        let row = layers[layer].row
        if(!ROW_LAYERS[row]) ROW_LAYERS[row] = {}
        if(!TREE_LAYERS[row] && !isNaN(row)) TREE_LAYERS[row] = []
        if(!OTHER_LAYERS[row] && isNaN(row)) OTHER_LAYERS[row] = []

        ROW_LAYERS[row][layer]=layer;
        let position = (layers[layer].position !== undefined ? layers[layer].position : layer)
        
        if (!isNaN(row)) TREE_LAYERS[row].push({layer: layer, position: position})
        else OTHER_LAYERS[row].push({layer: layer, position: position})

        if (maxRow < layers[layer].row) maxRow = layers[layer].row
        
    }
    for (row in OTHER_LAYERS) {
        OTHER_LAYERS[row].sort((a, b) => (a.position > b.position) ? 1 : -1)
        for (layer in OTHER_LAYERS[row])
            OTHER_LAYERS[row][layer] = OTHER_LAYERS[row][layer].layer 
    }
    for (row in TREE_LAYERS) {
        TREE_LAYERS[row].sort((a, b) => (a.position > b.position) ? 1 : -1)
            for (layer in TREE_LAYERS[row])
            TREE_LAYERS[row][layer] = TREE_LAYERS[row][layer].layer
    }
    let treeLayers2 = []
    for (x = 0; x < maxRow + 1; x++) {
        if (TREE_LAYERS[x]) treeLayers2.push(TREE_LAYERS[x])
    }
    TREE_LAYERS = treeLayers2
    layerRegistry.updateHotkeys()
}

function addLayer(layerName, layerData){ // Call this to add layers from a different file!
    layers[layerName] = layerData
    layers[layerName].isLayer = true
	
	// Making challenge buttons responsive
	if (layers[layerName].challenges) for (let r=1;r<=layers[layerName].challenges.rows;r++) for (let c=1;c<=layers[layerName].challenges.cols;c++) {
		let id = r*10+c;
		layers[layerName].challenges[id].buttonText = function() { return (saveState.player[this.layer].activeChallenge==(this.id)?(gameRules.canCompleteChallenge(this.layer, this.id)?"Finish":"Exit Early"):(gameHelpers.hasChallenge(this.layer, this.id)?"Completed":"Start")) };
	}
}

function addNode(layerName, layerData){ // Does the same thing
    layers[layerName] = layerData
    layers[layerName].isLayer = false
	
	// Making challenge buttons responsive
	if (layers[layerName].challenges) for (let r=1;r<=layers[layerName].challenges.rows;r++) for (let c=1;c<=layers[layerName].challenges.cols;c++) {
		let id = r*10+c;
		layers[layerName].challenges[id].buttonText = function() { return (saveState.player[this.layer].activeChallenge==(this.id)?(gameRules.canCompleteChallenge(this.layer, this.id)?"Finish":"Exit Early"):(gameHelpers.hasChallenge(this.layer, this.id)?"Completed":"Start")) };
	}
}


// If data is a function, return the result of calling it. Otherwise, return the data.
function readData(data, args=null){
	if (!!(data && data.constructor && data.call && data.apply))
		return data(args);
	else
		return data;
}

function someLayerUnlocked(row){
	let layer;
    for (layer in ROW_LAYERS[row])
        if (saveState.player[layer].unlocked)
            return true
    return false
}


// This isn't worth making a .ts file over
const UP = 0
const DOWN = 1
const LEFT = 2
const RIGHT = 3


const layerRegistry = {
 get layers() { return layers; },
 get decimalZero() { return decimalZero; },
 get decimalOne() { return decimalOne; },
 get decimalNaN() { return decimalNaN; },
 layerShown,
 get LAYERS() { return LAYERS; },
 get hotkeys() { return hotkeys; },
 get maxRow() { return maxRow; },
 updateHotkeys,
 get ROW_LAYERS() { return ROW_LAYERS; },
 get TREE_LAYERS() { return TREE_LAYERS; },
 get OTHER_LAYERS() { return OTHER_LAYERS; },
 updateLayers,
 addLayer,
 addNode,
 readData,
 someLayerUnlocked,
 get UP() { return UP; },
 get DOWN() { return DOWN; },
 get LEFT() { return LEFT; },
 get RIGHT() { return RIGHT; },
};
return layerRegistry;
}
