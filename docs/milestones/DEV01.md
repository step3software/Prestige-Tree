# DEV01 — Explicit state ownership and enforceable JavaScript contracts

**Repository:** `step3software/Prestige-Tree`; canonical project source `master`.
**Source status:** Proposed specification and planning artifact; no runtime enrollment or implementation authority.
**Owner origin:** Codex chat `01a21b20-b179-7f43-ba61-534a9ca8c7a3`, 2026-11-26:
“Write milestones for the remaining work on the same branch.” Remaining work refers to the preceding project testing/architecture review.
**Planning source:** PR #2 branch `codex/tst01-testing-milestone` at `608b7c42875c6b697a345027ab788004183ba9ee`;
application baseline `077861d2d4479d77e6079fd5c8bdf5e4fe7821f8`. These documents share the existing branch at the owner’s request.
**Companion:** [Structured plan](DEV01.plan.json).

## Objective

A developer can follow who owns game state and which effects a function performs, with static checks catching accidental globals and documented JavaScript contracts at important boundaries.

## Baseline and ownership

Active scripts share mutable player, allSaves and tmp plus undeclared loop/temporary names. For example js/layers.js:13 assigns mult without a declaration, and temp/game code uses shared iteration names. Naming and ownership are difficult to verify independently of script order.

Existing source owners: [js/game.js](../../js/game.js); [js/utils.js](../../js/utils.js); [js/layers.js](../../js/layers.js); [js/technical/temp.js](../../js/technical/temp.js); [js/technical/layerSupport.js](../../js/technical/layerSupport.js); [js/components.js](../../js/components.js); [js/technical/systemComponents.js](../../js/technical/systemComponents.js).
The [development guide](../developer-guide.md) owns local commands/navigation; update it in place when implementation changes those routes.

## Scope

- Give durable player/save state, derived tmp/cache state and runtime services explicit named owners with clear per-session lifetimes.
- Pass/import narrowly scoped dependencies at module/layer/UI boundaries and replace undeclared temporary/loop variables with local bindings.
- Add JSDoc contracts and checked JavaScript for state, units, command results and save/runtime/layer interfaces, plus scoped lint/static checks in local and CI commands.
- Keep one source model and verify independent session contexts, UI observation and existing behavior after the ownership cutover.

Excluded:

- TypeScript conversion, a new state-management framework, schema duplication or a wholesale gameplay rewrite.
- Changing save semantics, formulas, runtime policy or the settled SAV01/SIM01 contracts without separately reviewed scope.
- Linting/reformatting historical Old Code, non-shipped demos or vendored Decimal implementation; blanket production-file exclusions.

## Dependencies and sequence

[SAV01](SAV01.md) (hard: Use its settled save codec/storage ownership rather than introducing a competing persistence contract); [SIM01](SIM01.md) (hard: Use its advancement/lifecycle ports as the runtime boundary); [LAY01](LAY01.md) (hard: Apply explicit dependencies to the settled layer modules/registry rather than migrating the monolith twice).
Hard dependencies require their verified code/tests to be available at the prepared source; a proposed Markdown file or green historical PR does not satisfy them. Reconcile exact revisions and overlapping changes during preparation. Soft dependencies may be reused without blocking otherwise independent work.

1. Prepare an inventory of active globals and actual callers after the three prerequisite refactors; pin one canonical state/contract map.
2. Migrate coherent boundaries to explicit context/imports and checked contracts in small test-backed steps; keep the UI bound to the same active owner.
3. Enforce checks, demonstrate independent contexts and controlled static failures, remove superseded bindings and publish the unmerged PR.

## Acceptance criteria

- **DEV01-AC01:** The active application has documented single owners for player/save state, derived values and runtime services. Commands/selectors reference that owner through explicit module/context interfaces; no second persistent mutable model or hidden global player/tmp write authority remains.
- **DEV01-AC02:** Two independently created session contexts can advance, purchase and load saves without changing each other, sharing timers or leaking derived caches. Browser UI observes the same canonical active session and continues updating after save selection/import.
- **DEV01-AC03:** All active authored production scripts/modules have explicit lexical bindings for loop and temporary variables. A small documented browser integration/debug surface may remain only through an explicit adapter; the lint global allowlist must not whitelist accidental mutable identifiers to conceal leaks.
- **DEV01-AC04:** JSDoc and static checking cover GameState, derived state, elapsed-second units, save outcomes and layer/runtime/UI command ports, including optional/error states. Reuse canonical definitions; do not hand-maintain conflicting schemas. A controlled invalid interface use and undeclared write cause their required checks to fail.
- **DEV01-AC05:** Pinned scoped lint/static commands run locally and in CI on the actual shipped authored graph, with no broad ignores or unexplained suppressions. Existing debt in the active scope is resolved or a specific consequential exception is surfaced before declaring completion; style-only churn outside that scope is excluded.
- **DEV01-AC06:** TST01 rule/browser tests and SAV01/SIM01/LAY01 boundary tests pass for the integrated source. Fresh fixtures prove Decimal behavior, upgrade/reset effects, save selection/reload and unchanged dependency ordering; no constructor/import starts unmanaged runtime effects.
- **DEV01-AC07:** The existing developer guide shows the state/effect ownership map, a representative layer command and its test, local checking commands and the explicit external/global boundary. All normal callers use the new path and obsolete global bindings/adapters are removed.

## Verification, risks and deliverables

No intended player UX change. Browser checks verify state remains visible after purchases, imports and save switching; this is regression evidence, not a claim of new usability or performance.

Use TST01’s real-script, Decimal and Chromium suites plus the focused boundary checks above. Record exact head/base, fixtures, commands, results, meaningful before/after comparisons and material unverified coverage in the implementation PR. Do not skip required criteria or replace observable assertions with coverage percentages. All implementation checks here are planned, not claimed as passed.

- Moving globals can change reference identity/reactivity; assert both UI updates and isolated contexts.
- An enormous global context can merely rename coupling; pass the smallest meaningful ports and keep effects with their owners.
- A linter allowlist can hide the original problem; inspect the real shipped graph and every suppression.

Deliver the focused production/test changes, updated current guide and criterion-to-evidence mapping through an unmerged implementation PR. Preparation must refresh current source/Orcha main, resolve exact files and compatible tool versions, protect the branch/checkout and produce the bounded handoff. File names/API sketches here are conceptual contracts, not an executable file authorization list.

## Authority and decisions

This request authorizes writing milestone documents only. Follow [AGENTS.md](../../AGENTS.md), existing project permissions and current published Orcha main. Keep `legacy` milestone authority, existing priorities/pauses, writer protection, licenses and upstream attribution. No stage receipt, owner answer, acceptance, queue enrollment, service activation, merge or deployment is created by this proposal.
The technical direction is an agent proposal within the requested outcome; no unresolved reserved owner decision is needed to write it. Consequential implementation discoveries must be surfaced rather than silently expanding scope. Orcha revision/document hashes used for this run are retained in the structured plan as evidence, not consumer pins.
