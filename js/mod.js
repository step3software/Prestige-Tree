/** Civ content configuration. The original ptr key is deliberately untouched. */
function createModRules({ derivedState, effects, gameHelpers, saveState }) {
    const civilization = createCivilizationRules({saveState});
    const modInfo = {name: "Civ Prestige Tree", id: "civ-prestige-tree", author: "step3software",
        pointsName: "Population", initialStartPoints: new Decimal(civilization.startingSettlement.population), offlineLimit: 1,
        changelogLink: "https://github.com/step3software/Prestige-Tree"};
    /** @type {{num:string,name:string,withoutName:string,withName:string,beta?:number,pre?:number,patch?:number}} */
    const VERSION = {num: "0.92", name: "Repeatable equipment", withoutName: "v0.9.2", withName: "v0.9.2 - Repeatable equipment"};
    const activeNotifications = effects.observe([]);
    return {modInfo, VERSION, civilization, activeNotifications,
        doNotCallTheseFunctionsEveryTick: [], alwaysKeepTheseVariables: [], displayThings: [],
        getStartPoints: () => new Decimal(civilization.startingSettlement.population), canGenPoints: () => false,
        getPointGen: () => new Decimal(0), getRow1to6Speed: () => new Decimal(1),
        addedPlayerData: () => ({civ: civilization.defaults()}),
        validatePlayerData: civilization.validateData,
        migratePlayerData: civilization.migrateData,
        isEndgame: () => false, maxTickLength: () => 3600,
        addNotification(type, message, title) { activeNotifications.push({type, message, title, time: 3}); },
        adjustNotificationTime(diff) {
            for (const notice of activeNotifications) notice.time -= diff;
            for (let index = activeNotifications.length - 1; index >= 0; index--) {
                if (activeNotifications[index].time <= 0) activeNotifications.splice(index, 1);
            }
        },
    };
}
