// Session-bound modRules owner; composition supplies only the named ports.
function createModRules({ derivedState, gameHelpers, saveState }) {
let modInfo = {
	name: "Prestige Tree Rewritten",
	id: "ptr",
	author: "Jacorb",
	pointsName: "points",
	discordName: "PT Rewritten Server",
	discordLink: "https://discord.gg/TFCHJJT",
	changelogLink: "https://github.com/Jacorb90/Prestige-Tree/blob/master/changelog.md",
    offlineLimit: 1,  // In hours
    initialStartPoints: new Decimal(10), // Used for hard resets and new players
	endgame: new Decimal("e3.14e16"),
	// specialEndgameText: "v1.3 Endgame: e3.14e16 Points",
}

// Set your version in num and name
let VERSION = {
	num: "1.3",
	patch: 1,
	name: "The Expansion Update",
}

// If you add new functions anywhere inside of a layer, and those functions have an effect when called, add them here.
// (The ones here are examples, all official functions are already taken care of)
let doNotCallTheseFunctionsEveryTick = ["doReset", "buy", "buyMax", "onPurchase", "blowUpEverything", "castAllSpells", "completeInBulk", "startMastery", "completeMastery"]

let alwaysKeepTheseVariables = ["primeMiles", "auto", "autoExt", "autoBld", "autoW", "autoGhost", "autoSE", "autoNN", "keepPosNeg", "distrAll", "spellInput", "pseudoUpgs", "maxToggle"]

function getStartPoints(){
    return new Decimal(modInfo.initialStartPoints)
}

// Determines if it should show points/sec
function canGenPoints(){
	return gameHelpers.hasUpgrade("p", 11);
}

// Calculate points/sec!
function getPointGen() {
	if(!modRules.canGenPoints())
		return new Decimal(0)

	let gain = new Decimal(1)
	if (gameHelpers.hasUpgrade("p", 12)) gain = gain.times(gameHelpers.upgradeEffect("p", 12));
	if (gameHelpers.hasUpgrade("p", 13)) gain = gain.times(gameHelpers.upgradeEffect("p", 13));
	if (gameHelpers.hasUpgrade("p", 22)) gain = gain.times(gameHelpers.upgradeEffect("p", 22));
	if (gameHelpers.hasUpgrade("b", 14) && saveState.player.i.buyables[12].gte(1)) gain = gain.times(gameHelpers.upgradeEffect("b", 11))
	if (((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("e"):false) && gameHelpers.hasUpgrade("e", 12)) gain = gain.times(gameHelpers.upgradeEffect("e", 12))
	if (gameHelpers.hasAchievement("a", 21)) gain = gain.times(1.1);
	if (gameHelpers.hasAchievement("a", 31)) gain = gain.times(1.5);
	if (gameHelpers.inChallenge("h", 22)) return gain.times(saveState.player.s.unlocked?gameHelpers.buyableEffect("s", 11):1).root(gameHelpers.inChallenge("h", 31)?derivedState.tmp.h.pointRoot31:1);
	
	if (saveState.player.b.unlocked) gain = gain.times(derivedState.tmp.b.effect);
	if (saveState.player.g.unlocked) gain = gain.times(derivedState.tmp.g.powerEff);
	if (saveState.player.t.unlocked) gain = gain.times(derivedState.tmp.t.enEff);
	if (saveState.player.s.unlocked) gain = gain.times(gameHelpers.buyableEffect("s", 11));
	if (saveState.player.h.unlocked) gain = gain.times(derivedState.tmp.h.effect);
	if (saveState.player.q.unlocked) gain = gain.times(derivedState.tmp.q.enEff);
	
	if (gameHelpers.inChallenge("h", 31)) gain = gain.root(derivedState.tmp.h.pointRoot31);
	if (gameHelpers.hasUpgrade("ss", 43)) gain = gain.pow(gain.lt(derivedState.tmp.ss.upgrades[43].endpoint)?1.1:1.01);
	if (gameHelpers.hasUpgrade("hn", 31)) gain = gain.pow(1.05);
	return gain
}

function getRow1to6Speed() {
	let speed = new Decimal(1);
	if ((Array.isArray(derivedState.tmp.ma.mastered))?derivedState.tmp.ma.mastered.includes("t"):false) speed = speed.times(derivedState.tmp.t.effect2)
	return speed;
}

// You can add non-layer related variables that should to into "player" and be saved here, along with default values
function addedPlayerData() { return {
}}

// Display extra things at the top of the page
let displayThings = [
]

// Determines when the game "ends"
function isEndgame() {
	if (modInfo.endgame.eq(1/0)) return false;
	else return saveState.player.points.gte(modInfo.endgame)
}



// Less important things beyond this point!

// You can change this if you have things that can be messed up by long tick lengths
function maxTickLength() {
	return(3600000) // Default is 1 hour which is just arbitrarily large
}

// Variables that must be defined to display notifications
let activeNotifications = [];
let notificationID = 0;

// Function to show notifications
function addNotification(type="none",text="This is a test notification.",title="",timer=3) {
	let notificationMessage, notificationTimer, notificationTitle, notificationType;
	switch(type) {
		case "achievement":
			notificationTitle = "Achievement Unlocked!";
			notificationType = "achievement-notification"
			break;
		case "milestone":
			notificationTitle = "Milestone Gotten!";
			notificationType = "milestone-notification"
			break;
		case "challenge":
			notificationTitle = "Challenge Complete";
			notificationType = "challenge-notification"
			break;
		default:
			notificationTitle = "Something Happened?";
			notificationType = "default-notification"
			break;
	}
	if(title != "") notificationTitle = title;
	notificationMessage = text;
	notificationTimer = timer; 

	activeNotifications.push({"time":notificationTimer,"type":notificationType,"title":notificationTitle,"message":(notificationMessage+"\n"),"id":notificationID})
	notificationID++;
}


//Function to reduce time on active notifications
function adjustNotificationTime(diff) {
	let notification;
	for(notification in activeNotifications) {
		activeNotifications[notification].time -= diff;
		if(activeNotifications[notification]["time"] < 0) {
			activeNotifications.splice(notification,1); // Remove notification when time hits 0
		}
	}
}

const modRules = {
 get modInfo() { return modInfo; },
 get VERSION() { return VERSION; },
 get doNotCallTheseFunctionsEveryTick() { return doNotCallTheseFunctionsEveryTick; },
 get alwaysKeepTheseVariables() { return alwaysKeepTheseVariables; },
 getStartPoints,
 canGenPoints,
 getPointGen,
 getRow1to6Speed,
 addedPlayerData,
 get displayThings() { return displayThings; },
 isEndgame,
 maxTickLength,
 get activeNotifications() { return activeNotifications; },
 get notificationID() { return notificationID; },
 addNotification,
 adjustNotificationTime,
};
return modRules;
}
