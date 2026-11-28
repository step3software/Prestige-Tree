const {test,expect}=require('@playwright/test');
async function settlement(page){
 await page.goto('/');
 await expect(page.locator('#app')).toBeVisible();
 await page.evaluate(()=>{
  gameUI.session.runtimeServices.gameRuntime.stop();
  const p=gameUI.session.saveState.player;
  p.craft.points=new Decimal(500);p.organization.total=new Decimal(10);p.organization.points=new Decimal(10);
  p.civ.fire=10;p.food.points=new Decimal(50);p.water.points=new Decimal(50);
 });
 await page.getByRole('button',{name:/^Craft,/}).click();
}
test('material rows upgrade separate Water, cooking and housing families through keyboard controls',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await settlement(page);
 const crafting=page.getByTestId('material-crafting');
 await expect(crafting.locator('.material-items')).toHaveCount(0);
 await crafting.getByRole('button',{name:/^Crafting/}).press('Enter');
 await expect(crafting.locator('.material-items button')).toHaveCount(4);
 await crafting.getByRole('button',{name:/^Thatched roofs/}).press('Enter');
 await crafting.getByRole('button',{name:/^Woven baskets/}).click();
 await page.evaluate(()=>gameUI.session.advance(12));
 await page.getByTestId('material-clay').getByRole('button',{name:/^Clay$/}).count().then(async count=>{
  if(count)await page.getByTestId('material-clay').getByRole('button',{name:/^Clay$/}).click();
  else await page.getByTestId('material-clay').locator('.material-unlock').click();
 });
 const clay=page.getByTestId('material-clay');
 await clay.getByRole('button',{name:/^Earthenware jars/}).click();
 await clay.getByRole('button',{name:/^Bricks/}).click();
 await page.locator('.fire-upgrades').getByRole('button',{name:/^Cooking/}).click();
 await clay.getByRole('button',{name:/^Clay cooking pots/}).click();
 await page.getByTestId('material-copper').locator('.material-unlock').click();
 await expect(page.getByTestId('material-copper').getByRole('button',{name:/^Copper knives/})).toBeVisible();
 await page.getByTestId('material-copper').getByRole('button',{name:/^Copper pots/}).click();
 const state=await page.evaluate(()=>{
  const p=gameUI.session.saveState.player,e=gameUI.session.modRules.civilization;
  e.setCookingLevel(3);e.dispatch('gather');
  return {storage:p.water.storage,capacity:e.supply().storage.water,multiplier:e.fireStatus().cookingMultiplier,huts:p.shelter.homes};
 });
 expect(state).toEqual({storage:1,capacity:220,multiplier:3.5,huts:0});
 await expect(clay.getByRole('button',{name:/^Copper pots/})).toContainText('Upgraded');
 for(const width of [1280,390]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.locator('.material-row .project-button').evaluateAll(buttons=>buttons.every(button=>button.scrollHeight<=button.clientHeight+1))).toBe(true);await page.screenshot({path:'test-results/materials-'+width+'.png',fullPage:true});}
 expect(errors).toEqual([]);
});
test('narrow Fire projects reserve a builder and spring still allows manual collection',async({page})=>{
 await page.setViewportSize({width:390,height:844});await settlement(page);
 await page.getByTestId('material-crafting').locator('.material-unlock').click();
 await page.getByTestId('fire-buyables').getByRole('button',{name:/^Fuel stores/}).click();
 await expect(page.locator('.workbench')).toContainText('Fuel stores');
 await page.evaluate(()=>{gameUI.session.advance(12);const p=gameUI.session.saveState.player;p.civ.improvements.gravity=true;p.water.points=new Decimal(0);});
 await expect(page.getByTestId('fire-panel')).toContainText('/ 20');
 await page.getByRole('button',{name:/^Water,/}).click();
 const haul=page.getByRole('button',{name:/^Send Collect water/});await expect(haul).toBeEnabled();await haul.click();
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.actions.water.workers)).toBe(2);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/materials-narrow.png',fullPage:true});
});
