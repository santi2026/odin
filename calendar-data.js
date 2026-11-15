export const LOCAL_HOLIDAY_SEED_VERSION=1;

export const officialLocalPeriods=[
  {id:'official-local-madrid-2026-san-isidro',name:'Festivo en Madrid · San Isidro Labrador',start:'2026-05-15',end:'2026-05-15',type:'other'},
  {id:'official-local-barcelona-2026-pascua-granada',name:'Festivo en Barcelona · Pascua Granada',start:'2026-05-25',end:'2026-05-25',type:'other'},
  {id:'official-local-barcelona-2026-merce',name:'Festivo en Barcelona · La Mercè',start:'2026-09-24',end:'2026-09-24',type:'other'},
  {id:'official-local-madrid-2026-almudena',name:'Festivo en Madrid · Nuestra Señora de la Almudena',start:'2026-11-09',end:'2026-11-09',type:'other'},
  {id:'official-local-madrid-2027-san-isidro',name:'Festivo en Madrid · San Isidro Labrador',start:'2027-05-15',end:'2027-05-15',type:'other'},
  {id:'official-local-barcelona-2027-pascua-granada',name:'Festivo en Barcelona · Pascua Granada',start:'2027-05-17',end:'2027-05-17',type:'other'},
  {id:'official-local-barcelona-2027-merce',name:'Festivo en Barcelona · La Mercè',start:'2027-09-24',end:'2027-09-24',type:'other'},
  {id:'official-local-madrid-2027-almudena',name:'Festivo en Madrid · Nuestra Señora de la Almudena',start:'2027-11-09',end:'2027-11-09',type:'other'}
];

export const recurringFixedHolidays={
  spain:[['01-01','Año Nuevo'],['01-06','Epifanía del Señor / Reyes'],['05-01','Fiesta del Trabajo'],['08-15','Asunción de la Virgen'],['10-12','Fiesta Nacional de España'],['11-01','Todos los Santos'],['12-06','Día de la Constitución'],['12-08','Inmaculada Concepción'],['12-25','Navidad']],
  barcelona:[['06-24','San Juan / Sant Joan','Festivo autonómico fijo'],['09-11','Diada Nacional de Cataluña','Festivo autonómico fijo'],['12-26','San Esteban / Sant Esteve','Festivo autonómico fijo']],
  madrid:[['05-02','Fiesta de la Comunidad de Madrid','Festivo autonómico fijo']]
};

export const officialHolidays={
  2026:{
    spain:[['01-01','Año Nuevo'],['01-06','Epifanía del Señor / Reyes'],['04-03','Viernes Santo'],['05-01','Fiesta del Trabajo'],['08-15','Asunción de la Virgen'],['10-12','Fiesta Nacional de España'],['12-08','Inmaculada Concepción'],['12-25','Navidad']],
    barcelona:[['04-06','Lunes de Pascua Florida','Festivo autonómico'],['06-24','San Juan / Sant Joan','Festivo autonómico'],['09-11','Diada Nacional de Cataluña','Festivo autonómico'],['12-26','San Esteban / Sant Esteve','Festivo autonómico']],
    madrid:[['04-02','Jueves Santo','Festivo autonómico'],['05-02','Fiesta de la Comunidad de Madrid','Festivo autonómico'],['11-02','Traslado de Todos los Santos','Festivo autonómico'],['12-07','Traslado del Día de la Constitución','Festivo autonómico']]
  },
  2027:{
    spain:[['01-01','Año Nuevo'],['01-06','Epifanía del Señor / Reyes'],['03-26','Viernes Santo'],['05-01','Fiesta del Trabajo'],['10-12','Fiesta Nacional de España'],['11-01','Todos los Santos'],['12-06','Día de la Constitución'],['12-08','Inmaculada Concepción'],['12-25','Navidad']],
    barcelona:[['03-29','Lunes de Pascua Florida','Festivo autonómico'],['06-24','San Juan / Sant Joan','Festivo autonómico'],['09-11','Diada Nacional de Cataluña','Festivo autonómico']],
    madrid:[['03-19','San José','Festivo autonómico'],['03-25','Jueves Santo','Festivo autonómico'],['08-16','Traslado de la Asunción de la Virgen','Festivo autonómico']]
  }
};

export function officialEventsForYear(year){
  const calendar=officialHolidays[year];
  const events=new Map();
  for(const [layer,items] of Object.entries(recurringFixedHolidays))for(const [monthDay,name,type=layer==='spain'?'Festivo nacional fijo':'Festivo autonómico fijo'] of items)events.set(`${layer}:${monthDay}`,{date:`${year}-${monthDay}`,name,layer,type});
  for(const [layer,items] of Object.entries(calendar||{}))for(const [monthDay,name,type='Festivo nacional'] of items)events.set(`${layer}:${monthDay}`,{date:`${year}-${monthDay}`,name,layer,type});
  return [...events.values()];
}

export function hasVerifiedAnnualCalendar(year){return Object.prototype.hasOwnProperty.call(officialHolidays,year)}
