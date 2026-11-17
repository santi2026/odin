import {nextOccurrence,readCountdownState} from '/countdown-data.js?v=2';
import {isGeneralEventEnabled,nextGeneralEvents} from '/countdown-general.js?v=1';

const catalogResponse = await fetch('/catalog-data.json?v=1', { cache: 'no-store' });
if (!catalogResponse.ok) throw new Error('No se pudo cargar el catálogo de ODÍN.');
const catalog = await catalogResponse.json();
const PREFERENCES_KEY='odin-catalog-preferences-v1';
const defaultTools=[...catalog.tools].sort((a,b)=>a.order-b.order);
function readPreferences(){try{const value=JSON.parse(localStorage.getItem(PREFERENCES_KEY));return{favorites:Array.isArray(value?.favorites)?value.favorites:[],order:Array.isArray(value?.order)?value.order:[]}}catch{return{favorites:[],order:[]}}}
let preferences=readPreferences();
const validSlugs=new Set(defaultTools.map(tool=>tool.slug));
preferences.favorites=[...new Set(preferences.favorites.filter(slug=>validSlugs.has(slug)))];preferences.order=[...new Set(preferences.order.filter(slug=>validSlugs.has(slug)))];
function savePreferences(){localStorage.setItem(PREFERENCES_KEY,JSON.stringify(preferences));window.dispatchEvent(new CustomEvent('odin:catalog-preferences-updated'))}
function orderedTools(){const rank=new Map(preferences.order.map((slug,index)=>[slug,index]));return[...defaultTools].sort((a,b)=>(rank.get(a.slug)??1000+a.order)-(rank.get(b.slug)??1000+b.order))}
const preferredCategoryOrder = catalog.categoryOrder;

const categoryCounts = defaultTools.reduce((counts, tool) => counts.set(tool.category, (counts.get(tool.category) || 0) + 1), new Map());
const remainingCategories = [...categoryCounts.keys()].filter(category => !preferredCategoryOrder.includes(category)).sort((a,b) => a.localeCompare(b,'es'));
const categories = preferredCategoryOrder.filter(category => categoryCounts.has(category)).concat(remainingCategories);
const filtersNode = document.querySelector('#catalog-filters');
function renderFilters(){const filters=[{value:'favorites',label:'★ Favoritos',count:preferences.favorites.length},{value:'all',label:'Todas',count:defaultTools.length},...categories.map(category=>({value:category,label:category,count:categoryCounts.get(category)}))];filtersNode.innerHTML=filters.map(filter=>`<button class="filter-chip${activeFilter===filter.value?' active':''}" type="button" data-filter="${filter.value}" aria-pressed="${activeFilter===filter.value}"><span>${filter.label}</span><b>(${filter.count})</b></button>`).join('');for(const chip of filtersNode.querySelectorAll('.filter-chip'))chip.addEventListener('click',()=>{activeFilter=chip.dataset.filter;renderFilters();updateCards()})}
document.querySelector('#catalog-tool-count').textContent = defaultTools.length;
const labels = { available: 'Disponible', next: 'Próximamente', planned: 'Planificada' };
const grid = document.querySelector('#tool-grid');
let activeFilter = 'all';
const input = document.querySelector('#tool-search'),empty = document.querySelector('#empty-state');
function renderCards(){grid.replaceChildren();for(const tool of orderedTools()){const favorite=preferences.favorites.includes(tool.slug),card=document.createElement('article');card.className=`tool-card status-${tool.status}`;card.dataset.toolName=`${tool.name} ${tool.description} ${tool.category}`.toLowerCase();card.dataset.category=tool.category;card.dataset.slug=tool.slug;card.innerHTML=`<button class="favorite-toggle${favorite?' is-favorite':''}" type="button" aria-pressed="${favorite}" aria-label="${favorite?'Quitar de':'Añadir a'} favoritos: ${tool.name}" title="${favorite?'Quitar de':'Añadir a'} favoritos">★</button><div class="tool-cover cover-${tool.cover}" aria-hidden="true"><span class="cover-code">${tool.id}</span><div class="cover-preview">${tool.preview}</div></div><div class="tool-card-copy"><div class="tool-meta"><span class="tool-category">${tool.category}</span><span class="status-pill pill-${tool.status}">${labels[tool.status]}</span></div><h3>${tool.name}</h3><p>${tool.description}</p></div>${tool.href?`<a class="card-hit-area" href="${tool.href}" aria-label="Abrir ${tool.name}"><span class="sr-only">Abrir ${tool.name}</span></a>`:''}`;card.querySelector('.favorite-toggle').addEventListener('click',()=>{preferences.favorites=favorite?preferences.favorites.filter(slug=>slug!==tool.slug):[...preferences.favorites,tool.slug];savePreferences();renderFilters();renderCards()});grid.append(card)}updateCards()}
function updateCards() { const query = input.value.trim().toLocaleLowerCase('es'); let visible = 0; for (const card of grid.querySelectorAll('.tool-card')) { const matchText = card.dataset.toolName.includes(query), matchCategory = activeFilter === 'all' || activeFilter==='favorites'&&preferences.favorites.includes(card.dataset.slug) || card.dataset.category === activeFilter, match = matchText && matchCategory; card.hidden = !match; if (match) visible++; } empty.hidden = visible !== 0; }
input.addEventListener('input', updateCards);
renderFilters();renderCards();

const orderDialog=document.querySelector('#tool-order-dialog'),orderList=document.querySelector('#tool-order-list');let workingOrder=[];
function renderOrderList(){orderList.replaceChildren();workingOrder.forEach((slug,index)=>{const tool=defaultTools.find(item=>item.slug===slug),row=document.createElement('li');row.draggable=true;row.dataset.slug=slug;row.innerHTML=`<span aria-hidden="true">⋮⋮</span><b>${tool.id}</b><strong>${tool.name}</strong><button type="button" data-move="up" ${index===0?'disabled':''} aria-label="Subir ${tool.name}">↑</button><button type="button" data-move="down" ${index===workingOrder.length-1?'disabled':''} aria-label="Bajar ${tool.name}">↓</button>`;row.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>{const target=index+(button.dataset.move==='up'?-1:1);[workingOrder[index],workingOrder[target]]=[workingOrder[target],workingOrder[index]];preferences.order=[...workingOrder];savePreferences();renderOrderList();renderCards()}));row.addEventListener('dragstart',event=>event.dataTransfer.setData('text/plain',slug));row.addEventListener('dragover',event=>event.preventDefault());row.addEventListener('drop',event=>{event.preventDefault();const source=event.dataTransfer.getData('text/plain'),from=workingOrder.indexOf(source),to=workingOrder.indexOf(slug);if(from<0||to<0||from===to)return;workingOrder.splice(to,0,workingOrder.splice(from,1)[0]);preferences.order=[...workingOrder];savePreferences();renderOrderList();renderCards()});orderList.append(row)})}
document.querySelector('#open-tool-order').addEventListener('click',()=>{workingOrder=orderedTools().map(tool=>tool.slug);renderOrderList();orderDialog.showModal()});
document.querySelector('#reset-tool-order').addEventListener('click',()=>{workingOrder=defaultTools.map(tool=>tool.slug);preferences.order=[];savePreferences();renderOrderList();renderCards()});

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
