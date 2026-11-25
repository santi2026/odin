const defaults = { speed: 1, size: 42, color: '#ffffff', alwaysVisible: false, design: 'black', analogStyle:'classic', digitalStyle:'simple', showDate: true, modernSize:'large', modernColor:'#ffffff', background:'solid', backgroundColor:'#000000' };
const storageKey = 'odin:u01:sony-clock:v1';
let settings = { ...defaults };
try { const saved = localStorage.getItem(storageKey); if (saved) settings = { ...defaults, ...JSON.parse(saved) }; } catch {}
const stage = document.querySelector('#clock-stage'), clock = document.querySelector('#floating-clock'), time = document.querySelector('#clock-time'), session = document.querySelector('#clock-session');
const speed = document.querySelector('#speed'), size = document.querySelector('#size'), color = document.querySelector('#color'), alwaysVisible = document.querySelector('#always-visible');
const speedOutput = document.querySelector('#speed-output'), sizeOutput = document.querySelector('#size-output');
const startedAt = Date.now(); let x = 80, y = 90, dx = .055, dy = .047, lastFrame = performance.now(), lastMinute = -1, hideTimer = 0;
const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch {} };
function showClock() { clock.classList.add('visible'); clearTimeout(hideTimer); if (!settings.alwaysVisible) hideTimer = setTimeout(() => clock.classList.remove('visible'), 5000); }
function applySettings() { clock.style.setProperty('--clock-size', `${settings.size}px`); clock.style.color = settings.color; speed.value = settings.speed; size.value = settings.size; color.value = settings.color; alwaysVisible.checked = settings.alwaysVisible; speedOutput.value = `${settings.speed.toLocaleString('es-ES', { minimumFractionDigits: 1 })}×`; sizeOutput.value = `${settings.size} px`; if (settings.alwaysVisible) { clearTimeout(hideTimer); clock.classList.add('visible'); } else showClock(); }
function render() { const now = new Date(), minute = now.getMinutes(); time.textContent = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now); time.dateTime = now.toISOString(); const elapsed = Math.floor((Date.now() - startedAt) / 1000), hours = Math.floor(elapsed / 3600), minutes = Math.floor((elapsed % 3600) / 60), seconds = elapsed % 60; session.textContent = `${hours ? `${hours}:` : ''}${String(minutes).padStart(hours ? 2 : 1, '0')}:${String(seconds).padStart(2, '0')}`; if (minute !== lastMinute) { lastMinute = minute; showClock(); } }
function animate(now) { const elapsed = Math.min(now - lastFrame, 50); lastFrame = now; x += dx * settings.speed * elapsed; y += dy * settings.speed * elapsed; const maxX = Math.max(12, stage.clientWidth - clock.offsetWidth - 12), maxY = Math.max(12, stage.clientHeight - clock.offsetHeight - 12); if (x <= 12 || x >= maxX) { dx *= -1; x = Math.max(12, Math.min(x, maxX)); } if (y <= 12 || y >= maxY) { dy *= -1; y = Math.max(12, Math.min(y, maxY)); } clock.style.transform = `translate3d(${x}px, ${y}px, 0)`; requestAnimationFrame(animate); }
const toggleFullscreen = () => document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen();
stage.addEventListener('pointermove', showClock, { passive: true }); stage.addEventListener('pointerdown', showClock, { passive: true });
speed.addEventListener('input', () => { settings.speed = Number(speed.value); applySettings(); save(); }); size.addEventListener('input', () => { settings.size = Number(size.value); applySettings(); save(); }); color.addEventListener('input', () => { settings.color = color.value; applySettings(); save(); }); alwaysVisible.addEventListener('change', () => { settings.alwaysVisible = alwaysVisible.checked; applySettings(); save(); });
document.querySelector('#fullscreen').addEventListener('click', toggleFullscreen); document.querySelector('#stage-fullscreen')?.addEventListener('click', toggleFullscreen); document.querySelector('#reset').addEventListener('click', () => { if (settings.design === 'black') Object.assign(settings, {speed:defaults.speed,size:defaults.size,color:defaults.color,alwaysVisible:defaults.alwaysVisible}); else Object.assign(settings, {modernSize:defaults.modernSize,modernColor:defaults.modernColor,background:defaults.background,backgroundColor:defaults.backgroundColor,showDate:defaults.showDate}); save(); applySettings(); showClock(); });
const standard = document.querySelector('#clock-standard'), digital = document.querySelector('#clock-digital'), analog = document.querySelector('#clock-analog'), dateDisplay = document.querySelector('#clock-date'), showDate = document.querySelector('#clock-show-date'), designButtons = document.querySelectorAll('[data-clock-design]');
const flip = document.querySelector('#clock-flip'), modernSize = document.querySelector('#clock-modern-size'), modernColor = document.querySelector('#clock-modern-color'), background = document.querySelector('#clock-background'), backgroundColor = document.querySelector('#clock-background-color');
const analogMenu = document.querySelector('.analog-menu:not(.digital-menu)'), analogChoices = document.querySelectorAll('[data-analog-style]'), digitalMenu = document.querySelector('.digital-menu'), digitalChoices = document.querySelectorAll('[data-digital-style]');
let previousFlip = '';
function renderDesign() {
  if (!standard) return;
  if (!['digital','analog','black','flip'].includes(settings.design)) settings.design = 'black';
  const isBlack = settings.design === 'black', isAnalog = settings.design === 'analog', isFlip = settings.design === 'flip';
  standard.hidden = isBlack; stage.classList.toggle('clock-modern', !isBlack); digital.hidden = isAnalog || isFlip; analog.hidden = !isAnalog; flip.hidden = !isFlip;
  if (!['classic','minimal','modern'].includes(settings.analogStyle)) settings.analogStyle = 'classic';
  analog.dataset.style = settings.analogStyle; analogMenu.classList.toggle('selected', isAnalog);
  analogChoices.forEach(button => button.setAttribute('aria-pressed', String(isAnalog && button.dataset.analogStyle === settings.analogStyle)));
  if (!['simple','led','elegant'].includes(settings.digitalStyle)) settings.digitalStyle = 'simple';
  digital.dataset.style = settings.digitalStyle; digitalMenu.classList.toggle('selected', settings.design === 'digital');
  digitalChoices.forEach(button => button.setAttribute('aria-pressed', String(settings.design === 'digital' && button.dataset.digitalStyle === settings.digitalStyle)));
  modernSize.value = settings.modernSize || 'large'; modernColor.value = settings.modernColor || '#ffffff'; background.value = settings.background || 'solid'; backgroundColor.value = settings.backgroundColor || '#000000';
  standard.dataset.size = modernSize.value; stage.dataset.background = isBlack ? 'solid' : background.value; stage.style.setProperty('--clock-background', isBlack ? '#000000' : backgroundColor.value); standard.style.setProperty('--clock-foreground', modernColor.value);
  showDate.checked = settings.showDate !== false; dateDisplay.hidden = !showDate.checked;
  designButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.clockDesign === settings.design)));
}
function renderModernClock() {
  if (!standard) return;
  const now = new Date(); digital.textContent = new Intl.DateTimeFormat('es-ES', {hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(now);
  const digits = [now.getHours(), now.getMinutes(), now.getSeconds()].map(value => String(value).padStart(2, '0')).join('');
  if (digits !== previousFlip) {
    if (!previousFlip) flip.innerHTML = Array.from({length:6}, (_, i) => `${i === 2 || i === 4 ? '<span class="flip-separator" aria-hidden="true">:</span>' : ''}<span class="flip-digit" aria-hidden="true"><span class="flip-value"></span><span class="flip-old-bottom"><span></span></span><span class="flip-top"><span></span></span><span class="flip-bottom"><span></span></span></span>`).join('');
    flip.setAttribute('aria-label', `Hora ${digits.slice(0,2)}:${digits.slice(2,4)}:${digits.slice(4,6)}`);
    flip.querySelectorAll('.flip-digit').forEach((tile, i) => {
      const value = tile.querySelector('.flip-value');
      if (previousFlip && previousFlip[i] !== digits[i]) {
        tile.querySelector('.flip-old-bottom span').textContent = previousFlip[i];
        tile.querySelector('.flip-top span').textContent = previousFlip[i];
        tile.querySelector('.flip-bottom span').textContent = digits[i];
        tile.classList.remove('turn'); void tile.offsetWidth; tile.classList.add('turn');
      }
      value.textContent = digits[i];
    }); previousFlip = digits;
  }
  dateDisplay.textContent = new Intl.DateTimeFormat('es-ES', {weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now);
  analog.querySelector('.hour').style.transform = `translateX(-50%) rotate(${(now.getHours()%12)*30+now.getMinutes()/2}deg)`;
  analog.querySelector('.minute').style.transform = `translateX(-50%) rotate(${now.getMinutes()*6+now.getSeconds()/10}deg)`;
  analog.querySelector('.second').style.transform = `translateX(-50%) rotate(${now.getSeconds()*6}deg)`;
}
designButtons.forEach(button => button.addEventListener('click', () => { settings.design = button.dataset.clockDesign; save(); renderDesign(); }));
analogChoices.forEach(button => button.addEventListener('click', () => { settings.design = 'analog'; settings.analogStyle = button.dataset.analogStyle; analogMenu.open = false; save(); renderDesign(); }));
digitalChoices.forEach(button => button.addEventListener('click', () => { settings.design = 'digital'; settings.digitalStyle = button.dataset.digitalStyle; digitalMenu.open = false; save(); renderDesign(); }));
showDate?.addEventListener('change', () => { settings.showDate = showDate.checked; save(); renderDesign(); });
[modernSize,modernColor,background,backgroundColor].forEach((input, index) => input?.addEventListener('input', () => { settings[['modernSize','modernColor','background','backgroundColor'][index]] = input.value; save(); renderDesign(); }));
function changeBackground(direction) {
  if (!background || document.fullscreenElement !== stage || settings.design === 'black') return;
  const options = Array.from(background.options, option => option.value), current = options.indexOf(settings.background);
  settings.background = options[(current + direction + options.length) % options.length];
  save(); renderDesign();
}
document.addEventListener('keydown', event => {
  if (document.fullscreenElement !== stage || settings.design === 'black' || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
  event.preventDefault(); changeBackground(event.key === 'ArrowRight' ? 1 : -1);
});
stage.querySelector('.clock-background-nav.previous')?.addEventListener('click', () => changeBackground(-1));
stage.querySelector('.clock-background-nav.next')?.addEventListener('click', () => changeBackground(1));
document.querySelector('#reset')?.addEventListener('click', renderDesign);
applySettings(); render(); renderDesign(); renderModernClock(); setInterval(() => { render(); renderModernClock(); }, 250); requestAnimationFrame(animate);
