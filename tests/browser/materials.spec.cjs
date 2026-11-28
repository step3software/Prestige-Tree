const {test,expect}=require('@playwright/test');
const node=(page,name)=>page.getByRole('button',{name:new RegExp('^'+name+',')});
async function settlement(page){
 await page.goto('/');await expect(page.locator('#app')).toBeVisible();
 await page.evaluate(()=>{
  gameUI.session.runtimeServices.gameRuntime.stop();const p=gameUI.session.saveState.player;
  p.craft.points=new Decimal(500);p.organization.points=new Decimal(10);p.organization.best=new Decimal(10);
  p.civ.fire=10;p.food.points=new Decimal(50);p.water.points=new Decimal(50);
 });
 await node(page,'Craft').click();
}
test('Craft sells materials while Water equipment repeats and resets its displayed price through reload',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await settlement(page);
 await page.getByTestId('material-crafting').locator('.material-unlock').press('Enter');
 await expect(page.getByTestId('material-rows').getByRole('button')).toHaveCount(3);
 await expect(page.getByTestId('craft-buyables')).toHaveCount(0);
 await node(page,'Water').click();const baskets=page.getByTestId('water-buyables').getByRole('button',{name:/^Tightly woven baskets/});
 await expect(baskets).toContainText('1 Craft');await baskets.press('Enter');await expect(baskets).toBeDisabled();
 await page.evaluate(()=>gameUI.session.advance(12));await expect(baskets).toContainText('Owned level: 1');await expect(baskets).toContainText('2 Craft');
 await expect(page.getByText(/24 base Water/)).toBeVisible();await expect(page.locator('.storage-line')).toContainText('/ 50');
 await expect(baskets).toBeEnabled();await baskets.click();await page.evaluate(()=>gameUI.session.advance(17));
 await expect(baskets).toContainText('Owned level: 2');await expect(baskets).toContainText('4 Craft');
 await expect(page.getByText(/34 base Water/)).toBeVisible();await expect(page.locator('.storage-line')).toContainText('/ 50');
 await page.evaluate(()=>{gameUI.session.saveState.player.points=new Decimal(48);});await node(page,'Organization').click();
 await expect(page.getByTestId('prestige-reset-preview')).toContainText('Tightly woven baskets');page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'Develop Organization',exact:true}).click();await node(page,'Water').click();
 await expect(baskets).toContainText('Owned level: 0');await expect(baskets).toContainText('1 Craft');await expect(page.getByText(/14 base Water/)).toBeVisible();
 await page.evaluate(()=>gameUI.commands.save());await page.reload();await expect(baskets).toContainText('Owned level: 0');expect(errors).toEqual([]);
});
test('all twelve buyables stay on their resource tabs and cooking panel after learning materials',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await settlement(page);
 for(const id of ['crafting','clay','copper'])await page.getByTestId('material-'+id).locator('.material-unlock').click();
 await expect(page.getByTestId('material-rows').getByRole('button')).toHaveCount(3);await expect(page.locator('.material-items')).toHaveCount(0);
 const groups={Food:['Wooden spears','Digging sticks','Copper knives','Copper sickles'],Water:['Tightly woven baskets','Earthenware jars','Fired-clay pipes'],Shelter:['Thatched roofs','Bricks','Copper axes']};
 for(const [tab,names] of Object.entries(groups)){
  await node(page,tab).click();const panel=page.getByTestId(tab.toLowerCase()+'-buyables');
  for(const name of names)await expect(panel.getByRole('button',{name:new RegExp('^'+name)})).toBeVisible();
  for(const width of [1280,390]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/equipment-'+tab+'-'+width+'.png',fullPage:true});}
 }
 const shelter=page.getByTestId('shelter-buyables'),bricks=shelter.getByRole('button',{name:/^Bricks/});await expect(bricks).toBeDisabled();
 await shelter.getByRole('button',{name:/^Thatched roofs/}).click();await page.evaluate(()=>gameUI.session.advance(12));await expect(bricks).toBeEnabled();
 await expect(page.getByTestId('cooking-vessels')).toHaveCount(0);await node(page,'Energy').click();
 const vessels=page.getByTestId('cooking-vessels');await expect(vessels.getByRole('button')).toHaveCount(2);
 await expect(vessels.getByRole('button',{name:/^Clay cooking pots/})).toBeEnabled();
 await expect(page.getByRole('button',{name:/^Cooking /})).toHaveCount(0);
 await vessels.getByRole('button',{name:/^Clay cooking pots/}).press('Enter');await page.evaluate(()=>gameUI.session.advance(12));
 await expect(vessels.getByRole('button',{name:/^Clay cooking pots/})).toContainText('Owned level: 1');
 await expect(vessels.getByRole('button',{name:/^Copper pots/})).toBeEnabled();
 for(const width of [1280,320]){
  await page.setViewportSize({width,height:900});await expect(vessels).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/energy-vessels-'+width+'.png',fullPage:true});
 }
 await expect(page.getByRole('button',{name:/^Fuel stores|^Improved hearths|^Charcoal clamps/})).toHaveCount(0);expect(errors).toEqual([]);
});
