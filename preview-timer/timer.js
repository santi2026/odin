const STORAGE_KEY = 'odin-timer-v1';
const defaults = { stopwatch:{ running:false, accumulated:0, startedAt:0, laps:[] }, timer:{ duration:1500000, remaining:1500000, running:false, endAt:0, completedAway:false }, settings:{ soundEnabled:true, soundChoice:'bell' } };
let state = loadState();
let lastTimerSecond = -1;

const $ = (selector) => document.querySelector(selector);
const stopwatchTab = $('#stopwatch-tab'), timerTab = $('#timer-tab');
const stopwatchPanel = $('#stopwatch-panel'), timerPanel = $('#timer-panel');
const stopwatchTime = $('#stopwatch-time'), stopwatchStatus = $('#stopwatch-status');
const stopwatchToggle = $('#stopwatch-toggle'), lapButton = $('#lap-button'), stopwatchReset = $('#stopwatch-reset');
const lapsList = $('#laps-list'), clearLaps = $('#clear-laps');
const timerTime = $('#timer-time'), timerStatus = $('#timer-status'), timerRing = $('#timer-ring');
const timerToggle = $('#timer-toggle'), timerReset = $('#timer-reset');
const hoursInput = $('#timer-hours'), minutesInput = $('#timer-minutes'), secondsInput = $('#timer-seconds');
const recoveryNote = $('#recovery-note'), recoveryText = $('#recovery-text');
const soundEnabled = $('#sound-enabled');
const soundChoice = $('#sound-choice'), previewSound = $('#preview-sound');

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaults);
    const next = { stopwatch:{...defaults.stopwatch,...saved.stopwatch}, timer:{...defaults.timer,...saved.timer}, settings:{...defaults.settings,...saved.settings} };
    if (next.timer.running && next.timer.endAt <= Date.now()) { next.timer.running = false; next.timer.remaining = 0; next.timer.completedAway = true; }
    return next;
  } catch { return structuredClone(defaults); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function stopwatchElapsed(now = Date.now()) { return state.stopwatch.accumulated + (state.stopwatch.running ? now - state.stopwatch.startedAt : 0); }
function timerRemaining(now = Date.now()) { return state.timer.running ? Math.max(0, state.timer.endAt - now) : state.timer.remaining; }
function two(value) { return String(value).padStart(2,'0'); }
function formatStopwatch(ms) { const total = Math.max(0,ms); const cs = Math.floor(total / 10) % 100; const seconds = Math.floor(total / 1000) % 60; const minutes = Math.floor(total / 60000) % 60; const hours = Math.floor(total / 3600000); return `${hours ? `${two(hours)}:` : ''}${two(minutes)}:${two(seconds)}<span>.${two(cs)}</span>`; }
function formatTimer(ms) { const total = Math.ceil(Math.max(0,ms) / 1000); const seconds = total % 60; const minutes = Math.floor(total / 60) % 60; const hours = Math.floor(total / 3600); return hours ? `${two(hours)}:${two(minutes)}:${two(seconds)}` : `${two(minutes)}:${two(seconds)}`; }
function durationLabel(ms) { const seconds = Math.round(ms/1000); if (seconds % 3600 === 0) return `${seconds/3600} ${seconds === 3600 ? 'hora' : 'horas'}`; if (seconds % 60 === 0) return `${seconds/60} minutos`; return `${Math.floor(seconds/60)} min ${seconds%60} s`; }
function setMode(mode) { const stopwatch = mode === 'stopwatch'; stopwatchPanel.hidden = !stopwatch; timerPanel.hidden = stopwatch; stopwatchTab.classList.toggle('active',stopwatch); timerTab.classList.toggle('active',!stopwatch); stopwatchTab.setAttribute('aria-selected',String(stopwatch)); timerTab.setAttribute('aria-selected',String(!stopwatch)); }

function renderLaps() {
  if (!state.stopwatch.laps.length) { lapsList.innerHTML = '<li class="empty-laps">Las vueltas aparecerán aquí.</li>'; clearLaps.hidden = true; return; }
  clearLaps.hidden = false;
  const reversed = [...state.stopwatch.laps].reverse();
  lapsList.innerHTML = reversed.map((lap,index) => { const number = state.stopwatch.laps.length-index; const previous = number > 1 ? state.stopwatch.laps[number-2] : 0; return `<li><span>Vuelta ${two(number)}</span><b>${formatStopwatch(lap-previous)}</b><small>${formatStopwatch(lap)}</small></li>`; }).join('');
}
function renderInputs() { const total = Math.round(state.timer.duration/1000); hoursInput.value = Math.floor(total/3600); minutesInput.value = Math.floor(total/60)%60; secondsInput.value = total%60; }
function render(now = Date.now()) {
  const elapsed = stopwatchElapsed(now); stopwatchTime.innerHTML = formatStopwatch(elapsed); stopwatchToggle.textContent = state.stopwatch.running ? 'Pausar' : elapsed ? 'Continuar' : 'Iniciar'; stopwatchStatus.textContent = state.stopwatch.running ? 'En marcha' : elapsed ? 'En pausa' : 'Preparado'; lapButton.disabled = !state.stopwatch.running; stopwatchReset.disabled = !elapsed;
  const remaining = timerRemaining(now); timerTime.textContent = formatTimer(remaining); timerToggle.textContent = state.timer.running ? 'Pausar' : remaining && remaining < state.timer.duration ? 'Continuar' : 'Iniciar'; timerToggle.disabled = remaining <= 0; timerStatus.textContent = remaining <= 0 ? 'Tiempo cumplido' : state.timer.running ? 'En marcha' : durationLabel(remaining); const progress = state.timer.duration ? remaining/state.timer.duration*100 : 0; timerRing.style.setProperty('--progress',`${progress}%`); timerRing.classList.toggle('is-running',state.timer.running); timerRing.classList.toggle('is-finished',remaining<=0);
  const currentSecond = Math.ceil(remaining/1000); if (state.timer.running && remaining <= 0) finishTimer(); else if (currentSecond !== lastTimerSecond) { lastTimerSecond = currentSecond; document.title = state.timer.running ? `${formatTimer(remaining)} · ODÍN` : 'Temporizador y cronómetro · ODÍN'; }
}
function finishTimer() { state.timer.running=false; state.timer.remaining=0; saveState(); if (state.settings.soundEnabled) playSound(state.settings.soundChoice); document.title='Tiempo cumplido · ODÍN'; render(); }
function playTone(ctx, frequency, start, duration, volume=.28, type='sine') {
  const gain=ctx.createGain(), osc=ctx.createOscillator(); osc.type=type; osc.frequency.setValueAtTime(frequency,start); gain.gain.setValueAtTime(.001,start); gain.gain.exponentialRampToValueAtTime(volume,start+.025); gain.gain.exponentialRampToValueAtTime(.001,start+duration); osc.connect(gain).connect(ctx.destination); osc.start(start); osc.stop(start+duration+.02);
}
function playSound(choice='bell') {
  try {
    const ctx=new AudioContext(), now=ctx.currentTime+.03;
    if(choice==='digital') { [0,.22,.44,.82,1.04,1.26].forEach((delay,index)=>playTone(ctx,index<3?880:1040,now+delay,.16,.24,'square')); }
    else if(choice==='triple') { [0,.5,1].forEach(delay=>{ playTone(ctx,660,now+delay,.32,.3); playTone(ctx,990,now+delay+.07,.28,.22); }); }
    else if(choice==='gentle') { playTone(ctx,523.25,now,.8,.17); playTone(ctx,659.25,now+.15,.9,.14); playTone(ctx,783.99,now+.3,1,.12); }
    else { playTone(ctx,784,now,.9,.32); playTone(ctx,1175,now+.08,1.15,.24); playTone(ctx,1568,now+.16,1.3,.16); }
    setTimeout(()=>ctx.close(),2600);
  } catch {}
}

stopwatchTab.addEventListener('click',()=>setMode('stopwatch')); timerTab.addEventListener('click',()=>setMode('timer'));
stopwatchToggle.addEventListener('click',()=>{ if(state.stopwatch.running){ state.stopwatch.accumulated=stopwatchElapsed(); state.stopwatch.running=false; } else { state.stopwatch.startedAt=Date.now(); state.stopwatch.running=true; } saveState(); render(); });
lapButton.addEventListener('click',()=>{ state.stopwatch.laps.push(stopwatchElapsed()); saveState(); renderLaps(); });
stopwatchReset.addEventListener('click',()=>{ state.stopwatch={...defaults.stopwatch,laps:[]}; saveState(); renderLaps(); render(); });
clearLaps.addEventListener('click',()=>{ state.stopwatch.laps=[]; saveState(); renderLaps(); });
timerToggle.addEventListener('click',()=>{ if(state.timer.running){ state.timer.remaining=timerRemaining(); state.timer.running=false; } else if(state.timer.remaining>0){ state.timer.endAt=Date.now()+state.timer.remaining; state.timer.running=true; state.timer.completedAway=false; } saveState(); render(); });
timerReset.addEventListener('click',()=>{ state.timer.running=false; state.timer.remaining=state.timer.duration; state.timer.endAt=0; state.timer.completedAway=false; saveState(); render(); });
function applyInputs(){ if(state.timer.running)return; const seconds=Math.min(359999,Math.max(1,(+hoursInput.value||0)*3600+(+minutesInput.value||0)*60+(+secondsInput.value||0))); state.timer.duration=seconds*1000; state.timer.remaining=state.timer.duration; state.timer.completedAway=false; saveState(); renderInputs(); render(); }
[hoursInput,minutesInput,secondsInput].forEach(input=>input.addEventListener('change',applyInputs));
document.querySelectorAll('[data-minutes]').forEach(button=>button.addEventListener('click',()=>{ if(state.timer.running)return; state.timer.duration=+button.dataset.minutes*60000; state.timer.remaining=state.timer.duration; state.timer.completedAway=false; saveState(); renderInputs(); render(); }));
$('#dismiss-recovery').addEventListener('click',()=>{ recoveryNote.hidden=true; state.timer.completedAway=false; saveState(); });
soundEnabled.checked = state.settings.soundEnabled;
soundEnabled.addEventListener('change',()=>{ state.settings.soundEnabled=soundEnabled.checked; saveState(); });
soundChoice.value = state.settings.soundChoice;
soundChoice.addEventListener('change',()=>{ state.settings.soundChoice=soundChoice.value; saveState(); });
previewSound.addEventListener('click',()=>playSound(soundChoice.value));

if (state.timer.completedAway) { recoveryText.textContent='El temporizador terminó mientras no estabas.'; recoveryNote.hidden=false; }
else if (state.stopwatch.running || state.timer.running) { recoveryText.textContent='Hemos recuperado la sesión que estaba en marcha.'; recoveryNote.hidden=false; }
renderInputs(); renderLaps(); render(); setInterval(()=>render(),33);
