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
    for(const id of ['buckets','hunting','hearth','fishing','wellLining','joinery','hutForeman','waterReserves','overseer','rationing','gravity','farming','builderTools','relief','sluice','autonomousFood']){
      if(economy.buyUpgrade(id))record('upgrade',id,time);
    }
    const opening=settings.first==='organization'?['organization','craft']:['craft','organization'];
    const sequence=p.craft.total.gte(1)?['organization','craft']:opening;
    for(const id of sequence){
      const needsRetention=p.organization.total.lt(10);
      const canOrganize=p.craft.total.gte(1)||(settings.first==='organization'&&p.organization.total.lt(1));
      const wanted=id==='organization'?canOrganize&&(p.organization.points.lt(3)||needsRetention):
        p.craft.points.lt(needsRetention?3:15)&&(needsRetention||p.points.gte(20));
      if(wanted && economy.prestigeGain(id)>0 && economy.prestige(id))record('prestige',id,time);
    }
    if(economy.summary().autoAvailable && !p.civ.autoBuild){p.civ.autoBuild=true;record('automation','organization',time);}
    for(const id of ['education','culture']){
      const target=id==='education'?8:1;
      const held=id==='education'?p[id].points:p[id].total;
      if(held.lt(target) && economy.canInvest(id) && economy.invest(id))record('investment',id,time);
    }
    for(const id of ['gather','fish','hunt','farm']){
      const action=economy.actionDefinition(id);
      if(action.unlocked && action.repeatAvailable && action.repeat<5 && economy.setRepeat(id,5))record('automation',id,time);
    }
    if(!p.civ.project){
      const targetHousing=p.organization.total.lt(10)?Math.max(12,economy.organizationPopulationRequirement()):24;
      let next=p.shelter.points.lt(targetHousing)?'shelter-home':p.food.storage<2&&p.craft.points.gte(4)?'food-storage':p.water.sites<1?'water-site':null;
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
