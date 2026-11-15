const $ = selector => document.querySelector(selector);
const modeButtons = [...document.querySelectorAll('[data-qr-mode]')];
const panels = [...document.querySelectorAll('[data-qr-panel]')];
const fileInput = $('#qr-reader-file');
const drop = $('#qr-reader-drop');
const canvas = $('#qr-reader-canvas');
const context = canvas.getContext('2d', { willReadFrequently: true });
const video = $('#qr-reader-video');
const placeholder = $('#qr-reader-placeholder');
const status = $('#qr-reader-status');
let stream = null;
let scanFrame = 0;
let lastOpenTarget = '';

function setStatus(message, kind = '') { status.textContent = message; status.className = `qr-reader-status ${kind}`; }
function setMode(mode) {
  modeButtons.forEach(button => button.setAttribute('aria-selected', String(button.dataset.qrMode === mode)));
  panels.forEach(panel => { panel.hidden = panel.dataset.qrPanel !== mode; });
  if (mode !== 'read') stopCamera();
}

function classifyContent(value) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return { kind: 'Enlace web', action: trimmed, details: [['Destino', new URL(trimmed).hostname]] };
  if (/^WIFI:/i.test(trimmed)) {
    const read = key => (trimmed.match(new RegExp(`(?:^|;)${key}:((?:\\\\.|[^;])*)`, 'i')) || [,''])[1].replace(/\\([\\;,:])/g, '$1');
    return { kind: 'Red Wi-Fi', details: [['Red', read('S') || 'Sin nombre'], ['Seguridad', read('T') || 'No indicada'], ['Contraseña', read('P') ? 'Incluida' : 'No incluida']] };
  }
  if (/^BEGIN:VCARD/i.test(trimmed) || /^MECARD:/i.test(trimmed)) return { kind: 'Contacto', details: [['Formato', /^BEGIN:VCARD/i.test(trimmed) ? 'vCard' : 'MeCard']] };
  if (/^BEGIN:VEVENT/i.test(trimmed)) return { kind: 'Evento', details: [['Formato', 'iCalendar']] };
  if (/^mailto:/i.test(trimmed)) return { kind: 'Correo electrónico', action: trimmed, details: [['Dirección', trimmed.slice(7).split('?')[0]]] };
  if (/^tel:/i.test(trimmed)) return { kind: 'Teléfono', action: trimmed, details: [['Número', trimmed.slice(4)]] };
  if (/^sms:/i.test(trimmed)) return { kind: 'SMS', action: trimmed, details: [['Destino', trimmed.slice(4).split('?')[0]]] };
  if (/^geo:/i.test(trimmed)) return { kind: 'Ubicación', action: trimmed, details: [['Coordenadas', trimmed.slice(4).split('?')[0]]] };
  return { kind: 'Texto', details: [['Longitud', `${value.length} caracteres`]] };
}

function showResult(value) {
  const info = classifyContent(value);
  lastOpenTarget = info.action || '';
  $('#qr-reader-empty').hidden = true;
  $('#qr-reader-output').hidden = false;
  $('#qr-reader-result-title').textContent = 'QR leído correctamente';
  $('#qr-reader-kind').textContent = info.kind;
  $('#qr-reader-content').value = value;
  $('#qr-reader-details').replaceChildren(...info.details.map(([label, content]) => {
    const item = document.createElement('div'), name = document.createElement('span'), data = document.createElement('b');
    name.textContent = label; data.textContent = content; item.append(name, data); return item;
  }));
  $('#qr-reader-open').hidden = !lastOpenTarget;
  setStatus(`${info.kind} detectado. Revisa el contenido antes de utilizarlo.`, 'success');
}

function decodeCanvas() {
  if (typeof window.jsQR !== 'function') { setStatus('El lector local no se ha podido cargar.', 'error'); return false; }
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const result = window.jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
  if (!result) return false;
  showResult(result.data);
  return true;
}

async function loadImage(file) {
  stopCamera();
  if (!file || !file.type.startsWith('image/')) return setStatus('Selecciona un archivo de imagen.', 'error');
  if (file.size > 12 * 1024 * 1024) return setStatus('La imagen supera el límite de 12 MB.', 'error');
  setStatus('Analizando la imagen…', 'loading');
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    canvas.hidden = false; placeholder.hidden = true;
    if (!decodeCanvas()) setStatus('No se ha encontrado un código QR legible. Prueba con una imagen más nítida.', 'error');
  } catch { setStatus('No se ha podido abrir esa imagen.', 'error'); }
}

function stopCamera() {
  cancelAnimationFrame(scanFrame); scanFrame = 0;
  stream?.getTracks().forEach(track => track.stop()); stream = null;
  video.pause(); video.srcObject = null; video.hidden = true;
}

function scanCamera() {
  if (!stream) return;
  if (video.readyState >= 2) {
    const scale = Math.min(1, 900 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale)); canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (decodeCanvas()) { stopCamera(); canvas.hidden = false; return; }
  }
  scanFrame = requestAnimationFrame(scanCamera);
}

async function startCamera() {
  stopCamera();
  if (!navigator.mediaDevices?.getUserMedia) return setStatus('Este navegador no ofrece acceso compatible a la cámara.', 'error');
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' } } });
    video.srcObject = stream; video.hidden = false; canvas.hidden = true; placeholder.hidden = true; await video.play();
    setStatus('Cámara activa. Centra el código QR dentro de la imagen.', 'loading'); scanCamera();
  } catch (error) { stopCamera(); setStatus(error.name === 'NotAllowedError' ? 'No se ha concedido permiso para usar la cámara.' : 'No se ha podido iniciar la cámara.', 'error'); }
}

function clearReader() {
  stopCamera(); fileInput.value = ''; lastOpenTarget = ''; context.clearRect(0,0,canvas.width,canvas.height); canvas.hidden = false; placeholder.hidden = false;
  $('#qr-reader-output').hidden = true; $('#qr-reader-empty').hidden = false; $('#qr-reader-result-title').textContent = 'Esperando un QR'; $('#qr-reader-kind').textContent = 'Sin resultado'; setStatus('Esperando una imagen o la cámara.');
}

modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.qrMode)));
fileInput.addEventListener('change', () => loadImage(fileInput.files[0]));
['dragenter','dragover'].forEach(type => drop.addEventListener(type, event => { event.preventDefault(); drop.classList.add('dragging'); }));
['dragleave','drop'].forEach(type => drop.addEventListener(type, event => { event.preventDefault(); drop.classList.remove('dragging'); }));
drop.addEventListener('drop', event => loadImage(event.dataTransfer.files[0]));
$('#qr-reader-camera').addEventListener('click', startCamera);
$('#qr-reader-clear').addEventListener('click', clearReader);
$('#qr-reader-paste').addEventListener('click', async () => {
  try { const items = await navigator.clipboard.read(); for (const item of items) { const type=item.types.find(value=>value.startsWith('image/')); if(type)return loadImage(await item.getType(type)); } setStatus('El portapapeles no contiene una imagen.', 'error'); }
  catch { setStatus('El navegador no ha permitido leer una imagen del portapapeles.', 'error'); }
});
document.addEventListener('paste', event => { if ($('[data-qr-mode="read"]').getAttribute('aria-selected') !== 'true') return; const item=[...event.clipboardData.items].find(entry=>entry.type.startsWith('image/')); if(item){event.preventDefault();loadImage(item.getAsFile());} });
$('#qr-reader-copy').addEventListener('click', async event => { try { await navigator.clipboard.writeText($('#qr-reader-content').value); event.currentTarget.textContent='Copiado'; setTimeout(()=>event.currentTarget.textContent='Copiar contenido',1300); } catch { setStatus('No se ha podido copiar el contenido.', 'error'); } });
$('#qr-reader-open').addEventListener('click', () => { if (!lastOpenTarget) return; if (confirm(`Vas a abrir:\n\n${lastOpenTarget}\n\n¿Quieres continuar?`)) window.open(lastOpenTarget, '_blank', 'noopener,noreferrer'); });
window.addEventListener('pagehide', stopCamera);
clearReader(); setMode('generate');
