# Prompt de diseño — P17 Mis viajes

Prompt para generar el diseño de la pantalla 17 y sus modales con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 17-A, y luego cada frame siguiente pegando de nuevo el contexto común.

Fuentes: README raíz (RF-06, RF-07, RN-22, RN-23, RN-25, RN-26, RN-30, RN-43, RN-45, RN-46 y secciones 2.3 y 11), `app-utp-movilidad-colaborativa/src/styles/index.css` y los frames P06 y P14 como referencia de estilo.

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
- Tipografía Inter. Etiquetas de sección en mayúsculas pequeñas con tracking
  (ej. "PRÓXIMO VIAJE"), títulos 28px semibold, horas grandes 28px con cifras tabulares.
- Iconos de línea (Material Symbols Outlined), estrellas de calificación en ámbar.
- Encabezado: menú hamburguesa a la izquierda, logotipo "ColaboraCar" en rojo #BD0016
  bold centrado (solo el texto, sin punto ni adornos), campana de notificaciones con punto
  rojo y avatar con las iniciales del usuario a la derecha.
- Barra de navegación inferior blanca, fija abajo a todo el ancho, con 5 pestañas: Viajes,
  Mis viajes, Historial, Billetera, Perfil. La pestaña activa es una píldora roja #BD0016
  con icono y texto blancos. En esta pantalla la activa es "Mis viajes".
- Debajo del encabezado: eyebrow "VIAJES" y título "Mis viajes".

Reglas que el diseño debe reflejar:
- Cada viaje tiene una sola hora de salida (no rango) y lleva un chip con la sede
  (ej. "Sede Trujillo", "Sede Lima Centro").
- Precio por plaza entre 1 y 10 créditos.
- Estados con chip de color y estas etiquetas exactas: Publicado / Confirmada (gris azulado),
  En curso / En viaje (verde), Completado / Completada (gris), Cancelado / Cancelada por ti /
  Cancelado por el conductor / Cancelado: no se inició (rojo suave), No te presentaste (ámbar).
- Cancelar solo está permitido hasta 30 minutos antes de la salida.
- La necesidad de asistencia de movilidad de un pasajero solo la ve el conductor de su viaje
  (icono de accesibilidad + texto, ej. "Usa silla de ruedas"), en la fila de ese pasajero.
- El modo (pasajero o conductor) se indica con un chip de solo lectura junto al título
  ("Modo pasajero" o "Modo conductor"). No agregues un selector para cambiar de modo.
- La salida más próxima va primero. Un pasajero tiene como máximo una reserva activa y un
  conductor como máximo un viaje En curso.
- Nada de "ShareCar", "A/C activo", "Conductor frecuente", "Puntualidad", chat,
  botón de emergencia, seguimiento en vivo, edición del viaje publicado
  ni correos que no sean @utp.edu.pe.
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 17-A — Mis viajes, modo pasajero

```text
Modo pasajero (usuario Lucía R., avatar "LR"). Junto al título, chip de solo lectura "Modo pasajero".

1. Tarjeta principal "TU RESERVA" (reserva activa, estado Confirmada):
   - Chip "Confirmada" y chip de ciudad "Trujillo".
   - Bloque gris "Salida" con "Hoy, 14:20" grande y debajo "Sale en 1 h 05 min".
   - Ruta vertical con dos puntos: "Campus UTP Trujillo — Av. Nicolás de Piérola 1221"
     → "Urb. El Golf, Víctor Larco".
   - Conductor: avatar, "Carlos M.", ★ 4.9 (120), vehículo "Toyota Yaris blanco • ABC-123".
   - Fila de resumen: "2 plazas" · "12 créditos retenidos" (icono moneda).
   - Texto de ayuda: "Puedes cancelar gratis hasta las 13:50."
   - Botones: secundario "Ver detalle" y botón de texto rojo "Cancelar reserva".
2. Sección "CANCELADOS RECIENTEMENTE" (visibles 24 h), tarjeta atenuada:
   - Chip rojo suave "Cancelado por el conductor".
   - "Ayer, 18:00 · Campus UTP Trujillo → Huanchaco".
   - "Te devolvimos 8 créditos."
```

## Frame 17-B — Mis viajes, modo conductor

```text
Modo conductor (usuario Carlos M., avatar "CM"). Junto al título, chip de solo lectura "Modo conductor".

1. Debajo del título, una franja informativa gris con icono de información:
   "3 de 10 viajes cancelados en los últimos 30 días".

2. Tarjeta "EN CURSO" (arriba porque está en marcha):
   - Chip verde "En curso", chip "Sede Trujillo", "Salió 13:35 · Llegada est. 14:05".
   - Ruta: "Urb. California" → "Campus UTP Trujillo".
   - Lista "Pasajeros a bordo (2)": "Mateo R. ★ 4.9 · 1 plaza", "Sofía A. ★ 4.8 · 1 plaza".
   - Botón primario rojo ancho completo "Finalizar viaje".

3. Tarjeta "PUBLICADO" (próxima salida):
   - Chip "Publicado", chip "Sede Trujillo", bloque "Salida Hoy, 14:20" y "Sale en 12 min".
   - Ruta: "Campus UTP Trujillo — Av. Nicolás de Piérola 1221" → "Urb. El Golf, Víctor Larco".
   - Ocupación: "3 de 4 plazas reservadas" con barra de progreso.
   - Lista de pasajeros, cada fila con avatar, nombre, ★, plazas:
     "Lucía R. ★ 4.8 · 2 plazas",
     "Jorge P. ★ 4.6 · 1 plaza" con línea extra en la misma fila
     "Usa silla de ruedas — necesita espacio en la maletera" (icono de accesibilidad).
   - Botón "Iniciar viaje" deshabilitado con nota "Finaliza tu viaje en curso para iniciar este."
   - Botón de texto deshabilitado "Cancelar viaje" con nota
     "Ya no puedes cancelar: faltan menos de 30 minutos para la salida. Si no puedes hacer
     el viaje, no lo inicies y se cancelará solo."

4. Tarjeta "PUBLICADO" de mañana:
   - "Mañana, 07:00", ruta "Urb. El Golf, Víctor Larco" → "Campus UTP Trujillo".
   - "2 de 3 plazas reservadas": "Diego C. ★ 4.7 · 1 plaza", "Ana V. ★ 4.9 · 1 plaza".
   - Botón "Iniciar viaje" deshabilitado con texto "Disponible desde las 06:45".
   - Botón de texto rojo activo "Cancelar viaje".
```

## Frame 17-C — Modal: cancelar reserva (pasajero)

```text
Sobre el frame 17-A atenuado, una hoja inferior (bottom sheet) blanca con radio superior 24px:
- Icono circular rojo suave con símbolo de cancelar.
- Título "¿Cancelar tu reserva?"
- Texto: "Te devolveremos 12 créditos. Llevas 2 de 5 cancelaciones este mes."
- Resumen del viaje en bloque gris: "Hoy, 14:20 · Campus UTP Trujillo → El Golf".
- Botón primario rojo "Sí, cancelar reserva" y botón secundario gris "Mantener reserva".
```

## Frame 17-D — Modal: cancelar viaje (conductor)

```text
Sobre el frame 17-B atenuado, bottom sheet (cancela el viaje de mañana 07:00):
- Título "¿Cancelar el viaje?"
- Texto: "Se cancelarán las 2 reservas confirmadas y se devolverán sus créditos."
- Resumen del viaje en bloque gris: "Mañana, 07:00 · Urb. El Golf → Campus UTP Trujillo".
- Campo de texto opcional "Motivo (opcional)" con contador "0/200".
- Variante de advertencia en franja rojo suave:
  "Con esta cancelación no podrás publicar viajes hasta el 14/11."
- Botones "Sí, cancelar viaje" (rojo) y "Volver" (gris).
```

## Frame 17-E — Modal: ¿Quiénes subieron? (iniciar viaje)

```text
Sobre el frame 17-B atenuado, bottom sheet alto (inicia el viaje de Hoy, 14:20):
- Título "¿Quiénes subieron?"
- Subtítulo: "Desmarca a quien no se presentó. Sus créditos se pagan igual al cerrar el viaje."
- Lista de 2 pasajeros, cada fila con avatar, nombre, plazas y un checkbox rojo "Subió"
  a la derecha: "Lucía R. · 2 plazas reservadas" marcada, y "Jorge P. · 1 plaza reservada"
  desmarcado, con la fila atenuada y la etiqueta "No se presentó".
- Botón primario "Confirmar inicio" y botón secundario "Cancelar".
```

## Frame 17-F — Modal: finalizar viaje

```text
Sobre el frame 17-B atenuado, bottom sheet:
- Icono circular verde con bandera de llegada.
- Título "¿Finalizar el viaje?"
- Texto: "Recibirás 18 créditos. Tú y tus pasajeros podrán calificarse."
- Botón primario "Finalizar viaje" y secundario "Todavía no".
```

## Frame 17-G — Estado vacío

```text
Mismo encabezado y navegación, modo pasajero (chip "Modo pasajero"). En el centro, ilustración
lineal sencilla de un auto con una ruta punteada en rojo suave, el texto
"No tienes viajes próximos", el texto de apoyo "Cuando reserves un viaje, aparecerá aquí."
y un solo botón "Buscar un viaje".
```

## Frame 17-H — Mis viajes, pasajero con reserva En viaje

```text
Duplica el frame 17-A (v1.2) y cambia solo lo siguiente:
1. Chip de estado verde "En viaje" en lugar de "Confirmada".
2. En el bloque de salida: "Salió 14:22" en grande y, a la derecha, chip verde
   "Llegada est. 14:50" en lugar de "Sale en 1 h 05 min".
3. Reemplaza "Puedes cancelar gratis hasta las 13:50." y los dos botones por la nota gris
   "Los créditos se pagan al conductor cuando termine el viaje." y un solo botón
   secundario "Ver detalle" a todo el ancho.
4. Quita la sección "CANCELADOS RECIENTEMENTE".
Mantén todo lo demás igual. Sin seguimiento en vivo, sin mapa en tiempo real, sin chat.
```

---

## Supuestos a validar

- La navegación inferior pasa de 4 a 5 pestañas para dar entrada a Mis viajes; los frames actuales tienen 4 (Ride, History, Wallet, Profile). Adoptado en v1 sin objeción.
- El modo (pasajero o conductor) se toma del perfil (RF-14); la pantalla no permite cambiarlo, solo lo indica.
- El mensaje «Finaliza tu viaje en curso para iniciar este.» (RN-46) no está en el README: es nuevo y hay que agregarlo a RF-07.

---

## Bitácora

| Captura | Frame                   | Prompt                                                          | Resultado                                     |
| ------- | ----------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| v1.1    | 17-A + 17-B (mezclados) | Contexto común + 17-A, y luego la conversión a móvil (abajo) | Descartada: mezcla los dos modos en una lista |
| v1.2    | 17-A                    | Contexto común + 17-A                                          | ✅                                            |
| v1.3    | 17-B                    | Contexto común + 17-B                                          | ⚠️ datos incoherentes, RN-46, contador      |
| v1.4    | 17-C                    | Contexto común + 17-C                                          | ✅                                            |
| v1.5    | 17-D                    | Contexto común + 17-D                                          | ⚠️ número de reservas                      |
| v1.6    | 17-E                    | Contexto común + 17-E                                          | ⚠️ chip de variante, 3.er pasajero          |
| v1.7    | 17-F                    | Contexto común + 17-F                                          | ✅                                            |
| v1.8    | 17-G                    | Contexto común + 17-G                                          | ❌ selector de modo                           |
| v2.1    | 17-B                    | Corrección de v1.3                                             | ✅                                            |
| v2.2    | 17-D                    | Corrección de v1.5                                             | ✅ (fondo antiguo)                            |
| v2.3    | 17-E                    | Corrección de v1.6                                             | ✅ (fondo antiguo)                            |
| v2.4    | 17-G                    | Corrección de v1.8                                             | ✅                                            |
| v2.5    | 17-H                    | Contexto común + 17-H                                          | ✅ (texto encimado en el encabezado)          |

Prompt de conversión que hizo falta para v1.1, porque Stitch generó la primera pasada en formato de escritorio (anotado por el usuario):

```text
Convierte esta pantalla a formato de teléfono móvil vertical:

- Ancho total de la pantalla: 390 px. Elimina todo el espacio vacío a la derecha;
  el contenido debe ocupar el 100 % del ancho, con márgenes laterales de 16 px.
- No es un diseño web ni de escritorio: una sola columna, sin barras laterales
  ni contenedores centrados con fondo vacío alrededor.
- El encabezado (menú, logotipo ColaboraCar, campana y avatar) ocupa todo el ancho
  arriba.
- La barra de navegación inferior (Viajes, Mis viajes, Historial, Billetera, Perfil)
  queda fija abajo, a todo el ancho, con "Mis viajes" activa como píldora roja #BD0016.
- El botón "Publicar un nuevo viaje" va fijo justo encima de la barra inferior,
  a todo el ancho menos los márgenes de 16 px.

Ajustes de contenido:
- Ordena los viajes por la salida más cercana: En curso (hoy 07:15) → Hoy tarde
  (14:30) → Mañana (06:45). Mueve el viaje cancelado de ayer a una sección final
  llamada "ANTERIORES".
- Cada tarjeta lleva en su encabezado un chip con la sede (ej. "Sede Trujillo",
  "Sede Lima Centro", "Sede Lima Norte"), además del chip de estado y los créditos.

Mantén todo lo demás igual: colores, tipografía Inter, textos, pasajeros,
el aviso de asistencia de movilidad y los créditos.
```

### Decisiones de flujo

Se propusieron el 2026-10-29 y el usuario siguió con la ronda 2 sin comentarlas: quedan **adoptadas sin objeción**.

- **«Ver detalle»** abre P09 Detalle del viaje en modo lectura, sin botón «Reservar».
- **Tras cancelar la reserva (17-C):** toast «Reserva cancelada. Te devolvimos 12 créditos.» y la tarjeta desaparece (las que cancela el propio pasajero no se listan, RF-06). Si no queda nada, se muestra 17-G.
- **Tras cancelar el viaje (17-D):** toast «Viaje cancelado» y la tarjeta desaparece. El contador sube en uno.
- **Tras «Confirmar inicio» (17-E):** la tarjeta pasa a «En curso» y sube al primer lugar. Toast «Viaje iniciado».
- **Tras «Finalizar viaje» (17-F):** se abre P20 Calificar con los pasajeros que subieron. Afecta a P20.
- **Error del servidor en cualquier modal:** el modal sigue abierto y muestra el mensaje de la API en una franja rojo suave sobre los botones.
- **Botón fijo «Publicar un nuevo viaje» (modo conductor):** lo agregó Stitch en v1.1 y se mantiene. Con el límite de RN-30 alcanzado, el botón se deshabilita y la franja del contador pasa a rojo suave con el mensaje de bloqueo de RF-05.

### Revisión de v1.1 a v1.8 (ronda 1)

**v1.1 (descartada).** Viene del primer intento antes de separar los modos. Junta en una sola lista la reserva del pasajero y los viajes del conductor, con un selector «Todos / Como conductor». Además rompe RN-23 (dos reservas activas a la vez), muestra correos de pasajeros, ofrece «Gestionar plazas» (editar un viaje publicado está fuera del alcance), usa el formato AM/PM e inventa la etiqueta «Cancelado a tiempo». No se corrige: la reemplazan v1.2 y v1.3.

**Lo que funciona:**

- **17-A (v1.2):** cumple el prompt completo. Encabezado, chip «Modo pasajero» de solo lectura, ruta, conductor, créditos retenidos, plazo de cancelación y la sección de cancelados con «Cancelado por el conductor». Es la referencia de estilo para el resto.
- **17-C (v1.4):** textos literales de RF-06 («Te devolveremos 12 créditos. Llevas 2 de 5 cancelaciones este mes.»), resumen del viaje y botones correctos.
- **17-F (v1.7):** buen resumen «+18 créditos a tu billetera · 2 pasajeros a bordo». 18 créditos con 2 plazas = 9 por plaza (RN-13).
- **17-B (v1.3):** la estructura es la correcta: en curso → hoy → mañana, ocupación con barra, «Iniciar viaje» deshabilitado con «Disponible desde las 06:45» y el aviso de fuera de plazo para cancelar.
- **17-D (v1.5) y 17-E (v1.6):** los bottom sheets siguen el estilo de 17-C. En 17-E, la fila desmarcada atenuada con «No se presentó» queda clara.

**Pendiente:**

| #  | Problema                                                                                                                                                                                                                      | Frame | Severidad | Veces |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --------- | ----- |
| 1  | Viola RN-46: hay un viaje «En curso» y el de las 14:20 tiene «Iniciar viaje» habilitado. Además, un viaje que salió a las 07:10 con llegada estimada a las 07:45 ya lo habría cerrado el sistema a las 14:08 (RN-27).  | 17-B  | Alta      | 1.ª  |
| 2  | 17-G ofrece un selector «Conductor / Pasajero», dos botones (uno por modo) y «Puedes alternar de rol en cualquier momento». El modo se cambia solo desde el perfil (RF-14, RN-48).                                        | 17-G  | Alta      | 1.ª  |
| 3  | El contador dice «Tasa de cancelación: 30 %…» y agrega una nota con 14/11. El texto literal es «3 de 10 viajes cancelados en los últimos 30 días» (RF-06); el porcentaje se confunde con «Cumplimiento».            | 17-B  | Media     | 1.ª  |
| 4  | La asistencia de movilidad aparece en una franja suelta, sin decir de qué pasajero es, y con el icono duplicado. Tiene que ir en la fila de Jorge P. (RN-22).                                                                | 17-B  | Media     | 1.ª  |
| 5  | Datos que no cuadran con 17-A: el avatar es «LR» aunque el usuario es el conductor, Lucía R. figura como pasajera de su propio viaje (RN-23), y la ruta de las 14:20 es «Óvalos Papal» en vez de Campus UTP → El Golf. | 17-B  | Media     | 1.ª  |
| 6  | Dice «Se cancelarán las 3 reservas», pero el viaje que se puede cancelar (el de mañana) no tiene reservas, y el de hoy ya está fuera de plazo.                                                                           | 17-D  | Media     | 1.ª  |
| 7  | El chip «Ver sin pasajeros» es un control de diseño, no de la app. Además lista a Mateo R., que no está en ese viaje (va a bordo del viaje en curso).                                                                    | 17-E  | Media     | 1.ª  |
| 8  | «Para que hagas seguimiento en tiempo real»: el seguimiento en vivo está fuera del alcance.                                                                                                                                | 17-G  | Media     | 1.ª  |
| 9  | Falta la vista del pasajero con la reserva «En viaje» (RF-06 la incluye).                                                                                                                                                   | 17-H  | Media     | 1.ª  |
| 10 | La tarjeta de mañana repite «Partida programada: Mañana, 07:00» y no muestra la ruta.                                                                                                                                     | 17-B  | Baja      | 1.ª  |
| 11 | El logotipo lleva un punto rojo que no está en P06 ni en P14.                                                                                                                                                                | Todos | Baja      | 1.ª  |
| 12 | El fondo de 17-D tiene bandas negras con ruido a los lados.                                                                                                                                                                   | 17-D  | Baja      | 1.ª  |
| 13 | La nota de cancelación fuera de plazo está recortada: falta «Si no puedes hacer el viaje, no lo inicies y se cancelará solo.»                                                                                            | 17-B  | Baja      | 1.ª  |

Los puntos #11 y #12 son de la herramienta y se resuelven en la implementación. El #11 ya quedó en el contexto común («sin punto ni adornos»).

#### Prompts de corrección (ronda 2)

Seleccionar **v1.3 (17-B)** en Stitch y guardar como `v2.1.png`:

```text
Edita solo esta pantalla y mantén todo lo demás igual (estilo de tarjetas, chips, botones y barra inferior):
1. Avatar del encabezado: iniciales "CM" (el usuario es el conductor Carlos M.). Logotipo "ColaboraCar" sin el punto rojo.
2. Franja superior: reemplaza todo su texto por "3 de 10 viajes cancelados en los últimos 30 días". Sin porcentaje, sin "Tasa de cancelación" y sin la nota. Fondo gris #EEEEEE e icono de información gris #5F5E5E.
3. Tarjeta EN CURSO: cambia el texto a "Salió 13:35 · Llegada est. 14:05". Lo demás igual.
4. Tarjeta de Hoy, 14:20:
   a. Ruta con los mismos puntos de origen y destino que la tarjeta EN CURSO: "Campus UTP Trujillo — Av. Nicolás de Piérola 1221" → "Urb. El Golf, Víctor Larco".
   b. Elimina la franja amarilla de asistencia que está suelta.
   c. Pasajeros: "Lucía R. ★ 4.8 · 2 plazas" y "Jorge P. ★ 4.6 · 1 plaza". En la fila de Jorge P., debajo de su nombre, una línea en ámbar con un solo icono de accesibilidad: "Usa silla de ruedas — necesita espacio en la maletera".
   d. Botón "Iniciar viaje" deshabilitado (fondo #EEEEEE, texto #5F5E5E), con la nota debajo: "Finaliza tu viaje en curso para iniciar este."
   e. Nota bajo "Cancelar viaje" (deshabilitado): "Ya no puedes cancelar: faltan menos de 30 minutos para la salida. Si no puedes hacer el viaje, no lo inicies y se cancelará solo."
5. Tarjeta de Mañana, 07:00:
   a. Quita "Partida programada: Mañana, 07:00" y pon la ruta "Urb. El Golf, Víctor Larco" → "Campus UTP Trujillo" con el mismo estilo de puntos.
   b. Ocupación "2 de 3 plazas reservadas" con barra de progreso y la lista "Diego C. ★ 4.7 · 1 plaza", "Ana V. ★ 4.9 · 1 plaza".
   c. Mantén "Iniciar viaje" deshabilitado con "Disponible desde las 06:45" y "Cancelar viaje" activo en rojo.
No agregues correos, chat, seguimiento en vivo ni botones para editar el viaje.
```

Seleccionar **v1.5 (17-D)** y guardar como `v2.2.png`:

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. Texto bajo el título: "Se cancelarán las 2 reservas confirmadas y se devolverán sus créditos."
2. Debajo de ese texto, un bloque gris #EEEEEE con radio 12px, igual al del modal "¿Cancelar tu reserva?": "Mañana, 07:00 · Urb. El Golf → Campus UTP Trujillo".
3. Fondo: la pantalla mide 390 px de ancho. Atenuado uniforme negro al 40 % sobre la pantalla, sin bandas negras ni ruido a los lados.
4. Logotipo "ColaboraCar" sin el punto rojo.
```

Seleccionar **v1.6 (17-E)** y guardar como `v2.3.png`:

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. Elimina el chip "Ver sin pasajeros".
2. La lista tiene solo dos pasajeros. Elimina a Mateo R.:
   - "Lucía R." con "2 plazas reservadas", checkbox marcado y chip verde "Subió".
   - "Jorge P." con "1 plaza reservada", checkbox desmarcado, fila atenuada y etiqueta "No se presentó".
3. Logotipo "ColaboraCar" sin el punto rojo.
```

Seleccionar **v1.8 (17-G)** y guardar como `v2.4.png`:

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. Reemplaza el selector "Conductor / Pasajero" por un chip de solo lectura "Modo pasajero", igual al de la pantalla Mis viajes en modo pasajero (borde #E1E1E1, fondo #EEEEEE, icono de persona).
2. Texto de apoyo: "Cuando reserves un viaje, aparecerá aquí."
3. Un solo botón primario rojo "Buscar un viaje" con icono de lupa. Elimina "Publicar un viaje (Conductor)".
4. Elimina la línea "Puedes alternar de rol en cualquier momento".
5. Logotipo "ColaboraCar" sin el punto rojo.
No menciones seguimiento en tiempo real.
```

Frame nuevo **17-H**: pegar el **Contexto común + Frame 17-H**, adjuntando v1.2 como referencia, y guardar como `v2.5.png`.

**Ajustes en la implementación** (no se piden a Stitch):

1. Variante de 17-G para el conductor: chip «Modo conductor», «Cuando publiques un viaje, aparecerá aquí.» y botón «Publicar un viaje».
2. Variante de 17-E sin pasajeros: sin lista ni subtítulo, el texto «Este viaje no tiene reservas. ¿Iniciar de todas formas?» y «Confirmar inicio» (RF-07).
3. Variante de 17-A fuera de plazo: «Cancelar reserva» deshabilitado con «Ya no puedes cancelar: faltan menos de 30 minutos para la salida» (RF-06).
4. Variante de 17-B con el límite de RN-30: franja rojo suave y «Publicar un nuevo viaje» deshabilitado (ver Decisiones de flujo).
5. La advertencia de 17-D («Con esta cancelación no podrás publicar viajes hasta el DD/MM.») solo aparece cuando el contador está en 9 de 10.

### Revisión de v2.1 a v2.5 (ronda 2)

Criterio acordado con el usuario: las capturas son una referencia de alta fidelidad, no un plano exacto. Se revisa que cumplan las reglas, no cada píxel.

**Corregido respecto a la ronda 1:**

- #1 (v2.1): «Iniciar viaje» de las 14:20 deshabilitado con «Finaliza tu viaje en curso para iniciar este.», y el viaje en curso con «Salió 13:35 · Llegada est. 14:05».
- #2 (v2.4): chip de solo lectura «Modo pasajero», un solo botón «Buscar un viaje» y sin el texto de alternar el rol.
- #3 (v2.1): el contador dice «3 de 10 viajes cancelados en los últimos 30 días».
- #4 (v2.1): la asistencia de movilidad está en la fila de Jorge P., con un solo icono.
- #5 (v2.1): avatar «CM», ruta Campus UTP → El Golf, Lucía R. con 2 plazas y Jorge P. con 1.
- #6 (v2.2): «Se cancelarán las 2 reservas confirmadas…» y el resumen «Mañana, 07:00 · Urb. El Golf → Campus UTP Trujillo».
- #7 (v2.3): sin «Ver sin pasajeros», con solo Lucía R. y Jorge P.
- #8 (v2.4): sin «seguimiento en tiempo real».
- #9 (v2.5): 17-H con «En viaje», «Salió 14:22», «Llegada est. 14:50» y la nota sobre el pago al conductor.
- #10 y #13 (v2.1): la tarjeta de mañana muestra la ruta, y la nota de fuera de plazo está completa.

**Pendiente (todo tolerable, pasa a la implementación):**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 11 | El logotipo vuelve a llevar el punto rojo. | 17-H | Baja | 2.ª |
| 12 | El fondo de los modales sigue siendo el 17-B anterior (avatar «LR», «Tasa de cancelación») con bandas negras a los lados. | 17-D, 17-E | Baja | 2.ª |
| 14 | El texto «Salió 14:22» quedó encimado sobre el logotipo, en el encabezado. | 17-H | Baja | 1.ª |
| 15 | «2 de 3 plazas reservadas» aparece dos veces en la tarjeta de mañana. | 17-B | Baja | 1.ª |

### Decisión

Se aprueba el 2026-10-29. Capturas finales: 17-A → v1.2, 17-B → v2.1, 17-C → v1.4, 17-D → v2.2, 17-E → v2.3, 17-F → v1.7, 17-G → v2.4, 17-H → v2.5.

Ajustes a resolver en la implementación (React + Tailwind):

1. Logotipo «ColaboraCar» solo con el texto, sin punto. En 17-H, sin el texto encimado en el encabezado (#11, #14).
2. Los modales van sobre el 17-B aprobado, con un velo negro al 40 % a todo el ancho (#12).
3. En la tarjeta de mañana de 17-B queda solo la fila «Ocupación» con barra (#15).
4. 17-G para el conductor: chip «Modo conductor», «Cuando publiques un viaje, aparecerá aquí.» y botón «Publicar un viaje».
5. 17-E sin pasajeros: sin lista ni subtítulo, «Este viaje no tiene reservas. ¿Iniciar de todas formas?» y «Confirmar inicio» (RF-07).
6. 17-A fuera de plazo: «Cancelar reserva» deshabilitado con «Ya no puedes cancelar: faltan menos de 30 minutos para la salida» (RF-06).
7. 17-B con el límite de RN-30: franja rojo suave y «Publicar un nuevo viaje» deshabilitado.
8. La advertencia de 17-D («Con esta cancelación no podrás publicar viajes hasta el DD/MM.») solo aparece cuando el contador está en 9 de 10.
9. Los flujos de éxito y error son los de «Decisiones de flujo».

**Aprendizaje para las siguientes pantallas:**

- Stitch genera escritorio en la primera pasada: el contexto común ya trae la regla de formato.
- Si no se le prohíbe, agrega un selector para cambiar de modo y controles para ver variantes («Ver sin pasajeros»). El contexto común ya lo prohíbe; las variantes se piden como frames aparte o se dejan para la implementación.
- Los datos de ejemplo tienen que cuadrar entre frames (quién es el usuario, qué viaje es cuál, horas compatibles con RN-27 y RN-46). Conviene fijarlos en el prompt del frame principal.
- Al corregir la vista principal, Stitch no actualiza el fondo de los modales que ya se generaron. Se tolera y se resuelve en la implementación.
