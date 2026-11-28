# Civilization game reference guide

The strongest foundation for this game is a community allocating limited work
among reliable essentials, new capabilities and chosen uses of its surplus.
Smil explains material constraints; Scott questions growth and political control.
Plant gives practical examples of tools, containers and shelters; Kelly helps
account for foraging work, equipment investment and uncertainty.

This guide translates [Smil](smil.md), [Scott](scott.md), [Plant](plant.md) and
[Kelly](kelly.md) into design options. It does not change the game specification
or authorize mechanics. Costs, multipliers, unlock thresholds, real-time pacing
and prestige formulas require authored design and [balance evidence](../balance-testing.md#add-balance-coverage-with-content).

## Addresses and scope

- Local guide: `C:\Users\PhillipCurry\projects\codex\games\civ-prestige-research-techniques-20261127\docs\research\reference-guide.md`
- Repository guide: [docs/civ-research-techniques-20261127](https://github.com/step3software/Prestige-Tree/blob/docs/civ-research-techniques-20261127/docs/research/reference-guide.md).
- Local rule owner: `C:\Users\PhillipCurry\projects\codex\games\civ-prestige-research-techniques-20261127\js\civilization.js`.
- Project repository: [step3software/Prestige-Tree](https://github.com/step3software/Prestige-Tree).
- Original books: local addresses and [library repository](https://github.com/step3software/books) are recorded in the [index](README.md#addresses) and [source manifest](sources.json).

The mapping describes published Civ at `8333e6d535cad36361f261e8005861cfde6ed5c1`,
observed on 2026-11-27. [Civilization design](../civilization.md) owns its rules;
[evidence](evidence.json) records this reading's revisions and hashes. The opening
uses staffed Gather/Hunt/Fish/Farm actions, shortage losses and explicit prestige
retention. Money/Time and Education/Culture are locked later branches; their
research discussion below supplies future design leads, not present unlocks.

## Resource map

| Resource or mechanic | Research connection | Design distinction to preserve |
| --- | --- | --- |
| Population | Subsistence, work capacity and demographic change: [SMI-03](smil.md#smi-03-surplus-and-specialization), [SCT-04](scott.md#sct-04-population-and-welfare). | More people create both capacity and demand; headcount is not a welfare score. |
| Food | Harvest, processing, reserves and edible surplus: [SMI-04](smil.md#smi-04-storage-and-edible-surplus), [SCT-05](scott.md#sct-05-grain-and-legibility). | Production rate, storage space and current stock solve different problems. |
| Water | Water access and crop constraints: [SMI-07](smil.md#smi-07-water-and-nutrients); [collection and storage techniques](water.md). | Access, transport, storage and treatment solve different problems; household supply, irrigation and drainage are distinct services. |
| Shelter | Material work and settlement: [SMI-01](smil.md#smi-01-useful-energy-and-conversion), [SCT-01](scott.md#sct-01-settlement-is-not-a-fixed-sequence). | A housing cap is a readable game abstraction, not a universal settlement equation. |
| Craft | Useful tools, processing and conversion chains: [SMI-05](smil.md#smi-05-processing-and-household-work), [SMI-08](smil.md#smi-08-craft-needs-materials-and-fuel). | An improvement should identify the task it changes. |
| Organization | Coordination, controls, records and power: [SMI-10](smil.md#smi-10-controls-and-knowledge), [SCT-06](scott.md#sct-06-administration-and-power). | Coordination can reduce wasted work; it does not make biological needs disappear. |
| Money (later) | Exchange across places and specialized activities: [SCT-09](scott.md#sct-09-trade-and-nonstate-neighbors). | Money is a claim on exchanged goods/services; trade can predate the node. |
| Time (later) | Work released by particular services: [SMI-05](smil.md#smi-05-processing-and-household-work), [SMI-13](smil.md#smi-13-services-and-welfare). | Available hours and accumulated investment effort are different quantities. |
| Education (later) | Skills, reproducible instructions and adoption: [SMI-10](smil.md#smi-10-controls-and-knowledge). | A later node can expand access or institutions; learning already exists. |
| Culture (later) | Values and creative achievements: [SMI-11](smil.md#smi-11-energy-constrains-without-determining-culture), [SCT-03](scott.md#sct-03-mixed-subsistence-and-knowledge). | Culture is not a single stage or a measure of human superiority. |
| Prestige | Reorganization and continuity: [SCT-08](scott.md#sct-08-collapse-and-survival). | Retention has a plausible analogy; the reset exchange and compounding rewards are invented. |

## Population and subsistence

Every person in the current opening can join an expedition or build; there is
no domestic labor reservation. Food and Water are consumed from reserves while
crews are away, so arrival timing and storage matter alongside average output.
This is a deliberately compressed allocation problem. The books do not supply
its upkeep, abundance-growth curve, housing cap or seconds per new person.

Keep two kinds of improvement distinct. Expanding fields or collection sites can
raise total capacity without reducing work per unit. Better tools or easier
access can reduce necessary work. The first can support more people; the second
can support more discretionary activity. Their combination is a meaningful
progression choice. [SMI-02](smil.md#smi-02-land-output-and-labor-output),
[SMI-03](smil.md#smi-03-surplus-and-specialization).

Scott adds a reason to preserve several objectives: demographic growth can
coexist with harder work and poor welfare. The game can reward population while
also valuing reliable supplies, recovery, time and learning. The current game
already includes shortage-driven Population losses, recovery and a one-survivor
floor. Those rules are design choices, not an inferred historical mortality model.
[SCT-04](scott.md#sct-04-population-and-welfare).

## Food water and reserves

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

## Early huts and materials

Plant's examples give the existing hut a plausible set of hidden tasks: collect
and prepare suitable poles, establish a frame, lash members and add a covering.
A dome uses flexible saplings and thatch; other frames, walls and roofs need
different materials. The game's labor-only project can abstract these tasks
without creating separate Wood, Fiber or Clay currencies.
[PLT-04](plant.md#plt-04-a-hut-is-a-bundle-of-tasks).

Wall and roof improvements should name the property they change. Mud needs
rain protection; a woven wall uses less bulk material but has a different
strength profile; fired-clay tiles require fuel and firing as well as clay.
These are candidate tradeoffs, not a mandatory thatch-to-tile ladder. Neither
Plant's small shelter examples nor Kelly's observations set the game's four
housing places, timber-frame bonus, one builder or build duration.
[PLT-05](plant.md#plt-05-walls-depend-on-weather-protection),
[PLT-06](plant.md#plt-06-roofing-has-its-own-materials-and-processes).

## Expedition returns and equipment

Keep the same accounting boundary when comparing Gather, Hunt and Fish:
include total food delivered, all committed people and the full cycle. A useful
game comparison is `delivered Food / (crew × cycle seconds)`, alongside stock
buffer and time until the next delivery. If fabrication is being compared too,
include its work and Craft cost over the chosen number of uses. This is a
design-analysis convention, not a conversion of the game's Food into calories.
[KEL-02](kelly.md#kel-02-compare-returns-with-the-same-accounting-boundary),
[KEL-06](kelly.md#kel-06-making-equipment-has-a-payback-period).

The present route projects already express different costs: farther gathering
raises time and yield; bigger game raises crew and yield; river traps spend
Craft for catch with the same crew. Kelly's conditional comparisons support
examining those distinctions, without supplying the actual coefficients or a
universal best route. A larger hunting haul can have a lower per-person return.
[KEL-04](kelly.md#kel-04-distance-and-what-gets-carried),
[KEL-07](kelly.md#kel-07-party-size-and-total-haul).

Plant's trap is a fabricated basket-and-funnel device that is placed, visited
and reused. This supports the trap's material identity, not a guaranteed catch
or worker-free Fish action. Baskets, cordage, traps and shelter lashings can
share craft knowledge while remaining separate investments. The current game
reserves each Food crew for its whole cycle; any distinction between tending
and unattended elapsed time would need an explicit rule change.
[PLT-03](plant.md#plt-03-basketry-and-cordage-connect-several-branches),
[PLT-07](plant.md#plt-07-traps-require-fabrication-and-visits).

## Food preparation and attention

Treat the opening's Food rewards as edible provisions that abstract gathering,
handling, carrying and preparation. Kelly describes processing after collection
and work shared across people; cooking may allow simultaneous tasks, while
other preparation demands attention. The source does not require a domestic
worker reservation, which the current design intentionally excludes.
[KEL-03](kelly.md#kel-03-processing-and-attention).

Plant's burn-bowl example and Kelly's processing discussion show why cooking
need not wait for ceramic pots. For a future Food improvement, choose the
specific bottleneck: fuel preparation, container capacity, edible load,
processing time or hands-on attention. Preparation and storage are different
benefits. Neither added source gives a complete regional edible-plant guide
or validates a historical preparation time for every food.
[PLT-09](plant.md#plt-09-cooking-can-precede-pottery),
[KEL-04](kelly.md#kel-04-distance-and-what-gets-carried).

## Technique lookup

| Candidate project | Materials or work to account for | Source |
| --- | --- | --- |
| Digging/woodworking tools | Suitable stone/wood, shaping and assembly; specific task benefits. | [PLT-02](plant.md#plt-02-tools-enable-other-work) |
| Food basket or carrying basket | Flexible fibers, weave choice and fabrication; capacity differs from trip yield. | [PLT-03](plant.md#plt-03-basketry-and-cordage-connect-several-branches) |
| Frame and thatch hut | Poles/saplings, lashings, covering and construction work. | [PLT-04](plant.md#plt-04-a-hut-is-a-bundle-of-tasks) |
| Mud or wattle wall | Suitable earth/fibers, drying and rain protection. | [PLT-05](plant.md#plt-05-walls-depend-on-weather-protection) |
| Improved roof | Material collection, supporting frame and possible firing inputs. | [PLT-06](plant.md#plt-06-roofing-has-its-own-materials-and-processes) |
| River trap | Basketry, fabrication and collection/tending distinct from catch. | [PLT-07](plant.md#plt-07-traps-require-fabrication-and-visits) |
| Cooking improvement | Container, fuel, attention and elapsed time. | [PLT-09](plant.md#plt-09-cooking-can-precede-pottery), [KEL-03](kelly.md#kel-03-processing-and-attention) |
| Pottery workshop | Preparation/drying, fuel, firing and cooling. | [PLT-10](plant.md#plt-10-firing-needs-a-supporting-process) |

These examples can inform proposals. Existing projects keep
their current prices and effects. New mechanics still need scoped design and
the [content balance workflow](../balance-testing.md#add-balance-coverage-with-content).

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
possible later investments costing more Craft, with firing work or Fire where
appropriate. They would require their own costs, effects and unlocks: no
automatic material tiers or universal historical
sequence is implemented. Keep the `water-storage` ID and owned count independent
of the displayed material so a later upgrade can improve existing storage.
Current purchases cost 1 Craft plus scaling work and add 40 storage; those
numbers are balancing decisions. See [Water rules](../civilization.md#water-hauling-jars-and-flow).

## Water technologies and costs

The [water research note](water.md#candidate-technologies) compares fourteen
options, including tightly woven containers, fired jars, cisterns, rain
catchments, timber-lined wells, bucket lifts and gravity channels. Its
[source notes](water.md#passage-and-source-notes) connect the material and
waterworks examples to book passages or primary institutional sources.

For proposed costs, use **Craft for fabrication**, **Organization for shared
construction and maintenance**, and **Fire for controlled heating**. A jar or clay
pipe can need heat during manufacture; boiling water needs heat again for each
batch. A well lift still needs an operator, while a suitable downhill supply can
release hauling labor. Storage needs filling and does not itself create income.
These distinctions can support different investments without adding every
material as a currency.

Fire is not an active resource in the current opening. The note proposes a
controlled-fire prerequisite with fuel/work included in fabrication as a compact
starting point; a spendable Fire stock is a separate possible design. Exact costs,
unlock order and any water-quality mechanics remain design work.

## Craft and shared work

The shared Craft bonus abstracts better working practices and equipment.
Education is a locked later branch in the current opening.
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

Organization's modeled upkeep effect can represent less waste in provisioning
and coordination. Culture remains a locked later branch. Neither label should
imply people can live on arbitrarily little food or water. If this
distinction later matters mechanically, separate baseline needs from avoidable
losses. The books do not calibrate a waste floor or justify an unlimited bonus.
[SMI-10](smil.md#smi-10-controls-and-knowledge).

Automatic building can mean reliable scheduling and retained instructions.
Neither greater coordination nor record keeping must be presented as the first
appearance of social cooperation. Scott's treatment of administration also
suggests asking who controls the surplus and bears the work if political
branches become part of the design.
[SCT-06](scott.md#sct-06-administration-and-power).

A future Money branch could represent exchange of output or specialized
services. The current opening does not generate Money. Such a future abstraction
would need an exchange context; allocating workers alone does not establish one.
Existing trade can precede a later Money node that expands exchange capacity or institutions.
[SCT-09](scott.md#sct-09-trade-and-nonstate-neighbors).

## Time education and culture

Time remains a locked later branch. If a future design accumulates it, the
balance could represent completed discretionary effort available for investment.
It should not imply that yesterday's unused hour can literally become tomorrow's
extra hour. Any alternative accounting model is a
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

Current Craft eligibility uses Population and Organization eligibility uses
housing. Both prestiges restart at five people and seeded supplies; one-time
upgrades persist while named buyables are retained by specific Organization
milestones. [The design](../civilization.md#prestige-and-later-resources) owns the
exact preview and reset rules. This is a repeatable game progression, not a
historical exchange formula or blanket preservation of people and buildings.

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

The current design applies Population losses after a shortage grace period,
keeps one survivor and allows rebuilding. Expedition duration, reserve buffers
and crew commitments therefore affect recovery. The books do not validate its
ten-second grace or accelerating loss coefficients. New weather, spoilage or
random-catch systems would be separate design changes, with recovery evidence.

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
Source claim ID, chapter/part, section and EPUB range or printed/PDF pages:
What the author actually argues and the conditions attached:
Game interpretation and simplifications:
Units, invented parameters and intended pacing:
Existing rule owner and focused balance scenario:
```

For example, cite `SMI-02` when separating a site's capacity upgrade from a
worker-efficiency upgrade. The historical argument explains why the distinction
is useful. The chosen costs, effects and active/five-minute play outcomes must
come from the game's design and its [balance workflow](../balance-testing.md#add-balance-coverage-with-content).
