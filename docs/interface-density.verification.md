# Compact gameplay: implementation evidence

Owner request: reduce unnecessary UI text, prioritize vertical space, put all
Population information in one compact desktop row, recheck workflows, and push
separate game/process PRs. This change implements that game scope on isolated
`codex/compact-gameplay-ui`, from main
`27d24953e2c7c8c1617f22beba00fd668232713a`, with verified branch writer protection.
No merge, deployment, save conversion, new content or balance change is included.

## Before and after

Matched synthetic Chromium fixtures; CSS pixels, at top of page with help closed.
Baseline was captured from the pinned main; candidate uses the unchanged locked
Vue/runtime and real package/commands in a fresh browser context, never a user save.

| Fixture | Before | After |
| --- | ---: | ---: |
| Fresh Food, 1280×800: gameplay top | 238 | 88 |
| Fresh Food after Save: gameplay top | 283 | 88 |
| Fresh Food after Save: Gather control top | 858 | 163 |
| Established Shelter, 1280×800: population height | 202 | 36 |
| Established Shelter: document height | 2372 | 800 |
| Last survivor, 1908×736: gameplay top | 519 | 88 |
| Last survivor, 390×844: gameplay top | 777 | 150 |

Desktop acceptance checks cover 1280×720, 1280×800 and 1920×1080: population row
at most 40 px, masthead at most 44 px, gameplay begins by 96 px, and Gather/Build
fully inside the first viewport. Narrow checks include 390 and 320 CSS px; rows
wrap and the operating panel precedes the resource tree. Hover expansion of large
buttons is disabled because it caused horizontal overflow, retaining theme/glow.

## Copy and added-row review

| Area | Disposition and preserved decisions |
| --- | --- |
| Header | Reuse one Population/capacity/growth/Abundance/worker/shortage row. Delete hero, stock advice and separate shortage panel. Current depleted resources, loss timer/count or protected survivor and Food/Water actions remain. |
| Save feedback | Reuse a fixed existing header slot. Saved/Unsaved/Copied stays visible; full outcome/recovery is attached help, with announcements. Success and failure do not shift gameplay. |
| Temporary worker warning | Reserve a compact feedback slot below the expedition button in all states. Showing and clearing “Needs free workers” cannot shift that button or the neighboring statistics. A regression checks their complete rectangles before/during/after at desktop and narrow widths. |
| Resource/actions | Remove descriptions, decorative eyebrows, duplicated stock labels and permanent mechanic paragraphs. Combine rates and labor; keep actual crew, duration, yield, current worker blocker and action. |
| Staffing/repeats | Reuse their rows beside operating controls; preserve PR #14 names, min/max guards and finite counters. Optional reservation, snapshot and repeat-zero explanations move to hover/focus/tap help. |
| Construction | Relocate the existing active construction row from the footer to the operating panel across resource selections. Existing row shows progress, builder, Cancel and non-refundable work/Craft. Recall loss is in the existing action row. No new confirmation step. |
| Purchases | Use existing buttons for short numeric effects/costs/levels/owned state. Original descriptions remain attached help. No permanent construction/upgrades instruction rows. |
| Hearths | Live Food storage/income modifiers join Food's existing rate row; Shelter retains the owned upgrade and its concise effect. |
| Prestige/milestones | Remove repeated currency lessons; preserve actual derived reset/keep consequences and confirmation. Milestone rows retain requirement/name/active state; detailed rewards use attached help. |
| Footer/settings/settlements | Remove slogans and obvious explanation. Keep actual actions, current save identity and full attribution/version in About. |

No new standing explanatory paragraph remains on Food/Shelter or shortage chrome;
the cleanup exceeds the planned 75% reduction of that prose. Necessary effects,
costs, labels, current state and consequential reset information are retained,
not counted as explanatory clutter. Feedback uses reserved slots, including activity/offline results below the operating controls, so temporary text never pushes permanent elements. No new explanatory text row was needed: helper
content is out of flow; statuses, effects and loss qualifiers reuse existing rows.

## Workflow verification

32 Chromium tests passed: all 27 existing Civ journeys (updated assertions for
the shorter presentation) plus five density/help regressions. They cover fresh
play, actual dispatch/build/purchases and debits, busy/overbooked workers, held
Organization gates, finite Food/Hut queues, current work finishing after zero,
prestige preview/cancel/confirm, shortage countdown/recovery, save/reload/import
rejection, runtime faults, historical saves, keyboard controls and narrow reflow.
New checks assert viewport placement rather than DOM visibility, no save-status
layout shift, persisted original bytes on write failure, Escape-dismissed help,
and touch help that does not start or modify an order.

Executed commands:

- `npm run build` and `npm run test:static`: real Vue template/package build,
  all authored-script lint and checked boundary contracts passed.
- `npm run test:syntax`, `npm run test:static-sensitivity`,
  `npm run test:sensitivity`: syntax and required negative/mutation checks passed.
- `npm run test:rules`: all 125 rule/save/runtime/balance cases passed.
- `npx playwright test --config .agent-runtime/playwright-density.config.cjs tests/browser/civilization.spec.cjs tests/browser/interface-density.spec.cjs --reporter=line`:
  all 32 passed. The local ignored config changes only test-server cwd/port to
  4193 because 4173 was occupied; the test source, viewport defaults, package and
  browser are the standard ones. Normal CI uses checked-in Playwright config.
- Matched 12-state screenshot/DOM inspection: no page errors or horizontal
  overflow; fresh/progressed panels, settings, settlements and shortage inspected.

Rendered evidence is synthetic, not actual-player acceptance, screen-reader or
cross-browser certification. No native/browser-zoom gate was introduced.

## Source and standards trace

Read current shared Orcha main
`cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`: AGENTS, intent routing, preparation,
implementation/review, readable-code, coordination and user-outcome contracts.
Catalog hashes were verified through `standards_resolver`. Governing local AGENTS,
README, developer guide, civilization rules and relevant historical verification
were read at the source above; captured Git-byte hashes remain in the local review
evidence. The new Orcha density contract is a companion proposal until merged to
main, not retroactive authority. The owner's explicit compactness instruction
governs this change.

The retained manifest/registry say master, while current AGENTS/README explicitly
select main and record the retained metadata conflict. The checkout/source above
uses that documented owner main selection; no lifecycle manifest, approvals,
source policy, scheduling state or service activation was changed.

Review accounted for each changed HTML/CSS/view/save/rule-metadata path and its
browser/rule consumers. `effect` fields are display metadata alongside unchanged
descriptions; simulation functions, saved fields, command guards and persistence
semantics are unchanged. Rollback is the prior source/package, with the same save
format. Publish as an unmerged draft PR to this fork's main.
