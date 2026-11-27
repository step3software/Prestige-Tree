const { progressionLayers } = require('./sections.cjs');

// This is an explicit player strategy, not an alternate progression model. All
// purchases/resets pass through the shipped command owners and their guards.
const strategies = {
  'active-generators': {decisionSeconds:5,resetMultiple:1,prefer:['g','b','e','s','t','q','h','ss','o','ba','m','n','hs','ne','en']},
  'active-boosters': {decisionSeconds:5,resetMultiple:1,prefer:['b','g','e','t','s','q','h','o','ss','m','ba','hs','n','en','ne']},
  'active-patient': {decisionSeconds:5,resetMultiple:4,prefer:['g','b','e','s','t','q','h','ss','o','ba','m','n','hs','ne','en']},
  regular: {decisionSeconds:300,resetMultiple:2,prefer:['g','b','e','s','t','q','h','ss','o','ba','m','n','hs','ne','en']},
};
const ids = value => Object.keys(value || {}).filter(key=>/^\d+$/.test(key)).map(Number);

function createPolicy(engine, settings, onAction=()=>{}) {
  const {session} = engine;
  const {gameHelpers:helpers, gameRules:rules, layerRegistry:registry} = session;
  const lastReset = new Map();
  const challengeAttempts = new Map();
  let challengeSince = 0;
  let masterySince = 0;
  const counts = {};
  const recent = [];
  function record(type,layer,id,time) {
    counts[type]=(counts[type]||0)+1;
    recent.push({time,type,layer,...(id===undefined?{}:{id})});
    if (recent.length>50) recent.shift();
    onAction(time);
  }
  function click(layer,id,time) {
    const item=engine.tmp[layer]?.clickables?.[id];
    if (!engine.player[layer].unlocked || !item?.unlocked || !item.canClick) return false;
    helpers.clickClickable(layer,id); engine.refresh(); record('click',layer,id,time); return true;
  }
  function enableAutomation(time) {
    let changed=false;
    // Milestone toggle lists are the UI's canonical, unlock-gated action inputs.
    for (const layer of progressionLayers) {
      if (!engine.player[layer].unlocked) continue;
      for (const id of ids(engine.tmp[layer].milestones)) {
        const milestone=engine.tmp[layer].milestones[id];
        if (!helpers.hasMilestone(layer,id) || !milestone.unlocked) continue;
        for (const toggle of milestone.toggles || []) {
          if (!Array.isArray(toggle) || toggle.length!==2 || typeof engine.player[toggle[0]]?.[toggle[1]]!=='boolean') continue;
          if (!engine.player[toggle[0]][toggle[1]]) {
            helpers.toggleAuto(toggle); record('automation',toggle[0],toggle[1],time); changed=true;
          }
        }
      }
    }
    if (changed) engine.refresh();
    return changed;
  }
  function challenges(time) {
    const p=engine.player;
    const current=p.h.activeChallenge;
    if (current) {
      if (rules.canCompleteChallenge('h',current) || time-challengeSince>=1800) {
        const complete=Boolean(rules.canCompleteChallenge('h',current));
        rules.startChallenge('h',current); engine.refresh();
        record(complete?'challenge-complete':'challenge-timeout','h',current,time);
        challengeAttempts.set(current,{time,spirit:p.h.best.toString()});
        return true;
      }
      return false;
    }
    if (!p.h.unlocked || p.h.best.lt(10)) return false;
    for (const id of ids(engine.tmp.h.challenges)) {
      const challenge=engine.tmp.h.challenges[id];
      if (!challenge.unlocked || helpers.challengeCompletions('h',id)>=challenge.completionLimit) continue;
      const attempted=challengeAttempts.get(id);
      if (attempted && (time-attempted.time<1800 || p.h.best.lte(attempted.spirit))) continue;
      // Authored guide prerequisites for the early challenge chain.
      if (id===12 && !helpers.hasUpgrade('q',12)) continue;
      if (id===21 && !helpers.hasUpgrade('q',22)) continue;
      if (id===22 && !helpers.hasUpgrade('q',24)) continue;
      rules.startChallenge('h',id); challengeSince=time; engine.refresh(); record('challenge-start','h',id,time); return true;
    }
    return false;
  }
  function specialActions(time) {
    const p=engine.player;
    let changed=false;
    if (p.ba.unlocked) {
      const allotted=p.ba.pos.gt(p.ba.neg)?0:1;
      if (p.ba.allotted!==allotted) {p.ba.allotted=allotted;record('balance-slider','ba',allotted,time);changed=true;}
    }
    for (const id of [13,11,12]) {
      const entry=registry.layers.n.clickables[id];
      if (p.n.unlocked && !p.n.activeSecondaries[entry.name]) changed=click('n',id,time)||changed;
    }
    for (const id of [11,12,13]) if (p.ge.unlocked) changed=click('ge',id,time)||changed;
    if (p.en.unlocked) changed=click('en',11,time)||changed;
    if (p.ne.unlocked && p.ne.points.gt(0) && !p.ne.activeChallenge && engine.tmp.ne.challenges[11].unlocked) {
      rules.startChallenge('ne',11); engine.refresh(); record('challenge-start','ne',11,time); changed=true;
    }
    if (p.mc.unlocked) {
      const limit=engine.tmp.mc.clickables.activeLimit;
      const preferred=limit>=4?[11,12,21,22]:limit>=2?[11,helpers.hasAchievement('a',133)?21:22]:[[11],[12],[22]][Math.floor(time/600)%3];
      for (const id of preferred) {
        if (p.mc.mechEn.gt(0) && (p.mc.clickables[id].eq(0) || p.mc.mechEn.times(engine.tmp.mc.mechEnMult).gt(p.mc.clickables[id]))) {
          changed=click('mc',id,time)||changed;
        }
      }
    }
    if (p.r.unlocked) {
      if (p.r.allotted.breeders.lt(1)) changed=click('r',11,time)||changed;
      changed=click('r',16,time)||changed;
      for (const id of [15,14,13,12,11]) changed=click('r',id,time)||changed;
    }
    if (p.c.unlocked) for (const id of [15,14,13,12,11]) changed=click('c',id,time)||changed;
    return changed;
  }
  function mastery(time) {
    const p=engine.player;
    if (!p.ma.unlocked) return;
    if (p.ma.current) {
      const layer=p.ma.current;
      if (p[layer].points.gte(engine.tmp.ma.masteryGoal[layer])) {
        registry.layers.ma.completeMastery(layer); engine.refresh(); record('mastery-complete',layer,undefined,time);
      } else if (time-masterySince>7200 && engine.tmp.ma.clickables[11].canClick) {
        click('ma',11,time); record('mastery-timeout',layer,undefined,time);
      }
      return;
    }
    if (!p.ma.selectionActive) click('ma',11,time);
    if (!p.ma.selectionActive) return;
    const order=['p','b','g','e','s','t','sb','sg','q','h','ss','o','m','ba','ps','hn','n','hs','i'];
    const layer=order.find(id=>engine.tmp.ma.canBeMastered.includes(id) && !p.ma.mastered.includes(id) && engine.tmp[id].row<engine.tmp.ma.rowLimit);
    if (layer) {
      registry.layers.ma.startMastery(layer); masterySince=time; engine.refresh(); record('mastery-start',layer,undefined,time);
    }
  }
  function act(time) {
    engine.refresh();
    enableAutomation(time);
    // Complete/start a challenge once per decision, rather than cycling runs in
    // a zero-time purchase burst. The first Hindrance needs a constrained build.
    challenges(time);
    specialActions(time);
    mastery(time);
    for (let pass=0;pass<8;pass++) {
      let changed=false;
      const p=engine.player;
      for (const layer of progressionLayers) {
        if (!p[layer].unlocked) continue;
        const data=engine.tmp[layer];
        for (const id of ids(data.upgrades)) {
          if (helpers.inChallenge('h',11) && ((layer==='p' && ![11,12,13,22].includes(id)) || (layer==='b' && ![11,12,14].includes(id)))) continue;
          const item=engine.tmp[layer].upgrades[id];
          if (item.pseudoUnl && !item.unlocked && item.pseudoCan && !p[layer].pseudoUpgs.includes(id)) {
            helpers.unlockUpg(layer,id); engine.refresh(); record('discover',layer,id,time); changed=true;
          }
          if (item.unlocked && !helpers.hasUpgrade(layer,id) && helpers.canAffordUpgrade(layer,id)) {
            helpers.buyUpg(layer,id); engine.refresh(); record('upgrade',layer,id,time); changed=true;
          }
        }
        let buyables=ids(engine.tmp[layer].buyables);
        if (layer==='s') buyables=helpers.inChallenge('h',22)?buyables:buyables.reverse();
        if (layer==='hs') buyables=[25,24,22,21,23,26,28,30,29,27].filter(id=>buyables.includes(id));
        for (const id of buyables) {
          const item=engine.tmp[layer].buyables[id];
          if (!item.unlocked || !item.canAfford) continue;
          if (layer==='m' && p.m.spellTimes[id]?.gt(0)) continue;
          helpers.buyBuyable(layer,id); engine.refresh(); record('buyable',layer,id,time); changed=true;
        }
      }
      const preference=layer=>settings.prefer.indexOf(layer)<0?100:settings.prefer.indexOf(layer);
      const resets=progressionLayers.filter(layer=>engine.tmp[layer].layerShown && rules.canReset(layer))
        .sort((a,b)=>engine.tmp[b].row-engine.tmp[a].row || preference(a)-preference(b));
      for (const layer of resets) {
        const data=engine.tmp[layer];
        if (data.passiveGeneration || data.autoPrestige) continue;
        if (p.h.activeChallenge && data.row>=3) continue;
        if (p.ma.current && data.row>=6) continue;
        if (time-(lastReset.get(layer)??-Infinity)<settings.decisionSeconds) continue;
        if (p[layer].unlocked && data.type==='normal' && data.resetGain.lt(p[layer].points.max(1).times(settings.resetMultiple))) continue;
        rules.doReset(layer); lastReset.set(layer,time); record('reset',layer,undefined,time); engine.refresh(); changed=true;
        break;
      }
      enableAutomation(time);
      if (!changed) break;
    }
  }
  return {act,counts,recent};
}

module.exports = { strategies, createPolicy };
