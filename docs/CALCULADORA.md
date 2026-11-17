# U20 · Calculadora

Calculadora local con edición por cursor, memoria, historial buscable y vista flotante sincronizada.

## Comportamiento

- `C` limpia la operación actual.
- `MC`, `MR`, `M+` y `M−` gestionan una memoria independiente.
- El valor actual de la memoria `M` permanece visible sobre la operación.
- Admite paréntesis, cambio de signo, porcentaje, raíz cuadrada, cuadrado, inversa y potencias de diez.
- Deshacer y rehacer conservan hasta 100 estados de la operación durante la sesión.
- Recuperar inserta el resultado de una operación anterior para continuar calculando.
- El campo «Nombre del cálculo» permite identificarlo en el historial, por ejemplo «Compra supermercado».
- Editar carga la expresión original para modificar el mismo registro.
- `=` calcula sin guardar; Calcular y guardar realiza las dos acciones en un paso.
- Cada registro del historial puede eliminarse individualmente.
- Guardar modifica el registro que se está editando; Guardar como copia conserva el original.
- Los nombres repetidos reciben automáticamente `(2)`, `(3)` y siguientes.
- Si se elimina el registro que estaba en edición, la operación permanece en pantalla pero queda desvinculada. Un guardado posterior crea un registro nuevo.

## Datos locales

El estado se guarda en `localStorage` con la clave `odin-calculator-v1`. El historial conserva como máximo 100 registros. Las ventanas se sincronizan mediante `BroadcastChannel` y el evento `storage`.
La sección «Calculadora e historial» de Administración incluye este estado y el tamaño flotante (`odin-calculator-floating-size`) en las copias, importaciones y restablecimientos selectivos.

La vista flotante utiliza Document Picture-in-Picture cuando está disponible. En otros navegadores se abre una ventana compacta sincronizada.
Puede alternarse entre los tamaños Normal, Compacta y Mini. La elección se conserva para la siguiente apertura.

## Comprobación

```powershell
npm run test:calculator
```

Las expresiones se analizan con un evaluador propio; no se utiliza `eval` ni se ejecuta el texto introducido.
