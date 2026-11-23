# Prompt de diseño — P18 Notificaciones

Prompt para generar el diseño de la pantalla 18 con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 18-A, y luego cada frame siguiente (18-B con el contexto común; 18-C y 18-D duplicando).

Fuentes: README raíz (RF-13 con la tabla de tipos y mensajes, RN-22, RN-32, RN-33, RN-34, RNF-16; sección 5.1, colección `notificaciones`; secciones 2.4 y 11), `app-utp-movilidad-colaborativa/src/styles/index.css`, las capturas aprobadas de P21 (v1.1: movimientos agrupados por día con icono en círculo) y P19 (v3.1) como referencia de estilo, y el encabezado de flujo de P16 (v2.1).

Sin referencia visual del usuario. Patrones que se toman de bandejas de notificaciones de apps en producción, no su marca:

- **Agrupadas por día** («Hoy», «Ayer», «27 oct»), la más reciente primero, igual que los movimientos de la Billetera (P21).
- **No leída = punto rojo + fondo rojo muy suave + título en semibold.** No depende solo del color: el punto y el peso del texto también cambian, y el lector de pantalla anuncia «No leída».
- **Un icono por tipo en un círculo**, con el mismo lenguaje de P21: auto para viajes, asiento para reservas, calendario tachado para cancelaciones, reloj para recordatorios, estrella para calificar, billetera para retiros.
- **Toda la fila es tocable** y lleva un chevron «›» porque abre otra pantalla; no hay botones dentro de cada notificación.
- **Una sola acción global** («Marcar todas como leídas»), arriba, como enlace de texto. Se deshabilita si no hay no leídas.

Datos de ejemplo encadenados con P17, P19, P20 y P21: «Hoy» es jue 29 oct 2026 y la bandeja se mira a las 15:00, después de los viajes de hoy.

- **Lucía R.** reservó a las 13:15 el viaje de Carlos de Hoy 14:20 (P21-B), Campus UTP Trujillo → Urb. El Golf; el viaje inició a las 14:22 y terminó a las 14:50 (17-H, 19-A). Ayer, Rosa T. canceló el viaje del 28/10 18:00 a Huanchaco y le devolvió 8 créditos a las 16:02 (17-A, 21-B).
- **Carlos M.** recibió la reserva de Jorge P. (1 plaza, silla de ruedas) a las 09:10 y la de Lucía R. (2 plazas) a las 13:15. Su viaje de 13:35 terminó a las 14:06 (Mateo R. y Sofía A., +9 cada uno, 21-A). En el de 14:20, Jorge P. no se presentó (17-E), así que cobra 18 créditos: 12 de Lucía y 6 de Jorge (RN-40).

---

## Contexto común (pegar en las pasadas sin duplicar)

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
  Rojo acento #E6212A para puntos e indicadores.
- Rojo suave #FFDAD7 con texto #BD0016 para botones secundarios y chips activos.
  Rojo muy suave #FFF1F0 para el fondo de las filas no leídas.
- Superficie gris #EEEEEE para bloques internos y círculos de iconos neutros.
- Texto principal #1B1B1B, secundario marrón #5B403D, apagado #5F5E5E, placeholder #686C75.
- Verde para estados positivos: texto #1B7F3B sobre fondo #E6F4EA.
- Ámbar para avisos: texto #8A5A00 sobre fondo #FFF4D6.
- Tipografía Inter. Subtítulos de grupo ("HOY", "AYER") en mayúsculas pequeñas con tracking,
  títulos 28px semibold. Cifras y horas con números tabulares, nunca en fuente monoespaciada.
- Iconos de línea (Material Symbols Outlined), dentro de círculos de 40 px.
- Encabezado de flujo (pantalla sin barra de navegación inferior): flecha "←" para volver
  a la izquierda y el título "Notificaciones" en 22px semibold (solo la primera letra
  en mayúscula). Sin logotipo, campana, avatar ni menú hamburguesa.
- Sin barra de navegación inferior.

Reglas que el diseño debe reflejar:
- La más reciente primero, agrupadas por día. Cada notificación muestra icono, título,
  mensaje completo (hasta 3 líneas, sin cortar datos) y hace cuánto llegó
  ("Hace 10 min", "Hace 1 h", "Ayer, 16:02").
- Las no leídas llevan un punto rojo #E6212A de 8 px a la izquierda del título, fondo
  #FFF1F0 y título semibold. Las leídas, fondo blanco y título regular.
- Toda la fila es tocable y lleva un chevron "›" a la derecha. No hay botones dentro
  de una notificación.
- Las notificaciones son solo avisos dentro de la app: no hay push, correo ni SMS, ni
  ajustes de notificaciones.
- La necesidad de asistencia de movilidad de un pasajero solo aparece en las
  notificaciones del conductor de su viaje.
- Nada de "ShareCar", chat, responder mensajes, botón de emergencia, seguimiento en vivo,
  promociones, publicidad ni correos que no sean @utp.edu.pe.
- Textos en UTF-8: tildes, ñ, "·", "•" y "¡" deben verse correctos
  (ej. "terminó", "Huanchaco", "¡Califica").
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 18-A — Bandeja de la pasajera

Elegir el modo **App** en Stitch. Guardar como `v1.1.png`.

```text
Usuaria: pasajera Lucía R. Son las 15:00 del jueves 29 de octubre.
Contenido, de arriba abajo:

1. Encabezado de flujo: "←" y "Notificaciones".

2. Fila bajo el encabezado: a la izquierda, "3 sin leer" en 14px #5B403D; a la derecha,
   enlace de texto rojo #BD0016 semibold con icono de doble check: "Marcar todas como leídas".

3. Subtítulo de grupo "HOY". Lista en una tarjeta blanca con separadores de 1px #E1E1E1:
   a. No leída. Icono de estrella en círculo ámbar #FFF4D6. Título "Viaje completado".
      Mensaje: "Tu viaje a Urb. El Golf terminó. ¡Califica a Carlos M.!". Hora "Hace 10 min".
   b. No leída. Icono de auto en círculo verde #E6F4EA. Título "Viaje iniciado".
      Mensaje: "Tu viaje a Urb. El Golf inició.". Hora "Hace 38 min".
   c. No leída. Icono de reloj en círculo gris #EEEEEE. Título "Recordatorio de salida".
      Mensaje: "Tu viaje a Urb. El Golf sale a las 14:20.". Hora "Hace 1 h".

4. Subtítulo de grupo "AYER". Tarjeta blanca:
   a. Leída. Icono de calendario tachado en círculo rojo suave #FFDAD7. Título "Viaje cancelado".
      Mensaje: "Rosa T. canceló el viaje del 28/10 18:00 a Huanchaco. Te devolvimos
      8 créditos. Motivo: Tuve un problema con el auto.". Hora "Ayer, 16:02".

5. Debajo de la lista, texto centrado 13px #5F5E5E: "Las notificaciones se borran
   a los 30 días."

Cada fila: icono a la izquierda, título 16px, mensaje 14px #5B403D en hasta 3 líneas,
hora 13px #5F5E5E debajo del mensaje y chevron "›" a la derecha. Padding 16px.
No agregues barra inferior, pestañas, filtros ni ajustes.
```

## Frame 18-B — Bandeja del conductor

Contexto común + este bloque. Adjuntar la captura aprobada de 18-A como referencia de estilo.

```text
Usa la pantalla adjunta (bandeja ya aprobada) como referencia exacta de estilo: mismo
encabezado, filas, iconos, punto de no leída y tarjetas. Es otra bandeja: cambia el contenido.
Usuario: conductor Carlos M. Son las 15:00 del jueves 29 de octubre.

1. Encabezado de flujo: "←" y "Notificaciones".

2. Fila: "2 sin leer" a la izquierda y "Marcar todas como leídas" a la derecha.

3. Grupo "HOY":
   a. No leída. Estrella en círculo ámbar. "Viaje completado".
      "Tu viaje a Urb. El Golf terminó. ¡Califica a Lucía R.! Recibiste 18 créditos."
      "Hace 10 min".
   b. No leída. Estrella en círculo ámbar. "Viaje completado".
      "Tu viaje a Campus UTP Trujillo terminó. ¡Califica a Mateo R. y Sofía A.!
      Recibiste 18 créditos." "Hace 54 min".
   c. Leída. Reloj en círculo gris. "Recordatorio de salida".
      "Tu viaje a Urb. El Golf sale a las 14:20." "Hace 1 h".
   d. Leída. Asiento en círculo gris. "Nueva reserva".
      "Lucía R. reservó 2 plaza(s) en tu viaje del 29/10 14:20." "Hace 1 h".
   e. Leída. Asiento en círculo gris. "Nueva reserva".
      "Jorge P. reservó 1 plaza(s) en tu viaje del 29/10 14:20."
      Debajo, en una línea propia en ámbar #8A5A00 con un solo icono de accesibilidad:
      "Necesita asistencia: Silla de ruedas." "Hace 5 h".

4. Texto centrado: "Las notificaciones se borran a los 30 días."

Los montos "18 créditos" van en el texto, sin icono de moneda ni color verde.
```

## Frame 18-C — Todas leídas

```text
Duplica el frame 18-A y cambia solo lo siguiente:
1. Las tres notificaciones de "HOY" pasan a leídas: fondo blanco, sin punto rojo
   y título en peso regular.
2. La fila superior dice "Todo leído" a la izquierda (una sola línea), y el enlace
   "Marcar todas como leídas" se ve deshabilitado (texto #686C75, sin icono de color).
Mantén igual los textos, las horas, los iconos y el grupo "AYER". No repitas filas.
```

## Frame 18-D — Estado vacío

```text
Duplica el frame 18-A y cambia solo lo siguiente:
1. Quita la fila "3 sin leer / Marcar todas como leídas", los grupos y el texto de 30 días.
2. En el centro vertical de la pantalla: ilustración lineal sencilla de una campana en
   un círculo gris #EEEEEE de 96 px, el título "No tienes notificaciones" en 18px semibold
   y debajo, en 14px #5F5E5E, centrado: "Aquí verás los avisos de tus reservas, viajes
   y calificaciones pendientes."
3. Botón secundario rojo suave #FFDAD7 con texto #BD0016: "Buscar viajes".
Mantén el encabezado "← Notificaciones". Sin barra inferior.
```

---

## Supuestos a validar

- **Pantalla de flujo sin barra inferior:** P18 se abre desde la campana (RF-13) y vuelve con «←». No es una pestaña.
- **Hora relativa:** «Hace N min» hasta 59 min, «Hace N h» hasta las 23:59 del día, «Ayer, HH:MM» y luego «DD mmm, HH:MM». El README dice «hace cuánto llegó» sin formato.
- **Título por tipo:** la colección guarda `titulo`, pero RF-13 solo nombra los tipos. Se usa el nombre del tipo como título («Nueva reserva», «Viaje completado», …).
- **Destino de cada tipo** (RF-13: «la pantalla relacionada»): «Nueva reserva», «Reserva cancelada», «Recordatorio de salida» y «Viaje iniciado» → Mis viajes (P17); «Viaje cancelado» y «No te presentaste» → Historial (P19); «Viaje completado» → Calificar (P20) si el plazo sigue abierto, si no → Historial; «Retiro rechazado» → Billetera (P21).
- **Iconos y colores por tipo:** estrella ámbar (completado), auto verde (iniciado), reloj gris (recordatorio), asiento gris (nueva reserva), calendario tachado rojo suave (viaje cancelado, reserva cancelada), alerta ámbar (no te presentaste), billetera rojo suave (retiro rechazado).
- **Leyenda de 30 días:** no está en el README; informa RN-34 para que el usuario no busque avisos antiguos.
- **Estado vacío con «Buscar viajes»:** agregado; lleva al dashboard. Para un conductor el botón sería «Publicar viaje».
- **Error de carga:** franja rojo suave «No pudimos cargar tus notificaciones» con «Reintentar» (no se diseña).
- **Campana del encabezado** (P06 y demás pantallas con barra): contador rojo con el número de no leídas hasta «9+» y texto accesible «Notificaciones, N sin leer» (RF-13). Ya figura en los prompts de P06, P13 y P14; no se rediseña aquí.

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| v1.1 | 18-A | Contexto común + 18-A | ✅ Aprobable |
| v1.2 | 18-B | Contexto común + 18-B (ref. v1.1) | ✅ Aprobable |
| v1.3 | 18-C | Duplica 18-A | ⚠️ Fila superior partida en dos líneas (#1) |
| v1.4 | 18-D | Duplica 18-A | ✅ Aprobable |
| v2.1 | 18-C | Corrección de v1.3 | ✅ Aprobada |

### Revisión 2026-11-23 (v1.1–v1.4)

Las cuatro capturas son móviles a 2× (780 px de ancho), sin barra inferior ni hamburguesa, con tildes, «¡» y «·» correctos.

**Funciona:**

- 18-A: tres no leídas con punto rojo, fondo #FFF1F0 y título semibold; la de «AYER» en blanco y regular. Textos literales, iconos y colores por tipo como se pidieron. «3 sin leer» y «Marcar todas como leídas» en una línea.
- 18-B: «2 sin leer», dos «Viaje completado» no leídos con los créditos dentro del texto (sin moneda ni verde), «Nueva reserva» con «2 plaza(s)» literal de RF-13 y la línea ámbar de asistencia solo en la reserva de Jorge P. (RN-22).
- 18-C: las tres de «HOY» pasan a leídas sin repetir filas; textos, horas e iconos iguales a 18-A.
- 18-D: campana en círculo gris, título, texto de ayuda y «Buscar viajes» en rojo suave; sin restos de la lista.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 1 | La fila superior no cabe: «Sin notificaciones nuevas» y «Marcar todas como leídas» se parten en dos líneas y el icono de doble check queda suelto en medio. Los dos textos juntos miden más que los 358 px útiles, así que hay que acortar el de la izquierda. | 18-C | Media | 1 |
| 2 | Chevron «›» desalineado: en la primera fila de cada tarjeta queda unos 15 px más a la derecha que en las demás. | 18-A, 18-B, 18-C | Baja | 1 |
| 3 | Estrella rellena en 18-A y 18-C, de contorno en 18-B. | 18-B | Baja | 1 |
| 4 | Línea divisoria bajo el encabezado en 18-A, 18-C y 18-D, pero no en 18-B. | 18-B | Baja | 1 |
| 5 | La leyenda «Las notificaciones se borran a los 30 días.» queda pegada al fondo con un hueco grande, en lugar de ir 24 px debajo de la lista. | 18-A, 18-C | Baja | 1 |
| 6 | La línea de asistencia se parte («Silla de / ruedas.»). Aceptable: el texto completo se lee. | 18-B | Baja | 1 |

Los #2 a #6 pasan a «Ajustes en la implementación» (son de un componente `FilaNotificacion` y del layout de la lista). Solo el #1 lleva prompt de corrección.

Corrección planeada como `v2.1` (seleccionar v1.3 en Stitch):

```text
Edita solo esta pantalla y mantén todo lo demás igual.
1. La fila bajo el encabezado debe caber en una sola línea, sin saltos de línea:
   a la izquierda "Todo leído" en 14px regular #5B403D; a la derecha, en la misma línea,
   el icono de doble check y "Marcar todas como leídas" en 14px #686C75 (deshabilitado),
   con el icono pegado al texto (gap 4 px). Ninguno de los dos textos puede partirse.
2. Alinea los chevrons "›" de todas las filas a 16 px del borde derecho de la tarjeta.
3. Coloca "Las notificaciones se borran a los 30 días." 24 px debajo de la última tarjeta,
   no al fondo de la pantalla.
No cambies las filas, los textos de las notificaciones, las horas ni los iconos.
```

- **18-C, texto de la izquierda:** «Sin notificaciones nuevas» pasa a «Todo leído» porque no cabe junto al enlace en 390 px (ver #1). Actualizar el bloque de 18-C.

### Decisiones de flujo

Propuestas el 2026-11-21:

- **Entrada:** la campana del encabezado de las pantallas con barra inferior. Al abrir P18 el contador no cambia; baja a medida que se tocan las notificaciones o con «Marcar todas como leídas».
- **Tocar una notificación:** se marca como leída (`leida: true`) y navega al destino de su tipo (ver supuestos). Al volver con «←» desde el destino, se regresa a P18 con la fila ya leída.
- **«Marcar todas como leídas»:** marca todas las del usuario (RN-34) y muestra 18-C, sin diálogo de confirmación.
- **Actualización:** la bandeja se recarga al abrirla; el contador de la campana se actualiza al abrir la app y cada 60 s (RNF-16).
- **Accesibilidad:** cada fila se anuncia como «No leída. {Título}. {Mensaje}. {Hora}» y es un único elemento tocable de al menos 44 px de alto.

### Revisión 2026-11-23 (v2.1)

- **Corregido #1:** «Todo leído» y «Marcar todas como leídas» (deshabilitado, con el icono pegado) caben en una línea.
- **#5 mejorado:** la leyenda de 30 días quedó a unos 56 px de la última tarjeta (se pidieron 24 px).
- **#2 sin cambio:** el chevron de la primera fila sigue unos 15 px más a la derecha. Pasa a la implementación.

## Decisión

Aprobada el 2026-11-23.

| Frame | Captura final |
| --- | --- |
| 18-A | v1.1 |
| 18-B | v1.2 |
| 18-C | v2.1 |
| 18-D | v1.4 |

**Ajustes en la implementación (React + Tailwind):**

- Un único componente `FilaNotificacion` con el chevron a 16 px del borde derecho en todas las filas (#2).
- Estrella rellena para «Viaje completado» en ambos modos (#3).
- Encabezado de flujo con línea divisoria inferior en todas las variantes (#4).
- Leyenda de 30 días 24 px debajo de la lista (#5).
- La línea de asistencia puede ocupar dos líneas, con el icono alineado arriba (#6).
- Estado vacío: «Buscar viajes» para el pasajero y «Publicar viaje» para el conductor.

**Aprendizajes:**

- Duplicar 18-A para 18-C y 18-D funcionó a la primera en contenido. Lo que falló fue el ancho: antes de pedir dos textos en una fila, comprobar que caben en los 358 px útiles.
- Stitch no unifica la posición del chevron entre filas de distinta altura. Conviene resolverlo en el componente y no gastar pasadas en ello.
