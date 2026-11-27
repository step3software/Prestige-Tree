// Resource checkpoints are observed through the actual shipped state. Separate
// branch entries retain their timings; the final checkpoint requires both investments.
const sections = [
  {id:'supported-eight',name:'8 supported people',test:p=>p.points.gte(8)},
  {id:'water-retention',name:'Water buyables retained',test:p=>p.organization.total.gte(1)},
  {id:'food-retention',name:'Food buyables retained',test:p=>p.organization.total.gte(3)},
  {id:'shelter-retention',name:'Shelter buyables retained',test:p=>p.organization.total.gte(5)},
  {id:'overseer',name:'Food repeat orders earned',test:p=>p.civ.improvements.overseer},
  {id:'water-flow',name:'Worker-free Water',test:p=>p.civ.improvements.gravity},
  {id:'farming',name:'Farming cycles',test:p=>p.civ.improvements.farming},
  {id:'craft',name:'First Craft',test:p=>p.craft.total.gte(1)},
  {id:'organization',name:'First Organization',test:p=>p.organization.total.gte(1)},
  {id:'surplus',name:'Money and Time',test:p=>p.money.unlocked && p.freeTime.unlocked},
  {id:'expression',name:'Education and Culture discovered',test:p=>p.education.unlocked && p.culture.unlocked},
  {id:'endgame',name:'Opening chapter complete',test:p=>p.education.total.gte(1) && p.culture.total.gte(1) && p.civ.improvements.overseer && p.civ.improvements.gravity && p.civ.improvements.farming},
];
const progressionLayers=['food','water','shelter','craft','organization','money','freeTime','education','culture'];
module.exports={sections,progressionLayers};
