# Civ resource design

Owner direction: a resource-centered tree with Population as the base resource; Food, Water and Shelter first; Craft and Organization next; Money and Time; later Education and Culture. The current request authorizes replacing the existing content. Spacefaring and time travel remain future content.

## Opening and growth

Start with 5 Population, 20 Food, 20 Water and housing for 8. Food and Water each start with supply capacity 8 per game minute. Each person needs 1 of each per minute before coordination/culture bonuses. Workers produce 3 Food or 3.2 Water per minute before tool/knowledge bonuses; a single shared labor budget covers supplies, construction, trade and free time.

Subsistence labor is allocated first. Construction uses 45% of the remaining labor (80% under Shelter priority). Remaining labor fills stores within site throughput. Money and Time divide the remaining discretionary labor after supplies and construction, so no worker is counted twice. Balanced, Food, Water and Shelter priorities are available without individual worker micromanagement.

A new person takes 12 supported game seconds. Growth requires housing for the next person, Food/Water throughput to sustain that person, sufficient worker productivity and a reserve of each supply equal to max(3, a quarter-minute of the next population's upkeep). Each addition updates upkeep and labor. Housing, supply throughput and reserve bottlenecks are displayed. One-second steps preserve these checks during offline simulation.

Food/Water stocks are consumed continuously and never negative. Shortages pause growth without killing people or penalizing the production needed to recover. Housing is persistent capacity and is not consumed. Growth pauses if housing is full or reduced below current Population.

## Construction and resource effects

Basic projects use labor only, including at zero stockpiles; one project runs at a time. Canceling clears its work progress without spending supplies. Site projects add 5 base Food/Water throughput; baskets/containers add 40 storage to the initial 50. Huts add 4 housing to the initial 8. Costs rise with existing infrastructure. Exact coefficients are owned in `js/civilization.js`, not duplicated in a second data schema.

Craft requires 8 Population and at least 25 Food and Water; its gain is floor(sqrt(min(stores)/25)). Each Craft adds 18% to worker productivity and throughput. Organization requires 8 Population, housing for 12 and at least 35 Food and Water; its gain is floor(sqrt(min(stores)/35)). Coordination increases construction speed and reduces upkeep. At 2 coordination, optional automatic construction chooses the limiting foundation branch.

Both prestige actions set Food and Water stores and next-person growth progress to zero. They retain Population, owned housing, every infrastructure improvement, active construction, sibling prestige and all other resources. The preview and confirmation say exactly this. Immediate repetition at zero stores grants nothing. No generic engine prestige that resets `player.points` is used for these content actions.

Both Craft and Organization unlock Money and Time. Remaining discretionary labor splits between trade (Money) and free hours (Time), after subsistence and other work. Total earnings of 5 Money and 3 free hours unlock Education and Culture. Education consumes Money/Time and adds Knowledge, each increasing tools/throughput by 12%. Culture consumes Time/Craft and adds influence, reducing upkeep. Unlocks persist after purchases; spending Craft cannot erase discovered branches.

## Persistence and product boundaries

Population is a Decimal count in the engine's base `points` slot, independent of housing. The resource named Time uses `freeTime` internally because `time` is the saved wall-clock timestamp. Civilization save identity is `civ-prestige-tree`; old `ptr` saves remain untouched and incompatible imports are rejected. There is no historical-resource emulation or guessed lossy migration.

The opening is a fictional abstraction, not a demographic or historical model. Numeric coefficients are initial tunable game values, not measured user pacing. The fresh-game synthetic scenario and verification record distinguish simulated progression from actual-player evidence. Irrigation, detailed demographics, combat, disasters, space and temporal mechanics are outside this slice.
