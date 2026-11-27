# Shared work orders verification

Owner scope: finite repeat counters and removal of the unrequested automatic Craft bonus, in addition to the original branch from PR 9; replace Shared hearths with Food bonuses only; keep Expedition overseer and add staffed 0-5 Food job sliders; replace Water keeper with similar hut construction; make Organization require Population; rebase on the latest PR 9 and check both changes together. Publication is authorized; merge, deployment and service activation are excluded.

Selected parent: PR 9, `codex/civ-resource-opening`, `0a7ecda8c23e53d7e2e860335c1a59f62291923b`. Initial source was `5a9bf7fc7577e5187e340e0c006aed0c0d0dae22`; the owner explicitly requested the later rebase. Governing project main is `32a9f1841855eeca0cf1358d5e459d5d30d982a2`. AGENTS still selects main while the retained manifest/registry says master; the explicit PR source and adopted AGENTS correction govern this task. No authority records were changed.

Branch/worktree: `codex/shared-hearths`, `prestige-shared-hearths`. Initial publication used writer fence 2717. This continuation starts at `82e2b9a904328892bb0c5b929a9f5fa9ff8892c1` with exclusive writer fence 2718; parent branches/other worktrees remain untouched. A separate detached latest-parent checkout supplied read-only balance measurements. Default-off coordination was not activated.

## Delivered behavior and proof

| Requirement | Owner and observable evidence | Result |
| --- | --- | --- |
| Food-only hearth bonus | `hearthBenefits` -> storage/supply -> actual economy step; whole-ten boundaries, real income, storage cap, shortage loss, prestige and old-stock tests | Passed |
| Staffed Food sliders | `setRepeat` -> manager ledger -> automatic dispatch; 0-5 guards, five sequential repeat credits, shared Overseer, blocked-start preservation and zero-stop checks | Passed |
| Repeating hut construction | `hutForeman`, `setHutRepeat`, project work/count snapshots; one builder pays each hut's escalating work, five queued starts exhaust to zero, general auto-build cannot bypass the queue | Passed |
| Organization uses people | Population threshold helper -> eligibility, preview and command; below/at/above, empty housing, spent points, exactly one reward and reset | Passed |
| No automatic Craft bonus | Holding, changing and spending Craft leave expedition yields and gravity flow unchanged; Craft-panel copy corrected | Passed |
| Combined abundance | Upstream settings/curves/birth reevaluation retained; hearth capacity feeds Food only, income cannot impersonate stored reserve; original eight abundance tests retained | Passed |
| Safe save cutover | v0.7 raw migration before typed hydration, then canonical validation; old Keeper ownership becomes Hut foreman; old trips become one-job batches; repeat orders pause if the new manager cannot fit | Passed |
| Deterministic runtime | Real registered session update, snapshots across save/reload, adverse shortage/staffing order, online/offline batch parity | Passed |
| Actual UI outcome | Native keyboard sliders, guarded purchases, live Food income and Organization requirement, desktop/320px reflow and page-error checks | Passed in Chromium |

Shared Hearths still costs 20 Food, 15 Water and 1 Craft. Its settlement-wide reward is +5 Food storage and +1 Food/min per full ten current people, without housing effects or extra labor. Existing Food above a smaller capacity survives for consumption. Hearth income supplements staffed expeditions.

Expedition overseer retains its Food identity, milestone 5 and cost (25 Food, 1 Craft, 1 Organization). Food orders share one dedicated Overseer. Hut foreman replaces Water keeper at milestone 4 with its 18 Food/1 Craft cost and reserves one foreman plus builders. Sliders specify 0-5 remaining repeats. Each successful automatic start dispatches one job and consumes exactly one credit. Busy routes, full stores, missing workers and blocked construction consume nothing. At zero no further job starts; active work finishes. General auto-build excludes huts so it cannot bypass that stop. Existing saved multi-job snapshots finish intact. All Food/hut targets switch off at prestige, releasing managers; protected snapshots still obey the five-person budget. Water stays manual until gravity flow. The inherited Craft 18% yield/flow rule originated in initial Civ commit `f5ead5d`; the owner explicitly requested its removal. Holding or spending Craft now has no production effect, and the UI no longer advertises that rule.

Migration runs on a detached candidate before hydration. It validates original worker commitments, preserves stocks/progress/rewards, maps the removed upgrade, disables old Water orders and translates Food Boolean orders to integer targets. If a new Overseer cannot fit, Food orders pause without recalling active crews. Current malformed/overbooked data fails before replacing live/durable state. There is one current model and no legacy runtime. A v0.7 save requires this version or later; older builds cannot import it. Export before switching artifacts if rollback is needed.

## Combined balance

| Policy | Latest PR 9 alone | Combined result | Change |
| --- | ---: | ---: | ---: |
| Active balanced | 1445s | 1625s | +12.46% |
| Active Organization first | 1535s | 1700s | +10.75% |
| Regular | 1660s | 1960s | +18.07% |

These are fresh legal simulations, not accepted pacing targets. The new policy uses Population goals and preserves three Craft before optional baskets; original PR 9 policy results are identified separately. The final policy replenishes finite repeat queues only at scheduled manual checks; it does not make them infinite. All ten Organization checkpoints, Food orders, worker-free Water and staffed farming remain reachable. Both active and regular legal scenarios exhaust five queued repeats on every Food route and build exactly five more huts without grants, then verify stopping at zero. Ten-minute idle survival and rough/fixed coverage/action equality within 15 seconds pass.

Actual starvation from an earned Organization-10 state reaches one survivor. One manual Gather first restores room for a dedicated Overseer; four Food orders can then be enabled once. Both reached states recover from 1 to 50 people in 93 seconds including that manual trip, peaking at 9.56x. No further decisions or state grants occur. [Balance guide](balance-testing.md#combined-work-orders-and-abundance-balance) records the policies and secondary scenarios.

Research was actually read: [USDA BARC Food Preparation](https://www.nal.usda.gov/exhibits/speccoll/exhibits/show/barc/what-did-people-do-here-/food-preparation) supports the communal-cooking interpretation, and the [GDC 2009 workshop, page 3](https://media.gdcvault.com/gdc09/slides/Handout.pdf) supplies a feedback-system lens. Neither establishes the game's coefficients. The [research guide](research/reference-guide.md#shared-hearths) separates evidence from design inference.

## Checks and author review

Verification: `npm test` passed package/build and three actual template compilations, syntax, lexical/checked JavaScript, negative static sensitivity, 105 rule/save/runtime/balance tests and real prestige-mutation sensitivity. The browser assertion was corrected to wait for the fifth job to finish after any storage delay; the complete `npm run test:browser` rerun passed 23 Chromium journeys. `git diff --check` and UTF-8 decoding passed. The final publication identifies the tested commit in the PR. No actual-user, assistive-technology, other-browser or optimal-strategy result is claimed.

Every changed path was inspected: rule owner; mod version; codec and save wiring; Vue command methods and HTML; legal balance policy; browser and rule/save/retention/shortage tests; README, design, developer/balance navigation and research notes. Historical upstream verification files remain scoped to their own revisions. Author trace: README -> developer guide -> `setRepeat` / `setHutRepeat` / `hearthBenefits` / Population requirement -> registered session step and codec -> focused tests. No unresolved functional finding in this bounded diff. Server/network/permissions architecture and unrelated frameworks are unchanged.

RC-01/02/06/08 are supported by that discoverable route and consistent names. RC-03/04/05 retain the existing state/command owners with explicit targets, snapshots, guarded effects and boundary validation. RC-07 is supported by executed adverse-order, malformed, staffing, repeat, migration and chunk tests. The no-legacy contract is supported by one v0.7 runtime after detached ingress conversion. Shared user-outcome evidence covers a player purchasing upgrades, operating named keyboard sliders, seeing actual income/staffing, rejecting unavailable commands and preserving progress after reload. Real-user usability remains unverified.

## Standards and instruction provenance

Current Orcha main freshly resolved for this task: `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`. `standards_resolver` verified feature/review selections against this exact catalog; additional coordination and parallel-development sections were actually read. The same published main was freshly resolved for this continuation and `standards_resolver` reverified the feature selection. Source instructions and applicable documents were loaded, not merely linked. No version pins/adoption records were introduced.

| Orcha document | SHA-256 |
| --- | --- |
| AGENTS.md | `6f832fe94b7a9b1a77560bf811bf6aef76da2567009db5e9d815a33f720d1888` |
| config/repositories.json | `18cf54987abcdec4b58089eaa6091fc636e94e2f18bfeec149fb836e9a782e86` |
| README.md | `847dab7c34dcee9a575ca90d5b50ac383b4fde239d97145fa79dd562be6d28e5` |
| standards/catalog.json | `5850f5eb70397db5dccede9b9dbbf5de27861a8cfcb8676cda6337b608532651` |
| docs/agent-workflows/intent-routing.md | `3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed` |
| docs/agent-workflows/feature.md | `52279cc4869aa56c9a40efe7c2e136177feb807053783039c3c4e7dfa95170b3` |
| docs/agent-workflows/review.md | `d0a6df1eb01857876d799cc1997dc3c021ec59e0b377fa207ae4187067d9c05b` |
| docs/standards/readable-code.md | `fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e` |
| docs/standards/no-legacy-modes.md | `913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156` |
| docs/pr-development-coordination.md | `939b59a53584e981798733a2292b3318f00d15ee01f230cb63a87f2eaf22bf0e` |
| docs/development-workflow.md | `efee35a23b01792973ac212ef21c304610baefa23bc21b1575e6670f25fa55b6` |

Governing main AGENTS/manifest hashes match the selected PR's unchanged copies. The selected latest-parent documents below were read at `0a7ecda8c23e53d7e2e860335c1a59f62291923b`; changed contracts are proposed by this feature branch.

| Project document | SHA-256 |
| --- | --- |
| AGENTS.md | `aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6` |
| .orcha/repository.json | `d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585` |
| README.md | `12a9506ce5046ac95ad6947a688c5624778b21592065396048849b3672c53afb` |
| docs/developer-guide.md | `c0bf8df603f54e729b26cc84fa0f8009f70b296874244d6badd0017463510e70` |
| docs/!general-info.md | `06420ab8ce5eb231928fd93aa17552580840128039f6e6d1fe5a4614ecf1570e` |
| docs/civilization.md | `c487e70c3bf6a5971a5ffc2a4af0d2152409d5232dff09df3d71f6ad82adf090` |
| docs/balance-testing.md | `840285a837e8be4956fb86abdba02c811f3f8d949a0f291dc84083f502742dcc` |
