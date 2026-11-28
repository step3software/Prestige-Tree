# Kelly source notes

Robert L. Kelly's *The Lifeways of Hunter-Gatherers: The Foraging Spectrum*
connects foraging choices with environment, knowledge, technology and social
relations. It helps distinguish a large haul from a high return on all the work
needed to obtain it. Its models are conditional explanations, not universal
instructions for how people ought to behave.

The supplied PDF is the second edition, Cambridge University Press, 2013. Its
copyright page lists ISBN `9781107024878` (hardback) and `9781107607613`
(paperback). It has 384 physical file pages. Main-text printed page 1 is file
page 23: throughout this copy, a numbered main-text page is 22 less than its
physical file page. Front matter uses different labels.

- Local source: `C:\Users\PhillipCurry\projects\books\books\The Lifeways of Hunter-Gatherers - The Foraging Spectrum by Robert L. Kelly.pdf`
- Repository: [Books library](https://github.com/step3software/books). This addition was absent from the verified library revision recorded in [sources.json](sources.json); no hosted-copy URL is asserted.
- Local notes: `C:\Users\PhillipCurry\projects\codex\games\civ-prestige-research-techniques-20261127\docs\research\kelly.md`
- Repository notes: [Kelly reference](https://github.com/step3software/Prestige-Tree/blob/docs/civ-research-techniques-20261127/docs/research/kelly.md).

## Chapter index

| ID | Chapter | Printed pages | Physical PDF pages |
| --- | --- | --- | --- |
| 1 | Hunter-Gatherers and Anthropology | 1-23 | 23-45 |
| 2 | Environment, Evolution, and Anthropological Theory | 24-39 | 46-61 |
| 3 | Foraging and Subsistence | 40-76 | 62-98 |
| 4 | Mobility | 77-113 | 99-135 |
| 5 | Technology | 114-136 | 136-158 |
| 6 | Sharing, Exchange, and Land Tenure | 137-165 | 159-187 |
| 7 | Group Size and Demography | 166-213 | 188-235 |
| 8 | Men, Women, and Foraging | 214-240 | 236-262 |
| 9 | Nonegalitarian Hunter-Gatherers | 241-268 | 263-290 |
| 10 | Hunter-Gatherers and Prehistory | 269-300 | 291-322 |

Ranges include intervening or chapter-end pages through the next chapter's
start. [sources.json](sources.json) contains every PDF bookmark, its nesting
depth and both page locations; it also inventories front matter, references and
the index. Those back-matter items are not included in the helper's chapter search.

## KEL-01 Variation comes first

**Source:** chapter 1, printed pp. 1-2; PDF file pages 23-24.

Kelly emphasizes differences among foraging communities and warns against
turning a commonly reported ethnographic trait into an automatic reconstruction
of ancient society. Exchange and cultivation can coexist with foraging.

**Game use:** a starting community can already possess skill, social knowledge
and relationships. A tutorial's route order is not a universal historical ladder.
Regional ecology and chosen assumptions should be explicit when defining food
resources and technology options.

## KEL-02 Compare returns with the same accounting boundary

**Source:** chapter 3, “What Is the ‘Right’ Return Rate?”, printed pp. 52-53;
PDF file pages 74-75.

Return-rate comparisons change with whether they include search, pursuit,
handling, carrying and energetic costs. Kelly distinguishes different measures
and discusses why experiments or modern hunting data may not transfer directly
to historical foragers. Larger animals do not guarantee higher returns per person.

**Game use:** compare routes using food delivered, crew size, complete trip time
and relevant equipment costs. A larger single haul is not enough to rank Hunt
above Gather. The source's context-specific caloric observations should not be
copied into universal route coefficients.

## KEL-03 Processing and attention

**Source:** chapter 3, “Processing of Resources,” printed p. 64; PDF file page 86.

Processing can occur after gathering or involve different people. Some cooking
allows other work at the same time, while other techniques demand continuing
attention. Ignoring processing can conceal work; reserving a worker for every
minute that a pot is hot can also overstate work.

**Game use:** define whether Food rewards mean raw material or ready provisions.
The current single meter can include preparation within the trip abstraction.
If preparation is separated later, distinguish attended work from elapsed time
and count each worker once. Do not quietly reinstate domestic labor that the
current design explicitly removed.

## KEL-04 Distance and what gets carried

**Source:** chapter 3, “Central Place Foraging,” printed pp. 66-68; PDF file
pages 88-90.

The cost of returning food to camp interacts with load capacity and field
processing. Removing inedible bulk may be worth the field time on a distant
trip but not a nearby one. Better transport can alter that tradeoff.

**Game use:** exploration can change travel time and access; baskets can change
carrying; processing can change edible load. These are distinct effects. The
current longer, richer gathering trip is a useful game tradeoff, but indefinite
exponential improvement is not established by this model.

## KEL-05 Reliability and objectives

**Source:** chapter 3, “Risk” and “Why Only Calories?”, printed pp. 68-70;
PDF file pages 90-92.

Resource variability and imperfect information complicate choices. Maximizing
long-run returns, reducing today's chance of returning empty-handed and saving
time need not select the same activity. Kelly also questions treating caloric
energy as a complete account of food choice.

**Game use:** the routes can serve different strategic purposes rather than
forming one fixed ranking. Current deterministic rewards omit catch variation;
that simplification need not be removed. If uncertainty is later added, balance
the recovery experience as well as average output and show its causes.

## KEL-06 Making equipment has a payback period

**Source:** chapter 5, “A Technological Investment Model,” printed pp. 128-131,
including Figure 5-6; PDF file pages 150-153.

An elaborate tool can improve use-time returns while taking longer to make.
Its value depends on how much it will be used. Kelly's spear/net comparison is
explicitly hypothetical; the manufacturing and use-time axes must not be read
as one observed universal schedule.

**Game use:** baskets, river traps and other equipment can have an initial Craft
or work cost that pays back across repeated trips. Preserve fabrication, labor
released per use and yield per use as separate variables. Choose the game's
costs and scaling through its balance workflow, not the illustrative diagram.

## KEL-07 Party size and total haul

**Source:** chapter 7, “Communal versus Individual Foraging,” printed pp. 174-175;
PDF file pages 196-197. Related comparison: chapter 5, printed p. 131, PDF 153.

Kelly discusses communal hunting with larger catches whose per-person returns
need not exceed those of smaller hunting groups. The reasons for choosing a
method involve labor alternatives, social arrangements and exchange as well
as technology.

**Game use:** the current bigger-game purchase's crew increase is a meaningful
cost. Evaluate food per worker-time and competition with Water and construction,
not just the displayed reward. The book does not supply fixed crew sizes or
require everyone in a community to do the same job.

## KEL-08 Storage changes choices about place and time

**Source:** chapter 4, “Storage” and “Other Factors,” printed pp. 103-104;
PDF file pages 125-126.

Stored food can buffer seasonal or uncertain access and can affect incentives
to move or remain near supplies. Mobility also has social and material motives;
it is not exclusively a response to food depletion.

**Game use:** storage should solve a buffer problem independently of increasing
trip yield. Reserves can help a settlement withstand longer trips or redirect
workers, but the source does not imply that building a store automatically
creates sedentism or a particular political system.

## Open the source

The helper takes physical PDF pages, then prints their separate printed labels:

```powershell
py -3 -B docs/research/read_sources.py chapters kelly
py -3 -B docs/research/read_sources.py read kelly 3 --pages 86:86
py -3 -B docs/research/read_sources.py read kelly 5 --pages 150:153
```

PDF reading requires the dependency described in the [index](README.md#open-a-cited-passage).
References here use both numbering systems to prevent a 22-page citation error.
Text extraction can disturb mathematical layout, ligatures and table columns;
check the rendered page before copying a formula or numerical table. The cited
return-accounting page, processing page and Figure 5-6 were visually inspected.
No numerical equation or ethnographic return rate was adopted as a game constant.

Reading coverage: selected passages in chapters 1, 3, 4, 5 and 7. The complete
chapter/bookmark structure was indexed; the other chapters and underlying
studies were not comprehensively reviewed.
