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
There is no application build step. The regression tools use Node **24.22.1**
([.node-version](../.node-version)), npm **11.19.1**, Playwright **1.65.1** and
Chromium pinned by that Playwright release. The test-only Vue dependency is exactly
**2.6.12**, matching the shipped page; this change does not migrate Vue.

From an isolated worktree root, open `index.html` in a current browser. The
[upstream tutorial](getting-started.md) describes that file-opening step, but its
fork creation, mod ID changes and direct commits/pushes to `master` do not apply
to development in this existing fork. Follow this guide and `AGENTS.md` instead.
For a consistent local HTTP origin, with Python 3 installed, run:

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

From a dedicated worktree root on Windows or the Ubuntu CI runner:

```powershell
npm ci
npx playwright install chromium
npm run test:syntax
npm run test:rules
npm run test:sensitivity
npm run test:browser
```

Install the version in `.node-version` and npm 11.19.1 first. `npm ci` installs
the generated [lockfile](../package-lock.json); do not edit that file manually.
Regenerate it with `npm install --package-lock-only --ignore-scripts` after an
intentional dependency change. The install and browser-download commands contact
npm/Playwright distribution servers. Linux hosts also need browser OS dependencies;
CI uses `npx playwright install --with-deps chromium` on `ubuntu-24.04`.
Every required test command exits **0** on success and nonzero on failure.
`npm test` runs all four required checks after installation. For a focused rule
run, use `node --test --test-name-pattern="F1" tests/rules/save-safety.test.cjs`;
the final required suite must run without filtering, skips or retries.

| Behavior to change | Test and concrete entry route |
| --- | --- |
| Prestige, purchases, resets, Decimal round-trips | [progression.test.cjs](../tests/rules/progression.test.cjs): real `load` → `doReset` → `buyUpg` → tick → `save`/reload |
| Import validation, atomic persistence, save menu | [save-safety.test.cjs](../tests/rules/save-safety.test.cjs): `importSave` → `validateImportedSave`/`fixSave(candidate)` → one storage write → reload; rejection keeps active/durable state |
| Offline elapsed time and bank consumption | [clock.test.cjs](../tests/rules/clock.test.cjs): `load` accumulation → the actual 50ms tick; bank units are seconds, `offlineLimit` is hours |
| Rendered controls and recovery | [game.spec.cjs](../tests/browser/game.spec.cjs): actual page, Options/Import, prestige and save-menu buttons |

Copy the nearby test for a bounded behavior change. The
[VM runtime](../tests/support/game-runtime.cjs) reads script order from `index.html`,
executes the shipped scripts/Decimal, and isolates clock, timers and storage per
case. Vue/DOM are I/O adapters there; VM passes do not establish rendered behavior.
The [synthetic fixture](../tests/fixtures/representative-save.json) is test data,
not someone's save. It covers huge Decimals, array-held Decimals, upgrade/milestone
IDs and dormant-layer state. The sensitivity command also reads immutable baseline
`077861d` with Git and tests two source mutations **only in memory**. Keep Git
history available (`fetch-depth: 0` in CI); it changes no checked-out game source.

Browser tests create fresh Chromium contexts and start/stop their own loopback
server on **127.0.0.1:4173**. That server serves the actual game page and scripts,
substituting the locked local Vue asset and omitting Google Fonts in its test
response. External requests are blocked. This is a test adapter, not evidence the
shipped CDN-based game works offline. Tests control game time instead of waiting
for progression. No command reads a real browser profile or existing player save.

Generated `node_modules/`, `rule-results.xml`, `playwright-report/` and `test-results/` are ignored;
they are not source. The rule JUnit report, HTML report and failure-only trace/screenshots contain
synthetic data. CI retains failure artifacts for three days and uses read-only
repository permissions, no application secrets, deployment or paid runner setup.
Chromium coverage does not establish other engines, full late-game balance or
actual-user usability. Native import-error alerts use the browser's keyboard and
responsive dialog behavior. A tick exception pauses ticking and **all save writes**
until reload, preserving the last durable save; reload is the recovery action.

For an upgrade change, trace `js/layers.js` → the upgrade UI in
`js/components.js` → `buyUpg()` in `js/utils.js` → `player[layer].upgrades` and
currency state. Use an existing nearby layer as the implementation example.
In a disposable session check locked and insufficient-funds states, one valid
purchase, repeated purchase rejection and save/reload retention. Run the progression
test above and record any additional rendered checks in the PR.

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

With Python 3 and the Windows Python launcher installed, set `$orchaCheckout`
to the absolute path of a verified Orcha checkout. From this game's worktree
root, validate the bootstrap with:

```powershell
$orchaCheckout = 'C:\path\to\verified\orcha-checkout'
py -3 -B "$orchaCheckout\standards_check.py" --repository . --orcha "$orchaCheckout"
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
