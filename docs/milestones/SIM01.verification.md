# SIM01 verification and continuation

## Scope, authority and source

SIM01 implements explicit elapsed-seconds advancement and one browser runtime
lifecycle, preserving SAV01 save boundaries and TST01 behavior. The current owner
continuation in chat `01a21ba2-ac03-7710-a07c-99a9cfaec7da` separately authorizes
review/fix/plan/prepare/implementation/test/publication. Original docs-only proposal
and plan bytes remain unchanged; no native receipt, enrollment, owner decision,
human acceptance, merge, deployment or activation is inferred.

- Repository: `step3software/Prestige-Tree`; canonical authority source `master`
  at `077861d2d4479d77e6079fd5c8bdf5e4fe7821f8`.
- Worktree: `C:\Users\PhillipCurry\projects\codex\games\prestige-tree-sim01`.
- New work branch: `codex/sim01-runtime-lifecycle`.
- Verified source and actual PR base: `codex/sav01-save-boundaries` at
  `199b14e622f2fdf7c2d1d2363874b0e38744121a`,
  [draft PR #3](https://github.com/step3software/Prestige-Tree/pull/3).
- Transitive dependency: `codex/tst01-testing-milestone` at
  `379241bd94cf50ca6423e07f1ad68c567edcb6a0`,
  [draft PR #2](https://github.com/step3software/Prestige-Tree/pull/2), based on
  the canonical source above. Both parents remain intact and unmerged.
- [Preparation](SIM01.preparation.json) was schema/source/spec/plan validated and
  committed at `6af9877` before production/test changes. It binds 16 exact paths,
  source blobs/hashes, all seven criteria, separate execution authority and 18
  current-main document hashes. Final review made the criterion/file mapping
  explicit without changing source, scope, original plan or authority.

TST01's hard dependency was verified in actual prepared source: F1–F3 repairs,
shipped Decimal formulas, real-script rules, clock/sensitivity tests and Chromium
journeys. SAV01's codec/storage/command owners and verification were read and
reused. Before extraction, locked `npm ci` and `npm test` passed **104 rules,
11 Chromium journeys**, syntax and sensitivity. Historical green CI was not
used as a substitute for this executed baseline.

## Standards, plan review and ownership

Fresh Orcha main resolution through `standards_resolver` observed
`cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`. Its catalog hashes were verified at
that observation; [preparation](SIM01.preparation.json) records all document
hashes. AGENTS, routing, registry, README delivery-first index, catalog and complete
review/fix/plan/prepare/implement procedures were read, with applicable development,
coordination, readable-code, no-legacy, milestone authority/format and
planning/delivery contracts. This is run evidence, not a consumer version pin.

Canonical project AGENTS, manifest, developer guide, documentation index and
mod-info contract were read at `master`; prepared-source counterparts and SIM01
spec/plan were also read. Canonical rules and parent-PR-proposed testing/planning
documents were distinguished. Manifest authority remains `legacy`. The plan's
seven criteria and exclusions required no consequential owner decision. The
current continuation supplies execution authority independently of the historical
proposal. No native acceptance or lifecycle status was fabricated.

Installed `branch_writers.py` matches verified Orcha source SHA-256
`fb58733a24ece7b30722e929a45553fbbc7b3f7212d0707c1e58bd68e726d89d`.
The new exact branch/checkout acquired and retained its own fenced claim; the
unrelated PR2-review claim was preserved. There was no matching maintenance job.
The installed coordinator remains disabled; no repository adoption, policy or
service was changed. Installed priority was default Low, not paused, with no
active focus restriction. The account reported ordinary usage allowed with 69%
remaining at the observed check; no credits/reset or paid operation was used.
This direct session did not dispatch additional workers or bypass their gates.

| Applicable standard | Implementation and verification disposition |
| --- | --- |
| Review procedure: expectations, callers, failures, sensitivity and every changed path | E1–E8, criteria and complete inventory below; bounded source review satisfied |
| Plan/prepare/implement/fix: original scope, validated exact files, dependencies and authority | Original plan retained; pre-code preparation commit; protected child branch; safe corrections and complete tests; satisfied |
| Coordination and stacking | Exact parent and transitive dependency; separate checkout/claim; draft child PR with unchanged base; final integration remains master; satisfied |
| RC-01/RC-08: find, trace and verify from repository content | README → developer guide → load/startGameRuntime → advanceGame → focused runtime-lifecycle test; route inspected and executed successfully |
| RC-02–RC-06: ownership, names, explicit units/state and useful boundaries | Named seconds/milliseconds/hours; explicit session identity and stopped/running/error/disposed states; injected ports and one composition; useful API comments/current guide; satisfied |
| RC-07 and user-outcome quality | Real rules/Decimal, hostile I/O purity, adverse ordering, baseline checkpoints/mutations, rendered progression and fault/reload at 1280/320px; satisfied at synthetic/rendered levels |
| No legacy modes | One active advancement/scheduling path; obsolete timer/listener/dialog ownership removed; unchanged SAV01 canonical codec/storage/schema; no migration, dual model or fallback introduced; satisfied |
| Project invariants and verification | ptr, layer definitions/IDs, formulas/order, licenses, Decimal, locked tooling and original tests preserved; complete suites pass; satisfied |
| Milestone authority/format | One unchanged SIM01 spec and original plan; companion handoff/evidence only, no state/approval/enrollment writes; satisfied |
| TypeScript/React, live-provider/actual-user proof and performance budgets | Plain JS; no new paid/provider service or performance claim; supplements and those evidence types are not required by this scope |

## Runtime boundary and resource inventory

`advanceGame(createGameSession(), elapsedSeconds)` validates finite nonnegative
seconds and the current player/temp identity, updates derived state, executes
unchanged gameLoop rule order, then checks player numbers. It has no clock,
DOM/storage/timer/dialog effects. Failed calculations clear `ticking` in finally,
latch save protection and propagate. Globals remain scoped to one engine context
pending DEV01; this milestone does not claim arbitrary session switching in one
global context or arbitrary nonlinear tick-chunk equivalence.

`game-runtime.js` alone observes milliseconds and converts/budgets seconds. A
high-water timestamp prevents repeated credit after a backwards clock. Start and
restart bank previously unobserved seconds once; ticks consume the existing
capped 10%/elapsed policy. Disabled offline production discards the bank. Both
historical devSpeed multipliers remain, as the baseline comparison verifies.

| Resource/caller | Owner, transition and proof |
| --- | --- |
| Page body onload → saves.load | Validate storage/collection first; dispose prior owner, prepare theme/layers/temp/Vue, explicitly start runtime; invalid startup owns zero timers/listeners |
| 50ms calculation, 500ms canvas invalidation, 5000ms autosave | One runtime; scheduler IDs retained and cleared on stop/error/dispose; injected clock/scheduler tested; source evaluation creates none |
| document keydown/keyup; window resize/wheel/pagehide | Five registered/removable guarded listeners; stopped/disposed/generation/session checks precede effects. Pagehide disposes a departing page; cached pages retain their suspended owner |
| Manual/save-menu/import/reset commands | SAV01 remains the persistence owner. Ordinary save retains player identity; successful replacement disposes old runtime before activation/reload; failed commands retain current owner/data |
| Repeated load | Old runtime disposed, one new resource set; existing Vue rebound to new canonical player/collection/temp; no duplicate timer progression |
| Fault/recovery | Calculation/derived/canvas/input/refresh/autosave/startup errors stop resources before feedback. Last durable save remains recoverable; every write and restart blocked by reload-only gate |

## Expected outcomes and review findings

| ID | Trigger and required outcome | Evidence/result |
| --- | --- | --- |
| E1 | Same fixture/ordered actions/time → same complete meaningful state without I/O | Hostile clock/DOM/storage/timer/dialog ports and repeated replay passed |
| E2 | Zero/backwards/cap boundaries/disabled offline/restart → each elapsed period credited once | Original clock tests plus restart/high-water cases and real capped offline reload passed |
| E3 | Evaluate scripts or fail loading → zero owned callbacks; validated load → one resource set | Resource count assertions, both page script graphs and real repeated-load/progression passed |
| E4 | Duplicate start/stop/dispose, stale delivery after stop/restart/replacement → no old mutations/writes | Timer/listener snapshots delivered after cancellation and supersession; two generation mutations detected; isolated contexts passed |
| E5 | Calculation/derived/render/NaN/input/refresh/autosave exception → guard cleared, terminal error, no unsafe save | Fault injection assertions for durable bytes and resources, stopped restart denial and real reload recovery passed |
| E6 | Partial resource/startup failure → acquired resources cleaned and save protection retained | Throwing scheduler after first acquired timer; throwing startup rendering and reporting; passed |
| E7 | Same rule sequence through movement → full player state/settings/Decimals preserved | 13 complete checkpoints across three scenarios match immutable SAV01; summaries below |
| E8 | User sees fault and uses keyboard/save/reload → truthful readable status and recovered durable progress | 1280/320px native alert/live status, keyboard action, non-overlap geometry, screenshots and real reload passed |

Confirmed in-scope gaps were evaluation-time intervals/listeners, duplicate clock
ownership and calculation-time NaN dialogs/independent timer cancellation. The
extraction repairs those owners. Final source review found cleanup clearing focus
context unnecessarily; it now retains input focus and clears only momentary held
state. Direct advancement exceptions also latch the existing save gate before
propagating. All confirmed in-scope findings are corrected and verified.

Rejected hypotheses: fractional 50ms Decimal accumulation is not promised to equal
an integer bit-for-bit, so browser time checks use numeric tolerance; complete
identical-sequence baseline snapshots still compare exactly. Derived Decimal
placeholders can be transient during bootstrap; this is not evidence for changing
formulas or broad validation policy. No unsupported late-game repair was added.
The test harness initially lacked removable event targets and was extended as an
I/O adapter; game formulas remain actual shipped source. No rejected hypothesis is
reported as a defect. No mandatory SIM01 local behavior check remains unresolved; publication and
exact-head CI still require the remote observations recorded with the PR.

## Criteria and before/after evidence

| Criterion | Concrete implementation/check | Result |
| --- | --- | --- |
| SIM01-AC01 | game.advanceGame explicit identity/seconds; real updateTemp/gameLoop/fixNaNs; hostile I/O, repeat replay and argument/identity tests | Passed synthetic |
| SIM01-AC02 | observeGameTime/bankOfflineTime/budgetGameTime sole owner; original clock tests, 0/1/3599/3600/7200 boundaries, disabled/backwards/repeated catch-up/start and real capped reload | Passed synthetic/rendered |
| SIM01-AC03 | No evaluation scheduling/title/listeners; load → explicit composition after validation; blocked-load zero and loaded three intervals/five listeners, shipped script graph | Passed source/synthetic/rendered |
| SIM01-AC04 | Generation and player/temp identity checks; idempotent methods; delayed timers/listeners after stop/restart/load/import/direct replacement; separate contexts; stopped/restarted mutations | Passed synthetic, with real input/duplicate-start/load checks |
| SIM01-AC05 | Finally guard; terminal runtime fault and global save gate; calculation/derived/render/input/refresh/NaN/autosave/startup/partial scheduler/direct-call/reporting failures; no durable change; real reload | Passed synthetic/rendered |
| SIM01-AC06 | Immutable SAV01 real-script source overlay and same actions/time; complete player checkpoints include settings, layer values and Decimal strings; F1–F3 unchanged | Passed exact before/after comparisons |
| SIM01-AC07 | Actual page prestige/purchase/save/reload/offline and keyboard start/stop, no duplicate progression; guide API/route/focused tests updated in place | 15 Chromium journeys passed; exact-head CI pending publication, then recorded with PR |

The checkpoint tests emit the SHA-256 of each matching ordered snapshot array.
Both sides use the actual script graph/formulas/shipped Decimal, controlled time
and memory storage. No source mutation is made on disk.

| Scenario | Checkpoints and matching snapshot digest | Representative final values, before = after |
| --- | --- | --- |
| progression/reset and devSpeed | 5; `2ddf66e317848769b064af27d1e57cc092bb11c207fa46e14b3d0faaec73311d` | points 4; prestige 2; upgrade 11; played 7.05s; devSpeed 2; offline null; autosave/offline production true |
| capped offline return | 4; `d2738999bc27175e478d70e79eabef7b8c8d8c8b57127b586163a20d141aa104` | points/played 1241.09; bank 2361.96s; upgrade 11; autosave/offline production true |
| representative huge Decimals | 4; `53273cc12a5a9ece9a066a26c0c6f41311c7aa015cf4b358ecf749df8f41bb58` | points ee1000; prestige 100; upgrade 11; array-held Decimals retained; all settings/full player checkpoints match |

Final local commands: `npm ci`, `npx playwright install chromium`, `npm test`,
`git diff --check` and plan/preparation/source/hash/allowed-path/link checks.
Node 24.22.1, npm 11.19.1 and locked Playwright 1.65.1/Chromium were used.
**125 rule tests and 15 Chromium journeys passed**, with syntax for 17 shipped
and 13 test/config scripts; no skips or retries. F1–F3 still fail on immutable
077861d, SAV01 failed selection fails on TST01 379241b, and five isolated
in-memory mutations are detected: premature activation, skipped candidate
validation, incorrect offline units, stopped-callback guard and restart generation.

Desktop/narrow runtime fault screenshots were visually inspected; status text is
readable and separate from game content. The unchanged narrow legacy Options
layout still has clipping; general UI redesign is outside SIM01. Automated
geometry verifies the changed recovery status stays within the viewport and does
not overlap the app. Real browser tests capture no unexpected console/page errors.
Synthetic VM tests model only effects and do not replace formulas or rendered proof.

## Complete changed-path accounting

Every child-only path is inspected or mechanically verified against the pinned
SAV01 base; no deletion/rename is hidden by these groups.

| Exact paths | Inspection and verification |
| --- | --- |
| js/game-runtime.js; js/game.js | Entire source/diff read; one scheduling/budget/advancement path, identity/generation/error/unit invariants and unchanged ordered loop; lifecycle/rule/mutation/browser checks executed |
| js/saves.js | Entire diff and unchanged codec/storage/menu callers traced; activation disposes only replaced identity, failed operations protect state, startup/active Vue rebind and fault gate; original SAV01 and new lifecycle suites executed |
| js/utils.js; js/technical/temp.js; js/technical/canvas.js | Complete removal/input/NaN changes read and callers followed; no evaluation listeners/title or calculation dialogs/independent timers remain; keyboard/derived/player-number/render tests executed |
| index.html; demo.html | Complete one-script insertion and load ordering inspected; primary real page executed; demo wiring checked, full demo journey remains unverified |
| tests/support/game-runtime.cjs | Entire adapter diff read; removable targets/callback capture, real scripts preserved. fire after cancellation is a no-op; explicit zero/three-resource checks and old-callback delivery prevent masking missing startup |
| tests/rules/runtime-lifecycle.test.cjs | Every assertion and immutable-source overlay read/executed; purity, time, lifecycle, failure/reload, complete checkpoint and isolation checks accounted for |
| tests/browser/runtime-lifecycle.spec.cjs | Every normal/error/context/keyboard/offline assertion executed with locked local assets and fresh contexts; screenshots visually inspected |
| scripts/verify-regressions.cjs | Complete diff read and executed; historical script exclusions preserve baseline validity; unique mutation anchors and actual state/durable assertions inspected |
| .github/workflows/test.yml | One branch trigger added; pinned actions/toolchain, full Git history, read-only permissions and bounded failure artifacts retained |
| docs/developer-guide.md | Current source map/API/lifetime/units/error/stack guidance read; README-to-focused-test route executed and links checked |
| docs/milestones/SIM01.preparation.json; docs/milestones/SIM01.verification.md | Plan/spec/source/catalog hashes, exact path/criterion/schema bindings and local links mechanically checked; provenance/criteria/standards/results/path inventory reviewed |

Protected unchanged assets include original rule/browser cases, save codec/storage,
plan/spec and predecessor evidence, package pins/lockfile, layer definitions/mod,
Decimal library, licenses and governing AGENTS/manifest. Cumulative TST01/SAV01
contracts remain available. LAY01/DEV01/UI01 code is not implemented here.

## Delivery and next handoff

Publish this branch as a separate **draft, unmerged stacked PR to
codex/sav01-save-boundaries**. Keep PR #3 and transitive PR #2 dependencies and
parent worktrees intact; do not retarget to master while the stack is unmerged.
The PR and local `sim01-final-delivery.json` handoff retain the exact final head,
base, CI URLs/status and writer disposition after publication. Release only this
run's owned claim after the actual remote outcome and exact-head CI are confirmed.
No pending/unknown publication may be discarded.

The next defined milestone is **LAY01 — Organize game content by layer**.
Under the owner's continuation, create its separate chat/worktree/work branch
from the verified final SIM01 branch head, use SIM01 as the unmerged PR base,
and refresh current standards/source/dependencies/preparation/writer gates first.
LAY01 must reconcile its registration inventory with the runtime and SAV01 owners;
its plan's soft SIM01 dependency is now available in this stack. Preserve original
legacy milestone authority and carry this continuation separately.

Other engines, full late-game balance, all historical installations, full demo
rendering, actual-user/assistive-technology and OS clipboard behavior remain
unverified. CDN/offline hosting behavior is not established by local test assets.
Native browser-cache restoration was reasoned from the pagehide branch, not
claimed as an executed navigation journey. Existing Vue 2 advisory remains UI01.
No arbitrary tick-chunk equivalence, performance budget or latency benefit is
claimed. Native acceptance, merge, deployment, paid services, service activation
and permission/policy changes remain outside this delivery.
