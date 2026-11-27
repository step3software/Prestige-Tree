# Civilization game reference guide

The strongest foundation for this game is a community allocating limited work
among reliable essentials, new capabilities and chosen uses of its surplus.
Smil helps explain the material constraints. Scott helps expose assumptions
about growth, political control and whose life improves.

This guide translates [Smil's source notes](smil.md) and [Scott's source
notes](scott.md) into design options. It does not change the game specification
or authorize mechanics. Costs, multipliers, unlock thresholds, real-time pacing
and prestige formulas require authored design and [balance evidence](../balance-testing.md#add-balance-coverage-with-content).

## Addresses and scope

- Local guide: `C:\Users\PhillipCurry\projects\codex\games\civ-prestige-research-20261127\docs\research\reference-guide.md`
- Repository guide: [docs/civ-research-20261127](https://github.com/step3software/Prestige-Tree/blob/docs/civ-research-20261127/docs/research/reference-guide.md).
- Local prototype inspected: `C:\Users\PhillipCurry\projects\codex\games\civ-prestige-tree\js\civilization.js`.
- Project repository: [step3software/Prestige-Tree](https://github.com/step3software/Prestige-Tree).
- Original books: local addresses and [library repository](https://github.com/step3software/books) are recorded in the [index](README.md#addresses) and [source manifest](sources.json).

The resource mapping below describes the uncommitted Civ prototype observed on
2026-11-27. The documentation branch starts from published `main` at
`d7d260fa66b270aae228dec2183f4df9da508b5f`, whose inherited game content differs.
[Evidence](evidence.json) records the prototype file digest. Read the current
rules before using this mapping for implementation work.

## Resource map

| Resource or mechanic | Research connection | Design distinction to preserve |
| --- | --- | --- |
| Population | Subsistence, work capacity and demographic change: [SMI-03](smil.md#smi-03-surplus-and-specialization), [SCT-04](scott.md#sct-04-population-and-welfare). | More people create both capacity and demand; headcount is not a welfare score. |
| Food | Harvest, processing, reserves and edible surplus: [SMI-04](smil.md#smi-04-storage-and-edible-surplus), [SCT-05](scott.md#sct-05-grain-and-legibility). | Production rate, storage space and current stock solve different problems. |
| Water | Water access and crop constraints: [SMI-07](smil.md#smi-07-water-and-nutrients). | Household supply, irrigation and drainage are distinct services. |
| Shelter | Material work and settlement: [SMI-01](smil.md#smi-01-useful-energy-and-conversion), [SCT-01](scott.md#sct-01-settlement-is-not-a-fixed-sequence). | A housing cap is a readable game abstraction, not a universal settlement equation. |
| Craft | Useful tools, processing and conversion chains: [SMI-05](smil.md#smi-05-processing-and-household-work), [SMI-08](smil.md#smi-08-craft-needs-materials-and-fuel). | An improvement should identify the task it changes. |
| Organization | Coordination, controls, records and power: [SMI-10](smil.md#smi-10-controls-and-knowledge), [SCT-06](scott.md#sct-06-administration-and-power). | Coordination can reduce wasted work; it does not make biological needs disappear. |
| Money | Exchange across places and specialized activities: [SCT-09](scott.md#sct-09-trade-and-nonstate-neighbors). | Money is a claim on exchanged goods/services; trade can predate the node. |
| Time | Work released by particular services: [SMI-05](smil.md#smi-05-processing-and-household-work), [SMI-13](smil.md#smi-13-services-and-welfare). | Available hours and accumulated investment effort are different quantities. |
| Education | Skills, reproducible instructions and adoption: [SMI-10](smil.md#smi-10-controls-and-knowledge). | A later node can expand access or institutions; learning already exists. |
| Culture | Values and creative achievements: [SMI-11](smil.md#smi-11-energy-constrains-without-determining-culture), [SCT-03](scott.md#sct-03-mixed-subsistence-and-knowledge). | Culture is not a single stage or a measure of human superiority. |
| Prestige | Reorganization and continuity: [SCT-08](scott.md#sct-08-collapse-and-survival). | Retention has a plausible analogy; the reset exchange and compounding rewards are invented. |

## Population and subsistence

The prototype's shared labor budget gives the early game a useful basis: people
need essentials before their work can support construction and other activities.
Reliable supply and reserves can constrain growth independently. Smil's surplus
argument supports this relationship; neither book supplies the prototype's exact
per-person upkeep, housing requirement or growth interval.

Keep two kinds of improvement distinct. Expanding fields or collection sites can
raise total capacity without reducing work per unit. Better tools or easier
access can reduce necessary work. The first can support more people; the second
can support more discretionary activity. Their combination is a meaningful
progression choice. [SMI-02](smil.md#smi-02-land-output-and-labor-output),
[SMI-03](smil.md#smi-03-surplus-and-specialization).

Scott adds a reason to preserve several objectives: demographic growth can
coexist with harder work and poor welfare. The game can reward population while
also valuing reliable supplies, recovery, time and learning. The accepted
prototype's pause in growth during shortage is a player-friendly rule, not a
historical claim that shortages never harmed existing populations.
[SCT-04](scott.md#sct-04-population-and-welfare).

## Food water and reserves

### Shared hearths

The [USDA National Agricultural Library's BARC archaeology exhibit](https://www.nal.usda.gov/exhibits/speccoll/exhibits/show/barc/what-did-people-do-here-/food-preparation), read 2026-11-27, interprets pottery around a hearth as evidence for communal meal preparation and describes sharing food beyond the immediate hunting group. This supports the game's shared-cooking theme. It does not establish an empirical Food yield, storage volume or housing benefit. Hearth income represents pooling and preparation efficiency within the existing Food abstraction, rather than an additional harvest route or a new worker reservation.

The [GDC 2009 Game Design Workshop handout, page 3](https://media.gdcvault.com/gdc09/slides/Handout.pdf), read the same day, describes positive feedback as reinforcing a system's direction. Apply that lens to Population producing more Food: keep the income below upkeep so growth still needs staffed routes. The selected game rule is +5 storage and +1 Food/min per full ten current people, settlement-wide. Its coefficients are design choices, with legal pacing observations in the [balance guide](../balance-testing.md#shared-hearths-observations). Housing effects were excluded by the owner's final scope.

Separate four questions in descriptions and balancing: how much can the site
produce, how much labor is available, how much stock fits, and how long the
reserve lasts at current demand. The useful game measure is a supply buffer
relative to demand, rather than a pile size with no consumption context.
[SMI-04](smil.md#smi-04-storage-and-edible-surplus).

A food basket can improve storage while leaving collection rates unchanged.
A nearby water point can save carrying work while a new reservoir can increase
the buffer. Irrigation serves crops; drainage removes excess water. These can
become different choices if the design later needs more detail. The early
single Water resource is an abstraction of reliable supply.
[SMI-05](smil.md#smi-05-processing-and-household-work),
[SMI-07](smil.md#smi-07-water-and-nutrients).

Scott's grain argument offers a later distinction between distributed household
reserves and a centrally managed store. Both can feed people, but the latter
also supports accounting, distribution and concentrated control. It is a design
lead for Organization, not a reason to turn every early food source into grain.
[SCT-05](scott.md#sct-05-grain-and-legibility).

## Water-storage materials

The first pottery storage buyable is **Craft earthenware jars**: hand-shaped,
fired-clay vessels. Smil's early pottery, fired-clay and leather-container examples
support container craft in a foraging opening, while leaving earlier non-pottery
containers possible. [SMI-14](smil.md#smi-14-early-containers-and-fired-clay).

The [Ashmolean's ceramic classification](https://potweb.ashmolean.org/PotABCs1.html)
distinguishes porous, lower-fired earthenware from higher-fired stoneware and
porcelain. The [Met's unglazed water-storage jar](https://www.metmuseum.org/art/collection/search/448695)
shows that porous clay vessels could store and cool liquids. That particular
object is 8th–10th century; it is evidence of use, not the date or form of the
first water jar. Earthenware is not described here as inherently waterproof.

For the game, improved sealing/glazing or a suitable higher-fired clay body are
possible later investments costing more Craft. They would require their own
costs, effects and unlocks: no automatic material tiers or universal historical
sequence is implemented. Keep the `water-storage` ID and owned count independent
of the displayed material so a later upgrade can improve existing storage.
Current purchases cost 1 Craft plus scaling work and add 40 storage; those
numbers are balancing decisions. See [Water rules](../civilization.md#water-hauling-jars-and-flow).

## Craft and shared work

The prototype combines Craft and Education into a general tool bonus. For the
current simple game, describe this as improved working practices and equipment.
If later content becomes more specific, name the task and input: better baskets
reduce handling losses; a mill reduces processing work; a powered device trades
human labor for an external energy source and supporting infrastructure.
[SMI-01](smil.md#smi-01-useful-energy-and-conversion),
[SMI-05](smil.md#smi-05-processing-and-household-work).

Avoid claiming that every tool increases capacity, speed, storage and leisure
equally. Working animals require feed and care; metal tools require materials
and fuel. These dependencies create possible later decisions without requiring
a complex supply chain in the opening.
[SMI-06](smil.md#smi-06-prime-movers-have-running-costs),
[SMI-08](smil.md#smi-08-craft-needs-materials-and-fuel).

## Organization and exchange

The prototype lets Organization and Culture reduce modeled upkeep. A defensible
interpretation is less waste in provisioning and coordination, rather than
people becoming able to live on arbitrarily little food or water. If this
distinction later matters mechanically, separate baseline needs from avoidable
losses. The books do not calibrate a waste floor or justify an unlimited bonus.
[SMI-10](smil.md#smi-10-controls-and-knowledge).

Automatic building can mean reliable scheduling and retained instructions.
Neither greater coordination nor record keeping must be presented as the first
appearance of social cooperation. Scott's treatment of administration also
suggests asking who controls the surplus and bears the work if political
branches become part of the design.
[SCT-06](scott.md#sct-06-administration-and-power).

The prototype's Money generation can represent selling output or services from
specialized labor. That is an authored abstraction, not evidence that allocating
workers creates purchasing power without an exchange partner. Existing trade
can precede a later Money node that expands exchange capacity or institutions.
[SCT-09](scott.md#sct-09-trade-and-nonstate-neighbors).

## Time education and culture

Time is most useful as the outcome of less essential work. Its current
accumulating balance can be interpreted as completed discretionary effort
available for investment. It should not imply that yesterday's unused hour can
literally become tomorrow's extra hour. Any alternative accounting model is a
future design decision.
[SMI-03](smil.md#smi-03-surplus-and-specialization),
[SMI-05](smil.md#smi-05-processing-and-household-work).

An Education unlock can expand organized teaching and access to learning.
A Culture unlock can expand patronage, shared projects or time for expression.
Both already exist in the starting community. Neither book establishes a
historical requirement to accumulate money before learning or making art;
unlock costs and prerequisites serve this game's progression.
[SMI-10](smil.md#smi-10-controls-and-knowledge),
[SMI-11](smil.md#smi-11-energy-constrains-without-determining-culture),
[SCT-03](scott.md#sct-03-mixed-subsistence-and-knowledge).

## Prestige and rebuilding

The present exchange of food and water stocks for Craft or Organization, while
retaining people and housing, can be framed as provisioning a collective
improvement or adopting a durable practice. Spending supplies then has a purpose;
an abstract reset does not have to mean a catastrophe.

Scott's distinction between a state and the people who survive its disassembly
supports continuity as an analogy. It does not establish that a deliberate
collapse always improves society, that all infrastructure survives, or that
repeated collapse generates permanent productivity bonuses. Keep the specific
reset, retention and reward rules explicit as game design.
[SCT-08](scott.md#sct-08-collapse-and-survival),
[SMI-09](smil.md#smi-09-transitions-and-complementary-systems).

## Stress and recovery

Reserves, varied sources and maintained infrastructure can protect a community
against pressure. Concentrating output can also concentrate vulnerability.
Scott's discussion offers ecological and organizational leads, with uncertainty
about the causes of individual ancient collapses.
[SCT-07](scott.md#sct-07-concentration-and-fragility).

For the present forgiving design, pressure can remain visible through stalled
growth, reserve depletion and slower discretionary production, with labor-only
recovery. Historical mortality, coercion and forced movement are context for
the sources; adding them is outside this documentation task and the observed
prototype's recovery rules.

Efficiency can also be absorbed by a larger population or more activity.
Displaying improved output per worker alongside increased total demand makes
this feedback understandable. Do not force a rebound after every upgrade.
[SMI-12](smil.md#smi-12-efficiency-and-rebound).

## Progression without a universal ladder

The existing tier layout is a way to teach mechanics. Interpret later nodes as
an expansion in scale, access or investment rather than the first historical
appearance of knowledge, culture, exchange or organization. Food gathering,
farming and pastoralism could coexist; geography and institutions affected
which options were useful.
[SCT-01](scott.md#sct-01-settlement-is-not-a-fixed-sequence),
[SCT-09](scott.md#sct-09-trade-and-nonstate-neighbors).

Smil emphasizes physical constraints while expressly rejecting a complete
energy explanation of cultural achievement. Scott's political lens emphasizes
appropriation and the autonomy of nonstate communities. Use the tension between
them to ask better design questions. Do not average their views into a supposed
formula for civilizational success.
[SMI-11](smil.md#smi-11-energy-constrains-without-determining-culture),
[SCT-06](scott.md#sct-06-administration-and-power).

## Later eras

For a future extension, Smil's chapters 4-7 provide a reading route through
biomass fuels, mechanical power, metallurgy, coal/coke, engines, electricity,
information systems and environmental effects. Their full headings are indexed
in [sources.json](sources.json). Scott's chapter 7 is the companion route for
trade, neighbors and relations between different forms of community.

These are research leads, not an approved roadmap. Before selecting a mechanic,
read its cited section in full and check its conditions. A 2017 comparison of
energy technologies or national statistics needs updated evidence before being
presented as a current claim.

## Use a source in a design change

Keep one small trace with the proposed mechanic:

```text
Design question and observable player choice:
Source claim ID, chapter, section and paragraph range:
What the author actually argues and the conditions attached:
Game interpretation and simplifications:
Units, invented parameters and intended pacing:
Existing rule owner and focused balance scenario:
```

For example, cite `SMI-02` when separating a site's capacity upgrade from a
worker-efficiency upgrade. The historical argument explains why the distinction
is useful. The chosen costs, effects and active/five-minute play outcomes must
come from the game's design and its [balance workflow](../balance-testing.md#add-balance-coverage-with-content).
