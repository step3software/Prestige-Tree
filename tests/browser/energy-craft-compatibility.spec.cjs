const {test,expect}=require('@playwright/test');
const fixtures=require('../fixtures/energy-craft-v093.json');

for(const name of ['energy','craft'])test('actual '+name+' save opens with compatible equipment and Cooks, then saves and reloads',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-11-28T05:00:00Z'));
 await page.addInitScript(encoded=>{
  if(!localStorage.getItem('civ-prestige-tree')){
   const player=JSON.parse(atob(encoded));player.time=Date.now();
   localStorage.setItem('civ-prestige-tree',btoa(JSON.stringify(player)));localStorage.setItem('ptr','original-game-preserved');
  }
 },fixtures[name].encoded);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/');
 await expect(page.getByTestId('population')).toBeVisible();await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());
 await expect(page.locator('#save-recovery')).toBeHidden();await page.getByRole('button',{name:/^Energy,/}).click();
 const cooks=page.locator('#cooks');await expect(cooks.getByRole('checkbox',{checked:true})).toHaveCount(name==='energy'?3:0);
 await expect(page.getByTestId('fire-buyables')).toHaveCount(0);await expect(page.getByRole('button',{name:/^Cooking/})).toHaveCount(0);
 const before=await page.evaluate(()=>{
  const p=gameUI.session.saveState.player;
  return {version:p.version,craft:p.craft.points.toString(),equipment:{...p.civ.equipment},project:p.civ.project,work:p.civ.projectWork,bonus:p.civ.actions.gather.cookingBonus,cooks:p.civ.cooks};
 });
 expect(before.version).toBe('0.94');expect(before.project).toBe(name==='craft'?'roofs':'');
 await page.getByRole('button',{name:/^Craft,/}).click();
 await expect(page.getByTestId('material-crafting').getByRole('button',{name:/^Woven baskets/})).toContainText('Owned level: '+before.equipment['water-storage']);
 await page.getByRole('button',{name:'Save',exact:true}).click();await page.reload();await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());
 const after=await page.evaluate(()=>{
  const p=gameUI.session.saveState.player;
  return {version:p.version,craft:p.craft.points.toString(),equipment:{...p.civ.equipment},project:p.civ.project,work:p.civ.projectWork,bonus:p.civ.actions.gather.cookingBonus,cooks:p.civ.cooks};
 });
 expect(after).toEqual(before);expect(await page.evaluate(()=>localStorage.getItem('ptr'))).toBe('original-game-preserved');expect(errors).toEqual([]);
});
