# Remove fishing delivery evidence

Requested outcome: remove fishing from Prestige Tree. The owner's follow-up selected cancellation of fishing trips and removal of river traps **without compensation**. Source: `step3software/Prestige-Tree` main `280caf5edf6f20c9d5a30eda1b6c77c13b0de710`. Work branch: `codex/remove-fishing`, dedicated worktree with verified installed writer fence 2737. The open Energy PR #19 remains separate; this change has no dependency on it. No milestone enrollment, merge, deployment or service activation is included.

## Behavior and review

Food supports Gather, Hunt and Farm. Fish dispatch/recall/repeat/expedition commands and river-trap construction are unavailable. Fresh defaults and the current save schema contain no fishing records. Organization 9 retains its irrigation unlock and no longer promises river-trap retention; other milestones keep their existing rewards and thresholds. The Food panel and construction note derive/display only remaining activities and equipment.

Version 0.9.2 (save version 0.92) validates and removes retired fishing fields at detached codec ingress. Fishing trips, remaining repeats and river-trap work are cancelled; completed trap levels, discovery and expedition factors are removed. There is no Food credit or Craft refund. Unrelated balances, Population, housing, upgrades, milestones, active trips and paid construction remain intact. Worker availability derives from the remaining records, so no separate worker refund can double-count labor. A migration event explains the cancellation. Current-version fishing records are rejected; no parallel runtime or compatibility mode remains.

| Expectation / governing requirement | Implementation and verification evidence | Result |
| --- | --- | --- |
| F1: remove fishing and its equipment (owner request) | `actionBase`, project definitions, defaults, order priority, resource route defaults, milestone 9, current schema and `index.html`; command-rejection and rendered absence tests | Passed source, rules and Chromium checks |
| F2: cancel without compensation, release workers, preserve other progress (owner answer; local labor/save contracts) | `migrateData` -> detached codec -> `validateData` -> session activation. Actual v0.91 codec fixture checks unchanged stocks and Gather snapshot, released crew/builder/Overseer, unrelated paid construction and canonical round trips | Passed rules and browser startup/import/reload |
| F3: malformed data remains recoverable (no-legacy-modes; local recovery contract) | Validate retired discovery, levels, factors, action snapshots, original crew commitments and trap construction before deletion. Invalid ingress retains original input/live state; browser recovery preserves stored bytes | Passed malformed-input and recovery cases |
| F4: remaining progression and labor still work (local economy/balance contract) | Remaining-route crew, repeat, shortage, prestige, retention and pacing regressions. Survival fixture now uses a longer Gather trip with Hunt to preserve the original manager-release scenario | Passed rule/balance checks |
| RC-01/05/06/08: discoverable ownership and bounded implementation | README -> developer guide -> `migrateData` in `js/civilization.js` -> existing codec -> `tests/rules/remove-fishing.test.cjs` and `tests/browser/remove-fishing.spec.cjs`. Existing action/schema/UI owners are reused | Source trace inspected |
| RC-02/03/04/07: understandable state, guards and meaningful proof | Canonical route/action maps, explicit migration boundary, typed hydration and validation; tests exercise real session commands, invalid input, defaults, round trips and UI | Passed static/rule/rendered checks |
| Current standards and isolated publication | Current Orcha main resolved through GitHub, immutable resolver bytes verify catalog hashes; effective local instructions and source checked. Owned dedicated writer claim verified | Verified; exact hashes in companion JSON |

Inspection covers all changed paths: `js/civilization.js`, `js/layers/resources.js`, `js/mod.js`, `index.html`, `scripts/balance/policy.cjs`; README, design, developer and balance guides; affected economy, save, work-order, opening, Food equipment, milestone, coordination, survival, materials, hearth and Timber frames rule tests; the affected civilization browser tests; and the new migration rules/browser tests and fixture. Historical fixture bytes and prior verification records remain evidence of their own revisions. The removed trap purchase regression is superseded by explicit removal/migration cases; shared crew, paid-construction and purchase assertions now use remaining activities. The Organization boundary still uses seven people, immediately below its eight-person threshold.

Unchanged consumers traced: browser entry and component command bindings, `node().actions`/project iteration, the Food-owned economy update, session-owned defaults, save-codec candidate copy/hydration/version update, storage collection encoding and session replacement. Generated package consistency is mechanically checked. No lockfile/dependency, license, stylesheet, engine codec or runtime-clock changes are needed. No TypeScript/React supplement applies to this JavaScript/Vue change.

## Verification

Build, package identity, actual Vue-template compilation, syntax, lexical/type boundaries, negative static sensitivity and real prestige mutation sensitivity passed. The full rule run passed 165/166 cases; its only failure was the 15-second wall-budget limit in the three-policy opening test while Chromium was running. That exact test passed in isolation without changing its budget. Six focused migration cases also pass, including the current-default case added after the full run: **167 unique rule/save/runtime/balance cases passed across the full and focused runs**.

The initial Chromium run passed 33/36 journeys. The three failures were test fixtures: a retired trap-button expectation, reading the save collection as a player, and importing a timestamp-zero simulation fixture with offline advancement enabled. The tests now use Food baskets, the selected collection entry, and a current timestamp with offline advancement disabled. All three passed on focused rerun. The retained Organization boundary is included in final verification. **36 unique Chromium journeys passed**, including the three new fishing startup/import/recovery journeys. Desktop and 320px screenshots were visually inspected; reflow, native commands, selected-player save/reload, original `ptr` isolation and recovery were exercised. Actual-user usability, assistive technology certification and browsers other than Chromium were not measured.

Reproduction from the worktree root:

```powershell
npm ci
npm test
node --test tests/rules/remove-fishing.test.cjs
node --test --test-name-pattern='both active branch orders' tests/rules/balance-simulation.test.cjs
```

Local browser runs used the same config/package on isolated loopback port 4187 because another process occupied 4173. The ignored temporary config changes only server port, root paths and output location; CI retains the standard config. Browser execution required the host's normal loopback/process permissions. Initial npm installation needed network access. Neither condition required changing source permissions or activating services.

The legal-play observations remain synthetic, with no accepted pacing target: active-balanced and active-organization complete the opening at 7870 simulated seconds; regular completes at 8210. All ten Organization checkpoints and earned automation are required by the isolated passing test. The remaining Food equipment scenario reaches exploration, bigger-game and farming equipment through legal commands at 7905s active / 8340s regular. Other existing balance cases cover rough/fixed parity, finite queues and shortages. These are automated policy results, not human pacing claims.

The historical fixture was emitted by the actual v0.91 engine/codec at `323e5a310da5005f77737ef9fc95932c1f71275e`. It grants a constructed 12-person settlement, 9 Organization, Crafting, Extended expeditions and two river-trap levels, then dispatches Gather/Fish, queues three fishing repeats, pays for trap construction and advances two seconds. It tests migration rather than legal prefix reachability. The fixture contains synthetic game data only. Keep an original exported save with its older package if returning to fishing is desired; current saves deliberately have no reverse migration.

## Authority and evidence

Orcha main was resolved and rechecked at `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`. The project's effective AGENTS and developer guide explicitly select main and document its prior owner source correction; these govern over the retained registry/manifest `master` values. The remote has no master branch. This discrepancy is recorded, not silently hidden or repaired in unrelated authority files. Project main was rechecked at the unchanged source revision above.

The companion [evidence JSON](remove-fishing.evidence.json) records exact governing document hashes, fixture/source hashes and local validation-log digests. Hashes refer to immutable repository bytes at the recorded revisions. The standards resolver was executed from that exact Orcha revision and verified the selected feature/review catalogs. No confirmed source finding remains in this bounded author review. Provider CI is separate delivery evidence; publication does not accept or deploy the change.
