# U18 · Caso real: comida compartida entre 23 comensales

## Objetivo

Este caso comprueba conjuntamente:

- siete familias y veintitrés personas;
- familias de tres y cuatro miembros;
- cinco facturas independientes;
- cuatro familias pagadoras;
- reparto igualitario entre todos los comensales;
- agrupación final de los saldos por familia;
- conservación exacta de los céntimos;
- generación de un plan de pagos mínimo verificado;
- exportación e importación sin alterar el resultado.

El archivo importable es `preview-shared-expenses/examples/caso-real-comida-23.json`. También puede descargarse desde la ventana **Importar** de U18.

## Datos de entrada

| Familia | Comensales | Pagos realizados |
|---|---:|---|
| Fer&Raq | 4 | Frutería: 50,00 € |
| Con&Ton | 4 | — |
| Gustavo | 3 | Espucarn: 140,00 € |
| Jau&Xes | 3 | Mercadona: 80,00 €; hielo: 10,00 € |
| Sil&San | 3 | Mercadona: 45,50 € |
| Jaume | 3 | — |
| Isa&Sol | 3 | — |
| **Total** | **23** | **325,50 €** |

La fecha original no fue indicada. El fichero utiliza `16/11/2026` únicamente como fecha técnica del caso de prueba.

## Regla de redondeo

El coste matemático es `325,50 € / 23 = 14,152173… €` por persona. No es posible cobrar fracciones de céntimo:

- cinco personas asumen 14,16 €;
- dieciocho personas asumen 14,15 €;
- total exacto: 325,50 €.

Como existen cinco facturas independientes, sus céntimos sobrantes se rotan entre participantes. De este modo una misma persona o familia no recibe sistemáticamente todos los redondeos por aparecer primero.

## Resultado esperado

En ODÍN un balance positivo significa que la familia debe **recibir**; uno negativo significa que debe **pagar**.

| Familia | Pagó | Le correspondía | Balance final |
|---|---:|---:|---:|
| Con&Ton | 0,00 € | 56,61 € | Paga 56,61 € |
| Fer&Raq | 50,00 € | 56,61 € | Paga 6,61 € |
| Gustavo | 140,00 € | 42,46 € | Recibe 97,54 € |
| Isa&Sol | 0,00 € | 42,45 € | Paga 42,45 € |
| Jau&Xes | 90,00 € | 42,46 € | Recibe 47,54 € |
| Jaume | 0,00 € | 42,45 € | Paga 42,45 € |
| Sil&San | 45,50 € | 42,46 € | Recibe 3,04 € |
| **Total** | **325,50 €** | **325,50 €** | **0,00 €** |

## Plan de pagos esperado

ODÍN encuentra y verifica este plan de seis operaciones:

1. Con&Ton paga 56,61 € a Gustavo.
2. Isa&Sol paga 40,93 € a Gustavo.
3. Isa&Sol paga 1,52 € a Jau&Xes.
4. Jaume paga 42,45 € a Jau&Xes.
5. Fer&Raq paga 3,57 € a Jau&Xes.
6. Fer&Raq paga 3,04 € a Sil&San.

Comprobaciones:

- quienes pagan transfieren exactamente `56,61 + 42,45 + 42,45 + 6,61 = 148,12 €`;
- quienes reciben cobran exactamente `97,54 + 47,54 + 3,04 = 148,12 €`;
- después de las seis transferencias, todos los saldos quedan a cero;
- el optimizador marca el resultado como **mínimo verificado**.

## Error detectado en el cálculo antiguo

El resultado histórico era muy cercano, pero no cerraba contablemente:

- sus cuotas familiares sumaban 325,52 €, aunque el gasto era 325,50 €;
- Jaume e Isa&Sol figuraban con 42,46 € cada uno, cuando ambos deben asumir 42,45 € tras repartir los céntimos;
- Gustavo figuraba con 97,54 € por cobrar, pero las transferencias propuestas le entregaban 97,56 €.

El caso de prueba evita “corregir” esas diferencias al final: todos los céntimos quedan asignados desde el reparto inicial y las transferencias se calculan a partir de saldos que ya suman exactamente cero.

## Procedimiento manual de aceptación

1. Abrir U18 · Gastos compartidos.
2. Pulsar **Importar**.
3. Descargar el caso de prueba o seleccionar el JSON guardado.
4. Comprobar que el análisis previo muestra 7 familias, 23 personas, 5 facturas, 325,50 € y 6 transferencias.
5. Importarlo como reparto nuevo.
6. Revisar las pestañas **Balance**, **Liquidar** y **Resumen** frente a las tablas anteriores.
7. Volver a exportarlo, importarlo de nuevo y confirmar que los resultados no cambian.
