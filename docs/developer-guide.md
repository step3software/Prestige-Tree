# Developing Prestige Tree

This fork contains Prestige Tree Rewritten, a browser incremental game built on
The Modding Tree. The upstream README and engine tutorials retain their original
names. Start with [agent instructions](../AGENTS.md) and the
[manifest](../.orcha/repository.json), then follow the relevant route below.
The [engine documentation index](!general-info.md) owns feature reference material;
its historical file paths should be checked against the current source map here.

## Run locally

The game uses plain JavaScript, HTML and CSS, Vue **3.5.46** packaged locally,
and a checked-in `break_eternity.js` Decimal library.
The static packaging step uses Node **24.22.1**
([.node-version](../.node-version)), npm **11.19.1**, Playwright **1.65.1** and
Chromium pinned by that Playwright release. DEV01 adds ESLint **10.15.0**
and TypeScript **7.0.2** as JavaScript checking tools; application code remains JavaScript.
Vue is an exact application dependency, shared by the delivered artifact and tests.

From an isolated worktree root, run:

```powershell
npm ci
npm run build
npm run serve
```

Open `http://127.0.0.1:8000/`; stop the preview server with Ctrl+C. The build
copies the actual game scripts, images, styles and upstream licenses into ignored
`dist/`, together with the locked Vue global production build and its license.
`dist/package-manifest.json` records every asset digest and the runtime version.
The checked-in HTML/component templates require Vue's included template compiler;
there is no SFC toolchain, backend or production compatibility build.
Serve/copy this artifact as static files under the existing hosting authority;
building or previewing does not publish or deploy it. You can also open
`dist/index.html` locally; automated startup evidence uses HTTP, not file URLs.

The [upstream tutorial](getting-started.md) describes that file-opening step, but its
fork creation, mod ID changes and direct commits/pushes to `master` do not apply
to development in this existing fork. Follow this guide and `AGENTS.md` instead.
For a Python-based preview of the same built package, run:

```powershell
python -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8000/`. This command starts a local server; stop it with
Ctrl+C. Expected result: the Prestige Tree Rewritten game renders, its tree/tabs
respond, and the console has no new errors. No runtime CDN or Google Fonts request
is required; the existing font stack uses its local monospace fallback. External
Discord/upstream links contact their destinations only when followed. Package
checks and Chromium start with all external requests blocked; this is not PWA,
service-worker or universal offline support. Git fetch/push
and PR commands contact GitHub; serving files locally does not publish the game.

Use a disposable browser profile/origin with synthetic saves. Saves are local
browser state under `modInfo.id` (`ptr`), accessed only by `js/save-storage.js`; do not overwrite
someone's existing progress. Never change that ID as routine setup for this fork.
Save or schema changes need an explicit migration and recovery plan. Preserve
export/import, reset, Decimal arithmetic and offline progress behavior.

## Find the behavior

| Task | Owning implementation | Relevant reference |
| --- | --- | --- |
| Page startup and script order | `index.html` → `gameUI.commands.load()` in `js/browser-entry.js` → `js/saves.js` | [Main mod info](main-mod-info.md) |
| Static artifact and preview | `scripts/build.cjs` → `dist/`; `scripts/serve.cjs` | [Package verification below](#vue-interface-and-packaging) |
| Game identity, version, point rules | `js/mod.js` | [Main mod info](main-mod-info.md) |
| Layer costs, rewards, upgrades and progression | `js/layers/manifest.js` → named `js/layers/` factories; purchases in `js/utils.js` | [Layers](basic-layer-breakdown.md), [upgrades](upgrades.md) |
| Balance coverage for new or replaced content | `scripts/balance/sections.cjs` → `policy.cjs` → `tests/rules/balance-simulation.test.cjs` | [Content balance workflow](balance-testing.md#add-balance-coverage-with-content) |
| Explicit advancement and resets | `js/game-session.js` → session-bound `js/game.js`; derived values in `js/technical/temp.js` | [Layer features](layer-features.md) |
| Runtime clock, offline budget, timers and listeners | `js/game-runtime.js` → `startGameRuntime` / `createGameRuntime` | [Lifecycle below](#simulation-and-runtime-lifecycle) |
| Session construction and selected collection | `js/game-session.js` (`createGameSession`, `createSaveState`) | [Ownership below](#state-and-command-ownership) |
| Save commands, active state and recovery UI | `js/saves.js` (`save`, `load`, `exportSave`, `importSave`, menu commands) | [Save boundaries below](#save-boundaries-and-recovery) |
| Pure save data/defaults, validation and conversion | `js/save-codec.js` (`createSaveCodec`, `createSavePlayer`) | [Mod configuration](main-mod-info.md) |
| Durable storage I/O | `js/save-storage.js` (`createSaveStorage`) | [Save boundaries below](#save-boundaries-and-recovery) |
| Vue UI and tree display | `js/components.js`, `js/technical/systemComponents.js`, `js/tree.js`, `js/technical/canvas.js`, `style.css` | [Tabs](custom-tab-layouts.md), [trees](trees-and-tree-customization.md) |
| Layer registration and large numbers | `js/technical/layerSupport.js`, `js/technical/break_eternity.js` | [General info](!general-info.md) |

The feature reference is engine guidance, not proof of current implementation.
`Old Code/` is historical reference and is not loaded by the main page.
`demo.html` and `js/Demo/` are engine examples, not an automated regression suite.
`dist/` is generated from these tracked owners and the exact npm dependency;
never edit generated assets. Preserve vendored library
attribution in both [licenses](../LICENSE) and [Prestige Tree license](../Prestige-tree-license).

## Layer content and registration

Start at [the registration manifest](../js/layers/manifest.js). `index.html`
loads the named factory scripts, then explicit session composition calls `registerGameLayers(layerRegistry, ports)`.
The manifest invokes that session’s existing `addLayer`/`addNode` APIs in its explicit order.
Factory definitions and the manifest register nothing on evaluation. The VM harness reads the same HTML and executes
the same manifest; it has no separate test registry. Script-tag order loads factory
definitions; the manifest alone determines registration order. Add a factory script
to the page and one manifest entry to add content. No asynchronous loader, discovery,
plugin system or second maintained definition is involved. `js/tree.js` retains
layout configuration; the former `js/layers.js` monolith has been removed.
Add or update [balance coverage](balance-testing.md#add-balance-coverage-with-content)
in the same PR as the content, including its entry/exit conditions, playable policy
and focused scenario. The balance guide owns the procedure and evidence requirements.

There are **34 active layers/tabs and one node**: 31 former monolith entries,
`info-tab`, `options-tab`, `tree-tab` and `blank`. Every entry has a named file:

| ID | Content owner | Direct cross-layer reads/calls (static references) |
| --- | --- | --- |
| `info-tab` | [info-tab.js](../js/layers/info-tab.js) | — |
| `options-tab` | [options-tab.js](../js/layers/options-tab.js) | — |
| `blank` | [blank.js](../js/layers/blank.js) | — |
| `tree-tab` | [tree-tab.js](../js/layers/tree-tab.js) | — |
| `p` | [prestige.js](../js/layers/prestige.js) | `a`, `b`, `e`, `g`, `h`, `hn`, `i`, `ma`, `o`, `ps`, `s`, `t` |
| `b` | [boosters.js](../js/layers/boosters.js) | `a`, `e`, `g`, `h`, `i`, `m`, `ma`, `p`, `q`, `s`, `sb`, `t` |
| `g` | [generators.js](../js/layers/generators.js) | `a`, `b`, `e`, `h`, `hn`, `hs`, `i`, `ma`, `mc`, `n`, `p`, `q`, `s`, `sg`, `t` |
| `t` | [time.js](../js/layers/time.js) | `a`, `b`, `ba`, `e`, `en`, `h`, `hn`, `hs`, `i`, `m`, `ma`, `n`, `o`, `p`, `ps`, `q`, `s` |
| `e` | [enhance.js](../js/layers/enhance.js) | `a`, `b`, `g`, `h`, `hn`, `hs`, `i`, `ma`, `q`, `s`, `sb`, `sg`, `t` |
| `s` | [space.js](../js/layers/space.js) | `a`, `ba`, `e`, `g`, `h`, `hn`, `hs`, `i`, `m`, `ma`, `n`, `o`, `p`, `q`, `ss`, `t` |
| `sb` | [super-boosters.js](../js/layers/super-boosters.js) | `b`, `c`, `e`, `en`, `h`, `hs`, `i`, `ma`, `n`, `o`, `q`, `s`, `ss`, `t` |
| `sg` | [super-generators.js](../js/layers/super-generators.js) | `ba`, `e`, `g`, `h`, `hn`, `i`, `m`, `ma`, `mc`, `ne`, `o`, `q`, `ss` |
| `h` | [hindrance.js](../js/layers/hindrance.js) | `a`, `b`, `ba`, `i`, `m`, `ma`, `n`, `p`, `ps`, `q`, `s`, `sb`, `ss`, `t` |
| `q` | [quirks.js](../js/layers/quirks.js) | `a`, `b`, `ba`, `e`, `g`, `h`, `hn`, `i`, `m`, `ma`, `o`, `p`, `ps`, `s`, `sb`, `sg` |
| `o` | [solarity.js](../js/layers/solarity.js) | `a`, `ba`, `en`, `h`, `hn`, `m`, `ma`, `n`, `p`, `ps`, `q`, `sb`, `ss`, `t` |
| `ss` | [subspace.js](../js/layers/subspace.js) | `a`, `ba`, `e`, `h`, `hn`, `i`, `m`, `ma`, `ne`, `o`, `q`, `s`, `t` |
| `m` | [magic.js](../js/layers/magic.js) | `a`, `ba`, `h`, `hn`, `i`, `ma`, `n`, `o`, `ps`, `t` |
| `ba` | [balance.js](../js/layers/balance.js) | `a`, `h`, `hn`, `ma`, `mc`, `p`, `q`, `ss` |
| `ps` | [phantom-souls.js](../js/layers/phantom-souls.js) | `ba`, `c`, `h`, `hn`, `i`, `m`, `ma`, `n`, `q`, `s` |
| `hn` | [honour.js](../js/layers/honour.js) | `a`, `ba`, `g`, `hs`, `i`, `m`, `ma`, `n`, `o`, `p`, `ps`, `q`, `s`, `t` |
| `n` | [nebula.js](../js/layers/nebula.js) | `a`, `ai`, `g`, `ge`, `hn`, `i`, `ma`, `o`, `q`, `s` |
| `hs` | [hyperspace.js](../js/layers/hyperspace.js) | `a`, `ba`, `c`, `e`, `g`, `hn`, `i`, `ma`, `n`, `o`, `s`, `sg`, `ss`, `t` |
| `i` | [imperium.js](../js/layers/imperium.js) | `hn`, `hs`, `ma`, `n`, `ss` |
| `ma` | [mastery.js](../js/layers/mastery.js) | `a`, `hs`, `i`, `n`, `ps` |
| `ge` | [gears.js](../js/layers/gears.js) | `a`, `ai`, `en`, `id`, `ma`, `mc`, `n`, `r` |
| `mc` | [machines.js](../js/layers/machines.js) | `a`, `ai`, `c`, `ge`, `hs`, `i`, `id`, `ma`, `ne`, `o`, `ps` |
| `en` | [energy.js](../js/layers/energy.js) | `a`, `ai`, `ma`, `mc`, `ne`, `o`, `r` |
| `ne` | [neurons.js](../js/layers/neurons.js) | `a`, `ai`, `c`, `en`, `id`, `m`, `mc`, `r`, `ss` |
| `id` | [ideas.js](../js/layers/ideas.js) | `a`, `ai`, `en`, `mc`, `ne` |
| `r` | [robots.js](../js/layers/robots.js) | `a`, `ai`, `en`, `id`, `ma` |
| `ai` | [artificial-intelligence.js](../js/layers/artificial-intelligence.js) | `a`, `ge`, `id`, `ma`, `mc`, `r` |
| `c` | [civilizations.js](../js/layers/civilizations.js) | `a`, `ai`, `i` |
| `a` | [achievements.js](../js/layers/achievements.js) | `ai`, `b`, `ba`, `c`, `e`, `en`, `g`, `ge`, `h`, `hn`, `hs`, `i`, `id`, `m`, `ma`, `mc`, `n`, `ne`, `o`, `p`, `ps`, `q`, `r`, `s`, `sb`, `sg`, `ss`, `t` |
| `sc` | [softcaps.js](../js/layers/softcaps.js) | `a` |
| `ab` | [autobuyers.js](../js/layers/autobuyers.js) | `ai`, `b`, `ba`, `e`, `en`, `g`, `ge`, `hn`, `hs`, `i`, `id`, `m`, `ma`, `mc`, `ne`, `ps`, `q`, `s`, `sb`, `sg`, `ss`, `t` |

This dependency column is a navigation aid; dynamic `this.layer`, reset arguments,
tree branches and helper-driven dependencies remain in the actual definitions.
Do not reorder registrations or change serialized IDs while editing a factory.
`js/technical/layerSupport.js` still owns registry normalization/hotkeys;
`js/technical/temp.js` evaluates derived values; `js/game.js` owns ordered reset
and progression rules. `js/utils.js` owns purchase/effect helpers. Existing shared
softcaps and static-cost scaling stay in `js/sc.js` (`softcap`, `reverse_softcap`,
`scaleStaticCost`, `softcapStaticGain`); global point generation stays in `js/mod.js`.
`js/help.js` retains authored help text. No formula helper was extracted merely
because two expressions look similar.

For example, **Boosters (`b`)** live in `boosters.js`. Upgrade 12 reads Generator
points (`g`) through `upgradeEffect`; the manifest registers `b` after Prestige
and before Generators, and `updateTemp` evaluates the effect before `buyUpg`/the
upgrade UI uses it. Time milestone 3 enables its auto prestige; milestone 4 keeps
lower progress. To verify a bounded change, from this worktree run:

```powershell
node --test tests/rules/layer-content.test.cjs
```

Expected result: all tests pass. The early fixture changes Generator points and
Time milestones and observes Booster effect/automation; middle Balance → Solarity
and late AI → Neurons/Robots fixtures exercise other real formulas with shipped
Decimals. All complete contracts and nine player checkpoints compare to immutable SIM01.
DEV01 compares complete formula ASTs while normalizing only explicit owner
qualifiers, added lexical declarations and equivalent var/let bindings; numerical
checkpoints remain exact. Controlled formula/incorrect-owner changes must fail. Registry omission/duplication fixtures mutate only memory and
must fail the completeness check or reject registration. This representative
evidence does not prove full late-game balance. Final delivery runs `npm test`.

Historical regression/checkpoint tests use
`tests/support/historical-sources.cjs`: each pinned Git revision supplies its own
HTML and complete script list. Never overlay current moved files onto an older
graph or count an import/missing-file error as a behavioral regression failure.
The standalone demo reuses the same utility-tab factories from its own tree entry;
its broader rendering and pre-existing lowercase `js/demo/` URLs on case-sensitive
servers remain outside this content refactor's verified browser journeys.

## State and command ownership

Start at [session composition](../js/game-session.js). Every existing module is
a factory receiving only its named collaborators; layer factories receive their
used ports. There is no global player/cache swap, second persisted model, dynamic
loader or new state framework. The same realm can hold independent sessions.

| Owner | Lifetime and update route |
| --- | --- |
| `session.saveState` | One selected collection/player identity. `saveCommands` activates only defaults or codec-validated candidates; it remains the sole browser persistence command path. |
| `session.derivedState` | Fresh `tmp` per session; `setupTemp` replaces it and `updateTemp` derives values. It is never serialized. |
| `session.layerRegistry` | Fresh definitions, hotkeys and ordered row indexes; the one manifest constructs closures with this session’s ports. |
| `session.gameRules`, `gameHelpers`, `modRules`, `softcapRules` | Existing progression/reset, purchase, formula and notification owners, with explicit state/cache collaborators. |
| `session.runtimeServices` | Clock/scheduler/listeners and all created runtime handles; generation, identity, disposal and reload-only fault gates. |
| `session.gameView`, `treeCanvas` | Vue/template observation and canvas effects. `bind()` observes the same canonical player/collection/cache objects after activation; it never clones the model. |

The classic-script external boundary is immutable factory declarations, the frozen
manifest and the [browser adapter](../js/browser-entry.js), `gameUI`. Native HTML
handlers use its 14 `commands`; inspection uses `gameUI.session` and the named
owners above. There are no global `player`, `allSaves`, `tmp`, loop temporaries or
catch-all mutable global allowlists. Browser dependencies are injected effects;
headless caches use a plain property setter instead of Vue. Circular collaborator
ports forward to their actual owners, so methods/values are never copied into a
second mutable model. Factory creation itself performs no browser I/O.

For a representative command, use the browser console in a disposable page:

```javascript
const session = createGameSession();
session.gameRules.doReset('p');
session.purchase('p', 11);
advanceGame(session, 1); // explicit seconds; no timer or wall clock
session.saveState.player.points.toString(); // '1'
session.dispose();
```

Trace `purchase` → `gameHelpers.buyUpg` in `js/utils.js` →
`js/layers/prestige.js`’s session-bound cost/hook → the canonical player.
Copy [session ownership tests](../tests/rules/session-ownership.test.cjs), then run
`node --test tests/rules/session-ownership.test.cjs` from the worktree root;
expected result: all tests pass. They interleave real purchases/advances/restoration
in one realm and prove independent caches, closures, handles and failure gates.
`session.loadPlayer(text)` restores through the same codec **in memory**, stopping
owned drivers before replacement. It never persists; browser import/selection
continues through SAV01’s atomic commands and reload. It cannot clear a tick fault.
The [rendered tests](../tests/browser/session-ownership.spec.cjs) exercise active
progression after independent sessions, import and save selection.

`npm run test:static` first verifies the built package, then derives lint scope from
the actual main HTML graph and checks every authored shipped script. Only the
identified Decimal and packaged Vue vendors are outside authored lint;
demo/archive code is not main-page shipped code. Factory declarations are read-only;
duplicate declarations, unexpected global state, undeclared writes and `var` fail.
`jsconfig.json` contains the exact game graph (including Decimal for type loading).
Package verification accounts separately for the exact npm Vue asset at the first
HTML script position; no authored script may be omitted or ignored.
Checked JavaScript is scoped to `@ts-check` state composition, runtime, storage and
the shared contracts; typed layer inputs and actual module return types supply
their boundary shapes. Dynamic content bodies remain JavaScript with full-graph
lexical lint, rather than an exhaustive per-layer type conversion. There are no
`ts-nocheck` files, broad production ignores or suppression comments. The narrow
Decimal instance port describes the untyped vendor boundary; codec/runtime tests
still use the real class. GameState/optional fields derive from the canonical
defaults and derived-state types live with their cache owner, without another schema.

`npm run test:static-sensitivity` first passes valid fixtures, then requires rejected
undeclared writes, malformed purchase/save inputs, primitive Decimal assignments,
wrong elapsed/clock types and invalid layer/UI ports. It uses disposable fixtures,
never changed checked-out source. These commands are mandatory locally and in CI.

## Verify a focused change

From a dedicated worktree root on Windows or the Ubuntu CI runner:

```powershell
npm ci
npx playwright install chromium
git fetch --no-tags origin 51a9b96c9949e6d0f96a65d5650ecac575fb9da8
npm run build
npm run test:package
npm run test:syntax
npm run test:static
npm run test:static-sensitivity
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
`npm test` runs all six required checks after installation. For a focused rule
run, use `node --test --test-name-pattern="F1" tests/rules/save-safety.test.cjs`;
the final required suite must run without filtering, skips or retries.

The explicit Git fetch supplies the immutable DEV01 source used by the Vue
early/middle/late comparisons. A full-depth checkout contains reachable history;
it can omit this commit after a squash merge and source-branch deletion. CI runs
the same fetch before testing. It contacts this fork on GitHub and changes no
working files or branch refs. Keep the comparison pinned; do not substitute the
current source or skip the regression when historical source is missing.

| Behavior to change | Test and concrete entry route |
| --- | --- |
| Prestige, purchases, resets, Decimal round-trips | [progression.test.cjs](../tests/rules/progression.test.cjs): real `load` → `doReset` → `buyUpg` → tick → `save`/reload |
| Import validation, atomic persistence, save menu | [save-safety.test.cjs](../tests/rules/save-safety.test.cjs) and [save-boundary.test.cjs](../tests/rules/save-boundary.test.cjs): `importSave` → pure codec → storage adapter → activation → reload; rejection keeps active/durable state |
| Lifecycle, races, replay and before/after equivalence | [runtime-lifecycle.test.cjs](../tests/rules/runtime-lifecycle.test.cjs) and [runtime-lifecycle.spec.cjs](../tests/browser/runtime-lifecycle.spec.cjs): explicit advance → stop/restart/stale callbacks → fault/reload; real page and unchanged game formulas |
| Layer registration/content preservation | [layer-content.test.cjs](../tests/rules/layer-content.test.cjs): complete contracts/order and real early/middle/late reset/cost/effect/unlock/automation comparisons against immutable SIM01 |
| Offline elapsed time and bank consumption | [clock.test.cjs](../tests/rules/clock.test.cjs): `load` accumulation → the actual 50ms tick; bank units are seconds, `offlineLimit` is hours |
| Rendered controls and recovery | [game.spec.cjs](../tests/browser/game.spec.cjs) and [save-recovery.spec.cjs](../tests/browser/save-recovery.spec.cjs): actual page, Options/Import, prestige/save menu, live error status and blocked startup recovery |

Copy the nearby test for a bounded behavior change. The
[VM runtime](../tests/support/game-runtime.cjs) reads script order from `index.html`,
executes the shipped scripts/Decimal, and isolates clock, timers and storage per
case. Vue/DOM are I/O adapters there; VM passes do not establish rendered behavior.
The [synthetic fixture](../tests/fixtures/representative-save.json) is test data,
not someone's save. It covers huge Decimals, array-held Decimals, upgrade/milestone
IDs and dormant-layer state. The sensitivity command also reads immutable baseline
`077861d` with Git and tests three source mutations **only in memory**. Keep Git
history available (`fetch-depth: 0` in CI); it changes no checked-out game source.

Browser tests create fresh Chromium contexts and start/stop their own loopback
server on **127.0.0.1:4173**. That server uses the same static preview implementation
to serve the exact `dist/` bytes. It performs no HTML, font or Vue substitution;
the former `/test-vue.js` route is gone. External requests are blocked. Tests control game time instead of waiting
for progression. No command reads a real browser profile or existing player save.

Generated `node_modules/`, `rule-results.xml`, `playwright-report/` and `test-results/` are ignored;
they are not source. The rule JUnit report, HTML report and failure-only trace/screenshots contain
synthetic data. CI retains failure artifacts for three days and uses read-only
repository permissions, no application secrets, deployment or paid runner setup.
Chromium coverage does not establish other engines, full late-game balance or
actual-user usability. Native import-error alerts use the browser's keyboard and
responsive dialog behavior. A tick exception pauses ticking and **all save writes**
until reload, preserving the last durable save; reload is the recovery action.

For an upgrade change, trace `js/layers/prestige.js` → `js/layers/manifest.js` → the upgrade UI in
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

## Vue interface and packaging

Follow README → this guide → `createBrowserGame` in `js/browser-entry.js` →
`createGameSession` in `js/game-session.js` → `createGameView` in
`js/components.js`. `loadVue()` creates one Vue 3 application, registers this
view's components with `application.component`, and mounts once. Repeated load
rebinds the existing instance. `js/technical/systemComponents.js` owns shared
templates; dynamic layouts use `<component :is>` and explicit loop/condition
scopes. The Options, information and help controls are native buttons. The save
menu provides a close action, Escape, contained Tab navigation and focus return.
At narrow widths, the tree and active pane stack as separately scrollable areas.
`interface.css` keeps these migration/focus rules active across both existing
style choices; `style.css` and `oldStyle.css` retain their original theme bytes.
Scoped scroll/resize handlers call the session's existing canvas owner.

The browser supplies a generic `observe(value)` port using `Vue.reactive`.
The selected collection is observed at activation; derived caches, rule status,
notifications and the view binding are observed when allocated. Every engine/UI
consumer uses these same canonical references. Observing an extra UI copy would
miss mutations to the raw original and is not supported. Headless construction
uses the identity function and still samples no clock/storage/DOM or resources.
`Vue.markRaw(Decimal.prototype)` excludes all existing/future Decimal instances
from proxies with nonenumerable metadata; their arithmetic, identity, class,
enumerable fields and serialized values remain unchanged. No vendor source is
modified. Vue render/event errors dispose the session's owned drivers and use
the existing reload-only fault/status gate; they cannot silently save partial state.

For a component change, inspect its registration/template, trace its command to
the owning session, then run from the worktree root:

```powershell
npm run build
npm run test:package
npx playwright test tests/browser/vue-interface.spec.cjs
```

Expected result: exact runtime/source/asset/license identity, every actual
registered/page template compiles without diagnostics, and the rendered journeys
pass. `npm run test:static` and `npm run test:static-sensitivity` keep the inherited
full authored graph and scoped checked-JavaScript/negative contracts. Final delivery
uses `npm test`, which builds before all package/static/rule/sensitivity/browser checks.
After changing source, rebuild before running a browser-only command.

`tests/rules/vue-interface.test.cjs` uses real Vue reactivity with only DOM mount
omitted; its state/tick/save checkpoints compare immutable DEV01. The actual-browser
suite uses the production global build and package, with no runtime substitution.
The constructor/`component`/`set` stubs left in `tests/support/game-runtime.cjs`
exist solely to load immutable Vue 2 predecessors before behavioral assertions;
they are outside the production runtime. Historical graph loading remains unchanged.

The production build includes Vue's compiler because the existing trusted authored
templates are compiled in the browser. A server Content Security Policy must permit
that established compilation model; no CSP or hosting permission is changed here.
The build installs dependencies from npm only during `npm ci`; preview and game
startup require local package bytes. `dist/vendor/Vue-LICENSE` and both game licenses
travel with the artifact. No paid tooling, runner, service or deployment is used.

Rollback means serving the prior DEV01 code artifact at `51a9b96`, after the
normal human publication gate. Save key/schema and Decimal representation did
not change, so rollback requires no destructive data conversion. Keep recoverable
save exports and use the same codec/storage policy; do not clear `ptr`.
The [UI01 verification](milestones/UI01.verification.md) records exact measurements,
fixtures, standards/criteria/path coverage and known limits. Representative tests
do not establish full late-game balance, other engines, actual-user usability,
assistive-technology behavior or the OS clipboard. The demonstration page's broader
rendering and pre-existing lowercase `js/demo/` portability remain unverified.

## Game-time balance tests

Build balance tests with each new or replaced section of content, following the
[content balance workflow](balance-testing.md#add-balance-coverage-with-content).
The current runner is a foundation for the upcoming content replacement; its
inherited section catalog and experimental policies do not establish full-game
coverage or a campaign duration.

From the worktree root, `npm run test:balance` runs the focused contract tests and
`npm run balance` produces rough timing reports for active and five-minute regular
play. The [balance guide](balance-testing.md) owns extension points, section inputs,
calibration and PR evidence. Focused tests also run in normal CI; longer timing
sweeps are opt-in. Generated `balance-results/` is ignored.

## Simulation and runtime lifecycle

Follow README → this source map → `gameUI.commands.load()` → session-bound
`load()` in `js/saves.js` → `startGameRuntime()` in `js/game-runtime.js` →
`advanceGame()` in `js/game.js`. These module methods receive named ports.
Run `node --test tests/rules/runtime-lifecycle.test.cjs` from the worktree root;
expected result: every case passes. The nearby tests show how to advance real
rules without timers and compare meaningful before/after state against immutable
SAV01. Final milestone verification still requires the complete `npm test` suite.

`createGameSession({now, effects})` in `js/game-session.js` constructs independent
owners and fresh registered layer closures/caches in the **same JavaScript realm**.
It samples no clock, touches no storage/DOM and starts no timers/listeners. `now`
defaults to zero for deterministic headless fixtures; callers supply time explicitly.
The browser defers activation until SAV01 reads/validates storage, so failed startup
still exposes no default player and cannot overwrite the original.

`advanceGame(session, elapsedSeconds)` delegates to that session’s rule owner with
an identity captured by `session.runtimeServices.captureGameIdentity()`.
Finite, nonnegative seconds update derived values, ordered rules and player-value
checks without clock, storage, DOM or timers. Cross-session, stale and disposed
identities are rejected. Both development-speed multipliers and nonlinear order
are preserved; arbitrary tick chunk sizes need not produce equal results.

Each runtime owner tracks all handles created through its explicit ports. Session
disposal or player replacement disposes every handle, including directly created
drivers; no second session’s handles are affected. Queued callbacks remain fenced.
Stopping one driver is restartable; disposing the whole session is terminal.

`createGameRuntime({session, clock, scheduler, resume, tick, refresh, autosave,
listeners, onError, onStop})` owns three intervals (50ms calculation, 500ms canvas
invalidation, 5000ms autosave) and removable keyboard/resize/wheel/pagehide
listeners. `clock.now()` returns milliseconds; scheduler ports are `setInterval`
and `clearInterval`. Ports are called through a session/generation fence and
exceptions stop the whole runtime. Evaluating scripts does not register resources.
Successful `load()` validates SAV01 state, prepares temp/Vue, then explicitly
starts the browser composition. Repeated loading disposes the prior runtime and
rebinds the existing Vue; ordinary save retains the active session. Successful
selection/import/reset replacement disposes it before reload can occur.

`start()` is idempotent; `stop()` clears timers/listeners and allows restart;
`dispose()` is idempotent and terminal. Error is terminal for the page session:
partial mutations cannot be retried or saved. The visible live status and native
alert instruct reload to restore the previous durable save. Calculation, derived
state, render, listener and unexpected autosave callback failures share this gate.
Ordinary storage denial remains SAV01's recoverable unsaved/retry result. Direct
advancement errors also latch saving protection and propagate to the caller.

The runtime alone converts observed milliseconds to seconds and budgets offline
time. Start/restart adds unobserved time to the capped offline bank once; ticks
consume the established 10%/elapsed policy. `offlineLimit` is hours, bank and
advancement are seconds. A backwards clock cannot lower the observed high-water
mark and credit the same period twice. Disabled offline production drops the
bank. Saved schema/key/settings remain unchanged. Pagehide disposes a departing
page; a browser-cached page retains its owner while the browser suspends it.

## Save boundaries and recovery

Follow `README` → this source map → `importSave` in `js/saves.js` →
`createSaveCodec` in `js/save-codec.js` → `createSaveStorage` in
`js/save-storage.js` → activation/reload. To change a validation rule, copy the
nearby boundary assertion and run:

```powershell
node --test tests/rules/save-boundary.test.cjs
```

Expected result: every case passes and rejected candidates leave both the live
player and the prior durable string unchanged. Final milestone verification uses
the complete `npm test` suite, including the unchanged TST01 rules and journeys.

`createSaveCodec({defaults, layerDefinitions, version, modId})` receives explicit
defaults/time and static definitions. Its `decodePlayer`, `decodeCollection`,
`encodePlayer` and `encodeCollection` return `{ok: true, value, text?}` or
`{ok: false, error}` without I/O or active-state mutation. Values are detached,
validated and hydrated with the shipped Decimal class. Missing known fields use
fresh defaults; malformed present fields, invalid references and unsupported data
are rejected. New runtime fields must have a defined durable shape here; caches,
timers, functions, DOM/Vue objects and unknown root fields cannot be serialized.

The canonical durable representation remains base64 JSON `{set, <name>: player}`
under **ptr**, with one selected active `saveState.player` object also held by
`saveState.allSaves[saveState.allSaves.set]`. Inactive entries use the same hydrated model. Vue receives
these same objects after a successful collection commit. Export remains a single
base64 player for compatibility. No schema envelope, second key, dual writer or
legacy operating mode is introduced.

Supported ingress representations are the source's pre-1.2 single player, the
1.2+ selected collection, missing known defaults/version, numeric versions, and
Gear's authored empty-string zero sentinels. The
[synthetic historical fixtures](../tests/fixtures/historical-saves.json) cover
source-shaped snapshots across the changelog versions, plus references and large
Decimals. These fixtures establish those representations, not a survey of all
historical installations. Retired/unknown layer IDs (such as old `sp`/`l`),
pre-Rewritten challenge arrays, future versions and corrupt data are preserved
and rejected; no guessed lossy conversion is provided.

Startup converts a supported representation to the current model, validates the
complete collection, and atomically replaces `ptr` before activating it. The
original string is retained until that succeeds. A failed read/conversion/write
shows a recovery panel with original data when readable; the game does not start
or autosave replacement defaults. Copy that data if needed, restore storage and
retry loading. Recovery import validates a single player and asks explicitly
before replacing an unreadable collection; denied storage reads must be restored
before replacement. A failed recovery import keeps the original.

Manual/autosave, create/rename/delete/select/reorder, reset and import all use the
single adapter. Each changing command validates a complete candidate and performs
one `setItem` before changing active data or selection. Storage quota/denial keeps
the previous durable value and valid active progress; the live status reports
unsaved data and supports retry. Native import alerts remain dismissible and
ordinary failures retain menu/input context. A tick fault retains its existing
reload-only recovery gate across every write. Atomicity covers one Web Storage
key replacement, not cross-key transactions or browser/OS durability guarantees.

## Delivery

Create a focused PR from the dedicated branch to `step3software/Prestige-Tree`
`master`. Include changed behavior, exact source/standards revisions, checks
actually run and limitations. Preserve upstream attribution and save data.
Shared development process belongs to Orcha; local setup and game rules belong
here. A PR or standards check grants no merge, release or service activation.

SAV01's owner-authorized stack is an explicit exception to the ordinary PR base:
its child branch `codex/sav01-save-boundaries` targets
`codex/tst01-testing-milestone` ([PR #2](https://github.com/step3software/Prestige-Tree/pull/2)).
Keep the TST01 dependency and its branch intact while unmerged. Final integration
target remains `master`; retarget/rebase only after coordinating the parent merge
and rechecking the resulting diff. [SAV01 preparation](milestones/SAV01.preparation.json)
and [verification](milestones/SAV01.verification.md) retain the exact authorized
source, file scope, current-main standards hashes and delivery evidence.

SIM01 continues the owner-authorized stack: `codex/sim01-runtime-lifecycle`
targets `codex/sav01-save-boundaries` ([PR #3](https://github.com/step3software/Prestige-Tree/pull/3)),
which depends on PR #2 above. Preserve both parents while unmerged; final
integration remains `master`. [SIM01 preparation](milestones/SIM01.preparation.json)
and [verification](milestones/SIM01.verification.md) bind the exact file scope,
source and standards observation. No native stage acceptance is inferred.

LAY01 continues this stack: `codex/lay01-layer-content` targets
`codex/sim01-runtime-lifecycle` ([PR #4](https://github.com/step3software/Prestige-Tree/pull/4)),
then PR #3 and PR #2. Keep all parents intact while unmerged; final integration
remains `master`. [LAY01 preparation](milestones/LAY01.preparation.json) and
[verification](milestones/LAY01.verification.md) retain scope, all moves, standards,
representative before/after evidence and limitations. No native milestone
acceptance, enrollment, merge, deployment or activation is inferred.


DEV01 continues the authorized stack: `codex/dev01-state-contracts` targets
`codex/lay01-layer-content` ([PR #5](https://github.com/step3software/Prestige-Tree/pull/5)),
then PR #4/#3/#2. Keep all parents intact while unmerged; final integration remains
`master`. [Preparation](milestones/DEV01.preparation.json) and
[verification](milestones/DEV01.verification.md) bind exact scope, standards and
criterion evidence. Publication is not native acceptance, merge or activation.

UI01 continues this authorized stack: `codex/ui01-vue-interface` targets
`codex/dev01-state-contracts` ([PR #6](https://github.com/step3software/Prestige-Tree/pull/6)),
then PR #5/#4/#3/#2. Preserve every parent while unmerged; final integration remains
`master`. [Preparation](milestones/UI01.preparation.json) and
[verification](milestones/UI01.verification.md) retain the exact file contract,
canonical authority correction, source/standards evidence and delivered checks.
UI01 is the last milestone in the defined roadmap; no successor is inferred.
