# ODÍN

Colección de utilidades web cotidianas, rápidas y centradas en la privacidad. Funciona como sitio estático: los datos y preferencias se conservan en el navegador y no requieren una cuenta.

- Producción: <https://odin.santiagosanz.info/>
- Publicación: GitHub → Cloudflare Pages
- Catálogo: 16 herramientas disponibles y 2 previstas, numeradas de U01 a U18
- Administración: acceso independiente desde la cabecera; no forma parte del catálogo ni recibe número U

## Herramientas

| ID | Herramienta | Categoría |
|---|---|---|
| U01 | Reloj negro | Tiempo |
| U02 | Calendario | Tiempo |
| U03 | Cuenta atrás | Tiempo |
| U04 | Alarmas | Tiempo |
| U05 | Temporizador y cronómetro | Tiempo |
| U06 | Concentración · Pomodoro | Productividad |
| U07 | Calculadora de fechas | Cálculo |
| U08 | Conversor universal | Cálculo |
| U09 | Relojes del mundo | Tiempo |
| U10 | Fases lunares | Tiempo |
| U11 | Mi IP | Conexión |
| U12 | Códigos QR | Creación |
| U13 | HTML a texto | Texto y datos |
| U14 | Codificador de texto y URL | Texto y datos |
| U15 | Generador de contraseñas | Seguridad |
| U16 | Identificadores y dígitos de control | Seguridad |
| U17 | Taller de texto (próxima) | Texto y datos |
| U18 | Gastos compartidos (planificada) | Cálculo |

## Herramientas previstas

- **U17 · Taller de texto:** transforma mayúsculas, minúsculas y estilos; ordena y depura listas; busca y reemplaza; cuenta caracteres y palabras; limpia texto y extrae correos y URL.
- **U18 · Gastos compartidos:** registra varias facturas con uno o varios pagadores, las reparte entre personas o familias y propone una liquidación comprensible con pocas operaciones.

El motor de U18 será determinista y funcionará sin IA. Antes de publicarlo se retará con numerosos casos simples, familiares, parciales, con varios pagadores, redondeos y saldos cruzados. Cada resultado se comprobará mediante invariantes matemáticas, resultados esperados y validaciones externas asistidas por IA. La herramienta no se considerará terminada hasta superar esa batería.

La fuente única del orden, numeración, categorías, rutas y textos es `catalog-data.json`. No se deben mantener listas paralelas.

## Desarrollo y comprobación

```powershell
npm install
npm run check:catalog
npm run build:static
```

El resultado publicable queda en `dist/`. El constructor valida primero que los IDs sean consecutivos, que no existan duplicados y que cada ruta tenga su página.

## Arquitectura

- `catalog-data.json`: registro central del catálogo.
- `preview-home/`: portada y carátulas dinámicas.
- `preview-*/`: herramientas independientes.
- `time-center.js` y `global-timer.js`: cabecera común, avisos y control temporal compartido.
- `preview-admin/`: copias, importación y restablecimiento.
- `build-static.mjs`: genera `dist/` para Cloudflare Pages.
- `calendar-data.js`: datos base del calendario.

El árbol Astro de `src/` se conserva como base tipada, pero la publicación actual utiliza el constructor estático. Su adaptador de catálogo también lee `catalog-data.json`.

## Datos y copias

ODÍN usa principalmente `localStorage`. Administración permite exportar una copia completa o secciones independientes, analizar una importación antes de aplicarla y restablecer los datos seleccionados. Los CSV usan punto y coma (`;`).

Consulta [Operación](docs/ODIN-OPERATIONS.md), [formatos de datos](docs/ODIN-DATA-FORMATS.md) y [ampliación del proyecto](docs/ODIN-EXTENDING.md).
