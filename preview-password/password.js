import { generatePassword, generatePassphrase, generatePin, strengthFromEntropy } from './password-core.js?v=4';

const STORAGE_KEY = 'odin-password-settings-v2';
const currentMonth = new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: '2-digit' });
const defaults = {
  mode: 'password', quantity: 1, hidden: false,
  password: { length: 20, lowercase: true, uppercase: true, digitCount: 3, symbolCount: 3, symbolsAllowed: '$%€#', excludeAmbiguous: true, excluded: '', dateEnabled: false, date: currentMonth, datePosition: 'end' },
  passphrase: { words: 8, separator: '-', capitalization: 'none', numberCount: 0, leet: false, dateEnabled: false, date: currentMonth, datePosition: 'end' },
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
  byId('password-digit-count').value = state.password.digitCount;
  byId('password-symbol-count').value = state.password.symbolCount;
  byId('password-symbols-allowed').value = state.password.symbolsAllowed ?? '$%€#';
  byId('password-ambiguous').checked = state.password.excludeAmbiguous;
  byId('password-excluded').value = state.password.excluded;
  byId('password-date-enabled').checked = state.password.dateEnabled;
  byId('password-date').value = state.password.date || currentMonth;
  byId('password-date-position').value = state.password.datePosition;
  byId('passphrase-words').value = state.passphrase.words;
  byId('passphrase-separator').value = state.passphrase.separator;
  byId('passphrase-capitalization').value = state.passphrase.capitalization;
  byId('passphrase-number-count').value = state.passphrase.numberCount;
  byId('passphrase-leet').checked = state.passphrase.leet;
  byId('passphrase-date-enabled').checked = state.passphrase.dateEnabled;
  byId('passphrase-date').value = state.passphrase.date || currentMonth;
  byId('passphrase-date-position').value = state.passphrase.datePosition;
  byId('pin-length').value = state.pin.length;
  byId('pin-obvious').checked = state.pin.avoidObvious;
  byId('password-quantity').value = state.quantity;
  byId('password-length-value').textContent = state.password.length;
  byId('passphrase-words-value').textContent = state.passphrase.words;
  byId('pin-length-value').textContent = state.pin.length;
  updateDateAvailability();
  setMode(state.mode, false);
  setVisibility(state.hidden, false);
}

function readControls() {
  state.password = {
    length: Number(byId('password-length').value),
    lowercase: byId('password-lowercase').checked,
    uppercase: byId('password-uppercase').checked,
    digitCount: Number(byId('password-digit-count').value),
    symbolCount: Number(byId('password-symbol-count').value),
    symbolsAllowed: byId('password-symbols-allowed').value,
    excludeAmbiguous: byId('password-ambiguous').checked,
    excluded: byId('password-excluded').value,
    dateEnabled: byId('password-date-enabled').checked,
    date: byId('password-date').value,
    datePosition: byId('password-date-position').value,
  };
  state.passphrase = {
    words: Number(byId('passphrase-words').value),
    separator: byId('passphrase-separator').value,
    capitalization: byId('passphrase-capitalization').value,
    numberCount: Number(byId('passphrase-number-count').value),
    leet: byId('passphrase-leet').checked,
    dateEnabled: byId('passphrase-date-enabled').checked,
    date: byId('passphrase-date').value,
    datePosition: byId('passphrase-date-position').value,
  };
  state.pin = { length: Number(byId('pin-length').value), avoidObvious: byId('pin-obvious').checked };
  state.quantity = Number(byId('password-quantity').value);
  byId('password-length-value').textContent = state.password.length;
  byId('passphrase-words-value').textContent = state.passphrase.words;
  byId('pin-length-value').textContent = state.pin.length;
  updateDateAvailability();
  saveSettings();
}

function updateDateAvailability() {
  byId('password-date').disabled = !byId('password-date-enabled').checked;
  byId('password-date-position').disabled = !byId('password-date-enabled').checked;
  byId('passphrase-date').disabled = !byId('passphrase-date-enabled').checked;
  byId('passphrase-date-position').disabled = !byId('passphrase-date-enabled').checked;
}

function aamm(value) { return /^\d{4}-\d{2}$/.test(value) ? value.replace('-', '').slice(2) : ''; }

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
  if (state.mode === 'passphrase') return generatePassphrase({ ...state.passphrase, dateToken: state.passphrase.dateEnabled ? aamm(state.passphrase.date) : '' });
  if (state.mode === 'pin') return generatePin(state.pin);
  return generatePassword({ ...state.password, dateToken: state.password.dateEnabled ? aamm(state.password.date) : '' });
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
