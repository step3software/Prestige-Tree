# LAY01 — Organize game content by layer

**Repository:** `step3software/Prestige-Tree`; canonical project source `master`.
**Source status:** Proposed specification and planning artifact; no runtime enrollment or implementation authority.
**Owner origin:** Codex chat `01a21b20-b179-7f43-ba61-534a9ca8c7a3`, 2026-11-26:
“Write milestones for the remaining work on the same branch.” Remaining work refers to the preceding project testing/architecture review.
**Planning source:** PR #2 branch `codex/tst01-testing-milestone` at `608b7c42875c6b697a345027ab788004183ba9ee`;
application baseline `077861d2d4479d77e6079fd5c8bdf5e4fe7821f8`. These documents share the existing branch at the owner’s request.
**Companion:** [Structured plan](LAY01.plan.json).

## Objective

A developer can locate and change one named layer in a focused file while preserving the existing registry, cross-layer effects and game/save behavior.

## Baseline and ownership

The baseline js/layers.js has approximately 9,900 lines and 31 addLayer registrations. Registration already has a shared owner in js/technical/layerSupport.js, so content can be split without replacing the layer model.

Existing source owners: [js/layers.js](../../js/layers.js); [js/technical/layerSupport.js](../../js/technical/layerSupport.js); [js/tree.js](../../js/tree.js); [js/technical/temp.js](../../js/technical/temp.js); [index.html](../../index.html).
The [development guide](../developer-guide.md) owns local commands/navigation; update it in place when implementation changes those routes.

## Scope

- Move each active layer definition to a named content file and provide an explicit deterministic registration manifest/entry point.
- Preserve addLayer contracts, layer IDs, registration order, hooks and state shape; document cross-layer dependencies and narrow shared formula owners.
- Remove duplicate old registrations and update real startup, tests and the current code map together.
- Add registry completeness/uniqueness and representative content-preservation checks across early, middle and late game.

Excluded:

- Changing formulas, prices, unlocks, rewards, layer IDs, save schema or balancing.
- A new plugin platform, automatic filesystem discovery, registry replacement, UI redesign or vendor library edits.
- A full audit/proof of every late-game balance interaction or an unrelated archive cleanup.

## Dependencies and sequence

[TST01](TST01.md) (hard: The real-script and browser regression suite must guard content movement before the monolith is split); [SIM01](SIM01.md) (soft: Reuse its explicit loading/runtime boundary if available; otherwise preserve current startup semantics and reconcile later).
Hard dependencies require their verified code/tests to be available at the prepared source; a proposed Markdown file or green historical PR does not satisfy them. Reconcile exact revisions and overlapping changes during preparation. Soft dependencies may be reused without blocking otherwise independent work.

1. Inventory exact registered IDs/order and representative dependency fixtures at the post-TST01 source.
2. Move coherent batches through the current registry, updating the one registration manifest and real/test loading together; verify each batch.
3. Run completeness, sensitivity and progression/browser checks, remove superseded active definitions and publish the unmerged refactor PR.

## Acceptance criteria

- **LAY01-AC01:** Every active baseline layer has one clearly named source owner; the current baseline inventory is 31 IDs and must be refreshed at preparation if source changed. The registration entry lists each exactly once in the established order, and duplicate/missing IDs fail a focused check.
- **LAY01-AC02:** The real application entry and test loader consume the same authoritative registration manifest. Adding a layer does not require editing unrelated layer bodies or maintaining a separate test-only registry.
- **LAY01-AC03:** All existing layer identifiers, serialized fields, hooks, hotkeys, tree positions, formulas and dependency semantics remain unchanged. A before/after registration/contract inventory accounts for every moved definition and consumer; any intentional behavior change needs separate scope.
- **LAY01-AC04:** Synthetic representative early/middle/late fixtures exercise reset gains, upgrade costs/effects, unlocks, automation and cross-layer effects before and after moves using actual definitions and the shipped Decimal library. TST01 and registry tests remain green; report remaining balance coverage limits explicitly.
- **LAY01-AC05:** The old monolithic definitions are removed from the active path after verified movement; no duplicate loader, fallback registry or second maintained content copy remains. Tests fail for an intentionally omitted/duplicated registration in an isolated temporary fixture.
- **LAY01-AC06:** The existing development guide maps layer names/IDs to source files, shared helpers and relevant tests. Trace one layer change from guide to definition, registry, caller and check using repository content alone. The unmerged PR preserves attribution and records all moves and results.

## Verification, risks and deliverables

No player workflow is intentionally redesigned. Existing rendered progression/tree/purchase journeys are regression evidence; new UX studies or invented performance targets are not required for content moves.

Use TST01’s real-script, Decimal and Chromium suites plus the focused boundary checks above. Record exact head/base, fixtures, commands, results, meaningful before/after comparisons and material unverified coverage in the implementation PR. Do not skip required criteria or replace observable assertions with coverage percentages. All implementation checks here are planned, not claimed as passed.

- Module evaluation order can alter closures/hooks; keep deterministic registration and compare actual derived values.
- A visually tidy split can retain hidden dependencies; document specific cross-layer reads and avoid extracting helpers based only on similar text.
- Text moves alone do not prove balance equivalence; retain representative fixtures and state explicit untested interactions.

Deliver the focused production/test changes, updated current guide and criterion-to-evidence mapping through an unmerged implementation PR. Preparation must refresh current source/Orcha main, resolve exact files and compatible tool versions, protect the branch/checkout and produce the bounded handoff. File names/API sketches here are conceptual contracts, not an executable file authorization list.

## Authority and decisions

This request authorizes writing milestone documents only. Follow [AGENTS.md](../../AGENTS.md), existing project permissions and current published Orcha main. Keep `legacy` milestone authority, existing priorities/pauses, writer protection, licenses and upstream attribution. No stage receipt, owner answer, acceptance, queue enrollment, service activation, merge or deployment is created by this proposal.
The technical direction is an agent proposal within the requested outcome; no unresolved reserved owner decision is needed to write it. Consequential implementation discoveries must be surfaced rather than silently expanding scope. Orcha revision/document hashes used for this run are retained in the structured plan as evidence, not consumer pins.
