# Permanent Organization milestone unlocks

Source: step3software/Prestige-Tree main `27d24953e2c7c8c1617f22beba00fd668232713a`, after merged PRs #15 and #14. The owner requested correction of milestones resetting after spending. Dedicated branch `codex/persistent-milestones`, worktree `prestige-persistent-milestones`, installed exclusive writer fence 2732. No merge, deployment, service restart or personal-save access is included.

## Behavior and evidence

PR #15 derived every milestone gate from the current spendable balance. Holding 3 and buying Prepared materials reduced the balance to 2 and locked Overseers again. Four direct regression cases failed on unchanged main and passed after correction.

The saved `organization.best` already records the highest balance held. Milestone visibility, new feature/upgrade access, queues, irrigation, auto-building and specific retention now share the greater of that peak and current/prospective held Organization. Successful purchases capture the pre-payment peak. Read-only previews have no mutation. Lifetime totals cannot unlock thresholds never held. Current balances still pay costs and determine `8 + 4 * held Organization` Population requirements, upkeep and construction speed. Bigger-game purchase requirements remain current-balance requirements.

Existing saves use their already persisted peak; no new field, version, alternate reader or migration mode is introduced. Detached decoding and malformed-record rejection remain atomic. A save from #15 can have paused queues whose supervisors were reassigned to paid trips: those counts now wait for available supervisors, then resume without losing active crews, construction or remaining repeats. The runtime derives staffing within the same workforce budget; validation continues to reject overcommitted active crews and malformed counters. Existing starvation recovery and prestige queue clearing remain in force.

| Expectation / standard | Implementation and executed proof | Result |
| --- | --- | --- |
| E1: Reaching each of 1–10 permanently earns that milestone (owner correction; RC-02/03/04) | `organizationMilestones`, feature/order/upgrade/irrigation/auto-builder gates; all-ten-threshold tests across spending, both prestiges and codec reload | Passed |
| E2: Current Organization controls the Population requirement; cumulative earnings cannot bypass unlocks | Real Prepared materials and Extended expeditions purchases produce 20 → 16 → 8; total 50/100 fixtures leave higher never-held milestones locked | Passed |
| E3: Access does not pay for upgrades or extend named retention | Unfunded Work rosters rejection; exact retained/unretained buyables; existing purchase boundary tests use independent fresh fixtures | Passed |
| E4: Queues and paid work remain safe (local state/save contracts; no-legacy-modes) | Saved 3-peak/2-held settlement with all five workers in Hunt/Water and pending Food/hut orders reloads unchanged, waits, resumes as crews return; chunk parity and atomic malformed-save tests | Passed |
| E5: Actual UI and reset preview use the same rules (RC-01/07/08) | README → developer guide → `js/civilization.js` → `js/components.js` → `index.html`; Chromium clicks real spending, sees Active after spending/reload, checks next milestone preview and permanent retention | Passed, automated/rendered |
| Bounded development/publication | Existing branch-writer adapter; isolated worktree; queue and development coordinator verified off and left off; no protected branch or other writer mutated | Verified locally |

## Verification and review

Complete `npm test` passed: build/package and real Vue template compilation; syntax; lexical/type boundary and negative-sensitivity checks; **126 rule/save/runtime/balance tests**; real Population-reset mutation sensitivity; **27 Chromium journeys**. The five focused current-coordination tests include all ten permanent unlocks, affordability, lifetime denial, reload, retention and safely resumed historical queues. The current balance remains visible separately from lifetime statistics. `git diff --check` passed.

The first sandboxed complete run stalled launching Chromium and was interrupted. The final complete run used the installed host Chromium with a fresh temporary browser profile and isolated loopback fixture server. No existing game server or browser profile was changed.

Legal active/regular balance policies completed the existing opening in 2990s/3440s; finite orders, survival recovery and rough/fixed calibration passed. These are synthetic observations, not human pacing targets. No yield, price, growth or survival coefficients were tuned.

Every changed path was inspected: the owning rules in `js/civilization.js`; rendered text in `index.html`; rule coverage in `tests/rules/current-coordination.test.cjs` and `organization-progression.test.cjs`; rendered expectations in `tests/browser/civilization.spec.cjs`; affected canonical meaning/navigation in `docs/civilization.md`, `developer-guide.md`, `balance-testing.md`; and this evidence record. Build consistency was checked mechanically. No confirmed finding remains within this correction. Actual-user usability, assistive technology and other browsers were not tested. Shared TypeScript/React supplements are not applicable to this JavaScript/Vue change; proposed UX standards were not treated as current requirements.

## Governing revisions and SHA-256 hashes

Current Orcha main was freshly fetched as `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78` and rechecked before publication. Orcha's `standards_resolver.resolve(task='fix')` verified every applicable current catalog hash against that captured main. The review procedure was also read. Project main and effective AGENTS select main, matching the explicit PR's actual base; the retained registry/manifest master discrepancy remains unchanged rather than silently selecting an absent branch.

| Revision | Document | SHA-256 |
| --- | --- | --- |
| cc45f3c | docs/pr-development-coordination.md | 939b59a53584e981798733a2292b3318f00d15ee01f230cb63a87f2eaf22bf0e |
| cc45f3c | docs/agent-workflows/intent-routing.md | 3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed |
| cc45f3c | docs/agent-workflows/fix.md | 5ccd0b047ab4f7afc906e3ab6a77c03eeda76b2f771ceb47322b4386e26c61c6 |
| cc45f3c | docs/standards/no-legacy-modes.md | 913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156 |
| cc45f3c | docs/standards/readable-code.md | fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e |
| cc45f3c | AGENTS.md | 6f832fe94b7a9b1a77560bf811bf6aef76da2567009db5e9d815a33f720d1888 |
| cc45f3c | README.md | 847dab7c34dcee9a575ca90d5b50ac383b4fde239d97145fa79dd562be6d28e5 |
| cc45f3c | config/repositories.json | 18cf54987abcdec4b58089eaa6091fc636e94e2f18bfeec149fb836e9a782e86 |
| cc45f3c | standards/catalog.json | 5850f5eb70397db5dccede9b9dbbf5de27861a8cfcb8676cda6337b608532651 |
| cc45f3c | docs/agent-workflows/review.md | d0a6df1eb01857876d799cc1997dc3c021ec59e0b377fa207ae4187067d9c05b |
| 27d2495 | AGENTS.md | aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6 |
| 27d2495 | .orcha/repository.json | d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585 |
| 27d2495 | docs/!general-info.md | 06420ab8ce5eb231928fd93aa17552580840128039f6e6d1fe5a4614ecf1570e |
| 27d2495 | docs/developer-guide.md | 1d3815bea8b04690919aa2ae5e58b8d37603064b38985098335d5bafd5e41406 |
| 27d2495 | docs/civilization.md | e84bbc35143de35a3dcf97d38f646abf063e09c6f2948625ff3d757f179bb238 |
| 27d2495 | docs/balance-testing.md | fde892c4dd008512c4ceedc1a2cfbf6437a3c4f8b514d2affa336b0d32c08f87 |
