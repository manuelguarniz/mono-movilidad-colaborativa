# Prompt de diseño — Pnn <Nombre>

Prompt para generar el diseño de la pantalla nn y sus modales con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame nn-A, y luego cada frame siguiente pegando de nuevo el contexto común.

Fuentes: README raíz (RF-xx, RN-xx y secciones 2.3 y 11), `app-utp-movilidad-colaborativa/src/styles/index.css` y los frames <Pxx, Pyy> como referencia de estilo.

_(Si hay referencia visual del usuario: [referencia-x.png](referencia-x.png); se toma … / no se sigue … por RN-xx.)_

---

## Contexto común (pegar en cada pasada)

```text
<copiar de .claude/skills/diseno-stitch/templates/contexto-comun.md, con pestaña, eyebrow, título y reglas propias>
```

---

## Frame nn-A — <vista principal>

```text
…
```

## Frame nn-B — <variante o modo>

```text
…
```

## Frame nn-C — Modal: <acción>

```text
Sobre el frame nn-A atenuado, una hoja inferior (bottom sheet) blanca con radio superior 24px:
- …
- Botón primario rojo "…" y botón secundario gris "…".
```

## Frame nn-X — Estado vacío

```text
Mismo encabezado y navegación. En el centro, ilustración lineal sencilla …, el texto "…" y el botón secundario "…".
```

---

## Supuestos a validar

- …

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| v1.1 | nn-A | Contexto común + nn-A | — |

### Decisiones de flujo

_(Qué pasa antes y después de la pantalla, decisiones con el usuario y fecha. «Confirmada», «propuesta» o «adoptada sin objeción». Enlazar otras pantallas afectadas.)_

### Mensajes de validación (para la implementación)

_(Solo si hay formulario.)_

| Campo | Regla | Mensaje |
| --- | --- | --- |
| … | RN-xx | "…" |

### Revisión de v1.1

**Lo que funciona:** …

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 1 | … | nn-A | Alta / Media / Baja | 1.ª |

**Prompt de corrección** (seleccionar el frame nn-A en Stitch; guardar como `v1.2.png`):

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. …
```

<!-- Al aprobar, agregar:

### Decisión

Se aprueba. Capturas finales: nn-A → v1.2, nn-B → v1.4, … Ajustes a resolver en la implementación:

1. …

**Aprendizaje para las siguientes pantallas:** …
-->
