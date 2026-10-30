# Prompt de diseño — P17 Mis viajes

Prompt para generar el diseño de la pantalla 17 y sus modales con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 17-A, y luego cada frame siguiente pegando de nuevo el contexto común.

Fuentes: README raíz (RF-06, RF-07, RN-22, RN-25, RN-26, RN-30, RN-43, RN-45, RN-46 y sección 11), `app-utp-movilidad-colaborativa/src/styles/index.css` y los frames P06 y P14.

---

## Contexto común (pegar en cada pasada)

```text
Diseña una pantalla de app móvil (WebView, 390 × 844, sin marco de teléfono) para ColaboraCar,
la app de viajes compartidos de la comunidad de la Universidad Tecnológica del Perú (UTP).
Idioma: español de Perú. Moneda: "créditos" (icono de moneda dorada), nunca soles.

Sistema visual (respetar exactamente, es el de las pantallas ya diseñadas):
- Fondo de pantalla #F9F9F9. Tarjetas blancas, borde 1px #E1E1E1, radio 16px, sombra muy suave.
- Rojo de marca #BD0016 (botón primario sólido, texto blanco, radio 12px, alto 52px).
  Hover/pressed #A30013. Rojo acento #E6212A para puntos e indicadores.
- Rojo suave #FFDAD7 con texto #BD0016 para botones secundarios y chips activos;
  borde suave #E5BEBB para chips contorneados.
- Superficie gris #EEEEEE para bloques internos (como el bloque "Salida" del dashboard).
- Texto principal #1B1B1B, secundario marrón #5B403D, apagado #5F5E5E.
- Tipografía Inter. Etiquetas de sección en mayúsculas pequeñas con tracking
  (ej. "PRÓXIMO VIAJE"), títulos 28px semibold, horas grandes 28px con cifras tabulares.
- Iconos de línea (Material Symbols Outlined), estrellas de calificación en ámbar.
- Encabezado: menú hamburguesa a la izquierda, logotipo "ColaboraCar" en rojo #BD0016
  bold centrado, campana de notificaciones con punto rojo y avatar a la derecha.
- Barra de navegación inferior blanca con 5 pestañas: Viajes, Mis viajes, Historial,
  Billetera, Perfil. La pestaña activa es una píldora roja #BD0016 con icono y texto blancos.
  En esta pantalla la activa es "Mis viajes".
- Debajo del encabezado: eyebrow "VIAJES" y título "Mis viajes".

Reglas que el diseño debe reflejar:
- La salida más próxima va primero. Cada viaje tiene una sola hora de salida (no rango).
- Cada tarjeta de viaje lleva la etiqueta de ciudad de la sede (ej. "Trujillo", "Lima").
- Estados con chip de color: Confirmada / Publicado (gris azulado), En viaje / En curso
  (verde), Cancelado (rojo suave).
- Cancelar solo está permitido hasta 30 minutos antes de la salida.
- La necesidad de asistencia de movilidad de un pasajero solo la ve el conductor de su viaje
  (icono de accesibilidad + texto, ej. "Usa silla de ruedas").
- Nada de "ShareCar", "A/C activo", "Conductor frecuente" ni correos que no sean @utp.edu.pe.
- Contenido realista, nada de lorem ipsum.
```

Necesite un 2do prompt porque lo hizo pero en pantalla de escritorio:

```
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

---

## Frame 17-A — Mis viajes, modo pasajero

```text
Modo pasajero. Arriba, un segmentado de solo lectura que indica "Modo pasajero".

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
Modo conductor.

1. Debajo del título, una franja informativa gris con icono de alerta:
   "3 de 10 viajes cancelados en los últimos 30 días". Si estuviera en 10 de 10,
   la franja sería rojo suave y diría "No podrás publicar viajes hasta el 14/11."

2. Tarjeta "EN CURSO" (arriba porque está en marcha):
   - Chip verde "En curso", chip "Trujillo", "Salió 07:10 · Llegada estimada 07:45".
   - Ruta: "Urb. California" → "Campus UTP Trujillo".
   - Lista "Pasajeros a bordo (2)": avatar, nombre, ★ calificación, "1 plaza".
   - Botón primario rojo ancho completo "Finalizar viaje".

3. Tarjeta "PUBLICADO" (próxima salida):
   - Chip "Publicado", chip "Trujillo", bloque "Salida Hoy, 14:20" y "Sale en 12 min".
   - Ocupación: "3 de 4 plazas reservadas" con barra de progreso.
   - Lista de pasajeros, cada fila con avatar, nombre, ★, plazas:
     "Lucía R. ★ 4.8 · 1 plaza",
     "Jorge P. ★ 4.6 · 2 plazas" con línea extra
     "♿ Usa silla de ruedas — necesita espacio en la maletera".
   - Botón primario "Iniciar viaje" (habilitado: falta menos de 15 min).
   - Botón de texto deshabilitado "Cancelar viaje" con nota
     "Ya no puedes cancelar: faltan menos de 30 minutos para la salida."

4. Tarjeta "PUBLICADO" de mañana, sin reservas:
   - "Mañana, 07:00", "0 de 3 plazas reservadas".
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
Sobre el frame 17-B atenuado, bottom sheet:
- Título "¿Cancelar el viaje?"
- Texto: "Se cancelarán las 3 reservas confirmadas y se devolverán sus créditos."
- Campo de texto opcional "Motivo (opcional)" con contador "0/200".
- Variante de advertencia en franja rojo suave:
  "Con esta cancelación no podrás publicar viajes hasta el 14/11."
- Botones "Sí, cancelar viaje" (rojo) y "Volver" (gris).
```

## Frame 17-E — Modal: ¿Quiénes subieron? (iniciar viaje)

```text
Sobre el frame 17-B atenuado, bottom sheet alto:
- Título "¿Quiénes subieron?"
- Subtítulo: "Desmarca a quien no se presentó. Sus créditos se pagan igual al cerrar el viaje."
- Lista de 3 pasajeros, cada fila con avatar, nombre, plazas y un checkbox rojo "Subió"
  a la derecha. Dos marcados y uno desmarcado (Jorge P.), cuya fila se ve atenuada
  con la etiqueta "No se presentó".
- Botón primario "Confirmar inicio" y botón secundario "Cancelar".
- Variante sin pasajeros: solo el texto "Este viaje no tiene reservas. ¿Iniciar de todas
  formas?" y el botón "Confirmar inicio".
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
Mismo encabezado y navegación. En el centro, ilustración lineal sencilla de un auto
con una ruta punteada en rojo suave, el texto "No tienes viajes próximos" y,
según el modo, el botón secundario "Buscar un viaje" (pasajero)
o "Publicar un viaje" (conductor).
```

---

## Supuestos a validar

- La navegación inferior pasa de 4 a 5 pestañas para dar entrada a Mis viajes; los frames actuales tienen 4 (Ride, History, Wallet, Profile).
- El modo (pasajero o conductor) se toma del perfil (RF-14); la pantalla no permite cambiarlo, solo lo indica.
