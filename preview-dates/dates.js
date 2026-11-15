import {LOCAL_HOLIDAY_SEED_VERSION,officialLocalPeriods} from '../calendar-data.js?v=1';
import {COUNTDOWN_MAX,normalizeCountdownItem,readCountdownState,writeCountdownState} from '../countdown-data.js?v=1';
import {addAmount,addDays,analyzeRange,dateKey,dayInfo,parseDate} from './date-core.js?v=1';

const CALENDAR_KEY='odin-calendar-v1',PREFERENCES_KEY='odin-date-calculator-v1';
const $=selector=>document.querySelector(selector);
const today=new Date();today.setHours(12,0,0,0);
let periods=loadCalendarPeriods(),resultDate=new Date(today),activeTab='add';
const defaultPolicy={spain:true,barcelona:true,madrid:true,other:true,vacation:false};
let preferences=loadPreferences(),policy={...defaultPolicy,...preferences.policy};

function loadCalendarPeriods(){
  try{
    const saved=JSON.parse(localStorage.getItem(CALENDAR_KEY)||'{}'),items=Array.isArray(saved.vacations)?saved.vacations:[];
    if((Number(saved.localHolidaySeedVersion)||0)<LOCAL_HOLIDAY_SEED_VERSION){
      for(const period of officialLocalPeriods)if(!items.some(item=>item.type==='other'&&item.start===period.start&&item.end===period.end))items.push({...period});
      saved.vacations=items;saved.localHolidaySeedVersion=LOCAL_HOLIDAY_SEED_VERSION;localStorage.setItem(CALENDAR_KEY,JSON.stringify(saved));
    }
    return items;
  }catch{return officialLocalPeriods.map(item=>({...item}))}
}
function loadPreferences(){try{return JSON.parse(localStorage.getItem(PREFERENCES_KEY)||'{}')}catch{return{}}}
function savePreferences(){localStorage.setItem(PREFERENCES_KEY,JSON.stringify({policy,activeTab}))}
function iso(date){return dateKey(date)}
function format(date,options){return new Intl.DateTimeFormat('es-ES',options).format(date)}
function plural(value,singular,pluralForm=`${singular}s`){return `${value} ${value===1?singular:pluralForm}`}
function durationLabel(duration){const parts=[];if(duration.years)parts.push(plural(duration.years,'año'));if(duration.months)parts.push(plural(duration.months,'mes','meses'));if(duration.days||!parts.length)parts.push(plural(duration.days,'día'));return parts.join(', ')}
function allFacts(date){return dayInfo(date,{spain:true,barcelona:true,madrid:true,other:true,vacation:true},periods)}

function setTab(name){
  activeTab=name==='between'?'between':'add';
  $('#panel-add').hidden=activeTab!=='add';$('#panel-between').hidden=activeTab!=='between';
  $('#tab-add').setAttribute('aria-selected',String(activeTab==='add'));$('#tab-between').setAttribute('aria-selected',String(activeTab==='between'));
  savePreferences();
}

function renderAdd(){
  if(!$('#base-date').value){$('#result-date').textContent='Selecciona una fecha';return}
  const base=parseDate($('#base-date').value),amount=Math.max(0,Math.trunc(Number($('#amount').value)||0)),unit=$('#unit').value,direction=Number($('#operation').value)||1;
  try{resultDate=addAmount(base,amount,unit,direction,policy,periods)}catch(error){$('#result-message').hidden=false;$('#result-message').textContent=error.message;return}
  const unitLabels={days:'días naturales',business:'días laborables',weeks:'semanas',months:'meses',years:'años'},facts=allFacts(resultDate),span=analyzeRange(base,resultDate,false,policy,periods);
  $('#result-weekday').textContent=format(resultDate,{weekday:'long'});$('#result-date').textContent=format(resultDate,{day:'numeric',month:'long',year:'numeric'});
  $('#result-expression').textContent=`${format(base,{day:'2-digit',month:'short',year:'numeric'})} ${direction>0?'+':'−'} ${amount} ${unitLabels[unit]}`;
  $('#result-detail').textContent=unit==='business'?`Se han recorrido ${span.natural} días naturales y excluido ${Math.max(0,span.natural-amount)}.`:`Equivale a una separación de ${span.natural} días naturales.`;
  const badges=[];if(facts.weekend)badges.push('<span class="weekend">Fin de semana</span>');for(const event of facts.events)badges.push(`<span>${escapeHtml(event.name)}</span>`);for(const period of facts.periods)badges.push(`<span class="${period.type==='other'?'other':'vacation'}">${escapeHtml(period.name)}</span>`);if(!badges.length)badges.push('<span class="business">Día laborable según la selección</span>');$('#result-badges').innerHTML=badges.join('');
  const target=new Date(resultDate.getFullYear(),resultDate.getMonth(),resultDate.getDate(),0,0,0,0);$('#create-countdown').disabled=target.getTime()<=Date.now();$('#create-countdown').title=target.getTime()<=Date.now()?'La fecha debe ser futura':'';$('#result-message').hidden=true;
  $('#add-rule').textContent=unit==='business'?'Se excluyen fines de semana y las capas seleccionadas. La fecha inicial no cuenta.':unit==='months'||unit==='years'?'Si el día no existe en el mes de destino, se utiliza el último día válido.':'La fecha inicial no cuenta como uno de los días añadidos.';
}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}

function renderBetween(){
  if(!$('#start-date').value||!$('#end-date').value){$('#between-title').textContent='Selecciona las dos fechas';return}
  const originalStart=parseDate($('#start-date').value),originalEnd=parseDate($('#end-date').value),inclusive=$('#include-both').checked,analysis=analyzeRange(originalStart,originalEnd,inclusive,policy,periods),first=originalStart<=originalEnd?originalStart:originalEnd,last=originalStart<=originalEnd?originalEnd:originalStart;
  $('#between-title').textContent=plural(analysis.natural,'día');$('#between-order').textContent=`Del ${format(first,{day:'numeric',month:'short',year:'numeric'})} al ${format(last,{day:'numeric',month:'short',year:'numeric'})}${inclusive?' · ambos incluidos':''}`;
  $('#natural-days').textContent=analysis.natural;$('#business-days').textContent=analysis.business;$('#weeks-days').textContent=plural(analysis.weeks,'semana');$('#weeks-days-rest').textContent=plural(analysis.remainingDays,'día');$('#calendar-duration').textContent=durationLabel(analysis.duration);$('#weekend-count').textContent=analysis.weekends;$('#holiday-count').textContent=analysis.holidays;$('#period-count').textContent=analysis.periodDays;
}

function renderPolicy(){
  for(const input of document.querySelectorAll('[data-policy]'))input.checked=policy[input.dataset.policy]!==false;
  const vacationCount=periods.filter(item=>item.type!=='other').length,otherCount=periods.filter(item=>item.type==='other').length;
  $('#policy-status').textContent=`Calendario conectado: ${vacationCount} ${vacationCount===1?'periodo de vacaciones':'periodos de vacaciones'} y ${otherCount} en Otros. Festivos oficiales disponibles para 2026 y 2027.`;
}
function render(){renderAdd();renderBetween();renderPolicy()}

function createCountdown(){
  const message=$('#result-message'),targetAt=new Date(resultDate.getFullYear(),resultDate.getMonth(),resultDate.getDate(),0,0,0,0).getTime(),name=$('#countdown-name').value.trim()||'Fecha calculada';
  if(targetAt<=Date.now()){message.textContent='La cuenta atrás necesita una fecha futura.';message.hidden=false;return}
  const state=readCountdownState();
  if(state.personal.length>=COUNTDOWN_MAX){message.textContent='Has alcanzado el límite de 20 cuentas personales.';message.hidden=false;return}
  state.personal.push(normalizeCountdownItem({id:crypto.randomUUID(),name,category:'reminder',year:resultDate.getFullYear(),month:resultDate.getMonth()+1,day:resultDate.getDate(),time:'00:00',annual:false,yearKnown:true,enabled:true}));writeCountdownState(state);window.dispatchEvent(new Event('odin:countdowns-updated'));message.innerHTML='Recordatorio creado. <a href="/preview-countdown/">Abrir Cuenta atrás</a>';message.hidden=false;
}

const nextMonth=addDays(today,30);
$('#today-day').textContent=today.getDate();$('#today-label').textContent=format(today,{weekday:'long',month:'long',year:'numeric'});$('#base-date').value=iso(today);$('#start-date').value=iso(today);$('#end-date').value=iso(nextMonth);
for(const input of document.querySelectorAll('[data-policy]'))input.addEventListener('change',()=>{policy[input.dataset.policy]=input.checked;savePreferences();render()});
for(const id of ['base-date','operation','amount','unit'])$('#'+id).addEventListener('input',renderAdd);
for(const id of ['start-date','end-date','include-both'])$('#'+id).addEventListener('input',renderBetween);
for(const button of document.querySelectorAll('[data-base-offset]'))button.addEventListener('click',()=>{$('#base-date').value=iso(addDays(today,Number(button.dataset.baseOffset)));renderAdd()});
$('#swap-dates').addEventListener('click',()=>{const start=$('#start-date').value;$('#start-date').value=$('#end-date').value;$('#end-date').value=start;renderBetween()});
$('#tab-add').addEventListener('click',()=>setTab('add'));$('#tab-between').addEventListener('click',()=>setTab('between'));$('#create-countdown').addEventListener('click',createCountdown);
setTab(preferences.activeTab);render();
