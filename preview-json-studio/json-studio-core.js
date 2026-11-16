export const MAX_FILE_BYTES=5*1024*1024;
export const EXAMPLE_DATA=[
  {id:1,nombre:'Ana Torres',estado:'Activo',etiquetas:['ventas','2026','prioridad alta'],contactos:{emails:['ana@empresa.com','ana.personal@ejemplo.com'],telefonos:['611223344','933445566']}},
  {id:2,nombre:'Carlos Méndez',estado:'Activo',etiquetas:['marketing','2026'],contactos:{emails:['carlos@empresa.com'],telefonos:['600987654']}},
  {id:3,nombre:'Lucía Romero',estado:'En revisión',etiquetas:['producto','beta'],contactos:{emails:['lucia@empresa.com'],telefonos:[]}}
];

export const clone=value=>structuredClone(value);
export const jsonType=value=>value===null?'null':Array.isArray(value)?'array':typeof value;
export function parseJson(text){try{return{ok:true,value:JSON.parse(text)}}catch(error){return{ok:false,error:error.message}}}
export function formatJson(value){return JSON.stringify(value,null,2)}
export function pathLabel(path){return path.length?'$'+path.map(part=>typeof part==='number'?`[${part}]`:/^[A-Za-z_$][\w$]*$/.test(part)?`.${part}`:`[${JSON.stringify(part)}]`).join(''):'$'}
export function getAtPath(root,path){return path.reduce((value,key)=>value?.[key],root)}
export function setAtPath(root,path,value){if(!path.length)return clone(value);const next=clone(root);let target=next;for(const key of path.slice(0,-1))target=target[key];target[path.at(-1)]=clone(value);return next}
export function addAtPath(root,path,value){const next=clone(root),target=getAtPath(next,path);if(Array.isArray(target))target.push(clone(value));else if(target&&typeof target==='object'){let key='nuevo_campo',index=2;while(Object.hasOwn(target,key))key=`nuevo_campo_${index++}`;target[key]=clone(value)}else throw new Error('Solo se pueden añadir elementos a arrays u objetos.');return next}
export function removeAtPath(root,path){if(!path.length)throw new Error('No se puede eliminar el documento completo.');const next=clone(root),parent=getAtPath(next,path.slice(0,-1)),key=path.at(-1);if(Array.isArray(parent))parent.splice(Number(key),1);else delete parent[key];return next}

function scalarText(value){return typeof value==='string'?value:JSON.stringify(value)}
export function searchDocument(root,query){const needle=query.trim().toLocaleLowerCase('es');if(!needle)return[];const matches=[];function visit(value,path){if(path.length&&String(path.at(-1)).toLocaleLowerCase('es').includes(needle))matches.push({path,kind:'clave'});if(value===null||typeof value!=='object'){if(scalarText(value).toLocaleLowerCase('es').includes(needle))matches.push({path,kind:'valor'});return}for(const [key,item] of Object.entries(value))visit(item,[...path,Array.isArray(value)?Number(key):key])}visit(root,[]);return matches}
const isRecordArray=value=>Array.isArray(value)&&value.length>0&&value.every(item=>item&&typeof item==='object'&&!Array.isArray(item));
export function findTables(root){const tables=[];function visit(value,path){if(isRecordArray(value)){tables.push({path,rows:value,columns:[...new Set(value.flatMap(Object.keys))]});return}if(value&&typeof value==='object'&&!Array.isArray(value))for(const[key,item]of Object.entries(value))visit(item,[...path,key])}visit(root,[]);return tables}
export function tableModel(root,path=[]){const rows=getAtPath(root,path);if(!isRecordArray(rows))return null;return{path:[...path],rows,columns:[...new Set(rows.flatMap(Object.keys))]}}
export function displayValue(value){if(value===undefined)return'—';if(value===null)return'null';if(typeof value==='object')return JSON.stringify(value);return String(value)}

export function pathAtOffset(text,offset){let index=0,best=[];const inside=(start,end)=>offset>=start&&offset<=end;function whitespace(){while(/\s/.test(text[index]??''))index++}function string(){const start=index++;while(index<text.length){if(text[index]==='\\'){index+=2;continue}if(text[index++]==='"')break}return[start,index]}function value(path){whitespace();const start=index;if(text[index]==='"')string();else if(text[index]==='{'){index++;whitespace();while(index<text.length&&text[index]!=='}'){const keyRange=string(),key=JSON.parse(text.slice(keyRange[0],keyRange[1]));whitespace();index++;value([...path,key]);whitespace();if(text[index]===','){index++;whitespace()}if(inside(...keyRange))best=[...path,key]}index++}else if(text[index]==='['){index++;whitespace();let item=0;while(index<text.length&&text[index]!==']'){value([...path,item++]);whitespace();if(text[index]===','){index++;whitespace()}}index++}else while(index<text.length&&!/[\s,}\]]/.test(text[index]))index++;if(inside(start,index)&&path.length>=best.length)best=[...path]}try{value([]);return best}catch{return[]}}

function csvCell(value){const text=String(value??'');return /[",\r\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text}
export function toCsv(root,path=[]){const model=tableModel(root,path);if(!model)throw new Error('CSV requiere una tabla de objetos. Selecciona una colección en la vista Tabla.');const lines=[model.columns.map(csvCell).join(',')];for(const row of model.rows)lines.push(model.columns.map(column=>{const value=row[column];return csvCell(value&&typeof value==='object'?JSON.stringify(value):value)}).join(','));return lines.join('\r\n')}
const xmlName=name=>{const clean=String(name).replace(/[^A-Za-z0-9_.-]/g,'_');return /^[A-Za-z_]/.test(clean)?clean:`campo_${clean}`};
const escapeXml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
function xmlNode(name,value,indent='  '){const tag=xmlName(name),type=jsonType(value);if(value===null)return`${indent}<${tag} tipo="null"/>`;if(Array.isArray(value)){if(!value.length)return`${indent}<${tag} tipo="array"/>`;return`${indent}<${tag} tipo="array">\n${value.map(item=>xmlNode('elemento',item,indent+'  ')).join('\n')}\n${indent}</${tag}>`}if(type==='object'){const entries=Object.entries(value);if(!entries.length)return`${indent}<${tag} tipo="objeto"/>`;return`${indent}<${tag} tipo="objeto">\n${entries.map(([key,item])=>xmlNode(key,item,indent+'  ')).join('\n')}\n${indent}</${tag}>`}return`${indent}<${tag} tipo="${type==='string'?'texto':type}">${escapeXml(value)}</${tag}>`}
export function toXml(root){return`<?xml version="1.0" encoding="UTF-8"?>\n<documento formato="odin-json-studio-v1">\n${xmlNode('raiz',root)}\n</documento>\n`}
