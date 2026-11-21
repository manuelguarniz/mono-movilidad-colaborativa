# Prompt de diseño — P19 Historial

Prompt para generar el diseño de la pantalla 19 con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 19-A, y luego cada frame siguiente pegando de nuevo el contexto común.

Fuentes: README raíz (RF-09, RF-10 con el plazo de calificación de 24 horas, decisión del 2026-11-21, RN-22, RN-38, RN-40, RN-44, RN-47, RN-50, secciones 2.1, 2.3, 2.4 y 11), `app-utp-movilidad-colaborativa/src/styles/index.css` y las capturas aprobadas de P17 (v1.2, v2.1) y P21 (v1.1, v1.2) como referencia de estilo.

Sin referencia visual del usuario. Patrones que se toman de apps de movilidad y de historial de pedidos en producción, no su marca:

- **Lista cronológica de tarjetas compactas**, la más reciente primero, con la fecha como dato principal de cada tarjeta (no la hora grande de Mis viajes: aquí lo importante es cuándo fue).
- **Pestañas de rol** «Como pasajero» / «Como conductor» (RF-09). Son un filtro del historial, no un cambio de modo (RN-48): se aclara en el prompt para que Stitch no las convierta en un selector de modo.
- **La acción pendiente destaca:** «Calificar» es el único botón de la tarjeta, con el plazo visible. Lo ya calificado se muestra con estrellas, sin botón.
- **Lo cancelado o perdido va atenuado** y explica qué pasó con los créditos (reembolso o pago al conductor), para que el usuario entienda el movimiento que ve en la Billetera.

Datos de ejemplo encadenados con P17 y P21: «Hoy» es jue 29 oct 2026 y el historial se mira por la noche, después de los viajes de hoy. El viaje de Hoy 14:20 es el de 17-A/17-H (Lucía, 2 plazas, 12 créditos; terminó a las 14:50) y 17-E (Jorge P. no se presentó). El de Hoy 13:35 de Carlos terminó a las 14:06 (cobros de 21-A). Lucía R. canceló una reserva el 12 oct y no se presentó el 20 oct: son las «2 de 5 cancelaciones este mes» de 17-C. El cobro del lun 26 oct (+12, Lucía R.) y los de hoy (+9 Mateo R., +9 Sofía A.) son los de 21-A. El reembolso de ayer (+8, Huanchaco) es el de 17-A y 21-B.

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
- Verde para estados positivos y abonos: texto #1B7F3B sobre fondo #E6F4EA.
- Tipografía Inter. Etiquetas de sección en mayúsculas pequeñas con tracking
  (ej. "OCTUBRE 2026"), títulos 28px semibold, cifras con números tabulares.
- Iconos de línea (Material Symbols Outlined), estrellas de calificación en ámbar.
- Avatares de personas: círculos grises #EEEEEE con las iniciales en #5B403D, sin fotos.
- Encabezado: menú hamburguesa a la izquierda, logotipo "ColaboraCar" en rojo #BD0016
  bold centrado (solo el texto, sin punto ni adornos), campana de notificaciones con punto
  rojo y avatar con las iniciales del usuario a la derecha.
- Barra de navegación inferior blanca, fija abajo a todo el ancho, con 5 pestañas: Viajes,
  Mis viajes, Historial, Billetera, Perfil. La pestaña activa es una píldora roja #BD0016
  con icono y texto blancos. En esta pantalla la activa es "Historial".
- Debajo del encabezado: eyebrow "VIAJES TERMINADOS" y título "Historial".

Reglas que el diseño debe reflejar:
- Cada viaje tiene una sola hora de salida (no rango) y lleva un chip con la sede
  (ej. "Sede Trujillo").
- Precio por plaza entre 1 y 10 créditos. Los créditos son enteros.
- El historial solo muestra viajes terminados. Estados con chip de color y estas etiquetas
  exactas: Completado / Completada (gris), Cancelado / Cancelada por ti /
  Cancelado por el conductor / Cancelado: no se inició (rojo suave), No te presentaste (ámbar).
  Nunca "Publicado", "Confirmada", "En curso" ni "En viaje".
- Debajo del título, dos pestañas segmentadas a todo el ancho: "Como pasajero" y
  "Como conductor". Son un filtro del historial por rol, no cambian el modo de la app.
  No agregues un chip ni un selector de "Modo pasajero / Modo conductor".
- Solo los viajes completados se califican, durante 24 horas desde que terminó el viaje.
  La calificación no se edita: si ya se dio, se muestra con estrellas y sin botón.
- La necesidad de asistencia de movilidad de un pasajero nunca aparece en el historial.
- Nada de "ShareCar", "A/C activo", "Conductor frecuente", "Puntualidad", chat, mapa,
  botón de emergencia, seguimiento en vivo, "Repetir viaje", "Reservar de nuevo",
  filtros por fecha, buscador, gráficos ni estadísticas, ni correos que no sean @utp.edu.pe.
- Textos en UTF-8: tildes, ñ, "·", "•", "★" y "→" deben verse correctos (ej. "Huanchaco", "Víctor Larco").
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 19-A — Historial, pestaña «Como pasajero»

```text
Usuaria Lucía R. (avatar "LR"). Pestaña activa "Como pasajero" (fondo blanco con sombra
dentro de un riel gris #EEEEEE, texto #1B1B1B; la inactiva en #5F5E5E).

Lista de tarjetas compactas, la más reciente primero, agrupadas con subtítulos en mayúsculas
pequeñas "OCTUBRE 2026". Cada tarjeta tiene, en este orden:
fila superior con la fecha y hora de salida en 16px semibold a la izquierda y el chip de
estado a la derecha; la ruta en una línea con "→" (texto completo, hasta dos líneas, sin
puntos suspensivos); el conductor con avatar de iniciales, nombre y ★; una fila inferior
con el resultado de los créditos y la acción o calificación.

1. "Hoy, 29 oct · 14:20" · chip gris "Completada" · chip "Sede Trujillo".
   Ruta: "Campus UTP Trujillo → Urb. El Golf, Víctor Larco".
   Conductor: avatar "CM", "Carlos M." ★ 4.9 · "Toyota Yaris blanco • ABC-123" · "2 plazas".
   Créditos: icono de moneda + "Pagaste 12 créditos".
   Acción: botón secundario rojo suave a todo el ancho de la tarjeta, "Calificar a Carlos M."
   con icono de estrella, y debajo en gris #5F5E5E "Puedes calificar hasta mañana, 14:50".

2. "Ayer, 28 oct · 18:00" · chip rojo suave "Cancelado por el conductor" · chip "Sede Trujillo".
   Ruta: "Campus UTP Trujillo → Huanchaco".
   Conductora: avatar "RT", "Rosa T." ★ 4.8 · "1 plaza".
   Créditos: icono de flecha circular verde + "Te devolvimos 8 créditos" en verde #1B7F3B.
   Tarjeta atenuada (contenido al 70 %).

3. "Lun 26 oct · 08:00" · chip gris "Completada" · chip "Sede Trujillo".
   Ruta: "Campus UTP Trujillo → Urb. El Golf, Víctor Larco".
   Conductor: avatar "CM", "Carlos M." ★ 4.9 · "Toyota Yaris blanco • ABC-123" · "2 plazas".
   Créditos: icono de moneda + "Pagaste 12 créditos".
   En gris, sin botón: "El plazo para calificar este viaje terminó".

4. "Jue 22 oct · 07:10" · chip gris "Completada" · chip "Sede Trujillo".
   Ruta: "Huanchaco → Campus UTP Trujillo".
   Conductora: avatar "RT", "Rosa T." ★ 4.8 · "Kia Rio gris • D4K-512" · "1 plaza".
   Créditos: icono de moneda + "Pagaste 4 créditos".
   Calificación ya dada, sin botón: "Tu calificación" + cinco estrellas ámbar llenas.

5. "Mar 20 oct · 07:00" · chip ámbar "No te presentaste" · chip "Sede Trujillo".
   Ruta: "Urb. El Golf, Víctor Larco → Campus UTP Trujillo".
   Conductor: avatar "CM", "Carlos M." ★ 4.9 · "1 plaza".
   Créditos: "Se pagaron 6 créditos al conductor" en #5F5E5E.
   Tarjeta atenuada, sin botón de calificar.

6. "Jue 15 oct · 18:30" · chip gris "Completada" · chip "Sede Trujillo".
   Ruta: "Campus UTP Trujillo → Urb. El Golf, Víctor Larco".
   Conductor: avatar "CM", "Carlos M." ★ 4.9 · "1 plaza".
   Créditos: icono de moneda + "Pagaste 6 créditos".
   En gris, sin botón: "El plazo para calificar este viaje terminó".

7. "Lun 12 oct · 13:00" · chip rojo suave "Cancelada por ti" · chip "Sede Trujillo".
   Ruta: "Campus UTP Trujillo → Urb. El Golf, Víctor Larco".
   Conductor: avatar "CM", "Carlos M." ★ 4.9 · "1 plaza".
   Créditos: icono de flecha circular verde + "Te devolvimos 6 créditos" en verde.
   Tarjeta atenuada.

Al final de la lista, botón de texto rojo centrado "Ver más viajes".
```

## Frame 19-B — Historial, pestaña «Como conductor»

```text
Usuario Carlos M. (avatar "CM"). Pestaña activa "Como conductor" (mismo estilo de pestañas:
riel gris #EEEEEE, activa blanca con sombra). Mismas tarjetas compactas que la vista de
pasajero, pero en lugar del conductor cada tarjeta muestra a los pasajeros que subieron
(avatares de iniciales superpuestos + nombres) y "Cobraste N créditos".

Subtítulo "OCTUBRE 2026" y, en orden:

1. "Hoy, 29 oct · 14:20" · chip gris "Completado" · chip "Sede Trujillo".
   Ruta: "Campus UTP Trujillo → Urb. El Golf, Víctor Larco".
   Pasajeros que subieron (1): avatar "LR", "Lucía R. · 2 plazas".
   Línea gris debajo: "1 pasajero no se presentó" (sin nombre ni icono de accesibilidad).
   Créditos: "+18 créditos cobrados" en verde.
   Acción: botón secundario rojo suave a todo el ancho "Calificar pasajeros (1)" con icono de
   estrella, y debajo en gris "Puedes calificar hasta mañana, 14:50".

2. "Hoy, 29 oct · 13:35" · chip gris "Completado" · chip "Sede Trujillo".
   Ruta: "Urb. California → Campus UTP Trujillo".
   Pasajeros que subieron (2): avatares "MR" y "SA", "Mateo R. · Sofía A.".
   Créditos: icono de moneda + "Cobraste 18 créditos" en verde #1B7F3B con "+".
   Acción: botón secundario rojo suave a todo el ancho "Calificar pasajeros (2)" con icono de
   estrella, y debajo en gris "Puedes calificar hasta mañana, 14:06".

3. "Lun 26 oct · 08:00" · chip gris "Completado" · chip "Sede Trujillo".
   Ruta: "Campus UTP Trujillo → Urb. El Golf, Víctor Larco".
   Pasajeros que subieron (1): avatar "LR", "Lucía R. · 2 plazas".
   Créditos: "+12 créditos cobrados" en verde.
   Calificación ya dada, sin botón: "Calificaste a Lucía R." + cinco estrellas ámbar.

4. "Sáb 24 oct · 09:00" · chip rojo suave "Cancelado" · chip "Sede Trujillo".
   Ruta: "Urb. El Golf, Víctor Larco → Campus UTP Trujillo".
   Texto: "Cancelaste este viaje. Devolvimos los créditos de 2 reservas."
   Créditos: "0 créditos cobrados" en #5F5E5E. Tarjeta atenuada.

5. "Mié 21 oct · 07:00" · chip rojo suave "Cancelado: no se inició" · chip "Sede Trujillo".
   Ruta: "Urb. El Golf, Víctor Larco → Campus UTP Trujillo".
   Texto: "No iniciaste el viaje a tiempo. Devolvimos los créditos de 1 reserva."
   Créditos: "0 créditos cobrados". Tarjeta atenuada.

6. "Mar 20 oct · 07:00" · chip gris "Completado" · chip "Sede Trujillo".
   Ruta: "Urb. El Golf, Víctor Larco → Campus UTP Trujillo".
   Pasajeros que subieron (2): avatares "DC" y "AV", "Diego C. · Ana V.".
   Línea gris debajo: "1 pasajero no se presentó" (sin nombre ni icono de accesibilidad).
   Créditos: "+18 créditos cobrados" en verde.
   Calificación ya dada: "Calificaste a 2 de 2 pasajeros" con una estrella ámbar.

Al final, botón de texto rojo centrado "Ver más viajes".
```

## Frame 19-C — Estado vacío (pestaña «Como conductor» de una pasajera)

```text
Usuaria Lucía R. (avatar "LR"). Mismo encabezado, título, pestañas y barra inferior.
Pestaña activa "Como conductor".

En el centro, ilustración lineal sencilla de un auto con una ruta punteada en rojo suave
#FFDAD7 que termina en una bandera, el texto "Aún no tienes viajes terminados" (18px semibold)
y el texto de apoyo en #5F5E5E: "Cuando completes un viaje como conductor, aparecerá aquí."
Sin botones. No agregues "Publicar un viaje" ni un selector de modo.
```

---

## Supuestos a validar

Confirmados por el usuario el 2026-11-21 («el resto está bien lo que se asume»), salvo el plazo de calificación, que cambió a 24 horas desde el fin del viaje (sección 12.1).

- **Pestaña inicial.** Se abre en la pestaña del modo actual del perfil (RF-14): «Como pasajero» si está en modo pasajero, «Como conductor» si está en modo conductor. El usuario puede ver la otra pestaña sin cambiar de modo.
- **Sin chip de modo.** A diferencia de P17 y P21, la pantalla no lleva el chip «Modo pasajero / Modo conductor»: las pestañas de RF-09 ya dicen qué rol se ve, y los dos controles juntos confundirían.
- **Ambas pestañas siempre visibles,** aunque el usuario nunca haya tenido vehículo. La vacía muestra el mensaje de RF-09 (19-C).
- **Agrupación por mes** («OCTUBRE 2026»): RF-09 no la pide; ayuda a leer un historial sin límite de antigüedad (RN-50).
- **Paginación** con «Ver más viajes» (20 por página, RF-09), igual que «Ver más movimientos» en P21.
- **Textos de créditos** («Te devolvimos N créditos», «Pagaste N créditos», «Se pagaron N créditos al conductor», «Cobraste N créditos»): el README pide el dato (RF-09) pero no el texto.
- **Viaje del conductor completado sin pasajeros** (nadie subió): cobra 0 y no hay a quién calificar. Se muestra «Nadie subió a este viaje · 0 créditos cobrados» sin botón. Queda para la implementación.
- **«Calificar pasajeros (N)»** abre P20 con los pasajeros `COMPLETADA` aún sin calificar; si califica a algunos, la tarjeta pasa a «Calificaste a 1 de 2 pasajeros» con el botón todavía activo hasta el plazo.
- **El ausente se cuenta sin nombre** en la tarjeta del conductor («1 pasajero no se presentó»): RF-09 pide «pasajeros que subieron». A confirmar si se quiere el nombre.
- **¿Tocar la tarjeta abre algo?** El README no define un detalle del viaje terminado. Se propone que la tarjeta no sea tocable y solo «Calificar» lleve a P20.

---

## Bitácora

| Captura | Frame | Prompt                              | Resultado                                                       |
| ------- | ----- | ----------------------------------- | --------------------------------------------------------------- |
| v1.1    | 19-A  | Contexto común + 19-A              | ✅ (prompt con plazo de 7 días; se corrige por la regla nueva) |
| v2.1 | 19-A | Corrección de v1.1 (plazo de 24 h) | ❌ falta la tarjeta de hoy (hueco en blanco); exportada a 325 px |
| v2.2 | 19-B | Contexto común + 19-B | ✅ |
| v2.3 | 19-C | Contexto común + 19-C | ✅ |
| v3.1 | 19-A | Corrección de v2.1 (duplicar tarjeta) | ✅ |

### Decisiones de flujo

_(Confirmadas el 2026-11-21.)_

- **Entrada:** pestaña «Historial» de la barra inferior y notificación «Viaje completado» (RF-13) cuando se elige ver el historial.
- **«Calificar a …» / «Calificar pasajeros (N)»** abre P20 Calificar con ese viaje. Al volver, la tarjeta muestra la calificación dada. Afecta a P20.
- **Plazo vencido con la pantalla abierta:** si el usuario toca «Calificar» después de las 24 horas, P20 muestra «El plazo para calificar este viaje terminó» (RF-10) y al volver la tarjeta muestra ese texto sin botón.
- **Error del servidor al cargar:** franja rojo suave sobre la lista con el mensaje de la API y el botón «Reintentar».

### Revisión de v1.1

**Formato:** 788 × 3854 px, móvil a 2×.

**Lo que funciona:** formato móvil correcto, logotipo sin punto, avatar «LR», eyebrow y título, pestañas segmentadas sin chip ni selector de modo, subtítulo «OCTUBRE 2026», las 6 tarjetas con los datos, chips y etiquetas exactas de la sección 2.3, tarjetas atenuadas para cancelados y ausencia, reembolsos en verde, «Tu calificación» con estrellas, el texto de plazo vencido, «Ver más viajes» y la barra inferior con «Historial» activo. Avatares con iniciales, sin imágenes rotas. Tildes y símbolos bien.

**Cambio de regla (usuario, 2026-11-21):** se califica durante 24 horas desde `fecha_fin` (`dias_para_calificar` = 1). Primero se planteó «solo el mismo día, hasta las 23:59» y se cambió a 24 h. Se actualizó el README raíz (RF-10, criterio de aceptación, RN-47, colección `app`, secuencia 8.4 y sección 12.1). La tarjeta del lun 26 oct ya no puede tener «Calificar», y hace falta un viaje de hoy para mostrar el botón.

**Pendiente:**

| # | Problema                                                                                                                                   | Frame | Severidad | Veces |
| - | ------------------------------------------------------------------------------------------------------------------------------------------ | ----- | --------- | ----- |
| 1 | «Calificar a Carlos M.» con «Puedes calificar hasta el lun 2 nov» en un viaje de hace 3 días: con la regla nueva el plazo ya venció. | 19-A  | Alta      | 1.ª  |
| 2 | Falta un viaje completado hoy que muestre «Calificar» con «Puedes calificar hasta mañana, 14:50».                                     | 19-A  | Alta      | 1.ª  |
| 3 | «Ayer, mié 28 oct · 18:00» se parte en dos líneas por el chip largo.                                                                  | 19-A  | Baja      | 1.ª  |

**Prompt de corrección** (seleccionar v1.1 en Stitch; guardar como `v2.1.png`):

```text
Edita solo esta pantalla y mantén todo lo demás igual (pestañas, estilo de tarjetas, chips, botones y barra inferior):
1. Agrega una tarjeta nueva al principio de la lista, justo debajo de "OCTUBRE 2026", copiando exactamente el estilo de la tarjeta "Lun 26 oct · 08:00" (no atenuada):
   - Fila superior: "Hoy, 29 oct · 14:20" y chip gris "Completada".
   - Chip "Sede Trujillo". Ruta: "Campus UTP Trujillo → Urb. El Golf, Víctor Larco".
   - Conductor: avatar "CM", "Carlos M." ★ 4.9, "Toyota Yaris blanco • ABC-123", "2 plazas".
   - Icono de moneda + "Pagaste 12 créditos".
   - Botón secundario rojo suave a todo el ancho "Calificar a Carlos M." con icono de estrella, y debajo en gris #5F5E5E: "Puedes calificar hasta mañana, 14:50".
2. En la tarjeta del cancelado por el conductor, cambia la fecha a "Ayer, 28 oct · 18:00" en una sola línea.
3. En la tarjeta "Lun 26 oct · 08:00", elimina el botón "Calificar a Carlos M." y el texto "Puedes calificar hasta el lun 2 nov". En su lugar, debajo de una línea divisoria, el texto gris en cursiva "El plazo para calificar este viaje terminó", igual al de la tarjeta "Jue 15 oct · 18:30".
No agregues otras tarjetas ni cambies las demás. Solo una tarjeta de la lista lleva el botón "Calificar".
```

### Revisión de v2.1 a v2.3 (ronda 2)

**Formato:** v2.1 mide 325 × 1600 px, por debajo de los 390 px del diseño (exportación reducida o captura del lienzo). Con ese ancho «1 plaza» se parte en dos líneas, cosa que no pasaba en v1.1. v2.2 y v2.3 miden 788 px (móvil a 2×). Conviene exportar v3.1 a 2×.

**Corregido respecto a v1.1:**

- #1 (v2.1): la tarjeta del lun 26 oct ya no tiene «Calificar» y muestra «El plazo para calificar este viaje terminó».
- #3 (v2.1): «Ayer, 28 oct · 18:00» cabe en una línea.

**Lo que funciona:**

- **19-B (v2.2):** cumple el prompt completo. Avatar «CM», pestaña «Como conductor», los dos viajes de hoy en orden (14:20 y 13:35) con «Calificar pasajeros (1)» y «(2)» y sus plazos («hasta mañana, 14:50» y «14:06»), «Calificaste a Lucía R.» con estrellas, «Cancelado» y «Cancelado: no se inició» atenuados con «0 créditos cobrados», «1 pasajero no se presentó» sin nombre ni dato de movilidad (RN-22), cobros en verde y «Ver más viajes».
- **19-C (v2.3):** estado vacío con el texto de RF-09, sin botones ni selector de modo, pestaña «Como conductor» activa.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 2 | Falta la tarjeta «Hoy, 29 oct · 14:20» con «Calificar a Carlos M.»: en su lugar quedó un hueco en blanco de ~280 px bajo «OCTUBRE 2026». | 19-A | Alta | 2.ª |
| 4 | Exportación a 325 px de ancho: «1 plaza» se parte en dos líneas. | 19-A | Baja | 1.ª |
| 5 | Los avatares superpuestos recortan las iniciales del primero («MR» se lee «MF»). | 19-B | Baja | 1.ª |

El #5 pasa a la implementación (superposición de 8 px como máximo, o avatares sin superponer).

**Prompt de corrección** (seleccionar v2.1 en Stitch; guardar como `v3.1.png`, exportada a 2×). Como Stitch no generó la tarjeta descrita, se le pide duplicar una tarjeta que ya está bien:

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. Elimina el espacio vacío entre "OCTUBRE 2026" y la tarjeta "Ayer, 28 oct · 18:00".
2. Duplica la tarjeta completa "Lun 26 oct · 08:00" y coloca la copia justo debajo de "OCTUBRE 2026", como primera tarjeta de la lista. En la copia cambia solo esto:
   a. Fecha: "Hoy, 29 oct · 14:20".
   b. Reemplaza el texto en cursiva "El plazo para calificar este viaje terminó" por un botón secundario a todo el ancho de la tarjeta, alto 44px, fondo #FFDAD7, texto #BD0016, radio 12px, con icono de estrella y el texto "Calificar a Carlos M.". Debajo del botón, centrado y en gris #5F5E5E 13px: "Puedes calificar hasta mañana, 14:50".
3. En todas las tarjetas, "1 plaza" y "2 plazas" van en una sola línea, alineados a la derecha.
4. La pantalla mide 390 px de ancho.
No cambies la tarjeta original "Lun 26 oct · 08:00" ni las demás tarjetas. Solo la primera tarjeta lleva el botón "Calificar".
```

### Revisión de v3.1 (ronda 3)

**Formato:** 788 × 4329 px, móvil a 2×.

**Corregido:** #2: la tarjeta «Hoy, 29 oct · 14:20» aparece primera, con «Calificar a Carlos M.» y «Puedes calificar hasta mañana, 14:50», y ya no está el hueco en blanco. #4: «1 plaza» y «2 plazas» caben en una línea. Las demás tarjetas siguen igual que en v1.1.

**Pendiente (tolerable, pasa a la implementación):**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 5 | Los avatares superpuestos recortan las iniciales del primero («MR» se lee «MF»). | 19-B | Baja | 1.ª |
| 6 | En la tarjeta del lun 26 oct la línea divisoria queda pegada a la ruta. | 19-A | Baja | 1.ª |

### Decisión

Se aprueba el 2026-11-21. Capturas finales: 19-A → v3.1, 19-B → v2.2, 19-C → v2.3.

Ajustes a resolver en la implementación (React + Tailwind):

1. Avatares superpuestos con 8 px de superposición como máximo, o sin superponer, para que se lean las iniciales (#5).
2. Espaciado uniforme entre la ruta y la línea divisoria en todas las tarjetas (#6).
3. El plazo para calificar se calcula con `fecha_fin + dias_para_calificar` (1 día = 24 h) y se muestra como «Puedes calificar hasta hoy, HH:MM» o «hasta mañana, HH:MM». Vencido: «El plazo para calificar este viaje terminó», sin botón.
4. Conductor con calificaciones parciales: «Calificaste a 1 de 2 pasajeros» y el botón «Calificar pasajeros (N)» con los que faltan, mientras siga en plazo.
5. Viaje del conductor completado sin pasajeros: «Nadie subió a este viaje · 0 créditos cobrados», sin botón.
6. 19-C para un pasajero sin viajes: el mismo estado vacío en la pestaña «Como pasajero», con el texto de apoyo «Cuando completes un viaje como pasajero, aparecerá aquí.».
7. La pestaña inicial es la del modo actual del perfil. La tarjeta no se puede tocar: solo «Calificar» lleva a P20.
8. Error al cargar: franja rojo suave con el mensaje de la API y «Reintentar».

**Aprendizaje para las siguientes pantallas:**

- Si Stitch deja un hueco en lugar de una tarjeta nueva descrita en una corrección, pedirle que **duplique una tarjeta correcta** y cambie solo lo propio funcionó a la primera.
- Revisar el ancho de cada exportación: a 325 px aparecieron saltos de línea que no existen a 390 px.
- Fijar en el prompt la hora de fin de cada viaje de ejemplo permite escribir plazos coherentes («hasta mañana, 14:50») sin contradecir P17 y P21.
