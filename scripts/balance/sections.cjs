// Section entries follow the game's own help topics, rather than point thresholds
// invented by the test. Parallel branches share a section but retain layer times.
const sections = [
  {id:'prestige',name:'Prestige',layers:['p']},
  {id:'boosters-generators',name:'Boosters / Generators',layers:['b','g']},
  {id:'time-enhance-space',name:'Time / Enhance / Space',layers:['t','e','s']},
  {id:'quirks-hindrances',name:'Quirks / Hindrances',layers:['q','h']},
  {id:'solarity-subspace',name:'Solarity / Subspace',layers:['o','ss']},
  {id:'magic-balance',name:'Magic / Balance',layers:['m','ba']},
  {id:'phantom-souls',name:'Phantom Souls',layers:['ps']},
  {id:'honour',name:'Honour',layers:['hn']},
  {id:'nebula-hyperspace',name:'Nebula / Hyperspace',layers:['n','hs']},
  {id:'imperium',name:'Imperium',layers:['i']},
  {id:'mastery',name:'Mastery',layers:['ma']},
  {id:'gears',name:'Gears',layers:['ge']},
  {id:'machines',name:'Machines',layers:['mc']},
  {id:'core',name:'The Core',test:p=>p.mc.upgrades.includes(11)},
  {id:'energy-neurons',name:'Energy / Neurons',layers:['en','ne']},
  {id:'ideas',name:'Ideas',layers:['id']},
  {id:'robots',name:'Robots',layers:['r']},
  {id:'ai',name:'Artificial Intelligence',layers:['ai']},
  {id:'civilizations',name:'Civilizations',layers:['c']},
  {id:'endgame',name:'Current endgame',test:(_p,session)=>session.modRules.isEndgame()},
];
const progressionLayers = ['p','b','g','t','e','s','sb','sg','q','h','o','ss','m','ba','ps','hn','n','hs','i','ma','ge','mc','en','ne','id','r','ai','c'];
module.exports = { sections, progressionLayers };
