const { test, expect } = require('@playwright/test');
const fixture = require('../fixtures/representative-save.json');

test.beforeEach(async ({ page }) => {
  // Browser clock advances are explicit; progression never waits for wall-clock time.
  await page.clock.install({ time: new Date(1700000000000) });
  await page.clock.pauseAt(new Date(1700000000000));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.testErrors = errors;
  await page.goto('/');
  await expect(page.locator('#p')).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(page.testErrors).toEqual([]);
});

async function openOptions(page) {
  await page.locator('#options-tab').click();
  await expect(page.getByRole('button', {name: 'Import', exact: true})).toBeVisible();
}

async function importThroughControl(page, data) {
  page.once('dialog', dialog => dialog.accept(btoa(JSON.stringify(data))));
  await page.getByRole('button', {name: 'Import', exact: true}).click();
  await expect(page.locator('#p')).toBeVisible();
}

test('rendered prestige, upgrade, progression, save and reload retain earned progress', async ({ page }) => {
  await page.locator('#p').click();
  await page.locator('button.p.reset').click();
  await expect(page.getByRole('button', {name: /Begin/})).toBeVisible();
  await page.getByRole('button', {name: /Begin/}).click();
  await expect(page.getByRole('button', {name: /Begin/})).toHaveClass(/bought/);
  await page.clock.runFor(1000);
  await expect(page.locator('#app')).toContainText('You have');
  const earned = await page.evaluate(() => player.points.toNumber());
  expect(earned).toBeGreaterThan(0);
  await openOptions(page);
  await page.getByRole('button', {name: 'Save', exact: true}).click();
  const stored = await page.evaluate(() => JSON.parse(atob(localStorage.getItem('ptr'))));
  expect(stored[stored.set].p.upgrades).toContain(11);
  await page.reload();
  await expect(page.locator('#p')).toBeVisible();
  expect(await page.evaluate(() => player.points.toNumber())).toBeGreaterThanOrEqual(earned);
  await page.locator('#p').click();
  await expect(page.getByRole('button', {name: /Begin/})).toHaveClass(/bought/);
});

test('valid import retains representative progress and survives a real reload', async ({ page }) => {
  await openOptions(page);
  await importThroughControl(page, fixture);
  await page.reload();
  await expect(page.locator('#p')).toBeVisible();
  await page.locator('#p').click();
  await expect(page.getByRole('button', {name: /Begin/})).toHaveClass(/bought/);
  expect(await page.evaluate(() => player.points.eq('ee1000'))).toBe(true);
  const stored = await page.evaluate(() => JSON.parse(atob(localStorage.getItem('ptr'))));
  expect(stored[stored.set].b.milestones).toContain(0);
});

for (const width of [1280, 320]) {
  test(`rejected import preserves progress and shows dismissible recovery at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await openOptions(page);
    await page.getByRole('button', {name: 'Save', exact: true}).click();
    const before = await page.evaluate(() => localStorage.getItem('ptr'));
    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push({type: dialog.type(), text: dialog.message()});
      if (dialog.type() === 'prompt') await dialog.accept(btoa('{"versionType":"ptr","p":null}'));
      else await dialog.accept(); // Native alert supports Enter/Escape and retains the page context.
    });
    await page.getByRole('button', {name: 'Import', exact: true}).focus();
    await page.keyboard.press('Enter');
    expect(dialogs.map(dialog => dialog.type)).toEqual(['prompt', 'alert']);
    expect(dialogs[1].text).toMatch(/unchanged|preserved/i);
    expect(await page.evaluate(() => localStorage.getItem('ptr'))).toBe(before);
    await expect(page.getByRole('button', {name: 'Import', exact: true})).toBeVisible();
    await page.clock.runFor(5000);
    expect(await page.evaluate(() => player.points.eq(10) && player.p !== null)).toBe(true);
    await page.reload();
    await expect(page.locator('#p')).toBeVisible();
  });
}

test('cancelling New Save and Rename through the rendered menu retains selection and progress', async ({ page }) => {
  await openOptions(page);
  await page.getByRole('button', {name: 'Save', exact: true}).click();
  await page.getByRole('button', {name: 'All Save Files', exact: true}).click();
  const before = await page.evaluate(() => localStorage.getItem('ptr'));
  page.on('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', {name: 'New Save', exact: true}).click();
  await page.getByRole('button', {name: 'Rename', exact: true}).click();
  expect(await page.evaluate(() => localStorage.getItem('ptr'))).toBe(before);
  await expect(page.locator('.activeSave')).toHaveText('save1');
  await page.reload();
  await expect(page.locator('#p')).toBeVisible();
  expect(await page.evaluate(() => allSaves.set)).toBe('save1');
});
