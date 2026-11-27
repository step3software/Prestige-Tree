const test=require('node:test');
const assert=require('node:assert/strict');
const Decimal=require('../../js/technical/break_eternity.js');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
function game(t){
    const engine=createBalanceEngine();t.after(engine.dispose);
    return {engine,p:engine.player,e:engine.session.modRules.civilization};
}
function shortage(p,resource='food',population=10){
    p.points=new Decimal(population);
    p.food.points=new Decimal(resource==='food'||resource==='both'?0:50);
    p.water.points=new Decimal(resource==='water'||resource==='both'?0:50);
}

test('Food or Water exhaustion grants ten seconds then accelerates population loss',t=>{
    for(const resource of ['food','water','both']){
        const {engine,p}=game(t);shortage(p,resource);
        engine.advance(9);assert.equal(p.points.toNumber(),10,resource+' grace');
        engine.advance(1);assert.equal(p.points.toNumber(),9,resource+' first loss');
        engine.advance(7);assert.equal(p.points.toNumber(),9);
        engine.advance(1);assert.equal(p.points.toNumber(),8,resource+' second loss after eight seconds');
        engine.advance(6);assert.equal(p.points.toNumber(),8);
        engine.advance(1);assert.equal(p.points.toNumber(),7,resource+' third loss on the next one-second step');
    }
});

test('the crisis resets only when both supplies return, without double losses for two missing supplies',t=>{
    const {engine,p}=game(t);shortage(p,'both');
    engine.advance(10);assert.equal(p.points.toNumber(),9);
    p.food.points=new Decimal(50);
    engine.advance(8);assert.equal(p.points.toNumber(),8);
    p.water.points=new Decimal(50);
    engine.advance(1);assert.deepEqual(p.civ.shortage,{elapsed:0,losses:0});
    p.food.points=new Decimal(0);
    engine.advance(9);assert.equal(p.points.toNumber(),8);
    engine.advance(1);assert.equal(p.points.toNumber(),7);
});

test('a supply crew returning at the grace deadline prevents the loss',t=>{
    const {engine,p,e}=game(t);shortage(p);
    assert.equal(e.dispatch('gather'),true);
    engine.advance(10);
    assert.equal(p.points.toNumber(),10);
    assert.ok(p.food.points.gt(0));
    assert.deepEqual(p.civ.shortage,{elapsed:0,losses:0});
});

test('emergency upgrades protect their own supply and the unprepared shortage still controls the deadline',t=>{
    for(const [resource,upgrade,total] of [['food','rationing',5],['water','waterReserves',4]]){
        const {engine,p,e}=game(t);
        p.points=new Decimal(10);p.organization.total=new Decimal(total);p.craft.points=new Decimal(2);
        p.food.points=new Decimal(resource==='food'?20:50);p.water.points=new Decimal(resource==='water'?20:50);
        assert.equal(e.buyUpgrade(upgrade),true);
        engine.advance(19);assert.equal(p.points.toNumber(),10);
        engine.advance(1);assert.equal(p.points.toNumber(),9);
        assert.equal(e.shortageStatus().grace,20);
    }
    const {engine,p,e}=game(t);shortage(p,'both');
    p.civ.improvements.rationing=true;
    engine.advance(10);assert.equal(p.points.toNumber(),9,'Water is still unprotected');
    assert.equal(e.shortageStatus().grace,10);
});

test('Mutual aid slows accelerating losses',t=>{
    const {engine,p,e}=game(t);shortage(p);
    p.organization.total=new Decimal(8);p.organization.points=new Decimal(1);p.craft.points=new Decimal(3);
    assert.equal(e.buyUpgrade('relief'),true);
    engine.advance(10);assert.equal(p.points.toNumber(),9);
    engine.advance(8);assert.equal(p.points.toNumber(),9);
    engine.advance(1);assert.equal(p.points.toNumber(),8);
});

test('one survivor retains solo recovery actions and can grow again',t=>{
    const {engine,p,e}=game(t);shortage(p,'both');
    engine.advance(120);
    assert.equal(p.points.toNumber(),1);
    assert.equal(e.supply().availableWorkers,1);
    assert.equal(e.actionDefinition('water').workers,1);
    assert.equal(e.dispatch('water'),true);
    engine.advance(16);
    assert.equal(p.civ.actions.water.completed,1);
    assert.equal(e.dispatch('gather'),true);
    engine.advance(10);
    assert.ok(p.food.points.gt(0)&&p.water.points.gt(0));
    engine.advance(12);
    assert.ok(p.points.gte(2));
    assert.equal(engine.session.saveCommands.saveCodec().encodePlayer(p).ok,true);
});

test('population losses pause construction without losing work and resume when labor and supplies recover',t=>{
    const {engine,p,e}=game(t);shortage(p,'food',4);
    p.food.sites=4;
    assert.equal(e.startProject('food-site'),true);
    assert.equal(e.dispatch('hunt'),true);
    engine.advance(9);const work=p.civ.projectWork;
    engine.advance(1);
    assert.equal(p.points.toNumber(),3);
    assert.equal(p.civ.projectWorkers,0);
    assert.equal(p.civ.projectWork,work);
    assert.ok(e.supply().laborUsed<=3);
    p.food.points=new Decimal(50);p.water.points=new Decimal(50);
    e.recall('hunt');engine.advance(1);
    assert.equal(p.civ.projectWorkers,1);
    assert.equal(p.civ.projectWork,work);
    engine.advance(1);assert.ok(p.civ.projectWork>work);
});

test('Water Keeper reserves a dedicated worker at full storage and cannot overbook',t=>{
    const {engine,p,e}=game(t);
    p.civ.improvements.waterOrders=true;p.water.points=new Decimal(50);
    const available=e.supply().availableWorkers;
    assert.equal(e.toggleRepeat('water'),true);
    assert.equal(e.supply().keeperWorkers,1);
    assert.equal(e.supply().availableWorkers,available-1);
    engine.advance(1);assert.equal(p.civ.actions.water.remaining,0);
    assert.equal(e.toggleRepeat('water'),true);
    assert.equal(e.supply().keeperWorkers,0);
    e.dispatch('hunt');e.dispatch('gather');e.startProject('food-site');
    assert.equal(e.toggleRepeat('water'),false);
});

test('a shortage can release the keeper before recalling a critical supply crew',t=>{
    const {engine,p,e}=game(t);shortage(p,'food',6);
    p.civ.improvements.waterOrders=true;
    e.toggleRepeat('water');e.dispatch('hunt');e.dispatch('fish');
    engine.advance(10);
    assert.equal(p.points.toNumber(),5);
    assert.equal(p.civ.actions.water.repeat,false);
    assert.ok(p.civ.actions.hunt.remaining>0);
    assert.ok(e.supply().laborUsed<=5);
});

test('both prestiges reset Population to five, seed ten supplies and switch Water Keeper off',t=>{
    for(const id of ['craft','organization']){
        const {engine,p,e}=game(t);
        p.points=new Decimal(16);p.food.points=new Decimal(0);p.water.points=new Decimal(0);
        p.shelter.homes=11;p.shelter.points=new Decimal(52);
        p.organization.total=new Decimal(10);
        p.civ.improvements.waterOrders=true;p.civ.actions.water.repeat=true;
        p.civ.shortage={elapsed:9,losses:2};p.civ.growth=0.5;
        assert.equal(e.prestige(id),true);
        assert.equal(p.points.toNumber(),5);
        assert.equal(p.food.points.toNumber(),10);assert.equal(p.water.points.toNumber(),10);
        assert.equal(p.civ.actions.water.repeat,false);
        assert.deepEqual(p.civ.shortage,{elapsed:0,losses:0});
        assert.equal(e.prestige(id),false);
        assert.equal(engine.session.saveCommands.saveCodec().encodePlayer(p).ok,true);
    }
});

test('Craft requires only Population, granting one at twelve then one per two more',t=>{
    const {p,e}=game(t);p.food.points=new Decimal(0);p.water.points=new Decimal(0);
    for(const [population,gain] of [[1,0],[11,0],[12,1],[13,1],[14,2],[15,2],[16,3],[20,5]]){
        p.points=new Decimal(population);assert.equal(e.prestigeGain('craft'),gain);
    }
});

test('Organization requires only housing, advances by four lifetime housing per point and never grants bulk',t=>{
    const {p,e}=game(t);shortage(p,'both',1);
    for(let earned=0;earned<3;earned++){
        p.organization.points=new Decimal(0);
        const required=12+4*earned;
        assert.equal(e.organizationHousingRequirement(),required);
        p.shelter.points=new Decimal(required-1);assert.equal(e.prestigeGain('organization'),0);
        p.shelter.points=new Decimal(required);assert.equal(e.prestigeGain('organization'),1);
        p.shelter.points=new Decimal(1000);assert.equal(e.prestigeGain('organization'),1);
        p.shelter.homes=248;
        assert.equal(e.prestige('organization'),true);
        assert.equal(p.organization.total.toNumber(),earned+1);
        p.points=new Decimal(1);p.food.points=new Decimal(0);p.water.points=new Decimal(0);
    }
});

test('shortage countdown and paused construction survive the current codec',t=>{
    const {engine,p,e}=game(t);shortage(p,'food',4);
    p.food.sites=4;e.startProject('food-site');e.dispatch('hunt');engine.advance(10);
    const restored=createBalanceEngine(engine.exportPlayer());t.after(restored.dispose);
    assert.equal(restored.player.civ.projectWorkers,0);
    assert.equal(restored.player.civ.projectWork,p.civ.projectWork);
    assert.deepEqual(restored.player.civ.shortage,p.civ.shortage);
    const second=game(t);shortage(second.p);second.engine.advance(9);
    const countdown=createBalanceEngine(second.engine.exportPlayer());t.after(countdown.dispose);
    countdown.advance(1);assert.equal(countdown.player.points.toNumber(),9);
});

test('older keeper toggles migrate off without discarding active crews, while current overbooking is rejected',t=>{
    const {engine,p}=game(t);
    const raw=JSON.parse(atob(engine.exportPlayer()));raw.version='0.4';raw.points='4';
    raw.civ.improvements.waterOrders=true;raw.civ.actions.water.repeat=true;delete raw.civ.shortage;
    raw.civ.actions.hunt={remaining:15,duration:25,workers:3,reward:24,completed:0,repeat:false};
    raw.civ.actions.gather={remaining:5,duration:10,workers:1,reward:6,completed:0,repeat:false};
    assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(raw))).ok,true);
    assert.equal(engine.player.civ.actions.water.repeat,false);
    assert.equal(engine.player.civ.actions.hunt.remaining,15);
    assert.deepEqual(engine.player.civ.shortage,{elapsed:0,losses:0});
    raw.version='0.5';raw.civ.shortage={elapsed:0,losses:0};
    assert.equal(engine.session.loadPlayer(btoa(JSON.stringify(raw))).ok,false);
    assert.equal(engine.player.civ.actions.hunt.remaining,15);
});

test('one-second shortage simulation is identical across online and offline-like chunks',t=>{
    const a=game(t),b=game(t);
    for(const current of [a,b]){shortage(current.p,'both',10);current.e.startProject('water-site');current.e.dispatch('hunt');}
    a.engine.advance(40.5);
    for(let step=0;step<810;step++)b.engine.advance(0.05);
    assert.equal(a.p.points.toString(),b.p.points.toString());
    assert.deepEqual(a.p.civ.shortage,b.p.civ.shortage);
    assert.deepEqual(a.p.civ.actions,b.p.civ.actions);
    assert.equal(a.p.civ.projectWork,b.p.civ.projectWork);
    assert.equal(a.p.civ.projectWorkers,b.p.civ.projectWorkers);
});
