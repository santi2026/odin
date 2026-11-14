# U04 · Concentración · Pomodoro

Estado: planificado.

## Funcionamiento

- Ciclos configurables de concentración, descanso corto y descanso largo.
- Duraciones predeterminadas inspiradas en Pomodoro, pero editables.
- Número de sesiones por ciclo configurable.
- Pausar, continuar, saltar una fase y restablecer.
- Historial básico de sesiones completadas.

## Persistencia global obligatoria

- Una fase activa debe continuar con tiempo real aunque se cambie a cualquier otra herramienta de ODÍN.
- Cerrar y volver a abrir la página no debe reiniciar ni falsear el tiempo transcurrido.
- La portada mostrará la fase activa, el tiempo restante y el progreso del ciclo.
- Al finalizar una fase se utilizará el sistema global de avisos ya compartido por Temporizador y Alarmas.
- El aviso será visual y sonoro, respetará el sonido elegido y podrá silenciarse.
- El aviso completo será pulsable y llevará de vuelta a Concentración · Pomodoro.
- Debe distinguir claramente «Concentración terminada» y «Descanso terminado».

## Comportamiento al terminar una fase

La siguiente fase quedará preparada y visible. Antes del desarrollo se decidirá en el boceto si debe iniciarse automáticamente o requerir confirmación; esta elección podrá convertirse en una preferencia recordada.
