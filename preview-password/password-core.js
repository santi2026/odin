const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?';
const AMBIGUOUS = new Set('Il1O0o|`\'"');

export const PASSPHRASE_WORDS = [...new Set(`abeja abrazo acero actor agua aire alamo alba aldea alegre alga alma alto amigo amor ancla angel anillo arbol arco arena aroma arroz arte astro ave avion azul baile banco barco barrio bosque brisa bronce buho cable cafe caja cala calma campo canal canto capa carbon carta casa cedro cielo cine cisne clave clima cobre coco colina color cometa coral corona cristal cuadro cubo cuerda danza dato delfin delta dia disco dragon eco eje energia equipo escala escudo esfera espacio estrella faro felino feria fibra fiesta figura flor foco fuego fuente galaxia gato gema globo golfo gorro grano grupo haya hielo hoja hogar humo idea isla jardin juego kiwi lago lampara lapiz lazo leon libro lima linea luna luz madera magia mapa mar marco medalla mesa miel molino monte motor mundo musgo nube numero oasis ola olivo onda oro oso palacio palma papel parque paso pera perla piano piedra pino pista playa plaza pluma poema portal prado puente pulso queso radio rama rayo red reino reloj rio roca rosa ruta sabana sauce selva senda sierra signo sol sombra sonido sur tabla taller tambor teja templo tierra tigre torre tren trigo valle vela verde viaje viento violeta voz zorro acento acuario adorno aguja ala aldea alondra altura amapola ambar ancho antena apio arena arpa aspa aula barco bellota beso bloque boca bota boton brazo brote burbuja caballo cabina cadena camino campana canela cara caracola casco cereza cima circo ciudad cofre cocina cometa conejo copa costa cueva dado duna edificio elefante encina entrada espejo falda familia flecha foca forma fresa fruta gallo garza gigante giro guitarra higo hilo hotel iman invierno jirafa lago laguna lana lanza leche lente limon llave lluvia loto manta manzana marfil martillo melon metro miel mina mirada naranja nido nogal norte nube oceano ojo olmo otono pato pecera pez pila planeta planta plata playa prisma pueblo puerta rama raton remo rueda sal salto semilla seta silla sirena sopa taza teatro tejado tela tesoro tomate tono tortuga tunel uva ventana verano volcan yate zanahoria zona`.split(/\s+/))];

export function secureRandomInt(max) {
  if (!Number.isSafeInteger(max) || max <= 0 || max > 0x100000000) throw new Error('Límite aleatorio no válido.');
  const limit = Math.floor(0x100000000 / max) * max;
  const values = new Uint32Array(1);
  do crypto.getRandomValues(values); while (values[0] >= limit);
  return values[0] % max;
}

function pick(source) {
  if (!source.length) throw new Error('No quedan caracteres disponibles con esta configuración.');
  return source[secureRandomInt(source.length)];
}

function shuffle(values) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const target = secureRandomInt(index + 1);
    [values[index], values[target]] = [values[target], values[index]];
  }
  return values;
}

function cleanCharacters(value, excludeAmbiguous, excluded = '') {
  const excludedSet = new Set(excluded);
  return [...new Set(value)].filter(character => !excludedSet.has(character) && (!excludeAmbiguous || !AMBIGUOUS.has(character))).join('');
}

export function generatePassword(options = {}) {
  const {
    length = 20,
    lowercase = true,
    uppercase = true,
    digits = true,
    symbols = true,
    excludeAmbiguous = true,
    excluded = '',
  } = options;
  if (!Number.isInteger(length) || length < 4 || length > 128) throw new Error('La longitud debe estar entre 4 y 128.');
  const groups = [lowercase && LOWER, uppercase && UPPER, digits && DIGITS, symbols && SYMBOLS]
    .filter(Boolean)
    .map(group => cleanCharacters(group, excludeAmbiguous, excluded))
    .filter(Boolean);
  if (!groups.length) throw new Error('Selecciona al menos un grupo de caracteres.');
  if (length < groups.length) throw new Error('La longitud no permite incluir todos los grupos seleccionados.');
  const pool = [...new Set(groups.join(''))].join('');
  const result = groups.map(pick);
  while (result.length < length) result.push(pick(pool));
  return { value: shuffle(result).join(''), poolSize: pool.length, entropy: length * Math.log2(pool.length) };
}

export function generatePassphrase(options = {}) {
  const { words = 7, separator = '-', capitalize = false, appendNumber = false } = options;
  if (!Number.isInteger(words) || words < 3 || words > 12) throw new Error('La frase debe contener entre 3 y 12 palabras.');
  const selected = Array.from({ length: words }, () => PASSPHRASE_WORDS[secureRandomInt(PASSPHRASE_WORDS.length)]);
  if (capitalize) selected[0] = selected[0][0].toUpperCase() + selected[0].slice(1);
  let value = selected.join(separator);
  let entropy = words * Math.log2(PASSPHRASE_WORDS.length);
  if (appendNumber) {
    value += `${separator}${String(secureRandomInt(100)).padStart(2, '0')}`;
    entropy += Math.log2(100);
  }
  return { value, poolSize: PASSPHRASE_WORDS.length, entropy };
}

function isObviousPin(value) {
  if (/^(\d)\1+$/.test(value)) return true;
  const ascending = '01234567890123456789';
  const descending = '98765432109876543210';
  return ascending.includes(value) || descending.includes(value);
}

export function generatePin(options = {}) {
  const { length = 6, avoidObvious = true } = options;
  if (!Number.isInteger(length) || length < 4 || length > 16) throw new Error('El PIN debe tener entre 4 y 16 dígitos.');
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = Array.from({ length }, () => String(secureRandomInt(10))).join('');
    if (!avoidObvious || !isObviousPin(value)) return { value, poolSize: 10, entropy: length * Math.log2(10) };
  }
  throw new Error('No se ha podido generar un PIN con esas condiciones.');
}

export function strengthFromEntropy(entropy) {
  if (entropy < 40) return { key: 'weak', label: 'Débil' };
  if (entropy < 60) return { key: 'fair', label: 'Aceptable' };
  if (entropy < 80) return { key: 'strong', label: 'Fuerte' };
  return { key: 'excellent', label: 'Muy fuerte' };
}
