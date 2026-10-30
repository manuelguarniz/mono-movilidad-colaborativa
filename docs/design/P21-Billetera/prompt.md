# Prompt de diseño — P21 Billetera

Prompt para generar el diseño de la pantalla 21 y sus modales con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 21-A, y luego cada frame siguiente pegando de nuevo el contexto común.

Fuentes: README raíz (RF-11, RF-12, RN-39, RN-40, RN-41, RN-42, sección 1.2 «1 sol = 1 crédito», sección 2.3 para los estados del retiro, sección 5.1 para los tipos de movimiento, secuencia 9.2 y sección 12), `app-utp-movilidad-colaborativa/src/styles/index.css` y las capturas aprobadas de P17 y el frame P14 como referencia de estilo.

Sin referencia visual del usuario. Se toman patrones probados en billeteras móviles en producción (bancos digitales y billeteras de pago de Latinoamérica), no la marca ni los colores de ninguna:

- **El saldo es el protagonista:** una tarjeta arriba con el disponible en grande y el desglose debajo (retenido y retirable), para que el usuario no confunda lo que puede gastar con lo que está comprometido.
- **Dos acciones rápidas** junto al saldo («Recargar» y «Retirar»), no enterradas en un menú.
- **Movimientos agrupados por día** («Hoy», «Ayer», «27 oct»), cada uno con un icono por tipo en un círculo, título, descripción y monto con signo. Los abonos van en verde y los cargos en el color del texto, nunca en rojo: en esta app el rojo es la marca y el de error.
- **Lo pendiente se ve arriba:** un retiro «En proceso» se muestra en una franja sobre los movimientos, no solo como una fila más.
- **La recarga en pasos numerados** (elegir monto → yapear → escribir el código), porque es una secuencia real. El monto se elige con chips de montos frecuentes más «Otro».
- **El retiro con «Retirar todo»**, que llena el monto con el saldo retirable.
- **Una confirmación de éxito con el nuevo saldo**, no solo un toast.

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
  (ej. "MOVIMIENTOS"), títulos 28px semibold, cifras con números tabulares.
- Iconos de línea (Material Symbols Outlined).
- Encabezado: menú hamburguesa a la izquierda, logotipo "ColaboraCar" en rojo #BD0016
  bold centrado (solo el texto, sin punto ni adornos), campana de notificaciones con punto
  rojo y avatar con las iniciales del usuario a la derecha.
- Barra de navegación inferior blanca, fija abajo a todo el ancho, con 5 pestañas: Viajes,
  Mis viajes, Historial, Billetera, Perfil. La pestaña activa es una píldora roja #BD0016
  con icono y texto blancos. En esta pantalla la activa es "Billetera".
- Debajo del encabezado: eyebrow "CRÉDITOS" y título "Billetera".

Reglas que el diseño debe reflejar:
- 1 crédito = S/ 1. Los créditos son enteros, sin decimales. El símbolo "S/" solo aparece
  en el monto que se yapea al recargar; todo lo demás va en créditos.
- Saldos: "Disponible" (lo que se puede gastar), "Retenido" (créditos de reservas activas,
  se cobran al terminar el viaje) y, solo en modo conductor, "Retirable" (lo ganado como
  conductor que se puede pasar a Yape).
- Movimientos del más reciente al más antiguo, agrupados por día, con estos títulos por tipo:
  "Recarga con Yape" (+), "Reserva de viaje" (−), "Reembolso" (+), "Cobro de viaje" (+),
  "Retiro a Yape" (−), "Retiro devuelto" (+). Abonos en verde #1B7F3B, cargos en #1B1B1B.
- Estados del retiro con chip: "En proceso" (ámbar), "Pagado" (verde), "Rechazado" (rojo suave).
- El único medio de recarga y retiro es Yape. La recarga es simulada.
- El modo (pasajero o conductor) se indica con un chip de solo lectura junto al título
  ("Modo pasajero" o "Modo conductor"). No agregues un selector para cambiar de modo.
- Nada de "ShareCar", tarjetas de crédito o débito, transferencias bancarias, otras
  billeteras, enviar créditos a otro usuario, intereses, cashback, gráficos de gastos,
  chat ni correos que no sean @utp.edu.pe.
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 21-A — Billetera, modo conductor

```text
Modo conductor (usuario Carlos M., avatar "CM"). Junto al título, chip de solo lectura "Modo conductor".

1. Tarjeta de saldo (la única tarjeta destacada de la pantalla, blanca con borde #E1E1E1):
   - Etiqueta "SALDO DISPONIBLE" y debajo, en grande (40px bold, números tabulares),
     icono de moneda dorada + "96" + "créditos" en tamaño menor.
   - Debajo, una fila dividida en dos bloques grises #EEEEEE:
     "Retenido" → "0 créditos" · "Retirable" → "78 créditos" (con icono de información).
   - Dos botones de igual ancho: primario rojo "Recargar" (icono +) y secundario rojo suave
     "Retirar" (icono de flecha hacia arriba).
2. Sección "MOVIMIENTOS", agrupada por día con subtítulos grises:
   - "Hoy":
     · Icono de auto en círculo verde suave. "Cobro de viaje" · "Mateo R. · Urb. California → Campus UTP Trujillo" · 14:06 · "+9" en verde.
     · Icono de auto en círculo verde suave. "Cobro de viaje" · "Sofía A. · Urb. California → Campus UTP Trujillo" · 14:06 · "+9" en verde.
   - "Ayer":
     · Icono de flecha hacia arriba en círculo gris. "Retiro a Yape" · "Celular •••• 321" · chip verde "Pagado" · 18:40 · "−50".
   - "26 oct":
     · Icono de Yape genérico (billetera) en círculo rojo suave. "Recarga con Yape" · "Operación 08451236" · 09:12 · "+20" en verde.
     · Icono de auto en círculo verde suave. "Cobro de viaje" · "Lucía R. · Campus UTP Trujillo → Urb. El Golf" · 08:15 · "+12" en verde.
   - Al final, botón de texto "Ver más movimientos".
```

## Frame 21-B — Billetera, modo pasajero

```text
Modo pasajero (usuaria Lucía R., avatar "LR"). Junto al título, chip de solo lectura "Modo pasajero".

1. Tarjeta de saldo igual a la del frame 21-A, pero:
   - Saldo disponible "38 créditos".
   - Un solo bloque gris: "Retenido" → "12 créditos" con la nota
     "En tu reserva de hoy, 14:20. Se cobra al terminar el viaje."
   - Un solo botón primario rojo a todo el ancho: "Recargar". Sin "Retirar" ni "Retirable".
2. Sección "MOVIMIENTOS":
   - "Hoy": icono de asiento en círculo gris. "Reserva de viaje" · "Campus UTP Trujillo → Urb. El Golf · 2 plazas" · 13:15 · "−12".
   - "Ayer": icono de flecha circular en círculo verde suave. "Reembolso" · "Cancelado por el conductor · Campus UTP Trujillo → Huanchaco" · 16:02 · "+8" en verde.
   - "Ayer": icono de asiento en círculo gris. "Reserva de viaje" · "Campus UTP Trujillo → Huanchaco · 1 plaza" · 10:30 · "−8".
   - "25 oct": icono de billetera en círculo rojo suave. "Recarga con Yape" · "Operación 77310452" · 19:48 · "+50" en verde.
```

## Frame 21-C — Modal: recargar créditos

```text
Sobre el frame 21-B atenuado, una hoja inferior (bottom sheet) blanca alta con radio superior 24px
y tirador gris arriba. Título "Recargar créditos" y una "X" para cerrar.

1. Franja ámbar suave a todo el ancho, con icono de información:
   "Modo de prueba: el código no se verifica con Yape".
2. Paso "1. Elige el monto": chips grandes en una fila "S/ 10", "S/ 20" (seleccionado,
   fondo rojo suave #FFDAD7, borde #BD0016), "S/ 50" y "Otro". Debajo, en gris:
   "Recibirás 20 créditos. Mínimo S/ 5, máximo S/ 200."
3. Paso "2. Yapea": bloque gris con el texto
   "Yapea S/ 20 y escribe el código de operación que te muestra Yape".
4. Paso "3. Código de operación": campo de texto numérico con placeholder "Ej. 08451236"
   y ayuda "De 6 a 12 dígitos".
5. Botón primario rojo a todo el ancho "Recargar 20 créditos".
```

## Frame 21-D — Recarga exitosa

```text
Sobre el frame 21-B atenuado, bottom sheet:
- Icono circular verde suave con un check verde.
- Título "Recargaste 20 créditos".
- Bloque gris: "Nuevo saldo disponible" → "58 créditos" (con icono de moneda) y debajo
  "Operación 08451236 · Hoy, 13:40".
- Botón primario rojo "Listo".
```

## Frame 21-E — Modal: solicitar retiro (conductor)

```text
Sobre el frame 21-A atenuado, bottom sheet alto con título "Retirar a Yape" y una "X".

1. Bloque gris: "Puedes retirar" → "78 créditos" y debajo, en gris,
   "Solo lo que ganaste como conductor. 1 crédito = S/ 1."
2. Campo "Monto" con sufijo "créditos", valor "50", y a la derecha un botón de texto
   rojo "Retirar todo". Ayuda: "Mínimo 10 créditos".
3. Campo "Celular de Yape" con valor "987 654 321" y ayuda "9 dígitos, empieza con 9".
4. Nota con icono de reloj: "Descontamos los créditos ahora. Un operador te yapea
   y verás el retiro como «En proceso» hasta que se pague."
5. Botón primario rojo "Solicitar retiro de 50 créditos" y secundario gris "Cancelar".
```

## Frame 21-F — Billetera con retiro en proceso

```text
Duplica el frame 21-A y cambia solo lo siguiente:
1. Saldo disponible "46 créditos" y "Retirable" → "28 créditos".
2. Entre la tarjeta de saldo y "MOVIMIENTOS", una franja ámbar suave con icono de reloj:
   "Retiro en proceso · 50 créditos a Yape •••• 321" y debajo
   "Solicitado hoy, 14:30. Te avisaremos cuando se pague."
3. Botón "Retirar" deshabilitado (fondo #EEEEEE, texto #5F5E5E) y debajo de los botones,
   en gris: "Ya tienes un retiro pendiente".
4. En "Hoy", primera fila: icono de flecha hacia arriba en círculo gris.
   "Retiro a Yape" · "Celular •••• 321" · chip ámbar "En proceso" · 14:30 · "−50".
Mantén todo lo demás igual.
```

---

## Supuestos a validar

- **Títulos de los movimientos.** El README define los tipos (`RECARGA`, `RETENCION_RESERVA`, `REEMBOLSO`, `COBRO_VIAJE`, `RETIRO`, `REVERSION_RETIRO`), pero no la etiqueta en pantalla. Se proponen «Recarga con Yape», «Reserva de viaje», «Reembolso», «Cobro de viaje», «Retiro a Yape» y «Retiro devuelto».
- **«Retirar» solo en modo conductor.** RF-12 dice que lo pide un conductor. En modo pasajero no se muestran «Retirable» ni «Retirar», aunque el usuario tenga créditos ganados antes.
- **Celular de Yape precargado.** El perfil no guarda un celular. Se propone precargar el del último retiro y dejarlo editable.
- **Montos rápidos.** RF-11 nombra S/ 10, 20 y 50; se usa S/ 20 como seleccionado por defecto.
- **Verde para abonos.** El contexto común no tenía un verde de texto; se propone #1B7F3B sobre #E6F4EA, el mismo tono de los chips «En curso» de P17. Si se adopta, pasa a `index.css` y al contexto común.
- **Paginación.** RF-11 pide 20 movimientos por página; se propone el botón «Ver más movimientos» al final, en lugar de páginas numeradas.

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| — | 21-A | Contexto común + 21-A | No se guardó: salió en formato de escritorio y con otros datos (avatar «LR», «Modo pasajero», «12 créditos retenidos», movimientos de mayo, avisos inventados) |
| v1.1 | 21-A | Prompt de rehacer (abajo) | ✅ |
| v1.2 | 21-B | Contexto común + 21-B | ✅ |
| v1.3 | 21-C | Contexto común + 21-C | ✅ (fondo de 21-A en vez de 21-B) |
| v1.4 | 21-D | Contexto común + 21-D | ✅ (saldo de Lucía sobre fondo de Carlos) |
| v1.5 | 21-E | Contexto común + 21-E | ✅ |
| v1.6 | 21-F | Contexto común + 21-F | ✅ |

Prompt de rehacer que usó el usuario para la primera pasada de 21-A (2026-10-29):

```text
Rehaz esta pantalla de Billetera en formato de teléfono móvil vertical y con el
contenido exacto que indico abajo.

FORMATO
- Ancho total 390 px. Elimina el espacio vacío de ambos lados: el contenido ocupa
  el 100 % del ancho, con márgenes laterales de 16 px. Una sola columna, nada de
  diseño web o de escritorio.
- Encabezado y barra de navegación inferior a todo el ancho. La barra inferior va
  fija abajo, con "Billetera" activa como píldora roja #BD0016.

ENCABEZADO
- Avatar "CM" (Carlos M.), no "LR".
- Eyebrow "CRÉDITOS", título "Billetera" y, a la derecha, el chip de solo lectura
  "Modo conductor" con icono de volante o auto. Quita "Modo pasajero".

TARJETA DE SALDO (la única tarjeta destacada)
- Etiqueta "SALDO DISPONIBLE". Debajo: icono de moneda dorada + "96" (40 px bold,
  cifras tabulares) + "créditos" en tamaño menor.
- Quita "1 crédito = S/ 1" y el bloque de "12 créditos retenidos".
- Una fila con dos bloques grises #EEEEEE del mismo ancho:
  "Retenido" → "0 créditos" · "Retirable" → "78 créditos" (con icono de información).
- Dos botones del mismo ancho, uno al lado del otro: primario rojo #BD0016
  "Recargar" (icono +) y secundario rojo suave #FFDAD7 con texto #BD0016 "Retirar"
  (icono de flecha hacia arriba).
- Quita el texto "Recarga instantánea simulada" y el aviso de "Uso exclusivo".

MOVIMIENTOS (reemplaza todos los actuales; no hay movimientos de mayo)
Título "MOVIMIENTOS", agrupados por día con subtítulos grises:
- Hoy
  · Auto en círculo verde suave · "Cobro de viaje" · "Mateo R. · Urb. California →
    Campus UTP Trujillo" · 14:06 · "+9" en verde
  · Auto en círculo verde suave · "Cobro de viaje" · "Sofía A. · Urb. California →
    Campus UTP Trujillo" · 14:06 · "+9" en verde
- Ayer
  · Flecha hacia arriba en círculo gris · "Retiro a Yape" · "Celular •••• 321" ·
    chip verde "Pagado" · 18:40 · "−50" en texto oscuro
- 26 oct
  · Billetera en círculo rojo suave · "Recarga con Yape" · "Operación 08451236" ·
    09:12 · "+20" en verde
  · Auto en círculo verde suave · "Cobro de viaje" · "Lucía R. · Campus UTP Trujillo →
    Urb. El Golf" · 08:15 · "+12" en verde
- Al final, botón de texto rojo "Ver más movimientos".

Montos solo en créditos. Ningún monto en soles (S/). Mantén colores, tipografía
Inter e iconos de línea como en el resto de la app.
```

Sugerencias para este reintento: elegir el modo **App** (no Web) en Stitch antes de generar, si la versión tiene ese selector, y agregar «Logotipo "ColaboraCar" solo con el texto, sin punto rojo».

### Decisiones de flujo

Propuestas el 2026-10-29. El usuario siguió con todos los frames sin objetarlas: quedan **adoptadas sin objeción**, igual que los «Supuestos a validar».

- **Entrada:** pestaña «Billetera», el saldo del perfil (P13, P14) y el botón «Recargar» del error de saldo insuficiente al reservar (RN-39). Desde ese error, la billetera se abre con el modal 21-C ya abierto.
- **Tras recargar (21-D):** «Listo» cierra el modal y el movimiento aparece arriba en «Hoy». Si se llegó desde una reserva sin saldo, «Listo» vuelve a la confirmación de la reserva (P08 o P10).
- **Tras solicitar el retiro:** el modal se cierra, se muestra 21-F y un toast «Retiro solicitado».
- **Retiro pagado o rechazado:** llega como notificación (P18). Un rechazo agrega el movimiento «Retiro devuelto» (+) y el retiro original pasa a «Rechazado» con el motivo debajo.
- **Error del servidor:** el modal sigue abierto con el mensaje en una franja rojo suave sobre el botón.

### Mensajes de validación (para la implementación)

| Campo | Regla | Mensaje |
| --- | --- | --- |
| Monto de recarga | Entero entre 5 y 200 (RN-41) | «Elige un monto entre S/ 5 y S/ 200.» (nuevo) |
| Código de operación | Numérico, de 6 a 12 dígitos (RN-41) | «El código de operación tiene de 6 a 12 dígitos.» (nuevo) |
| Código de operación | No usado antes (RN-41) | «Este código de operación ya fue registrado» |
| Monto de retiro | Mínimo 10 (RN-42) | «El retiro mínimo es de 10 créditos.» (nuevo) |
| Monto de retiro | Hasta el saldo retirable (RN-42) | «Solo puedes retirar hasta N créditos (lo que ganaste como conductor)» |
| Retiro | Un solo retiro pendiente (RN-42) | «Ya tienes un retiro pendiente» |
| Celular de Yape | 9 dígitos y empieza con 9 (RN-42) | «Ingresa un celular de 9 dígitos que empiece con 9.» (nuevo) |

### Datos de ejemplo (coherentes con P17)

- **Carlos M. (conductor):** los dos «Cobro de viaje» de +9 de hoy son el viaje que finaliza en 17-F (Mateo R. y Sofía A., 18 créditos). Retirable = mín(96, 128 cobrados − 50 retirados) = 78. Tras retirar 50: disponible 46 y retirable mín(46, 128 − 100) = 28.
- **Lucía R. (pasajera):** los 12 retenidos son su reserva de 17-A (Hoy, 14:20, 2 plazas). El reembolso de +8 de ayer es el viaje «Cancelado por el conductor» de 17-A (Campus UTP Trujillo → Huanchaco).

### Revisión de v1.1 a v1.6 (ronda 1)

Mismo criterio que en P17: las capturas son una referencia de alta fidelidad, no un plano exacto.

**Lo que funciona:**

- **21-A (v1.1):** formato móvil, chip «Modo conductor», saldo protagonista con el desglose Retenido / Retirable, dos acciones del mismo ancho y movimientos por día con abonos en verde y el retiro «Pagado».
- **21-B (v1.2):** sin «Retirar» ni «Retirable», el retenido explica de qué reserva viene, y el reembolso de +8 es el viaje cancelado de 17-A.
- **21-C (v1.3):** leyenda literal «Modo de prueba: el código no se verifica con Yape», los tres pasos numerados, el texto literal de RF-11 («Yapea S/ 20 y escribe el código de operación que te muestra Yape») y el botón con el monto.
- **21-D (v1.4):** confirmación con el nuevo saldo y el número de operación.
- **21-E (v1.5):** saldo retirable visible, «Retirar todo», ayudas de validación de RN-42 y la nota de que el descuento es inmediato.
- **21-F (v1.6):** los números cuadran (46 disponibles y 28 retirables), «Retirar» deshabilitado con el literal «Ya tienes un retiro pendiente», franja «Retiro en proceso» y la fila con el chip ámbar.

**Pendiente (todo Baja, pasa a la implementación):**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 1 | El fondo de 21-C y 21-D es la billetera de Carlos (96 créditos), pero el modal es de Lucía (nuevo saldo 58 = 38 + 20). | 21-C, 21-D | Baja | 1.ª |
| 2 | Las descripciones largas se cortan a mitad de palabra («Campus UTP Tr»). | 21-A, 21-F | Baja | 1.ª |
| 3 | «1 crédito = S/ 1.» parte la línea entre «S/» y «1.», y la etiqueta «Monto» queda pegada al bloque gris. | 21-E | Baja | 1.ª |
| 4 | Bandas negras con ruido a los lados del fondo de los modales. | 21-C, 21-D, 21-E | Baja | 1.ª |

### Decisión

Se aprueba el 2026-10-29 en la primera ronda. Capturas finales: 21-A → v1.1, 21-B → v1.2, 21-C → v1.3, 21-D → v1.4, 21-E → v1.5, 21-F → v1.6.

Ajustes a resolver en la implementación (React + Tailwind):

1. Los modales se abren sobre la billetera del usuario que recarga o retira, con un velo negro al 40 % a todo el ancho (#1, #4).
2. Descripción de los movimientos en una línea con puntos suspensivos al final (`truncate`), y el monto siempre visible (#2).
3. «S/ 1» sin salto de línea (espacio no separable) y separación de 16 px entre el bloque «Puedes retirar» y el campo «Monto» (#3).
4. Retiro rechazado: chip «Rechazado» con el motivo debajo, y la fila «Retiro devuelto» (+) en verde (RF-12). No se diseñó.
5. Errores de los formularios con los mensajes de la tabla «Mensajes de validación», debajo de cada campo.
6. El verde de los abonos (#1B7F3B sobre #E6F4EA) se agrega a `index.css` como token.

**Aprendizaje para las siguientes pantallas:**

- Elegir el modo App en Stitch y fijar en el prompt todos los datos (usuario, avatar, montos, fechas) evitó la ronda de corrección: los 6 frames salieron bien a la primera tras rehacer 21-A.
- Para los modales, indicar sobre qué frame van (y con qué usuario) no basta: Stitch toma el último que generó. Si importa, adjuntar la captura correcta.
