# Developing Civ Prestige Tree

Start at [README](../README.md), [AGENTS](../AGENTS.md) and [the design](civilization.md). The owner authorized this content replacement from `main` initially at `0098433b8a18dedbabca8605d96cd40f3e995371`, reconciled with published `d7d260fa66b270aae228dec2183f4df9da508b5f` and its source correction to `main`. No registry, permission, native milestone acceptance or deployment change follows.

## Run and verify

Use Node 24.22.1, npm 11.19.1, Vue 3.5.46 and the locked development dependencies. From this isolated worktree root:

```powershell
npm ci
npm run dev
```

`dev` is a foreground Windows/macOS command using Node 24's native [`--watch-path`](https://nodejs.org/download/release/v24.22.1/docs/api/cli.html#--watch-path). `scripts/dev.cjs` derives its watch paths from the build's `assets`; `scripts/dev-server.cjs` builds before starting the existing loopback server. HTML, nested JavaScript, CSS, licenses, package manifests and build/server tooling trigger a restart and rebuild. `dist/`, `node_modules/` and runtime outputs are excluded to prevent rebuild loops. Refresh the browser after a successful rebuild; there is no automatic browser reload. Build errors remain visible and do not start a server with partial output; fixing a watched input lets watch mode retry. Stop the watcher and server with Ctrl+C.

The server exposes the exact generated `dist/` bytes on `http://127.0.0.1:8000/`. For a one-time build and preview (also usable on Linux), run `npm run build` then `npm run serve`. Dependencies install through npm; the built game needs no CDN or remote fonts. `dist/`, `node_modules/`, `rule-results.xml`, `playwright-report/` and `test-results/` are generated or local and ignored. Never hand-edit them.

Verify dev command configuration and build-before-serve ordering without starting a server or filesystem watcher: `node --test tests/rules/dev-command.test.cjs`. These checks inject an inert server; they do not claim a live watch/restart exercise.

## Owning modules

| Behavior | Entry and owner | Focused check |
| --- | --- | --- |
| Production, upkeep, shared labor, growth, construction, prestige and investments | `js/civilization.js` -> `createCivilizationRules` | `node --test tests/rules/civilization.test.cjs` |
| Resource registration and defaults | `js/layers/manifest.js` -> `js/layers/resources.js`; one Food update advances the whole economy | Same economy suite |
| Mod identity and hooks | `js/mod.js` -> `createModRules` | `node --test tests/rules/civ-saves.test.cjs` |
| Browser composition | `index.html` -> `gameUI.commands.load()` in `js/browser-entry.js` -> `js/saves.js` | `npx playwright test` |
| Player and session ownership | `js/game-session.js` -> `createSaveState`, `createGameSession` | `node --test tests/rules/civ-runtime.test.cjs` |
| Deterministic advancement | `advanceGame(session,seconds)` -> `js/game.js` -> Food layer update -> civilization rules | Economy/runtime suites |
| Saved defaults, validation and hydration | `js/save-codec.js` -> content validation in `civilization.validateData` | Save suite |
| Atomic persistence and recovery | `js/saves.js` -> `js/save-storage.js`; only storage adapter reads/writes | Save suite and Chromium recovery journey |
| Clock, offline bank, timers and disposal | `js/game-runtime.js` | Runtime suite |
| Rendered view and controls | `index.html`, `js/components.js`; unchanged `style.css` / `interface.css` with `civ.css` layout adaptations | `npx playwright test tests/browser/civilization.spec.cjs` |
| Static build and package identity | `scripts/build.cjs`, `scripts/check-package.cjs` | `npm run build` then `npm run test:package` |

For the opening economy: `resourceAvailable()` in `js/civilization.js` limits discovery and paid upgrades to the five current resources. Money/Time generation and their automatic unlock are removed. Hidden tabs cannot be selected. The same owner migrates pre-0.6 discovery flags and retired home-improvement construction at codec ingress while preserving stored balances. `tests/rules/opening-economy.test.cjs` covers all-person labor, fixed basket costs, denied purchases and save preservation.

For a Food buyable change: follow `README` -> this table -> `projects()` / `canStartProject()` / `startProject()` -> `actionDefinition()` in `js/civilization.js`. This owner checks requirements and upfront Craft payment; `node()` derives button eligibility. Saved route IDs stay stable. `tests/rules/food-buyables.test.cjs` covers multi-level rounding, rejected starts, trip snapshots and saves. `index.html` renders the same costs and availability.

For Water storage: `projects("water")` -> `canStartProject()` -> `startProject()` defines Craft earthenware jars at 1 Craft plus scaling work. `water-storage` and `player.water.storage` stay stable across saves and prestige. The Water-storage records milestone at 4 retains that same ID. `tests/rules/opening-economy.test.cjs` verifies repeated costs, work timing and saved construction; the [research guide](research/reference-guide.md#water-storage-materials) owns the naming rationale.

For Shared hearths: `buyUpgrade("hearth")` -> `hearthBenefits()` in `js/civilization.js` derives settlement-wide bonuses from current Population. `storageCapacity()` adds storage; `supply().passiveProduction` feeds both the ledger and actual `step()` production before upkeep. `index.html` shows live benefits in Food and Shelter. `node --test tests/rules/shared-hearths.test.cjs` covers thresholds, payment, delivery, shortages, prestige and codec/chunk parity. The balance suite reaches ten/twenty people through legal play; the browser journey buys with keyboard input and checks Food income and responsive views. No persisted bonus counter or schema migration is needed.

For repeat jobs: `setRepeat(id, jobs)` and `setHutRepeat(jobs)` set remaining-use counters (0 to `repeatCap`, five per assigned overseer). `automaticOrders()` calls a single-job `dispatch()` / `startProject()` and decrements only when it succeeds; blocked starts do not charge. `occupiedWorkers()` owns queue-manager reservations and active crews. Zero stops automatic starts, while saved active snapshots finish normally. The general auto-builder excludes huts. `node --test tests/rules/work-orders.test.cjs` covers exact five-use exhaustion, busy/full/unstaffed starts, clearing/reload/chunk parity, retained snapshots and the removed Craft production bonus. Native sliders call these owners through `js/components.js`.

For Organization requirements: `organizationPopulationRequirement()` -> `prestigeGain()` -> `prestigePreview()` supplies `8 + 4 * held Organization` to the node, confirmation and command. `organizationMilestones()` uses that same held balance. The regression route is `tests/rules/current-coordination.test.cjs` -> real upgrade spending -> lowered requirement/current gates -> paused orders and paid work -> codec round trip, plus the Chromium spending/reload journey. Current `organization.points` controls eligibility; lifetime `organization.total` only supplies statistics. New starts and UI controls share those decisions.

For a Water change: follow `README` -> this table -> `actionDefinition()`, `dispatch()`, `advanceActions()` and `step()` in `js/civilization.js`. The same owner defines Water upgrades and irrigation. Identify the canonical saved action record, advance it through the registered Food update, then inspect the Water panel in `index.html`. Copy the nearby hauling/flow regression from the economy suite. Avoid maintaining a second UI copy of persistent state.

For MS1-3: follow `organizationRewards` -> `featureAvailable` / `upgradeRequirement` -> `projects` / `actionDefinition` / `buyUpgrade` in `js/civilization.js`. `setOverseers(kind,workers)` owns separate staffing, affordability and queue-preserving reductions; `setExpeditionMultiplier(id,factor)` owns 1-5x next-dispatch contracts. `preparedHut` snapshots automatic construction's work discount. `index.html` and `js/components.js` bind those owners directly. Copy `tests/rules/early-milestones.test.cjs` and the Organization-controls Chromium journey for boundary, snapshots, staffing, cap and reload coverage.

For upgrade unlocks: follow organizationRewards -> upgradeRequirement() -> upgrades() / buyUpgrade() in js/civilization.js. Fresh settlements have no initial upgrades. Milestones 1/2 reveal three upgrades costing 1/2/3 Craft; milestone 3 reveals three costing 1/2/3 Organization. The same current-balance milestones gate visibility and affordability; locked upgrades reject even fully funded direct calls. The organization-progression rule suite owns these boundaries and all ten exact retention thresholds.

For prestige retention: follow `organizationRewards` -> `organizationMilestones()` (current `organization.points`) -> `prestigePreview()` -> `prestige()`. The node panel and native confirmation consume that same plan. Retention keys are exact buyable/project IDs. The economy suite covers exact earning thresholds, spending, the five-person restart, seeded supplies, crew safety and protected/unprotected construction; the browser suite exercises preview, cancellation, confirmation and earned milestone display.

For abundance: `buyUpgrade("abundance")` at Organization 5 (free, Shelter) -> `growthSettings` -> `abundanceCurve()` / `growthAbundance()` -> `supply().abundance` -> `advanceGrowth()` is the shared simulation/UI path. The component ranges, weights and exponents are source settings; the UI derives their live contributions. `tests/rules/abundance-growth.test.cjs` covers boundaries, independence, a source-only 28x tuning experiment, paused growth and chunk/save parity. The legal starvation/repeat-order recovery scenario lives in the balance suite. See [the curve contract](civilization.md#abundance-growth-curves).

For survival: follow shortageStatus() -> advanceShortage() -> releaseUnavailableWorkers() in js/civilization.js and the focused survival rule suite. It checks deadlines, accelerating loss, recovery, upgrade effects, solo-survivor play, Overseer/foreman reservations, prestige eligibility/restarts, migration and chunk parity. Shortage state belongs to player.civ; the UI derives its warning from the same calculation.

## State and simulation contracts

Population is `player.points` (Decimal). Food, Water, Shelter and the other resource layers have session-owned player records. The reserved Time resource uses the internal ID `freeTime`: root `player.time` remains the runtime clock timestamp. No population or food/water global exists.

`player.civ` owns next-person progress, subsecond simulation remainder, action contracts and repeat orders, purchased improvements, irrigation, active construction and repeat priority. `player.food.routes` owns independent equipment levels; `player.shelter.comfort` preserves historical purchased counts without an active labor effect. `occupiedWorkers()` derives reserved crews, Overseer, foreman, builders and available whole workers; there is no domestic reservation. `summary()` derives the UI from that canonical state. The UI owns only disclosure state; save commands own collection replacement and browser effects.

All economic rates use game minutes; the runtime passes seconds. The economy persists a subsecond remainder and advances in one-second steps, reevaluating consumption, population support and construction each time. This avoids skipping growth limits during offline advancement. The existing capped offline bank and driver lifecycle are retained. Headless sessions start no timers or browser I/O.

## Game-time balance tests

Build balance coverage alongside each content change. [Balance workflow](balance-testing.md#add-balance-coverage-with-content) owns the procedure. The retained runner uses the actual session and codec. Civ-specific sections, legal policies and bounded coarse scheduling live under `scripts/balance/`. Run `npm run test:balance` for loader parity, active/regular completion, cadence, calibration and isolation. Run `npm run balance -- --hours 4 --calibrate-minutes 60` for a source-hashed report in ignored `balance-results/`. No target duration is accepted yet; synthetic observations are not human pacing or future campaign estimates.

## Save boundaries and recovery

The new game has the distinct mod/storage identity `civ-prestige-tree`; it never reads, migrates, overwrites or clears the prior game's `ptr` value. Those old resources have no meaningful conversion to this new economy. An old save may still be used with the prior game artifact. There is one current Civ runtime and one current Civ save model, without a legacy game mode.

The retained codec hydrates detached Decimals and checks references/types. Version 0.8 calls `civilization.migrateData` on the detached raw candidate before typed hydration, then `validateData` checks current targets, batch counts, manager/building crews and total commitments. v0.6 and v0.7 fixtures from actual historical codecs exercise startup and reload. Retired Fishing nets/Well lining flags are validated and removed; old Water keeper ownership maps to Hut foreman; old Food repeat Booleans map to 0/1. Existing job snapshots and stored values survive; orders pause if their new dedicated Overseer would overbook. New hut orders start off. Earlier 0.6 retirement/default migrations remain. Startup/import failures preserve original bytes and prior live state; storage denial preserves durable data and reports unsaved progress. Tick/Vue faults block writes until reload.

## Final checks and delivery

`npm test` builds before package/syntax/static/sensitivity/rule/browser checks. Chromium tests use fresh contexts, exact package bytes and no external requests; they never read an existing browser profile. Static sensitivity requires the actual compiler to reject invalid boundary calls; gameplay sensitivity mutates the real prestige code in memory to ensure a missing Population reset is detected.

The replaced game-specific tests intentionally no longer compare Civ formulas with old Prestige Tree formulas. Their safety contracts are exercised against the shipped Civ game instead. Earlier milestone verification remains historical evidence for its own immutable revisions.

Publish this dedicated branch as an unmerged draft PR to the owner-selected `main`; never merge or deploy automatically. Rollback is the previous source/package artifact. Since Civ has its own storage identity, rollback does not require modifying either game's saved data. Preserve both upstream licenses and in-game credits.
