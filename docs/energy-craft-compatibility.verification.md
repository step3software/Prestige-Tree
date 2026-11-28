# Energy / Craft save compatibility

Requested rebase: `codex/energy-tab` onto `codex/craft-repeatable-buyables` at final `b7942d5257e74d7dab449a8b743938caaf78d15d` (initial observation 8c4b3ed). The prior Energy tip `005732d67c4ec9b3febbbbffcbc6bb14104be587` is preserved at `backup/energy-before-craft-rebase-20261128`. Its complete feature delta was consolidated and rebased as `278bc8f` after incorporating the latest parent, preserving merge-resolution changes. Work used the dedicated `prestige-energy-tab` checkout and owned writer fence 2745. No parent-branch edit, merge to main, deployment or lifecycle acceptance is authorized or performed.

The combined current model is **0.94**: repeatable `civ.equipment`, shared-worker `civ.cooks`, and the yellow Energy node. Craft 0.93 saves already contain equipment levels and keep those levels, scaling costs, stocks and paid construction. Energy 0.93 saves use Boolean equipment and old infrastructure; detached ingress converts them once using the Craft branch's existing retirement/refund rules. Valid cook counts and remaining Food snapshots survive. The old Cooking purchase is validated and removed without refund. No active legacy mode is retained.

| Requirement / standard | Owning path and proof | Result |
| --- | --- | --- |
| R1: requested ancestry and feature preservation | b7942d5 is an ancestor after rebase; Energy node/registration, shared Cooks control, worker ledger and both prestige resets preserved | Git/source checked |
| R2: both actual 0.93 formats load safely (no-legacy-modes) | `migratePreviousData` → `migrateFishingData` → `migrateEquipmentData` → Cooking retirement → normal typed codec/current validation. The fixture was exported through Energy 005732d and final Craft 1f6593f, each complete pinned script graph and its actual codec | Rule and browser passed |
| R3: no duplicate refund, lost level or paid work | Legacy Energy fixture preserves purchased Water counts/stocks and housing, cook count and Food/Water work; exactly 6 known Craft recipe units refunded. Craft fixture preserves all integer levels, Craft, Fire and paid third-roof progress. Current re-import is byte-identical | Rule and browser passed |
| R4: malformed/ambiguous/mixed state and overbooking fail atomically | Format 0.93 requires recognizable equipment or legacy Fire records; negative retired work, bad levels/flags, mixed current/retired counters and cooks plus crews beyond Population reject without replacing live bytes | Focused rules passed |
| R5: existing Cooks gameplay and new equipment remain correct | Cooks staffing/priority/reset rules, repeatable equipment/price/reset tests and actual active/regular legal-play simulations. Retired Fire controls stay absent; native Energy controls and Craft panels work together | Full suite passed |
| RC01–08: canonical ownership, readable boundaries, proportional verification | README → developer guide/design → `js/civilization.js` ingress/defaults/validation and `index.html` → existing codec and focused fixtures/tests. Existing mechanisms reused; no new storage key or migration runtime. JS/Vue static/interface and mutation checks passed; no TS/React supplement applies | Source/static reviewed |

Changed implementation paths reviewed: civilization node/summary; Fire availability and multiplier; worker/order ledger and shortage release; material predecessor gates; prestige preview/reset; defaults, three ingress steps and current validation; resource manifest; mod version; selected Energy panel and numeric shared-control adapter. Unchanged codec atomic commit, save storage and runtime consumers were traced. Rebased test/version/policy paths were inspected and exercised by the standard suite; two obsolete buyable test blocks follow the requested Craft parent, with its replacement equipment tests retained. Historical Energy/Cooks verification files retain their original run provenance and do not claim current compatibility evidence. Current README/design/developer routes describe the combined model.

## Verification

`npm test` passed on the first rebased runtime before the parent placement update: **173 rule/save/runtime/balance cases and 40 Chromium journeys**, build/package identity, Vue compilation, syntax/static boundaries, negative sensitivity and actual prestige mutation sensitivity. Focused compatibility/refund/atomicity regressions also passed. The standard browser run includes both real 0.93 fixtures at startup, Energy/Craft navigation, saving and reloading, preserving selected context, stocks, levels, construction and cook state. Normal and malformed earlier-save fixtures continue to run. No original ptr data is touched.

This is automated synthetic and rendered evidence, not human enjoyment or assistive-technology certification. Published CI and exact final ref are recorded at handoff. PR remains unmerged. Older source artifacts need their matching older export; these tests establish forward migration into the combined model.

## Governing revision and hashes

Current Orcha main was fetched and resolved at `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`. The main resolver verified selected catalog documents for the bounded fix. Registry resolves Prestige Tree; its effective AGENTS selects main over the preserved registry/manifest master value. The user explicitly selected the Craft source for this rebase. Authority and permissions are unchanged.

| Source | Document | SHA-256 |
| --- | --- | --- |
| cc45f3c | docs/pr-development-coordination.md | 939b59a53584e981798733a2292b3318f00d15ee01f230cb63a87f2eaf22bf0e |
| cc45f3c | docs/agent-workflows/intent-routing.md | 3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed |
| cc45f3c | docs/agent-workflows/fix.md | 5ccd0b047ab4f7afc906e3ab6a77c03eeda76b2f771ceb47322b4386e26c61c6 |
| cc45f3c | docs/standards/no-legacy-modes.md | 913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156 |
| cc45f3c | docs/standards/readable-code.md | fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e |
| 8c4b3ed | AGENTS.md | aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6 |
| 8c4b3ed | docs/developer-guide.md | 634b0c92ab73de60cc29df8d37c3e013dd777121a57fd8165e9f3111e7742757 |
| 8c4b3ed | docs/civilization.md | cfa52049d60f5ea56194e5081075ce9b1250f8f4825d6b268c86a099e0ee2fb8 |
| 8c4b3ed | docs/!general-info.md | cb43c339d4d4846066e850fabd4e223d3342f64aeb2ad00c5795a001004f80bd |
| cc45f3c | AGENTS.md | 6f832fe94b7a9b1a77560bf811bf6aef76da2567009db5e9d815a33f720d1888 |
| cc45f3c | README.md | 847dab7c34dcee9a575ca90d5b50ac383b4fde239d97145fa79dd562be6d28e5 |
| cc45f3c | config/repositories.json | 18cf54987abcdec4b58089eaa6091fc636e94e2f18bfeec149fb836e9a782e86 |
| cc45f3c | standards/catalog.json | 5850f5eb70397db5dccede9b9dbbf5de27861a8cfcb8676cda6337b608532651 |
| cc45f3c | standards_resolver.py | 4c126f6dc47fa7a7284a148c0ad600d4f79488f6b7df8fe51a3a7f35dbd50f66 |
| cc45f3c | docs/agent-workflows/review.md | d0a6df1eb01857876d799cc1997dc3c021ec59e0b377fa207ae4187067d9c05b |
| Run artifact | tests/fixtures/energy-craft-v093.json | 6a63c9c966b7a554c44a32f3b651d14afb746a3fb51b4c5c7de0635dc4a0ca14 |
| Run artifact | ../energy-craft-suite.log | 4aaa6373c8094f75ac8dc9d1af9a8c51ccbdd01dfe72a9a7d9f4b81993bea569 |
| Run artifact | ../energy-craft-review.log | 51bbd91e593be666dcd9fde5a925a3c375e42af88a025fbb976475d1dea4b6e2 |

## Final parent update and review

Parent 1f6593f changes placement, not save representation: only material knowledge stays in Craft; equipment stays on Food, Water, Shelter and the Fire panel. Its exact diff was integrated by a second rebase. The two cooking-vessel buyables remain inside the selected Energy Fire panel. The actual Craft fixture was recaptured from that exact source. README and the startup/reload journey follow the new resource locations.

Final checks passed: build/package identity, real Vue compilation, syntax, static boundaries and negative sensitivity; **34 focused equipment/Cooks/compatibility cases**, **11 actual-codec/material cases**, and all **40 Chromium journeys together**. The added parent equipment-placement rule is included in those focused checks; prior economic rules already passed the 173-case full run. The final two-vessel Energy layout passed at 1280px and 320px and screenshots were visually inspected. No economic coefficient changed in this parent update. Full provider checks for the exact final head are recorded at PR handoff.

The possible stale-Cooking-bonus/reset concern was traced and rejected: resetting any equipment recalls active Food snapshots before lowered equipment-based validation applies. No new source finding remains in the bounded rebase/compatibility scope. Raw malformed-save rejection and valid-source preservation were exercised independently of the UI. Publication uses an exact old-head force-with-lease and preserves the parent's branch.

| Final artifact / contract | SHA-256 |
| --- | --- |
| energy-craft-latest-rules.log | e1a33dea14cd90243da02275e258b08b1d2af316e5ff07294fde1da14c1719f0 |
| energy-craft-latest-fixtures.log | d550a7e04b12451496e73929540f80ebed7a77972aa425f76a130dd13a2e6b86 |
| energy-craft-latest-checks.log | 8907d96fecddde3f613537f787ad4866c909d2b33c97e6bc3787d7664fd6fb17 |
| energy-craft-final-render.log | 4d3c31e75bd9a6d3eaa1bce3d6c8e15ee2d126104e277b33001a0c669b1f9dc8 |
| 1f6593f:AGENTS.md | aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6 |
| 1f6593f:docs/developer-guide.md | c14ccff18d9a16595ff16f3bac0638e9563bd5273f2ea223e9d224babcf1bb79 |
| 1f6593f:docs/civilization.md | 26c3ac04b75646b80a7b470cf75400a64407eb0f81bba54e106091fe43a05ef1 |

## Final Water parent update

Final parent b7942d5 gives each basket +10 manual Water carrying and each jar +20 carrying/+20 reservoir capacity. Its unchanged 0.93 representation is migrated by the same 0.94 ingress. The actual b7942d5 Craft fixture was recaptured, now with an active Water trip; the old Energy fixture also contains an active old-formula Water trip. Both trip contracts survive exactly, while new trips use the parent's current formula. Existing Water stocks and purchased levels are preserved; the former basket/jar reservoir formula is intentionally replaced by the parent's current effects.

The final source passed **31 focused Water, equipment, Cooks and codec cases**, package/Vue/syntax/static/sensitivity checks, and all **40 Chromium journeys together**. Existing fixtures still prove refunds occur once, stored supplies survive, paid current work resumes and invalid inputs preserve live bytes. No field-conversion change was needed for this final parent update. Full final-head CI is recorded at handoff.

| Final Water input / evidence | SHA-256 |
| --- | --- |
| energy-craft-water-fixtures.log | 3ad2e974923d7d2d7985224283eebebf28d12b510c7f070e318b23e864c933cd |
| energy-craft-water-checks.log | 4cfbc016e0ab990d6b5df599ba9a079a6aef74f5651780e19ea1898dffc1d6e7 |
| b7942d5:docs/developer-guide.md | 438bb2890e38d5b9864c666e7938417562d71951b326032efdb79ba60196260c |
| b7942d5:docs/civilization.md | b0538fcc7e8e155542489bfe8e70a81ec54c183086f0baeb0470b96963b6b1ce |
| b7942d5:js/civilization.js | 7dc36d68ba2ec90508300be0725e2e5473f512066bfa7e1c77d9a6c5899a5f20 |
