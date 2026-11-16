import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGroupPackage, calculateGroup, formatMoney, settleBalances, transferKey } from '../preview-shared-expenses/shared-expenses-core.js';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'preview-shared-expenses','examples','casos-prueba');
const fixedDate='2026-11-16';
const fixedInstant=new Date('2026-11-16T12:00:00Z');
mkdirSync(output,{recursive:true});

const member=(id,name,familyId=null,weight=1)=>({id,name,familyId,weight});
const family=(id,name)=>({id,name});
const participants=members=>members.map(item=>({memberId:item.id}));
const payer=(accountId,amountCents,accountType='member')=>({accountType,accountId,amountCents});
const baseGroup=(id,name,members,{families=[],settlementMode='individual',expenses=[]}={})=>({id,name,currency:'EUR',settlementMode,families,members,expenses,paidTransferKeys:[]});
const expense=(id,concept,amountCents,payers,people,{splitMode='equal',category='Otros',notes=''}={})=>({id,concept,date:fixedDate,category,amountCents,payers,participants:people,splitMode,notes});

const cases=[];
function add(number,slug,title,objective,group,conclusion){
  const pack=buildGroupPackage(group,fixedInstant);
  pack.caso_prueba={numero:number,titulo:title,objetivo:objective,resultado_ia:conclusion};
  cases.push({number,slug,title,objective,conclusion,filename:`${String(number).padStart(2,'0')}-${slug}.json`,pack,valid:true});
  return pack;
}

{
  const familySpecs=[
    ['robles','Robles',['Elena','Marcos','Leo','Alba']],
    ['vega','Vega',['Laura','Daniel','Nico','Sara']],
    ['soler','Soler',['Marta','Iván','Hugo']],
    ['campos','Campos',['Nuria','Óscar','Emma']],
    ['rios','Ríos',['Clara','Sergio','Lucas']],
    ['luna','Luna',['Irene','Pablo','Noa']],
    ['mar','Mar',['Alicia','Raúl','Eric']]
  ];
  const families=familySpecs.map(([id,name])=>family(id,name));
  const members=familySpecs.flatMap(([familyId,,names])=>names.map((name,index)=>member(`${familyId}-${index+1}`,name,familyId)));
  const balanced=[];
  for(let position=0;position<4;position+=1)for(const [familyId,,names] of familySpecs)if(names[position])balanced.push(members.find(item=>item.id===`${familyId}-${position+1}`));
  const bills=[
    ['e1','Frutería La Huerta · fruta y verdura',5840,'robles','Comida','Fruta y verdura para las comidas compartidas.'],
    ['e2','Panadería El Trigal · pan y postres',2280,'robles','Comida','Pan, bollería y postres.'],
    ['e3','Supermercado Central · alimentación',9675,'vega','Comida','Compra general de alimentación.'],
    ['e4','Bodega del Barrio · bebidas',3420,'vega','Bebidas','Agua, refrescos y otras bebidas.'],
    ['e5','Carnicería El Prado · carne',14860,'soler','Comida','Carne y preparados para la comida principal.'],
    ['e6','Hipermercado Norte · compra general',8395,'campos','Compras','Productos variados para el encuentro.'],
    ['e7','Estación de servicio · hielo y carbón',2750,'campos','Compras','Hielo, carbón y encendedores.'],
    ['e8','Pescadería Mar Azul · pescado',7230,'rios','Comida','Pescado y marisco.'],
    ['e9','Droguería Limpia · menaje y limpieza',1985,'rios','Compras','Platos, servilletas y productos de limpieza.'],
    ['e10','Pastelería Dulce Encuentro · tartas',4680,'luna','Comida','Tartas y dulces para todos.'],
    ['e11','Gasolinera Ruta · desplazamiento',5420,'luna','Transporte','Combustible del desplazamiento común.']
  ];
  const total=bills.reduce((sum,item)=>sum+item[2],0),basePerPerson=bills.reduce((sum,item)=>sum+Math.floor(item[2]/members.length),0),globalRemainder=total%members.length;
  const targetExtras=new Set(balanced.slice(0,globalRemainder).map(item=>item.id));
  const needs=new Map(members.map(item=>[item.id,Math.floor(total/members.length)+(targetExtras.has(item.id)?1:0)-basePerPerson]));
  const balancedIndex=new Map(balanced.map((item,index)=>[item.id,index]));
  let offset=0;
  const expenses=bills.map(([id,concept,amountCents,familyId,category,notes])=>{
    const remainder=amountCents%members.length;
    const ranked=[...balanced].sort((a,b)=>needs.get(b.id)-needs.get(a.id)||((balancedIndex.get(a.id)-offset+members.length)%members.length)-((balancedIndex.get(b.id)-offset+members.length)%members.length));
    const extra=ranked.slice(0,remainder);extra.forEach(item=>needs.set(item.id,needs.get(item.id)-1));offset=(offset+remainder)%members.length;
    const extraIds=new Set(extra.map(item=>item.id)),ordered=[...extra,...balanced.filter(item=>!extraIds.has(item.id))];
    return expense(id,concept,amountCents,[payer(familyId,amountCents,'family')],participants(ordered),{category,notes});
  });
  if([...needs.values()].some(Boolean))throw new Error('No se han distribuido correctamente los céntimos del caso 1.');
  const group=baseGroup('caso-01','Encuentro de siete familias · 23 comensales',members,{families,settlementMode:'family',expenses});
  add(1,'ejemplo-23-comensales','Ejemplo completo · 23 comensales y 7 familias','Validar once compras, seis familias pagadoras, nombres individuales, comercios, tipos de compra y reparto equitativo de céntimos.',group,'Debe cerrar 665,35 € sin ajustes manuales. Familia Robles y Familia Mar pagan; las otras cinco familias reciben exactamente sus adelantos.');
}

{
  const members=[member('ana','Ana'),member('beto','Beto')];
  add(2,'dos-amigos-un-pagador','Dos amigos · uno paga todo','Validar la división elemental y una única transferencia.',baseGroup('caso-02','Dos amigos',members,{expenses:[expense('e1','Cena',10000,[payer('ana',10000)],participants(members),{category:'Comida'})]}),'Cada persona asume 50,00 €. Beto paga 50,00 € a Ana.');
}
{
  const members=['Ana','Beto','Carla','David','Eva'].map((name,index)=>member(`p${index+1}`,name));
  const all=participants(members);
  add(3,'cinco-amigos-dos-pagadores','Cinco amigos · dos facturas y dos pagadores','Comprobar la compensación de varios adelantos.',baseGroup('caso-03','Fin de semana de cinco amigos',members,{expenses:[expense('e1','Cena',10000,[payer('p1',10000)],all,{category:'Comida'}),expense('e2','Alojamiento',15000,[payer('p2',15000)],all,{category:'Alojamiento'})]}),'Cada persona asume 50,00 €. Ana y Beto recuperan sus adelantos mediante un plan compensado.');
}
{
  const members=['Ana','Beto','Carla','David'].map((name,index)=>member(`p${index+1}`,name));
  add(4,'una-factura-varios-pagadores','Una factura · varios pagadores','Validar que varias aportaciones sumen la misma factura.',baseGroup('caso-04','Factura con dos pagadores',members,{expenses:[expense('e1','Compra conjunta',12000,[payer('p1',7000),payer('p2',5000)],participants(members),{category:'Compras'})]}),'Cada persona asume 30,00 €. Carla y David compensan a Ana y Beto sin crear dinero ni perder céntimos.');
}
{
  const families=[family('f1','Solo'),family('f2','Dúo'),family('f3','Grande')];
  const members=[member('s1','Sara','f1'),member('d1','Dani','f2'),member('d2','Lola','f2'),...Array.from({length:4},(_,i)=>member(`g${i+1}`,`Grande ${i+1}`,'f3'))];
  add(5,'familias-tamanos-diferentes','Familias de 1, 2 y 4 personas','Comprobar que la cuota familiar depende del número real de miembros.',baseGroup('caso-05','Tres familias de distinto tamaño',members,{families,settlementMode:'family',expenses:[expense('e1','Casa rural',21000,[payer('f1',21000,'family')],participants(members),{category:'Alojamiento'})]}),'El coste es 30,00 € por persona. Dúo paga 60,00 € y Familia grande 120,00 € a Solo.');
}
{
  const families=[family('f1','Norte'),family('f2','Sur')];
  const members=[member('a1','Adulto Norte','f1',1),member('n1','Niño Norte','f1',.5),member('a2','Adulto Sur','f2',1),member('n2','Niño Sur','f2',.5)];
  const shares=members.map(item=>({memberId:item.id,share:item.weight}));
  add(6,'adultos-ninos-por-peso','Adultos y niños · reparto por participaciones','Validar pesos 1 y 0,5 y su agrupación familiar.',baseGroup('caso-06','Dos familias con adultos y niños',members,{families,settlementMode:'family',expenses:[expense('e1','Actividad familiar',9000,[payer('f1',9000,'family')],shares,{splitMode:'shares',category:'Actividades'})]}),'Cada familia asume 45,00 €. Familia Sur paga 45,00 € a Familia Norte.');
}
{
  const members=['Ana','Beto','Carla','David'].map((name,index)=>member(`p${index+1}`,name));
  const byIds=ids=>ids.map(id=>({memberId:id}));
  add(7,'participantes-distintos-por-factura','Participantes diferentes según la factura','Comprobar que solo paga quien participa en cada consumo.',baseGroup('caso-07','Casa, bebidas y actividad',members,{expenses:[expense('e1','Casa',40000,[payer('p1',40000)],participants(members),{category:'Alojamiento'}),expense('e2','Bebidas',6000,[payer('p2',6000)],byIds(['p1','p2']),{category:'Bebidas'}),expense('e3','Actividad',9000,[payer('p3',9000)],byIds(['p3','p4']),{category:'Actividades'})]}),'Ana debe recuperar 270,00 €. Beto, Carla y David pagan únicamente las partes en las que participaron.');
}
{
  const members=['Ana','Beto','Carla'].map((name,index)=>member(`p${index+1}`,name));
  const exact=[{memberId:'p1',amountCents:1000},{memberId:'p2',amountCents:3000},{memberId:'p3',amountCents:6000}];
  add(8,'reparto-importes-exactos','Importes exactos personalizados','Validar una asignación no proporcional definida manualmente.',baseGroup('caso-08','Reparto exacto 10-30-60',members,{expenses:[expense('e1','Compra personalizada',10000,[payer('p1',10000)],exact,{splitMode:'exact',category:'Compras'})]}),'Ana asume 10,00 € pero adelantó 100,00 €; cobra 30,00 € de Beto y 60,00 € de Carla.');
}
{
  const families=[family('fa','Alfa'),family('fb','Beta')];
  const members=[member('a1','Ana','fa'),member('a2','Álex','fa'),member('b1','Berta','fb'),member('b2','Bruno','fb')];
  add(9,'liquidacion-individual-con-familias','Liquidación individual con cuentas familiares','Comprobar la diferencia entre agrupar por familia y liquidar por persona.',baseGroup('caso-09','Liquidación individual',members,{families,settlementMode:'individual',expenses:[expense('e1','Excursión',12000,[payer('fa',8000,'family'),payer('b1',4000)],participants(members),{category:'Actividades'})]}),'Cada persona asume 30,00 €. La cuenta Familia Alfa y Berta reciben; Ana, Álex y Bruno pagan individualmente.');
}
{
  const members=['Ana','Beto','Carla','David'].map((name,index)=>member(`p${index+1}`,name));
  const payers=members.map(item=>payer(item.id,2500));
  add(10,'todos-pagaron-su-parte','Todos pagaron exactamente su parte','Validar el caso final sin transferencias.',baseGroup('caso-10','Sin deudas',members,{expenses:[expense('e1','Comida',10000,payers,participants(members),{category:'Comida'})]}),'Los cuatro pagaron y asumieron 25,00 €. No debe aparecer ninguna transferencia.');
}
{
  const members=[member('a','Ana'),member('b','Beto'),member('c','Carla')];
  add(11,'compensacion-circular','Compensación circular','Demostrar que ODÍN compensa deudas cruzadas sin devolver cada compra por separado.',baseGroup('caso-11','Pagos cruzados',members,{expenses:[expense('e1','Ana paga por Beto',3000,[payer('a',3000)],[{memberId:'b',amountCents:3000}],{splitMode:'exact'}),expense('e2','Beto paga por Carla',2000,[payer('b',2000)],[{memberId:'c',amountCents:2000}],{splitMode:'exact'}),expense('e3','Carla paga por Ana',1000,[payer('c',1000)],[{memberId:'a',amountCents:1000}],{splitMode:'exact'})]}),'Después de compensar el círculo, Beto paga 10,00 € a Ana y Carla paga 10,00 € a Ana.');
}
{
  const members=[member('a','Ana'),member('b','Beto'),member('c','Carla')];
  add(12,'redondeo-diez-entre-tres','Redondeo · 10 € entre tres','Comprobar la asignación determinista del céntimo indivisible.',baseGroup('caso-12','Diez euros entre tres',members,{expenses:[expense('e1','Tentempié',1000,[payer('a',1000)],participants(members),{category:'Comida'})]}),'Ana asume 3,34 €; Beto y Carla 3,33 €. Ambos pagan 3,33 € a Ana y el balance termina en cero.');
}
{
  const members=Array.from({length:12},(_,i)=>member(`p${i+1}`,`Persona ${i+1}`));
  const payers=[payer('p7',150),payer('p8',150),payer('p9',100),payer('p10',100),payer('p11',50),payer('p12',50)];
  const exact=members.slice(0,6).map(item=>({memberId:item.id,amountCents:100}));
  add(13,'grupo-grande-plan-simplificado','Doce saldos · plan simplificado','Validar la ruta segura cuando hay más de diez unidades con saldo.',baseGroup('caso-13','Doce personas con saldos',members,{expenses:[expense('e1','Ajuste colectivo',600,payers,exact,{splitMode:'exact'})]}),'Se liquidan 6,00 € sin descuadre. Al haber doce saldos, ODÍN muestra un plan determinista simplificado en vez de bloquear el navegador.');
}
{
  const members=[member('alvaro','Álvaro'),member('ines','Inés'),member('noa','Noa')];
  const group=baseGroup('caso-14','Peña Águila · continuidad',members,{expenses:[expense('e1','Reserva & menú',12345,[payer('alvaro',12345)],participants(members),{category:'Comida',notes:'Conserva acentos, símbolos y el estado de las transferencias.'})]});
  const settlement=settleBalances(calculateGroup(group).units);
  group.paidTransferKeys=[transferKey(settlement.transfers[0])];
  add(14,'exportacion-importacion-identica','Exportación e importación idénticas','Comprobar nombres, notas, símbolos y progreso de pagos tras restaurar.',group,'El total es 123,45 €. Tras exportar e importar deben conservarse todos los datos y una transferencia marcada como pagada.');
}

const invalidBase=JSON.parse(JSON.stringify(cases.find(item=>item.number===2).pack));
invalidBase.grupo.expenses[0].payers[0].amountCents=9999;
invalidBase.caso_prueba={numero:15,titulo:'Archivo manipulado · debe rechazarse',objetivo:'Comprobar que ODÍN no importa una factura cuyos pagos no suman el total.',resultado_ia:'Resultado esperado: importación bloqueada. Los pagos suman 99,99 € y la factura exige 100,00 €.'};
cases.push({number:15,slug:'archivo-manipulado-rechazado',title:invalidBase.caso_prueba.titulo,objective:invalidBase.caso_prueba.objetivo,conclusion:invalidBase.caso_prueba.resultado_ia,filename:'15-archivo-manipulado-rechazado.json',pack:invalidBase,valid:false});

const euro=cents=>formatMoney(cents,'EUR');
const report=['# U18 · Quince casos de prueba y resultados esperados','',`Generados el ${fixedDate}. Los casos 1–14 deben importarse correctamente; el caso 15 debe ser rechazado.`,'','## Resumen','','| Nº | Caso | Archivo | Resultado esperado |','|---:|---|---|---|'];
for(const item of cases){
  const check=item.pack.comprobacion;
  report.push(`| ${item.number} | ${item.title} | \`${item.filename}\` | ${item.valid?`${check.totalFormateado}; ${check.transferencias.length} transferencias`:'Importación bloqueada'} |`);
}
for(const item of cases){
  report.push('',`## ${item.number}. ${item.title}`,'',item.objective,'',`**Evaluación IA:** ${item.conclusion}`,'');
  if(!item.valid){report.push('- Estado esperado: **RECHAZADO**.','- Motivo: los pagadores suman 99,99 € para una factura de 100,00 €.','- El reparto guardado en el navegador no debe modificarse.');continue;}
  const {grupo,comprobacion}=item.pack;
  report.push(`- Familias: ${grupo.families.length}.`);report.push(`- Personas: ${grupo.members.length}.`);report.push(`- Facturas: ${grupo.expenses.length}.`);report.push(`- Total: **${comprobacion.totalFormateado}**.`);report.push(`- Balance global: **${euro(comprobacion.balanceGlobalCentimos)}**.`);report.push(`- Optimización: **${comprobacion.optimizacion.replaceAll('_',' ')}**.`,'','### Balance esperado','', '| Persona o familia | Pagó | Le correspondía | Resultado |','|---|---:|---:|---|');
  for(const unit of comprobacion.unidades){const result=unit.balanceCentimos>0?`Cobra ${euro(unit.balanceCentimos)}`:unit.balanceCentimos<0?`Paga ${euro(-unit.balanceCentimos)}`:'Saldo cero';report.push(`| ${unit.nombre} | ${euro(unit.pagadoCentimos)} | ${euro(unit.correspondiaCentimos)} | ${result} |`);}
  report.push('','### Transferencias esperadas','');
  if(!comprobacion.transferencias.length)report.push('No debe realizarse ninguna transferencia.');
  else comprobacion.transferencias.forEach((transfer,index)=>report.push(`${index+1}. **${transfer.de}** paga **${euro(transfer.importeCentimos)}** a **${transfer.a}**.`));
}
report.push('','## Criterio de aceptación','','Cada caso válido pasa si el total pagado coincide con el total repartido, el balance global es 0,00 €, las relaciones “paga a / cobra de” coinciden y una nueva exportación conserva el resultado. El caso 15 pasa únicamente si ODÍN bloquea la importación.','');

for(const item of cases)writeFileSync(join(output,item.filename),`${JSON.stringify(item.pack,null,2)}\n`,'utf8');
writeFileSync(join(root,'preview-shared-expenses','examples','caso-ejemplo-23-comensales.json'),`${JSON.stringify(cases[0].pack,null,2)}\n`,'utf8');
const reportText=report.join('\n');
writeFileSync(join(output,'RESULTADOS_ESPERADOS.md'),reportText,'utf8');
writeFileSync(join(root,'docs','U18-15-CASOS-PRUEBA.md'),reportText,'utf8');
console.log(`SHARED_EXPENSES_CASES=${cases.length}`);
console.log(`VALID_CASES=${cases.filter(item=>item.valid).length}`);
console.log(`INVALID_CASES=${cases.filter(item=>!item.valid).length}`);
