import { BACKUP_FORMAT, LEGACY_BACKUP_FORMAT, PERIOD_FORMAT, SECTIONS, applySections, buildBackup, countdownsToCsv, parseImport, periodTemplate, periodsToCsv, readSection, resetSections, sectionCount, validateImportedSections } from './admin-core.js?v=backup-time-control-1';

const $=selector=>document.querySelector(selector), $$=selector=>[...document.querySelectorAll(selector)];
const dateStamp=()=>new Date().toLocaleDateString('sv-SE');
let pendingImport=null;

function download(name,content,type='application/json'){
  const blob=new Blob([content],{type:`${type};charset=utf-8`}),anchor=document.createElement('a');anchor.href=URL.createObjectURL(blob);anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(anchor.href),1000);
}
function downloadJson(name,value){download(name,JSON.stringify(value,null,2));}
function setStatus(node,message,kind=''){node.textContent=message;node.className=`admin-inline-status ${kind}`.trim();}
function sectionValue(id){return readSection(localStorage,id)}
function sectionRow(section,{checked=true,prefix='export'}={}){const value=sectionValue(section.id),count=sectionCount(section.id,value),label=count?`${count} ${count===1?'elemento':'elementos'}`:(value==null?'Valores predeterminados':'Configuración guardada');return `<label class="admin-section-row"><input type="checkbox" data-${prefix}-section="${section.id}" ${checked?'checked':''}/><span><b>${section.label}</b><small>${label}</small></span><i>${section.group==='data'?'Datos':'Preferencias'}</i></label>`}
function renderSectionLists(){
  $('#export-sections').innerHTML=SECTIONS.map(section=>sectionRow(section)).join('');
  $('#reset-sections').innerHTML=SECTIONS.map(section=>sectionRow(section,{checked:false,prefix:'reset'})).join('');
  const stored=SECTIONS.map(section=>({section,value:sectionValue(section.id)})),withData=stored.filter(item=>sectionCount(item.section.id,item.value)>0).length,total=stored.reduce((sum,item)=>sum+sectionCount(item.section.id,item.value),0);$('#backup-summary').innerHTML=`<div><b>${SECTIONS.length}</b><span>secciones compatibles</span></div><div><b>${withData}</b><span>con información guardada</span></div><div><b>${total}</b><span>elementos o configuraciones</span></div>`;
}
function selected(prefix){return $$(`[data-${prefix}-section]:checked`).map(input=>input.dataset[`${prefix}Section`]);}
function fullBackupDownload(prefix='odin-copia-completa'){downloadJson(`${prefix}-${dateStamp()}.json`,buildBackup(localStorage));}

$$('[data-admin-tab]').forEach(button=>button.addEventListener('click',()=>{$$('[data-admin-tab]').forEach(item=>item.setAttribute('aria-selected',String(item===button)));$$('[data-admin-panel]').forEach(panel=>panel.hidden=panel.dataset.adminPanel!==button.dataset.adminTab);renderSectionLists();}));
$('#download-full').addEventListener('click',()=>fullBackupDownload());

$$('[data-select-set]').forEach(button=>button.addEventListener('click',()=>{const set=button.dataset.selectSet;$$('[data-export-section]').forEach(input=>{const section=SECTIONS.find(item=>item.id===input.dataset.exportSection);input.checked=set==='all'||set===section.group;});}));
$('#export-json').addEventListener('click',()=>{const ids=selected('export');if(!ids.length)return setStatus($('#export-status'),'Selecciona al menos una sección.','error');downloadJson(`odin-seleccion-${dateStamp()}.json`,buildBackup(localStorage,ids));setStatus($('#export-status'),`${ids.length} secciones exportadas en JSON.`,'success');});
$('#export-csv').addEventListener('click',()=>{const ids=selected('export').filter(id=>id==='vacaciones'||id==='otros_festivos');if(!ids.length)return setStatus($('#export-status'),'Marca Vacaciones u Otros y festivos locales.','error');const sections={};for(const id of ids)sections[id]=sectionValue(id);download(`odin-periodos-${dateStamp()}.csv`,`\uFEFF${periodsToCsv(sections)}`,'text/csv');setStatus($('#export-status'),'CSV exportado con punto y coma (;) como separador.','success');});
function selectedCountdowns(){const category=$('#countdown-export-category').value,value=sectionValue('cuentas_atras');return{category,value:{...value,personal:(value.personal||[]).filter(item=>category==='all'||item.category===category)}}}
$('#export-countdowns-json').addEventListener('click',()=>{const{category,value}=selectedCountdowns();downloadJson(`odin-acontecimientos-${category}-${dateStamp()}.json`,{formato:BACKUP_FORMAT,version:2,creado:new Date().toISOString(),origen:'ODÍN',secciones:{cuentas_atras:value}});setStatus($('#export-status'),'Acontecimientos exportados en JSON.','success');});
$('#export-countdowns-csv').addEventListener('click',()=>{const category=$('#countdown-export-category').value,value=sectionValue('cuentas_atras');download(`odin-acontecimientos-${category}-${dateStamp()}.csv`,`\uFEFF${countdownsToCsv(value,category)}`,'text/csv');setStatus($('#export-status'),`Acontecimientos exportados en CSV (${category==='all'?'todas las categorías':$('#countdown-export-category').selectedOptions[0].textContent}).`,'success');});

const holidayPrompt=`Genera los festivos locales de [CIUDAD] correspondientes al año [AÑO] en formato odin-periodos-v1. Devuelve exclusivamente JSON válido. Cada periodo debe contener tipo, nombre, desde, hasta, lugar y descripcion. El tipo debe ser "otros" y las fechas deben utilizar AAAA-MM-DD. No inventes fechas: utiliza fuentes oficiales y omite cualquier fecha que no puedas verificar.`;$('#holiday-prompt').textContent=holidayPrompt;
$('#copy-holiday-prompt').addEventListener('click',async()=>{await navigator.clipboard.writeText(holidayPrompt);setStatus($('#export-status'),'Prompt copiado. Sustituye [CIUDAD] y [AÑO].','success');});
$('#template-json').addEventListener('click',()=>downloadJson('odin-plantilla-festivos.json',periodTemplate('otros')));
$('#template-csv').addEventListener('click',()=>download('odin-plantilla-periodos.csv',`\uFEFF${periodsToCsv({otros_festivos:periodTemplate('otros').periodos})}`,'text/csv'));

async function analyze(text,filename=''){
  try{pendingImport=parseImport(text,filename);validateImportedSections(pendingImport.secciones);const entries=Object.keys(pendingImport.secciones).map(id=>SECTIONS.find(section=>section.id===id)).filter(Boolean);$('#import-sections').innerHTML=entries.map(section=>{const count=sectionCount(section.id,pendingImport.secciones[section.id]);return `<label class="admin-section-row"><input type="checkbox" data-import-section="${section.id}" checked/><span><b>${section.label}</b><small>${count} ${count===1?'elemento':'elementos'}</small></span><i>Compatible</i></label>`}).join('');const isBackup=[BACKUP_FORMAT,LEGACY_BACKUP_FORMAT].includes(pendingImport.formato),isJsonPeriods=pendingImport.formato===PERIOD_FORMAT,isCountdownCsv=pendingImport.formato==='odin-csv-acontecimientos-v1';$('#import-title').textContent=isBackup?'Copia de ODÍN compatible':isJsonPeriods?'Periodos en JSON compatibles':isCountdownCsv?'Acontecimientos en CSV compatibles':'Periodos en CSV compatibles';$('#import-detection').textContent=isBackup?'Identificado por las secciones incluidas en la copia.':isJsonPeriods?'Identificado mediante el campo «tipo» de cada periodo.':isCountdownCsv?'Identificado mediante la columna «categoria» del CSV.':'Identificado mediante la columna «tipo» del CSV.';$('#import-preview').hidden=false;setStatus($('#import-status'),`Contenido válido. ODÍN ha detectado ${entries.map(item=>item.label).join(', ')}. Analizar no ha modificado ningún dato.`,'success');}
  catch(error){pendingImport=null;$('#import-preview').hidden=true;setStatus($('#import-status'),error.message,'error');}
}
$('#analyze-import').addEventListener('click',()=>analyze($('#import-text').value));
$('#import-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;if(file.size>2_000_000)return setStatus($('#import-status'),'El archivo supera el límite de 2 MB.','error');$('#import-text').value=await file.text();analyze($('#import-text').value,file.name);});
$('#apply-import').addEventListener('click',()=>{if(!pendingImport)return;const ids=selected('import');if(!ids.length)return setStatus($('#import-status'),'Selecciona al menos una sección.','error');try{if($('#preimport-backup').checked)fullBackupDownload('odin-copia-previa-importacion');const applied=applySections(localStorage,pendingImport.secciones,ids,$('#import-mode').value);renderSectionLists();setStatus($('#import-status'),`${applied.length} secciones importadas correctamente. Los cambios estarán disponibles al abrir cada herramienta.`,'success');}catch(error){setStatus($('#import-status'),error.message,'error');}});

function updateResetButton(){const ready=$('#reset-confirmation').value.trim().toUpperCase()==='RESTABLECER'&&selected('reset').length>0;$('#reset-selected').disabled=!ready;}
$('#reset-confirmation').addEventListener('input',updateResetButton);$('#reset-sections').addEventListener('change',updateResetButton);
$('#reset-selected').addEventListener('click',()=>{const ids=selected('reset');if(!ids.length||$('#reset-confirmation').value.trim().toUpperCase()!=='RESTABLECER')return;if($('#prereset-backup').checked)fullBackupDownload('odin-copia-previa-restablecimiento');resetSections(localStorage,ids);$('#reset-confirmation').value='';$$('[data-reset-section]').forEach(input=>input.checked=false);updateResetButton();renderSectionLists();setStatus($('#reset-status'),`${ids.length} secciones restablecidas. Las demás permanecen intactas.`,'success');});

renderSectionLists();
