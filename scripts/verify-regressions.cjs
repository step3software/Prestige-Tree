const assert = require('node:assert/strict');
const fs = require('node:fs');
const {createRuntime,root} = require('../tests/support/game-runtime.cjs');
const path = require('node:path');
const source=fs.readFileSync(path.join(root,'js/civilization.js'),'utf8');
function observation(text){
    const r=createRuntime({bridge:false,sources:{'js/civilization.js':text}});
    try{
        r.run('gameUI.commands.load();var s=gameUI.session,p=s.saveState.player,e=s.modRules.civilization;');
        return r.run(`p.points=new Decimal(12);p.shelter.homes=1;p.shelter.points=new Decimal(12);p.food.sites=2;p.water.sites=2;p.food.points=new Decimal(50);p.water.points=new Decimal(50);e.prestige('craft');p.points.toNumber()`);
    }finally{r.run('gameUI.session.dispose()');r.dispose();}
}
assert.equal(observation(source),5,'Baseline must reset Population to the founding five');
const needle='p.points = new Decimal(startingSettlement.population);';
assert.equal(source.split(needle).length,2,'Mutation must target exactly one real reset');
const mutant=source.replace(needle,'/* Missing Population reset */');
assert.notEqual(observation(mutant),5,'Keeping Population through prestige must be detected');
console.log('Real prestige mutation detected: missing Population reset fails the starting-settlement contract.');
