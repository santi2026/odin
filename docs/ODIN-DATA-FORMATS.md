# Formatos de datos de ODÍN

## Copia completa

La copia completa JSON identifica su formato y versión. Administración usa esa información para reconocer qué secciones contiene antes de aplicar nada.

```json
{
  "formato": "odin-copia-v2",
  "version": 2,
  "creado": "2026-11-15T10:00:00.000Z",
  "secciones": {
    "calendario": {},
    "cuentas_atras": {},
    "alarmas": {}
  }
}
```

La importación sigue tres pasos: abrir o pegar, analizar y aplicar. El análisis muestra las secciones detectadas; después se elige cuáles importar. El nombre de una pestaña o de un archivo no decide el destino: lo decide la estructura reconocida.

Las copias `odin-copia-v1` continúan siendo compatibles. Sus cuentas personales se migran a Recordatorios no recurrentes.

## Acontecimientos personales

Cumpleaños, santos, aniversarios y recordatorios pueden exportarse juntos o por categoría en JSON y CSV:

```csv
categoria;nombre;dia;mes;anio;hora;repeticion_anual;anio_conocido
cumpleaños;Ana;14;11;1979;00:00;si;si
cumpleaños;Pedro;23;4;;00:00;si;no
recordatorios;Renovar documento;10;2;2027;09:30;no;si
```

En cumpleaños con año desconocido, `anio` queda vacío y `anio_conocido` utiliza `no`. Cuenta atrás y Calendario consumen la misma sección; no se generan copias duplicadas.

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
