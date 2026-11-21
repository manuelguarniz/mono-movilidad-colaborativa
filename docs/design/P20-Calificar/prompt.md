# Prompt de diseño — P20 Calificar

Prompt para generar el diseño de la pantalla 20 y sus modales con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 20-A, y luego cada frame siguiente pegando de nuevo el contexto común.

Fuentes: README raíz (RF-10, RN-22, RN-47, decisión del 2026-11-21 sobre el plazo de 24 horas, secuencia 8.4, notificación «Viaje completado» de RF-13 y secciones 2.3 y 11), `app-utp-movilidad-colaborativa/src/styles/index.css`, las capturas aprobadas de P19 (v3.1, v2.2) y P17 como referencia de estilo, y el encabezado de flujo de P16.

Sin referencia visual del usuario. Patrones que se toman de apps de movilidad y de reseñas en producción, no su marca:

- **Una persona por pantalla:** foto o avatar grande, nombre y la pregunta directa («¿Cómo fue tu viaje con Carlos?»). Calificar a varios en una lista larga reduce la respuesta.
- **Estrellas grandes y tocables** (44 px como mínimo, RNF de accesibilidad) con una etiqueta de texto bajo la selección («Muy bueno»), para que el puntaje no dependa solo del color.
- **El comentario es opcional y lo dice**, con contador de caracteres.
- **Un botón principal fijo abajo** que solo se habilita con estrellas elegidas, y una salida secundaria («Ahora no»), porque calificar es opcional (sección 12.1).
- **El conductor avanza pasajero por pasajero** con un indicador de progreso («Pasajero 1 de 2»), y puede omitir a alguien.

Datos de ejemplo encadenados con P17 y P19 («Hoy» es jue 29 oct 2026):

- **Pasajera:** Lucía R. califica a Carlos M. por el viaje de Hoy 14:20, Campus UTP Trujillo → Urb. El Golf, que terminó a las 14:50 (17-H, 19-A). Plazo: hasta mañana, 14:50.
- **Conductor:** Carlos M. llega desde «Finalizar viaje» (17-F) con el viaje de Hoy 13:35, Urb. California → Campus UTP Trujillo, que terminó a las 14:06 (19-B, 21-A). Califica a Mateo R. y Sofía A. Plazo: hasta mañana, 14:06.

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
  Botón primario deshabilitado: fondo #EEEEEE, texto #5F5E5E.
- Rojo suave #FFDAD7 con texto #BD0016 para botones secundarios y chips activos;
  borde suave #E5BEBB para chips contorneados.
- Superficie gris #EEEEEE para bloques internos (como el bloque "Salida" del dashboard).
- Texto principal #1B1B1B, secundario marrón #5B403D, apagado #5F5E5E, placeholder #686C75.
- Verde para estados positivos: texto #1B7F3B sobre fondo #E6F4EA.
- Tipografía Inter. Etiquetas de sección en mayúsculas pequeñas con tracking
  (ej. "TU VIAJE"), cifras con números tabulares.
- Iconos de línea (Material Symbols Outlined). Estrellas de calificación en ámbar #F59E0B
  (llenas) y contorno gris #C9C9C9 (vacías).
- Avatares de personas: círculos grises #EEEEEE con las iniciales en #5B403D, sin fotos.
- Encabezado de flujo (pantalla sin barra de navegación inferior): flecha "←" para volver
  a la izquierda y el título "Calificar viaje" en 22px semibold (solo la primera letra
  en mayúscula). Sin logotipo, campana ni avatar.
- Sin barra de navegación inferior.

Reglas que el diseño debe reflejar:
- Se califica de 1 a 5 estrellas enteras (sin medias estrellas). Las estrellas son
  obligatorias; el comentario es opcional, de hasta 200 caracteres.
- Solo se califica un viaje completado, durante 24 horas desde que terminó.
- La calificación no se edita ni se borra después de enviarla.
- El pasajero califica a su conductor. El conductor califica a cada pasajero que subió,
  uno por uno. A quien no se presentó no se le califica.
- La necesidad de asistencia de movilidad de un pasajero nunca aparece en esta pantalla.
- Cada viaje tiene una sola hora de salida (no rango) y lleva un chip con la sede
  (ej. "Sede Trujillo").
- Nada de "ShareCar", "Puntualidad", "Conductor frecuente", "A/C activo", propinas,
  etiquetas o insignias de elogio, chat, mapa, reportar o denunciar, botón de emergencia,
  seguimiento en vivo, ni correos que no sean @utp.edu.pe.
- Textos en UTF-8: tildes, ñ, "·", "•", "★" y "→" deben verse correctos (ej. "Víctor Larco").
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 20-A — Pasajera califica al conductor

```text
Usuaria Lucía R. califica a su conductor. Encabezado de flujo "←" y "Calificar viaje".

1. Bloque gris #EEEEEE con radio 12px (resumen del viaje):
   eyebrow "TU VIAJE", "Hoy, 29 oct · 14:20" en 16px semibold, chip "Sede Trujillo",
   y la ruta "Campus UTP Trujillo → Urb. El Golf, Víctor Larco" (texto completo, sin
   puntos suspensivos).

2. Tarjeta blanca centrada (persona calificada):
   - Avatar grande de 72px con las iniciales "CM".
   - "Carlos M." en 20px semibold y debajo, en #5F5E5E, "Tu conductor · Toyota Yaris blanco • ABC-123".
   - Pregunta en 18px semibold: "¿Cómo fue tu viaje con Carlos?"
   - Fila de 5 estrellas grandes (40px, área táctil de 48px, separadas 8px), las 4 primeras
     llenas en ámbar y la quinta vacía en contorno gris.
   - Debajo, centrado, la etiqueta del puntaje en #5B403D: "Muy bueno".

3. Campo de texto multilínea (3 líneas) con etiqueta "Comentario (opcional)",
   borde #E1E1E1, radio 12px, con el texto "Puntual y manejó con cuidado." y, abajo a la
   derecha, el contador "29/200" en #5F5E5E.

4. Nota con icono de información en #5F5E5E:
   "Puedes calificar hasta mañana, 14:50. Después de enviarla no podrás cambiarla."

5. Fijos abajo, a todo el ancho menos 16px de margen: botón primario rojo
   "Enviar calificación" y debajo un botón de texto gris #5F5E5E "Ahora no".
```

## Frame 20-B — Conductor califica a sus pasajeros (1 de 2)

```text
Usuario Carlos M., conductor, califica a los pasajeros que subieron. Encabezado de flujo
"←" y "Calificar viaje".

1. Bloque gris #EEEEEE con radio 12px: eyebrow "TU VIAJE", "Hoy, 29 oct · 13:35",
   chip "Sede Trujillo" y la ruta "Urb. California → Campus UTP Trujillo".

2. Indicador de progreso: texto "Pasajero 1 de 2" en #5B403D a la izquierda y, debajo,
   una barra de 2 segmentos (el primero rojo #BD0016, el segundo gris #EEEEEE).

3. Tarjeta blanca centrada (persona calificada):
   - Avatar grande de 72px con las iniciales "MR".
   - "Mateo R." en 20px semibold y debajo, en #5F5E5E, "Pasajero · 1 plaza".
   - Pregunta en 18px semibold: "¿Cómo fue viajar con Mateo?"
   - Fila de 5 estrellas grandes (40px, área táctil de 48px) todas vacías en contorno gris
     (todavía no eligió).
   - Debajo, centrado, en #5F5E5E: "Toca una estrella para calificar".

4. Campo de texto multilínea vacío con etiqueta "Comentario (opcional)", placeholder
   "Cuéntanos cómo te fue" en #686C75 y contador "0/200".

5. Nota con icono de información: "Puedes calificar hasta mañana, 14:06."

6. Fijos abajo: botón primario deshabilitado (fondo #EEEEEE, texto #5F5E5E)
   "Enviar y seguir con Sofía A." y debajo un botón de texto gris "Omitir a Mateo R.".
```

## Frame 20-C — Calificación enviada (pasajera)

```text
Usa el mismo sistema visual del frame 20-A: Inter, #BD0016, #FFDAD7, #EEEEEE,
radios 12 y 16 px. Sobre el frame 20-A atenuado con un velo negro al 40 % a todo el ancho,
una hoja inferior (bottom sheet) blanca con radio superior 24px y tirador gris arriba:
- Icono circular verde suave #E6F4EA con un check verde #1B7F3B.
- Título "¡Gracias por calificar!"
- Texto en #5B403D: "Calificaste a Carlos M. por tu viaje de hoy."
- Bloque gris #EEEEEE con 4 estrellas llenas en ámbar y 1 vacía, "Muy bueno" y debajo,
  en cursiva #5F5E5E, "«Puntual y manejó con cuidado.»".
- Botón primario rojo a todo el ancho "Listo".
```

## Frame 20-D — Plazo vencido

```text
Duplica el frame 20-A y cambia solo lo siguiente:
1. Debajo del bloque "TU VIAJE", una franja rojo suave #FFDAD7 con radio 12px, icono de reloj
   y texto #BD0016: "El plazo para calificar este viaje terminó".
2. Estrellas todas vacías y atenuadas al 40 %, sin etiqueta de puntaje.
3. Campo de comentario vacío y deshabilitado (fondo #EEEEEE), contador "0/200".
4. Elimina la nota "Puedes calificar hasta…".
5. Botón fijo de abajo: secundario rojo suave "Volver al historial". Elimina "Enviar
   calificación" y "Ahora no".
Mantén todo lo demás igual. Revisa que el bloque "TU VIAJE" y la tarjeta no se repitan.
```

---

## Supuestos a validar

Adoptados sin objeción el 2026-11-21. «Quién ve el comentario» lo resolvió el usuario el mismo día.

- **Pantalla de flujo** con «← Calificar viaje» y sin barra inferior, igual que P11 y P16. Se entra desde P17-F, P19 o la notificación «Viaje completado».
- **Etiquetas del puntaje** (el README no las define): 1 «Malo», 2 «Regular», 3 «Bueno», 4 «Muy bueno», 5 «Excelente».
- **Envío por persona:** el conductor envía la calificación de cada pasajero al pasar al siguiente («Enviar y seguir con …»), porque la API registra una calificación por petición (secuencia 8.4). En el último pasajero el botón dice «Enviar calificación».
- **«Omitir a …» y «Ahora no»** no registran nada: se puede volver a calificar desde P19 mientras siga el plazo.
- **Quien no se presentó no aparece** en la secuencia del conductor y no cuenta en «Pasajero N de M».
- **Sin la calificación actual del calificado** (★ 4.9) en la tarjeta, para no influir en el puntaje.
- **Quién ve el comentario:** resuelto el 2026-11-21. Solo su autor (al enviarlo, en 20-C). Las calificaciones solo promedian las estrellas del perfil; las reseñas visibles para otros quedan fuera del alcance (README, secciones 1.1 y 12.1).

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| v1.1 | 20-A | Contexto común + 20-A | ✅ |
| v1.2 | 20-B | Contexto común + 20-B | ✅ |
| v1.3 | 20-C | Bloque 20-C | ❌ fondo inventado, hoja sin fondo y botones encimados |
| v1.4 | 20-D | Bloque 20-D (duplica 20-A) | ✅ |
| v2.1 | 20-C | Corrección de v1.3 (duplicar v1.1 + hoja) | ✅ (bandas negras con ruido a los lados) |

### Decisiones de flujo

_(Propuestas el 2026-11-21; el usuario siguió sin comentarlas: **adoptadas sin objeción**.)_

- **Entradas:** P17-F «Finalizar viaje» (conductor, con los pasajeros que subieron); P19 «Calificar a …» o «Calificar pasajeros (N)»; notificación «Viaje completado» (RF-13).
- **«←» y «Ahora no»** vuelven a la pantalla de origen sin guardar. Desde P17-F vuelve a Mis viajes con el toast «Viaje finalizado».
- **Pasajero, tras enviar:** 20-C y «Listo» vuelve al origen. En P19 la tarjeta muestra «Tu calificación» con las estrellas.
- **Conductor, tras el último pasajero:** hoja de éxito como 20-C con «Calificaste a 2 pasajeros» (o «a 1 de 2» si omitió a alguno) y «Listo».
- **Desde P19 con calificaciones parciales:** la secuencia solo incluye a los pasajeros que faltan («Pasajero 1 de 1»).
- **409 `RATING_WINDOW_CLOSED`:** se muestra 20-D. **409 `ALREADY_RATED`:** toast «Ya calificaste a esta persona en este viaje» y se pasa a la siguiente persona o se vuelve al origen.
- **Otro error del servidor:** franja rojo suave sobre el botón con el mensaje de la API; las estrellas y el comentario se conservan.

### Mensajes de validación (para la implementación)

| Campo | Regla | Mensaje |
| --- | --- | --- |
| Estrellas | Obligatorio, entero de 1 a 5 (RN-47) | Botón deshabilitado y «Toca una estrella para calificar» |
| Comentario | Opcional, hasta 200 caracteres (RN-47) | El campo no admite más de 200; contador «200/200» en rojo #BD0016 |
| Plazo | 24 h desde `fecha_fin` (RN-47, `dias_para_calificar`) | «El plazo para calificar este viaje terminó» |
| Repetida | Una por autor, calificado y viaje (RN-47) | «Ya calificaste a esta persona en este viaje» |
| Participante | Reserva `COMPLETADA` o conductor del viaje (RN-47) | «Solo pueden calificar quienes hicieron el viaje» (propuesto) |

### Revisión de v1.1 a v1.4 (ronda 1)

**Formato:** v1.1 y v1.2 miden 780 px (móvil a 2×), v1.3 860 px (con margen blanco a los lados) y v1.4 706 px (≈ 1,8×). Todas son de teléfono.

**Lo que funciona:**

- **20-A (v1.1):** cumple el prompt completo. Encabezado de flujo sin logotipo ni barra inferior, bloque «TU VIAJE» con sede y ruta completa, avatar «CM», 4 estrellas con «Muy bueno», comentario con «29/200», la nota del plazo de 24 h y que no se puede cambiar, y los botones «Enviar calificación» y «Ahora no» fijos abajo.
- **20-B (v1.2):** «Pasajero 1 de 2» con barra de dos segmentos, «Mateo R. · Pasajero · 1 plaza», estrellas vacías con «Toca una estrella para calificar», botón «Enviar y seguir con Sofía A.» deshabilitado y «Omitir a Mateo R.». Sin dato de movilidad (RN-22).
- **20-D (v1.4):** franja «El plazo para calificar este viaje terminó», estrellas y comentario deshabilitados, solo «Volver al historial». Sin bloques repetidos.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 1 | El fondo no es 20-A: Stitch inventó otra pantalla («VIAJE COMPARTIDO», «Toyota Corolla · Gris metálico», insignia de verificado, ★ 4.9, «¿Cómo estuvo tu trayecto?» con estrellas vacías), que contradice los datos de P17 y P19. | 20-C | Alta | 1.ª |
| 2 | No hay hoja inferior blanca: el contenido de éxito flota sobre el velo gris, y el comentario «Puntual y manejó con cuidado.» queda tapado. | 20-C | Alta | 1.ª |
| 3 | Los botones «Enviar calificación» y «Ahora no» de 20-A siguen visibles encima de la hoja, y «Listo» queda encimado sobre «Ahora no». | 20-C | Alta | 1.ª |

**Prompt de corrección** (seleccionar **v1.1 (20-A)** en Stitch como base; guardar como `v2.1.png`). Como el modal se generó sin la pantalla correcta debajo, se pide duplicar 20-A y poner la hoja encima:

```text
Duplica esta pantalla (Calificar viaje de Carlos M., con 4 estrellas y "Muy bueno") exactamente como está, y encima agrega un modal de éxito:
1. Cubre toda la pantalla duplicada con un velo negro al 40 % a todo el ancho de 390 px. Debajo del velo se sigue viendo la misma pantalla: "TU VIAJE", "Hoy, 29 oct · 14:20", "Carlos M.", "Tu conductor · Toyota Yaris blanco • ABC-123" y las 4 estrellas. No cambies ningún texto de la pantalla de fondo.
2. Sobre el velo, una hoja inferior (bottom sheet) de fondo blanco #FFFFFF sólido y opaco, pegada al borde inferior, a todo el ancho, con radio superior 24px, tirador gris #E1E1E1 arriba y 24px de relleno. La hoja tapa por completo los botones "Enviar calificación" y "Ahora no", que no deben verse.
3. Contenido de la hoja, centrado y de arriba hacia abajo:
   - Icono circular de 56px, fondo #E6F4EA, con un check verde #1B7F3B.
   - Título "¡Gracias por calificar!" en 20px semibold #1B1B1B.
   - Texto en #5B403D: "Calificaste a Carlos M. por tu viaje de hoy."
   - Bloque gris #EEEEEE con radio 12px y 16px de relleno: 4 estrellas llenas en ámbar #F59E0B y 1 vacía, debajo "Muy bueno", y debajo en cursiva #5F5E5E "«Puntual y manejó con cuidado.»".
   - Botón primario rojo #BD0016 a todo el ancho de la hoja, alto 52px, texto blanco "Listo". Es el único botón de la hoja.
No agregues insignias de verificado, calificación promedio del conductor, otros modelos de auto ni otros textos.
```

### Revisión de v2.1 (ronda 2)

**Formato:** 932 × 2166 px: la pantalla ocupa ≈ 720 px en el centro y a los lados quedan bandas negras con ruido, como en los modales de P17 (#12 de esa pantalla).

**Corregido:**

- #1: el fondo es 20-A sin cambios («TU VIAJE», «Hoy, 29 oct · 14:20», «Carlos M.», «Toyota Yaris blanco • ABC-123», 4 estrellas y «Muy bueno»).
- #2: la hoja inferior es blanca y opaca, con tirador, icono verde, «¡Gracias por calificar!», el texto, el bloque gris con 4 estrellas, «Muy bueno» y el comentario entre comillas.
- #3: la hoja tapa «Enviar calificación» y «Ahora no»; «Listo» es el único botón.

**Pendiente (tolerable, pasa a la implementación):**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 4 | Bandas negras con ruido a los lados del modal (artefacto de la exportación). | 20-C | Baja | 1.ª |

### Decisión

Se aprueba el 2026-11-21. Capturas finales: 20-A → v1.1, 20-B → v1.2, 20-C → v2.1, 20-D → v1.4.

Ajustes a resolver en la implementación (React + Tailwind):

1. Los modales van sobre la pantalla de origen con un velo negro al 40 % a todo el ancho, sin bandas a los lados (#4).
2. Etiquetas del puntaje: 1 «Malo», 2 «Regular», 3 «Bueno», 4 «Muy bueno», 5 «Excelente». Sin estrellas elegidas, «Toca una estrella para calificar» y el botón deshabilitado.
3. Conductor: en el último pasajero el botón dice «Enviar calificación»; al terminar, la hoja de éxito dice «Calificaste a N pasajeros» (o «a 1 de 2» si omitió a alguno). Desde P19 la secuencia solo incluye a los que faltan.
4. Comentario: no admite más de 200 caracteres; el contador pasa a rojo #BD0016 en «200/200».
5. 409 `ALREADY_RATED`: toast «Ya calificaste a esta persona en este viaje» y pasa a la siguiente persona o vuelve al origen. Otro error: franja rojo suave sobre el botón con el mensaje de la API, conservando estrellas y comentario.
6. 20-D: el botón vuelve al origen; si se entró desde la notificación o desde P17, dice «Volver» en lugar de «Volver al historial».
7. El plazo se calcula con `fecha_fin + dias_para_calificar` (1 día = 24 h), igual que en P19.

**Comentarios (resuelto el 2026-11-21):** solo los ve su autor. Las calificaciones solo promedian las estrellas del perfil; no hay pantalla de reseñas (README, secciones 1.1 y 12.1). La implementación no debe exponer `comentario` en ninguna respuesta de la API dirigida a otro usuario.

**Aprendizaje para las siguientes pantallas:**

- Un modal pedido sin la pantalla de fondo seleccionada sale sobre una pantalla inventada. Lo que funcionó: seleccionar la captura correcta y pedir «Duplica esta pantalla exactamente como está y encima agrega…», con la hoja «blanca sólida y opaca» que «tapa por completo» los botones fijos.
- Fijar en el prompt todos los textos y datos (persona, viaje, plazo, comentario y contador) hizo que 20-A, 20-B y 20-D salieran bien a la primera.
