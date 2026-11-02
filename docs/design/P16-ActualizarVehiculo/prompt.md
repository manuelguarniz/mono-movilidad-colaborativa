# Prompt de diseño — P16 Actualizar vehículo y SOAT

Prompt para rediseñar la pantalla 16 del prototipo con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Es un rediseño (modo B): se adjunta [screen.jpeg](screen.jpeg) como referencia de layout (insignia de estado, título con descripción, foto del vehículo con la placa, formulario, confirmaciones y botones al final) y se aplican los cambios que pide el README. Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 16-A, y luego cada variante duplicando el frame correcto.

Fuentes: README raíz (RF-14, escenario Vehículo; RF-02, casuística C; RN-07, RN-08, RN-09, RN-15, RN-16, RN-18, RN-36, RN-37; sección 5.1, `usuarios.vehiculo` y `archivos`; secciones 1.1 y 11), `app-movilidad-colaborativa-api/README.md` (validación de `PUT /vehicles/me` y errores), `app-utp-movilidad-colaborativa/src/styles/index.css`, el frame [screen.jpeg](screen.jpeg) y las capturas aprobadas de P09 (v2.1) y P11 (v2.3) como referencia de estilo.

**Qué se conserva del frame:** la insignia de estado arriba del título, el título con su descripción, la foto del vehículo con la placa superpuesta y la fila «Foto actual del auto / Cambiar foto», los campos grises con icono a la izquierda, «Año» y «Plazas» lado a lado, el bloque gris de confirmaciones, la nota informativa y los botones «Guardar cambios» y «Descartar cambios».

**Qué cambia y por qué:**

| Frame actual | Cambio | Regla |
| --- | --- | --- |
| «ShareCar» en rojo con flecha | Encabezado de flujo «←» + «Actualizar vehículo», sin logotipo ni barra inferior (como P09 y P11) | Sección 11; pantalla de flujo |
| «Vehículo Registrado Activo» | Chip verde «Vehículo activo» | Sección 5.1 (`vehiculo.estado`) |
| Insignia «En Servicio» sobre la foto | Se quita | No es un estado del README |
| «Marca y Modelo» en un solo campo | Campos «Marca» y «Modelo» separados, más «Color» | RF-14, API (`brand`, `model`, `color`) |
| Tipo «Automóvil / Sedán» | Selector con Sedán, Hatchback, SUV, Van y Moto | Sección 5.1 (`vehiculo.tipo`) |
| «Plazas disponibles · 3 asientos» | «Asientos para pasajeros» con stepper − 4 + y ayuda «De 1 a 10» | RN-09; 4 plazas como en P11 y P09 |
| Sin accesibilidad | Sección «ACCESIBILIDAD (OPCIONAL)» con dos checks; con tipo Moto se deshabilitan | RN-18 |
| Sin SOAT | Sección «SOAT» obligatoria: aseguradora, póliza, inicio, fin y foto del certificado, con la nota de declaración | RF-14, RN-15, RN-36 |
| «…en ShareCar» en el check de términos | «…en ColaboraCar»; solo este check es obligatorio | RN-16 |
| «Los cambios en la capacidad o modelo se reflejarán…» | «Los cambios se aplican también a tus viajes publicados. Las reservas ya hechas conservan los datos anteriores.» | RF-14 |
| «Guardar Cambios» con mayúsculas | «Guardar cambios» | — |

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
  Hover/pressed #A30013. Rojo acento #E6212A para puntos e indicadores.
- Rojo suave #FFDAD7 con texto #BD0016 para botones secundarios y chips activos;
  borde suave #E5BEBB para chips contorneados.
- Superficie gris #EEEEEE para campos y bloques internos (radio 12px, alto 52px).
- Texto principal #1B1B1B, secundario marrón #5B403D, apagado #5F5E5E, placeholder #686C75.
- Verde para estados positivos: texto #1B7F3B sobre fondo #E6F4EA.
- Ámbar para avisos: texto #8A5A00 sobre fondo #FFF4D6.
- Tipografía Inter. Etiquetas de sección en mayúsculas pequeñas con tracking
  (ej. "SOAT"), etiquetas de campo 14px semibold, títulos 28px semibold.
  Cifras y fechas con números tabulares, nunca en fuente monoespaciada.
- Iconos de línea (Material Symbols Outlined). Checkboxes cuadrados de 22px con radio 6px:
  marcados en rojo #BD0016 con check blanco, sin marcar con borde #5F5E5E.
- Encabezado de flujo (pantalla sin barra de navegación inferior): flecha "←" para volver
  a la izquierda y el título "Actualizar vehículo" en 22px semibold (solo la primera letra
  en mayúscula). Sin logotipo, campana ni avatar.
- Sin barra de navegación inferior.

Reglas que el diseño debe reflejar:
- La placa sigue el formato peruano "ABC-123" y se muestra en mayúsculas.
- Año de fabricación desde 2000. Asientos para pasajeros de 1 a 10.
- Todos los campos son obligatorios, incluidas la foto del vehículo y el SOAT.
  Son opcionales solo los checks de accesibilidad y "Soy el propietario…".
- La accesibilidad es del vehículo: "Puedo llevar una silla de ruedas plegable" hace que el
  vehículo sea apto. Una moto no puede marcar ningún check de accesibilidad.
- El SOAT es una declaración del conductor: la app no lo verifica con la aseguradora.
  La foto del certificado solo la ve su dueño.
- Fechas en formato DD/MM/AAAA.
- Nada de "ShareCar", "En Servicio", validación automática del SOAT, consulta a SBS
  o APESEG, chat ni correos que no sean @utp.edu.pe.
- Textos en UTF-8: tildes, ñ, "·", "•" y "−" deben verse correctos
  (ej. "Rímac", "Pacífico", "póliza", "vehículo").
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 16-A — Formulario completo (SOAT vigente)

Adjuntar [screen.jpeg](screen.jpeg) en Stitch y elegir el modo **App**.

```text
Usa la imagen adjunta solo como referencia de layout y reemplaza su encabezado: no copies
el logotipo "ShareCar" ni dupliques el encabezado. Usuario: conductor Carlos M.
Es una pantalla larga con scroll: muéstrala completa.

1. Encabezado de flujo: "←" y "Actualizar vehículo".

2. Chip verde con icono de check "Vehículo activo". Debajo, el título "Actualizar vehículo"
   no se repite: en su lugar, el texto gris "Mantén al día los datos de tu vehículo y tu SOAT
   para seguir publicando viajes."

3. Foto del vehículo (radio 16px, alto 200 px): un Toyota Yaris sedán blanco estacionado,
   con la placa "ABC-123" en una etiqueta blanca abajo a la izquierda. Sin la insignia
   "En Servicio". Debajo, fila gris: icono de cámara, "Foto del vehículo" y "JPG o PNG,
   hasta 5 MB", y a la derecha el botón secundario rojo suave "Cambiar foto".

4. Etiqueta de sección "DATOS DEL VEHÍCULO" y estos campos grises con icono a la izquierda:
   - "Placa": "ABC-123", con la ayuda "Formato ABC-123" a la derecha de la etiqueta.
   - "Tipo de vehículo": selector "Sedán" con flecha.
   - "Marca" ("Toyota") y "Modelo" ("Yaris") lado a lado.
   - "Color" ("Blanco") y "Año" ("2021") lado a lado.
   - "Asientos para pasajeros": stepper con botones circulares "−" y "+" y el número "4"
     en el centro; ayuda gris "De 1 a 10. Es el máximo que podrás ofrecer por viaje."

5. Tarjeta "ACCESIBILIDAD (OPCIONAL)" (blanca, borde #E1E1E1), con icono de accesibilidad:
   - Check marcado: "Puedo llevar una silla de ruedas plegable" y debajo en gris
     "Tu vehículo aparecerá como apto en el filtro de accesibles."
   - Check sin marcar: "Puedo ayudar a subir y bajar del vehículo".

6. Tarjeta "SOAT" (blanca, borde #E1E1E1), con icono de escudo y el chip verde "Vigente":
   - "Aseguradora": selector "Rímac Seguros".
   - "Número de póliza": "2401-123456".
   - "Inicio" ("15/03/2026") y "Fin" ("15/03/2027") lado a lado, con icono de calendario.
   - Fila gris con miniatura del certificado, "Certificado del SOAT" y "soat-rimac.jpg ·
     JPG o PNG, hasta 5 MB", y el botón de texto rojo "Cambiar".
   - Nota gris con icono de candado: "Solo tú ves la foto del certificado."
   - Nota gris con icono de información: "Es una declaración tuya: ColaboraCar no verifica
     el SOAT con la aseguradora. Los pasajeros verán «SOAT declarado por el conductor»."

7. Bloque gris "Confirmaciones" con dos checks:
   - Marcado: "Soy el propietario legal o conductor autorizado de este vehículo".
   - Marcado: "Acepto los términos y condiciones para el registro y actualización de
     vehículos en ColaboraCar".

8. Nota gris con icono de información: "Los cambios se aplican también a tus viajes
   publicados. Las reservas ya hechas conservan los datos anteriores."

9. Botón primario rojo a todo el ancho con icono de guardar: "Guardar cambios", y debajo
   el botón de texto gris "Descartar cambios".

Quita "ShareCar", "En Servicio", "Marca y Modelo" en un solo campo y "Plazas disponibles".
```

## Frame 16-B — Errores de validación

```text
Duplica el frame 16-A (v2.1) y cambia solo lo siguiente:
1. Campo "Placa": valor "XYZ-789", borde rojo #BD0016 de 1,5 px y, debajo, texto rojo con
   icono de alerta: "La placa ya está registrada".
2. Tarjeta "SOAT": quita el chip "Vigente". Fechas "Inicio" "10/10/2025" y "Fin"
   "10/10/2026", ambos campos con borde rojo #BD0016. Encima de los campos, una franja
   rojo suave #FFDAD7 con texto #BD0016 e icono de alerta: "Tu SOAT no está vigente.
   No puedes registrar el vehículo sin un SOAT vigente."
3. Campo "Número de póliza": valor "24-1", borde rojo y debajo: "El número de póliza debe
   tener de 6 a 20 letras, números o guiones".
Mantén todo lo demás igual. No repitas secciones ni tarjetas.
```

## Frame 16-C — Tipo moto: sin sección de accesibilidad

Decisión del usuario (2026-11-01): si el vehículo no puede declarar accesibilidad, la opción se retira en lugar de mostrarse deshabilitada. El prompt original (checks atenuados) produjo v3.2; la versión vigente es la corrección de la revisión de v3.2.

```text
Duplica el frame 16-A (v2.1) y cambia solo lo siguiente:
1. "Tipo de vehículo": "Moto".
2. Foto: una moto lineal roja con la placa "1234-AB" en la etiqueta blanca. Campos:
   "Placa" "1234-AB", "Marca" "Honda", "Modelo" "CB190R", "Color" "Rojo", "Año" "2022",
   "Asientos para pasajeros" "1".
3. Tarjeta "ACCESIBILIDAD (OPCIONAL)": los dos checks sin marcar y atenuados (texto
   #686C75, borde #E1E1E1). Debajo, texto gris con icono de información:
   "Una moto no puede marcarse como accesible."
Mantén igual el SOAT, las confirmaciones y los botones. No repitas secciones.
```

## Frame 16-D — SOAT por vencer

```text
Duplica el frame 16-A (v2.1) y cambia solo lo siguiente:
1. Debajo del chip "Vehículo activo" y del texto, una franja ámbar #FFF4D6 con texto #8A5A00,
   radio 12px e icono de alerta: "Tu SOAT vence el 05/11. Renuévalo y actualiza los datos
   para seguir publicando viajes."
2. Tarjeta "SOAT": en lugar del chip verde "Vigente", chip ámbar "Vence en 7 días".
   Fechas "Inicio" "05/11/2025" y "Fin" "05/11/2026".
Mantén todo lo demás igual. No repitas secciones ni tarjetas.
```

---

## Supuestos a validar

- **Texto del segundo check de accesibilidad:** el README solo nombra «Puedo llevar una silla de ruedas plegable» (RN-18) y guarda `ayuda_abordaje` sin etiqueta. Se propone «Puedo ayudar a subir y bajar del vehículo».
- **Asientos:** el ejemplo de la sección 5.1 tiene `plazas: 3`, pero P11 y P09 ya aprobaron un Yaris de 4 plazas. Se usa 4 para que el flujo sea coherente.
- **Año máximo:** RN-08 dice «año actual + 1», y la API valida «hasta el año actual». Hay que alinear uno de los dos; el diseño solo dice «desde 2000».
- **DNI del propietario:** `PUT /vehicles/me` no lo modifica, así que no se muestra. «Soy el propietario…» queda como check opcional (RN-16).
- **Aviso de SOAT por vencer en P16 (16-D):** RF-14 lo pide en el perfil («Tu SOAT vence el DD/MM», con 15 días o menos). Mostrarlo también aquí es un agregado, útil porque P11-B lleva a esta pantalla con «Actualizar SOAT».
- **Chip «Vigente» / «Vence en N días»:** se calcula con la fecha de fin. No está en el README.
- **Placas de moto:** las placas peruanas de moto (p. ej., «1234-AB») no pasan `@PlacaPeru`, que pide tres caracteres, guion opcional y tres o cuatro más (RN-07). Hay que confirmar si la regla debe admitirlas. Mientras tanto, 16-C usa «MT4-512».
- **Accesibilidad con tipo Moto** (decisión del usuario, 2026-11-01): la tarjeta se retira, no se deshabilita. Conviene anotarlo en RN-18 o en la sección 12.1.
- **Fecha de hoy en los ejemplos:** jue 29/10/2026, como en P09 y P11.

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| v1.1 | 16-A | Contexto común + 16-A (con screen.jpeg adjunto) | ⚠️ contenido completo; título con mayúscula, casilla vacía sin borde |
| v2.1 | 16-A | Corrección de v1.1 | ✅ se aprueba 16-A |
| v2.2 | 16-B | Duplicar 16-A (v2.1) + 16-B | ⚠️ franja del SOAT repetida |
| v3.1 | 16-B | Corrección de v2.2 | ✅ |
| v3.2 | 16-C | Duplicar 16-A (v2.1) + 16-C (checks atenuados) | ⚠️ cumple el prompt; el usuario decide retirar la sección |
| v4.1 | 16-C | Corrección de v3.2: sin tarjeta de accesibilidad | ✅ |
| v4.2 | 16-D | Duplicar 16-A (v2.1) + 16-D | ✅ |

### Decisiones de flujo

Propuestas el 2026-11-01:

- **Entrada:** «Actualizar vehículo» en P14 Perfil conductor, «Actualizar SOAT» en P11-B y «Configurar en mi vehículo» en P11. Sin vehículo, el perfil abre P05 en su lugar (RF-14).
- **«Guardar cambios»:** valida en el cliente; si todo está bien, envía `PUT /vehicles/me`. Con éxito, vuelve a P14 con el toast «Vehículo actualizado». Los cambios se copian a los viajes `PUBLICADO` (RF-14).
- **Error de la API:** el mensaje de la API va debajo del campo (`PLATE_ALREADY_REGISTERED`) o en la franja del SOAT (`SOAT_NOT_VALID`), como en 16-B. Otros errores van en una franja rojo suave sobre los botones.
- **«Descartar cambios» o «←» con cambios sin guardar:** diálogo «¿Descartar los cambios?» con «Descartar» y «Seguir editando» (no se diseña).
- **Cambiar el tipo a Moto:** la tarjeta de accesibilidad desaparece y los dos checks se guardan en `false` (RN-18). Al volver a un tipo de auto, la tarjeta reaparece sin marcar (decisión del usuario del 2026-11-01, 16-C).

### Mensajes de validación (para la implementación)

Son los de `app-movilidad-colaborativa-api/README.md` (`PUT /vehicles/me`). El frontend los repite antes de enviar.

| Campo | Regla | Mensaje |
| --- | --- | --- |
| Foto del vehículo | Obligatoria al actualizar (RN-15) | "La foto del vehículo es obligatoria" (nuevo) |
| Foto del vehículo | JPG o PNG de hasta 5 MB | "La foto del vehículo no es válida" |
| Placa | Obligatoria | "La placa es obligatoria" |
| Placa | Formato peruano (RN-07) | "La placa debe tener el formato ABC-123" |
| Placa | Única entre conductores (RN-07) | "La placa ya está registrada" |
| Tipo | Obligatorio | "El tipo de vehículo es obligatorio" |
| Marca | Obligatoria, máx. 40 | "La marca es obligatoria" / "La marca debe tener como máximo 40 caracteres" |
| Modelo | Obligatorio, máx. 40 | "El modelo es obligatorio" / "El modelo debe tener como máximo 40 caracteres" |
| Color | Obligatorio, máx. 30 | "El color es obligatorio" / "El color debe tener como máximo 30 caracteres" |
| Año | Obligatorio, 2000 a año actual (RN-08) | "El año de fabricación es obligatorio" / "El año de fabricación debe estar entre 2000 y el año actual" |
| Asientos | Obligatorios, 1 a 10 (RN-09) | "Las plazas son obligatorias" / "Las plazas deben estar entre 1 y 10" |
| Accesibilidad | Moto sin checks (RN-18) | "Una moto no puede marcarse como accesible" |
| Términos | Obligatorio (RN-16) | "Debes aceptar los términos y condiciones" |
| Aseguradora | Obligatoria, máx. 60 (RN-36) | "La aseguradora es obligatoria" / "La aseguradora debe tener como máximo 60 caracteres" |
| Número de póliza | 6 a 20 letras, números o guiones (RN-36) | "El número de póliza es obligatorio" / "El número de póliza debe tener de 6 a 20 letras, números o guiones" |
| Inicio del SOAT | Obligatoria | "La fecha de inicio del SOAT es obligatoria" |
| Fin del SOAT | Obligatoria, posterior al inicio | "La fecha de fin del SOAT es obligatoria" / "La fecha de fin debe ser posterior a la de inicio" |
| Vigencia | 366 días como máximo (RN-36) | "La vigencia del SOAT no puede superar los 366 días" |
| Vigencia | Inicio ≤ hoy ≤ fin (RN-36) | "Tu SOAT no está vigente. No puedes registrar el vehículo sin un SOAT vigente." |
| Foto del SOAT | Obligatoria, JPG o PNG de hasta 5 MB (RN-36) | "La foto del SOAT es obligatoria" (nuevo) / "La foto del SOAT no es válida" |

### Revisión de v1.1

Formato móvil a 2× (812 × 4286 px).

**Lo que funciona:** sale casi todo el prompt a la primera, sin «ShareCar» y con un solo encabezado.
- Chip verde «Vehículo activo» con la descripción.
- Foto de un Yaris blanco con la placa «ABC-123», sin «En Servicio», y la fila «Cambiar foto».
- Datos del vehículo: placa con «Formato ABC-123», tipo «Sedán», marca y modelo separados, color, año y el selector de asientos en «4» con la ayuda de 1 a 10.
- Accesibilidad: «Puedo llevar una silla de ruedas plegable» marcada, con su ayuda, y la segunda casilla sin marcar.
- SOAT: chip «Vigente», Rímac Seguros, póliza, fechas DD/MM/AAAA, certificado y las dos notas (privacidad y declaración, RN-36).
- Confirmaciones con «ColaboraCar», la nota de viajes publicados, «Guardar cambios» y «Descartar cambios».
- Las tildes se ven bien y las cifras no están en fuente monoespaciada.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 1 | La casilla sin marcar («Puedo ayudar a subir…») es un cuadrado gris relleno sin borde. Parece deshabilitada, no vacía, y es justo el estado que 16-C usa para «deshabilitada». | 16-A | Media | 1.ª |
| 2 | El título dice «Actualizar Vehículo», con V mayúscula (igual que P09, #1 y #11). | 16-A | Baja | 1.ª |
| 3 | El chip «Vehículo activo» queda pegado al encabezado, sin separación. | 16-A | Baja | 1.ª |
| 4 | El subtítulo del certificado se corta: «soat-rimac.jpg · JPG o PNG,». | 16-A | Baja | 1.ª |

**Prompt de corrección** (seleccionar el frame 16-A de v1.1 en Stitch, en modo App; guardar como `v2.1.png`):

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. Checkboxes sin marcar: fondo blanco #FFFFFF con borde de 2 px #5F5E5E y radio 6px
   (como "Puedo ayudar a subir y bajar del vehículo"). Los marcados siguen rojos con check.
2. Título del encabezado: "Actualizar vehículo", con la v minúscula.
3. Deja 16 px de separación entre el encabezado y el chip "Vehículo activo".
4. Fila del certificado: "soat-rimac.jpg" en una línea y "JPG o PNG, hasta 5 MB" en la
   línea de abajo, sin cortar el texto.
Mantén igual los datos, los colores, la foto, las tarjetas y los botones.
```

### Revisión de v2.1

Formato móvil a 2× (812 × 4342 px).

**Corregido respecto a v1.1:**

- #1: la casilla sin marcar es blanca con borde gris y ya no parece deshabilitada.
- #2: el título dice «Actualizar vehículo».
- #4: el certificado muestra «soat-rimac.jpg» y debajo «JPG o PNG, hasta 5 MB», sin cortes.

**16-A ✅.** Se aprueba con v2.1, que pasa a ser la base de 16-B, 16-C y 16-D.

**Pendiente (tolerable, pasa a la implementación):**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 3 | El chip «Vehículo activo» sigue casi pegado al encabezado. En la implementación lleva 16 px de margen superior. | 16-A | Baja | 2.ª |

### Revisión de v2.2

Formato móvil a 2× (812 × 4827 px).

**Lo que funciona:**
- **Placa:** «XYZ-789» con borde rojo y «La placa ya está registrada».
- **Póliza:** «24-1» con borde rojo y el mensaje literal de 6 a 20 caracteres.
- **Fechas:** 10/10/2025 y 10/10/2026, las dos con borde rojo.
- **SOAT:** sin el chip «Vigente», con la franja rojo suave y el texto literal de `SOAT_NOT_VALID`.
- **Resto:** no se perdió nada de 16-A.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 5 | La franja «Tu SOAT no está vigente…» sale dos veces: arriba de «Aseguradora» y debajo del certificado (falla típica de duplicar). | 16-B | Media | 1.ª |
| 6 | La etiqueta de la foto cambió a «XYZ-789». Debería mostrar la placa guardada («ABC-123») hasta que se guarde, pero se acepta: la foto no depende del campo. | 16-B | Baja | 1.ª |

**Prompt de corrección** (seleccionar el frame 16-B de v2.2 en Stitch; guardar como `v3.1.png`):

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. En la tarjeta "SOAT", elimina la segunda franja rojo suave "Tu SOAT no está vigente…",
   la que está debajo de "Certificado del SOAT". Deja solo la que está arriba de "Aseguradora".
2. En la etiqueta blanca sobre la foto del vehículo, la placa vuelve a ser "ABC-123".
Mantén igual los errores de placa, póliza y fechas, y todo lo demás.
```

### Revisión de v3.1

**16-B ✅.** Formato móvil a 2× (812 × 4669 px).

**Corregido respecto a v2.2:**

- #5: queda una sola franja «Tu SOAT no está vigente…», arriba de «Aseguradora».
- #6: la etiqueta de la foto volvió a «ABC-123».

Los errores de placa, póliza y fechas se mantienen y no se perdió nada de 16-A.

### Revisión de v3.2

Formato móvil a 2× (812 × 4462 px). Cumple el prompt:
- **Datos de la moto:** tipo «Moto», foto de una moto roja, Honda CB190R roja 2022 y 1 asiento.
- **Accesibilidad:** las dos casillas atenuadas con «Una moto no puede marcarse como accesible.».
- **Resto:** SOAT, confirmaciones y botones iguales a 16-A.

**Decisión del usuario (2026-11-01):** «si no puede agregar accesibilidad hay que retirar la opción». Con tipo Moto la tarjeta «ACCESIBILIDAD (OPCIONAL)» no se muestra. Es coherente con RN-18: la regla prohíbe marcar los checks, y ocultarlos lo hace cumplir sin mostrar controles que no se pueden usar. La API mantiene la validación «Una moto no puede marcarse como accesible» como respaldo.

**Pendiente:**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 7 | La tarjeta de accesibilidad se muestra deshabilitada; por decisión del usuario se retira. | 16-C | Media | 1.ª |
| 8 | La placa «1234-AB» no pasa la validación de la API (`@PlacaPeru`: tres caracteres, guion opcional y tres o cuatro más), y Stitch cambió la ayuda a «Formato 1234-AB». Se usa «MT4-512», que sí la cumple, y la ayuda vuelve a «Formato ABC-123». | 16-C | Media | 1.ª |

**Prompt de corrección** (seleccionar el frame 16-C de v3.2 en Stitch; guardar como `v4.1.png`):

```text
Edita solo esta pantalla y mantén todo lo demás igual:
1. Elimina por completo la tarjeta "ACCESIBILIDAD (OPCIONAL)", con sus dos checks y el texto
   "Una moto no puede marcarse como accesible.". Debajo de "Asientos para pasajeros" sigue
   directamente la tarjeta "SOAT", con 24 px de separación.
2. Placa: "MT4-512" en el campo "Placa" y en la etiqueta blanca sobre la foto de la moto.
3. La ayuda a la derecha de la etiqueta "Placa" vuelve a decir "Formato ABC-123".
Mantén igual la foto, los datos de la moto, el SOAT, las confirmaciones y los botones.
No agregues ningún otro aviso sobre accesibilidad.
```

### Revisión de v4.1

**16-C ✅.** Formato móvil a 2× (812 × 3987 px).

**Corregido respecto a v3.2:**

- #7: la tarjeta de accesibilidad ya no está. Después de «Asientos para pasajeros» sigue la tarjeta «SOAT», y no hay ningún otro aviso.
- #8: «MT4-512» aparece en el campo y en la etiqueta de la foto, y la ayuda volvió a «Formato ABC-123».

La moto, el SOAT, las confirmaciones y los botones no cambiaron.

### Revisión de v4.2

**16-D ✅ a la primera.** Formato móvil a 2× (812 × 4522 px).
- **Aviso:** franja ámbar con «Tu SOAT vence el 05/11. Renuévalo y actualiza los datos para seguir publicando viajes.», debajo de la descripción.
- **SOAT:** chip ámbar «Vence en 7 días» (del jue 29/10 al 05/11) y fechas 05/11/2025 – 05/11/2026.
- **Resto:** sin secciones repetidas, y no se perdió nada de 16-A.

### Decisión

Se aprueba el 2026-11-01. Capturas finales: 16-A → v2.1, 16-B → v3.1, 16-C → v4.1, 16-D → v4.2.

Ajustes a resolver en la implementación (React + Tailwind):

1. **Margen del chip:** «Vehículo activo» lleva 16 px de margen superior respecto al encabezado (#3).
2. **Tipo Moto:** oculta la tarjeta de accesibilidad y envía `accessibility: { wheelchair: false, boardingAssistance: false }`. Al volver a un auto, la tarjeta reaparece sin marcar (decisión del usuario, 16-C).
3. **Foto:** la etiqueta de placa sobre la foto muestra la placa guardada, no la que se está escribiendo (#6).
4. **Errores de la API:** se muestran en su campo (`PLATE_ALREADY_REGISTERED`) o en la franja del SOAT (`SOAT_NOT_VALID`), como en 16-B. Una sola franja por sección (#5).
5. **Chip del SOAT:** «Vigente» (verde) si faltan más de 15 días para la fecha de fin; «Vence en N días» (ámbar) con 15 o menos, junto con la franja de 16-D (mismo umbral que el perfil, RF-14).
6. **Fotos:** se suben con `POST /api/files` (`FOTO_VEHICULO` y `FOTO_SOAT`). Las dos son obligatorias al actualizar (RN-15, RN-36), y la del SOAT solo la ve su dueño.
7. **Mensajes de validación:** los de la tabla «Mensajes de validación». El frontend los repite antes de enviar.
8. **Guardar:** con éxito, vuelve a P14 con el toast «Vehículo actualizado». «Descartar cambios» o «←» con cambios pendientes abren un diálogo de confirmación.
9. **Checkboxes:** los vacíos son blancos con borde de 2 px #5F5E5E, y los marcados, rojos con check. Llevan `aria-checked` y su etiqueta como nombre accesible.

**Aprendizaje para las siguientes pantallas:**

- **Placas de ejemplo:** hay que validarlas contra la regla de la API antes de pedirlas. «1234-AB» no pasa `@PlacaPeru`, y Stitch además cambió la ayuda del campo.
- **Opciones que una regla prohíbe:** se ocultan, no se deshabilitan (decisión del usuario en 16-C). Conviene aplicarlo en P05.
- **Duplicar con franjas de error:** Stitch puede repetir la franja dentro de la misma tarjeta (16-B). Hay que revisar sección por sección.
