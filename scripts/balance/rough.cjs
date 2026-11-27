const { progressionLayers } = require('./sections.cjs');

function captureEconomy(engine) {
  const amounts=new Map();
  function visit(value,path) {
    if (value && typeof value==='object' && typeof value.sub==='function' && typeof value.toNumber==='function') {
      amounts.set(path,value); return;
    }
    if (!value || typeof value!=='object') return;
    for (const [key,item] of Object.entries(value)) visit(item,path?path+'.'+key:key);
  }
  visit(engine.player,'');
  return {amounts,bases:new Map(progressionLayers.map(id=>[id,engine.tmp[id].baseAmount]))};
}

function observedRates(before,after,seconds) {
  const rates=new Map(),baseRates=new Map();
  for (const [key,value] of after.amounts) {
    const prior=before.amounts.get(key);
    if (prior && value.gt(prior)) rates.set(key,value.sub(prior).div(seconds));
  }
  for (const [key,value] of after.bases) {
    const prior=before.bases.get(key);
    if (prior && value.gt(prior)) baseRates.set(key,value.sub(prior).div(seconds));
  }
  return {rates,baseRates};
}

/** Forecast a reset using the shipped inverse-cost function at the policy's
 * target gain. Only its derived cache input is substituted, then restored;
 * player state and game formulas are never changed. This freezes current
 * multipliers, so it is a scheduling estimate rather than a solved game model.
 */
function resetTarget(engine,layer,multiple) {
  const data=engine.tmp[layer];
  if (data.type!=='normal' || !engine.player[layer].unlocked) return data.nextAt;
  const original=data.resetGain;
  try {
    data.resetGain=engine.player[layer].points.max(1).times(multiple).ceil().sub(1);
    return engine.session.gameRules.getNextAt(layer);
  } finally {data.resetGain=original;}
}

function estimateWait(engine,settings,observed={rates:new Map(),baseRates:new Map()}) {
  const {player,tmp,session}=engine;
  const Decimal=player.points.constructor;
  let wait=Infinity;
  function consider(value,cost,rate) {
    if (!rate || rate.lte(0) || cost===undefined || value===undefined) return;
    const seconds=new Decimal(cost).sub(value).max(0).div(rate).toNumber();
    if (Number.isFinite(seconds)) wait=Math.min(wait,seconds);
  }
  const rates=new Map(observed.rates);
  rates.set('points',tmp.pointGen);
  function purchaseWait(layer,item) {
    const name=item.currencyInternalName||'points';
    const account=item.currencyLocation || (item.currencyLayer?player[item.currencyLayer]:(item.currencyInternalName?player:player[layer]));
    const location=account===player?'':Object.keys(player).find(key=>player[key]===account);
    if (location===undefined) return Infinity;
    const key=location?location+'.'+name:name;
    const value=account[name],rate=rates.get(key);
    if (!value || !rate || rate.lte(0)) return Infinity;
    return new Decimal(item.cost).sub(value).max(0).div(rate).toNumber();
  }
  for (const layer of progressionLayers) {
    const data=tmp[layer];
    if (!data.layerShown) continue;
    if (!data.passiveGeneration && !data.autoPrestige) consider(data.baseAmount,resetTarget(engine,layer,settings.resetMultiple),observed.baseRates.get(layer));
    if (!player[layer].unlocked) continue;
    for (const [id,item] of Object.entries(data.upgrades||{})) {
      if (!/^\d+$/.test(id) || !item.unlocked || session.gameHelpers.hasUpgrade(layer,Number(id))) continue;
      const seconds=item.multiRes?Math.max(...item.multiRes.map(part=>purchaseWait(layer,part))):purchaseWait(layer,item);
      if (Number.isFinite(seconds)) wait=Math.min(wait,seconds);
    }
  }
  return wait;
}

function roughSchedule(engine,settings,observed,maxStepSeconds) {
  let cap=maxStepSeconds;
  // Early branching is especially sensitive to missing a cheap prestige/upgrade.
  if (!engine.player.b.unlocked || !engine.player.g.unlocked) cap=Math.min(cap,15);
  else if (!['t','e','s'].some(id=>engine.player[id].unlocked)) cap=Math.min(cap,60);
  // Coarse automation runs less often than a real 50ms driver. Bound the largest
  // chunks around these sensitive mechanics; the report still requires a fixed
  // reference comparison before treating estimates as calibrated measurements.
  if (progressionLayers.some(id=>engine.tmp[id].autoPrestige)) cap=Math.min(cap,60);
  if (engine.player.h.activeChallenge || engine.player.ne.activeChallenge || engine.player.m.unlocked) cap=Math.min(cap,30);
  const predicted=estimateWait(engine,settings,observed);
  const cadence=settings.decisionSeconds;
  const decisionWait=settings.name==='regular'?cadence:
    Math.max(cadence,Math.ceil(Math.min(cap,Number.isFinite(predicted)?predicted:cadence*2)/cadence)*cadence);
  return {decisionWait,stepSeconds:cap,predictedWaitSeconds:Number.isFinite(predicted)?predicted:null};
}

module.exports = { captureEconomy, observedRates, resetTarget, estimateWait, roughSchedule };
