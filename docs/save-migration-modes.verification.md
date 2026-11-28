# Save migration modes — verification

Owner request: distinguish dev/prod, use dev now, keep surviving saves usable,
and discard removed content without refunds. The owner explicitly accepts lost
development progress. This bounds the data-loss exception to removed game
content; malformed retained data and failed atomic loads still fail safely.

## Source and authority

- Project: `step3software/Prestige-Tree`, source `main` at
  `280caf5edf6f20c9d5a30eda1b6c77c13b0de710`.
- The freshly read registry and retained manifest still name `master`; a fresh
  fetch confirms that branch no longer exists. Published project AGENTS, README
  and developer guide explicitly record the owner-selected correction to `main`.
  This task follows that documented correction without changing either registry,
  permissions or lifecycle authority.
- Dedicated branch/worktree: `codex/save-migration-modes` /
  `C:\Users\PhillipCurry\projects\codex\games\prestige-save-migration-modes`.
  The installed Orcha `branch_writers` API verified its exact Git identity and
  acquired exclusive fenced protection. Private receipts remain outside source.
  Default-off development coordination was not activated.
- Fresh open PR inventory contained #19–22, with no save-policy branch. No other
  branch was edited; publication targets an unmerged draft PR to `main`.
- Orcha `main`: `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`, freshly fetched.
  Its `standards_resolver.resolve(task='feature')` verified the selected catalog
  hashes from those exact Git objects. Shared coordination control definitions
  were additionally read for the installed writer protocol.

SHA-256 of governing documents read for this run:

| Orcha document | SHA-256 |
| --- | --- |
| `AGENTS.md` | `6f832fe94b7a9b1a77560bf811bf6aef76da2567009db5e9d815a33f720d1888` |
| `config/repositories.json` | `18cf54987abcdec4b58089eaa6091fc636e94e2f18bfeec149fb836e9a782e86` |
| `README.md` topic index | `847dab7c34dcee9a575ca90d5b50ac383b4fde239d97145fa79dd562be6d28e5` |
| `standards/catalog.json` | `5850f5eb70397db5dccede9b9dbbf5de27861a8cfcb8676cda6337b608532651` |
| `docs/agent-workflows/intent-routing.md` | `3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed` |
| `docs/agent-workflows/feature.md` | `52279cc4869aa56c9a40efe7c2e136177feb807053783039c3c4e7dfa95170b3` |
| `docs/standards/no-legacy-modes.md` | `913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156` |
| `docs/standards/readable-code.md` | `fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e` |
| `docs/pr-development-coordination.md` control definitions | `939b59a53584e981798733a2292b3318f00d15ee01f230cb63a87f2eaf22bf0e` |

| Project document at source revision | SHA-256 |
| --- | --- |
| `AGENTS.md` | `aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6` |
| `.orcha/repository.json` | `d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585` |
| `docs/developer-guide.md` | `9f1b2bb74adcf64e3c03c3df5a246ebc0149e6f0ccf20d00ef6249b5a107f220` |
| `docs/!general-info.md` | `cb43c339d4d4846066e850fabd4e223d3342f64aeb2ad00c5795a001004f80bd` |
| `docs/civilization.md` save contract | `ba633f657f0da2f73995d3fa32f1cd52ed0242988143f1a66019d00137e74959` |

## Requirement and implementation evidence

| Requirement | Implementation and verification |
| --- | --- |
| Dev now; production remains a deliberate choice | `js/mod.js:saveMigrationMode` is `dev`, passed by `js/saves.js`. A saved policy field cannot select it. Generic codec default remains conservative `prod`; invalid source modes reject. |
| Drop removed content without refunds | `save-codec.js:dropRemovedFields` uses current defaults; `checkReferences` filters removed IDs. `civilization.migrateData` cancels unknown projects using the same project ID list as validation. Tests preserve Craft/Water balances exactly, omit deleted content, release crews and verify idempotent round trips. |
| Keep surviving saves usable | Missing fields hydrate from current defaults; existing structural converters remain. Current action snapshots, construction, Population and subsecond remainder survive. Removed Water keeper gives no Hut foreman in dev. |
| Careful prod behavior | No dev pruning; unhandled removed content rejects. The existing versioned Water keeper conversion remains, with explicit prod tests. Future prod changes require tested preservation/conversion or an explicit compensation policy. |
| Atomic failures and storage isolation | Both policies reject malformed current content, negative supplies, foreign identities and newer versions. A malformed second collection slot prevents all startup writes and retains original bytes. Startup/import/save tests protect `ptr` and exercise actual storage commands. |
| One current model/runtime (no-legacy-modes) | These are ingress policies, not historical game runtimes. Both normalize into the same model and existing simulation/storage owner. The owner's explicit dev loss decision is recorded above. |
| RC-01/03/04/06/07/08 | README → developer-guide save-mode section → codec → domain migration/validation → atomic storage → `save-migration-modes.test.cjs`. Mode ownership, discarded-state consequences and focused commands are discoverable in repository content. No new service, save-selected policy or persistent migration framework. |

## Checks

- Locked dependencies installed with `npm ci --ignore-scripts` on Node 24.22.1 /
  npm 11.19.1.
- `node --test tests/rules/*.test.cjs`: 170 passed (including the initial eight
  mode tests). Final focused `save-migration-modes.test.cjs`: nine passed after
  adding malformed-collection recovery and tightening active-challenge typing.
- Build, package identity/template compilation, syntax, checked JavaScript and
  lexical boundaries, static sensitivity and real prestige sensitivity passed.
- `npm run test:browser`: all 33 Chromium journeys passed, including historical
  startup, reload, denied import and corrupt-storage recovery. The sandboxed run
  could not launch its browser/server processes and was stopped; the suite passed
  through the approved elevated local test execution.
- `git diff --check`: passed.

Prod preserves existing explicit conversions; it cannot invent a conversion for
future removals, nor recover content already discarded by a successful dev save.
No release, merge, deployment or running-game/save mutation is part of this task.
