export function normalizeUrl(value = '') {
  const url = value.trim();
  if (!url) return '';
  return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : 'https://' + url;
}

export function escapeWifi(value = '') {
  return String(value).replace(/([\\;,:""])/g, '\\$1');
}

export function escapeVCard(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

export function formatCalendarDate(date = '', time = '') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return '';
  return date.replaceAll('-', '') + 'T' + time.replace(':', '') + '00';
}

const compact = (lines) => lines.filter(Boolean).join('\r\n');

export function buildQrContent(type, data = {}) {
  switch (type) {
    case 'text':
      return String(data.text || '').trim();
    case 'url':
      return normalizeUrl(data.url);
    case 'wifi': {
      const security = data.security === 'nopass' ? 'nopass' : (data.security || 'WPA');
      const password = security === 'nopass' ? '' : escapeWifi(data.password || '');
      return data.ssid ? 'WIFI:T:' + security + ';S:' + escapeWifi(data.ssid) + ';P:' + password + ';H:' + (data.hidden ? 'true' : 'false') + ';;' : '';
    }
    case 'contact': {
      const name = escapeVCard(data.name || '');
      if (!name) return '';
      return compact([
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:;' + name + ';;;',
        'FN:' + name,
        data.organization && 'ORG:' + escapeVCard(data.organization),
        data.phone && 'TEL;TYPE=CELL:' + escapeVCard(data.phone),
        data.email && 'EMAIL:' + escapeVCard(data.email),
        data.address && 'ADR;TYPE=HOME:;;' + escapeVCard(data.address) + ';;;;',
        'END:VCARD'
      ]);
    }
    case 'phone':
      return data.phone ? 'tel:' + String(data.phone).trim() : '';
    case 'email': {
      const email = String(data.email || '').trim();
      if (!email) return '';
      const params = new URLSearchParams();
      if (data.subject) params.set('subject', data.subject);
      if (data.body) params.set('body', data.body);
      return 'mailto:' + email + (params.size ? '?' + params.toString() : '');
    }
    case 'sms':
      return data.phone ? 'SMSTO:' + String(data.phone).trim() + ':' + String(data.message || '') : '';
    case 'location': {
      const lat = String(data.latitude || '').trim();
      const lon = String(data.longitude || '').trim();
      if (!lat || !lon) return '';
      const label = String(data.label || '').trim();
      return label ? 'geo:' + lat + ',' + lon + '?q=' + lat + ',' + lon + '(' + encodeURIComponent(label) + ')' : 'geo:' + lat + ',' + lon;
    }
    case 'event': {
      const start = formatCalendarDate(data.startDate, data.startTime);
      const end = formatCalendarDate(data.endDate, data.endTime);
      if (!data.title || !start || !end) return '';
      return compact([
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ODIN//Generador QR//ES',
        'BEGIN:VEVENT',
        'SUMMARY:' + escapeVCard(data.title),
        'DTSTART:' + start,
        'DTEND:' + end,
        data.location && 'LOCATION:' + escapeVCard(data.location),
        data.description && 'DESCRIPTION:' + escapeVCard(data.description),
        'END:VEVENT',
        'END:VCALENDAR'
      ]);
    }
    default:
      return '';
  }
}


