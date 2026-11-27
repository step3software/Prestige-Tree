# Balance testing with content development

Build balance coverage **in the same PR as each new or replaced section of game
content**. The planned content replacement should develop its checkpoints,
playable strategies and pacing tests together. Extend coverage as sections land.

The runner uses the shipped Civ session and resource rules. Its catalog follows 8 supported people, first Craft, first Organization, Money/Time, Education/Culture discovery, and the opening chapter's first Knowledge and Cultural influence investments. The final balance checkpoint covers this opening only; the game remains playable afterward and no future campaign duration is claimed.

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
   Preserve five-minute regular manual checks and explicitly describe the active
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
Active and five-minute regular: observed game time, stop reason, actions exercised:
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

The default profiles are `active-balanced` (manual decisions every 5 seconds) and `regular` (every 300 seconds). `active-organization` reverses the early prestige priority. All profiles construct real gathering grounds, collection sites and huts; earn Craft and Organization; enable auto-building only at 2 coordination; and invest through the content's affordability guards. No resources, workers or unlocks are granted.

The default CLI remains bounded by 15 wall seconds per run. `--hours` is a simulated game-time horizon, not a claim that the opening takes that long. `--save` loads a codec-validated synthetic checkpoint and measures time since that input. Reports include actual source hashes, actions, layer unlocks, completion/censoring and rough/fixed calibration. `balance-results/` is ignored; its saves are generated synthetic inputs, not player data.

## Policies and sections

`sections.cjs` owns resource checkpoint predicates. Craft and Organization are recorded independently; Money/Time and Education/Culture require both sibling resources. `endgame` is the balance runner's label for completing both opening investments, not the engine's end-of-game predicate. A legal continuous fresh run is needed before reporting opening completion. Future content must extend the catalog and policies together.

`policy.cjs` uses one construction project at a time, reaches a two-point Craft/Organization foundation, enables earned automatic building, and makes the first Education/Culture investments. The observed best of these policies is not a proven optimum or actual-user timing. Regular play makes no manual choices between its five-minute checks; existing production, construction and earned automation continue normally.

## Rough and fixed calibration

Civ already advances its economy internally in one-second steps. Fixed mode uses the selected outer step (default 5 seconds); rough mode coalesces engine/cache calls while retaining the exact manual decision cadence. Automatic checkpoint observation is capped to 5 seconds before 8 people and 15 seconds before Education/Culture discovery, then up to the selected maximum. Entry windows describe observation precision, not statistical uncertainty. Resources and decisions remain governed by actual content rules.

Compare active and regular modes over the same 60-minute horizon. The focused suite requires matching checkpoint coverage, matching action counts and at most 15 simulated seconds of checkpoint observation drift. That tolerance follows the explicit outer observation bound; it is not a balance target. No timing target for player satisfaction has been accepted. Investigate a differing transition or policy outcome rather than loosening tolerance to hide it.

```powershell
npm run balance -- --mode fixed --hours 4 --step 1 --profiles active-balanced,regular --calibrate-minutes 0
npm run test:balance
```

The focused suite checks native/VM parity through actual construction, growth and both prestige branches; isolated sessions/no persistence; five-minute manual cadence; both active prestige orders and regular completion; matched rough/fixed checkpoint observations; and validated checkpoint inputs. It runs in normal `npm test` CI. The smaller fixed reference is useful when changing numerical rules or automation. Long sweeps remain opt-in.

## Preservation and evidence

The old layer catalog, old challenge/mastery policies, inverse-cost forecasts and immutable original-game formula comparisons were retired because that content was intentionally replaced. The reusable engine loader, session isolation, codec, wall budget, reporting and checkpoint mechanisms remain. Save/runtime safety is exercised by the Civ-specific rules and browser suites; old `ptr` data is never read or modified. See [the save boundary contract](developer-guide.md#save-boundaries-and-recovery).

README -> developer guide -> this document -> `scripts/balance/run.cjs` -> `simulate.cjs` / `policy.cjs` -> `createGameSession` -> the actual civilization rules. The verification record reports measured synthetic results and unmeasured limits separately.
