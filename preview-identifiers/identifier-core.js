const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';
const CIF_DIGIT_ONLY = new Set('ABEH');
const CIF_LETTER_ONLY = new Set('PQRSW');
const CIF_TYPES = {
  A:'Sociedad anónima', B:'Sociedad de responsabilidad limitada', C:'Sociedad colectiva', D:'Sociedad comanditaria',
  E:'Comunidad de bienes o entidad sin personalidad', F:'Sociedad cooperativa', G:'Asociación', H:'Comunidad de propietarios',
  J:'Sociedad civil', N:'Entidad extranjera', P:'Corporación local', Q:'Organismo público', R:'Institución religiosa',
  S:'Órgano de la Administración', U:'Unión temporal de empresas', V:'Otro tipo de entidad', W:'Establecimiento permanente no residente',
};
const IBAN_LENGTHS = { AD:24,AE:23,AL:28,AT:20,AZ:28,BA:20,BE:16,BG:22,BH:22,BR:29,BY:28,CH:21,CR:22,CY:28,CZ:24,DE:22,DK:18,DO:28,EE:20,EG:29,ES:24,FI:18,FO:18,FR:27,GB:22,GE:22,GI:23,GL:18,GR:27,GT:28,HR:21,HU:28,IE:22,IL:23,IQ:23,IS:26,IT:27,JO:30,KW:30,KZ:20,LB:28,LC:32,LI:21,LT:20,LU:20,LV:21,MC:27,MD:24,ME:22,MK:19,MN:20,MR:27,MT:31,MU:30,NL:18,NO:15,PK:24,PL:28,PS:29,PT:25,QA:29,RO:24,RS:22,SA:24,SC:31,SE:24,SI:19,SK:24,SM:27,ST:25,SV:28,TL:23,TN:24,TR:26,UA:29,VA:22,VG:24,XK:20 };

function normalize(value) { return String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function randomInt(max) {
  const limit = Math.floor(0x100000000 / max) * max, values = new Uint32Array(1);
  do crypto.getRandomValues(values); while (values[0] >= limit);
  return values[0] % max;
}
function randomDigits(length) { return Array.from({length},()=>String(randomInt(10))).join(''); }
function mod97(value) { let rest=0; for(const character of value) rest=(rest*10+Number(character))%97; return rest; }
function lettersToDigits(value) { return [...value].map(char => /[A-Z]/.test(char) ? String(char.charCodeAt(0)-55) : char).join(''); }

export function calculateNifLetter(number) {
  const digits=String(number).replace(/\D/g,'').padStart(8,'0');
  if(!/^\d{8}$/.test(digits)) throw new Error('Se necesitan ocho cifras.');
  return NIF_LETTERS[Number(digits)%23];
}

export function analyzeNif(value) {
  const clean=normalize(value);
  let kind,base,provided='';
  if(/^\d{8}[A-Z]?$/.test(clean)){kind='NIF';base=clean.slice(0,8);provided=clean.slice(8);}
  else if(/^[XYZ]\d{7}[A-Z]?$/.test(clean)){kind='NIE';base=clean.slice(0,8);provided=clean.slice(8);}
  else throw new Error('Introduce 8 cifras para NIF o X/Y/Z y 7 cifras para NIE, con letra opcional.');
  const numeric=kind==='NIE'?`${{X:'0',Y:'1',Z:'2'}[base[0]]}${base.slice(1)}`:base;
  const expected=calculateNifLetter(numeric),complete=base+expected;
  return {kind,base,provided,expected,complete,valid:provided?provided===expected:null,parts:[['Tipo',kind],['Base',base],['Letra calculada',expected]]};
}

export function generateNif(kind='NIF') {
  if(kind==='NIE'){const prefix='XYZ'[randomInt(3)],base=prefix+randomDigits(7);return analyzeNif(base).complete;}
  return analyzeNif(randomDigits(8)).complete;
}

export function calculateCifControl(prefix,digits) {
  prefix=normalize(prefix);digits=String(digits).replace(/\D/g,'');
  if(!CIF_TYPES[prefix]||!/^\d{7}$/.test(digits)) throw new Error('El CIF requiere una letra de entidad válida y siete cifras.');
  let even=0,odd=0;
  [...digits].forEach((digit,index)=>{const number=Number(digit);if(index%2)even+=number;else{const doubled=number*2;odd+=Math.floor(doubled/10)+(doubled%10);}});
  const digit=String((10-((even+odd)%10))%10),letter=CIF_CONTROL_LETTERS[Number(digit)];
  const allowed=CIF_DIGIT_ONLY.has(prefix)?[digit]:CIF_LETTER_ONLY.has(prefix)?[letter]:[digit,letter];
  return {digit,letter,allowed};
}

export function analyzeCif(value) {
  const clean=normalize(value);
  if(!/^[A-Z]\d{7}[A-Z0-9]?$/.test(clean)||!CIF_TYPES[clean[0]]) throw new Error('Introduce una letra de entidad, siete cifras y el control opcional.');
  const prefix=clean[0],digits=clean.slice(1,8),provided=clean.slice(8),control=calculateCifControl(prefix,digits),expected=control.allowed.join(' o ');
  return {kind:'CIF',base:prefix+digits,provided,expected,complete:prefix+digits+control.allowed[0],valid:provided?control.allowed.includes(provided):null,parts:[['Forma jurídica',CIF_TYPES[prefix]],['Número base',digits],['Control calculado',expected]]};
}

export function generateCif(prefix='B') {
  if(!CIF_TYPES[prefix])prefix='B';
  return analyzeCif(prefix+randomDigits(7)).complete;
}

export function calculateIban(country,bban) {
  country=normalize(country).replace(/\d/g,'').slice(0,2);bban=normalize(bban);
  if(!/^[A-Z]{2}$/.test(country)||!bban||!/^[A-Z0-9]+$/.test(bban)) throw new Error('Indica un país de dos letras y un BBAN alfanumérico.');
  const check=String(98-mod97(lettersToDigits(`${bban}${country}00`))).padStart(2,'0');
  return `${country}${check}${bban}`;
}

export function analyzeIban(value) {
  const clean=normalize(value);
  if(!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(clean)) throw new Error('Introduce un IBAN de entre 15 y 34 caracteres.');
  const country=clean.slice(0,2),expectedLength=IBAN_LENGTHS[country],lengthValid=!expectedLength||clean.length===expectedLength;
  const rearranged=clean.slice(4)+clean.slice(0,4),remainder=mod97(lettersToDigits(rearranged)),valid=remainder===1&&lengthValid;
  const parts=[['País',country],['Control IBAN',clean.slice(2,4)],['BBAN',clean.slice(4)],['Resto módulo 97',String(remainder)]];
  if(expectedLength)parts.push(['Longitud oficial',`${expectedLength} caracteres`]);
  if(country==='ES'&&clean.length===24){parts.push(['Entidad',clean.slice(4,8)],['Oficina',clean.slice(8,12)],['Control CCC',clean.slice(12,14)],['Cuenta',clean.slice(14)]);}
  return {kind:'IBAN',base:clean.slice(4),provided:clean.slice(2,4),expected:calculateIban(country,clean.slice(4)).slice(2,4),complete:clean,valid,parts,lengthValid};
}

function cccDigit(tenDigits) {
  const weights=[1,2,4,8,5,10,9,7,3,6];let sum=0;[...tenDigits].forEach((digit,index)=>sum+=Number(digit)*weights[index]);let result=11-(sum%11);if(result===11)result=0;else if(result===10)result=1;return String(result);
}
export function generateSpanishIban() {
  const bank='9999',branch=randomDigits(4),account=randomDigits(10),ccc=cccDigit(`00${bank}${branch}`)+cccDigit(account),bban=bank+branch+ccc+account;
  return calculateIban('ES',bban);
}

export function calculateNussControl(base) {
  const digits=String(base).replace(/\D/g,'');
  if(!/^\d{10}$/.test(digits)) throw new Error('La base debe tener dos cifras de provincia y ocho de número.');
  const province=Number(digits.slice(0,2)),sequence=Number(digits.slice(2));
  const number=sequence<10000000?province*10000000+sequence:BigInt(digits);
  return String(Number(BigInt(number)%97n)).padStart(2,'0');
}

export function analyzeNuss(value) {
  const clean=String(value??'').replace(/\D/g,'');
  if(!/^\d{10}(\d{2})?$/.test(clean)) throw new Error('Introduce 10 cifras de base o el NUSS/NAF completo de 12 cifras.');
  const base=clean.slice(0,10),provided=clean.slice(10),expected=calculateNussControl(base),complete=base+expected;
  return {kind:'NUSS / NAF',base,provided,expected,complete,valid:provided?provided===expected:null,parts:[['Provincia',base.slice(0,2)],['Número',base.slice(2)],['Control calculado',expected]]};
}

export function generateNuss() {
  const province=String(1+randomInt(52)).padStart(2,'0'),sequence=String(10000000+randomInt(90000000));
  return analyzeNuss(province+sequence).complete;
}

export { CIF_TYPES };
