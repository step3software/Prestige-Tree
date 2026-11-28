# MS1-3 delivery and verification

Source: `step3software/Prestige-Tree`, canonical main `8333e6d535cad36361f261e8005861cfde6ed5c1`; implementation branch `codex/v08-upgrades` continued from `394b2f8e131d56e448f8df665060b2350642abe1`, dedicated worktree `prestige-v08-upgrades`. Exclusive writer fence 2720. Publication is the existing draft PR 12 to main. No merge, deployment, user-save access or change to native delivery authority is included.

## Bounded implementation

The owner's accepted in-game MS1-3 table and subsequent answers authorize these requirements:

| Requirement | Owning implementation / verification | Status |
| --- | --- | --- |
| Gather-only Food opening; no huts; first Organization at eight people | `featureAvailable`, `actionDefinition`, `projects`, population requirement; fresh legal journey and below/at guards | Verified by rules and Chromium |
| MS1 huts and three 1/2/3 Craft upgrades | Cord lashings, Timber frames, Construction tools; exact currency debit, housing and hut work | Verified by rules and Chromium |
| MS2 hunting and three 1/2/3 Craft upgrades | Digging sticks, Spear hunting, Butchery tools; guarded dispatch and exact yields/crews | Verified by rules and Chromium |
| MS3 unlocks both overseers and three 1/2/3 Organization upgrades | `organizationRewards`, `buyUpgrade`, no further supervisor purchase; lifetime gates survive spending | Verified by rules and Chromium |
| Prepared materials | Automatic huts snapshot a 0.75 work factor; manual huts get none; reload preserves it | Verified by rules and Chromium |
| Extended expeditions | Independent 1-5x selectors multiply duration and yield once, unchanged crews and one queued repeat per start; active jobs preserve snapshot | Verified by rules and Chromium |
| Work rosters | Separate Food/Hut assignments 1-5, caps 5-25; staffing/queue guards, full/blocked starts, exhaustion, releases and reset | Verified by rules and Chromium |
| Preserve existing settlements in one current model | Detached ingress preserves discovered activities, active snapshots, queues, paid work and stocks; atomic rejection of invalid staffing/locked work | Verified with actual v0.6/v0.7 and pre-redesign v0.8 codec exports |
| Irrigation affects Farming only | New farm contracts receive 1.35x; Gather/Hunt/Fish remain unchanged | Verified by rules |

Numeric tuning: Cord lashings changes hut scaling 1.35 to 1.25. Digging sticks adds 25% Gather yield; Butchery tools adds 50% Hunt yield. Prepared materials removes 25% automatic hut work. These are authored reversible balance coefficients, not historical measurements. At base rates with their MS2 upgrades, Gather yields 45 Food per worker-minute and Hunt 43.2, with larger hunting batches. Extended expeditions changes attention interval rather than theoretical throughput. Storage can clip larger returns.

The existing later features use the agreed gates (spring 4, Abundance 5, buyables 7, Farming 8, irrigation 9). Fire/Energy, cooking mechanics, future upgrade gaps and a new Fishing milestone are excluded. Milestone 6 retains the current well-record/Shared hearths content until Fire is implemented. Earlier discovered fishing remains usable; no unrequested new-game Fishing unlock was invented. Existing later retention and auto-building behavior remains.

## Source and standards evidence

Current Orcha main was freshly verified as `cc45f3cb57df44d1e6d46c1d7c562b9ae49f4b78`; `standards_resolver` verified the applicable catalog documents at that observation:

| Document | SHA-256 of Git bytes |
| --- | --- |
| docs/agent-workflows/intent-routing.md | 3b79f640a17fcdaa15ace38ee77a8bd7eda611a62ccfc9ac9c336bfd5f9387ed |
| docs/agent-workflows/feature.md | 52279cc4869aa56c9a40efe7c2e136177feb807053783039c3c4e7dfa95170b3 |
| docs/standards/no-legacy-modes.md | 913c1f945d15457cfcd3579bcef61fbe8f73757b57bc8e92dd9999181a834156 |
| docs/standards/readable-code.md | fdd9cb4cf7af821d5a3ab5267020b7ce2b8ee93e76cc419ecc436e478655e58e |

Project governing documents read at the selected branch source `394b2f8`:

```json
{
  "AGENTS.md": "aca5c332ba10d11ee6fbcc74c9f97e931451ae89289b2a035521007c83682ca6",
  ".orcha/repository.json": "d697ffc8ff826964f1552479386997e023f2eb5b3de9240715f7b50c4bbc8585",
  "docs/developer-guide.md": "c446f096210b086ce525d64c6cf69cc8f8dc1d6c99ef74b28e876b2679f64fbc",
  "docs/!general-info.md": "06420ab8ce5eb231928fd93aa17552580840128039f6e6d1fe5a4614ecf1570e",
  "docs/civilization.md": "4b33889881ad22e4e9454a0c54805a8806d843d176c6d9c02ac8f9bc16633cc8",
  "docs/balance-testing.md": "515b8da8bf20eb02aa683ffa2cf1b1781933c7b2d221678165cec2d015c288c8"
}
```

The retained registry/manifest's historical master entry is unchanged; current project AGENTS selects main. Earlier verified Orcha AGENTS, registry, catalog and topic-index Git-byte hashes remain in the linked [v0.8 baseline evidence](v08-upgrades.verification.md). This run applies the same freshly observed Orcha main revision.

## Verification and limits

Final complete `npm test`: build/package, real Vue template compilation, syntax, lexical/type boundaries, negative static sensitivity, **121 rule/save/runtime/balance tests**, prestige mutation sensitivity and **26 Chromium journeys** passed. `git diff --check` and fatal UTF-8 decoding also passed. Focused rules cover 25-repeat exhaustion with a mid-queue reload, exact currencies and locked purchases, snapshot continuity, work discounts, invalid staffing, current locked activity rejection, and reset clearing. The UI journey buys MS3 upgrades with Organization, selects 5x expeditions, configures five Food/two Hut overseers, checks 25/10 caps, keyboard exhaustion, disabled unsafe staff reductions and save/reload. Actual 1280/320px renders were inspected; selectors were given separate rows and readable narrow options. No actual-user or assistive-technology usability claim is made.

The actual historical v0.8 fixture in `tests/fixtures/civ-pre-ms123-v08.json` was exported by the immutable `394b2f8` civilization/mod sources through the real codec using the existing inert VM harness; its source hashes and revision are embedded. Existing v0.6/v0.7 fixtures retain their original provenance. No personal saves were used.

Legal fixed simulations (5-second active checks; 20-second regular opening checks and 300-second checks after earned automation) reach MS1 at 40s, MS2 at 210s/240s and MS3 at 345s/380s for active/regular play. Existing chapter completion is 2410s/2960s. The policy waits to earn larger Craft payouts rather than repeatedly resetting for one point, then uses the actual staffing and expedition controls. These are synthetic strategy observations, not optimality, human pacing targets or guarantees for an arbitrary queue. Actual-starvation recovery is 93s/92s for active/regular reached settlements, peaking at 7.44x/7.56x growth. Legal queue exhaustion, staffed ten-minute idle survival after setup, and rough/fixed parity passed.

Readable-code route: README -> developer guide -> `organizationRewards` / queue owners in `js/civilization.js` -> component commands -> `index.html`; focused check `node --test tests/rules/early-milestones.test.cjs`. New persistent fields live only in `player.civ`, ingress validation owns rejected candidates, and UI owns no duplicate gameplay state. Shared RC-01/03/04/07/08 and no-legacy-mode requirements map to that trace, actual historical codec tests and the final package/static/rule/browser checks. Publication leaves the PR unmerged.
