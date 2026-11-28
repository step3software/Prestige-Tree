const {test,expect}=require('@playwright/test');
async function settlement(page){
 await page.goto('/');await expect(page.locator('#app')).toBeVisible();
 await page.evaluate(()=>{
  gameUI.session.runtimeServices.gameRuntime.stop();const p=gameUI.session.saveState.player;
  p.craft.points=new Decimal(500);p.organization.points=new Decimal(10);p.organization.best=new Decimal(10);
  p.civ.fire=10;p.food.points=new Decimal(50);p.water.points=new Decimal(50);
 });
 await page.getByRole('button',{name:/^Craft,/}).click();
}
test('Craft equipment stays repeatable, displays scaling costs and resets through confirmation and reload',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await settlement(page);
 const crafting=page.getByTestId('material-crafting');await crafting.locator('.material-unlock').press('Enter');
 await expect(crafting.locator('.material-items button')).toHaveCount(4);
 const baskets=crafting.getByRole('button',{name:/^Woven baskets/});
 await expect(baskets).toContainText('1 Craft');await baskets.press('Enter');
 await expect(baskets).toBeDisabled();await page.evaluate(()=>gameUI.session.advance(12));
 await expect(baskets).toContainText('Owned level: 1');await expect(baskets).toContainText('2 Craft');
 await expect(baskets).toBeEnabled();await baskets.click();await page.evaluate(()=>gameUI.session.advance(17));
 await expect(baskets).toContainText('Owned level: 2');await expect(baskets).toContainText('4 Craft');
 await expect(page.getByTestId('fire-buyables')).toHaveCount(0);
 await page.evaluate(()=>{gameUI.session.saveState.player.points=new Decimal(48);});
 await page.getByRole('button',{name:/^Organization,/}).click();await expect(page.getByTestId('prestige-reset-preview')).toContainText('Woven baskets');
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Develop Organization',exact:true}).click();
 await page.getByRole('button',{name:/^Craft,/}).click();await expect(baskets).toContainText('Owned level: 0');await expect(baskets).toContainText('1 Craft');
 await page.evaluate(()=>gameUI.commands.save());await page.reload();
 await expect(page.getByTestId('material-crafting').getByRole('button',{name:/^Woven baskets/})).toContainText('Owned level: 0');expect(errors).toEqual([]);
});
test('material buyables show prerequisites and remain usable on narrow screens with no Fire purchases',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await settlement(page);
 for(const id of ['crafting','clay','copper'])await page.getByTestId('material-'+id).locator('.material-unlock').click();
 await expect(page.locator('.material-items button')).toHaveCount(12);
 const bricks=page.getByTestId('material-clay').getByRole('button',{name:/^Bricks/});await expect(bricks).toBeDisabled();
 await page.getByTestId('material-crafting').getByRole('button',{name:/^Thatched roofs/}).click();await page.evaluate(()=>gameUI.session.advance(12));await expect(bricks).toBeEnabled();
 for(const width of [1280,390]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/craft-buyables-'+width+'.png',fullPage:true});}
 await expect(page.getByRole('button',{name:/^Fuel stores|^Improved hearths|^Charcoal clamps/})).toHaveCount(0);expect(errors).toEqual([]);
});
