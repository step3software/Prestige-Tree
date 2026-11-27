const { installPausedClock } = require('../support/paused-clock.cjs');
const {test,expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const {loadedRuntime} = require('../support/game-runtime.cjs');
const {historicalSources} = require('../support/historical-sources.cjs');
const root = path.resolve(__dirname,'../..');

test.beforeEach(async ({page})=>{
  await installPausedClock(page);
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  page.testErrors=[];
  page.on('pageerror',error=>page.testErrors.push(error.message));
  page.on('console',message=>{if(['error','warning'].includes(message.type()))page.testErrors.push(message.text());});
});
test.afterEach(async ({page})=>expect(page.testErrors).toEqual([]));
async function start(page){await page.goto('/');await expect(page.locator('#p')).toBeVisible();}
async function options(page){await page.getByRole('button',{name:'Options',exact:true}).click();}
async function importPlayer(page,fixture){
  await options(page);
  page.once('dialog',dialog=>dialog.accept(btoa(JSON.stringify(fixture))));
  await Promise.all([page.waitForEvent('load'),page.getByRole('button',{name:'Import',exact:true}).click()]);
  await expect(page.locator('#p')).toBeVisible();
}

test('delivered page and runtime bytes are identical to the package with external requests blocked',async({page,request})=>{
  const requests=[];page.on('request',r=>requests.push(r.url()));
  await start(page);
  expect(await page.evaluate(()=>Vue.version)).toBe('3.5.46');
  const response=await request.get('/vendor/vue.global.prod.js');
  expect(await response.body()).toEqual(fs.readFileSync(path.join(root,'dist/vendor/vue.global.prod.js')));
  expect(await (await request.get('/')).body()).toEqual(fs.readFileSync(path.join(root,'dist/index.html')));
  expect((await request.get('/test-vue.js')).status()).toBe(404);
  expect(requests.every(url=>new URL(url).hostname==='127.0.0.1')).toBe(true);
  expect(requests.filter(url=>url.endsWith('/vendor/vue.global.prod.js'))).toHaveLength(1);
  expect(await page.evaluate(()=>{
    const s=gameUI.session, instance=s.gameView.app;
    s.gameView.loadVue();gameUI.commands.load();return s.gameView.app===instance;
  })).toBe(true);
});

test('stopped-driver canonical array/cache/status/notification mutations render without copied state or tick polling',async({page})=>{
  await start(page);await page.locator('#p').click();await page.locator('button.p.reset').click();
  await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.stop());
  const begin=page.getByRole('button',{name:/Begin/});await expect(begin).not.toHaveClass(/bought/);
  await page.evaluate(()=>gameUI.session.saveState.player.p.upgrades.push(11));
  await expect(begin).toHaveClass(/bought/);
  await page.evaluate(()=>{
    const s=gameUI.session;
    s.derivedState.tmp.p.upgrades[11].title='Live upgrade title';
    s.derivedState.tmp.displayThings.push('Live derived array');
    s.modRules.addNotification('none','Live notification','UI notification',3);
  });
  await expect(page.getByRole('button',{name:/Live upgrade title/})).toBeVisible();
  await expect(page.locator('#treeOverlay')).toContainText('Live derived array');
  await expect(page.locator('.notification')).toContainText('Live notification');
  expect(await page.evaluate(()=>{
    const s=gameUI.session,p=s.saveState.player;
    return Vue.isReactive(p)&&s.gameView.app.player===p&&s.gameView.app.allSaves===s.saveState.allSaves&&
      s.gameView.app.tmp===s.derivedState.tmp&&p===s.saveState.allSaves[s.saveState.allSaves.set]&&
      p.points instanceof Decimal&&!Vue.isProxy(p.points)&&p.points.add(1).eq(1);
  })).toBe(true);
  await page.evaluate(()=>{gameUI.session.modRules.adjustNotificationTime(4);gameUI.session.gameRules.status.gameEnded=true;});
  await expect(page.getByRole('button',{name:'Keep Going',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Keep Going',exact:true}).click();
  await expect(page.locator('#p')).toBeVisible();
  await page.clock.runFor(350);await expect(page.locator('.notification')).toHaveCount(0);
  await page.evaluate(()=>{
    const s=gameUI.session;s.derivedState.setupTemp();for(let pass=0;pass<3;pass++)s.derivedState.updateTemp();s.gameView.bind();
  });
  await page.locator('#p').click();
  await expect(page.getByRole('button',{name:/Begin/})).toHaveClass(/bought/);
});

for(const [width,oldStyle] of [[1280,false],[768,false],[320,false],[320,true]]) test(`keyboard navigation, modal focus, visible options and canvas resize at ${width}px${oldStyle?' with old style':''}`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:800});
  await start(page);
  if(oldStyle){
    await options(page);await page.getByRole('button',{name:'Display Options',exact:true}).click();
    const styleLoaded=page.waitForResponse(response=>response.url().endsWith('/oldStyle.css'));
    await page.getByRole('button',{name:'Style: NEW',exact:true}).click();await styleLoaded;
    await page.locator('button.back').click();
  }
  const wheel=page.getByRole('button',{name:'Options',exact:true});await page.keyboard.press('Tab');await wheel.focus();
  expect(await wheel.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('Enter');
  if(oldStyle)await page.getByRole('button',{name:'Main Options',exact:true}).click();
  const save=page.getByRole('button',{name:'Save',exact:true});await expect(save).toBeVisible();
  for(const box of await page.locator('button.opt:visible').evaluateAll(elements=>elements.map(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right};}))){
    expect(box.left).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(width+1);
  }
  await save.focus();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:/Autosave:/})).toBeFocused();
  const trigger=page.getByRole('button',{name:'All Save Files',exact:true});await trigger.focus();await page.keyboard.press('Enter');
  const close=page.getByRole('button',{name:'Close save files',exact:true});await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'New Save',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');await expect(close).toBeFocused();
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Rename',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Save files'})).toBeVisible();
  await page.keyboard.press('Escape');await expect(close).toHaveCount(0);await expect(trigger).toBeFocused();
  await page.screenshot({path:testInfo.outputPath(`options-${width}.png`)});
  await page.locator('button.back').click();await expect(page.locator('#p')).toBeVisible();
  await page.clock.runFor(50);
  expect(await page.locator('#treeCanvas').evaluate(el=>[el.width,el.height])).toEqual([width,800]);
  await page.locator('#treeTab').dispatchEvent('scroll');
  await page.setViewportSize({width:width+20,height:720});
  await expect.poll(()=>page.locator('#treeCanvas').evaluate(el=>[el.width,el.height])).toEqual([width+20,720]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.locator('#p').click();await page.locator('.col.right').dispatchEvent('scroll');
  await page.keyboard.down('-');expect(await page.evaluate(()=>gameUI.session.derivedState.tmp.nerdMode)).toBe(true);
  await page.keyboard.up('-');expect(await page.evaluate(()=>gameUI.session.derivedState.tmp.nerdMode)).toBe(false);
});

const fixtures=[
  {name:'early',layer:'b',player:{points:'1e100',p:{points:'1e12',total:'1e15',upgrades:[11,12]},
    b:{unlocked:true,points:'8',best:'16',upgrades:[11,12],auto:true},g:{unlocked:true,points:'999'},t:{milestones:[3,4]}},expected:'9'},
  {name:'middle',layer:'q',player:{points:'10',g:{power:'1e1000'},q:{unlocked:true,points:'100',energy:'1e20',upgrades:[41]},e:{unlocked:true},
    ba:{unlocked:true,neg:'1e30',pos:'1e24',milestones:[0,3],upgrades:[11]},o:{unlocked:true,points:'100'}},expected:'2385'},
  {name:'late',layer:'ne',player:{points:'10',mc:{unlocked:true},ne:{unlocked:true,points:'8',thoughts:'25',signals:'1e9',buyables:{11:'2'},auto:true,activeChallenge:11},
    id:{unlocked:true,points:'500'},r:{unlocked:true,points:'10'},ai:{unlocked:true,consc:'161',buyables:{11:'2'},upgrades:[11]},
    ge:{unlocked:true},ma:{unlocked:true},ss:{subspace:'1e10000000'},en:{total:'1e20'}},expected:'9'},
];
test('the rendered milestone toggle starts and stops the actual Booster automation',async({page})=>{
  const player={...fixtures[0].player,b:{...fixtures[0].player.b,auto:false},
    t:{unlocked:true,points:'8',best:'8',milestones:[0,1,2,3,4]}};
  await start(page);await importPlayer(page,player);await page.locator('#t').click();
  const toggle=page.getByRole('button',{name:'OFF',exact:true});await expect(toggle).toBeVisible();await toggle.click();
  await expect(page.getByRole('button',{name:'ON',exact:true})).toBeVisible();
  await page.clock.runFor(50);
  expect(await page.evaluate(()=>gameUI.session.saveState.player.b.points.gt(8))).toBe(true);
  await page.getByRole('button',{name:'ON',exact:true}).click();
  const stopped=await page.evaluate(()=>gameUI.session.saveState.player.b.points.toString());
  await page.clock.runFor(500);
  expect(await page.evaluate(()=>gameUI.session.saveState.player.b.points.toString())).toBe(stopped);
});

for(const fixture of fixtures) test(`rendered ${fixture.name} imported save retains baseline values, automation, tabs and reload`,async({page})=>{
  // Independent immutable predecessor computes the expected full player outcome.
  const r=loadedRuntime(historicalSources('51a9b96c9949e6d0f96a65d5650ecac575fb9da8'));
  let expected;
  try {
    r.io.prompt=btoa(JSON.stringify(fixture.player));expect(r.run('importSave()')).toBe(true);r.run('load();gameRuntime.stop();');
    r.run(`showTab(${JSON.stringify(fixture.layer)});for(let pass=0;pass<5;pass++)updateTemp();advanceActiveGame(captureGameIdentity(),0.5);`);
    expected=JSON.parse(r.run('JSON.stringify(player)'));
  } finally {r.dispose();}
  await start(page);await importPlayer(page,fixture.player);
  await page.evaluate(layer=>{const s=gameUI.session;s.runtimeServices.gameRuntime.stop();s.gameHelpers.showTab(layer);for(let pass=0;pass<5;pass++)s.derivedState.updateTemp();},fixture.layer);
  await expect(page.locator(`button.${fixture.layer}.reset`)).toBeVisible();
  if(fixture.layer==='q'){
    await page.getByRole('button',{name:'Improvements',exact:true}).click();
    expect(await page.evaluate(()=>gameUI.session.saveState.player.subtabs.q.mainTabs)).toBe('Improvements');
    await page.getByRole('button',{name:'Main Tab',exact:true}).click();
  }
  await page.evaluate(()=>gameUI.session.advance(0.5));
  expect(await page.evaluate(layer=>gameUI.session.saveState.player[layer].points.toString(),fixture.layer)).toBe(fixture.expected);
  const actual=await page.evaluate(()=>JSON.parse(JSON.stringify(gameUI.session.saveState.player)));
  expect(actual).toEqual(expected);
  await options(page);await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.reload();await expect(page.locator('#p')).toBeVisible();
  expect(await page.evaluate(layer=>gameUI.session.saveState.player[layer].points.toString(),fixture.layer)).toBe(fixture.expected);
});

test('export, successful rename and rejected import preserve canonical progress and recovery context',async({page})=>{
  await start(page);await importPlayer(page,{points:'123',p:{unlocked:true,points:'4',upgrades:[11]}});await options(page);
  await page.evaluate(()=>{document.execCommand=command=>{window.copiedExport=document.querySelector('body > textarea').value;return command==='copy';};});
  await page.getByRole('button',{name:'Export to clipboard',exact:true}).click();
  expect(await page.evaluate(()=>JSON.parse(atob(window.copiedExport)).points)).toBe('123');
  await page.getByRole('button',{name:'All Save Files',exact:true}).click();
  page.once('dialog',dialog=>dialog.accept('renamed'));
  await page.getByRole('button',{name:'Rename',exact:true}).click();
  await expect(page.locator('.activeSave')).toHaveText('renamed');
  expect(await page.evaluate(()=>{const s=gameUI.session;return s.saveState.allSaves.set==='renamed'&&s.saveState.player===s.saveState.allSaves.renamed&&s.gameView.app.player===s.saveState.player;})).toBe(true);
  await page.getByRole('button',{name:'Close save files',exact:true}).click();
  const before=await page.evaluate(()=>localStorage.getItem('ptr'));
  page.on('dialog',dialog=>dialog.type()==='prompt'?dialog.accept('!!!'):dialog.accept());
  const button=page.getByRole('button',{name:'Import',exact:true});await button.focus();await page.keyboard.press('Enter');
  expect(await page.evaluate(()=>localStorage.getItem('ptr'))).toBe(before);await expect(button).toBeFocused();
  expect(await page.evaluate(()=>gameUI.session.saveState.player.tab)).toBe('options');
});

test('a scheduled Vue render failure stops owned resources and protects the last durable save until reload',async({page})=>{
  await start(page);await page.locator('#p').click();await page.locator('button.p.reset').click();
  await page.getByRole('button',{name:/Begin/}).click();await page.evaluate(()=>gameUI.commands.save());
  const durable=await page.evaluate(()=>localStorage.getItem('ptr'));
  page.once('dialog',dialog=>dialog.accept());
  await page.evaluate(()=>{
    const s=gameUI.session;
    Object.defineProperty(Vue.toRaw(s.derivedState.tmp.p),'color',{configurable:true,get(){throw new Error('Synthetic Vue render failure');}});
    s.saveState.player.p.points=new Decimal(2);
  });
  await expect(page.locator('#save-status')).toContainText(/Reload/);
  expect(await page.evaluate(()=>gameUI.session.gameRules.tickFaulted)).toBe(true);
  expect(await page.evaluate(()=>gameUI.session.runtimeServices.gameRuntime.state)).toBe('disposed');
  expect(await page.evaluate(()=>gameUI.commands.save())).toBe(false);
  expect(await page.evaluate(()=>localStorage.getItem('ptr'))).toBe(durable);
  await page.reload();await expect(page.locator('#p')).toBeVisible();
  expect(await page.evaluate(()=>gameUI.session.gameRules.tickFaulted)).toBe(false);
});
