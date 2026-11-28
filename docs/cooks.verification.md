# Cooks delivery evidence

Requested extension to Energy PR #19 from parent `a2178372e66b56639b32cf050ec6f317e9736f2b`. The initial Cooks commit 045bd92 was appended, then current main 34d2b1f (fishing removal) was merged with history preserved. The combined format is 0.93, so both actual 0.92 graphs migrate safely. Work remains in the dedicated `prestige-energy-tab` checkout on `codex/energy-tab`, protected by owned writer fence 2741. Publication appends a commit; no rebase or force push is needed. This bounded feature does not merge, deploy, activate a service or accept a milestone.

## Owner decisions and resulting behavior

- Cooks replace the Cooking control and unlock directly at Organization 4. The retired one-Fire Cooking purchase is removed without refund; other purchases stay.
- Zero cooks is off. Each of 1–5 cooks reserves one shared worker and selects the corresponding 1–5× fueled Food yield. The existing fuel curve, pots and accrued-bonus calculation remain.
- Cooks pause before tenders, builders or survival crews when Population loss overbooks labor. At two or fewer people all cooks are released.
- Craft and Organization prestige reset cooks to zero; the prospective preview and native confirmation say so. Rejected prestige preserves staffing.
- Save version 0.93 stores only `cooks`. Detached ingress validates and removes historical Cooking ownership/setting, starts staffing at zero, grants no refund and preserves stocks, other purchases, paid work and earned Food bonuses.

## Requirement and review evidence

| Requirement | Owning implementation and proof | Result |
| --- | --- | --- |
| Worker assignment is real and bounded | `setCooks`, `occupiedWorkers`, `orderStaffing` and codec worker validation count cooks; focused tests cover whole counts, refused overbooking, release and round trip | Passed rules |
| Preserve survival crews and reset on both tier 2 prestiges | `releaseUnavailableWorkers` releases cooks first; `prestigePreview` and `prestige` agree; rules and Energy browser journeys cover counts, rejection, reset and reload | Passed rules and browser |
| Remove old purchase without refund, preserving other state | `migrateData` retires the two old fields. `cooks-v091.json` was exported by the complete actual script graph and codec at a217837 after command purchases and two seconds of fueled Gather work. Rule/browser tests load it and compare Fire, pots, other upgrades and work. Malformed records reject atomically | Passed codec rules and browser |
| One runtime / no legacy modes | No old command, active setting or purchase definition remains. Only detached conversion refers to old ownership/setting; existing `cookingBonus` remains earned Food bookkeeping | Source traced |
| Readable-code RC01–08 and local contracts | README → developer guide → canonical civilization owner, component adapter and index control → focused tests. Existing worker ledger, normal codec and command guards reused. Version assertions and balance policy updated for the removed purchase | Source traced; static checks passed |
| Pacing and rendered boundaries | Active/regular legal play staffs five cooks plus three tenders and Gather, earns fueled bonus and releases cooks through commands. Opening timings remain 7870/8210 simulated seconds. Native keyboard, denied slider changes, selected Energy reload and 1280/320px bounds are browser assertions | Legal simulations and browser passed |

All changed runtime paths were reviewed: Fire availability and bonus derivation; staffing and order allocation; dispatch/construction guards; shortage release; material prerequisites; prestige preview/reset; detached migration/current validation; UI binding and shared ledger. Other upgrade IDs, prices, Food snapshots, pots, stock ownership, licenses and original ptr identity remain intact. Earlier Energy verification describes its immutable parent run; this file owns the later staffing change.

## Verification before main integration

The standard run passed build/package identity, Vue compilation, syntax, lexical/type boundaries, negative static sensitivity, all 170 then-collected rule tests and real prestige mutation sensitivity. Its browser phase passed 35/37; two new tests needed fixture corrections (missing Crafting prerequisite and a historical zero timestamp causing offline progress). The final focused Fire/Cooks rerun passed all five journeys on isolated loopback port 4192 (the default port was occupied), covering the two corrected fixtures and all three affected Fire journeys. All 37 unique browser journeys pass on the same application bytes; this local evidence is a full run plus focused corrections, not an uninterrupted npm test exit 0. All 171 unique rule tests passed: 170 in the standard run, plus the additional actual-codec migration rule separately; the final shared-hearth regression uses a real pipes purchase to verify spending after the Cooking purchase was removed.

No assistive-technology certification, other-browser compatibility or human enjoyment outcome is claimed. Legal-play timing is synthetic evidence. Original saves and matching historical source remain recoverable; the owner explicitly authorized retirement of the old purchase without refund.

## Governing source and document hashes

Current Orcha main was fetched afresh at `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`. Its resolver verified selected catalog hashes for this feature route. Project main advanced to 34d2b1f during publication and was merged before final verification; effective AGENTS selects main over the preserved historical registry/manifest master value. No lifecycle authority is changed.

| Source | Document | SHA-256 |
| --- | --- | --- |
| cc45f3c | docs/agent-workflows/intent-routing.md | 3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed |
| cc45f3c | docs/agent-workflows/feature.md | 52279cc4869aa56c9a40efe7c2e136177feb807053783039c3c4e7dfa95170b3 |
| cc45f3c | docs/standards/no-legacy-modes.md | 913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156 |
| cc45f3c | docs/standards/readable-code.md | fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e |
| a217837 | AGENTS.md | aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6 |
| a217837 | .orcha/repository.json | d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585 |
| a217837 | docs/!general-info.md | cb43c339d4d4846066e850fabd4e223d3342f64aeb2ad00c5795a001004f80bd |
| a217837 | docs/developer-guide.md | ed9ffd28f27598d51bdf0c075ad089f4dad4d39d392bc74345445d1d72c47e7c |
| a217837 | docs/civilization.md | 528ece38232842f032788f05a3a930ce46a2eb82b7f757d1d6a47eb3e2a9c992 |
| a217837 actual codec | tests/fixtures/cooks-v091.json | 90ac16a1846ff792ba34615fa9b777d62ff9a34e72eca63bd4d8321cc38d1ea1 |

Final desktop (1280px) and mobile (320px) Fire/Cooks screenshots were visually inspected. Cooks and Fire tenders have separate native controls; the ledger includes both, and the retired purchase is absent. Provider checks are recorded at PR handoff.

| Run log | SHA-256 |
| --- | --- |
| cooks-suite.log | 238d45ee346ee541f9f9ee253b5ea2137f6e4682c130f65e6555bcd5721051e4 |
| cooks-migration.log | 8b775cb13dc90f8915d7891fde50d05b991e4e4512b2bae07fcef88dc1c09c06 |
| cooks-review-focused.log | 9b4af60177b44fe4307f70ac2376170db53cd821f258f4e8f5783ae9369f2f1e |
| cooks-browser-final.log | 1dffef47df9de30236c8736d6e834332a25eb64a90b1c3eb5a4297156ccd86ae |

Additional Orcha bootstrap hashes at the same observed cc45f3c revision:

| Document | SHA-256 |
| --- | --- |
| AGENTS.md | 6f832fe94b7a9b1a77560bf811bf6aef76da2567009db5e9d815a33f720d1888 |
| README.md | 847dab7c34dcee9a575ca90d5b50ac383b4fde239d97145fa79dd562be6d28e5 |
| config/repositories.json | 18cf54987abcdec4b58089eaa6091fc636e94e2f18bfeec149fb836e9a782e86 |
| standards/catalog.json | 5850f5eb70397db5dccede9b9dbbf5de27861a8cfcb8676cda6337b608532651 |
| standards_resolver.py | 4c126f6dc47fa7a7284a148c0ad600d4f79488f6b7df8fe51a3a7f35dbd50f66 |
| docs/agent-workflows/review.md | d0a6df1eb01857876d799cc1997dc3c021ec59e0b377fa207ae4187067d9c05b |
| docs/pr-development-coordination.md | 939b59a53584e981798733a2292b3318f00d15ee01f230cb63a87f2eaf22bf0e |

## Combined-main verification

The bounded conflicts in defaults, migration ownership and the two canonical save paragraphs were resolved explicitly. Current state has Cooks and no fishing. Detached ingress validates/removes Fish before removing its historical Cooking ownership; historical labor validation counts existing cooks before any retired trip can release workers. Actual codec exports from main 34d2b1f and Energy 045bd92 cover both former 0.92 formats. Existing valid cook counts from the Energy candidate survive; old paid Cooking settings become zero without refund. The final migration guard also rejects mixed historical Cooking fields that could conceal invalid old ownership; focused migration tests passed after that review correction. Build/package identity and static analysis were repeated for that final source. Final combined checks are recorded below at handoff.

Final integration inputs:

| Revision / artifact | Document | SHA-256 |
| --- | --- | --- |
| 34d2b1f | AGENTS.md | aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6 |
| 34d2b1f | docs/!general-info.md | cb43c339d4d4846066e850fabd4e223d3342f64aeb2ad00c5795a001004f80bd |
| 34d2b1f | docs/developer-guide.md | dc949e5951d947267b8e0db893050ddcc3bb6b8bd19bb7bbaa8bb4dfc334ad40 |
| 34d2b1f | docs/civilization.md | e9eb0e21d088d06a3b72fa569f38eb08462c0d659b9819dfff140a98eaf440d3 |
| 34d2b1f | docs/balance-testing.md | 9033318520eb5715955f127469461a5d683f8f86cecd52b27620973f47ff6e0b |
| main / Energy actual 0.92 codecs | tests/fixtures/cooks-v092.json | 8aed1670c146e58b6213ead875448218942cf8a4d0f0b57253c7bbb064d6d9f2 |

Combined fishing-removal candidate: 179 rule tests passed; 39/40 full browser journeys passed and the remaining exact Fire reload journey passed after fixing its wall clock (offline progress is tested separately). The final migration correction passed 10 focused codec cases, rebuilt package identity/Vue compilation and repeated static analysis. No source failure remains in that candidate. Later UI-main integration, if any, is verified at handoff.

- cooks-combined-suite.log SHA-256: `65cf01316ab4d7e4ceeefc5d4b7872884f83ba7390196f4057482fdc6fc05f52`

- cooks-combined-browser-final.log SHA-256: `d142efef243bfcb6fbc98ca17860b8fc77ee167352cf5c2d6a3beadd6bc70227`

- cooks-final-migration.log SHA-256: `591922ca80a7e9f9ee42ccb7e15193577c358d0f9e238846d9ec30a2eeedc9da`

## Final shared-control integration

Current main advanced again to `e0b37887a06e7c19d83f42ccb8fb3208ae8090f3` (shared range controls). It was merged with published history preserved. The exact UI conflicts were resolved by keeping the single Fire panel in Energy, binding Cooks to the same red 0–5 shared range component, accepting numeric change values in its command adapter and preserving main's supervisor/repeat controls. No economic rule changed in this second integration. Canonical component documentation names Cooks.

Final validation: all **41 Chromium journeys passed together**, including shared-control accessibility/keyboard/bounds, Cooks refusal/priority/reset/migration and all fishing-removal journeys. Build/package identity, Vue compilation and static boundaries passed after integration; nine focused Cooks/codec tests passed with the full new script graph. The unchanged economic rules had already passed all **179 rule tests** in the combined-main run. Final 1280px/320px screenshots were visually inspected. The final published commit's full provider suite is verified at handoff. No confirmed source finding remains; actual-user enjoyment and AT certification remain unmeasured.

| Final integration artifact | SHA-256 |
| --- | --- |
| cooks-range-checks.log | f555502baa1d7b2b3aafb0d12bc2d47ae4888fa411249e64d36b3e976a01f328 |
| cooks-range-browser.log | eef72f6879dc82e48a99fc7837fd67a5e1bdca04a2cf1eda01f8d6979c6521a0 |
| e0b3788:docs/developer-guide.md | 5279f795eb8e07bcf8ad0c3f5d21543ed6ee8d594c7407549501be0a604d7f0e |
| e0b3788:docs/civilization.md | 5c5deb6d8678481f96b81f0c26cd84c0c14f4c8a95398dc45008bc07f784cf1e |
| e0b3788:js/components.js | 738de3d4abf59f64baf4c672637f6c5aaedbced74e543db9c7173776c095bee3 |
