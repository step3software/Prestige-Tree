# SAV01 verification and delivery handoff

SAV01 separates pure save data validation/conversion from one persistence adapter
and browser commands. Every changing save operation validates a complete candidate
and persists it before activation. Failed saves retain active progress and prior
durable data; failed startup conversion exposes the original and blocks ticking
and replacement autosaves. This is delivery evidence, not milestone acceptance.

## Source, authority and dependency

- Repository: `step3software/Prestige-Tree`; governing canonical `master` is
  `077861d2d4479d77e6079fd5c8bdf5e4fe7821f8`.
- Work branch: `codex/sav01-save-boundaries`, in its new dedicated worktree
  `C:\Users\PhillipCurry\projects\codex\games\prestige-tree-sav01`.
- Actual stacked source/base: `codex/tst01-testing-milestone` at
  `379241bd94cf50ca6423e07f1ad68c567edcb6a0`, [PR #2](https://github.com/step3software/Prestige-Tree/pull/2).
  Its branch/head remain intact, draft and unmerged. Final integration target
  remains `master`; do not retarget the child while its dependency is unmerged.
- Preparation commit: `488fc01`; implementation/test/guide commit:
  `2c341289db8e76d3aeed9ffd901bddf6ab3b73e0`. The final published head and exact-head
  CI observations are recorded on the child PR, rather than self-referencing this
  document's commit. Subsequent evidence-only commits do not change tested code.
- Owner continuation from chat `01a21b4e-ec1e-7ed3-ac43-bb65271a9cd3` to this
  SAV01 chat separately authorizes review, bounded fixes, plan validation,
  preparation, implementation, testing, review/fix and unmerged publication.
  Historical SAV01 specification/plan bytes and their earlier docs-only provenance
  are unchanged. No human answer, lifecycle receipt or native acceptance is invented.
- [Preparation](SAV01.preparation.json) binds the original validated plan/spec,
  exact source files/blobs, all seven criteria, current authority and 17 allowed
  paths (including preparation/evidence artifacts). `development_flow.validate_plan`
  and `validate_preparation` passed before production/test edits.
- TST01's code, F1–F3 repairs and complete suites were verified in the prepared
  source: clean locked installation, 50 rules, syntax, sensitivity and five
  Chromium journeys passed before extraction. Predecessor PR CI
  [45944210096](https://github.com/step3software/Prestige-Tree/actions/runs/45944210096)
  and push CI [45944204259](https://github.com/step3software/Prestige-Tree/actions/runs/45944204259)
  were freshly observed completed/success at the exact parent head.

## Governing standards and plan review

Fresh remote Orcha `main` resolution through `standards_resolver` is
`cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`, checked again before publication.
The preparation records SHA-256 hashes for all 18 read documents, including
AGENTS, routing, registry, README index, catalog, review/fix/plan/prepare/implement,
coordination, development, milestone authority/format, readable code, no legacy
modes and planning/delivery principles. Those hashes are run evidence, not pins.
The live registry now lists the fork, aliases `prestige`/`prestige-tree` and
canonical source `master`. The explicitly requested stack supplies the implementation
source. A stale local tracking ref was refreshed before using current standards.

Canonical project AGENTS, manifest, documentation index, developer guide and
mod-info reference were read at `master`; corresponding prepared-source versions
were also read. Their Git-byte hashes are retained in preparation. TST01-proposed
testing/plan documents are dependency evidence and review material, distinguished
from adopted canonical instructions. Existing `legacy` lifecycle authority,
priorities/pauses and the default-off coordinator remain unchanged. The new branch
was protected with installed fenced writer support through validation/publication;
there was no matching active maintenance row. Other claims were preserved.

The existing plan has a coherent objective, seven observable criteria and one
hard TST01 dependency. No reserved decision is unresolved. Preparation refined
the supported representation inventory, complete-candidate menu/reset semantics,
and blocked-load recovery; it did not broaden scope or weaken criteria. The
README → developer guide route is useful; the moved ownership map was repaired
in that guide without reorganizing engine documents. No telemetry savings are claimed.

| Applicable requirement | Evidence and disposition |
| --- | --- |
| Review: derive outcomes; trace callers, failure side effects and tests; inspect every path | E1–E6, findings, inventory and complete path accounting below; satisfied within this bounded review |
| Plan/prepare/implement/fix; exact artifacts/source/files and independent authority | Original plan validated; exact-file handoff committed before coding; owner continuation carried separately; satisfied without native acceptance |
| Coordination/stacking and local instructions | Dedicated child branch/worktree, fenced claim, immutable parent source/dependency, intended `master` target, unmerged publication; satisfied |
| RC-01 and RC-08: find and verify behavior from repository content | README → developer guide → `importSave` → codec → storage adapter → activation → `node --test tests/rules/save-boundary.test.cjs`; route inspected and checks passed |
| RC-02–RC-06: names, ownership, explicit data/results, useful boundaries | `save-codec.js`, `save-storage.js`, `saves.js`; explicit `ok/value/error` codec/storage results; command booleans plus visible recovery status; detached validation precedes one write; satisfied |
| RC-07 and user-outcome quality | Real-script/Decimal rules, immutable baseline and in-memory mutations; rendered success/failure/retry/context at 1280/320px; keyboard/native dialogs/live status; satisfied at synthetic/rendered levels |
| No legacy modes: inventory, conversion, original preservation, cutover and removal | Ingress-only single-player/numeric/Gear conversion; one current collection/adapter; retry and invalid-startup tests; obsolete `fixSave`/`fixData`/`versionCheck` and direct storage paths removed; satisfied |
| Local save key, progression/Decimal, synthetic profiles, licenses and test commands | `ptr`, layer IDs/definitions, vendored Decimal, licenses and F1–F3 retained; isolated contexts/memory stores; required commands pass; satisfied |
| Milestone format/authority | One SAV01 specification remains unchanged, separate companion preparation/evidence; no state/enrollment/acceptance edits; satisfied |
| TypeScript/React supplements, paid services, performance budget, live tenant/user proof | Plain JS, no paid/service/tenant operation or performance claim; supplements and such proof are not applicable to the accepted scope |

## Durable-call and representation inventory

Normal persistence uses only base64 JSON under `modInfo.id === "ptr"`.
`js/save-storage.js` owns the only shipped `getItem` and `setItem` calls. No
remove/clear, second key, network backend, dual write or legacy runtime mode exists.

| Caller | Boundary and effect |
| --- | --- |
| `index.html` startup; shared `demo.html` caller | `saves.load` → adapter read → codec collection conversion/validation → optional atomic canonical replacement → activate → clock/theme/temp/Vue effects |
| Options Save, 5000ms autosave, retained `setLocalStorage` public entry | `save` → complete candidate including current player → adapter write → activation/status; a failed tick or blocked load forbids writes |
| Import / recovery import | Prompt/cancel/foreign confirmation → pure detached player codec → full collection adapter write → activation/reload; recovery replacement also requires explicit confirmation |
| Export | Pure player codec → temporary textarea/clipboard effect; no durable storage read/write; denial/throw reports error and supports retry |
| New/rename/delete/select/reorder; save-menu Vue controls | Construct detached collection, preserve active snapshot/siblings/order/selection, validate/write once, then publish selection/menu/reload effects. Load no longer performs a redundant pre-selection save |
| `game.hardReset` / delete last save / Play Again | Confirmation → fresh player candidate in the current collection → validated adapter write → activation/reload; failure keeps prior player |
| Reset helpers and Gear actions in unchanged game/layer code | Same public default constructors from the extracted model; no new persistence path; source references and rule/browser progression inspected |

`allSaves[allSaves.set]` and `player` share one active object; inactive entries
use the same hydrated model. Vue receives those same objects after committed
changes. Runtime caches/timers/DOM/functions/cycles and unsupported root/layer
fields are rejected before encoding. Data added by the engine during play
(active challenges, unlock order, time played, best/total) has typed validation.

| Existing representation | Explicit handling and proof |
| --- | --- |
| Current selected collection `{set, name:player}` | Validate all siblings/selected reference, hydrate Decimals, retain names/order/counts/meaningful values; canonical reload requires no conversion write |
| Pre-multi-save single player | Convert once to `{set:"save1",save1:player}`; startup writes validated current collection before activation; retry preserves original on failure |
| Changelog versions 0.1–0.6, 1.0, 1.1, 1.2, 1.3 and missing version/defaults | Synthetic source-shaped fixtures exercise each; numeric versions normalize to strings, current version stamped, prior keep-going reset preserved. This is representation coverage, not proof that every historical installation has compatible fields |
| Gear clickables 11/12/13 authored empty zero sentinels | Convert to zero then Decimal-hydrate; assertions retain huge points and exact zero values |
| Exported single player / foreign mod | Preserve single-player export shape; import confirmation precedes rebinding mod ID and persistence; denial/cancel has no data effects |
| Future versions, unknown/retired `sp`/`l` fields, pre-Rewritten challenge arrays, corrupt/nested/prototype data | Explicit rejection with preserved original/progress and no fallback. No safe lossy converter is inferred; unsupported data remains available for separate evidence-backed recovery |

Inventory sources: actual pre/post save readers/writers, `js/mod.js`, layer
defaults/consumers, `changelog.md` (multi-save added at 1.2), the historical
`Old Code/2.0-format-changes.md` incompatibility note, and synthetic fixtures.
No real profiles, installations or user saves were accessed. Browser storage is
synchronous: each accepted change uses one atomic key replacement. No cross-key
transaction, concurrent-tab conflict resolution or browser/OS durability guarantee
is claimed. Originals are retained until complete candidate validation and a
successful replacement; unreadable data is never silently replaced by defaults.

## Expected outcomes, findings and corrections

| ID | Trigger → required invariant | Source/check outcome |
| --- | --- | --- |
| E1 | Codec receives raw valid/malformed data → detached candidate/error without storage/UI/clock/timer/active-state effects | Frozen-input/throwing-I/O purity case passes; huge and array Decimal round trips retain values |
| E2 | Manual/autosave/menu/reset storage fails → preserve active identity/progress, collection, selection and durable string; expose error; retry safely | All ten durable command failure/retry cases plus autosave pass. Immutable TST01 selection regression fails before extraction and passes after |
| E3 | Invalid/denied/cancelled/failed import → preserve prior active/durable/sibling data; valid import persists before activation | Unchanged F1 suite plus malformed references/nested data, repeated import and one-write assertions pass; premature-activation mutation is detected |
| E4 | Historical conversion interrupted/invalid → original recoverable, no replacement-default ticking/autosave; successful retry uses current path | Rules and real rendered startup recovery pass; canonical second reload writes zero conversions |
| E5 | Accepted menu operations → values, sibling count/order and selection survive reload; Vue uses the canonical objects | Create/rename/select/delete/reorder rules and rendered menu journey pass, including failed inactive delete then retry |
| E6 | User sees failure/recovery → truthful readable status, keyboard controls, retained context, no unexpected page/console errors | All 11 browser journeys pass; desktop/narrow error screenshots reviewed; explicit status-vs-panel geometry assertion passes |

Confirmed source defects within SAV01 were pre-persistence menu/selection/reset
mutation and unhandled ordinary storage/startup failures. The extraction corrects
their owning boundary. New checks caught and corrected permissive dynamic
infobox validation, an empty authored subtab-group shape, special Options/Info/Help
notification references, numeric configured versions in the shared caller, and
clipboard throw handling. Visual review caught overlapping narrow status text;
the status now has its own layout space and an executable non-overlap assertion.
New browser helpers were also corrected to wait for navigation and respect the
legitimately restored Options context. Existing TST01 assertions were not weakened.

Discovery/validation rejected several hypotheses: numeric versions and Gear
sentinels are supported authored forms, not invalid data; restore-to-Options is
retained user context, not a selection failure; Windows CRLF does not invalidate
hashes, which bind authoritative Git bytes. No unverified hypothesis is reported
as a defect. No confirmed in-scope finding remains after these corrections.

## Criteria and actual verification

| Criterion | Exact implementation/verification | Result |
| --- | --- | --- |
| SAV01-AC01 | Codec factory and pure default construction; frozen raw input, hostile I/O/clock/timer adapters, representative huge/array Decimal export/import | Passed synthetic rules |
| SAV01-AC02 | Single injected adapter; static shipped-method inventory and both page script-order assertions; manual/auto/menu/reset/startup/import traces above | Passed rules/source inspection |
| SAV01-AC03 | Complete candidate write before activation; invalid/foreign/cancel/quota/read-denied paths; prior durable/active identity assertions; unsaved live status | Passed rules and rendered recovery |
| SAV01-AC04 | Historical fixture inventory, current-version and meaningful value/reference checks, one canonical reload, original retained on conversion interruption | Passed source-shaped synthetic and rendered checks; unknown installations remain unverified |
| SAV01-AC05 | Current/historical round trips; malformed lists/maps/Decimals/references/prototype/cycle/host values; ten command failure/retries, repeated import, selection/rename/delete/reorder; F1–F3 and three mutations | Passed; invalid candidates never reach storage |
| SAV01-AC06 | Real controls for save/export/import/menu, real reload, failed save/import/inactive delete, 320/1280 status, unsupported startup and denied recovery confirmation, restored conversion | 11 Chromium journeys passed; keyboard/native dialogs/live status and visual review; no unexpected page/console errors |
| SAV01-AC07 | Superseded owners removed; canonical player/collection/Vue binding; typed durable model, all locked TST01 suites and updated guide route | Passed complete integrated suites and source review |

Executed Windows commands with Node 24.22.1, npm 11.19.1, Playwright 1.65.1 and
its locked Chromium: `npm ci`, `npx playwright install chromium`, `npm test`,
`git diff --check`, and artifact/link/source-scope validation. Final local suite:
**104 rule tests**, **11 Chromium journeys**, syntax for **16 shipped and 11
test/config scripts**; no skips, focused-only final run, expected failures or
retry masking. The final semantic code passed the complete suite; subsequent
codec whitespace cleanup and this evidence commit do not change behavior.

Sensitivity checks execute unchanged F1–F3 assertions against immutable `077861d`
and detect all three historical failures. The new failed-selection assertion
detects the defect on immutable parent `379241b` and passes on SAV01. In-memory
premature activation, skipped candidate-validation and milliseconds offline-cap
mutations all fail their behavioral assertions. No checked-out source is mutated.
Rule mocks prove isolated data boundaries; rendered tests use actual Vue/DOM and
controls with only local assets, clock and explicit storage/clipboard I/O adapters.
Local successful status/recovery snapshots are ignored test outputs; CI uploads
bounded diagnostics only on failure. Exact-head Linux CI is observed on the PR.

## Complete changed-path accounting

Every child-only changed path is accounted for against the pinned parent; no
renames or deleted files are hidden by the grouping. Removal within `utils.js`
was checked against all remaining callers.

| Paths | Inspection and mechanical/executed evidence |
| --- | --- |
| `js/save-codec.js`, `js/save-storage.js`, `js/saves.js` | Complete source read; ownership, conversion, typed data/references, ordering and recovery traced; purity/atomicity/rule/browser/sensitivity tests executed |
| `js/utils.js`, `js/game.js` | Complete removal/reset diff read; unchanged progression/tick/offline/NaN consumers followed; no duplicate storage/codec/version runtime path; F1–F3/progression/clock tests retained |
| `js/components.js`, `index.html`, `demo.html` | Script graph and command/recovery wiring inspected; Vue canonical bindings checked; redundant write removed; primary game rendered at desktop/narrow and screenshots reviewed. Demo wiring/numeric-version contract verified; full demo rendering is not claimed |
| `tests/support/game-runtime.cjs` | Entire adapter diff read; read denial/write attempts/status fixtures added; real script graph/Decimal and isolation retained |
| `tests/rules/save-boundary.test.cjs`, `tests/fixtures/historical-saves.json` | Entire assertions/fixtures read; meaningful values/references, failure side effects/retry and inventories executed. Existing rule files unchanged |
| `tests/browser/save-recovery.spec.cjs` | Every success/error/retained-context assertion read and executed; no external requests or real profiles; existing browser test file unchanged |
| `scripts/verify-regressions.cjs` | Full diff read/executed; immutable original/parent reads, extracted-owner exclusion for baselines, exact unique mutation anchors; assertions remain behavioral |
| `.github/workflows/test.yml` | Full diff and inherited workflow read; only new branch trigger added. Locked installs, immutable action SHAs, read-only permissions, public Ubuntu, full Git history and failure artifact bounds preserved |
| `docs/developer-guide.md` | Complete changed ownership/API/recovery/stack instructions inspected, focused entry route executed; links verified |
| `docs/milestones/SAV01.preparation.json`, `docs/milestones/SAV01.verification.md` | Exact plan/spec/source/doc hashes and schema/file/criterion bindings mechanically checked; authority/standards/criteria/scenarios/results/path accounting read as evidence, not acceptance |

The parent-to-child PR diff contains only SAV01. Canonical licenses, Decimal
library, layer definitions/IDs, save key, package pins/lockfile and original
TST01 rules/browser assertions are unchanged. The cumulative source also retains
the verified TST01 work; SIM01/LAY01/DEV01/UI01 remain outside this change.

## Limits and continuation

Other engines, full late-game balance, all historical installations, native
assistive technology, actual-user usability and production CDN/offline behavior
are unverified. Tests use synthetic progress, local Vue matching the shipped
version, controlled clocks and isolated Chromium contexts. Clipboard capture
proves the export payload/command and denial paths, not a particular OS clipboard.
The shared demo retains its pre-existing example/path debt; no full demo journey
is promised by SAV01. No invented performance or native zoom gate applies.

The unchanged Vue 2.6.12 low-severity compiler advisory remains in UI01 scope;
no dependency/framework migration or automatic audit fix was performed. Unknown
formats are intentionally preserved and rejected, with no claim of a lossy
converter. Web Storage remains the same local synchronous backend.

After final exact-head CI, leave the child PR draft and unmerged for human review.
Retain the explicit TST01 dependency and integrate in parent-first order only
under separate owner coordination. This run performs no merge, deployment,
activation, native milestone acceptance or permission/policy change. The next
defined milestone is **SIM01 — Deterministic simulation and explicit runtime lifecycle**;
it needs its own fresh source/standards/dependency/preparation checks and authority.

## Stack review correction R2 — 27 November 2026

The owner requested the full-stack review fixes. Save-name dictionary validation
now accepts TST01's ordinary own `prototype` slot. Inherited Object prototype
names (including `__proto__` and `constructor`) remain rejected. Recursive player
copying retains all three prohibited keys, including nested `prototype`; this is
not a schema change, alternate reader or lossy name conversion.

`tests/fixtures/tst01-prototype-collection.json` is the actual immutable TST01
`379241b` writer's synthetic New Save → reload → save output, with selected
`prototype` progress 456 and sibling `save1` progress 123. The prior reader rejects
these bytes; the new focused rule checks pass load, canonical identity, failed
write/original retention, retry, reload and rename. Hostile collection names and
nested prototype keys remain rejected. The rendered journey is in
`tests/browser/save-recovery.spec.cjs`; full-suite results accompany publication.

Requirements: SAV01 AC01/04/05/07, local save-preservation, shared migration/data
preservation and RC-04/07. README → developer guide → `js/save-codec.js` /
`js/saves.js` → `tests/rules/save-boundary.test.cjs` supplies the reproducible route.
Use the inherited [current-main standards observation](stack-review-fix-standards.json).
This bounded correction preserves accepted scope and legacy authority. R4 is
carried from the parent by merge; original commits and PR bases remain intact.
