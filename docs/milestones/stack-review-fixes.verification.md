# Full-stack review corrections — 27 November 2026

The owner requested fixes for R1–R4 in the full-stack review of PRs #2–#7.
Corrections stay on their original milestone branches and flow to descendants
through merge commits. Original commits and PR bases remain intact; no branch
history, accepted plan, lifecycle receipt, permission or service was rewritten.
The existing fenced branch writer registry protected all six exact checkouts.
The active maintenance manifest had no Prestige Tree repository/PR enrollment;
no maintenance pause or default-off coordinator activation was necessary.

## Requirements, changes and proof

| Finding / requirement | Owning correction | Evidence / result |
| --- | --- | --- |
| R1 — TST01 AC01/09, DEV01 AC06, RC-07 | `tests/rules/layer-content.test.cjs` extracts each factory's returned object by Espree AST range | Original CRLF review checkout reproduces `Unexpected token ;`; corrected test compares all 31 immutable SIM01 formulas under both LF and CRLF. Fresh CRLF checkout's complete command passes. |
| R2 — SAV01 AC01/04/05/07, local save preservation, shared preservation and RC-04/07 | `js/save-codec.js` separates save dictionary names from recursively copied player fields | Actual immutable TST01 writer fixture retains selected `prototype` = 456 and sibling `save1` = 123. Load, identity, failed write/original retention, retry, reload and rename pass in rules and rendered Chromium. Inherited collection names and nested pollution keys remain rejected. |
| R3 — SIM01 AC03/04, local ownership, RC-03/04/07 | `js/game-runtime.js` fences start after injected ports and cancels resources returned after reentry | Before: six of seven added cases fail, including three leaked intervals after resume disposal. After: seven pass for dispose, stop, replacement, stop/restart and clock/scheduler/listener disposal; queued callbacks remain inert. DEV01 merge preserves explicit session owner and checked callback tuple types. |
| R4 — TST01 AC10 and shared preparation/hash binding | `TST01.preparation.json` binds canonical Git bytes and records original digest/provenance | Original preparation fails current `validate_preparation`; correction passes with LF/CRLF checkout representations. All six current plans/preparations validate at combined head. Original plan/specification/criteria/source/file scope remain unchanged. |

README → developer guide → save boundary/runtime/layer focused checks provides
the reproducible human entry path. These corrections add no production UI or
performance claim. R2 has rendered successful/error/recovery/context evidence;
R3 uses the exposed injected lifecycle contract plus inherited browser startup,
offline-return and fault recovery. R1/R4 need no new player journey.

## Executed verification

Each row is one complete unfiltered `npm test`, exit 0, with no skipped/todo rule
paths or browser retries. It includes that revision's syntax, rules, sensitivity
and browser stages; DEV01 also includes static/negative checks, and the combined
UI01 includes build, source/package/license/template verification. The Windows row
uses a new detached checkout with `core.autocrlf=true`, confirmed CRLF layer bytes
and successful locked `npm ci` (zero dependency vulnerabilities).

| Candidate | Tested source head | Rules | Chromium journeys | Full command |
| --- | --- | --- | --- | --- |
| SAV01 | `c0032660c06e` | 106 | 12 | passed |
| SIM01 | `75cbabef4bb0` | 134 | 16 | passed |
| LAY01 | `03a9d2584949` | 143 | 16 | passed |
| DEV01 | `e1033f992379` | 149 | 19 | passed |
| WINDOWS | `a65148e6eb86` | 156 | 31 | passed |

TST01's own delta is artifact/documentation only; its binding was validated rather
than rerunning unchanged application code locally. Updated-head CI remains a
publication check, never inferred from older runs. The source tested above is
unchanged by the final evidence-only commit.

Initial attempts are retained in the local evidence folder: a sandbox browser run
stalled, a concurrent attempt failed with port contention, and the first new
rendered test omitted closing the save menu before clicking Save. A standalone
static check also correctly rejected the old package before rebuilding. The owned test
processes were identified/stopped, the journey was corrected, then every final
suite above ran sequentially and passed. No failed command is relabeled as passing.

## Source and standards integrity

Current Orcha main was freshly fetched/resolved at
`cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`. The selected fix/review, readable-code,
checked-JavaScript supplement and preservation contracts were actually read and
resolver hash-verified. [The standards observation](stack-review-fix-standards.json)
records exact paths/hashes and canonical master `077861d` versus proposed-stack
document hashes. The selected source remains registry alias `prestige`, repository
`step3software/Prestige-Tree`, canonical branch `master`; the six existing PRs are
the authorized changing targets. No separate standards pin/adoption was introduced.

All six original heads remain ancestors of their corrected heads, each corrected
parent is an ancestor of its child, and repair deltas pass `git diff --check`.
All six plans, manifest/instructions, package/lockfile, Decimal vendor and licenses
compare byte-identically to the corresponding original branch. The preparation
change retains every field except its corrected binding plus the provenance record.
The broader stack's inherited whitespace is outside this bounded repair.

## Changed-path review

All repair paths were inspected against the original UI01 head `d538252`:

- `js/save-codec.js`: collection validation → player validation/copy → storage/activation callers; nested copy guards remain unchanged.
- `js/game-runtime.js`: start/generation/session checks, timer/listener allocation and cleanup; unchanged browser composition and stopped/error/disposed behavior traced.
- `tests/rules/save-boundary.test.cjs`, `tests/fixtures/tst01-prototype-collection.json`: actual old-writer fixture, selected/sibling values, failure-side effects, reload/rename and rejection assertions inspected and executed.
- `tests/rules/startup-reentry.test.cjs`: adverse callback order, resource counts, repeated disposal/restart and stale delivery assertions inspected and executed.
- `tests/rules/layer-content.test.cjs`: AST selection/ranges, both byte representations and unchanged full formula comparator inspected and executed.
- `tests/browser/save-recovery.spec.cjs`: real controls, persisted bytes, visible status, close/retry/rename and reload inspected and executed on every affected milestone.
- `docs/milestones/TST01.preparation.json`: canonical payload hash and retained original provenance validated mechanically; accepted scope unchanged.
- `docs/milestones/TST01.verification.md`, `SAV01.verification.md`, `SIM01.verification.md`, `DEV01.verification.md`: bounded correction appendices checked for accurate findings/requirements/results and retained history.
- `docs/milestones/stack-review-fix-standards.json`: resolver observation and document hashes verified.
- `docs/milestones/UI01.verification.md` and this report: navigation, final candidate/counts, limitations and source/evidence distinction checked.

## Limits and delivery

All four confirmed review findings are corrected at the combined candidate and at
their affected parents. Representative synthetic and Chromium evidence does not
certify all historical saves, exhaustive late-game balance, other engines, actual
users/assistive technology, OS clipboard or full demo rendering/its pre-existing
lowercase example paths. No new mandatory check is waived. Publish the existing
draft PR heads in dependency order (atomic push), verify exact remote refs/checks,
and leave them unmerged. Human acceptance, deployment and activation stay separate.
