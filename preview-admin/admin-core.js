import {COUNTDOWN_CATEGORY_IDS,normalizeCountdownItem,normalizeCountdownState} from '../countdown-data.js?v=2';
import {LOCAL_HOLIDAY_SEED_VERSION} from '../calendar-data.js?v=2';

export const BACKUP_FORMAT = 'odin-copia-v2';
export const LEGACY_BACKUP_FORMAT = 'odin-copia-v1';
export const PERIOD_FORMAT = 'odin-periodos-v1';

export const SECTIONS = [
  { id:'alarmas', label:'Alarmas', group:'data', key:'odin-alarms-v1' },
  { id:'cuentas_atras', label:'Acontecimientos y cuentas atrás', group:'data', key:'odin-countdowns-v1' },
  { id:'vacaciones', label:'Vacaciones', group:'data', key:'odin-calendar-v1', kind:'periods', periodType:'vacation' },
  { id:'otros_festivos', label:'Otros y festivos locales', group:'data', key:'odin-calendar-v1', kind:'periods', periodType:'other' },
  { id:'reloj_negro', label:'Reloj negro', group:'preferences', key:'odin:u01:sony-clock:v1' },
  { id:'temporizador', label:'Temporizador y cronómetro', group:'preferences', key:'odin-timer-v1' },
  { id:'pomodoro', label:'Concentración · Pomodoro', group:'preferences', key:'odin-focus-v1' },
  { id:'calendario', label:'Vista y colores del calendario', group:'preferences', key:'odin-calendar-v1', kind:'calendar-preferences' },
  { id:'calculadora_fechas', label:'Calculadora de fechas', group:'preferences', key:'odin-date-calculator-v1' },
  { id:'conversor', label:'Conversor y cambios manuales', group:'preferences', key:'odin-converter-v1' },
  { id:'qr', label:'Generador QR', group:'preferences', key:'odin-qr-preferences-v1' },
  { id:'codificador', label:'Codificador de texto y URL', group:'preferences', key:'odin-codec-preferences-v1' },
  { id:'contrasenas', label:'Generador de contraseñas', group:'preferences', key:'odin-password-settings-v2' },
];

const byId = id => SECTIONS.find(section => section.id === id);
const parseJson = value => { try { return value ? JSON.parse(value) : null; } catch { return null; } };
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const uuid = () => globalThis.crypto?.randomUUID?.() || `odin-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function validIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const [year,month,day] = value.split('-').map(Number), date = new Date(Date.UTC(year,month-1,day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month-1 && date.getUTCDate() === day;
}

function externalPeriod(item, fallbackType) {
  const type = (item.type || fallbackType) === 'other' || item.tipo === 'otros' ? 'otros' : 'vacaciones';
  return {
    tipo:type,
    nombre:String(item.name ?? item.nombre ?? '').trim(),
    desde:String(item.start ?? item.desde ?? ''),
    hasta:String(item.end ?? item.hasta ?? item.start ?? item.desde ?? ''),
    lugar:String(item.place ?? item.lugar ?? '').trim(),
    descripcion:String(item.description ?? item.descripcion ?? '').trim(),
  };
}

function internalPeriod(item, fallbackType) {
  const period = externalPeriod(item, fallbackType);
  if (!period.nombre) throw new Error('Cada periodo necesita un nombre.');
  if (!validIsoDate(period.desde) || !validIsoDate(period.hasta)) throw new Error(`Fechas no válidas en «${period.nombre}». Usa AAAA-MM-DD.`);
  if (period.hasta < period.desde) throw new Error(`La fecha final de «${period.nombre}» es anterior a la inicial.`);
  return { id:item.id || uuid(), name:period.nombre, start:period.desde, end:period.hasta, type:period.tipo === 'otros' ? 'other' : 'vacation', ...(period.lugar ? {place:period.lugar} : {}), ...(period.descripcion ? {description:period.descripcion} : {}) };
}

export function readSection(storage, id) {
  const section = byId(id); if (!section) throw new Error(`Sección desconocida: ${id}`);
  const stored = parseJson(storage.getItem(section.key));
  if (section.kind === 'periods') return (Array.isArray(stored?.vacations) ? stored.vacations : []).filter(item => (item.type === 'other' ? 'other' : 'vacation') === section.periodType).map(item => externalPeriod(item, section.periodType));
  if (section.kind === 'calendar-preferences') return stored ? { colors:clone(stored.colors || {}), layers:clone(stored.layers || {}), view:clone(stored.view || {}) } : null;
  if (id === 'cuentas_atras') return normalizeCountdownState(stored || {});
  return clone(stored);
}

export function sectionCount(id, value) {
  if (id === 'alarmas') return Array.isArray(value?.alarms) ? value.alarms.length : 0;
  if (id === 'cuentas_atras') return Array.isArray(value?.personal) ? value.personal.length : 0;
  if (id === 'vacaciones' || id === 'otros_festivos') return Array.isArray(value) ? value.length : 0;
  return value == null ? 0 : 1;
}

export function buildBackup(storage, ids = SECTIONS.map(section => section.id), now = new Date()) {
  const sections = {};
  for (const id of ids) sections[id] = readSection(storage,id);
  return { formato:BACKUP_FORMAT, version:2, creado:now.toISOString(), origen:'ODÍN', secciones:sections };
}

export function periodTemplate(type='otros') {
  return { formato:PERIOD_FORMAT, version:1, tipo:type, periodos:[{ nombre:type === 'vacaciones' ? 'Vacaciones' : 'Nombre del festivo', desde:'2027-01-01', hasta:'2027-01-01', ...(type === 'otros' ? {lugar:'Ciudad',descripcion:'Festivo local'} : {}) }] };
}

function csvEscape(value) {
  const text=String(value ?? ''); return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g,'""')}"` : text;
}

export function periodsToCsv(sections) {
  const rows=[['tipo','nombre','desde','hasta','lugar','descripcion']];
  for(const id of ['vacaciones','otros_festivos']) for(const item of sections[id] || []) { const period=externalPeriod(item,id === 'otros_festivos' ? 'other' : 'vacation'); rows.push([period.tipo,period.nombre,period.desde,period.hasta,period.lugar,period.descripcion]); }
  return rows.map(row=>row.map(csvEscape).join(';')).join('\r\n');
}

const categoryNames={birthday:'cumpleaños',saint:'santos',anniversary:'aniversarios',reminder:'recordatorios'};
const categoryIds={cumpleaños:'birthday',cumpleanos:'birthday',santos:'saint',santo:'saint',aniversarios:'anniversary',aniversario:'anniversary',recordatorios:'reminder',recordatorio:'reminder'};
const yes=value=>['si','sí','true','1','yes'].includes(String(value??'').trim().toLocaleLowerCase('es'));
export function countdownsToCsv(value,category='all'){
  const rows=[['categoria','nombre','dia','mes','anio','hora','repeticion_anual','anio_conocido']];
  for(const item of normalizeCountdownState(value||{}).personal.filter(item=>category==='all'||item.category===category))rows.push([categoryNames[item.category],item.name,item.day,item.month,item.year??'',item.time,item.annual?'si':'no',item.yearKnown?'si':'no']);
  return rows.map(row=>row.map(csvEscape).join(';')).join('\r\n');
}

function parseCsvRows(text) {
  const rows=[]; let row=[],field='',quoted=false;
  for(let index=0;index<text.length;index+=1){const char=text[index];if(quoted){if(char==='"'&&text[index+1]==='"'){field+='"';index+=1;}else if(char==='"')quoted=false;else field+=char;}else if(char==='"')quoted=true;else if(char===';'){row.push(field);field='';}else if(char==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field='';}else field+=char;}
  row.push(field.replace(/\r$/,''));if(row.some(value=>value!==''))rows.push(row);return rows;
}

function parsePeriodsCsv(text) {
  const rows=parseCsvRows(text.replace(/^\uFEFF/,'')); if(rows.length<2)throw new Error('El CSV no contiene periodos.');
  const headers=rows[0].map(value=>value.trim().toLowerCase()),required=['tipo','nombre','desde','hasta'];
  if(required.some(name=>!headers.includes(name)))throw new Error('El CSV debe incluir: tipo;nombre;desde;hasta.');
  const sections={vacaciones:[],otros_festivos:[]};
  for(const row of rows.slice(1)){if(!row.some(value=>value.trim()))continue;const item=Object.fromEntries(headers.map((name,index)=>[name,row[index]??''])),type=item.tipo.trim().toLowerCase();if(!['vacaciones','otros','otro'].includes(type))throw new Error(`Tipo CSV no reconocido: ${item.tipo}`);const id=type==='vacaciones'?'vacaciones':'otros_festivos';sections[id].push(externalPeriod(item,id==='otros_festivos'?'other':'vacation'));}
  return Object.fromEntries(Object.entries(sections).filter(([,items])=>items.length));
}

function parseCountdownsCsv(text){
  const rows=parseCsvRows(text.replace(/^\uFEFF/,''));if(rows.length<2)throw new Error('El CSV no contiene acontecimientos.');
  const headers=rows[0].map(value=>value.trim().toLocaleLowerCase('es')),required=['categoria','nombre','dia','mes','anio','hora','repeticion_anual','anio_conocido'];
  if(required.some(name=>!headers.includes(name)))throw new Error('El CSV debe incluir: categoria;nombre;dia;mes;anio;hora;repeticion_anual;anio_conocido.');
  const personal=[];
  for(const row of rows.slice(1)){if(!row.some(value=>value.trim()))continue;const raw=Object.fromEntries(headers.map((name,index)=>[name,row[index]??''])),category=categoryIds[raw.categoria.trim().toLocaleLowerCase('es')];if(!category)throw new Error(`Categoría no reconocida: ${raw.categoria}`);const yearKnown=category!=='birthday'||yes(raw.anio_conocido),year=yearKnown?Number(raw.anio):null,month=Number(raw.mes),day=Number(raw.dia);if(!raw.nombre.trim()||!month||!day||(yearKnown&&!year))throw new Error(`Faltan datos en el acontecimiento «${raw.nombre||'sin nombre'}».`);personal.push(normalizeCountdownItem({id:uuid(),name:raw.nombre,category,year,month,day,time:raw.hora||'00:00',annual:yes(raw.repeticion_anual),yearKnown,enabled:true}));}
  return{cuentas_atras:{personal}};
}

export function parseImport(text, filename='') {
  if(typeof text!=='string'||!text.trim())throw new Error('El archivo o texto está vacío.');
  if(text.length>2_000_000)throw new Error('El archivo supera el límite de 2 MB.');
  if(filename.toLowerCase().endsWith('.csv') || (!text.trim().startsWith('{') && text.includes(';'))){const header=parseCsvRows(text.replace(/^\uFEFF/,''))[0]?.map(value=>value.trim().toLocaleLowerCase('es'))||[];return header.includes('categoria')?{formato:'odin-csv-acontecimientos-v1',secciones:parseCountdownsCsv(text)}:{formato:'odin-csv-periodos-v1',secciones:parsePeriodsCsv(text)};}
  let value;try{value=JSON.parse(text)}catch{throw new Error('El JSON no es válido. Revisa comas, llaves y comillas.');}
  if([BACKUP_FORMAT,LEGACY_BACKUP_FORMAT].includes(value?.formato) && value.secciones && typeof value.secciones==='object'){
    const sections={};for(const [id,data] of Object.entries(value.secciones))if(byId(id)){if(id==='cuentas_atras'){const normalized=normalizeCountdownState(data||{});for(const field of ['defaults','notifiedDefaults','settings'])if(!Object.prototype.hasOwnProperty.call(data||{},field))delete normalized[field];sections[id]=normalized}else sections[id]=clone(data)}if(!Object.keys(sections).length)throw new Error('La copia no contiene secciones compatibles.');return{formato:value.formato,secciones:sections};
  }
  if(value?.formato===PERIOD_FORMAT && Array.isArray(value.periodos)){
    const sections={vacaciones:[],otros_festivos:[]};for(const item of value.periodos){const type=(item.tipo||value.tipo||'otros').toLowerCase(),id=type==='vacaciones'?'vacaciones':'otros_festivos';sections[id].push(externalPeriod(item,id==='otros_festivos'?'other':'vacation'));}return{formato:PERIOD_FORMAT,secciones:Object.fromEntries(Object.entries(sections).filter(([,items])=>items.length))};
  }
  throw new Error(`Formato no reconocido. Utiliza ${BACKUP_FORMAT} o ${PERIOD_FORMAT}.`);
}

function mergeUnique(existing,incoming,keyOf){const seen=new Set(existing.map(keyOf)),result=[...existing];for(const item of incoming){const key=keyOf(item);if(!seen.has(key)){seen.add(key);result.push(item)}}return result}
const alarmKey=item=>item.id||`${item.time}|${item.label}|${(item.days||[]).join(',')}`;
const countdownKey=item=>item.id||`${item.category}|${item.name}|${item.year||''}-${item.month}-${item.day}|${item.time}|${item.annual}`;
const periodKey=item=>`${item.type}|${item.name.toLocaleLowerCase('es')}|${item.start}|${item.end}`;

export function applySections(storage, sections, selectedIds=Object.keys(sections), mode='merge') {
  const applied=[];
  for(const id of selectedIds){if(!(id in sections)||!byId(id))continue;const section=byId(id),incoming=clone(sections[id]);
    if(section.kind==='periods'){
      const calendar=parseJson(storage.getItem(section.key))||{},all=Array.isArray(calendar.vacations)?calendar.vacations:[],keep=all.filter(item=>(item.type==='other'?'other':'vacation')!==section.periodType),current=all.filter(item=>(item.type==='other'?'other':'vacation')===section.periodType),next=(incoming||[]).map(item=>internalPeriod(item,section.periodType));calendar.vacations=[...keep,...(mode==='merge'?mergeUnique(current,next,periodKey):next)];if(section.periodType==='other')calendar.localHolidaySeedVersion=LOCAL_HOLIDAY_SEED_VERSION;storage.setItem(section.key,JSON.stringify(calendar));
    }else if(section.kind==='calendar-preferences'){
      const calendar=parseJson(storage.getItem(section.key))||{};if(incoming==null){if(mode==='merge')continue;delete calendar.colors;delete calendar.layers;delete calendar.view;}else{calendar.colors=clone(incoming.colors||{});calendar.layers=clone(incoming.layers||{});calendar.view=clone(incoming.view||{});}storage.setItem(section.key,JSON.stringify(calendar));
    }else if(incoming==null){if(mode==='merge')continue;storage.removeItem(section.key);}
    else if(mode==='merge'&&id==='alarmas'){const current=parseJson(storage.getItem(section.key))||{alarms:[]};current.alarms=mergeUnique(Array.isArray(current.alarms)?current.alarms:[],Array.isArray(incoming.alarms)?incoming.alarms:[],alarmKey);storage.setItem(section.key,JSON.stringify(current));}
    else if(mode==='merge'&&id==='cuentas_atras'){const current=normalizeCountdownState(parseJson(storage.getItem(section.key))||{}),next=normalizeCountdownState(incoming||{}),merged={...current,personal:mergeUnique(current.personal,next.personal,countdownKey)};if(Object.prototype.hasOwnProperty.call(incoming||{},'defaults'))merged.defaults={...current.defaults,...next.defaults};if(Object.prototype.hasOwnProperty.call(incoming||{},'notifiedDefaults'))merged.notifiedDefaults={...current.notifiedDefaults,...next.notifiedDefaults};if(Object.prototype.hasOwnProperty.call(incoming||{},'settings'))merged.settings={...current.settings,...next.settings};storage.setItem(section.key,JSON.stringify(normalizeCountdownState(merged)));}
    else if(id==='cuentas_atras')storage.setItem(section.key,JSON.stringify(normalizeCountdownState(incoming||{})));
    else storage.setItem(section.key,JSON.stringify(incoming));applied.push(id);
  }
  return applied;
}

export function resetSections(storage, ids) {
  for(const id of ids){const section=byId(id);if(!section)continue;
    if(section.kind==='periods'){const calendar=parseJson(storage.getItem(section.key))||{},all=Array.isArray(calendar.vacations)?calendar.vacations:[];calendar.vacations=all.filter(item=>(item.type==='other'?'other':'vacation')!==section.periodType);storage.setItem(section.key,JSON.stringify(calendar));}
    else if(section.kind==='calendar-preferences'){const calendar=parseJson(storage.getItem(section.key))||{};delete calendar.colors;delete calendar.layers;delete calendar.view;storage.setItem(section.key,JSON.stringify(calendar));}
    else storage.removeItem(section.key);
  }
}

export function validateImportedSections(sections) {
  let total=0;for(const [id,data] of Object.entries(sections)){if(!byId(id))continue;if(id==='vacaciones'||id==='otros_festivos'){if(!Array.isArray(data))throw new Error(`${byId(id).label} debe ser una lista.`);for(const item of data)internalPeriod(item,id==='otros_festivos'?'other':'vacation');total+=data.length;}else if(id==='cuentas_atras'){const normalized=normalizeCountdownState(data||{});for(const item of normalized.personal){if(!COUNTDOWN_CATEGORY_IDS.includes(item.category)||!item.name||item.month<1||item.month>12||item.day<1||item.day>31)throw new Error('Hay un acontecimiento personal no válido.');}total+=normalized.personal.length;}else total+=sectionCount(id,data);if(total>2000)throw new Error('La importación supera el límite de 2.000 elementos.');}return true;
}
