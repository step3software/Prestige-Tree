const {test,expect}=require('@playwright/test');
async function open(page){
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 await page.goto('/');await expect(page.getByTestId('population')).toBeVisible();
 await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());return errors;
}
async function stage(page,total=4){await page.evaluate(total=>{const p=gameUI.session.saveState.player;p.organization.total=new Decimal(total);p.points=new Decimal(12);p.shelter.homes=2;p.shelter.points=new Decimal(16);p.food.points=new Decimal(50);p.water.points=new Decimal(50);p.craft.points=new Decimal(10);},total);}

test('MS4 reveals a red Fire bar, exact upgrades and separate keyboard tending/Cooking controls through reload',async({page})=>{
 const errors=await open(page);await expect(page.getByTestId('fire-panel')).toHaveCount(0);await stage(page);
 const panel=page.getByTestId('fire-panel'),tenders=page.getByLabel('Fire tenders:',{exact:false});
 await expect(panel).toContainText('Fire: 0 / 14');await expect(page.getByLabel('Cooking:',{exact:false})).toHaveCount(0);
 await expect(page.getByRole('button',{name:/^Cooking/})).toBeDisabled();
 await tenders.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fireTenders)).toBe(3);
 await page.evaluate(()=>gameUI.session.advance(40));
 await expect(page.getByRole('button',{name:/^Cooking/})).toBeEnabled();await page.getByRole('button',{name:/^Cooking/}).click();
 const cooking=page.getByLabel('Cooking:',{exact:false});await cooking.focus();await page.keyboard.press('End');await expect(cooking).toHaveValue('5');
 await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.civ.improvements.extendedExpeditions=true;});
 await page.getByRole('button',{name:/^Food,/}).click();await page.getByLabel('Gather expedition length').selectOption('5');
 await page.getByRole('button',{name:'Send Gather',exact:true}).click();await page.evaluate(()=>gameUI.session.advance(2));
 await expect(page.getByTestId('fire-rates')).toContainText('Consumption');
 await page.getByRole('button',{name:'Save',exact:true}).click();
 const saved=await page.evaluate(()=>({fire:gameUI.session.saveState.player.civ.fire,bonus:gameUI.session.saveState.player.civ.actions.gather.cookingBonus}));
 await page.reload();await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());
 await expect(tenders).toHaveValue('3');await expect(cooking).toHaveValue('5');await expect(page.getByLabel('Gather expedition length')).toHaveValue('5');
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fire)).toBeCloseTo(saved.fire,8);
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.actions.gather.cookingBonus)).toBeCloseTo(saved.bonus,8);
 for(const width of [1280,320]){
  await page.setViewportSize({width,height:900});await expect(panel).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const slider of [tenders,cooking]){const box=await slider.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);}
  await page.screenshot({path:'test-results/fire-'+width+'.png',fullPage:true});
 }
 await tenders.focus();await page.keyboard.press('Home');expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fireTenders)).toBe(0);
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fire)).toBeCloseTo(saved.fire,8);
 expect(errors).toEqual([]);
});

test('Clay upgrades an existing Water basket to jars and construction charges the current recipe once',async({page})=>{
 const errors=await open(page);await stage(page);await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.civ.improvements.crafting=true;p.civ.improvements.clay=true;p.water.storage=1;p.civ.fire=10;});
 await page.getByRole('button',{name:/^Craft,/}).click();await page.getByTestId('material-clay').getByRole('button',{name:/^Earthenware jars/}).click();
 await page.getByRole('button',{name:/^Water,/}).click();await expect(page.locator('.storage-line')).toContainText('/ 220');
 const jar=page.getByRole('button',{name:/^Earthenware jars/});await expect(jar).toContainText('+120 Water storage');await expect(jar.locator('.project-cost')).toContainText('0.75 Fire');await expect(jar.locator('.project-cost')).toContainText('2 Craft');
 await jar.click();expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fire)).toBe(9.25);
 await page.evaluate(()=>gameUI.session.advance(17));await expect(page.locator('.storage-line')).toContainText('/ 340');
 await page.evaluate(()=>gameUI.session.saveState.player.civ.fire=1.12);await expect(jar).toBeDisabled();expect(errors).toEqual([]);
});

test('empty Fire leaves Food running, rejected staffing restores the slider and prestige explains its reset',async({page})=>{
 const errors=await open(page);await stage(page);await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.points=new Decimal(8);p.civ.improvements.cooking=true;p.civ.cookingLevel=5;p.civ.fire=0;});
 await page.getByRole('button',{name:/^Food,/}).click();await page.getByRole('button',{name:'Send Gather',exact:true}).click();
 await expect(page.getByTestId('cooking-status')).toContainText('Fuel limited');await page.evaluate(()=>gameUI.session.advance(10));
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.actions.gather.completed)).toBe(1);
 await page.evaluate(()=>{const e=gameUI.session.modRules.civilization;e.dispatch('gather',5);});
 const tenders=page.getByLabel('Fire tenders:',{exact:false});await tenders.focus();await page.keyboard.press('End');await expect(tenders).toHaveValue('0');
 await expect(page.locator('.event-log')).toContainText('needs available workers');
 await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.points=new Decimal(28);});await page.getByRole('button',{name:/^Organization,/}).click();
 await expect(page.getByTestId('prestige-reset-preview')).toContainText('stored Fire resets to 0');
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Develop Organization'}).click();
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fire)).toBe(0);expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.improvements.cooking)).toBe(true);
 expect(errors).toEqual([]);
});
