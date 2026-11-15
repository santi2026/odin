export const COUNTDOWN_KEY='odin-countdowns-v1';
export const COUNTDOWN_SCHEMA_VERSION=2;
export const COUNTDOWN_MAX=200;
export const COUNTDOWN_CATEGORIES=[
  {id:'birthday',label:'Cumpleaños',annual:true,color:'#ef6f9d'},
  {id:'saint',label:'Santos',annual:true,color:'#45b8b0'},
  {id:'anniversary',label:'Aniversarios',annual:true,color:'#a877e8'},
  {id:'reminder',label:'Recordatorios',annual:false,color:'#e58b45'},
];
export const COUNTDOWN_CATEGORY_IDS=COUNTDOWN_CATEGORIES.map(item=>item.id);
export const categoryInfo=id=>COUNTDOWN_CATEGORIES.find(item=>item.id===id)||COUNTDOWN_CATEGORIES.at(-1);
const pad=value=>String(value).padStart(2,'0');
const validDateParts=(year,month,day)=>{const date=new Date(year,month-1,day,12);return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day};
const localParts=timestamp=>{const date=new Date(timestamp);return{year:date.getFullYear(),month:date.getMonth()+1,day:date.getDate(),time:`${pad(date.getHours())}:${pad(date.getMinutes())}`}};

export function normalizeCountdownItem(source={}){
  const legacy=Number(source.targetAt)?localParts(Number(source.targetAt)):null;
  const category=COUNTDOWN_CATEGORY_IDS.includes(source.category)?source.category:'reminder';
  const yearKnown=category!=='birthday'||source.yearKnown!==false;
  const year=yearKnown?Number(source.year||legacy?.year||new Date().getFullYear()):null;
  const month=Number(source.month||legacy?.month||1),day=Number(source.day||legacy?.day||1);
  const time=/^\d{2}:\d{2}$/.test(source.time||'')?source.time:(legacy?.time||'00:00');
  return{
    id:source.id||crypto.randomUUID(),name:String(source.name||'Acontecimiento').trim(),category,
    year:yearKnown&&Number.isInteger(year)?year:null,month,day,time,
    annual:Boolean(source.annual),yearKnown,enabled:source.enabled!==false,
    notifiedOccurrence:String(source.notifiedOccurrence||''),
  };
}

export function normalizeCountdownState(source={}){
  return{
    schemaVersion:COUNTDOWN_SCHEMA_VERSION,
    personal:(Array.isArray(source.personal)?source.personal:[]).map(normalizeCountdownItem),
    defaults:source.defaults&&typeof source.defaults==='object'?source.defaults:{},
    notifiedDefaults:source.notifiedDefaults&&typeof source.notifiedDefaults==='object'?source.notifiedDefaults:{},
    settings:{soundEnabled:true,soundChoice:'bell',...(source.settings||{})},
  };
}

export function readCountdownState(storage=localStorage){
  try{return normalizeCountdownState(JSON.parse(storage.getItem(COUNTDOWN_KEY)||'{}'))}catch{return normalizeCountdownState()}
}
export function writeCountdownState(state,storage=localStorage){const normalized=normalizeCountdownState(state);storage.setItem(COUNTDOWN_KEY,JSON.stringify(normalized));return normalized}

function safeDay(year,month,day){return month===2&&day===29&&!validDateParts(year,month,day)?28:day}
export function occurrenceForYear(item,year){
  const value=normalizeCountdownItem(item),occurrenceYear=value.annual?year:value.year;
  if(!occurrenceYear||(!value.annual&&occurrenceYear!==year))return null;
  const day=safeDay(occurrenceYear,value.month,value.day),[hour,minute]=value.time.split(':').map(Number);
  const date=new Date(occurrenceYear,value.month-1,day,hour,minute,0,0);
  if(date.getMonth()!==value.month-1)return null;
  return{targetAt:date.getTime(),dateKey:`${occurrenceYear}-${pad(value.month)}-${pad(day)}`,occurrenceYear};
}

export function nextOccurrence(item,now=new Date()){
  const value=normalizeCountdownItem(item);
  if(!value.annual)return occurrenceForYear(value,value.year||now.getFullYear());
  const today=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  let result=occurrenceForYear(value,now.getFullYear());
  if(result&&result.dateKey<today)result=occurrenceForYear(value,now.getFullYear()+1);
  return result;
}

export function ageForOccurrence(item,occurrenceYear){const value=normalizeCountdownItem(item);return value.category==='birthday'&&value.yearKnown&&value.year?Math.max(0,occurrenceYear-value.year):null}
export function anniversaryYears(item,occurrenceYear){const value=normalizeCountdownItem(item);return value.category==='anniversary'&&value.yearKnown&&value.year?Math.max(0,occurrenceYear-value.year):null}
export function occurrenceLabel(item,occurrenceYear){
  const age=ageForOccurrence(item,occurrenceYear);if(age!==null)return`${age} ${age===1?'año':'años'}`;
  const years=anniversaryYears(item,occurrenceYear);if(years!==null)return`${years} ${years===1?'año':'años'}`;
  if(item.category==='birthday'&&item.yearKnown===false)return'Edad no indicada';return item.annual?'Se repite cada año':'';
}
export function personalEventsForDate(state,dateKey){const year=Number(dateKey.slice(0,4));return normalizeCountdownState(state).personal.filter(item=>item.enabled!==false).map(item=>{const occurrence=occurrenceForYear(item,year);return occurrence?.dateKey===dateKey?{...item,...occurrence,detail:occurrenceLabel(item,year)}:null}).filter(Boolean)}
