const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBalanceEngine} = require('../../scripts/balance/engine.cjs');
const Decimal = require('../../js/technical/break_eternity.js');
function game(t,save) {
    const engine=createBalanceEngine(save);t.after(engine.dispose);
    return {engine,p:engine.player,e:engine.session.modRules.civilization};
}

test('Food sliders reject invalid targets atomically and share one dedicated Overseer',t=>{
    const {p,e}=game(t);
    assert.equal(e.setRepeat('gather',1),false);
    p.civ.improvements.overseer=true;
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

test('five concurrent gathering jobs pay once per job and slider changes apply to the next batch',t=>{
    const {engine,p,e}=game(t);
    p.points=new Decimal(8);p.civ.improvements.overseer=true;
    p.food.points=new Decimal(0);p.water.points=new Decimal(50);
    e.setRepeat('gather',5);engine.advance(1);
    assert.equal(p.civ.actions.gather.jobs,5);
    assert.equal(p.civ.actions.gather.workers,5);
    assert.equal(e.supply().workers.food,6);
    e.setRepeat('gather',2);
    assert.equal(p.civ.actions.gather.jobs,5);
    assert.equal(e.dispatch('gather'),false);
    engine.advance(10);
    assert.equal(p.civ.actions.gather.completed,5);
    assert.equal(p.civ.actions.gather.jobs,2);
    assert.equal(p.food.total.toNumber(),40);
    e.setRepeat('gather',0);
    assert.equal(e.supply().overseerWorkers,0);
    assert.equal(p.civ.actions.gather.workers,2);
    engine.advance(10);
    assert.equal(p.civ.actions.gather.completed,7);
    assert.equal(p.civ.actions.gather.jobs,0);
    assert.equal(p.food.total.toNumber(),52);
});

test('repeating hunting batches use every full crew and wait when there are too few workers',t=>{
    const {engine,p,e}=game(t);
    p.points=new Decimal(8);p.civ.improvements.overseer=true;
    e.setRepeat('hunt',5);engine.advance(1);
    assert.equal(p.civ.actions.hunt.jobs,2);
    assert.equal(p.civ.actions.hunt.workers,6);
    assert.equal(e.supply().availableWorkers,1);
    e.setRepeat('fish',5);engine.advance(1);
    assert.equal(p.civ.actions.fish.jobs,0);
    assert.equal(e.recall('hunt'),true);
    assert.equal(p.civ.actions.hunt.jobs,0);
    assert.equal(p.civ.actions.hunt.repeat,0);
    assert.equal(p.civ.actions.hunt.completed,0);
});

test('Hut foreman reserves a worker and five builders pay all five escalating hut work costs',t=>{
    const {engine,p,e}=game(t);
    assert.equal(e.setHutRepeat(1),false);
    p.points=new Decimal(12);p.food.points=new Decimal(50);p.water.points=new Decimal(50);
    p.civ.improvements.hutForeman=true;
    for(const target of [-1,6,1.2])assert.equal(e.setHutRepeat(target),false);
    assert.equal(e.setHutRepeat(5),true);
    assert.equal(e.supply().foremanWorkers,1);
    engine.advance(1);
    assert.equal(p.civ.projectJobs,5);assert.equal(p.civ.projectWorkers,5);
    const required=Array.from({length:5},(_,i)=>16*1.35**i).reduce((a,b)=>a+b,0);
    assert.equal(e.summary().project.work,required);
    e.setHutRepeat(0);
    assert.equal(e.supply().foremanWorkers,0);
    engine.advance(Math.ceil(required/5)-1);
    assert.equal(p.shelter.homes,0);
    engine.advance(1);
    assert.equal(p.shelter.homes,5);
    assert.equal(e.supply().support,28);
    assert.equal(p.civ.project,'');
    assert.equal(p.civ.projectJobs,1);
    assert.equal(e.startProject('food-site',5),false);
});

test('shortages preserve hut batch work and never overcommit managers or crews',t=>{
    const {engine,p,e}=game(t);
    p.points=new Decimal(8);p.civ.improvements.hutForeman=true;p.civ.improvements.overseer=true;
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
    const raw=JSON.parse(atob(engine.exportPlayer()));raw.version='0.6';raw.points='5';
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
    const raw=JSON.parse(atob(engine.exportPlayer()));raw.version='0.6';raw.points='1';
    raw.civ.improvements.overseer=true;
    for(const action of Object.values(raw.civ.actions)){delete action.jobs;action.repeat=false;}
    Object.assign(raw.civ.actions.gather,{remaining:5,duration:10,workers:1,reward:6,repeat:true});
    const restored=game(t,btoa(JSON.stringify(raw)));
    assert.equal(restored.p.civ.actions.gather.repeat,0);
    assert.equal(restored.p.civ.actions.gather.remaining,5);
    assert.match(restored.p.civ.message,/paused/);
});

test('current batch saves reject malformed counts and overbooked crews without replacing state',t=>{
    const {engine,p,e}=game(t);p.civ.improvements.overseer=true;
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
    p.civ.improvements.overseer=true;p.civ.improvements.hutForeman=true;
    e.setHutRepeat(3);e.setRepeat('gather',5);e.setRepeat('hunt',5);
    engine.advance(3);
    const one=game(t,engine.exportPlayer()),many=game(t,engine.exportPlayer());
    one.engine.advance(180.5);
    for(let i=0;i<361;i++)many.engine.advance(0.5);
    assert.equal(JSON.stringify(one.p),JSON.stringify(many.p));
    one.engine.exportPlayer();many.engine.exportPlayer();
});
