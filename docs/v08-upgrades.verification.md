# v0.8 upgrade and save verification

Source: `step3software/Prestige-Tree` main at `8333e6d535cad36361f261e8005861cfde6ed5c1`. Work branch `codex/v08-upgrades`, dedicated worktree `prestige-v08-upgrades`, exclusive writer fence 2719. Publication targets **main directly**, not the closed PR 9 branch. The manifest's historical master entry is unchanged; current AGENTS and the owner's explicit main request govern this work.

The missing PR 11 work was carried onto this main-based branch from `167f816a76ebb60eab3842b1149ffb4485be3642`: finite Food/hut queues, Population-based Organization, Food-only Shared hearths, the dedicated Overseer/foreman and removal of the automatic Craft production bonus. The prior stacked PR had merged into its parent branch after the parent was merged, so those changes were absent from published main. No main/upstream branch, service or user save was modified by this task.

## Requested behavior

| Requirement | Implementation and verification | Result |
| --- | --- | --- |
| v0.8 | Canonical mod version and browser header; previous-save startup through the registered codec | Passed |
| Abundance is a Shelter upgrade at Organization 1 with no Craft cost | `abundance` costs no resources, remains unavailable below one lifetime Organization, and is a free one-time purchase afterward | Passed |
| Growth gated by ownership | Normal growth before purchase, all three bonuses zero; purchased upgrade activates existing independent curves immediately and survives prestige | Passed |
| Expedition overseer at Organization 2 | One progression table drives visibility, command eligibility and milestone text; below/at gate and exact unchanged costs tested | Passed |
| Remove Fishing nets / Well lining / Water keeper | No current upgrade definitions or effects; new Fish trips use two workers, no Water lining multiplier; browser controls absent | Passed |
| Generic Upgrade terminology | Current UI headings, milestone rewards, README and owning guides use Upgrade instead of Craft upgrade | Passed |
| Preserve earlier work | Finite counters decrement only on successful automatic starts, stop at zero, retain active snapshots and reject blocked starts; Craft balance has no passive production effect | Passed |
| Accept older saves | Actual v0.6/v0.7 codec exports load through both rules and real browser startup, with retained stocks, crews, rewards, construction and counters | Passed |

Free Abundance requires clicking its purchase button once after milestone 1; it does not spend Food, Water, Craft or Organization. Before purchase, the UI explains its unlock and hides the active bonus breakdown. The curve weights/ranges, base 12 seconds per person and maximum 10x were not retuned. Fishing nets and Well lining flags are validated and removed once before typed hydration. Stored resources remain unchanged. Active reduced fishing crews and old reward snapshots finish intact; new dispatches use current rules. Historical Water keeper ownership maps to Hut foreman through the existing pre-0.7 conversion; there is no Water repeat control or alternate runtime.

## Checks and balance

Complete local `npm test` passed: build/package and three actual template compilations, syntax, checked JavaScript and negative sensitivity, **111 rule/save/runtime/balance tests**, real prestige mutation sensitivity and **25 Chromium journeys**. `git diff --check` and UTF-8 verification passed. Actual 1280px/320px Abundance views were inspected; keyboard controls, free purchase, generic labels and removed controls are exercised in Chromium. Actual-user, assistive-technology and other-browser behavior remain unverified.

`tests/fixtures/civ-v08-migration.json` contains synthetic saves exported by the actual codec at main `8333e6d...` (v0.6) and prior feature `167f816...` (v0.7). The v0.6 input owns the retired upgrades and has active fishing/water jobs plus paid jar construction. The v0.7 input has a running Food job and four remaining repeats. These are generated test inputs, not user saves. Rule tests compare stored values/snapshots, prove reload does not consume another repeat and reject malformed retired flags without replacing live state. Both exports also start successfully through the actual browser storage/load path with a v0.8 header and no recovery screen.

| Legal policy | Published main | v0.8 | Difference |
| --- | ---: | ---: | ---: |
| Active balanced | 1445s | 1875s | +29.76% |
| Active Organization first | 1535s | 1850s | +20.52% |
| Regular | 1660s | 2140s | +28.92% |

The baseline is the published main economy; v0.8 includes all carried PR 11 changes as well as the new upgrade changes. These are delivered-policy comparisons, not an isolated coefficient experiment or a human pacing target. All ten Organization milestones, Food orders, gravity flow and farming remain reachable. Fixed/rough coverage and action counts match within the existing 15-second observation bound. Legal five-repeat Food/hut scenarios exhaust exactly to zero, including the no-sixth-hut guard. Food-route investments finish by 1265s/2180s and an additional paid jar within 55s/300s after the opening for active/regular play.

The earned Organization-10 checkpoint can initially retain crews using all five founders, so a normal 20-second check first allows a crew to return before staffing the Overseer. From that staffed state it survives ten idle minutes. The actual-starvation scenario uses one manual Gather and then four queued Food orders; it reaches 50 people in 97 seconds, peaking at 7.99x. These staffing conditions are recorded rather than treating purchased automation as already enabled.

## Author review and provenance

Reviewed the cumulative main comparison, including carried code: `js/civilization.js`, mod version, save codec/wiring, component methods, HTML, balance policy, rule/browser fixtures and tests, README, design, developer/balance/research navigation and the dated verification records. README -> developer guide -> `buyUpgrade` / `upgradeRequirement` / `growthAbundance` / `migrateData` -> `v08-upgrades.test.cjs` and browser startup is the verified developer trace. No unresolved functional finding remains in this bounded change.

RC-01/02/06/08 map to those discoverable owners and consistent labels. RC-03/04/05 use the existing progression, command, derived state and detached codec owners without a new subsystem. RC-07 is supported by below/at gates, free-price checks, preserved snapshots, malformed ingress, zero-stop queues and runtime/chunk regressions. The no-legacy contract is met by one v0.8 model following ingress conversion. The user outcome is earning milestone 1, purchasing free Abundance, seeing actual growth activation, then finding Expedition overseer at milestone 2; failed/locked purchases and rejected imports preserve state.

Current Orcha main was freshly resolved as `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`; `standards_resolver` reverified the applicable feature catalog hashes. The current AGENTS, intent routing, feature workflow, README topic index, catalog, registry and applicable shared/local contracts were actually read or reused after exact unchanged hash verification. No version pin, separate adoption, merge or activation grant was introduced. The historical [shared-work verification](shared-work-orders.verification.md#standards-and-instruction-provenance) retains the common Orcha and project instruction hashes; current feature hashes are:

| Document | SHA-256 |
| --- | --- |
| Orcha intent routing | `3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed` |
| Orcha feature procedure | `52279cc4869aa56c9a40efe7c2e136177feb807053783039c3c4e7dfa95170b3` |
| Orcha readable code | `fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e` |
| Orcha no-legacy standard | `913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156` |
| Effective project AGENTS at source main | `aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6` |
| Source main manifest | `d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585` |
| Source main developer guide | `c0bf8df603f54e729b26cc84fa0f8009f70b296874244d6badd0017463510e70` |
| Source main documentation index | `06420ab8ce5eb231928fd93aa17552580840128039f6e6d1fe5a4614ecf1570e` |
