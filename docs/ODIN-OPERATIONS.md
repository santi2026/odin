# Operación y publicación de ODÍN

## Flujo normal

1. Modificar el código en una rama de trabajo.
2. Ejecutar `npm run build:static`.
3. Revisar `git diff --check` y la portada local.
4. Confirmar los cambios y enviarlos a GitHub.
5. Cloudflare Pages construye y publica el sitio.
6. Verificar <https://odin.santiagosanz.info/> y la herramienta modificada.

## Construcción

```powershell
npm run check:catalog
npm run build:static
```

`build:static` valida el catálogo y genera `dist/`. La carpeta `dist/` es un resultado de construcción, no la fuente de verdad.

## Comprobaciones mínimas

- La portada muestra 16 herramientas y U01–U16 sin saltos.
- Catálogo y Administración aparecen en la cabecera.
- Cada tarjeta abre su herramienta completa.
- No hay desplazamiento horizontal en móvil.
- Temporizadores y alarmas continúan visibles entre páginas.
- Administración analiza una copia antes de importarla.
- La consola no muestra errores de JavaScript ni caracteres dañados.

## Publicación y recuperación

GitHub conserva el historial del código. Los datos personales del navegador no se guardan en GitHub ni en Cloudflare; deben protegerse mediante las exportaciones de Administración. Antes de un cambio amplio, conviene exportar una copia completa JSON.

Si una publicación falla, revisar primero el registro de Cloudflare Pages y reproducir localmente `npm run build:static`. No modificar directamente `dist/` para corregir una fuente.
