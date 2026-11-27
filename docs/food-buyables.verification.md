# Food buyables continuation verification

Owner request: continue PR #9 with distinct gathering, hunting and fishing buyables. This is a bounded feature, authorized directly in the current chat; no milestone acceptance, merge or deployment is inferred.

Implementation source: `e779a2d15dea28b137679a22e59ee88efbf7b5d0` on PR #9 (`codex/civ-resource-opening`), actual base `main` at `32a9f1841855eeca0cf1358d5e459d5d30d982a2`. Isolated task branch: `codex/food-route-buyables`. Exclusive installed `branch_writers` protection: fence 2710 for the task checkout and bounded PR-head publication. Default-off development coordination remains off.

## Behavior and preservation

- Gathering: Explore farther afield multiplies duration by 1.2 and yield by 1.5 per level; work starts at 14 and scales by 1.35.
- Hunting: Hunt bigger game multiplies crew by 1.5 with rounding at each tier and doubles yield; duration stays fixed. Minimum lifetime Organization is 1 + current level, without spending it. Work stays 14.
- Fishing: Weave river traps doubles yield with unchanged crew/duration. Craft cost starts at 1 and doubles; work stays 14. Payment occurs once at start and is not refunded by cancellation or lost construction at prestige.
- Existing saved route IDs/levels remain canonical. Active trips retain dispatch snapshots; paid construction cannot double-charge on resume. Previously started unpaid projects finish without retroactive costs. Prestige retention uses the same exact IDs and workforce safety checks.

## Verification and scope

User journey: a fresh Food panel explains distinct benefits, locked requirements and costs; earned lifetime Organization and sufficient Craft enable purchases; starting traps spends Craft and reserves a builder; completion updates the route and next cost. Browser fixtures are synthetic; legal pacing uses separately earned checkpoints.

Checks: package build and actual Vue template compilation; syntax; lexical/checked JavaScript; negative static/interface sensitivity; 63 rule/save/runtime/balance tests; real prestige mutation sensitivity; 16 Chromium journeys. The sandbox full command passed all non-browser stages but stalled at localhost serving; its owned process was stopped and Chromium was run outside the sandbox. Browser-only verification passed all 16 journeys. Final copy clarification received rebuild/package/syntax/static checks and focused route rules plus a fresh browser run.

Rendered 1280px and 320px Food screenshots were inspected. New controls wrap without page horizontal overflow; no page errors were reported. Existing theme and native components remain. Actual users, assistive technology, other browsers and enjoyment are unverified.

Legal pacing scenario: fresh play with the existing policy reaches the funded settlement without grants; active checks every 5 seconds, regular checks every 20 seconds. All three route projects then complete through real commands while supplies sustain at least eight people. Active entry 2335s / completion 2370s; regular entry 2820s / completion 2900s. No timing target was supplied. Full opening completion remains active-balanced 3490s, active-organization 3485s and regular 4200s; those default policies do not invest in route levels. The added bounded scenario supplies that coverage. Existing rough/fixed calibration matches checkpoint coverage/actions within its 15-second tolerance.

Inspected changed paths: canonical rules and cost/crew validation in `js/civilization.js`; actual buttons in `index.html`; fresh/reached scenarios and save/repeat regressions in the three changed rule test files and new `food-buyables.test.cjs`; browser journey and renamed prestige assertions; README/developer guide/design/balance documentation. No generated runtime assets are committed.

| Requirement | Implementation and evidence | Result |
| --- | --- | --- |
| Owner route tradeoffs | `actionDefinition`, `projects`; multi-level rule assertions and legal scenario | Satisfied |
| RC-01/02/06/08 discoverability | README -> developer guide -> projects/canStartProject/startProject -> actionDefinition -> focused Food tests | Satisfied |
| RC-03/04/05 ownership and invariants | Session-owned rules, shared UI/command eligibility, upfront guarded payment, scaled hunt validation | Satisfied |
| RC-07 failure and boundary checks | Unfunded/locked/repeated starts; per-tier rounding; unavailable repeat crews; current/prior saves and retained trips | Satisfied |
| No legacy modes / local save safety | Same route IDs, codec and current runtime; saved snapshots remain; no dual writer/schema | Satisfied |
| Local build/balance/rendered checks | Above commands, legal fresh scenario, actual packaged Chromium and screenshots | Satisfied within stated limits |
| Unrelated TS/React, new services or deployment | No such changes | Not applicable |

## Standards and source evidence

Current Orcha main observed by fresh fetch: `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`. `standards_resolver.workflow_context` verified the selected catalog documents against this exact revision; only current feature/readability/no-legacy modules applied. The review procedure and coordination control sections were additionally read for final inspection/publication. Governing project main retains older original-game material; PR #9 is the expressly selected authorized Civ replacement. Project AGENTS/main source correction governs the stale `master` value still retained in the manifest/registry; those authorities are not edited.

| Repository/ref | Document | SHA-256 |
| --- | --- | --- |
| Orcha main `cc45f3c` | `docs/agent-workflows/intent-routing.md` | `3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed` |
| Orcha main `cc45f3c` | `docs/agent-workflows/feature.md` | `52279cc4869aa56c9a40efe7c2e136177feb807053783039c3c4e7dfa95170b3` |
| Orcha main `cc45f3c` | `docs/standards/no-legacy-modes.md` | `913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156` |
| Orcha main `cc45f3c` | `docs/standards/readable-code.md` | `fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e` |
| Orcha main `cc45f3c` | `AGENTS.md` | `6f832fe94b7a9b1a77560bf811bf6aef76da2567009db5e9d815a33f720d1888` |
| Orcha main `cc45f3c` | `README.md` | `847dab7c34dcee9a575ca90d5b50ac383b4fde239d97145fa79dd562be6d28e5` |
| Orcha main `cc45f3c` | `standards/catalog.json` | `5850f5eb70397db5dccede9b9dbbf5de27861a8cfcb8676cda6337b608532651` |
| Orcha main `cc45f3c` | `config/repositories.json` | `18cf54987abcdec4b58089eaa6091fc636e94e2f18bfeec149fb836e9a782e86` |
| Orcha main `cc45f3c` | `docs/agent-workflows/review.md` | `d0a6df1eb01857876d799cc1997dc3c021ec59e0b377fa207ae4187067d9c05b` |
| Orcha main `cc45f3c` | `docs/pr-development-coordination.md` | `939b59a53584e981798733a2292b3318f00d15ee01f230cb63a87f2eaf22bf0e` |
| Orcha main `cc45f3c` | `docs/development-workflow.md` | `efee35a23b01792973ac212ef21c304610baefa23bc21b1575e6670f25fa55b6` |
| Prestige `32a9f18` | `AGENTS.md` | `aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6` |
| Prestige `32a9f18` | `.orcha/repository.json` | `d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585` |
| Prestige `32a9f18` | `docs/developer-guide.md` | `5da96954ae964146e30243c1205c2410ce4439696ee37c9a334aee497abaabd9` |
| Prestige `32a9f18` | `docs/!general-info.md` | `06420ab8ce5eb231928fd93aa17552580840128039f6e6d1fe5a4614ecf1570e` |
| Prestige `32a9f18` | `README.md` | `477f65d912dc2bcfb06b221c9a8493f3b7d0795001cecee9bd1f27e903b5332f` |
| Prestige `32a9f18` | `docs/balance-testing.md` | `e49592367acce3735dce22e8e837ed1ec69856585c2a1ee61e1fb2c7b14dac68` |
| Prestige `e779a2d` | `AGENTS.md` | `aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6` |
| Prestige `e779a2d` | `.orcha/repository.json` | `d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585` |
| Prestige `e779a2d` | `docs/developer-guide.md` | `22dd24516e89d652e02248ffba7ca605542604f09c2744986d5695a50dfa3d43` |
| Prestige `e779a2d` | `docs/!general-info.md` | `06420ab8ce5eb231928fd93aa17552580840128039f6e6d1fe5a4614ecf1570e` |
| Prestige `e779a2d` | `README.md` | `c77823fd9c5f0ebebb5d875eab69184ca25b49c1f0a898db69cde1d8a17fb43d` |
| Prestige `e779a2d` | `docs/balance-testing.md` | `19c4bd79e80d51753eeac58ceb6e2654bb5d600b080457570b65bea0b90c372f` |
| Prestige `e779a2d` | `docs/civilization.md` | `8b42acba6592b0541950a9217f6a70d35ff8225eb2563e72fc3b7f0b8a86d749` |

Changed source identities (final runtime bytes):

- `js/civilization.js`: `f05a254516ee60fe898dfe67f17a62cf60156cc6192d94b63df015abcd8497e6`
- `index.html`: `2d6145364caf624599a4d63af89a507b8ad0f387e29903c1af39827b6956d0eb`
