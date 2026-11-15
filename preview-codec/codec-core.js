const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export const CODEC_MODES = [
  { id:'url-component', label:'Componente de URL', note:'Valores de parámetros, segmentos y texto insertado dentro de una URL.' },
  { id:'url-complete', label:'URL completa', note:'Conserva la estructura : / ? # & = mientras escapa caracteres incompatibles.' },
  { id:'form', label:'Formulario / query', note:'Formato application/x-www-form-urlencoded; representa los espacios mediante +.' },
  { id:'base64', label:'Base64', note:'Convierte texto UTF-8 a Base64 estándar. Es codificación, no cifrado.' },
  { id:'base64url', label:'Base64URL', note:'Variante Base64 sin relleno, segura para URLs y nombres de archivo.' },
  { id:'html', label:'Entidades HTML', note:'Escapa &, <, >, comillas dobles y apóstrofos.' },
  { id:'xml', label:'Entidades XML', note:'Escapa los cinco caracteres reservados principales de XML.' },
  { id:'json', label:'Cadena JSON', note:'Escapa una cadena para insertarla dentro de un valor JSON.' },
  { id:'hex', label:'Hexadecimal UTF-8', note:'Representa cada byte UTF-8 mediante dos dígitos hexadecimales.' },
  { id:'unicode', label:'Escapes Unicode', note:'Representa caracteres mediante secuencias \\uXXXX o \\u{XXXXX}.' }
];

export function bytesToBase64(bytes, urlSafe = false) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  let value = btoa(binary);
  if (urlSafe) value = value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return value;
}

export function base64ToBytes(value) {
  let normalized = String(value).replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) throw new Error('El contenido no es Base64 válido.');
  normalized = normalized.replace(/=+$/g, '');
  normalized += '='.repeat((4 - normalized.length % 4) % 4);
  let binary;
  try { binary = atob(normalized); } catch { throw new Error('El contenido no es Base64 válido.'); }
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

export function encodeHtmlEntities(value) {
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function decodeHtmlEntities(value) {
  return String(value).replace(/&#x([0-9a-f]+);/gi,(_,hex)=>String.fromCodePoint(parseInt(hex,16)))
    .replace(/&#(\d+);/g,(_,number)=>String.fromCodePoint(Number(number)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi,(_,name)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0'}[name.toLowerCase()]));
}

export function encodeUnicode(value) {
  return [...String(value)].map(char => {
    const point = char.codePointAt(0);
    if (point >= 0x20 && point <= 0x7e && char !== '\\') return char;
    return point <= 0xffff ? '\\u' + point.toString(16).toUpperCase().padStart(4,'0') : '\\u{' + point.toString(16).toUpperCase() + '}';
  }).join('');
}

export function decodeUnicode(value) {
  return String(value)
    .replace(/\\u\{([0-9a-f]{1,6})\}/gi,(_,hex)=>String.fromCodePoint(parseInt(hex,16)))
    .replace(/\\u([0-9a-f]{4})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
}

export function encodeValue(mode, value) {
  const text = String(value);
  switch (mode) {
    case 'url-component': return encodeURIComponent(text);
    case 'url-complete': return encodeURI(text);
    case 'form': return new URLSearchParams([['value',text]]).toString().slice(6);
    case 'base64': return bytesToBase64(encoder.encode(text));
    case 'base64url': return bytesToBase64(encoder.encode(text), true);
    case 'html':
    case 'xml': return encodeHtmlEntities(text);
    case 'json': return JSON.stringify(text).slice(1,-1);
    case 'hex': return [...encoder.encode(text)].map(byte=>byte.toString(16).padStart(2,'0')).join(' ');
    case 'unicode': return encodeUnicode(text);
    default: throw new Error('Selecciona una codificación válida.');
  }
}

export function decodeValue(mode, value, plusAsSpace = false) {
  const text = String(value);
  try {
    switch (mode) {
      case 'url-component': return decodeURIComponent(plusAsSpace ? text.replace(/\+/g,' ') : text);
      case 'url-complete': return decodeURI(plusAsSpace ? text.replace(/\+/g,' ') : text);
      case 'form': return decodeURIComponent(text.replace(/\+/g,' '));
      case 'base64':
      case 'base64url': return decoder.decode(base64ToBytes(text));
      case 'html':
      case 'xml': return decodeHtmlEntities(text);
      case 'json': return JSON.parse('"' + text + '"');
      case 'hex': {
        const cleaned = text.replace(/0x/gi,'').replace(/[\s,;:-]+/g,'');
        if (!cleaned || cleaned.length % 2 || !/^[0-9a-f]+$/i.test(cleaned)) throw new Error('La cadena hexadecimal debe contener pares de dígitos.');
        return decoder.decode(Uint8Array.from(cleaned.match(/../g), pair=>parseInt(pair,16)));
      }
      case 'unicode': return decodeUnicode(text);
      default: throw new Error('Selecciona una codificación válida.');
    }
  } catch (error) {
    if (error instanceof URIError) throw new Error('La codificación porcentual está incompleta o no es válida.');
    if (error instanceof SyntaxError && mode === 'json') throw new Error('La cadena JSON escapada no es válida.');
    if (error.message) throw error;
    throw new Error('No ha sido posible descodificar el contenido.');
  }
}

export function transformValue({ mode, value, operation, eachLine = false, recursive = false, plusAsSpace = false }) {
  const apply = source => {
    if (operation === 'encode') return encodeValue(mode, source);
    let result = decodeValue(mode, source, plusAsSpace);
    let rounds = 1;
    if (recursive) {
      while (rounds < 16) {
        try {
          const next = decodeValue(mode, result, plusAsSpace);
          if (next === result) break;
          result = next;
          rounds += 1;
        } catch { break; }
      }
    }
    return result;
  };
  if (eachLine) return String(value).split(/\r?\n/).map(apply).join('\n');
  return apply(String(value));
}

export function encodingHint(value) {
  const text = String(value);
  if (/%25[0-9a-f]{2}/i.test(text)) return 'Parece contener una URL codificada más de una vez.';
  if (/%[0-9a-f]{2}/i.test(text)) return 'Se han detectado secuencias de codificación porcentual.';
  if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(text.replace(/\s/g,'')) && text.trim().length >= 8) return 'El contenido podría estar codificado en Base64.';
  return 'No se ha detectado una codificación evidente.';
}

export async function deriveEncryptionKey(password, salt, iterations = 600000) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name:'PBKDF2', salt, iterations, hash:'SHA-256' }, material, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']);
}

export async function encryptText(value, password) {
  if (password.length < 10) throw new Error('Utiliza una contraseña maestra de al menos 10 caracteres.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 600000;
  const key = await deriveEncryptionKey(password, salt, iterations);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, encoder.encode(value)));
  return ['ODIN1',iterations,bytesToBase64(salt,true),bytesToBase64(iv,true),bytesToBase64(encrypted,true)].join('.');
}

export async function decryptText(token, password) {
  const parts = String(token).trim().split('.');
  if (parts.length !== 5 || parts[0] !== 'ODIN1') throw new Error('El paquete cifrado no tiene un formato ODÍN válido.');
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 2000000) throw new Error('El número de iteraciones del paquete no es válido.');
  try {
    const salt = base64ToBytes(parts[2]);
    const iv = base64ToBytes(parts[3]);
    const encrypted = base64ToBytes(parts[4]);
    if (salt.length !== 16 || iv.length !== 12) throw new Error();
    const key = await deriveEncryptionKey(password, salt, iterations);
    return decoder.decode(await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, encrypted));
  } catch {
    throw new Error('No se puede descifrar: la contraseña es incorrecta o el contenido está dañado.');
  }
}
