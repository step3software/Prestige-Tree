// Policies use only real content commands at the named manual cadence.
const strategies={
  'active-balanced':{decisionSeconds:5,first:'craft'},
  'active-organization':{decisionSeconds:5,first:'organization'},
  regular:{decisionSeconds:300,earlyDecisionSeconds:20,first:'craft'},
};
function createPolicy(engine,settings,onAction=()=>{}){
  const economy=engine.session.modRules.civilization;
  const counts={},recent=[];
  function record(type,layer,time,id){
    counts[type]=(counts[type]||0)+1;
    recent.push({time,type,layer,...(id?{id}:{})});
    if(recent.length>50)recent.shift();
    onAction(time);
  }
  function act(time){
    const p=engine.player;
    for(const id of ['crafting','clay','copper','roofs','bricks','clayPots','copperPots','copperAxes','sickles','pipes','digging','hunting','butchery','preparedMaterials','extendedExpeditions','workRosters','cooking','jars','abundance','waterReserves','rationing','gravity','farming','hearth','relief','sluice','autonomousFood']){
      if(economy.buyUpgrade(id))record('upgrade',id,time);
    }
    const finishedEquipment=['roofs','hunting','digging','jars','bricks','clayPots','pipes','copperAxes','butchery','copperPots','sickles'].every(id=>p.civ.improvements[id]);
    const fireStarted=Object.values(p.civ.fireBuyables).some(level=>level>0)||p.civ.project.startsWith('fire-');
    const nextMaterial=!p.civ.improvements.crafting?12:!p.civ.improvements.clay?25:!p.civ.improvements.copper?35:finishedEquipment?4:8;
    // Before staffed orders, retain the original legal Organization/Craft bootstrap.
    // Later bank material purchases in bounded population cycles rather than
    // spending every earned Craft on optional storage.
    if(p.organization.points.lt(1)){
      if(economy.prestigeGain('organization')&&economy.prestige('organization'))record('prestige','organization',time);
    }else if(p.craft.total.lt(1)){
      const first=settings.first==='organization'&&p.organization.points.lt(2)?'organization':'craft';
      if(economy.prestigeGain(first)&&economy.prestige(first))record('prestige',first,time);
    }else if(p.organization.points.lt(3)){
      if(economy.prestigeGain('organization')&&economy.prestige('organization'))record('prestige','organization',time);
    }else{
      const saving=p.craft.points.lt(nextMaterial);
      const craftPopulation=Math.min(24,economy.organizationPopulationRequirement()+4);
      if(saving && (!fireStarted || Object.values(p.civ.fireBuyables).every(level=>level>0)) && p.points.gte(craftPopulation)){
        if(economy.prestige('craft'))record('prestige','craft',time);
      }else if(p.organization.points.lt(10)&&(!saving||p.civ.improvements.crafting&&p.organization.points.lt(10))&&economy.prestigeGain('organization')){
        if(economy.prestige('organization'))record('prestige','organization',time);
      }
    }
    if(finishedEquipment)p.civ.autoBuild=false;
    if(!finishedEquipment && economy.summary().autoAvailable && !p.civ.autoBuild){p.civ.autoBuild=true;record('automation','organization',time);}
    for(const id of ['education','culture']){
      const target=id==='education'?8:1;
      const held=id==='education'?p[id].points:p[id].total;
      if(held.lt(target) && economy.canInvest(id) && economy.invest(id))record('investment',id,time);
    }
    if(economy.fireStatus().available){
      const target=Math.max(0,Math.min(3,p.points.toNumber()-7,economy.supply().availableWorkers+p.civ.fireTenders));
      if(target!==p.civ.fireTenders && economy.setFireTenders(target))record('fire-tending','fire',time);
    }
    if(p.civ.improvements.workRosters){
      const workers=Math.max(1,Math.min(5,Math.floor(p.points.toNumber()/6)));
      if(economy.setOverseers('food',workers))record('staffing','food',time);
    }
    for(const id of ['gather','fish','hunt','farm']){
      const action=economy.actionDefinition(id);
      if(action.unlocked && p.civ.improvements.extendedExpeditions){
        const ledger=economy.supply(),baseDuration=action.duration/action.expeditionMultiplier,baseYield=action.reward/action.expeditionMultiplier;
        const affordableDuration=Math.max(0,p.food.points.toNumber()-ledger.reserve)*60/ledger.demand;
        const multiplier=Math.max(1,Math.min(5,Math.floor(affordableDuration/baseDuration),Math.floor(ledger.storage.food/baseYield)));
        if(multiplier!==action.expeditionMultiplier && economy.setExpeditionMultiplier(id,multiplier))record('expedition-length',id,time);
      }
      const cap=economy.summary().foodRepeatCap;
      if(action.unlocked && action.repeatAvailable && action.repeat<cap && economy.setRepeat(id,cap))record('automation',id,time);
    }
    if(!p.civ.project){
      const targetHousing=p.organization.points.lt(10)?Math.max(12,economy.organizationPopulationRequirement(),p.craft.points.lt(nextMaterial)?24:0):24;
      const optional=p.civ.improvements.copper;
      const fireBudget=finishedEquipment&&(p.craft.points.gte(4)||fireStarted);
      let next=p.shelter.points.lt(targetHousing)?'shelter-home':
        p.water.storage<1&&p.civ.improvements.crafting?'water-storage':
        p.water.sites<2&&p.civ.improvements.crafting?'water-site':
        optional&&p.food.storage<3&&p.craft.points.gte(9)?'food-storage':
        fireBudget&&economy.fireStatus().available&&p.civ.fireBuyables.fuel<1?'fire-fuel':
        fireBudget&&economy.fireStatus().available&&p.civ.fireBuyables.hearths<1?'fire-hearths':
        fireBudget&&economy.fireStatus().available&&p.civ.fireBuyables.charcoal<1?'fire-charcoal':null;
      if(next && !economy.canStartProject(next))next=p.water.sites<1?'water-site':null;
      if(next && economy.startProject(next))record('construction',next.split('-')[0],time,next);
    }
    for(const id of ['water','gather','hunt','fish','farm']){
      const action=economy.actionDefinition(id);
      if(p[action.resource].points.lt(economy.supply().storage[action.resource]-1) && economy.dispatch(id))record('dispatch',action.resource,time,id);
    }
    engine.refresh();
  }
  return {act,counts,recent};
}
module.exports={strategies,createPolicy};
