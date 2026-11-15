import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
await mkdir(dist, { recursive: true });
await cp(join(root, 'preview-home', 'index.html'), join(dist, 'index.html'), { force: true });
await cp(join(root, 'global-timer.js'), join(dist, 'global-timer.js'), { force: true });
await cp(join(root, 'time-center.js'), join(dist, 'time-center.js'), { force: true });
await cp(join(root, 'calendar-data.js'), join(dist, 'calendar-data.js'), { force: true });
await cp(join(root, 'logo.ico'), join(dist, 'logo.ico'), { force: true });

for (const folder of ['preview','preview-home','preview-ip','preview-world','preview-timer','preview-alarms','preview-focus','preview-countdown','preview-moon','preview-calendar','preview-dates','preview-convert','preview-qr','preview-html-text','preview-codec','preview-password','preview-identifiers']) {
  await cp(join(root, folder), join(dist, folder), { recursive: true, force: true });
}

await mkdir(join(dist, 'src', 'styles'), { recursive: true });
await cp(join(root, 'src', 'styles', 'global.css'), join(dist, 'src', 'styles', 'global.css'), { force: true });
await writeFile(join(dist, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(self), microphone=(), geolocation=()\n`, 'utf8');
await writeFile(join(dist, '_routes.json'), JSON.stringify({ version: 1, include: ['/api/*'], exclude: [] }, null, 2), 'utf8');

const home = await readFile(join(dist, 'index.html'), 'utf8');
if (!home.includes('/preview-home/home.js')) throw new Error('La portada estática no contiene su script principal.');
console.log(`STATIC_BUILD=${dist}`);
