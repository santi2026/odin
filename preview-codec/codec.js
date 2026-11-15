import { CODEC_MODES, decryptText, encodingHint, encryptText, transformValue } from './codec-core.js';

const $ = selector => document.querySelector(selector);
const STORAGE_KEY = 'odin-codec-preferences-v1';
let lastOperation = 'encode';
let urlWasRelative = false;

function copyText(value, onSuccess, onError) {
  navigator.clipboard.writeText(value).then(onSuccess).catch(onError);
}

function flash(node, message, kind = 'success') {
  node.textContent = message;
  node.className = node.className.split(' ')[0] + ' ' + kind;
}

function loadPreferences() {
  try { return { mode:'url-component', live:true, lines:false, recursive:false, plus:false, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return { mode:'url-component', live:true, lines:false, recursive:false, plus:false }; }
}

function savePreferences() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    mode: $('#codec-mode').value,
    live: $('#codec-live').checked,
    lines: $('#codec-lines').checked,
    recursive: $('#codec-recursive').checked,
    plus: $('#codec-plus').checked
  }));
}

const preferences = loadPreferences();
$('#codec-mode').innerHTML = CODEC_MODES.map(mode => '<option value="' + mode.id + '">' + mode.label + '</option>').join('');
$('#codec-mode').value = CODEC_MODES.some(mode => mode.id === preferences.mode) ? preferences.mode : 'url-component';
$('#codec-live').checked = preferences.live;
$('#codec-lines').checked = preferences.lines;
$('#codec-recursive').checked = preferences.recursive;
$('#codec-plus').checked = preferences.plus;

document.querySelectorAll('.codec-tabs button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.codec-tabs button').forEach(item => item.setAttribute('aria-selected', String(item === button)));
  document.querySelectorAll('.codec-tab-panel').forEach(panel => { panel.hidden = panel.dataset.panel !== button.dataset.tab; });
}));

function updateModeDescription() {
  const mode = CODEC_MODES.find(item => item.id === $('#codec-mode').value);
  $('#codec-mode-note').textContent = mode.note;
  $('#codec-format-badge').textContent = ['base64','base64url','hex'].includes(mode.id) ? 'BYTES UTF‑8' : 'TEXTO UTF‑8';
  const urlMode = ['url-component','url-complete','form'].includes(mode.id);
  $('#codec-plus').closest('label').classList.toggle('is-disabled', !urlMode);
  $('#codec-plus').disabled = !urlMode;
  savePreferences();
}

function setConverterActions(hasOutput) {
  $('#codec-copy').disabled = !hasOutput;
  $('#codec-download').disabled = !hasOutput;
}

function runConversion(operation = lastOperation, silent = false) {
  lastOperation = operation;
  const source = $('#codec-input').value;
  $('#codec-input-count').textContent = source.length.toLocaleString('es-ES') + ' caracteres';
  $('#codec-hint').textContent = encodingHint(source);
  if (!source) {
    $('#codec-output').value = '';
    $('#codec-output-count').textContent = '0 caracteres';
    $('#codec-status').textContent = 'Introduce contenido para comenzar.';
    $('#codec-status').className = '';
    setConverterActions(false);
    return;
  }
  try {
    const result = transformValue({
      mode: $('#codec-mode').value,
      value: source,
      operation,
      eachLine: $('#codec-lines').checked,
      recursive: $('#codec-recursive').checked,
      plusAsSpace: $('#codec-plus').checked
    });
    $('#codec-output').value = result;
    $('#codec-output-count').textContent = result.length.toLocaleString('es-ES') + ' caracteres';
    $('#codec-status').textContent = operation === 'encode' ? 'Contenido codificado correctamente.' : 'Contenido descodificado correctamente.';
    $('#codec-status').className = 'success';
    setConverterActions(Boolean(result));
  } catch (error) {
    $('#codec-output').value = '';
    $('#codec-output-count').textContent = '0 caracteres';
    $('#codec-status').textContent = error.message;
    $('#codec-status').className = 'error';
    setConverterActions(false);
    if (!silent) $('#codec-output').focus();
  }
}

$('#codec-encode').addEventListener('click', () => runConversion('encode'));
$('#codec-decode').addEventListener('click', () => runConversion('decode'));
$('#codec-input').addEventListener('input', () => {
  $('#codec-input-count').textContent = $('#codec-input').value.length.toLocaleString('es-ES') + ' caracteres';
  $('#codec-hint').textContent = encodingHint($('#codec-input').value);
  if ($('#codec-live').checked) runConversion(lastOperation, true);
});
$('#codec-mode').addEventListener('change', () => { updateModeDescription(); if ($('#codec-live').checked) runConversion(lastOperation,true); });
document.querySelectorAll('.codec-options input').forEach(control => control.addEventListener('change', () => { savePreferences(); if ($('#codec-live').checked) runConversion(lastOperation,true); }));
$('#codec-swap').addEventListener('click', () => {
  const result = $('#codec-output').value;
  if (!result) return;
  $('#codec-input').value = result;
  $('#codec-output').value = '';
  lastOperation = lastOperation === 'encode' ? 'decode' : 'encode';
  runConversion(lastOperation);
});
$('#codec-copy').addEventListener('click', () => copyText($('#codec-output').value, () => flash($('#codec-status'),'Salida copiada.'), () => flash($('#codec-status'),'No se ha podido copiar.','error')));
$('#codec-download').addEventListener('click', () => {
  const blob = new Blob([$('#codec-output').value], { type:'text/plain;charset=utf-8' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'odin-codificado.txt';
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
});
$('#codec-clear').addEventListener('click', () => {
  $('#codec-input').value = ''; $('#codec-output').value = ''; runConversion(); $('#codec-input').focus();
});
$('#codec-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { flash($('#codec-status'),'El archivo supera el límite de 5 MB.','error'); return; }
  $('#codec-input').value = await file.text();
  event.target.value = '';
  runConversion(lastOperation);
});
updateModeDescription();
runConversion();

function safeDecodeUri(value) {
  try { return decodeURI(value); } catch { return value; }
}

function parseUrl() {
  let source = $('#url-source').value.trim();
  if (!source) { flash($('#url-status'),'Introduce una URL o una ruta.','error'); return; }
  if (/^[\w.-]+\.[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i.test(source)) source = 'https://' + source;
  const absolute = /^[a-z][a-z0-9+.-]*:/i.test(source);
  try {
    const parsed = new URL(source, 'https://odin.invalid');
    urlWasRelative = !absolute;
    $('#url-kind').textContent = urlWasRelative ? 'URL relativa' : 'URL absoluta';
    $('#url-protocol').value = urlWasRelative ? '' : parsed.protocol;
    $('#url-host').value = urlWasRelative ? '' : parsed.hostname;
    $('#url-port').value = urlWasRelative ? '' : parsed.port;
    $('#url-path').value = parsed.pathname || '/';
    $('#url-fragment').value = parsed.hash.slice(1);
    $('#url-path-preview').textContent = safeDecodeUri(parsed.pathname || '/');
    $('#url-query-raw').textContent = parsed.search.slice(1) || '—';
    renderParams([...parsed.searchParams.entries()]);
    rebuildUrl();
    flash($('#url-status'),'URL analizada. Puedes editar cualquiera de sus componentes.');
  } catch {
    flash($('#url-status'),'La dirección no tiene un formato válido.','error');
  }
}

function readParamRows() {
  return [...document.querySelectorAll('.url-param-row')].map(row => ({
    key: row.querySelector('[data-part="key"]').value,
    value: row.querySelector('[data-part="value"]').value
  }));
}

function markDuplicateParams() {
  const rows = [...document.querySelectorAll('.url-param-row')];
  const counts = rows.reduce((map,row) => {
    const key = row.querySelector('[data-part="key"]').value;
    map.set(key,(map.get(key)||0)+1); return map;
  },new Map());
  rows.forEach(row => row.classList.toggle('duplicate', counts.get(row.querySelector('[data-part="key"]').value) > 1));
  $('#url-param-count').textContent = rows.length + (rows.length === 1 ? ' parámetro' : ' parámetros');
}

function renderParams(params) {
  const list = $('#url-param-list');
  if (!params.length) {
    list.innerHTML = '<p class="url-empty-params">Esta URL no contiene parámetros.</p>';
    $('#url-param-count').textContent = '0 parámetros';
    return;
  }
  list.innerHTML = params.map((entry,index) => '<div class="url-param-row"><span>' + (index+1) + '</span><input data-part="key" value="' + escapeAttribute(entry[0]) + '" aria-label="Clave del parámetro" /><input data-part="value" value="' + escapeAttribute(entry[1]) + '" aria-label="Valor del parámetro" /><button type="button" aria-label="Eliminar parámetro">×</button></div>').join('');
  bindParamRows();
  markDuplicateParams();
}

function escapeAttribute(value) {
  return String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function bindParamRows() {
  document.querySelectorAll('.url-param-row input').forEach(input => input.addEventListener('input', () => { markDuplicateParams(); rebuildUrl(); }));
  document.querySelectorAll('.url-param-row button').forEach(button => button.addEventListener('click', () => {
    button.closest('.url-param-row').remove();
    const params = readParamRows();
    renderParams(params);
    rebuildUrl();
  }));
}

function rebuildUrl() {
  const protocolRaw = $('#url-protocol').value.trim();
  const protocol = protocolRaw ? protocolRaw.replace(/:$/,'') + ':' : 'https:';
  const hostname = $('#url-host').value.trim();
  const port = $('#url-port').value.trim();
  let path = $('#url-path').value.trim() || '/';
  if (!path.startsWith('/')) path = '/' + path;
  const fragment = $('#url-fragment').value.trim();
  const params = new URLSearchParams();
  readParamRows().forEach(item => params.append(item.key,item.value));
  const query = params.toString();
  try {
    let result;
    if (hostname || !urlWasRelative) {
      const base = new URL(protocol + '//' + hostname + (port ? ':' + port : '/'));
      base.pathname = path;
      base.search = query;
      base.hash = fragment;
      result = base.toString();
    } else {
      const base = new URL(path, 'https://odin.invalid');
      base.search = query;
      base.hash = fragment;
      result = base.pathname + base.search + base.hash;
    }
    $('#url-result').value = result;
    $('#url-copy').disabled = false;
    $('#url-path-preview').textContent = safeDecodeUri(path);
    return result;
  } catch {
    $('#url-result').value = '';
    $('#url-copy').disabled = true;
    return '';
  }
}

$('#url-parse').addEventListener('click', parseUrl);
$('#url-source').addEventListener('keydown', event => { if (event.key === 'Enter') parseUrl(); });
$('#url-example').addEventListener('click', () => { $('#url-source').value = 'https://ejemplo.com/productos/café?utm_source=odin&utm_campaign=otoño&tag=uno&tag=dos#detalles'; parseUrl(); });
['#url-protocol','#url-host','#url-port','#url-path','#url-fragment'].forEach(selector => $(selector).addEventListener('input', rebuildUrl));
$('#url-add-param').addEventListener('click', () => { const params=readParamRows(); params.push(['','']); renderParams(params); rebuildUrl(); document.querySelector('.url-param-row:last-child input')?.focus(); });
$('#url-sort-params').addEventListener('click', () => { renderParams(readParamRows().sort((a,b)=>a.key.localeCompare(b.key,'es'))); rebuildUrl(); });
$('#url-rebuild').addEventListener('click', () => { if (rebuildUrl()) flash($('#url-status'),'URL reconstruida correctamente.'); else flash($('#url-status'),'Revisa el host, el puerto o la ruta.','error'); });
$('#url-copy').addEventListener('click', () => copyText($('#url-result').value, () => flash($('#url-status'),'URL copiada.'), () => flash($('#url-status'),'No se ha podido copiar.','error')));
$('#url-to-json').addEventListener('click', () => {
  const object = {};
  readParamRows().forEach(({key,value}) => {
    if (Object.hasOwn(object,key)) object[key] = Array.isArray(object[key]) ? [...object[key],value] : [object[key],value];
    else object[key] = value;
  });
  $('#url-result').value = JSON.stringify(object,null,2);
  $('#url-copy').disabled = false;
  flash($('#url-status'),'Query convertida a JSON; las claves repetidas son listas.');
});
$('#url-clear').addEventListener('click', () => {
  ['#url-source','#url-protocol','#url-host','#url-port','#url-path','#url-fragment','#url-result'].forEach(selector => $(selector).value='');
  $('#url-kind').textContent='Sin analizar'; $('#url-path-preview').textContent='—'; $('#url-query-raw').textContent='—'; renderParams([]); $('#url-copy').disabled=true;
});

function setSecureBusy(busy) {
  $('#secure-encrypt').disabled = busy;
  $('#secure-decrypt').disabled = busy;
}

$('#secure-password').addEventListener('input', event => {
  const length = event.target.value.length;
  $('#secure-password-note').textContent = length < 10 ? 'Faltan ' + (10-length) + ' caracteres para el mínimo.' : length < 16 ? 'Válida; una frase más larga será más resistente.' : 'Longitud recomendable alcanzada.';
});
$('#secure-show-password').addEventListener('click', () => {
  const input = $('#secure-password');
  input.type = input.type === 'password' ? 'text' : 'password';
  $('#secure-show-password').textContent = input.type === 'password' ? 'Ver' : 'Ocultar';
});
$('#secure-encrypt').addEventListener('click', async () => {
  if (!$('#secure-input').value) { flash($('#secure-status'),'Introduce el texto que quieres cifrar.','error'); return; }
  setSecureBusy(true); flash($('#secure-status'),'Derivando la clave y cifrando…','loading');
  try {
    $('#secure-output').value = await encryptText($('#secure-input').value,$('#secure-password').value);
    $('#secure-copy').disabled = false; flash($('#secure-status'),'Contenido cifrado. Guarda el paquete completo y recuerda la contraseña.');
  } catch (error) { $('#secure-output').value=''; $('#secure-copy').disabled=true; flash($('#secure-status'),error.message,'error'); }
  finally { setSecureBusy(false); }
});
$('#secure-decrypt').addEventListener('click', async () => {
  if (!$('#secure-input').value) { flash($('#secure-status'),'Pega un paquete ODIN1 para descifrarlo.','error'); return; }
  setSecureBusy(true); flash($('#secure-status'),'Comprobando la contraseña y descifrando…','loading');
  try {
    $('#secure-output').value = await decryptText($('#secure-input').value,$('#secure-password').value);
    $('#secure-copy').disabled = false; flash($('#secure-status'),'Contenido descifrado correctamente.');
  } catch (error) { $('#secure-output').value=''; $('#secure-copy').disabled=true; flash($('#secure-status'),error.message,'error'); }
  finally { setSecureBusy(false); }
});
$('#secure-copy').addEventListener('click', () => copyText($('#secure-output').value, () => flash($('#secure-status'),'Resultado copiado.'), () => flash($('#secure-status'),'No se ha podido copiar.','error')));
$('#secure-clear').addEventListener('click', () => {
  $('#secure-input').value=''; $('#secure-output').value=''; $('#secure-password').value=''; $('#secure-copy').disabled=true;
  $('#secure-password-note').textContent='No se almacena ni se incluye en el resultado.'; flash($('#secure-status'),'Contenido y contraseña eliminados.');
});
