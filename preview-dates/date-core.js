import {officialEventsForYear} from '../calendar-data.js?v=1';

const DAY_MS=86400000;

export function parseDate(value){
  const [year,month,day]=String(value).split('-').map(Number);
  return new Date(year,month-1,day,12);
}

export function dateKey(date){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function addDays(date,amount){
  const result=new Date(date);
  result.setDate(result.getDate()+amount);
  return result;
}

export function addMonthsClamped(date,amount){
  const total=date.getFullYear()*12+date.getMonth()+amount;
  const year=Math.floor(total/12),month=((total%12)+12)%12;
  const day=Math.min(date.getDate(),new Date(year,month+1,0).getDate());
  return new Date(year,month,day,12);
}

export function daysBetween(first,second){
  const serial=date=>Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());
  return Math.round((serial(second)-serial(first))/DAY_MS);
}

export function dayInfo(date,policy,periods=[]){
  const value=dateKey(date),weekend=date.getDay()===0||date.getDay()===6;
  const events=officialEventsForYear(date.getFullYear()).filter(event=>event.date===value&&policy[event.layer]!==false);
  const matchedPeriods=periods.filter(period=>value>=period.start&&value<=period.end&&policy[period.type==='other'?'other':'vacation']!==false);
  return{weekend,events,periods:matchedPeriods,business:!weekend&&!events.length&&!matchedPeriods.length};
}

export function addAmount(base,amount,unit,direction,policy,periods=[]){
  const signed=Math.max(0,Math.trunc(amount))*direction;
  if(unit==='business'){
    let result=new Date(base),remaining=Math.abs(signed),guard=0;
    const step=signed<0?-1:1;
    while(remaining&&guard<200000){result=addDays(result,step);if(dayInfo(result,policy,periods).business)remaining--;guard++}
    if(remaining)throw new Error('El periodo solicitado es demasiado amplio.');
    return result;
  }
  if(unit==='weeks')return addDays(base,signed*7);
  if(unit==='months')return addMonthsClamped(base,signed);
  if(unit==='years')return addMonthsClamped(base,signed*12);
  return addDays(base,signed);
}

export function calendarDuration(start,end,inclusive=false){
  let first=start,last=end;
  if(first>last)[first,last]=[last,first];
  if(inclusive)last=addDays(last,1);
  let months=(last.getFullYear()-first.getFullYear())*12+last.getMonth()-first.getMonth();
  let anchor=addMonthsClamped(first,months);
  if(anchor>last){months--;anchor=addMonthsClamped(first,months)}
  const days=Math.max(0,daysBetween(anchor,last));
  return{years:Math.floor(months/12),months:months%12,days};
}

export function analyzeRange(start,end,inclusive,policy,periods=[]){
  let first=start,last=end;
  if(first>last)[first,last]=[last,first];
  const natural=Math.max(0,Math.abs(daysBetween(first,last))+(inclusive?1:0));
  let cursor=inclusive?new Date(first):addDays(first,1),business=0,weekends=0,holidays=0,periodDays=0,excluded=0;
  while(cursor<=last&&natural){
    const info=dayInfo(cursor,policy,periods);
    if(info.business)business++;else excluded++;
    if(info.weekend)weekends++;
    if(info.events.length)holidays++;
    if(info.periods.length)periodDays++;
    cursor=addDays(cursor,1);
  }
  return{natural,business,weekends,holidays,periodDays,excluded,duration:calendarDuration(first,last,inclusive),weeks:Math.floor(natural/7),remainingDays:natural%7};
}
