import {categories,categoryById,convertValue,formatNumber,parseLocalizedNumber,unitById} from './converter-core.js?v=1';

const STORAGE_KEY='odin-converter-v1',MAX_FAVORITES=8,MAX_RECENTS=6;
const primaryIds=['length','mass','temperature','area','volume','currency'];
const $=selector=>document.querySelector(selector);
const initial={category:'length',precision:'auto',selections:{},rates:{},favorites:[],recents:[]};
let state=load(),lastEdited='source';

function load(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');return{...structuredClone(initial),...saved,selections:saved.selections||{},rates:saved.rates||{},favorites:Array.isArray(saved.favorites)?saved.favorites:[],recents:Array.isArray(saved.recents)?saved.recents:[]}}catch{return structuredClone(initial)}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
function localDate(){const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`}
function currentCategory(){return categoryById(state.category)}
function currentUnits(){return[$('#source-unit').value,$('#target-unit').value]}
function rateKey(from,to){return `${from}:${to}`}

function renderCategoryButtons(){
  const button=category=>`<button type="button" data-category="${category.id}" class="${category.id===state.category?'active':''}"><i>${category.icon}</i><span>${category.label}</span></button>`;
  $('#primary-categories').innerHTML=categories.filter(category=>primaryIds.includes(category.id)).map(button).join('');
  $('#secondary-categories').innerHTML=categories.filter(category=>!primaryIds.includes(category.id)).map(button).join('');
  $('#category-count').textContent=categories.length;
}

function activateCategory(id,{preserveValue=false}={}){
  const category=categoryById(id);state.category=category.id;
  $('#more-categories').open=false;
  const selected=state.selections[category.id]||category.defaults;
  const options=category.units.map(unit=>`<option value="${unit.id}">${escapeHtml(unit.label)} (${escapeHtml(unit.symbol)})</option>`).join('');
  $('#source-unit').innerHTML=options;$('#target-unit').innerHTML=options;$('#source-unit').value=selected[0];$('#target-unit').value=selected[1];
  if(!preserveValue)$('#source-value').value=category.id==='currency'?'100':'24';
  $('#category-kicker').textContent=category.label.toUpperCase();$('#category-title').textContent=category.id==='currency'?'Convierte con tu tipo de cambio':'Convierte una medida';
  $('#currency-settings').hidden=!category.manual;
  state.selections[category.id]=[selected[0],selected[1]];state.precision=$('#precision').value||state.precision;
  loadCurrencyRate();renderCategoryButtons();renderCategoryHelp();save();lastEdited='source';updateConversion();renderMemory();
}

function renderCategoryHelp(){
  const notes={temperature:['Escalas de temperatura','La conversión pasa por Kelvin para mantener la equivalencia entre escalas.'],volume:['Volumen estadounidense y británico','Las pintas y galones US y UK están separados porque no representan el mismo volumen.'],data:['Sistema decimal y binario','KB, MB y GB utilizan base 1000; KiB, MiB y GiB utilizan base 1024.'],time:['Duraciones aproximadas','Para años se utiliza el año medio de 365,25 días.'],currency:['Cambio introducido por ti','ODÍN no descarga cotizaciones. Guarda el último cambio manual de cada pareja de monedas.']};
  const [label,note]=notes[state.category]||['Conversión normalizada','Las equivalencias utilizan factores exactos cuando están definidos oficialmente.'];$('#system-label').textContent=label;$('#system-note').textContent=note;
}

function loadCurrencyRate(){
  if(state.category!=='currency')return;
  const [from,to]=currentUnits(),direct=state.rates[rateKey(from,to)],reverse=state.rates[rateKey(to,from)];
  let rate='',date=localDate();
  if(from===to)rate='1';else if(direct){rate=direct.rate;date=direct.date||date}else if(reverse?.rate>0){rate=1/reverse.rate;date=reverse.date||date}
  $('#exchange-rate').value=rate?formatNumber(Number(rate),'auto'):'';$('#rate-date').value=date;updateRateLabels();
}
function updateRateLabels(){const [from,to]=currentUnits();$('#rate-label').textContent=`1 ${from} equivale a`;$('#rate-currency').textContent=to}
function storeRate(){
  if(state.category!=='currency')return;
  const [from,to]=currentUnits(),rate=parseLocalizedNumber($('#exchange-rate').value);if(rate>0&&from!==to)state.rates[rateKey(from,to)]={rate,date:$('#rate-date').value||localDate()};save();
}

function updateConversion(){
  const category=currentCategory(),[fromId,toId]=currentUnits(),precision=$('#precision').value,source=parseLocalizedNumber($('#source-value').value),target=parseLocalizedNumber($('#target-value').value),rate=category.manual?(fromId===toId?1:parseLocalizedNumber($('#exchange-rate').value)):1;
  let result;
  if(lastEdited==='target'){
    result=category.manual?convertValue(target,category.id,toId,fromId,rate>0?1/rate:NaN):convertValue(target,category.id,toId,fromId);
    $('#source-value').value=formatNumber(result,precision);
  }else{
    result=convertValue(source,category.id,fromId,toId,rate);
    $('#target-value').value=formatNumber(result,precision);
  }
  const from=unitById(category,fromId),to=unitById(category,toId),equivalence=category.manual?(rate>0?rate:NaN):convertValue(1,category.id,fromId,toId);
  $('#conversion-equivalence').textContent=Number.isFinite(equivalence)?`1 ${from.symbol} = ${formatNumber(equivalence,precision)} ${to.symbol}`:'Introduce el tipo de cambio para calcular';
  $('#conversion-note').textContent=category.manual?($('#rate-date').value?`Cambio manual fechado el ${new Intl.DateTimeFormat('es-ES').format(new Date($('#rate-date').value+'T12:00:00'))}.`:'Añade también la fecha del cambio.'):'Escribe en cualquiera de los dos campos.';
  state.selections[category.id]=[fromId,toId];state.precision=precision;save();
}

function swapUnits(){
  const sourceUnit=$('#source-unit').value,targetUnit=$('#target-unit').value,sourceValue=$('#source-value').value,targetValue=$('#target-value').value;
  $('#source-unit').value=targetUnit;$('#target-unit').value=sourceUnit;$('#source-value').value=targetValue;$('#target-value').value=sourceValue;
  if(state.category==='currency'){const rate=parseLocalizedNumber($('#exchange-rate').value);$('#exchange-rate').value=rate>0?formatNumber(1/rate,'auto'):'';updateRateLabels();storeRate()}
  state.selections[state.category]=[targetUnit,sourceUnit];lastEdited='source';save();updateConversion();
}

function favoriteLabel(item){const category=categoryById(item.category),from=unitById(category,item.from),to=unitById(category,item.to);return`${category.label}: ${from.symbol} → ${to.symbol}`}
function saveFavorite(){
  const [from,to]=currentUnits(),exists=state.favorites.some(item=>item.category===state.category&&item.from===from&&item.to===to);
  if(exists){showStatus('Esta combinación ya está guardada.');return}if(state.favorites.length>=MAX_FAVORITES){showStatus('Has alcanzado el límite de 8 combinaciones.');return}
  state.favorites.push({id:crypto.randomUUID(),category:state.category,from,to});save();renderMemory();showStatus('Combinación guardada.');
}
function recordRecent(){
  const source=$('#source-value').value,target=$('#target-value').value;if(!source||!target)return;const [from,to]=currentUnits(),category=currentCategory();
  state.recents=state.recents.filter(item=>!(item.category===category.id&&item.from===from&&item.to===to&&item.source===source));state.recents.unshift({id:crypto.randomUUID(),category:category.id,from,to,source,target,at:Date.now()});state.recents=state.recents.slice(0,MAX_RECENTS);save();renderMemory();
}
function renderMemory(){
  $('#favorite-count').textContent=`${state.favorites.length} de ${MAX_FAVORITES}`;$('#favorite-list').innerHTML=state.favorites.length?state.favorites.map(item=>`<div class="memory-item"><button type="button" data-load-favorite="${item.id}"><b>${escapeHtml(favoriteLabel(item))}</b><small>Abrir combinación</small></button><button type="button" data-remove-favorite="${item.id}" aria-label="Eliminar combinación">×</button></div>`).join(''):'<p class="memory-empty">Todavía no has guardado combinaciones.</p>';
  $('#recent-list').innerHTML=state.recents.length?state.recents.map(item=>{const category=categoryById(item.category),from=unitById(category,item.from),to=unitById(category,item.to);return`<button class="recent-item" type="button" data-load-recent="${item.id}"><span>${escapeHtml(category.label)}</span><b>${escapeHtml(item.source)} ${escapeHtml(from.symbol)} <i>→</i> ${escapeHtml(item.target)} ${escapeHtml(to.symbol)}</b></button>`}).join(''):'<p class="memory-empty">Las últimas conversiones aparecerán aquí.</p>';
}
function loadCombination(item,values){activateCategory(item.category,{preserveValue:true});$('#source-unit').value=item.from;$('#target-unit').value=item.to;state.selections[item.category]=[item.from,item.to];if(values){$('#source-value').value=item.source;$('#target-value').value=item.target}loadCurrencyRate();lastEdited='source';updateConversion();scrollTo({top:0,behavior:'smooth'});}
function showStatus(message){const status=$('#copy-status');status.textContent=message;status.hidden=false;clearTimeout(showStatus.timer);showStatus.timer=setTimeout(()=>status.hidden=true,2400)}
async function copyField(id){try{await navigator.clipboard.writeText($('#'+id).value);showStatus('Valor copiado.') }catch{showStatus('No se ha podido copiar el valor.')}}

document.querySelector('.converter-categories').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(button)activateCategory(button.dataset.category)});
$('#source-value').addEventListener('input',()=>{lastEdited='source';updateConversion()});$('#target-value').addEventListener('input',()=>{lastEdited='target';updateConversion()});
$('#source-value').addEventListener('change',recordRecent);$('#target-value').addEventListener('change',recordRecent);
for(const select of [$('#source-unit'),$('#target-unit')])select.addEventListener('change',()=>{state.selections[state.category]=currentUnits();loadCurrencyRate();updateConversion()});
$('#precision').value=state.precision;$('#precision').addEventListener('change',updateConversion);$('#swap-units').addEventListener('click',swapUnits);$('#save-favorite').addEventListener('click',saveFavorite);
$('#exchange-rate').addEventListener('input',()=>{lastEdited='source';storeRate();updateConversion()});$('#rate-date').addEventListener('change',()=>{storeRate();updateConversion()});
for(const button of document.querySelectorAll('[data-copy]'))button.addEventListener('click',()=>copyField(button.dataset.copy));
$('#favorite-list').addEventListener('click',event=>{const loadButton=event.target.closest('[data-load-favorite]'),removeButton=event.target.closest('[data-remove-favorite]');if(loadButton){const item=state.favorites.find(entry=>entry.id===loadButton.dataset.loadFavorite);if(item)loadCombination(item)}if(removeButton){state.favorites=state.favorites.filter(item=>item.id!==removeButton.dataset.removeFavorite);save();renderMemory()}});
$('#recent-list').addEventListener('click',event=>{const button=event.target.closest('[data-load-recent]');if(button){const item=state.recents.find(entry=>entry.id===button.dataset.loadRecent);if(item)loadCombination(item,true)}});$('#clear-recents').addEventListener('click',()=>{state.recents=[];save();renderMemory()});
renderCategoryButtons();activateCategory(state.category,{preserveValue:true});
