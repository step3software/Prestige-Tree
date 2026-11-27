const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const {ESLint} = require('eslint');
const {root, scripts} = require('../tests/support/game-runtime.cjs');

async function main() {
  const lint = new ESLint({cwd:root});
  const valid = await lint.lintText('function lexicalFixture() { let amount = 1; return amount; }', {filePath:'js/game-session.js'});
  assert.equal(valid[0].errorCount, 0, 'Valid lexical fixture must pass before its negative check');
  const invalid = await lint.lintText('accidentalSessionWrite = 1;', {filePath:'js/game-session.js'});
  assert.ok(invalid[0].messages.some(message => message.ruleId === 'no-undef' && message.message.includes('accidentalSessionWrite')));
  console.log('Undeclared-write sensitivity: required no-undef failure detected');

  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'prestige-dev01-static-'));
  try {
    const fixture = path.join(directory,'interface.js');
    const config = path.join(directory,'jsconfig.json');
    fs.writeFileSync(config, JSON.stringify({extends:path.join(root,'jsconfig.json'),files:[...scripts.map(file=>path.join(root,file)),fixture],include:[],exclude:[]}));
    const compiler = path.join(path.dirname(require.resolve('typescript/package.json')),'bin/tsc');
    const check = () => spawnSync(process.execPath,[compiler,'--project',config],{cwd:root,encoding:'utf8'});
    const baseline = '// @ts-check\nconst isolated = createGameSession();\nisolated.purchase("p",11);\nadvanceGame(isolated,1);\n';
    fs.writeFileSync(fixture,baseline);
    const good = check();
    assert.equal(good.status,0,good.stdout+good.stderr);
    fs.writeFileSync(fixture,baseline+'isolated.purchase("p", {id:11});\nisolated.loadPlayer(12);\n');
    const bad = check();
    assert.notEqual(bad.status,0,'Invalid command interfaces escaped static checking');
    assert.match(bad.stdout,/TS2345/);
    assert.match(bad.stdout,/not assignable to parameter of type 'number'/);
    assert.match(bad.stdout,/not assignable to parameter of type 'string'/);
    console.log('Interface sensitivity: invalid purchase ID and save input rejected after a valid same-graph baseline');
    for (const [name, source, diagnostic] of [
      ['GameState Decimal', 'const state=isolated.saveState.player; if(state) state.points=1;', /TS2322/],
      ['derived Decimal', 'isolated.derivedState.tmp.pointGen="invalid";', /TS2322/],
      ['runtime seconds/clock', 'isolated.runtimeServices.observeGameTime({time:0}, "milliseconds");', /TS2345/],
      ['UI command', 'isolated.gameView.bind(1);', /TS2554/],
      ['layer command', 'createPrestigeLayer({saveState:isolated.saveState});', /TS2739/],
    ]) {
      fs.writeFileSync(fixture,baseline+source+'\n');
      const rejected=check();
      assert.notEqual(rejected.status,0,name+' was not checked');
      assert.match(rejected.stdout,diagnostic,name+' failed for an unrelated reason: '+rejected.stdout);
      console.log(name+' interface sensitivity: required failure detected');
    }
  } finally {
    // Only remove the disposable directory created immediately above.
    if (path.dirname(path.resolve(directory)) !== path.resolve(os.tmpdir()) || !path.basename(directory).startsWith('prestige-dev01-static-')) throw new Error('Unsafe temporary cleanup target');
    fs.rmSync(directory,{recursive:true,force:true});
  }
}
main().catch(error => {console.error(error);process.exitCode=1;});
