---
name: diseno-stitch
description: Flujo iterativo para diseñar las pantallas de ColaboraCar (P01–P21, app móvil en WebView) con Stitch u otra herramienta de diseño por IA, y llevar el registro en docs/design/Pnn-Nombre/. Usar cuando el usuario pida un diseño o un prompt para una pantalla, empezar o rediseñar una pantalla, revisar o dar feedback sobre una captura generada (vN.M.png), o aprobar una pantalla para implementarla.
---

# Diseño de pantallas de ColaboraCar con Stitch

Cada pantalla se diseña por frames (vista principal, variantes y modales): prompt → captura → feedback → siguiente prompt, hasta aprobarla. Todo queda en `docs/design/Pnn-Nombre/`, para que el historial se pueda auditar y la implementación en React tenga una referencia única.

## Fuentes de verdad (leer antes de actuar)

- `README.md` (raíz) manda sobre cualquier diseño, frame o captura. **Si el diseño lo contradice, se corrige el diseño.** Secciones que se usan:
  - 1 Resumen y alcance, 1.1 Fuera del alcance y 1.2 Supuestos (correos `@utp.edu.pe`, créditos enteros, hora de Perú, dato sensible de movilidad reducida).
  - 2 RF, 2.1 Criterios de aceptación, 2.2 Reglas de negocio (RN).
  - 2.3 Estados: **etiquetas exactas en pantalla** («Confirmada», «En curso», «Cancelado: no se inició», «No te presentaste», «En proceso»…).
  - 2.4 Pantallas y RF: qué RF cubre cada pantalla.
  - 11 Pantallas de referencia: estado de cada pantalla y tabla «Lo que muestra el frame / Lo que aplica».
  - 12 Decisiones y preguntas abiertas.
- `app-utp-movilidad-colaborativa/src/styles/index.css`: tokens de color reales (`--brand-red`, `--brand-soft`, etc.).
- [templates/contexto-comun.md](templates/contexto-comun.md): bloque de sistema visual y reglas que se pega en cada pasada de Stitch.
- Pantallas ya diseñadas como referencia de estilo: `docs/design/P01…P16/screen.jpeg` (las del prototipo, ya implementadas) y las capturas aprobadas de P17–P21. `P17-MisViajes/prompt.md` es el ejemplo canónico del formato.

## Pantallas y carpetas

| Grupo | Pantallas | Qué hay en la carpeta | Qué se hace |
| --- | --- | --- | --- |
| Prototipo | P01–P16 | `README.md` + `screen.jpeg` (copia del frame de `frames/`) | Ya están implementadas. Solo se rediseñan si el usuario lo pide, para aplicar los «Ajustes respecto al frame». |
| Nuevas | P17 Mis viajes, P18 Notificaciones, P19 Historial, P20 Calificar, P21 Billetera | `README.md` («Pendiente de diseño») | Se diseñan desde cero con este flujo. |

Nombres de carpeta (no inventar otros): `P01-IniciarSesion`, `P02-VerificacionOTP`, `P03-Registro`, `P04-CompletarPerfil`, `P05-DatosVehiculo`, `P06-Dashboard`, `P07-CondicionesViaje`, `P08-ConfirmarReservaDashboard`, `P09-DetalleViaje`, `P10-ConfirmarReservaDetalle`, `P11-PublicarViaje`, `P12-ConfirmarPublicacion`, `P13-PerfilPasajero`, `P14-PerfilConductor`, `P15-ActualizarDatos`, `P16-ActualizarVehiculo`, `P17-MisViajes`, `P18-Notificaciones`, `P19-Historial`, `P20-Calificar`, `P21-Billetera`.

## Convenciones de archivos

```
docs/design/Pnn-Nombre/
├── README.md        ← ficha: Módulo · RF · Frame de referencia, Contenido, Ajustes (plantilla: templates/README.md)
├── prompt.md        ← prompts y bitácora (plantilla: templates/prompt.md)
├── screen.jpeg      ← solo P01–P16: frame original del prototipo
├── referencia-*.png ← referencias visuales que pegó el usuario (opcional)
└── v1.1.png, v1.2.png, v2.1.png… ← capturas de Stitch
```

- **Frames** se identifican como `Pnn-Letra`: `17-A` (vista principal), `17-B` (otra variante o modo), `17-C`… (modales, bottom sheets, estado vacío). Cada uno tiene su bloque en `prompt.md`.
- **Capturas:** `vN.M.png`, sin espacios. `N` es la ronda (v1 = primera pasada de todos los frames; v2 = ronda de correcciones tras la revisión) y `M` es el número correlativo de la captura dentro de la ronda. Una captura por frame o por corrección; la bitácora de `prompt.md` anota qué frame y qué prompt produjo cada una.
- Si el usuario guarda una captura con otro nombre (`Screenshot….png`, `17a.png`), se mueve a `vN.M.png` y se le avisa. Si numera distinto de lo planeado, se respeta y se anota.
- Las imágenes que el usuario pega en el chat como referencia se copian como `referencia-*.png`.

## Modos

Identificar en qué modo está el pedido.

### A. Iniciar una pantalla

1. Leer la ficha `Pnn-Nombre/README.md`, los RF de la pantalla (sección 2.4), sus criterios de aceptación (2.1), las RN que citan y las decisiones de la sección 12 que la afectan.
2. Crear `prompt.md` desde [templates/prompt.md](templates/prompt.md):
   - Cabecera con la línea **Fuentes** (RF, RN y secciones del README, `index.css` y las pantallas de referencia de estilo).
   - **Contexto común** copiado de [templates/contexto-comun.md](templates/contexto-comun.md), con la pestaña activa y el eyebrow/título de esta pantalla. No resumirlo ni decir «igual que P06»: Stitch empieza sin memoria en cada sesión.
   - Un bloque `## Frame nn-X — …` por vista, variante o modal. Los modales se describen «sobre el frame nn-A atenuado, bottom sheet…».
   - Al final, `## Supuestos a validar` con lo que el README no define.
3. **Datos de ejemplo coherentes:** reutilizar los de las pantallas ya diseñadas para que el flujo cuente una sola historia. Revisar antes los `prompt.md` previos. Datos ya usados en P17: usuario «LR» (Lucía R.), conductor «Carlos M.» ★ 4.9 (120), «Toyota Yaris blanco • ABC-123», «Campus UTP Trujillo — Av. Nicolás de Piérola 1221» → «Urb. El Golf, Víctor Larco», salida «Hoy, 14:20», 2 plazas, 12 créditos, pasajero «Jorge P.» con «Usa silla de ruedas».
4. **Valores que respetan las reglas:** precio por plaza de 1 a 10 créditos (RN-13), una sola hora de salida (no rango), etiqueta de ciudad/sede en cada tarjeta de viaje (RN-49), cancelación hasta 30 min antes (RN-25, RN-26), etiquetas de estado de la sección 2.3.
5. Si el usuario pega una referencia visual, copiarla como `referencia-*.png` y anotar en la cabecera de `prompt.md` qué se toma y qué no (con la regla del README que lo impide).
6. Actualizar la ficha `README.md` de la pantalla: «Frame de referencia» pasa a «En diseño (prompt.md)».
7. Entregar al usuario el prompt de la primera pasada (**Contexto común + Frame nn-A**) en un bloque `text` listo para copiar, con el nombre con que debe guardar la captura (`v1.1.png`).

### B. Rediseñar una pantalla del prototipo (P01–P16)

Igual que el modo A, pero:

- Adjuntar `screen.jpeg` a Stitch como referencia de layout y pedir «conserva el layout y cambia solo lo siguiente».
- El contenido del prompt sale de «Ajustes respecto al frame» de la ficha y de la tabla de la sección 11 del README (por ejemplo, P09: quitar «A/C activo» y «Conductor frecuente», agregar el distintivo de vehículo apto y «SOAT declarado por el conductor»).
- Cambiar «ShareCar» por «ColaboraCar» y los correos de ejemplo a `@utp.edu.pe` siempre, aunque la ficha no lo repita.

### C. Revisar un resultado (vN.M.png)

0. **Verificar los archivos.** Listar la carpeta con fecha (`ls -lT`). Si el usuario dice que regeneró una captura, volver a leerla. Si dos capturas parecen la misma, comparar `md5 -q`.
1. **Inspeccionar a fondo.** Las capturas son altas (≈ 830 × 1800–3700 px). Leer la imagen completa y, si hay textos pequeños o se ven varias pantallas a la vez, recortar por zonas en el scratchpad:
   ```bash
   # sips -c <alto> <ancho> --cropOffset <y> <x>
   sips -c 900 828 --cropOffset 0 0 docs/design/Pnn-X/vN.M.png --out <scratchpad>/recorte.png
   ```
2. **Evaluar** contra el checklist de abajo, los criterios de aceptación de los RF de la pantalla y los pendientes de la ronda anterior. Además:
   - **Coherencia entre pantallas:** encabezado, barra inferior, chips, tarjetas y botones iguales a los de las capturas ya aprobadas (y a P06 y P13/P14).
   - **Huecos de flujo:** qué pasa antes y después (éxito, error del servidor, a dónde lleva cada botón). Si el README no lo define, preguntarlo y registrar la respuesta en `### Decisiones de flujo`. Si afecta a otra pantalla, anotarlo también en su `prompt.md` o ficha.
   - **Pedidos que chocan con el README:** si el usuario pide algo que contradice una regla, no aplicarlo ni rechazarlo en silencio: preguntar con opciones (AskUserQuestion), explicando qué regla se toca.
   - **Propuestas sin respuesta:** si el usuario sigue adelante sin comentar una decisión propuesta, avisar una vez de que se adopta; en la siguiente revisión registrarla como «adoptada sin objeción».
   - **Mensajes completos:** si el frame es un formulario (recarga, retiro, calificación…), documentar en `prompt.md` la tabla completa de mensajes de validación de sus RF, aunque el diseño muestre solo algunos.
3. **Registrar en la bitácora de `prompt.md`:** fila en la tabla de capturas, y por cada captura revisada: lo que funciona, lo corregido respecto a la anterior (con #n) y la tabla **Pendiente** (#, Problema, Frame, Severidad Alta/Media/Baja, Veces).
4. **Decidir:**
   - Con pendientes de severidad Alta o Media que Stitch puede resolver, redactar el prompt de corrección (ver reglas) y anotarlo en la bitácora con el nombre de la captura que producirá.
   - Si Stitch deja algo igual tras dos intentos, no volver a describirlo: pedir que **duplique un frame ya correcto** y cambie solo lo propio.
   - Lo que el usuario declare tolerable se anota una vez y pasa a «Ajustes en la implementación».
   - Si un problema lleva 3 iteraciones o solo quedan ajustes mecánicos (un texto, un color), **aprobar** (modo D).
5. Si el problema es general (tokens, encabezado, barra inferior, formato móvil), corregir también [templates/contexto-comun.md](templates/contexto-comun.md) para que no se repita en las demás pantallas.

### D. Aprobar

1. En `prompt.md`: sección **Decisión** con la captura final de cada frame y los ajustes a resolver en la implementación (React + Tailwind), y los aprendizajes.
2. En la ficha `README.md`: «Frame de referencia» con las capturas aprobadas, la imagen embebida (`![17-A](v1.2.png)`) y los ajustes respecto al diseño si los hay.
3. En el README raíz, sección 11: cambiar el Estado de la pantalla de «Pendiente de diseño» a «Diseño aprobado» y poner la captura en la columna Archivo. Si un supuesto quedó resuelto, proponer la fila para la sección 12.1.
4. Sugerir la siguiente pantalla pendiente (P17 → P21).

## Checklist de revisión

- **Formato móvil:** 390 px de ancho, una columna, sin marco de teléfono, sin espacio vacío a la derecha ni contenedor centrado. Stitch suele generar escritorio la primera vez: si pasa, usar el prompt de conversión del contexto común.
- **Marca e idioma:** «ColaboraCar» (nunca «ShareCar»), español de Perú, «créditos» con moneda dorada (nunca soles ni S/ salvo en el monto de recarga de Yape).
- **Encabezado:** hamburguesa, logotipo rojo centrado, campana con punto rojo, avatar.
- **Barra inferior:** 5 pestañas (Viajes, Mis viajes, Historial, Billetera, Perfil) y la activa correcta como píldora roja. Pantallas de flujo (formularios de registro, modales, P18 desde la campana, P20) pueden ir sin barra o sin pestaña activa: decidirlo y anotarlo.
- **Etiquetas de estado** exactamente como en la sección 2.3 del README.
- **Reglas visibles:** una hora de salida, sede/ciudad en cada viaje, precio de 1 a 10 créditos, cancelación hasta 30 min antes, dato de movilidad reducida solo visible para el conductor del viaje y para el propio usuario (RN-17, RN-22).
- **Modo pasajero/conductor:** se toma del perfil (RF-14, RN-48); una pantalla que no sea el perfil no debe ofrecer un selector para cambiarlo, salvo que el usuario lo decida y se registre.
- **Fuera del alcance (no debe aparecer):** chat, paradas acordadas por el pasajero, botón de emergencia, compartir viaje, seguimiento en vivo o rutas por calles, recuperación o cambio de contraseña, edición de un viaje publicado, «Cambiar sede», «Modificar casa», «A/C activo», «Conductor frecuente», «Puntualidad» (es «Cumplimiento»), pagos con tarjeta, recomendaciones con IA, panel de administrador, correos fuera de `@utp.edu.pe`.
- **Contenido realista:** sin lorem ipsum, con los datos de ejemplo compartidos.

## Reglas para redactar prompts

- **Primera pasada de cada frame:** Contexto común completo + el bloque del frame. Un frame por pasada.
- **Corrección:** empezar con «Edita solo esta pantalla… mantén todo lo demás igual» y numerar los cambios, uno por punto, con valores concretos (hex, px, radios, textos literales entre comillas).
- **Referencia a lo que ya está bien:** «copia exactamente el estilo de la tarjeta de 17-A» funciona mejor que volver a describir los tokens.
- **Variantes y modales aparte:** un frame nuevo se pide en un prompt propio; dentro de un prompt de corrección Stitch lo ignora.
- **Exclusiones explícitas:** terminar con lo que NO debe aparecer cuando hay riesgo (ver checklist).
- **Estados por pantalla:** prever siempre los relevantes (normal, vacío, deshabilitado con motivo, error de validación, éxito, bloqueo por RN-30/RN-38) y darles un frame propio.

## Al responder al usuario

- **Breve:** qué se corrigió, la tabla de pendientes y el prompt siguiente en un bloque `text` listo para copiar (o la decisión de aprobar). Con varios frames, resumir en una tabla frame × resultado (✅ / ⚠️ / ❌).
- Cada prompt va precedido de qué frame seleccionar o adjuntar en Stitch y con qué nombre guardar la captura.
- Enlaces a los archivos actualizados.
- Citar secciones del README como «sección 2.3», nunca con el símbolo de sección.
- **Sin commits** salvo que el usuario lo pida.
