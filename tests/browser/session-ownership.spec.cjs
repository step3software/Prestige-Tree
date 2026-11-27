const { installPausedClock } = require('../support/paused-clock.cjs');
const {test,expect} = require('@playwright/test');

test.beforeEach(async ({page}) => {
  await installPausedClock(page);
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  page.testErrors=[];
  page.on('pageerror',error=>page.testErrors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')page.testErrors.push(message.text());});
  await page.goto('/');
  await expect(page.locator('#p')).toBeVisible();
});
test.afterEach(async ({page})=>expect(page.testErrors).toEqual([]));

test('independent same-realm sessions leave rendered active play and its cache unchanged',async ({page})=>{
  await page.locator('#p').click();
  await page.locator('button.p.reset').click();
  await page.getByRole('button',{name:/Begin/}).click();
  await expect(page.locator('#points:visible')).toHaveText('0');
  expect(await page.evaluate(()=>{
    const active=gameUI.session, before=JSON.stringify(active.saveState.player), cache=active.derivedState.tmp;
    const a=createGameSession(), b=createGameSession();
    a.gameRules.doReset('p');a.purchase('p',11);advanceGame(a,3);
    const encoded=a.saveCommands.saveCodec().encodePlayer(a.saveState.player);
    if(!encoded.ok)return false;
    const restored=b.loadPlayer(encoded.text);b.advance(2);
    return restored.ok && a.saveState.player.points.eq(3) && b.saveState.player.points.eq(5) &&
      before===JSON.stringify(active.saveState.player) && active.derivedState.tmp===cache &&
      active.gameView.app.player===active.saveState.player && active.gameView.app.tmp===cache &&
      typeof player==='undefined' && typeof tmp==='undefined' && typeof allSaves==='undefined';
  })).toBe(true);
  await expect(page.locator('#points:visible')).toHaveText('0');
  await page.clock.runFor(1000);
  await expect(page.locator('#points:visible')).toHaveText('1.00');
});

test('import and save selection rebind the canonical player/cache and continue rendered progression',async ({page})=>{
  async function options(){await page.locator('#optionWheel').click();}
  async function menu(){await options();await page.getByRole('button',{name:'All Save Files',exact:true}).click();}
  await options();
  page.once('dialog',dialog=>dialog.accept(btoa(JSON.stringify({points:'123',p:{unlocked:true,upgrades:[11]}}))));
  await Promise.all([page.waitForEvent('load'),page.getByRole('button',{name:'Import',exact:true}).click()]);
  await expect(page.locator('#points:visible')).toHaveText('123.00');
  await page.clock.runFor(1000);
  await expect(page.locator('#points:visible')).toHaveText('124.00');
  await menu();page.once('dialog',dialog=>dialog.accept('second'));
  await Promise.all([page.waitForEvent('load'),page.getByRole('button',{name:'New Save',exact:true}).click()]);
  await expect(page.locator('#points:visible')).toHaveText('10.00');
  await menu();
  const original=page.locator('.upgRow').filter({has:page.locator('.widthLock',{hasText:/^save1$/})});
  await Promise.all([page.waitForEvent('load'),original.getByRole('button',{name:'Load',exact:true}).click()]);
  await expect(page.locator('#points:visible')).toHaveText('124.00');
  expect(await page.evaluate(()=>{
    const session=gameUI.session;
    return session.gameView.app.player===session.saveState.player &&
      session.gameView.app.allSaves===session.saveState.allSaves && session.gameView.app.tmp===session.derivedState.tmp;
  })).toBe(true);
  await page.clock.runFor(1000);
  await expect(page.locator('#points:visible')).toHaveText('125.00');
});

test('the canonical rule status renders endgame and Keep Going without a cached global flag',async ({page})=>{
  await page.locator('#p').click();await page.locator('button.p.reset').click();
  await page.getByRole('button',{name:/Begin/}).click();
  await page.evaluate(()=>{gameUI.session.modRules.isEndgame=()=>true;});
  await page.clock.runFor(50);
  await expect(page.getByRole('button',{name:'Keep Going',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Keep Going',exact:true}).click();
  await expect(page.locator('#p')).toBeVisible();
  await page.clock.runFor(500);
  expect(await page.evaluate(()=>gameUI.session.saveState.player.points.gt(0))).toBe(true);
});
