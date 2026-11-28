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

test('auto-building remains inactive through milestone nine, including a previously saved enabled toggle',t=>{
    const {engine,p,e}=game(t);
    p.civ.improvements.crafting=true;p.civ.autoBuild=true;p.craft.points=new Decimal(1);
    p.organization.total=new Decimal(9);p.organization.points=new Decimal(9);
    engine.advance(1);
    assert.equal(e.summary().autoAvailable,false);
    assert.equal(p.civ.project,'');
    p.organization.total=new Decimal(10);p.organization.points=new Decimal(10);
    engine.advance(1);
    assert.equal(e.summary().autoAvailable,true);
    assert.notEqual(p.civ.project,'');
});

test('retired upgrades cannot be purchased and Fishing keeps its full two-person crew',t=>{
    const {p,e}=game(t);rich(p);p.organization.total=new Decimal(10);p.organization.points=new Decimal(10);
    assert.equal(e.buyUpgrade('fishing'),false);
    assert.equal(e.buyUpgrade('wellLining'),false);
    assert.equal(e.actionDefinition('fish').workers,2);
    p.civ.improvements.gravity=true;p.education.points=new Decimal(0);
    assert.equal(e.supply().production.water,8*e.supply().upkeep);
});

test('earlier owned upgrades remain usable on load while new purchases obey current gates',t=>{
    const {engine,p,e}=game(t);
    p.civ.improvements.gravity=true;
    const raw=JSON.parse(atob(engine.exportPlayer()));
    raw.version='0.3'; delete raw.civ.equipment;
    const loaded=engine.session.loadPlayer(btoa(JSON.stringify(raw)));
    assert.equal(loaded.ok,true);
    const current=engine.player;
    assert.equal(current.civ.improvements.gravity,true);
    assert.equal('wellLining' in current.civ.improvements,false);
    assert.equal(e.buyUpgrade('overseer'),false);
    assert.equal(e.supply().workers.water,0);
});
