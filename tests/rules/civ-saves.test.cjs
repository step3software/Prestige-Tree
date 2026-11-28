const test = require('node:test');
const assert = require('node:assert/strict');
const {createRuntime} = require('../support/game-runtime.cjs');
const key = 'civ-prestige-tree';
function open(t, options = {}) {
    const r=createRuntime({bridge:false,...options});r.run('gameUI.commands.load();var s=gameUI.session,p=s.saveState.player,e=s.modRules.civilization;');
    if(!options.storage || !options.storage[key])r.run('if(p){Object.assign(p.civ.features,{huts:true,hunting:true,fishing:true,buyables:false});p.civ.improvements.crafting=true;p.organization.points=new Decimal(7);}');
    t.after(()=>{r.run('s.dispose()');r.dispose();});return r;
}
test('Civ storage is independent of the untouched original ptr value', t => {
    const original='original-opaque-prestige-save';
    const r=open(t,{storage:{ptr:original}});
    r.run('e.startProject("food-site");s.advance(30);gameUI.commands.save()');
    assert.equal(r.data.get('ptr'),original);
    assert.ok(r.data.has(key));
    const restored=open(t,{storage:Object.fromEntries(r.data)});
    assert.equal(restored.run('p.food.sites'),1);
    assert.equal(restored.run('p.points.toString()'),r.run('p.points.toString()'));
    assert.equal(restored.alerts.length,0);
});
test('invalid content, foreign saves and negative supplies cannot replace durable or live state', t => {
    const r=open(t);r.run('gameUI.commands.save()');const durable=r.data.get(key);
    for(const mutation of ["candidate.tab='help'","candidate.points='-1'","candidate.food.points='-1'","candidate.civ.priority='unknown'","candidate.shelter.points='999'","candidate.versionType='ptr'"]){
        r.run(`var candidate=JSON.parse(atob(s.saveCommands.saveCodec().encodePlayer(p).text));${mutation};var result=s.saveCommands.saveCodec().decodePlayer(candidate);`);
        assert.equal(r.run('result.ok'),false,mutation);
        assert.equal(r.data.get(key),durable);
        assert.equal(r.run('p.points.toNumber()'),5);
    }
});
test('storage denial preserves prior durable data and saving recovers when restored', t => {
    const r=open(t);r.run('gameUI.commands.save()');const before=r.data.get(key);
    r.io.storageError=true;r.run('s.advance(30)');
    assert.equal(r.run('gameUI.commands.save()'),false);
    assert.equal(r.data.get(key),before);
    assert.match(r.elements['save-status'].textContent,/unsaved|unchanged/);
    r.io.storageError=false;
    assert.equal(r.run('gameUI.commands.save()'),true);
    assert.notEqual(r.data.get(key),before);
});
test('corrupt startup protects original bytes and starts no runtime', t => {
    const r=open(t,{storage:{[key]:'corrupt'}});
    assert.equal(r.data.get(key),'corrupt');
    assert.equal(r.run('s.saveState.player'),undefined);
    assert.equal(r.intervals.size,0);
    assert.equal(r.elements['save-recovery'].hidden,false);
});
test('export/import round trip retains the simulation remainder and building progress', t => {
    const r=open(t);r.run('e.startProject("water-site");s.advance(2.5);var encoded=s.saveCommands.saveCodec().encodePlayer(p).text');
    const encoded=r.run('encoded');
    const target=open(t);target.io.prompt=encoded;
    assert.equal(target.run('gameUI.commands.importSave()'),true);
    const revived=open(t,{storage:Object.fromEntries(target.data)});
    assert.equal(revived.run('p.civ.project'),'water-site');
    assert.equal(revived.run('p.civ.tickRemainder'),.5);
    assert.equal(revived.run('p.civ.projectWork'),r.run('p.civ.projectWork'));
});

test('active crews and repeat orders survive a codec round trip without duplicate yield',t=>{
    const r=open(t);
    r.run('p.craft.points=new Decimal(1);p.organization.points=new Decimal(1);p.organization.total=new Decimal(5);p.organization.points=new Decimal(5);p.food.points=new Decimal(30);e.buyUpgrade("overseer");e.setRepeat("gather",1);e.dispatch("gather");e.dispatch("water");s.advance(3);var encoded=s.saveCommands.saveCodec().encodePlayer(p).text');
    const target=open(t);target.io.prompt=r.run('encoded');
    assert.equal(target.run('gameUI.commands.importSave()'),true);
    target.run('p=s.saveState.player');
    assert.equal(target.run('p.civ.actions.gather.remaining'),7);
    assert.equal(target.run('p.civ.actions.water.remaining'),5);
    assert.equal(target.run('p.civ.actions.gather.repeat'),1);
    target.run('s.advance(7)');
    assert.equal(target.run('p.civ.actions.gather.completed'),1);
    assert.equal(target.run('p.civ.actions.water.completed'),1);
});

test('0.1 Civ saves acquire current action defaults while retaining infrastructure and construction',t=>{
    const r=open(t);
    r.run(`e.startProject('water-site');s.advance(2);var raw=JSON.parse(atob(s.saveCommands.saveCodec().encodePlayer(p).text));raw.version='0.1';delete raw.food.routes;delete raw.shelter.comfort;for(var key of ['actions','improvements','projectWorkers','irrigation','autoIrrigate'])delete raw.civ[key];var result=s.saveCommands.saveCodec().decodePlayer(raw);`);
    assert.equal(r.run('result.ok'),true);
    assert.equal(r.run('result.value.civ.project'),'water-site');
    assert.equal(r.run('result.value.civ.projectWork'),r.run('raw.civ.projectWork'));
    assert.equal(r.run('result.value.civ.actions.gather.remaining'),0);
    assert.equal(r.run('result.value.civ.projectWorkers'),1);
    assert.equal(r.run('result.value.shelter.comfort'),0);
});

test('malformed action contracts and overcommitted crews are rejected before activation',t=>{
    const r=open(t);
    for(const mutation of [
        'raw.civ.actions.gather.remaining=11;raw.civ.actions.gather.duration=10',
        'raw.civ.actions.gather.repeat=true',
        'raw.civ.actions.gather.remaining=5;raw.civ.actions.gather.duration=10;raw.civ.actions.gather.reward=6',
        'for(var id of ["hunt","fish","water"]){raw.civ.actions[id].remaining=5;raw.civ.actions[id].duration=10;raw.civ.actions[id].workers=id==="hunt"?3:2;raw.civ.actions[id].reward=10}'
    ]){
        r.run('var raw=JSON.parse(atob(s.saveCommands.saveCodec().encodePlayer(p).text));'+mutation+';var result=s.saveCommands.saveCodec().decodePlayer(raw)');
        assert.equal(r.run('result.ok'),false,mutation);
        assert.equal(r.run('p.points.toNumber()'),5);
    }
});

test('spent Organization keeps history but locks milestones across saving and reload',t=>{
    const r=open(t);
    r.run('p.organization.total=new Decimal(10);p.organization.points=new Decimal(10);p.organization.points=new Decimal(0);p.food.routes.fish=2;gameUI.commands.save()');
    const restored=open(t,{storage:Object.fromEntries(r.data)});
    assert.equal(restored.run('e.organizationMilestones().filter(m=>m.earned).length'),0);
    assert.equal(restored.run('e.prestigePreview("craft").kept["shelter-home"]'),false);
    assert.equal(restored.run('p.food.routes.fish'),2);
    assert.equal(restored.run('e.summary().autoAvailable'),false);
});
