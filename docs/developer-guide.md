# Developing Civ Prestige Tree

Start at [README](../README.md), [AGENTS](../AGENTS.md) and [the design](civilization.md). The owner authorized this content replacement from `main` initially at `0098433b8a18dedbabca8605d96cd40f3e995371`, reconciled with published `d7d260fa66b270aae228dec2183f4df9da508b5f` and its source correction to `main`. No registry, permission, native milestone acceptance or deployment change follows.

## Run and verify

Use Node 24.22.1, npm 11.19.1, Vue 3.5.46 and the locked development dependencies. From this isolated worktree root:

```powershell
npm ci
npm run build
npm run serve
```

The server exposes the exact generated `dist/` bytes on `http://127.0.0.1:8000/`. Stop it with Ctrl+C. Dependencies install through npm; the built game needs no CDN or remote fonts. `dist/`, `node_modules/`, `rule-results.xml`, `playwright-report/` and `test-results/` are generated or local and ignored. Never hand-edit them.

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
| Rendered view and controls | `index.html`, `js/components.js`, `civ.css` | `npx playwright test tests/browser/civilization.spec.cjs` |
| Static build and package identity | `scripts/build.cjs`, `scripts/check-package.cjs` | `npm run build` then `npm run test:package` |

For a Water change: follow `README` -> this table -> `supply()` and `projects()` in `js/civilization.js`; identify the one canonical player record, advance it through the actual registered Food update, then inspect the Water panel in `index.html`. Copy a nearby boundary case from the economy suite. Avoid maintaining a second UI copy of persistent state.

## State and simulation contracts

Population is `player.points` (Decimal). Food, Water, Shelter and the other resource layers have session-owned player records. The visible Time resource uses the internal ID `freeTime`: root `player.time` remains the runtime clock timestamp. No population or food/water global exists.

`player.civ` owns next-person progress, subsecond simulation remainder, active construction and work priority. `summary()` derives supply, labor allocation and UI descriptions from canonical state. The UI owns only disclosure state; save commands own collection replacement and browser effects.

All economic rates use game minutes; the runtime passes seconds. The economy persists a subsecond remainder and advances in one-second steps, reevaluating consumption, population support and construction each time. This avoids skipping growth limits during offline advancement. The existing capped offline bank and driver lifecycle are retained. Headless sessions start no timers or browser I/O.

## Game-time balance tests

Build balance coverage alongside each content change. [Balance workflow](balance-testing.md#add-balance-coverage-with-content) owns the procedure. The retained runner uses the actual session and codec. Civ-specific sections, legal policies and bounded coarse scheduling live under `scripts/balance/`. Run `npm run test:balance` for loader parity, active/regular completion, cadence, calibration and isolation. Run `npm run balance -- --hours 4 --calibrate-minutes 60` for a source-hashed report in ignored `balance-results/`. No target duration is accepted yet; synthetic observations are not human pacing or future campaign estimates.

## Save boundaries and recovery

The new game has the distinct mod/storage identity `civ-prestige-tree`; it never reads, migrates, overwrites or clears the prior game's `ptr` value. Those old resources have no meaningful conversion to this new economy. An old save may still be used with the prior game artifact. There is one current Civ runtime and one current Civ save model, without a legacy game mode.

The retained codec hydrates detached Decimals and checks references and types. `civilization.validateData` additionally checks Population counts, nonnegative resources, housing consistency and recognized construction/priority state. Foreign game imports fail before activation. Startup errors expose original bytes when readable and start no game runtime. Storage write denial keeps the previous durable bytes and reports unsaved progress; retry saving after storage recovers. Tick or Vue faults stop drivers and block all save writes until reload.

## Final checks and delivery

`npm test` builds before package/syntax/static/sensitivity/rule/browser checks. Chromium tests use fresh contexts, exact package bytes and no external requests; they never read an existing browser profile. Static sensitivity requires the actual compiler to reject invalid boundary calls; gameplay sensitivity mutates the real prestige code in memory to ensure Population loss is detected.

The replaced game-specific tests intentionally no longer compare Civ formulas with old Prestige Tree formulas. Their safety contracts are exercised against the shipped Civ game instead. Earlier milestone verification remains historical evidence for its own immutable revisions.

Publish this dedicated branch as an unmerged draft PR to the owner-selected `main`; never merge or deploy automatically. Rollback is the previous source/package artifact. Since Civ has its own storage identity, rollback does not require modifying either game's saved data. Preserve both upstream licenses and in-game credits.
