const test = require('node:test');
const assert = require('node:assert/strict');
const {createRuntime} = require('../support/game-runtime.cjs');
const key = 'civ-prestige-tree';
function open(t, options = {}) {
    const r=createRuntime({bridge:false,...options});r.run('gameUI.commands.load();var s=gameUI.session,p=s.saveState.player,e=s.modRules.civilization;');
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
    for(const mutation of ["candidate.tab='help'","candidate.points='-1'","candidate.food.points='-1'","candidate.civ.priority='unknown'","candidate.civ.project='unknown'","candidate.shelter.points='999'","candidate.versionType='ptr'"]){
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
