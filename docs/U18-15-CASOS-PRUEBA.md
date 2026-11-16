# U18 · Quince casos de prueba y resultados esperados

Generados el 2026-11-16. Los casos 1–14 deben importarse correctamente; el caso 15 debe ser rechazado.

## Resumen

| Nº | Caso | Archivo | Resultado esperado |
|---:|---|---|---|
| 1 | Ejemplo completo · 23 comensales y 7 familias | `01-ejemplo-23-comensales.json` | 665,35 €; 6 transferencias |
| 2 | Dos amigos · uno paga todo | `02-dos-amigos-un-pagador.json` | 100,00 €; 1 transferencias |
| 3 | Cinco amigos · dos facturas y dos pagadores | `03-cinco-amigos-dos-pagadores.json` | 250,00 €; 3 transferencias |
| 4 | Una factura · varios pagadores | `04-una-factura-varios-pagadores.json` | 120,00 €; 3 transferencias |
| 5 | Familias de 1, 2 y 4 personas | `05-familias-tamanos-diferentes.json` | 210,00 €; 2 transferencias |
| 6 | Adultos y niños · reparto por participaciones | `06-adultos-ninos-por-peso.json` | 90,00 €; 1 transferencias |
| 7 | Cambio global sin editar facturas | `07-participantes-distintos-por-factura.json` | 550,00 €; 2 transferencias |
| 8 | Importes exactos personalizados | `08-reparto-importes-exactos.json` | 100,00 €; 2 transferencias |
| 9 | Liquidación individual con cuentas familiares | `09-liquidacion-individual-con-familias.json` | 120,00 €; 4 transferencias |
| 10 | Todos pagaron exactamente su parte | `10-todos-pagaron-su-parte.json` | 100,00 €; 0 transferencias |
| 11 | Compensación circular | `11-compensacion-circular.json` | 60,00 €; 2 transferencias |
| 12 | Redondeo · 10 € entre tres | `12-redondeo-diez-entre-tres.json` | 10,00 €; 2 transferencias |
| 13 | Doce saldos · plan simplificado | `13-grupo-grande-plan-simplificado.json` | 6,00 €; 8 transferencias |
| 14 | Exportación e importación idénticas | `14-exportacion-importacion-identica.json` | 123,45 €; 2 transferencias |
| 15 | Archivo manipulado · debe rechazarse | `15-archivo-manipulado-rechazado.json` | Importación bloqueada |

## 1. Ejemplo completo · 23 comensales y 7 familias

Validar once compras, seis familias pagadoras, nombres individuales, comercios, tipos de compra y reparto equitativo de céntimos.

**Evaluación IA:** Debe cerrar 665,35 € sin ajustes manuales. Familia Robles y Familia Mar pagan; las otras cinco familias reciben exactamente sus adelantos.

- Familias: 7.
- Personas: 23.
- Facturas: 11.
- Total: **665,35 €**.
- Balance global: **0,00 €**.
- Optimización: **minimo verificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Familia Campos | 111,45 € | 86,79 € | Cobra 24,66 € |
| Familia Luna | 101,00 € | 86,78 € | Cobra 14,22 € |
| Familia Mar | 0,00 € | 86,76 € | Paga 86,76 € |
| Familia Ríos | 92,15 € | 86,79 € | Cobra 5,36 € |
| Familia Robles | 81,20 € | 115,72 € | Paga 34,52 € |
| Familia Soler | 148,60 € | 86,79 € | Cobra 61,81 € |
| Familia Vega | 130,95 € | 115,72 € | Cobra 15,23 € |

### Transferencias esperadas

1. **Familia Mar** paga **61,81 €** a **Familia Soler**.
2. **Familia Mar** paga **24,66 €** a **Familia Campos**.
3. **Familia Mar** paga **0,29 €** a **Familia Vega**.
4. **Familia Robles** paga **14,94 €** a **Familia Vega**.
5. **Familia Robles** paga **14,22 €** a **Familia Luna**.
6. **Familia Robles** paga **5,36 €** a **Familia Ríos**.

## 2. Dos amigos · uno paga todo

Validar la división elemental y una única transferencia.

**Evaluación IA:** Cada persona asume 50,00 €. Beto paga 50,00 € a Ana.

- Familias: 0.
- Personas: 2.
- Facturas: 1.
- Total: **100,00 €**.
- Balance global: **0,00 €**.
- Optimización: **minimo verificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Ana | 100,00 € | 50,00 € | Cobra 50,00 € |
| Beto | 0,00 € | 50,00 € | Paga 50,00 € |

### Transferencias esperadas

1. **Beto** paga **50,00 €** a **Ana**.

## 3. Cinco amigos · dos facturas y dos pagadores

Comprobar la compensación de varios adelantos.

**Evaluación IA:** Cada persona asume 50,00 €. Ana y Beto recuperan sus adelantos mediante un plan compensado.

- Familias: 0.
- Personas: 5.
- Facturas: 2.
- Total: **250,00 €**.
- Balance global: **0,00 €**.
- Optimización: **minimo verificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Ana | 100,00 € | 50,00 € | Cobra 50,00 € |
| Beto | 150,00 € | 50,00 € | Cobra 100,00 € |
| Carla | 0,00 € | 50,00 € | Paga 50,00 € |
| David | 0,00 € | 50,00 € | Paga 50,00 € |
| Eva | 0,00 € | 50,00 € | Paga 50,00 € |

### Transferencias esperadas

1. **Carla** paga **50,00 €** a **Beto**.
2. **David** paga **50,00 €** a **Beto**.
3. **Eva** paga **50,00 €** a **Ana**.

## 4. Una factura · varios pagadores

Validar que varias aportaciones sumen la misma factura.

**Evaluación IA:** Cada persona asume 30,00 €. Carla y David compensan a Ana y Beto sin crear dinero ni perder céntimos.

- Familias: 0.
- Personas: 4.
- Facturas: 1.
- Total: **120,00 €**.
- Balance global: **0,00 €**.
- Optimización: **minimo verificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Ana | 70,00 € | 30,00 € | Cobra 40,00 € |
| Beto | 50,00 € | 30,00 € | Cobra 20,00 € |
| Carla | 0,00 € | 30,00 € | Paga 30,00 € |
| David | 0,00 € | 30,00 € | Paga 30,00 € |

### Transferencias esperadas

1. **Carla** paga **30,00 €** a **Ana**.
2. **David** paga **10,00 €** a **Ana**.
3. **David** paga **20,00 €** a **Beto**.

## 5. Familias de 1, 2 y 4 personas

Comprobar que la cuota familiar depende del número real de miembros.

**Evaluación IA:** El coste es 30,00 € por persona. Dúo paga 60,00 € y Familia grande 120,00 € a Solo.

- Familias: 3.
- Personas: 7.
- Facturas: 1.
- Total: **210,00 €**.
- Balance global: **0,00 €**.
- Optimización: **minimo verificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Familia Dúo | 0,00 € | 60,00 € | Paga 60,00 € |
| Familia Grande | 0,00 € | 120,00 € | Paga 120,00 € |
| Familia Solo | 210,00 € | 30,00 € | Cobra 180,00 € |

### Transferencias esperadas

1. **Familia Grande** paga **120,00 €** a **Familia Solo**.
2. **Familia Dúo** paga **60,00 €** a **Familia Solo**.

## 6. Adultos y niños · reparto por participaciones

Validar pesos 1 y 0,5 y su agrupación familiar.

**Evaluación IA:** Cada familia asume 45,00 €. Familia Sur paga 45,00 € a Familia Norte.

- Familias: 2.
- Personas: 4.
- Facturas: 1.
- Total: **90,00 €**.
- Balance global: **0,00 €**.
- Optimización: **minimo verificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Familia Norte | 90,00 € | 45,00 € | Cobra 45,00 € |
| Familia Sur | 0,00 € | 45,00 € | Paga 45,00 € |

### Transferencias esperadas

1. **Familia Sur** paga **45,00 €** a **Familia Norte**.

## 7. Cambio global sin editar facturas

Comprobar que se puede excluir un comensal del total conservando intactas todas las facturas.

**Evaluación IA:** David queda excluido del reparto global. Ana, Beto y Carla asumen 550,00 € entre tres sin modificar ninguna factura.

- Familias: 0.
- Personas: 4.
- Facturas: 3.
- Total: **550,00 €**.
- Balance global: **0,00 €**.
- Optimización: **minimo verificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Ana | 400,00 € | 183,34 € | Cobra 216,66 € |
| Beto | 60,00 € | 183,33 € | Paga 123,33 € |
| Carla | 90,00 € | 183,33 € | Paga 93,33 € |
| David | 0,00 € | 0,00 € | Saldo cero |

### Transferencias esperadas

1. **Beto** paga **123,33 €** a **Ana**.
2. **Carla** paga **93,33 €** a **Ana**.

## 8. Importes exactos personalizados

Validar una asignación global no proporcional definida manualmente.

**Evaluación IA:** Ana asume 10,00 € pero adelantó 100,00 €; cobra 30,00 € de Beto y 60,00 € de Carla.

- Familias: 0.
- Personas: 3.
- Facturas: 1.
- Total: **100,00 €**.
- Balance global: **0,00 €**.
- Optimización: **minimo verificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Ana | 100,00 € | 10,00 € | Cobra 90,00 € |
| Beto | 0,00 € | 30,00 € | Paga 30,00 € |
| Carla | 0,00 € | 60,00 € | Paga 60,00 € |

### Transferencias esperadas

1. **Carla** paga **60,00 €** a **Ana**.
2. **Beto** paga **30,00 €** a **Ana**.

## 9. Liquidación individual con cuentas familiares

Comprobar la diferencia entre agrupar por familia y liquidar por persona.

**Evaluación IA:** Cada persona asume 30,00 €. La cuenta Familia Alfa y Berta reciben; Ana, Álex y Bruno pagan individualmente.

- Familias: 2.
- Personas: 4.
- Facturas: 1.
- Total: **120,00 €**.
- Balance global: **0,00 €**.
- Optimización: **minimo verificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Álex | 0,00 € | 30,00 € | Paga 30,00 € |
| Ana | 0,00 € | 30,00 € | Paga 30,00 € |
| Berta | 40,00 € | 30,00 € | Cobra 10,00 € |
| Bruno | 0,00 € | 30,00 € | Paga 30,00 € |
| Familia Alfa | 80,00 € | 0,00 € | Cobra 80,00 € |

### Transferencias esperadas

1. **Álex** paga **30,00 €** a **Familia Alfa**.
2. **Ana** paga **30,00 €** a **Familia Alfa**.
3. **Bruno** paga **20,00 €** a **Familia Alfa**.
4. **Bruno** paga **10,00 €** a **Berta**.

## 10. Todos pagaron exactamente su parte

Validar el caso final sin transferencias.

**Evaluación IA:** Los cuatro pagaron y asumieron 25,00 €. No debe aparecer ninguna transferencia.

- Familias: 0.
- Personas: 4.
- Facturas: 1.
- Total: **100,00 €**.
- Balance global: **0,00 €**.
- Optimización: **minimo verificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Ana | 25,00 € | 25,00 € | Saldo cero |
| Beto | 25,00 € | 25,00 € | Saldo cero |
| Carla | 25,00 € | 25,00 € | Saldo cero |
| David | 25,00 € | 25,00 € | Saldo cero |

### Transferencias esperadas

No debe realizarse ninguna transferencia.

## 11. Compensación circular

Demostrar que ODÍN compensa deudas cruzadas sin devolver cada compra por separado.

**Evaluación IA:** Después de compensar todos los adelantos y el reparto global, Beto paga 10,00 € a Ana y Carla paga 10,00 € a Ana.

- Familias: 0.
- Personas: 3.
- Facturas: 3.
- Total: **60,00 €**.
- Balance global: **0,00 €**.
- Optimización: **minimo verificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Ana | 30,00 € | 10,00 € | Cobra 20,00 € |
| Beto | 20,00 € | 30,00 € | Paga 10,00 € |
| Carla | 10,00 € | 20,00 € | Paga 10,00 € |

### Transferencias esperadas

1. **Beto** paga **10,00 €** a **Ana**.
2. **Carla** paga **10,00 €** a **Ana**.

## 12. Redondeo · 10 € entre tres

Comprobar la asignación determinista del céntimo indivisible.

**Evaluación IA:** Ana asume 3,34 €; Beto y Carla 3,33 €. Ambos pagan 3,33 € a Ana y el balance termina en cero.

- Familias: 0.
- Personas: 3.
- Facturas: 1.
- Total: **10,00 €**.
- Balance global: **0,00 €**.
- Optimización: **minimo verificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Ana | 10,00 € | 3,34 € | Cobra 6,66 € |
| Beto | 0,00 € | 3,33 € | Paga 3,33 € |
| Carla | 0,00 € | 3,33 € | Paga 3,33 € |

### Transferencias esperadas

1. **Beto** paga **3,33 €** a **Ana**.
2. **Carla** paga **3,33 €** a **Ana**.

## 13. Doce saldos · plan simplificado

Validar la ruta segura cuando hay más de diez unidades con saldo.

**Evaluación IA:** Se liquidan 6,00 € sin descuadre. Al haber doce saldos, ODÍN muestra un plan determinista simplificado en vez de bloquear el navegador.

- Familias: 0.
- Personas: 12.
- Facturas: 1.
- Total: **6,00 €**.
- Balance global: **0,00 €**.
- Optimización: **plan simplificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Persona 1 | 0,00 € | 1,00 € | Paga 1,00 € |
| Persona 10 | 1,00 € | 0,00 € | Cobra 1,00 € |
| Persona 11 | 0,50 € | 0,00 € | Cobra 0,50 € |
| Persona 12 | 0,50 € | 0,00 € | Cobra 0,50 € |
| Persona 2 | 0,00 € | 1,00 € | Paga 1,00 € |
| Persona 3 | 0,00 € | 1,00 € | Paga 1,00 € |
| Persona 4 | 0,00 € | 1,00 € | Paga 1,00 € |
| Persona 5 | 0,00 € | 1,00 € | Paga 1,00 € |
| Persona 6 | 0,00 € | 1,00 € | Paga 1,00 € |
| Persona 7 | 1,50 € | 0,00 € | Cobra 1,50 € |
| Persona 8 | 1,50 € | 0,00 € | Cobra 1,50 € |
| Persona 9 | 1,00 € | 0,00 € | Cobra 1,00 € |

### Transferencias esperadas

1. **Persona 1** paga **1,00 €** a **Persona 7**.
2. **Persona 2** paga **0,50 €** a **Persona 7**.
3. **Persona 2** paga **0,50 €** a **Persona 8**.
4. **Persona 3** paga **1,00 €** a **Persona 8**.
5. **Persona 4** paga **1,00 €** a **Persona 10**.
6. **Persona 5** paga **1,00 €** a **Persona 9**.
7. **Persona 6** paga **0,50 €** a **Persona 11**.
8. **Persona 6** paga **0,50 €** a **Persona 12**.

## 14. Exportación e importación idénticas

Comprobar nombres, notas, símbolos y progreso de pagos tras restaurar.

**Evaluación IA:** El total es 123,45 €. Tras exportar e importar deben conservarse todos los datos y una transferencia marcada como pagada.

- Familias: 0.
- Personas: 3.
- Facturas: 1.
- Total: **123,45 €**.
- Balance global: **0,00 €**.
- Optimización: **minimo verificado**.

### Balance esperado

| Persona o familia | Pagó | Le correspondía | Resultado |
|---|---:|---:|---|
| Álvaro | 123,45 € | 41,15 € | Cobra 82,30 € |
| Inés | 0,00 € | 41,15 € | Paga 41,15 € |
| Noa | 0,00 € | 41,15 € | Paga 41,15 € |

### Transferencias esperadas

1. **Inés** paga **41,15 €** a **Álvaro**.
2. **Noa** paga **41,15 €** a **Álvaro**.

## 15. Archivo manipulado · debe rechazarse

Comprobar que ODÍN no importa una factura cuyos pagos no suman el total.

**Evaluación IA:** Resultado esperado: importación bloqueada. Los pagos suman 99,99 € y la factura exige 100,00 €.

- Estado esperado: **RECHAZADO**.
- Motivo: los pagadores suman 99,99 € para una factura de 100,00 €.
- El reparto guardado en el navegador no debe modificarse.

## Criterio de aceptación

Cada caso válido pasa si el total pagado coincide con el total repartido, el balance global es 0,00 €, las relaciones “paga a / cobra de” coinciden y una nueva exportación conserva el resultado. El caso 15 pasa únicamente si ODÍN bloquea la importación.
