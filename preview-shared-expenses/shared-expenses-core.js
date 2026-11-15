export function moneyToCents(value) {
  if (Number.isInteger(value)) return value;
  const text=String(value??'').trim().replace(/\s/g,'').replace(/€/g,'');
  if (!text) return 0;
  const normalized=text.includes(',') ? text.replace(/\./g,'').replace(',','.') : text;
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error(`Importe no válido: ${value}`);
  return Math.round(Number(normalized)*100);
}

export function formatMoney(cents, currency='EUR') {
  return new Intl.NumberFormat('es-ES',{style:'currency',currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(cents/100);
}

const idKey=(type,id)=>`${type==='family'?'f':'m'}:${id}`;
const memberById=(group,id)=>group.members.find(item=>item.id===id);
const familyById=(group,id)=>group.families.find(item=>item.id===id);

function ensureUnique(items,label) {
  const ids=items.map(item=>item.id);
  if(new Set(ids).size!==ids.length)throw new Error(`Hay ${label} duplicados.`);
}

export function validateGroup(group) {
  if(!group||typeof group!=='object')throw new Error('El grupo no es válido.');
  if(!String(group.name||'').trim())throw new Error('El grupo necesita un nombre.');
  if(!Array.isArray(group.members)||!group.members.length)throw new Error('Añade al menos una persona.');
  if(!Array.isArray(group.families)||!Array.isArray(group.expenses))throw new Error('La estructura del grupo no es válida.');
  ensureUnique(group.members,'identificadores de persona');ensureUnique(group.families,'identificadores de familia');ensureUnique(group.expenses,'identificadores de factura');
  for(const member of group.members){if(!String(member.name||'').trim())throw new Error('Todas las personas necesitan un nombre.');if(member.familyId&&!familyById(group,member.familyId))throw new Error(`La familia de ${member.name} no existe.`);if(!(Number(member.weight)>0))throw new Error(`La participación de ${member.name} debe ser mayor que cero.`);}
  for(const family of group.families)if(!String(family.name||'').trim())throw new Error('Todas las familias necesitan un nombre.');
  return true;
}

function distributeWeighted(total,participants,weightOf) {
  const weighted=participants.map((item,index)=>({item,index,weight:Math.max(0,Math.round(Number(weightOf(item))*1000))}));
  const totalWeight=weighted.reduce((sum,item)=>sum+item.weight,0);
  if(totalWeight<=0)throw new Error('Las participaciones deben sumar más de cero.');
  let assigned=0;
  const allocations=weighted.map(entry=>{const numerator=total*entry.weight,amount=Math.floor(numerator/totalWeight);assigned+=amount;return{...entry,amount,remainder:numerator%totalWeight};});
  let remaining=total-assigned;
  allocations.sort((a,b)=>b.remainder-a.remainder||a.index-b.index);
  for(let index=0;index<remaining;index+=1)allocations[index%allocations.length].amount+=1;
  allocations.sort((a,b)=>a.index-b.index);
  return allocations.map(entry=>({memberId:entry.item.memberId,amountCents:entry.amount,weight:entry.weight/1000}));
}

export function allocateExpense(group,expense) {
  const total=Number(expense.amountCents);
  if(!Number.isInteger(total)||total<=0)throw new Error(`La factura «${expense.concept||'sin nombre'}» necesita un importe positivo.`);
  if(!String(expense.concept||'').trim())throw new Error('Cada factura necesita un concepto.');
  const payers=Array.isArray(expense.payers)?expense.payers:[];
  if(!payers.length)throw new Error(`Indica quién pagó «${expense.concept}».`);
  let paid=0;const payerKeys=new Set();
  for(const payer of payers){const key=idKey(payer.accountType,payer.accountId);if(payerKeys.has(key))throw new Error(`Un pagador está repetido en «${expense.concept}».`);payerKeys.add(key);if(payer.accountType==='family'){if(!familyById(group,payer.accountId))throw new Error('La familia pagadora no existe.');}else if(!memberById(group,payer.accountId))throw new Error('La persona pagadora no existe.');if(!Number.isInteger(payer.amountCents)||payer.amountCents<=0)throw new Error('Cada aportación debe ser positiva.');paid+=payer.amountCents;}
  if(paid!==total)throw new Error(`Los pagos de «${expense.concept}» suman ${formatMoney(paid,group.currency)} y deben sumar ${formatMoney(total,group.currency)}.`);
  const participants=Array.isArray(expense.participants)?expense.participants:[];
  if(!participants.length)throw new Error(`Selecciona quién participa en «${expense.concept}».`);
  const participantIds=new Set();for(const item of participants){if(participantIds.has(item.memberId))throw new Error('Hay una persona repetida en el reparto.');participantIds.add(item.memberId);if(!memberById(group,item.memberId))throw new Error('Una persona del reparto ya no existe.');}
  let allocations;
  if(expense.splitMode==='exact'){
    allocations=participants.map(item=>({memberId:item.memberId,amountCents:Number(item.amountCents)||0,weight:null}));
    const allocated=allocations.reduce((sum,item)=>sum+item.amountCents,0);if(allocations.some(item=>!Number.isInteger(item.amountCents)||item.amountCents<0)||allocated!==total)throw new Error(`Los importes asignados en «${expense.concept}» deben sumar exactamente ${formatMoney(total,group.currency)}.`);
  }else if(expense.splitMode==='shares')allocations=distributeWeighted(total,participants,item=>item.share);
  else allocations=distributeWeighted(total,participants,()=>1);
  return { ...expense, payers:payers.map(item=>({...item})), allocations };
}

function atomicAccounts(group) {
  const accounts=new Map();
  for(const member of group.members)accounts.set(idKey('member',member.id),{id:idKey('member',member.id),sourceId:member.id,kind:'member',familyId:member.familyId||null,label:member.name,paidCents:0,owedCents:0,balanceCents:0});
  for(const family of group.families)accounts.set(idKey('family',family.id),{id:idKey('family',family.id),sourceId:family.id,kind:'family',familyId:family.id,label:`Familia ${family.name}`,paidCents:0,owedCents:0,balanceCents:0});
  return accounts;
}

function aggregateUnits(group,accounts,mode) {
  if(mode==='individual')return [...accounts.values()].filter(account=>account.kind==='member'||account.paidCents||account.owedCents).map(account=>({...account}));
  const units=new Map();
  const add=(unitId,label,account)=>{if(!units.has(unitId))units.set(unitId,{id:unitId,label,kind:unitId.startsWith('f:')?'family':'member',paidCents:0,owedCents:0,balanceCents:0});const unit=units.get(unitId);unit.paidCents+=account.paidCents;unit.owedCents+=account.owedCents;unit.balanceCents+=account.balanceCents;};
  for(const account of accounts.values()){
    const familyId=account.kind==='family'?account.sourceId:account.familyId;
    if(familyId){const family=familyById(group,familyId);add(idKey('family',familyId),`Familia ${family?.name||'sin nombre'}`,account);}
    else add(account.id,account.label,account);
  }
  return [...units.values()];
}

export function calculateGroup(group,mode=group.settlementMode||'family') {
  validateGroup(group);
  const accounts=atomicAccounts(group),details=[];
  for(const expense of group.expenses){const detail=allocateExpense(group,expense);details.push(detail);for(const payer of detail.payers){const account=accounts.get(idKey(payer.accountType,payer.accountId));account.paidCents+=payer.amountCents;account.balanceCents+=payer.amountCents;}for(const allocation of detail.allocations){const account=accounts.get(idKey('member',allocation.memberId));account.owedCents+=allocation.amountCents;account.balanceCents-=allocation.amountCents;}}
  const totalCents=details.reduce((sum,item)=>sum+item.amountCents,0),units=aggregateUnits(group,accounts,mode).sort((a,b)=>a.label.localeCompare(b.label,'es'));
  const balanceSum=units.reduce((sum,item)=>sum+item.balanceCents,0),paidSum=units.reduce((sum,item)=>sum+item.paidCents,0),owedSum=units.reduce((sum,item)=>sum+item.owedCents,0);
  if(balanceSum!==0||paidSum!==totalCents||owedSum!==totalCents)throw new Error('El balance interno no cuadra. No se mostrará una liquidación incorrecta.');
  return {totalCents,expenseCount:details.length,details,accounts:[...accounts.values()],units,balanceSum};
}

function greedySettlement(units) {
  const debtors=units.filter(item=>item.balanceCents<0).map(item=>({...item,remaining:-item.balanceCents})).sort((a,b)=>b.remaining-a.remaining||a.label.localeCompare(b.label,'es'));
  const creditors=units.filter(item=>item.balanceCents>0).map(item=>({...item,remaining:item.balanceCents})).sort((a,b)=>b.remaining-a.remaining||a.label.localeCompare(b.label,'es'));
  const transfers=[];let debtorIndex=0,creditorIndex=0;
  while(debtorIndex<debtors.length&&creditorIndex<creditors.length){const debtor=debtors[debtorIndex],creditor=creditors[creditorIndex],amount=Math.min(debtor.remaining,creditor.remaining);transfers.push({fromId:debtor.id,fromLabel:debtor.label,toId:creditor.id,toLabel:creditor.label,amountCents:amount});debtor.remaining-=amount;creditor.remaining-=amount;if(!debtor.remaining)debtorIndex+=1;if(!creditor.remaining)creditorIndex+=1;}
  return transfers;
}

export function settleBalances(units,{exactLimit=10,maxStates=100000}={}) {
  const relevant=units.filter(item=>item.balanceCents!==0),greedy=greedySettlement(relevant);
  const debtors=relevant.filter(item=>item.balanceCents<0).map(item=>({id:item.id,label:item.label,amount:-item.balanceCents})).sort((a,b)=>b.amount-a.amount||a.label.localeCompare(b.label,'es'));
  const creditors=relevant.filter(item=>item.balanceCents>0).map(item=>({id:item.id,label:item.label,amount:item.balanceCents})).sort((a,b)=>b.amount-a.amount||a.label.localeCompare(b.label,'es'));
  if(!relevant.length)return{transfers:[],exact:true,states:0};
  const lowerBound=Math.max(debtors.length,creditors.length);
  if(greedy.length===lowerBound)return{transfers:greedy,exact:true,states:0};
  if(relevant.length>exactLimit)return{transfers:greedy,exact:false,states:0};
  const debtAmounts=debtors.map(item=>item.amount),creditAmounts=creditors.map(item=>item.amount),memo=new Map();let best=greedy.map(item=>({...item})),states=0,aborted=false;
  function search(trail){
    states+=1;if(states>maxStates){aborted=true;return;}const activeD=debtAmounts.filter(Boolean).length,activeC=creditAmounts.filter(Boolean).length;if(!activeD){if(trail.length<best.length)best=trail.map(item=>({...item}));return;}if(trail.length+Math.max(activeD,activeC)>=best.length)return;
    const key=`${debtAmounts.join(',')}|${creditAmounts.join(',')}`,previous=memo.get(key);if(previous!=null&&previous<=trail.length)return;memo.set(key,trail.length);
    const debtorIndex=debtAmounts.findIndex(Boolean),seenAmounts=new Set();
    for(let creditorIndex=0;creditorIndex<creditAmounts.length;creditorIndex+=1){if(!creditAmounts[creditorIndex]||seenAmounts.has(creditAmounts[creditorIndex]))continue;seenAmounts.add(creditAmounts[creditorIndex]);const amount=Math.min(debtAmounts[debtorIndex],creditAmounts[creditorIndex]);debtAmounts[debtorIndex]-=amount;creditAmounts[creditorIndex]-=amount;trail.push({fromId:debtors[debtorIndex].id,fromLabel:debtors[debtorIndex].label,toId:creditors[creditorIndex].id,toLabel:creditors[creditorIndex].label,amountCents:amount});search(trail);trail.pop();debtAmounts[debtorIndex]+=amount;creditAmounts[creditorIndex]+=amount;if(aborted)return;}
  }
  search([]);
  return{transfers:best,exact:!aborted,states};
}

export function transferKey(transfer){return`${transfer.fromId}>${transfer.toId}:${transfer.amountCents}`;}

export function summarizeExpense(group,detail) {
  const payerText=detail.payers.map(item=>`${item.accountType==='family'?'Familia ':''}${item.accountType==='family'?familyById(group,item.accountId)?.name:memberById(group,item.accountId)?.name}: ${formatMoney(item.amountCents,group.currency)}`).join(' · ');
  const allocationText=detail.allocations.map(item=>`${memberById(group,item.memberId)?.name}: ${formatMoney(item.amountCents,group.currency)}`).join(' · ');
  return{payerText,allocationText};
}
