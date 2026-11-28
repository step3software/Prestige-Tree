const {test,expect}=require('@playwright/test');
const energy=page=>page.getByRole('button',{name:/^Energy,/});
const food=page=>page.getByRole('button',{name:/^Food,/});

test('yellow Energy E stays left of Food and opens the Fire requirement with keyboard at desktop and narrow widths',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());
 for(const width of [1280,390,320]){
  await page.setViewportSize({width,height:900});const e=energy(page),f=food(page);
  await expect(e).toHaveText('E');await expect(e).toHaveCSS('background-color','rgb(242, 207, 84)');
  // Read one layout frame: resizing can scroll the previously focused button.
  const cells=await page.locator('.foundation-nodes .node-cell').evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return {x:b.x,y:b.y};}));
  expect(cells[0].x).toBeLessThan(cells[1].x);for(const cell of cells)expect(cell.y).toBeCloseTo(cells[0].y,0);
  await e.press('Enter');await expect(page.locator('#resource-title')).toHaveText('Energy');await expect(page.getByTestId('energy-locked')).toContainText('Organization 4');
  await expect(page.getByTestId('fire-panel')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await food(page).click();
 }
 expect(errors).toEqual([]);
});

test('Fire controls live only inside Energy and retain fuel, staffing and selected tab after save/reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.evaluate(()=>{
  gameUI.session.runtimeServices.gameRuntime.stop();const p=gameUI.session.saveState.player;p.organization.best=new Decimal(4);p.civ.fire=3;
 });
 await expect(page.getByTestId('fire-panel')).toHaveCount(0);await energy(page).press('Enter');await expect(page.locator('#resource-panel').getByTestId('fire-panel')).toBeVisible();
 const tenders=page.locator('#fire-tenders');await tenders.locator('input[value="1"]').press('Space');await expect(tenders.getByRole('checkbox',{checked:true})).toHaveCount(1);
 const cooks=page.locator('#cooks');await cooks.locator('input[value="2"]').press('Space');await expect(cooks.getByRole('checkbox',{checked:true})).toHaveCount(2);expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fire)).toBe(3);
 await food(page).click();await expect(page.getByTestId('fire-panel')).toHaveCount(0);await page.getByRole('button',{name:'Send Gather',exact:true}).click();
 await energy(page).click();await page.getByRole('button',{name:'Save',exact:true}).click();await page.reload();await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());
 await expect(page.locator('#resource-title')).toHaveText('Energy');await expect(tenders.getByRole('checkbox',{checked:true})).toHaveCount(1);await expect(cooks.getByRole('checkbox',{checked:true})).toHaveCount(2);
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.fire)).toBe(3);
 for(const width of [1280,390,320]){await page.setViewportSize({width,height:900});await expect(page.getByTestId('fire-panel')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/energy-'+width+'.png',fullPage:true});}
 expect(errors).toEqual([]);
});
