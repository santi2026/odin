const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 4;
const ALLOWED_TYPES = ['text/html', 'application/xhtml+xml', 'text/plain'];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

export function isBlockedHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host === '::1' || host === '::' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return true;
  if (host.includes(':')) return true;
  if (host === 'metadata.google.internal' || host.endsWith('.metadata.google.internal')) return true;
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return false;
  const octets = host.split('.').map(Number);
  if (octets.some((value) => value > 255)) return true;
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19));
}

export function validateTarget(value) {
  let target;
  try {
    target = new URL(String(value || '').trim());
  } catch {
    throw new Error('La dirección no es válida.');
  }
  if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Solo se admiten direcciones HTTP o HTTPS.');
  if (target.username || target.password) throw new Error('No se admiten credenciales dentro de la dirección.');
  if (target.port && !['80', '443'].includes(target.port)) throw new Error('El puerto indicado no está permitido.');
  if (isBlockedHostname(target.hostname)) throw new Error('No se permiten direcciones locales o privadas.');
  return target;
}

async function readLimitedBody(response) {
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > MAX_BYTES) throw new Error('La página supera el límite de 2 MB.');
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error('La página supera el límite de 2 MB.');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function decodeBody(bytes, contentType) {
  const charset = /charset\s*=\s*["']?([^;"'\s]+)/i.exec(contentType)?.[1] || 'utf-8';
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

export async function onRequestPost({ request }) {
  const requestOrigin = request.headers.get('origin');
  if (requestOrigin && new URL(requestOrigin).hostname !== new URL(request.url).hostname) return json({ error: 'Origen no permitido.' }, 403);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'La solicitud no contiene una dirección válida.' }, 400);
  }
  let target;
  try {
    target = validateTarget(body.url);
  } catch (error) {
    return json({ error: error.message }, 400);
  }

  try {
    let response;
    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
      response = await fetch(target.toString(), {
        method: 'GET',
        redirect: 'manual',
        headers: {
          accept: 'text/html,application/xhtml+xml,text/plain;q=0.8',
          'user-agent': 'ODIN-HTML-Text/1.0 (+https://odin.santiagosanz.info/)'
        },
        cf: { cacheTtl: 0, cacheEverything: false }
      });
      if (response.status < 300 || response.status >= 400) break;
      const location = response.headers.get('location');
      if (!location) throw new Error('La página devuelve una redirección incompleta.');
      if (redirect === MAX_REDIRECTS) throw new Error('La página contiene demasiadas redirecciones.');
      target = validateTarget(new URL(location, target).toString());
    }
    if (!response.ok) throw new Error('La página respondió con el estado HTTP ' + response.status + '.');
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!ALLOWED_TYPES.some((type) => contentType.startsWith(type))) throw new Error('La dirección no devuelve una página HTML o de texto.');
    const bytes = await readLimitedBody(response);
    return json({
      html: decodeBody(bytes, contentType),
      finalUrl: target.toString(),
      bytes: bytes.byteLength
    });
  } catch (error) {
    return json({ error: error.message || 'No ha sido posible descargar la página.' }, 422);
  }
}

