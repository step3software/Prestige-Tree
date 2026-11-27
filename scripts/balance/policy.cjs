// Strategies issue only real content commands; no currency or unlock grants.
const strategies={
  'active-balanced':{decisionSeconds:5,first:'craft'},
  'active-organization':{decisionSeconds:5,first:'organization'},
  regular:{decisionSeconds:300,first:'craft'},
};
function createPolicy(engine,settings,onAction=()=>{}){
  const economy=engine.session.modRules.civilization;
  const counts={},recent=[];
  function record(type,layer,time,id){
    counts[type]=(counts[type]||0)+1;
    recent.push({time,type,layer,...(id?{id}:{})});if(recent.length>50)recent.shift();onAction(time);
  }
  function act(time){
    const p=engine.player;
    const sequence=settings.first==='organization'?['organization','craft']:['craft','organization'];
    // A bounded two-point foundation earns the automation milestone while
    // leaving enough retained Craft for the first cultural investment.
    for(const id of sequence){
      if(p[id].points.lt(2) && economy.prestigeGain(id)>0 && economy.prestige(id))record('prestige',id,time);
    }
    if(p.organization.points.gte(2) && !p.civ.autoBuild){p.civ.autoBuild=true;record('automation','organization',time);}
    for(const id of ['education','culture']){
      if(p[id].total.lt(1) && economy.canInvest(id) && economy.invest(id))record('investment',id,time);
    }
    if(!p.civ.project){
      let next=p.food.sites<2?'food-site':p.water.sites<2?'water-site':p.shelter.homes<2?'shelter-home':null;
      if(!next && !p.civ.autoBuild){
        const state=economy.supply();
        next=state.bottleneck.startsWith('Food')?'food-site':state.bottleneck.startsWith('Water')?'water-site':state.bottleneck==='Shelter'?'shelter-home':null;
      }
      if(next && economy.startProject(next))record('construction',next.split('-')[0],time,next);
    }
    engine.refresh();
  }
  return {act,counts,recent};
}
module.exports={strategies,createPolicy};
