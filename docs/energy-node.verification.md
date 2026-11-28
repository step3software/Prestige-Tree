# Energy node delivery evidence

User request: add a yellow Energy E at the left of Food in the top resource tier and put the existing Fire component on that node. Bounded feature delivery from Prestige Tree main `44c1814232dd495dec3912af87a710d0c3d65d68`, after merged material PR #17; rebased cleanly onto current main `280caf5edf6f20c9d5a30eda1b6c77c13b0de710`, including Timber frames PR #18 and research PR #13. Dedicated branch `codex/energy-tab`, installed isolated writer fence 2735. No milestone enrollment, merge, deployment or service activation.

## Outcome and review

The always-visible foundation row is Energy, Food, Water, Shelter. Enter or click Energy to open the Fire panel; before Organization 4 it shows the existing unlock requirement. Once earned, the same panel contains Fire reserves, tenders, Cooking, Fire upgrades and projects. Switching away hides those controls while economic work continues. Selected Energy tabs survive normal save/reload.

Energy is registered through existing `addNode`, rather than as an economic layer. It has normal navigation defaults and no points stock. `node("energy")` derives its displayed amount from `player.civ.fire`; the original codec hydrates older saves with navigation defaults. No second fuel balance, migration mode, changed price, rate or unlock threshold is introduced.

| Expectation / governing rule | Implementation and verification | Result |
| --- | --- | --- |
| E1: yellow E immediately left of Food in the same top row, including narrow screens (user; RC02/03) | `summary().nodes`, node metadata, four-column foundation CSS; keyboard/order/color/reflow journey at 1280/390/320px | Passed automated/rendered |
| E2: existing Fire component belongs only to selected Energy; old unlock remains (user; local Fire contract) | `index.html` moves the single existing component into the resource panel; new Energy journey and updated Fire/material journeys exercise real commands | Passed automated/rendered |
| E3: reload, old saves and active Fire work remain safe (local codec/session/labor contracts; no-legacy-modes) | Existing non-layer registry defaults and canonical Fire owner; Energy codec round trip, missing old navigation record, invalid-tab atomic rejection and Fire reload tests | Passed focused and integrated rules/browser checks |
| RC01/05/06/08: discoverable owner, existing mechanisms, proportional scope | README → developer guide → manifest/node/selected panel → focused Energy tests. Canonical Fire documentation updated. No engine codec or economy rewrite. | Source inspection passed |
| RC04/07 and rendered outcomes | Existing codec validates references and creates defaults; actual Vue/static contracts plus new rules/browser coverage | Passed automated/rendered |
| Current standards and protected development | Fresh verified Orcha main, effective project instructions, dedicated checkout and owned writer fence. Project AGENTS main takes precedence over retained registry/manifest master; those files are preserved. | Verified; hashes below |

All changed source paths inspected: `js/civilization.js`, `js/layers/manifest.js`, `index.html`, `civ.css`. Their unchanged consumers in `js/components.js`, save defaults/codec, session setup and Food-owned economic update were traced. New rule/browser Energy assertions were inspected; existing civilization registry and Fire/material browser assertions were adapted to the requested navigation. README, design and developer guide own the updated route; this evidence file records the run. Generated package consistency is checked mechanically. No balance coefficients or policy checkpoints changed, so existing legal-play coverage remains the appropriate pacing regression. No TypeScript/React supplement applies to this JavaScript/Vue change.

## Verification

On final base `280caf5`, the prescribed local checks passed: **164 rule/save/runtime/balance tests**, build/package identity, real Vue template compilation, syntax, lexical/type boundary checks, negative sensitivity and real prestige mutation sensitivity. All **35 Chromium journeys passed** in the final full browser run, including the added Timber frames journey and both Energy journeys. The first command completed all non-browser stages, then its browser startup was interrupted because sandbox socket access was unavailable; `npm run test:browser` was rerun with loopback access and passed. This is split-stage evidence, not a claimed uninterrupted `npm test` exit 0.

Before the rebase, a row-position test sampled coordinates across resize/focus scroll frames; it was corrected to read all four node cells in one synchronous layout snapshot. This was a test measurement correction; the rendered row was already aligned. `git range-diff` confirms the clean rebase preserved the Energy patch.

Final local log SHA-256:
- `energy-rebased-suite.log`: `fa8449eeb959ed9968ef8036564d9e6c9e3452b8c78c6ab2d5d7f482cde20cb6`
- `energy-rebased-browser.log`: `4dc130f935490814907061d88d44f8a68d5befce27db60783b956213728da5a6`

Final Energy screenshots at 1280px and 320px were visually inspected; 390px and 320px reflow, keyboard navigation and selected-tab reload were exercised automatically. Actual-user usability, assistive technology certification and other browsers were not measured; automated keyboard/reflow and rendered evidence are bounded accordingly. Matching source/package and exported saves remain the recovery artifact; original `ptr` data is untouched. No confirmed source finding remains in this bounded change. Provider CI is checked at PR handoff.

## Governing revisions and hashes

The current-main resolver was loaded from immutable Orcha bytes and verified every selected catalog document hash. The small-feature procedure applies outside the repository's native milestone workflow; no lifecycle receipt or owner acceptance is fabricated. The same published readable-code, no-legacy, review and coordination rules govern the inspected boundaries.

| Revision | Document | SHA-256 |
| --- | --- | --- |
| cc45f3c | docs/agent-workflows/intent-routing.md | 3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed |
| cc45f3c | docs/agent-workflows/feature.md | 52279cc4869aa56c9a40efe7c2e136177feb807053783039c3c4e7dfa95170b3 |
| cc45f3c | docs/standards/no-legacy-modes.md | 913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156 |
| cc45f3c | docs/standards/readable-code.md | fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e |
| cc45f3c | AGENTS.md | 6f832fe94b7a9b1a77560bf811bf6aef76da2567009db5e9d815a33f720d1888 |
| cc45f3c | README.md | 847dab7c34dcee9a575ca90d5b50ac383b4fde239d97145fa79dd562be6d28e5 |
| cc45f3c | standards/catalog.json | 5850f5eb70397db5dccede9b9dbbf5de27861a8cfcb8676cda6337b608532651 |
| cc45f3c | config/repositories.json | 18cf54987abcdec4b58089eaa6091fc636e94e2f18bfeec149fb836e9a782e86 |
| cc45f3c | standards_resolver.py | 4c126f6dc47fa7a7284a148c0ad600d4f79488f6b7df8fe51a3a7f35dbd50f66 |
| cc45f3c | docs/pr-development-coordination.md | 939b59a53584e981798733a2292b3318f00d15ee01f230cb63a87f2eaf22bf0e |
| cc45f3c | docs/agent-workflows/review.md | d0a6df1eb01857876d799cc1997dc3c021ec59e0b377fa207ae4187067d9c05b |
| 44c1814 | AGENTS.md | aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6 |
| 44c1814 | .orcha/repository.json | d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585 |
| 44c1814 | README.md | 53bdbb845e0e489538b365f9446d4b49fd13372c4a3a7f099f83b26df4c11551 |
| 44c1814 | docs/!general-info.md | 06420ab8ce5eb231928fd93aa17552580840128039f6e6d1fe5a4614ecf1570e |
| 44c1814 | docs/developer-guide.md | 6d24c52487e33d1895ff986d0ea554fc61e31e11834099672fb3243d40fac626 |
| 44c1814 | docs/civilization.md | 95e641dd047755f00771455e3a907e9375bdbcac8e9cb3c27e9d6a3329c6de01 |

The effective project instructions and documentation were checked again after the rebase. New main preserves the same AGENTS and manifest authority. Its Timber frames rule and save migration remain intact; research additions change documentation only. Final selected-base document hashes:

| Revision | Document | SHA-256 |
| --- | --- | --- |
| 280caf5 | AGENTS.md | aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6 |
| 280caf5 | .orcha/repository.json | d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585 |
| 280caf5 | README.md | 6cf7fb4b45420d4c8fe192ff5e1c45860c1b6272f8cf3999b09d1cf13983b90a |
| 280caf5 | docs/!general-info.md | cb43c339d4d4846066e850fabd4e223d3342f64aeb2ad00c5795a001004f80bd |
| 280caf5 | docs/developer-guide.md | 9f1b2bb74adcf64e3c03c3df5a246ebc0149e6f0ccf20d00ef6249b5a107f220 |
| 280caf5 | docs/civilization.md | ba633f657f0da2f73995d3fa32f1cd52ed0242988143f1a66019d00137e74959 |
