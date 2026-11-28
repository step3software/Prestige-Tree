const {test, expect} = require('@playwright/test');
const fixture = require('../fixtures/civ-pre-fishing-removal-v091.json');

async function open(page) {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto('/');
    await expect(page.getByTestId('population')).toBeVisible();
    await page.evaluate(() => gameUI.session.runtimeServices.gameRuntime.stop());
    return errors;
}

test('migrated Food has no fishing controls, releases workers and saves the current model', async ({page}) => {
    await page.addInitScript(encoded => {
        if (localStorage.getItem('civ-prestige-tree')) return;
        const raw = JSON.parse(atob(encoded));
        raw.time = Date.now(); raw.offlineProd = false; raw.autosave = false;
        localStorage.setItem('civ-prestige-tree', btoa(JSON.stringify(raw)));
        localStorage.setItem('ptr', 'original-game-untouched');
    }, fixture.save);
    const errors = await open(page);
    await expect(page.locator('#save-recovery')).toBeHidden();
    await expect(page.getByTestId('population')).toHaveText('12');
    await expect(page.getByRole('status').filter({hasText: 'Fishing removed:'})).toBeVisible();
    const state = await page.evaluate(() => {
        const p = gameUI.session.saveState.player;
        return {version: p.version, actions: Object.keys(p.civ.actions), project: p.civ.project,
            workers: gameUI.session.modRules.civilization.supply().availableWorkers,
            food: p.food.points.toString(), craft: p.craft.points.toString()};
    });
    expect(state).toMatchObject({version: '0.94', project: '', workers: 11});
    expect(state.actions).not.toContain('fish');
    const original = JSON.parse(atob(fixture.save));
    expect(state.food).toBe(original.food.points);
    expect(state.craft).toBe(original.craft.points);
    for (const width of [1280, 320]) {
        await page.setViewportSize({width, height: 900});
        await expect(page.getByRole('button', {name: 'Recall Gather', exact: true})).toBeVisible();
        await expect(page.getByRole('button', {name: /Fish|river traps/i})).toHaveCount(0);
        await expect(page.getByLabel('Fish repeats remaining:')).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        await page.screenshot({path: 'test-results/remove-fishing-' + width + '.png', fullPage: true});
    }
    await page.getByRole('button', {name: 'Recall Gather', exact: true}).click();
    await page.getByRole('button', {name: 'Send Gather', exact: true}).click();
    await page.getByRole('button', {name: 'Save', exact: true}).click();
    await expect(page.locator('#save-status')).toContainText('Saved');
    const saved = await page.evaluate(() => {
        const collection = JSON.parse(atob(localStorage.getItem('civ-prestige-tree')));
        return collection[collection.set];
    });
    expect(saved.version).toBe('0.94');
    expect(saved.food.routes).not.toHaveProperty('fish');
    expect(saved.civ.actions).not.toHaveProperty('fish');
    await page.reload();
    await expect(page.getByTestId('population')).toHaveText('12');
    await expect(page.locator('#save-recovery')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('ptr'))).toBe('original-game-untouched');
    expect(errors).toEqual([]);
});

test('Settings import retires fishing through the same codec', async ({page}) => {
    const errors = await open(page);
    const input = await page.evaluate(encoded => {
        const raw = JSON.parse(atob(encoded));
        raw.time = Date.now(); raw.offlineProd = false; raw.autosave = false;
        return btoa(JSON.stringify(raw));
    }, fixture.save);
    page.on('dialog', dialog => dialog.type() === 'prompt' ? dialog.accept(input) : dialog.accept());
    await page.getByRole('button', {name: 'Settings', exact: true}).click();
    await page.getByRole('button', {name: 'Import save', exact: true}).click();
    await expect(page.getByTestId('population')).toHaveText('12');
    expect(await page.evaluate(() => Object.hasOwn(gameUI.session.saveState.player.civ.actions, 'fish'))).toBe(false);
    expect(await page.evaluate(() => gameUI.session.saveState.player.civ.project)).toBe('');
    expect(errors).toEqual([]);
});

test('damaged retired fishing enters recovery and preserves the original storage bytes', async ({page}) => {
    const raw = JSON.parse(atob(fixture.save));
    raw.civ.actions.fish.workers = 99;
    const damaged = btoa(JSON.stringify(raw));
    await page.addInitScript(encoded => localStorage.setItem('civ-prestige-tree', encoded), damaged);
    await page.goto('/');
    await expect(page.getByRole('heading', {name: 'Recover your settlement'})).toBeVisible();
    await expect(page.locator('#save-original')).toHaveValue(damaged);
    expect(await page.evaluate(() => localStorage.getItem('civ-prestige-tree'))).toBe(damaged);
});
