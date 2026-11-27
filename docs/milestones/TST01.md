# TST01 — Repeatable game regression testing

**Repository:** `step3software/Prestige-Tree`; project source `master`.
**Source status:** Proposed milestone specification with a structured planning
artifact; no runtime enrollment, preparation or implementation authority recorded.
**Owner origin:** Codex chat `01a21b20-b179-7f43-ba61-534a9ca8c7a3`,
2026-11-26: “Write a milestone to implement testing.”
**Baseline:** `077861d2d4479d77e6079fd5c8bdf5e4fe7821f8`.
**Companion:** [Structured plan](TST01.plan.json).

## Objective

A developer can change a game rule or save operation, run a documented local
command and obtain repeatable evidence that core progression and save safety
still work. Pull requests run the same checks automatically and expose failures.
Players retain valid progress when import fails or a save-name prompt is cancelled.

## Baseline and provenance

The baseline has no package manifest, automated test runner or tracked CI workflow.
The game runs 13 JavaScript scripts from [index.html](../../index.html), sharing
globals across [game.js](../../js/game.js), [utils.js](../../js/utils.js),
[layers.js](../../js/layers.js) and the Vue UI. Files under `Old Code/` are historical
game code, not regression tests. The [development guide](../developer-guide.md)
owns current local commands and source navigation.

The preceding read-only review syntax-checked all 13 shipped scripts. A synthetic
runtime using the actual scripts, the shipped Decimal library, controlled timers
and in-memory storage passed fresh start → prestige → upgrade → tick → save/reload.
It reproduced these defects at the baseline:

- **F1:** Importing valid base64 JSON containing `versionType: "ptr", p: null`
  replaces the active player before validation; repair throws, the next tick fails
  and autosave can overwrite the previous save with invalid state (`utils.js:440`).
- **F2:** Offline accumulation uses seconds, while its hour cap uses a millisecond
  multiplier. With a one-hour setting and 7,200 seconds banked, 6,480 remain after
  the first tick (`game.js:400`, `utils.js:378`, `mod.js:9`).
- **F3:** Cancelling New Save throws on `null.replace`; Rename has the same
  unchecked prompt pattern (`utils.js:271`, `utils.js:309`).

These are baseline observations, not implemented tests or browser verification.
Reproduce them from committed fixtures; do not depend on the original chat or
external scratch files for implementation or acceptance.

## Scope

- Add a minimal package/lockfile, a pinned supported Node runtime, a Node test
  runner harness and explicit local test commands. Resolve exact supported
  versions during preparation; keep CI and local versions consistent.
- Load the actual shipped scripts in their real order, using controlled clock,
  timer, storage and browser adapters for focused game-rule tests. Assert outcomes
  through real game functions; do not reproduce game formulas in the test harness.
- Add isolated Playwright browser journeys against the actual game page served
  locally, including the browser-visible failure/recovery cases below.
- Add regression tests and bounded corrections for **F1–F3**, including preventing
  the invalid-import/timer/autosave chain. These named corrections support green
  regression coverage; they are explicitly part of this proposed milestone.
- Add a CI workflow for pull requests and pushes to `master`, invoking the same
  checks, with useful test reports and failure diagnostics. Update the existing
  development guide and README navigation to make those checks discoverable.
- Add only narrow seams needed for deterministic testing or the named repairs;
  preserve the `addLayer` registry, layer IDs, save key and Decimal semantics.

Excluded: wholesale layer/file restructuring, a new state framework, TypeScript
conversion, Vue migration, game balancing, new progression content, a broad
save-format migration, production deployment and unrelated bug fixes. CI branch
protection/ruleset changes, runner provisioning, paid services and purchases are
outside this milestone. Historical game “milestones” in `docs/milestones.md` stay
separate from delivery specifications in this directory.

## Acceptance criteria

- **TST01-AC01:** A clean checkout can install locked dependencies with `npm ci`
  and run documented syntax, rule-test and browser-test commands on Windows and
  the selected CI runner. Runtime/browser/dependency versions are pinned and
  setup prerequisites and expected exits are documented in the existing guide.
- **TST01-AC02:** Tests exercise the shipped Decimal implementation and game
  functions with a controllable clock, timers and isolated storage; each test gets
  fresh state. No test reads real browser saves, uses live user data, waits on real
  time for game progression, or leaves timers/servers/browser contexts running.
- **TST01-AC03:** Rule tests cover fresh initialization; first prestige and reset
  effects; locked, insufficient-funds, valid and repeated upgrade purchases;
  tick progression; and save/load plus export/import round-trips retaining
  representative large Decimal values, upgrades, milestones and multiple saves.
- **TST01-AC04:** Import tests cover invalid base64/JSON, invalid nested shapes,
  valid current-format saves, foreign-mod confirmation denial, cancellation and
  storage-write failure. Rejection preserves active and durable valid progress,
  reports a recoverable error and prevents invalid autosave. A failed tick cannot
  leave the runtime falsely marked as actively ticking; error handling must not
  silently resume unsafe mutations. Valid imports remain usable after reload.
- **TST01-AC05:** Clock tests cover no elapsed time, backwards clock movement,
  below/at/above the configured offline cap, offline production disabled and
  repeated catch-up ticks. All elapsed-time inputs use documented units. The
  one-hour case caps accumulated time at 3,600 seconds before consumption and
  does not grant excess or duplicate progression.
- **TST01-AC06:** Save-menu tests cover cancelling New Save and Rename, empty,
  reserved, duplicate and overlength names. Cancellation changes neither active
  selection nor save contents and throws no error; rejected names create no
  partial save. Valid creation, rename and selection persist after reload.
- **TST01-AC07:** Chromium journeys verify page startup without unexpected console
  errors; prestige → upgrade → progression; save/reload; successful and rejected
  import with retained progress and visible recovery feedback; and cancelled
  New Save/Rename. Browser assertions inspect rendered controls and durable state,
  rather than only calling global functions. Changed recovery feedback is readable
  and keyboard-operable. Other browser engines and full late-game balance remain
  explicitly unverified, rather than implied by a Chromium pass.
- **TST01-AC08:** CI runs syntax checks, rule tests and the required Chromium
  journeys with read-only repository permissions and no application secrets or
  deployment steps. A failing required test makes the job fail. Failures retain
  bounded reports/traces/screenshots with synthetic data. Tests use a pinned local
  Vue asset matching the shipped version and avoid CDN availability as a test
  dependency; this does not claim that the shipped game works offline.
- **TST01-AC09:** Final required checks are green with no skipped, focused-only,
  expected-failure or retry-masked cases for the acceptance paths. F1–F3 each have
  recorded failing-baseline/passing-fixed evidence, using isolated safe fixtures
  or immutable baseline checkouts. Test sensitivity is shown by a controlled
  temporary regression/mutation for save preservation and the offline cap; no
  broken application changes are left in the deliverable.
- **TST01-AC10:** The implementation PR maps each criterion to exact tests and
  fresh results at its head/base, documents commands and remaining limits, retains
  upstream licenses and existing valid saves, and passes a final source/diff
  review. No milestone acceptance, merge or release is inferred from green tests.

## Delivery sequence and verification

1. **Preparation:** Refresh source and current Orcha main; pin exact files and
   versions, inspect import/repair/clock/menu consumers, create synthetic fixtures
   and choose the existing permitted CI runner. Reconcile source movement and
   dependencies before producing the file-level handoff.
2. **Rule baseline:** Commit the harness and tests for current working behavior.
   Capture F1–F3 as failures, then make only their bounded repairs. Keep test-local
   browser adapters distinct from evidence of a real browser journey.
3. **Browser and CI:** Add Chromium journeys, controlled test-local dependency
   serving, isolated profiles and report collection. Wire CI to the exact local
   commands; demonstrate that a deliberate test failure returns a failing job.
4. **Verification and publication:** Run required suites from a clean install,
   record fresh results and criterion coverage, inspect the final diff and publish
   an unmerged implementation PR through the fork's existing delivery path.

Expected implementation artifacts are package/runtime pins, rule and browser
tests/fixtures, a small harness/server configuration, the CI workflow, bounded
F1–F3 repairs and updated developer guidance. Preparation determines exact paths;
this specification is not an executable file authorization list. No numeric
coverage percentage substitutes for the named behavior assertions. All checks
above are **planned**, not claimed as completed by this document.

## Dependencies, risks and authority

There are no milestone-ID dependencies. Preparation requires repository write
access, the supported Node/browser toolchain and permitted CI capacity. CI or
browser setup failures remain reported blockers; do not silently skip required
checks, use paid capacity or alter account/repository policy to make them pass.

Primary risks are mocks bypassing actual engine behavior, nondeterministic timers,
coupled globals leaking between tests, late-game save fixtures losing Decimal
types, and negative tests damaging real data. Use the actual script graph, fresh
isolated state, synthetic versioned fixtures and browser verification to address
these. Keep representative old saves recoverable when repairing import handling;
any newly discovered incompatible format or irreversible tradeoff needs a scoped
decision before expanding this milestone.

Planning choices (Node rule tests, Chromium/Playwright and narrow test seams) are
agent technical proposals, not recorded owner answers. No unresolved reserved
owner decision is required to write this bounded proposal. Implementation may
not begin from this planning-only request. The repository remains in its existing
`legacy` authority mode; this document/PR creates no lifecycle receipt, queue
enrollment, service activation, priority change, merge or deployment authorization.
Follow [AGENTS.md](../../AGENTS.md) and current published Orcha main; the run's
actual standards revision and document hashes are recorded in the structured plan.
