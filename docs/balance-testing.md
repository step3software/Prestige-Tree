# Measuring game-time balance

Run from the worktree root after the normal locked setup:

```powershell
npm ci
npm run balance
```

The quick default compares Generator-first active play and regular play from a
fresh game, over a requested 24-hour game horizon with a **15-second wall-time
budget per strategy** and a matched 10-minute early calibration. Regular play acts
at the owner's chosen five-minute cadence. Active
strategies use a five-second minimum cadence; rough mode predicts which checks
can be deferred until an affordable action. A run ending at its wall budget is
incomplete, and records exactly how far it simulated. Reports are written after
each completed strategy, so completed results survive a later interrupted run.

Open ignored `balance-results/report.md` for the comparison and `report.json` for
exact configurations, every individual layer unlock, per-run section durations,
recent actions, unmet discoverable requirements, source/policy hashes and stop
reasons. `*.save.txt` are synthetic codec-validated section/final checkpoints.
They are generated, not production game data. Rerun this command to regenerate
them. No game code, hosting, browser saves or deployment is changed.

## A faster rough calculation

```powershell
npm run balance -- --hours 24 --budget 30 --calibrate-minutes 10
```

For a wider strategy sweep, add
`--profiles active-generators,active-boosters,active-patient,regular` and increase
`--budget` as needed. The quick default deliberately bounds computer time rather
than pretending every section has been simulated.

The runner loads the shipped engine in Node without the browser composition entry
or a real Vue render. Decimal and every progression function come from the shipped
source. It uses `createGameSession()` and explicit elapsed-seconds advancement;
it never sleeps, increases `devSpeed`, grants currency or unlocks content for free.
The only view port is an inert mount for the existing challenge notification.
The new loader is compared with the original VM harness through real purchases,
prestige and the first Generator reset, including complete player serialization.

Rough mode estimates the wait to an upgrade or policy-selected reset using current
production rates and the engine's own inverse reset-cost function. It advances
quiet periods in larger chunks, then re-evaluates the real rules. Early branching
uses at most 15-second steps; after both row-two layers it can use 60-second steps,
and later quiet periods allow up to `--max-step 300`. Automatic prestige bounds
steps to 60 seconds; challenges/spells bound them to 30 seconds. Regular manual
actions stay on the five-minute grid. Earned automation runs through the real
engine between manual decisions; coarse calls run it less frequently than the
50ms browser driver. These are approximate offline-sized steps, not an exact
replay of the browser's complete tick sequence.

Multipliers, compound growth, timed challenges, allocations and automation can
change during a jump. Therefore the report includes a **matched fixed-step
calibration** of the first active profile and regular play. It reports measured
speedup only when both runs finish the same horizon, and displays checkpoint
timing differences or missing coverage. Early agreement does not validate late
game. A coarse run's time grid/window is not a statistical confidence interval.

For more precise investigation:

```powershell
npm run balance -- --mode fixed --hours 4 --step 1 --budget 600 --profiles active-generators,regular --calibrate-minutes 0
```

Fixed mode executes every policy decision at its configured cadence and splits
engine steps at those boundaries. Smaller steps are slower and can give different
answers in this nonlinear game. Compare steps rather than treating one value as
mathematically exact. Keep game-time horizon and source/strategy settings equal
when comparing execution speed or revisions.

## Policies and sections

`scripts/balance/policy.cjs` owns the explicit strategies. The active variants
compare Generator-first and Booster-first routes and different normal-reset gain
multiples. Regular play makes the same kinds of purchases/resets but checks every
300 seconds. Each check uses a bounded purchase/reset burst, with no simulated
mouse travel or thinking time. Unlock choices are agent strategy assumptions, not
owner-defined design targets or measured human behavior.

Policies use existing command guards for upgrades, discoverable upgrades when
already eligible, buyables, resets, earned milestone automation, Hindrance runs,
Mastery and several resource allocations. The Hindrance build restrictions and
Space/Hyper Building priorities use the game's own help. They are heuristics,
not an exhaustive planner. In particular, the policies do not search every
special no-resource build needed to discover some late-game upgrades. A stalled
policy does not establish a balance defect or an impossible section.
Late-game action adapters are experimental; their presence is not evidence that
a complete campaign has been measured. `policyCapabilities` describes implemented
actions, while each run's action counts show what was actually exercised.

`scripts/balance/sections.cjs` follows the help topics from Prestige through current
endgame. A section begins at the **first unlock of any of its parallel branches**;
individual layer times retain the complete branch detail. A section ends at the
next observed catalog section. Those durations belong to that one playthrough;
the report does not subtract the best times from different strategies to invent
an “optimal” combined route. “Best tested” is the earliest entry observed across
the listed runs, including regular play. It is not a proven global optimum.

Unreached sections have `null` timings and explicit censoring/stop reasons, never
zero, a guessed duration or a pass. There are no invented target completion times
and no assertion that the entire campaign has been completed. Use this tool to
find candidate pacing walls, then validate the relevant section and policy.

## Investigate an isolated later section

```powershell
npm run balance -- --save balance-results/active-generators.time-enhance-space.save.txt --hours 8 --profiles active-generators,regular --budget 120
```

The save is decoded by the normal codec into an independent in-memory session;
corrupt input and development-speed multipliers are rejected. Such a run measures
**time since the supplied state**, with its own policy starting decisions. It is
not a byte-for-byte continuation of the old controller's cooldown/challenge state,
and its zero-time already-unlocked sections are not fresh-game completion times.
Never mix these results into a fresh-game total. Keep synthetic checkpoints and
their source/report together when comparing later sections.

This is headless active/AFK calculation, not the browser's one-hour offline-absence
bank. Five minutes between manual checks does not mean the game stops production
for those five minutes. Nothing changes that bank or its cap.

## Focused checks and navigation

```powershell
npm run test:balance
```

Expected: deterministic sessions; native/VM player equality; isolation/no
persistence effects; valid/invalid saved state; exact five-minute fixed/rough
manual boundaries; coalesced rough steps; cache restoration after forecast errors;
and truthful censored/calibration output. This suite is also automatically included
in the normal `npm test` rule stage. Long balance sweeps are opt-in and do not add
multi-hour simulations to normal CI. All generated files are ignored.

README → [developer guide](developer-guide.md#game-time-balance-tests) → this guide
→ `scripts/balance/run.cjs` → `simulate.cjs` / `policy.cjs` → the canonical session
and rule owners. `rough.cjs` schedules estimates; `report.cjs` formats observations.
No new game schema, alternate formulas, service or paid provider is introduced.
