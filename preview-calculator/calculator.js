import{evaluateExpression,formatNumber,normalizeState,saveHistory}from'./calculator-core.js';

const STORAGE_KEY='odin-calculator-v1',CHANNEL_NAME='odin-calculator-sync-v1';
const readState=()=>{try{return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'))}catch{return normalizeState()}};
let state=readState(),undoStack=[],redoStack=[],views=[];
const channel='BroadcastChannel'in window?new BroadcastChannel(CHANNEL_NAME):null;
const timestamp=value=>new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
const escapeHtml=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

function persist(broadcast=true){state.updatedAt=Date.now();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));if(broadcast)channel?.postMessage(state)}
function setExpression(value,{history=true}={}){if(history&&value!==state.expression){undoStack.push(state.expression);if(undoStack.length>100)undoStack.shift();redoStack=[]}state.expression=value;render();persist()}
function calculate(){try{state.result=evaluateExpression(state.expression);state.answer=state.result;for(const view of views)view.error.hidden=true;render();persist();return true}catch(error){for(const view of views){view.error.textContent=error.message;view.error.hidden=false}return false}}
function insertAt(view,text){const input=view.expression,start=input.selectionStart??state.expression.length,end=input.selectionEnd??start;setExpression(state.expression.slice(0,start)+text+state.expression.slice(end));requestAnimationFrame(()=>{input.focus();input.setSelectionRange(start+text.length,start+text.length)})}
function wrapSelection(view,prefix,suffix=')'){const input=view.expression,start=input.selectionStart??0,end=input.selectionEnd??state.expression.length;if(start===end){setExpression(state.expression?prefix+state.expression+suffix:prefix);requestAnimationFrame(()=>{input.focus();input.setSelectionRange(prefix.length,prefix.length)});return}const selected=state.expression.slice(start,end);setExpression(state.expression.slice(0,start)+prefix+selected+suffix+state.expression.slice(end));requestAnimationFrame(()=>input.focus())}

function runCommand(view,command){
  const input=view.expression,start=input.selectionStart??state.expression.length,end=input.selectionEnd??start;
  if(command==='clear'){setExpression('');state.result=0;render();return}
  if(command==='backspace'){if(start!==end)setExpression(state.expression.slice(0,start)+state.expression.slice(end));else if(start>0)setExpression(state.expression.slice(0,start-1)+state.expression.slice(end));requestAnimationFrame(()=>{input.focus();input.setSelectionRange(Math.max(0,start-1),Math.max(0,start-1))});return}
  if(command==='left'||command==='right'){const next=Math.max(0,Math.min(state.expression.length,start+(command==='left'?-1:1)));input.focus();input.setSelectionRange(next,next);return}
  if(command==='undo'&&undoStack.length){redoStack.push(state.expression);state.expression=undoStack.pop();render();persist();return}
  if(command==='redo'&&redoStack.length){undoStack.push(state.expression);state.expression=redoStack.pop();render();persist();return}
  if(command==='sign')wrapSelection(view,'-(',')');if(command==='sqrt')wrapSelection(view,'√(',')');
}

function memoryAction(view,action){
  if(action==='clear')state.memory=0;
  if(action==='recall')insertAt(view,formatNumber(state.memory).replace(/\./g,''));
  if(action==='add'||action==='subtract'){if(!calculate())return;state.memory+=state.result*(action==='add'?1:-1)}
  if(action==='answer')insertAt(view,formatNumber(state.answer).replace(/\./g,''));
  render();persist();
}

function bindView(root){
  const view={root,concept:root.querySelector('#concept'),expression:root.querySelector('#expression'),result:root.querySelector('#result'),error:root.querySelector('#error')};views.push(view);
  view.concept.addEventListener('input',()=>{state.concept=view.concept.value;render(view);persist()});
  view.expression.addEventListener('input',()=>setExpression(view.expression.value));view.expression.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();calculate()}});
  root.querySelectorAll('[data-insert]').forEach(button=>button.addEventListener('click',()=>insertAt(view,button.dataset.insert)));
  root.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>runCommand(view,button.dataset.command)));
  root.querySelectorAll('[data-memory]').forEach(button=>button.addEventListener('click',()=>memoryAction(view,button.dataset.memory)));
  root.querySelector('#calculate')?.addEventListener('click',calculate);render();return view;
}

function render(skip){
  for(const view of views){if(view!==skip&&view.concept.value!==state.concept)view.concept.value=state.concept;if(view.expression.value!==state.expression)view.expression.value=state.expression;view.result.textContent=formatNumber(state.result)}
  const historyList=document.querySelector('#history-list'),empty=document.querySelector('#history-empty');
  if(historyList){const query=(document.querySelector('#history-search')?.value||'').trim().toLocaleLowerCase('es'),items=state.history.filter(item=>`${item.concept} ${item.expression} ${formatNumber(item.result)} ${timestamp(item.createdAt)}`.toLocaleLowerCase('es').includes(query));historyList.innerHTML=items.map(item=>`<article class="history-item" data-id="${item.id}"><div><b>${escapeHtml(item.concept||timestamp(item.createdAt))}</b>${item.concept?`<time>${timestamp(item.createdAt)}</time>`:''}<small>${escapeHtml(item.expression)}</small></div><strong>${formatNumber(item.result)}</strong><span class="history-actions"><button type="button" data-recover="${item.id}" title="Recuperar resultado" aria-label="Recuperar resultado">↙</button><button type="button" data-edit="${item.id}" title="Editar operación" aria-label="Editar operación">✎</button></span></article>`).join('');empty.hidden=items.length>0;bindHistoryActions(historyList)}
  const editing=state.history.find(item=>item.id===state.editingId),title=document.querySelector('#save-title'),explanation=document.querySelector('#save-explanation'),copy=document.querySelector('#save-copy');if(title){title.textContent=editing?'Editando una operación':'Guardar operación';explanation.textContent=editing?'Guardar actualiza este registro. La copia conserva el anterior.':'Guardar crea un registro nuevo en el historial.';copy.hidden=!editing}
}

function bindHistoryActions(root){
  root.querySelectorAll('[data-recover]').forEach(button=>button.addEventListener('click',()=>{const item=state.history.find(value=>value.id===button.dataset.recover);if(!item)return;state.concept='';state.editingId='';setExpression(formatNumber(item.result).replace(/\./g,''));state.result=item.result;render();persist()}));
  root.querySelectorAll('[data-edit]').forEach(button=>button.addEventListener('click',()=>{const item=state.history.find(value=>value.id===button.dataset.edit);if(!item)return;state.expression=item.expression;state.result=item.result;state.concept=item.concept;state.editingId=item.id;undoStack=[];redoStack=[];render();persist()}));
}

function storeOperation(copy=false){if(!calculate())return;state.history=saveHistory(state.history,{concept:state.concept,expression:state.expression,result:state.result},{editingId:state.editingId,copy});state.editingId='';render();persist()}

async function openFloating(){
  const help=document.querySelector('#floating-help');
  if('documentPictureInPicture'in window){
    const pip=await window.documentPictureInPicture.requestWindow({width:380,height:690});pip.document.title='Calculadora ODÍN';
    for(const href of ['/src/styles/global.css?v=calculator-1','/preview-calculator/calculator.css?v=1']){const link=pip.document.createElement('link');link.rel='stylesheet';link.href=href;pip.document.head.append(link)}
    pip.document.body.className='tool-page calculator-body floating-shell';const main=pip.document.createElement('main');main.className='calculator-page';const layout=pip.document.createElement('div');layout.className='calculator-layout';const panel=document.querySelector('.calculator-panel').cloneNode(true);layout.append(panel);main.append(layout);pip.document.body.append(main);const view=bindView(panel);pip.addEventListener('pagehide',()=>{views=views.filter(item=>item!==view);render()});help.hidden=true;return;
  }
  window.open('/preview-calculator/?floating=1','odin-calculator','popup,width=390,height=720,resizable=yes');help.textContent='Este navegador no admite la ventana siempre visible. Se ha abierto una ventana compacta sincronizada.';help.hidden=false;
}

if(new URLSearchParams(location.search).has('floating'))document.body.classList.add('floating-shell');
bindView(document.querySelector('.calculator-panel'));
document.querySelector('#history-search')?.addEventListener('input',render);
document.querySelector('#toggle-history')?.addEventListener('click',event=>{state.historyVisible=!state.historyVisible;document.querySelector('#calculator-layout').classList.toggle('history-hidden',!state.historyVisible);event.currentTarget.textContent=state.historyVisible?'Ocultar historial':'Mostrar historial';event.currentTarget.setAttribute('aria-pressed',String(state.historyVisible));persist()});
document.querySelector('#save-operation')?.addEventListener('click',()=>storeOperation(false));document.querySelector('#save-copy')?.addEventListener('click',()=>storeOperation(true));
document.querySelector('#clear-history')?.addEventListener('click',()=>{if(state.history.length&&confirm('¿Vaciar todo el historial de la calculadora?')){state.history=[];state.editingId='';render();persist()}});
document.querySelector('#open-floating')?.addEventListener('click',()=>openFloating().catch(error=>{const help=document.querySelector('#floating-help');help.textContent=`No se pudo abrir la ventana flotante: ${error.message}`;help.hidden=false}));
document.querySelector('#calculator-layout')?.classList.toggle('history-hidden',!state.historyVisible);const toggle=document.querySelector('#toggle-history');if(toggle){toggle.textContent=state.historyVisible?'Ocultar historial':'Mostrar historial';toggle.setAttribute('aria-pressed',String(state.historyVisible))}
channel?.addEventListener('message',event=>{const incoming=normalizeState(event.data);if(incoming.updatedAt>state.updatedAt){state=incoming;render()}});window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY&&event.newValue){const incoming=normalizeState(JSON.parse(event.newValue));if(incoming.updatedAt>state.updatedAt){state=incoming;render()}}});
render();
