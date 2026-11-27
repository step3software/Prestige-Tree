# TST01 verification and PR review

TST01 is implemented and verified locally and in CI on PR [#2](https://github.com/step3software/Prestige-Tree/pull/2),
pending final remote checks and human review/merge. This is delivery evidence, not
milestone acceptance, runtime enrollment, deployment or permission changes.
The five follow-on milestones remain proposals. The original TST01 specification
and structured plan retain their historical planning-only provenance; the current
owner request explicitly authorized this direct development cycle.

## Revisions, authority and standards

- Actual PR base/source `master`: `077861d2d4479d77e6079fd5c8bdf5e4fe7821f8`.
- Reviewed planning handoff: `f717064156b66f4a8ed98b586ccbedcac3d88221`.
- Validated preparation commit: `82d38ad`; harness/baseline commit: `50f084c`.
- Locally tested application/test/config revision: `bae7406b426dcf5432451e6ae263d351fa3f2e29`.
  Later changes adding this evidence are documentation only. Final CI at the
  current PR head is reported in the PR description/checks, rather than claimed here.
- Current published Orcha `main`: `9dbea2b52cd076c8b52174edeb06ed807d3aa7d1`.
  `standards_resolver` verified catalog hashes at a fresh remote observation.
  [Preparation](TST01.preparation.json) records all 18 document hashes read, exact
  implementation files, plan digest, source bindings, invariants and this chat's
  execution authority. These are run evidence, not project standards pins.
- Published Orcha main's registry does not yet list this fork. The explicit owner
  URL takes precedence; effective [AGENTS](../../AGENTS.md) and the
  [manifest](../../.orcha/repository.json) select this repository and `master`.
  No unpublished registry text was used as governing authority.
- Existing fenced writer support protected the exact branch/checkout after the
  preceding writer released it. There was no active maintenance row for this PR;
  the default-off coordinator was not activated. This repository stays in its
  existing `legacy` authority mode with no fabricated native stage receipt.

## Standards-to-evidence mapping

| Requirement | Implementation / verification | Result |
| --- | --- | --- |
| Orcha review procedure: derive outcomes, inspect real head/base and every changed path, validate candidates and failure side effects | Expectations E1–E5 and complete path accounting below; cumulative diff reviewed against `077861d` | Satisfied within the stated scope |
| Intent routing, plan/prepare/implement/fix procedures; existing artifact schemas and branch protection | Plan and exact-file preparation validated with `development_flow.validate_plan` / `validate_preparation` before coding; same milestone branch and unmerged PR | Satisfied; no owner acceptance inferred |
| Readable code RC-01/RC-08: discover and verify from repository content | README → developer guide → `importSave` → candidate validation/hydration → atomic storage replacement → reload → focused `save-safety.test.cjs`; focused run passes | Satisfied |
| RC-02–RC-06: named units/ownership, clear flow, external validation, small reuse, intent comments | `promptSaveName` serves both menu commands; defaults own field shapes; import candidate remains detached until persistence; seconds named at clock boundary; tick fault latch owns recovery | Satisfied for changed code; unrelated global-state debt remains in DEV01 scope |
| RC-07 and shared user-outcome evidence | Actual scripts/Decimal; controlled clocks; malformed/cancel/storage/exception scenarios; real rendered Chromium controls and native dialog events | Satisfied at synthetic/rendered evidence levels; no actual-user claim |
| No-legacy-modes: preserve original on conversion failure and keep one active model | Current-format import only; existing numeric versions and authored Gear zero sentinels normalize before current hydration; no second save format/mode/schema/reader added | Satisfied; broad migration is SAV01 scope |
| Local guide: real browser checks, synthetic profiles, preserve save key/Decimal/licenses, focused PR to fork master | `ptr`, layer definitions/IDs, page entry, Decimal library and both licenses are unchanged; isolated browser contexts and memory stores; five rendered journeys | Satisfied |
| Milestone format and repository-milestone authority | Six separate specifications, stable IDs, companion hashes, no dependency cycle, no enrollment/acceptance or permission changes | Satisfied as proposals/direct-session artifacts |
| TS/React, new UX studies, performance budgets, tenant/production proof | Plain JS, no framework migration, no performance claim or production operation | Not applicable; no invented gate |

## Expected outcomes and validated findings

Expectations were derived from TST01-AC03–AC08 and the save/clock/menu consumers
before interpreting the baseline results.

| ID | Trigger and expected invariant | Baseline / final evidence |
| --- | --- | --- |
| E1 / F1 | Player imports malformed text/nested fields, denies a foreign mod, cancels, or storage fails. Active and durable valid progress remain intact; invalid input reports recovery and can be retried. | Baseline invalid `p:null` swaps the player; fixed import validates and repairs a detached candidate and performs one atomic storage replacement before publishing it. Invalid/base64/JSON/shape/Decimal/prototype/storage cases, confirmation/cancellation, retry and reload pass. |
| E2 / F1 | Tick throws after mutation. Guard clears, unsafe progression and every normal save write stop until reload, retaining the last durable save. | Baseline throws and can leave `ticking` true; final `try/finally`, fault latch and shared storage/save guards pass the partial-mutation/autosave/manual-write test. |
| E3 / F2 | Zero/backwards elapsed time, below/at/above one-hour bank, disabled offline production, repeated catch-up or small remainder. Bank uses seconds, caps at 3600 before consumption and credits no more than the bank. | Baseline leaves 6480 of 7200 seconds after its first tick; final leaves 3240 after capping to 3600 and consuming 360. All boundary/conservation tests pass. |
| E4 / F3 | Cancel New Save/Rename, or enter empty/whitespace/reserved/duplicate/overlength input. No exception, partial save or changed selection. Valid menu operations survive reload. | Both baseline cancellations throw; final common prompt validation returns before effects. Rule and rendered cancellation journeys pass. |
| E5 | Clean developer/CI checkout runs real progression, persistence and rendered journeys and fails on regressions. | Local clean install passes; immutable baselines and two in-memory mutations fail the behavioral assertions. Actual baseline CI fails at the rule step. Final CI results live on the PR. |

Discovery was followed by validation: F1–F3 are confirmed and corrected. Review
also found and corrected an overly permissive Decimal parser boundary, the need
to guard menu storage after a tick fault, and the two existing save representations
covered by the numeric-version/Gear regression. A suspected plan digest mismatch
was rejected: Windows checkout CRLF differs, but every recorded digest matches
the authoritative Git bytes. No finding was invented for that conversion.

## Acceptance coverage and executed checks

Executed on Windows with Node 24.22.1, npm 11.19.1, Playwright 1.65.1 and its
Chromium 159.0.8154.6 / revision 1255. No retries, skips, focused-only tests or
expected-failure cases mask acceptance paths. Browser time is controlled.

| Criterion | Exact executable evidence | Local result |
| --- | --- | --- |
| AC01 | `npm ci`; `npm test`; `.node-version`, lockfile, current developer guide | Passed locked clean install and commands on Windows; Linux CI is separately reported on the PR |
| AC02 | `tests/support/game-runtime.cjs`; separate-runtime test; browser config/context/clock and server teardown | Passed; fresh VM and in-memory saves per rule case, fresh browser contexts |
| AC03 | `tests/rules/progression.test.cjs`: initialization/prestige/purchase/reset, huge-Decimal fixture/import/export/reload, sibling save selection | Passed, including numeric-version and Gear-sentinel compatibility |
| AC04 | `tests/rules/save-safety.test.cjs`: fourteen malformed payloads, foreign confirmation/cancel, failed storage then retry, faulted tick and autosave | Passed; retained active/durable state and safe reload |
| AC05 | `tests/rules/clock.test.cjs`: 0, 1, 3599, 3600, 3601, 7200 seconds; backwards/load/disabled/catch-up | Passed; seconds conserved and cap respected |
| AC06 | `tests/rules/save-safety.test.cjs`: both cancelled prompts, invalid names, valid creation/rename/selection/reload | Passed |
| AC07 | `tests/browser/game.spec.cjs`: five journeys through rendered controls, native import dialogs, 1280×800 and 320×800 error cases; pageerror/console-error assertions | 5 passed; no unexpected errors. Keyboard activates Import; native browser OK/cancel semantics are used, not a screen-reader or actual-user study |
| AC08 | `.github/workflows/test.yml`: immutable actions, public Ubuntu 24.04, read-only contents, exact local commands, no secrets/deployment, bounded failure artifacts | Source review passed; actual failing baseline job verified. Final green job evidence belongs to the PR |
| AC09 | `npm run test:sensitivity`; immutable `077861d` F1–F3 checks; premature-player-swap and milliseconds-cap mutations in memory | All 3 final checks pass; all 3 baseline regressions and both mutations detected. Required final local rule suite: 48/48 passed |
| AC10 | Full source/diff review, this mapping, hashes and actual PR head/base/check records | Local review completed; final remote checks and human merge/acceptance remain distinct |

The first harness run against unchanged game code produced **18 passes / 29
failures** (47 tests), reproducing F1–F3 without changing player data. CI run
[45942301648](https://github.com/step3software/Prestige-Tree/actions/runs/45942301648)
at `50f084c` passed installation/syntax and **failed at `npm run test:rules`**;
downstream steps were correctly blocked. The final suite adds the compatibility
regression and passes **48 rules**, all **5 browser journeys**, syntax for **13
shipped + 9 test/config scripts**, and the sensitivity command. The rule command
also emits an ignored JUnit report retained on CI failure; browser diagnostics
are failure-only with a three-day retention limit and ten-minute job timeout.

The application/test/config revision `bae7406` also passed every required Linux
step in PR CI run [45943536428](https://github.com/step3software/Prestige-Tree/actions/runs/45943536428)
and push run [45943530959](https://github.com/step3software/Prestige-Tree/actions/runs/45943530959).
Those results bind that exact revision. The final documentation-only head's checks
are refreshed and reported on the PR, without repinning these historical results.

## Complete changed-path accounting

No deleted or renamed files are hidden by this grouping. Every path in the actual
base-to-head diff is accounted for; the follow-on plans are reviewed as plans.

| Paths | Review / proof |
| --- | --- |
| `README.md`, `docs/developer-guide.md` | Inspected current command/navigation text and source routes; local links resolve; commands executed |
| `docs/milestones/TST01.md`, `TST01.plan.json`, `TST01.preparation.json`, `TST01.verification.md` | Specification read, all 10 criterion mappings examined; plan/preparation schema, Git hashes and scoped implementation delta verified; evidence read as evidence, not acceptance |
| `docs/milestones/SAV01.md`, `SAV01.plan.json`, `SIM01.md`, `SIM01.plan.json`, `LAY01.md`, `LAY01.plan.json`, `DEV01.md`, `DEV01.plan.json`, `UI01.md`, `UI01.plan.json` | All five specifications inspected; structured duplicates mechanically checked for schema/criterion IDs/specification hashes and DAG. All six plans have 45 unique criteria; no code for these five milestones is delivered |
| `js/utils.js`, `js/game.js` | Complete implementation diff inspected; unchanged UI/menu/timer/startup consumers traced; F1–F3, compatibility, storage/tick and clock checks executed |
| `package.json`, `package-lock.json`, `.node-version`, `.gitignore` | Pins, scripts, lock integrities and generated-output exclusions inspected; clean `npm ci` executed |
| `scripts/check-syntax.cjs`, `scripts/verify-regressions.cjs` | Complete scripts inspected and executed; baseline source reads and mutations are isolated in memory |
| `tests/support/game-runtime.cjs`, `tests/support/server.cjs`, `tests/fixtures/representative-save.json` | Complete adapters/fixture inspected; shipped graph/Decimal retained; test-only dependency routing, loopback scope, UTF-8 and synthetic state verified |
| `tests/rules/progression.test.cjs`, `tests/rules/save-safety.test.cjs`, `tests/rules/clock.test.cjs` | Assertions/fixtures inspected and all rules executed; failure side effects and unchanged callers included |
| `tests/browser/game.spec.cjs`, `playwright.config.cjs` | Complete controls/assertions/config inspected; real Chromium journeys executed with no retries. Initial wrong Options selector and missing HTTP UTF-8 were test-adapter defects and were corrected before final checks |
| `.github/workflows/test.yml` | Complete permissions/events/actions/commands/artifacts reviewed; baseline CI failed at rules; full history fetch supports immutable regression checks; final CI is observed separately |

## Limits and continuation

Other browser engines, full late-game balance, native assistive technology and
actual-user usability are unverified. Rule tests stub DOM/Vue effects; browser
tests supply the matching local Vue and omit external fonts, so they establish
the rendered engine/control paths without proving production CDN/offline behavior.
Current-save fixtures cover representative existing representations, not an
inventory of all historical saves; SAV01 owns that broader migration work.

`npm audit` reports one retained low-severity Vue 2 compiler
[ReDoS advisory](https://github.com/advisories/GHSA-5j4c-8p2g-v4jx).
The test asset intentionally matches the already shipped Vue 2.6.12; changing to
Vue 3 would violate TST01's matching-runtime and no-migration scope. Source review
found static repository-owned compiler templates, not a new untrusted-template
input introduced here; this is not a claim that Vue 2 is patched. The proposed
[UI01](UI01.md) owns supported-Vue migration. No automatic audit fix, framework
migration, policy change or purchase was made.

Final remote results and the exact PR head/base are in the PR description/checks.
Leave PR #2 unmerged for human review. Successful checks deliver TST01 evidence;
they do not accept the milestone or authorize the follow-on proposals.
