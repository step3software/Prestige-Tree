const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBalanceEngine} = require('../../scripts/balance/engine.cjs');
const Decimal = require('../../js/technical/break_eternity.js');
function game(t,save) {
    const engine=createBalanceEngine(save);
    // Established-settlement fixture: retain activities already discovered before this test.
    Object.assign(engine.player.civ.features,{huts:true,hunting:true,fishing:true,buyables:false}); engine.player.civ.improvements.crafting=true;t.after(engine.dispose);
    return {engine,p:engine.player,e:engine.session.modRules.civilization};
}

test('holding or spending Craft never changes expedition yields or gravity flow',t=>{
    const {p,e}=game(t);p.organization.points=new Decimal(7);
    p.civ.improvements.gravity=true;
    const routes=['gather','hunt','fish','farm','water'];
    const yields=routes.map(id=>e.actionDefinition(id).reward);
    const flow=e.supply().production.water;
    for(const craft of [1,10,100,0]){
        p.craft.points=new Decimal(craft);
        assert.deepEqual(routes.map(id=>e.actionDefinition(id).reward),yields);
        assert.equal(e.supply().production.water,flow);
    }
    p.craft.points=new Decimal(1);
    assert.equal(e.startProject('water-storage'),true);
    assert.equal(p.craft.points.toNumber(),0);
    assert.deepEqual(routes.map(id=>e.actionDefinition(id).reward),yields);
    assert.equal(e.supply().production.water,flow);
});

test('Food sliders reject invalid targets atomically and share one dedicated Overseer',t=>{
    const {p,e}=game(t);
    assert.equal(e.setRepeat('gather',1),false);
    p.civ.improvements.overseer=true;p.organization.points=p.organization.points.max(3);
    for(const [id,target] of [['water',1],['missing',1],['gather',-1],['gather',6],['gather',1.5],['gather',NaN],['farm',1]]){
        const before=JSON.stringify(p);
        assert.equal(e.setRepeat(id,target),false);
        assert.equal(JSON.stringify(p),before);
    }
    for(const id of ['gather','hunt','fish'])assert.equal(e.setRepeat(id,5),true);
    assert.equal(e.supply().overseerWorkers,1);
    assert.equal(e.supply().availableWorkers,4);
    e.setRepeat('gather',0);e.setRepeat('hunt',0);
    assert.equal(e.supply().overseerWorkers,1);
    e.setRepeat('fish',0);
    assert.equal(e.supply().availableWorkers,5);
});

test('five queued Food repeats decrement once per successful start and stop at zero',t=>{
    const {engine,p,e}=game(t);
    p.points=new Decimal(8);p.civ.improvements.overseer=true;p.organization.points=p.organization.points.max(3);
    p.food.points=new Decimal(10);p.water.points=new Decimal(50);
    e.setRepeat('gather',5);engine.advance(1);
    assert.equal(p.civ.actions.gather.jobs,1);
    assert.equal(p.civ.actions.gather.workers,1);
    assert.equal(p.civ.actions.gather.repeat,4);
    assert.equal(e.supply().workers.food,2);
    engine.advance(9);
    assert.equal(p.civ.actions.gather.repeat,4,'A busy route does not spend another repeat');
    for(let remaining=3;remaining>=0;remaining--){
        engine.advance(1);
        assert.equal(p.civ.actions.gather.repeat,remaining);
        assert.equal(p.civ.actions.gather.jobs,1);
        if(remaining>0)engine.advance(9);
    }
    assert.equal(p.civ.actions.gather.completed,4);
    assert.equal(e.supply().overseerWorkers,0,'The queue is exhausted; the last crew still finishes');
    engine.advance(10);
    assert.equal(p.civ.actions.gather.completed,5);
    assert.equal(p.civ.actions.gather.jobs,0);
    assert.equal(p.food.total.toNumber(),40);
    engine.advance(10);
    assert.equal(p.civ.actions.gather.completed,5,'No sixth automatic start');
});

test('full stores, missing crews and active manual jobs never consume queued Food repeats',t=>{
    const {engine,p,e}=game(t);
    p.civ.improvements.overseer=true;p.organization.points=p.organization.points.max(3);p.food.points=new Decimal(50);
    e.setRepeat('hunt',5);engine.advance(1);
    assert.equal(p.civ.actions.hunt.repeat,5,'Full storage waits');
    e.dispatch('water');e.startProject('food-site');
    p.food.points=new Decimal(10);engine.advance(1);
    assert.equal(p.civ.actions.hunt.repeat,5,'Only one worker is free; hunting needs three');
    e.recall('water');e.cancelProject();
    assert.equal(e.dispatch('hunt'),true,'Manual dispatch is separate from queued repeats');
    engine.advance(1);
    assert.equal(p.civ.actions.hunt.repeat,5,'The existing manual job is still busy');
    e.setRepeat('hunt',0);
    assert.equal(p.civ.actions.hunt.jobs,1,'Clearing the queue preserves active work');
    assert.equal(e.recall('hunt'),true);
    assert.equal(p.civ.actions.hunt.completed,0);
});

test('five queued huts use one builder, decrement on start and stop even with general auto-build enabled',t=>{
    const {engine,p,e}=game(t);
    assert.equal(e.setHutRepeat(1),false);
    p.points=new Decimal(12);p.civ.improvements.hearth=true;p.civ.equipment["water-storage"]=10;
    p.food.points=new Decimal(450);p.water.points=new Decimal(450);
    p.civ.improvements.hutForeman=true;p.organization.points=p.organization.points.max(3);
    for(const target of [-1,6,1.2])assert.equal(e.setHutRepeat(target),false);
    assert.equal(e.setHutRepeat(5),true);
    engine.advance(1);
    assert.equal(p.civ.hutRepeat,4);assert.equal(p.civ.projectWorkers,1);
    assert.equal(p.civ.projectJobs,1);
    assert.equal(e.summary().project.work,16);
    for(let i=0;i<300&&p.shelter.homes<5;i++)engine.advance(1);
    assert.equal(p.shelter.homes,5);assert.equal(p.civ.hutRepeat,0);
    assert.equal(e.supply().foremanWorkers,0);assert.equal(p.civ.project,'');
    p.organization.total=new Decimal(10);p.organization.points=new Decimal(10);p.civ.autoBuild=true;
    engine.advance(30);
    assert.equal(p.shelter.homes,5,'General auto-build cannot bypass an empty hut queue');
    assert.notEqual(p.civ.project,'shelter-home');
});

test('busy construction preserves hut repeats and the saved queue resumes without charging twice',t=>{
    const {engine,p,e}=game(t);
    p.civ.improvements.hutForeman=true;p.organization.points=p.organization.points.max(3);
    p.organization.points=new Decimal(7);p.craft.points=new Decimal(1);assert.equal(e.startProject('water-storage'),true);
    e.setHutRepeat(5);engine.advance(1);
    assert.equal(p.civ.hutRepeat,5);
    e.cancelProject();engine.advance(1);
    assert.equal(p.civ.hutRepeat,4);
    const restored=game(t,engine.exportPlayer());
    assert.equal(restored.p.civ.hutRepeat,4);
    restored.engine.advance(1);
    assert.equal(restored.p.civ.hutRepeat,4,'Reloading active work is not another start');
    restored.e.setHutRepeat(0);
    assert.ok(restored.p.civ.projectWork>0);
});

test('shortages preserve hut batch work and never overcommit managers or crews',t=>{
    const {engine,p,e}=game(t);
    p.points=new Decimal(8);p.civ.improvements.hutForeman=true;p.organization.points=p.organization.points.max(3);p.civ.improvements.overseer=true;p.organization.points=p.organization.points.max(3);
    e.setHutRepeat(2);e.setRepeat('hunt',1);
    p.food.points=new Decimal(0);p.water.points=new Decimal(0);
    e.startProject('shelter-home',2);e.dispatch('hunt');
    const work=p.civ.projectWork;
    engine.advance(10);
    assert.ok(p.civ.projectWork>=work);
    for(let i=0;i<60;i++){
        engine.advance(1);
        assert.ok(e.supply().laborUsed<=p.points.toNumber());
    }
    assert.equal(engine.session.saveCommands.saveCodec().encodePlayer(p).ok,true);
});

test('0.6 purchases, trips and repeat orders migrate once without starting huts or duplicating jobs',t=>{
    const {engine}=game(t);
    const raw=JSON.parse(atob(engine.exportPlayer()));raw.version='0.6'; delete raw.civ.equipment;raw.points='5';
    raw.civ.improvements.waterOrders=true;raw.civ.improvements.overseer=true;
    for(const action of Object.values(raw.civ.actions)){delete action.jobs;action.repeat=false;}
    raw.civ.actions.water.repeat=true;
    Object.assign(raw.civ.actions.gather,{remaining:5,duration:10,workers:1,reward:6,repeat:true});
    const restored=game(t,btoa(JSON.stringify(raw)));
    assert.equal(restored.p.civ.improvements.hutForeman,true);
    assert.equal(restored.p.civ.improvements.overseer,true);
    assert.equal('waterOrders' in restored.p.civ.improvements,false);
    assert.equal(restored.p.civ.hutRepeat,0);
    assert.equal(restored.p.civ.actions.gather.repeat,1);
    assert.equal(restored.p.civ.actions.gather.jobs,1);
    restored.e.setRepeat('gather',0);restored.engine.advance(5);
    assert.equal(restored.p.civ.actions.gather.completed,1);
    const again=game(t,restored.engine.exportPlayer());
    assert.equal(again.p.civ.actions.gather.completed,1);
    assert.equal(again.p.civ.hutRepeat,0);
});

test('migration pauses orders if the new Overseer cannot fit, preserving active crews',t=>{
    const {engine}=game(t);
    const raw=JSON.parse(atob(engine.exportPlayer()));raw.version='0.6'; delete raw.civ.equipment;raw.points='1';raw.organization.points='3';
    raw.civ.improvements.overseer=true;
    for(const action of Object.values(raw.civ.actions)){delete action.jobs;action.repeat=false;}
    Object.assign(raw.civ.actions.gather,{remaining:5,duration:10,workers:1,reward:6,repeat:true});
    const restored=game(t,btoa(JSON.stringify(raw)));
    assert.equal(restored.p.civ.actions.gather.repeat,0);
    assert.equal(restored.p.civ.actions.gather.remaining,5);
    assert.match(restored.p.civ.message,/paused/);
});

test('current batch saves reject malformed counts and overbooked crews without replacing state',t=>{
    const {engine,p,e}=game(t);p.civ.improvements.overseer=true;p.organization.points=p.organization.points.max(3);
    e.setRepeat('gather',3);engine.advance(1);
    const saved=engine.exportPlayer(),before=JSON.stringify(p);
    for(const mutate of [raw=>raw.civ.actions.gather.repeat=6,raw=>raw.civ.actions.gather.repeat=true,
        raw=>raw.civ.actions.gather.jobs=0,raw=>raw.civ.actions.gather.workers=5,raw=>raw.civ.projectJobs=5]){
        const raw=JSON.parse(atob(saved));mutate(raw);
        assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(raw))).ok,false);
        assert.equal(JSON.stringify(engine.player),before);
    }
});

test('multi-job batches, managers, growth and shortages are identical across saved online/offline chunks',t=>{
    const {engine,p,e}=game(t);
    p.points=new Decimal(20);p.food.points=new Decimal(50);p.water.points=new Decimal(50);
    p.civ.improvements.overseer=true;p.organization.points=p.organization.points.max(3);p.civ.improvements.hutForeman=true;p.organization.points=p.organization.points.max(3);
    e.setHutRepeat(3);e.setRepeat('gather',5);e.setRepeat('hunt',5);
    engine.advance(3);
    const one=game(t,engine.exportPlayer()),many=game(t,engine.exportPlayer());
    one.engine.advance(180.5);
    for(let i=0;i<361;i++)many.engine.advance(0.5);
    assert.equal(JSON.stringify(one.p),JSON.stringify(many.p));
    one.engine.exportPlayer();many.engine.exportPlayer();
});
