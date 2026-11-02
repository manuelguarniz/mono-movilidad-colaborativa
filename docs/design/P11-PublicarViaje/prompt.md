# Prompt de diseño — P11 Publicar viaje

Prompt para rediseñar la pantalla 11 del prototipo con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Es un rediseño (modo B): se adjunta [screen.jpeg](screen.jpeg) como referencia de layout (mapa arriba y formulario en hoja inferior) y se aplican los cambios que pide el README. Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 11-A, y luego cada frame siguiente pegando de nuevo el contexto común.

Fuentes: README raíz (RF-05 y sus criterios de aceptación, RN-10, RN-11, RN-12, RN-13, RN-24, RN-29, RN-30, RN-37, RN-49, RNF-11, sección 1.1 «Mapas avanzados», sección 5.1 colección `viajes` para `sentido`, `distancia_km` y `duracion_min`, y sección 11), `app-utp-movilidad-colaborativa/src/styles/index.css`, el frame [screen.jpeg](screen.jpeg) y las capturas aprobadas de P17 y P21 como referencia de estilo.

**Qué se conserva del frame:** el mapa arriba con la hoja inferior del formulario, el segmentado «Ida a la universidad / Regreso a casa», los bloques grises de salida y precio lado a lado, el selector de plazas con iconos de asiento, la pastilla de distancia y duración sobre el mapa y los botones al final.

**Qué cambia y por qué:**

| Frame actual | Cambio | Regla |
| --- | --- | --- |
| Precio «S/ 5.00» | «6 créditos» con moneda dorada y stepper − / +, de 1 a 10 | RN-13, sección 1.2 (créditos enteros) |
| Salida «07:30 AM» sin fecha | Fecha y hora en 24 h («Mañana, vie 30 oct» · «07:00») | RN-12 |
| Ruta trazada por calles | Origen, paradas y destino unidos por líneas rectas punteadas, con marcadores numerados | Sección 1.1 (mapas avanzados), RF-03 |
| Sin lista de paradas | La ruta también como lista ordenada en texto, con contador «2 de 5 paradas» | RNF-11, RN-10, RN-29 |
| Sin condiciones | Sección de condiciones con chips, campo para agregar y contador «3 de 10» | RF-05, RN-10 |
| Sin vehículo | Línea con el vehículo y sus plazas, que fijan el máximo del selector | RN-11, RN-24 |
| Sin accesibilidad | Chip de solo lectura «Apto para silla de ruedas» en la línea del vehículo (o «Sin accesibilidad declarada · Configurar en mi vehículo» hacia P16) | RN-18; decisión del usuario del 2026-10-29 |
| «Tarifa recomendada para Trujillo centro» | Se quita; en su lugar, la ayuda «De 1 a 10 créditos por plaza» | No está en el README; las recomendaciones están fuera del alcance (sección 1.1) |
| «Publicar Viaje Universitario» | «Revisar y publicar» (abre el resumen P12) | RF-05: se confirma un resumen antes de guardar |
| «Descartar configuración» | «Descartar» | — |
| Icono de perfil rojo en el encabezado | Se quita; es una pantalla de flujo con «X» para salir | — |
| Mapa con manchas negras | Mapa plano estilo OpenStreetMap, sin artefactos | Leaflet + OSM (sección 1) |

---

## Contexto común (pegar en cada pasada)

```text
Diseña una pantalla de app móvil (WebView, 390 × 844, sin marco de teléfono) para ColaboraCar,
la app de viajes compartidos de la comunidad de la Universidad Tecnológica del Perú (UTP).
Idioma: español de Perú. Moneda: "créditos" (icono de moneda dorada), nunca soles.

Formato (obligatorio): es una pantalla de teléfono, no web ni escritorio. Ancho total 390 px,
una sola columna, márgenes laterales de 16 px, sin barras laterales ni contenedores centrados
con fondo vacío alrededor.

Sistema visual (respetar exactamente, es el de las pantallas ya diseñadas):
- Fondo de pantalla #F9F9F9. Tarjetas blancas, borde 1px #E1E1E1, radio 16px, sombra muy suave.
- Rojo de marca #BD0016 (botón primario sólido, texto blanco, radio 12px, alto 52px).
  Hover/pressed #A30013. Rojo acento #E6212A para puntos e indicadores.
- Rojo suave #FFDAD7 con texto #BD0016 para botones secundarios y chips activos;
  borde suave #E5BEBB para chips contorneados.
- Superficie gris #EEEEEE para bloques internos (como el bloque "Salida" del dashboard).
- Texto principal #1B1B1B, secundario marrón #5B403D, apagado #5F5E5E, placeholder #686C75.
- Verde para estados positivos: texto #1B7F3B sobre fondo #E6F4EA.
- Tipografía Inter. Etiquetas de sección en mayúsculas pequeñas con tracking
  (ej. "SALIDA"), títulos 22px semibold, horas y cifras con números tabulares.
- Iconos de línea (Material Symbols Outlined).
- Encabezado de flujo (pantalla sin barra de navegación inferior): "X" para cerrar a la
  izquierda y el título "Publicar viaje" en 22px semibold. Sin logotipo, campana ni avatar.
- Sin barra de navegación inferior.

Reglas que el diseño debe reflejar:
- Horas en formato de 24 h, sin AM/PM. La salida tiene fecha y una sola hora.
- Precio por plaza en créditos enteros, entre 1 y 10. Nunca "S/" ni decimales.
- Mapa plano estilo OpenStreetMap (calles grises claras, parques verde pálido), sin
  manchas ni formas negras. Origen, paradas y destino unidos por líneas rectas punteadas
  rojas: no es una ruta por calles.
- Marcadores: origen con círculo blanco y borde rojo, paradas con círculos rojos numerados
  (1, 2), destino con círculo rojo sólido. Cada uno con una etiqueta blanca con su nombre.
- Las paradas las define solo el conductor y son referenciales (máximo 5).
- Condiciones opcionales, máximo 10, en texto corto.
- Nada de "ShareCar", tarifa recomendada, sugerencias de precio, búsqueda de direcciones,
  tráfico, seguimiento en vivo, chat ni correos que no sean @utp.edu.pe.
- La accesibilidad es del vehículo, no del viaje: se muestra como chip de solo lectura en la
  línea del vehículo ("Apto para silla de ruedas"). No agregues un interruptor en el formulario.
- Textos en UTF-8: tildes, ñ, "·", "•" y "−" deben verse correctos (ej. "Óvalo", "España").
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 11-A — Publicar viaje (formulario completo)

Adjuntar [screen.jpeg](screen.jpeg) en Stitch como referencia de layout.

```text
Conserva el layout de la imagen adjunta (mapa arriba, formulario en una hoja inferior blanca
con radio superior 24px y tirador gris) y cambia solo lo que indico. Usuario: conductor
Carlos M. Es una pantalla larga con scroll: muéstrala completa.

1. Encabezado: "X" a la izquierda y título "Publicar viaje". Quita el icono de perfil.

2. Mapa (alto 300 px), estilo plano OpenStreetMap, Trujillo:
   - Origen "Urb. El Golf, Víctor Larco" (círculo blanco con borde rojo).
   - Parada 1 "Óvalo Larco" y parada 2 "Av. España" (círculos rojos numerados).
   - Destino "Campus UTP Trujillo" (círculo rojo sólido con icono de birrete).
   - Líneas rectas punteadas rojas entre ellos, en ese orden.
   - Arriba a la derecha, pastilla blanca: "5,2 km · ~9 min".
   - Abajo a la izquierda, aviso blanco con icono de mano: "Toca el mapa para agregar
     o mover paradas". Abajo a la derecha, botón circular blanco de centrar ubicación.

3. Hoja inferior, en este orden:
   a. Segmentado de dos opciones: "Ida a la universidad" (activo, píldora roja #BD0016
      con icono de birrete) y "Regreso a casa" (icono de casa).
   b. Línea de vehículo con icono de auto: "Toyota Yaris blanco • ABC-123 · 4 plazas" y,
      debajo, dos chips en una sola línea: "Apto para silla de ruedas" (verde #1B7F3B sobre
      #E6F4EA, con icono de accesibilidad) y "Sede Trujillo" (gris).
   c. Dos bloques grises lado a lado:
      - "SALIDA": "07:00" en grande y debajo "Mañana, vie 30 oct", con icono de reloj.
      - "PRECIO POR PLAZA": moneda dorada + "6" en grande + "créditos", con botones
        circulares "−" y "+". Debajo, a todo el ancho, en gris: "De 1 a 10 créditos por plaza".
   d. "PLAZAS DISPONIBLES" con "3 de 4" a la derecha en rojo, y cuatro botones con icono
      de asiento: 1, 2, 3 (seleccionado, fondo rojo #BD0016) y 4.
   e. "RUTA" con "2 de 5 paradas" a la derecha. Lista vertical unida por una línea:
      "Origen · Urb. El Golf, Víctor Larco", "Parada 1 · Óvalo Larco" (con "X" para quitar),
      "Parada 2 · Av. España" (con "X"), "Destino · Campus UTP Trujillo — Av. Nicolás de
      Piérola 1221". Debajo, en gris: "Paradas referenciales definidas por ti".
   f. "CONDICIONES (OPCIONAL)" con "3 de 10" a la derecha. Chips grises con "X":
      "Máximo de espera 5 minutos", "No se admiten desvíos", "Sin comida en el auto".
      Debajo, un campo de texto con placeholder "Agregar condición" y botón "Agregar".
   g. Botón primario rojo a todo el ancho "Revisar y publicar" y debajo botón de texto
      gris "Descartar".

Quita "Tarifa recomendada", "S/ 5.00", "07:30 AM" y la ruta trazada por calles.
```

## Frame 11-B — Errores de validación

```text
Duplica el frame 11-A y cambia solo lo siguiente:
1. Bloque "SALIDA": "23:30" y "Hoy, jue 29 oct", con borde rojo #BD0016 de 1,5 px.
   Debajo del bloque, texto rojo con icono de alerta:
   "Elige una salida futura entre las 06:00 y las 23:00."
2. Debajo de la fila de salida y precio, una franja rojo suave #FFDAD7 con icono de alerta:
   "Tu SOAT vence antes de la salida. Actualízalo en tu perfil para publicar." y a la derecha
   un botón de texto rojo "Actualizar SOAT".
3. Botón "Revisar y publicar" deshabilitado (fondo #EEEEEE, texto #5F5E5E).
Mantén todo lo demás igual.
```

## Frame 11-C — No puedes publicar (bloqueo)

```text
Mismo encabezado de flujo ("X" y "Publicar viaje"). Sin mapa ni formulario.
En el centro, una tarjeta blanca con:
- Icono circular rojo suave con un candado.
- Título "Por ahora no puedes publicar viajes".
- Texto: "Cancelaste 10 viajes en los últimos 30 días. Podrás publicar de nuevo desde el 14/11."
- Bloque gris con icono de información: "Cuentan los viajes que cancelaste y los que se
  cancelaron porque no los iniciaste."
- Botón secundario gris "Volver a Mis viajes".
```

---

## Supuestos a validar

- **Origen y destino precargados.** Con «Ida a la universidad», el destino se precarga con la sede del conductor y el origen con su residencia; con «Regreso a casa», al revés. Ambos se pueden mover en el mapa. RF-05 solo dice que el conductor los fija tocando el mapa.
- **Fecha.** El frame solo tenía la hora. Se usa el selector nativo de fecha y hora del WebView (no se diseña), con «Hoy» y «Mañana» como textos cortos.
- **Largo de una condición.** El README limita la cantidad (10), no el largo. Se propone un máximo de 60 caracteres.
- **Bloqueos.** RN-24 (sin vehículo) y RN-30 (cancelaciones) bloquean la pantalla entera (11-C). RN-37 (SOAT) depende de la fecha elegida, así que se muestra dentro del formulario (11-B).
- **Valores por defecto.** Precio 5 créditos, plazas = las del vehículo menos una, sentido «Ida a la universidad» y salida en la próxima media hora disponible. El frame no los fija.

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| v1.1 | 11-A | Contexto común + 11-A (adjuntando screen.jpeg) | ⚠️ textos con codificación rota, sin accesibilidad, bloque de precio apretado (la captura se reemplazó por v2.1) |
| v1.2 | 11-B | 11-B (duplicando v1.1); no se aplicó la corrección de v1.1 | ⚠️ codificación y precio ya bien; bloque de salida, precio y SOAT duplicado; sin línea del vehículo |
| v1.3 | 11-C | 11-C | ✅ |
| v2.1 | 11-A | Corrección de v1.1 | ⚠️ todo corregido salvo «Ida a la universidad» en dos líneas |
| v2.2 | 11-B | Corrección de v1.2 | ✅ |
| v2.3 | 11-A | Duplicando v2.2 sin errores | ✅ |

El usuario renumeró la ronda 2: las capturas planeadas como v1.4 y v1.5 se guardaron como v2.2 y v2.3, y la corrección de v1.1 (que sobrescribió ese archivo) se renombró a v2.1.

### Decisiones de flujo

Propuestas el 2026-10-29; el usuario siguió adelante sin objetarlas, así que se adoptan sin objeción (2026-11-01).

- **Accesibilidad (confirmada por el usuario, 2026-10-29).** P11 no permite activarla: es un dato del vehículo (RN-18) que se marca en P05/P16 y el viaje solo lo copia (`apto_movilidad_reducida`). En la línea del vehículo se muestra el chip de solo lectura «Apto para silla de ruedas». Si el vehículo no es apto, se muestra «Sin accesibilidad declarada · Configurar en mi vehículo», que abre P16; al volver, el formulario conserva los datos. No cambia el README.

- **Entrada:** botón «Publicar un viaje» del dashboard (P06) y botón fijo «Publicar un nuevo viaje» de Mis viajes (P17), solo en modo conductor. Si aplica RN-24 o RN-30, se abre directamente 11-C.
- **«Revisar y publicar»:** valida el formulario y abre el resumen P12. Si hay errores, los marca en su campo (11-B) y no abre P12.
- **P12 «Confirmar y publicar»:** guarda el viaje `PUBLICADO`, cierra el flujo, abre P17 Mis viajes con la tarjeta nueva y muestra el toast «Viaje publicado». P12 «Seguir editando» vuelve a P11 con los datos.
- **«X» o «Descartar» con datos cargados:** confirma con «¿Descartar el viaje? No se guardará nada.» (no se diseña; usa el mismo bottom sheet de P17-C). Sin datos, sale directo.
- **«Actualizar SOAT»** abre P16 Actualizar vehículo. Al volver, el formulario conserva los datos.

### Mensajes de validación (para la implementación)

| Campo | Regla | Mensaje |
| --- | --- | --- |
| Vehículo | Vehículo `ACTIVO` (RN-24) | «Registra un vehículo para usar la modalidad de conductor (o para publicar viajes)» |
| Bloqueo | Menos de 10 cancelaciones en 30 días (RN-30) | «Cancelaste N viajes en los últimos 30 días. Podrás publicar de nuevo desde el DD/MM.» |
| Fecha de salida | SOAT vigente en esa fecha (RN-37) | «Tu SOAT vence antes de la salida. Actualízalo en tu perfil para publicar.» |
| Fecha y hora | Futura, entre 06:00 y 23:00 (RN-12) | «Elige una salida futura entre las 06:00 y las 23:00.» (nuevo) |
| Origen y destino | Obligatorios (RN-10) | «Toca el mapa para fijar el origen y el destino.» (nuevo) |
| Paradas | Máximo 5 (RN-10) | «Puedes agregar hasta 5 paradas.» (nuevo) |
| Precio por plaza | Entero de 1 a 10 (RN-13) | Sin mensaje: los botones − y + se deshabilitan en 1 y en 10 |
| Plazas | De 1 a las plazas del vehículo (RN-11) | Sin mensaje: el selector solo muestra esas opciones |
| Condiciones | Máximo 10 (RN-10) | «Puedes agregar hasta 10 condiciones.» (nuevo) |
| Condición | Hasta 60 caracteres (supuesto) | «Escribe la condición en 60 caracteres o menos.» (nuevo) |

### Datos de ejemplo (coherentes con P17)

Es la publicación del viaje «Mañana, 07:00» de la tarjeta de P17-B: Carlos M., Toyota Yaris blanco ABC-123 (4 plazas), Urb. El Golf → Campus UTP Trujillo, 3 plazas. La distancia de 5,2 km en línea recta a 35 km/h da ~9 min (sección 5.1).

### Revisión de v1.1

La captura se guardó como `v1.png` y se renombró a `v1.1.png`.

**Lo que funciona:** conserva el layout del frame (mapa arriba y hoja inferior), y tiene todo lo que pedía el prompt:
- Mapa plano con líneas rectas punteadas y marcadores numerados.
- Pastilla «5,2 km · ~9 min».
- Precio en créditos.
- Salida con fecha y hora en 24 h.
- Plazas «3 de 4».
- Ruta en texto con «2 de 5 paradas» y la leyenda de paradas referenciales.
- Condiciones con «3 de 10».
- «Revisar y publicar» y «Descartar».

Ya no aparecen «Tarifa recomendada» ni «S/».

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 1 | Todos los textos con tildes y símbolos salen con la codificación rota («Ã“valo», «Â·», «crÃ©ditos», «VÃctor»), y el botón «−» del precio muestra «â^'». | 11-A | Alta | 1.ª |
| 2 | No muestra la accesibilidad del vehículo (pedido del usuario, decisión confirmada). | 11-A | Media | 1.ª |
| 3 | El bloque de precio está apretado: «créditos» choca con el botón «−», y la ayuda «De 1 a 10 créditos por plaza» quedó debajo de la salida. | 11-A | Media | 1.ª |
| 4 | «07:00» está en una fuente monoespaciada, no en Inter. | 11-A | Baja | 1.ª |
| 5 | El chip «Sede Trujillo» se parte en dos líneas. | 11-A | Baja | 1.ª |

**Prompt de corrección** (seleccionar v1.1 en Stitch; guardar como `v1.2.png`). No se usó: el usuario generó 11-B y 11-C, y 11-A se rehace desde 11-B corregido (ver «Revisión de v1.2 y v1.3»).

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. Codificación: los textos con tildes y símbolos salen rotos ("Ã“valo", "Â·", "crÃ©ditos").
   Escríbelos en UTF-8 correcto: "Óvalo Larco", "Av. España", "Urb. El Golf, Víctor Larco",
   "Mañana, vie 30 oct", "créditos", "Máximo de espera 5 minutos", "No se admiten desvíos",
   "Agregar condición", "Av. Nicolás de Piérola 1221", el separador "·", la viñeta "•"
   y el signo "−" del botón de precio.
2. Línea del vehículo: arriba "Toyota Yaris blanco • ABC-123 · 4 plazas" y debajo, en una sola
   línea, dos chips: "Apto para silla de ruedas" con icono de accesibilidad (texto #1B7F3B
   sobre #E6F4EA) y "Sede Trujillo" (gris, sin salto de línea).
3. Bloque "PRECIO POR PLAZA": en una sola fila, botón circular "−" a la izquierda, en el centro
   moneda dorada + "6" grande + "créditos", y botón circular "+" a la derecha, sin
   superposiciones. Mueve "De 1 a 10 créditos por plaza" dentro de este bloque, debajo de la fila.
4. "07:00" en Inter semibold con números tabulares, igual que el "6" del precio.
No agregues un interruptor de accesibilidad: es un dato del vehículo, solo se muestra.
```

**Ajuste en la implementación:** si el vehículo no es apto, en lugar del chip va «Sin accesibilidad declarada · Configurar en mi vehículo», que abre P16.

### Revisión de v1.2 y v1.3

v1.1 no cambió: no se aplicó su prompt de corrección. v1.2 es 11-B y v1.3 es 11-C.

**v1.3 (11-C) ✅.** Cumple el prompt al pie de la letra: encabezado de flujo, candado sobre rojo suave, texto de RN-30 con fecha, nota de qué cancelaciones cuentan y «Volver a Mis viajes». Se aprueba.

**v1.2 (11-B) — lo que funciona:**
- Textos en UTF-8 correctos (resuelve #1 de v1.1).
- Bloque de precio en una fila con la ayuda «De 1 a 10 créditos por plaza» dentro (resuelve #3).
- «23:30» en Inter (resuelve #4).
- Salida con borde rojo y mensaje de RN-12, franja de SOAT con «Actualizar SOAT» y botón deshabilitado, como pedía el prompt.

Como v1.2 ya resolvió la codificación y el precio, 11-A se rehace duplicando 11-B corregido y quitando los errores, en vez de seguir corrigiendo v1.1.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 1 | El bloque de salida, precio, error y franja de SOAT aparece dos veces. | 11-B | Alta | 1.ª |
| 2 | Falta la línea del vehículo y, con ella, el chip «Apto para silla de ruedas» y «Sede Trujillo». | 11-B | Media | 2.ª |
| 3 | «Ida a la universidad» se parte en dos líneas. | 11-B | Baja | 1.ª |
| 4 | «créditos» queda pegado al botón «+». | 11-B | Baja | 2.ª |
| 5 | 11-A (v1.1) sigue con la codificación rota. | 11-A | Alta | 2.ª |

**Prompt de corrección de 11-B** (seleccionar v1.2 en Stitch; guardar como `v1.4.png`):

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. El bloque "SALIDA" + "PRECIO POR PLAZA", su mensaje de error y la franja del SOAT aparecen
   dos veces. Deja una sola copia (la primera) y elimina la segunda.
2. Entre el selector "Ida a la universidad / Regreso a casa" y el bloque "SALIDA", agrega la línea
   del vehículo: icono de auto gris, texto "Toyota Yaris blanco • ABC-123 · 4 plazas" (#1B1B1B,
   16 px) y debajo, en una sola línea, dos chips: "Apto para silla de ruedas" con icono de
   accesibilidad (texto #1B7F3B sobre #E6F4EA) y "Sede Trujillo" (gris #EEEEEE, sin salto de línea).
3. "Ida a la universidad" en una sola línea: reduce el icono o el padding del segmento si hace falta.
4. En "PRECIO POR PLAZA", deja 8 px entre "créditos" y el botón "+".
No agregues un interruptor de accesibilidad: es un dato del vehículo, solo se muestra.
```

**Prompt de 11-A** (duplicar v1.4 en Stitch; guardar como `v1.5.png`):

```text
Duplica esta pantalla y cambia solo lo siguiente:
1. Bloque "SALIDA": "07:00" en negro #1B1B1B y "Mañana, vie 30 oct", sin borde rojo y sin el
   mensaje de error de debajo.
2. Elimina la franja rosada del SOAT.
3. Botón "Revisar y publicar" habilitado: fondo rojo #BD0016, texto blanco.
Mantén todo lo demás igual, incluidos los textos con tildes, la línea del vehículo y sus chips.
```

### Revisión de v2.1, v2.2 y v2.3

- **v2.1 (11-A, corrección de v1.1):** resuelve la codificación, la línea del vehículo con sus chips, el bloque de precio y la fuente de «07:00». Solo queda «Ida a la universidad» en dos líneas. Lo supera v2.3.
- **v2.2 (11-B) ✅:** una sola copia del bloque de salida, precio y SOAT (#1); línea del vehículo en tarjeta con «Apto para silla de ruedas» y «Sede Trujillo» (#2); selector en una línea (#3); «créditos» separado del «+» (#4).
- **v2.3 (11-A) ✅:** igual a v2.2 con «07:00 · Mañana, vie 30 oct», sin errores y con «Revisar y publicar» habilitado (#5).

Sin pendientes.

### Decisión

Se aprueba el 2026-11-01 en la segunda ronda. Capturas finales: 11-A → v2.3, 11-B → v2.2, 11-C → v1.3.

Ajustes a resolver en la implementación (React + Tailwind):

1. Vehículo no apto: en lugar del chip va «Sin accesibilidad declarada · Configurar en mi vehículo», que abre P16 y al volver conserva el formulario.
2. Errores con los mensajes de la tabla «Mensajes de validación», debajo de cada campo. Sin vehículo (RN-24) se usa el mismo layout de 11-C con su mensaje y el botón «Registrar vehículo» (P16).
3. «Actualizar SOAT» abre P16 (el texto dice «en tu perfil» porque P16 se abre desde el perfil).
4. Los botones − y + del precio se deshabilitan en 1 y en 10; el selector de plazas llega hasta las plazas del vehículo.
5. «07:00» y «6» con números tabulares (`tabular-nums`).
6. «X» o «Descartar» con datos cargados confirman con el bottom sheet de P17-C.

**Aprendizaje para las siguientes pantallas:**

- Cuando una variante sale mejor que el frame principal (aquí 11-B arregló la codificación), es más rápido corregir la variante y duplicarla para obtener el principal que seguir corrigiendo el original.
- La codificación rota de Stitch se corrige pidiendo los textos literales en UTF-8; la regla ya está en el contexto común.
