const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { test } = require('node:test');
const { createRuntime, loadedRuntime, root, scripts } = require('../support/game-runtime.cjs');
const { historicalSources } = require('../support/historical-sources.cjs');
const { expressionContract, functionContract, normalizeContract, sessionOwners } = require('../support/ownership-contract.cjs');

const parent = '7ee437d2101a507e5c610406f059e4df682cf692';
const before = historicalSources(parent);
const manifestPath = 'js/layers/manifest.js';
const manifest = fs.readFileSync(path.join(root, manifestPath), 'utf8');
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const keys = r => JSON.parse(r.run('JSON.stringify(Object.keys(layers))'));

// Include undefined, nonfinite numbers, function source and every own key in
// order. This compares the complete authored contract, not a selected key list.
const contract = `JSON.stringify((function encode(value) {
  if (typeof value === 'function') return {functionSource: value.toString()};
  if (value === undefined) return {type: 'undefined'};
  if (typeof value === 'number' && !Number.isFinite(value)) return {number: String(value)};
  if (value instanceof Decimal) return {decimal: value.toString()};
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === 'object') return Object.entries(value).map(([key,item]) => [key,encode(item)]);
  return value;
})(layers))`;

test('every baseline registration, function, field and ordered contract survives the move', t => {
  const old = loadedRuntime(before); const current = loadedRuntime();
  t.after(old.dispose); t.after(current.dispose);
  assert.equal(keys(old).length, 35, 'Refresh the characterized baseline deliberately when source changes');
  assert.deepEqual(keys(current), keys(old));
  const owners = sessionOwners(current);
  assert.deepEqual(normalizeContract(current.run(contract), owners), normalizeContract(old.run(contract), owners));
  assert.equal(current.run('JSON.stringify(player)'), old.run('JSON.stringify(player)'));
  for (const value of ['JSON.stringify(hotkeys)', 'JSON.stringify(ROW_LAYERS)', 'JSON.stringify(TREE_LAYERS)', 'JSON.stringify(OTHER_LAYERS)']) {
    assert.equal(current.run(value), old.run(value));
  }
  t.diagnostic(JSON.stringify({entries:keys(current),completeContractSha256:digest(current.run(contract))}));
});

test('the shipped page and real-script harness execute the one manifest with one named owner per entry', t => {
  const r = createRuntime(); t.after(r.dispose);
  const entries = JSON.parse(r.run('JSON.stringify(gameLayerManifest.map(entry => ({id:entry.id, factory:entry.create.name})))'));
  assert.deepEqual(entries.map(entry => entry.id), keys(r));
  assert.equal(new Set(entries.map(entry => entry.id)).size, entries.length);
  assert.equal(scripts.filter(file => file === manifestPath).length, 1);
  assert.equal(fs.existsSync(path.join(root, 'js/layers.js')), false);
  assert.ok(!scripts.includes('js/layers.js'));
  for (const entry of entries) {
    const owners = scripts.filter(file => fs.readFileSync(path.join(root,file),'utf8').includes(`function ${entry.factory}(`));
    assert.equal(owners.length, 1, `${entry.id} needs one named content owner`);
    assert.match(owners[0], /^js\/layers\/[a-z-]+\.js$/);
    assert.ok(scripts.indexOf(owners[0]) < scripts.indexOf(manifestPath));
    const source = fs.readFileSync(path.join(root, owners[0]), 'utf8');
    assert.ok(!/^add(?:Layer|Node)\(/m.test(source), 'Content files must not register independently');
  }
  assert.equal(r.intervals.size, 0);
  assert.equal(r.listeners.size, 0);
});

test('every layer preserves the complete immutable SIM01 formula AST apart from owner qualifiers and lexical bindings', () => {
  const source = before.sources['js/layers.js'];
  const starts = [...source.matchAll(/^addLayer\("([^"]+)", /gm)];
  const r = createRuntime();
  try {
    for (let index = 0; index < starts.length; index++) {
      const call = source.slice(starts[index].index, starts[index+1]?.index ?? source.length).trimEnd();
      const literal = call.slice(call.indexOf('{'), call.lastIndexOf('}')+1);
      const factory = r.run(`gameLayerManifest.find(entry => entry.id === ${JSON.stringify(starts[index][1])}).create.name`);
      const owner = scripts.find(file => fs.readFileSync(path.join(root,file),'utf8').includes(`function ${factory}(`));
      const moved = fs.readFileSync(path.join(root,owner),'utf8');
      const actual = moved.slice(moved.indexOf('return ')+7, moved.lastIndexOf(';\n}'));
      assert.deepEqual(expressionContract(actual,sessionOwners(r)),expressionContract(literal,sessionOwners(r)),starts[index][1]);
    }
    assert.equal(starts.length, 31);
  } finally { r.dispose(); }
});

test('isolated omission fails completeness and duplicate registration fails before mutating the registry', t => {
  const old = createRuntime(before); t.after(old.dispose);
  const line = manifest.split('\n').find(text => text.includes('id: "p"'));
  assert.ok(line);
  const omitted = createRuntime({sources:{[manifestPath]:manifest.replace(line,'')}}); t.after(omitted.dispose);
  assert.throws(() => assert.deepEqual(keys(omitted), keys(old)), {code:'ERR_ASSERTION'});
  assert.ok(!keys(omitted).includes('p'));
  const duplicate = manifest.replace(line, `${line}\n${line}`);
  const r = createRuntime({sources:{[manifestPath]:duplicate},scriptOrder:scripts.filter(file=>file!=='js/browser-entry.js'),bridge:false}); t.after(r.dispose);
  r.run('var emptyRegistry=createLayerRegistry({gameHelpers:{},gameRules:{},saveState:{}});');
  assert.throws(()=>r.run('registerGameLayers(emptyRegistry,{})'), /Duplicate layer ID: p/);
  assert.equal(r.run('Object.keys(emptyRegistry.layers).length'), 0, 'Duplicate manifest must fail before partial registration');
  t.diagnostic('Omitted p: completeness assertion FAIL detected; duplicate p: explicit rejection, zero registrations (in-memory only)');
});

test('conflicting registration and a missing factory fail explicitly, without overwriting content', t => {
  const r = createRuntime(); t.after(r.dispose);
  const initial = r.run(contract);
  assert.throws(() => r.run('registerActiveGameLayers()'), /Layer already registered: info-tab/);
  assert.equal(r.run(contract), initial);
  const invalid = manifest.replace('create: createPrestigeLayer', 'create: undefined');
  const missing = createRuntime({sources:{[manifestPath]:invalid},scriptOrder:scripts.filter(file=>file!=='js/browser-entry.js'),bridge:false}); t.after(missing.dispose);
  missing.run('var emptyRegistry=createLayerRegistry({gameHelpers:{},gameRules:{},saveState:{}});');
  assert.throws(()=>missing.run('registerGameLayers(emptyRegistry,{})'), /Missing layer factory: p/);
  assert.equal(missing.run('Object.keys(emptyRegistry.layers).length'), 0);
});

test('the standalone demo retains its exact utility/tree registry contracts and order', t => {
  const demoTree = 'js/Demo/demoTree.js';
  const oldScripts = ['js/technical/break_eternity.js','js/technical/layerSupport.js',demoTree];
  const sources = Object.fromEntries(oldScripts.map(file => [file,
    execFileSync('git',['show',`${parent}:${file}`],{cwd:root,encoding:'utf8'})]));
  const old = createRuntime({scriptOrder:oldScripts,sources}); t.after(old.dispose);
  const current = createRuntime({scriptOrder:[...oldScripts.slice(0,2),
    'js/layers/info-tab.js','js/layers/options-tab.js',demoTree],bridge:false}); t.after(current.dispose);
  current.run(`var layerRegistry=createLayerRegistry({gameHelpers:{},gameRules:{},saveState:{}});
    createDemoTree({}).register({layerRegistry,saveState:{}}); var layers=layerRegistry.layers;`);
  assert.deepEqual(keys(current), keys(old));
  const owners={layerRegistry:['TREE_LAYERS'],saveState:['player']};
  assert.deepEqual(normalizeContract(current.run(contract),owners),normalizeContract(old.run(contract),owners));
  const html=fs.readFileSync(path.join(root,'demo.html'),'utf8');
  for (const file of ['js/layers/info-tab.js','js/layers/options-tab.js']) {
    assert.ok(html.indexOf(`src="${file}"`) < html.indexOf('src="js/demo/demoTree.js"'));
  }
});

test('ownership normalization detects changed formula literals and incorrect owner qualifications', () => {
  const owners={saveState:['player']};
  const original=functionContract('effect() { return player.points.add(1); }',owners);
  assert.deepEqual(functionContract('effect() { return saveState.player.points.add(1); }',owners),original);
  assert.notDeepEqual(functionContract('effect() { return saveState.player.points.add(2); }',owners),original);
  assert.notDeepEqual(functionContract('effect() { return unrelated.player.points.add(1); }',owners),original);
});

const settle = 'for (let pass=0; pass<5; pass++) updateTemp();';
const scenarios = [
  {
    name:'early: prestige/booster reset gains, costs, unlock, automation and generator cross-effect',
    setup:`player.points = new Decimal('1e100'); player.p.points = new Decimal('1e12');
      player.p.total = new Decimal('1e15'); player.p.upgrades = [11,12];
      player.b.unlocked = player.g.unlocked = true; player.b.points = new Decimal(8);
      player.b.best = new Decimal(16); player.b.upgrades = [11,12]; player.g.points = new Decimal(9);`,
    read:`({resetGain:tmp.p.resetGain.toString(), boosterReset:tmp.b.resetGain.toString(),
      cost:tmp.b.upgrades[12].cost.toString(), effect:tmp.b.upgrades[12].effect.toString(),
      boosterEffect:tmp.b.effect.toString(), unlocked:tmp.b.upgrades[12].unlocked,
      automation:tmp.b.autoPrestige, resetNothing:tmp.b.resetsNothing, boosters:player.b.points.toString()})`,
    change:`player.g.points = new Decimal(999); player.t.milestones = [3,4]; player.b.auto = true;`,
    action:'advanceActiveGame(captureGameIdentity(), 0.5);',
    check(a,b) {
      assert.equal(a.cost,'7'); assert.equal(a.unlocked,true); assert.equal(a.automation,false);
      assert.equal(b.automation,true); assert.equal(b.resetNothing,true);
      assert.notEqual(a.effect,b.effect); assert.notEqual(a.boosterEffect,b.boosterEffect);
      assert.notEqual(a.resetGain,'0');
    },
  },
  {
    name:'middle: quirk reset, balance upgrade costs/effects/unlock, passive automation and solarity cross-effect',
    setup:`player.g.power = new Decimal('1e1000'); player.q.unlocked = player.e.unlocked = true;
      player.q.points = new Decimal(100); player.q.energy = new Decimal('1e20');
      player.ba.unlocked = true; player.ba.neg = new Decimal('1e30'); player.ba.pos = new Decimal('1e24');
      player.o.unlocked = true; player.o.points = new Decimal(100);`,
    read:`({resetGain:tmp.q.resetGain.toString(), cost:tmp.ba.upgrades[11].cost.toString(),
      effect:tmp.ba.upgrades[11].effect.toString(), unlocked:tmp.ba.upgrades[11].unlocked,
      automation:tmp.q.passiveGeneration, solarPower:tmp.o.solPow.toString(), energy:player.q.energy.toString(), quirks:player.q.points.toString()})`,
    change:'player.ba.milestones = [0,3]; player.ba.upgrades = [11];',
    action:'advanceActiveGame(captureGameIdentity(), 0.5);',
    check(a,b) {
      assert.equal(a.cost,'50000000'); assert.equal(a.unlocked,false); assert.equal(b.unlocked,true);
      assert.equal(a.automation,0); assert.equal(b.automation,1);
      assert.notEqual(a.solarPower,b.solarPower); assert.notEqual(a.effect,'0'); assert.notEqual(a.resetGain,'0');
    },
  },
  {
    name:'late: neuron/robot/AI reset gains, multi-resource costs, unlocks, automation and AI cross-layer effects',
    setup:`for (let id of ['mc','ne','id','r','ai','ge','ma']) player[id].unlocked = true;
      player.ne.points = new Decimal(8); player.ne.thoughts = new Decimal(25);
      player.ne.signals = new Decimal('1e9'); player.ne.buyables[11] = new Decimal(2);
      player.ss.subspace = new Decimal('1e10000000'); player.en.total = new Decimal('1e20');
      player.r.points = new Decimal(10); player.ai.consc = new Decimal(80);
      player.ai.buyables[11] = new Decimal(2); player.id.points = new Decimal(500);`,
    read:`({resetGain:tmp.ne.resetGain.toString(), robotGain:tmp.r.resetGain.toString(), aiGain:tmp.ai.resetGain.toString(),
      costs:tmp.ai.upgrades[11].multiRes.map(item=>item.cost.toString()),
      neuralPower:tmp.ne.buyables[11].power.toString(), unlocked:tmp.ai.upgrades[11].unlocked,
      shown:tmp.ai.layerShown, automation:tmp.ne.autoPrestige, resetsNothing:tmp.ne.resetsNothing,
      robotMultiplier:tmp.r.gainMult.toString(), signals:player.ne.signals.toString(), neurons:player.ne.points.toString()})`,
    change:'player.ne.auto = true; player.ne.activeChallenge = 11; player.ai.upgrades = [11]; player.ai.consc = new Decimal(161);',
    action:'advanceActiveGame(captureGameIdentity(), 0.5);',
    check(a,b) {
      assert.deepEqual(a.costs,['2','5']); assert.equal(a.unlocked,true); assert.equal(a.shown,true);
      assert.equal(a.automation,false); assert.equal(b.automation,true); assert.equal(b.resetsNothing,true);
      assert.equal(a.neuralPower,'1'); assert.equal(b.neuralPower,'1.5');
      assert.equal(a.robotMultiplier,'81'); assert.equal(b.robotMultiplier,'162');
      assert.notEqual(a.resetGain,'0'); assert.notEqual(a.robotGain,'0');
    },
  },
];

for (const scenario of scenarios) {
  test(`before/after real definitions — ${scenario.name}`, t => {
    const outcomes=[];
    for (const options of [before,{}]) {
      const r = loadedRuntime(options); t.after(r.dispose);
      r.run(`gameRuntime.stop(); ${scenario.setup} ${settle}`);
      const read = () => JSON.parse(r.run(`JSON.stringify(${scenario.read})`));
      const initial=read(); const checkpoints=[r.run('JSON.stringify(player)')];
      r.run(`${scenario.change} ${settle}`);
      const changed=read(); checkpoints.push(r.run('JSON.stringify(player)'));
      scenario.check(initial,changed);
      r.run(`${scenario.action} ${settle}`);
      const acted=read(); checkpoints.push(r.run('JSON.stringify(player)'));
      if (scenario.name.startsWith('early')) assert.equal(acted.boosters,'9', 'Real automatic Booster reset must execute');
      if (scenario.name.startsWith('middle')) assert.equal(acted.quirks,'2385', 'Real passive Quirk gain must execute');
      if (scenario.name.startsWith('late')) assert.equal(acted.neurons,'9', 'Real automatic Neuron reset must execute');
      assert.notEqual(checkpoints[1], checkpoints[2], 'Action must exercise actual state changes');
      const result={initial,changed,acted,checkpoints};
      assert.ok(!JSON.stringify([initial,changed,acted,...checkpoints.map(JSON.parse)]).includes('"NaN"'),
        'A broken numeric fixture is not equivalence evidence');
      outcomes.push(result);
    }
    assert.deepEqual(outcomes[1],outcomes[0]);
    t.diagnostic(JSON.stringify({scenario:scenario.name,initial:outcomes[1].initial,changed:outcomes[1].changed,
      acted:outcomes[1].acted,identicalSnapshotsSha256:digest(outcomes[1].checkpoints)}));
  });
}
