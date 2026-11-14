const byId = (id) => document.getElementById(id);
const elements = {
  address: byId('ip-address'), summary: byId('ip-summary'), location: byId('ip-location'), region: byId('ip-region'),
  provider: byId('ip-provider'), asn: byId('ip-asn'), timezone: byId('ip-timezone'), localTime: byId('ip-local-time'),
  version: byId('ip-version'), details: byId('ip-details'), error: byId('ip-error'), copy: byId('copy-ip'), copyLabel: byId('copy-label')
};
let currentIp = '';
function normalize(data) {
  return { ip: data.ip || '', version: data.version || (data.ip?.includes(':') ? 'IPv6' : 'IPv4'), city: data.city || '', region: data.region || '', country: data.country_name || data.country || '', timezone: data.timezone || '', asn: String(data.asn || ''), provider: data.org || data.asOrganization || data.provider || '' };
}
function show(data) {
  const value = normalize(data); currentIp = value.ip;
  elements.address.textContent = value.ip || 'No disponible';
  elements.summary.textContent = [value.version, value.country].filter(Boolean).join(' · ') || 'Conexión pública';
  elements.location.textContent = value.city || 'Ciudad no disponible';
  elements.region.textContent = [value.region, value.country].filter(Boolean).join(' · ') || 'Ubicación no disponible';
  elements.provider.textContent = value.provider || 'Operador no disponible';
  elements.asn.textContent = value.asn ? `Red ${value.asn.startsWith('AS') ? value.asn : `AS${value.asn}`}` : 'ASN no disponible';
  elements.timezone.textContent = value.timezone || 'No disponible';
  elements.localTime.textContent = value.timezone ? `Hora local ${new Intl.DateTimeFormat('es-ES', { timeZone: value.timezone, hour: '2-digit', minute: '2-digit' }).format(new Date())}` : 'Hora local no disponible';
  elements.version.textContent = value.version; elements.copy.disabled = !value.ip; elements.details.setAttribute('aria-busy', 'false'); elements.error.hidden = true;
}
async function load() {
  elements.details.setAttribute('aria-busy', 'true'); elements.error.hidden = true; elements.address.textContent = 'Consultando…';
  try {
    let response = await fetch('/api/my-ip', { cache: 'no-store' });
    if (!response.ok) throw new Error('local-fallback');
    show(await response.json());
  } catch {
    try {
      const response = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
      if (!response.ok) throw new Error('lookup-failed');
      show(await response.json());
    } catch {
      elements.address.textContent = 'No disponible'; elements.summary.textContent = 'Error de consulta'; elements.details.setAttribute('aria-busy', 'false'); elements.error.hidden = false;
    }
  }
}
elements.copy.addEventListener('click', async () => { if (!currentIp) return; await navigator.clipboard.writeText(currentIp); elements.copyLabel.textContent = 'Copiada'; setTimeout(() => { elements.copyLabel.textContent = 'Copiar IP'; }, 1600); });
byId('refresh-ip').addEventListener('click', load);
load();
