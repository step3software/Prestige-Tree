// Session-bound saveCommands owner; composition supplies only the named ports.
function createSaveCommands({ derivedState, effects, gameHelpers, gameRules, gameView, layerRegistry, modRules, runtimeServices, saveDefaults, saveState }) {
// Commands own active state and browser effects; codec and storage own their
// separate boundaries. No command publishes a candidate before persistence.
const saveStorage = createSaveStorage(() => effects.localStorage, modRules.modInfo.id);
const saveRecovery = { required: false, original: undefined };
const saveStatus = { state: "idle", message: "" };
const saveRegexCode = /[^\w ]|_/g;

function getStartPlayer(now = effects.Date.now()) {
	return saveDefaults.createSavePlayer(now);
}

function saveCodec(now = effects.Date.now()) {
	return saveDefaults.createSaveCodec({ defaults: saveCommands.getStartPlayer(now), layerDefinitions: layerRegistry.layers, version: modRules.VERSION, modId: modRules.modInfo.id, migrationMode: modRules.saveMigrationMode, migratePlayer: modRules.migratePlayerData, validatePlayer: modRules.validatePlayerData });
}

function reportSaveStatus(state, message) {
	saveStatus.state = state;
	saveStatus.message = message;
	let status = effects.document.getElementById("save-status");
	if (status) {
		status.textContent = message;
		status.hidden = false;
	}
}

function saveCommandsAvailable() {
	if (gameRules.tickFaulted) {
		saveCommands.reportSaveStatus("error", "Reload the page to recover your last save before saving changes.");
		return false;
	}
	if (saveRecovery.required || !saveState.allSaves || !saveState.player) {
		saveCommands.reportSaveStatus("error", "Your original saves are protected. Retry loading or import a validated recovery save.");
		return false;
	}
	return true;
}

function currentSaveCollection() {
	if (!saveCommands.saveCommandsAvailable()) return null;
	return Object.assign({}, saveState.allSaves, { [saveState.allSaves.set]: saveState.player });
}

function activateSaveCollection(collection) {
	if (saveState.player !== collection[collection.set]) runtimeServices.disposeAll();
	saveState.activate(collection);
	gameView.bind();
}

function persistSaveCollection(candidate) {
	if (!saveCommands.saveCommandsAvailable()) return false;
	let stored = saveStorage.write(candidate, saveCommands.saveCodec());
	if (!stored.ok) {
		saveCommands.reportSaveStatus("error", stored.error + " Current progress is unsaved; the previous saved data is unchanged.");
		return false;
	}
	// Retain the live player's identity for ordinary saves/Vue. The detached
	// validation result supplies every inactive entry; there is one active object.
	stored.value[candidate.set] = candidate[candidate.set];
	saveCommands.activateSaveCollection(stored.value);
	saveCommands.reportSaveStatus("saved", "Saved in this browser.");
	return true;
}

function setLocalStorage() {
	return saveCommands.save();
}

function save(name = saveState.allSaves && saveState.allSaves.set) {
	let candidate = saveCommands.currentSaveCollection();
	if (!candidate || !Object.prototype.hasOwnProperty.call(candidate, name) || name === "set") return false;
	candidate[name] = saveState.player;
	return saveCommands.persistSaveCollection(candidate);
}

function showAllSaves() { saveState.player.saveMenuOpen = true; }
function resetSaveMenu() {
	saveState.player.saveMenuOpen = false;
	saveState.player.saveMenuOpen = true;
}

function loadSave(name) {
	let candidate = saveCommands.currentSaveCollection();
	if (!candidate || name === "set" || !Object.prototype.hasOwnProperty.call(candidate, name)) return false;
	candidate.set = name;
	if (!saveCommands.persistSaveCollection(candidate)) return false;
	effects.window.location.reload();
	return true;
}

// Cancellation and rejected names have no persistence or selection effects.
function promptSaveName() {
	let entered = effects.prompt("Enter save name: ");
	if (entered === null) return null;
	let name = entered.replace(saveRegexCode, "").trim();
	if (!name) effects.alert("Please enter a save name using letters or numbers.");
	else if (name === "set" || name in Object.prototype) effects.alert("That name is reserved for game data. Please choose another name.");
	else if (saveState.allSaves[name] !== undefined) effects.alert("That name is taken already. Please choose another name.");
	else if (name.length > 20) effects.alert("This name is too long! Use at most 20 characters.");
	else return name;
	return null;
}

function newSave() {
	let candidate = saveCommands.currentSaveCollection();
	if (!candidate) return false;
	let name = saveCommands.promptSaveName();
	if (name === null) return false;
	candidate[name] = saveCommands.getStartPlayer();
	candidate.set = name;
	if (!saveCommands.persistSaveCollection(candidate)) return false;
	effects.window.location.reload();
	return true;
}

function renameSave(name) {
	let candidate = saveCommands.currentSaveCollection();
	if (!candidate || name === "set" || !Object.prototype.hasOwnProperty.call(candidate, name)) return false;
	let newName = saveCommands.promptSaveName();
	if (newName === null) return false;
	// Rebuild in the same order instead of delete/append moving the renamed slot.
	let renamed = { set: candidate.set === name ? newName : candidate.set };
	for (let key of Object.keys(candidate)) if (key !== "set") renamed[key === name ? newName : key] = candidate[key];
	if (!saveCommands.persistSaveCollection(renamed)) return false;
	saveCommands.resetSaveMenu();
	return true;
}

function deleteSave(name) {
	let candidate = saveCommands.currentSaveCollection();
	if (!candidate || name === "set" || !Object.prototype.hasOwnProperty.call(candidate, name)) return false;
	let names = Object.keys(candidate).filter(key => key !== "set");
	if (names.length === 1) return gameRules.hardReset();
	if (!effects.confirm("Are you sure you wish to delete this save?")) return false;
	delete candidate[name];
	let activeDeleted = candidate.set === name;
	if (activeDeleted) candidate.set = names[(names.indexOf(name) + 1) % names.length];
	if (!saveCommands.persistSaveCollection(candidate)) return false;
	if (activeDeleted) effects.window.location.reload();
	else saveCommands.resetSaveMenu();
	return true;
}

function moveSave(name, direction) {
	let candidate = saveCommands.currentSaveCollection();
	if (!candidate) return false;
	let names = Object.keys(candidate).filter(key => key !== "set");
	let oldPosition = names.indexOf(name);
	if (oldPosition < 0 || ![-1, 1].includes(direction)) return false;
	let position = Math.min(Math.max(oldPosition + direction, 0), names.length - 1);
	if (position === oldPosition) return false;
	[names[oldPosition], names[position]] = [names[position], names[oldPosition]];
	let reordered = { set: candidate.set };
	for (let key of names) reordered[key] = candidate[key];
	if (!saveCommands.persistSaveCollection(reordered)) return false;
	saveCommands.resetSaveMenu();
	return true;
}

function showMoveSaveBtn(name, direction) {
	let names = Object.keys(saveState.allSaves).filter(key => key !== "set");
	return direction === "up" ? names.indexOf(name) > 0 : names.indexOf(name) < names.length - 1;
}

function blockSaveLoading(result) {
	saveRecovery.required = true;
	saveRecovery.original = result.original;
	saveCommands.reportSaveStatus("error", "Could not load saves. " + result.error + " Original browser data is unchanged.");
	let recovery = effects.document.getElementById("save-recovery");
	let original = effects.document.getElementById("save-original");
	let game = effects.document.getElementById("app");
	if (recovery) recovery.hidden = false;
	if (original) original.value = result.original === undefined ? "Storage could not be read. Allow storage, then retry loading." : result.original;
	if (game) game.hidden = true;
	return false;
}

function load() {
	if (gameRules.tickFaulted) return false;
	runtimeServices.disposeAll();
	let now = effects.Date.now();
	let codec = saveCommands.saveCodec(now);
	let result = saveStorage.read(codec);
	if (!result.ok) return saveCommands.blockSaveLoading(result);
	let collection = result.value;
	if (collection === null) {
		collection = { set: "save1", save1: saveCommands.getStartPlayer(now) };
	} else {
		let canonical = codec.encodeCollection(collection);
		if (!canonical.ok) return saveCommands.blockSaveLoading(Object.assign({}, canonical, { original: result.original }));
		if (canonical.text !== result.original) {
			let stored = saveStorage.write(collection, codec);
			if (!stored.ok) return saveCommands.blockSaveLoading(Object.assign({}, stored, { original: result.original }));
			collection = stored.value;
		}
	}
	saveRecovery.required = false;
	saveRecovery.original = undefined;
	let recovery = effects.document.getElementById("save-recovery");
	let game = effects.document.getElementById("app");
	if (recovery) recovery.hidden = true;
	if (game) game.hidden = false;
	saveCommands.activateSaveCollection(collection);

	try {
		effects.document.title = modRules.modInfo.name;
		gameHelpers.changeTheme();
		gameHelpers.changeTreeQuality();
		layerRegistry.updateLayers();
		derivedState.setupTemp();
		derivedState.updateTemp();
		derivedState.updateTemp();
		derivedState.updateTemp();
		if (typeof gameView.app !== "undefined" && gameView.app) gameView.bind();
		else gameView.loadVue();
		saveState.player.saveMenuOpen = false;
		return runtimeServices.startGameRuntime();
	} catch (error) {
		runtimeServices.reportRuntimeFault(error);
		return false;
	}
}

function exportSave() {
	if (!saveState.player) return false;
	let encoded = saveCommands.saveCodec().encodePlayer(saveState.player);
	if (!encoded.ok) { saveCommands.reportSaveStatus("error", "Could not export save. " + encoded.error); return false; }
	let element = effects.document.createElement("textarea");
	element.value = encoded.text;
	effects.document.body.appendChild(element);
	element.select();
	element.setSelectionRange(0, 99999);
	let copied;
	try { copied = effects.document.execCommand("copy"); }
	catch (error) { copied = false; }
	finally { effects.document.body.removeChild(element); }
	saveCommands.reportSaveStatus(copied ? "exported" : "error", copied ? "Save copied to clipboard." : "Could not copy save. Allow clipboard access and retry.");
	return !!copied;
}

function importSave(imported = undefined, forced = false) {
	if (gameRules.tickFaulted) {
		effects.alert("Reload the page to recover your last save before importing another save.");
		return false;
	}
	if (imported === undefined) imported = effects.prompt("Paste your save here");
	if (imported === null) return false;
	let decoded = saveCommands.saveCodec().decodePlayer(imported);
	if (!decoded.ok) return saveCommands.rejectedSaveImport(decoded.error);
	let candidate = decoded.value;
	if (candidate.versionType !== modRules.modInfo.id && !forced && !effects.confirm("This save appears to be for a different mod! Are you sure you want to import?")) return false;
	candidate.versionType = modRules.modInfo.id;
	let candidateSaves;
	if (saveRecovery.required) {
		if (saveRecovery.original === undefined) return saveCommands.rejectedSaveImport("Allow browser storage and retry loading before replacing any saves.");
		if (!effects.confirm("Replace the unreadable saved collection with this validated recovery save? Copy the original data first if you need it.")) return false;
		candidateSaves = { set: "save1", save1: candidate };
	} else {
		candidateSaves = Object.assign({}, saveState.allSaves, { [saveState.allSaves.set]: candidate });
	}
	let stored = saveStorage.write(candidateSaves, saveCommands.saveCodec());
	if (!stored.ok) return saveCommands.rejectedSaveImport(stored.error);
	saveCommands.activateSaveCollection(stored.value);
	saveCommands.reportSaveStatus("saved", "Imported and saved in this browser.");
	effects.window.location.reload();
	return true;
}

function rejectedSaveImport(reason) {
	let message = "Could not import this save. Your current progress and saved files are unchanged. " + reason + " Check the save text and browser storage, then try again.";
	saveCommands.reportSaveStatus("error", message);
	effects.alert(message);
	return false;
}


const saveCommands = {
 get saveStorage() { return saveStorage; },
 get saveRecovery() { return saveRecovery; },
 get saveStatus() { return saveStatus; },
 get saveRegexCode() { return saveRegexCode; },
 getStartPlayer,
 saveCodec,
 reportSaveStatus,
 saveCommandsAvailable,
 currentSaveCollection,
 activateSaveCollection,
 persistSaveCollection,
 setLocalStorage,
 save,
 showAllSaves,
 resetSaveMenu,
 loadSave,
 promptSaveName,
 newSave,
 renameSave,
 deleteSave,
 moveSave,
 showMoveSaveBtn,
 blockSaveLoading,
 load,
 exportSave,
 importSave,
 rejectedSaveImport,
};
return saveCommands;
}
