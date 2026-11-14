interface ClockSettings { speed: number; size: number; color: string; alwaysVisible: boolean; }
const defaults: ClockSettings = { speed: 1, size: 42, color: '#ffffff', alwaysVisible: false };
const storageKey = 'odin:u01:sony-clock:v1';
let settings: ClockSettings = { ...defaults };
try { const saved = localStorage.getItem(storageKey); if (saved) settings = { ...defaults, ...JSON.parse(saved) }; } catch { /* sin persistencia */ }
const stage = document.querySelector<HTMLElement>('#clock-stage')!;
const clock = document.querySelector<HTMLElement>('#floating-clock')!;
const time = document.querySelector<HTMLTimeElement>('#clock-time')!;
const session = document.querySelector<HTMLElement>('#clock-session')!;
const speed = document.querySelector<HTMLInputElement>('#speed')!;
const size = document.querySelector<HTMLInputElement>('#size')!;
const color = document.querySelector<HTMLInputElement>('#color')!;
const alwaysVisible = document.querySelector<HTMLInputElement>('#always-visible')!;
const speedOutput = document.querySelector<HTMLOutputElement>('#speed-output')!;
const sizeOutput = document.querySelector<HTMLOutputElement>('#size-output')!;
const startedAt = Date.now();
let x = 80, y = 90, dx = .055, dy = .047, lastFrame = performance.now(), lastMinute = -1, hideTimer = 0;
function save(): void { try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* sin persistencia */ } }
function showClock(): void { clock.classList.add('visible'); window.clearTimeout(hideTimer); if (!settings.alwaysVisible) hideTimer = window.setTimeout(() => clock.classList.remove('visible'), 5000); }
function applySettings(): void {
  clock.style.setProperty('--clock-size', `${settings.size}px`); clock.style.color = settings.color;
  speed.value = String(settings.speed); size.value = String(settings.size); color.value = settings.color; alwaysVisible.checked = settings.alwaysVisible;
  speedOutput.value = `${settings.speed.toLocaleString('es-ES', { minimumFractionDigits: 1 })}×`; sizeOutput.value = `${settings.size} px`;
  if (settings.alwaysVisible) { window.clearTimeout(hideTimer); clock.classList.add('visible'); } else showClock();
}
function render(): void {
  const now = new Date(), minute = now.getMinutes();
  time.textContent = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now); time.dateTime = now.toISOString();
  const elapsed = Math.floor((Date.now() - startedAt) / 1000), hours = Math.floor(elapsed / 3600), minutes = Math.floor((elapsed % 3600) / 60), seconds = elapsed % 60;
  session.textContent = `${hours ? `${hours}:` : ''}${String(minutes).padStart(hours ? 2 : 1, '0')}:${String(seconds).padStart(2, '0')}`;
  if (minute !== lastMinute) { lastMinute = minute; showClock(); }
}
function animate(now: number): void {
  const elapsed = Math.min(now - lastFrame, 50); lastFrame = now; x += dx * settings.speed * elapsed; y += dy * settings.speed * elapsed;
  const maxX = Math.max(12, stage.clientWidth - clock.offsetWidth - 12), maxY = Math.max(12, stage.clientHeight - clock.offsetHeight - 12);
  if (x <= 12 || x >= maxX) { dx *= -1; x = Math.max(12, Math.min(x, maxX)); }
  if (y <= 12 || y >= maxY) { dy *= -1; y = Math.max(12, Math.min(y, maxY)); }
  clock.style.transform = `translate3d(${x}px, ${y}px, 0)`; requestAnimationFrame(animate);
}
function toggleFullscreen(): Promise<void> { return document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen(); }
stage.addEventListener('pointermove', showClock, { passive: true }); stage.addEventListener('pointerdown', showClock, { passive: true });
speed.addEventListener('input', () => { settings.speed = Number(speed.value); applySettings(); save(); });
size.addEventListener('input', () => { settings.size = Number(size.value); applySettings(); save(); });
color.addEventListener('input', () => { settings.color = color.value; applySettings(); save(); });
alwaysVisible.addEventListener('change', () => { settings.alwaysVisible = alwaysVisible.checked; applySettings(); save(); });
document.querySelector('#fullscreen')?.addEventListener('click', toggleFullscreen); document.querySelector('#stage-fullscreen')?.addEventListener('click', toggleFullscreen);
document.querySelector('#reset')?.addEventListener('click', () => { settings = { ...defaults }; save(); applySettings(); showClock(); });
applySettings(); render(); window.setInterval(render, 250); requestAnimationFrame(animate);
