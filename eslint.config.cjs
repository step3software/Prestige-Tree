const fs = require('node:fs');
const path = require('node:path');
const espree = require('espree');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(match => match[1]).filter(file => !file.startsWith('http'));
const vendor = 'js/technical/break_eternity.js';
const authored = scripts.filter(file => file !== vendor);
// Only actual top-level declarations are shared between classic scripts. These
// are factories/immutable entry points, never an accidental-variable allowlist.
const declarations = {};
for (const file of authored) {
  const ast = espree.parse(fs.readFileSync(path.join(root, file), 'utf8'), {ecmaVersion:'latest', sourceType:'script'});
  for (const node of ast.body) {
    const names = node.type==='FunctionDeclaration' ? [node.id.name] : node.type==='VariableDeclaration' ? node.declarations.map(item=>item.id.name) : [];
    for (const name of names) {
      if (Object.hasOwn(declarations,name)) throw new Error('Duplicate shipped declaration: '+name);
      if (node.type==='VariableDeclaration' && !['gameUI','gameLayerManifest'].includes(name)) throw new Error('Unexpected global state: '+name);
      declarations[name]='readonly';
    }
  }
}
module.exports = [{
  files: authored,
  languageOptions: {
    ecmaVersion: 'latest', sourceType: 'script',
    globals: { ...declarations, Decimal:'readonly', Vue:'readonly', document:'readonly', window:'readonly',
      localStorage:'readonly', setInterval:'readonly', clearInterval:'readonly', prompt:'readonly', confirm:'readonly',
      alert:'readonly', atob:'readonly', btoa:'readonly', console:'readonly' },
  },
  rules: {
    'no-undef':'error', 'no-global-assign':'error', 'no-const-assign':'error', 'no-var':'error',
    'no-redeclare':['error', {builtinGlobals:false}],
    'no-restricted-syntax':['error', {selector:'Program > VariableDeclaration[kind!="const"]',
      message:'Mutable state belongs inside its session owner, not the classic-script global scope.'}],
  },
}];
