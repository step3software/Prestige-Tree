# MAT01 implementation verification

Candidate based on `main` at `7031f946f74c1ba5977ce3770f290e44f24b8d2f` (permanent milestones, held-balance Population requirements and native staffing sliders, PRs #16/#15/#14). Orcha current `main` was refetched at `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`; [evidence](MAT01.evidence.json) records exact governing document and candidate content hashes. The user authorized rebase, implementation, review/fixes and a full development cycle; basic huts remain Organization 1. Native lifecycle enrollment/acceptance, merge and deployment remain outside this delivery.

## Implemented outcome

Craft reveals Crafting/Clay/Copper rows at 10/20/30 Craft, each with four 1/2/3-Craft choices. Water baskets become jars on the same storage count; Clay pots become Copper pots for Cooking; Thatched roofs become Bricks on the same huts. Fire projects use the existing builder slot. The spring sustains eight upkeep equivalents before improvements; manual hauling remains available and pipes cost exactly 2 Fire plus 2 Craft. Communal cistern, chisels and awls have no active implementation.

Current main uses peak held Organization to preserve earned milestones, access and specific retention. Current spendable Organization still determines Population requirements, upkeep, construction speed and affordability. Spending keeps orders and Fire available; old queues wait for free supervisors without discarding active work. Fire tenders and active crews are counted before reserving supervisors.

## Executed verification

`npm test` passed on Node 24.22.1 / npm 11.19.1: build, package identity, syntax, actual Vue compilation/static contracts, negative sensitivity checks, **154 rule/save/runtime/balance tests**, real prestige mutation sensitivity and **32 Chromium journeys**. The final unbroken current-main run exited 0; earlier 27d2495 results are historical only. Desktop 1280px and narrow 390px material screenshots were visually inspected after fixing clipped cards; the browser suite also covers 320px reflow and main staffing sliders.

The separate legal balance command is `npm run balance -- --hours 4 --budget 30 --calibrate-minutes 240`. It uses the real session/commands with no granted resources, real one-second economic steps, fixed 5-second active checks and 20-second regular checks throughout this opening. Results are synthetic, with no accepted human pacing target:

| Checkpoint | Active | Regular rough | Regular fixed |
| --- | ---: | ---: | ---: |
| Crafting | 1330s | 1440s | 1440s |
| Clay | 2200s | 2340s | 2340s |
| Copper | 3580s | 3780s | 3780s |
| All Fire buyables | 5405s | 5715s | 5715s |
| Opening complete, held Organization 10 | 7870s | 8215s | 8210s |

Matched four-hour calibration reaches every checkpoint in both modes: maximum observation drift 0s active / 5s regular; no coverage mismatch. Regular play still requires frequent hauling. The legal shortage scenario recovers one survivor to 44 people in 111s/111s with three repeat orders and manual Water support; this is not idle-survival evidence. Local generated reports, checkpoints and Chromium screenshots remain ignored; their hashes are captured in evidence.

## Criteria and standards mapping

| Requirement / expected invariant | Implementation and verification evidence | Result |
| --- | --- | --- |
| AC01–03: exact five-position rows, guarded spending and Craft access; hut bootstrap | `materialDefinitions`, `upgradeView`, `featureAvailable`; materials/early-milestones/current-coordination rule suites | Verified automatically |
| AC04, AC07, AC13: observable effects, exact atomic Craft/Fire costs, builder and reset rules | `projects`, `canStartProject`, `startProject`, Fire rules; materials/Fire tests and rendered Fire journey | Verified automatically |
| AC05–06: manual haul alongside baseline eight-person spring | Shared upkeep/flow; eight/nine balance assertions at changing held balances, actual crew dispatch and narrow Water journey | Verified automatically |
| AC08–09: one current save model, retained ownership/work, safe ingress and prestige | Canonical defaults, detached migration/validation, exact retained IDs; real historical codec fixtures, invalid-import atomicity, prestige/chunk/save tests | Verified automatically |
| AC10: legally reachable material and Fire progression | Source-hashed four-hour report and full-horizon matched calibration, three policy completion tests | Verified automatically; pacing acceptance unknown |
| AC11: keyboard/reflow, tiers and safe save replacement | Native controls, material/Fire journeys at desktop/narrow widths, existing save-replacement and recovery journeys | Synthetic/rendered; actual-user and assistive-technology usability not measured |
| AC12: integrated checks and accurate canonical documentation | Full suite, schema/path/hash checks, README → developer guide → rules/test trace | Verified automatically |
| AC14–15: independent upgrade chains, preserved counts, real fuel/bonus and new-trip sickles | Shared housing/storage/effective Cooking formulas; count/work, fuel delivery, snapshot, shortage and chunk assertions | Verified automatically |
| Orcha RC01–08; local session, labor, codec and delivery contracts | README/code map routes; one rules owner and inferred default contracts; read-through of commands → UI/codec/prestige; focused and integrated verification | Satisfied within inspected scope |
| Orcha no-legacy and fail-safe migration | Historical formats convert at detached ingress; runtime consumes only v0.9 defaults/current flags; storage recovery and malformed imports preserve originals | Verified automatically |
| Orcha current standards and writer controls | Immutable resolver capture, hashes and dedicated checkout/fenced claim; current main conflicts merged individually; no service activation or protected-branch change | Recorded in evidence |

Every changed path is listed with a content hash and review disposition in the evidence companion. Runtime/UI/policy source and changed test assertions were inspected; documents were reconciled with current behavior; the historical codec fixture was exercised through real ingress. The five `tests/rules/current-coordination.test.cjs` scenarios preserve latest main’s permanent-unlock contract, with obsolete Organization-unlocked equipment fixtures adapted to Craft. An additional Fire/crew/pending-manager scenario checks every step for overbooking and reload preservation. No unrelated TypeScript/React supplement applies to this JavaScript/Vue content change.

## Review findings and fixes

- R1: pre-0.9 migration could overwrite malformed discovery flags before validating them. A failing regression now passes after validating historical booleans before conversion; live state remains unchanged on rejection.
- R2: completed rough/fixed terminal observations could be falsely censored when regular rough completion was a few seconds later. Completed runs now use their common requested horizon; incomplete references retain their actual censor. A focused regression covers both.
- R3: cumulative Fire replay replaced main's overseer sliders with dropdowns. Restored main's computed staffing bounds, slider controls and full keyboard/reload regression, retaining Fire controls separately.
- R4: a new active Fire project could import without its permanent Craft prerequisite. A reproduced failing test now rejects this malformed import. This rule is limited to the new Fire projects; main's paid Water-work preservation case remains valid.
- R6: rendered material cards inherited fixed-size buttons, clipping labels/costs at narrow widths; scoped fluid-height cards now preserve readable text and native controls. Chromium checks card overflow and rendered Copper knives naming.
- R5: main advanced again with PR #16. Preserved permanent peak-based milestones, pre-payment peak capture, held-balance Population requirements, safe delayed supervisor staffing and current labels; Fire tenders share that staffing budget. All five main permanent-unlock scenarios pass with material-specific fixtures; the full 154-rule/32-browser rerun passed.

Automatic approval review rejected an attempted bulk conflict-side selection because it could discard main behavior. That command did not execute. Each overlapping hunk was subsequently inspected and merged individually; the rebase completed through the safer path.

## Limits and recovery

These are local automated and rendered checks, not measured human enjoyment, assistive-technology certification or deployed-service evidence. No provider integrations, live customer data or external messaging are involved. The draft PR is for owner review; no merge/deployment or native milestone acceptance is claimed. Keep a matching source/package artifact and exported save for rollback; older artifacts reject new v0.9 keys, so preserve newer exports. Original `ptr` saves remain untouched.
