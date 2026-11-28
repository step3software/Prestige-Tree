# Civ Prestige Tree

Civ Prestige Tree is a settlement incremental game about allocating people to Food, Water, construction and Fire. Start with 5 people and housing for 8. Organization 1 unlocks basic huts; Craft starts at 12 people. Food and hut overseers unlock at Organization 3. Both prestiges restart Population at five while preserving learned techniques and the exact physical buyables protected by earned milestones.

Version 0.9 adds three Craft material rows: **Crafting (10 Craft), Clay (20), Copper working (30)**. Each reveals four related purchases costing 1, 2 or 3 Craft. Water storage upgrades **Woven baskets -> Earthenware jars**, Cooking upgrades **Clay cooking pots -> Copper pots**, and housing upgrades **Thatched roofs -> Bricks**. Counts and paid work stay with their original buyable. Copper also provides axes, knives and Farming sickles. See [material rules](docs/civilization.md#materials-and-equipment).

Craft begins at 12 Population, adding one point per two more people. Organization begins at 8 Population and its next one-point requirement rises by four per currently held point. Milestones stay earned after their held threshold is reached. Spending lowers the next Population requirement; pending queues wait only for available supervisors, keeping active work and counts. Lifetime totals are historical statistics. Both reset Population to five and seed 10 Food/Water. Purchased upgrades, currencies and lifetime progress persist; the preview lists exact buyable retention. Holding Craft adds no passive production bonus.

Fire unlocks at Organization 4. Its tenders share the settlement's workers. Cooking and Shared hearths retain their Fire prices; three repeatable Fire buyables add capacity, tender output and fuel efficiency. Clay/Copper pots improve actual Cooking consumption/yield. The spring at Organization 5 supplements manual hauling: its unmodified supply sustains eight people at current upkeep. Pipes double passive flow. Larger settlements still need sufficient wells or manual collection. [Fire and Water rules](docs/civilization.md#fire-capacity-tending-and-cooking) define the formulas.

The game retains the session-bound Modding Tree engine, Vue 3, Decimal arithmetic, dark theme and upstream attribution/licenses. Empty Food or Water causes accelerating losses after a grace period; one survivor can rebuild. Older Civ saves migrate into the current model without retroactive charges. Money/Time and later branches remain hidden.

Timber frames is available in Shelter after Organization 1 for 2 Craft. It keeps up to one completed hut per earned Organization milestone on Craft and Organization resets, replacing its former housing bonus. Newly earned milestones count immediately; milestone 10 still keeps all huts and hut work. Version 0.9.1 converts old Timber frames housing while preserving counts, Population and paid work; roofs and bricks keep their bonuses.

## Play locally

From a dedicated worktree, use Node 24.22.1 and npm 11.19.1:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:8000/. On Windows/macOS, `dev` builds once, watches the packaged HTML/JS/CSS and build tooling, then rebuilds and restarts the local server on changes. Refresh the browser after a rebuild. Stop with Ctrl+C. Generated `dist/` changes do not trigger another build. For a one-time build and preview, use `npm run build` followed by `npm run serve`. The static package contains its own Vue runtime; gameplay makes no external requests.

Run `npm test` for package integrity, syntax, lexical/type boundaries, sensitivity checks, deterministic economy/save/runtime/balance rules and Chromium journeys. Run `npm run balance -- --hours 4 --calibrate-minutes 240` for active and regular pacing observations: regular checks every 20 seconds in the opening, then every five minutes only if Food orders, auto-building and passive Water can sustain full housing; the current opening retains 20-second hauling checks. See the [balance guide](docs/balance-testing.md). Playwright requires its matching Chromium installation (`npx playwright install chromium`).

## Find and change the rules

- [Craft materials and Water implementation plan](docs/milestones/MAT01.md): material rows, costs, research and migration; see the verification companion for implementation evidence.
- [Civilization design](docs/civilization.md): resource relationships, pacing coefficients, reset consequences and save isolation.
- [Developer guide](docs/developer-guide.md): actual owners, commands and focused checks.
- [CIV01 delivery scope](docs/milestones/CIV01.md), [preparation](docs/milestones/CIV01.preparation.json) and [verification](docs/milestones/CIV01.verification.md).
- [Agent instructions](AGENTS.md), [Orcha manifest](.orcha/repository.json) and [engine feature reference](docs/!general-info.md).

Civ uses `civ-prestige-tree` browser storage. The previous game's `ptr` saves are neither read nor changed. Export Civ saves through Settings to back them up. Incompatible imports are rejected; malformed or inaccessible storage opens recovery without overwriting the original.

The owner selected current `main` for this replacement. The branch was reconciled with `d7d260f`, including its AGENTS source correction and balance-testing workflow. The retained manifest/Orcha registry still name `master`; no native lifecycle authority is changed.

Based on [The Prestige Tree](https://github.com/Jacorb90/Prestige-Tree) by Jacorb and Aarex and The Modding Tree by Acamaeda; original idea by papyrus. See [LICENSE](LICENSE) and [Prestige-tree-license](Prestige-tree-license).
