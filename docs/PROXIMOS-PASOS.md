# Próximos pasos de ODÍN

## Relojes y Centro de tiempo

### 1. Reparar la incidencia técnica del reloj

- Unificar las implementaciones duplicadas de `src/scripts/clock.ts` y `preview/clock.js`.
- Aislar el reloj como módulo y corregir los tipos de sus controles HTML.
- Conseguir que la comprobación general de tipos y el `build` terminen sin los 51 errores actuales.
- Verificar que se conservan el movimiento, la personalización, la pantalla completa y la configuración local del reloj.

### 2. Explorar una sección de relojes

Valorar una herramienta que reúna varios relojes con diseños y usos diferentes. La propuesta deberá mantener el ancho, la tipografía y los patrones visuales comunes de ODÍN y permitir crecer sin convertir cada diseño en una herramienta aislada.

### 3. Diseñar un Centro de control flotante y modular

Estudiar una ventana compacta y siempre visible fuera de la ventana principal del navegador, siguiendo la experiencia de la calculadora flotante. Podría incluir módulos activables para:

- Hora y fecha.
- Alarmas activas y sus próximos avisos.
- Cuentas atrás en curso.
- Temporizadores y sesiones de concentración.
- Accesos rápidos para pausar, reanudar, silenciar o abrir cada herramienta.

El estado deberá mantenerse sincronizado con ODÍN al abrir, cerrar o cambiar el tamaño de la ventana flotante. El Centro de control podría abrirse desde la futura sección de relojes y también desde el Centro de tiempo de la cabecera.

Antes de desarrollarlo se preparará una propuesta funcional y visual que defina módulos, tamaños, comportamiento fuera del navegador, persistencia y límites técnicos del modo siempre visible.

### 4. Incorporar modos Día y Noche

Diseñar un sistema global de apariencia basado en CSS que permita alternar entre un modo Día y el actual modo Noche. El cambio deberá aplicarse de forma coherente a la portada, la cabecera, el Centro de tiempo, Administración y todas las herramientas.

- Centralizar colores, fondos, bordes, sombras y estados mediante variables CSS compartidas.
- Mantener el modo Noche como diseño oscuro de referencia y crear un modo Día con contraste y legibilidad equivalentes.
- Permitir elegir entre Día, Noche y, si resulta útil, la preferencia automática del sistema.
- Guardar la elección en la configuración local de ODÍN e incluirla en las copias de seguridad y restauraciones.
- Evitar destellos del tema incorrecto durante la carga y respetar las preferencias de accesibilidad del navegador.
- Revisar imágenes, gráficos, lunas, códigos, formularios, estados activos y ventanas flotantes en ambos modos.

Antes de extenderlo a toda la aplicación se preparará una muestra visual representativa y se definirá el contrato de variables CSS para que las herramientas futuras nazcan compatibles con ambos modos.

### 5. Estudiar el cálculo del ascendente

Valorar la incorporación del ascendente al módulo de Zodiacos y tradiciones. El cálculo deberá partir de la fecha, la hora exacta y el lugar de nacimiento, por lo que antes de desarrollarlo habrá que:

- Revisar si Cumpleaños ya conserva la hora de nacimiento y adaptar su formulario y sus copias de seguridad si fuera necesario.
- Determinar la precisión requerida para el lugar de nacimiento: país y población, población seleccionada de un catálogo o coordenadas geográficas.
- Comprobar si también se necesita conocer la zona horaria histórica y los cambios de horario aplicables a la fecha y al lugar de nacimiento.
- Definir una forma sencilla y privada de obtener las coordenadas cuando sean necesarias.

Si ODÍN necesita coordenadas exactas, el formulario podría permitir pegarlas manualmente y ofrecer un acceso en una ventana nueva a un buscador cartográfico o geográfico. También se podrá estudiar un asistente que ayude a localizar las coordenadas, pero el cálculo no deberá depender obligatoriamente de Google, ChatGPT ni de un servicio externo. La propuesta final deberá explicar qué datos se guardan, cómo se exportan y qué precisión puede esperarse del resultado.

## Roadmap

1. **Estabilización:** reparar el reloj, eliminar los errores de tipos y recuperar un `build` limpio.
2. **Relojes:** definir visualmente la sección, sus diseños iniciales y una estructura ampliable.
3. **Centro de control:** diseñar y desarrollar la ventana flotante modular, conectada con Relojes y el Centro de tiempo.
4. **Apariencia global:** incorporar los modos Día, Noche y, si se aprueba, Automático a todas las herramientas.
5. **Ascendente:** cerrar primero la investigación de precisión, localización y zonas horarias; después adaptar Cumpleaños, Zodiacos y las copias de seguridad.
6. **Validación y publicación:** comprobar conjuntamente escritorio, móvil, ventanas flotantes, persistencia, copias y restauración.
