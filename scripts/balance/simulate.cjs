const { createHash } = require('node:crypto');
const { performance } = require('node:perf_hooks');
const { createBalanceEngine } = require('./engine.cjs');
const { sections, progressionLayers } = require('./sections.cjs');
const { strategies, createPolicy } = require('./policy.cjs');
const { captureEconomy, observedRates, roughSchedule } = require('./rough.cjs');

function positive(value,name) {
  if (!Number.isFinite(value) || value<=0) throw new Error(`${name} must be finite and positive`);
  return value;
}

/** Explicit game time, never sleeping or multiplying devSpeed. Every call uses
 * the public engine. Fixed mode splits exactly at manual decision boundaries;
 * rough mode schedules deferred active checks from resource forecasts.
 */
function simulate({strategy='regular',horizonSeconds=86400,stepSeconds=5,wallBudgetSeconds=120,encodedPlayer,
  decisionSeconds,onProgress=()=>{},onCheckpoint=()=>{},stopAt,mode='fixed',maxStepSeconds=300}={}) {
  if (!strategies[strategy]) throw new Error('Unknown strategy: '+strategy);
  positive(horizonSeconds,'horizonSeconds'); positive(stepSeconds,'stepSeconds'); positive(wallBudgetSeconds,'wallBudgetSeconds');
  positive(maxStepSeconds,'maxStepSeconds');
  if (!['fixed','rough'].includes(mode)) throw new Error('Unknown simulation mode: '+mode);
  const settings={...strategies[strategy],name:strategy,decisionSeconds:decisionSeconds??strategies[strategy].decisionSeconds};
  positive(settings.decisionSeconds,'decisionSeconds');
  if (stopAt && !sections.some(section=>section.id===stopAt)) throw new Error('Unknown checkpoint: '+stopAt);
  const engine=createBalanceEngine(encodedPlayer);
  const reached=new Map(), layerTimes=new Map();
  let time=0,nextDecision=0,steps=0,decisions=0,nextProgress=3600,status='horizon';
  const start=performance.now();
  let priorTime=0;
  let rates;
  let nextStep=stepSeconds;
  let largestStepSeconds=0;
  const cadenceChanges=[];
  function observe(exact=false) {
    for (const layer of progressionLayers) if (engine.player[layer].unlocked && !layerTimes.has(layer)) layerTimes.set(layer,time);
    for (const section of sections) {
      if (reached.has(section.id)) continue;
      const entered=section.layers?section.layers.some(id=>engine.player[id].unlocked):section.test(engine.player,engine.session);
      if (!entered) continue;
      reached.set(section.id,{entrySeconds:time,entryWindowSeconds:[exact?time:priorTime,time]});
      onCheckpoint({id:section.id,time,encodedPlayer:engine.exportPlayer()});
    }
  }
  const policy=createPolicy(engine,settings,()=>observe(true));
  try {
    observe();
    while (time<=horizonSeconds) {
      if (stopAt && reached.has(stopAt)) {status='checkpoint';break;}
      if (reached.has('endgame')) {status='endgame';break;}
      if (time>=nextDecision) {
        policy.act(time);decisions++;observe(true);
        const staffedOpening=settings.earlyDecisionSeconds && !(engine.player.civ.improvements.overseer && engine.player.civ.improvements.gravity && engine.session.modRules.civilization.summary().autoAvailable);
        const cadence=decisionSeconds??(staffedOpening?settings.earlyDecisionSeconds:settings.decisionSeconds);
        if(cadenceChanges.at(-1)?.seconds!==cadence)cadenceChanges.push({time,seconds:cadence});
        const currentSettings={...settings,decisionSeconds:cadence};
        const schedule=mode==='rough'?roughSchedule(engine,currentSettings,rates,maxStepSeconds):{decisionWait:cadence,stepSeconds};
        nextDecision=time+schedule.decisionWait;nextStep=schedule.stepSeconds;
      }
      if (stopAt && reached.has(stopAt)) {status='checkpoint';break;}
      if (reached.has('endgame')) {status='endgame';break;}
      if (time>=horizonSeconds) break;
      if (performance.now()-start>wallBudgetSeconds*1000) {status='wall-budget';break;}
      const elapsed=Math.min(nextStep,nextDecision-time,horizonSeconds-time,engine.session.modRules.maxTickLength());
      priorTime=time;
      const economy=mode==='rough'?captureEconomy(engine):null;
      engine.advance(elapsed); steps++; time=Math.min(horizonSeconds,time+elapsed);largestStepSeconds=Math.max(largestStepSeconds,elapsed);
      if (mode==='rough') {engine.refresh();rates=observedRates(economy,captureEconomy(engine),elapsed);}
      observe();
      if (time>=nextProgress) {onProgress({strategy,time,sections:[...reached.keys()],steps});nextProgress+=3600;}
    }
    engine.assertIsolated();
    const state=JSON.stringify(engine.player);
    const report=sections.map((section,index)=>{
      const entry=reached.get(section.id);
      const next=sections.slice(index+1).filter(item=>reached.has(item.id) && (!entry || reached.get(item.id).entrySeconds>=entry.entrySeconds)).sort((a,b)=>reached.get(a.id).entrySeconds-reached.get(b.id).entrySeconds)[0];
      const exit=next?reached.get(next.id).entrySeconds:null;
      return {id:section.id,name:section.name,status:entry?'reached':'not-reached',entrySeconds:entry?.entrySeconds??null,
        entryWindowSeconds:entry?.entryWindowSeconds??null,sectionSeconds:entry&&exit!==null?exit-entry.entrySeconds:null,
        censored:!entry || exit===null};
    });
    return {strategy,settings,horizonSeconds,simulatedSeconds:time,stepSeconds,mode,maxStepSeconds,largestStepSeconds,status,steps,decisions,
      sections:report,layerTimes:Object.fromEntries(layerTimes),actions:policy.counts,recentActions:policy.recent,cadenceChanges,
      stateSha256:createHash('sha256').update(state).digest('hex'),checkpoint:engine.exportPlayer(),
      unmetDiscoveries:progressionLayers.flatMap(layer=>Object.entries(engine.tmp[layer].upgrades||{})
        .filter(([_id,item])=>item && typeof item==='object' && item.pseudoUnl && !item.unlocked && !item.pseudoCan)
        .map(([id,item])=>({layer,id,requirement:item.pseudoReq}))),
      wallSeconds:(performance.now()-start)/1000,
      policyCapabilities:{construction:true,prestige:true,earnedAutomation:true,investments:true,workerPriority:true},
      interpretation:mode==='rough'?'Rough checkpoint observation with coalesced outer calls; the actual economy uses one-second internal steps. Manual cadence is unchanged. Compare entry windows with a fixed reference. Unreached sections are censored.':
        'Fixed-step legal policy simulation, not measured human play or a proven optimum. Regular uses 20-second opening checks, then five-minute checks after overseer, gravity flow and auto-building; cadenceChanges records the transition.'};

  } finally {engine.dispose();}
}

module.exports = { simulate, positive };
