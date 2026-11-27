const fs = require('node:fs');
const path = require('node:path');
const {fork} = require('node:child_process');
const {chromium} = require('@playwright/test');

// Same synthetic save, browser, viewport and workload on either code artifact.
// Timings are observations, not a benchmark target or a user study.
async function measure({baseline = false, output}) {
  const root = path.resolve(__dirname, '../..');
  const server = fork(path.join(root, 'tests/support/server.cjs'), [], {cwd: root, stdio: 'ignore'});
  let browser;
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      try { if ((await fetch('http://127.0.0.1:4173/')).ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 50));
      if (attempt === 99) throw new Error('Measurement server did not start');
    }
    browser = await chromium.launch();
    const samples = [];
    for (let trial = 0; trial < 5; trial++) {
      const context = await browser.newContext({viewport: {width:1280, height:800}, serviceWorkers:'block'});
      const page = await context.newPage();
      await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
      await page.addInitScript(() => {
        Date.now = () => 1700000000000;
        if (!localStorage.getItem('ptr')) localStorage.setItem('ptr', btoa(JSON.stringify({set:'save1', save1:{
          time:1700000000000, tab:'p', points:'100', offlineProd:false,
          p:{unlocked:true, points:'1', upgrades:[11]}
        }})));
      });
      await page.goto('http://127.0.0.1:4173/');
      await page.locator('button.p.reset').waitFor();
      const result = await page.evaluate(async () => {
        const session = gameUI.session;
        session.runtimeServices.gameRuntime.stop();
        const startup = performance.now();
        const tickStart = performance.now();
        for (let tick = 0; tick < 20; tick++) session.advance(0.05);
        const ticks = performance.now() - tickStart;
        await Vue.nextTick();
        const renderStart = performance.now();
        session.saveState.player.points = new Decimal(321);
        await Vue.nextTick();
        const text = document.querySelector('#points').textContent;
        if (text !== '321.00') throw new Error('Measured render did not display canonical mutation: '+text);
        return {startupMs:startup, twentyTicksMs:ticks, renderUpdateMs:performance.now()-renderStart, vue:Vue.version};
      });
      samples.push(result);
      if (trial === 0) {
        await page.screenshot({path:output.replace(/\.json$/, '-1280.png'), fullPage:true});
        await page.locator('#optionWheel').click();
        await page.setViewportSize({width:320,height:800});
        await page.screenshot({path:output.replace(/\.json$/, '-320.png'), fullPage:true});
      }
      await context.close();
    }
    const report = {artifact:baseline?'DEV01 inherited baseline':'UI01 packaged artifact',
      environment:{node:process.version,platform:process.platform,browser:browser.version(),viewport:{width:1280,height:800}},
      method:'Five fresh contexts; synthetic early save at fixed game Date.now; loopback cold page load (navigation to control-ready), 20 explicit 0.05-second real ticks, then awaited canonical points DOM mutation. Real performance clock; no retries or target.',
      samples};
    fs.writeFileSync(output, JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report));
    return report;
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}
if (require.main === module) measure({baseline:process.argv.includes('--baseline'),output:path.resolve(process.argv[2])})
  .catch(error=>{console.error(error);process.exitCode=1;});
module.exports = {measure};
