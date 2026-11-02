# Prompt de diseño — P09 Detalle del viaje

Prompt para rediseñar la pantalla 09 del prototipo con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Es un rediseño (modo B): se adjunta [screen.jpeg](screen.jpeg) como referencia de layout (mapa arriba y hoja inferior con conductor, ruta, vehículo y botón «Reservar viaje») y se aplican los cambios que pide el README. Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 09-A, y luego cada frame siguiente.

Fuentes: README raíz (RF-03, escenarios Detalle, Ya tiene una reserva activa, Bloqueado por cancelaciones y Viaje que ya no está disponible; RF-04 precondiciones; RNF-11; RN-13, RN-18, RN-22, RN-23, RN-25, RN-29, RN-36, RN-38, RN-49; secciones 1.1, 2.3 y 11), `app-utp-movilidad-colaborativa/src/styles/index.css`, el frame [screen.jpeg](screen.jpeg) y las capturas aprobadas de P06 (v3.2), P11 (v2.3) y P17 como referencia de estilo.

**Qué se conserva del frame:** el mapa arriba con la hoja inferior blanca de radio superior y tirador, la tarjeta del conductor con calificación y, a la derecha, distancia y precio en una pastilla blanca; el bloque de partida y destino con la hora; el bloque del vehículo con la placa en una etiqueta gris; el botón rojo a todo el ancho con la leyenda de cancelación debajo.

**Qué cambia y por qué:**

| Frame actual | Cambio | Regla |
| --- | --- | --- |
| «Detalle Del Viaje» con logotipo de auto y avatar rojo | Encabezado de flujo: flecha «←» y «Detalle del viaje», sin logotipo, campana, avatar ni barra inferior (como P11) | Pantalla de flujo |
| «15 min · Tráfico fluido» | Pastilla «5,2 km · ~9 min» | Sección 1.1 (sin tráfico); RF-03 (distancia en línea recta, duración a 35 km/h) |
| Ruta trazada por calles con un auto encima | Origen, paradas y destino unidos por líneas rectas punteadas, sin auto | Sección 1.1 (sin rutas por calles ni seguimiento en vivo), RF-03 |
| Solo partida y destino | Ruta como lista ordenada en texto con las paradas y la leyenda «Paradas referenciales definidas por el conductor» | RF-03, RNF-11, RN-29 |
| Sin ciudad | Chip «Trujillo» | RF-03, RN-49 |
| «Conductor frecuente» | Se quita | Sección 1.1 |
| «A/C activo» | Se quita; va el chip «Apto para silla de ruedas» si el vehículo es apto | Sección 1.1, RN-18 |
| Sin SOAT | Leyenda «SOAT declarado por el conductor» con icono de escudo | RN-36 |
| Sin condiciones | Sección «CONDICIONES DEL VIAJE» siempre visible | RF-03 |
| 45 créditos | «6 créditos por plaza» | RN-13 |
| «08:30 AM» y «Aprox. 08:45 AM» | Una sola hora de salida en 24 h con fecha («Hoy, jue 29 oct · 14:20») y llegada aprox. «14:29» | Sección 11 (`fecha_salida`), RF-03 |
| «3 asientos disponibles» | «3 asientos libres de 4» | RF-03 |
| «Cancelación gratuita hasta 10 min antes del viaje» | «Cancelación gratuita hasta 30 min antes del viaje» | RN-25, sección 11 |
| «Huaca del Dragón (Arco Iris)» | Datos de ejemplo compartidos con P06 y P17 (Campus UTP Trujillo → Urb. El Golf) | Coherencia del flujo |
| Foto real del conductor | Círculo gris con iniciales «CM» | Falla típica de Stitch (imágenes rotas) |

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
  Hover/pressed #A30013. Rojo acento #E6212A para puntos e indicadores.
- Rojo suave #FFDAD7 con texto #BD0016 para botones secundarios y chips activos;
  borde suave #E5BEBB para chips contorneados.
- Superficie gris #EEEEEE para bloques internos (como el bloque "Salida" del dashboard).
- Texto principal #1B1B1B, secundario marrón #5B403D, apagado #5F5E5E, placeholder #686C75.
- Verde para estados positivos: texto #1B7F3B sobre fondo #E6F4EA.
- Tipografía Inter. Etiquetas de sección en mayúsculas pequeñas con tracking
  (ej. "RUTA"), títulos 22px semibold, horas y cifras con números tabulares.
- Iconos de línea (Material Symbols Outlined), estrellas de calificación en ámbar.
- Encabezado de flujo (pantalla sin barra de navegación inferior): flecha "←" para volver
  a la izquierda y el título "Detalle del viaje" en 22px semibold. Sin logotipo, campana
  ni avatar.
- Sin barra de navegación inferior. El botón principal va fijo abajo, a todo el ancho
  menos 16 px por lado, sobre fondo blanco con borde superior #E1E1E1.

Reglas que el diseño debe reflejar:
- El viaje tiene una sola hora de salida (no rango), en formato de 24 h sin AM/PM, y lleva
  un chip discreto con la ciudad de su sede ("Trujillo").
- Precio por plaza entre 1 y 10 créditos, con la etiqueta "por plaza".
- Mapa plano estilo OpenStreetMap (calles grises claras, parques verde pálido), sin manchas
  ni formas negras. Origen, paradas y destino unidos por líneas rectas punteadas rojas:
  no es una ruta por calles. Sin auto sobre la ruta, sin tráfico ni seguimiento en vivo.
- Marcadores: origen con círculo blanco y borde rojo, paradas con círculos rojos numerados
  (1, 2), destino con círculo rojo sólido. Cada uno con una etiqueta blanca con su nombre.
- Las paradas las define solo el conductor y son referenciales: el pasajero no elige ni
  propone paradas.
- La accesibilidad es del vehículo: chip "Apto para silla de ruedas" solo si el vehículo
  es apto.
- La necesidad de asistencia de movilidad de un pasajero nunca aparece en esta pantalla.
- Cancelar solo está permitido hasta 30 minutos antes de la salida, y se hace en Mis viajes.
- Estados con chip de color y estas etiquetas exactas: Confirmada (gris azulado),
  En curso (verde), Cancelado (rojo suave).
- Nada de "ShareCar", "A/C activo", "Conductor frecuente", "Puntualidad", "Tráfico fluido",
  chat, botón de emergencia, compartir viaje, seguimiento en vivo, elegir paradas
  ni correos que no sean @utp.edu.pe.
- Textos en UTF-8: tildes, ñ, "·", "•", "→", "~" y "★" deben verse correctos
  (ej. "Víctor Larco", "Óvalo", "España", "Piérola").
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 09-A — Detalle, pasajero puede reservar

Adjuntar [screen.jpeg](screen.jpeg) en Stitch y elegir el modo **App**.

```text
Conserva el layout de la imagen adjunta (mapa arriba y una hoja inferior blanca con radio
superior 24px y tirador gris, con tarjetas grises dentro) y cambia solo lo que indico.
Usuario: pasajera Lucía R. Es una pantalla larga con scroll: muéstrala completa.

1. Encabezado: "←" a la izquierda y título "Detalle del viaje". Quita el logotipo y el avatar.

2. Mapa (alto 280 px), estilo plano OpenStreetMap, Trujillo:
   - Origen "Campus UTP Trujillo" (círculo blanco con borde rojo e icono de birrete).
   - Parada 1 "Av. España" y parada 2 "Óvalo Larco" (círculos rojos numerados).
   - Destino "Urb. El Golf" (círculo rojo sólido).
   - Líneas rectas punteadas rojas entre ellos, en ese orden. Sin auto sobre la ruta.
   - Arriba a la izquierda, pastilla blanca con icono de regla: "5,2 km · ~9 min".
   - Abajo a la derecha, botón circular blanco de centrar el mapa. Sin botón de capas.

3. Hoja inferior, en este orden:
   a. Tarjeta del conductor (gris #EEEEEE, radio 16px):
      - A la izquierda, círculo gris claro #E1E1E1 de 56 px con las iniciales "CM" en
        #5B403D semibold; al lado "Carlos M." (18px semibold) y debajo
        "★ 4.9 (120 reseñas)".
      - A la derecha, pastilla blanca con moneda dorada + "6" grande y, en la misma fila,
        "créditos por plaza" en 14px #5F5E5E, sin cortar palabras.
      - Sin "Conductor frecuente".
   b. Tarjeta de salida y ruta (gris #EEEEEE):
      - Fila superior: chip discreto "Trujillo" con icono de ubicación y, a la derecha,
        "Hoy, jue 29 oct".
      - Etiqueta "SALIDA" y la hora grande "14:20"; a su derecha, en gris,
        "Llegada aprox. 14:29".
      - Etiqueta "RUTA" y una lista vertical unida por una línea gris:
        "Campus UTP Trujillo — Av. Nicolás de Piérola 1221" (punto blanco con borde rojo),
        "Parada 1 · Av. España" (punto rojo), "Parada 2 · Óvalo Larco" (punto rojo),
        "Urb. El Golf, Víctor Larco" (punto rojo sólido). Texto completo, sin
        puntos suspensivos.
      - Debajo, en 13px gris #5F5E5E con icono de información:
        "Paradas referenciales definidas por el conductor".
      - Fila final en gris: "5,2 km en línea recta · ~9 min".
   c. Tarjeta del vehículo (gris #EEEEEE):
      - Icono de auto, "Toyota Yaris" • "Blanco" y, a la derecha, la placa "ABC-123" en una
        etiqueta gris #E1E1E1.
      - Icono de asiento rojo + "3 asientos libres de 4".
      - Dos chips en una sola línea: "Apto para silla de ruedas" (verde #1B7F3B sobre
        #E6F4EA, con icono de accesibilidad) y "SOAT declarado por el conductor"
        (gris, con icono de escudo).
      - Sin "A/C activo".
   d. Tarjeta "CONDICIONES DEL VIAJE" (blanca, borde #E1E1E1), siempre visible, con tres
      filas con icono de check gris: "Máximo de espera 5 minutos", "No se admiten desvíos",
      "Sin comida en el auto".

4. Barra fija abajo (fondo blanco, borde superior #E1E1E1): botón primario rojo a todo el
   ancho "Reservar viaje" con flecha →, y debajo, centrado en 13px #5F5E5E:
   "Cancelación gratuita hasta 30 min antes del viaje".

Quita "Tráfico fluido", "Conductor frecuente", "A/C activo", "AM", la ruta por calles,
el auto sobre el mapa y la foto del conductor.
```

## Frame 09-B — Modo lectura: ya es tu reserva (desde Mis viajes)

```text
Duplica el frame 09-A (v2.1) y cambia solo lo siguiente:
1. Debajo del tirador de la hoja inferior, antes de la tarjeta del conductor, una tarjeta
   blanca con borde #E1E1E1 y radio 16px:
   - Etiqueta "TU RESERVA" y a la derecha el chip gris azulado "Confirmada".
   - Fila: icono de asiento "2 plazas" · moneda dorada "12 créditos retenidos".
   - Texto gris #5F5E5E con icono de reloj: "Puedes cancelar gratis hasta las 13:50
     desde Mis viajes."
2. En la tarjeta del vehículo, cambia "3 asientos libres de 4" por "1 asiento libre de 4".
3. En la barra fija de abajo, reemplaza "Reservar viaje" y la leyenda por un botón
   secundario rojo suave #FFDAD7 con texto #BD0016, a todo el ancho: "Ir a Mis viajes".
Mantén todo lo demás igual. No repitas las tarjetas del conductor, la ruta, el vehículo
ni las condiciones. No agregues "Cancelar reserva" aquí.
```

## Frame 09-C — Pasajero bloqueado por cancelaciones

```text
Duplica el frame 09-A (v2.1) y cambia solo lo siguiente:
1. En la barra fija de abajo, encima del botón, una franja rojo suave #FFDAD7 con texto
   #BD0016, radio 12px e icono de candado: "Cancelaste o no te presentaste a 5 viajes en
   los últimos 30 días. Podrás reservar de nuevo desde el 08/11."
2. El botón "Reservar viaje" se ve deshabilitado: fondo #EEEEEE y texto #686C75, sin flecha.
3. Quita la leyenda "Cancelación gratuita hasta 30 min antes del viaje".
Mantén todo lo demás igual. No repitas las tarjetas.
```

## Frame 09-D — Viaje que ya no está disponible

```text
Usa el mismo sistema visual del frame seleccionado (09-A, v2.1): Inter, #BD0016, #FFDAD7, #EEEEEE,
radios de 12px y 16px. Mismo encabezado de flujo ("←" y "Detalle del viaje"). Sin mapa,
sin hoja inferior y sin barra de navegación.
En el centro, una tarjeta blanca con borde #E1E1E1 y radio 16px:
- Icono circular rojo suave #FFDAD7 con un auto y una "X" en #BD0016.
- Título 20px semibold "Este viaje ya no está disponible".
- Texto gris #5F5E5E: "Puede que el conductor lo haya cancelado, que ya haya salido
  o que no queden asientos."
- Botón primario rojo a todo el ancho "Ver otros viajes".
Sin datos del viaje, del conductor ni del vehículo.
```

---

## Supuestos a validar

- **Encabezado de flujo sin barra inferior:** P09 se abre desde una tarjeta de P06 o desde «Ver detalle» de P17 y se vuelve con «←». Igual que P11, sin logotipo, campana, avatar ni barra de 5 pestañas.
- **Reserva activa (RN-23):** no tiene frame propio. Usa el layout de 09-C con la franja gris de P06-B («Ya tienes una reserva activa. Cancélala para reservar otro viaje.» + «Ver en Mis viajes») y el botón deshabilitado. Se resuelve en la implementación, porque en el ejemplo la reserva activa de Lucía es justamente este viaje (eso es 09-B).
- **Modo lectura (09-B):** sale de la decisión de flujo de P17 («Ver detalle» abre P09 sin «Reservar»). La tarjeta «TU RESERVA» y el botón «Ir a Mis viajes» son nuevos; cancelar sigue estando solo en Mis viajes (RF-06).
- **Llegada aprox.:** `fecha_salida + duracion_min` (14:20 + 9 min). RF-03 pide la duración; mostrar la hora de llegada es un agregado.
- **Distancia de ejemplo:** 5,2 km y ~9 min son los de P11 (el viaje de ida). Se reutilizan para la vuelta con las paradas en orden inverso.
- **Texto de 09-D:** RF-03 solo fija «Este viaje ya no está disponible». La explicación y «Ver otros viajes» (vuelve a P06) son nuevos.
- **Conductor viendo su propio viaje:** no aplica. En modo conductor, P06-F lleva a P17, y el listado no incluye viajes propios (RF-03).

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| v1.1 | 09-A | Contexto común + 09-A (con screen.jpeg adjunto) | ⚠️ contenido correcto; encabezado duplicado, pastilla tapada, conductor truncado |
| v2.1 | 09-A | Corrección de v1.1 | ✅ se aprueba 09-A |
| v2.2 | 09-B | Duplicar 09-A (v2.1) + 09-B | ✅ |
| v2.3 | 09-C | Duplicar 09-A (v2.1) + 09-C | ✅ |
| v2.4 | 09-D | Estilo de 09-A (v2.1) + 09-D | ✅ (título con mayúsculas, se ajusta en la implementación) |

### Decisiones de flujo

Propuestas el 2026-11-01:

- **Entrada:** tocar una tarjeta de P06 (09-A, 09-C o franja RN-23) o «Ver detalle» en P17 (09-B).
- **«Reservar viaje»** abre P10 Confirmar reserva (detalle). Al confirmar, toast «Reserva confirmada» y la pantalla pasa a 09-B. Con saldo insuficiente, P10 muestra el mensaje de RN-39 con «Recargar» hacia P21. Si otro pasajero tomó la última plaza: «Este viaje ya no tiene asientos disponibles» en P10, y P09 se recarga.
- **«Ir a Mis viajes»** (09-B) abre P17 con la pestaña «Mis viajes» activa.
- **«←»** vuelve a la pantalla de origen (P06 o P17).
- **Viaje que dejó de estar `PUBLICADO`** (cancelado, en curso o completado) al abrirlo: 09-D. «Ver otros viajes» abre P06.
- **Error del servidor al cargar:** franja rojo suave «No pudimos cargar el viaje» con «Reintentar» (no se diseña).

### Revisión de v1.1

Formato móvil exportado a 1× (442 × 1600 px). Sirve, pero conviene exportar a 2× para leer los textos chicos.

**Lo que funciona:** sale casi todo el prompt a la primera. El mapa es plano, con líneas rectas punteadas, marcadores numerados, etiquetas y ningún auto encima. La ruta aparece completa en texto, con la leyenda de RN-29, y la tarjeta muestra «5,2 km en línea recta · ~9 min». También están el chip «Trujillo», «Hoy, jue 29 oct», una sola hora «14:20» con «Llegada aprox. 14:29», el avatar «CM», «6 créditos por plaza» en una línea, «3 asientos libres de 4», «Apto para silla de ruedas» en verde (RN-18), «SOAT declarado por el conductor» (RN-36), las tres condiciones, «Reservar viaje →» y la leyenda de 30 min (RN-25). No aparece «A/C activo», «Conductor frecuente» ni «Tráfico fluido», y las tildes se ven bien.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 1 | Hay dos encabezados: «← Detalle Del Viaje» (copiado del frame, con mayúsculas) y debajo «← Detalle del viaje». | 09-A | Alta | 1.ª |
| 2 | El marcador de origen (birrete) queda encima de la pastilla de distancia y tapa «5,2 km». | 09-A | Media | 1.ª |
| 3 | La pastilla del precio le quita espacio al conductor: el nombre se corta («Carlos…») y «4.9 (120 reseñas)» se parte en dos líneas, con la estrella desalineada. | 09-A | Media | 1.ª |
| 4 | Los chips «Apto para silla de ruedas» y «SOAT declarado…» van en dos líneas. Se acepta, porque no entran en 390 px. | 09-A | Baja | 1.ª |
| 5 | La barra fija tapa el final de la tarjeta de condiciones en la captura larga. Se resuelve en la implementación con un relleno inferior. | 09-A | Baja | 1.ª |
| 6 | La placa «ABC-123» está en fuente monoespaciada. | 09-A | Baja | 1.ª |
| 7 | La etiqueta «Urb. El Golf» queda pegada al botón de centrar. | 09-A | Baja | 1.ª |

Para #3 se cambia la estructura en lugar de pedir más espacio: el precio pasa a su propia fila, debajo del conductor (aprendizaje de P06, #6).

**Prompt de corrección** (seleccionar el frame 09-A de v1.1 en Stitch, en modo App; guardar como `v2.1.png`):

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. Deja un solo encabezado: "←" y "Detalle del viaje" (solo la D en mayúscula), 22px semibold.
   Elimina el encabezado duplicado "Detalle Del Viaje" de arriba.
2. Mapa: mueve la pastilla "5,2 km · ~9 min" a la esquina superior derecha del mapa y baja
   los marcadores para que ningún marcador ni etiqueta tape la pastilla. La etiqueta
   "Urb. El Golf" debe quedar separada del botón de centrar.
3. Tarjeta del conductor, en dos filas:
   - Fila 1: avatar "CM" de 56 px, al lado "Carlos M." completo (18px semibold) y debajo,
     en una sola línea, estrella ámbar + "4.9 (120 reseñas)", alineados.
   - Fila 2, a todo el ancho de la tarjeta: pastilla blanca con moneda dorada + "6" grande
     + "créditos por plaza" en la misma fila.
4. La placa "ABC-123" en Inter semibold, no en fuente monoespaciada.
5. Agrega un espacio inferior de 120 px después de la tarjeta "CONDICIONES DEL VIAJE"
   para que la barra fija no la tape.
Mantén igual los textos, los colores, la ruta, el vehículo, las condiciones y el botón.
```

### Revisión de v2.1

Formato móvil a 2× (860 × 3021 px).

**Corregido respecto a v1.1:**

- #1: queda un solo encabezado, «← Detalle del viaje».
- #2: la pastilla «5,2 km · ~9 min» está arriba a la derecha y no la tapa nada. La etiqueta «Urb. El Golf» ya no choca con el botón de centrar (#7).
- #3: «Carlos M.» se ve completo, con «★ 4.9 (120 reseñas)» en una línea, y el precio va en su propia fila.
- #6: la placa está en Inter.
- #5: se agregó el espacio inferior y la barra ya no tapa las condiciones.

**09-A ✅.** Se aprueba con v2.1, que pasa a ser la base de 09-B y 09-C.

**Pendiente (tolerable, pasa a la implementación):**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 8 | En la pastilla del precio, «créditos por plaza» queda alineado a la derecha, lejos del «6». En la implementación va pegado al número, como en P06-B. | 09-A | Baja | 1.ª |
| 9 | El espacio inferior quedó dentro de la tarjeta de condiciones, que se alarga vacía. Va como relleno de la página, fuera de la tarjeta. | 09-A | Baja | 1.ª |
| 4 | Los chips del vehículo van en dos líneas (se acepta). | 09-A | Baja | 2.ª |
| 10 | La captura trae un borde fino del lienzo a los lados. Es un artefacto de la exportación. | 09-A | Baja | 1.ª |

### Revisión de v2.2

**09-B ✅ a la primera.** Formato móvil a 2× (860 × 3349 px). La tarjeta «TU RESERVA» trae el chip gris azulado «Confirmada», «2 plazas · 12 créditos retenidos» y «Puedes cancelar gratis hasta las 13:50 desde Mis viajes.», con los mismos datos que P17-A. El vehículo dice «1 asiento libre de 4», como P06-B. La barra fija tiene solo «Ir a Mis viajes» en rojo suave, sin «Reservar viaje», sin la leyenda y sin «Cancelar reserva». No hay tarjetas repetidas y no se perdió nada de 09-A.

**Pendiente (tolerable):** se arrastran #8 y #9 de 09-A. El texto de ayuda de la reserva se parte en dos líneas y el reloj queda centrado en vertical; en la implementación el icono va alineado a la primera línea (Baja).

### Revisión de v2.3

**09-C ✅ a la primera.** Formato móvil a 2× (860 × 3022 px). En la barra fija aparece la franja rojo suave con candado y el texto literal de RN-38 («Cancelaste o no te presentaste a 5 viajes en los últimos 30 días. Podrás reservar de nuevo desde el 08/11.»), la misma fecha que en P06-C. «Reservar viaje» está deshabilitado y sin flecha, y la leyenda de cancelación desapareció. El vehículo vuelve a «3 asientos libres de 4». No hay tarjetas repetidas.

**Pendiente (tolerable):** se arrastran #8 y #9 de 09-A. La franja hace más alta la barra fija; en la implementación el relleno inferior de la página tiene que medir lo mismo que la barra, también cuando aparece la franja (Baja).

### Revisión de v2.4

**09-D ✅.** Formato móvil a 2× (812 × 1782 px). La tarjeta centrada tiene el icono de auto con «X» en un círculo rojo suave, el texto literal de RF-03 «Este viaje ya no está disponible», la explicación y «Ver otros viajes». No muestra datos del viaje, mapa ni barra de navegación.

**Pendiente (tolerable):**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 11 | El título vuelve a salir como «Detalle Del Viaje» (como en v1.1, #1). Es un texto: en la implementación va «Detalle del viaje». | 09-D | Baja | 1.ª |
| 12 | Stitch agregó una flecha → en «Ver otros viajes». Se acepta, igual que «Reservar viaje →». | 09-D | Baja | 1.ª |

### Decisión

Se aprueba el 2026-11-01. Capturas finales: 09-A → v2.1, 09-B → v2.2, 09-C → v2.3, 09-D → v2.4.

Ajustes a resolver en la implementación (React + Tailwind):

1. **Precio:** en la pastilla, «créditos por plaza» va pegado al número («[moneda] 6 créditos por plaza»), como en P06-B, y no alineado a la derecha (#8).
2. **Relleno inferior:** va en la página, no dentro de la tarjeta de condiciones, y mide lo mismo que la barra fija, que es más alta cuando lleva la franja de 09-C (#9).
3. **Chips del vehículo:** «Apto para silla de ruedas» y «SOAT declarado por el conductor» se acomodan con `flex-wrap`; en 390 px quedan en dos líneas (#4). El chip de accesibilidad solo aparece si el vehículo es apto, con el texto accesible «Vehículo apto para silla de ruedas plegable» (RF-03).
4. **Título:** «Detalle del viaje», con mayúscula solo en la primera palabra, en las cuatro vistas (#11).
5. **Icono de ayuda:** el reloj de la tarjeta «TU RESERVA» va alineado con la primera línea del texto.
6. **Reserva activa en otro viaje (RN-23):** sin frame propio. Usa el layout de 09-C con la franja gris de P06-B («Ya tienes una reserva activa. Cancélala para reservar otro viaje.» + «Ver en Mis viajes») y el botón deshabilitado.
7. **Llegada aprox.:** se calcula como `fecha_salida + duracion_min`. La duración sale de la distancia en línea recta a 35 km/h (RF-03).
8. **Hora de cancelación de 09-B:** `fecha_salida − minutos_limite_cancelacion` (RN-25, RN-31).
9. **Mapa:** Leaflet con líneas rectas (`Polyline` con `dashArray`) y marcadores propios. La lista de la ruta repite el mismo orden en texto (RNF-11).
10. Los flujos de éxito y error son los de «Decisiones de flujo».

**Aprendizaje para las siguientes pantallas:**

- Al adjuntar el frame del prototipo, Stitch copia también su encabezado y lo duplica (v1.1). Hay que pedir «reemplaza el encabezado del frame», no solo describir el nuevo.
- Las variantes duplicadas del principal corregido (09-B y 09-C) salen bien a la primera, igual que en P06.
- En los frames que no se duplican (09-D), Stitch vuelve a poner mayúsculas en el título del frame original: conviene escribir el título literal entre comillas y aclarar «solo la primera letra en mayúscula».
