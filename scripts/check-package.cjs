const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {compile} = require('@vue/compiler-dom');
const {assets} = require('./build.cjs');
const {createRuntime, root, scripts} = require('../tests/support/game-runtime.cjs');

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function walk(directory, prefix = '') {
  return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()
    ?walk(path.join(directory,entry.name),prefix+entry.name+'/'):[prefix+entry.name]).sort();
}
function verifyPackage(directory = path.join(root,'dist')) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory,'package-manifest.json'),'utf8'));
  const vue = require('vue/package.json');
  const expected = require('../package.json').dependencies.vue;
  assert.equal(expected,'3.5.46');
  assert.equal(vue.version,expected);
  assert.equal(manifest.vue,expected);
  assert.equal(require('@vue/compiler-dom/package.json').version,expected);
  assert.deepEqual(walk(directory), [...Object.keys(manifest.files),'package-manifest.json'].sort());
  for (const [file,digest] of Object.entries(manifest.files)) {
    assert.ok(!file.startsWith('/') && !file.split('/').includes('..'), 'Unsafe manifest path');
    assert.equal(hash(fs.readFileSync(path.join(directory,file))),digest,file+' package digest differs');
  }
  for (const asset of assets) {
    const files = fs.statSync(path.join(root,asset)).isDirectory()?walk(path.join(root,asset)).map(file=>asset+'/'+file):[asset];
    for (const file of files) assert.equal(hash(fs.readFileSync(path.join(directory,file))),hash(fs.readFileSync(path.join(root,file))),file+' source differs');
  }
  const vueRoot = path.dirname(require.resolve('vue/package.json'));
  for (const [source,destination] of [['dist/vue.global.prod.js','vendor/vue.global.prod.js'],['LICENSE','vendor/Vue-LICENSE']]) {
    assert.equal(hash(fs.readFileSync(path.join(directory,destination))),hash(fs.readFileSync(path.join(vueRoot,source))),destination+' is not the locked upstream asset');
  }
  const html = fs.readFileSync(path.join(directory,'index.html'),'utf8');
  const graph = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(match=>match[1]);
  assert.ok(graph.every(file=>!file.startsWith('http')), 'External script runtime is forbidden');
  assert.equal(graph[0],'vendor/vue.global.prod.js');
  assert.equal(graph.filter(file=>file==='vendor/vue.global.prod.js').length,1);
  assert.deepEqual(graph.slice(1),scripts,'Packaged authored/Decimal graph must equal the current VM/compiler graph');
  for (const file of graph) assert.ok(fs.existsSync(path.join(directory,file)), 'Missing packaged script '+file);
  const server = fs.readFileSync(path.join(root,'tests/support/server.cjs'),'utf8');
  assert.ok(!/test-vue|replace\(|vue\.min/.test(server),'Test server must not substitute HTML/runtime assets');
  return {vue:expected,assets:Object.keys(manifest.files).length,scripts:graph.length};
}
function checkTemplates() {
  const r = createRuntime({bridge:false});
  let count = 0;
  try {
    r.run(`var templates=[]; Vue.createApp=()=>({config:{},component(name,definition){templates.push({name,template:definition.template});},mount(){return {$forceUpdate(){}};}}); gameUI.commands.load();`);
    const templates = JSON.parse(r.run('JSON.stringify(templates)'));
    assert.ok(templates.length >= 2,'Actual Civ app must register its icon and native save dialog templates');
    for (const file of ['index.html']) {
      const text = fs.readFileSync(path.join(root,file),'utf8');
      templates.push({name:file,template:text.slice(text.indexOf('<body'),text.lastIndexOf('</body>')+7)});
    }
    for (const {name,template} of templates) {
      const diagnostics = [];
      const result = compile(template,{onError:error=>diagnostics.push(error.message),onWarn:warning=>diagnostics.push(warning.message)});
      assert.deepEqual(diagnostics,[],name+' template diagnostics');
      assert.doesNotThrow(()=>new Function('Vue',result.code),name+' generated template code');
      count++;
    }
  } finally {r.dispose();}
  return count;
}
if (require.main === module) {
  console.log('Package identity passed: '+JSON.stringify(verifyPackage()));
  console.log(`Actual application/shared templates compiled without errors/warnings: ${checkTemplates()}`);
}
module.exports = {verifyPackage,checkTemplates};
