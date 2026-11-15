import {LOCAL_HOLIDAY_SEED_VERSION,officialEventsForYear,officialLocalPeriods} from './calendar-data.js?v=2';

const CALENDAR_KEY='odin-calendar-v1';
const pad=value=>String(value).padStart(2,'0');
const dateKey=date=>`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
const slug=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const layerLabel=layer=>({spain:'España',barcelona:'Barcelona / Cataluña',madrid:'Madrid',other:'Otros'}[layer]||'Calendario');
const legacyIds=new Map([
  ['spain:Año Nuevo','new-year'],['spain:Epifanía del Señor / Reyes','kings'],['spain:Todos los Santos','all-saints'],['spain:Navidad','christmas'],['barcelona:San Juan / Sant Joan','san-juan']
]);

function eventId(event){return legacyIds.get(`${event.layer}:${event.name}`)||`holiday-${event.layer}-${slug(event.name)}`}
function timestamp(value,hour=0){const [year,month,day]=value.split('-').map(Number);return new Date(year,month-1,day,hour,0,0,0).getTime()}
function lastSunday(year,month){const date=new Date(year,month+1,0);return date.getDate()-date.getDay()}
function calendarPeriods(storage=localStorage){
  try{
    const saved=JSON.parse(storage.getItem(CALENDAR_KEY)||'{}'),periods=Array.isArray(saved.vacations)?saved.vacations:[];
    if((Number(saved.localHolidaySeedVersion)||0)>=LOCAL_HOLIDAY_SEED_VERSION)return periods;
    return [...periods,...officialLocalPeriods.filter(seed=>!periods.some(item=>item.type==='other'&&item.start===seed.start&&item.end===seed.end))];
  }catch{return officialLocalPeriods.map(item=>({...item}))}
}
function occurrencesForYears(firstYear,lastYear,storage=localStorage){
  const output=[];
  for(let year=firstYear;year<=lastYear;year++){
    for(const event of officialEventsForYear(year))output.push({id:eventId(event),name:event.name,category:'general',targetAt:timestamp(event.date),general:true,annual:true,occurrenceYear:year,detail:layerLabel(event.layer),source:event.layer});
    output.push({id:'sant-jordi',name:'Sant Jordi',category:'general',targetAt:new Date(year,3,23).getTime(),general:true,annual:true,occurrenceYear:year,detail:'ODÍN',source:'odin'});
    output.push({id:'clock-summer',name:'Cambio al horario de verano',category:'general',targetAt:new Date(year,2,lastSunday(year,2),2).getTime(),general:true,annual:true,occurrenceYear:year,detail:'Cambio de hora',source:'odin'});
    output.push({id:'clock-winter',name:'Cambio al horario de invierno',category:'general',targetAt:new Date(year,9,lastSunday(year,9),2).getTime(),general:true,annual:true,occurrenceYear:year,detail:'Cambio de hora',source:'odin'});
  }
  for(const item of calendarPeriods(storage).filter(item=>item.type==='other'&&item.start)){
    const itemYear=Number(item.start.slice(0,4));if(itemYear<firstYear||itemYear>lastYear)continue;
    output.push({id:`calendar-other-${item.id||slug(`${item.name}-${item.start}`)}`,name:item.name||'Otros',category:'general',targetAt:timestamp(item.start),general:true,annual:false,occurrenceYear:itemYear,detail:'Festivo municipal / Otros',source:'other'});
  }
  return [...new Map(output.map(item=>[`${item.id}:${item.targetAt}`,item])).values()];
}

export function isGeneralEventEnabled(state,id){return state.defaults?.[id]!==false&&(!id.startsWith('clock-')||state.defaults?.['clock-change']!==false)}

export function nextGeneralEvents(now=new Date(),storage=localStorage){
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),lastYear=now.getFullYear()+2,byId=new Map();
  for(const item of occurrencesForYears(now.getFullYear(),lastYear,storage).filter(item=>item.targetAt>=today).sort((a,b)=>a.targetAt-b.targetAt||a.name.localeCompare(b.name,'es')))if(!byId.has(item.id))byId.set(item.id,item);
  return [...byId.values()].sort((a,b)=>a.targetAt-b.targetAt||a.name.localeCompare(b.name,'es'));
}

export function dueGeneralEvents(now=new Date(),storage=localStorage){
  const from=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
  return occurrencesForYears(now.getFullYear()-1,now.getFullYear(),storage).filter(item=>item.targetAt<=now.getTime()&&item.targetAt>=from).sort((a,b)=>a.targetAt-b.targetAt);
}

export function generalEventDateKey(item){return dateKey(new Date(item.targetAt))}
