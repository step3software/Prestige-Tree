/** Pause before loading the game. Installing at the pause target races the
 * clock's wall-time advance between the two awaited RPCs. Start on the preceding
 * day, then jump to the exact original fixture epoch while no game timers exist.
 * https://playwright.dev/docs/api/class-clock#clock-pause-at
 */
async function installPausedClock(page) {
  const epoch=1700000000000;
  await page.clock.install({time:new Date(epoch-86400000)});
  await page.clock.pauseAt(new Date(epoch));
}

module.exports={installPausedClock};
