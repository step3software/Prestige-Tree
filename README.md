# Civ Prestige Tree

Grow a civilization from five people. Population supplies shared labor; Food and Water sustain growth; Shelter creates room. Develop Craft and Organization, then Money, free Time, Education and Culture.

This game replaces the fork's original Prestige Tree Rewritten content. It runs on the retained session-bound Modding Tree engine with Vue 3 and Decimal arithmetic. Original attribution and both licenses are retained.

## Play locally

From a dedicated worktree, use Node 24.22.1 and npm 11.19.1:

```powershell
npm ci
npm run build
npm run serve
```

Open http://127.0.0.1:8000/. The static `dist/` package contains its own Vue runtime; gameplay makes no external requests. Stop the local server with Ctrl+C.

Run `npm test` for package integrity, syntax, lexical/type boundaries, sensitivity checks, deterministic economy/save/runtime/balance rules and Chromium journeys. Run `npm run balance -- --hours 4 --calibrate-minutes 60` for active and five-minute regular pacing observations; see the [balance guide](docs/balance-testing.md). Playwright requires its matching Chromium installation (`npx playwright install chromium`).

## Find and change the rules

- [Civilization design](docs/civilization.md): resource relationships, pacing coefficients, reset consequences and save isolation.
- [Developer guide](docs/developer-guide.md): actual owners, commands and focused checks.
- [CIV01 delivery scope](docs/milestones/CIV01.md), [preparation](docs/milestones/CIV01.preparation.json) and [verification](docs/milestones/CIV01.verification.md).
- [Agent instructions](AGENTS.md), [Orcha manifest](.orcha/repository.json) and [engine feature reference](docs/!general-info.md).

Civ uses `civ-prestige-tree` browser storage. The previous game's `ptr` saves are neither read nor changed. Export Civ saves through Settings to back them up. Incompatible imports are rejected; malformed or inaccessible storage opens recovery without overwriting the original.

The owner selected current `main` for this replacement. The branch was reconciled with `d7d260f`, including its AGENTS source correction and balance-testing workflow. The retained manifest/Orcha registry still name `master`; no native lifecycle authority is changed.

Based on [The Prestige Tree](https://github.com/Jacorb90/Prestige-Tree) by Jacorb and Aarex and The Modding Tree by Acamaeda; original idea by papyrus. See [LICENSE](LICENSE) and [Prestige-tree-license](Prestige-tree-license).
