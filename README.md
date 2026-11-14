# ODÍN — ODIN-001

Primera implementación local de la arquitectura y la identidad visual de ODÍN.

## Alcance

- Portada modular preparada para diez herramientas.
- Registro tipado con identificadores permanentes, orden, categoría, estado y destacado.
- Identidad visual propia inspirada en constelaciones, orientación y conocimiento.
- Buscador local y diseño responsive.
- U01 Reloj negro funcional, recuperado conceptualmente del archivo original `FondoNegroReloj.html` del panel Sony.
- Preferencias de U01 almacenadas localmente.
- Las cuatro herramientas restantes del MVP aparecen como próximas; las otras cinco, como planificadas.

## Ejecutar

```powershell
npm install
npm run dev
```

Validación:

```powershell
npm run build
```

## Límites de esta iteración

No se han creado repositorios, recursos Cloudflare, DNS, bases D1 ni servicios Raspberry. El panel `/admin`, las herramientas U02–U10, compartir e iframe pertenecen a iteraciones posteriores.

## Decisiones

- Astro estático como base; Functions y D1 se incorporarán solo cuando una función lo requiera.
- Catálogo central separado de la interfaz.
- Herramientas incompletas sin enlace activo.
- Persistencia de U01 en `localStorage`; datos mayores, como fondos personales, usarán IndexedDB en su fase correspondiente.
- El movimiento del reloj usa tiempo real entre fotogramas y se puede desactivar.
