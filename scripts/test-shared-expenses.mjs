import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { allocateExpense, buildGroupPackage, calculateGroup, formatMoney, moneyToCents, parseGroupPackage, settlementRoutesForUnit, settleBalances, transferKey } from '../preview-shared-expenses/shared-expenses-core.js';

assert.equal(moneyToCents('1.234,56 €'),123456);
assert.equal(moneyToCents('12.50'),1250);
assert.equal(formatMoney(123456,'EUR').includes('1234,56'),true);

const group={id:'g1',name:'Viaje',currency:'EUR',settlementMode:'individual',families:[],members:[
  {id:'a',name:'Ana',familyId:null,weight:1},{id:'b',name:'Berta',familyId:null,weight:1},{id:'c',name:'Carlos',familyId:null,weight:1}
],expenses:[{id:'e1',concept:'Cena',date:'2026-11-15',category:'Comida',amountCents:10000,payers:[{accountType:'member',accountId:'a',amountCents:10000}],participants:[{memberId:'a'},{memberId:'b'},{memberId:'c'}],splitMode:'equal'}]};
const equal=allocateExpense(group,group.expenses[0]);
assert.deepEqual(equal.allocations.map(item=>item.amountCents),[3334,3333,3333]);
const calculated=calculateGroup(group,'individual');
assert.equal(calculated.totalCents,10000);
assert.equal(calculated.balanceSum,0);
assert.deepEqual(calculated.units.map(item=>[item.id,item.balanceCents]),[['m:a',6666],['m:b',-3333],['m:c',-3333]]);
const settlement=settleBalances(calculated.units);
assert.equal(settlement.exact,true);
assert.equal(settlement.transfers.length,2);
assert.equal(settlement.transfers.reduce((sum,item)=>sum+item.amountCents,0),6666);
assert.equal(new Set(settlement.transfers.map(transferKey)).size,2);

const familyGroup={id:'g2',name:'Familias',currency:'EUR',settlementMode:'family',families:[{id:'f1',name:'García'},{id:'f2',name:'López'}],members:[
  {id:'p1',name:'Ana',familyId:'f1',weight:1},{id:'p2',name:'Luis',familyId:'f1',weight:.5},{id:'p3',name:'Marta',familyId:'f2',weight:1},{id:'p4',name:'Pablo',familyId:'f2',weight:1}
],expenses:[
  {id:'e1',concept:'Casa',date:'2026-11-15',category:'Alojamiento',amountCents:40000,payers:[{accountType:'family',accountId:'f1',amountCents:30000},{accountType:'member',accountId:'p3',amountCents:10000}],participants:[{memberId:'p1',share:1},{memberId:'p2',share:.5},{memberId:'p3',share:1},{memberId:'p4',share:1}],splitMode:'shares'},
  {id:'e2',concept:'Bebidas',date:'2026-11-16',category:'Bebidas',amountCents:6000,payers:[{accountType:'member',accountId:'p4',amountCents:6000}],participants:[{memberId:'p1',amountCents:2000},{memberId:'p3',amountCents:2000},{memberId:'p4',amountCents:2000}],splitMode:'exact'}
]};
const familyResult=calculateGroup(familyGroup,'family');
assert.equal(familyResult.totalCents,46000);
assert.equal(familyResult.units.length,2);
assert.equal(familyResult.units.reduce((sum,item)=>sum+item.balanceCents,0),0);
assert.equal(settleBalances(familyResult.units).transfers.length,1);

const individualResult=calculateGroup(familyGroup,'individual');
assert.equal(individualResult.units.some(item=>item.id==='f:f1'&&item.paidCents===30000),true);
assert.equal(individualResult.units.reduce((sum,item)=>sum+item.balanceCents,0),0);

assert.throws(()=>allocateExpense(group,{...group.expenses[0],payers:[{accountType:'member',accountId:'a',amountCents:9999}]}),/deben sumar/);
assert.throws(()=>allocateExpense(group,{...group.expenses[0],splitMode:'exact',participants:[{memberId:'a',amountCents:1}]}),/exactamente/);

const fallback=settleBalances([-100,-100,-100,-100,-100,-100,150,150,100,100,50,50].map((balanceCents,index)=>({id:String(index),label:String(index),balanceCents})),{exactLimit:10});
assert.equal(fallback.exact,false);
assert.equal(fallback.transfers.length>6,true);

const challenge=[-100,-200,-500,200,200,400].map((balanceCents,index)=>({id:`u${index}`,label:`U${index}`,balanceCents}));
assert.equal(settleBalances(challenge,{exactLimit:0}).transfers.length,5);
const optimized=settleBalances(challenge,{exactLimit:10});
assert.equal(optimized.exact,true);
assert.equal(optimized.transfers.length,4);

let seed=18012027;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(let scenario=0;scenario<100;scenario+=1){
  const memberCount=2+Math.floor(random()*10),members=Array.from({length:memberCount},(_,index)=>({id:`s${scenario}m${index}`,name:`Persona ${index+1}`,familyId:null,weight:1})),expenses=[];
  for(let expenseIndex=0;expenseIndex<12;expenseIndex+=1){
    const amountCents=100+Math.floor(random()*50000),first=Math.floor(random()*memberCount),second=(first+1+Math.floor(random()*(memberCount-1)))%memberCount,useTwo=random()>.55,firstAmount=useTwo?1+Math.floor(random()*(amountCents-1)):amountCents;
    const participantIds=members.filter(()=>random()>.35).map(item=>item.id);if(!participantIds.length)participantIds.push(members[Math.floor(random()*memberCount)].id);
    expenses.push({id:`s${scenario}e${expenseIndex}`,concept:`Gasto ${expenseIndex}`,date:'2027-01-01',category:'Otros',amountCents,payers:[{accountType:'member',accountId:members[first].id,amountCents:firstAmount},...(useTwo?[{accountType:'member',accountId:members[second].id,amountCents:amountCents-firstAmount}]:[])],participants:participantIds.map(memberId=>({memberId})),splitMode:'equal'});
  }
  const randomGroup={id:`scenario-${scenario}`,name:`Escenario ${scenario}`,currency:'EUR',settlementMode:'individual',families:[],members,expenses},result=calculateGroup(randomGroup,'individual'),plan=settleBalances(result.units,{exactLimit:0}),outgoing=new Map(),incoming=new Map();
  for(const transfer of plan.transfers){assert.equal(transfer.amountCents>0,true);outgoing.set(transfer.fromId,(outgoing.get(transfer.fromId)||0)+transfer.amountCents);incoming.set(transfer.toId,(incoming.get(transfer.toId)||0)+transfer.amountCents);}
  for(const unit of result.units){assert.equal(outgoing.get(unit.id)||0,Math.max(0,-unit.balanceCents));assert.equal(incoming.get(unit.id)||0,Math.max(0,unit.balanceCents));}
  assert.equal(result.balanceSum,0);
}

const portable=buildGroupPackage(familyGroup,new Date('2027-02-03T10:20:30Z'));
assert.equal(portable.formato,'odin-gastos-compartidos-v1');
assert.equal(portable.exportado,'2027-02-03T10:20:30.000Z');
assert.equal(portable.comprobacion.estado,'comprobado');
assert.equal(portable.comprobacion.totalCentimos,46000);
assert.equal(portable.comprobacion.balanceGlobalCentimos,0);
assert.equal(portable.comprobacion.facturas,2);
const restored=parseGroupPackage(JSON.stringify(portable));
assert.equal(restored.group.name,familyGroup.name);
assert.deepEqual(restored.group.families,familyGroup.families);
assert.deepEqual(restored.group.members,familyGroup.members);
assert.equal(restored.group.expenses.length,familyGroup.expenses.length);
assert.deepEqual(restored.group.expenses.map(item=>item.amountCents),familyGroup.expenses.map(item=>item.amountCents));
assert.equal(restored.check.totalCentimos,46000);
assert.equal(restored.check.transferencias.length,1);

const manipulated=structuredClone(portable);
manipulated.grupo.expenses[0].payers[0].amountCents=29999;
assert.throws(()=>parseGroupPackage(JSON.stringify(manipulated)),/deben sumar/);
const impossibleDate=structuredClone(portable);
impossibleDate.grupo.expenses[0].date='2027-02-30';
assert.throws(()=>parseGroupPackage(JSON.stringify(impossibleDate)),/fecha/);
const falseCheck=structuredClone(portable);
falseCheck.comprobacion.totalCentimos=1;
assert.equal(parseGroupPackage(JSON.stringify(falseCheck)).check.totalCentimos,46000);
assert.throws(()=>parseGroupPackage('{"formato":"otro"}'),/compatible/);
assert.throws(()=>parseGroupPackage('{mal json'),/JSON válido/);

const emptyPackage=buildGroupPackage({id:'draft',name:'Borrador',currency:'EUR',settlementMode:'family',families:[],members:[],expenses:[],paidTransferKeys:[]});
assert.equal(emptyPackage.comprobacion.estado,'incompleto');
assert.equal(parseGroupPackage(JSON.stringify(emptyPackage)).group.name,'Borrador');

const realCaseText=readFileSync(new URL('../preview-shared-expenses/examples/caso-real-comida-23.json',import.meta.url),'utf8');
const realCase=parseGroupPackage(realCaseText),realResult=calculateGroup(realCase.group),realSettlement=settleBalances(realResult.units);
assert.equal(realCase.group.families.length,7);
assert.equal(realCase.group.members.length,23);
assert.equal(realCase.group.expenses.length,5);
assert.equal(realResult.totalCents,32550);
assert.equal(realResult.balanceSum,0);
assert.deepEqual(Object.fromEntries(realResult.units.map(unit=>[unit.label,{paid:unit.paidCents,owed:unit.owedCents,balance:unit.balanceCents}])),{
  'Familia Con&Ton':{paid:0,owed:5661,balance:-5661},
  'Familia Fer&Raq':{paid:5000,owed:5661,balance:-661},
  'Familia Gustavo':{paid:14000,owed:4246,balance:9754},
  'Familia Isa&Sol':{paid:0,owed:4245,balance:-4245},
  'Familia Jau&Xes':{paid:9000,owed:4246,balance:4754},
  'Familia Jaume':{paid:0,owed:4245,balance:-4245},
  'Familia Sil&San':{paid:4550,owed:4246,balance:304}
});
assert.equal(realSettlement.exact,true);
assert.deepEqual(realSettlement.transfers.map(item=>[item.fromLabel,item.toLabel,item.amountCents]),[
  ['Familia Con&Ton','Familia Gustavo',5661],
  ['Familia Isa&Sol','Familia Gustavo',4093],
  ['Familia Isa&Sol','Familia Jau&Xes',152],
  ['Familia Jaume','Familia Jau&Xes',4245],
  ['Familia Fer&Raq','Familia Jau&Xes',357],
  ['Familia Fer&Raq','Familia Sil&San',304]
]);
assert.equal(realSettlement.transfers.reduce((sum,item)=>sum+item.amountCents,0),14812);
assert.deepEqual(settlementRoutesForUnit('f:f-fer',realSettlement.transfers),{pays:[{name:'Familia Jau&Xes',amountCents:357},{name:'Familia Sil&San',amountCents:304}],receives:[]});
assert.deepEqual(settlementRoutesForUnit('f:f-gus',realSettlement.transfers),{pays:[],receives:[{name:'Familia Con&Ton',amountCents:5661},{name:'Familia Isa&Sol',amountCents:4093}]});

const casesDirectory=new URL('../preview-shared-expenses/examples/casos-prueba/',import.meta.url);
const caseFiles=readdirSync(casesDirectory).filter(name=>name.endsWith('.json')).sort();
assert.equal(caseFiles.length,15);
for(const [index,filename] of caseFiles.entries()){
  const source=readFileSync(new URL(filename,casesDirectory),'utf8');
  if(index===14){assert.throws(()=>parseGroupPackage(source),/deben sumar/);continue;}
  const original=JSON.parse(source),parsed=parseGroupPackage(source);
  assert.equal(parsed.check.balanceGlobalCentimos,0,filename);
  assert.equal(parsed.check.totalCentimos,original.comprobacion.totalCentimos,filename);
  assert.equal(parsed.check.transferencias.length,original.comprobacion.transferencias.length,filename);
}
const largeCase=parseGroupPackage(readFileSync(new URL('13-grupo-grande-plan-simplificado.json',casesDirectory),'utf8'));
assert.equal(largeCase.check.optimizacion,'plan_simplificado');
const continuityCase=parseGroupPackage(readFileSync(new URL('14-exportacion-importacion-identica.json',casesDirectory),'utf8'));
assert.equal(continuityCase.group.paidTransferKeys.length,1);

console.log('SHARED_EXPENSES_TESTS=PASS');
