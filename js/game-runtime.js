// One script context still owns one active engine session. DEV01 owns migrating
// the rule globals; this identity-bound context prevents old owners using them.
var gameRuntime;

function createGameSession() {
	return { player, temp: tmp, disposed: false };
}

function isCurrentGameSession(session) {
	return !session.disposed && session.player === player && session.temp === tmp;
}

// Wall timestamps are milliseconds; the persisted offline bank is seconds.
// Keep a high-water mark so a backwards clock cannot credit a period twice.
function observeGameTime(state, nowMs) {
	if (!Number.isFinite(nowMs)) throw new Error("Invalid runtime clock");
	let elapsedSeconds = Math.max((nowMs - state.time) / 1000, 0);
	state.time = Math.max(state.time, nowMs);
	return elapsedSeconds;
}

function bankOfflineTime(state, elapsedSeconds, offlineLimitHours) {
	if (!state.offlineProd) { state.offTime = null; return; }
	let bankSeconds = state.offTime ? state.offTime.remain : 0;
	state.offTime = { remain: Math.min(Math.max(bankSeconds, 0) + elapsedSeconds, offlineLimitHours * 3600) };
}

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
function createGameRuntime({ session, clock, scheduler, listeners = [], resume, tick, autosave, refresh, onError, onStop = () => {} }) {
	let state = "stopped";
	let generation = 0;
	let busy = false;
	let timers = [];
	let bindings = [];
	let failure;

	function cleanup() {
		generation++;
		for (let id of timers) scheduler.clearInterval(id);
		for (let [target, type, callback] of bindings) target.removeEventListener(type, callback);
		timers = [];
		bindings = [];
		onStop();
	}

	function fault(error) {
		failure = error;
		state = "error";
		cleanup();
		// Protection is established before reporting; reporting cannot revive work.
		try { onError(error); } catch (reportError) { /* Recovery remains reload-only. */ }
	}

	function guarded(callback, token) {
		return function(...args) {
			if (state !== "running" || token !== generation || busy) return;
			if (!isCurrentGameSession(session)) { runtime.dispose(); return; }
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
			if (state !== "stopped" || !isCurrentGameSession(session)) return false;
			state = "running";
			let token = ++generation;
			// Injected ports may synchronously stop, dispose, restart or replace us.
			function ownsStart() {
				if (state !== "running" || token !== generation) return false;
				if (!isCurrentGameSession(session)) { runtime.dispose(); return false; }
				return true;
			}
			try {
				const now = clock.now();
				if (!ownsStart()) return false;
				resume(now);
				if (!ownsStart()) return false;
				for (let [callback, milliseconds] of [[() => tick(clock.now()), 50], [refresh, 500], [autosave, 5000]]) {
					const id = scheduler.setInterval(guarded(callback, token), milliseconds);
					if (!ownsStart()) { scheduler.clearInterval(id); return false; }
					timers.push(id);
				}
				for (let [target, type, callback] of listeners) {
					let bound = guarded(callback, token);
					bindings.push([target, type, bound]);
					target.addEventListener(type, bound);
					if (!ownsStart()) { target.removeEventListener(type, bound); return false; }
				}
			} catch (error) { fault(error); }
			return ownsStart();
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
			cleanup();
		},
	};
	return runtime;
}

function reportRuntimeFault(error) {
	tickFaulted = true;
	ticking = false;
	let message = "The game could not finish a tick. Progression and saving are paused to protect your saved progress. Reload the page to recover your last save.";
	reportSaveStatus("error", message);
	alert(message);
}

// Browser composition is explicit and called only after successful load.
function startGameRuntime() {
	if (tickFaulted) return false;
	if (gameRuntime && isCurrentGameSession(gameRuntime.session)) return gameRuntime.start();
	if (gameRuntime) gameRuntime.dispose();
	let session = createGameSession();
	gameRuntime = createGameRuntime({
		session,
		clock: { now: () => Date.now() },
		scheduler: { setInterval: (callback, ms) => setInterval(callback, ms), clearInterval: id => clearInterval(id) },
		resume: now => bankOfflineTime(player, observeGameTime(player, now), modInfo.offlineLimit),
		tick: now => {
			if (gameEnded && !player.keepGoing) return;
			let elapsedSeconds = budgetGameTime(player, observeGameTime(player, now), modInfo.offlineLimit);
			if (needCanvasUpdate) resizeCanvas();
			advanceGame(session, elapsedSeconds);
		},
		refresh: () => { needCanvasUpdate = true; },
		autosave: () => { if ((!gameEnded || player.keepGoing) && player.autosave) save(); },
		listeners: [[document, "keydown", gameKeyDown], [document, "keyup", gameKeyUp],
			[window, "resize", resizeCanvas], [window, "wheel", resizeCanvas],
			[window, "pagehide", event => { if (!event.persisted) gameRuntime.dispose(); }]],
		onStop: () => {
			minusHeld = false;
			if (!session.player.tapNerd) session.temp.nerdMode = false;
		},
		onError: reportRuntimeFault,
	});
	return gameRuntime.start();
}
