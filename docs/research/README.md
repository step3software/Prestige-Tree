# Civilization research index

Use Smil to reason about work, energy, production and infrastructure. Use Scott
to question how settlement, surplus and political control affect the people
doing that work. Together they support a game with changing constraints and
meaningful choices; they do not prescribe a single inevitable civilization tree.

Start with the [game reference guide](reference-guide.md), then follow a source
note to its cited passage. The notes separate the author's argument from its
possible use in the game.

## Addresses

| Resource | Local address | Repository address |
| --- | --- | --- |
| Research worktree | `C:\Users\PhillipCurry\projects\codex\games\civ-prestige-research-20261127` | [Documentation branch](https://github.com/step3software/Prestige-Tree/tree/docs/civ-research-20261127) |
| This index | `C:\Users\PhillipCurry\projects\codex\games\civ-prestige-research-20261127\docs\research\README.md` | [Research index](https://github.com/step3software/Prestige-Tree/blob/docs/civ-research-20261127/docs/research/README.md) |
| Game reference guide | `C:\Users\PhillipCurry\projects\codex\games\civ-prestige-research-20261127\docs\research\reference-guide.md` | [Reference guide](https://github.com/step3software/Prestige-Tree/blob/docs/civ-research-20261127/docs/research/reference-guide.md) |
| Active Civ prototype at this reading | `C:\Users\PhillipCurry\projects\codex\games\civ-prestige-tree` | [Project repository](https://github.com/step3software/Prestige-Tree) |
| Personal book library | `C:\Users\PhillipCurry\projects\books\books` | [Library repository](https://github.com/step3software/books), source branch `main` |

The documentation branch is separate from the active prototype. Its publication
does not put these changes on `main`. Both EPUBs are available in the local
library and its repository. The source notes link each published copy at the
verified library revision `8893e4e75744f12fd3f52cc1b9f5347a11e97453`.
Their Git blob identities match the local bytes. The game repository contains
the notes and index, without duplicating the books.

## Sources

| ID | Book and edition | Use it for | Source notes |
| --- | --- | --- | --- |
| SMI | Vaclav Smil, *Energy and Civilization: A History*. MIT Press, copyright 2017; supplied EPUB Version 1.0. | Food and labor budgets, tools, fuels, transport, infrastructure, industrial transitions and limits of energy explanations. | [Smil chapter map and claims](smil.md) |
| SCT | James C. Scott, *Against the Grain: A Deep History of the Earliest States*. Yale University Press, copyright 2017; supplied EPUB. | Mixed subsistence, settlement, grain storage, administration, coercion, fragility and state/nonstate relations. | [Scott chapter map and claims](scott.md) |

Exact source paths, ISBN information, SHA-256 hashes, all spine entries, chapter
locations and every chapter heading are in [sources.json](sources.json).
Both EPUBs lack usable embedded printed-page markers in the indexed chapters.
References therefore use chapter, section heading and reproducible paragraph
ordinals, rather than guessed print pages or reader-dependent Kindle locations.

## Find an idea

| Question or topic | Start here | Passage notes |
| --- | --- | --- |
| What limits population growth? | [Population and subsistence](reference-guide.md#population-and-subsistence) | [SMI-02](smil.md#smi-02-land-output-and-labor-output), [SCT-04](scott.md#sct-04-population-and-welfare) |
| How should tools release labor? | [Craft and shared work](reference-guide.md#craft-and-shared-work) | [SMI-03](smil.md#smi-03-surplus-and-specialization), [SMI-06](smil.md#smi-06-prime-movers-have-running-costs) |
| Why separate water, food and storage? | [Food water and reserves](reference-guide.md#food-water-and-reserves) | [SMI-04](smil.md#smi-04-storage-and-edible-surplus), [SMI-07](smil.md#smi-07-water-and-nutrients), [SCT-05](scott.md#sct-05-grain-and-legibility) |
| What does Shared hearths represent? | [Shared hearths](reference-guide.md#shared-hearths) | USDA communal-cooking interpretation; GDC feedback model; game coefficients distinguished from historical evidence |
| What should early water containers be called? | [Water-storage materials](reference-guide.md#water-storage-materials) | [SMI-14](smil.md#smi-14-early-containers-and-fired-clay), with primary museum references |
| What can Organization represent? | [Organization and exchange](reference-guide.md#organization-and-exchange) | [SMI-10](smil.md#smi-10-controls-and-knowledge), [SCT-06](scott.md#sct-06-administration-and-power) |
| Where does free time come from? | [Time education and culture](reference-guide.md#time-education-and-culture) | [SMI-05](smil.md#smi-05-processing-and-household-work), [SMI-13](smil.md#smi-13-services-and-welfare) |
| Does farming always improve life? | [Progression without a universal ladder](reference-guide.md#progression-without-a-universal-ladder) | [SMI-02](smil.md#smi-02-land-output-and-labor-output), [SCT-01](scott.md#sct-01-settlement-is-not-a-fixed-sequence) |
| What should persist through prestige? | [Prestige and rebuilding](reference-guide.md#prestige-and-rebuilding) | [SCT-08](scott.md#sct-08-collapse-and-survival), [SMI-09](smil.md#smi-09-transitions-and-complementary-systems) |
| How can growth create new problems? | [Stress and recovery](reference-guide.md#stress-and-recovery) | [SMI-12](smil.md#smi-12-efficiency-and-rebound), [SCT-07](scott.md#sct-07-concentration-and-fragility) |
| What might support later technology branches? | [Later eras](reference-guide.md#later-eras) | [SMI-08](smil.md#smi-08-craft-needs-materials-and-fuel), Smil chapters 4-7 |
| How should neighbors and trade work? | [Organization and exchange](reference-guide.md#organization-and-exchange) | [SCT-09](scott.md#sct-09-trade-and-nonstate-neighbors) |
| Can energy explain Culture? | [Time education and culture](reference-guide.md#time-education-and-culture) | [SMI-11](smil.md#smi-11-energy-constrains-without-determining-culture), [SCT-03](scott.md#sct-03-mixed-subsistence-and-knowledge) |

## Open a cited passage

From the research worktree root, use Python 3.12 or newer. The helper uses only
the standard library, reads local files, performs no network calls and writes
no files. No npm installation is needed.

```powershell
py -3 -B docs/research/read_sources.py verify
py -3 -B docs/research/read_sources.py chapters smil
py -3 -B docs/research/read_sources.py read smil 3 --paragraphs 59:61
py -3 -B docs/research/read_sources.py read scott 4 --paragraphs 29:38
py -3 -B docs/research/read_sources.py search scott "salinization" --limit 3
```

The `read` range is inclusive. Its ordinals count nonempty XHTML headings,
paragraphs, captions, list items and definition items in document order. Chapter
IDs are `1` through `7`, plus `intro` for Scott. A different machine can locate
the same copies with an explicit root:

```powershell
py -3 -B docs/research/read_sources.py --library-root D:/books verify
```

Each lookup checks the whole EPUB hash. A missing source, changed edition,
invalid range or mismatched chapter fails with an explanation. A zero-match
search reports zero; it does not establish that a concept is absent from the
book. Figures, tables and words split across markup may need direct inspection
in an EPUB reader. The helper does not decrypt DRM or fetch missing copies.

For broader library searches, use the Books repository's existing
[search tool and setup guide](https://github.com/step3software/books/blob/8893e4e75744f12fd3f52cc1b9f5347a11e97453/docs/library.md).
Its generated local index needs a refresh after a checkout or library change.
The small helper here resolves the two verified editions and their citations
without requiring that database.

## Reading coverage and provenance

This is a targeted research reading across all seven numbered chapters in each
book and Scott's introduction, with closer reading of the passages cited in the
source notes. It is not a claim of cover-to-cover close reading. Both EPUBs were
fully parsed for the spine and heading index. Bibliographies, endnotes, indexes,
tables and illustrations were inventoried rather than comprehensively reviewed;
the underlying studies were not independently checked.

The source notes are original paraphrases. These two historical syntheses supply
arguments and examples, not calibrated game parameters or a complete research
consensus. Smil's contemporary statistics describe the period covered by the
2017 edition. Scott flags several early-state explanations as speculative and
argues a position where evidence or interpretation is contested.

[Run evidence](evidence.json) records the project and current Orcha revisions,
document hashes, source-resolution discrepancy and prototype observation. Future
work resolves current standards afresh; that dated evidence is not a version pin.
