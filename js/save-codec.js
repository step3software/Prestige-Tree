// Session-bound saveDefaults owner; composition supplies only the named ports.
function createSaveDefaults({ layerRegistry, modRules, treeLayout }) {
// The runtime optional defaults and their inferred contract have one owner.
function optionalPlayerFields() {
	return { devSpeed: 1, hqTree: false, timePlayedReset: false,
		theme: /** @type {'aqua'|null} */ (null),
		offTime: /** @type {{remain:number}|null} */ (null) };
}
// Pure ingress/egress boundary. Configuration/defaults (including time) are
// supplied by the caller. No storage, active player, clock, UI or timer effects.
/** @returns {SaveCodec} */
function createSaveCodec({ defaults, layerDefinitions, version, modId }) {
	const playerDefaults = Object.assign({}, defaults, { version: String(version.num) });
	const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
	const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
	const numeric = "[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:e[+-]?[0-9]+)?";
	const decimalText = new RegExp("^(?:" + numeric + "|[+-]?e{2,}" + numeric + "|[+-]?\\(e\\^[0-9]+\\)" + numeric + ")$", "i");
	const optionalFields = saveDefaults.optionalPlayerFields();
	const knownTab = name => own(layerDefinitions, name) || ["none", "tree-tab", "options", "info", "help", "options-tab", "info-tab", "gameEnded"].includes(name);

	function check(condition, message) {
		if (!condition) throw new Error(message);
	}

	// Copy only JSON data/Decimals. Reject prototype keys, cycles, functions and
	// host objects before JSON serialization could erase or transform them.
	function copy(value, ancestors = new Set()) {
		if (value === undefined || value === null || typeof value === "string" || typeof value === "boolean") return value;
		if (typeof value === "number") {
			check(Number.isFinite(value), "Non-finite save number.");
			return value;
		}
		if (value instanceof Decimal) return value.toString();
		check(typeof value === "object" && !ancestors.has(value), "Save contains a cycle or non-data value.");
		check(Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null, "Save contains a non-data object.");
		ancestors.add(value);
		let result = Array.isArray(value) ? [] : {};
		for (let key of Object.keys(value)) {
			check(!["__proto__", "prototype", "constructor"].includes(key), "Invalid save key.");
			result[key] = copy(value[key], ancestors);
		}
		ancestors.delete(value);
		return result;
	}

	function hydrate(value, template) {
		if (value === undefined) value = copy(template);
		if (template instanceof Decimal) {
			check(typeof value === "number" || (typeof value === "string" && decimalText.test(value)), "Invalid Decimal text.");
			let decimal = new Decimal(value);
			check([decimal.sign, decimal.layer, decimal.mag].every(Number.isFinite), "Invalid Decimal value.");
			return decimal;
		}
		if (Array.isArray(template)) {
			check(Array.isArray(value), "Invalid save list.");
			if (template.length) {
				check(value.length <= template.length, "Unsupported save list length.");
				return template.map((item, index) => hydrate(value[index], item));
			}
			check(value.every(item => typeof item === "string" || (typeof item === "number" && Number.isFinite(item))), "Invalid save list entry.");
			return value;
		}
		if (record(template)) {
			check(record(value), "Invalid save record.");
			for (let key of Object.keys(template)) value[key] = hydrate(value[key], template[key]);
			return value;
		}
		if (template !== null && template !== undefined) {
			check(typeof value === typeof template && (typeof value !== "number" || Number.isFinite(value)), "Invalid save field.");
		} else {
			check(value === null || typeof value !== "object", "Invalid nullable save field.");
		}
		return value;
	}

	function checkReferences(data) {
		for (let id of Object.keys(layerDefinitions)) {
			let layer = data[id];
			let definition = layerDefinitions[id];
			for (let field of ["upgrades", "milestones", "achievements", "primeMiles", "pseudoUpgs"]) {
				if (layer[field] === undefined) continue;
				let source = field === "pseudoUpgs" ? "upgrades" : field === "primeMiles" ? "milestones" : field;
				check(layer[field].every(entry => own(definition[source] || {}, entry)), "Unknown " + id + " " + field + " reference.");
			}
			for (let field of ["buyables", "clickables", "challenges"]) {
				for (let key of Object.keys(layer[field])) {
					check(own(defaults[id][field], key), "Unknown " + id + " " + field + " reference.");
					if (field === "challenges") check(Number.isInteger(layer[field][key]) && layer[field][key] >= 0, "Invalid challenge count.");
				}
			}
			if (layer.activeChallenge !== undefined && layer.activeChallenge !== null) {
				check((typeof layer.activeChallenge === "number" || typeof layer.activeChallenge === "string") && own(definition.challenges || {}, layer.activeChallenge), "Unknown active challenge.");
			}
			// Engine defaults are the owner of subtab names. Preserve the existing
			// repair of removed tabs; malformed records are rejected by hydrate.
			if (definition.tabFormat && !Array.isArray(definition.tabFormat)) {
				if (!own(definition.tabFormat, data.subtabs[id].mainTabs)) data.subtabs[id].mainTabs = Object.keys(definition.tabFormat)[0];
			}
			for (let group of Object.keys(definition.microtabs || {})) {
				if (!own(definition.microtabs[group], data.subtabs[id][group])) data.subtabs[id][group] = Object.keys(definition.microtabs[group])[0];
			}
		}
		if (data.ma) {
			check(data.ma.mastered.every(id => own(layerDefinitions, id)), "Unknown mastered layer.");
			check(data.ma.current === null || (typeof data.ma.current === "string" && own(layerDefinitions, data.ma.current)), "Unknown mastery selection.");
		}
		for (let key of Object.keys(data.notify)) {
			check(knownTab(key) && [false, true, 0, 1].includes(data.notify[key]), "Invalid notification.");
		}
		for (let id of Object.keys(data.infoboxes)) {
			check(own(defaults.infoboxes, id) && record(data.infoboxes[id]), "Unknown infobox record.");
			for (let key of Object.keys(data.infoboxes[id])) {
				check(own(defaults.infoboxes[id], key) && typeof data.infoboxes[id][key] === "boolean", "Invalid infobox state.");
			}
		}
		for (let id of Object.keys(data.subtabs)) {
			check(own(defaults.subtabs, id) && record(data.subtabs[id]), "Unknown subtab record.");
			for (let group of Object.keys(data.subtabs[id])) {
				let emptyGroup = defaults.subtabs[id][group] === undefined && data.subtabs[id][group] === undefined;
				check(own(defaults.subtabs[id], group) && (emptyGroup || typeof data.subtabs[id][group] === "string"), "Invalid subtab state.");
			}
		}
		for (let key of ["tab", "navTab", "lastSafeTab"]) {
			check(knownTab(data[key]), "Unknown tab.");
		}
	}

	function playerCandidate(raw) {
		check(record(raw) && own(raw, "points"), "Invalid player save.");
		let data = copy(raw);
		for (let key of Object.keys(data)) {
			check(own(defaults, key) || own(optionalFields, key), "Unsupported player field: " + key);
		}
		// Historical numeric versions and authored Gear empty-zero sentinels are
		// converted once here. All outputs use the current version/model.
		if (typeof data.version === "number") data.version = String(data.version);
		if (data.version !== undefined) {
			check(typeof data.version === "string" && /^\d+(?:\.\d+)?$/.test(data.version) && Number(data.version) <= Number(version.num), "Unsupported save version.");
		}
		if (record(data.ge) && record(data.ge.clickables)) {
			for (let id of [11, 12, 13]) if (data.ge.clickables[id] === "") data.ge.clickables[id] = "0";
		}
		const addedLayerFields = { activeChallenge: null, unlockOrder: 0, timePlayed: 0, best: new Decimal(0), total: new Decimal(0) };
		for (let id of Object.keys(layerDefinitions)) {
			if (!record(data[id])) continue; // hydrate rejects malformed present records.
			for (let key of Object.keys(data[id])) {
				if (own(defaults[id], key)) continue;
				check(own(addedLayerFields, key), "Unsupported " + id + " field: " + key);
				data[id][key] = hydrate(data[id][key], addedLayerFields[key]);
			}
		}
		let oldVersion = data.version;
		data = hydrate(data, playerDefaults);
		for (let field of ["devSpeed", "hqTree", "timePlayedReset"]) {
			if (data[field] !== undefined) data[field] = hydrate(data[field], optionalFields[field]);
		}
		if (data.devSpeed !== undefined) check(data.devSpeed >= 0, "Invalid game speed.");
		if (data.theme !== undefined) check(data.theme === null || data.theme === "aqua", "Unknown theme.");
		if (data.offTime !== undefined && data.offTime !== null) {
			check(record(data.offTime) && Number.isFinite(data.offTime.remain) && data.offTime.remain >= 0, "Invalid offline time.");
		}
		checkReferences(data);
		if (data.versionType === modId && oldVersion !== undefined && Number(oldVersion) < Number(version.num)) data.keepGoing = false;
		data.version = String(version.num);
		data.beta = version.beta;
		return data;
	}

	function collectionCandidate(raw) {
		check(record(raw), "Invalid save collection.");
		if (!own(raw, "set")) raw = { set: "save1", save1: raw };
		check(typeof raw.set === "string" && raw.set !== "set" && own(raw, raw.set), "Missing selected save.");
		let collection = { set: raw.set };
		for (let name of Object.keys(raw)) {
			if (name === "set" || raw[name] === undefined) continue;
			check(!["__proto__", "prototype", "constructor"].includes(name) && !(name in Object.prototype), "Invalid save name.");
			collection[name] = playerCandidate(raw[name]);
			check(collection[name].versionType === modId, "Stored save belongs to a different mod.");
		}
		check(own(collection, collection.set), "Missing selected save.");
		return collection;
	}

	function outcome(operation) {
		try { return operation(); }
		catch (error) { return { ok: false, error: error.message }; }
	}
	return {
		decodePlayer: raw => outcome(() => ({ ok: true, value: playerCandidate(typeof raw === "string" ? JSON.parse(atob(raw)) : raw) })),
		decodeCollection: raw => outcome(() => ({ ok: true, value: collectionCandidate(typeof raw === "string" ? JSON.parse(atob(raw)) : raw) })),
		encodePlayer: raw => outcome(() => {
			let value = playerCandidate(raw);
			return { ok: true, value, text: btoa(JSON.stringify(value)) };
		}),
		encodeCollection: raw => outcome(() => {
			let value = collectionCandidate(raw);
			return { ok: true, value, text: btoa(JSON.stringify(value)) };
		}),
	};
}

// Fresh defaults from the static game definitions; the caller owns the clock.
function startPlayerBase(now) {
	return {
		tab: treeLayout.layoutInfo.startTab,
		navTab: (treeLayout.layoutInfo.showTree ? "tree-tab" : "none"),
		time: now,
		autosave: true,
		notify: {},
		msDisplay: "always",
		offlineProd: true,
		versionType: modRules.modInfo.id,
		version: String(modRules.VERSION.num),
		beta: modRules.VERSION.beta,
		timePlayed: 0,
		keepGoing: false,
		hasNaN: false,
		hideChallenges: false,
		tapNerd: false,
		anim: true,
		grad: true,
		milNotify: true,
		optTab: "mainOpt",
		slightGlow: "normal",
		redGlowActive: true,
		spaceGlow: "normal",
		solGlow: "normal",
		majGlow: "uncasted",
		shellGlow: true,
		scShown: true,
		oldStyle: false,
		hideStars: false,
		showStory: true,
		saveMenuOpen: false,
		// The vendor constructor is untyped; the codec checks this real class.
		points: /** @type {DecimalValue} */ (new Decimal(modRules.modInfo.initialStartPoints)),
		subtabs: {},
		lastSafeTab: (treeLayout.layoutInfo.showTree ? "none" : treeLayout.layoutInfo.startTab)
	}
}

function createSavePlayer(now) {
	let playerdata = saveDefaults.startPlayerBase(now)

	if (modRules.addedPlayerData) {
		let extradata = modRules.addedPlayerData()
		for (let thing in extradata)
			playerdata[thing] = extradata[thing]
	}

	playerdata.infoboxes = {}
	for (let layer in layerRegistry.layers){
		playerdata[layer] = {}
		if (layerRegistry.layers[layer].startData)
			playerdata[layer] = layerRegistry.layers[layer].startData()
		else playerdata[layer].unlocked = true
		playerdata[layer].buyables = saveDefaults.getStartBuyables(layer)
		if(playerdata[layer].clickables == undefined) playerdata[layer].clickables = saveDefaults.getStartClickables(layer)
		playerdata[layer].spentOnBuyables = new Decimal(0)
		playerdata[layer].upgrades = []
		playerdata[layer].milestones = []
		playerdata[layer].primeMiles = []
		playerdata[layer].achievements = []
		playerdata[layer].challenges = saveDefaults.getStartChallenges(layer)
		if (layerRegistry.layers[layer].tabFormat && !Array.isArray(layerRegistry.layers[layer].tabFormat)) {
			playerdata.subtabs[layer] = {}
			playerdata.subtabs[layer].mainTabs = Object.keys(layerRegistry.layers[layer].tabFormat)[0]
		}
		if (layerRegistry.layers[layer].microtabs) {
			if (playerdata.subtabs[layer] == undefined) playerdata.subtabs[layer] = {}
			for (let item in layerRegistry.layers[layer].microtabs)
			playerdata.subtabs[layer][item] = Object.keys(layerRegistry.layers[layer].microtabs[item])[0]
		}
		if (layerRegistry.layers[layer].infoboxes) {
			if (playerdata.infoboxes[layer] == undefined) playerdata.infoboxes[layer] = {}
			for (let item in layerRegistry.layers[layer].infoboxes)
				playerdata.infoboxes[layer][item] = false
		}
	}
	return playerdata
}


function getStartBuyables(layer){
	let data = {}
	if (layerRegistry.layers[layer].buyables) {
		for (let id in layerRegistry.layers[layer].buyables)
			if (!isNaN(id))
				data[id] = new Decimal(0)
	}
	return data
}

function getStartClickables(layer){
	let data = {}
	if (layerRegistry.layers[layer].clickables) {
		for (let id in layerRegistry.layers[layer].clickables)
			if (!isNaN(id))
				data[id] = new Decimal(0)
	}
	return data
}

function getStartChallenges(layer){
	let data = {}
	if (layerRegistry.layers[layer].challenges) {
		for (let id in layerRegistry.layers[layer].challenges)
			if (!isNaN(id))
				data[id] = 0
	}
	return data
}


const saveDefaults = {
 optionalPlayerFields,
 createSaveCodec,
 startPlayerBase,
 createSavePlayer,
 getStartBuyables,
 getStartClickables,
 getStartChallenges,
};
return saveDefaults;
}
