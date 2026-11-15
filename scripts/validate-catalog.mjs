import { access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(await readFile(join(root, 'catalog-data.json'), 'utf8'));
const tools = catalog.tools;
const expectedCategories = new Set(catalog.categoryOrder);

if (!Array.isArray(tools) || tools.length === 0) throw new Error('El catálogo no contiene herramientas.');

const unique = (field) => new Set(tools.map((tool) => tool[field])).size === tools.length;
for (const field of ['id', 'order', 'slug', 'name', 'href']) {
  if (!unique(field)) throw new Error(`El catálogo contiene valores duplicados en ${field}.`);
}

for (const [index, tool] of tools.entries()) {
  const order = index + 1;
  const expectedId = `U${String(order).padStart(2, '0')}`;
  if (tool.order !== order || tool.id !== expectedId) throw new Error(`Orden incorrecto: se esperaba ${expectedId}.`);
  if (!expectedCategories.has(tool.category)) throw new Error(`Categoría desconocida en ${tool.id}: ${tool.category}.`);
  if (tool.status !== 'available') throw new Error(`${tool.id} no está disponible: ${tool.status}.`);
  if (!tool.href?.startsWith('/') || !tool.href.endsWith('/')) throw new Error(`Ruta inválida en ${tool.id}.`);
  await access(join(root, tool.href.slice(1), 'index.html'));
}

console.log(`CATALOG_OK=${tools.length}`);
