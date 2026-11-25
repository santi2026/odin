# ODÍN

Colección de utilidades web cotidianas, rápidas y centradas en la privacidad. Funciona como sitio estático: los datos y preferencias se conservan en el navegador y no requieren una cuenta.

- Producción: <https://odin.santiagosanz.info/>
- Publicación: GitHub → Cloudflare Pages
- Catálogo: 21 herramientas disponibles, numeradas de U01 a U21
- Administración: acceso independiente desde la cabecera; no forma parte del catálogo ni recibe número U

## Herramientas

| ID | Herramienta | Categoría |
|---|---|---|
| U01 | Relojes | Tiempo |
| U02 | Calendario | Tiempo |
| U03 | Cuenta atrás | Tiempo |
| U04 | Alarmas | Tiempo |
| U05 | Temporizador y cronómetro | Tiempo |
| U06 | Concentración · Pomodoro | Tiempo |
| U07 | Gastos compartidos | Cálculo |
| U08 | Editor JSON, CSV y XML | Texto y datos |
| U09 | Calculadora de fechas | Cálculo |
| U10 | Conversor universal | Cálculo |
| U11 | Relojes del mundo | Tiempo |
| U12 | Fases lunares | Tiempo |
| U13 | Taller de texto | Texto y datos |
| U14 | HTML a texto | Texto y datos |
| U15 | Codificador de texto y URL | Texto y datos |
| U16 | Códigos QR | Digital |
| U17 | Generador de contraseñas | Digital |
| U18 | Identificadores y dígitos de control | Digital |
| U19 | Mi IP | Digital |
| U20 | Calculadora | Cálculo |
| U21 | Zodiacos y tradiciones | Tiempo |

La fuente única del orden, numeración, categorías, rutas y textos es `catalog-data.json`. No se deben mantener listas paralelas.

## Desarrollo y comprobación

```powershell
npm install
npm run check:catalog
npm run test:calculator
npm run test:zodiac
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

Consulta [Operación](docs/ODIN-OPERATIONS.md), [formatos de datos](docs/ODIN-DATA-FORMATS.md), [ampliación del proyecto](docs/ODIN-EXTENDING.md) y [próximos pasos](docs/PROXIMOS-PASOS.md).
