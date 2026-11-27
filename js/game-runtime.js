// @ts-check
// Session-bound runtimeServices owner; composition supplies only the named ports.
/** @param {{derivedState:ReturnType<typeof createDerivedState>,effects:HeadlessEffects,gameHelpers:ReturnType<typeof createGameHelpers>,gameRules:ReturnType<typeof createGameRules>,modRules:ReturnType<typeof createModRules>,saveCommands:ReturnType<typeof createSaveCommands>,saveState:ReturnType<typeof createSaveState>,treeCanvas:ReturnType<typeof createTreeCanvas>,isLive:()=>boolean}} ports */
function createRuntimeServices({ derivedState, effects, gameHelpers, gameRules, modRules, saveCommands, saveState, treeCanvas, isLive }) {
/** @type {ReturnType<typeof createGameRuntime>|undefined} */
let gameRuntime;
// Includes directly constructed runtimes, not only the browser driver handle.
/** @type {Set<ReturnType<typeof createGameRuntime>>} */
const ownedRuntimes = new Set();
let disposingAll = false;

function disposeAll() {
	if (disposingAll) return;
	disposingAll = true;
	let failed = false;
	/** @type {unknown} */ let failure;
	try {
		for (const runtime of [...ownedRuntimes]) {
			try { runtime.dispose(); }
			catch (error) { if (!failed) failure = error; failed = true; }
		}
	} finally { disposingAll = false; }
	if (failed) throw failure;
}

function captureGameIdentity() {
	if (!isLive()) throw new Error("Disposed game session");
	const player = saveState.player;
	if (!player) throw new Error("No active game session");
	return { player, temp: derivedState.tmp, disposed: false };
}

/** @param {GameIdentity} session */
function isCurrentGameSession(session) {
	return isLive() && !session.disposed && session.player === saveState.player && session.temp === derivedState.tmp;
}

// Wall timestamps are milliseconds; the persisted offline bank is seconds.
// Keep a high-water mark so a backwards clock cannot credit a period twice.
/** @param {{time:number}} state @param {number} nowMs @returns {ElapsedSeconds} */
function observeGameTime(state, nowMs) {
	if (!Number.isFinite(nowMs)) throw new Error("Invalid runtime clock");
	let elapsedSeconds = Math.max((nowMs - state.time) / 1000, 0);
	state.time = Math.max(state.time, nowMs);
	return elapsedSeconds;
}

/** @param {Pick<GameState,'offlineProd'|'offTime'>} state @param {ElapsedSeconds} elapsedSeconds @param {number} offlineLimitHours */
function bankOfflineTime(state, elapsedSeconds, offlineLimitHours) {
	if (!state.offlineProd) { state.offTime = null; return; }
	let bankSeconds = state.offTime ? state.offTime.remain : 0;
	state.offTime = { remain: Math.min(Math.max(bankSeconds, 0) + elapsedSeconds, offlineLimitHours * 3600) };
}

/** @param {Pick<GameState,'offlineProd'|'offTime'>} state @param {ElapsedSeconds} elapsedSeconds @param {number} offlineLimitHours @returns {ElapsedSeconds} */
function budgetGameTime(state, elapsedSeconds, offlineLimitHours) {
	if (!state.offlineProd) state.offTime = null;
	if (state.offTime !== undefined && state.offTime !== null) {
		state.offTime.remain = Math.min(Math.max(state.offTime.remain, 0), offlineLimitHours * 3600);
		if (state.offTime.remain > 0) {
			let offlineSeconds = Math.min(state.offTime.remain, Math.max(state.offTime.remain / 10, elapsedSeconds));
			state.offTime.remain -= offlineSeconds;
			elapsedSeconds += offlineSeconds;
		}
		if (state.offTime.remain <= 0) state.offTime = null;
	}
	return elapsedSeconds;
}

/** Owns callbacks and resources. stop is restartable; error/dispose are terminal.
 * Ports perform effects; generation checks also fence callbacks already queued
 * by a scheduler/event target before cancellation. start accounts for stopped
 * time once, then ticks observe only periods beyond that timestamp.
 */
/** @param {RuntimePorts} ports @returns {RuntimeHandle} */
function createGameRuntime({ session, clock, scheduler, listeners = [], resume, tick, autosave, refresh, onError, onStop = () => {} }) {
	if (!isLive()) throw new Error("Disposed game session");
	if (disposingAll) throw new Error("Runtime disposal in progress");
	/** @type {RuntimeState} */
	let state = "stopped";
	let generation = 0;
	let busy = false;
	/** @type {unknown[]} */ let timers = [];
	/** @type {Array<[RuntimeEventTarget,string,Function]>} */ let bindings = [];
	/** @type {unknown} */ let failure;

	function cleanup() {
		generation++;
		for (let id of timers) scheduler.clearInterval(id);
		for (let [target, type, callback] of bindings) target.removeEventListener(type, callback);
		timers = [];
		bindings = [];
		onStop();
	}

	/** @param {unknown} error */
	function fault(error) {
		failure = error;
		state = "error";
		cleanup();
		// Protection is established before reporting; reporting cannot revive work.
		try { onError(error); } catch (reportError) { /* Recovery remains reload-only. */ }
	}

	/** @param {Function} callback @param {number} token @returns {(...args:unknown[])=>void} */
	function guarded(callback, token) {
		return function(...args) {
			if (state !== "running" || token !== generation || busy) return;
			if (!runtimeServices.isCurrentGameSession(session)) { runtime.dispose(); return; }
			busy = true;
			try { callback(...args); }
			catch (error) { fault(error); }
			finally { busy = false; }
		};
	}

	const runtime = {
		get state() { return state; },
		get error() { return failure; },
		session,
		start() {
			if (state === "running") return true;
			if (state !== "stopped" || !runtimeServices.isCurrentGameSession(session)) return false;
			state = "running";
			let token = ++generation;
			try {
				resume(clock.now());
				/** @type {Array<[()=>void,number]>} */
				const callbacks = [[() => tick(clock.now()), 50], [refresh, 500], [autosave, 5000]];
				for (let [callback, milliseconds] of callbacks) {
					timers.push(scheduler.setInterval(guarded(callback, token), milliseconds));
				}
				for (let [target, type, callback] of listeners) {
					let bound = guarded(callback, token);
					bindings.push([target, type, bound]);
					target.addEventListener(type, bound);
				}
			} catch (error) { fault(error); }
			return state === "running";
		},
		stop() {
			if (state !== "running") return;
			state = "stopped";
			cleanup();
		},
		dispose() {
			if (state === "disposed") return;
			state = "disposed";
			session.disposed = true;
			ownedRuntimes.delete(runtime);
			cleanup();
		},
	};
	ownedRuntimes.add(runtime);
	return runtime;
}

/** @param {unknown} error */
function reportRuntimeFault(error) {
	gameRules.tickFaulted = true;
	gameRules.ticking = false;
	let message = "The game could not finish a tick. Progression and saving are paused to protect your saved progress. Reload the page to recover your last save.";
	saveCommands.reportSaveStatus("error", message);
	effects.alert?.(message);
}

// Browser composition is explicit and called only after successful load.
function startGameRuntime() {
	if (!isLive()) return false;
	if (gameRules.tickFaulted) return false;
	if (gameRuntime && runtimeServices.isCurrentGameSession(gameRuntime.session)) return gameRuntime.start();
	if (gameRuntime) gameRuntime.dispose();
	const { Date: clock, setInterval: schedule, clearInterval: cancel, document: documentPort, window: windowPort } = effects;
	if (!clock || !schedule || !cancel || !documentPort || !windowPort) throw new Error("Runtime requires explicit clock, scheduler and listener ports");
	let session = runtimeServices.captureGameIdentity();
	/** @param {{persisted?:boolean}} event */
	function pagehide(event) { if (!event.persisted) gameRuntime?.dispose(); }
	gameRuntime = runtimeServices.createGameRuntime({
		session,
		clock: { now: () => clock.now() },
		scheduler: { setInterval: (callback, ms) => schedule.call(effects, callback, ms), clearInterval: id => cancel.call(effects, id) },
		resume: now => runtimeServices.bankOfflineTime(session.player, runtimeServices.observeGameTime(session.player, now), modRules.modInfo.offlineLimit),
		tick: now => {
			if (gameRules.gameEnded && !session.player.keepGoing) return;
			let elapsedSeconds = runtimeServices.budgetGameTime(session.player, runtimeServices.observeGameTime(session.player, now), modRules.modInfo.offlineLimit);
			if (gameRules.needCanvasUpdate) treeCanvas.resizeCanvas();
			gameRules.advanceGame(session, elapsedSeconds);
		},
		refresh: () => { gameRules.needCanvasUpdate = true; },
		autosave: () => { if ((!gameRules.gameEnded || session.player.keepGoing) && session.player.autosave) saveCommands.save(); },
		listeners: [[documentPort, "keydown", gameHelpers.gameKeyDown], [documentPort, "keyup", gameHelpers.gameKeyUp],
			[windowPort, "resize", treeCanvas.resizeCanvas], [windowPort, "wheel", treeCanvas.resizeCanvas],
			[windowPort, "pagehide", pagehide]],
		onStop: () => {
			gameHelpers.minusHeld = false;
			if (!session.player.tapNerd) session.temp.nerdMode = false;
		},
		onError: runtimeServices.reportRuntimeFault,
	});
	return gameRuntime.start();
}


const runtimeServices = {
 disposeAll,
 get gameRuntime() { return gameRuntime; },
 /** @param {ReturnType<typeof createGameRuntime>|undefined} value */
 set gameRuntime(value) { gameRuntime = value; },
 captureGameIdentity,
 isCurrentGameSession,
 observeGameTime,
 bankOfflineTime,
 budgetGameTime,
 createGameRuntime,
 reportRuntimeFault,
 startGameRuntime,
};
return runtimeServices;
}
