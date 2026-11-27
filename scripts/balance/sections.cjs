// Resource checkpoints are observed through the actual shipped state. Separate
// branch entries retain their timings; the final checkpoint covers the staffed opening.
const sections = [
  {id:'supported-eight',name:'8 supported people',test:p=>p.points.gte(8)},
  ...Array.from({length:10},(_,index)=>({id:'organization-'+(index+1),name:'Organization milestone '+(index+1),test:p=>p.organization.total.gte(index+1)})),
  {id:'overseer',name:'Food repeat orders earned',test:p=>p.civ.improvements.overseer},
  {id:'water-flow',name:'Worker-free Water',test:p=>p.civ.improvements.gravity},
  {id:'farming',name:'Farming cycles',test:p=>p.civ.improvements.farming},
  {id:'craft',name:'First Craft',test:p=>p.craft.total.gte(1)},
  {id:'organization',name:'First Organization',test:p=>p.organization.total.gte(1)},
  {id:'endgame',name:'Opening chapter complete',test:p=>p.civ.improvements.overseer && p.civ.improvements.gravity && p.civ.improvements.farming && p.organization.total.gte(10)},
];
const progressionLayers=['food','water','shelter','craft','organization'];
module.exports={sections,progressionLayers};
