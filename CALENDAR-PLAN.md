# U12 · Calendario — alcance previsto

Estado: planificado. Antes de implementarlo se preparará y validará un boceto visual.

## Navegación temporal

- Mostrar el mes actual al entrar.
- Alternar entre una vista mensual detallada y una vista anual completa con los doce meses.
- Consultar una fecha concreta.
- Avanzar o retroceder por meses y años.
- Saltar directamente a cualquier año.
- Calcular correctamente años bisiestos y la duración real de cada mes.

## Capas de festivos

- Festivos nacionales de España.
- Festivos aplicables a Madrid.
- Festivos aplicables a Barcelona.
- Cada capa se podrá activar o desactivar de forma independiente.
- Se distinguirán los **festivos de fecha fija** de los **festivos móviles o variables**, cuya fecha debe obtenerse para cada año.
- Los días de libre elección o designación anual no se tratarán como recurrentes sin disponer del calendario oficial de ese año.

## Representación visual

- Color propio por ámbito: España, Madrid y Barcelona.
- Leyenda siempre visible.
- Una fecha con varias festividades mostrará concurrencia mediante segmentos, puntos o bandas de varios colores, sin ocultar ninguna capa.
- Al seleccionar un día se mostrarán el nombre oficial, el ámbito y el tipo de festividad.
- El diseño debe seguir siendo comprensible en móvil y no depender únicamente del color.

## Boceto previo obligatorio

Antes del desarrollo se compararán al menos estas vistas:

1. Calendario mensual clásico con capas.
2. Vista anual compacta para localizar festivos.
3. Panel de detalle del día seleccionado y tratamiento de coincidencias.
