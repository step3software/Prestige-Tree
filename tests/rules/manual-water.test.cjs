const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBalanceEngine}=require('../../scripts/balance/engine.cjs');
function game(t,save){
    const engine=createBalanceEngine(save);t.after(engine.dispose);
    const p=engine.player,e=engine.session.modRules.civilization,D=p.points.constructor;
    p.civ.improvements.crafting=true;p.craft.points=new D(100);
    return {engine,p,e,D};
}
test('each tightly woven basket adds ten manual Water without changing crew, time or reservoir storage',t=>{
    const {p,e}=game(t);
    for(let level=0;level<=3;level++){
        p.civ.equipment['water-storage']=level;
        const water=e.actionDefinition('water');
        assert.equal(water.reward,14+10*level);assert.equal(water.workers,2);assert.equal(water.duration,8);
        assert.equal(e.supply().storage.water,50);
    }
});
test('completing a basket preserves a dispatched Water load and improves the next trip',t=>{
    const {engine,p,e}=game(t);
    assert.equal(e.startProject('water-storage'),true);engine.advance(7);assert.equal(e.dispatch('water'),true);
    assert.equal(p.civ.actions.water.reward,14);engine.advance(5);
    assert.equal(p.civ.equipment['water-storage'],1);assert.equal(p.civ.actions.water.reward,14);
    assert.equal(e.actionDefinition('water').reward,24);
});
test('jars separately add twenty carrying and twenty storage per purchase without multiplying baskets',t=>{
    const {p,e}=game(t);p.civ.improvements.clay=true;
    for(const baskets of [1,2,4])for(const jars of [0,1,2,3]){
        p.civ.equipment['water-storage']=baskets;p.civ.equipment.jars=jars;
        assert.equal(e.actionDefinition('water').reward,14+10*baskets+20*jars);
        assert.equal(e.supply().storage.water,50+20*jars);
    }
});
test('manual Water rewards deliver through the real trip and round-trip with their independent levels',t=>{
    const {engine,p,e,D}=game(t);p.civ.improvements.clay=true;
    p.civ.equipment['water-storage']=1;p.civ.equipment.jars=1;p.water.points=new D(0);
    const total=p.water.total.toNumber();assert.equal(e.dispatch('water'),true);assert.equal(p.civ.actions.water.reward,44);
    const loaded=createBalanceEngine(engine.exportPlayer());t.after(loaded.dispose);
    engine.advance(8);loaded.advance(8);
    assert.equal(p.water.total.toNumber()-total,44);assert.equal(engine.exportPlayer(),loaded.exportPlayer());
});
test('both prestiges reset carrying bonuses and prices while preserving an already dispatched load',t=>{
    for(const prestige of ['craft','organization']){
        const {engine,p,e,D}=game(t);p.civ.improvements.clay=true;
        p.civ.equipment['water-storage']=2;p.civ.equipment.jars=2;p.points=new D(12);
        assert.equal(e.dispatch('water'),true);assert.equal(p.civ.actions.water.reward,74);
        assert.equal(e.prestige(prestige),true);assert.equal(e.actionDefinition('water').reward,14);
        assert.equal(p.civ.actions.water.reward,74);assert.equal(e.supply().storage.water,50);
        assert.equal(e.projects('water').find(item=>item.id==='water-storage').craftCost,1);
        engine.exportPlayer();
    }
});
test('stored Water above the revised capacity survives load and is consumed normally',t=>{
    const {engine,p,D}=game(t);p.civ.equipment['water-storage']=3;p.water.points=new D(100);
    const loaded=createBalanceEngine(engine.exportPlayer());t.after(loaded.dispose);
    assert.equal(loaded.player.water.points.toNumber(),100);
    assert.equal(loaded.session.modRules.civilization.supply().storage.water,50);
    loaded.advance(1);assert.ok(loaded.player.water.points.gt(99));assert.ok(loaded.player.water.points.lt(100));
});
