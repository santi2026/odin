const STORAGE_KEY='odin-alarms-v1';
const MAX_ALARMS=10;
const dayNames=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const shortDays=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const $=selector=>document.querySelector(selector);
const form=$('#alarm-form'), timeInput=$('#alarm-time'), labelInput=$('#alarm-label'), soundSelect=$('#alarm-sound'), soundEnabled=$('#alarm-sound-enabled');
const list=$('#alarms-list'), activeCount=$('#active-count'), alarmCount=$('#alarm-count'), nextSummary=$('#next-summary'), editorTitle=$('#editor-title'), cancelEdit=$('#cancel-edit'), saveButton=$('#save-alarm');
const limitMessage=$('#alarm-limit');
const dayInputs=[...document.querySelectorAll('.day-picker input')];
let state=loadState(), editingId=null, lastSnapshot='';

function loadState(){ try { const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)); return {alarms:Array.isArray(saved?.alarms)?saved.alarms:[]}; } catch { return {alarms:[]}; } }
function saveState(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); lastSnapshot=JSON.stringify(state); window.dispatchEvent(new Event('odin:alarms-updated')); }
function nextOccurrence(time,days,from=Date.now()){
  const [hour,minute]=time.split(':').map(Number), start=new Date(from);
  for(let add=0;add<8;add++){ const candidate=new Date(start); candidate.setDate(start.getDate()+add); candidate.setHours(hour,minute,0,0); if(candidate.getTime()<=from)continue; if(!days.length || days.includes(candidate.getDay()))return candidate.getTime(); }
  return 0;
}
function recurrenceLabel(alarm){ if(!alarm.days.length)return 'Una vez'; if(alarm.days.length===7)return 'Todos los días'; if(alarm.days.join(',')==='1,2,3,4,5')return 'De lunes a viernes'; return alarm.days.map(day=>shortDays[day]).join(' · '); }
function nextLabel(timestamp){ if(!timestamp)return 'Sin próxima ejecución'; const date=new Date(timestamp), now=new Date(); const tomorrow=new Date(now); tomorrow.setDate(now.getDate()+1); const prefix=date.toDateString()===now.toDateString()?'Hoy':date.toDateString()===tomorrow.toDateString()?'Mañana':dayNames[date.getDay()]; return `${prefix}, ${date.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}`; }
function escapeHtml(value=''){ const node=document.createElement('div'); node.textContent=value; return node.innerHTML; }
function render(){
  const sorted=[...state.alarms].sort((a,b)=>(b.enabled-a.enabled)||(a.nextAt||Infinity)-(b.nextAt||Infinity));
  const active=sorted.filter(alarm=>alarm.enabled); activeCount.textContent=`${sorted.length} de ${MAX_ALARMS}`; alarmCount.textContent=`${sorted.length} de ${MAX_ALARMS}`; const next=active.sort((a,b)=>a.nextAt-b.nextAt)[0]; nextSummary.textContent=next?`${active.length} activas · Próxima: ${nextLabel(next.nextAt)}`:'Ninguna activa'; const atLimit=state.alarms.length>=MAX_ALARMS&&!editingId; saveButton.disabled=atLimit; limitMessage.hidden=!atLimit;
  if(!sorted.length){ list.innerHTML='<div class="empty-alarms"><span>◷</span><h3>Aún no hay alarmas</h3><p>Configura la primera desde el panel.</p></div>'; return; }
  list.innerHTML=sorted.map(alarm=>`<article class="alarm-item ${alarm.enabled?'is-enabled':''}" data-id="${alarm.id}"><div class="alarm-main"><time>${alarm.time}</time><div><h3>${escapeHtml(alarm.label||'Alarma')}</h3><p>${recurrenceLabel(alarm)}</p></div></div><div class="alarm-next"><span>${alarm.enabled?nextLabel(alarm.nextAt):'Desactivada'}</span><small>${alarm.soundEnabled===false?'Sin sonido':soundName(alarm.soundChoice)}</small></div><div class="alarm-controls"><label class="mini-switch" title="${alarm.enabled?'Desactivar':'Activar'}"><input type="checkbox" data-action="toggle" ${alarm.enabled?'checked':''}/><i></i></label><button type="button" data-action="edit">Editar</button><button type="button" data-action="delete" aria-label="Eliminar ${escapeHtml(alarm.label||'alarma')}">Eliminar</button></div></article>`).join('');
}
function soundName(value){ return {bell:'Campana clara',digital:'Alarma digital',triple:'Tres avisos',gentle:'Aviso suave'}[value]||'Campana clara'; }
function defaultTime(){ const date=new Date(Date.now()+3600000); date.setMinutes(Math.ceil(date.getMinutes()/5)*5,0,0); return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`; }
function resetForm(){ editingId=null; form.reset(); timeInput.value=defaultTime(); soundSelect.value='bell'; soundEnabled.checked=true; dayInputs.forEach(input=>input.checked=false); editorTitle.textContent='Configurar aviso'; saveButton.textContent='Guardar alarma'; cancelEdit.hidden=true; render(); }
function editAlarm(alarm){ editingId=alarm.id; timeInput.value=alarm.time; labelInput.value=alarm.label; soundSelect.value=alarm.soundChoice||'bell'; soundEnabled.checked=alarm.soundEnabled!==false; dayInputs.forEach(input=>input.checked=alarm.days.includes(+input.value)); editorTitle.textContent='Editar alarma'; saveButton.textContent='Guardar cambios'; cancelEdit.hidden=false; saveButton.disabled=false; limitMessage.hidden=true; form.scrollIntoView({behavior:'smooth',block:'start'}); }
form.addEventListener('submit',event=>{ event.preventDefault(); if(!editingId&&state.alarms.length>=MAX_ALARMS){ render(); return; } const days=dayInputs.filter(input=>input.checked).map(input=>+input.value).sort((a,b)=>a-b); const existing=state.alarms.find(alarm=>alarm.id===editingId); const alarm={id:editingId||crypto.randomUUID(),time:timeInput.value,label:labelInput.value.trim()||'Alarma',days,soundChoice:soundSelect.value,soundEnabled:soundEnabled.checked,enabled:existing?.enabled??true,notifiedAt:0}; alarm.nextAt=nextOccurrence(alarm.time,alarm.days); if(existing)Object.assign(existing,alarm); else state.alarms.push(alarm); saveState(); resetForm(); });
list.addEventListener('click',event=>{ const item=event.target.closest('.alarm-item'); if(!item)return; const alarm=state.alarms.find(entry=>entry.id===item.dataset.id); const action=event.target.closest('[data-action]')?.dataset.action; if(action==='edit')editAlarm(alarm); if(action==='delete'){ state.alarms=state.alarms.filter(entry=>entry.id!==alarm.id); saveState(); if(editingId===alarm.id)resetForm(); render(); } });
list.addEventListener('change',event=>{ if(event.target.dataset.action!=='toggle')return; const alarm=state.alarms.find(entry=>entry.id===event.target.closest('.alarm-item').dataset.id); alarm.enabled=event.target.checked; alarm.notifiedAt=0; alarm.nextAt=alarm.enabled?nextOccurrence(alarm.time,alarm.days):0; saveState(); render(); });
cancelEdit.addEventListener('click',resetForm);
$('#test-alarm-sound').addEventListener('click',()=>window.dispatchEvent(new CustomEvent('odin:preview-sound',{detail:{choice:soundSelect.value}})));
window.addEventListener('odin:alarms-updated',()=>{ state=loadState(); render(); });
setInterval(()=>{ const snapshot=localStorage.getItem(STORAGE_KEY)||''; if(snapshot!==lastSnapshot){ state=loadState(); lastSnapshot=snapshot; render(); } },1000);
resetForm(); lastSnapshot=JSON.stringify(state); render();
