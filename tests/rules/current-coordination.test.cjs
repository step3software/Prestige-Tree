const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
function game(t){const engine=createBalanceEngine();t.after(engine.dispose);const p=engine.player;return {engine,p,e:engine.session.modRules.civilization,D:p.points.constructor};}

test('spending Organization immediately lowers the population requirement and milestone eligibility',t=>{
 const {p,e,D}=game(t);p.organization.total=new D(50);p.organization.points=new D(3);
 assert.equal(e.organizationPopulationRequirement(),20);
 assert.equal(e.organizationMilestones()[2].earned,true);
 assert.equal(e.buyUpgrade('preparedMaterials'),true);
 assert.equal(p.organization.points.toNumber(),2);assert.equal(p.organization.total.toNumber(),50);
 assert.equal(e.organizationPopulationRequirement(),16);assert.equal(e.organizationMilestones()[2].earned,false);
 assert.equal(e.summary().foodOrdersAvailable,false);assert.equal(e.summary().hutRepeatAvailable,false);
 p.points=new D(15);assert.equal(e.prestigeGain('organization'),0);p.points=new D(16);assert.equal(e.prestigeGain('organization'),1);
 assert.equal(e.prestigePreview('organization').organizationHeld,3);
 assert.equal(e.prestige('organization'),true);assert.equal(p.organization.points.toNumber(),3);assert.equal(p.organization.total.toNumber(),51);assert.equal(e.organizationPopulationRequirement(),20);
});

test('historical totals and unlocked flags cannot bypass current feature or purchase gates',t=>{
 const {p,e,D}=game(t);p.organization.total=new D(100);p.organization.points=new D(0);p.craft.points=new D(100);
 Object.assign(p.civ.features,{huts:true,hunting:true,buyables:true});p.civ.improvements.overseer=true;p.civ.improvements.hutForeman=true;
 assert.equal(e.organizationPopulationRequirement(),8);assert.equal(e.organizationMilestones().some(m=>m.earned),false);
 assert.equal(e.startProject('shelter-home'),false);assert.equal(e.dispatch('hunt'),false);assert.equal(e.buyUpgrade('lashings'),false);
 assert.equal(e.setRepeat('gather',1),false);assert.equal(e.setHutRepeat(1),false);assert.equal(e.summary().autoAvailable,false);
});

test('spending pauses future orders, preserves active paid work and reloads the pending queue',t=>{
 const {engine,p,e,D}=game(t);p.organization.total=new D(30);p.organization.points=new D(3);
 p.points=new D(20);p.shelter.homes=3;p.shelter.points=new D(20);p.food.points=new D(10);p.water.points=new D(50);
 e.setRepeat('gather',5);e.setHutRepeat(5);engine.advance(1);
 assert.equal(p.civ.actions.gather.repeat,4);assert.equal(p.civ.hutRepeat,4);assert.equal(p.civ.project,'shelter-home');
 assert.equal(e.buyUpgrade('preparedMaterials'),true);
 assert.equal(e.supply().overseerWorkers,0);assert.equal(e.supply().foremanWorkers,0);
 const saved=engine.exportPlayer(),loaded=createBalanceEngine(saved);t.after(loaded.dispose);
 engine.advance(50);loaded.advance(50);
 assert.equal(p.civ.actions.gather.completed,1);assert.equal(p.shelter.homes,4);
 assert.equal(p.civ.actions.gather.repeat,4);assert.equal(p.civ.hutRepeat,4);
 assert.equal(p.civ.project,'');assert.equal(engine.exportPlayer(),loaded.exportPlayer());
 p.organization.points=new D(3);p.food.points=new D(10);engine.advance(1);
 assert.equal(p.civ.actions.gather.repeat,3);assert.equal(p.civ.hutRepeat,3);
});

test('zero held Organization preserves a paid hut through a locked feature and reload',t=>{
 const {engine,p,e,D}=game(t);p.organization.points=new D(3);p.organization.total=new D(3);
 e.startProject('shelter-home');assert.equal(e.buyUpgrade('workRosters'),true);assert.equal(e.organizationPopulationRequirement(),8);
 assert.equal(e.projects('shelter').length,0);assert.equal(e.summary().project.id,'shelter-home');
 const loaded=createBalanceEngine(engine.exportPlayer());t.after(loaded.dispose);loaded.advance(20);
 assert.equal(loaded.player.shelter.homes,1);assert.equal(p.civ.project,'shelter-home');
});
