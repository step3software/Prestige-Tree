function captureEconomy(engine){
  return {population:engine.player.points,food:engine.player.food.points,water:engine.player.water.points};
}
function observedRates(before,after,seconds){
  return Object.fromEntries(Object.keys(after).map(key=>[key,after[key].sub(before[key]).div(seconds)]));
}
/** Coalesce outer engine/cache calls without changing manual decision cadence.
 * The real Civ economy still substeps internally at one second. Small early
 * observation windows retain useful precision for automatic unlock timestamps. */
function roughSchedule(engine,settings,_observed,maxStepSeconds){
  const p=engine.player;
  const cap=p.points.lt(8)?5:!p.education.unlocked?15:300;
  return {decisionWait:settings.decisionSeconds,stepSeconds:Math.min(cap,maxStepSeconds,settings.decisionSeconds)};
}
module.exports={captureEconomy,observedRates,roughSchedule};
