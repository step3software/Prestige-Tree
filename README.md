# Prestige Tree development fork

This is `step3software/Prestige-Tree`, forked from
[Jacorb90/Prestige-Tree](https://github.com/Jacorb90/Prestige-Tree).
For development, start with [AGENTS.md](AGENTS.md), the
[Orcha manifest](.orcha/repository.json) and the
[development guide](docs/developer-guide.md). Project source is `master`;
shared Orcha standards follow current published `main`.

Run locked regression checks from the [development guide](docs/developer-guide.md#verify-a-focused-change).
See [TST01 verification](docs/milestones/TST01.verification.md) for the implemented
test foundation, fixed defects and evidence limits.

Proposed delivery milestones (documentation proposals; dependencies are technical sequencing, not runtime status):

| Milestone | Outcome | Depends on |
| --- | --- | --- |
| [TST01](docs/milestones/TST01.md) | Repeatable game regression testing | Foundation |
| [SAV01](docs/milestones/SAV01.md) | Separate save validation and persistence | TST01 |
| [SIM01](docs/milestones/SIM01.md) | Deterministic simulation and explicit runtime lifecycle | TST01 |
| [LAY01](docs/milestones/LAY01.md) | Organize game content by layer | TST01, SIM01 (soft) |
| [DEV01](docs/milestones/DEV01.md) | Explicit state ownership and enforceable JavaScript contracts | SAV01, SIM01, LAY01 |
| [UI01](docs/milestones/UI01.md) | Migrate the interface to supported Vue | TST01, DEV01 |

## Upstream engine introduction

### The-Modding-Tree

A modified version of The Prestige Tree that is much easier to mod. It still requires programming knowledge, but it's mostly pretty easy things and copy/pasting.

[Look here for a tutorial on getting started with modding with TMT](docs/getting-started.md)

You can look in the [documentation](docs/!general-info.md) for more information on how it all works, or look at the code in [js/layers.js](js/layers.js) to see what it all looks like.
