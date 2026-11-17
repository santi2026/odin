import { access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(await readFile(join(root, 'catalog-data.json'), 'utf8'));
const tools = catalog.tools;
const expectedCategories = new Set(catalog.categoryOrder);

if (!Array.isArray(tools) || tools.length === 0) throw new Error('El catálogo no contiene herramientas.');

const unique = (field) => new Set(tools.map((tool) => tool[field])).size === tools.length;
for (const field of ['id', 'order', 'slug', 'name']) {
  if (!unique(field)) throw new Error(`El catálogo contiene valores duplicados en ${field}.`);
}

const routes = tools.map((tool) => tool.href).filter(Boolean);
if (new Set(routes).size !== routes.length) throw new Error('El catálogo contiene rutas duplicadas.');

const orders=new Set(),ids=new Set();
for (const tool of tools) {
  const expectedId = `U${String(tool.order).padStart(2, '0')}`;
  if (!Number.isInteger(tool.order)||tool.order<1||tool.order>tools.length||tool.id!==expectedId) throw new Error(`Orden incorrecto en ${tool.slug}: se esperaba ${expectedId}.`);
  if(orders.has(tool.order)||ids.has(tool.id))throw new Error(`Orden o identificador duplicado: ${tool.id}.`);orders.add(tool.order);ids.add(tool.id);
  if (!expectedCategories.has(tool.category)) throw new Error(`Categoría desconocida en ${tool.id}: ${tool.category}.`);
  if (!['available', 'next', 'planned'].includes(tool.status)) throw new Error(`Estado desconocido en ${tool.id}: ${tool.status}.`);
  if (tool.status === 'available') {
    if (!tool.href?.startsWith('/') || !tool.href.endsWith('/')) throw new Error(`Ruta inválida en ${tool.id}.`);
    await access(join(root, tool.href.slice(1), 'index.html'));
  } else if (tool.href) {
    throw new Error(`${tool.id} no debe enlazar a una pantalla antes de estar disponible.`);
  }
}
if(orders.size!==tools.length||![...orders].every(order=>order>=1&&order<=tools.length))throw new Error('El orden del catálogo debe ser continuo.');

console.log(`CATALOG_OK=${tools.length}`);
