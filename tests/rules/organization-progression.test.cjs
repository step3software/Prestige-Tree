const test=require('node:test');
const assert=require('node:assert/strict');
const Decimal=require('../../js/technical/break_eternity.js');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
function game(t){
    const engine=createBalanceEngine();t.after(engine.dispose);
    return {engine,p:engine.player,e:engine.session.modRules.civilization};
}
function rich(p){
    p.civ.fire=10;
    for(const id of ['food','water','craft','organization','education','money','freeTime'])p[id].points=new Decimal(1000);
}
const get=(p,id)=>{
    const [resource,kind]=id.split('-');
    if(kind==='tools')return p.food.routes[resource];
    if(kind==='home')return p.shelter.homes;
    if(kind==='comfort')return p.shelter.comfort;
    return p[resource][kind==='site'?'sites':'storage'];
};

test('Organization retains automation while materials own the moved equipment upgrades',t=>{
 const {p,e}=game(t);rich(p);
 assert.deepEqual(e.organizationMilestones().slice(0,2).map(row=>row.upgrades),[['joinery'],[]]);
 assert.deepEqual(e.organizationMilestones()[2].upgrades,['preparedMaterials','extendedExpeditions','workRosters']);
 p.organization.total=new Decimal(3);
 for(const [id,cost] of [['preparedMaterials',1],['extendedExpeditions',2],['workRosters',3]]){p.organization.points=new Decimal(3);const before=p.organization.points.toNumber();assert.equal(e.buyUpgrade(id),true);assert.equal(p.organization.points.toNumber(),before-cost);}
 assert.equal(e.buyUpgrade('hunting'),false);assert.equal(e.buyUpgrade('crafting'),true);assert.equal(e.buyUpgrade('hunting'),true);
});

test('every later upgrade rejects affordable purchases before its milestone is first reached',t=>{
    const {p,e}=game(t);rich(p);
    const milestones=e.organizationMilestones();
    assert.deepEqual(milestones.map(row=>row.requirement),[1,2,3,4,5,6,7,8,9,10]);
    for(const milestone of milestones){
        for(const id of milestone.upgrades){
            const {p,e}=game(t);rich(p);
            p.organization.total=new Decimal(milestone.requirement-1);p.organization.points=new Decimal(milestone.requirement-1);
            const before=JSON.stringify(p);
            assert.equal(e.buyUpgrade(id),false,id+' below gate');
            assert.equal(JSON.stringify(p),before,id+' must not spend');
            p.organization.total=new Decimal(milestone.requirement);p.organization.points=new Decimal(milestone.requirement);
            assert.equal(p.civ.improvements[id],false);
            assert.equal(e.buyUpgrade(id),!['sluice','autonomousFood'].includes(id),id+' at gate; later resource purchases stay locked');
            assert.equal(e.buyUpgrade(id),false,id+' cannot buy twice');
        }
    }
});

test('each retention milestone immediately keeps its exact buyable and protected construction',t=>{
    const retained=[['water-storage',4],['food-storage',5],['water-site',6],['gather-tools',7],['hunt-tools',8],['shelter-home',10]];
    const all=['gather-tools','hunt-tools','farm-tools','food-site','food-storage','water-site','water-storage','shelter-home'];
    for(const [id,threshold] of retained){
        const {p,e}=game(t);
        Object.assign(p.civ.features,{huts:true,hunting:true,buyables:false});p.civ.improvements.crafting=true;
        p.civ.improvements.farming=true;
        p.points=new Decimal(12+4*(threshold-1));
        p.shelter.homes=threshold;p.shelter.points=new Decimal(8+threshold*4);p.shelter.comfort=1;
        p.food.sites=1;p.food.storage=1;p.water.sites=1;p.water.storage=1;
        for(const route of Object.keys(p.food.routes))p.food.routes[route]=1;
        p.food.points=new Decimal(50);p.water.points=new Decimal(50);
        p.organization.total=new Decimal(threshold-1);p.organization.points=new Decimal(threshold-1);
        assert.equal(e.prestigePreview('craft').kept[id],false);
        p.craft.points=new Decimal(4);
        p.organization.points=new Decimal(7);
        assert.equal(e.startProject(id),true);
        p.organization.points=new Decimal(threshold-1);
        p.civ.projectWork=2;
        const plan=e.prestigePreview('organization');
        assert.equal(plan.kept[id],true);
        assert.equal(e.prestige('organization'),true);
        for(const buyable of all)assert.equal(get(p,buyable),plan.kept[buyable]?(buyable==='shelter-home'?threshold:1):0,id+' / '+buyable);
        assert.equal(p.civ.project,id);
        assert.equal(p.civ.projectWork,2);
        assert.equal(p.points.toNumber(),5);
        assert.equal(p.organization.total.toNumber(),threshold);
    }
});

test('auto-building remains inactive through milestone nine, including a previously saved enabled toggle',t=>{
    const {engine,p,e}=game(t);
    p.civ.improvements.crafting=true;p.civ.autoBuild=true;
    p.organization.total=new Decimal(9);p.organization.points=new Decimal(9);
    engine.advance(1);
    assert.equal(e.summary().autoAvailable,false);
    assert.equal(p.civ.project,'');
    p.organization.total=new Decimal(10);p.organization.points=new Decimal(10);
    engine.advance(1);
    assert.equal(e.summary().autoAvailable,true);
    assert.notEqual(p.civ.project,'');
});

test('retired upgrades and fishing are unavailable while Water flow is preserved',t=>{
    const {p,e}=game(t);rich(p);p.organization.total=new Decimal(10);p.organization.points=new Decimal(10);
    assert.equal(e.buyUpgrade('fishing'),false);
    assert.equal(e.buyUpgrade('wellLining'),false);
    assert.equal(e.actionDefinition('fish'),null);
    p.civ.improvements.gravity=true;p.education.points=new Decimal(0);
    assert.equal(e.supply().production.water,8*e.supply().upkeep);
});

test('earlier owned upgrades remain usable on load while new purchases obey current gates',t=>{
    const {engine,p,e}=game(t);
    p.civ.improvements.gravity=true;
    const raw=JSON.parse(atob(engine.exportPlayer()));
    raw.version='0.3';
    const loaded=engine.session.loadPlayer(btoa(JSON.stringify(raw)));
    assert.equal(loaded.ok,true);
    const current=engine.player;
    assert.equal(current.civ.improvements.gravity,true);
    assert.equal('wellLining' in current.civ.improvements,false);
    assert.equal(e.buyUpgrade('overseer'),false);
    assert.equal(e.supply().workers.water,0);
});
