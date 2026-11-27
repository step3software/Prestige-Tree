# Civ Prestige Tree

Grow a civilization from five people. Population supplies shared labor; Food and Water sustain growth; Shelter creates room. Develop Craft and Organization, then Money, free Time, Education and Culture.

For the civilization's historical grounding, start at the [research index](docs/research/README.md) and [game reference guide](docs/research/reference-guide.md). Build balance coverage alongside content using the [balance workflow](docs/balance-testing.md#add-balance-coverage-with-content).

Send Gather, Hunt and Fish expeditions in parallel when workers are available. Collect Water into a reservoir; carrying upgrades and a gravity-fed spring free the hauling crew. Food overseers repeat trips with workers, farming adds longer cycles, and worker-free Food comes later. Build new huts for capacity or improve existing homes to free domestic labor.

Prestige resets repeatable buyables until lifetime Organization milestones protect Water at 1, Food at 3 and Shelter at 5. One-time upgrades and Population stay; the reset preview lists the exact losses and retained progress.

This game replaces the fork's original Prestige Tree Rewritten content. It runs on the retained session-bound Modding Tree engine with Vue 3 and Decimal arithmetic. Original attribution and both licenses are retained. The game retains the base project's dark theme, monospace typography, colored circular nodes and action-button styling.

## Play locally

From a dedicated worktree, use Node 24.22.1 and npm 11.19.1:

```powershell
npm ci
npm run build
npm run serve
```

Open http://127.0.0.1:8000/. The static `dist/` package contains its own Vue runtime; gameplay makes no external requests. Stop the local server with Ctrl+C.

Run `npm test` for package integrity, syntax, lexical/type boundaries, sensitivity checks, deterministic economy/save/runtime/balance rules and Chromium journeys. Run `npm run balance -- --hours 4 --calibrate-minutes 60` for active and regular pacing observations: regular checks every 20 seconds in the opening, then every five minutes after Food repeat orders and worker-free Water. See the [balance guide](docs/balance-testing.md). Playwright requires its matching Chromium installation (`npx playwright install chromium`).

## Find and change the rules

- [Civilization design](docs/civilization.md): resource relationships, pacing coefficients, reset consequences and save isolation.
- [Developer guide](docs/developer-guide.md): actual owners, commands and focused checks.
- [CIV01 delivery scope](docs/milestones/CIV01.md), [preparation](docs/milestones/CIV01.preparation.json) and [verification](docs/milestones/CIV01.verification.md).
- [Agent instructions](AGENTS.md), [Orcha manifest](.orcha/repository.json) and [engine feature reference](docs/!general-info.md).

Civ uses `civ-prestige-tree` browser storage. The previous game's `ptr` saves are neither read nor changed. Export Civ saves through Settings to back them up. Incompatible imports are rejected; malformed or inaccessible storage opens recovery without overwriting the original.

The owner selected current `main` for this replacement. The branch was reconciled with `d7d260f`, including its AGENTS source correction and balance-testing workflow. The retained manifest/Orcha registry still name `master`; no native lifecycle authority is changed.

Based on [The Prestige Tree](https://github.com/Jacorb90/Prestige-Tree) by Jacorb and Aarex and The Modding Tree by Acamaeda; original idea by papyrus. See [LICENSE](LICENSE) and [Prestige-tree-license](Prestige-tree-license).
