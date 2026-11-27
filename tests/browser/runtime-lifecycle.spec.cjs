const { installPausedClock } = require('../support/paused-clock.cjs');
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({page}) => {
  await installPausedClock(page);
  await page.route('**/*',route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  page.testErrors = [];
  page.on('pageerror',error => page.testErrors.push(error.message));
  page.on('console',message => {if (message.type() === 'error') page.testErrors.push(message.text());});
  await page.goto('/');
  await expect(page.locator('#p')).toBeVisible();
});
test.afterEach(async ({page}) => expect(page.testErrors).toEqual([]));

async function begin(page) {
  await page.locator('#p').click();
  await page.locator('button.p.reset').click();
  await page.getByRole('button',{name:/Begin/}).click();
  await expect(page.getByRole('button',{name:/Begin/})).toHaveClass(/bought/);
}
async function saveThroughOptions(page) {
  await page.locator('#optionWheel').click();
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Saved');
}

test('one real-page runtime survives repeated start/load, stops input/time, and resumes controlled offline seconds once',async ({page}) => {
  await begin(page);
  expect(await page.evaluate(() => gameUI.session.runtimeServices.startGameRuntime() && gameUI.session.runtimeServices.gameRuntime.start() && gameUI.session.runtimeServices.gameRuntime.state === 'running')).toBe(true);
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => gameUI.session.saveState.player.points.toNumber())).toBeCloseTo(1,10);
  await saveThroughOptions(page);
  await page.evaluate(() => { gameUI.session.saveCommands.load(); gameUI.session.saveCommands.load(); });
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => gameUI.session.saveState.player.points.toNumber())).toBeCloseTo(2,10);
  await page.evaluate(() => { gameUI.session.runtimeServices.gameRuntime.stop(); gameUI.session.runtimeServices.gameRuntime.stop(); });
  await page.clock.runFor(5000);
  expect(await page.evaluate(() => gameUI.session.saveState.player.points.toNumber())).toBeCloseTo(2,10);
  await page.evaluate(() => { gameUI.session.saveState.player.points = new Decimal(40); gameUI.session.derivedState.updateTemp(); });
  await page.keyboard.press('p');
  expect(await page.evaluate(() => gameUI.session.saveState.player.points.eq(40))).toBe(true);
  await page.evaluate(() => { gameUI.session.runtimeServices.gameRuntime.start(); gameUI.session.runtimeServices.gameRuntime.start(); });
  expect(await page.evaluate(() => gameUI.session.saveState.player.offTime.remain)).toBe(5);
  await page.clock.runFor(50);
  expect(await page.evaluate(() => gameUI.session.saveState.player.points.toNumber())).toBeCloseTo(40.55,10);
  expect(await page.evaluate(() => gameUI.session.saveState.player.offTime.remain)).toBe(4.5);
  await page.keyboard.press('p');
  expect(await page.evaluate(() => gameUI.session.saveState.player.points.eq(0) && gameUI.session.saveState.player.p.points.gte(2))).toBe(true);
  await page.screenshot({path:'test-results/sim01-runtime-running.png'});
});

test('real reload credits a capped offline return once and uses the existing progression and save path',async ({page}) => {
  await begin(page); await saveThroughOptions(page);
  await page.evaluate(() => gameUI.session.runtimeServices.gameRuntime.stop());
  await page.clock.setSystemTime(new Date(1700007200000));
  await page.reload(); await expect(page.locator('#p')).toBeVisible();
  expect(await page.evaluate(() => gameUI.session.saveState.player.offTime.remain)).toBe(3600);
  await page.clock.runFor(50);
  expect(await page.evaluate(() => gameUI.session.saveState.player.points.eq(360.05) && gameUI.session.saveState.player.offTime.remain === 3240)).toBe(true);
  const total = await page.evaluate(() => gameUI.session.saveState.player.points.toNumber() + gameUI.session.saveState.player.offTime.remain);
  await page.clock.runFor(50);
  expect(await page.evaluate(() => gameUI.session.saveState.player.points.toNumber() + gameUI.session.saveState.player.offTime.remain)).toBeCloseTo(total + 0.05,8);
});

for (const width of [1280,320]) {
  test(`runtime fault protects saved progress and keyboard reload recovers at ${width}px`,async ({page}) => {
    await page.setViewportSize({width,height:800});
    await begin(page); await saveThroughOptions(page);
    const original = await page.evaluate(() => localStorage.getItem('ptr'));
    page.once('dialog',dialog => dialog.accept());
    await page.evaluate(() => {
      gameUI.session.gameRules.gameLoop = () => {gameUI.session.saveState.player.points = new Decimal(999); throw new Error('Synthetic runtime fault');};
    });
    await page.clock.runFor(50);
    await expect(page.getByRole('status')).toContainText('Reload the page');
    expect(await page.evaluate(() => gameUI.session.runtimeServices.gameRuntime.state === 'error' && !gameUI.session.gameRules.ticking && gameUI.session.gameRules.tickFaulted)).toBe(true);
    await page.getByRole('button',{name:'Save',exact:true}).focus();
    await page.keyboard.press('Enter');
    await page.clock.runFor(5000);
    expect(await page.evaluate(() => localStorage.getItem('ptr'))).toBe(original);
    expect(await page.evaluate(() => gameUI.session.saveState.player.points.eq(999) && gameUI.session.runtimeServices.gameRuntime.start() === false)).toBe(true);
    const status = await page.getByRole('status').boundingBox();
    const app = await page.locator('#app').boundingBox();
    expect(status.width).toBeLessThanOrEqual(width);
    expect(status.y + status.height).toBeLessThanOrEqual(app.y + 1);
    await page.screenshot({path:`test-results/sim01-fault-${width}.png`});
    await page.reload(); await expect(page.locator('#p')).toBeVisible();
    expect(await page.evaluate(() => gameUI.session.saveState.player.points.eq(0) && gameUI.session.runtimeServices.gameRuntime.state === 'running' && !gameUI.session.gameRules.tickFaulted)).toBe(true);
    await page.clock.runFor(1000);
    expect(await page.evaluate(() => gameUI.session.saveState.player.points.gt(0))).toBe(true);
  });
}
