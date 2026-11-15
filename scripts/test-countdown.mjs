import assert from 'node:assert/strict';
import {ageForOccurrence,nextOccurrence,normalizeCountdownState,occurrenceForYear,personalEventsForDate} from '../countdown-data.js';
import {dueGeneralEvents,isGeneralEventEnabled,nextGeneralEvents} from '../countdown-general.js';
import {BACKUP_FORMAT,buildBackup,countdownsToCsv,parseImport,validateImportedSections} from '../preview-admin/admin-core.js';

const birthday={id:'b1',name:'Ana',category:'birthday',year:1979,month:11,day:14,time:'00:00',annual:true,yearKnown:true,enabled:true};
assert.equal(nextOccurrence(birthday,new Date(2026,10,13,12)).occurrenceYear,2026);
assert.equal(nextOccurrence(birthday,new Date(2026,10,15,12)).occurrenceYear,2027);
assert.equal(ageForOccurrence(birthday,2026),47);
assert.equal(personalEventsForDate({personal:[birthday]},'2026-11-14')[0].detail,'47 años');

const unknown={...birthday,id:'b2',year:null,yearKnown:false,month:4,day:23};
assert.equal(ageForOccurrence(unknown,2027),null);
assert.equal(personalEventsForDate({personal:[unknown]},'2027-04-23')[0].detail,'Edad no indicada');

const leap={...birthday,id:'b3',month:2,day:29};
assert.equal(occurrenceForYear(leap,2027).dateKey,'2027-02-28');

const legacy=normalizeCountdownState({personal:[{id:'old',name:'Antiguo',targetAt:new Date(2027,0,5,9).getTime()}]});
assert.equal(legacy.schemaVersion,2);assert.equal(legacy.personal[0].category,'reminder');assert.equal(legacy.personal[0].annual,false);

const csv=countdownsToCsv({personal:[birthday,unknown]});
const parsed=parseImport(csv,'acontecimientos.csv');
assert.equal(parsed.formato,'odin-csv-acontecimientos-v1');assert.equal(parsed.secciones.cuentas_atras.personal.length,2);validateImportedSections(parsed.secciones);

const storage={data:new Map([['odin-countdowns-v1',JSON.stringify({personal:[birthday]})]]),getItem(key){return this.data.get(key)??null},setItem(key,value){this.data.set(key,value)},removeItem(key){this.data.delete(key)}};
const backup=buildBackup(storage,['cuentas_atras'],new Date('2026-11-15T10:00:00Z'));
assert.equal(backup.formato,BACKUP_FORMAT);assert.equal(backup.version,2);assert.equal(backup.secciones.cuentas_atras.personal[0].category,'birthday');

const oldBackup=parseImport(JSON.stringify({formato:'odin-copia-v1',version:1,secciones:{cuentas_atras:{personal:[{id:'old',name:'Antiguo',targetAt:new Date(2027,0,5,9).getTime()}]}}}),'old.json');
assert.equal(oldBackup.secciones.cuentas_atras.personal[0].category,'reminder');

const calendarStorage={getItem:key=>key==='odin-calendar-v1'?JSON.stringify({localHolidaySeedVersion:1,vacations:[{id:'local',name:'Festivo local de prueba',start:'2027-02-10',end:'2027-02-10',type:'other'},{id:'vacation',name:'Vacaciones',start:'2027-02-01',end:'2027-02-05',type:'vacation'}]}):null};
const general=nextGeneralEvents(new Date(2026,10,15,12),calendarStorage);
for(const name of ['Navidad','Año Nuevo','Fiesta del Trabajo','Fiesta Nacional de España','Diada Nacional de Cataluña','Fiesta de la Comunidad de Madrid','Festivo local de prueba','Jueves Santo','Viernes Santo','Lunes de Pascua Florida','Cambio al horario de verano'])assert.ok(general.some(item=>item.name===name),`Falta ${name}`);
assert.ok(!general.some(item=>item.name==='Vacaciones'));assert.equal(new Set(general.map(item=>item.id)).size,general.length);assert.equal(isGeneralEventEnabled({defaults:{'new-year':false}},'new-year'),false);assert.ok(dueGeneralEvents(new Date(2026,11,25,12),calendarStorage).some(item=>item.name==='Navidad'));
console.log('COUNTDOWN_TESTS=PASS');
