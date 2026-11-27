const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const {simulate,positive} = require('./simulate.cjs');
const {sourceIdentity} = require('./engine.cjs');
const {strategies} = require('./policy.cjs');
const {compareReference,markdown,duration} = require('./report.cjs');
const {root} = require('../../tests/support/game-runtime.cjs');

function options(args) {
  const result={hours:24,budget:15,step:5,maxStep:300,mode:'rough',out:'balance-results',profiles:['active-balanced','regular'],calibrateMinutes:10};
  const names={'--hours':'hours','--budget':'budget','--step':'step','--max-step':'maxStep','--mode':'mode','--out':'out','--profiles':'profiles','--save':'save','--calibrate-minutes':'calibrateMinutes'};
  for(let i=0;i<args.length;i++) {
    if(args[i]==='--help') return {help:true};
    const key=names[args[i]],value=args[++i];
    if(!key || value===undefined) throw new Error('Unknown option or missing value: '+args[i-1]);
    result[key]=['hours','budget','step','maxStep','calibrateMinutes'].includes(key)?Number(value):key==='profiles'?value.split(','):value;
  }
  for(const key of ['hours','budget','step','maxStep']) positive(result[key],key);
  if(!Number.isFinite(result.calibrateMinutes)||result.calibrateMinutes<0) throw new Error('calibrate-minutes must be nonnegative');
  if(!['rough','fixed'].includes(result.mode)) throw new Error('mode must be rough or fixed');
  if(!result.profiles.length || result.profiles.some(name=>!strategies[name])) throw new Error('Unknown profile');
  return result;
}

function main(args=process.argv.slice(2)) {
  const config=options(args);
  if(config.help) {
    console.log('npm run balance -- [--mode rough|fixed] [--hours 24] [--budget 15] [--step 5] [--max-step 300] [--profiles active-balanced,regular] [--calibrate-minutes 10] [--save synthetic.save.txt] [--out balance-results]');return;
  }
  const directory=path.resolve(root,config.out);
  fs.mkdirSync(directory,{recursive:true});
  const encodedPlayer=config.save?fs.readFileSync(path.resolve(root,config.save),'utf8').trim():undefined;
  const report={schema:'prestige-balance/v1',sourceRevision:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
    engineSources:sourceIdentity(),policySha256:createHash('sha256').update(fs.readFileSync(path.join(__dirname,'policy.cjs'))).digest('hex'),
    toolSources:Object.fromEntries(fs.readdirSync(__dirname).filter(file=>file.endsWith('.cjs')).sort()
      .map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(__dirname,file))).digest('hex')])),
    mode:config.mode,config,startDescription:encodedPlayer?'time since supplied player checkpoint':'fresh canonical new game',runs:[],calibration:[]};
  const persist=()=>{fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(directory,'report.md'),markdown(report));};
  for(const strategy of config.profiles) {
    console.log(`Running ${strategy} (${config.mode}, up to ${config.hours}h, ${config.budget}s wall-time budget)`);
    const run=simulate({strategy,encodedPlayer,mode:config.mode,horizonSeconds:config.hours*3600,wallBudgetSeconds:config.budget,
      stepSeconds:config.step,maxStepSeconds:config.maxStep,
      onProgress:({time,sections})=>console.log(`  ${duration(time)} game time; ${sections.length} section entries`),
      onCheckpoint:({id,encodedPlayer:state})=>fs.writeFileSync(path.join(directory,`${strategy}.${id}.save.txt`),state+'\n')});
    fs.writeFileSync(path.join(directory,`${strategy}.final.save.txt`),run.checkpoint+'\n');
    delete run.checkpoint;report.runs.push(run);persist();
    console.log(`  stopped at ${duration(run.simulatedSeconds)} (${run.status}), ${run.wallSeconds.toFixed(2)}s wall, ${run.steps} steps`);
  }
  if(config.mode==='rough'&&config.calibrateMinutes>0) {
    for(const strategy of [config.profiles.find(name=>name!=='regular'),config.profiles.includes('regular')?'regular':null].filter(Boolean)) {
      console.log(`Calibrating ${strategy}, matched ${config.calibrateMinutes} minute horizon`);
      const shared={strategy,encodedPlayer,horizonSeconds:config.calibrateMinutes*60,wallBudgetSeconds:config.budget,stepSeconds:config.step,maxStepSeconds:config.maxStep};
      const rough=simulate({...shared,mode:'rough'}),fixed=simulate({...shared,mode:'fixed'});
      report.calibration.push(compareReference(rough,fixed));persist();
    }
  }
  console.log('Wrote '+path.join(directory,'report.md'));
  return report;
}

if(require.main===module) {try{main();}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={options,main};
