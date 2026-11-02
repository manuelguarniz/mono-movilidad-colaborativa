# Prompt de diseño — P06 Dashboard / viajes

Prompt para rediseñar la pantalla 06 del prototipo con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Es un rediseño (modo B): se adjunta [screen.jpeg](screen.jpeg) como referencia de layout (buscador con chips de filtro arriba y tarjetas de viaje con «Reservar») y se aplican los cambios que pide el README. Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 06-A, y luego cada frame siguiente pegando de nuevo el contexto común.

Fuentes: README raíz (RF-03 y sus escenarios Listado, Filtros, Sin resultados, Condiciones, Ya tiene una reserva activa y Bloqueado por cancelaciones; RF-05 precondiciones; RF-13 campana; RN-13, RN-18, RN-19, RN-22, RN-23, RN-24, RN-30, RN-38, RN-48, RN-49; secciones 2.3 y 11), `app-utp-movilidad-colaborativa/src/styles/index.css`, el frame [screen.jpeg](screen.jpeg) y las capturas aprobadas de P11, P17 y P21 como referencia de estilo.

**Qué se conserva del frame:** la tarjeta superior con el buscador y los chips de filtro, la tarjeta de viaje con el precio con moneda arriba a la izquierda, el icono de información arriba a la derecha, la línea del vehículo, los asientos, el bloque gris «Salida», el conductor con foto y calificación a la derecha y el botón rojo «Reservar» a todo el ancho.

**Qué cambia y por qué:**

| Frame actual | Cambio | Regla |
| --- | --- | --- |
| «ShareCar» | «ColaboraCar» | Sección 11 |
| Encabezado sin campana | Campana con contador de no leídas («3», hasta «9+») | RF-13 |
| Barra inferior de 4 pestañas en inglés (Ride, History, Wallet, Profile) | 5 pestañas: Viajes, Mis viajes, Historial, Billetera, Perfil; activa «Viajes» | P17 (navegación adoptada) |
| Salida «14:15 - 14:25» | Una sola hora: «Hoy, 14:20» | Sección 11, `fecha_salida` |
| 45 y 35 créditos | 4 a 6 créditos «por plaza» | RN-13 |
| Sin ciudad | Chip discreto con la ciudad de la sede («Trujillo», «Lima Centro») y viajes de varias sedes | RN-49 |
| Sin accesibilidad | Icono de accesibilidad en la tarjeta si el vehículo es apto | RF-03, RN-18 |
| «Filtros» sin accesibilidad | Hoja de filtros con «Solo vehículos accesibles» | RF-03, RN-19 |
| «Campus Universidad» como campo | Buscador de destino «¿A dónde vas?» | RF-03 (filtro Destino) |
| «Disponible» junto a los asientos | Se quita; los asientos libres ya lo dicen | — |
| Sin ruta | Línea compacta «Origen → Destino» | Decisión del usuario del 2026-11-01 |
| «Publicar un viaje» para todos | Solo en modo conductor, con vista propia (06-F) | RN-24, RN-48; decisión del usuario del 2026-11-01 |

---

## Contexto común (pegar en cada pasada)

Para los frames de modo conductor (06-F y 06-G), cambiar «Modo pasajero» por «Modo conductor», el avatar por «CM» y el título por «Tus viajes».

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
- Verde para estados positivos y abonos: texto #1B7F3B sobre fondo #E6F4EA (chips "En curso",
  "Pagado", montos con +).
- Tipografía Inter. Etiquetas de sección en mayúsculas pequeñas con tracking
  (ej. "VIAJES DISPONIBLES"), títulos 28px semibold, horas grandes 28px con cifras tabulares.
- Iconos de línea (Material Symbols Outlined), estrellas de calificación en ámbar.
- Encabezado: menú hamburguesa a la izquierda, logotipo "ColaboraCar" en rojo #BD0016
  bold centrado (solo el texto, sin punto ni adornos), campana de notificaciones con un
  contador rojo "3" y avatar con las iniciales del usuario a la derecha.
- Barra de navegación inferior blanca, fija abajo a todo el ancho, con 5 pestañas: Viajes,
  Mis viajes, Historial, Billetera, Perfil. La pestaña activa es una píldora roja #BD0016
  con icono y texto blancos. En esta pantalla la activa es "Viajes".
- Debajo del encabezado: eyebrow "VIAJES" y título "Encuentra tu viaje".

Reglas que el diseño debe reflejar:
- Cada viaje tiene una sola hora de salida (no rango) y lleva un chip discreto con la
  ciudad de su sede (ej. "Trujillo", "Lima Centro"). El listado muestra viajes de todas
  las sedes, ordenados por hora de salida.
- Precio por plaza entre 1 y 10 créditos, con la etiqueta "por plaza".
- Estados con chip de color y estas etiquetas exactas: Publicado / Confirmada (gris azulado),
  En curso / En viaje (verde), Completado / Completada (gris), Cancelado / Cancelada por ti /
  Cancelado por el conductor / Cancelado: no se inició (rojo suave), No te presentaste (ámbar).
- Cancelar solo está permitido hasta 30 minutos antes de la salida.
- La necesidad de asistencia de movilidad de un pasajero nunca aparece en esta pantalla.
- El modo (pasajero o conductor) se indica con un chip de solo lectura junto al título
  ("Modo pasajero" o "Modo conductor"). No agregues un selector para cambiar de modo.
- Si el vehículo es apto para silla de ruedas, la tarjeta muestra un icono de accesibilidad
  (texto accesible "Vehículo apto para silla de ruedas plegable"). Si no, no muestra nada.
- "Publicar un viaje" solo aparece en modo conductor; el pasajero solo busca y reserva.
- Nada de "ShareCar", "A/C activo", "Conductor frecuente", "Puntualidad", chat,
  botón de emergencia, seguimiento en vivo, edición del viaje publicado, recomendaciones,
  "Cambiar sede", selector de sede ni correos que no sean @utp.edu.pe.
- Textos en UTF-8: tildes, ñ, "·", "•", "→" y "★" deben verse correctos
  (ej. "Víctor Larco", "Jesús María", "créditos").
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 06-A — Listado, modo pasajero

Adjuntar [screen.jpeg](screen.jpeg) en Stitch.

```text
Usa la imagen adjunta como referencia de layout: conserva su estructura (tarjeta de búsqueda
arriba y tarjetas de viaje debajo) y aplica el sistema visual y los cambios de este prompt.

Modo pasajero (usuario Lucía R., avatar "LR"). Junto al título, chip de solo lectura
"Modo pasajero".

1. Tarjeta de búsqueda (blanca, radio 16px):
   - Campo gris #EEEEEE con punto rojo a la izquierda y placeholder "¿A dónde vas?".
   - Fila de chips contorneados en una sola línea: chip activo rojo suave con reloj
     "Desde 14:00", chip "1 pasajero" con icono de persona y chip "Filtros" con icono
     de ajustes. No agregues el botón "Publicar un viaje".

2. Etiqueta de sección "VIAJES DISPONIBLES" y, a la derecha, "3 viajes" en gris.

3. Tres tarjetas de viaje con esta estructura exacta (ver datos abajo):
   - Fila superior: moneda dorada + precio grande (ej. "6") y debajo "créditos por plaza"
     en gris; a la derecha, chip discreto de ciudad con icono de ubicación y el icono (i)
     de condiciones del viaje.
   - Línea del vehículo con icono de auto: "Toyota Yaris blanco • ABC-123".
   - Línea de ruta en gris: "Campus UTP Trujillo → Urb. El Golf, Víctor Larco"
     (una sola línea, con puntos suspensivos si no entra).
   - Fila: icono de asiento + "3 asientos libres" y, si el vehículo es apto,
     icono de accesibilidad azul grisáceo.
   - A la izquierda, bloque gris "Salida" con la hora grande "Hoy, 14:20" (una sola hora).
     A la derecha, foto circular del conductor, nombre y ★ calificación (reseñas).
   - Botón primario rojo "Reservar" a todo el ancho de la tarjeta.

   Tarjeta 1: 6 créditos · chip "Trujillo" · Toyota Yaris blanco • ABC-123 ·
   Campus UTP Trujillo → Urb. El Golf, Víctor Larco · 3 asientos libres · icono de
   accesibilidad · Salida "Hoy, 14:20" · Carlos M. ★ 4.9 (120).
   Tarjeta 2: 5 créditos · chip "Lima Centro" · Chevrolet Spark rojo • XYZ-789 ·
   Campus UTP Lima Centro → Jesús María · 1 asiento libre · sin icono de accesibilidad ·
   Salida "Hoy, 14:40" · Andrea P. ★ 4.7 (45).
   Tarjeta 3: 4 créditos · chip "Trujillo" · Kia Rio gris • D4K-512 ·
   Campus UTP Trujillo → Huanchaco · 2 asientos libres · sin icono de accesibilidad ·
   Salida "Hoy, 15:10" · Rosa T. ★ 4.8 (62).

Sin "Publicar un viaje", sin selector de sede, sin rangos de hora, sin "Disponible".
```

## Frame 06-B — Pasajero con reserva activa

```text
Duplica el frame 06-A y cambia solo lo siguiente:
1. Entre el título y la tarjeta de búsqueda, una franja gris #EEEEEE con radio 12px e icono
   de información: "Ya tienes una reserva activa. Cancélala para reservar otro viaje."
   y debajo, en una línea, "Hoy, 14:20 · Campus UTP Trujillo → Urb. El Golf" con el enlace
   rojo "Ver en Mis viajes".
2. Los tres botones "Reservar" se ven deshabilitados: fondo #EEEEEE y texto #686C75.
3. La tarjeta 1 (Carlos M.) ahora dice "1 asiento libre" en lugar de "3 asientos libres".
4. En las tres tarjetas, quita el texto partido debajo del precio. En su lugar, en la misma
   fila que la moneda y el número, escribe a la derecha del número el texto
   "créditos por plaza" (14px, #5F5E5E), alineado a la base del número.
   Ejemplo de la fila: [moneda] 6 créditos por plaza ........ [Trujillo] (i)
Mantén todo lo demás igual. No repitas la tarjeta de búsqueda ni las tarjetas de viaje.
```

## Frame 06-C — Pasajero bloqueado por cancelaciones

```text
Duplica el frame 06-B (v3.2) y cambia solo lo siguiente:
1. Reemplaza la franja gris de reserva activa por una franja rojo suave #FFDAD7 con texto
   #BD0016, radio 12px e icono de bloqueo: "Cancelaste o no te presentaste a 5 viajes
   en los últimos 30 días. Podrás reservar de nuevo desde el 08/11." Sin la línea del
   viaje ni el enlace "Ver en Mis viajes".
2. La tarjeta 1 (Carlos M.) vuelve a decir "3 asientos libres".
Mantén todo lo demás igual: los tres "Reservar" deshabilitados y la fila
"[moneda] 6 créditos por plaza" en una sola línea. No repitas la tarjeta de búsqueda
ni las tarjetas de viaje.
```

## Frame 06-D — Modal: filtros

```text
Usa el mismo sistema visual del frame seleccionado (tipografía Inter, rojo #BD0016, rojo suave
#FFDAD7, gris #EEEEEE, radios de 12px y 16px).
Sobre el frame 06-A atenuado, una hoja inferior (bottom sheet) blanca con radio superior 24px,
asa gris arriba, título "Filtros" y "X" para cerrar:
- Campo "Destino" con el valor "El Golf" y ayuda gris "Busca por el nombre del lugar".
- Campo "Salir desde las" con selector de hora "14:00" y ayuda "De 06:00 a 23:00".
- "Pasajeros" con stepper − 1 + (de 1 a 10) y ayuda "Solo viajes con al menos esa
  cantidad de asientos libres".
- Fila con icono de accesibilidad, texto "Solo vehículos accesibles", ayuda
  "Aptos para silla de ruedas plegable" y un interruptor encendido en rojo #BD0016.
- Botón primario rojo "Aplicar filtros" a todo el ancho y debajo botón de texto
  rojo "Limpiar filtros".
Sin filtro de sede, de precio ni de conductor.
```

## Frame 06-E — Sin resultados

```text
Duplica el frame 06-B (v3.2), quita la franja gris de reserva activa y cambia solo lo siguiente:
1. El campo de búsqueda muestra "Huanchaco"; los chips activos (rojo suave) son
   "Desde 20:00", "1 pasajero" y "Accesibles" con icono de accesibilidad, y "Filtros"
   con un punto rojo.
2. Quita la etiqueta "VIAJES DISPONIBLES" y las tres tarjetas. En su lugar, centrado,
   una ilustración lineal sencilla de un auto con una ruta punteada en rojo suave,
   el texto "No hay viajes disponibles con estos filtros" y el botón secundario
   rojo suave "Limpiar filtros".
Mantén el encabezado, el título y la barra inferior iguales.
```

## Frame 06-F — Modo conductor

```text
Usa la pantalla seleccionada (06-B) como referencia de estilo: mismo encabezado, eyebrow,
título, chip de modo debajo del título, tarjetas y barra inferior. Es una pantalla nueva:
no copies el buscador, los filtros ni las tarjetas de viaje.

Modo conductor (usuario Carlos M., avatar "CM"). Título "Tus viajes" y, debajo del título,
chip de solo lectura "Modo conductor". No hay buscador, filtros ni botones "Reservar".

1. Tarjeta destacada blanca con icono de auto en círculo rojo suave:
   título "¿Vas a la universidad o de regreso?", texto gris "Publica tu ruta y comparte
   los gastos del viaje con tu comunidad UTP." y botón primario rojo a todo el ancho
   con icono + "Publicar un viaje".

2. Etiqueta de sección "TUS VIAJES PUBLICADOS" y, a la derecha, enlace rojo
   "Ver en Mis viajes".

3. Lista compacta de tres tarjetas, cada una en una fila: a la izquierda la hora grande,
   en el centro la ruta y la ocupación, a la derecha el chip de estado y una flecha >:
   - "13:35" · chip verde "En curso" · "Urb. California → Campus UTP Trujillo" ·
     "2 pasajeros a bordo".
   - "Hoy, 14:20" · chip "Publicado" · "Campus UTP Trujillo → Urb. El Golf" ·
     "3 de 4 plazas reservadas" con barra de progreso fina.
   - "Mañana, 07:00" · chip "Publicado" · "Urb. El Golf → Campus UTP Trujillo" ·
     "2 de 3 plazas reservadas" con barra de progreso fina.
   Cada fila lleva el chip discreto de ciudad "Trujillo".

Sin listado de viajes de otros conductores, sin datos de pasajeros, sin asistencia de
movilidad, sin botones para iniciar, finalizar o cancelar (eso está en Mis viajes).
```

## Frame 06-G — Conductor bloqueado para publicar

```text
Duplica el frame 06-F (v4.1) y cambia solo lo siguiente:
1. Debajo del texto de la tarjeta destacada, una franja rojo suave #FFDAD7 con texto
   #BD0016, radio 12px e icono de bloqueo: "Cancelaste 10 viajes en los últimos 30 días.
   Podrás publicar de nuevo desde el 14/11."
2. El botón "Publicar un viaje" se ve deshabilitado: fondo #EEEEEE y texto #686C75.
Mantén todo lo demás igual. No repitas la lista de viajes.
```

---

## Supuestos a validar

- **Ruta en la tarjeta** (decisión del usuario, 2026-11-01): RF-03 no la lista entre los datos de la tarjeta. Hay que agregar «origen → destino» al escenario Listado de RF-03.
- **Modo conductor** (decisión del usuario, 2026-11-01): P06 muestra «Publicar un viaje» y un resumen de sus viajes publicados con enlace a P17, sin buscador ni reserva. Sale del texto del modal de RN-48 («Verás tus viajes publicados y podrás publicar nuevos»); conviene escribirlo en RF-03 o RF-05 y en la sección 12.1.
- **Campana con número:** RF-13 pide el contador («hasta 9+»), pero el contexto común de las demás pantallas dice «punto rojo». Si se confirma, se corrige `templates/contexto-comun.md`.
- **Mensaje de RN-23 una sola vez:** RF-03 pide el texto junto al botón «Reservar» deshabilitado; 06-B lo muestra una vez en la franja superior para no repetirlo en cada tarjeta.
- **Hora mínima por defecto:** el chip arranca en la hora actual redondeada («Desde 14:00»). El README no fija el valor inicial.
- **Ayudas de la hoja de filtros** («Busca por el nombre del lugar», «Aptos para silla de ruedas plegable», etc.) son nuevas.

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| v1.1 | 06-A | Contexto común + 06-A (con screen.jpeg adjunto) | ⚠️ contenido correcto; lienzo de escritorio y avatares rotos |
| v2.1 | 06-A | Corrección de v1.1 (el usuario abrió la ronda 2 en lugar de v1.2) | ⚠️ #1–#3 corregidos; «créditos por plaza» partido |
| v3.1 | 06-A | Corrección de v2.1 (planeada como v2.2; el usuario abrió la ronda 3) | ✅ se aprueba 06-A; #6 pasa a 06-B y a la implementación |
| v3.2 | 06-B | Duplicar 06-A (v3.1) + 06-B, con el precio en una fila (planeada como v4.1) | ✅ |
| v3.3 | 06-C | Duplicar 06-B (v3.2) + 06-C | ✅ |
| v3.4 | 06-D | Sobre 06-A (v3.1) + 06-D | ✅ |
| v3.5 | 06-E | Duplicar 06-B (v3.2) sin franja + 06-E | ✅ |
| v3.6 | 06-F | Contexto común (modo conductor) + 06-F, con v3.2 como referencia de estilo | ⚠️ lienzo de escritorio, rutas truncadas, «En viaje» |
| v4.1 | 06-F | Corrección de v3.6 | ✅ |
| v4.2 | 06-G | Duplicar 06-F (v4.1) + 06-G | ✅ |

### Decisiones de flujo

Propuestas el 2026-11-01:

- **Tocar una tarjeta** abre P09 Detalle del viaje. **Icono (i)** abre P07 Condiciones del viaje (RF-03).
- **«Reservar»** abre P08 Confirmar reserva. Al confirmar, toast «Reserva confirmada» y la pantalla pasa a 06-B. Con saldo insuficiente, P08 muestra el mensaje de RN-39 con «Recargar» hacia P21.
- **Chips de filtro:** «Desde 14:00» y «1 pasajero» abren la hoja 06-D con ese campo enfocado; «Filtros» la abre completa. «Aplicar filtros» recarga el listado; si queda vacío, 06-E.
- **Campana** abre P18 Notificaciones.
- **«Ver en Mis viajes»** (06-B y 06-F) y las filas del resumen del conductor abren P17.
- **«Publicar un viaje»** abre P11. Con RN-30 alcanzado, el botón está deshabilitado (06-G), igual que en P17.
- **Scroll:** 20 viajes por página con carga al llegar al final (RF-03). Error del servidor: franja rojo suave «No pudimos cargar los viajes» con «Reintentar» (no se diseña).

### Revisión de v1.1

**Lo que funciona:** cumple el prompt casi entero a la primera. «ColaboraCar» sin punto, campana con contador «3», avatar «LR», chip de solo lectura «Modo pasajero», buscador «¿A dónde vas?» y chips «Desde 14:00», «1 pasajero» y «Filtros». Ninguna tarjeta trae «Publicar un viaje». Las tres tarjetas llevan los datos fijados, con la moneda, «créditos por plaza», el chip de ciudad (dos de Trujillo y una de Lima Centro, RN-49), la línea de ruta, los asientos libres, el icono de accesibilidad solo en el Yaris (RN-18), una sola hora de salida y «Reservar». La barra inferior tiene 5 pestañas, con «Viajes» activa. La codificación está bien (Víctor Larco, Jesús María, →, •) y no aparece nada fuera del alcance.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 1 | La captura mide 1474 px de ancho, con la pantalla centrada (≈ 450 px) y fondo vacío a los lados: es un lienzo de escritorio. | 06-A | Media | 1.ª |
| 2 | Los avatares de Carlos M., Andrea P. y Rosa T. son círculos lila con la imagen rota. | 06-A | Media | 1.ª |
| 3 | El chip «Modo pasajero» queda pegado al título, casi sin separación. | 06-A | Baja | 1.ª |
| 4 | El conductor está dentro del bloque gris «Salida» y no a la derecha, como en el frame. Se acepta: es más compacto. | 06-A | Baja | 1.ª |
| 5 | El chip «Filtros» se corta en el borde derecho de la tarjeta. Se tolera porque la fila de chips se desplaza en horizontal, como en el frame. | 06-A | Baja | 1.ª |

**Prompt de corrección** (seleccionar el frame 06-A en Stitch, en modo App; guardar como `v1.2.png`, guardada como `v2.1.png`):

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. Formato de teléfono: el ancho total de la pantalla es 390 px y el contenido ocupa el 100 %
   del ancho, con márgenes laterales de 16 px. Elimina el fondo vacío a los lados: no es web
   ni escritorio, sin contenedor centrado. El encabezado y la barra inferior van a todo el ancho.
2. Avatares de los conductores: reemplaza las imágenes rotas por círculos grises #EEEEEE
   de 44 px con las iniciales en #5B403D, semibold: "CM" (Carlos M.), "AP" (Andrea P.)
   y "RT" (Rosa T.).
3. Mueve el chip de solo lectura "Modo pasajero" debajo del título "Encuentra tu viaje",
   alineado a la izquierda y con 8 px de separación.
Mantén igual los textos, los datos, los colores, las tarjetas y la barra inferior.
```

### Revisión de v2.1

El usuario guardó la corrección de v1.1 como `v2.1.png` y abrió la ronda 2. Se adopta esa numeración. La captura mide 780 × 2877 px, que es formato móvil.

**Corregido respecto a v1.1:**

- #1: la pantalla ocupa todo el ancho, sin fondo vacío a los lados.
- #2: los avatares tienen iniciales en círculos grises: «CM», «AP» y «RT».
- #3: el chip «Modo pasajero» está debajo del título, con separación.

**Lo que se mantiene bien:** encabezado, buscador y chips, los datos de las 3 tarjetas, el chip de ciudad, el icono de accesibilidad solo en el Yaris, una sola hora de salida y la barra de 5 pestañas con «Viajes» activa.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 6 | «créditos por plaza» se parte en tres líneas («crédi / tos por / plaza») debajo del precio, en las tres tarjetas. | 06-A | Media | 1.ª |
| 7 | La barra inferior fija tapa el botón «Reservar» de la tercera tarjeta en la captura larga. Es normal en una barra fija: se resuelve en la implementación con un relleno inferior igual a la altura de la barra. | 06-A | Baja | 1.ª |
| 5 | El chip «Filtros» sigue cortado en el borde derecho (se tolera; ver v1.1). | 06-A | Baja | 2.ª |

**Prompt de corrección** (seleccionar el frame 06-A de v2.1 en Stitch; guardar como `v2.2.png`, guardada como `v3.1.png`):

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. En las tres tarjetas, el texto debajo del precio "créditos por plaza" va en una sola línea,
   sin cortar palabras: 14px, color #5F5E5E, sin salto de línea (white-space: nowrap).
   Ancho del bloque del precio: automático, no fijo.
2. Agrega un espacio inferior de 96 px al final de la lista para que la barra de navegación
   no tape el botón "Reservar" de la última tarjeta.
Mantén igual los textos, los datos, los colores, los avatares, las tarjetas y la barra inferior.
```

### Revisión de v3.1

El usuario guardó la corrección de v2.1 como `v3.1.png`. Se adopta su numeración: cada captura nueva abre una ronda (convención ajustada en la revisión de v3.2).

**Corregido respecto a v2.1:** #7: se agregó el espacio inferior, así que la barra ya no tapa el contenido. En la captura queda una franja blanca debajo de la barra, que es un artefacto del lienzo largo.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 6 | «créditos por plaza» quedó peor: ahora se parte en cuatro líneas («crédi / tos / por / plaza»). Stitch no lo resolvió en dos intentos. | 06-A | Media | 2.ª |
| 5 | Chip «Filtros» cortado (se tolera). | 06-A | Baja | 3.ª |

**Decisión sobre 06-A:** se da por cerrado con v3.1. Todo lo demás cumple, y #6 es un ajuste mecánico de CSS (`white-space: nowrap` o el texto en la misma fila del número). En lugar de volver a describirlo, se cambia la estructura: 06-B pide el texto a la derecha del número, en la misma fila. Si 06-B sale bien, pasa a ser la base de 06-C y 06-E, y su fila de precio es la referencia de la implementación.

### Revisión de v3.2

**Convención de numeración (usuario, 2026-11-01):** una corrección sobre una captura existente abre una ronda nueva, y un frame nuevo que parte de la última iteración suma en la ronda actual. Por eso 06-B es `v3.2` y no `v4.1`. Se registró también en la skill `diseno-stitch`.

**06-B ✅ a la primera.** Tiene la franja gris con el texto literal de RN-23 («Ya tienes una reserva activa. Cancélala para reservar otro viaje.»), la línea «Hoy, 14:20 · Campus UTP Trujillo → Urb. El Golf» y el enlace «Ver en Mis viajes». Los tres «Reservar» están deshabilitados y Carlos M. muestra «1 asiento libre». No hay bloques repetidos y no se perdió nada del 06-A.

**Corregido:** #6: «créditos por plaza» queda en una sola línea, a la derecha del número, en las tres tarjetas. **06-B (v3.2) reemplaza a 06-A como referencia de la fila de precio** y es la base de 06-C y 06-E.

**Nota:** la captura se exportó a 1× (391 px de ancho). Sirve como referencia, pero conviene exportar a 2× para leer los textos pequeños.

**Pendiente:** solo #5 (chip «Filtros» cortado, se tolera).

### Revisión de v3.3

**06-C ✅ a la primera.** Tiene la franja rojo suave con icono de candado y el texto literal de RN-38 («Cancelaste o no te presentaste a 5 viajes en los últimos 30 días. Podrás reservar de nuevo desde el 08/11.»), sin la línea del viaje ni el enlace. Carlos M. vuelve a «3 asientos libres», los tres «Reservar» están deshabilitados y la fila del precio queda en una línea. No hay bloques repetidos. Se exportó a 2× (780 px).

**Pendiente:** solo #5 (chip «Filtros» cortado, se tolera).

### Revisión de v3.4

**06-D ✅ a la primera.** La hoja de filtros trae los cuatro filtros de RF-03 con sus ayudas: destino «El Golf», «Salir desde las» 14:00 («De 06:00 a 23:00»), pasajeros con un stepper en 1 y el interruptor «Solo vehículos accesibles» encendido (RN-19). Además tiene «Aplicar filtros» y «Limpiar filtros». No hay filtro de sede, de precio ni de conductor.

**Pendiente (tolerable, pasa a la implementación):**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 8 | El fondo atenuado es 06-A de v3.1, con «créditos por plaza» partido. Es lo esperado: el fondo del modal es el listado real. | 06-D | Baja | 1.ª |
| 9 | Stitch agregó el placeholder «Plazas requeridas» dentro del campo del stepper. Se acepta. | 06-D | Baja | 1.ª |
| 10 | La captura incluye márgenes blancos y la sombra del lienzo (932 px de ancho). Es un artefacto de la exportación. | 06-D | Baja | 1.ª |

### Revisión de v3.5

**06-E ✅ a la primera.** El campo muestra «Huanchaco» y los chips activos «Desde 20:00», «1 pasajero» y «Accesibles». Tiene la ilustración del auto en un círculo rojo suave, el texto literal de RF-03 «No hay viajes disponibles con estos filtros» y el botón secundario «Limpiar filtros». No quedan tarjetas ni la franja de 06-B.

**Pendiente:** #5 de nuevo: la fila de chips se corta en «Accesib…» y el chip «Filtros» con su punto queda fuera de la vista. Se tolera porque la fila se desplaza. En la implementación conviene que los chips activos vayan primero o que «Filtros» quede fijo a la derecha (Baja, 4.ª).

### Revisión de v3.6

**Lo que funciona:** el encabezado tiene «CM» y la campana con «3», el título «Tus viajes» va con el chip «Modo conductor» debajo, y la tarjeta destacada trae «Publicar un viaje». La sección «TUS VIAJES PUBLICADOS» tiene el enlace «Ver en Mis viajes». Las tres filas siguen el orden de P17-B: «En curso» en verde, dos «Publicado» en gris azulado, el chip «Trujillo» y las barras de ocupación. No hay buscador, «Reservar», datos de pasajeros ni acciones de Mis viajes.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 11 | La captura vuelve a ser un lienzo de escritorio (1600 × 1280, con la pantalla centrada). | 06-F | Media | 1.ª (igual que #1) |
| 12 | Las rutas se truncan hasta perder el destino («Urb. California → Ca…», «Campus UTP Trujill…»). | 06-F | Media | 1.ª |
| 13 | Debajo de «13:35» dice «En viaje», que es la etiqueta de la reserva del pasajero (sección 2.3), no la del viaje. Para el conductor va «Salió», como en P17-B. | 06-F | Media | 1.ª |
| 14 | La ocupación dice «3 de 4 plazas» en lugar de «3 de 4 plazas reservadas». Se acepta por espacio. | 06-F | Baja | 1.ª |

**Prompt de corrección** (seleccionar el frame 06-F de v3.6 en Stitch, en modo App; guardar como `v4.1.png`):

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. Formato de teléfono: el ancho total es 390 px y el contenido ocupa el 100 % del ancho,
   con márgenes laterales de 16 px. Elimina el fondo vacío a los lados.
2. En las tres filas de viaje, mueve el chip de estado ("En curso" / "Publicado") a la misma
   línea que el chip "Trujillo", arriba, para liberar espacio. La ruta queda debajo
   en hasta dos líneas, sin puntos suspensivos y con el texto completo:
   "Urb. California → Campus UTP Trujillo",
   "Campus UTP Trujillo → Urb. El Golf",
   "Urb. El Golf → Campus UTP Trujillo".
3. En la primera fila, cambia "En viaje" debajo de la hora por "Salió" en gris #5F5E5E,
   arriba de "13:35" (igual que "HOY" y "MAÑANA" en las otras filas).
Mantén igual el encabezado, la tarjeta "Publicar un viaje", las barras y la barra inferior.
```

### Revisión de v4.1

**Corregido respecto a v3.6:**

- #11: formato móvil, 780 px de ancho (2×).
- #12: el chip de estado está junto a «Trujillo» y las rutas se ven completas, en dos líneas.
- #13: «SALIÓ 13:35», con el mismo estilo que «HOY» y «MAÑANA».

**06-F ✅.** Se aprueba con v4.1.

**Pendiente (tolerable):** #14 («3 de 4 plazas», sin «reservadas») y un corte de línea en «Urb. El / Golf». En la implementación se evita con un espacio no separable dentro de los nombres de lugar (Baja).

### Revisión de v4.2

**06-G ✅ a la primera.** La franja rojo suave con candado y el texto literal de RF-05/RN-30 («Cancelaste 10 viajes en los últimos 30 días. Podrás publicar de nuevo desde el 14/11.») queda dentro de la tarjeta destacada, y «Publicar un viaje» está deshabilitado. La lista de viajes no se repite y no se perdió nada de 06-F. La fecha 14/11 coincide con la advertencia de P17-D.

### Decisión

Se aprueba el 2026-11-01. Capturas finales: 06-A → v3.1, 06-B → v3.2, 06-C → v3.3, 06-D → v3.4, 06-E → v3.5, 06-F → v4.1, 06-G → v4.2.

Ajustes a resolver en la implementación (React + Tailwind):

1. La fila del precio va como en 06-B (v3.2): «[moneda] 6 créditos por plaza» en una línea, con `whitespace-nowrap`. En 06-A (v3.1) y en el fondo de 06-D sale partida.
2. La fila de chips se desplaza en horizontal. Conviene dejar «Filtros» fijo a la derecha, o poner primero los chips activos, para que su punto rojo siempre se vea (#5).
3. La lista necesita un relleno inferior igual a la altura de la barra de navegación, para que la barra no tape el último «Reservar» (#7).
4. 06-F muestra «3 de 4 plazas reservadas» si entra; si no, «3 de 4 plazas» (#14). En los nombres de lugar se usa un espacio no separable («Urb. El Golf») para que no se corten (#14).
5. Campana: contador de no leídas hasta «9+», con `aria-label` «Notificaciones, N sin leer» (RF-13).
6. Icono de accesibilidad con el texto accesible «Vehículo apto para silla de ruedas plegable» (RF-03).
7. 06-B y 06-C muestran el motivo una sola vez, en la franja superior, y los «Reservar» deshabilitados llevan `aria-disabled` y el mismo texto como descripción accesible.
8. El chip de hora mínima arranca en la hora actual redondeada («Desde 14:00»). Paginación de 20 viajes con carga al hacer scroll (RF-03).
9. Los flujos de éxito y error son los de «Decisiones de flujo».
10. El fondo de 06-D es 06-A real; Stitch lo dejó con la fila de precio de v3.1.

**Aprendizaje para las siguientes pantallas:**

- Si Stitch no corrige un texto que se parte en dos intentos (#6), funciona cambiar la estructura (moverlo a la misma fila del número) en lugar de repetir la instrucción.
- El formato de escritorio vuelve a aparecer en los frames que no se duplican (06-A, 06-F): conviene verificar el modo **App** antes de cada pasada con contexto común.
- Duplicar el frame más correcto (06-B en lugar de 06-A) hizo que 06-C y 06-E salieran bien a la primera.
