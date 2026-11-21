# Prompt de diseño — P04 Completar perfil

Prompt para rediseñar la pantalla 04 del prototipo con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Es un rediseño (modo B): se adjunta [screen.jpeg](screen.jpeg) como referencia de layout y se aplican los cambios que pide el README. Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 04-A, y luego cada variante duplicando el frame correcto.

Fuentes: README raíz (RF-02, casuísticas A, B, C y D; RN-04, RN-05, RN-17, RN-21, RN-22, RNF-13; sección 5.1, `usuarios.asistencia_movilidad`; secciones 1, 1.2 y 11), `app-movilidad-colaborativa-api/README.md` (mensajes de `POST /auth/complete-profile`), `app-utp-movilidad-colaborativa/src/styles/index.css`, el frame [screen.jpeg](screen.jpeg) y las capturas aprobadas de P16 (v2.1: campos grises, checkboxes y tarjetas de sección) como referencia de estilo.

**Qué se conserva del frame:** la flecha «←», el título «Completa tu perfil» con su descripción, el avatar circular con el botón de cámara, los campos con etiqueta encima e icono a la izquierda (nombres, apellidos, departamento, distrito y sede), el bloque «Tengo vehículo» y el botón primario al final.

**Qué cambia y por qué:**

| Frame actual | Cambio | Regla |
| --- | --- | --- |
| «ShareCar» junto a la flecha | «←» + logotipo «ColaboraCar» y el indicador «Paso 2 de 3» | Sección 11; RF-02 (flujo en tres pasos) |
| Campos blancos con borde rojizo | Campos grises #EEEEEE de 52 px, como P16 | Coherencia con las pantallas aprobadas |
| «Sede Universitaria» | «Sede universitaria» (solo la primera letra en mayúscula) | — |
| Sin asistencia de movilidad | Tarjeta «ASISTENCIA DE MOVILIDAD (OPCIONAL)» con interruptor «Necesito asistencia de movilidad»; al activarlo: tipo, nota de hasta 120 caracteres y consentimiento obligatorio | RF-02 B, RN-17, RNF-13 |
| Foto sin indicación | «Foto de perfil» con la ayuda «Obligatoria · JPG o PNG, hasta 5 MB» | RN-04 |
| «Tengo vehículo» sin explicación | Ayuda «Después registrarás tu vehículo y su SOAT.»; el botón cambia a «Continuar» si está marcado | RF-02 C |

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
- Rojo suave #FFDAD7 con texto #BD0016 para botones secundarios y opciones seleccionadas;
  borde suave #E5BEBB para opciones contorneadas.
- Superficie gris #EEEEEE para campos y bloques internos (radio 12px, alto 52px).
- Texto principal #1B1B1B, secundario marrón #5B403D, apagado #5F5E5E, placeholder #686C75.
- Verde para estados positivos: texto #1B7F3B sobre fondo #E6F4EA.
- Tipografía Inter. Etiquetas de sección en mayúsculas pequeñas con tracking
  (ej. "ASISTENCIA DE MOVILIDAD"), etiquetas de campo 14px semibold, títulos 28px semibold.
- Iconos de línea (Material Symbols Outlined). Checkboxes cuadrados de 22px con radio 6px:
  marcados en rojo #BD0016 con check blanco, sin marcar blancos con borde de 2px #5F5E5E.
  Interruptores (switch) de 52 × 32 px: activo rojo #BD0016, inactivo gris #C8C8C8.
- Encabezado de registro: flecha "←" a la izquierda y el logotipo "ColaboraCar" en rojo
  #BD0016 bold (solo el texto), y debajo una barra de progreso de 3 segmentos con el
  segundo activo y el texto "Paso 2 de 3". Sin campana, avatar ni menú hamburguesa.
- Sin barra de navegación inferior.

Reglas que el diseño debe reflejar:
- Todos los datos son obligatorios, incluida la foto, excepto "Tengo vehículo" y la
  asistencia de movilidad.
- Departamento, distrito y sede se eligen en cascada: el distrito depende del
  departamento y la sede del distrito.
- La asistencia de movilidad es un dato sensible y opcional: solo se guarda con el
  consentimiento marcado, y solo la verán los conductores de los viajes que reserve
  el usuario. Nunca otros pasajeros.
- Nada de "ShareCar", DNI, teléfono, chat ni correos que no sean @utp.edu.pe.
- Textos en UTF-8: tildes, ñ, "·" y "•" deben verse correctos
  (ej. "Jorge", "Paredes", "Piérola", "vehículo", "movilidad").
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 04-A — Formulario completo, sin asistencia

Adjuntar [screen.jpeg](screen.jpeg) en Stitch y elegir el modo **App**. Guardar como `v1.1.png`.

```text
Usa la imagen adjunta solo como referencia de layout y reemplaza su encabezado: no copies
"ShareCar" ni dupliques el encabezado. Usuario: Jorge P., estudiante que se está registrando.
Es una pantalla larga con scroll: muéstrala completa.

1. Encabezado de registro: "←", "ColaboraCar" y la barra "Paso 2 de 3".

2. Título "Completa tu perfil" y descripción "Solo unos datos más para empezar a viajar."

3. Avatar circular de 112 px gris #EEEEEE con las iniciales "JP" en #5B403D y botón
   circular rojo con icono de cámara abajo a la derecha. Debajo, centrado:
   "Foto de perfil" y en 13px #5F5E5E "Obligatoria · JPG o PNG, hasta 5 MB".

4. Campos grises con icono a la izquierda y etiqueta encima:
   - "Nombres": "Jorge Luis".
   - "Apellidos": "Paredes Vega".
   - "Departamento": selector "La Libertad".
   - "Distrito": selector "Trujillo".
   - "Sede universitaria": selector "UTP Sede Trujillo".

5. Tarjeta "ASISTENCIA DE MOVILIDAD (OPCIONAL)" (blanca, borde #E1E1E1), con icono de
   accesibilidad:
   - Fila con el texto "Necesito asistencia de movilidad" en 16px semibold y, a la derecha,
     un interruptor apagado (gris).
   - Debajo en 13px #5F5E5E: "Si usas silla de ruedas, muletas o andador, avísalo para que
     el conductor se prepare. Es opcional."

6. Bloque gris #EEEEEE con checkbox sin marcar "Tengo vehículo" en 16px semibold y debajo
   "Después registrarás tu vehículo y su SOAT." en 13px #5F5E5E.

7. Botón primario rojo a todo el ancho: "Terminar".

Quita "ShareCar", los bordes rojizos de los campos y "Sede Universitaria" con U mayúscula.
```

## Frame 04-B — Con asistencia de movilidad

```text
Duplica el frame 04-A y cambia solo la tarjeta "ASISTENCIA DE MOVILIDAD (OPCIONAL)":
1. El interruptor "Necesito asistencia de movilidad" está encendido (rojo #BD0016).
2. Debajo aparece "Tipo de asistencia" con tres opciones en columna, cada una como
   tarjeta seleccionable de 52 px con radio 12px e icono a la izquierda:
   - "Silla de ruedas" seleccionada: fondo #FFDAD7, borde 1,5px #BD0016, texto #BD0016
     semibold y un círculo con check a la derecha.
   - "Muletas o andador" sin seleccionar: fondo blanco, borde #E1E1E1.
   - "Otra" sin seleccionar.
3. Campo gris "Nota para el conductor (opcional)", de 2 líneas, con el texto
   "Silla plegable, puedo pasar al asiento solo." y el contador "43/120" abajo a la derecha.
4. Checkbox marcado (obligatorio): "Autorizo compartir esta información con los conductores
   de los viajes que reserve".
5. Nota con icono de candado en 13px #5F5E5E: "Es un dato sensible. Solo lo verán los
   conductores de tus viajes, nunca otros pasajeros. Puedes quitarlo cuando quieras
   desde tu perfil."
Mantén igual el resto de la pantalla. No repitas secciones.
```

## Frame 04-C — Errores de validación

```text
Duplica el frame 04-B y cambia solo lo siguiente:
1. Campo "Apellidos" vacío (placeholder "Ej. Pérez"), borde rojo #BD0016 de 1,5 px y
   debajo, texto rojo con icono de alerta: "Los apellidos son obligatorios".
2. Campo "Sede universitaria" vacío (placeholder "Selecciona tu sede"), borde rojo y debajo:
   "La sede es obligatoria".
3. En la tarjeta de asistencia, el checkbox de consentimiento está sin marcar, con borde
   rojo, y debajo: "Para guardar tu asistencia debes autorizar compartirla, o apaga
   la opción.".
4. Avatar sin las iniciales (icono de persona) con borde rojo y, debajo de la ayuda,
   "Agrega tu foto de perfil".
Mantén igual lo demás. Una sola línea de error por campo. No repitas secciones.
```

## Frame 04-D — Tengo vehículo

```text
Duplica el frame 04-A y cambia solo lo siguiente:
1. El checkbox "Tengo vehículo" está marcado y el bloque tiene borde 1,5px #BD0016.
2. El botón primario dice "Continuar" con una flecha "→" a la derecha.
Mantén igual lo demás.
```

---

## Supuestos a validar

- **Indicador «Paso 2 de 3»:** RF-02 define el registro en tres pasos (03, 04, 05), pero ningún frame muestra progreso. Para un pasajero sin vehículo el flujo termina en el paso 2; el indicador sigue diciendo «de 3» porque el usuario aún no ha decidido.
- **Interruptor en vez de checkbox** para «Necesito asistencia de movilidad»: abre y cierra la sección. El README dice «sección opcional» sin control concreto.
- **Opciones de tipo como tarjetas** con icono, en lugar de un selector desplegable: tres opciones caben y se eligen con un toque (mejor para usuarios con movilidad reducida en las manos).
- **Nota de hasta 120 caracteres**, opcional (RN-17 no la exige).
- **Mensaje sin consentimiento:** no existe en la API (la asistencia todavía no se recibe en `POST /auth/complete-profile`). Se propone «Para guardar tu asistencia debes autorizar compartirla, o apaga la opción.» (nuevo).
- **Mensaje sin foto:** «Agrega tu foto de perfil» (nuevo). Hoy la API acepta el perfil sin foto hasta que exista `POST /files`.
- **Botón «Continuar»** con «Tengo vehículo» marcado; «Terminar» sin marcar. El README dice que al guardar se abre «Datos del vehículo».

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| v1.1 | 04-A | Contexto común + 04-A (con screen.jpeg adjunto) | — |

### Decisiones de flujo

Propuestas el 2026-11-21:

- **Entrada:** P03 (Registro) con el token `REGISTRATION`, o el login de una cuenta en `PERFIL_PENDIENTE` (RF-01, RF-02 D).
- **«←»:** vuelve a P01 (la cuenta ya existe y queda en `PERFIL_PENDIENTE`); no se puede volver a editar el correo de P03.
- **Apagar el interruptor** después de llenar la sección: se descartan el tipo, la nota y el consentimiento sin preguntar (todavía no se guardó nada).
- **«Terminar»:** guarda el perfil (`POST /auth/complete-profile`, con `mobilityAssistance` si la sección está activa), la cuenta pasa a `ACTIVO` y se abre el dashboard en modo pasajero.
- **«Continuar»** (con «Tengo vehículo»): guarda el perfil igual y abre P05. Si el usuario sale en P05, ya es pasajero `ACTIVO` (RF-02 D).

### Mensajes de validación (para la implementación)

| Campo | Regla | Mensaje |
| --- | --- | --- |
| Foto de perfil | Obligatoria (RN-04) | "Agrega tu foto de perfil" (nuevo) |
| Foto de perfil | JPG o PNG de hasta 5 MB | "La foto de perfil no es válida" |
| Nombres | Obligatorio | "Los nombres son obligatorios" |
| Nombres | Al menos una letra, máx. 60 (RN-05) | "Los nombres deben tener al menos una letra y como máximo 60 caracteres" |
| Apellidos | Obligatorio | "Los apellidos son obligatorios" |
| Apellidos | Al menos una letra, máx. 60 (RN-05) | "Los apellidos deben tener al menos una letra y como máximo 60 caracteres" |
| Departamento | Obligatorio | "El departamento es obligatorio" |
| Distrito | Obligatorio / del departamento | "El distrito es obligatorio" / "El distrito no pertenece al departamento" |
| Sede | Obligatoria / del distrito | "La sede es obligatoria" / "La sede no pertenece al distrito" |
| Tipo de asistencia | Obligatorio con la sección activa (RN-17) | "Elige el tipo de asistencia" (nuevo) |
| Nota | Máx. 120 caracteres (RN-17) | "La nota debe tener como máximo 120 caracteres" (nuevo) |
| Consentimiento | Obligatorio con la sección activa (RN-17) | "Para guardar tu asistencia debes autorizar compartirla, o apaga la opción." (nuevo) |
