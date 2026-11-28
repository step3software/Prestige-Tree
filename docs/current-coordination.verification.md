# Current Coordination correction

## Reproduction and scope

The owner reported that spending Organization did not reduce the Population requirement. Main `177c57962bf89de1fa85e9e72e6dac0d73543f90` and the running local checkout still used lifetime totals in requirements and milestone gates. Previous chat guidance updated a prompt without changing that implementation.

Dedicated worktree `prestige-current-coordination`, branch `codex/current-coordination`, writer fence 2729. This correction changes the current game rule and its affected consumers; it does not implement Fire, Council, other unfinished milestone moves, merge a PR, or alter the separately running main checkout/server.

Before correction, the regression with lifetime total 50 and held balance 3 returned a 208-Population requirement instead of 20. Four focused regression cases failed on source main. After correction, a real Prepared materials purchase changes held 3 to 2 and the requirement 20 to 16; a Work rosters purchase changes held 3 to 0 and the requirement to 8. Earning again increases the requirement from the current balance, never from the historical total.

## Requirements and proof

| Requirement | Owning implementation / check | Result |
| --- | --- | --- |
| Requirement uses current balance | `organizationPopulationRequirement`: `8 + 4 * amount("organization")`; real spending and earning in rule tests and browser | Passed focused checks |
| Milestones use current balance | `organizationMilestones`, new feature/purchase/project/order/auto-building/irrigation guards, prospective retention; stale totals/flags cannot override them | Passed focused checks |
| Lifetime retained only as history | Player total unchanged by spending; UI separates held Coordination from historical earnings; prospective lifetime total is statistics only | Passed focused checks |
| Work remains safe across spending | Locked pending queues retain counts and release supervisors; active trips/paid construction finish; their definitions remain available internally while new starts obey current gates | Passed rules and save/reload |
| Bought upgrades remain bought | Existing ownership/effects remain; losing a milestone restricts its new access/purchases rather than deleting paid state | Passed regression suites |
| Live UI responds immediately | Chromium clicks actual Organization-priced upgrades and checks 20 -> 16 -> 8, milestone Active -> Locked, held balance and reload with lifetime 50 | Passed focused browser journey |

`tests/rules/current-coordination.test.cjs` owns the four direct regressions. Older activity tests now explicitly hold the Coordination their scenario requires. Old assertions that spending retained milestones were replaced with current-balance/reload assertions. Paid-work tests permit legitimate locked in-flight records instead of rejecting records made possible by spending; structural, staffing, cap and atomic malformed-input checks remain.

The public rendering route is README -> developer guide -> `js/civilization.js` decisions -> `js/components.js` commands -> `index.html`. UI text describes held Coordination, current requirements and paused queues. The same canonical state drives commands, preview, saved data and UI; no parallel lifetime runtime or new save schema was added.

## Validation and balance

Final complete `npm test` passed: build/package, actual Vue template compilation, syntax, lexical/type boundaries, static negative sensitivity, **125 rule/save/runtime/balance tests**, real prestige mutation sensitivity and **27 Chromium journeys**. `git diff --check` and fatal UTF-8 decoding passed. Focused lexical/type, rule and browser checks passed during correction. Current legal policies use held Organization for earning targets, retention and milestone checkpoints. Active/regular play reach the existing opening with ten held Organization in 3105s/3480s; first-three milestones remain 40s, 210s/240s and 345s/380s. These are synthetic observations, not human pacing targets. No yield, price, population-growth, construction or survival coefficients were tuned to compensate.

The running user checkout remains main until the owner integrates and pulls the fix. No personal save was accessed or modified, and no service was restarted or activated.

## Standards and source evidence

Current Orcha main was freshly verified as `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`; `standards_resolver` verified these Git-byte SHA-256 hashes for this correction:

| Document | SHA-256 |
| --- | --- |
| docs/pr-development-coordination.md | 939b59a53584e981798733a2292b3318f00d15ee01f230cb63a87f2eaf22bf0e |
| docs/agent-workflows/intent-routing.md | 3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed |
| docs/agent-workflows/fix.md | 5ccd0b047ab4f7afc906e3ab6a77c03eeda76b2f771ceb47322b4386e26c61c6 |
| docs/standards/no-legacy-modes.md | 913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156 |
| docs/standards/readable-code.md | fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e |

The current project AGENTS selects main despite the retained manifest/registry master entry. General RC-01/03/04/07/08 and the no-legacy-data rule map to the owner trace, shared decisions, preserved paid-state validation and focused failures followed by real rule/browser checks. Project instructions, documentation index and affected contracts were read at main `177c579`; their source hashes are recorded below. Actual-user, assistive-technology and other-browser behavior remains unverified.

```json
{
  "AGENTS.md": "aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6",
  ".orcha/repository.json": "d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585",
  "docs/!general-info.md": "06420ab8ce5eb231928fd93aa17552580840128039f6e6d1fe5a4614ecf1570e",
  "docs/developer-guide.md": "d67a2425a5367cfc421e8d108bb30c9aa7de96cc975a3482eee6a2048fd84ce4",
  "docs/civilization.md": "df013bb44d4ca713ea7b825c15ce022583188849c6e392e3b5afac1ac0c5f713",
  "docs/balance-testing.md": "1b33c64a4360e689bd9096d3ac2e7594ff7aa16693bcd977aa7721c4210eeb68"
}
```
