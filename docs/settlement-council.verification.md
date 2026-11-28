# Settlement Council verification

Owner scope: implement Organization milestone 9, integrate the supplied progression,
preserve earlier unfinished features and other writers, publish an unmerged draft.
PR #17 was already merged. The isolated `codex/settlement-council` branch starts
from its descendants, including Timber frames, and was rebased onto research main
`280caf5`. No Council branch/draft existed at initial observation. Other worktrees
were left intact. Native delivery milestone authority remains unchanged.

The owner confirmed that Council reserves 1–5 actual workers and may suspend its
staffing to preserve existing work or leave a recovery worker. Configuration and
queues survive suspension; no currency, upgrade, cost or passive bonus was added.

## Scope and preparation

The bounded feature route uses existing canonical owners, without a new subsystem:
`js/civilization.js` owns lifetime unlock, worker-limit helper, atomic commands,
labor reservation and detached save validation. `js/components.js` and `index.html`
derive the UI. Existing typed codec defaults supply missing scale 1. Focused rules,
the browser journey, balance policy/catalog and owning documentation complete the
scope. Necessary inherited assertions were reconciled for the lifetime exception;
Timber frames and every exact buyable-retention threshold retain peak-held rules.
The existing Water balance scenario now waits through a whole completion boundary
before measuring passive drawdown; an unfinished fractional-time haul must not
mask the result. This changes verification only.

Current Orcha main and document hashes were verified through `standards_resolver`;
the exact source, catalog, local contracts and final source hashes are recorded in
[evidence](settlement-council.evidence.json). The installed fenced writer protocol
protected this exact branch/checkout through development and publication. No
default-off coordinator, service or automation was activated.

## Requirements and evidence

| Requirement | Implementation / verification | Result |
| --- | --- | --- |
| Nine lifetime Organization; automatic unlock after spending/reset | `councilAvailable`, milestone presentation; Council and coordination rule suites | Passed, synthetic |
| Integer scale 1–5; 5/10/15/20/25 limits | One `workerLimit` used by staffing commands, summary/UI ranges and detached save validation; all-scale rule loop and keyboard journey | Passed |
| Actual workers, independent Food/Hut staffing, ownership retained | `occupiedWorkers`, existing order staffing and command guards; ledger assertions with Council + Food + huts + tenders | Passed |
| Five repeats per supervisor; 125 maximum at 25 | Existing `repeatCap`, repeat command/save guards; exact exhaustion with no extra job and mid-queue reload | Passed |
| Safe reduction and explanatory recovery | `councilScaleProblem` enumerates assignments and orders; rejected command snapshot equality; rendered rejection/restored selector, then lower queues/staff/scale | Passed |
| Active snapshots and paid work preserved | Reduction/save/suspension tests; old loaded work keeps crews, progress and rewards | Passed |
| Suspension, prestige restart and solo recovery | Council reservation yields after existing work; scale/queues retained; real one-survivor dispatch and both prestige boundaries in regression suites | Passed |
| One current save model; old default, malformed/locked atomic rejection | Typed hydration adds scale 1; current validation checks scale, ownership, limits and repeats; failed import leaves live export identical | Passed |
| Exclude Council itself and non-worker multipliers | Council range remains 1–5; expedition/Cooking remain 1–5 and snapshots unchanged | Passed |
| Progression integration | Farming 6, Abundance 7, Irrigation 8, Council 9; unchanged earlier Craft/hunting work and exact retention thresholds | Passed |
| Keyboard, readable controls and narrow reflow | Chromium native Home/End/arrows, visible live status, 1280/320 screenshots, no horizontal overflow | Passed, rendered/automated |
| RC-01–RC-08 and local owner/state boundaries | README -> developer guide -> Council contract -> canonical helpers -> focused tests; all changed source/docs/tests inspected; package/static/sensitivity checks | Passed within changed scope |
| Real-user usability / installed production performance | No human study, production activation or performance claim requested | Not run; not a delivery claim |

The player journey begins with earned Council, Work rosters and available labor:
raise Worker scale, assign Food and Hut supervisors independently, queue 125
repeats, allocate tenders, save/reload, attempt an unsafe reduction, then follow the
message to lower queues/staffing and return to 1×. The visible ledger charges
every reserved worker. A second journey demonstrates suspended staffing and
rejected locked imports preserving active work and the current save.

## Checks and balance

Package build/integrity and template compilation, shipped syntax, JavaScript
static boundaries, static sensitivity, prestige mutation sensitivity, rule/save/
runtime/balance checks and all Chromium journeys were executed. Browser checks
used the identical static package on isolated loopback port 4189 because 4173
was occupied by other local work. The repository's paused-clock helper in the Council and Fire journeys keeps
reload assertions independent of real wall-time advancement. Desktop/narrow
screenshots were inspected; the Council slider uses the existing block controls
layout so its label stays separate from the heading.

Local results: all 35 Chromium journeys passed. The final broad rule run passed
169/170 cases; the remaining policy case hit its existing 15-second host wall
budget under concurrent local load, then passed unchanged in isolation for all
three policies. The final eight-case Council suite, including the added locked
Fire import guard, and the 36-case Council/Fire/material boundary run passed.
No test time budget was widened. These runs cover all 171 current rule cases;
the published PR's CI supplies the clean-host full-suite result for its exact head.

Legal fresh-game active/regular policies reach Council at 865/940 game seconds,
raise scale through real commands at 985/1060 seconds, and complete the current
opening at 7,425/7,790 fixed seconds (rough regular: 7,795). Both make two
successful Council scale increases. Matched four-hour rough/fixed calibration
has no coverage mismatches, with maximum checkpoint drift 0s active / 5s regular.
Regular play still needs 20-second hauling checks. These are synthetic policy
observations, not human pacing targets or five-minute idle survival claims.

The isolated 125-repeat section grants MS8, nine lifetime Organization, rosters,
40 people, eight huts and stocked purchased storage. It skips the prefix and
tests capacity/exhaustion over 1,400 seconds. Both 5/20-second check cadences have
identical final saves for 1s/5s advancement and a reload at 700 seconds. Exactly
125 jobs complete, the queue reaches zero, supervisors release, Population stays
40 and no additional job starts. Fresh-game runs independently establish legal
reachability. Full source/tool hashes and compact run summaries are in evidence.

The review covers all changed application, balance, test and documentation paths;
no confirmed in-scope defect remains after corrections and verification. Preserved
research changes are parent history, outside this feature diff. Unfinished earlier
features, additional Council mechanics, merging and deployment remain excluded.
