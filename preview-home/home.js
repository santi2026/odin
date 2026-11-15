const tools = [
  ['U01','Tiempo','Reloj negro','Hora limpia a pantalla completa, con movimiento protector.','available','/preview/','clock','<b id="live-local-time">--:--</b><small>hora local</small>'],
  ['U02','Conexión','Mi IP','Tu dirección pública y la información disponible de la conexión.','next','','ip','<small>Tu IP pública</small><b id="live-public-ip">Consultando…</b><i id="live-ip-type">Conexión actual</i>'],
  ['U03','Tiempo','Relojes del mundo','Compara ciudades con sus zonas horarias reales.','next','','world','<span><small>Barcelona</small><b id="live-barcelona">--:--</b></span><span><small>Washington</small><b id="live-washington">--:--</b></span>'],
  ['U06','Tiempo','Cronómetro y temporizador','Mide, pausa y recupera sesiones mediante tiempo real.','next','','timer','<b>25:00</b><span>▶ &nbsp; ↻</span>'],
  ['U10','Tiempo','Alarmas','Programa avisos web y recupera los que vencieron.','next','','alarm','<small>Próxima alarma</small><b>07:30</b><i>Lun · Mar · Mié · Jue · Vie</i>'],
  ['U04','Productividad','Concentración','Ciclos de trabajo y descanso ajustables.','planned','','focus','<div class="focus-ring"><b>18</b><small>min</small></div><i>Sesión 2 de 4</i>'],
  ['U05','Tiempo','Cuenta atrás','Sigue el tiempo restante hasta tus acontecimientos.','planned','','countdown','<small>Vacaciones</small><b>18</b><i>días</i>'],
  ['U07','Creación','Generador QR','Crea códigos QR localmente, sin enviar el contenido.','planned','','qr','<div class="qr-mark">▦</div><span>Texto → QR</span>'],
  ['U08','Cálculo','Calculadora de fechas','Suma días y calcula periodos entre fechas.','planned','','dates','<span><small>12 NOV</small><b>+ 45 días</b></span><strong>27 DIC</strong>'],
  ['U09','Cálculo','Conversor universal','Convierte unidades habituales con claridad.','planned','','convert','<span><b>24</b><small>km</small></span><i>⇄</i><span><b>14,91</b><small>mi</small></span>']
  ,['U11','Tiempo','Fases lunares','Consulta la fase actual de la Luna y sus próximos cambios.','planned','','moon','<div class="moon-orbit"><span class="moon-phase"></span></div><i>Cuarto creciente</i>']
];
tools.push(['U12','Tiempo','Calendario','Consulta calendarios mensuales o anuales con sus festivos.','planned','','calendar','<div class="calendar-cover"><strong>NOV</strong><span>10</span><span>11</span><span class="national">12</span><span>13</span><span class="barcelona">14</span><span class="overlap">15</span><span>16</span></div><i>España · Madrid · Barcelona</i>']);
tools.push(['U13','Texto y datos','HTML a texto','Extrae el texto legible de un documento HTML sin ejecutarlo.','available','/preview-html-text/','html-clean','<div class="html-clean-cover"><span>&lt;html&gt;</span><b>Texto limpio</b></div>']);
tools.push(['U14','Texto y datos','Codificador de texto y URL','Codifica, analiza URLs y cifra texto localmente.','available','/preview-codec/','codec','<div class="codec-cover"><span>%20 · 64</span><b>Texto ⇄ datos</b></div>']);
tools.push(['U15','Seguridad','Generador de contraseñas','Crea contraseñas, frases de paso y PIN aleatorios sin guardar historial.','available','/preview-password/','password','<div class="password-cover"><span>A7·x#9K</span><b>Generación local</b></div>']);
tools.push(['U16','Seguridad','Identificadores y dígitos de control','Valida, calcula y genera ejemplos de NIF, NIE, CIF, IBAN y NUSS/NAF.','planned','','identity','<div class="identity-cover"><span>12345678·Z</span><b>Validar · Calcular</b></div>']);
tools[1][4] = 'available';
tools[1][5] = '/preview-ip/';
tools[2][4] = 'available';
tools[2][5] = '/preview-world/';
tools[3][4] = 'available';
tools[3][5] = '/preview-timer/';
tools[3][2] = 'Temporizador y cronómetro';
tools[3][3] = 'Programa una cuenta atrás o mide el tiempo transcurrido.';
tools[3][7] = '<b id="live-timer-cover">25:00</b><span id="live-timer-state">Preparado</span>';
tools[4][4] = 'available';
tools[4][5] = '/preview-alarms/';
tools[4][7] = '<small>Próxima alarma</small><b id="live-next-alarm">--:--</b><i id="live-alarm-days">Ninguna programada</i>';
tools[5][2] = 'Concentración · Pomodoro';
tools[5][3] = 'Alterna sesiones de concentración y descanso configurables.';
tools[5][4] = 'available';
tools[5][5] = '/preview-focus/';
tools[5][7] = '<div class="focus-ring"><b id="live-focus-time">25</b><small id="live-focus-unit">min</small></div><i id="live-focus-phase">Sesión 1 de 4</i>';
tools[6][4] = 'available';
tools[6][5] = '/preview-countdown/';
tools[10][4] = 'available';
tools[10][5] = '/preview-moon/';
tools[10][7] = '<div class="moon-orbit"><span class="moon-phase" id="live-moon-disc"></span></div><i id="live-moon-phase">Fase actual</i>';
tools[11][4] = 'available';
tools[11][5] = '/preview-calendar/';
tools[11][7] = '<div class="calendar-cover"><strong id="live-calendar-month">MES</strong><span>1</span><span>2</span><span class="national">3</span><span>4</span><span class="barcelona">5</span><span class="overlap">6</span><span>7</span></div><i id="live-calendar-next">Próxima celebración</i>';
tools[8][4] = 'available';
tools[8][5] = '/preview-dates/';
tools[9][4] = 'available';
tools[9][5] = '/preview-convert/';
tools[7][4] = 'available';
tools[7][5] = '/preview-qr/';
tools[6][7] = '<small id="live-countdown-name">Próximo acontecimiento</small><b id="live-countdown-days">--</b><i id="live-countdown-unit">días</i>';
const orderedToolNames=['Reloj negro','Calendario','Cuenta atrás','Alarmas','Temporizador y cronómetro','Concentración · Pomodoro','Calculadora de fechas','Conversor universal','Relojes del mundo','Fases lunares','Mi IP','Generador QR','HTML a texto','Codificador de texto y URL','Generador de contraseñas','Identificadores y dígitos de control'];
const orderedTools=orderedToolNames.map(name=>tools.find(tool=>tool[2]===name)).filter(Boolean);
orderedTools.forEach((tool,index)=>tool[0]=`U${String(index+1).padStart(2,'0')}`);
tools.splice(0,tools.length,...orderedTools);
const preferredCategoryOrder = ['Tiempo','Cálculo','Texto y datos','Seguridad','Creación','Conexión','Productividad'];
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

const countdownDefaults=[['christmas','Navidad',11,25],['new-year','Año Nuevo',0,1],['kings','Reyes',0,6],['sant-jordi','Sant Jordi',3,23],['san-juan','San Juan',5,24],['all-saints','Todos los Santos',10,1]];
function nextAnnual(month,day,now=new Date()){let target=new Date(now.getFullYear(),month,day,0,0,0,0);if(target<=now)target.setFullYear(target.getFullYear()+1);return target.getTime();}
function lastSunday(year,month){const date=new Date(Date.UTC(year,month+1,0));return date.getUTCDate()-date.getUTCDay();}
function clockChanges(now=new Date()){const items=[];for(const year of [now.getFullYear(),now.getFullYear()+1])for(const [id,name,month] of [['clock-summer','Inicio del horario de verano',2],['clock-winter','Inicio del horario de invierno',9]]){const targetAt=Date.UTC(year,month,lastSunday(year,month),1);if(targetAt>now.getTime())items.push({id,name,targetAt});}return items;}
function upcomingCountdowns(){
  let state={personal:[],defaults:{}};try{state={...state,...JSON.parse(localStorage.getItem('odin-countdowns-v1'))};}catch{}
  const now=Date.now(), items=(state.personal||[]).filter(item=>item.enabled!==false&&item.targetAt>now).map(item=>({name:item.name,targetAt:item.targetAt}));
  for(const [id,name,month,day] of countdownDefaults)if(state.defaults?.[id]!==false)items.push({name,targetAt:nextAnnual(month,day)});
  for(const change of clockChanges())if(state.defaults?.[change.id]!==false&&state.defaults?.['clock-change']!==false)items.push(change);
  return items.sort((a,b)=>a.targetAt-b.targetAt);
}
function updateCountdownCover(){const name=document.querySelector('#live-countdown-name'),days=document.querySelector('#live-countdown-days'),unit=document.querySelector('#live-countdown-unit');if(!name||!days||!unit)return;const next=upcomingCountdowns()[0];if(!next){name.textContent='Sin acontecimientos';days.textContent='--';unit.textContent='días';return;}const remaining=next.targetAt-Date.now(),dayCount=Math.ceil(remaining/86400000);name.textContent=next.name;days.textContent=dayCount;unit.textContent=dayCount===1?'día':'días';}
updateCountdownCover();setInterval(updateCountdownCover,30000);window.addEventListener('odin:countdowns-updated',updateCountdownCover);

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
