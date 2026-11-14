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
tools[6][7] = '<small id="live-countdown-name">Próximo acontecimiento</small><b id="live-countdown-days">--</b><i id="live-countdown-unit">días</i>';
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
for (const chip of chips) chip.addEventListener('click', () => { activeFilter = chip.dataset.filter; for (const item of chips) item.classList.toggle('active', item === chip); updateCards(); });

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
