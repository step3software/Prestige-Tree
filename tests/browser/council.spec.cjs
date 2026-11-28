const {test,expect}=require('@playwright/test');
const {installPausedClock}=require('../support/paused-clock.cjs');
async function open(page){
 await installPausedClock(page);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 await page.goto('/');await expect(page.getByTestId('population')).toBeVisible();
 await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());return errors;
}
async function stage(page){await page.evaluate(()=>{
 const p=gameUI.session.saveState.player;
 p.organization.total=new Decimal(9);p.organization.best=new Decimal(8);p.organization.points=new Decimal(3);
 p.points=new Decimal(100);p.shelter.homes=23;p.shelter.points=new Decimal(100);
 p.civ.improvements.workRosters=true;p.civ.improvements.crafting=true;
 p.civ.improvements.extendedExpeditions=true;p.civ.improvements.cooking=true;
 });}
test('Council reveals at lifetime nine; keyboard scale, real independent staffing and 125-repeat queues survive reload',async({page})=>{
 const errors=await open(page);await expect(page.getByTestId('council-panel')).toHaveCount(0);
 await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.organization.total=new Decimal(8);p.organization.best=new Decimal(8);});
 await expect(page.getByTestId('council-panel')).toHaveCount(0);await stage(page);
 const scale=page.getByLabel('Worker scale:');await expect(scale).toHaveValue('1');await expect(scale).toHaveAttribute('max','5');
 await scale.focus();await page.keyboard.press('ArrowRight');await expect(scale).toHaveValue('2');
 await expect(page.locator('#fire-tenders')).toHaveAttribute('max','10');
 await scale.focus();await page.keyboard.press('End');await expect(scale).toHaveValue('5');
 await expect(page.getByTestId('council-staffing')).toContainText('5 Council workers reserved');
 await page.getByRole('button',{name:/^Food,/}).click();
 const food=page.locator('#overseer-workers-food');await food.focus();await page.keyboard.press('End');await expect(food).toHaveValue('25');
 const gather=page.locator('#repeat-gather');await gather.focus();await page.keyboard.press('End');await expect(gather).toHaveValue('125');
 await page.getByRole('button',{name:/^Shelter,/}).click();
 const huts=page.locator('#overseer-workers-shelter');await expect(huts).toHaveValue('1');await huts.focus();await page.keyboard.press('End');
 const hutRepeats=page.locator('#repeat-huts');await hutRepeats.focus();await page.keyboard.press('End');await expect(hutRepeats).toHaveValue('125');
 const fire=page.locator('#fire-tenders');await fire.focus();await page.keyboard.press('End');await expect(fire).toHaveValue('25');
 await expect(page.getByTestId('worker-ledger')).toContainText('20 workers available');
 await expect(page.locator('#cooking-level')).toHaveAttribute('max','5');
 await page.getByRole('button',{name:/^Food,/}).click();await expect(page.getByLabel('Gather expedition length').locator('option')).toHaveCount(5);
 await scale.focus();await page.keyboard.press('Home');await expect(scale).toHaveValue('5');
 await expect(page.locator('.event-log')).toContainText('Food overseers to 5');await expect(page.locator('.event-log')).toContainText('Hut repeats to 25');
 await page.getByRole('button',{name:'Save',exact:true}).click();await page.reload();await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());
 await expect(scale).toHaveValue('5');await expect(food).toHaveValue('25');await expect(gather).toHaveValue('125');await expect(fire).toHaveValue('25');
 for(const width of [1280,320]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const box=await scale.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);
  await page.screenshot({path:'test-results/council-'+width+'.png',fullPage:true});
 }
 // Recovery follows the displayed instructions, without clearing active work.
 await gather.focus();await page.keyboard.press('Home');await food.focus();await page.keyboard.press('Home');
 await page.getByRole('button',{name:/^Shelter,/}).click();await hutRepeats.focus();await page.keyboard.press('Home');await huts.focus();await page.keyboard.press('Home');
 await fire.focus();await page.keyboard.press('Home');await scale.focus();await page.keyboard.press('Home');await expect(scale).toHaveValue('1');
 expect(errors).toEqual([]);
});
test('Council suspension preserves active work and recovery; locked or malformed imports preserve the live save',async({page})=>{
 const errors=await open(page);await stage(page);
 await page.locator('#worker-scale').focus();await page.keyboard.press('End');
 await page.evaluate(()=>{const s=gameUI.session,p=s.saveState.player;s.modRules.civilization.dispatch('gather');p.points=new Decimal(5);});
 await expect(page.getByTestId('council-staffing')).toContainText('Staffing suspended');
 const result=await page.evaluate(()=>{
  const s=gameUI.session,codec=s.saveCommands.saveCodec(),p=s.saveState.player;
  const before=codec.encodePlayer(p).text;
  const raw=JSON.parse(atob(before));raw.organization.total='8';
  const loaded=s.loadPlayer(btoa(JSON.stringify(raw)));
  return {ok:loaded.ok,same:codec.encodePlayer(s.saveState.player).text===before,remaining:p.civ.actions.gather.remaining};
 });
 expect(result.ok).toBe(false);expect(result.same).toBe(true);expect(result.remaining).toBe(10);
 expect(errors).toEqual([]);
});
