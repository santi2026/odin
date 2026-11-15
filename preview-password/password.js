import { generatePassword, generatePassphrase, generatePin, strengthFromEntropy } from './password-core.js';

const STORAGE_KEY = 'odin-password-settings-v1';
const defaults = {
  mode: 'password', quantity: 1, hidden: false,
  password: { length: 20, lowercase: true, uppercase: true, digits: true, symbols: true, excludeAmbiguous: true, excluded: '' },
  passphrase: { words: 8, separator: '-', capitalize: false, appendNumber: false },
  pin: { length: 6, avoidObvious: true },
};
let state = structuredClone(defaults);
let results = [];

const byId = id => document.getElementById(id);
const tabs = [...document.querySelectorAll('.password-tabs button')];
const optionPanels = [...document.querySelectorAll('[data-options]')];
const resultList = byId('password-results');
const status = byId('password-status');

function readStoredSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored || typeof stored !== 'object') return;
    state = {
      ...structuredClone(defaults), ...stored,
      password: { ...defaults.password, ...stored.password },
      passphrase: { ...defaults.passphrase, ...stored.passphrase },
      pin: { ...defaults.pin, ...stored.pin },
    };
  } catch { localStorage.removeItem(STORAGE_KEY); }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyStateToControls() {
  byId('password-length').value = state.password.length;
  byId('password-lowercase').checked = state.password.lowercase;
  byId('password-uppercase').checked = state.password.uppercase;
  byId('password-digits').checked = state.password.digits;
  byId('password-symbols').checked = state.password.symbols;
  byId('password-ambiguous').checked = state.password.excludeAmbiguous;
  byId('password-excluded').value = state.password.excluded;
  byId('passphrase-words').value = state.passphrase.words;
  byId('passphrase-separator').value = state.passphrase.separator;
  byId('passphrase-capitalize').checked = state.passphrase.capitalize;
  byId('passphrase-number').checked = state.passphrase.appendNumber;
  byId('pin-length').value = state.pin.length;
  byId('pin-obvious').checked = state.pin.avoidObvious;
  byId('password-quantity').value = state.quantity;
  byId('password-length-value').textContent = state.password.length;
  byId('passphrase-words-value').textContent = state.passphrase.words;
  byId('pin-length-value').textContent = state.pin.length;
  setMode(state.mode, false);
  setVisibility(state.hidden, false);
}

function readControls() {
  state.password = {
    length: Number(byId('password-length').value),
    lowercase: byId('password-lowercase').checked,
    uppercase: byId('password-uppercase').checked,
    digits: byId('password-digits').checked,
    symbols: byId('password-symbols').checked,
    excludeAmbiguous: byId('password-ambiguous').checked,
    excluded: byId('password-excluded').value,
  };
  state.passphrase = {
    words: Number(byId('passphrase-words').value),
    separator: byId('passphrase-separator').value,
    capitalize: byId('passphrase-capitalize').checked,
    appendNumber: byId('passphrase-number').checked,
  };
  state.pin = { length: Number(byId('pin-length').value), avoidObvious: byId('pin-obvious').checked };
  state.quantity = Number(byId('password-quantity').value);
  byId('password-length-value').textContent = state.password.length;
  byId('passphrase-words-value').textContent = state.passphrase.words;
  byId('pin-length-value').textContent = state.pin.length;
  saveSettings();
}

function setMode(mode, regenerate = true) {
  state.mode = ['password', 'passphrase', 'pin'].includes(mode) ? mode : 'password';
  tabs.forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.mode === state.mode)));
  optionPanels.forEach(panel => { panel.hidden = panel.dataset.options !== state.mode; });
  const names = { password: ['Contraseña aleatoria', 'Generar contraseña'], passphrase: ['Frase de paso', 'Generar frase'], pin: ['PIN aleatorio', 'Generar PIN'] };
  byId('password-settings-title').textContent = names[state.mode][0];
  byId('password-generate').textContent = names[state.mode][1];
  saveSettings();
  if (regenerate) generateResults();
}

function createOne() {
  if (state.mode === 'passphrase') return generatePassphrase(state.passphrase);
  if (state.mode === 'pin') return generatePin(state.pin);
  return generatePassword(state.password);
}

function maskedValue(value) {
  return '•'.repeat(Math.min(value.length, 42));
}

function renderResults() {
  resultList.replaceChildren();
  results.forEach((result, index) => {
    const strength = strengthFromEntropy(result.entropy);
    const article = document.createElement('article');
    article.className = `password-result strength-${strength.key}`;
    const value = document.createElement('code');
    value.textContent = state.hidden ? maskedValue(result.value) : result.value;
    value.title = state.hidden ? 'Valor oculto' : result.value;
    const meta = document.createElement('div');
    meta.className = 'password-result-meta';
    meta.innerHTML = `<span class="strength-label">${strength.label}</span><span>${Math.round(result.entropy)} bits teóricos</span><span>${result.value.length} caracteres</span>`;
    const copy = document.createElement('button');
    copy.type = 'button'; copy.textContent = 'Copiar'; copy.dataset.index = index;
    article.append(value, meta, copy);
    resultList.append(article);
  });
  byId('password-copy-all').hidden = results.length < 2;
}

function generateResults() {
  readControls();
  try {
    results = Array.from({ length: state.quantity }, createOne);
    renderResults();
    status.className = 'password-status success';
    status.textContent = `${results.length === 1 ? 'Credencial generada' : `${results.length} credenciales generadas`} en este dispositivo.`;
  } catch (error) {
    results = [];
    renderResults();
    status.className = 'password-status error';
    status.textContent = error.message;
  }
}

async function copyText(value, button) {
  try {
    await navigator.clipboard.writeText(value);
    const previous = button.textContent;
    button.textContent = 'Copiado';
    status.className = 'password-status success';
    status.textContent = 'Copiado. Guárdalo ahora en tu gestor de contraseñas.';
    setTimeout(() => { button.textContent = previous; }, 1400);
  } catch {
    status.className = 'password-status error';
    status.textContent = 'El navegador no ha permitido copiar el resultado.';
  }
}

function setVisibility(hidden, persist = true) {
  state.hidden = hidden;
  const button = byId('password-visibility');
  button.textContent = hidden ? 'Mostrar' : 'Ocultar';
  button.setAttribute('aria-pressed', String(hidden));
  if (persist) saveSettings();
  renderResults();
}

tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
document.querySelectorAll('.password-settings input,.password-settings select').forEach(control => control.addEventListener('input', () => {
  readControls();
  if (control.type === 'range') generateResults();
}));
byId('password-generate').addEventListener('click', generateResults);
byId('password-reset').addEventListener('click', () => {
  const currentMode = state.mode;
  state = structuredClone(defaults); state.mode = currentMode;
  applyStateToControls(); generateResults();
});
byId('password-visibility').addEventListener('click', () => setVisibility(!state.hidden));
byId('password-copy-all').addEventListener('click', event => copyText(results.map(result => result.value).join('\n'), event.currentTarget));
resultList.addEventListener('click', event => {
  const button = event.target.closest('button[data-index]');
  if (button) copyText(results[Number(button.dataset.index)].value, button);
});

readStoredSettings();
applyStateToControls();
generateResults();
