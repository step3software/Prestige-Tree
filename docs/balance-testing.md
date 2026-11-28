# Balance testing with content development

Build balance coverage **in the same PR as each new or replaced section of game
content**. The planned content replacement should develop its checkpoints,
playable strategies and pacing tests together. Extend coverage as sections land.

The runner uses the shipped Civ session and resource rules. Its catalog follows supported population, Craft, all ten Organization milestones, Food repeat orders, worker-free Water and staffed farming. The current opening completion checkpoint requires held Organization 10, overseer, gravity flow, farming, Copper cooking pots and all three Fire buyable levels. Later resources are locked and hidden and are not opening checkpoints.

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

The default profiles are `active-balanced` (manual decisions every 5 seconds) and `regular` (every 20 seconds until Expedition overseer, Gravity-fed spring and milestone-10 auto-building are earned, then every 300 seconds only when passive Water sustains full housing). This opening cadence was requested by the owner because five-minute fresh checks could not sustain manual expeditions. `cadenceChanges` records the actual transition. `active-organization` reverses the early prestige priority. Policies dispatch real crews, buy equipment and automation, construct housing/storage, earn Craft/Organization and invest through the shipped guards. No resources, workers or unlocks are granted.

The default CLI remains bounded by 15 wall seconds per run. `--hours` is a simulated game-time horizon, not a claim that the opening takes that long. `--save` loads a codec-validated synthetic checkpoint and measures time since that input. Reports include actual source hashes, actions, layer unlocks, completion/censoring and rough/fixed calibration. `balance-results/` is ignored; its saves are generated synthetic inputs, not player data.

## Policies and sections

`sections.cjs` owns the current opening predicates. Craft and Organization are recorded independently; `endgame` requires all ten Organization milestones plus overseer, gravity flow and farming. It is a balance checkpoint, not the engine ending. The continuous legal test confirms Food remains staffed and later resources stay locked with zero balances after another 300 seconds.

`policy.cjs` uses one construction project at a time, restarts available expeditions, buys automation and enables separate repeat orders. It banks permanent knowledge before building one level of each current Craft equipment family. Removed base and Fire infrastructure purchases are absent. Domestic improvements and later-resource investments are outside the current opening. The observed best policy is not a proven optimum or actual-user timing. No manual choices occur between configured checks; batch jobs, construction and earned automation continue normally.

Policies exercise all ten Organization milestones through legal commands. First reach 12 Population for the opening Craft, then build toward the next Population-only Organization requirement while banking enough Craft for upgrades. Organization pays one point at `8 + 4 * held Organization` people; spending immediately lowers that requirement; Craft pays one at 12 people and another per two more. Both restart at five people with ten Food/Water. Policies buy survival upgrades and replenish Food queues to five uses at each scheduled manual check after resets; their shared Overseer counts in the same budget. They preserve three Craft before optional Food baskets to avoid repeatedly spending the bank needed to grow to the next Population threshold. Only exploration levels (7), bigger-game levels (8) and huts (10) retain their existing milestone protection; every Craft equipment level and price resets. Auto-building unlocks permanently when the held balance first reaches 10 Organization. Provisioning and farming tools still reset. Each opening completion must reach every Organization checkpoint and purchase farming; a shorter run cannot imply ten-milestone coverage. The active/regular policies also exercise the single initial Craft choice per node and the first three unlock gates.

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

The current Food buyable scenario reaches a funded settlement through ordinary active/regular play, then builds exploration, bigger-game hunting and another Copper sickle level through guarded commands. Exploration and bigger game require current Organization. Physical equipment pays scaling Craft and resets with prestige. The policy banks material knowledge and a complete equipment budget before purchasing the physical set, avoiding a reset during construction. No resources or levels are granted.

## Repeatable Craft equipment observations

At the recorded source candidate, active play reaches the existing opening checkpoint in 7470 game seconds and regular play in 8165. An additional jar completes within 20 seconds for both profiles. The later exploration/hunting/sickle scenario enters at 7475s/8200s and completes by 7505s/8260s. These are deterministic policy observations, not accepted pacing targets. Source hashes and current commands are recorded in [the Craft verification](craft-buyables.verification.md).

The two-hut/three-tender fixture still verifies hut-based Fire capacity and normal tending. Fuel stores, Improved hearths and Charcoal clamps are removed. Cooking and Shared hearths remain one-time Fire upgrades; Clay and Copper vessels are repeatable Craft equipment. Current migration, finite queues, shortages, prestige and rough/fixed calibration remain covered by the same engine/session checks. Fishing remains removed without compensation under its published source decision.

The following sections retain historical observations at their named revisions and do not describe current equipment, gates or pacing.

## Combined work orders and abundance balance

The v0.8 branch starts at current main `8333e6d535cad36361f261e8005861cfde6ed5c1`, carrying forward the missing PR 11 changes and the requested upgrade simplification. It gates the independent 1-10x abundance curves behind the free Shelter upgrade at Organization 1 and adds the population-scaled hearth bonus, staffed finite Food/hut repeat counters, Population-based Organization and removal of the automatic Craft yield/flow bonus. Fixed and rough runs cover every milestone; cadence remains 5s for active play and 20s/300s for regular play. No enjoyment or target-duration threshold has been accepted.

| Legal opening policy | Latest PR 9 alone | Combined changes | Difference |
| --- | ---: | ---: | ---: |
| Active balanced | 1445s | 1875s | +430s (+29.76%) |
| Active Organization first | 1535s | 1850s | +315s (+20.52%) |
| Regular | 1660s | 2140s | +480s (+28.92%) |

Each row is a fresh run of the actual rules. The baseline keeps PR 9's original policy; the new policy uses Population requirements and reserves three Craft before optional baskets, so the table measures delivered play paths rather than isolating a single coefficient. The final policy replenishes counters through real commands only at scheduled checks; it does not grant infinite repeats. All runs reach ten Organization milestones, repeat Food, worker-free Water and staffed farming. These are synthetic observations, not optimal or human pacing.

The Food-route scenario enters at 1230s/2120s and completes all three investments by 1265s/2180s for active/regular play. Earthenware storage is completed within another 55s/300s after the opening, counting earned automatic construction as well as direct purchases. After Organization 10, retained crews can initially occupy all five founders. Normal 20-second checks first let a crew return and enable the dedicated Overseer; from that staffed starting state, the reached checkpoint survives ten idle minutes and continues rebuilding. Rough/fixed action counts and checkpoint coverage match within the existing 15-second observation drift bound.

A legal scenario continues each reached opening checkpoint and queues exactly five repeats on each Food route in turn. It leaves the selected queue alone until the counter reaches zero and the fifth job finishes, maintaining other Food queues only at the normal manual cadence. The hut queue then builds exactly five more huts and remains stopped even with general auto-build on. All jobs use real crews/builders and guards; no resources or Population are granted. This verifies finite exhaustion, not continuous five-job batches.

The abundance recovery scenario disables orders and waits for actual starvation to one survivor in a legally reached settlement. A dedicated Overseer cannot share that one worker with a crew: one manual Gather first restores at least two people, then four earned Food orders are enabled once. Without further decisions, both active and regular reached states recover from 1 to 50 in 97 simulated seconds, including that manual trip, peaking at 7.99x. The old unbuffed minimum was 588s. This checks the staffing change together with abundance rather than assuming manager-free recovery.

## Shared hearths observations

A legal scenario purchases hearths, reaches ten people, then holds the settlement instead of prestiging and builds ordinary huts toward twenty. Active reaches ten by 255s and twenty by 300s; regular reaches ten by 300s and twenty by 360s. Both have positive Food/Water at twenty, with +10 storage and +2 Food/min. No workers, currencies or unlocks are granted.

At base upkeep the passive rate covers at most 10% of Food consumption; Organization's actual upkeep reduction increases that fraction. A base Gather route produces 36 Food/min versus +1 hearth Food/min at ten people. A basket still adds 40 capacity versus hearths' +5 at ten people. The old flat +25 capacity is matched at fifty people, trading some early burst buffer for recurring income. Price remains 20 Food, 15 Water and 1 Craft. Hearth income has no extra worker/tool/irrigation multiplier and never supplies housing.

Combined regression: the Food abundance curve uses hearth-adjusted capacity, while Water and Shelter contributions stay independent at a fixed population/progress state. Passive income cannot count as an already stored reserve or bypass the existing shortage/growth gate. Tests exercise actual threshold crossings, staffing losses, prestige resets, batch payouts, codec reloads and deterministic online/offline chunks. The economic interaction is verified; long-run strategy optimality and enjoyment remain unmeasured.

Finite queues are deliberately not unattended infinite production. The measured idle window and opening remain viable, but players must replenish counters for continued work. Craft balances, costs and active snapshots remain intact; changing a Craft balance does not alter new expedition yields or gravity flow.

The v0.8 policy purchases free Abundance at milestone 1 and can purchase Expedition overseer at milestone 2. Fishing retains two workers and Water has no Well lining multiplier. The runner uses those real guards and prices; no pacing coefficient was changed to compensate. The updated scenario times and save migration are recorded in [v0.8 verification](v08-upgrades.verification.md).

## Material and Fire section (v0.9)

The legal policy banks 10/20/30 Craft material unlocks, buys all three separate equipment tiers and constructs each Fire project. No progress/resource grants are used. Optional automatic storage is paused while saving the Fire construction budget. Material checkpoints and `fire-buyables` are recorded separately; current ending also requires Copper cooking pots and completed Fire levels. Active and regular use 5/20-second manual checks respectively until safe automation. The reduced spring generally requires regular hauling, so the observed prefix keeps its 20-second cadence; this is not five-minute idle survival evidence.

After rebasing onto permanent-milestone main, fixed active/regular runs finish at 7870/8210 game seconds; rough regular observes completion at 8215. All calibration checkpoints have matching coverage, with maximum drift 0s active / 5s regular. Exact final source hashes, observations and rough/fixed calibration belong in MAT01 verification; these are synthetic observations, not an accepted pacing target. Recovery tests now allow actual Water pressure and manual hauling rather than assuming an unlimited old spring. Full calibration uses a 240-minute horizon to include the new late material/Fire purchases.
