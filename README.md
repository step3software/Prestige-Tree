# Civ Prestige Tree

Grow a civilization from five people. Population supplies shared labor; Food and Water sustain growth; Shelter creates room. Abundant Food, Water and spare housing independently accelerate growth up to 10×, helping rebuild after starvation. [Growth curves](docs/civilization.md#abundance-growth-curves) explain the one-minute thresholds. Develop Craft and Organization. Later resource branches are locked and hidden for now.

For the civilization's historical grounding, start at the [research index](docs/research/README.md) and [game reference guide](docs/research/reference-guide.md). Build balance coverage alongside content using the [balance workflow](docs/balance-testing.md#add-balance-coverage-with-content).

Send Gather, Hunt and Fish expeditions in parallel when workers are available. Collect Water into water reserves; carrying upgrades and a gravity-fed spring free the hauling crew. Expedition Overseer sliders queue up to five repeats per Food route, one job at a time with one shared Overseer and full crews; farming adds longer cycles, and every Food cycle still uses its crew. Build new huts for capacity. Every person is available for expeditions or construction; there is no domestic labor reservation.

Shared hearths adds 5 Food storage and 1 continuous Food per game minute for every full 10 current Population. These settlement-wide bonuses supplement expeditions and reset to zero when prestige restarts at five people. See [Shelter rules](docs/civilization.md#shelter-expand-housing) and the [research rationale](docs/research/reference-guide.md#shared-hearths).

Food baskets and earthenware water jars each cost 1 Craft and add 40 of their supply’s storage; their work requirement still scales with the number owned. Food buyables have distinct tradeoffs: explore farther for longer, richer gathering trips; organize larger hunting parties for bigger game; or spend Craft on river traps for larger catches with the same fishing crew. See [Food routes](docs/civilization.md#worker-actions-and-food-routes) for costs and scaling.

Each foundation starts with one available Craft upgrade. Organization milestones 1–3 unlock Fishing nets, Well lining and Timber frames. Milestones 4–10 reveal later Craft upgrades and retain named buyables individually; Hut Foreman unlocks repeating hut batches at 4; general auto-building arrives at 10. Other buyables reset on prestige. Purchased one-time upgrades stay. Both prestiges restart with 5 Population and 10 of each supply. Craft starts at 12 Population and adds one per two more; Organization starts at 12 Population and raises its one-point requirement by four each time. The preview lists exact losses and retained progress.

This game replaces the fork's original Prestige Tree Rewritten content. It runs on the retained session-bound Modding Tree engine with Vue 3 and Decimal arithmetic. Original attribution and both licenses are retained. The game retains the base project's dark theme, monospace typography, colored circular nodes and action-button styling.

Empty Food or Water causes population loss after a ten-second grace period, then accelerating losses. Survival upgrades extend grace or slow acceleration. One survivor remains able to rebuild. Food repeat orders reserve one Overseer; hut repeat orders reserve one foreman plus one builder per hut. Both use 0-5 sliders that count down after each successful automatic start and stop at zero; prestige clears the queues. Water collection stays manual until Gravity-fed spring. Existing Water Keeper purchases become Hut Foreman in v0.7.

## Play locally

From a dedicated worktree, use Node 24.22.1 and npm 11.19.1:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:8000/. On Windows/macOS, `dev` builds once, watches the packaged HTML/JS/CSS and build tooling, then rebuilds and restarts the local server on changes. Refresh the browser after a rebuild. Stop with Ctrl+C. Generated `dist/` changes do not trigger another build. For a one-time build and preview, use `npm run build` followed by `npm run serve`. The static package contains its own Vue runtime; gameplay makes no external requests.

Run `npm test` for package integrity, syntax, lexical/type boundaries, sensitivity checks, deterministic economy/save/runtime/balance rules and Chromium journeys. Run `npm run balance -- --hours 4 --calibrate-minutes 60` for active and regular pacing observations: regular checks every 20 seconds in the opening, then every five minutes after Food repeat orders, worker-free Water and milestone-10 auto-building. See the [balance guide](docs/balance-testing.md). Playwright requires its matching Chromium installation (`npx playwright install chromium`).

## Find and change the rules

- [Civilization design](docs/civilization.md): resource relationships, pacing coefficients, reset consequences and save isolation.
- [Developer guide](docs/developer-guide.md): actual owners, commands and focused checks.
- [CIV01 delivery scope](docs/milestones/CIV01.md), [preparation](docs/milestones/CIV01.preparation.json) and [verification](docs/milestones/CIV01.verification.md).
- [Agent instructions](AGENTS.md), [Orcha manifest](.orcha/repository.json) and [engine feature reference](docs/!general-info.md).

Civ uses `civ-prestige-tree` browser storage. The previous game's `ptr` saves are neither read nor changed. Export Civ saves through Settings to back them up. Incompatible imports are rejected; malformed or inaccessible storage opens recovery without overwriting the original.

The owner selected current `main` for this replacement. The branch was reconciled with `d7d260f`, including its AGENTS source correction and balance-testing workflow. The retained manifest/Orcha registry still name `master`; no native lifecycle authority is changed.

Based on [The Prestige Tree](https://github.com/Jacorb90/Prestige-Tree) by Jacorb and Aarex and The Modding Tree by Acamaeda; original idea by papyrus. See [LICENSE](LICENSE) and [Prestige-tree-license](Prestige-tree-license).
