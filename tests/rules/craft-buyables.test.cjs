const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createBalanceEngine} = require('../../scripts/balance/engine.cjs');
const equipment = ['roofs','hunting','water-storage','digging','jars','bricks','clayPots','pipes','copperAxes','butchery','copperPots','sickles'];
function game(t, save) {
    const engine = createBalanceEngine(save); t.after(engine.dispose);
    const p = engine.player, e = engine.session.modRules.civilization, D = p.points.constructor;
    return {engine,p,e,D};
}
function fund(g) {
    const {p,e,D} = g;
    p.organization.points = new D(10); p.organization.best = new D(10);
    p.craft.points = new D(10000); p.civ.fire = 10;
    p.civ.improvements.gravity = true; p.civ.improvements.farming = true;
    for (const id of ['crafting','clay','copper','cooking']) assert.equal(e.buyUpgrade(id),true);
}
function finish(g,id) {
    assert.equal(g.e.startProject(id),true,id);
    const work = g.e.summary().project.work;
    g.engine.advance(Math.ceil(work));
    assert.equal(g.p.civ.project,'',id+' completed');
}
test('Craft sells only material knowledge and every equipment buyable appears once beside its resource',t=>{
    const g=game(t);fund(g);
    const expected={food:['hunting','digging','butchery','sickles'],water:['water-storage','jars','pipes'],
        shelter:['roofs','bricks','copperAxes'],fire:['clayPots','copperPots']};
    assert.deepEqual(g.e.projects('craft'),[]);assert.deepEqual(g.e.materialRows().map(row=>row.id),['crafting','clay','copper']);
    const listed=[];
    for(const [resource,ids] of Object.entries(expected)){
        const actual=g.e.projects(resource).filter(item=>equipment.includes(item.id));
        assert.deepEqual(actual.map(item=>item.id).sort(),ids.sort(),resource);
        assert.ok(actual.every(item=>item.resource===resource));listed.push(...actual.map(item=>item.id));
    }
    assert.deepEqual(listed.sort(),[...equipment].sort());assert.equal(new Set(listed).size,12);
    assert.deepEqual(g.e.summary().cookingVessels.map(item=>item.id),['clayPots','copperPots']);
});
test('all twelve equipment cells are repeatable Craft purchases with scaling cost and work',t=>{
    const g=game(t); fund(g);
    for (const id of equipment) {
        const first=g.e.equipmentProjects(true).find(item=>item.id===id);
        assert.ok(first.craftCost>0,id);
        finish(g,id);
        const second=g.e.equipmentProjects(true).find(item=>item.id===id);
        assert.equal(g.p.civ.equipment[id],1,id);
        assert.equal(second.craftCost,first.craftCost*2,id);
        assert.equal(second.work,first.work*1.35,id);
    }
    for (const id of equipment) { g.p.civ.fire=10; finish(g,id); assert.equal(g.p.civ.equipment[id],2,id); }
    assert.deepEqual(g.e.materialRows().map(row=>row.id),['crafting','clay','copper']);
    assert.ok(g.e.materialRows().every(row=>!Object.hasOwn(row,'items')));
    assert.deepEqual(g.e.projects('craft'),[]);
    g.engine.exportPlayer();
});
test('both prestiges reset every equipment cost even at milestone ten, then survive reload',t=>{
    for (const prestige of ['craft','organization']) {
        const g=game(t); fund(g);
        for (const id of equipment) g.p.civ.equipment[id]=3;
        g.p.shelter.homes=3;g.p.shelter.points=new g.D(47);g.p.points=new g.D(48);
        const plan=g.e.prestigePreview(prestige);
        assert.ok(equipment.every(id=>plan.resetBuyables.includes(id)),prestige);
        assert.ok(equipment.every(id=>!plan.kept[id]),prestige);
        assert.equal(g.e.prestige(prestige),true);
        assert.equal(g.p.shelter.homes,3);assert.equal(g.p.shelter.points.toNumber(),20);
        assert.ok(equipment.every(id=>g.p.civ.equipment[id]===0));
        const loaded=game(t,g.engine.exportPlayer());
        assert.deepEqual(loaded.e.equipmentProjects(true).map(item=>item.craftCost),[1,1,1,1,2,2,2,2,3,3,3,3]);
        assert.ok(['crafting','clay','copper'].every(id=>loaded.p.civ.improvements[id]));
        finish(loaded,'water-storage');assert.equal(loaded.p.civ.equipment['water-storage'],1);
    }
});
test('only expedition exceptions unlock at milestone two; huts remain at one and current Organization guards levels',t=>{
    const {p,e,D}=game(t);
    for(const id of ['food-site','food-storage','water-site','fish-tools','farm-tools']) assert.equal(e.startProject(id),false,id);
    assert.deepEqual(e.projects('water'),[]);assert.deepEqual(e.projects('food'),[]);
    p.organization.points=new D(1);assert.equal(e.startProject('shelter-home'),true);e.cancelProject();
    assert.deepEqual(e.projects('food'),[]);
    p.organization.points=new D(2);
    assert.deepEqual(e.projects('food').map(x=>x.id),['gather-tools','hunt-tools']);
    assert.equal(e.startProject('gather-tools'),true);e.cancelProject();
    p.food.routes.gather=1;assert.equal(e.startProject('gather-tools'),false);
    p.organization.points=new D(3);assert.equal(e.startProject('gather-tools'),true);e.cancelProject();
    p.organization.best=new D(3);p.organization.points=new D(0);
    assert.equal(e.projects('food').length,2);assert.equal(e.startProject('hunt-tools'),false);
});
test('denied and busy purchases never charge; canceled work loses payment without raising level',t=>{
    const g=game(t);fund(g);g.p.craft.points=new g.D(0);
    const before=g.engine.exportPlayer();assert.equal(g.e.startProject('digging'),false);assert.equal(g.engine.exportPlayer(),before);
    g.p.craft.points=new g.D(1);assert.equal(g.e.startProject('digging'),true);assert.equal(g.p.craft.points.toNumber(),0);
    assert.equal(g.e.startProject('digging'),false);assert.equal(g.p.civ.equipment.digging,0);
    g.e.cancelProject();assert.equal(g.p.civ.equipment.digging,0);assert.equal(g.p.craft.points.toNumber(),0);
    g.p.craft.points=new g.D(100);g.p.civ.fire=1.99;
    const noFuel=g.engine.exportPlayer();assert.equal(g.e.startProject('pipes'),false);assert.equal(g.engine.exportPlayer(),noFuel);
});
test('prestige cancels paid equipment work and recalls boosted Food snapshots without stale costs',t=>{
    const g=game(t);fund(g);finish(g,'digging');finish(g,'water-storage');g.e.dispatch('gather');
    assert.equal(g.e.startProject('water-storage'),true);g.engine.advance(1);g.p.points=new g.D(12);
    const plan=g.e.prestigePreview('craft');assert.ok(plan.resetConstruction);assert.ok(plan.recalledActions.includes('gather'));
    assert.equal(g.e.prestige('craft'),true);assert.equal(g.p.civ.project,'');assert.equal(g.p.civ.actions.gather.remaining,0);
    assert.equal(g.e.equipmentProjects(true).find(x=>x.id==='water-storage').craftCost,1);
    g.engine.exportPlayer();
});
test('current saves reject malformed levels, obsolete ownership and retired projects atomically',t=>{
    const g=game(t);fund(g);const before=g.engine.exportPlayer();
    for(const mutate of [raw=>raw.civ.equipment.roofs=-1,raw=>raw.civ.equipment.jars=1.5,raw=>raw.civ.equipment.extra=1,
        raw=>raw.civ.improvements.roofs=true,raw=>raw.civ.project='water-site',raw=>raw.water.sites=1]) {
        const raw=JSON.parse(atob(before));mutate(raw);
        assert.equal(g.engine.session.loadPlayer(btoa(JSON.stringify(raw))).ok,false);
        assert.equal(g.engine.exportPlayer(),before);
    }
});
test('material and predecessor guards apply to every new purchase and imported project',t=>{
    const g=game(t);g.p.craft.points=new g.D(100);
    assert.ok(equipment.every(id=>!g.e.startProject(id)));
    g.e.buyUpgrade('clay');assert.equal(g.e.startProject('bricks'),false);assert.equal(g.e.startProject('jars'),false);
    const before=g.engine.exportPlayer(),raw=JSON.parse(atob(before));raw.civ.project='digging';
    assert.equal(g.engine.session.loadPlayer(btoa(JSON.stringify(raw))).ok,false);assert.equal(g.engine.exportPlayer(),before);
});
test('equipment effects compound, preserve dispatched snapshots and keep chunk/save parity',t=>{
    const g=game(t);fund(g);const base=g.e.actionDefinition('gather').reward;
    finish(g,'digging');assert.equal(g.e.actionDefinition('gather').reward,base*1.25);
    g.e.dispatch('gather');const snapshot=g.p.civ.actions.gather.reward;finish(g,'digging');
    assert.equal(g.e.actionDefinition('gather').reward,base*1.25**2);
    assert.equal(snapshot,base*1.25);
    g.e.dispatch('gather');g.e.startProject('roofs');
    const clone=game(t,g.engine.exportPlayer());g.engine.advance(5);for(let n=0;n<10;n++)clone.engine.advance(.5);
    assert.equal(g.engine.exportPlayer(),clone.engine.exportPlayer());
});
test('retired base and Fire purchases migrate once, refund known Craft and preserve Water levels, stocks and housing',t=>{
    const fixture=require('../fixtures/civ-pre-repeatables-v091.json');const g=game(t,fixture.player);
    assert.equal(g.p.version,'0.93');assert.equal(g.p.craft.points.toNumber(),29);
    assert.equal(g.p.civ.equipment['water-storage'],2);assert.equal(g.p.civ.equipment.jars,1);
    assert.equal(g.e.supply().storage.water,70);assert.equal(g.p.shelter.points.toNumber(),14);
    assert.equal(g.p.civ.equipment.roofs,0);assert.equal(g.p.civ.equipment.bricks,1);
    assert.equal(g.p.civ.fire,12);assert.equal(g.p.civ.project,'');assert.equal(Object.hasOwn(g.p.civ,'fireBuyables'),false);
    for(const resource of ['water','food']) {assert.equal(g.p[resource].sites,0);assert.equal(g.p[resource].storage,0);}
    assert.equal(Object.hasOwn(g.p.food.routes,'fish'),false);assert.equal(g.p.food.routes.farm,0);
    const loaded=game(t,g.engine.exportPlayer());assert.equal(loaded.engine.exportPlayer(),g.engine.exportPlayer());
    assert.deepEqual(g.e.projects('fire').map(item=>item.id),['clayPots','copperPots']);
    for(const id of ['fire-fuel','fire-hearths','fire-charcoal','water-site','food-storage','fish-tools'])assert.equal(g.e.startProject(id),false);
});
test('malformed historical purchases reject before refunds or replacement of live state',t=>{
    const fixture=require('../fixtures/civ-pre-repeatables-v091.json'),g=game(t),before=g.engine.exportPlayer();
    for(const mutate of [raw=>raw.civ.fireBuyables=null,raw=>raw.civ.fireBuyables.fuel=-1,raw=>raw.water.storage='2',
        raw=>raw.civ.improvements.roofs=1,raw=>raw.shelter.points='999',raw=>raw.civ.fire=1000,
        raw=>raw.civ.projectWork=-1,raw=>raw.civ.projectWork=null,raw=>raw.civ.projectWorkers=2,
        raw=>raw.civ.projectJobs=2,raw=>{raw.civ.project='water-site';raw.civ.projectWork=-1;}]) {
        const raw=JSON.parse(atob(fixture.player));mutate(raw);const original=JSON.stringify(raw);
        assert.equal(g.engine.session.loadPlayer(raw).ok,false,mutate.toString());assert.equal(JSON.stringify(raw),original);
        assert.equal(g.engine.exportPlayer(),before);
    }
});
test('the published fishing-free 0.92 model migrates into repeatable equipment without restoring fishing',t=>{
    const fixture=require('../fixtures/civ-pre-repeatables-v092.json'),g=game(t,fixture.save);
    assert.equal(g.p.version,'0.93');assert.equal(g.p.civ.equipment['water-storage'],2);
    assert.equal(g.e.supply().storage.water,50);assert.equal(g.p.craft.points.toNumber(),100);
    assert.equal(g.e.actionDefinition('fish'),null);assert.equal(Object.hasOwn(g.p.civ.actions,'fish'),false);
    const loaded=game(t,g.engine.exportPlayer());assert.equal(loaded.engine.exportPlayer(),g.engine.exportPlayer());
});
test('repeatable tools, housing, pipes and vessels apply real effects after construction',t=>{
    const g=game(t);fund(g);
    finish(g,'roofs');finish(g,'roofs');finish(g,'bricks');finish(g,'shelter-home');assert.equal(g.p.shelter.points.toNumber(),16);
    finish(g,'water-storage');assert.equal(g.e.supply().storage.water,50);finish(g,'jars');assert.equal(g.e.supply().storage.water,70);
    const flow=g.e.supply().passiveProduction.water;finish(g,'pipes');assert.ok(Math.abs(g.e.supply().passiveProduction.water-flow*2)<1e-8);
    const duration=g.e.actionDefinition('farm').duration;finish(g,'sickles');finish(g,'sickles');assert.equal(g.e.actionDefinition('farm').duration,duration*.75**2);
    finish(g,'hunting');const hunt=g.e.actionDefinition('hunt');finish(g,'butchery');assert.equal(g.e.actionDefinition('hunt').workers,hunt.workers);assert.equal(g.e.actionDefinition('hunt').reward,hunt.reward*1.5);
    finish(g,'clayPots');finish(g,'copperPots');g.e.setCookingLevel(3);g.p.civ.fire=10;g.e.dispatch('gather');assert.equal(g.e.fireStatus().cookingMultiplier,3.5);
    const rate=g.e.fireStatus().consumption;g.engine.advance(1);assert.ok(Math.abs(g.p.civ.fire-(10-rate/60))<1e-8);g.engine.exportPlayer();
});
