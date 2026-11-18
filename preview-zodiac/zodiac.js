import {isoDate,profileForDate} from './zodiac-core.js';
import {readCountdownState} from '../countdown-data.js?v=2';

const $=selector=>document.querySelector(selector),dateFormatter=new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric'}),shortFormatter=new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'short'});
const select=$('#birthday-select'),dateInput=$('#birth-date'),hemisphere=$('#hemisphere'),warning=$('#date-warning');
let birthdays=[];

function loadBirthdays(){
  birthdays=readCountdownState().personal.filter(item=>item.category==='birthday'&&item.enabled!==false).sort((a,b)=>a.name.localeCompare(b.name,'es'));
  select.innerHTML='<option value="">Consulta manual</option>'+birthdays.map((item,index)=>`<option value="${index}">${escapeHtml(item.name)} · ${item.day}/${item.month}${item.yearKnown&&item.year?`/${item.year}`:''}</option>`).join('');
}
function escapeHtml(value){const span=document.createElement('span');span.textContent=value;return span.innerHTML}
function defaultDate(){const now=new Date();dateInput.value=isoDate(now.getFullYear(),now.getMonth()+1,now.getDate())}
function showWarning(message=''){warning.textContent=message;warning.hidden=!message}
function setText(id,value){$(id).textContent=value}
function selectedName(){const index=Number(select.value);return select.value===''?'Consulta manual':birthdays[index]?.name||'Consulta manual'}
function render(){
  if(!dateInput.value){showWarning('Selecciona una fecha completa para realizar la consulta.');return}
  try{
    const profile=profileForDate(dateInput.value,hemisphere.value),name=selectedName(),month=profile.date.getMonth()+1;
    showWarning();setText('#profile-title',name);setText('#profile-date',dateFormatter.format(profile.date));setText('#profile-status','Fecha completa');
    setText('#western-symbol',profile.western.symbol);setText('#western-name',profile.western.name);setText('#western-element',profile.western.element);setText('#western-modality',profile.western.modality);
    setText('#chinese-symbol',profile.chinese.symbol);setText('#chinese-name',`${profile.chinese.animal} de ${profile.chinese.element}`);setText('#chinese-element',profile.chinese.element);setText('#chinese-polarity',profile.chinese.polarity);setText('#chinese-year',`Año lunar ${profile.chinese.year}`);
    setText('#moon-name',profile.moon.name);setText('#moon-detail',`${Math.round(profile.moon.illumination*100)} % iluminada · día ${profile.moon.age.toFixed(1)}`);setText('#season-name',profile.season);setText('#season-detail',`Hemisferio ${hemisphere.value==='north'?'norte':'sur'}`);setText('#constellation-name',profile.astronomical);setText('#stone-name',profile.traditions.stone);setText('#flower-name',profile.traditions.flower);
    $('#moon-link').href=`/preview-moon/?date=${dateInput.value}`;
    setText('#wheel-western-symbol',profile.western.symbol);setText('#wheel-western-name',profile.western.name);setText('#wheel-western-detail',`${profile.western.element} · ${profile.western.modality}`);setText('#wheel-chinese-symbol',profile.chinese.symbol);setText('#wheel-chinese-name',profile.chinese.animal);setText('#wheel-chinese-detail',`${profile.chinese.element} · ${profile.chinese.polarity}`);
    setText('#compare-date',shortFormatter.format(profile.date).toUpperCase());setText('#compare-season',profile.season.toUpperCase());setText('#compare-moon',profile.moon.name.toUpperCase());setText('#compare-sun',profile.astronomical.toUpperCase());
    document.documentElement.style.setProperty('--zodiac-western-angle',`${(month-1)*30}deg`);document.documentElement.style.setProperty('--zodiac-chinese-angle',`${((profile.chinese.year-4)%12)*30}deg`);
  }catch(error){showWarning(error.message||'No se pudo analizar esta fecha.')}
}
function chooseBirthday(){
  if(select.value===''){showWarning();return}
  const item=birthdays[Number(select.value)];
  if(!item)return;
  if(!item.yearKnown||!item.year){dateInput.value='';setText('#profile-title',item.name);setText('#profile-status','Falta el año');showWarning(`«${item.name}» no tiene año de nacimiento. Añádelo en Cuenta atrás para calcular el zodiaco chino, la fase lunar y la constelación.`);return}
  dateInput.value=isoDate(item.year,item.month,item.day);render();
}
function selectTab(tab){for(const button of document.querySelectorAll('[role="tab"]')){const active=button===tab;button.setAttribute('aria-selected',String(active));$(`#${button.getAttribute('aria-controls')}`).hidden=!active}}
document.querySelectorAll('[role="tab"]').forEach(button=>button.addEventListener('click',()=>selectTab(button)));
select.addEventListener('change',chooseBirthday);dateInput.addEventListener('change',()=>{select.value='';render()});hemisphere.addEventListener('change',render);$('#analyze-date').addEventListener('click',render);window.addEventListener('odin:countdowns-updated',()=>{loadBirthdays();render()});
loadBirthdays();defaultDate();render();
