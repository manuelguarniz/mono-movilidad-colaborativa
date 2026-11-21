# Prompt de diseño — P05 Datos del vehículo y SOAT

Prompt para rediseñar la pantalla 05 del prototipo con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Es un rediseño (modo B) que parte de dos referencias: el frame [screen.jpeg](screen.jpeg) para el layout del registro y la captura aprobada de P16 [v2.1](../P16-ActualizarVehiculo/v2.1.png) para los campos, la accesibilidad y la tarjeta SOAT, que deben verse iguales en ambas pantallas. Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 05-A, y luego cada variante duplicando el frame correcto.

Fuentes: README raíz (RF-02, casuísticas C, D y E; RF-14, escenario Vehículo; RN-06, RN-07, RN-08, RN-09, RN-18, RN-36; sección 5.1, `usuarios.vehiculo` y `archivos`; secciones 1.1 y 11), `app-movilidad-colaborativa-api/README.md` (validación de `POST /vehicles`), `app-utp-movilidad-colaborativa/src/styles/index.css`, el frame [screen.jpeg](screen.jpeg), el [prompt.md de P16](../P16-ActualizarVehiculo/prompt.md) (decisiones de 16-C y mensajes de validación) y el encabezado de registro de P04.

**Qué se conserva del frame:** la flecha «←» con el logotipo, el título y su descripción, el recuadro punteado para subir la foto del vehículo, los campos con etiqueta encima e icono, «DNI del propietario», los checks «Soy el propietario» y de términos, y el botón «Terminar» al final.

**Qué cambia y por qué:**

| Frame actual | Cambio | Regla |
| --- | --- | --- |
| Sin indicador de paso | Barra «Paso 3 de 3», igual que P04 | RF-02 (flujo en tres pasos) |
| «Datos del Vehículo» | «Datos del vehículo» (solo la primera letra en mayúscula) | — |
| Campos blancos con borde rojizo | Campos grises #EEEEEE de 52 px, como P16 | Coherencia con P16 |
| «Subir foto del vehículo» sin indicación | Se agrega «(opcional) · JPG o PNG, hasta 5 MB» | RN-06 (la foto es opcional al registrar) |
| Sin marca, modelo ni color | «Marca» y «Modelo» lado a lado, más «Color» | RF-02 C, API (`brand`, `model`, `color`) |
| «Cantidad de ocupantes» | «Asientos para pasajeros» con stepper − + y ayuda «De 1 a 10» | RN-09; igual que P16 |
| Sin accesibilidad | Tarjeta «ACCESIBILIDAD (OPCIONAL)» con dos checks; con tipo Moto no se muestra | RN-18; decisión del usuario en 16-C |
| Sin SOAT | Tarjeta «SOAT» obligatoria, igual que P16: aseguradora, póliza, inicio, fin, foto del certificado y notas de declaración y privacidad | RF-02 C, RN-36 |
| «…registro de vehículos» en el check de términos | «…en ColaboraCar» | Sección 11 |
| Solo «Terminar» | «Terminar» + botón de texto «Omitir por ahora» (continuar como pasajero) | RF-02 D y E |

---

## Contexto común (pegar en las pasadas sin duplicar)

```text
Diseña una pantalla de app móvil (WebView, 390 × 844, sin marco de teléfono) para ColaboraCar,
la app de viajes compartidos de la comunidad de la Universidad Tecnológica del Perú (UTP).
Idioma: español de Perú.

Formato (obligatorio): es una pantalla de teléfono, no web ni escritorio. Ancho total 390 px,
una sola columna, márgenes laterales de 16 px, sin barras laterales ni contenedores centrados
con fondo vacío alrededor.

Sistema visual (respetar exactamente, es el de las pantallas ya diseñadas):
- Fondo de pantalla #F9F9F9. Tarjetas blancas, borde 1px #E1E1E1, radio 16px, sombra muy suave.
- Rojo de marca #BD0016 (botón primario sólido, texto blanco, radio 12px, alto 52px).
  Rojo acento #E6212A para puntos e indicadores.
- Rojo suave #FFDAD7 con texto #BD0016 para botones secundarios y chips activos;
  borde suave #E5BEBB para recuadros punteados de carga de archivos.
- Superficie gris #EEEEEE para campos y bloques internos (radio 12px, alto 52px).
- Texto principal #1B1B1B, secundario marrón #5B403D, apagado #5F5E5E, placeholder #686C75.
- Verde para estados positivos: texto #1B7F3B sobre fondo #E6F4EA.
- Ámbar para avisos: texto #8A5A00 sobre fondo #FFF4D6.
- Tipografía Inter. Etiquetas de sección en mayúsculas pequeñas con tracking
  (ej. "SOAT"), etiquetas de campo 14px semibold, títulos 28px semibold.
  Cifras y fechas con números tabulares, nunca en fuente monoespaciada.
- Iconos de línea (Material Symbols Outlined). Checkboxes cuadrados de 22px con radio 6px:
  marcados en rojo #BD0016 con check blanco, sin marcar blancos con borde de 2px #5F5E5E.
- Encabezado de registro: flecha "←" a la izquierda y el logotipo "ColaboraCar" en rojo
  #BD0016 bold (solo el texto), y debajo una barra de progreso de 3 segmentos con los
  tres activos y el texto "Paso 3 de 3". Sin campana, avatar ni menú hamburguesa.
- Sin barra de navegación inferior.

Reglas que el diseño debe reflejar:
- La placa sigue el formato peruano "ABC-123" y se muestra en mayúsculas.
- Año de fabricación desde 2000. Asientos para pasajeros de 1 a 10.
- Todos los campos son obligatorios, incluido el SOAT. Son opcionales solo la foto del
  vehículo, los checks de accesibilidad y "Soy el propietario…".
- La accesibilidad es del vehículo: "Puedo llevar una silla de ruedas plegable" hace que el
  vehículo sea apto. Una moto no puede declarar accesibilidad.
- El SOAT es una declaración del conductor: la app no lo verifica con la aseguradora.
  La foto del certificado solo la ve su dueño. Sin SOAT vigente no se registra el vehículo.
- Fechas en formato DD/MM/AAAA.
- Nada de "ShareCar", "En Servicio", validación automática del SOAT, consulta a SBS
  o APESEG, chat ni correos que no sean @utp.edu.pe.
- Textos en UTF-8: tildes, ñ, "·", "•" y "−" deben verse correctos
  (ej. "Rímac", "Pacífico", "póliza", "vehículo").
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 05-A — Formulario vacío (al llegar desde P04)

Adjuntar [screen.jpeg](screen.jpeg) **y** la captura aprobada de P16 [v2.1](../P16-ActualizarVehiculo/v2.1.png) en Stitch, y elegir el modo **App**. Guardar como `v1.1.png`.

```text
Usa la primera imagen adjunta (registro de vehículo) como referencia de layout y la segunda
(actualizar vehículo, ya aprobada) como referencia exacta de estilo para los campos, el
stepper, la tarjeta de accesibilidad y la tarjeta SOAT. No copies el encabezado de ninguna
de las dos ni dupliques encabezados. Es el registro: los campos están vacíos, con placeholders.
Es una pantalla larga con scroll: muéstrala completa.

1. Encabezado de registro: "←", "ColaboraCar" y la barra "Paso 3 de 3".

2. Título "Datos del vehículo" y descripción "Registra tu vehículo y su SOAT para empezar
   a publicar viajes."

3. Recuadro punteado (borde 2px #E5BEBB, fondo #EEEEEE, radio 16px, alto 160 px) con icono
   de cámara con "+" en rojo, "Subir foto del vehículo" y debajo en 13px #5F5E5E
   "Opcional · JPG o PNG, hasta 5 MB".

4. Etiqueta de sección "DATOS DEL VEHÍCULO" y campos grises con icono, vacíos:
   - "Placa": placeholder "ABC-123", con la ayuda "Formato ABC-123" a la derecha de la etiqueta.
   - "Tipo de vehículo": selector "Selecciona un tipo".
   - "Marca" ("Ej. Toyota") y "Modelo" ("Ej. Yaris") lado a lado.
   - "Color" ("Ej. Blanco") y "Año" ("Ej. 2021") lado a lado.
   - "Asientos para pasajeros": stepper "−" "1" "+", ayuda "De 1 a 10. Es el máximo que
     podrás ofrecer por viaje."
   - "DNI del propietario": placeholder "8 dígitos", icono de documento.

5. Tarjeta "ACCESIBILIDAD (OPCIONAL)" igual que en la segunda imagen, con los dos checks
   sin marcar: "Puedo llevar una silla de ruedas plegable" (con la ayuda "Tu vehículo
   aparecerá como apto en el filtro de accesibles.") y "Puedo ayudar a subir y bajar
   del vehículo".

6. Tarjeta "SOAT" igual que en la segunda imagen, sin chip de estado y vacía:
   - Texto 13px #5B403D bajo la etiqueta: "Obligatorio para publicar viajes."
   - "Aseguradora": selector "Selecciona tu aseguradora".
   - "Número de póliza": placeholder "Ej. 2401-123456".
   - "Inicio" y "Fin" lado a lado, placeholder "DD/MM/AAAA" con icono de calendario.
   - Recuadro punteado más bajo (alto 96 px) con icono de documento con "+",
     "Subir certificado del SOAT" y "JPG o PNG, hasta 5 MB".
   - Nota gris con icono de candado: "Solo tú ves la foto del certificado."
   - Nota gris con icono de información: "Es una declaración tuya: ColaboraCar no verifica
     el SOAT con la aseguradora. Los pasajeros verán «SOAT declarado por el conductor»."

7. Bloque gris "Confirmaciones" con dos checks sin marcar:
   - "Soy el propietario legal o conductor autorizado de este vehículo".
   - "Acepto los términos y condiciones para el registro de vehículos en ColaboraCar".

8. Botón primario rojo a todo el ancho: "Terminar". Debajo, botón de texto gris
   "Omitir por ahora" y, en 13px #5F5E5E centrado: "Podrás registrarlo después desde
   tu perfil."

Quita "ShareCar", "Cantidad de ocupantes", los bordes rojizos de los campos y
"Datos del Vehículo" con V mayúscula.
```

## Frame 05-B — Formulario completo

```text
Duplica el frame 05-A y cambia solo lo siguiente, con los datos del conductor Carlos M.:
1. Foto: en lugar del recuadro punteado, la foto de un Toyota Yaris sedán blanco
   (radio 16px, alto 200 px) con la placa "ABC-123" en una etiqueta blanca abajo a la
   izquierda, y debajo la fila gris "Foto del vehículo · JPG o PNG, hasta 5 MB" con el
   botón secundario "Cambiar foto" (igual que P16).
2. Campos: "Placa" "ABC-123", "Tipo de vehículo" "Sedán", "Marca" "Toyota", "Modelo" "Yaris",
   "Color" "Blanco", "Año" "2021", "Asientos para pasajeros" "4", "DNI del propietario"
   "45678912".
3. Accesibilidad: "Puedo llevar una silla de ruedas plegable" marcado; el otro sin marcar.
4. SOAT: chip verde "Vigente" junto a la etiqueta. "Aseguradora" "Rímac Seguros",
   "Número de póliza" "2401-123456", "Inicio" "15/03/2026", "Fin" "15/03/2027". En lugar
   del recuadro punteado, la fila gris con miniatura del certificado, "soat-rimac.jpg" y
   debajo "JPG o PNG, hasta 5 MB", y el botón de texto rojo "Cambiar".
5. Confirmaciones: los dos checks marcados.
Mantén igual el encabezado, las notas y los botones. No repitas secciones ni tarjetas.
```

## Frame 05-C — SOAT no vigente y errores

```text
Duplica el frame 05-B y cambia solo lo siguiente:
1. Campo "Placa": valor "XYZ-789", borde rojo #BD0016 de 1,5 px y debajo, texto rojo con
   icono de alerta: "La placa ya está registrada".
2. Tarjeta "SOAT": quita el chip "Vigente". Fechas "Inicio" "10/10/2025" y "Fin"
   "10/10/2026", ambos con borde rojo. Encima de "Aseguradora", una sola franja rojo suave
   #FFDAD7 con texto #BD0016 e icono de alerta: "Tu SOAT no está vigente. No puedes
   registrar el vehículo sin un SOAT vigente."
3. Campo "DNI del propietario": valor "4567891", borde rojo y debajo: "El DNI debe tener
   8 dígitos".
4. Encima del botón "Terminar", una franja ámbar #FFF4D6 con texto #8A5A00: "Si aún no
   tienes tu SOAT vigente, puedes continuar como pasajero y registrar tu vehículo después."
   El botón "Omitir por ahora" pasa a ser un botón secundario rojo suave a todo el ancho.
Mantén igual lo demás. Una sola franja por sección. No repitas secciones.
```

## Frame 05-D — Tipo moto: sin sección de accesibilidad

```text
Duplica el frame 05-B y cambia solo lo siguiente:
1. "Tipo de vehículo": "Moto".
2. Foto: una moto lineal roja con la placa "MT4-512" en la etiqueta blanca. Campos:
   "Placa" "MT4-512", "Marca" "Honda", "Modelo" "CB190R", "Color" "Rojo", "Año" "2022",
   "Asientos para pasajeros" "1".
3. Elimina por completo la tarjeta "ACCESIBILIDAD (OPCIONAL)". Después de "DNI del
   propietario" sigue directamente la tarjeta "SOAT", con 24 px de separación.
4. La ayuda a la derecha de "Placa" sigue diciendo "Formato ABC-123".
Mantén igual el SOAT, las confirmaciones y los botones. No agregues avisos sobre accesibilidad.
```

---

## Supuestos a validar

- **Foto del vehículo opcional al registrar** (RN-06) y obligatoria al actualizar (RN-15): un conductor que registra sin foto tendrá que agregarla en P16 antes de guardar cambios allí.
- **«DNI del propietario»:** `POST /vehicles` lo pide (`ownerDni`), aunque RN-06 solo nombra el check «Soy el propietario» como opcional. Se mantiene como campo obligatorio, como en el frame.
- **«Omitir por ahora»:** RF-02 E lo nombra para el SOAT no vigente; se ofrece siempre, porque RF-02 D permite salir en este paso y quedar como pasajero `ACTIVO`.
- **Franja ámbar de 05-C:** agregada para explicar que omitir no pierde la cuenta. No está en el README.
- **Chip «Vigente»** y su umbral (más de 15 días para la fecha de fin), como en P16. Con 15 días o menos se mostraría «Vence en N días», pero RN-36 permite registrar con un SOAT por vencer.
- **«Puedo ayudar a subir y bajar del vehículo»:** mismo texto propuesto en P16 para `ayuda_abordaje`.
- **Placas de moto:** «MT4-512», como en P16, porque las placas reales de moto («1234-AB») no pasan `@PlacaPeru`.
- **Fecha de hoy en los ejemplos:** jue 29/10/2026, como en P09, P11 y P16.

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| v1.1 | 05-A | Contexto común + 05-A (con screen.jpeg y P16 v2.1 adjuntos) | — |

### Decisiones de flujo

Propuestas el 2026-11-21:

- **Entrada:** P04 con «Tengo vehículo» marcado (token `REGISTRATION` o `SESSION`), o «Registrar vehículo» en el perfil de un pasajero (P13, RF-14) y en el modal de cambio de modo sin vehículo (RN-48). Desde el perfil, el encabezado es de flujo («←» + «Registrar vehículo») y no lleva la barra «Paso 3 de 3».
- **«Terminar»:** valida en el cliente, sube las fotos (`POST /files`, `FOTO_VEHICULO` y `FOTO_SOAT`) y envía `POST /vehicles`. Con éxito, el usuario suma el rol `CONDUCTOR`, el vehículo queda `ACTIVO` y se abre el dashboard en modo conductor (RF-02 C). Desde el perfil, vuelve a P14 con el toast «Vehículo registrado».
- **«Omitir por ahora»:** no guarda nada del vehículo y abre el dashboard en modo pasajero (RF-02 D y E). Desde el perfil, este botón no aparece; se sale con «←».
- **«←» con datos cargados:** diálogo «¿Descartar los datos del vehículo?» con «Descartar» y «Seguir editando» (no se diseña).
- **Cambiar el tipo a Moto:** la tarjeta de accesibilidad desaparece y los checks se envían en `false` (RN-18, decisión de 16-C).
- **Errores de la API:** en su campo (`PLATE_ALREADY_REGISTERED`) o en la franja del SOAT (`SOAT_NOT_VALID`), como en P16-B.

### Mensajes de validación (para la implementación)

Son los mismos de P16 ([prompt.md](../P16-ActualizarVehiculo/prompt.md), «Mensajes de validación») salvo la foto del vehículo, que aquí es opcional, más el DNI del propietario:

| Campo | Regla | Mensaje |
| --- | --- | --- |
| Foto del vehículo | Opcional; si llega, JPG o PNG de hasta 5 MB (RN-06) | "La foto del vehículo no es válida" |
| DNI del propietario | Obligatorio, 8 dígitos | "El DNI del propietario es obligatorio" (nuevo) / "El DNI debe tener 8 dígitos" |
| Placa, tipo, marca, modelo, color, año, asientos, accesibilidad, términos y SOAT | RN-07 a RN-09, RN-18, RN-36 | Los de la tabla de P16 |
