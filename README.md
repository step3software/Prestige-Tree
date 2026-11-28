# Civ Prestige Tree

Civ Prestige Tree is a settlement incremental game about allocating people to Food, Water and construction. New games start with gathering and manual Water collection. Organization milestone 1 unlocks huts, milestone 2 unlocks hunting, and milestone 3 unlocks separate Food and Hut overseer queues. Each milestone reveals three related upgrades: MS1/MS2 cost 1, 2 and 3 Craft; MS3 costs 1, 2 and 3 Organization. [Current rules](docs/civilization.md#early-organization-milestones) describe all effects and guards.

MS1 offers Cord lashings, Timber frames and Construction tools. MS2 offers Digging sticks, Spear hunting and Butchery tools. MS3 offers Prepared materials, Extended expeditions and Work rosters. Expedition length can be set independently to 1-5 times duration and yield. Work rosters allows 1-5 overseers each for Food and huts, supporting repeat caps of 5-25. Each successful automatic start consumes one repeat; zero stops further starts. Crews/builders remain separate from supervisors, and prestige clears queues.

Craft begins at 12 Population, adding one point per two more people. Organization begins at 8 Population and its next one-point requirement rises by four per currently held point. Milestone gates also use current held Coordination, so spending can lock them again. Active paid work finishes and pending queues pause without losing counts. Lifetime totals are historical statistics. Both reset Population to five and seed 10 Food/Water. Purchased upgrades, currencies and lifetime progress persist; the preview lists exact buyable retention. Cord lashings changes hut work scaling from 1.35 to 1.25; Timber frames adds capacity and Construction tools doubles construction speed. Holding Craft adds no passive production bonus.

Organization 4 unlocks Fire: stored capacity is `10 + 2 × huts`, and 0–5 tenders share the settlement's workers. A red bar shows reserves, tending, consumption and net change. Cooking (1 Fire) offers a separate 1–5× Food slider with ongoing fuel costs; Earthenware jars (2 Fire) raises base Water storage to 100 and each jar purchase to +120 with scaling Fire costs; Shared hearths (3 Fire) adds +25 Food storage and up to +4 Food/min per ten people, scaled by Fire fullness. Prestige clears Fire and tenders while keeping upgrades. [Fire rules](docs/civilization.md#fire-capacity-tending-and-cooking) and [verification](docs/fire.verification.md) cover depletion, save preservation and tradeoffs.

The later gates are Gravity-fed spring 5, Food/Water buyables 6, Farming 7, Abundance 8 and Farming-only irrigation 9. Fishing remains available to existing discovered settlements; it has no assigned milestone for new games. Existing saves preserve stocks, paid construction and active snapshots. New starts obey current held Organization gates.

The game retains the session-bound Modding Tree engine, Vue 3, Decimal arithmetic, base dark theme and original attribution/licenses. Empty Food or Water causes accelerating losses after a grace period; one survivor can rebuild. The current release remains v0.8.

## Play locally

From a dedicated worktree, use Node 24.22.1 and npm 11.19.1:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:8000/. On Windows/macOS, `dev` builds once, watches the packaged HTML/JS/CSS and build tooling, then rebuilds and restarts the local server on changes. Refresh the browser after a rebuild. Stop with Ctrl+C. Generated `dist/` changes do not trigger another build. For a one-time build and preview, use `npm run build` followed by `npm run serve`. The static package contains its own Vue runtime; gameplay makes no external requests.

Run `npm test` for package integrity, syntax, lexical/type boundaries, sensitivity checks, deterministic economy/save/runtime/balance rules and Chromium journeys. Run `npm run balance -- --hours 4 --calibrate-minutes 60` for active and regular pacing observations: regular checks every 20 seconds in the opening, then every five minutes after Food repeat orders, worker-free Water and milestone-10 auto-building. See the [balance guide](docs/balance-testing.md). Playwright requires its matching Chromium installation (`npx playwright install chromium`).

## Find and change the rules

- [Craft materials and Water implementation plan](docs/milestones/MAT01.md): proposed material rows, costs, research, migration and open decisions; no gameplay change.
- [Civilization design](docs/civilization.md): resource relationships, pacing coefficients, reset consequences and save isolation.
- [Developer guide](docs/developer-guide.md): actual owners, commands and focused checks.
- [CIV01 delivery scope](docs/milestones/CIV01.md), [preparation](docs/milestones/CIV01.preparation.json) and [verification](docs/milestones/CIV01.verification.md).
- [Agent instructions](AGENTS.md), [Orcha manifest](.orcha/repository.json) and [engine feature reference](docs/!general-info.md).

Civ uses `civ-prestige-tree` browser storage. The previous game's `ptr` saves are neither read nor changed. Export Civ saves through Settings to back them up. Incompatible imports are rejected; malformed or inaccessible storage opens recovery without overwriting the original.

The owner selected current `main` for this replacement. The branch was reconciled with `d7d260f`, including its AGENTS source correction and balance-testing workflow. The retained manifest/Orcha registry still name `master`; no native lifecycle authority is changed.

Based on [The Prestige Tree](https://github.com/Jacorb90/Prestige-Tree) by Jacorb and Aarex and The Modding Tree by Acamaeda; original idea by papyrus. See [LICENSE](LICENSE) and [Prestige-tree-license](Prestige-tree-license).
