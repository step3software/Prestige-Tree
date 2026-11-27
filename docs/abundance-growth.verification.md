# Abundance growth verification

Owner request: make starvation recovery with surplus housing faster and less manual. Food, Water and Shelter must contribute independently, with separately tunable curves and an approximately 10x maximum. Interpret zero as zero additional bonus, preserving ordinary growth; supply and housing eligibility still pause it.

Continuation source `5a9bf7fc7577e5187e340e0c006aed0c0d0dae22`; actual PR #9 base/main `32a9f1841855eeca0cf1358d5e459d5d30d982a2`. Dedicated worktree `prestige-abundance-growth`, branch `codex/abundance-growth`. Installed writer fence 2716 covers the task, PR publication and bounded fast-forward of the clean manual-run checkout. Default-off coordination remains unchanged. No dev watcher is started.

## Curves and ownership

`js/civilization.js` owns frozen `growthSettings`, `abundanceCurve`, `growthAbundance` and `advanceGrowth`. Normalize each input to x in [0,1], shape with its own exponent p, then smoothstep: u=x^p; score=u*u*(3-2*u). Current p=1. Flat ends avoid abrupt acceleration/deceleration. Independent weights and input ranges allow later tuning without new persisted state.

Growth multiplier = 1 + Food bonus + Water bonus + Shelter bonus. Each current maximum bonus is 3; total ranges from 1x to 10x. Food at its zero point cannot suppress Water or Shelter bonuses. The existing minimum reserve and housing limits still control whether growth actually runs.

For each supply independently, R is 60 seconds of actual current upkeep, including Organization/Culture reductions. Score is zero through stock R, full at R+0.9*(capacity-R), clamped above. Capacity <= R gives zero, including when full, without division by zero. Capacity and stock use that resource's own values; expected expedition yields are not counted. At population 5 with ordinary upkeep and capacity 50, zero is 5 units, midpoint 25.25 gives +150%, full is 45.5 units (+300%).

Shelter uses unbuffed time to fill remaining housing: max(0,housing-population-partialGrowth)*12 seconds. Zero at <=60 seconds, full at >=300 seconds, midpoint 180 seconds gives +150%. With no fractional progress this is 5 through 25 vacant places. Baseline time prevents a circular dependence on the Food/Water bonuses. Every simulation second and birth boundary re-evaluates inputs and eligibility; high future weights may produce multiple births per second without exceeding housing or leaving progress >=1. Ineligible elapsed time is not banked.

The baseline remains 12 seconds/person. The existing fractional progress field, codec and v0.6 format remain canonical. No buff counters, save flags, migration or alternate runtime mode are introduced. UI derives the multiplier and a native expandable breakdown directly from the rules; it shows paused growth where appropriate.

## Verification

Final complete `npm test` passed: package/build (33 assets, Vue 3.5.46), three real template compilations, syntax checks, lexical/checked-JavaScript contracts, negative static sensitivity, **84 rule/save/runtime/balance tests**, real prestige mutation sensitivity and **19 Chromium journeys**. `git diff --check` passed. No production balance-policy change was needed.

Eight focused abundance tests cover independent contributions, curve sample points, actual-upkeep threshold, small capacity, partial growth, 12-second baseline/10x growth, shortage/housing gates and online/offline chunk/save-load parity. A source-only in-memory tuning experiment raises weights to produce 28x, confirming multiple births per simulation second, valid saved progress and stopping at housing. Production weights remain 3 each.

A legal active-balanced and regular recovery scenario reaches Organization 10 from fresh play, pauses the earned auto-builder, cancels construction, recalls/disables Food routes, then waits for actual starvation to one survivor. It grants no resources, population or housing. Both have 50 earned housing places. Restoring four earned repeat orders once recovers **1 to 50 in 84 simulated seconds**, peak 10x, with positive Food/Water on completion and no subsequent manual decisions. The old unbuffed lower bound is 588 seconds for those 49 births. This measures synthetic recovery, not actual-user enjoyment.

Fresh opening completion is now active-balanced 1445s, active-organization 1535s and regular 1660s. The Food-route scenario enters at 1550s/1760s and completes at 1565s/1820s for active/regular. Earned auto-building completes an additional jar within 65s/600s after its checkpoint. All ten Organization milestones, staffed farming, idle-ten-minute survival and rough/fixed action/coverage equality with <=15s drift still pass. These observations supersede older timing figures for this source.

Faster growth exposed two timing assumptions in existing tests. The Water Keeper test now proves the keeper stays reserved between trips, then empties Water and checks a new active carrier instead of requiring an active trip at one arbitrary second. The legal jar test accepts completion by the already earned auto-builder rather than insisting on a manual start after that completion. Both still assert real costs/work outcomes; no policy cadence or grants were altered.

The actual Chromium abundance journey verifies 10x, independent Food dropping to zero bonus while Water/Shelter retain 7x, shortage pause and ten births in twelve seconds. Actual screenshots `test-results/abundance-1280.png` and `test-results/abundance-320.png` were visually inspected: expanded details remain readable and contain the intended separate values; no horizontal overflow or browser errors. Screenshots are generated test artifacts, not committed assets. Other browsers, assistive technology and actual-user results remain unverified.

## Standards mapping and provenance

| Requirement | Implementation / verification | Result |
| --- | --- | --- |
| Independent flexible abundance and bounded recovery | growthSettings -> growthAbundance -> supply -> advanceGrowth; independent boundary tests, legal recovery | Satisfied |
| Preserve survival, housing and valid saves | Existing eligibility; birth-boundary checks; tuned multi-birth, codec and online/offline parity tests | Satisfied |
| RC-01/02/06/08 readable developer route | README -> developer guide growth row -> named rules owner -> abundance-growth.test.cjs; formula and units in civilization design | Satisfied |
| RC-03/04/05/07 ownership, derived state and observable checks | Existing rules owner and native UI; no I/O in rules; focused tests plus full suite | Satisfied |
| No legacy modes | Existing canonical fractional progress; no schema change, new flags or parallel path | Satisfied |
| Protected publication and service boundary | Installed writer fence, dedicated checkout, draft PR continuation, dev command unstarted | Required through publication |
| Framework supplements and new persisted data migration | JavaScript/native Vue template only; no new saved fields | Not applicable |

Current Orcha main was resolved afresh at `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`. The complete feature procedure and selected catalog contracts were read; captured text was reused only after exact revision/hash verification. Project AGENTS, manifest, README/documentation index, developer, design and balance contracts were read at the selected source. Explicit PR identity and current AGENTS canonical-main correction govern over the retained stale master registry/manifest entry. No per-project standard pin/adoption is required. This task does not merge, deploy, accept a lifecycle milestone or activate coordination.

Hashes below identify instruction/contract bytes at the governing source revisions, before this task's edits.

| Source | Document | SHA-256 |
| --- | --- | --- |
| Orcha cc45f3c | `AGENTS.md` | `6f832fe94b7a9b1a77560bf811bf6aef76da2567009db5e9d815a33f720d1888` |
| Orcha cc45f3c | `README.md` | `847dab7c34dcee9a575ca90d5b50ac383b4fde239d97145fa79dd562be6d28e5` |
| Orcha cc45f3c | `config/repositories.json` | `18cf54987abcdec4b58089eaa6091fc636e94e2f18bfeec149fb836e9a782e86` |
| Orcha cc45f3c | `standards/catalog.json` | `5850f5eb70397db5dccede9b9dbbf5de27861a8cfcb8676cda6337b608532651` |
| Orcha cc45f3c | `docs/agent-workflows/intent-routing.md` | `3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed` |
| Orcha cc45f3c | `docs/agent-workflows/feature.md` | `52279cc4869aa56c9a40efe7c2e136177feb807053783039c3c4e7dfa95170b3` |
| Orcha cc45f3c | `docs/standards/no-legacy-modes.md` | `913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156` |
| Orcha cc45f3c | `docs/standards/readable-code.md` | `fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e` |
| Prestige 5a9bf7f | `AGENTS.md` | `aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6` |
| Prestige 5a9bf7f | `.orcha/repository.json` | `d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585` |
| Prestige 5a9bf7f | `README.md` | `fa2f25e408486f1ff6a6b57d54bed39c3d7fdedc79250e8bef9d345bd8ebc135` |
| Prestige 5a9bf7f | `docs/developer-guide.md` | `ba122faae9aeedd520d45dfe9ee7b4ae4349b7093652466ce66224037e92e9f9` |
| Prestige 5a9bf7f | `docs/!general-info.md` | `06420ab8ce5eb231928fd93aa17552580840128039f6e6d1fe5a4614ecf1570e` |
| Prestige 5a9bf7f | `docs/civilization.md` | `5c3daf725de8530bdb4352aed23f430029de083ed0f4c26cdfb4f272733c6eee` |
| Prestige 5a9bf7f | `docs/balance-testing.md` | `71b3da02755a4ac2a8a9cacb7b5fcc44c581f0392d713c9bf563f3b81f85c589` |
