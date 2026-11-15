import {nextOccurrence,readCountdownState,writeCountdownState} from '/countdown-data.js?v=2';
import {dueGeneralEvents,isGeneralEventEnabled} from '/countdown-general.js?v=1';

const ODIN_TIMER_KEY = 'odin-timer-v1';
const ODIN_ALARMS_KEY = 'odin-alarms-v1';
const ODIN_FOCUS_KEY = 'odin-focus-v1';
const ODIN_COUNTDOWNS_KEY = 'odin-countdowns-v1';
let audioContext = null;
let handledEndAt = 0;
const handledAlarms = new Set();
let handledFocusEndAt = 0;
const handledCountdowns = new Set();

function readTimerState() {
  try { return JSON.parse(localStorage.getItem(ODIN_TIMER_KEY)); }
  catch { return null; }
}
function writeTimerState(state) { localStorage.setItem(ODIN_TIMER_KEY, JSON.stringify(state)); }
function getAudioContext() {
  try {
    audioContext ||= new AudioContext();
    if (audioContext.state === 'suspended') audioContext.resume();
    return audioContext;
  } catch { return null; }
}
function tone(ctx, frequency, start, duration, volume=.28, type='sine') {
  const gain=ctx.createGain(), osc=ctx.createOscillator(); osc.type=type; osc.frequency.setValueAtTime(frequency,start); gain.gain.setValueAtTime(.001,start); gain.gain.exponentialRampToValueAtTime(volume,start+.025); gain.gain.exponentialRampToValueAtTime(.001,start+duration); osc.connect(gain).connect(ctx.destination); osc.start(start); osc.stop(start+duration+.02);
}
function playGlobalSound(choice='bell') {
  const ctx=getAudioContext(); if(!ctx)return false; const now=ctx.currentTime+.03;
  if(choice==='digital') [0,.22,.44,.82,1.04,1.26].forEach((delay,index)=>tone(ctx,index<3?880:1040,now+delay,.16,.24,'square'));
  else if(choice==='triple') [0,.5,1].forEach(delay=>{ tone(ctx,660,now+delay,.32,.3); tone(ctx,990,now+delay+.07,.28,.22); });
  else if(choice==='gentle') { tone(ctx,523.25,now,.8,.17); tone(ctx,659.25,now+.15,.9,.14); tone(ctx,783.99,now+.3,1,.12); }
  else { tone(ctx,784,now,.9,.32); tone(ctx,1175,now+.08,1.15,.24); tone(ctx,1568,now+.16,1.3,.16); }
  return true;
}
function nextAlarmOccurrence(alarm,from=Date.now()) {
  const [hour,minute]=(alarm.time||'00:00').split(':').map(Number), start=new Date(from);
  for(let add=0;add<8;add++){ const candidate=new Date(start); candidate.setDate(start.getDate()+add); candidate.setHours(hour,minute,0,0); if(candidate.getTime()<=from)continue; if(!alarm.days?.length || alarm.days.includes(candidate.getDay()))return candidate.getTime(); }
  return 0;
}
function showGlobalNotice({ badge='!', title, message, href }) {
  document.querySelector('.global-timer-notice')?.remove();
  const notice=document.createElement('div'); notice.className='global-timer-notice'; notice.setAttribute('role','alert'); notice.tabIndex=0; notice.dataset.href=href; notice.innerHTML=`<span>${badge}</span><div><b>${title}</b><small>${message}</small></div><button type="button" aria-label="Cerrar aviso">×</button>`;
  const open=()=>{ if(href) location.href=href; }; notice.addEventListener('click',event=>{ if(!event.target.closest('button'))open(); }); notice.addEventListener('keydown',event=>{ if(event.key==='Enter'||event.key===' '){ event.preventDefault(); open(); } }); notice.querySelector('button').addEventListener('click',event=>{ event.stopPropagation(); notice.remove(); }); document.body.append(notice);
  setTimeout(()=>notice.remove(),15000);
}
function checkGlobalTimer() {
  if (location.pathname.includes('/preview-timer/')) return;
  const state=readTimerState(), timer=state?.timer; if(!timer?.running || !timer.endAt || timer.endAt>Date.now() || handledEndAt===timer.endAt)return;
  handledEndAt=timer.endAt; timer.running=false; timer.remaining=0; timer.completedAway=true; state.timer=timer; writeTimerState(state); showGlobalNotice({badge:'00:00',title:'Temporizador finalizado',message:'Pulsa para abrir el temporizador.',href:'/preview-timer/'});
  if(state.settings?.soundEnabled!==false) playGlobalSound(state.settings?.soundChoice || 'bell');
  document.title=`Tiempo cumplido · ${document.title.replace(/^Tiempo cumplido · /,'')}`;
}
function checkGlobalAlarms() {
  try {
    const state=JSON.parse(localStorage.getItem(ODIN_ALARMS_KEY));
    for(const alarm of state?.alarms || []) {
      if(!alarm.enabled || !alarm.nextAt || alarm.nextAt>Date.now())continue;
      const occurrence=`${alarm.id}:${alarm.nextAt}`; if(handledAlarms.has(occurrence) || alarm.notifiedAt===alarm.nextAt)continue;
      handledAlarms.add(occurrence); alarm.notifiedAt=alarm.nextAt;
      showGlobalNotice({badge:alarm.time || 'Alarma',title:alarm.label || 'Alarma',message:'Pulsa para abrir y gestionar la alarma.',href:'/preview-alarms/'});
      if(alarm.soundEnabled!==false)playGlobalSound(alarm.soundChoice || 'digital');
      if(alarm.days?.length)alarm.nextAt=nextAlarmOccurrence(alarm,Date.now()+1000); else alarm.enabled=false;
      localStorage.setItem(ODIN_ALARMS_KEY,JSON.stringify(state));
      window.dispatchEvent(new Event('odin:alarms-updated'));
    }
  } catch {}
}
function focusDuration(state,phase){const minutes=phase==='focus'?state.settings.focusMinutes:phase==='short'?state.settings.shortMinutes:state.settings.longMinutes;return minutes*60000;}
function advanceFocus(state,{notify=true,completed=true}={}){
  const previous=state.session.phase, endedSession=state.session.sessionIndex;
  if(previous==='focus'&&completed){state.history=Array.isArray(state.history)?state.history:[];state.history.push(Date.now());state.history=state.history.slice(-500);}
  if(previous==='focus')state.session.phase=endedSession>=state.settings.sessions?'long':'short';
  else {state.session.phase='focus';state.session.sessionIndex=previous==='long'?1:Math.min(state.settings.sessions,endedSession+1);}
  state.session.duration=focusDuration(state,state.session.phase);state.session.remaining=state.session.duration;state.session.running=Boolean(state.settings.autoStart);state.session.endAt=state.session.running?Date.now()+state.session.duration:0;
  localStorage.setItem(ODIN_FOCUS_KEY,JSON.stringify(state));window.dispatchEvent(new Event('odin:focus-updated'));
  if(notify){const finished=previous==='focus'?'Concentración terminada':'Descanso terminado';showGlobalNotice({badge:previous==='focus'?'✓':'☕',title:finished,message:`Siguiente: ${state.session.phase==='focus'?'concentración':state.session.phase==='short'?'descanso corto':'descanso largo'}. Pulsa para abrir.`,href:'/preview-focus/'});if(state.settings.soundEnabled!==false)playGlobalSound(state.settings.soundChoice||'bell');}
}
function checkGlobalFocus(){
  try{const state=JSON.parse(localStorage.getItem(ODIN_FOCUS_KEY)),session=state?.session;if(!session?.running||!session.endAt||session.endAt>Date.now()||handledFocusEndAt===session.endAt)return;handledFocusEndAt=session.endAt;advanceFocus(state);}
  catch{}
}
function dueDefaultEvents(state,now=new Date()){
  return dueGeneralEvents(now).filter(item=>isGeneralEventEnabled(state,item.id)).map(item=>({...item,id:`general:${item.id}`}));
}
function checkGlobalCountdowns(){
  try{
    const state=readCountdownState(),today=new Date().setHours(0,0,0,0);
    const due=[...state.personal.filter(item=>item.enabled!==false).map(item=>({item,occurrence:nextOccurrence(item)})).filter(({occurrence})=>occurrence&&occurrence.targetAt<=Date.now()&&occurrence.targetAt>=today).map(({item,occurrence})=>({id:item.id,name:item.name,targetAt:occurrence.targetAt,item})),...dueDefaultEvents(state)];
    let changed=false;
    for(const event of due){const key=`${event.id}:${event.targetAt}`,notified=event.item?event.item.notifiedOccurrence===String(event.targetAt):state.notifiedDefaults?.[event.id]===event.targetAt;if(notified||handledCountdowns.has(key))continue;handledCountdowns.add(key);if(event.item)event.item.notifiedOccurrence=String(event.targetAt);else{state.notifiedDefaults ||= {};state.notifiedDefaults[event.id]=event.targetAt;}changed=true;showGlobalNotice({badge:'HOY',title:event.name,message:'La cuenta atrás ha llegado a su fecha. Pulsa para abrirla.',href:'/preview-countdown/'});if(state.settings?.soundEnabled!==false)playGlobalSound(state.settings?.soundChoice||'bell');}
    if(changed){writeCountdownState(state);window.dispatchEvent(new Event('odin:countdowns-updated'));}
  }catch{}
}

window.addEventListener('odin:alert',event=>showGlobalNotice(event.detail || {}));
window.addEventListener('odin:preview-sound',event=>playGlobalSound(event.detail?.choice || 'bell'));
window.addEventListener('odin:focus-skip',()=>{try{const state=JSON.parse(localStorage.getItem(ODIN_FOCUS_KEY));if(state)advanceFocus(state,{notify:false,completed:false});}catch{}});

for (const event of ['pointerdown','keydown']) document.addEventListener(event,()=>getAudioContext(),{once:true,capture:true});
checkGlobalTimer(); checkGlobalAlarms(); checkGlobalFocus(); checkGlobalCountdowns(); setInterval(()=>{ checkGlobalTimer(); checkGlobalAlarms(); checkGlobalFocus(); checkGlobalCountdowns(); },250);
