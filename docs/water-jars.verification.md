# Earthenware water-jar verification

Owner request: replace Expand the reservoir with crafted clay pots costing 1 Craft, keep work, and research a suitable early name that leaves room for later material improvements. Current choice: **Craft earthenware jars**. No later material costs, gates or automatic tiers are invented.

PR #9 continuation source `b2586f3d6eac89aafd1af9b04494d0f128e02b18`, actual base `main` at `32a9f1841855eeca0cf1358d5e459d5d30d982a2`. Work branch `codex/earthenware-water-jars`; dedicated checkout `prestige-water-jars`. Installed branch-writer fence 2715 protects edits, PR publication and a bounded fast-forward of the clean manual-run checkout. Default-off coordination is unchanged. The manual dev command remains unstarted.

## Research and design decision

- Actually read the project research index, reference guide and SMI-08; used the hash-verifying EPUB helper to search Smil/Scott and read Smil chapter 2 paragraphs 14–17 and 59. The source passages discuss early pottery, leather water containers and fired clay among some foragers. They support an early pottery capability without proving a universally first container.
- [Ashmolean ceramic classification](https://potweb.ashmolean.org/PotABCs1.html), read 2026-11-27: earthenware is lower-fired/porous; stoneware and porcelain involve different clay/firing capabilities. [Met object 32.150.51](https://www.metmuseum.org/art/collection/search/448695), read the same day: an unglazed earthenware jar stored/cooled liquids. Its 8th–10th century date is not presented as early pottery origin evidence.
- The name specifies a material, not a generic reservoir. Hand-shaped fired-clay jars need no asserted wheel/glaze/kiln unlock in this abstract opening. Sealing/glazing or higher-fired suitable clay bodies can be later Craft investments, with costs/effects still undecided. This is a game design direction, not a universal archaeological sequence. Research notes and navigation were updated in place; no book bytes or long quotations are copied into Git.

## Behavior and preservation

- Each purchase costs exactly 1 Craft up front and still reserves one builder for `12 * 1.35^owned` work. Completion still adds 40 Water capacity. Spending Craft does not bypass the work. Failed/busy starts cannot charge; existing no-refund cancellation rules remain visible.
- `water-storage`, `player.water.storage` and milestone ID `reservoir-records` stay stable. Displayed retention now says Earthenware jars / Water-storage records; the threshold remains 4 lifetime Organization. Current stored progress and in-flight projects load through the same codec and economy, without retroactive charges or a new save schema.
- Later upgrades can improve existing storage while retaining the same buyable identity/count. No material system or new historical progression is implemented.

## Checks and standards coverage

Complete local `npm test` passed: build/package/actual template compilation, syntax, lexical/checked JavaScript, static negative sensitivity, 75 rule/save/runtime/balance tests, actual prestige mutation sensitivity and 18 Chromium journeys. `read_sources.py verify` passed both EPUB hashes, all 15 indexed chapters and heading locations.

New rules check three consecutive jar purchases at fixed cost, exact retained work timing, builder reservation, capacity, unaffordable/duplicate starts, cancellation, already-started free work, paid work saved/reloaded without another charge and exact prestige retention. The browser verifies the actual guarded button, name, Craft debit, work delay, next work requirement and retention labels. Actual 1280px/320px Water views were inspected: readable cost/work, no page errors or horizontal overflow. No actual-user/assistive-technology/other-browser result is claimed.

Legal active and regular policies resume reached opening checkpoints without grants and craft storage within 225/900 additional simulated seconds. This post-opening scenario is not a new campaign-duration estimate. Opening completion remains active-balanced 3105s, active-organization 3100s, regular 3720s; rough/fixed coverage/action equality and the 15-second drift limit still pass. No pacing target is supplied.

| Requirement | Code / evidence | Result |
| --- | --- | --- |
| Thematic early material, bounded future direction | SMI-14, reference-guide Water-storage materials, museum sources with origin/use distinction | Satisfied |
| 1 Craft plus unchanged work/capacity | civilization projects -> canStartProject/startProject -> completeProject; multi-level rules and actual browser journey | Satisfied |
| Saved work and retention | Same stable IDs/counters; unpaid/paid round trips and milestone 4 test | Satisfied |
| RC-01/02/06/08 discoverability | README -> developer guide -> projects(water); research index -> material rationale -> source locators | Satisfied |
| RC-03/04/05/07 ownership, invariants and proof | Existing guarded payment/construction owner; no new persisted model; atomic failures/work timing/save/balance coverage | Satisfied |
| No-legacy standard | One current model; no schema/alternate path or retroactive charge | Satisfied |
| Unrelated frameworks, release and external spending | No such changes; draft remains unmerged | Not applicable |

All changed paths were inspected: canonical Water definition/retention names, page labels, rule and browser assertions, legal balance scenario, README/design/developer/balance owners and the three research navigation/note owners. Source contracts were read at the selected revision and current Orcha was resolved afresh. Prior instruction text was reused only after exact revision and hash verification.

## Reproducibility

Current Orcha main: `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`; governing project main: `32a9f1841855eeca0cf1358d5e459d5d30d982a2`; explicit selected PR source: `b2586f3d6eac89aafd1af9b04494d0f128e02b18`. standards_resolver verified all current feature/readability/no-legacy catalog documents below. No per-project standards pin or adoption was required. The retained stale master manifest/registry entry does not override the explicit PR and current AGENTS main-source correction.

| Source | Document | SHA-256 |
| --- | --- | --- |
| Orcha `cc45f3c` | `docs/agent-workflows/intent-routing.md` | `3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed` |
| Orcha `cc45f3c` | `docs/agent-workflows/feature.md` | `52279cc4869aa56c9a40efe7c2e136177feb807053783039c3c4e7dfa95170b3` |
| Orcha `cc45f3c` | `docs/standards/no-legacy-modes.md` | `913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156` |
| Orcha `cc45f3c` | `docs/standards/readable-code.md` | `fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e` |
| Prestige `b2586f3` | `AGENTS.md` | `aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6` |
| Prestige `b2586f3` | `.orcha/repository.json` | `d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585` |
| Prestige `b2586f3` | `README.md` | `8f80c58b7ac9ce3009f0cc5e65cc01bfc89b277a3b1d7d818d2cd6caacf94b49` |
| Prestige `b2586f3` | `docs/developer-guide.md` | `3197afbec05c4f4fcccefea893421e476d88af1a1485a4fde072b34a88068275` |
| Prestige `b2586f3` | `docs/civilization.md` | `5a742d5fd5adc5c6cd1784f06b1486d7942ba98dca81115cbebf489c40754fb5` |
| Prestige `b2586f3` | `docs/balance-testing.md` | `3ab4d844447261063ade7f16dfca8e21890d707efd50443200e91a7f743bf767` |
| Prestige `b2586f3` | `docs/research/README.md` | `0c4e7e37dadf88c74c955135f9bd18ae024df8db027fccc4c746ca0d5228f491` |
| Prestige `b2586f3` | `docs/research/reference-guide.md` | `6987e6478a022899d072886bdcebd72c4a8d4eda8344fa502dedea449223ffd1` |
| Prestige `b2586f3` | `docs/research/smil.md` | `08e15b2798c781f7bdff22ff6b6b527d609bad6763d61dc602482792db336826` |
| Prestige `b2586f3` | `docs/research/sources.json` | `0c636aa0e6353e05d761157e4977665dd2aca94a94a7be02bf0f055a0820f964` |
| Verified library EPUB | `smil` | `9dd0afcb6180aa2869e9bfbb6d76a37c42532fe0174a5dddeb312248a9201752` |
| Verified Smil chapter | `OPS/c10752_002.xhtml` | `a4d6434d42e5de3d54de4ebd4cd2fbae1b49ffeee1799cc6986f4af30b86e2cd` |
| Verified library EPUB | `scott` | `ad3aa7f4092b186596856c331371bb12ffdb4a28dd493a11d285e02f4215a0bd` |
