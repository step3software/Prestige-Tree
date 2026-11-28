const {test,expect}=require('@playwright/test');

async function open(page, established=false) {
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/');
    await expect(page.getByTestId('population')).toBeVisible();
    await page.evaluate(established=>{
        const s=gameUI.session,p=s.saveState.player;
        s.runtimeServices.gameRuntime.stop();
        if(established){
            p.points=new Decimal(20);p.shelter.homes=4;p.shelter.points=new Decimal(32);
            p.food.points=new Decimal(50);p.water.points=new Decimal(50);
            p.organization.points=new Decimal(10);p.organization.total=new Decimal(10);
            p.craft.points=new Decimal(30);
            for(const id of ['workRosters','extendedExpeditions','abundance','overseer','hutForeman'])p.civ.improvements[id]=true;
        }
        s.derivedState.updateTemp();
    },established);
    return errors;
}
const node=(page,name)=>page.getByRole('button',{name:new RegExp('^'+name+',')});

test('desktop keeps all population status in one compact row and primary actions in view',async({page})=>{
    const errors=await open(page,true);
    for(const viewport of [{width:1280,height:720},{width:1280,height:800},{width:1920,height:1080}]){
        await page.setViewportSize(viewport);
        for(const shortage of [false,true]){
            await page.evaluate(shortage=>{
                const p=gameUI.session.saveState.player;
                p.points=new Decimal(shortage?1:20);p.food.points=new Decimal(shortage?0:50);
                gameUI.session.derivedState.updateTemp();
            },shortage);
            await node(page,'Food').click();await page.evaluate(()=>scrollTo(0,0));
            const geometry=await page.evaluate(()=>{
                const bounds=s=>document.querySelector(s).getBoundingClientRect();
                const row=bounds('.population-banner');
                return {populationHeight:row.height,mastheadHeight:bounds('.masthead').height,
                    gameTop:bounds('.game-layout').top,overflow:document.documentElement.scrollWidth>innerWidth,
                    rowChildren:[...document.querySelector('.population-banner').children].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return r.top>=row.top&&r.bottom<=row.bottom;})};
            });
            expect(geometry.populationHeight).toBeLessThanOrEqual(40);
            expect(geometry.mastheadHeight).toBeLessThanOrEqual(44);
            expect(geometry.gameTop).toBeLessThanOrEqual(96);
            expect(geometry.overflow).toBe(false);
            expect(geometry.rowChildren.every(Boolean)).toBe(true);
            await expect(page.getByRole('button',{name:'Send Gather',exact:true})).toBeInViewport({ratio:1});
            await node(page,'Shelter').click();await page.evaluate(()=>scrollTo(0,0));
            await expect(page.getByRole('button',{name:/^Build a new hut/})).toBeInViewport({ratio:1});
        }
    }
    expect(errors).toEqual([]);
});

test('save success and storage failure reuse the header without shifting gameplay',async({page})=>{
    const errors=await open(page);
    const top=()=>page.locator('.game-layout').evaluate(e=>e.getBoundingClientRect().top);
    const before=await top();
    await page.getByRole('button',{name:'Save',exact:true}).click();
    await expect(page.locator('#save-status')).toHaveText('Saved');
    expect(await top()).toBe(before);
    const original=await page.evaluate(()=>localStorage.getItem('civ-prestige-tree'));
    await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Denied','SecurityError');};});
    await page.getByRole('button',{name:'Save',exact:true}).click();
    await expect(page.locator('#save-status')).toHaveText('Unsaved');
    await page.getByLabel('Save status',{exact:true}).focus();
    await expect(page.getByRole('tooltip').filter({hasText:'unsaved'})).toBeVisible();
    expect(await top()).toBe(before);
    expect(await page.evaluate(()=>localStorage.getItem('civ-prestige-tree'))).toBe(original);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toBeHidden();
    expect(errors).toEqual([]);
});

test('worker warning uses space below the button without displacing permanent controls',async({page})=>{
    const errors=await open(page);
    await page.evaluate(()=>gameUI.session.modRules.civilization.dispatch('gather'));
    await node(page,'Water').click();
    const button=page.getByRole('button',{name:'Send Collect water',exact:true});
    const row=page.locator('.action-row').first();
    for(const width of [1280,390,320]){
        await page.setViewportSize({width,height:844});
        await page.evaluate(()=>{gameUI.session.saveState.player.points=new Decimal(5);});
        const before={button:await button.boundingBox(),stats:await row.locator('.action-stats').boundingBox()};
        await page.evaluate(()=>{gameUI.session.saveState.player.points=new Decimal(2);});
        await expect(button).toBeDisabled();
        const warning=row.locator('.current-blocker');
        await expect(warning).toContainText('Needs');
        const during={button:await button.boundingBox(),stats:await row.locator('.action-stats').boundingBox()};
        expect(during).toEqual(before);
        expect((await warning.boundingBox()).y).toBeGreaterThanOrEqual(during.button.y+during.button.height);
        await page.evaluate(()=>{gameUI.session.saveState.player.points=new Decimal(5);});
        await expect(button).toBeEnabled();
        await expect(warning).toHaveCount(0);
        expect({button:await button.boundingBox(),stats:await row.locator('.action-stats').boundingBox()}).toEqual(before);
    }
    expect(errors).toEqual([]);
});

test('repeat help is attached, dismissible and does not change the finite-queue command',async({page})=>{
    const errors=await open(page,true);await node(page,'Shelter').click();
    const slider=page.getByRole('slider',{name:'Hut repeats remaining:'});
    const before=await page.locator('.game-layout').evaluate(e=>e.getBoundingClientRect().top);
    await slider.focus();
    await expect(page.getByRole('tooltip').filter({hasText:'0 stops new huts'})).toBeVisible();
    expect(await page.locator('.game-layout').evaluate(e=>e.getBoundingClientRect().top)).toBe(before);
    await page.keyboard.press('Escape');await expect(page.getByRole('tooltip')).toBeHidden();
    await page.keyboard.press('End');await expect(slider).toHaveValue('5');
    await page.evaluate(()=>gameUI.session.advance(1));
    await expect(slider).toHaveValue('4');
    await page.keyboard.press('Home');await expect(slider).toHaveValue('0');
    expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.project)).toBe('shelter-home');
    expect(errors).toEqual([]);
});

test('touch help and narrow reflow preserve controls without accidental orders',async({browser})=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    try{
        const page=await context.newPage();const errors=await open(page,true);
        await node(page,'Shelter').tap();
        await page.getByRole('button',{name:'Help: Hut repeats',exact:true}).tap();
        await expect(page.getByRole('tooltip').filter({hasText:'0 stops new huts'})).toBeVisible();
        expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.hutRepeat)).toBe(0);
        expect(await page.evaluate(()=>gameUI.session.saveState.player.civ.project)).toBe('');
        for(const width of [390,320]){
            await page.setViewportSize({width,height:844});
            expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
            await expect(page.getByRole('slider',{name:'Hut repeats remaining:'})).toBeVisible();
            await expect(page.getByRole('button',{name:/^Build a new hut/})).toBeVisible();
        }
        expect(errors).toEqual([]);
    }finally{await context.close();}
});
