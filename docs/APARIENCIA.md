# Apariencia de ODÍN

El botón situado a la izquierda de Catálogo permite elegir Automático (preferencia del dispositivo), Noche o Día. Los usuarios sin preferencia guardada mantienen Noche. La elección se conserva en el navegador y se sincroniza entre pestañas y las ventanas flotantes de calculadora y centro de tiempo.

Administración incluye «Apariencia · automático, noche y día» entre las preferencias exportables, importables y restablecibles. Restablecerla devuelve Noche.

`theme.js` aplica el tema antes de mostrar el contenido y monta el menú accesible con navegación por teclado. `theme.css` contiene el control y los ajustes comunes. `scripts/build-theme.mjs` genera las variantes claras por página a partir de las hojas originales: no altera geometría, tipografía ni el modo Noche. Las caras de reloj, sus colores personalizados y las ilustraciones conservan su diseño. Al cambiar estilos de una herramienta, ejecutar el build y revisar también el tema Día; las reglas de conversión proporcionan la base de la paleta, pero no sustituyen la revisión visual.

Comprobación: `node scripts/test-theme.mjs`, `npm run build` y `npm run build:static`.
