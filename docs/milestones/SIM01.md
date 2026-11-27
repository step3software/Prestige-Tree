# SIM01 — Deterministic simulation and explicit runtime lifecycle

**Repository:** `step3software/Prestige-Tree`; canonical project source `master`.
**Source status:** Proposed specification and planning artifact; no runtime enrollment or implementation authority.
**Owner origin:** Codex chat `01a21b20-b179-7f43-ba61-534a9ca8c7a3`, 2026-11-26:
“Write milestones for the remaining work on the same branch.” Remaining work refers to the preceding project testing/architecture review.
**Planning source:** PR #2 branch `codex/tst01-testing-milestone` at `608b7c42875c6b697a345027ab788004183ba9ee`;
application baseline `077861d2d4479d77e6079fd5c8bdf5e4fe7821f8`. These documents share the existing branch at the owner’s request.
**Companion:** [Structured plan](SIM01.plan.json).

## Objective

A developer can advance a game session by controlled elapsed time without starting browser timers, while the shipped page starts and stops one well-defined runtime and handles errors safely.

## Baseline and ownership

js/game.js defines the game loop and starts intervals during script evaluation; js/utils.js independently starts autosave and attaches input handlers. Clock, canvas refresh, derived-state updates and advancement share the same callback. TST01 owns the offline-unit defect repair and its regression baseline.

Existing source owners: [js/game.js](../../js/game.js); [js/utils.js](../../js/utils.js); [js/mod.js](../../js/mod.js); [js/technical/temp.js](../../js/technical/temp.js); [js/technical/canvas.js](../../js/technical/canvas.js); [index.html](../../index.html).
The [development guide](../developer-guide.md) owns local commands/navigation; update it in place when implementation changes those routes.

## Scope

- Separate explicit elapsed-seconds advancement from wall-clock observation, timers, browser events, rendering and persistence scheduling.
- Create one runtime composition/lifecycle owner with injected clock/scheduler and explicit start, stop and disposal.
- Keep existing game rule order, offline cap, settings, reset hooks and Decimal semantics; integrate existing autosave through a narrow port.
- Test repeated start/stop, stale callbacks, exceptions and replay of identical input/action/time sequences.

Excluded:

- A new simulation algorithm, worker-thread deployment, performance optimization, game balancing or changes to advancement order.
- Save subsystem restructuring owned by SAV01, global-state migration owned by DEV01, or UI framework migration.
- Claiming arbitrary tick-chunk equivalence for nonlinear game rules without an explicit gameplay requirement.

## Dependencies and sequence

[TST01](TST01.md) (hard: Deterministic progression/offline tests and the F2 fix must be available before moving tick/lifecycle ownership).
Hard dependencies require their verified code/tests to be available at the prepared source; a proposed Markdown file or green historical PR does not satisfy them. Reconcile exact revisions and overlapping changes during preparation. Soft dependencies may be reused without blocking otherwise independent work.

1. Pin TST01 behavior and inventory current tick/autosave/listener entry points, clock conversions and error paths.
2. Introduce the advancement boundary, then move scheduling/startup/cleanup to the single runtime owner while keeping a single active calculation path.
3. Exercise deterministic replay, lifecycle races and errors, run real-page journeys, and publish an unmerged implementation PR with before/after evidence.

## Acceptance criteria

- **SIM01-AC01:** A documented advancement entry point takes explicit session/context and elapsed seconds. Its calculation path does not read Date.now, access localStorage/DOM, create timers or present dialogs. Supplying the same fixture and ordered actions/time steps produces the same meaningful game state.
- **SIM01-AC02:** Clock conversion and online/offline budgeting have a single owner with named units. Zero/backwards time, below/at/above offline cap, disabled offline production and repeated catch-up preserve TST01 expectations; one elapsed period is never credited twice.
- **SIM01-AC03:** Evaluating/loading game code creates no ticking or autosave intervals and attaches no unmanaged runtime listeners. The real page explicitly starts the runtime once after a validated state is ready, with timer IDs and listeners owned by that runtime.
- **SIM01-AC04:** Start is idempotent, stop/dispose clears owned timers/listeners, and pending callbacks cannot mutate a stopped/disposed or superseded session. Tests demonstrate start twice, stop twice, restart, stale callback delivery and independent isolated contexts.
- **SIM01-AC05:** A calculation/derived-state/render callback exception cannot leave the ticking guard stuck or continue unsafe autosaves. Cleanup happens reliably; the runtime enters an explicit stopped/error condition with a recoverable original save and clear recovery behavior. Tests exercise the exception and subsequent lifecycle operation.
- **SIM01-AC06:** Before/after fixtures for representative progression/reset/offline paths preserve established rule ordering, Decimal values and settings for the same time/action sequence. Test adapters control clocks and scheduling; they do not replace game formulas.
- **SIM01-AC07:** Browser startup, prestige/purchase, save/reload and controlled offline return use the new runtime and pass TST01 journeys without duplicate progression or timers. Update the existing guide with advancement/lifecycle owners and targeted checks; no unsupported latency claim is made.

## Verification, risks and deliverables

The affected workflow is opening/resuming a saved game: startup, ordinary progression, offline return, failure feedback and safe reload must work in Chromium. Preserve context and keyboard access for changed recovery controls; measure only when making a performance claim.

Use TST01’s real-script, Decimal and Chromium suites plus the focused boundary checks above. Record exact head/base, fixtures, commands, results, meaningful before/after comparisons and material unverified coverage in the implementation PR. Do not skip required criteria or replace observable assertions with coverage percentages. All implementation checks here are planned, not claimed as passed.

- Moving tick order can change balances or resets; compare identical ordered input sequences rather than only final point totals.
- Old queued callbacks can mutate a replacement session; bind each callback to its owning live generation/context.
- Catching an error and silently continuing can persist corruption; define and verify stop/recovery semantics.

Deliver the focused production/test changes, updated current guide and criterion-to-evidence mapping through an unmerged implementation PR. Preparation must refresh current source/Orcha main, resolve exact files and compatible tool versions, protect the branch/checkout and produce the bounded handoff. File names/API sketches here are conceptual contracts, not an executable file authorization list.

## Authority and decisions

This request authorizes writing milestone documents only. Follow [AGENTS.md](../../AGENTS.md), existing project permissions and current published Orcha main. Keep `legacy` milestone authority, existing priorities/pauses, writer protection, licenses and upstream attribution. No stage receipt, owner answer, acceptance, queue enrollment, service activation, merge or deployment is created by this proposal.
The technical direction is an agent proposal within the requested outcome; no unresolved reserved owner decision is needed to write it. Consequential implementation discoveries must be surfaced rather than silently expanding scope. Orcha revision/document hashes used for this run are retained in the structured plan as evidence, not consumer pins.
