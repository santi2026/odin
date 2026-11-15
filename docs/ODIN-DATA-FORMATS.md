# Formatos de datos de ODÍN

## Copia completa

La copia completa JSON identifica su formato y versión. Administración usa esa información para reconocer qué secciones contiene antes de aplicar nada.

```json
{
  "format": "odin-copia-v1",
  "exportedAt": "2026-11-15T10:00:00.000Z",
  "sections": {
    "calendar": {},
    "countdowns": {},
    "alarms": {}
  }
}
```

La importación sigue tres pasos: abrir o pegar, analizar y aplicar. El análisis muestra las secciones detectadas; después se elige cuáles importar. El nombre de una pestaña o de un archivo no decide el destino: lo decide la estructura reconocida.

## Periodos de calendario

Para intercambiar vacaciones y otros periodos se admite CSV separado por punto y coma:

```csv
tipo;nombre;desde;hasta;lugar;descripcion
vacaciones;Vacaciones de Navidad;2026-12-21;2027-01-10;;
otros;Festivo en Barcelona · La Mercè;2027-09-24;2027-09-24;Barcelona;Festivo local
```

Reglas:

- `tipo`: `vacaciones` u `otros`.
- `nombre`: texto visible en el calendario.
- `desde` y `hasta`: fecha ISO `AAAA-MM-DD`.
- `lugar` y `descripcion`: opcionales.
- Un periodo puede cruzar años.
- Los festivos locales variables deben importarse como `otros`, no como reglas recurrentes.

## Importación segura

- Analizar nunca modifica datos.
- Aplicar solo modifica las secciones marcadas.
- Los elementos repetidos pueden conservarse para permitir edición o duplicación intencionada.
- Antes de una importación grande, exportar una copia completa.
