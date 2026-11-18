const WESTERN=[
  ['Capricornio',12,22,'♑','Tierra','Cardinal'],['Acuario',1,20,'♒','Aire','Fijo'],['Piscis',2,19,'♓','Agua','Mutable'],
  ['Aries',3,21,'♈','Fuego','Cardinal'],['Tauro',4,20,'♉','Tierra','Fijo'],['Géminis',5,21,'♊','Aire','Mutable'],
  ['Cáncer',6,21,'♋','Agua','Cardinal'],['Leo',7,23,'♌','Fuego','Fijo'],['Virgo',8,23,'♍','Tierra','Mutable'],
  ['Libra',9,23,'♎','Aire','Cardinal'],['Escorpio',10,23,'♏','Agua','Fijo'],['Sagitario',11,22,'♐','Fuego','Mutable']
];
const ANIMALS=['Rata','Buey','Tigre','Conejo','Dragón','Serpiente','Caballo','Cabra','Mono','Gallo','Perro','Cerdo'];
const ANIMAL_SYMBOLS=['鼠','牛','虎','兔','龍','蛇','馬','羊','猴','雞','狗','豬'];
const STEMS=[['Madera','Yang'],['Madera','Yin'],['Fuego','Yang'],['Fuego','Yin'],['Tierra','Yang'],['Tierra','Yin'],['Metal','Yang'],['Metal','Yin'],['Agua','Yang'],['Agua','Yin']];
const MONTH_TRADITIONS=[
  ['Granate','Clavel'],['Amatista','Violeta'],['Aguamarina','Narciso'],['Diamante','Margarita'],['Esmeralda','Lirio'],['Perla','Rosa'],
  ['Rubí','Nenúfar'],['Peridoto','Gladiolo'],['Zafiro','Áster'],['Ópalo','Caléndula'],['Topacio','Crisantemo'],['Turquesa','Narciso']
];
const ASTRONOMICAL=[
  ['Capricornio',119],['Acuario',216],['Piscis',312],['Aries',419],['Tauro',514],['Géminis',620],['Cáncer',721],['Leo',810],
  ['Virgo',916],['Libra',1031],['Escorpio',1123],['Ofiuco',1130],['Sagitario',1218]
];
const DAY=86400000,SYNODIC_MONTH=29.530588853,NEW_MOON_EPOCH=Date.UTC(2000,0,6,18,14);
const pad=value=>String(value).padStart(2,'0');
export const isoDate=(year,month,day)=>`${year}-${pad(month)}-${pad(day)}`;
export function parseLocalDate(value){const [year,month,day]=String(value).split('-').map(Number);return new Date(year,month-1,day,12)}
export function westernSign(month,day){const key=month*100+day;let result=WESTERN[0];for(const sign of WESTERN)if(key>=sign[1]*100+sign[2])result=sign;return{name:result[0],symbol:result[3],element:result[4],modality:result[5]}}
export function chineseYearForDate(date){
  const parts=new Intl.DateTimeFormat('en-u-ca-chinese',{year:'numeric'}).formatToParts(date);
  const year=Number(parts.find(part=>part.type==='relatedYear')?.value||parts.find(part=>part.type==='year')?.value);
  if(!Number.isFinite(year))throw new Error('El calendario chino no está disponible en este navegador.');
  return year;
}
export function chineseSign(date){const year=chineseYearForDate(date),animalIndex=((year-4)%12+12)%12,stemIndex=((year-4)%10+10)%10,[element,polarity]=STEMS[stemIndex];return{year,animal:ANIMALS[animalIndex],symbol:ANIMAL_SYMBOLS[animalIndex],element,polarity}}
export function astronomicalConstellation(month,day){const key=month*100+day;let name='Sagitario';for(const [candidate,start] of ASTRONOMICAL)if(key>=start)name=candidate;return name}
export function seasonForDate(month,day,hemisphere='north'){const key=month*100+day;let north=key>=1221||key<320?'Invierno':key<621?'Primavera':key<922?'Verano':'Otoño';if(hemisphere==='south')north={Invierno:'Verano',Primavera:'Otoño',Verano:'Invierno',Otoño:'Primavera'}[north];return north}
export function traditionsForMonth(month){const [stone,flower]=MONTH_TRADITIONS[month-1];return{stone,flower}}
export function moonForDate(date){const cycle=(date.getTime()-NEW_MOON_EPOCH)/DAY/SYNODIC_MONTH,fraction=((cycle%1)+1)%1,illumination=(1-Math.cos(2*Math.PI*fraction))/2,names=[[.0339,'Luna nueva'],[.2161,'Creciente'],[.2839,'Cuarto creciente'],[.4661,'Gibosa creciente'],[.5339,'Luna llena'],[.7161,'Gibosa menguante'],[.7839,'Cuarto menguante'],[.9661,'Menguante']];return{fraction,illumination,name:(names.find(([limit])=>fraction<limit)||names[0])[1],age:fraction*SYNODIC_MONTH}}
export function profileForDate(value,hemisphere='north'){const date=parseLocalDate(value),month=date.getMonth()+1,day=date.getDate();return{date,western:westernSign(month,day),chinese:chineseSign(date),astronomical:astronomicalConstellation(month,day),season:seasonForDate(month,day,hemisphere),traditions:traditionsForMonth(month),moon:moonForDate(date)}}
