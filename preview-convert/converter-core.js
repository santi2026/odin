const factorUnit=(id,label,symbol,factor)=>({id,label,symbol,factor});

export const categories=[
  {id:'length',label:'Longitud',icon:'↔',units:[factorUnit('mm','Milímetros','mm',.001),factorUnit('cm','Centímetros','cm',.01),factorUnit('m','Metros','m',1),factorUnit('km','Kilómetros','km',1000),factorUnit('in','Pulgadas','in',.0254),factorUnit('ft','Pies','ft',.3048),factorUnit('yd','Yardas','yd',.9144),factorUnit('mi','Millas','mi',1609.344)],defaults:['km','mi']},
  {id:'mass',label:'Peso y masa',icon:'⚖',units:[factorUnit('mg','Miligramos','mg',1e-6),factorUnit('g','Gramos','g',.001),factorUnit('kg','Kilogramos','kg',1),factorUnit('t','Toneladas','t',1000),factorUnit('oz','Onzas','oz',.028349523125),factorUnit('lb','Libras','lb',.45359237)],defaults:['kg','lb']},
  {id:'temperature',label:'Temperatura',icon:'°',units:[{id:'c',label:'Celsius',symbol:'°C',toBase:value=>value+273.15,fromBase:value=>value-273.15},{id:'f',label:'Fahrenheit',symbol:'°F',toBase:value=>(value-32)*5/9+273.15,fromBase:value=>(value-273.15)*9/5+32},{id:'k',label:'Kelvin',symbol:'K',toBase:value=>value,fromBase:value=>value}],defaults:['c','f']},
  {id:'area',label:'Superficie',icon:'□',units:[factorUnit('cm2','Centímetros cuadrados','cm²',.0001),factorUnit('m2','Metros cuadrados','m²',1),factorUnit('km2','Kilómetros cuadrados','km²',1e6),factorUnit('ha','Hectáreas','ha',1e4),factorUnit('ft2','Pies cuadrados','ft²',.09290304),factorUnit('acre','Acres','ac',4046.8564224),factorUnit('mi2','Millas cuadradas','mi²',2589988.110336)],defaults:['m2','ft2']},
  {id:'volume',label:'Volumen',icon:'◇',units:[factorUnit('ml','Mililitros','ml',.001),factorUnit('cl','Centilitros','cl',.01),factorUnit('l','Litros','l',1),factorUnit('m3','Metros cúbicos','m³',1000),factorUnit('cup-us','Tazas estadounidenses','cup US',.2365882365),factorUnit('floz-us','Onzas líquidas estadounidenses','fl oz US',.0295735295625),factorUnit('pint-us','Pintas estadounidenses','pt US',.473176473),factorUnit('gal-us','Galones estadounidenses','gal US',3.785411784),factorUnit('pint-uk','Pintas británicas','pt UK',.56826125),factorUnit('gal-uk','Galones británicos','gal UK',4.54609)],defaults:['l','gal-us']},
  {id:'speed',label:'Velocidad',icon:'»',units:[factorUnit('kmh','Kilómetros por hora','km/h',1/3.6),factorUnit('ms','Metros por segundo','m/s',1),factorUnit('mph','Millas por hora','mph',.44704),factorUnit('knot','Nudos','kn',.514444444444)],defaults:['kmh','mph']},
  {id:'time',label:'Tiempo',icon:'◷',units:[factorUnit('s','Segundos','s',1),factorUnit('min','Minutos','min',60),factorUnit('h','Horas','h',3600),factorUnit('day','Días','d',86400),factorUnit('week','Semanas','sem',604800),factorUnit('year','Años medios (365,25 días)','a',31557600)],defaults:['h','min']},
  {id:'data',label:'Datos digitales',icon:'01',units:[factorUnit('B','Bytes','B',1),factorUnit('KB','Kilobytes decimales','KB',1e3),factorUnit('MB','Megabytes decimales','MB',1e6),factorUnit('GB','Gigabytes decimales','GB',1e9),factorUnit('TB','Terabytes decimales','TB',1e12),factorUnit('KiB','Kibibytes binarios','KiB',1024),factorUnit('MiB','Mebibytes binarios','MiB',1048576),factorUnit('GiB','Gibibytes binarios','GiB',1073741824),factorUnit('TiB','Tebibytes binarios','TiB',1099511627776)],defaults:['GB','GiB']},
  {id:'energy',label:'Energía',icon:'ϟ',units:[factorUnit('j','Julios','J',1),factorUnit('kj','Kilojulios','kJ',1000),factorUnit('cal','Calorías','cal',4.184),factorUnit('kcal','Kilocalorías','kcal',4184),factorUnit('wh','Vatios hora','Wh',3600),factorUnit('kwh','Kilovatios hora','kWh',3.6e6)],defaults:['kwh','kj']},
  {id:'power',label:'Potencia',icon:'W',units:[factorUnit('w','Vatios','W',1),factorUnit('kw','Kilovatios','kW',1000),factorUnit('cv','Caballos de vapor','CV',735.49875),factorUnit('hp','Horsepower mecánico','hp',745.699871582)],defaults:['kw','cv']},
  {id:'pressure',label:'Presión',icon:'P',units:[factorUnit('pa','Pascales','Pa',1),factorUnit('kpa','Kilopascales','kPa',1000),factorUnit('bar','Bares','bar',1e5),factorUnit('atm','Atmósferas','atm',101325),factorUnit('psi','Libras por pulgada cuadrada','psi',6894.757293168),factorUnit('mmhg','Milímetros de mercurio','mmHg',133.322387415)],defaults:['bar','psi']},
  {id:'angle',label:'Ángulos',icon:'∠',units:[factorUnit('deg','Grados','°',Math.PI/180),factorUnit('rad','Radianes','rad',1),factorUnit('grad','Gradianes','gon',Math.PI/200),factorUnit('turn','Vueltas','rev',Math.PI*2)],defaults:['deg','rad']},
  {id:'currency',label:'Divisas',icon:'€',manual:true,units:[['EUR','Euro','€'],['USD','Dólar estadounidense','$'],['GBP','Libra esterlina','£'],['JPY','Yen japonés','¥'],['CHF','Franco suizo','CHF'],['CNY','Yuan chino','CN¥'],['CAD','Dólar canadiense','CA$'],['AUD','Dólar australiano','A$'],['MXN','Peso mexicano','MX$'],['BRL','Real brasileño','R$']].map(([id,label,symbol])=>({id,label,symbol})) ,defaults:['EUR','USD']}
];

export function categoryById(id){return categories.find(category=>category.id===id)||categories[0]}
export function unitById(category,id){return category.units.find(unit=>unit.id===id)||category.units[0]}

export function convertValue(value,categoryId,fromId,toId,rate=1){
  const category=categoryById(categoryId),numeric=Number(value);
  if(!Number.isFinite(numeric))return NaN;
  if(fromId===toId)return numeric;
  if(category.manual){const numericRate=Number(rate);return numericRate>0?numeric*numericRate:NaN}
  const from=unitById(category,fromId),to=unitById(category,toId);
  const base=from.toBase?from.toBase(numeric):numeric*from.factor;
  return to.fromBase?to.fromBase(base):base/to.factor;
}

export function parseLocalizedNumber(value){
  let text=String(value??'').trim().replace(/\s/g,'');
  if(!text)return NaN;
  const comma=text.lastIndexOf(','),dot=text.lastIndexOf('.');
  if(comma>=0&&dot>=0)text=comma>dot?text.replace(/\./g,'').replace(',','.'):text.replace(/,/g,'');
  else if(comma>=0)text=text.replace(',','.');
  return Number(text);
}

export function formatNumber(value,precision='auto'){
  if(!Number.isFinite(value))return '';
  if(precision==='scientific')return value.toExponential(6).replace('.',',');
  const digits=precision==='auto'?10:Number(precision);
  return new Intl.NumberFormat('es-ES',{useGrouping:false,minimumFractionDigits:precision==='auto'?0:digits,maximumFractionDigits:digits}).format(value);
}
