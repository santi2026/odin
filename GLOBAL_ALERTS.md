# Avisos globales de ODÍN

`global-timer.js` se carga desde `BaseLayout.astro`; todas las herramientas nuevas deben utilizar ese layout. El controlador mantiene activos los avisos del temporizador y de las alarmas durante la navegación por ODÍN. Cada aviso es pulsable y abre la herramienta que lo originó.

Las herramientas futuras pueden reutilizar el sistema mediante el evento `odin:alert`, pasando los valores `badge`, `title`, `message` y `href`.

Las alarmas usarán la clave local `odin-alarms-v1` y el controlador global abrirá `/preview-alarms/` cuando una alarma finalice.
