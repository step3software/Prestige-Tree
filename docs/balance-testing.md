# Balance testing with content development

Build balance coverage **in the same PR as each new or replaced section of game
content**. The planned content replacement should develop its checkpoints,
playable strategies and pacing tests together. Extend coverage as sections land.

The runner uses the shipped Civ session and resource rules. Its catalog follows supported population, Craft, all ten Organization milestones, Food repeat orders, worker-free Water and staffed farming. The opening completion checkpoint requires milestone 10, overseer, gravity flow and farming. Later resources are locked and hidden and are not opening checkpoints.

## Add balance coverage with content

Start at the content's real layer/session owners, then follow this map. Keep game
formulas in their existing owners; the balance tool calls those rules.

| Content change | Balance owner to update | Evidence to add |
| --- | --- | --- |
| New section, branch, unlock or ending | [sections.cjs](../scripts/balance/sections.cjs): `sections` and `progressionLayers` | Entry/exit predicates and all individual branch unlocks |
| New purchase, reset, challenge, discovery or allocation decision | [policy.cjs](../scripts/balance/policy.cjs): strategies and `createPolicy` | A legal policy that reaches and exercises the new mechanic |
| New production model, currency or timed automation | [rough.cjs](../scripts/balance/rough.cjs): forecasts and step bounds | Matched rough/fixed comparison through the affected transition |
| New pacing scenario or regression | [balance-simulation.test.cjs](../tests/rules/balance-simulation.test.cjs) | Short deterministic assertions using [simulate.cjs](../scripts/balance/simulate.cjs) and the real engine |
| New durable scenario input | [tests/fixtures](../tests/fixtures), normal [save codec](../js/save-codec.js) | Synthetic starting state, its provenance and the scope it skips |

1. **Define the pacing question.** State the section's start, observable completion
   condition and intended timing range, if the content design supplies one.
   Specify simulated seconds, the starting state and the policy assumptions.
   Preserve the owner-selected regular cadence: 20-second opening checks, then
   five-minute checks after overseer, gravity flow and auto-building. Describe the active
   strategy. Record an undecided target as undecided; an observed time alone does
   not become a design requirement.
2. **Register the actual progression.** Add or revise section predicates and the
   relevant `progressionLayers` IDs. For parallel branches, state whether entry
   means the first unlock or all branches. Update the ending predicate when the
   content's ending changes. Test that the transition is detected and that a
   locked or unfinished state is not counted as completion.
3. **Teach the policies to play it.** Use the shipped command owners and their
   affordability/unlock guards. Add required build choices, challenge entry/exit,
   allocations and earned automation. Check action counts and observable outcomes
   to show the mechanic was exercised. A catalog entry or an implemented adapter
   alone is not coverage. A policy that stalls needs diagnosis before its timing
   can be used to judge the content's pacing.
4. **Add a bounded section scenario.** Use a reproducible synthetic state just
   before the mechanic, loaded through the normal codec. Prefer a checkpoint
   reached through legal play when making reachability claims. A deliberately
   constructed fixture may isolate a mechanic, but must document granted progress
   and does not prove the prefix is playable. Keep source identity, fixture
   generation/preconditions and expected transition with the test or PR evidence.
5. **Add focused regressions.** Put short scenarios in the existing balance test
   file so `npm run test:balance` includes them. Cover meaningful success and
   relevant locked/insufficient-resource cases, the reset or challenge boundary,
   and any new automation behavior between regular checks. Assert the actual
   transition and resource effects. Add timing bounds when justified by the
   content's intended pacing, allowing a documented tolerance for numerical step
   effects. Keep session isolation and `devSpeed` at 1. If tests are split into
   more files, update the focused command in [package.json](../package.json) so it
   still runs every balance scenario; normal CI also discovers `tests/rules/*.test.cjs`.
6. **Measure and calibrate that section.** Run active and regular play from the
   same section state. Compare rough and fixed modes over the same horizon,
   profiles and completion conditions. Check a smaller fixed step around
   nonlinear production, challenges and automation. Document a tolerance suited
   to the mechanic and investigate excessive drift or different coverage. Extend
   forecasts/step bounds when needed; do not widen tolerance merely to hide an
   inaccurate jump. Early-game calibration cannot certify a new late-game section.
7. **Retain reviewable evidence.** Record the fields below in the content PR and
   run the normal checks required for its code/UI scope. Keep the quick command
   useful within a bounded wall budget; longer section and campaign sweeps remain
   opt-in. Full-game coverage grows with the content PRs rather than being
   inferred from one early-game smoke run.

Run from the worktree root:

```powershell
npm run test:balance
npm run balance -- --profiles active-balanced,regular --hours 24 --budget 30
```

The first command should pass the focused contracts and all section scenarios
added there. The second runs the current **fresh-game** quick comparison; it may
stop before the new section. Use a section input as described
[below](#investigate-an-isolated-later-section) to measure later content. The
`simulate()` API also accepts `stopAt` with a registered section ID for bounded
tests; this is an API option, not an existing CLI flag. A section-completion test
must assert its expected `checkpoint`/`endgame` status and actual transition, so a
wall-budget or horizon stop cannot silently pass as completion.

Include this evidence in each content PR (fill it with actual results):

```text
Content/section and entry → completion condition:
Intended timing range and design source (or undecided):
Starting state: fresh game / reached checkpoint / constructed fixture; skipped scope:
Source revision, fixture identity and policy/configuration:
Active and adaptive regular: observed game time, cadence transitions, stop reason, actions exercised:
Rough vs fixed: matched horizon, step sizes, checkpoint drift and accepted tolerance:
Focused assertions/commands and results:
Unreached branches, missing policy decisions and remaining coverage:
```

Keep generated reports with their source/fixture identity in PR evidence or the
existing artifact path; `balance-results/` remains ignored. If a deterministic
scenario fixture belongs in source, keep it under `tests/fixtures` with its
provenance. Do not commit personal saves or use wall-runtime budgets as assertions
about gameplay speed.

When replacing content, revise or remove obsolete catalog entries, policy
assumptions and scenario fixtures together. Inspect inherited immutable formula
and checkpoint comparisons: intentional content changes need assertions for the
new behavior and an explanation of the retired equivalence claim. Preserve
applicable engine, isolation and save/recovery regressions. Content replacement
does not itself define a save migration; follow the
[save boundary contract](developer-guide.md#save-boundaries-and-recovery) for any
durable-state changes.

Section-local measurements are useful immediately. A full-playthrough estimate
requires a continuous legal run from a fresh state to the current ending for each
reported policy, with relevant section calibration. Do not sum isolated fixture
times into a campaign total or call the best tested strategy a proven optimum.

## Run the current quick comparison

```powershell
npm run balance -- --hours 4 --budget 15 --calibrate-minutes 60
```

The default profiles are `active-balanced` (manual decisions every 5 seconds) and `regular` (every 20 seconds until Expedition overseer, Gravity-fed spring and milestone-10 auto-building are earned, then every 300 seconds). This opening cadence was requested by the owner because five-minute fresh checks could not sustain manual expeditions. `cadenceChanges` records the actual transition. `active-organization` reverses the early prestige priority. Policies dispatch real crews, buy equipment and automation, construct housing/storage, earn Craft/Organization and invest through the shipped guards. No resources, workers or unlocks are granted.

The default CLI remains bounded by 15 wall seconds per run. `--hours` is a simulated game-time horizon, not a claim that the opening takes that long. `--save` loads a codec-validated synthetic checkpoint and measures time since that input. Reports include actual source hashes, actions, layer unlocks, completion/censoring and rough/fixed calibration. `balance-results/` is ignored; its saves are generated synthetic inputs, not player data.

## Policies and sections

`sections.cjs` owns the current opening predicates. Craft and Organization are recorded independently; `endgame` requires all ten Organization milestones plus overseer, gravity flow and farming. It is a balance checkpoint, not the engine ending. The continuous legal test confirms Food remains staffed and later resources stay locked with zero balances after another 300 seconds.

`policy.cjs` uses one construction project at a time, restarts available expeditions, buys automation and enables separate repeat orders. It funds Food baskets at 1 Craft each and skips unaffordable basket starts so well construction can proceed. Domestic improvements and later-resource investments are outside the current opening. The observed best policy is not a proven optimum or actual-user timing. No manual choices occur between configured checks; batch jobs, construction and earned automation continue normally.

Policies exercise all ten Organization milestones through legal commands. First reach 12 Population for the opening Craft, then build toward the next housing-only Organization requirement while banking enough Craft for upgrades. Organization pays one point at 12 housing and raises that requirement by four lifetime housing each time; Craft pays one at 12 people and another per two more. Both restart at five people with ten Food/Water. Policies buy survival upgrades and legally re-enable Water Keeper after resets; its dedicated worker counts in the same budget. Only named buyables survive their individual milestones (earthenware jars 4, Food baskets 5, wells 6, exploration levels 7, bigger-game levels 8, river trap levels 9, huts 10). Auto-building requires 10 lifetime Organization. Provisioning and farming tools still reset. Each opening completion must reach every Organization checkpoint and purchase farming; a shorter run cannot imply ten-milestone coverage. The active/regular policies also exercise the single initial Craft choice per node and the first three unlock gates.

## Rough and fixed calibration

Civ advances internally in one-second steps. Fixed mode uses the selected outer step (default 5 seconds); rough mode coalesces engine/cache calls while retaining the same adaptive manual cadence. Checkpoint observation is capped to 5 seconds before farming and 15 after farming, then up to the selected maximum. Entry windows describe observation precision, not statistical uncertainty. Resources and decisions remain governed by actual content rules.

Compare active and regular modes over the same 60-minute horizon. The focused suite requires matching checkpoint coverage, matching action counts and at most 15 simulated seconds of checkpoint observation drift. That tolerance follows the explicit outer observation bound; it is not a balance target. No timing target for player satisfaction has been accepted. Investigate a differing transition or policy outcome rather than loosening tolerance to hide it.

```powershell
npm run balance -- --mode fixed --hours 4 --step 1 --profiles active-balanced,regular --calibrate-minutes 0
npm run test:balance
```

The focused suite checks native/VM parity through actual construction, growth and both prestige branches; isolated sessions/no persistence; five-minute manual cadence; both active prestige orders and regular completion; matched rough/fixed checkpoint observations; and validated checkpoint inputs. It runs in normal `npm test` CI. The smaller fixed reference is useful when changing numerical rules or automation. Long sweeps remain opt-in.

## Preservation and evidence

The old layer catalog, old challenge/mastery policies, inverse-cost forecasts and immutable original-game formula comparisons were retired because that content was intentionally replaced. The reusable engine loader, session isolation, codec, wall budget, reporting and checkpoint mechanisms remain. Save/runtime safety is exercised by the Civ-specific rules and browser suites; old `ptr` data is never read or modified. See [the save boundary contract](developer-guide.md#save-boundaries-and-recovery).

README -> developer guide -> this document -> `scripts/balance/run.cjs` -> `simulate.cjs` / `policy.cjs` -> `createGameSession` -> the actual civilization rules. The verification record reports measured synthetic results and unmeasured limits separately.

Survival regressions exercise zero Food/Water, combined shortages, exact grace deadlines, acceleration, recovery upgrades, one-survivor rebuilding and deterministic online/offline chunks. A legally reached tenth Organization checkpoint verifies ten minutes of idle rebuilding without additional manual actions. The prestige sensitivity check detects accidentally retaining Population.

The Food buyable scenario in `balance-simulation.test.cjs` reaches a funded settlement through ordinary active/regular play, then constructs exploration, bigger-game hunting and river traps through real guarded commands while maintaining supplies. It grants no resources or levels and checks the new trip/crew contracts. Work, lifetime Organization and Craft are distinct scaling axes; no enjoyment or target pacing range is asserted.

Version 0.6 opening observations (no timing target): active-balanced 3105s, active-organization 3100s, regular 3720s. The route-buyable scenario enters after legal play at 3325s/3940s and completes all three improvements by 3340s/4000s for active/regular. These replace earlier completion timings tied to retired investment checkpoints. Matched rough/fixed calibration still requires equal action counts and checkpoint coverage with at most 15 seconds drift.

The earthenware-jar scenario resumes each legally reached opening checkpoint and uses actual guarded construction while the active/regular policy maintains the settlement. It adds no Craft or storage. A jar purchase completes within 225 additional active seconds or 900 regular seconds in the current synthetic observation. The cost is fixed at 1 Craft; work retains its existing 12 × 1.35^owned scaling. This scenario is separate from the unchanged opening ending, so the extra time is not a campaign completion estimate.

Abundance growth uses separate reserve/housing curves described in [the design](civilization.md#abundance-growth-curves). The legal recovery scenario reaches Organization 10, pauses auto-building, cancels current construction, disables Food orders and waits for actual starvation to one survivor. It then restores the four already-owned repeat orders once and makes no further decisions. Active and regular reached states both recover from 1 to 50 in 84 simulated seconds, peaking at 10x; the previous 12s/person rate would require at least 588 supported seconds before any pauses. No supplies, population, housing or unlocks are granted. This is synthetic recovery evidence, not a player-enjoyment measurement.

With abundance, the current legal opening times are active-balanced 1445s, active-organization 1535s and regular 1660s. The route scenario enters at 1550s/1760s and completes by 1565s/1820s; earned auto-building can complete jar storage within another 65s/600s after the opening. These supersede earlier source-specific observations. The jar scenario now counts real earned automatic construction as well as direct starts: faster recovery can complete the jars before a regular 300-second check, so requiring a redundant manual start would misclassify a completed purchase. The policy and 20s/300s cadence are unchanged. Rough/fixed coverage, action equality and the existing 15-second drift bound remain required.
