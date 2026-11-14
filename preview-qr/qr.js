import { buildQrContent } from './qr-content.js';

const TYPES = [
  { id: 'text', icon: 'Aa', label: 'Texto', title: 'Texto libre' },
  { id: 'url', icon: '↗', label: 'Enlace', title: 'Dirección web' },
  { id: 'wifi', icon: '⌁', label: 'Wi-Fi', title: 'Acceso a una red Wi-Fi' },
  { id: 'contact', icon: '◇', label: 'Contacto', title: 'Tarjeta de contacto' },
  { id: 'phone', icon: '☎', label: 'Teléfono', title: 'Llamada telefónica' },
  { id: 'email', icon: '@', label: 'Correo', title: 'Mensaje de correo' },
  { id: 'sms', icon: '✉', label: 'SMS', title: 'Mensaje SMS' },
  { id: 'location', icon: '⌖', label: 'Ubicación', title: 'Coordenadas GPS' },
  { id: 'event', icon: '□', label: 'Evento', title: 'Evento de calendario' }
];

const STORAGE_KEY = 'odin-qr-preferences-v1';
const DEFAULTS = { type: 'text', size: 360, level: 'M', foreground: '#07101f', background: '#ffffff', margin: 4 };
const state = { ...DEFAULTS, model: null, content: '' };

const $ = (selector) => document.querySelector(selector);
const typesNode = $('#qr-types');
const fieldsNode = $('#qr-fields');
const form = $('#qr-form');
const canvas = $('#qr-canvas');
const context = canvas.getContext('2d');
const actionButtons = ['#download-png', '#download-svg', '#copy-image', '#print-qr', '#copy-content'].map($);

function localDateTime(offsetMinutes = 0) {
  const date = new Date(Date.now() + offsetMinutes * 60000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

function fieldMarkup(type) {
  const start = localDateTime(60);
  const end = localDateTime(120);
  const fields = {
    text: '<label class="qr-wide"><span>Texto</span><textarea name="text" rows="7" maxlength="2800" placeholder="Escribe o pega el contenido que quieres compartir" autofocus></textarea></label>',
    url: '<label class="qr-wide"><span>Dirección web</span><input name="url" type="url" inputmode="url" placeholder="https://ejemplo.com" autofocus /></label><p class="qr-field-help qr-wide">Si omites el protocolo, ODÍN añadirá https:// automáticamente.</p>',
    wifi: '<label><span>Nombre de la red (SSID)</span><input name="ssid" type="text" maxlength="128" placeholder="Mi red Wi-Fi" autofocus /></label><label><span>Seguridad</span><select name="security"><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">Red abierta</option></select></label><label class="qr-wide"><span>Contraseña</span><div class="qr-password"><input name="password" type="password" maxlength="128" placeholder="Contraseña de la red" /><button type="button" id="toggle-password" aria-label="Mostrar contraseña">Ver</button></div></label><label class="qr-check qr-wide"><input name="hidden" type="checkbox" /><i></i><span><b>Red oculta</b><small>Márcalo si el nombre de la red no se anuncia públicamente.</small></span></label>',
    contact: '<label><span>Nombre completo</span><input name="name" type="text" placeholder="Nombre y apellidos" autofocus /></label><label><span>Organización</span><input name="organization" type="text" placeholder="Empresa u organización" /></label><label><span>Teléfono</span><input name="phone" type="tel" inputmode="tel" placeholder="+34 600 000 000" /></label><label><span>Correo electrónico</span><input name="email" type="email" inputmode="email" placeholder="nombre@ejemplo.com" /></label><label class="qr-wide"><span>Dirección</span><input name="address" type="text" placeholder="Calle, ciudad, país" /></label>',
    phone: '<label class="qr-wide"><span>Número de teléfono</span><input name="phone" type="tel" inputmode="tel" placeholder="+34 600 000 000" autofocus /></label>',
    email: '<label><span>Destinatario</span><input name="email" type="email" inputmode="email" placeholder="nombre@ejemplo.com" autofocus /></label><label><span>Asunto</span><input name="subject" type="text" placeholder="Asunto del mensaje" /></label><label class="qr-wide"><span>Mensaje</span><textarea name="body" rows="5" placeholder="Escribe el cuerpo del correo"></textarea></label>',
    sms: '<label><span>Número de teléfono</span><input name="phone" type="tel" inputmode="tel" placeholder="+34 600 000 000" autofocus /></label><label class="qr-wide"><span>Mensaje</span><textarea name="message" rows="5" placeholder="Texto del SMS"></textarea></label>',
    location: '<label><span>Latitud</span><input name="latitude" type="number" inputmode="decimal" step="any" min="-90" max="90" placeholder="41.3874" autofocus /></label><label><span>Longitud</span><input name="longitude" type="number" inputmode="decimal" step="any" min="-180" max="180" placeholder="2.1686" /></label><label class="qr-wide"><span>Nombre del lugar (opcional)</span><input name="label" type="text" placeholder="Barcelona" /></label>',
    event: '<label class="qr-wide"><span>Nombre del evento</span><input name="title" type="text" placeholder="Reunión, visita, celebración…" autofocus /></label><label><span>Fecha de inicio</span><input name="startDate" type="date" value="' + start.date + '" /></label><label><span>Hora de inicio</span><input name="startTime" type="time" value="' + start.time + '" /></label><label><span>Fecha final</span><input name="endDate" type="date" value="' + end.date + '" /></label><label><span>Hora final</span><input name="endTime" type="time" value="' + end.time + '" /></label><label class="qr-wide"><span>Lugar</span><input name="location" type="text" placeholder="Dirección o ubicación" /></label><label class="qr-wide"><span>Descripción</span><textarea name="description" rows="3" placeholder="Información adicional"></textarea></label>'
  };
  return fields[type] || fields.text;
}

function loadPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    Object.assign(state, DEFAULTS, saved);
    if (!TYPES.some((item) => item.id === state.type)) state.type = 'text';
  } catch {
    Object.assign(state, DEFAULTS);
  }
}

function savePreferences() {
  const preferences = { type: state.type, size: state.size, level: state.level, foreground: state.foreground, background: state.background, margin: state.margin };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

function renderTypes() {
  typesNode.innerHTML = TYPES.map((item) => '<button type="button" data-type="' + item.id + '" class="' + (item.id === state.type ? 'active' : '') + '" aria-pressed="' + (item.id === state.type) + '"><i>' + item.icon + '</i><span>' + item.label + '</span></button>').join('');
}

function renderForm() {
  const selected = TYPES.find((item) => item.id === state.type);
  $('#editor-title').textContent = selected.title;
  fieldsNode.innerHTML = fieldMarkup(state.type);
  const passwordButton = $('#toggle-password');
  if (passwordButton) {
    passwordButton.addEventListener('click', () => {
      const input = form.elements.password;
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      passwordButton.textContent = visible ? 'Ver' : 'Ocultar';
      passwordButton.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });
    form.elements.security.addEventListener('change', () => {
      const open = form.elements.security.value === 'nopass';
      form.elements.password.disabled = open;
      form.elements.password.closest('label').classList.toggle('is-disabled', open);
      update();
    });
  }
  fieldsNode.querySelector('[autofocus]')?.focus({ preventScroll: true });
  clearPreview();
}

function readData() {
  const data = Object.fromEntries(new FormData(form).entries());
  if (form.elements.hidden) data.hidden = form.elements.hidden.checked;
  return data;
}

function colorLuminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((value) => parseInt(value, 16) / 255).map((value) => value <= .03928 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4));
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}

function contrastRatio(a, b) {
  const first = colorLuminance(a);
  const second = colorLuminance(b);
  return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
}

function setStatus(message, kind = '') {
  const node = $('#qr-status');
  node.textContent = message;
  node.className = 'qr-status' + (kind ? ' ' + kind : '');
}

function setActions(enabled) {
  actionButtons.forEach((button) => { button.disabled = !enabled; });
}

function clearPreview(message = 'El código aparecerá mientras escribes.') {
  state.model = null;
  state.content = '';
  context.clearRect(0, 0, canvas.width, canvas.height);
  canvas.hidden = true;
  $('#qr-empty').hidden = false;
  $('#qr-empty small').textContent = message;
  $('#qr-character-count').textContent = '0 caracteres';
  $('#qr-complexity').textContent = 'Sin generar';
  setActions(false);
}

function drawModel(model) {
  const count = model.getModuleCount();
  const total = count + state.margin * 2;
  canvas.width = state.size;
  canvas.height = state.size;
  context.fillStyle = state.background;
  context.fillRect(0, 0, state.size, state.size);
  context.fillStyle = state.foreground;
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (!model.isDark(row, column)) continue;
      const x1 = Math.round((column + state.margin) * state.size / total);
      const y1 = Math.round((row + state.margin) * state.size / total);
      const x2 = Math.round((column + state.margin + 1) * state.size / total);
      const y2 = Math.round((row + state.margin + 1) * state.size / total);
      context.fillRect(x1, y1, x2 - x1, y2 - y1);
    }
  }
}

function validate(type, data) {
  if (type === 'location') {
    const lat = Number(data.latitude);
    const lon = Number(data.longitude);
    if (data.latitude && (lat < -90 || lat > 90)) return 'La latitud debe estar entre −90 y 90.';
    if (data.longitude && (lon < -180 || lon > 180)) return 'La longitud debe estar entre −180 y 180.';
  }
  if (type === 'event' && data.startDate && data.startTime && data.endDate && data.endTime) {
    if (new Date(data.endDate + 'T' + data.endTime) <= new Date(data.startDate + 'T' + data.startTime)) return 'El final del evento debe ser posterior al inicio.';
  }
  return '';
}

function update() {
  const data = readData();
  const validationMessage = validate(state.type, data);
  const content = buildQrContent(state.type, data);
  $('#qr-character-count').textContent = content.length + (content.length === 1 ? ' carácter' : ' caracteres');
  if (validationMessage) {
    clearPreview(validationMessage);
    setStatus(validationMessage, 'error');
    return;
  }
  if (!content) {
    clearPreview();
    setStatus('Completa los datos necesarios para generar el código.');
    return;
  }
  try {
    const model = window.qrcode(0, state.level);
    model.addData(content, 'Byte');
    model.make();
    state.model = model;
    state.content = content;
    drawModel(model);
    canvas.hidden = false;
    $('#qr-empty').hidden = true;
    const modules = model.getModuleCount();
    $('#qr-character-count').textContent = content.length + (content.length === 1 ? ' carácter' : ' caracteres');
    $('#qr-complexity').textContent = modules + ' × ' + modules + ' módulos';
    setActions(true);
    const contrast = contrastRatio(state.foreground, state.background);
    if (contrast < 3) setStatus('El contraste es bajo. Usa colores más diferentes para facilitar la lectura.', 'warning');
    else if (content.length > 900 || modules > 97) setStatus('Código denso: prueba un nivel de corrección menor si cuesta escanearlo.', 'warning');
    else setStatus('Listo para escanear. Compruébalo antes de imprimir o compartir.', 'success');
  } catch {
    clearPreview('El contenido es demasiado largo para esta configuración.');
    setStatus('No cabe en un QR. Reduce el contenido o el nivel de corrección.', 'error');
  }
}

function svgMarkup() {
  if (!state.model) return '';
  const count = state.model.getModuleCount();
  const total = count + state.margin * 2;
  let path = '';
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (state.model.isDark(row, column)) path += 'M' + (column + state.margin) + ' ' + (row + state.margin) + 'h1v1h-1z';
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + state.size + '" height="' + state.size + '" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="' + state.background + '"/><path d="' + path + '" fill="' + state.foreground + '"/></svg>';
}

function downloadBlob(blob, extension) {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'odin-qr-' + state.type + '.' + extension;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

function flash(message, kind = 'success') {
  setStatus(message, kind);
  window.clearTimeout(flash.timeout);
  flash.timeout = window.setTimeout(update, 2600);
}

async function copyText(value, message) {
  try {
    await navigator.clipboard.writeText(value);
    flash(message);
  } catch {
    flash('El navegador no ha permitido copiarlo.', 'error');
  }
}

typesNode.addEventListener('click', (event) => {
  const button = event.target.closest('[data-type]');
  if (!button || button.dataset.type === state.type) return;
  state.type = button.dataset.type;
  savePreferences();
  renderTypes();
  renderForm();
});

form.addEventListener('input', update);
form.addEventListener('change', update);

$('#qr-size').addEventListener('input', (event) => {
  state.size = Number(event.target.value);
  $('#size-value').textContent = state.size + ' px';
  savePreferences();
  update();
});
$('#qr-level').addEventListener('change', (event) => { state.level = event.target.value; savePreferences(); update(); });
$('#qr-foreground').addEventListener('input', (event) => { state.foreground = event.target.value; savePreferences(); update(); });
$('#qr-background').addEventListener('input', (event) => { state.background = event.target.value; savePreferences(); update(); });
$('#qr-margin').addEventListener('input', (event) => {
  state.margin = Number(event.target.value);
  $('#margin-value').textContent = state.margin + (state.margin === 1 ? ' módulo' : ' módulos');
  savePreferences();
  update();
});

$('#reset-style').addEventListener('click', () => {
  Object.assign(state, { size: DEFAULTS.size, level: DEFAULTS.level, foreground: DEFAULTS.foreground, background: DEFAULTS.background, margin: DEFAULTS.margin });
  applySettings();
  savePreferences();
  update();
});

$('#download-png').addEventListener('click', () => canvas.toBlob((blob) => blob && downloadBlob(blob, 'png'), 'image/png'));
$('#download-svg').addEventListener('click', () => downloadBlob(new Blob([svgMarkup()], { type: 'image/svg+xml;charset=utf-8' }), 'svg'));
$('#copy-content').addEventListener('click', () => copyText(state.content, 'Contenido copiado.'));
$('#copy-image').addEventListener('click', () => {
  canvas.toBlob(async (blob) => {
    try {
      if (!blob || !navigator.clipboard?.write || !window.ClipboardItem) throw new Error();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      flash('Imagen copiada.');
    } catch {
      flash('Este navegador no permite copiar imágenes. Puedes descargar el PNG.', 'error');
    }
  }, 'image/png');
});
$('#print-qr').addEventListener('click', () => {
  const frame = document.createElement('iframe');
  frame.className = 'qr-print-frame';
  frame.onload = () => { frame.contentWindow.focus(); frame.contentWindow.print(); setTimeout(() => frame.remove(), 1000); };
  frame.srcdoc = '<!doctype html><title>QR · ODÍN</title><style>html,body{height:100%;margin:0}body{display:grid;place-items:center}svg{width:min(80vmin,720px);height:auto}</style>' + svgMarkup();
  document.body.append(frame);
});

function applySettings() {
  $('#qr-size').value = state.size;
  $('#size-value').textContent = state.size + ' px';
  $('#qr-level').value = state.level;
  $('#qr-foreground').value = state.foreground;
  $('#qr-background').value = state.background;
  $('#qr-margin').value = state.margin;
  $('#margin-value').textContent = state.margin + (state.margin === 1 ? ' módulo' : ' módulos');
}

loadPreferences();
applySettings();
renderTypes();
renderForm();
