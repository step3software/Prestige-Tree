const { test, expect } = require('@playwright/test');
const fixture = require('../fixtures/representative-save.json');

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date(1700000000000) });
  await page.clock.pauseAt(new Date(1700000000000));
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  page.testErrors = [];
  page.on('pageerror', error => page.testErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') page.testErrors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('#p')).toBeVisible();
});

test.afterEach(async ({ page }) => { expect(page.testErrors).toEqual([]); });

async function options(page) {
  if (!await page.getByRole('button', {name:'Import',exact:true}).isVisible()) await page.locator('#optionWheel').click();
  await expect(page.getByRole('button', {name:'Import',exact:true})).toBeVisible();
}
async function importSave(page, data) {
  page.once('dialog', dialog => dialog.accept(btoa(JSON.stringify(data))));
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', {name:'Import',exact:true}).click()]);
  await expect(page.locator('#p')).toBeVisible();
}
async function menu(page) {
  await options(page);
  await page.getByRole('button', {name:'All Save Files',exact:true}).click();
  await expect(page.getByRole('button', {name:'New Save',exact:true})).toBeVisible();
}
async function failWrites(page, denied) {
  await page.evaluate(denied => {
    if (!window.actualStorageWrite) window.actualStorageWrite = Storage.prototype.setItem;
    Storage.prototype.setItem = denied ? function() { throw new DOMException('Synthetic storage quota failure', 'QuotaExceededError'); } : window.actualStorageWrite;
  }, denied);
}

for (const width of [1280, 320]) {
  test(`save and import failure retain valid progress, show truthful live feedback and retry at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({width,height:800});
    await options(page);
    await importSave(page, fixture);
    await options(page);
    const before = await page.evaluate(() => localStorage.getItem('ptr'));
    await page.evaluate(() => { player.points = new Decimal('ee1001'); });
    await failWrites(page, true);
    await page.getByRole('button', {name:'Save',exact:true}).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toContainText('unsaved');
    await expect(page.getByRole('status')).toBeVisible();
    const positions = await page.evaluate(() => ({status:document.getElementById('save-status').getBoundingClientRect().bottom, options:document.querySelector('.col.right').getBoundingClientRect().top}));
    expect(positions.options).toBeGreaterThanOrEqual(positions.status);
    await page.screenshot({path:testInfo.outputPath('unsaved-status.png')});
    await expect(page.getByRole('status')).toHaveAttribute('aria-live','polite');
    expect(await page.evaluate(() => localStorage.getItem('ptr'))).toBe(before);
    expect(await page.evaluate(() => player.points.eq('ee1001'))).toBe(true);
    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.type());
      if (dialog.type() === 'prompt') await dialog.accept(btoa(JSON.stringify({points:'123',versionType:'ptr'})));
      else await dialog.accept();
    });
    await page.getByRole('button', {name:'Import',exact:true}).click();
    expect(dialogs).toEqual(['prompt','alert']);
    expect(await page.evaluate(() => localStorage.getItem('ptr'))).toBe(before);
    expect(await page.evaluate(() => player.points.eq('ee1001') && allSaves[allSaves.set] === player)).toBe(true);
    await expect(page.getByRole('button', {name:'Import',exact:true})).toBeVisible();
    await failWrites(page, false);
    await page.getByRole('button', {name:'Save',exact:true}).click();
    await expect(page.getByRole('status')).toHaveText('Saved in this browser.');
    await page.reload();
    await expect(page.locator('#p')).toBeVisible();
    expect(await page.evaluate(() => player.points.eq('ee1001'))).toBe(true);
  });
}

test('rendered save menu creates, renames, selects and deletes without stale collection bindings', async ({ page }) => {
  await options(page);
  await importSave(page, {points:'123',p:{unlocked:true,upgrades:[11]}});
  await menu(page);
  page.once('dialog', dialog => dialog.accept('second'));
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', {name:'New Save',exact:true}).click()]);
  await expect(page.locator('#p')).toBeVisible();
  await menu(page);
  page.once('dialog', dialog => dialog.accept('renamed'));
  const second = page.locator('.upgRow').filter({has:page.locator('.activeSave')});
  await second.getByRole('button', {name:'Rename',exact:true}).click();
  await expect(page.locator('.activeSave')).toHaveText('renamed');
  expect(await page.evaluate(() => app.allSaves === allSaves && app.player === player)).toBe(true);
  const original = page.locator('.upgRow').filter({has:page.locator('.widthLock', {hasText:/^save1$/})});
  await Promise.all([page.waitForEvent('load'), original.getByRole('button', {name:'Load',exact:true}).click()]);
  await expect(page.locator('#p')).toBeVisible();
  expect(await page.evaluate(() => player.points.eq(123) && hasUpgrade('p',11))).toBe(true);
  await menu(page);
  const inactive = page.locator('.upgRow').filter({has:page.locator('.widthLock', {hasText:/^renamed$/})});
  await failWrites(page, true);
  page.once('dialog', dialog => dialog.accept());
  await inactive.getByRole('button', {name:'Delete',exact:true}).click();
  await expect(inactive).toBeVisible();
  await expect(page.getByRole('status')).toContainText('unchanged');
  await failWrites(page, false);
  page.once('dialog', dialog => dialog.accept());
  await inactive.getByRole('button', {name:'Delete',exact:true}).click();
  await expect(inactive).toHaveCount(0);
  await expect(page.locator('.activeSave')).toHaveText('save1');
  await page.reload();
  await expect(page.locator('#p')).toBeVisible();
  expect(await page.evaluate(() => Object.keys(allSaves).join(',') === 'set,save1' && player.points.eq(123))).toBe(true);
});

test('export control produces a validated import round trip and repeated imports retain a sibling', async ({ page }) => {
  await options(page);
  await importSave(page, fixture);
  await page.evaluate(() => { allSaves.sibling = getStartPlayer(); allSaves.sibling.points = new Decimal('1e500'); save(); });
  await options(page);
  // Capture only the browser clipboard I/O adapter; the real export command,
  // DOM textarea selection and encoded payload are exercised by the control.
  await page.evaluate(() => {
    document.execCommand = command => {
      if (command !== 'copy') return false;
      window.exportedSave = document.querySelector('textarea:not(#save-original)').value;
      return true;
    };
  });
  await page.getByRole('button', {name:'Export to clipboard',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('Save copied to clipboard.');
  const exported = await page.evaluate(() => window.exportedSave);
  expect(JSON.parse(atob(exported)).points).toBe('ee1000');
  for (let count=0; count<2; count++) {
    page.once('dialog', dialog => dialog.accept(exported));
    await Promise.all([page.waitForEvent('load'), page.getByRole('button', {name:'Import',exact:true}).click()]);
    await expect(page.locator('#p')).toBeVisible();
    expect(await page.evaluate(() => player.points.eq('ee1000') && allSaves.sibling.points.eq('1e500'))).toBe(true);
    await options(page);
  }
});

test('unsupported startup exposes the original, blocks replacement autosaves and supports confirmed recovery import', async ({ page }, testInfo) => {
  await page.setViewportSize({width:320,height:800});
  const original = btoa(JSON.stringify({points:'123',version:'99'}));
  await page.evaluate(raw => localStorage.setItem('ptr',raw), original);
  await page.reload();
  await expect(page.getByRole('heading', {name:'Recover your saved progress'})).toBeVisible();
  await expect(page.getByLabel('Original saved data')).toHaveValue(original);
  await expect(page.getByRole('status')).toContainText('Original browser data is unchanged');
  await page.screenshot({path:testInfo.outputPath('startup-recovery.png')});
  await page.clock.runFor(5000);
  expect(await page.evaluate(() => localStorage.getItem('ptr'))).toBe(original);
  expect(await page.evaluate(() => player === undefined)).toBe(true);
  await page.getByRole('button', {name:'Retry loading',exact:true}).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Original saved data')).toHaveValue(original);
  const denied = async dialog => dialog.type() === 'prompt' ? dialog.accept(btoa(JSON.stringify({points:'456'}))) : dialog.dismiss();
  page.on('dialog',denied);
  await page.getByRole('button', {name:'Import recovery save',exact:true}).click();
  expect(await page.evaluate(() => localStorage.getItem('ptr'))).toBe(original);
  page.off('dialog',denied);
  page.on('dialog',dialog => dialog.type() === 'prompt' ? dialog.accept(btoa(JSON.stringify({points:'456'}))) : dialog.accept());
  await page.getByRole('button', {name:'Import recovery save',exact:true}).click();
  await expect(page.locator('#p')).toBeVisible();
  await expect(page.locator('#save-recovery')).toBeHidden();
  expect(await page.evaluate(() => player.points.eq(456))).toBe(true);
});

test('interrupted historical conversion shows original and succeeds after storage is restored', async ({ page }) => {
  const original = btoa(JSON.stringify({points:'1e1000',version:1.2,versionType:'ptr',ge:{clickables:{11:''}}}));
  await page.evaluate(raw => localStorage.setItem('ptr',raw),original);
  await page.addInitScript(() => {
    const actual = Storage.prototype.setItem;
    Storage.prototype.setItem = function() {
      if (!window.allowRecoveryWrite) throw new DOMException('Synthetic denial','SecurityError');
      return actual.apply(this,arguments);
    };
  });
  await page.reload();
  await expect(page.getByLabel('Original saved data')).toHaveValue(original);
  await expect(page.getByRole('status')).toContainText('full or blocked');
  expect(await page.evaluate(() => localStorage.getItem('ptr'))).toBe(original);
  await page.evaluate(() => { window.allowRecoveryWrite = true; load(); });
  await expect(page.locator('#p')).toBeVisible();
  await expect(page.locator('#save-recovery')).toBeHidden();
  expect(await page.evaluate(() => player.points.eq('1e1000') && player.ge.clickables[11].eq(0))).toBe(true);
});
