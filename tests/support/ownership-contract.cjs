const espree = require('espree');

// These are precisely the historical accidental temporaries inventoried before
// DEV01. Ignore their added uninitialized lexical declarations, never formulas,
// initializers, literals, field order, branches, receivers or call arguments.
const temporaries = new Set(['mult','cost','item','layer','id','hk','thing','data','row','x','lr','lrs','layerResetting','auto','complete',
  'notification','notificationMessage','notificationTimer','notificationTitle','notificationType','branch']);

function normalizeNode(node, owners) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(value=>normalizeNode(value,owners)).filter(value=>value!==null);
  if (node.type === 'MemberExpression' && !node.computed && node.object.type === 'Identifier' &&
      owners[node.object.name]?.includes(node.property.name)) return {type:'Identifier',name:node.property.name};
  if (node.type === 'VariableDeclaration' && node.kind === 'let' && node.declarations.every(item=>item.id.type==='Identifier' && !item.init && temporaries.has(item.id.name))) return null;
  const result = {};
  for (const [key,value] of Object.entries(node)) {
    if (['start','end','range','loc','raw'].includes(key)) continue;
    result[key] = key==='kind' && value==='var' ? 'let' : normalizeNode(value,owners);
  }
  return result;
}
function expressionContract(source,owners) {
  return normalizeNode(espree.parse('('+source+')',{ecmaVersion:'latest',sourceType:'script'}).body[0].expression,owners);
}
function functionContract(source,owners) {
  try { return expressionContract(source,owners); }
  catch { return expressionContract('{'+source+'}',owners).properties[0].value; }
}
function normalizeContract(text,owners) {
  function visit(value) {
    if (!value || typeof value!=='object') return value;
    if (Object.hasOwn(value,'functionSource')) return {functionSource:functionContract(value.functionSource,owners)};
    if (Array.isArray(value)) return value.map(visit);
    return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,visit(item)]));
  }
  return visit(JSON.parse(text));
}
function sessionOwners(runtime) {
  const owners = JSON.parse(runtime.run(`JSON.stringify(Object.fromEntries(Object.entries(gameUI.session)
    .filter(([name,value]) => value && typeof value==='object').map(([name,value])=>[name,Object.keys(value)])))`));
  // The external browser port is deliberately not exposed through the session.
  owners.effects = ['alert','confirm','prompt'];
  return owners;
}
module.exports = {expressionContract,functionContract,normalizeContract,sessionOwners};
