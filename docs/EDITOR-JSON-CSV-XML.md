# Editor JSON, CSV y XML

El editor U19 procesa todos los ficheros localmente en el navegador, con un límite de 5 MB. Permite abrir JSON, CSV y XML y trabajar con una representación JSON interna en las vistas de código, tabla y árbol.

## CSV

- Detecta coma, punto y coma o tabulador.
- Exige cabeceras únicas y filas con el mismo número de columnas.
- Reconoce de forma prudente números, booleanos, `null` y celdas con JSON; conserva como texto valores como `007`.
- Al guardar, permite elegir una tabla detectada.
- Si el documento contiene varias tablas, puede crear un ZIP con un CSV por tabla y `manifest.json`, que conserva la ruta JSON y el número de registros.

## XML de ODÍN

El formato `odin-json-editor-v1` guarda el tipo de cada nodo. Arrays, objetos, números, booleanos, valores nulos y claves que no son nombres XML se reconstruyen sin pérdidas al volver a abrir el archivo.

## XML externo

No existe una conversión universal entre XML y JSON. Antes de abrir XML ajeno a ODÍN se muestra una advertencia. La conversión usa estas reglas:

- Los atributos se guardan en `@attributes`.
- El texto de elementos con atributos o hijos se guarda en `#text`.
- Las etiquetas hermanas repetidas se convierten en arrays.
- Los nombres de etiqueta, incluidos prefijos de espacio de nombres, se conservan como claves.
- Los valores se mantienen como texto para evitar inferencias destructivas.

## Exportación

- JSON guarda el documento completo.
- XML guarda el documento completo con metadatos de tipo de ODÍN.
- CSV guarda una tabla elegida.
- ZIP CSV guarda todas las tablas detectadas y su manifiesto.
