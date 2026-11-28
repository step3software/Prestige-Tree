function duration(seconds) {
  if (seconds===null || seconds===undefined) return 'not reached';
  if (seconds<60) return Math.round(seconds)+'s';
  if (seconds<3600) return (seconds/60).toFixed(1)+'m';
  if (seconds<86400) return (seconds/3600).toFixed(2)+'h';
  return (seconds/86400).toFixed(2)+'d';
}

function compareReference(rough,fixed) {
  const rows=rough.sections.map(row=>{
    const other=fixed.sections.find(item=>item.id===row.id);
    // Both completed runs reached the same terminal state. Their final
    // observation may differ within the tested step window; that is drift,
    // not missing coverage beyond an incomplete reference run.
    const comparisonEnd=rough.status==='endgame'&&fixed.status==='endgame'?fixed.horizonSeconds:fixed.simulatedSeconds;
    const roughTime=row.entrySeconds!==null && row.entrySeconds<=comparisonEnd?row.entrySeconds:null;
    const fixedTime=other.entrySeconds;
    return {id:row.id,roughSeconds:roughTime,fixedSeconds:fixedTime,
      relativeDifference:roughTime!==null && fixedTime!==null?(roughTime-fixedTime)/Math.max(fixedTime,1):null,
      coverageMismatch:(roughTime===null)!==(fixedTime===null)};
  });
  return {strategy:rough.strategy,horizonSeconds:fixed.horizonSeconds,roughStatus:rough.status,fixedStatus:fixed.status,
    roughWallSeconds:rough.wallSeconds,fixedWallSeconds:fixed.wallSeconds,
    speedup:rough.status==='horizon'&&fixed.status==='horizon'&&rough.horizonSeconds===fixed.horizonSeconds?fixed.wallSeconds/rough.wallSeconds:null,
    rows};
}

function markdown(report) {
  const regular=report.runs.find(run=>run.strategy==='regular');
  const candidates=report.runs;
  const lines=['# Civ Prestige Tree balance timing','',
    `Source: \`${report.sourceRevision}\`. Mode: **${report.mode}**. ${report.startDescription}.`,
    '', 'Regular play checks every **20 seconds** until Food overseer, milestone-10 auto-building and passive Water sufficient for full housing, then every **five minutes**. Active policies check every five seconds. Actual transitions are recorded in report.json.',
    '“Best tested” is an envelope of the tested strategies, not a proven optimum or one combined playthrough.',
    'Rough mode coalesces outer engine calls while the real Civ economy retains one-second internal steps. Checkpoint observation windows can differ; manual cadence stays fixed.',
    '', '| Section entry | Best tested | Winning policy | Regular |', '| --- | --- | --- | --- |'];
  for (const section of report.runs[0].sections) {
    const eligible=candidates.map(run=>({run,row:run.sections.find(item=>item.id===section.id)})).filter(item=>item.row.entrySeconds!==null)
      .sort((a,b)=>a.row.entrySeconds-b.row.entrySeconds);
    const winner=eligible[0];
    const regularRow=regular?.sections.find(row=>row.id===section.id);
    lines.push(`| ${section.name} | ${duration(winner?.row.entrySeconds)} | ${winner?.run.strategy||'—'} | ${duration(regularRow?.entrySeconds)} |`);
  }
  lines.push('','“Not reached” means not observed within that run’s simulated horizon/wall-time budget; it is not an estimate of infinity or proof the game is blocked.',
    '', '| Policy | Simulated | Wall time | Steps | Largest step | Stop reason |', '| --- | --- | --- | --- | --- | --- |');
  for (const run of report.runs) lines.push(`| ${run.strategy} | ${duration(run.simulatedSeconds)} | ${run.wallSeconds.toFixed(2)}s | ${run.steps} | ${run.largestStepSeconds}s | ${run.status} |`);
  if (report.calibration.length) {
    lines.push('','## Matched fixed-step calibration','',
      'These comparisons apply only to the observed early checkpoints and the stated horizon; they do not validate unmeasured late-game sections.',
      '', '| Policy | Matched horizon | Speedup | Checkpoint | Rough | Fixed | Difference |', '| --- | --- | --- | --- | --- | --- | --- |');
    for (const pair of report.calibration) {
      for (const row of pair.rows.filter(row=>row.roughSeconds!==null || row.fixedSeconds!==null)) {
        lines.push(`| ${pair.strategy} | ${duration(pair.horizonSeconds)} | ${pair.speedup===null?'not comparable':pair.speedup.toFixed(2)+'×'} | ${row.id} | ${duration(row.roughSeconds)} | ${duration(row.fixedSeconds)} | ${row.relativeDifference===null?'coverage differs':(row.relativeDifference*100).toFixed(1)+'%'} |`);
      }
    }
  }
  lines.push('','## Interpretation','',
    '- Times are simulated active/AFK game time from the input state, not computer runtime. The one-hour browser absence bank is not used.',
    '- Per-run section durations and every individual layer unlock are in `report.json`. Durations are not subtracted between different winning policies.',
    '- Checkpoints are codec-validated synthetic player exports. Starting from a supplied save measures time since that save, not lifetime completion time.',
    '- Policies construct supply/housing, earn Craft/Organization, enable earned automatic building, and invest in Education/Culture. No currency or unlocks are granted. The final checkpoint is the opening chapter, not an estimate for future space/time content.',
    '- Use fixed mode, smaller outer steps and reached checkpoint saves to investigate timing differences. Numerical observation windows are not statistical confidence intervals.',
    '- No gameplay balance, save data, offline cap, development-speed multiplier or game formula is changed.','');
  return lines.join('\n');
}

module.exports = { duration, compareReference, markdown };
