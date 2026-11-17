const OPERATORS={'+':'+','−':'-','-':'-','×':'*','*':'*','÷':'/','/':'/'};

export function tokenize(source){
  const input=String(source??'').trim(),tokens=[];let index=0;
  while(index<input.length){
    const char=input[index];
    if(/\s/.test(char)){index++;continue}
    if(/[\d.,]/.test(char)){
      let raw='';
      while(index<input.length&&/[\d.,]/.test(input[index]))raw+=input[index++];
      const lastComma=raw.lastIndexOf(','),lastDot=raw.lastIndexOf('.'),decimalAt=Math.max(lastComma,lastDot);
      let normalized;
      if(decimalAt<0)normalized=raw;
      else normalized=raw.slice(0,decimalAt).replace(/[.,]/g,'')+'.'+raw.slice(decimalAt+1).replace(/[.,]/g,'');
      const value=Number(normalized);
      if(!Number.isFinite(value))throw new Error('Número no válido.');
      tokens.push({type:'number',value});continue;
    }
    if(OPERATORS[char]){tokens.push({type:'operator',value:OPERATORS[char]});index++;continue}
    if(char==='('||char===')'||char==='%'||char==='√'){tokens.push({type:char,value:char});index++;continue}
    throw new Error(`Símbolo no permitido: ${char}`);
  }
  return tokens;
}

export function evaluateExpression(source){
  const tokens=tokenize(source);let cursor=0;
  const peek=()=>tokens[cursor],take=()=>tokens[cursor++];
  function primary(){
    const token=take();
    if(!token)throw new Error('La operación está incompleta.');
    if(token.type==='number')return token.value;
    if(token.type==='('){const value=additive();if(take()?.type!==')')throw new Error('Falta cerrar un paréntesis.');return value}
    throw new Error('Se esperaba un número o un paréntesis.');
  }
  function unary(){
    const token=peek();
    if(token?.type==='operator'&&(token.value==='+'||token.value==='-')){take();const value=unary();return token.value==='-'?-value:value}
    if(token?.type==='√'){take();const value=unary();if(value<0)throw new Error('No se puede calcular la raíz real de un número negativo.');return Math.sqrt(value)}
    let value=primary();while(peek()?.type==='%'){take();value/=100}return value;
  }
  function multiplicative(){let value=unary();while(peek()?.type==='operator'&&(peek().value==='*'||peek().value==='/')){const operator=take().value,right=unary();if(operator==='/'&&right===0)throw new Error('No se puede dividir entre cero.');value=operator==='*'?value*right:value/right}return value}
  function additive(){let value=multiplicative();while(peek()?.type==='operator'&&(peek().value==='+'||peek().value==='-')){const operator=take().value,right=multiplicative();value=operator==='+'?value+right:value-right}return value}
  if(!tokens.length)throw new Error('Escribe una operación.');
  const result=additive();if(cursor!==tokens.length)throw new Error('La operación no está completa.');if(!Number.isFinite(result))throw new Error('El resultado no es válido.');return result;
}

export function formatNumber(value){
  if(!Number.isFinite(value))return 'Error';
  return new Intl.NumberFormat('es-ES',{maximumFractionDigits:12,useGrouping:true}).format(Object.is(value,-0)?0:value);
}

export function versionedConcept(concept,history,excludeId=''){
  const clean=String(concept??'').trim();if(!clean)return '';
  const base=clean.replace(/\s+\(\d+\)$/,'');
  const used=new Set(history.filter(item=>item.id!==excludeId).map(item=>item.concept));
  if(!used.has(base))return base;
  let version=2;while(used.has(`${base} (${version})`))version++;return `${base} (${version})`;
}

export function saveHistory(history,entry,{editingId='',copy=false,now=Date.now()}={}){
  const items=Array.isArray(history)?history.map(item=>({...item})):[],existing=items.find(item=>item.id===editingId);
  if(existing&&!copy){Object.assign(existing,entry,{concept:versionedConcept(entry.concept,items,existing.id),id:existing.id,createdAt:existing.createdAt,updatedAt:now});return items}
  const concept=versionedConcept(entry.concept,items);
  return[{...entry,concept,id:entry.id||globalThis.crypto?.randomUUID?.()||`calc-${now}`,createdAt:now,updatedAt:now},...items].slice(0,100);
}

export function normalizeState(value={}){
  return{expression:String(value.expression||''),result:Number.isFinite(value.result)?value.result:0,answer:Number.isFinite(value.answer)?value.answer:0,memory:Number.isFinite(value.memory)?value.memory:0,concept:String(value.concept||''),history:Array.isArray(value.history)?value.history.slice(0,100):[],editingId:String(value.editingId||''),historyVisible:value.historyVisible!==false,updatedAt:Number(value.updatedAt)||0};
}
