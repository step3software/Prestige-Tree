# Developing Prestige Tree

This fork contains Prestige Tree Rewritten, a browser incremental game built on
The Modding Tree. The upstream README and engine tutorials retain their original
names. Start with [agent instructions](../AGENTS.md) and the
[manifest](../.orcha/repository.json), then follow the relevant route below.
The [engine documentation index](!general-info.md) owns feature reference material;
its historical file paths should be checked against the current source map here.

## Run locally

The game uses plain JavaScript, HTML and CSS, Vue **2.6.12** loaded by
`index.html` from jsDelivr, and a checked-in `break_eternity.js` Decimal library.
There is no package manifest, dependency installation, build step, automated test
runner or CI workflow in the onboarding baseline. Keep those limitations explicit.

From an isolated worktree root, open `index.html` in a current browser as described
in [getting started](getting-started.md). For a consistent local HTTP origin, with
Python 3 installed, run:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/`. This command starts a local server; stop it with
Ctrl+C. Expected result: the Prestige Tree Rewritten game renders, its tree/tabs
respond, and the console has no new errors. Vue and Google Fonts require network
access; a checkout alone does not establish offline availability. Git fetch/push
and PR commands contact GitHub; serving files locally does not publish the game.

Use a disposable browser profile/origin with synthetic saves. Saves are local
browser state under `modInfo.id` (`ptr`), owned by `js/utils.js`; do not overwrite
someone's existing progress. Never change that ID as routine setup for this fork.
Save or schema changes need an explicit migration and recovery plan. Preserve
export/import, reset, Decimal arithmetic and offline progress behavior.

## Find the behavior

| Task | Owning implementation | Relevant reference |
| --- | --- | --- |
| Page startup and script order | `index.html` → `load()` in `js/utils.js` | [Main mod info](main-mod-info.md) |
| Game identity, version, point rules | `js/mod.js` | [Main mod info](main-mod-info.md) |
| Layer costs, rewards, upgrades and progression | `js/layers.js`; purchases in `js/utils.js` | [Layers](basic-layer-breakdown.md), [upgrades](upgrades.md) |
| Tick and reset calculations | `js/game.js`; derived values in `js/technical/temp.js` | [Layer features](layer-features.md) |
| Saves, export/import and loading | `js/utils.js` (`save`, `load`, `exportSave`, `importSave`) | [Mod configuration](main-mod-info.md) |
| Vue UI and tree display | `js/components.js`, `js/technical/systemComponents.js`, `js/tree.js`, `js/technical/canvas.js`, `style.css` | [Tabs](custom-tab-layouts.md), [trees](trees-and-tree-customization.md) |
| Layer registration and large numbers | `js/technical/layerSupport.js`, `js/technical/break_eternity.js` | [General info](!general-info.md) |

The feature reference is engine guidance, not proof of current implementation.
`Old Code/` is historical reference and is not loaded by the main page.
`demo.html` and `js/Demo/` are engine examples, not an automated regression suite.
No generated source is identified in the baseline; preserve vendored library
attribution in both [licenses](../LICENSE) and [Prestige Tree license](../Prestige-tree-license).

## Verify a focused change

For an upgrade change, trace `js/layers.js` → the upgrade UI in
`js/components.js` → `buyUpg()` in `js/utils.js` → `player[layer].upgrades` and
currency state. Use an existing nearby layer as the implementation example.
In a disposable session check locked and insufficient-funds states, one valid
purchase, repeated purchase rejection and save/reload retention. Record actual
results in the PR; no existing automated regression test covers this route.

With Node.js installed, syntax-check only changed JavaScript, for example from
the worktree root:

```powershell
node --check js/mod.js
```

Expected result: exit 0. A syntax pass does not prove browser behavior. For a
functional change, also exercise its normal and relevant failure/recovery paths
and inspect the browser console. UI changes need browser evidence. Documentation
and manifest changes need content, link and schema checks; do not claim game
verification from those checks.

With a verified Orcha checkout available, validate the bootstrap with:

```powershell
python <orcha-checkout>/standards_check.py --repository . --orcha <orcha-checkout>
```

This observes remote Orcha `main` and checks manifest/reference integrity. Success
reports `reference_valid: true`; it does not certify workflow exercise, game
correctness, domain compliance or milestone acceptance.

## Delivery

Create a focused PR from the dedicated branch to `step3software/Prestige-Tree`
`master`. Include changed behavior, exact source/standards revisions, checks
actually run and limitations. Preserve upstream attribution and save data.
Shared development process belongs to Orcha; local setup and game rules belong
here. A PR or standards check grants no merge, release or service activation.
