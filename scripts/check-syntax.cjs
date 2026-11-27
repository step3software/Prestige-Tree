const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { root, scripts } = require('../tests/support/game-runtime.cjs');

function testScripts(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? testScripts(file) : file.endsWith('.cjs') ? [file] : [];
  });
}
const files = [...scripts.map(file => path.join(root, file)),
  ...testScripts(path.join(root, 'tests')), ...testScripts(path.join(root, 'scripts')),
  path.join(root, 'playwright.config.cjs')];
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
console.log(`Syntax passed: ${scripts.length} shipped scripts and ${files.length - scripts.length} test/config scripts`);
