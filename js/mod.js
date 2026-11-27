/** Civ content configuration. The original ptr key is deliberately untouched. */
function createModRules({ derivedState, effects, gameHelpers, saveState }) {
    const civilization = createCivilizationRules({saveState});
    const modInfo = {name: "Civ Prestige Tree", id: "civ-prestige-tree", author: "step3software",
        pointsName: "Population", initialStartPoints: new Decimal(5), offlineLimit: 1,
        changelogLink: "https://github.com/step3software/Prestige-Tree"};
    /** @type {{num:string,name:string,withoutName:string,withName:string,beta?:number,pre?:number,patch?:number}} */
    const VERSION = {num: "0.1", name: "The first settlement", withoutName: "v0.1", withName: "v0.1 - The first settlement"};
    const activeNotifications = effects.observe([]);
    return {modInfo, VERSION, civilization, activeNotifications,
        doNotCallTheseFunctionsEveryTick: [], alwaysKeepTheseVariables: [], displayThings: [],
        getStartPoints: () => new Decimal(5), canGenPoints: () => false,
        getPointGen: () => new Decimal(0), getRow1to6Speed: () => new Decimal(1),
        addedPlayerData: () => ({civ: civilization.defaults()}),
        validatePlayerData: civilization.validateData,
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
