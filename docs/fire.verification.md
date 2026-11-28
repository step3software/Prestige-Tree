# Fire implementation and verification

The owner requested a branch from PR12 and implementation of the supplied Fire design and revised gameplay order. Source is `step3software/Prestige-Tree` PR12, `codex/v08-upgrades` at **8032e9122b85b2832bb587a4c87153ba328e3fe5**. This dedicated worktree is `C:\Users\PhillipCurry\projects\codex\games\prestige-fire-ms4`, branch `codex/fire-ms4`, protected by the installed verified Orcha writer protocol (fence 2723). Parent ownership is untouched. This is a gameplay feature, not a native delivery-milestone acceptance or service activation. Publication follows the project requirement for a draft PR to fork `main`, with an explicit dependency on PR12. The Fire-only review comparison starts at `8032e91`; the main-based PR also includes its still-unmerged parent. Parent ownership is preserved and no integration is performed.

## Scope and evidence

| Requirement / standard | Canonical owners and evidence | Result |
| --- | --- | --- |
| MS4 Fire, MS5 spring, MS6 buyables, MS7 Farming, MS8 Abundance, MS9 Farming-only irrigation | `organizationRewards`, feature and purchase guards; progression/Fire rules and rendered milestone previews | Verified |
| Capacity `10 + 2*huts`, 0–5 shared tenders, nonlinear refill, no reserve loss at zero tenders | `fireStatus`, `setFireTenders`, `occupiedWorkers`; gain table, labor denial and zero-release tests | Verified |
| Independent 1–5× Cooking; production-scaled ongoing costs; base yield on depletion | `advanceFire` before `advanceActions`, raw reward snapshots plus accrued `cookingBonus`; table, depletion, changing level, recall, 25× yield over 5× time tests | Verified |
| Exact Fire upgrade prices, jar capacity/costs, hearth storage/income | `buyUpgrade`, `projects`, `startProject`, `storageCapacity`, `hearthBenefits`; exact payment, atomic denial, no refund, immediate MS4 benefit and actual income tests | Verified |
| Reset Fire/tenders, keep upgrades | Common prestige preview/command; both prestige branches tested, native Organization confirmation rendered | Verified |
| One current model and preservation (no-legacy-modes, RC-04) | Canonical defaults/validation and codec; actual PR12 writer fixture, v0.6/v0.7/pre-MS123 fixtures, paid jar work, active raw Food snapshots, invalid state atomicity, save/chunk parity | Verified |
| Product outcome, keyboard, error/recovery and context | `index.html`, `js/components.js`, `civ.css`; actual Chromium purchases, independent sliders, reload, exhausted fuel/base completion, unavailable staffing restoration, desktop/320px bounds and screenshots | Rendered automated evidence; actual users/AT unverified |
| RC-01/02/03/05/06/07/08 | README -> developer guide -> `fireStatus`/`advanceFire`/`startProject` -> controls -> focused Fire/hearth tests. State and decisions remain in the existing civilization owner, persistence in the codec; new fields have named owners and units | Verified by source trace and checks |
| Balance coverage with content | Legal policy earns Fire and all three upgrades; existing full campaign, finite exhaustion, recovery, jar investment, rough/fixed parity and idle scenarios; focused numerical timing | Verified; synthetic, no optimality/enjoyment claim |
| Branch ownership and provenance | Exact parent, separate checkout, verified installed writer module/registry, only owned fence used | Verified; no coordinator activation or parent edits |
| TypeScript/React supplements, paid providers, deployment/acceptance | Plain JS and existing Vue; no provider or operational change | Not applicable |

Cooking uses fractional fuel within a one-second step: newly tended Fire can fund part of the work at zero reserve. Already earned bonus survives a slider change; recall loses it. Shared hearths keep their stable ownership key, so existing purchases gain the new storage effect and use Fire fullness for income. Existing exact buyable-retention IDs/thresholds remain unchanged independently of feature order. Rations/Mutual aid follow Abundance at MS8; Emergency cistern follows spring at MS5. Fishing keeps its prior discovered-save behavior.

The current release stays v0.8. New fields are added by the existing detached canonical hydration/default path; malformed present values reject before live/durable replacement. The immutable PR12 codec fixture records source hashes and contains active Gather, paid jars and purchased hearths. Migration does not charge fuel or award retroactive Cooking. New saves need a matching Fire-capable artifact; earlier artifacts reject the new upgrade keys and should not overwrite them. No personal save or browser profile was accessed.

## Validation

Final `npm test` covers build/package, actual Vue template compilation, syntax, lexical/type boundaries, static negative sensitivity, **133 rule/save/runtime/balance tests**, prestige mutation sensitivity and **29 Chromium journeys**. All pass. Final screenshots at 1280×900 and 320×900 were inspected; Fire upgrade states use readable colors and bounded controls. UTF-8 decoding, changed-document links and `git diff --check` pass. No generated package/dependencies/browser artifacts are committed.

Focused command: `node --test tests/rules/fire.test.cjs tests/rules/shared-hearths.test.cjs`. The actual Food update remains the entry for all economic advancement; unchanged save/runtime/storage owners are exercised by full rules and rendered save/recovery journeys.

Two huts and three tenders fill in 340s; buying all three upgrades immediately takes 234s with Cooking at 1×. Current legal campaign completion is 3025s active / 3660s regular. Actual-starvation recovery is 130s/93s from 1 to 44 people, with peaks 5.64×/7.55×. The larger Food capacity changes fullness, so the historical peak-floor assertion was replaced with the authored 1–10× invariant while retaining the strict recovery-time comparison. Details and historical baselines live in [balance testing](balance-testing.md#fire-and-revised-ms49-progression).

## Source and standards hashes

Current published Orcha main was freshly verified by Git fetch and the GitHub branch API at **cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78**. `standards_resolver` checked current feature and review catalog hashes from that observation; the coordination contract was read and verified too. No project standards pin or adoption was introduced. The retained registry/manifest still name historical `master`; effective project AGENTS selects `main`, and the owner's explicit PR12 source takes precedence for this branch. Root AGENTS is the only nested instruction found.

Read documents and SHA-256 over their exact Git bytes:

```json
{
  "revision": "cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78",
  "documents": {
    "docs/agent-workflows/intent-routing.md": "3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed",
    "docs/agent-workflows/feature.md": "52279cc4869aa56c9a40efe7c2e136177feb807053783039c3c4e7dfa95170b3",
    "docs/standards/no-legacy-modes.md": "913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156",
    "docs/standards/readable-code.md": "fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e",
    "AGENTS.md": "6f832fe94b7a9b1a77560bf811bf6aef76da2567009db5e9d815a33f720d1888",
    "README.md": "847dab7c34dcee9a575ca90d5b50ac383b4fde239d97145fa79dd562be6d28e5",
    "config/repositories.json": "18cf54987abcdec4b58089eaa6091fc636e94e2f18bfeec149fb836e9a782e86",
    "standards/catalog.json": "5850f5eb70397db5dccede9b9dbbf5de27861a8cfcb8676cda6337b608532651",
    "docs/pr-development-coordination.md": "939b59a53584e981798733a2292b3318f00d15ee01f230cb63a87f2eaf22bf0e",
    "docs/agent-workflows/review.md": "d0a6df1eb01857876d799cc1997dc3c021ec59e0b377fa207ae4187067d9c05b"
  },
  "project_revision": "8032e9122b85b2832bb587a4c87153ba328e3fe5",
  "project_documents": {
    "AGENTS.md": "aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6",
    ".orcha/repository.json": "d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585",
    "README.md": "3667bb8f2b3a7aa02f0b7fb21f7ad3dc13755abd897eec6e279e401634d6802e",
    "docs/developer-guide.md": "d67a2425a5367cfc421e8d108bb30c9aa7de96cc975a3482eee6a2048fd84ce4",
    "docs/!general-info.md": "06420ab8ce5eb231928fd93aa17552580840128039f6e6d1fe5a4614ecf1570e",
    "docs/civilization.md": "df013bb44d4ca713ea7b825c15ce022583188849c6e392e3b5afac1ac0c5f713",
    "docs/balance-testing.md": "1b33c64a4360e689bd9096d3ac2e7594ff7aa16693bcd977aa7721c4210eeb68"
  }
}
```

Changed-path review accounts for `js/civilization.js`, `js/components.js`, `index.html`, `civ.css`, the balance policy, all changed/new rule and browser tests, the historical fixture and README/design/developer/balance/verification documentation. The full checks mechanically verify shipped sources and unchanged codec/runtime/storage consumers; direct diff/source inspection covers the changed behavior and assertions. Human usability, assistive technology, other browser engines and deployment are not claimed. No native approval, merge or deployment follows this evidence.
