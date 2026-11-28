const {test,expect}=require('@playwright/test');
async function open(page,established=true){
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    await page.goto('/');await expect(page.getByRole('heading',{name:'Population',exact:false})).toBeVisible();
    await page.evaluate(established=>{gameUI.session.runtimeServices.gameRuntime.stop();if(established)Object.assign(gameUI.session.saveState.player.civ.features,{huts:true,hunting:true,fishing:true,buyables:true});},established);
    return errors;
}
const node=(page,name)=>page.getByRole('button',{name:new RegExp('^'+name+',')});

test('Organization upgrades drive expedition length and separate 25/10 overseer caps through reload',async({page})=>{
 const errors=await open(page,false);
 await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.organization.total=new Decimal(6);p.organization.points=new Decimal(6);p.points=new Decimal(30);p.shelter.homes=6;p.shelter.points=new Decimal(32);p.food.points=new Decimal(50);p.water.points=new Decimal(50);});
 await page.getByRole('button',{name:/^Extended expeditions/}).click();
 await node(page,'Organization').click();await page.getByRole('button',{name:/^Work rosters/}).click();
 await node(page,'Shelter').click();await page.getByRole('button',{name:/^Prepared materials/}).click();
 expect(await page.evaluate(()=>gameUI.session.saveState.player.organization.points.toNumber())).toBe(0);
 await page.getByLabel('Hut overseer workers').selectOption('2');
 await page.getByLabel('Hut repeats remaining:').focus();await page.keyboard.press('End');
 await expect(page.getByLabel('Hut repeats remaining:')).toHaveAttribute('max','10');
 await node(page,'Food').click();await page.getByLabel('Food overseer workers').selectOption('5');
 await page.getByLabel('Gather expedition length').selectOption('5');
 const slider=page.getByLabel('Gather repeats remaining:');await slider.focus();await page.keyboard.press('End');
 await expect(slider).toHaveValue('25');await expect(slider).toHaveAttribute('max','25');
 await page.evaluate(()=>{gameUI.session.saveState.player.food.points=new Decimal(10);gameUI.session.advance(1);gameUI.commands.save();});
 await expect(slider).toHaveValue('24');
 expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.actions.gather.duration)).toBe(50);
 expect(await page.evaluate(()=>gameUI.session.modRules.civilization.supply().overseerWorkers)).toBe(5);
 expect(await page.evaluate(()=>gameUI.session.modRules.civilization.supply().foremanWorkers)).toBe(2);
 expect(await page.evaluate(()=>gameUI.session.modRules.civilization.summary().project.work)).toBeCloseTo(16*1.35**6*.75,8);
 await page.reload();await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());
 await expect(page.getByLabel('Food overseer workers')).toHaveValue('5');
 await expect(page.getByLabel('Gather expedition length')).toHaveValue('5');
 await expect(slider).toHaveAttribute('max','25');
 await expect(page.getByLabel('Food overseer workers').locator('option[value="1"]')).toBeDisabled();
 for(const width of [1280,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.screenshot({path:'test-results/ms123-controls.png',fullPage:true});
 expect(errors).toEqual([]);
});

test('abundance shows independent supply and Shelter bonuses and still pauses for shortages',async({page})=>{
    const errors=await open(page);
    await page.evaluate(()=>{
        const s=gameUI.session,p=s.saveState.player;
        p.shelter.homes=11;p.shelter.points=new Decimal(52);
        p.food.points=new Decimal(50);p.water.points=new Decimal(50);
        s.derivedState.updateTemp();
    });
    await expect(page.getByTestId('abundance-growth')).toHaveCount(0);
    await node(page,'Shelter').click();
    await expect(page.getByRole('button',{name:/^Abundance/})).toHaveCount(0);
    await page.evaluate(()=>{gameUI.session.saveState.player.organization.total=new Decimal(5);gameUI.session.derivedState.updateTemp();});
    const abundance=page.getByRole('button',{name:/^Abundance/});
    await expect(abundance).toContainText('Free');
    await abundance.click();
    expect(await page.evaluate(()=>gameUI.session.saveState.player.craft.points.toNumber())).toBe(0);
    await expect(page.getByTestId('abundance-growth')).toHaveText('Abundance: 10× growth');
    await page.getByTestId('abundance-details').locator('summary').click();
    await expect(page.getByTestId('abundance-details')).toContainText('Food: +300%');
    await expect(page.getByTestId('abundance-details')).toContainText('Water: +300%');
    await expect(page.getByTestId('abundance-details')).toContainText('Shelter: +300%');
    await page.evaluate(()=>{const s=gameUI.session;s.saveState.player.food.points=new Decimal(5);s.derivedState.updateTemp();});
    await expect(page.getByTestId('abundance-growth')).toHaveText('Abundance: 7× growth');
    await expect(page.getByTestId('abundance-details')).toContainText('Food: +0%');
    await expect(page.getByTestId('abundance-details')).toContainText('Water: +300%');
    await page.evaluate(()=>{const s=gameUI.session;s.saveState.player.food.points=new Decimal(0);s.advance(1);});
    await expect(page.getByTestId('abundance-growth')).toContainText('paused');
    await expect(page.getByTestId('population')).toHaveText('5');
    await page.evaluate(()=>{
        const s=gameUI.session,p=s.saveState.player;
        p.food.points=new Decimal(50);p.water.points=new Decimal(50);p.civ.growth=0;
        s.advance(12);
    });
    await expect(page.getByTestId('population')).toHaveText('15');
    for(const width of [1280,320]){
        await page.setViewportSize({width,height:800});
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await page.screenshot({path:'test-results/abundance-'+width+'.png',fullPage:true});
    }
    expect(errors).toEqual([]);
});

test('Shared hearths displays and produces population-scaled Food without changing housing',async({page})=>{
    const errors=await open(page);
    await page.evaluate(()=>{gameUI.session.saveState.player.organization.total=new Decimal(6);});
    await node(page,'Shelter').click();
    const hearths=page.getByRole('button',{name:/^Shared hearths/});
    await expect(hearths).toBeDisabled();
    await expect(hearths).toContainText('Every 10 current Population');
    await expect(hearths).toContainText('+5 Food storage and +1 Food/min');
    await page.evaluate(()=>{
        const s=gameUI.session,p=s.saveState.player;p.organization.total=new Decimal(6);
        p.points=new Decimal(9);p.shelter.homes=1;p.shelter.points=new Decimal(12);
        p.food.points=new Decimal(50);p.water.points=new Decimal(50);p.craft.points=new Decimal(1);
        s.derivedState.updateTemp();
    });
    await hearths.focus();await page.keyboard.press('Enter');
    await expect(hearths).toContainText('Owned');
    await expect(page.getByTestId('hearth-benefits')).toContainText('+0 Food storage');
    await page.evaluate(()=>{const s=gameUI.session;for(let i=0;i<12&&s.saveState.player.points.lt(10);i++)s.advance(1);});
    await expect(page.getByTestId('hearth-benefits')).toContainText('+5 Food storage');
    await expect(page.getByTestId('hearth-benefits')).toContainText('+1 Food/min');
    expect(await page.evaluate(()=>gameUI.session.modRules.civilization.supply().support)).toBe(12);
    await node(page,'Food').click();
    await expect(page.getByText('Hearths + active crews, average yield',{exact:true})).toBeVisible();
    await expect(page.locator('.storage-line')).toContainText('/ 55');
    const before=await page.evaluate(()=>gameUI.session.saveState.player.food.points.toNumber());
    await page.evaluate(()=>gameUI.session.advance(1));
    const after=await page.evaluate(()=>gameUI.session.saveState.player.food.points.toNumber());
    expect(after-before).toBeCloseTo(-9/60,8);
    for(const width of [1280,320]){
        await page.setViewportSize({width,height:800});
        for(const resource of ['Shelter','Food']){
            await node(page,resource).click();
            await expect(page.getByTestId('hearth-benefits')).toBeVisible();
            expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
            await page.screenshot({path:'test-results/shared-hearths-'+resource+'-'+width+'.png',fullPage:true});
        }
    }
    expect(errors).toEqual([]);
});

test('Water storage is crafted earthenware with one Craft and a timed builder requirement',async({page})=>{
    const errors=await open(page);
    await node(page,'Water').click();
    await expect(page.getByText('Water reserves 10 / 50',{exact:true})).toBeVisible();
    const jars=page.getByRole('button',{name:/^Craft earthenware jars/});
    await expect(jars).toContainText('Hand-shaped, fired clay jars');
    await expect(jars).toContainText('1 Craft');
    await expect(jars.locator('.project-cost')).toContainText('12');
    await expect(jars).toBeDisabled();
    await page.evaluate(()=>{const s=gameUI.session;s.saveState.player.craft.points=new Decimal(2);s.derivedState.updateTemp();});
    await jars.click();
    await expect(page.locator('.event-log')).toContainText('Spent 1 Craft');
    await expect(jars).toBeDisabled();
    await page.evaluate(()=>gameUI.session.advance(11));
    expect(await page.evaluate(()=>gameUI.session.saveState.player.water.storage)).toBe(0);
    await page.evaluate(()=>gameUI.session.advance(1));
    expect(await page.evaluate(()=>gameUI.session.saveState.player.water.storage)).toBe(1);
    await expect(jars).toBeEnabled();
    await expect(jars.locator('.project-cost')).toContainText('16');
    expect(await page.evaluate(()=>gameUI.session.saveState.player.craft.points.toNumber())).toBe(1);
    for(const width of [1280,320]){
        await page.setViewportSize({width,height:800});
        await expect(jars).toBeVisible();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await page.screenshot({path:'test-results/earthenware-jars-'+width+'.png',fullPage:true});
    }
    expect(errors).toEqual([]);
});

test('the opening uses every worker, sells baskets for one Craft each and hides later resources',async({page})=>{
    const errors=await open(page);
    await expect(page.locator('.chapter')).toContainText('v0.8');
    await expect(page.getByTestId('available-workers')).toContainText('5 workers available');
    await expect(page.getByTestId('worker-ledger')).not.toContainText('domestic');
    for(const name of ['Money','Time','Education','Culture'])await expect(node(page,name)).toHaveCount(0);
    const baskets=page.getByRole('button',{name:/^Weave food baskets/});
    await expect(baskets).toContainText('1 Craft');
    await expect(baskets).toBeDisabled();
    await page.evaluate(()=>{
        const s=gameUI.session,p=s.saveState.player;
        p.craft.points=new Decimal(2);p.organization.points=new Decimal(2);
        s.derivedState.updateTemp();
    });
    await baskets.click();
    expect(await page.evaluate(()=>gameUI.session.saveState.player.craft.points.toNumber())).toBe(1);
    await page.evaluate(()=>gameUI.session.advance(14));
    await expect(baskets).toBeEnabled();
    await expect(baskets).toContainText('1 Craft per basket');
    await baskets.click();
    expect(await page.evaluate(()=>gameUI.session.saveState.player.craft.points.toNumber())).toBe(0);
    await page.evaluate(()=>gameUI.session.advance(20));
    expect(await page.evaluate(()=>gameUI.session.saveState.player.food.storage)).toBe(2);
    await expect(baskets).toBeDisabled();
    await node(page,'Shelter').click();
    await expect(page.getByText('Domestic work',{exact:true})).toHaveCount(0);
    await expect(page.getByRole('button',{name:/Improve existing homes/})).toHaveCount(0);
    for(const name of ['Money','Time','Education','Culture'])await expect(node(page,name)).toHaveCount(0);
    for(const width of [1280,320]){
        await page.setViewportSize({width,height:800});
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await page.screenshot({path:'test-results/opening-economy-'+width+'.png',fullPage:true});
    }
    expect(errors).toEqual([]);
});

test('Food buyables show distinct tradeoffs and enforce Craft and lifetime Organization costs',async({page})=>{
    const errors=await open(page);
    const explore=page.getByRole('button',{name:/^Explore farther afield/});
    const hunt=page.getByRole('button',{name:/^Hunt bigger game/});
    const traps=page.getByRole('button',{name:/^Weave river traps/});
    await expect(explore).toContainText('trip time by 1.2 and yield by 1.5');
    await expect(hunt).toContainText('Requires 1 lifetime Organization');
    await expect(hunt).toBeDisabled();
    await expect(traps).toContainText('1 Craft');
    await expect(traps).toBeDisabled();
    await page.evaluate(()=>{
        const s=gameUI.session,p=s.saveState.player;
        p.craft.points=new Decimal(1);p.organization.total=new Decimal(1);
        s.derivedState.updateTemp();
    });
    await expect(hunt).toBeEnabled();
    await expect(traps).toBeEnabled();
    await traps.click();
    await expect(page.locator('.event-log')).toContainText('Spent 1 Craft');
    await expect(traps).toBeDisabled();
    await page.evaluate(()=>gameUI.session.advance(14));
    await expect(traps).toContainText('River trap level 1');
    await expect(traps).toContainText('2 Craft');
    await expect(traps).toBeDisabled();
    await hunt.click();
    await page.evaluate(()=>gameUI.session.advance(14));
    await expect(hunt).toContainText('Requires 2 lifetime Organization');
    await expect(hunt).toBeDisabled();
    for(const width of [1280,320]){
        await page.setViewportSize({width,height:800});
        await expect(traps).toBeVisible();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await page.screenshot({path:'test-results/food-buyables-'+width+'.png',fullPage:true});
    }
    expect(errors).toEqual([]);
});
test('fresh game renders the resource tree, shared labor and current growth constraint',async({page})=>{
    const errors=await open(page);
    await expect(page.getByTestId('population')).toHaveText('5');
    for(const name of ['Money','Time','Education','Culture'])await expect(node(page,name)).toHaveCount(0);
    await node(page,'Water').click();
    await expect(page.locator('#resource-title')).toHaveText('Water');
    await expect(page.getByText('Population upkeep',{exact:true})).toBeVisible();
    await page.evaluate(()=>gameUI.session.advance(60));
    await expect(page.getByTestId('population')).toHaveText('8');
    await expect(page.getByText('Growth paused',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Shelter',exact:true}).click();
    await expect(page.locator('#resource-title')).toHaveText('Shelter');
    expect(errors).toEqual([]);
});
test('construction and timely supply crews grow a settlement without exhausting reserves',async({page})=>{
    const errors=await open(page);
    await page.getByRole('button',{name:'Send Gather',exact:true}).click();
    await page.getByRole('button',{name:/Improve provisioning/}).click();
    await node(page,'Water').click();await page.getByRole('button',{name:'Send Collect water',exact:true}).click();
    await page.evaluate(()=>gameUI.session.advance(20));
    await page.getByRole('button',{name:/Improve the well/}).click();
    await page.getByRole('button',{name:'Send Collect water',exact:true}).click();
    await node(page,'Food').click();await page.getByRole('button',{name:'Send Gather',exact:true}).click();
    await page.evaluate(()=>gameUI.session.advance(20));
    await node(page,'Shelter').click();await page.getByRole('button',{name:/Build a new hut/}).click();
    await page.evaluate(()=>gameUI.session.advance(40));
    expect(await page.evaluate(()=>gameUI.session.saveState.player.shelter.points.toNumber())).toBe(12);
    expect(await page.evaluate(()=>gameUI.session.saveState.player.points.toNumber())).toBeGreaterThan(8);
    await expect(page.getByTestId('shortage-warning')).toHaveCount(0);
    expect(errors).toEqual([]);
});

test('prestige preview, cancellation and confirmation match retained game state',async({page})=>{
    const errors=await open(page);
    // Synthetic prepared economy isolates the destructive-action UI contract.
    await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.points=new Decimal(12);p.food.points=new Decimal(50);p.water.points=new Decimal(50);p.food.routes.gather=2;p.shelter.homes=1;p.shelter.points=new Decimal(12);});
    await node(page,'Craft').click();
    await expect(page.getByTestId('prestige-reset-preview')).toContainText('Explore farther afield');
    await expect(page.getByTestId('prestige-keep-preview')).toContainText('permanent upgrades; Craft, Organization');
    page.once('dialog',dialog=>dialog.dismiss());
    await page.getByRole('button',{name:'Develop Craft',exact:true}).click();
    expect(await page.evaluate(()=>gameUI.session.saveState.player.food.points.toNumber())).toBe(50);
    expect(await page.evaluate(()=>gameUI.session.saveState.player.food.routes.gather)).toBe(2);
    page.once('dialog',async dialog=>{expect(dialog.message()).toContain('Population returns to 5');await dialog.accept();});
    await page.getByRole('button',{name:'Develop Craft',exact:true}).click();
    expect(await page.evaluate(()=>gameUI.session.saveState.player.points.toNumber())).toBe(5);
    expect(await page.evaluate(()=>gameUI.session.saveState.player.food.points.toNumber())).toBe(10);
    expect(await page.evaluate(()=>gameUI.session.saveState.player.food.routes.gather)).toBe(0);
    expect(await page.evaluate(()=>gameUI.session.saveState.player.shelter.homes)).toBe(0);
    await expect(page.getByRole('button',{name:'Develop Craft',exact:true})).toBeDisabled();
    expect(errors).toEqual([]);
});

test('Organization previews exact buyable protection earned by the next milestone',async({page})=>{
    const errors=await open(page);
    await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.points=new Decimal(24);p.shelter.homes=4;p.shelter.points=new Decimal(24);p.food.routes.gather=2;p.water.sites=2;p.water.storage=2;p.organization.total=new Decimal(3);p.food.points=new Decimal(50);p.water.points=new Decimal(50);});
    await node(page,'Organization').click();
    await expect(page.getByRole('heading',{name:'Organization milestones',exact:true})).toBeVisible();
    await expect(page.getByTestId('prestige-keep-preview')).toContainText('Earthenware jars');
    await expect(page.getByTestId('prestige-keep-preview')).not.toContainText('Well improvements');
    await expect(page.getByTestId('prestige-reset-preview')).toContainText('Explore farther afield');
    await expect(page.getByText('4 Organization · Gravity-fed spring · Locked',{exact:true})).toBeVisible();
    page.once('dialog',dialog=>dialog.accept());
    await page.getByRole('button',{name:'Develop Organization',exact:true}).click();
    await expect(page.getByText('4 Organization · Gravity-fed spring · Earned',{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>gameUI.session.saveState.player.water.storage)).toBe(2);
    expect(await page.evaluate(()=>gameUI.session.saveState.player.water.sites)).toBe(0);
    expect(await page.evaluate(()=>gameUI.session.saveState.player.food.routes.gather)).toBe(0);
    await page.evaluate(()=>{gameUI.session.saveState.player.organization.points=new Decimal(0);});
    await expect(page.getByText('4 Organization · Gravity-fed spring · Earned',{exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:/^Auto-build:/})).toHaveCount(0);
    expect(errors).toEqual([]);
});

test('fresh milestones reveal the agreed three upgrades and both overseers',async({page})=>{
 const errors=await open(page,false);
 await expect(page.getByRole('button',{name:'Send Hunt',exact:true})).toHaveCount(0);
 await node(page,'Shelter').click();await expect(page.getByRole('button',{name:/Build a new hut/})).toHaveCount(0);
 await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.organization.total=new Decimal(1);gameUI.session.derivedState.updateTemp();});
 for(const name of ['Cord lashings','Timber frames','Construction tools'])await expect(page.getByRole('button',{name:new RegExp('^'+name)})).toBeVisible();
 await expect(page.getByRole('button',{name:/^Abundance/})).toHaveCount(0);
 await node(page,'Food').click();await expect(page.getByRole('button',{name:'Send Hunt',exact:true})).toHaveCount(0);
 await page.evaluate(()=>{gameUI.session.saveState.player.organization.total=new Decimal(2);gameUI.session.derivedState.updateTemp();});
 await expect(page.getByRole('button',{name:'Send Hunt',exact:true})).toBeVisible();
 for(const name of ['Digging sticks','Spear hunting','Butchery tools'])await expect(page.getByRole('button',{name:new RegExp('^'+name)})).toBeVisible();
 await expect(page.getByRole('slider')).toHaveCount(0);
 await page.evaluate(()=>{gameUI.session.saveState.player.organization.total=new Decimal(3);gameUI.session.derivedState.updateTemp();});
 await expect(page.getByLabel('Gather repeats remaining:')).toBeVisible();
 await expect(page.getByRole('button',{name:/^Extended expeditions/})).toContainText('2 Organization');
 await node(page,'Shelter').click();await expect(page.getByLabel('Hut repeats remaining:')).toBeVisible();
 await expect(page.getByRole('button',{name:/^Prepared materials/})).toContainText('1 Organization');
 await node(page,'Organization').click();await expect(page.getByRole('button',{name:/^Work rosters/})).toContainText('3 Organization');
 await expect(page.getByText(/Craft upgrades/)).toHaveCount(0);expect(errors).toEqual([]);
});

test('save, reload, native save dialog and denied import preserve progress',async({page})=>{
    const errors=await open(page);
    await page.evaluate(()=>{gameUI.session.advance(30);localStorage.setItem('ptr','keep-original');});
    await page.getByRole('button',{name:'Save',exact:true}).click();
    await expect(page.locator('#save-status')).toContainText('Saved');
    const population=await page.getByTestId('population').textContent();
    await page.reload();await expect(page.getByTestId('population')).toHaveText(population);
    expect(await page.evaluate(()=>localStorage.getItem('ptr'))).toBe('keep-original');
    await page.getByRole('button',{name:'Settlements',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Your settlements'});await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('button',{name:'Settlements',exact:true})).toBeFocused();
    await page.getByRole('button',{name:'Settings',exact:true}).click();
    page.once('dialog',dialog=>dialog.accept('invalid-save'));
    page.on('dialog',dialog=>{if(dialog.type()==='alert')dialog.accept();});
    await page.getByRole('button',{name:'Import save',exact:true}).click();
    await expect(page.getByTestId('population')).toHaveText(population);
    expect(errors).toEqual([]);
});
test('keyboard navigation and narrow reflow retain named, usable controls',async({page})=>{
    const errors=await open(page);
    for(const width of [1280,768,375,320]){
        await page.setViewportSize({width,height:900});
        await node(page,'Water').focus();await page.keyboard.press('Enter');
        await expect(page.locator('#resource-title')).toHaveText('Water');
        await expect(page.getByRole('button',{name:'Send Collect water',exact:true})).toBeVisible();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
    }
    await page.selectOption('#priority','food');
    expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.priority)).toBe('food');
    await page.emulateMedia({reducedMotion:'reduce'});
    await expect(page.getByRole('button',{name:'Send Collect water',exact:true})).toBeVisible();
    expect(errors).toEqual([]);
});
test('corrupt Civ storage shows recovery while preserving original bytes',async({page})=>{
    await page.addInitScript(()=>localStorage.setItem('civ-prestige-tree','damaged-civ-save'));
    await page.goto('/');await expect(page.getByRole('heading',{name:'Recover your settlement'})).toBeVisible();
    expect(await page.evaluate(()=>localStorage.getItem('civ-prestige-tree'))).toBe('damaged-civ-save');
    await expect(page.locator('#save-original')).toHaveValue('damaged-civ-save');
});

test('Civ retains the actual base theme and component styling',async({page})=>{
    await open(page);
    const styles=await page.evaluate(()=>({
        background:getComputedStyle(document.body).backgroundColor,
        family:getComputedStyle(document.body).fontFamily,
        radius:getComputedStyle(document.querySelector('.treeNode')).borderRadius,
        style:document.querySelector('#styleStuff').getAttribute('href'),
    }));
    expect(styles.background).toBe('rgb(15, 15, 15)');
    expect(styles.family).toContain('monospace');
    expect(styles.radius).toBe('50%');
    expect(styles.style).toBe('style.css');
    await expect(page.getByRole('button',{name:/Improve provisioning/})).toHaveClass(/upg/);
});

test('reloading the selected player invalidates every derived UI summary',async({page})=>{
    const errors=await open(page);
    await page.getByRole('button',{name:'Save',exact:true}).click();
    await page.evaluate(()=>gameUI.session.advance(60));
    await expect(page.getByTestId('population')).toHaveText('8');
    await page.evaluate(()=>{gameUI.commands.load();gameUI.session.runtimeServices.gameRuntime.stop();});
    await expect(page.getByTestId('population')).toHaveText('5');
    await page.evaluate(()=>gameUI.session.advance(12));
    await expect(page.getByTestId('population')).toHaveText('6');
    expect(errors).toEqual([]);
});

test('runtime faults disable the visible economy and retain the last durable save',async({page})=>{
    await open(page);
    await page.getByRole('button',{name:'Save',exact:true}).click();
    const durable=await page.evaluate(()=>localStorage.getItem('civ-prestige-tree'));
    page.on('dialog',dialog=>dialog.accept());
    await page.evaluate(()=>{
        const s=gameUI.session;
        s.layerRegistry.layers.food.update=()=>{throw new Error('Synthetic rule fault');};
        s.runtimeServices.gameRuntime.start();
    });
    await expect(page.locator('#save-status')).toContainText(/Reload/i);
    await expect(page.locator('main')).toHaveAttribute('inert','');
    expect(await page.evaluate(()=>localStorage.getItem('civ-prestige-tree'))).toBe(durable);
});

test('expedition controls reserve parallel crews, block overbooking and release workers',async({page})=>{
    const errors=await open(page);
    await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.points=new Decimal(7);});
    await page.getByRole('button',{name:'Send Gather',exact:true}).click();
    await page.getByRole('button',{name:'Send Hunt',exact:true}).click();
    await page.getByRole('button',{name:'Send Fish',exact:true}).click();
    await expect(page.getByRole('button',{name:'Recall Gather',exact:true})).toBeVisible();
    await node(page,'Water').click();
    await expect(page.getByRole('button',{name:'Send Collect water',exact:true})).toBeDisabled();
    await page.evaluate(()=>gameUI.session.advance(10));
    await expect(page.getByRole('button',{name:'Send Collect water',exact:true})).toBeEnabled();
    await page.getByRole('button',{name:'Send Collect water',exact:true}).click();
    await expect(page.getByRole('button',{name:'Recall Collect water',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Recall Collect water',exact:true}).click();
    expect(await page.evaluate(()=>gameUI.session.modRules.civilization.supply().workers.water)).toBe(0);
    expect(errors).toEqual([]);
});

test('overseer controls repeat staffed trips and Water upgrades remove hauling work',async({page})=>{
    const errors=await open(page);
    // Prepared resources isolate actual purchase/repeat controls; fresh legal
    // reachability and pacing are covered by the balance policy tests.
    await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.craft.points=new Decimal(10);p.organization.points=new Decimal(3);p.organization.total=new Decimal(6);p.food.points=new Decimal(50);p.water.points=new Decimal(50);});
    await expect(page.getByRole('button',{name:/^Expedition overseer/})).toHaveCount(0);
    await page.getByLabel('Gather repeats remaining:').focus();await page.keyboard.press('End');
    await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.craft.points=new Decimal(0);p.food.points=new Decimal(0);gameUI.session.advance(22);});
    expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.actions.gather.completed)).toBeGreaterThanOrEqual(2);
    expect(await page.evaluate(()=>gameUI.session.modRules.civilization.supply().workers.food)).toBe(2);
    await node(page,'Water').click();
    await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.food.points=new Decimal(50);p.craft.points=new Decimal(2);});
    await page.getByRole('button',{name:/^Gravity-fed spring/}).click();
    await expect(page.getByText('Gravity-fed flow is fully automatic and uses 0 workers.',{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>gameUI.session.modRules.civilization.supply().workers.water)).toBe(0);
    expect(errors).toEqual([]);
});

test('shortage warning counts down grace, shows accelerating loss and clears on resupply',async({page})=>{
    const errors=await open(page);
    await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.points=new Decimal(10);p.food.points=new Decimal(0);p.water.points=new Decimal(50);gameUI.session.advance(9);});
    await expect(page.getByTestId('shortage-warning')).toContainText('Grace period: 1s');
    await page.evaluate(()=>gameUI.session.advance(1));
    await expect(page.getByTestId('population')).toHaveText('9');
    await expect(page.getByTestId('shortage-warning')).toContainText('Next population loss: 8s');
    await page.evaluate(()=>{gameUI.session.saveState.player.food.points=new Decimal(50);gameUI.session.advance(1);});
    await expect(page.getByTestId('shortage-warning')).toHaveCount(0);
    expect(errors).toEqual([]);
});

test('Hut foreman replaces Water keeper and repeats staffed construction with a keyboard slider',async({page})=>{
    const errors=await open(page);
    await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.points=new Decimal(12);p.craft.points=new Decimal(1);p.organization.total=new Decimal(4);p.food.points=new Decimal(50);p.water.points=new Decimal(50);gameUI.session.derivedState.updateTemp();});
    await node(page,'Water').click();
    await expect(page.getByRole('button',{name:/Water keeper/i})).toHaveCount(0);
    await expect(page.getByRole('slider')).toHaveCount(0);
    await node(page,'Shelter').click();
    await expect(page.getByRole('button',{name:/^Hut foreman/})).toHaveCount(0);
    const slider=page.getByLabel('Hut repeats remaining:');
    await slider.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue('2');
    await page.evaluate(()=>gameUI.session.advance(1));
    expect(await page.evaluate(()=>gameUI.session.modRules.civilization.supply().foremanWorkers)).toBe(1);
    expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.projectWorkers)).toBe(1);
    await expect(slider).toHaveValue('1');
    await page.evaluate(()=>gameUI.session.advance(40));
    await expect(slider).toHaveValue('0');
    expect(await page.evaluate(()=>gameUI.session.saveState.player.shelter.homes)).toBe(2);
    expect(await page.evaluate(()=>gameUI.session.modRules.civilization.supply().foremanWorkers)).toBe(0);
    await node(page,'Craft').click();
    await expect(page.getByTestId('prestige-reset-preview')).toContainText('Food and hut repeat orders switch off');
    page.once('dialog',dialog=>dialog.accept());
    await page.getByRole('button',{name:'Develop Craft',exact:true}).click();
    await expect(page.getByTestId('population')).toHaveText('5');
    expect(errors).toEqual([]);
});


test('Food sliders count down queued repeats, finish current jobs and stop at zero',async({page})=>{
    const errors=await open(page);
    await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.points=new Decimal(30);p.civ.improvements.overseer=true;p.civ.improvements.farming=true;p.civ.improvements.gravity=true;p.food.points=new Decimal(10);p.water.points=new Decimal(50);gameUI.session.derivedState.updateTemp();});
    for(const name of ['Gather','Hunt']){
        const slider=page.getByLabel(name+' repeats remaining:');
        await slider.focus();await page.keyboard.press('End');
        await expect(slider).toHaveValue('5');
    }
    await page.evaluate(()=>gameUI.session.advance(1));
    expect(await page.evaluate(()=>gameUI.session.modRules.civilization.supply().overseerWorkers)).toBe(1);
    expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.actions.gather.jobs)).toBe(1);
    expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.actions.hunt.workers)).toBe(3);
    await expect(page.getByLabel('Gather repeats remaining:')).toHaveValue('4');
    await expect(page.getByLabel('Hunt repeats remaining:')).toHaveValue('4');
    await page.evaluate(()=>gameUI.session.advance(1));
    await expect(page.getByLabel('Gather repeats remaining:')).toHaveValue('4');
    const gather=page.getByLabel('Gather repeats remaining:');
    await gather.focus();await page.keyboard.press('Home');
    expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.actions.gather.jobs)).toBe(1);
    await expect(page.getByLabel('Fish repeats remaining:')).toHaveValue('0');
    await expect(page.getByLabel('Farm repeats remaining:')).toHaveValue('0');
    for(const width of [1280,320]){
        await page.setViewportSize({width,height:800});
        await expect(page.getByLabel('Hunt repeats remaining:')).toBeVisible();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await page.screenshot({path:'test-results/food-orders-'+width+'.png',fullPage:true});
    }
    await page.evaluate(()=>gameUI.session.advance(125));
    await expect(page.getByLabel('Hunt repeats remaining:')).toHaveValue('0');
    await page.evaluate(()=>{const s=gameUI.session;for(let i=0;i<100&&s.saveState.player.civ.actions.hunt.completed<5;i++)s.advance(1);});
    expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.actions.hunt.completed)).toBe(5);
    await page.evaluate(()=>gameUI.session.advance(30));
    expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.actions.hunt.completed)).toBe(5);
    expect(errors).toEqual([]);
});

test('Organization uses Population in its requirement, eligibility and exact next milestone',async({page})=>{
    const errors=await open(page);
    await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.points=new Decimal(7);p.shelter.homes=10;p.shelter.points=new Decimal(48);gameUI.session.derivedState.updateTemp();});
    await node(page,'Organization').click();
    const develop=page.getByRole('button',{name:'Develop Organization',exact:true});
    await expect(develop).toBeDisabled();
    await expect(page.getByText(/8 Population; gain exactly 1 Organization/)).toBeVisible();
    await page.evaluate(()=>{const p=gameUI.session.saveState.player;p.points=new Decimal(8);p.shelter.homes=0;p.shelter.points=new Decimal(8);gameUI.session.derivedState.updateTemp();});
    await expect(develop).toBeEnabled();
    page.once('dialog',dialog=>dialog.accept());await develop.click();
    await expect(page.getByTestId('population')).toHaveText('5');
    await expect(page.getByText(/12 Population; gain exactly 1 Organization/)).toBeVisible();
    expect(await page.evaluate(()=>gameUI.session.saveState.player.organization.total.toNumber())).toBe(1);
    expect(errors).toEqual([]);
});


test('Craft panel describes spending without an automatic production bonus',async({page})=>{
    const errors=await open(page);
    await node(page,'Craft').click();
    await expect(page.getByText('Craft is spent on upgrades and construction. Holding Craft does not increase production.',{exact:true})).toBeVisible();
    await expect(page.getByText(/Each Craft adds 18%/)).toHaveCount(0);
    expect(errors).toEqual([]);
});


for(const version of ['v06','v07']){
 test('v0.8 browser startup accepts the historical '+version+' save',async({page})=>{
    const input=require('../fixtures/civ-v08-migration.json')[version];
    await page.addInitScript(encoded=>localStorage.setItem('civ-prestige-tree',encoded),input);
    const errors=await open(page);
    await expect(page.locator('.chapter')).toContainText('v0.8');
    await expect(page.locator('#save-recovery')).toBeHidden();
    expect(await page.evaluate(()=>gameUI.session.saveState.player.version)).toBe('0.8');
    expect(await page.evaluate(()=>Object.hasOwn(gameUI.session.saveState.player.civ.improvements,'fishing'))).toBe(false);
    expect(await page.evaluate(()=>Object.hasOwn(gameUI.session.saveState.player.civ.improvements,'wellLining'))).toBe(false);
    expect(errors).toEqual([]);
 });
}
