# CIV01 implementation verification

## Result and source

The main page now runs Population with Food, Water, Shelter, Craft, Organization, Money, Time, Education and Culture. The inherited playable layers are removed. The retained engine owns sessions, timers, clocks, atomic save storage and recovery; the Civ owner supplies resource rules and validation.

Initial source was `0098433b8a18dedbabca8605d96cd40f3e995371`; the owner selected current main. During implementation main published its AGENTS correction and balance workflow. The isolated `codex/civ-resource-opening` branch was rebased onto `d7d260fa66b270aae228dec2183f4df9da508b5f`; content-specific balance policies/catalog/tests were adapted together. Orcha main `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78` supplied the actually read, resolver-verified shared contracts. [Evidence](CIV01.evidence.json) records document revisions/blob/SHA-256 hashes and tested working-byte identities.

## Checks actually performed

`npm test` passed on Windows with Node 24.22.1 and npm 11.19.1: static build/package identity, syntax, all 20 authored scripts' lexical contracts, checked-JavaScript boundaries and negative sensitivity cases, 24 economy/save/runtime/balance tests, a real-code Population-loss mutation, and 6 Chromium journeys. The package contains 30 local assets and no runtime CDN. `git diff --check` passed.

The first sandbox browser attempt could not connect to its loopback server. Chromium checks were rerun successfully outside the sandbox; this does not change application permissions or deploy a service. Locked dependencies were reused from the matching installed dependency tree after the offline npm cache was incomplete; no dependency versions changed.

| Accepted behavior | Implementation / verification evidence |
| --- | --- |
| Five people; distinct resource nodes; housing-limited growth | `civilization.test.cjs`: fresh game, independent support constraints; Chromium fresh game |
| Shared labor, production/upkeep, meaningful construction | Economy shared-budget and zero-stock recovery cases; Chromium real build controls |
| Both prestige orders and exact retention | Economy branch-order tests; Chromium preview, cancel, confirm and repeated-action rejection |
| Shortages recover without population death | Zero-stock labor-only projects restore supply and housing; no negative supply assertion |
| Money/Time and Education/Culture | Actual fresh-game strategy plus continuous legal balance policies; investments and resource effects |
| Save isolation and recovery | `civ-saves.test.cjs`: untouched ptr, round trip, malformed/foreign input, denied storage and corrupt startup; Chromium reload/dialog/rejected import |
| Runtime safety | `civ-runtime.test.cjs`: independent sessions, repeated loads, clock high-water mark, offline budget, disposal and fault-blocked writes |
| Keyboard and responsive UI | Chromium checks actual named controls at 1280, 768, 375 and 320 CSS pixels, no horizontal document overflow; reduced-motion preference; native dialog Escape/focus restoration |
| Applicable current-main balance contract | Native/VM parity; both active branch orders and five-minute regular play; legal actions; rough/fixed calibration; source-hashed CLI report |

## Balance observations

Question: can a fresh, legal strategy reach both first Education/Culture investments, and how does five-minute manual cadence change that opening? No intended timing target has been accepted.

`npm run balance -- --hours 4 --budget 15 --calibrate-minutes 60` completed the opening with no granted currency or unlocks. Active-balanced completed at 770 simulated seconds (12m50s): 26 construction starts, 4 prestige actions, 1 earned automation toggle and 2 investments. Five-minute regular completed at 1800 seconds (30m): 6 construction starts, 4 prestige actions, 1 earned automation toggle and 2 investments. The focused suite also completed the Organization-first active route at 770 seconds.

Matched 60-minute-horizon rough/fixed comparisons had identical reached checkpoint coverage; maximum observation drift was 0 seconds for active and 10 seconds for regular, within the declared 15-second observation bound. Runs stop at the opening completion predicate; they do not estimate later spacefaring/time-travel content. The separate 673-second test reaches Education/Culture *discovery*, not both investments, and is not confused with chapter completion.

`balance-results/` contains ignored synthetic saves and reports with actual engine/tool hashes. Reports should be regenerated from the delivered commit for a clean commit label. Earliest tested policy is not a proven optimum; simulated time is not computer runtime or measured human usability.

## Preservation and limits

The new mod/key is `civ-prestige-tree`. The original game's `ptr` bytes are neither read nor written; incompatible saves are rejected instead of guessed into the new resources. Original attribution and both licenses ship with the artifact. Earlier milestone documents remain historical evidence for their own revisions. No native lifecycle transition, merge, deployment or service activation is performed.

Chromium and synthetic coverage do not establish other browsers, assistive-technology behavior, operating-system clipboard integration, long-run numerical behavior or user satisfaction with balance. Screenshots were visually inspected at desktop and narrow widths. No universal accessibility or full-campaign completion claim is made.

Rollback uses the prior code/package artifact; neither game's saved data requires destructive conversion. The next useful action is owner play/review of the unmerged draft PR and tuning of initial balance coefficients from that feedback.
