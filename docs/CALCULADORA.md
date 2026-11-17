# U20 · Calculadora

Calculadora local con edición por cursor, memoria, historial buscable y vista flotante sincronizada.

## Comportamiento

- `C` limpia la operación actual.
- `MC`, `MR`, `M+` y `M−` gestionan una memoria independiente.
- `ANS` inserta el último resultado calculado.
- Admite paréntesis, cambio de signo, raíz cuadrada y porcentaje.
- Deshacer y rehacer conservan hasta 100 estados de la operación durante la sesión.
- Recuperar inserta el resultado de una operación anterior para continuar calculando.
- Editar carga el concepto y la expresión originales.
- Guardar modifica el registro que se está editando; Guardar como copia conserva el original.
- Los conceptos repetidos reciben automáticamente `(2)`, `(3)` y siguientes.

## Datos locales

El estado se guarda en `localStorage` con la clave `odin-calculator-v1`. El historial conserva como máximo 100 registros. Las ventanas se sincronizan mediante `BroadcastChannel` y el evento `storage`.

La vista flotante utiliza Document Picture-in-Picture cuando está disponible. En otros navegadores se abre una ventana compacta sincronizada.

## Comprobación

```powershell
npm run test:calculator
```

Las expresiones se analizan con un evaluador propio; no se utiliza `eval` ni se ejecuta el texto introducido.
