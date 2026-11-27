const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {ESLint} = require('eslint');
const {scripts, root} = require('../tests/support/game-runtime.cjs');

async function lintGraph() {
  const authored = scripts.filter(file => file !== 'js/technical/break_eternity.js');
  const lint = new ESLint({cwd:root});
  for (const file of authored) {
    if (!fs.existsSync(path.join(root,file))) throw new Error('Missing shipped source: '+file);
    if (await lint.isPathIgnored(file)) throw new Error('Shipped authored source excluded: '+file);
    const config = await lint.calculateConfigForFile(file);
    if (!config || config.rules['no-undef'][0] !== 2) throw new Error('Missing undeclared-write enforcement: '+file);
  }
  const results = await lint.lintFiles(authored);
  if (results.length !== authored.length) throw new Error('Lint graph coverage mismatch');
  const formatter = await lint.loadFormatter('stylish');
  const diagnostics = formatter.format(results);
  if (diagnostics) process.stdout.write(diagnostics);
  if (results.some(result => result.errorCount || result.warningCount)) throw new Error('Shipped graph lint failed');
  console.log(`Lexical/global contracts passed: all ${authored.length} shipped authored scripts`);
}
async function main() {
  const config = JSON.parse(fs.readFileSync(path.join(root,'jsconfig.json'),'utf8'));
  if (JSON.stringify(config.files) !== JSON.stringify(scripts)) throw new Error('Compiler graph must exactly match shipped HTML');
  await lintGraph();
  const compiler = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin/tsc');
  execFileSync(process.execPath, [compiler,'--project','jsconfig.json'], {cwd:root,stdio:'inherit'});
  console.log('Checked JavaScript state/save/runtime/layer/UI boundary contracts passed');
}
if (require.main === module) main().catch(error => {console.error(error.message);process.exitCode=1;});
module.exports = {lintGraph};
