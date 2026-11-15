import { cleanText, countText, extractContacts, formatDuration, processList, replaceText, transformCase } from './text-workshop-core.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const STORAGE_KEY = 'odin-text-workshop-preferences-v1';
const DEFAULTS = { activeTab:'transform', listAction:'asc', listUnique:true, listCase:false, listTrim:true, listEmpty:true, extractKind:'both', extractUnique:true, extractSort:true, extractHeadings:true, countSpeed:200, cleanTrimLines:true, cleanSpaces:true, cleanBlank:false, cleanJoin:false, cleanInvisible:true, cleanUnicode:true, cleanTabs:false, cleanDocument:true };

function readPreferences() { try { return {...DEFAULTS,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}; } catch { return {...DEFAULTS}; } }
function savePreferences() {
  localStorage.setItem(STORAGE_KEY,JSON.stringify({
    activeTab:document.querySelector('[role="tab"][aria-selected="true"]')?.dataset.tab || 'transform',
    listAction:$('#list-action').value,listUnique:$('#list-unique').checked,listCase:$('#list-case').checked,listTrim:$('#list-trim').checked,listEmpty:$('#list-empty').checked,
    extractKind:$('#extract-kind').value,extractUnique:$('#extract-unique').checked,extractSort:$('#extract-sort').checked,extractHeadings:$('#extract-headings').checked,
    countSpeed:Number($('#count-speed').value)||200,
    cleanTrimLines:$('#clean-trim-lines').checked,cleanSpaces:$('#clean-spaces').checked,cleanBlank:$('#clean-blank').checked,cleanJoin:$('#clean-join').checked,cleanInvisible:$('#clean-invisible').checked,cleanUnicode:$('#clean-unicode').checked,cleanTabs:$('#clean-tabs').checked,cleanDocument:$('#clean-document').checked
  }));
}

const preferences=readPreferences();
$('#list-action').value=preferences.listAction;
for(const [selector,key] of [['#list-unique','listUnique'],['#list-case','listCase'],['#list-trim','listTrim'],['#list-empty','listEmpty'],['#extract-unique','extractUnique'],['#extract-sort','extractSort'],['#extract-headings','extractHeadings'],['#clean-trim-lines','cleanTrimLines'],['#clean-spaces','cleanSpaces'],['#clean-blank','cleanBlank'],['#clean-join','cleanJoin'],['#clean-invisible','cleanInvisible'],['#clean-unicode','cleanUnicode'],['#clean-tabs','cleanTabs'],['#clean-document','cleanDocument']]) $(selector).checked=Boolean(preferences[key]);
$('#extract-kind').value=preferences.extractKind;
$('#count-speed').value=preferences.countSpeed;

function setStatus(message,kind='') { const node=$('#text-status');node.textContent=message;node.className=`text-tool-status ${kind}`.trim(); }
function sourceRequired() { if ($('#text-input').value) return true; setStatus('Introduce texto antes de aplicar una operación.','error');$('#text-input').focus();return false; }
function setOutput(value,title,badge='Resultado listo') {
  $('#text-output').value=value;
  $('#text-result-title').textContent=title;
  $('#text-result-badge').textContent=value?badge:'Sin resultados';
  $('#text-output-stats').textContent=`${countText(value).characters.toLocaleString('es-ES')} caracteres`;
  for(const id of ['#text-use-result','#text-copy','#text-download']) $(id).disabled=!value;
}
function updateInputStats() {
  const metrics=countText($('#text-input').value,Number($('#count-speed').value)||200);
  $('#text-input-stats').textContent=`${metrics.characters.toLocaleString('es-ES')} caracteres · ${metrics.words.toLocaleString('es-ES')} palabras`;
  renderCounts(metrics);
}
function activateTab(name,focus=false) {
  const target=$(`[data-tab="${name}"]`) || $('[data-tab="transform"]');
  $$('[role="tab"]').forEach(tab=>{const selected=tab===target;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
  $$('[role="tabpanel"]').forEach(panel=>panel.hidden=panel.dataset.panel!==target.dataset.tab);
  if(focus) target.focus();
  if(target.dataset.tab==='count') updateInputStats();
  if(target.dataset.tab==='extract'&&$('#text-input').value) runExtract(true);
  savePreferences();
}
$$('[role="tab"]').forEach((tab,index)=>{
  tab.addEventListener('click',()=>activateTab(tab.dataset.tab));
  tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=$$('[role="tab"]');let next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;activateTab(tabs[next].dataset.tab,true);});
});
activateTab(preferences.activeTab);

$$('[data-transform]').forEach(button=>button.addEventListener('click',()=>{
  if(!sourceRequired())return;
  const result=transformCase($('#text-input').value,button.dataset.transform);
  setOutput(result,'Texto transformado',button.querySelector('span').textContent);
  setStatus(`Transformación «${button.querySelector('span').textContent}» aplicada.`,'success');
}));

const separators={newline:'\n',comma:', ',semicolon:'; ',space:' '};
$('#list-run').addEventListener('click',()=>{
  if(!sourceRequired())return;
  const result=processList($('#text-input').value,{action:$('#list-action').value,filter:$('#list-filter').value,filterMode:$('#list-filter-mode').value,prefix:$('#list-prefix').value,suffix:$('#list-suffix').value,outputSeparator:separators[$('#list-separator').value],unique:$('#list-unique').checked,caseSensitive:$('#list-case').checked,trim:$('#list-trim').checked,removeEmpty:$('#list-empty').checked});
  setOutput(result.text,'Lista procesada',`${result.outputCount} líneas`);
  setStatus(`Lista procesada: ${result.inputCount} entradas de origen y ${result.outputCount} de salida.`,'success');savePreferences();
});

$('#replace-run').addEventListener('click',()=>{
  if(!sourceRequired())return;
  if(!$('#replace-search').value){setStatus('Indica qué texto o patrón quieres buscar.','error');$('#replace-search').focus();return;}
  try { const result=replaceText($('#text-input').value,$('#replace-search').value,$('#replace-value').value,{regex:$('#replace-regex').checked,caseSensitive:$('#replace-case').checked,all:$('#replace-all').checked});setOutput(result.text,'Texto reemplazado',`${result.count} cambios`);setStatus(result.count?`${result.count} ${result.count===1?'coincidencia reemplazada':'coincidencias reemplazadas'}.`:'No se ha encontrado ninguna coincidencia.',result.count?'success':'warning'); }
  catch(error){setStatus(`Expresión no válida: ${error.message}`,'error');}
});

function renderCounts(metrics=countText($('#text-input').value,Number($('#count-speed').value)||200)) {
  const items=[['Caracteres',metrics.characters],['Sin espacios',metrics.charactersNoSpaces],['Palabras',metrics.words],['Oraciones',metrics.sentences],['Párrafos',metrics.paragraphs],['Líneas',metrics.lines],['Tamaño UTF-8',`${metrics.bytes.toLocaleString('es-ES')} bytes`],['Tiempo de lectura',formatDuration(metrics.readingSeconds)],['Media por palabra',`${metrics.averageWordLength} caracteres`]];
  $('#text-count-grid').innerHTML=items.map(([label,value])=>`<article><span>${label}</span><b>${typeof value==='number'?value.toLocaleString('es-ES'):value}</b></article>`).join('');
}
$('#count-speed').addEventListener('input',()=>{let value=Math.min(1000,Math.max(50,Number($('#count-speed').value)||200));if(String(value)!==$('#count-speed').value&&$('#count-speed').value)$('#count-speed').value=value;renderCounts(countText($('#text-input').value,value));savePreferences();});

function runExtract(silent=false) {
  if(!$('#text-input').value){if(!silent)sourceRequired();$('#extract-email-count').textContent='0';$('#extract-url-count').textContent='0';return;}
  const result=extractContacts($('#text-input').value,{unique:$('#extract-unique').checked,sort:$('#extract-sort').checked});
  $('#extract-email-count').textContent=result.emails.length;$('#extract-url-count').textContent=result.urls.length;
  const kind=$('#extract-kind').value,joiner=separators[$('#extract-separator').value],headings=$('#extract-headings').checked,blocks=[];
  if(kind!=='urls'&&result.emails.length)blocks.push(`${headings?'CORREOS\n':''}${result.emails.join(joiner)}`);
  if(kind!=='emails'&&result.urls.length)blocks.push(`${headings?'URL\n':''}${result.urls.join(joiner)}`);
  const output=blocks.join(headings?'\n\n':joiner);
  setOutput(output,'Datos extraídos',`${result.emails.length} correos · ${result.urls.length} URL`);
  if(!silent)setStatus(output?`Se han extraído ${result.emails.length} correos y ${result.urls.length} URL.`:'No se han encontrado correos ni URL. ',output?'success':'warning');
  savePreferences();
}
$('#extract-run').addEventListener('click',()=>runExtract());
$$('#panel-extract input,#panel-extract select').forEach(control=>control.addEventListener('change',()=>{if($('#text-input').value)runExtract(true);else savePreferences();}));

$('#clean-run').addEventListener('click',()=>{
  if(!sourceRequired())return;
  const source=$('#text-input').value,result=cleanText(source,{trimLines:$('#clean-trim-lines').checked,collapseSpaces:$('#clean-spaces').checked,removeBlankLines:$('#clean-blank').checked,joinLines:$('#clean-join').checked,invisible:$('#clean-invisible').checked,normalizeUnicode:$('#clean-unicode').checked,tabsToSpaces:$('#clean-tabs').checked,tabSize:2,trimDocument:$('#clean-document').checked});
  setOutput(result,'Texto limpio',`${Math.max(0,countText(source).characters-countText(result).characters)} caracteres retirados`);setStatus(source===result?'El texto ya cumple las reglas seleccionadas.':'Texto limpiado correctamente.',source===result?'warning':'success');savePreferences();
});
$$('#panel-clean input').forEach(control=>control.addEventListener('change',savePreferences));
$$('#panel-list input,#panel-list select').forEach(control=>control.addEventListener('change',savePreferences));

$('#text-input').addEventListener('input',()=>{updateInputStats();if($('[data-tab="extract"]').getAttribute('aria-selected')==='true')runExtract(true);});
$('#text-clear').addEventListener('click',()=>{$('#text-input').value='';setOutput('','Transformación');updateInputStats();$('#extract-email-count').textContent='0';$('#extract-url-count').textContent='0';setStatus('Contenido eliminado.','success');$('#text-input').focus();});
$('#text-use-result').addEventListener('click',()=>{if(!$('#text-output').value)return;$('#text-input').value=$('#text-output').value;setOutput('','Transformación');updateInputStats();setStatus('El resultado se ha colocado como nuevo texto de entrada.','success');$('#text-input').focus();});
$('#text-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#text-output').value);setStatus('Resultado copiado al portapapeles.','success');}catch{setStatus('No se ha podido copiar automáticamente.','error');}});
$('#text-download').addEventListener('click',()=>{const blob=new Blob([$('#text-output').value],{type:'text/plain;charset=utf-8'}),anchor=document.createElement('a');anchor.href=URL.createObjectURL(blob);anchor.download='odin-taller-texto.txt';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(anchor.href),1000);setStatus('Archivo TXT preparado.','success');});
$('#text-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;if(file.size>5*1024*1024){setStatus('El archivo supera el límite de 5 MB.','error');event.target.value='';return;}$('#text-input').value=await file.text();event.target.value='';updateInputStats();setStatus(`Archivo «${file.name}» cargado. Su contenido no se ha guardado.`,'success');});
$('#text-example').addEventListener('click',()=>{$('#text-input').value='  contacto@ejemplo.com   Proyecto 10  \nProyecto 2\nproyecto 2\n\nMás información: https://odin.santiagosanz.info/ y www.ejemplo.es/ayuda.  ';updateInputStats();setStatus('Ejemplo cargado. Prueba las distintas pestañas.','success');});

updateInputStats();setOutput('','Transformación');
