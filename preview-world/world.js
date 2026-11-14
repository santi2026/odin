const cities = [
  { id:'barcelona', name:'Barcelona', country:'España', continent:'Europa', zone:'Europe/Madrid', lat:41.3874, lon:2.1686, url:'https://www.barcelona.cat/es/' },
  { id:'london', name:'Londres', country:'Reino Unido', continent:'Europa', zone:'Europe/London', lat:51.5072, lon:-0.1276, url:'https://www.london.gov.uk/' },
  { id:'new-york', name:'Nueva York', country:'Estados Unidos', continent:'América del Norte', zone:'America/New_York', lat:40.7128, lon:-74.0060, url:'https://www.nyc.gov/' },
  { id:'washington', name:'Washington D. C.', country:'Estados Unidos', continent:'América del Norte', zone:'America/New_York', lat:38.9072, lon:-77.0369, url:'https://dc.gov/' },
  { id:'mexico-city', name:'Ciudad de México', country:'México', continent:'América del Norte', zone:'America/Mexico_City', lat:19.4326, lon:-99.1332, url:'https://www.cdmx.gob.mx/' },
  { id:'buenos-aires', name:'Buenos Aires', country:'Argentina', continent:'América del Sur', zone:'America/Argentina/Buenos_Aires', lat:-34.6037, lon:-58.3816, url:'https://buenosaires.gob.ar/' },
  { id:'dubai', name:'Dubái', country:'Emiratos Árabes Unidos', continent:'Asia', zone:'Asia/Dubai', lat:25.2048, lon:55.2708, url:'https://www.dubai.ae/es/' },
  { id:'new-delhi', name:'Nueva Delhi', country:'India', continent:'Asia', zone:'Asia/Kolkata', lat:28.6139, lon:77.2090, url:'https://delhi.gov.in/' },
  { id:'tokyo', name:'Tokio', country:'Japón', continent:'Asia', zone:'Asia/Tokyo', lat:35.6762, lon:139.6503, url:'https://www.english.metro.tokyo.lg.jp/' },
  { id:'sydney', name:'Sídney', country:'Australia', continent:'Oceanía', zone:'Australia/Sydney', lat:-33.8688, lon:151.2093, url:'https://www.cityofsydney.nsw.gov.au/' }
];
const reference = cities[0];
const cityGrid = document.querySelector('#city-grid');
const mapPins = document.querySelector('#map-pins');
const homeClock = document.querySelector('#home-clock');
const sort = document.querySelector('#city-sort');
const mapTab = document.querySelector('#map-tab');
const cardsTab = document.querySelector('#cards-tab');
const mapView = document.querySelector('#world-map-view');
const cardsView = document.querySelector('#world-cards-view');
const solarLayer = document.querySelector('#solar-layer');
const pad = (value) => String(value).padStart(2, '0');
const pinOffsets = {
  barcelona:[42,-24], london:[-42,-26], 'new-york':[-54,-27], washington:[62,21],
  'mexico-city':[-48,24], 'buenos-aires':[-46,-25], dubai:[-48,-27], 'new-delhi':[55,22],
  tokyo:[-42,-27], sydney:[-42,-27]
};

function parts(zone, date = new Date()) {
  const list = new Intl.DateTimeFormat('es-ES', { timeZone:zone, year:'numeric', month:'2-digit', day:'2-digit', weekday:'long', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23' }).formatToParts(date);
  return Object.fromEntries(list.map(({type,value}) => [type,value]));
}
function offsetMinutes(zone, date = new Date()) {
  const p = parts(zone, date);
  const utc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((utc - date.getTime()) / 60000);
}
function formatHours(minutes) {
  if (!minutes) return 'Misma hora';
  const sign = minutes > 0 ? '+' : '−'; const absolute = Math.abs(minutes); const hours = Math.floor(absolute / 60); const mins = absolute % 60;
  return `${sign}${hours}${mins ? `:${pad(mins)}` : ''} h`;
}
function utcLabel(minutes) {
  if (!minutes) return 'UTC±0';
  const sign = minutes > 0 ? '+' : '−'; const absolute = Math.abs(minutes); return `UTC${sign}${Math.floor(absolute / 60)}${absolute % 60 ? `:${pad(absolute % 60)}` : ''}`;
}
function annualDifferences(city) {
  const values = new Set(); const year = new Date().getUTCFullYear();
  for (let month = 0; month < 12; month++) { const date = new Date(Date.UTC(year, month, 15, 12)); values.add(offsetMinutes(city.zone, date) - offsetMinutes(reference.zone, date)); }
  return [...values].sort((a,b) => a-b);
}
function seasonalLabel(city, now = new Date()) {
  const offsets = new Set(); const year = now.getUTCFullYear();
  for (let month = 0; month < 12; month++) offsets.add(offsetMinutes(city.zone, new Date(Date.UTC(year, month, 15, 12))));
  if (offsets.size === 1) return 'Sin cambio estacional';
  const name = new Intl.DateTimeFormat('es-ES', { timeZone:city.zone, timeZoneName:'long' }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value.toLowerCase() || '';
  return name.includes('verano') ? 'Horario de verano' : 'Horario estándar';
}
function coord(value, positive, negative) { return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`; }
function cityState(city, now = new Date()) {
  const p = parts(city.zone, now); const offset = offsetMinutes(city.zone, now); const difference = offset - offsetMinutes(reference.zone, now); const hour = +p.hour;
  return { ...city, p, offset, difference, daylight:hour >= 7 && hour < 19, season:seasonalLabel(city, now), annual:annualDifferences(city) };
}
function solarPosition(date = new Date()) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = (date.getTime() - start) / 86400000;
  const declination = -23.44 * Math.cos((2 * Math.PI / 365.24) * (day + 10));
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return { declination, longitude: 180 - utcHours * 15 };
}
function renderSolarLayer(now = new Date()) {
  if (!solarLayer) return;
  const ctx = solarLayer.getContext('2d');
  const { width, height } = solarLayer;
  const image = ctx.createImageData(width, height);
  const sun = solarPosition(now);
  const dec = sun.declination * Math.PI / 180;
  for (let y = 0; y < height; y++) {
    const lat = (90 - y / height * 180) * Math.PI / 180;
    for (let x = 0; x < width; x++) {
      const lon = (x / width * 360 - 180) * Math.PI / 180;
      const hourAngle = lon - sun.longitude * Math.PI / 180;
      const altitude = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle));
      const edge = Math.max(-1, Math.min(1, altitude / 0.12));
      const i = (y * width + x) * 4;
      if (edge >= 0) { image.data[i] = 245; image.data[i+1] = 192; image.data[i+2] = 92; image.data[i+3] = Math.round(17 + edge * 18); }
      else { image.data[i] = 1; image.data[i+1] = 6; image.data[i+2] = 16; image.data[i+3] = Math.round(30 + -edge * 65); }
    }
  }
  ctx.putImageData(image, 0, 0);
}
function renderCards(states) {
  cityGrid.innerHTML = '';
  states.filter(city => city.id !== reference.id).forEach(city => {
    const range = city.annual.length > 1 ? `${formatHours(city.annual[0])} / ${formatHours(city.annual.at(-1))}` : formatHours(city.difference);
    const card = document.createElement('article'); card.className = `city-card ${city.daylight ? 'is-day' : 'is-night'}`; card.id = `city-${city.id}`; card.dataset.city = city.id;
    card.innerHTML = `<header><div><span>${city.country} · ${city.continent}</span><h2>${city.name}</h2></div><strong>${formatHours(city.difference)}</strong></header><div class="city-time">${city.p.hour}:${city.p.minute}<small>:${city.p.second}</small></div><p class="city-date">${city.p.weekday}, ${+city.p.day} de ${new Intl.DateTimeFormat('es-ES',{timeZone:city.zone,month:'long'}).format(new Date())}</p><dl><div><dt>Zona horaria</dt><dd>${utcLabel(city.offset)} · ${city.season}</dd></div><div><dt>Diferencia anual</dt><dd>${range} respecto a Barcelona</dd></div><div><dt>Coordenadas</dt><dd>${coord(city.lat,'N','S')}, ${coord(city.lon,'E','O')}</dd></div></dl><a href="${city.url}" target="_blank" rel="noopener noreferrer">Web oficial de la ciudad <span aria-hidden="true">↗</span></a>`;
    card.addEventListener('mouseenter', () => highlight(city.id)); card.addEventListener('mouseleave', () => highlight(''));
    cityGrid.append(card);
  });
}
function renderPins(states) {
  mapPins.innerHTML = '';
  states.forEach(city => {
    const button = document.createElement('button'); button.className = `map-pin ${city.id === reference.id ? 'is-home' : ''} ${city.daylight ? 'is-day' : 'is-night'}`; button.dataset.city = city.id; button.style.left = `${(city.lon + 180) / 360 * 100}%`; button.style.top = `${(90 - city.lat) / 180 * 100}%`; const [labelX,labelY] = pinOffsets[city.id] || [0,-28]; button.style.setProperty('--label-x', `${labelX}px`); button.style.setProperty('--label-y', `${labelY}px`); button.setAttribute('aria-label', `${city.name}: ${city.p.hour}:${city.p.minute}`); button.innerHTML = `<i></i><span>${city.name}<b>${city.p.hour}:${city.p.minute}</b></span>`;
    button.addEventListener('click', () => { if (city.id === reference.id) homeClock.scrollIntoView({behavior:'smooth'}); else { setView('cards'); requestAnimationFrame(() => document.querySelector(`#city-${city.id}`)?.scrollIntoView({behavior:'smooth', block:'center'})); } });
    mapPins.append(button);
  });
}
function highlight(id) { document.querySelectorAll('.map-pin').forEach(pin => pin.classList.toggle('is-active', pin.dataset.city === id)); }
function setView(view) {
  const showMap = view === 'map';
  mapView.hidden = !showMap; cardsView.hidden = showMap;
  mapTab.classList.toggle('active', showMap); cardsTab.classList.toggle('active', !showMap);
  mapTab.setAttribute('aria-selected', String(showMap)); cardsTab.setAttribute('aria-selected', String(!showMap));
}
function render() {
  const states = cities.map(city => cityState(city)); const home = states[0];
  homeClock.innerHTML = `<div><span class="home-label">Ciudad de referencia</span><h2>Barcelona</h2><p>España · Europa · ${coord(home.lat,'N','S')}, ${coord(home.lon,'E','O')}</p></div><div class="home-time"><strong>${home.p.hour}:${home.p.minute}<small>:${home.p.second}</small></strong><span>${home.p.weekday}, ${+home.p.day} · ${utcLabel(home.offset)} · ${home.season}</span></div><a href="${home.url}" target="_blank" rel="noopener noreferrer">Web oficial ↗</a>`;
  const others = states.slice(1).sort(sort.value === 'name' ? (a,b) => a.name.localeCompare(b.name,'es') : (a,b) => a.offset - b.offset);
  renderCards([home, ...others]); renderPins(states); renderSolarLayer();
}
mapTab.addEventListener('click', () => setView('map')); cardsTab.addEventListener('click', () => setView('cards'));
sort.addEventListener('change', render); render(); setInterval(render, 1000);
