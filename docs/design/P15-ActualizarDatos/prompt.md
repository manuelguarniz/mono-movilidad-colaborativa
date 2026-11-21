# Prompt de diseño — P15 Actualizar datos

Prompt para rediseñar la pantalla 15 del prototipo con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Es un rediseño (modo B): se adjunta [screen.jpeg](screen.jpeg) como referencia de layout y la captura aprobada de P16 [v2.1](../P16-ActualizarVehiculo/v2.1.png) como referencia de estilo del formulario. Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 15-A, y luego cada variante duplicando el frame correcto.

Fuentes: README raíz (RF-14, escenario Actualizar datos; RN-14, RN-17, RN-21, RN-22, RN-48, RNF-13; sección 5.1, `usuarios`; secciones 1.2 y 11), `app-movilidad-colaborativa-api/README.md` (mensajes de `PUT /users/me`), `app-utp-movilidad-colaborativa/src/styles/index.css`, el frame [screen.jpeg](screen.jpeg), las capturas aprobadas de P16 (v2.1) y P13 (v1.1), y la tarjeta de asistencia de [P04](../P04-CompletarPerfil/prompt.md) (04-B), que debe verse igual.

**Qué se conserva del frame:** la foto de perfil con el botón de cámara y la leyenda, los campos con etiqueta e icono (nombres, apellidos, teléfono con prefijo +51, correo institucional bloqueado y documento bloqueado), y los botones «Guardar cambios» y «Descartar cambios».

**Qué cambia y por qué:**

| Frame actual | Cambio | Regla |
| --- | --- | --- |
| «ShareCar» con flecha | Encabezado de flujo «←» + «Actualizar datos», como P16 | Sección 11; pantalla de flujo |
| «Actualizar Datos» e icono de ajustes junto al título | Sin título repetido ni icono; solo la descripción «Mantén tu información personal al día.» | — |
| Tarjeta «MODALIDAD ACTIVA» con «Modo Dual» | Se quita: el modo se cambia en el perfil (P13, P14) con un modal | RN-48 |
| Foto real de la usuaria | Avatar gris con iniciales «LR», como P13 | Datos compartidos con P13–P21 |
| Campos blancos con borde | Campos grises #EEEEEE de 52 px, como P16; los bloqueados con candado y texto #5F5E5E | Coherencia con P16 |
| «Verificado» junto al correo | Se quita el chip; ayuda «El correo institucional no se puede cambiar.» | RN-14; la app no verifica más que el OTP |
| «Documento de Identidad (DNI/CE)» bloqueado, «Validado por RENIEC» | Bloqueado con tipo visible («DNI · 72345678») y ayuda «Se registró una sola vez y no se puede modificar.»; sin RENIEC. Si aún no lo tiene: selector DNI/CE y número, con aviso | RN-14; sección 1.1 (sin validación externa) |
| Sin asistencia de movilidad | Tarjeta «ASISTENCIA DE MOVILIDAD (OPCIONAL)» igual que P04, editable y con «Quitar asistencia» | RF-14, RN-17 |
| «Guardar Cambios» | «Guardar cambios» | — |

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
- Rojo suave #FFDAD7 con texto #BD0016 para botones secundarios y opciones seleccionadas.
- Superficie gris #EEEEEE para campos y bloques internos (radio 12px, alto 52px).
  Campos bloqueados: mismo gris, texto #5F5E5E e icono de candado a la derecha.
- Texto principal #1B1B1B, secundario marrón #5B403D, apagado #5F5E5E, placeholder #686C75.
- Ámbar para avisos: texto #8A5A00 sobre fondo #FFF4D6.
- Tipografía Inter. Etiquetas de sección en mayúsculas pequeñas con tracking
  (ej. "DATOS PERSONALES"), etiquetas de campo 14px semibold, títulos 22px semibold.
- Iconos de línea (Material Symbols Outlined). Checkboxes cuadrados de 22px con radio 6px:
  marcados en rojo #BD0016 con check blanco, sin marcar blancos con borde de 2px #5F5E5E.
  Interruptores (switch) de 52 × 32 px: activo rojo #BD0016, inactivo gris #C8C8C8.
- Avatares: círculos grises #EEEEEE con las iniciales en #5B403D, nunca fotos.
- Encabezado de flujo (pantalla sin barra de navegación inferior): flecha "←" a la izquierda
  y el título "Actualizar datos" en 22px semibold (solo la primera letra en mayúscula).
  Sin logotipo, campana, avatar ni menú hamburguesa.
- Sin barra de navegación inferior.

Reglas que el diseño debe reflejar:
- Todos los datos son obligatorios, incluida la foto, salvo la asistencia de movilidad.
- El correo no se edita. El tipo y el número de documento se ingresan una sola vez y
  luego quedan bloqueados. El teléfono sí se puede cambiar.
- El modo pasajero/conductor NO se cambia aquí: no agregues "Modalidad activa",
  "Modo Dual" ni un selector de modo.
- La asistencia de movilidad es un dato sensible y opcional: solo se guarda con el
  consentimiento marcado, y solo la ven los conductores de los viajes que reserve el usuario.
- La sede y la dirección de residencia no se editan aquí.
- Nada de "ShareCar", "Verificado", "RENIEC", "Validado", "Modo Dual", cambio de contraseña,
  chat ni correos que no sean @utp.edu.pe.
- Textos en UTF-8: tildes, ñ, "·" y "•" deben verse correctos
  (ej. "Lucía", "Rojas", "Teléfono", "movilidad").
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 15-A — Datos de la pasajera (documento registrado, sin asistencia)

Adjuntar [screen.jpeg](screen.jpeg) y la captura aprobada de P16 [v2.1](../P16-ActualizarVehiculo/v2.1.png), y elegir el modo **App**. Guardar como `v1.1.png`.

```text
Usa la primera imagen adjunta como referencia de layout y la segunda (actualizar vehículo,
ya aprobada) como referencia exacta de estilo para los campos, las tarjetas y los botones.
No copies el encabezado "ShareCar" ni la tarjeta "MODALIDAD ACTIVA", y no dupliques el
encabezado. Usuaria: pasajera Lucía R. Es una pantalla larga con scroll: muéstrala completa.

1. Encabezado de flujo: "←" y "Actualizar datos".

2. Texto 14px #5B403D: "Mantén tu información personal al día."

3. Avatar circular de 112 px gris #EEEEEE con "LR" y botón circular rojo con cámara abajo a
   la derecha. Debajo, centrado: "Toca para cambiar tu foto de perfil" en 13px #5F5E5E.

4. Etiqueta "DATOS PERSONALES" y campos grises con icono:
   - "Nombres": "Lucía Fernanda".
   - "Apellidos": "Rojas Castillo".
   - "Teléfono": prefijo fijo "+51" separado por una línea vertical y "987 654 321".
   - "Correo institucional" (bloqueado, con candado): "lucia.rojas@utp.edu.pe". Debajo, 13px
     #5F5E5E: "El correo institucional no se puede cambiar."
   - "Documento de identidad" (bloqueado, con candado): "DNI · 72345678". Debajo:
     "Se registró una sola vez y no se puede modificar."

5. Tarjeta "ASISTENCIA DE MOVILIDAD (OPCIONAL)" (blanca, borde #E1E1E1), con icono de
   accesibilidad:
   - Fila "Necesito asistencia de movilidad" en 16px semibold con interruptor apagado.
   - Debajo en 13px #5F5E5E: "Si usas silla de ruedas, muletas o andador, avísalo para que
     el conductor se prepare. Es opcional."

6. Botón primario rojo a todo el ancho con icono de guardar: "Guardar cambios", y debajo
   el botón de texto gris "Descartar cambios".

Quita "ShareCar", "Actualizar Datos" como título grande, el icono de ajustes, "MODALIDAD
ACTIVA", "Modo Dual", "Verificado", "Validado por RENIEC" y la foto real.
```

## Frame 15-B — Primer registro del documento y asistencia declarada

```text
Duplica el frame 15-A y cambia solo lo siguiente. Usuario: pasajero Jorge P.
1. Avatar con "JP". Campos: "Nombres" "Jorge Luis", "Apellidos" "Paredes Vega",
   "Teléfono" "+51" "956 214 873", "Correo institucional" "jorge.paredes@utp.edu.pe".
2. "Documento de identidad" ya no está bloqueado: dos campos lado a lado, "Tipo" (selector
   "DNI", ancho 120 px) y "Número" (editable, "71842365"). Debajo, franja ámbar #FFF4D6 con
   texto #8A5A00 e icono de información: "Revisa bien: solo podrás ingresarlo una vez."
3. Tarjeta de asistencia con el interruptor encendido (rojo) y, debajo, igual que la
   pantalla de "Completa tu perfil":
   - "Tipo de asistencia": tres tarjetas seleccionables de 52 px; "Silla de ruedas"
     seleccionada (fondo #FFDAD7, borde 1,5px #BD0016, texto #BD0016, círculo con check),
     "Muletas o andador" y "Otra" sin seleccionar.
   - Campo de 2 líneas "Nota para el conductor (opcional)": "Silla plegable, puedo pasar
     al asiento solo." con contador "43/120".
   - Checkbox marcado: "Autorizo compartir esta información con los conductores de los
     viajes que reserve".
   - Nota con candado: "Es un dato sensible. Solo lo verán los conductores de tus viajes,
     nunca otros pasajeros."
   - Botón de texto rojo #BD0016 con icono de papelera: "Quitar asistencia".
   - Nota 13px #5F5E5E con icono de información: "Los cambios no modifican las reservas
     que ya hiciste."
Mantén igual el encabezado y los botones. No repitas secciones.
```

## Frame 15-C — Errores de validación

```text
Duplica el frame 15-B y cambia solo lo siguiente:
1. "Teléfono": "95621487", borde rojo #BD0016 de 1,5 px y debajo, texto rojo con icono de
   alerta: "El teléfono debe tener el formato +51 seguido de 9 dígitos".
2. "Número" del documento: "7184236", borde rojo y debajo: "El DNI debe tener 8 dígitos".
   La franja ámbar sigue debajo del error.
3. Checkbox de consentimiento sin marcar, con borde rojo y debajo: "Para guardar tu
   asistencia debes autorizar compartirla, o apaga la opción."
Mantén igual lo demás. Una sola línea de error por campo. No repitas secciones.
```

## Frame 15-D — Modal: quitar asistencia

```text
Usa el mismo sistema visual del frame seleccionado (15-B): Inter, #BD0016, #FFDAD7,
#EEEEEE, radios 12 y 16 px.
Sobre el frame 15-B atenuado (overlay negro al 40 %), una hoja inferior (bottom sheet)
blanca con radio superior 24px y un asa gris arriba:
- Icono de accesibilidad en un círculo rojo suave #FFDAD7 de 56 px.
- Título 20px semibold: "¿Quitar tu necesidad de asistencia?"
- Texto 14px #5B403D: "Se borrarán el tipo y la nota de tu perfil, y los conductores ya
  no la verán en tus próximas reservas. Tu reserva actual conserva la información."
- Botón primario rojo a todo el ancho: "Quitar asistencia".
- Botón secundario gris #EEEEEE a todo el ancho: "Cancelar".
```

---

## Supuestos a validar

- **Sin «Modalidad activa»:** RN-48 y la tabla de la sección 11 mueven el cambio de modo al perfil. Hoy `PUT /users/me` todavía exige `activeMode` y el frontend lo muestra en este formulario: al implementar el rediseño hay que enviar el modo actual sin mostrarlo, o quitarlo del contrato.
- **Documento con tipo visible** («DNI · 72345678») cuando ya está registrado.
- **Franja «solo podrás ingresarlo una vez»:** agregada para RN-14; no está en el README.
- **Asistencia en `PUT /users/me`:** el contrato dice que `mobilityAssistance` es de solo lectura hasta que P15 tenga la sección. El rediseño la requiere en la solicitud (tipo, nota y consentimiento).
- **«Quitar asistencia» con confirmación (15-D):** RN-17 dice que al quitarla se borran el tipo y la nota; el modal evita borrarla por error. Apagar el interruptor equivale a «Quitar asistencia» si ya estaba guardada.
- **«Tu reserva actual conserva la información»:** sale de RN-21 (la reserva guarda una copia).
- **Sede y dirección de residencia:** no se editan aquí (sección 1.1: «Cambiar sede» y «Modificar casa» están fuera del alcance).
- **Nota y mensaje de consentimiento:** los mismos de P04 (nuevos).

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| v1.1 | 15-A | Contexto común + 15-A (con screen.jpeg y P16 v2.1 adjuntos) | — |

### Decisiones de flujo

Propuestas el 2026-11-21:

- **Entrada:** «Actualizar datos» en P13 y P14, y el enlace «Declarar en Actualizar datos» de la tarjeta de asistencia de P13. Desde ese enlace, la pantalla abre con el scroll en la tarjeta de asistencia.
- **«Guardar cambios»:** valida en el cliente y envía `PUT /users/me`. Con éxito vuelve al perfil con el toast «Datos actualizados». Si se registró el documento, al volver ya aparece bloqueado.
- **«Quitar asistencia»** (o apagar el interruptor con una asistencia ya guardada): abre 15-D. «Quitar asistencia» en el modal solo cambia el formulario; se guarda con «Guardar cambios».
- **«Descartar cambios» o «←» con cambios sin guardar:** diálogo «¿Descartar los cambios?» con «Descartar» y «Seguir editando», como en P16 (no se diseña).
- **Error de la API:** el mensaje va debajo de su campo; los demás, en una franja rojo suave sobre los botones.

### Mensajes de validación (para la implementación)

| Campo | Regla | Mensaje |
| --- | --- | --- |
| Foto de perfil | Obligatoria (RN-14) | "Agrega tu foto de perfil" (nuevo) |
| Nombres | Obligatorio / al menos una letra, máx. 60 | "Los nombres son obligatorios" / "Los nombres deben tener al menos una letra y como máximo 60 caracteres" |
| Apellidos | Obligatorio / al menos una letra, máx. 60 | "Los apellidos son obligatorios" / "Los apellidos deben tener al menos una letra y como máximo 60 caracteres" |
| Teléfono | Obligatorio, +51 y 9 dígitos | "El teléfono es obligatorio" / "El teléfono debe tener el formato +51 seguido de 9 dígitos" |
| Tipo de documento | Obligatorio la primera vez, DNI o CE (RN-14) | "El tipo de documento es obligatorio" / "El tipo de documento no es válido" |
| Número de documento | Obligatorio la primera vez | "El número de documento es obligatorio" |
| Número de documento | DNI: 8 dígitos; CE: 8 a 12 letras o números | "El DNI debe tener 8 dígitos" / "El carné de extranjería debe tener entre 8 y 12 letras o números" |
| Tipo de asistencia | Obligatorio con la sección activa (RN-17) | "Elige el tipo de asistencia" (nuevo) |
| Nota | Máx. 120 caracteres (RN-17) | "La nota debe tener como máximo 120 caracteres" (nuevo) |
| Consentimiento | Obligatorio con la sección activa (RN-17) | "Para guardar tu asistencia debes autorizar compartirla, o apaga la opción." (nuevo) |
