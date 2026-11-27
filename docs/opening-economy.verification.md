# Opening economy simplification verification

Owner request: remove domestic work, price every Food basket at 1 Craft, and hide/stop Money and Time. The owner explicitly selected **Keep locked for now**: no unlock condition is invented. No merge, deployment, service activation or milestone acceptance follows. The existing manual dev command is left unstarted.

PR #9 source `ba536611a1026776e8a7e34d477214c69727057d`; actual base `main` at `32a9f1841855eeca0cf1358d5e459d5d30d982a2`. Work branch `codex/opening-economy-simplification`, isolated checkout `prestige-opening-simplify`. Installed branch-writer fence 2714 covers this work, bounded publication to `codex/civ-resource-opening`, and a fast-forward of the clean manual-run `codex/dev-watch` checkout. Default-off development coordination remains off.

## Delivered behavior

- All population is available for crews, the keeper and construction. Domestic work is removed from dispatch eligibility, the labor ledger, shortage release, prestige budget, save validation and UI. The home-improvement buyable and auto-builder choice are removed. Shared hearths retains its 25 Food storage benefit.
- Food baskets cost exactly 1 Craft at every level plus their existing scaling work. Payment is guarded and occurs once at start, with the existing no-refund cancellation/prestige rule. Completed baskets still add 40 storage. Auto-building skips baskets it cannot afford.
- The opening contains only Food, Water, Shelter, Craft and Organization. Money/Time generation and automatic discovery are removed. `resourceAvailable()` also hides and prevents selection of later branches and rejects new later-resource purchases/investments. Existing saved flags cannot bypass these guards. New Food autonomy/Automatic sluice purchases await future resources; owned effects remain.
- Version 0.6 migrates pre-0.6 unlock flags off, returns hidden tabs to Food, and clears retired home-improvement construction while releasing its builder. Existing balances, owned upgrades, historical comfort counts, other projects, routes and active crew snapshots remain. Current Food basket construction resumes without retroactive or duplicate charges. There is one current economy and codec, with no alternate legacy runtime.

## Outcome and verification

Starting from a fresh settlement, the player sees five available workers and five tree nodes, no domestic UI or home-improvement action, and an unaffordable Food basket until Craft is available. Two successive basket purchases each debit 1 Craft, finish normally and increase storage. Shelter shows housing only. Current and earlier synthetic saves prove preservation and safe normalization.

Automated checks: build/package/template compilation, syntax, full-graph lexical/checked JavaScript and negative static sensitivity; 72 rule/save/runtime/balance tests; actual prestige mutation sensitivity; 17 Chromium journeys. The final complete npm test run is recorded in PR evidence. The earlier browser overbooking fixture was corrected from eight to seven people because removing domestic work now makes a crew totaling eight workers legal; its rejection/completion/release assertions are retained.

Rendered synthetic 1280px/320px Shelter views were inspected: only five nodes, no domestic entry, no horizontal overflow, no page errors. The header now reads the actual mod version instead of a stale hard-coded version. Actual users, assistive technology and other browsers remain unverified. No manual dev watcher/server was started.

Legal fresh opening observations: active-balanced 3105s; active-organization 3100s; regular 3720s. Every run reaches all ten Organization milestones, overseer, gravity-fed Water and staffed farming. Regular manual checks remain 20 seconds until earned automation, then 300 seconds. A legally reached checkpoint sustains ten idle minutes. A separate 300-second post-opening check verifies that later currencies remain locked and zero, and Food remains staffed. The Food-route scenario enters at 3325s/3940s and completes by 3340s/4000s for active/regular. No timing/enjoyment target was supplied.

The old Money/Time, Education/Culture and investment completion checkpoints and Food-autonomy reachability assertion were retired with the owner-requested lock. The new ending is the staffed opening, not a claim that unavailable content is reachable. Existing matched rough/fixed calibration retains equal checkpoint coverage/actions and the same 15-second drift bound.

| Requirement | Code / proof | Result |
| --- | --- | --- |
| All-person labor, accurate shortages/prestige | occupiedWorkers, releaseUnavailableWorkers, prestigePreview, validateData; revised exact crew fixtures | Satisfied |
| Fixed Craft basket cost and safe failures | projects/canStartProject/startProject; denied, repeated, completed and saved purchases | Satisfied |
| Hidden/no-generation later resources | resourceAvailable, summary/node, guarded select and purchases; fresh/old flags and post-opening rules/browser assertions | Satisfied |
| No-legacy/data preservation | 0.6 ingress normalization; balance/count preservation, old/new basket round trips, unchanged storage key | Satisfied |
| RC-01/02/06/08 discoverability | README -> developer guide -> civilization resourceAvailable/occupiedWorkers/projects -> opening-economy tests | Satisfied |
| RC-03/04/05/07 ownership and focused proof | One session-owned rule owner, canonical codec, derived UI; failure/recall/keeper/paused-construction and sensitivity checks | Satisfied |
| Local balance/content/rendered requirements | Revised legal policies/checkpoints and actual packaged Chromium; stated limits above | Satisfied within stated scope |
| TS/React supplements, external permissions/financial services | No such changes | Not applicable |

All changed code paths were inspected: economy/version/view/HTML; balance policy and checkpoint catalog; new opening-economy rules and affected save/crew/survival/prestige/balance fixtures; browser costs, visibility and workforce checks; README, design, developer and balance owners. Generated assets and personal saves are excluded. Historical verification files remain evidence only for their recorded revisions.

## Instruction evidence

Current Orcha main was fetched and re-resolved at `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`; standards_resolver verified the same previously read current feature snapshot. Governing project main is `32a9f1841855eeca0cf1358d5e459d5d30d982a2`; the selected continuation is `ba536611a1026776e8a7e34d477214c69727057d`. The current AGENTS main-source correction and explicit PR identity take precedence over the retained stale master registry/manifest value. Prior applicable instruction bytes are reused only after hash/revision verification; no project pin or new standards adoption is required.

| Source | Document | SHA-256 |
| --- | --- | --- |
| Orcha `cc45f3c` | `docs/agent-workflows/intent-routing.md` | `3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed` |
| Orcha `cc45f3c` | `docs/agent-workflows/feature.md` | `52279cc4869aa56c9a40efe7c2e136177feb807053783039c3c4e7dfa95170b3` |
| Orcha `cc45f3c` | `docs/standards/no-legacy-modes.md` | `913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156` |
| Orcha `cc45f3c` | `docs/standards/readable-code.md` | `fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e` |
| Prestige `ba53661` | `AGENTS.md` | `aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6` |
| Prestige `ba53661` | `.orcha/repository.json` | `d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585` |
| Prestige `ba53661` | `README.md` | `720284b404bb9998f356b35d9ed02fb47abd8d87c48cfd120422be7129fc0640` |
| Prestige `ba53661` | `docs/developer-guide.md` | `4fe19df58574a5ecc6cc39f2934b2c63393dae66283604f9901046d07e4e87b3` |
| Prestige `ba53661` | `docs/!general-info.md` | `06420ab8ce5eb231928fd93aa17552580840128039f6e6d1fe5a4614ecf1570e` |
| Prestige `ba53661` | `docs/civilization.md` | `ff8f3b963527e928b10a36874865c515f0d67dba354eaea91408207d24c6e6f4` |
| Prestige `ba53661` | `docs/balance-testing.md` | `7f7a436620310431217100f1a120ad3ad9ada2004771f55d07270e73fb5c7529` |
