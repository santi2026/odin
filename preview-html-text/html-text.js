const input = document.querySelector('#html-input');
const output = document.querySelector('#text-output');
const status = document.querySelector('#html-status');
const copyButton = document.querySelector('#copy-text');
const downloadButton = document.querySelector('#download-text');
const editButton = document.querySelector('#edit-result');
const fileInput = document.querySelector('#html-file');
const urlForm = document.querySelector('#html-url-form');
const urlInput = document.querySelector('#html-url');
const urlButton = document.querySelector('#fetch-url');
const urlStatus = document.querySelector('#html-url-status');
const blockElements = new Set(['ADDRESS','ARTICLE','ASIDE','BLOCKQUOTE','DD','DIV','DL','DT','FIELDSET','FIGCAPTION','FIGURE','FOOTER','FORM','H1','H2','H3','H4','H5','H6','HEADER','HR','LI','MAIN','NAV','OL','P','PRE','SECTION','TABLE','TBODY','TD','TFOOT','TH','THEAD','TR','UL']);
const ignoredElements = new Set(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE','SVG','CANVAS','IFRAME','OBJECT','EMBED','HEAD']);

function appendBreak(parts) {
  if (parts.length && parts[parts.length - 1] !== '\n') parts.push('\n');
}

function extractNode(node, parts, options) {
  if (node.nodeType === Node.TEXT_NODE) {
    parts.push(node.nodeValue || '');
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const element = node;
  const inlineStyle = (element.getAttribute('style') || '').toLowerCase();
  if (ignoredElements.has(element.tagName) || element.hidden || element.getAttribute('aria-hidden') === 'true' || /display\s*:\s*none|visibility\s*:\s*hidden/.test(inlineStyle)) return;
  if (element.tagName === 'BR') {
    appendBreak(parts);
    return;
  }
  const isBlock = blockElements.has(element.tagName);
  if (isBlock && options.keepParagraphs) appendBreak(parts);
  if (element.tagName === 'IMG') {
    if (options.includeAlt && element.getAttribute('alt')) parts.push(element.getAttribute('alt'));
  } else {
    element.childNodes.forEach((child) => extractNode(child, parts, options));
  }
  if (element.tagName === 'A' && options.includeLinks) {
    const href = element.getAttribute('href');
    if (href && !href.toLowerCase().startsWith('javascript:')) parts.push(' [' + href + ']');
  }
  if (isBlock && options.keepParagraphs) appendBreak(parts);
}

function normalizeText(parts, keepParagraphs) {
  let text = parts.join('').replace(/\u00a0/g, ' ').replace(/[ \t\f\v]+/g, ' ');
  if (keepParagraphs) {
    text = text.replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n');
  } else {
    text = text.replace(/\s+/g, ' ');
  }
  return text.trim();
}

function makeParsingSafe(source) {
  return source
    .replace(/<(script|style|noscript|template|iframe|object|embed)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(iframe|object|embed|link|meta|base)\b[^>]*\/?\s*>/gi, '')
    .replace(/\s(?:src|srcset|poster|data|ping)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

function convert() {
  const source = input.value;
  const tagCount = (source.match(/<\/?[a-z][^>]*>/gi) || []).length;
  document.querySelector('#html-source-count').textContent = source.length.toLocaleString('es-ES') + ' caracteres';
  document.querySelector('#html-tag-count').textContent = tagCount.toLocaleString('es-ES') + (tagCount === 1 ? ' etiqueta' : ' etiquetas');
  if (!source.trim()) {
    output.value = '';
    output.readOnly = true;
    editButton.textContent = 'Editar resultado';
    status.textContent = 'Introduce HTML para comenzar.';
    status.className = 'html-text-status';
    document.querySelector('#html-reduction').textContent = 'Sin contenido';
    setActions(false);
    return;
  }
  const documentNode = new DOMParser().parseFromString(makeParsingSafe(source), 'text/html');
  const options = {
    keepParagraphs: document.querySelector('#keep-paragraphs').checked,
    includeAlt: document.querySelector('#include-alt').checked,
    includeLinks: document.querySelector('#include-links').checked
  };
  const parts = [];
  extractNode(documentNode.body, parts, options);
  const text = normalizeText(parts, options.keepParagraphs);
  output.value = text;
  const reduction = source.length ? Math.max(0, Math.round((1 - text.length / source.length) * 100)) : 0;
  document.querySelector('#html-reduction').textContent = text.length.toLocaleString('es-ES') + ' caracteres · ' + reduction + '% menos';
  if (text) {
    status.textContent = 'Texto extraído correctamente. Puedes copiarlo, descargarlo o editarlo.';
    status.className = 'html-text-status success';
    setActions(true);
  } else {
    status.textContent = 'No se ha encontrado texto visible en este HTML.';
    status.className = 'html-text-status warning';
    setActions(false);
  }
}

function setActions(enabled) {
  copyButton.disabled = !enabled;
  downloadButton.disabled = !enabled;
  editButton.disabled = !enabled;
}

function setTemporaryStatus(message, kind = 'success') {
  status.textContent = message;
  status.className = 'html-text-status ' + kind;
  clearTimeout(setTemporaryStatus.timer);
  setTemporaryStatus.timer = setTimeout(() => {
    if (output.value.trim()) {
      status.textContent = output.readOnly ? 'Texto listo para copiar o descargar.' : 'Resultado en modo edición.';
      status.className = 'html-text-status success';
    } else {
      status.textContent = 'Introduce HTML para comenzar.';
      status.className = 'html-text-status';
    }
  }, 2200);
}

input.addEventListener('input', convert);
output.addEventListener('input', () => setActions(Boolean(output.value.trim())));
document.querySelectorAll('.html-option-grid input').forEach((control) => control.addEventListener('change', convert));
document.querySelector('#clear-html').addEventListener('click', () => {
  input.value = '';
  output.value = '';
  urlInput.value = '';
  urlStatus.textContent = 'Admite páginas públicas de hasta 2 MB.';
  urlStatus.className = '';
  input.focus();
  convert();
});

urlForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  let address = urlInput.value.trim();
  if (!address) {
    urlStatus.textContent = 'Escribe una dirección web.';
    urlStatus.className = 'error';
    urlInput.focus();
    return;
  }
  if (!/^https?:\/\//i.test(address)) address = 'https://' + address;
  urlButton.disabled = true;
  urlButton.textContent = 'Descargando…';
  urlStatus.textContent = 'Obteniendo la página sin guardarla…';
  urlStatus.className = 'loading';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch('/api/html-to-text', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: address }),
      signal: controller.signal
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No ha sido posible descargar la página.');
    input.value = data.html;
    urlInput.value = data.finalUrl;
    convert();
    urlStatus.textContent = 'Página obtenida · ' + Number(data.bytes).toLocaleString('es-ES') + ' bytes';
    urlStatus.className = 'success';
    status.textContent = 'Texto extraído desde la URL correctamente.';
    status.className = 'html-text-status success';
  } catch (error) {
    urlStatus.textContent = error.name === 'AbortError' ? 'La página ha tardado demasiado en responder.' : error.message;
    urlStatus.className = 'error';
  } finally {
    clearTimeout(timeout);
    urlButton.disabled = false;
    urlButton.textContent = 'Obtener texto';
  }
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    setTemporaryStatus('El archivo supera el límite de 5 MB.', 'error');
    fileInput.value = '';
    return;
  }
  input.value = await file.text();
  fileInput.value = '';
  convert();
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    setTemporaryStatus('Texto copiado.');
  } catch {
    setTemporaryStatus('El navegador no ha permitido copiarlo.', 'error');
  }
});

downloadButton.addEventListener('click', () => {
  const blob = new Blob([output.value], { type: 'text/plain;charset=utf-8' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'odin-texto-limpio.txt';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
});

editButton.addEventListener('click', () => {
  output.readOnly = !output.readOnly;
  editButton.textContent = output.readOnly ? 'Editar resultado' : 'Finalizar edición';
  if (!output.readOnly) {
    output.focus();
    output.setSelectionRange(output.value.length, output.value.length);
    status.textContent = 'Puedes corregir el resultado antes de copiarlo.';
    status.className = 'html-text-status success';
  } else {
    status.textContent = 'Edición finalizada. El texto está listo.';
    status.className = 'html-text-status success';
  }
});

convert();
