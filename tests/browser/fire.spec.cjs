const {test,expect}=require('@playwright/test');
async function open(page){
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 await page.goto('/');await expect(page.getByTestId('population')).toBeVisible();
 await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());return errors;
}
async function stage(page,total=4){await page.evaluate(total=>{const p=gameUI.session.saveState.player;p.organization.total=new Decimal(total);p.organization.points=new Decimal(total);p.points=new Decimal(12);p.shelter.homes=2;p.shelter.points=new Decimal(16);p.food.points=new Decimal(50);p.water.points=new Decimal(50);p.craft.points=new Decimal(10);},total);await page.getByRole('button',{name:/^Energy,/}).click();}

test('MS4 reveals a red Fire bar, exact upgrades and separate keyboard tending/Cooks controls through reload',async({page})=>{
 // Exact codec comparisons exclude wall-clock offline work while reloading.
 await page.clock.setFixedTime(new Date('2026-11-28T05:00:00Z'));
 const errors=await open(page);await expect(page.getByTestId('fire-panel')).toHaveCount(0);await stage(page);
 const panel=page.getByTestId('fire-panel'),tenders=page.locator('#fire-tenders');
 await expect(panel).toContainText('Fire: 0 / 14');await expect(page.locator('#cooks').getByRole('checkbox',{checked:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:/^Cooking/})).toHaveCount(0);
 await tenders.locator('input[value="3"]').press('Space');
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fireTenders)).toBe(3);
 await page.evaluate(()=>gameUI.session.advance(40));
 await expect(page.getByTestId('worker-ledger')).toContainText('3 Fire tenders');
 const cooking=page.locator('#cooks');await cooking.locator('input[value="5"]').press('Space');await expect(cooking.getByRole('checkbox',{checked:true})).toHaveCount(5);
 await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.civ.improvements.extendedExpeditions=true;});
 await page.getByRole('button',{name:/^Food,/}).click();await page.getByLabel('Gather expedition length').selectOption('5');
 await page.getByRole('button',{name:'Send Gather',exact:true}).click();await page.evaluate(()=>gameUI.session.advance(2));
 await page.getByRole('button',{name:/^Energy,/}).click();
 await expect(page.getByTestId('fire-rates')).toContainText('Consumption');
 await page.getByRole('button',{name:'Save',exact:true}).click();
 const saved=await page.evaluate(()=>({fire:gameUI.session.saveState.player.civ.fire,bonus:gameUI.session.saveState.player.civ.actions.gather.cookingBonus}));
 await page.reload();await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());
 await expect(tenders.getByRole('checkbox',{checked:true})).toHaveCount(3);await expect(cooking.getByRole('checkbox',{checked:true})).toHaveCount(5);await page.getByRole('button',{name:/^Food,/}).click();await expect(page.getByLabel('Gather expedition length')).toHaveValue('5');await page.getByRole('button',{name:/^Energy,/}).click();
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fire)).toBeCloseTo(saved.fire,8);
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.actions.gather.cookingBonus)).toBeCloseTo(saved.bonus,8);
 for(const width of [1280,320]){
  await page.setViewportSize({width,height:900});await expect(panel).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const slider of [tenders,cooking]){const box=await slider.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);}
  await page.screenshot({path:'test-results/fire-'+width+'.png',fullPage:true});
 }
 await tenders.locator('input[value="1"]').click();await tenders.locator('input[value="1"]').click();expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fireTenders)).toBe(0);
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fire)).toBeCloseTo(saved.fire,8);
 expect(errors).toEqual([]);
});

test('Clay jars are repeatable Craft equipment with upfront Fire and a builder',async({page})=>{
 const errors=await open(page);await stage(page);await page.evaluate(()=>{
  const p=gameUI.session.saveState.player;p.civ.improvements.crafting=true;p.civ.improvements.clay=true;
  p.civ.equipment['water-storage']=1;p.civ.fire=10;
 });
 await page.getByRole('button',{name:/^Water,/}).click();
 const jar=page.getByTestId('water-buyables').getByRole('button',{name:/^Earthenware jars/});
 await expect(jar).toContainText('2 Craft');await expect(jar).toContainText('0.5 Fire');await jar.click();
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fire)).toBe(9.5);
 await page.evaluate(()=>gameUI.session.advance(12));await expect(jar).toContainText('Owned level: 1');await expect(jar).toContainText('4 Craft');
 await expect(page.locator('.storage-line')).toContainText('/ 70');await expect(page.getByText(/44 base Water/)).toBeVisible();
 await jar.click();await page.evaluate(()=>gameUI.session.advance(17));await expect(jar).toContainText('Owned level: 2');
 await expect(page.locator('.storage-line')).toContainText('/ 90');await expect(page.getByText(/64 base Water/)).toBeVisible();expect(errors).toEqual([]);
});

test('empty Fire leaves Food running, rejected staffing restores the indicators and prestige explains its reset',async({page})=>{
 const errors=await open(page);await stage(page);await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.points=new Decimal(8);p.civ.cooks=5;p.civ.fire=0;});
 await page.getByRole('button',{name:/^Food,/}).click();await page.getByRole('button',{name:'Send Gather',exact:true}).click();
 await page.getByRole('button',{name:/^Energy,/}).click();
 await expect(page.getByTestId('cooking-status')).toContainText('Fuel limited');await page.evaluate(()=>gameUI.session.advance(10));
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.actions.gather.completed)).toBe(1);
 await page.evaluate(()=>{const e=gameUI.session.modRules.civilization;e.dispatch('gather',5);});
 const tenders=page.locator('#fire-tenders');await tenders.locator('input[value="5"]').click();await expect(tenders.getByRole('checkbox',{checked:true})).toHaveCount(0);
 await expect(page.locator('.event-log')).toContainText('needs available workers');
 await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.points=new Decimal(28);});await page.getByRole('button',{name:/^Organization,/}).click();
 await expect(page.getByTestId('prestige-reset-preview')).toContainText('Fire tenders and Cooks released (0 assigned)');
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Develop Organization'}).click();
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fire)).toBe(0);expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.cooks)).toBe(0);
 await page.getByRole('button',{name:/^Energy,/}).click();
 const cooks=page.locator('#cooks');await expect(cooks.getByRole('checkbox',{checked:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Save',exact:true}).click();await page.reload();await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());
 await expect(cooks.getByRole('checkbox',{checked:true})).toHaveCount(0);await expect(page.getByTestId('worker-ledger')).toContainText('0 Cooks');
 expect(errors).toEqual([]);
});

test('Cooks reject unavailable staffing visibly and release before survival crews after Population loss',async({page})=>{
 const errors=await open(page);await stage(page);expect(await page.evaluate(()=>{
  const p=gameUI.session.saveState.player,e=gameUI.session.modRules.civilization;p.points=new Decimal(8);p.civ.features.hunting=true;p.civ.improvements.crafting=true;
  return e.setCooks(4)&&e.setFireTenders(1)&&e.dispatch('hunt');
 })).toBe(true);
 const cooks=page.locator('#cooks');await expect(cooks.getByRole('checkbox',{checked:true})).toHaveCount(4);await cooks.locator('input[value="5"]').press('Space');await expect(cooks.getByRole('checkbox',{checked:true})).toHaveCount(4);
 await expect(page.locator('.event-log')).toContainText('Cooks need available workers');
 await expect(page.getByTestId('worker-ledger')).toContainText('4 Cooks');
 await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.food.points=new Decimal(0);p.water.points=new Decimal(0);gameUI.session.advance(10);});
 await expect(cooks.getByRole('checkbox',{checked:true})).toHaveCount(3);await expect(page.locator('#fire-tenders').getByRole('checkbox',{checked:true})).toHaveCount(1);
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.actions.hunt.workers)).toBe(3);expect(errors).toEqual([]);
});

test('actual old Cooking purchase disappears without refund at browser startup and current Cooks reload',async({page})=>{
 const fixture=require('../fixtures/cooks-v091.json'),raw=JSON.parse(atob(fixture.encoded));
 await page.addInitScript(encoded=>{
  if(!localStorage.getItem('civ-prestige-tree')){
   const player=JSON.parse(atob(encoded));player.time=Date.now();
   localStorage.setItem('civ-prestige-tree',btoa(JSON.stringify(player)));
  }
 },fixture.encoded);
 const errors=await open(page);await page.getByRole('button',{name:/^Energy,/}).click();
 const cooks=page.locator('#cooks');await expect(cooks.getByRole('checkbox',{checked:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:/^Cooking/})).toHaveCount(0);
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fire)).toBe(raw.civ.fire);
 expect(await page.evaluate(()=>Object.hasOwn(gameUI.session.saveState.player.civ.improvements,'cooking'))).toBe(false);
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.equipment.copperPots)).toBe(1);
 await cooks.locator('input[value="2"]').press('Space');await expect(cooks.getByRole('checkbox',{checked:true})).toHaveCount(2);
 await page.getByRole('button',{name:'Save',exact:true}).click();await page.reload();await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());
 await expect(cooks.getByRole('checkbox',{checked:true})).toHaveCount(2);expect(errors).toEqual([]);
});
