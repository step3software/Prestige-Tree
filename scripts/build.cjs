const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const assets = ['index.html', 'js', 'style.css', 'oldStyle.css', 'interface.css', 'civ.css', 'LICENSE', 'Prestige-tree-license'];
const vueRoot = path.dirname(require.resolve('vue/package.json'));
const vue = require('vue/package.json');
const manifest = require('../package.json');
function build() {
  if (vue.version !== manifest.dependencies.vue) throw new Error('Installed Vue differs from the exact application pin');
  // This fixed generated output is the only directory this command replaces.
  if (path.dirname(output) !== root || path.basename(output) !== 'dist') throw new Error('Invalid build output');
  if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw new Error('Build output must not be a symlink');
  fs.rmSync(output, {recursive:true, force:true});
  fs.mkdirSync(path.join(output, 'vendor'), {recursive:true});
  for (const asset of assets) fs.cpSync(path.join(root, asset), path.join(output, asset), {recursive:true});
  fs.copyFileSync(path.join(vueRoot, 'dist/vue.global.prod.js'), path.join(output, 'vendor/vue.global.prod.js'));
  fs.copyFileSync(path.join(vueRoot, 'LICENSE'), path.join(output, 'vendor/Vue-LICENSE'));
  function inventory(directory) {
    return fs.readdirSync(directory, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name, 'en'))
      .flatMap(entry=>entry.isDirectory()?inventory(path.join(directory,entry.name)):[path.join(directory,entry.name)]);
  }
  const files = Object.fromEntries(inventory(output).map(file=>[path.relative(output,file).split(path.sep).join('/'),
    createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
  fs.writeFileSync(path.join(output,'package-manifest.json'), JSON.stringify({vue:vue.version,files},null,2)+'\n');
  console.log(`Built static dist artifact: Vue ${vue.version}, ${Object.keys(files).length} assets, no runtime CDN`);
}

if (require.main === module) build();
module.exports = {assets, build};
