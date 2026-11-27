# Smil source notes

Vaclav Smil's *Energy and Civilization: A History* explains how energy sources,
conversion devices and the systems controlling them shaped material possibilities.
Its strongest use here is to distinguish what a technology enables from the
social choices people make with it.

The supplied copy is copyright 2017, MIT Press, EPUB Version 1.0. Its copyright
page gives eISBN `9780262338295` and hardcover ISBN `9780262035774`; the package
metadata also lists other format identifiers. [Publisher information](https://mitpress.mit.edu/9780262536165/energy-and-civilization/).

- Local EPUB: `C:\Users\PhillipCurry\projects\books\books\Vaclav Smil - Energy and Civilization\Vaclav Smil - Energy and Civilization.epub`
- Repository EPUB: [Energy and Civilization at the verified library revision](https://github.com/step3software/books/blob/8893e4e75744f12fd3f52cc1b9f5347a11e97453/books/Vaclav%20Smil%20-%20Energy%20and%20Civilization/Vaclav%20Smil%20-%20Energy%20and%20Civilization.epub). The published blob matches the local copy.
- Project copy of these notes: [documentation branch](https://github.com/step3software/Prestige-Tree/blob/docs/civ-research-20261127/docs/research/smil.md).
- Source identity and every chapter heading: [sources.json](sources.json).

## Chapter map

| Chapter | Main subjects | Game design use |
| --- | --- | --- |
| 1. Energy and Society | Flows, stores, controls, energy/power measures, efficiency, energy returns and caveats. | Separate stock, throughput, useful work and the costs of conversion. |
| 2. Energy in Prehistory | Foraging, fire, food acquisition, agricultural origins and pastoralism. | Give the starting community techniques and ecological knowledge; allow mixed subsistence. |
| 3. Traditional Farming | Field and processing work, grains, cropping cycles, draft animals, irrigation, nutrients, regional systems and limits. | Build early production around labor, land, water, seed, storage and complementary improvements. |
| 4. Preindustrial Prime Movers and Fuels | Human/animal work, water and wind power, biomass, household work, transport, construction, metals and warfare. | Offer distinct kinds of Craft and infrastructure with operating costs and location constraints. |
| 5. Fossil Fuels, Primary Electricity, and Renewables | Coal, coke, steam, oil, engines, electricity, renewables and technical diffusion. | Treat later transitions as combinations of fuels, machines and networks. |
| 6. Fossil-Fueled Civilization | Food, industry, mobility, information, economic growth, urbanization, welfare, politics and environmental consequences. | Distinguish total production from access to useful services and their costs. |
| 7. Energy in World History | Long transitions, costs, persistent inequalities, controls and limits of energy explanations. | Avoid a deterministic ladder or a single numerical measure of civilization. |

The addenda contain units, a chronology and power comparisons. Bibliographical
notes, references, and name/subject indexes provide further leads. These are
indexed in the manifest; their data and cited studies need checking before use
as quantitative design inputs.

## SMI-01 Useful energy and conversion

**Source:** chapter 1, “Flows, Stores, and Controls,” paragraphs 22-29;
“Concepts and Measures,” paragraph 31; “Complexities and Caveats,” paragraphs
65 and 74. File `OPS/c10752_001.xhtml`.

Smil distinguishes energy resources from the conversions needed to obtain
useful services. Tools, fuels and prime movers have different capabilities.
Energy conservation does not imply that used energy remains available for
further work. Equal energy totals can conceal differences in quality and use.

**Game interpretation:** keep food stocks, water access, work capacity and
storage distinct. A fuel stock should not produce useful work without a device,
and a tool should not eliminate its required input. Use explicit game units;
calling every resource “energy” would erase important constraints.

## SMI-02 Land output and labor output

**Source:** chapter 3, opening paragraphs 2-4 and “Limits,” paragraphs 266-281.
File `OPS/c10752_003.xhtml`.

Intensification can feed more people from the same area while increasing work
or reducing returns per unit of labor. Smil also rejects explanations of
agricultural differences based simply on supposedly industrious or lazy peoples.
Ecology, institutions, access to inputs and technique matter.

**Game interpretation:** distinguish expanding a food site's capacity from
making each worker more productive. A capacity upgrade need not create free
time. A single multiplier for every kind of agricultural advance would hide
this distinction. Do not assign innate productivity rankings to cultures.

## SMI-03 Surplus and specialization

**Source:** chapter 3, paragraphs 12 and 14; “Routes to Intensification,”
paragraphs 59-61. File `OPS/c10752_003.xhtml`.

Agricultural improvements supported people working outside food production.
Animal power, water/nutrient management and crop diversity reinforced each
other, with effects on both the amount and quality of work.

**Game interpretation:** require subsistence work before allocating people to
construction or other activities. Let an improvement release workers only when
it actually reduces essential work. Surplus can support several player choices;
it does not by itself establish that everyone gets more leisure.

## SMI-04 Storage and edible surplus

**Source:** chapter 3, opening paragraph 3 and paragraph 49 under “The Dominance
of Grains.” File `OPS/c10752_003.xhtml`.

Dry grains have useful storage characteristics, but harvested output is not
identical to edible surplus. Seed requirements and losses to moisture, fungi,
insects and rodents matter. Smil's examples vary with technique and setting.

**Game interpretation:** distinguish production, reserve capacity and the
buffer available after upkeep. Better containers or granaries can improve
resilience without raising harvests. Do not import one historical loss rate as
a universal decay constant.

## SMI-05 Processing and household work

**Source:** chapter 3, paragraph 28; chapter 4, “Household Needs” and “Food
Preparation,” paragraphs 158 and 163; chapter 6, “Quality of Life,” paragraphs
216-221. Files `OPS/c10752_003.xhtml`, `OPS/c10752_004.xhtml`,
`OPS/c10752_006.xhtml`.

Obtaining a crop is only part of feeding a community. Threshing, milling,
cooking, carrying water and other household work consume labor. Smil uses rural
electrification to show how changing particular services could reduce arduous
household tasks even where fuel was already available.

**Game interpretation:** if household work is abstracted into upkeep, say so.
Mills, water access and cooking improvements are credible ways to release
working hours. Counting only field labor would overstate early free time.

## SMI-06 Prime movers have running costs

**Source:** chapter 3, “Draft Animals,” paragraph 94, and “Limits,” paragraphs
261 and 281; chapter 4, “Animate Power,” paragraphs 20 and 69.
Files `OPS/c10752_003.xhtml`, `OPS/c10752_004.xhtml`.

Working animals increased available power but required feed, care, harnesses
and other support. Their useful contribution depended on the task and local
conditions. Concentrating many workers also did not make individual bodies
unlimited sources of sustained power.

**Game interpretation:** later labor-saving upgrades can exchange one constraint
for another. Animal power could reduce human work while reserving feed capacity;
water power could depend on a suitable site. This is a candidate mechanic,
not an instruction to add livestock or maintenance to the current scope.

## SMI-07 Water and nutrients

**Source:** chapter 3, “Irrigation,” paragraphs 96 and 116; “Fertilization,”
paragraph 118; “Crop Diversity,” paragraphs 132 and 135.
File `OPS/c10752_003.xhtml`.

Water and nutrients constrain crops differently. Too much water can require
drainage; more irrigation is not always the answer. Rotations and diverse crops
also affect fertility and resilience.

**Game interpretation:** Water is a credible independent constraint. Specify
whether a project improves drinking-water collection, crop irrigation or
drainage; those services are not interchangeable. A simplified early Water
resource can stand for reliable supply, without implying that all settlements
require irrigation canals.

## SMI-08 Craft needs materials and fuel

**Source:** chapter 4, “Biomass Fuels,” paragraph 128, “Metallurgy,” paragraphs
302-308, and “Iron and Steel,” paragraphs 316-321.
File `OPS/c10752_004.xhtml`.

Material processing linked labor, ore, fuel, furnace design, airflow and
working techniques. The spread of metal technologies was gradual and differed
among regions. More refined materials depended on supporting processes.

**Game interpretation:** reserve a simple Craft currency for the present
abstraction. Later branches could name distinct capabilities such as containers,
woodworking, milling and metalworking. A metalworking unlock needs a credible
conversion chain, not only a higher population threshold.

## SMI-09 Transitions and complementary systems

**Source:** chapter 5, “The Great Transition,” paragraphs 13 and 17, “From
Charcoal to Coke,” paragraphs 37-40, and “Steam Engines,” paragraphs 42 and 81;
chapter 7, paragraphs 5 and 12. Files `OPS/c10752_005.xhtml`,
`OPS/c10752_007.xhtml`.

Fuel sources, machines and their uses changed together. Older technologies
persisted, and countries followed different sequences. Discovery was not
equivalent to widespread, economical adoption.

**Game interpretation:** distinguish knowledge, a working installation and
deployment across the settlement. An unlock need not instantly replace every
existing process. The player can keep old infrastructure while investing in
new capabilities; a compulsory reset is not supplied by this history.

## SMI-10 Controls and knowledge

**Source:** chapter 1, paragraphs 28-29; chapter 7, “The Importance of Controls,”
paragraphs 139-146. Files `OPS/c10752_001.xhtml`, `OPS/c10752_007.xhtml`.

Useful energy depended on ways to harness and control it, including mechanical
devices, feedback, reproducible instructions and managerial arrangements.
Education, capital and institutions helped make new capabilities usable.

**Game interpretation:** Education and Organization can improve specific
processes, planning and adoption. Explain each effect as reduced waste, better
coordination or improved technique. Coordination does not reduce a person's
biological need for food or water without a separately defined abstraction.

## SMI-11 Energy constrains without determining culture

**Source:** chapter 1, paragraph 74; chapter 7, “Between Determinism and Choice,”
paragraph 112, and “The Limits of Energy Explanations,” paragraphs 158-164.
File `OPS/c10752_007.xhtml` for the latter passages.

Smil explicitly rejects reducing cultural and intellectual achievement to
energy consumption. Material possibilities constrain action without dictating
which arts, values or institutions people create.

**Game interpretation:** Culture should express choices or achievements rather
than serve as a civilization ranking. A later Culture node can mean increased
collective investment, not the first appearance of culture. Treat its numerical
bonuses as authored game rules.

## SMI-12 Efficiency and rebound

**Source:** chapter 1, Box 1.6, paragraphs 51-53, and Box 1.7, paragraphs 54-57.
File `OPS/c10752_001.xhtml`.

Improved efficiency need not reduce total resource use when activity expands.
Smil also warns that energy-return comparisons can be misleading when the
inputs and accounting boundaries differ.

**Game interpretation:** show both output per worker and total demand after
growth. When comparing two upgrades, hold the starting population, inputs,
work allocation and time horizon explicit. Rebound is a possible outcome,
not a rule that every efficiency gain must increase consumption.

## SMI-13 Services and welfare

**Source:** chapter 6, “Quality of Life,” paragraphs 204, 211-217.
File `OPS/c10752_006.xhtml`.

Aggregate energy consumption does not reveal its distribution, conversion
efficiency or the services people receive. Smil discusses quality of life more
broadly than the amount of fuel or goods available.

**Game interpretation:** population, wealth and production can be useful
progression measures without being a complete welfare score. Free time,
reliable essentials and access to learning can provide distinct objectives.
Do not turn the edition's historical national comparisons into current targets.

## Citation example

`SMI-03; Smil 2017, ch. 3, “Routes to Intensification,” ¶59-61,
OPS/c10752_003.xhtml; supplied EPUB SHA-256 in sources.json.`

Open it with `py -3 -B docs/research/read_sources.py read smil 3 --paragraphs 59:61`.
The paragraph numbers are extraction ordinals, not print page numbers.
