# SAV01 — Separate save validation and persistence

**Repository:** `step3software/Prestige-Tree`; canonical project source `master`.
**Source status:** Proposed specification and planning artifact; no runtime enrollment or implementation authority.
**Owner origin:** Codex chat `01a21b20-b179-7f43-ba61-534a9ca8c7a3`, 2026-11-26:
“Write milestones for the remaining work on the same branch.” Remaining work refers to the preceding project testing/architecture review.
**Planning source:** PR #2 branch `codex/tst01-testing-milestone` at `608b7c42875c6b697a345027ab788004183ba9ee`;
application baseline `077861d2d4479d77e6079fd5c8bdf5e4fe7821f8`. These documents share the existing branch at the owner’s request.
**Companion:** [Structured plan](SAV01.plan.json).

## Objective

A developer can change save validation, conversion or storage without editing game progression or UI code, while players keep recoverable valid progress when an operation fails.

## Baseline and ownership

Save creation, selection, import/export, default repair and localStorage writes currently share js/utils.js. TST01 owns the already identified invalid-import/autosave defect repair; this milestone extracts and strengthens that repaired boundary rather than repeating it.

Existing source owners: [js/utils.js](../../js/utils.js); [js/game.js](../../js/game.js); [js/mod.js](../../js/mod.js); [js/components.js](../../js/components.js); [js/technical/systemComponents.js](../../js/technical/systemComponents.js).
The [development guide](../developer-guide.md) owns local commands/navigation; update it in place when implementation changes those routes.

## Scope

- Separate save decoding/encoding, shape validation, supported-format conversion and Decimal hydration from persistence and UI effects.
- Route current save/autosave, import/export, create/rename/delete/select and startup loading through one storage adapter with explicit outcomes.
- Keep one canonical current save model and convert supported historical representations at the boundary, preserving recoverable originals until validation succeeds.
- Add focused rule and browser regressions around storage failure, recovery and multi-save operations; update existing developer guidance.

Excluded:

- New cloud saves, accounts, synchronization, encryption services or storage backends.
- Changing the ptr save key, layer IDs, intended game state, game balance or broad save-format redesign.
- Retaining permanent legacy runtime readers/writers, dual writes or a second save authority; TST01 defect scope is not reopened.

## Dependencies and sequence

[TST01](TST01.md) (hard: Its save/import regressions and named F1-F3 repairs must be available at the prepared source before extraction).
Hard dependencies require their verified code/tests to be available at the prepared source; a proposed Markdown file or green historical PR does not satisfy them. Reconcile exact revisions and overlapping changes during preparation. Soft dependencies may be reused without blocking otherwise independent work.

1. Pin the post-TST01 source, enumerate all current save consumers and supported representations, and capture unchanged valid-save fixtures.
2. Extract pure codec/validation and the single storage adapter in small steps, move callers and remove superseded paths after each verified cutover.
3. Run failure/round-trip and browser journeys, compare meaningful pre/post state, review all writes and publish the bounded unmerged implementation PR.

## Acceptance criteria

- **SAV01-AC01:** A small documented codec/validator accepts raw save data and returns a validated candidate or an explicit error without reading storage, touching DOM/dialogs, scheduling work or replacing the active player. Round-trip tests retain Decimal values and current player/multi-save semantics.
- **SAV01-AC02:** One storage adapter owns every normal durable save read/write. UI commands, autosave and startup use that adapter; tests/source checks account for and remove duplicate direct storage paths. Storage errors return actionable outcomes instead of being swallowed.
- **SAV01-AC03:** Import validates and persists a complete candidate before activating it. Invalid payload, denied confirmation, cancelled input, failed conversion or storage write leaves prior active and durable progress recoverable. Ordinary save failure retains valid active progress, preserves the prior durable value and exposes an unsaved/error state.
- **SAV01-AC04:** Inventory supported existing save versions/layouts using synthetic representative fixtures. Convert each supported old representation into the one current model with repeatable/resumable behavior; validate meaningful values and references, retain an original until verification, and reject unsupported or corrupt data without fallback or silent replacement.
- **SAV01-AC05:** Tests cover current/historical round-trips, malformed nested data, storage denial/quota failure, interrupted/retried conversion, multiple save selection and rename/delete, repeated import, and F1 non-regression. A deliberately failed candidate validation cannot overwrite the previous save.
- **SAV01-AC06:** Browser journeys start with valid synthetic progress, perform save/export/import and multi-save changes, reload and recover from rejected data/storage failure. Visible feedback is truthful, readable and keyboard-operable, and retry retains the user context. Browser failure must not be marked as a successful save.
- **SAV01-AC07:** All callers use the extracted owners with one canonical active player/save collection; derived caches, timers and DOM objects are excluded from durable data. TST01 suites pass on the integrated source, and the development guide maps the new owners and commands.

## Verification, risks and deliverables

Save/import recovery is an affected player workflow: verify retained progress and selection, visible errors, cancellation, keyboard access and retry through actual rendered controls. No new performance target is proposed.

Use TST01’s real-script, Decimal and Chromium suites plus the focused boundary checks above. Record exact head/base, fixtures, commands, results, meaningful before/after comparisons and material unverified coverage in the implementation PR. Do not skip required criteria or replace observable assertions with coverage percentages. All implementation checks here are planned, not claimed as passed.

- A shallow copy or premature state swap recreates F1; validate a detached candidate and assert failure-side effects.
- Storage errors and partial conversions can lose progress; keep recoverable originals and never claim cross-key transactions that the adapter cannot provide.
- An unrecognized historical save could require a consequential migration choice; preserve it and stop that conversion rather than widening scope silently.

Deliver the focused production/test changes, updated current guide and criterion-to-evidence mapping through an unmerged implementation PR. Preparation must refresh current source/Orcha main, resolve exact files and compatible tool versions, protect the branch/checkout and produce the bounded handoff. File names/API sketches here are conceptual contracts, not an executable file authorization list.

## Authority and decisions

This request authorizes writing milestone documents only. Follow [AGENTS.md](../../AGENTS.md), existing project permissions and current published Orcha main. Keep `legacy` milestone authority, existing priorities/pauses, writer protection, licenses and upstream attribution. No stage receipt, owner answer, acceptance, queue enrollment, service activation, merge or deployment is created by this proposal.
The technical direction is an agent proposal within the requested outcome; no unresolved reserved owner decision is needed to write it. Consequential implementation discoveries must be surfaced rather than silently expanding scope. Orcha revision/document hashes used for this run are retained in the structured plan as evidence, not consumer pins.
