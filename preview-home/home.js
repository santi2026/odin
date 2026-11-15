import {nextOccurrence,readCountdownState} from '/countdown-data.js?v=2';
import {isGeneralEventEnabled,nextGeneralEvents} from '/countdown-general.js?v=1';

const catalogResponse = await fetch('/catalog-data.json?v=1', { cache: 'no-store' });
if (!catalogResponse.ok) throw new Error('No se pudo cargar el catálogo de ODÍN.');
const catalog = await catalogResponse.json();
const tools = catalog.tools.map((tool) => [tool.id, tool.category, tool.name, tool.description, tool.status, tool.href, tool.cover, tool.preview]);
const preferredCategoryOrder = catalog.categoryOrder;

const categoryCounts = tools.reduce((counts, tool) => counts.set(tool[1], (counts.get(tool[1]) || 0) + 1), new Map());
const remainingCategories = [...categoryCounts.keys()].filter(category => !preferredCategoryOrder.includes(category)).sort((a,b) => a.localeCompare(b,'es'));
const categories = preferredCategoryOrder.filter(category => categoryCounts.has(category)).concat(remainingCategories);
const filtersNode = document.querySelector('#catalog-filters');
filtersNode.innerHTML = [{ value:'all', label:'Todas', count:tools.length }, ...categories.map(category => ({ value:category, label:category, count:categoryCounts.get(category) }))]
  .map((filter,index) => `<button class="filter-chip${index===0?' active':''}" type="button" data-filter="${filter.value}" aria-pressed="${index===0}"><span>${filter.label}</span><b>(${filter.count})</b></button>`).join('');
document.querySelector('#catalog-tool-count').textContent = tools.length;
const labels = { available: 'Disponible', next: 'Próximamente', planned: 'Planificada' };
const grid = document.querySelector('#tool-grid');
for (const [id, category, name, description, status, href, cover, preview] of tools) {
  const card = document.createElement('article');
  card.className = `tool-card status-${status}`; card.dataset.toolName = `${name} ${description} ${category}`.toLowerCase();
  card.dataset.category = category;
  card.innerHTML = `<div class="tool-cover cover-${cover}" aria-hidden="true"><span class="cover-code">${id}</span><div class="cover-preview">${preview}</div></div><div class="tool-card-copy"><div class="tool-meta"><span class="tool-category">${category}</span><span class="status-pill pill-${status}">${labels[status]}</span></div><h3>${name}</h3><p>${description}</p></div>${href ? `<a class="card-hit-area" href="${href}" aria-label="Abrir ${name}"><span class="sr-only">Abrir ${name}</span></a>` : ''}`;
  grid.append(card);
}
const input = document.querySelector('#tool-search'), cards = [...document.querySelectorAll('.tool-card')], empty = document.querySelector('#empty-state'), chips = [...document.querySelectorAll('.filter-chip')];
let activeFilter = 'all';
function updateCards() { const query = input.value.trim().toLocaleLowerCase('es'); let visible = 0; for (const card of cards) { const matchText = card.dataset.toolName.includes(query), matchCategory = activeFilter === 'all' || card.dataset.category === activeFilter, match = matchText && matchCategory; card.hidden = !match; if (match) visible++; } empty.hidden = visible !== 0; }
input.addEventListener('input', updateCards);
for (const chip of chips) chip.addEventListener('click', () => { activeFilter = chip.dataset.filter; for (const item of chips) { const selected=item===chip; item.classList.toggle('active',selected); item.setAttribute('aria-pressed',String(selected)); } updateCards(); });

const timeFormatter = (timeZone) => new Intl.DateTimeFormat('es-ES', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const localTime = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function updateLiveTimes() {
  const now = new Date();
  document.querySelector('#live-local-time').textContent = localTime.format(now);
  document.querySelector('#live-barcelona').textContent = timeFormatter('Europe/Madrid').format(now);
  document.querySelector('#live-washington').textContent = timeFormatter('America/New_York').format(now);
}
updateLiveTimes();
setInterval(updateLiveTimes, 1000);

function formatCoverDuration(milliseconds) {
  const total = Math.ceil(Math.max(0, milliseconds) / 1000);
  const seconds = total % 60;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  const two = (value) => String(value).padStart(2, '0');
  return hours ? `${two(hours)}:${two(minutes)}:${two(seconds)}` : `${two(minutes)}:${two(seconds)}`;
}
function updateTimerCover() {
  const time = document.querySelector('#live-timer-cover');
  const label = document.querySelector('#live-timer-state');
  if (!time || !label) return;
  try {
    const timer = JSON.parse(localStorage.getItem('odin-timer-v1'))?.timer;
    if (!timer) return;
    const remaining = timer.running ? Math.max(0, timer.endAt - Date.now()) : timer.remaining;
    time.textContent = formatCoverDuration(remaining);
    label.textContent = timer.running && remaining > 0 ? '● En marcha' : remaining <= 0 ? 'Tiempo cumplido' : remaining < timer.duration ? 'En pausa' : 'Preparado';
    time.closest('.tool-cover')?.classList.toggle('is-cover-active', timer.running && remaining > 0);
  } catch { /* Conserva la portada predeterminada si no hay una sesión válida. */ }
}
updateTimerCover();
setInterval(updateTimerCover, 500);

function updateAlarmCover() {
  const time=document.querySelector('#live-next-alarm'), detail=document.querySelector('#live-alarm-days'); if(!time||!detail)return;
  try {
    const alarms=(JSON.parse(localStorage.getItem('odin-alarms-v1'))?.alarms||[]).filter(alarm=>alarm.enabled&&alarm.nextAt>Date.now()).sort((a,b)=>a.nextAt-b.nextAt);
    const next=alarms[0]; if(!next){ time.textContent='--:--'; detail.textContent='Ninguna programada'; return; }
    time.textContent=next.time; const date=new Date(next.nextAt), today=new Date(), tomorrow=new Date(); tomorrow.setDate(today.getDate()+1); detail.textContent=date.toDateString()===today.toDateString()?'Hoy':date.toDateString()===tomorrow.toDateString()?'Mañana':new Intl.DateTimeFormat('es-ES',{weekday:'long'}).format(date);
  } catch { time.textContent='--:--'; detail.textContent='Ninguna programada'; }
}
updateAlarmCover(); setInterval(updateAlarmCover,1000);

function updateFocusCover(){
  const value=document.querySelector('#live-focus-time'),unit=document.querySelector('#live-focus-unit'),label=document.querySelector('#live-focus-phase');if(!value||!unit||!label)return;
  try{const state=JSON.parse(localStorage.getItem('odin-focus-v1')),session=state?.session;if(!session)return;const remaining=session.running?Math.max(0,session.endAt-Date.now()):session.remaining;const seconds=Math.ceil(remaining/1000);value.textContent=seconds>=60?Math.ceil(seconds/60):seconds;unit.textContent=seconds>=60?'min':'s';const phase=session.phase==='focus'?'Concentración':session.phase==='short'?'Descanso corto':'Descanso largo';label.textContent=session.running?`${phase} · En marcha`:session.phase==='focus'?`Sesión ${session.sessionIndex} de ${state.settings.sessions}`:phase;value.closest('.tool-cover')?.classList.toggle('is-cover-active',session.running);}catch{}
}
updateFocusCover();setInterval(updateFocusCover,500);

function upcomingCountdowns(){
  const state=readCountdownState(),today=new Date().setHours(0,0,0,0),items=state.personal.filter(item=>item.enabled!==false).map(item=>({name:item.name,...nextOccurrence(item)})).filter(item=>item.targetAt>=today);
  items.push(...nextGeneralEvents().filter(item=>isGeneralEventEnabled(state,item.id)));
  const seen=new Set();return items.sort((a,b)=>a.targetAt-b.targetAt).filter(item=>{const key=`${new Date(item.targetAt).toDateString()}:${item.name.toLocaleLowerCase('es')}`;if(seen.has(key))return false;seen.add(key);return true});
}
function updateCountdownCover(){const name=document.querySelector('#live-countdown-name'),days=document.querySelector('#live-countdown-days'),unit=document.querySelector('#live-countdown-unit');if(!name||!days||!unit)return;const next=upcomingCountdowns()[0];if(!next){name.textContent='Sin acontecimientos';days.textContent='--';unit.textContent='días';return;}const remaining=next.targetAt-Date.now(),dayCount=Math.ceil(remaining/86400000);name.textContent=next.name;days.textContent=dayCount;unit.textContent=dayCount===1?'día':'días';}
updateCountdownCover();setInterval(updateCountdownCover,30000);window.addEventListener('odin:countdowns-updated',updateCountdownCover);window.addEventListener('odin:calendar-updated',updateCountdownCover);

async function updatePublicIp() {
  const value = document.querySelector('#live-public-ip');
  const type = document.querySelector('#live-ip-type');
  try {
    const response = await fetch('https://api64.ipify.org?format=json', { cache: 'no-store' });
    if (!response.ok) throw new Error('IP no disponible');
    const data = await response.json();
    value.textContent = data.ip;
    type.textContent = data.ip.includes(':') ? 'Dirección IPv6' : 'Dirección IPv4';
  } catch {
    value.textContent = 'No disponible';
    type.textContent = 'No se pudo consultar';
  }
}
updatePublicIp();

function updateMoonCover(){
  const label=document.querySelector('#live-moon-phase'),disc=document.querySelector('#live-moon-disc');if(!label||!disc)return;
  const month=29.530588853,epoch=Date.UTC(2000,0,6,18,14),fraction=(((Date.now()-epoch)/86400000/month)%1+1)%1,illumination=(1-Math.cos(2*Math.PI*fraction))/2;
  const names=[[.0339,'Luna nueva'],[.2161,'Creciente'],[.2839,'Cuarto creciente'],[.4661,'Gibosa creciente'],[.5339,'Luna llena'],[.7161,'Gibosa menguante'],[.7839,'Cuarto menguante'],[.9661,'Menguante']];
  label.textContent=`${(names.find(([limit])=>fraction<limit)||names[0])[1]} · ${Math.round(illumination*100)} %`;
  disc.style.setProperty('--moon-light',`${Math.round(illumination*100)}%`);disc.classList.toggle('is-waning',fraction>.5);
}
updateMoonCover();setInterval(updateMoonCover,60000);

function updateCalendarCover(){const month=document.querySelector('#live-calendar-month'),next=document.querySelector('#live-calendar-next');if(!month||!next)return;const now=new Date(),names=['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];month.textContent=`${names[now.getMonth()]} ${now.getFullYear()}`;const annual=[[0,1,'Año Nuevo'],[0,6,'Reyes'],[4,1,'Día del Trabajo'],[7,15,'Asunción'],[9,12,'Fiesta Nacional'],[10,1,'Todos los Santos'],[11,6,'Constitución'],[11,8,'Inmaculada'],[11,25,'Navidad']];let items=[];for(const add of [0,1])for(const [m,d,name] of annual){const date=new Date(now.getFullYear()+add,m,d);if(date>now)items.push({date,name})}items.sort((a,b)=>a.date-b.date);const item=items[0],days=Math.ceil((item.date-now)/86400000);next.textContent=`${item.name} · ${days} ${days===1?'día':'días'}`;}
updateCalendarCover();setInterval(updateCalendarCover,3600000);
