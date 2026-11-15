# Añadir futuras funciones a ODÍN

## Nueva herramienta

1. Elegir el siguiente ID consecutivo.
2. Crear una carpeta `preview-nombre/` con su `index.html`, estilos y scripts.
3. Añadir la carpeta a la lista de copia de `build-static.mjs`.
4. Añadir una sola entrada a `catalog-data.json`.
5. Ejecutar `npm run build:static`; la validación detectará IDs, rutas o categorías incorrectos.
6. Probar escritorio, móvil, almacenamiento y navegación por teclado.
7. Documentar cualquier nueva clave de almacenamiento en Administración.

No se añade una ficha para funciones internas como Administración. Las funciones globales se enlazan desde la cabecera y no consumen un número U.

## Nueva sección de datos

Si una función guarda información persistente:

1. Usar una clave versionada, por ejemplo `odin-ejemplo-v1`.
2. Definir valores predeterminados y recuperación ante JSON inválido.
3. Añadir la sección a la copia completa de Administración.
4. Permitir exportación e importación individual cuando los datos sean valiosos.
5. Mostrar en el análisis el número de elementos que se aplicarán.
6. Incorporar la sección al restablecimiento selectivo.
7. Mantener compatibilidad con copias antiguas o documentar una migración.

## Criterios de diseño

- Funciona sin cuenta y, siempre que sea posible, sin servidor.
- No ejecutar contenido pegado por el usuario.
- Explicar los límites de precisión y las fuentes externas.
- Recordar preferencias sin guardar secretos o historiales innecesarios.
- Mantener operativos el centro de tiempo, alarmas y temporizadores en todas las páginas.
- Evitar duplicar catálogos, constantes o formatos en distintos archivos.
