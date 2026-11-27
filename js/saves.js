// Commands own active state and browser effects; codec and storage own their
// separate boundaries. No command publishes a candidate before persistence.
const saveStorage = createSaveStorage(() => localStorage, modInfo.id);
const saveRecovery = { required: false, original: undefined };
const saveStatus = { state: "idle", message: "" };
const saveRegexCode = /[^\w ]|_/g;

function getStartPlayer(now = Date.now()) {
	return createSavePlayer(now);
}

function saveCodec(now = Date.now()) {
	return createSaveCodec({ defaults: getStartPlayer(now), layerDefinitions: layers, version: VERSION, modId: modInfo.id });
}

function reportSaveStatus(state, message) {
	saveStatus.state = state;
	saveStatus.message = message;
	let status = document.getElementById("save-status");
	if (status) {
		status.textContent = message;
		status.hidden = false;
	}
}

function saveCommandsAvailable() {
	if (tickFaulted) {
		reportSaveStatus("error", "Reload the page to recover your last save before saving changes.");
		return false;
	}
	if (saveRecovery.required || !allSaves || !player) {
		reportSaveStatus("error", "Your original saves are protected. Retry loading or import a validated recovery save.");
		return false;
	}
	return true;
}

function currentSaveCollection() {
	if (!saveCommandsAvailable()) return null;
	return Object.assign({}, allSaves, { [allSaves.set]: player });
}

function activateSaveCollection(collection) {
	allSaves = collection;
	player = collection[collection.set];
	if (typeof app !== "undefined" && app) {
		app.player = player;
		app.allSaves = allSaves;
	}
}

function persistSaveCollection(candidate) {
	if (!saveCommandsAvailable()) return false;
	let stored = saveStorage.write(candidate, saveCodec());
	if (!stored.ok) {
		reportSaveStatus("error", stored.error + " Current progress is unsaved; the previous saved data is unchanged.");
		return false;
	}
	// Retain the live player's identity for ordinary saves/Vue. The detached
	// validation result supplies every inactive entry; there is one active object.
	stored.value[candidate.set] = candidate[candidate.set];
	activateSaveCollection(stored.value);
	reportSaveStatus("saved", "Saved in this browser.");
	return true;
}

function setLocalStorage() {
	return save();
}

function save(name = allSaves && allSaves.set) {
	let candidate = currentSaveCollection();
	if (!candidate || !Object.prototype.hasOwnProperty.call(candidate, name) || name === "set") return false;
	candidate[name] = player;
	return persistSaveCollection(candidate);
}

function showAllSaves() { player.saveMenuOpen = true; }
function resetSaveMenu() {
	player.saveMenuOpen = false;
	player.saveMenuOpen = true;
}

function loadSave(name) {
	let candidate = currentSaveCollection();
	if (!candidate || name === "set" || !Object.prototype.hasOwnProperty.call(candidate, name)) return false;
	candidate.set = name;
	if (!persistSaveCollection(candidate)) return false;
	window.location.reload();
	return true;
}

// Cancellation and rejected names have no persistence or selection effects.
function promptSaveName() {
	let entered = prompt("Enter save name: ");
	if (entered === null) return null;
	let name = entered.replace(saveRegexCode, "").trim();
	if (!name) alert("Please enter a save name using letters or numbers.");
	else if (name === "set" || name in Object.prototype) alert("That name is reserved for game data. Please choose another name.");
	else if (allSaves[name] !== undefined) alert("That name is taken already. Please choose another name.");
	else if (name.length > 20) alert("This name is too long! Use at most 20 characters.");
	else return name;
	return null;
}

function newSave() {
	let candidate = currentSaveCollection();
	if (!candidate) return false;
	let name = promptSaveName();
	if (name === null) return false;
	candidate[name] = getStartPlayer();
	candidate.set = name;
	if (!persistSaveCollection(candidate)) return false;
	window.location.reload();
	return true;
}

function renameSave(name) {
	let candidate = currentSaveCollection();
	if (!candidate || name === "set" || !Object.prototype.hasOwnProperty.call(candidate, name)) return false;
	let newName = promptSaveName();
	if (newName === null) return false;
	// Rebuild in the same order instead of delete/append moving the renamed slot.
	let renamed = { set: candidate.set === name ? newName : candidate.set };
	for (let key of Object.keys(candidate)) if (key !== "set") renamed[key === name ? newName : key] = candidate[key];
	if (!persistSaveCollection(renamed)) return false;
	resetSaveMenu();
	return true;
}

function deleteSave(name) {
	let candidate = currentSaveCollection();
	if (!candidate || name === "set" || !Object.prototype.hasOwnProperty.call(candidate, name)) return false;
	let names = Object.keys(candidate).filter(key => key !== "set");
	if (names.length === 1) return hardReset();
	if (!confirm("Are you sure you wish to delete this save?")) return false;
	delete candidate[name];
	let activeDeleted = candidate.set === name;
	if (activeDeleted) candidate.set = names[(names.indexOf(name) + 1) % names.length];
	if (!persistSaveCollection(candidate)) return false;
	if (activeDeleted) window.location.reload();
	else resetSaveMenu();
	return true;
}

function moveSave(name, direction) {
	let candidate = currentSaveCollection();
	if (!candidate) return false;
	let names = Object.keys(candidate).filter(key => key !== "set");
	let oldPosition = names.indexOf(name);
	if (oldPosition < 0 || ![-1, 1].includes(direction)) return false;
	let position = Math.min(Math.max(oldPosition + direction, 0), names.length - 1);
	if (position === oldPosition) return false;
	[names[oldPosition], names[position]] = [names[position], names[oldPosition]];
	let reordered = { set: candidate.set };
	for (let key of names) reordered[key] = candidate[key];
	if (!persistSaveCollection(reordered)) return false;
	resetSaveMenu();
	return true;
}

function showMoveSaveBtn(name, direction) {
	let names = Object.keys(allSaves).filter(key => key !== "set");
	return direction === "up" ? names.indexOf(name) > 0 : names.indexOf(name) < names.length - 1;
}

function blockSaveLoading(result) {
	saveRecovery.required = true;
	saveRecovery.original = result.original;
	reportSaveStatus("error", "Could not load saves. " + result.error + " Original browser data is unchanged.");
	let recovery = document.getElementById("save-recovery");
	let original = document.getElementById("save-original");
	let game = document.getElementById("app");
	if (recovery) recovery.hidden = false;
	if (original) original.value = result.original === undefined ? "Storage could not be read. Allow storage, then retry loading." : result.original;
	if (game) game.hidden = true;
	return false;
}

function load() {
	let now = Date.now();
	let codec = saveCodec(now);
	let result = saveStorage.read(codec);
	if (!result.ok) return blockSaveLoading(result);
	let collection = result.value;
	if (collection === null) {
		collection = { set: "save1", save1: getStartPlayer(now) };
	} else {
		let canonical = codec.encodeCollection(collection);
		if (!canonical.ok) return blockSaveLoading(Object.assign({}, canonical, { original: result.original }));
		if (canonical.text !== result.original) {
			let stored = saveStorage.write(collection, codec);
			if (!stored.ok) return blockSaveLoading(Object.assign({}, stored, { original: result.original }));
			collection = stored.value;
		}
	}
	saveRecovery.required = false;
	saveRecovery.original = undefined;
	let recovery = document.getElementById("save-recovery");
	let game = document.getElementById("app");
	if (recovery) recovery.hidden = true;
	if (game) game.hidden = false;
	activateSaveCollection(collection);
	if (player.offlineProd) {
		if (player.offTime === undefined || player.offTime === null) player.offTime = { remain: 0 };
		let elapsedSeconds = Math.max((now - player.time) / 1000, 0);
		player.offTime.remain = Math.min(Math.max(player.offTime.remain, 0) + elapsedSeconds, modInfo.offlineLimit * 3600);
	} else player.offTime = null;
	player.time = now;
	changeTheme();
	changeTreeQuality();
	updateLayers();
	setupTemp();
	updateTemp();
	updateTemp();
	updateTemp();
	loadVue();
	player.saveMenuOpen = false;
	return true;
}

function exportSave() {
	if (!player) return false;
	let encoded = saveCodec().encodePlayer(player);
	if (!encoded.ok) { reportSaveStatus("error", "Could not export save. " + encoded.error); return false; }
	let element = document.createElement("textarea");
	element.value = encoded.text;
	document.body.appendChild(element);
	element.select();
	element.setSelectionRange(0, 99999);
	let copied;
	try { copied = document.execCommand("copy"); }
	catch (error) { copied = false; }
	finally { document.body.removeChild(element); }
	reportSaveStatus(copied ? "exported" : "error", copied ? "Save copied to clipboard." : "Could not copy save. Allow clipboard access and retry.");
	return !!copied;
}

function importSave(imported = undefined, forced = false) {
	if (tickFaulted) {
		alert("Reload the page to recover your last save before importing another save.");
		return false;
	}
	if (imported === undefined) imported = prompt("Paste your save here");
	if (imported === null) return false;
	let decoded = saveCodec().decodePlayer(imported);
	if (!decoded.ok) return rejectedSaveImport(decoded.error);
	let candidate = decoded.value;
	if (candidate.versionType !== modInfo.id && !forced && !confirm("This save appears to be for a different mod! Are you sure you want to import?")) return false;
	candidate.versionType = modInfo.id;
	let candidateSaves;
	if (saveRecovery.required) {
		if (saveRecovery.original === undefined) return rejectedSaveImport("Allow browser storage and retry loading before replacing any saves.");
		if (!confirm("Replace the unreadable saved collection with this validated recovery save? Copy the original data first if you need it.")) return false;
		candidateSaves = { set: "save1", save1: candidate };
	} else {
		candidateSaves = Object.assign({}, allSaves, { [allSaves.set]: candidate });
	}
	let stored = saveStorage.write(candidateSaves, saveCodec());
	if (!stored.ok) return rejectedSaveImport(stored.error);
	activateSaveCollection(stored.value);
	reportSaveStatus("saved", "Imported and saved in this browser.");
	window.location.reload();
	return true;
}

function rejectedSaveImport(reason) {
	let message = "Could not import this save. Your current progress and saved files are unchanged. " + reason + " Check the save text and browser storage, then try again.";
	reportSaveStatus("error", message);
	alert(message);
	return false;
}

var saveInterval = setInterval(function() {
	if (player === undefined || allSaves === undefined || tickFaulted || saveRecovery.required) return;
	if (gameEnded && !player.keepGoing) return;
	if (player.autosave) save();
}, 5000);
