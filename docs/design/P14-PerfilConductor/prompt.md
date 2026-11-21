# Prompt de diseño — P14 Perfil (conductor)

Prompt para rediseñar la pantalla 14 del prototipo con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Es un rediseño (modo B): se adjunta [screen.jpeg](screen.jpeg) como referencia de layout y se aplican los cambios que pide el README. Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 14-A, y luego cada variante duplicando el frame correcto.

Fuentes: README raíz (RF-14, escenarios Consultar, Vehículo y Cambiar de modo; RF-11; RN-18, RN-28, RN-36, RN-42, RN-47, RN-48; sección 1.1; sección 5.1, documento de ejemplo de `usuarios`; tabla de la sección 11 para los frames 13 y 14; decisión del 2026-10-28 sobre «Cumplimiento»), `app-utp-movilidad-colaborativa/src/styles/index.css`, el frame [screen.jpeg](screen.jpeg) y las capturas aprobadas de P06 (v3.2), P16 (v2.1) y P21 (v1.1) como referencia de estilo.

**Qué se conserva del frame:** eyebrow «CONFIGURACIÓN» y título «Mi perfil», la tarjeta de perfil con avatar, nombre, calificación, correo y tres estadísticas en bloques grises, el botón «Actualizar datos» dentro de la tarjeta, la tarjeta «Vehículo registrado» con icono rojo, chip de estado, bloque gris de datos y botón «Actualizar vehículo», las tarjetas de sede y de residencia (sin botones), la tarjeta de estado de cuenta y el botón «Cerrar sesión» al final.

**Qué cambia y por qué:**

| Frame actual                                                        | Cambio                                                                                                     | Regla                                                      |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| «ShareCar» y avatar con foto                                      | Encabezado común: hamburguesa, «ColaboraCar», campana con contador «3» y avatar «CM»                | Sección 11; RF-13; P06                                    |
| Barra de 4 pestañas en inglés (Ride, History, Wallet, Profile)    | 5 pestañas: Viajes, Mis viajes, Historial, Billetera, Perfil (activa)                                     | Contexto común                                            |
| «Mi Perfil»                                                       | «Mi perfil» (solo la primera letra en mayúscula)                                                        | —                                                         |
| Chip «Pro» y «Conductor verificado»                             | Se quitan; no son datos del README                                                                         | Sección 5.1                                               |
| `carlos.mendoza@sharecar.pe`                                      | `carlos.mendoza@utp.edu.pe`                                                                              | RN-01, RN-02                                               |
| «★ 4.9» suelto                                                   | «★ 4.9 (120 calificaciones)», solo el promedio, sin reseñas                                            | RF-14, RN-47, decisión del 2026-11-21                     |
| «Puntualidad 99%»                                                 | «Cumplimiento 97%»                                                                                       | RN-28                                                      |
| Viajes 342 / Ahorro 128 kg                                          | Viajes 86 / Ahorro CO₂ 187 kg (cifras coherentes con 86 viajes de ~5 km)                                  | RN-28                                                      |
| Sin selector de modo                                                | Tarjeta «MODO DE USO» con selector segmentado «Pasajero / Conductor»; tocar el otro modo abre un modal | RF-14, RN-48                                               |
| Sin saldo                                                           | Tarjeta «BILLETERA»: 96 créditos disponibles, 78 retirables, enlace «Ir a la billetera»               | RF-14, RN-42; datos de P21                                 |
| Vehículo: «Plazas compartidas 3 asientos»                        | «Asientos para pasajeros 4», chip «Apto para silla de ruedas» y fila SOAT con vencimiento              | RN-09, RN-18, RN-36; P11 y P16 usan 4                      |
| «Cambiar sede» y «Modificar casa»                               | Se quitan; las tarjetas quedan de solo lectura                                                             | Sección 1.1                                               |
| «Verificación de Identidad — Documentos y antecedentes al día» | «ESTADO DE CUENTA · Activa» con «Correo institucional verificado»                                     | Sección 5.1 (`estado`); la app no verifica antecedentes |
| Botón «Cerrar sesión»                                           | Se conserva                                                                                                | Sprint 6 (cierre de sesión)                               |

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
- Superficie gris #EEEEEE para bloques internos y botones grises (radio 12px).
- Texto principal #1B1B1B, secundario marrón #5B403D, apagado #5F5E5E, placeholder #686C75.
- Verde para estados positivos: texto #1B7F3B sobre fondo #E6F4EA.
- Ámbar para avisos: texto #8A5A00 sobre fondo #FFF4D6.
- Tipografía Inter. Etiquetas de sección en mayúsculas pequeñas con tracking
  (ej. "VEHÍCULO REGISTRADO"), títulos 28px semibold. Cifras con números tabulares,
  nunca en fuente monoespaciada.
- Iconos de línea (Material Symbols Outlined), estrellas de calificación en ámbar.
- Avatares: círculos grises #EEEEEE con las iniciales en #5B403D, nunca fotos ni imágenes.
- Encabezado: menú hamburguesa a la izquierda, logotipo "ColaboraCar" en rojo #BD0016
  bold centrado (solo el texto, sin punto ni adornos), campana de notificaciones con un
  contador rojo "3" y avatar "CM" a la derecha.
- Barra de navegación inferior blanca, fija abajo a todo el ancho, con 5 pestañas: Viajes,
  Mis viajes, Historial, Billetera, Perfil. La pestaña activa es una píldora roja #BD0016
  con icono y texto blancos. En esta pantalla la activa es "Perfil".
- Debajo del encabezado: eyebrow "CONFIGURACIÓN" y título "Mi perfil".

Reglas que el diseño debe reflejar:
- Esta es la única pantalla con selector de modo "Pasajero / Conductor"; cambiarlo
  siempre pide confirmación en un modal.
- La calificación es solo el promedio de estrellas y la cantidad: no hay reseñas
  ni comentarios visibles.
- La estadística se llama "Cumplimiento", nunca "Puntualidad".
- El SOAT es una declaración del conductor: la app no lo verifica con la aseguradora.
- La sede y la dirección de residencia se muestran solo para leer: sin botones
  "Cambiar sede" ni "Modificar casa".
- Nada de "ShareCar", "Pro", "Conductor verificado", "antecedentes", "A/C activo",
  "Conductor frecuente", "Puntualidad", chat, botón de emergencia, reseñas
  ni correos que no sean @utp.edu.pe.
- Textos en UTF-8: tildes, ñ, "·", "•" y "−" deben verse correctos
  (ej. "Víctor Larco Herrera", "Piérola", "vehículo", "Rímac").
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 14-A — Perfil del conductor (SOAT vigente)

Adjuntar [screen.jpeg](screen.jpeg) en Stitch y elegir el modo **App**. Guardar como `v1.1.png`.

```text
Usa la imagen adjunta solo como referencia de layout (orden de las tarjetas y estilo de los
bloques grises). Reemplaza su encabezado y su barra inferior por los del sistema descrito
arriba. Contenido, de arriba abajo:

1. Eyebrow "CONFIGURACIÓN" y título "Mi perfil". Sin icono a la derecha del título.

2. Tarjeta de perfil:
   - Avatar circular de 72 px gris #EEEEEE con "CM".
   - A la derecha: "Carlos M." en 22px semibold; debajo "★ 4.9" con la estrella ámbar y
     "(120 calificaciones)" en #5F5E5E; debajo, con icono de sobre,
     "carlos.mendoza@utp.edu.pe" en #5B403D (en una sola línea, completo).
   - Tres bloques grises #EEEEEE iguales, lado a lado, con icono arriba, número grande
     y etiqueta debajo: "86" / "Viajes"; "97%" / "Cumplimiento"; "187 kg" / "Ahorro CO₂".
     Los números en #1B1B1B (no rojo ni azul). Las etiquetas no se parten en dos líneas.
   - Botón gris #EEEEEE a todo el ancho, alto 48px, icono de lápiz y texto
     "Actualizar datos" en #1B1B1B (no en mayúsculas).

3. Tarjeta "MODO DE USO":
   - Etiqueta "MODO DE USO".
   - Control segmentado de dos opciones a todo el ancho, fondo #EEEEEE, radio 12px, alto 48px:
     "Pasajero" (icono de persona, texto #5B403D) y "Conductor" (icono de volante),
     esta última seleccionada: píldora blanca con sombra suave y texto #BD0016 semibold.
   - Debajo, en 13px #5F5E5E: "Como conductor publicas viajes y cobras créditos por cada
     plaza. Al cambiar de modo te pediremos confirmar."

4. Tarjeta "BILLETERA" (toda la tarjeta es tocable):
   - Fila: icono de moneda dorada, "96" en 28px semibold con "créditos disponibles"
     en 14px #5B403D en la misma fila; a la derecha, chevron ">".
   - Debajo, en 13px #5F5E5E: "78 créditos retirables a Yape".
   - Enlace de texto rojo #BD0016 semibold: "Ir a la billetera".

5. Tarjeta "VEHÍCULO REGISTRADO":
   - Cuadro rojo suave #FFDAD7 con icono de auto rojo, a la izquierda; etiqueta
     "VEHÍCULO REGISTRADO" y "Toyota Yaris" en 20px semibold; a la derecha chip verde
     "Activo".
   - Bloque gris #EEEEEE con filas (etiqueta con icono a la izquierda, valor a la derecha):
     "Color y año" → "Blanco • 2021";
     "Placa" → "ABC-123" en semibold #BD0016;
     "Asientos para pasajeros" → "4";
     "SOAT" → "Rímac · vence 15/03/2027".
   - Debajo del bloque, dos chips en una fila: chip verde con icono de accesibilidad
     "Apto para silla de ruedas" y chip gris "SOAT vigente".
   - Nota en 12px #5F5E5E con icono de información: "SOAT declarado por ti; ColaboraCar
     no lo verifica con la aseguradora."
   - Botón gris #EEEEEE a todo el ancho, icono de ajustes y texto "Actualizar vehículo".

6. Tarjeta "SEDE UNIVERSITARIA" (solo lectura, sin botón):
   - Icono de edificio en cuadro rojo suave, etiqueta "SEDE UNIVERSITARIA".
   - "UTP Sede Trujillo" en 18px semibold y, con icono de ubicación,
     "Av. Nicolás de Piérola 1221, Trujillo" en #5B403D.

7. Tarjeta "DIRECCIÓN DE RESIDENCIA" (solo lectura, sin botón):
   - Icono de casa en cuadro gris #EEEEEE, etiqueta "DIRECCIÓN DE RESIDENCIA".
   - "Víctor Larco Herrera" en 18px semibold (completo, sin cortar) y, con icono de
     ubicación, "Av. Larco 1250, Trujillo, La Libertad" en #5B403D.

8. Tarjeta "ESTADO DE CUENTA":
   - Etiqueta "ESTADO DE CUENTA" y, a la derecha, chip verde "Activa".
   - Fila con icono de verificado verde: "Correo institucional verificado" en semibold y
     debajo "@utp.edu.pe" en #5F5E5E.

9. Botón "Cerrar sesión" a todo el ancho, fondo rojo suave #FFDAD7, texto #BD0016 semibold,
   icono de salida, radio 12px, alto 52px.

10. Barra inferior con "Perfil" activa.

No incluyas: "Pro", "Conductor verificado", "Puntualidad", "Cambiar sede", "Modificar casa",
"antecedentes", fotos de personas, reseñas ni comentarios.
```

## Frame 14-B — SOAT por vencer

Seleccionar la última captura correcta de 14-A en Stitch. Guardar como el siguiente número de la ronda (`v1.2.png` si 14-A sale bien a la primera).

```text
Duplica el frame 14-A y cambia solo lo siguiente:
1. Entre el título "Mi perfil" y la tarjeta de perfil, agrega una franja ámbar
   (fondo #FFF4D6, texto #8A5A00, radio 12px, icono de alerta a la izquierda):
   "Tu SOAT vence el 30/11. Actualízalo para seguir publicando viajes." y, a la derecha,
   el enlace de texto "Actualizar" en #8A5A00 semibold.
2. En la tarjeta "VEHÍCULO REGISTRADO": la fila "SOAT" pasa a "Rímac · vence 30/11/2026"
   y el chip gris "SOAT vigente" pasa a chip ámbar (#FFF4D6 / #8A5A00) "Vence en 9 días".
3. El botón "Actualizar vehículo" de esa tarjeta pasa a primario rojo #BD0016 con texto blanco.
Mantén todo lo demás igual. No dupliques tarjetas.
```

## Frame 14-C — Modal: cambiar a modo pasajero

Seleccionar la captura de 14-A (sin franja) como fondo. Guardar como el siguiente número de la ronda.

```text
Usa el mismo sistema visual del frame seleccionado: Inter, #BD0016, #FFDAD7, #EEEEEE,
radios 12 y 16 px. Sobre el frame 14-A (perfil de Carlos M.) atenuado con un velo negro
al 40 % a todo el ancho, una hoja inferior (bottom sheet) blanca con radio superior 24px
y asa gris arriba:
- Icono de persona en un círculo rojo suave #FFDAD7 de 56 px, centrado.
- Título centrado, 20px semibold: "¿Cambiar a modo pasajero?"
- Texto centrado en #5B403D: "Verás los viajes disponibles para reservar."
- Nota en 13px #5F5E5E con icono de información: "Tus viajes publicados siguen activos.
  Los gestionas al volver a modo conductor."
- Botón primario rojo #BD0016 a todo el ancho: "Confirmar".
- Botón gris #EEEEEE a todo el ancho debajo: "Cancelar".
En el fondo, el selector "MODO DE USO" sigue mostrando "Conductor" seleccionado
(no cambia hasta confirmar). Sin barra inferior visible por encima del velo.
```

## Frame 14-D — Modal: no se puede cambiar durante un viaje en curso

Seleccionar la captura de 14-A (sin franja) como fondo. Guardar como el siguiente número de la ronda.

```text
Usa el mismo sistema visual del frame seleccionado: Inter, #BD0016, #FFDAD7, #EEEEEE,
radios 12 y 16 px. Sobre el frame 14-A atenuado con un velo negro al 40 % a todo el ancho,
una hoja inferior blanca con radio superior 24px y asa gris arriba:
- Icono de auto en movimiento en un círculo ámbar #FFF4D6 de 56 px, centrado.
- Título centrado, 20px semibold: "No puedes cambiar de modo durante un viaje en curso"
  (en dos líneas como máximo).
- Bloque gris #EEEEEE, radio 12px, con chip verde "En curso", "Salió 14:20" y la ruta
  "Campus UTP Trujillo → Urb. El Golf, Víctor Larco" (completa, hasta dos líneas).
- Texto en #5B403D: "Finaliza el viaje en Mis viajes y luego vuelve a intentarlo."
- Botón primario rojo #BD0016 a todo el ancho: "Ir a Mis viajes".
- Botón gris #EEEEEE a todo el ancho debajo: "Entendido".
No incluyas "Confirmar" ni ningún botón que cambie el modo.
```

---

## Supuestos a validar

- **Selector de modo como control segmentado en su propia tarjeta** («MODO DE USO»), debajo de la tarjeta de perfil. El README dice «el selector Pasajero / Conductor del perfil», pero no dónde va ni cómo se ve; el frame no lo tiene. Reemplaza al chip de solo lectura «Modo conductor» del contexto común, que aquí sería redundante.
- **Saldo en su propia tarjeta** con el retirable, porque Carlos tiene rol conductor (decisión del 2026-11-21 sobre retiros). En P13, sin rol conductor, la tarjeta muestra solo disponible y retenidos.
- **SOAT en el perfil:** fila con aseguradora y fecha de fin, chip «SOAT vigente» o «Vence en N días», y la franja de RF-14 («Tu SOAT vence el DD/MM») arriba del todo cuando faltan 15 días o menos. El texto de la franja agrega «Actualízalo para seguir publicando viajes» (RN-37). Si ya venció, se propone la misma franja en rojo suave: «Tu SOAT venció el DD/MM. Actualízalo para publicar viajes.» (no se diseña).
- **Estado de cuenta:** solo «Activa» y el correo institucional verificado. «Documentos y antecedentes al día» se quita porque la app no verifica antecedentes.
- **Cifras de ejemplo:** 86 viajes, 97 % de cumplimiento, 187 kg de CO₂ (≈ 86 viajes × 2,3 plazas × 5,2 km × 0,18), 120 calificaciones (de P17), 96 créditos disponibles y 78 retirables (de P21).
- **Casos de P13, no de P14:** pasar a conductor sin vehículo («Registra un vehículo para usar la modalidad de conductor» + «Registrar vehículo») y cumplimiento «—» sin viajes se diseñan en P13 (pasajero). P13 puede partir duplicando 14-A.
- **Modal 14-D:** el README solo da el texto «No puedes cambiar de modo durante un viaje en curso». Se propone mostrar el viaje en curso y llevar a Mis viajes, igual que en el pasajero con «En viaje».

---

## Bitácora

| Captura | Frame | Prompt | Resultado |
| --- | --- | --- | --- |
| v1.1 | 14-A | Contexto común + 14-A (adjuntar `screen.jpeg`, modo App) | ✅ Aprobada |
| v1.2 | 14-B | Duplica 14-A (v1.1) | ✅ Aprobada |
| v1.3 | 14-C | Modal sobre 14-A (v1.1) | ✅ Aprobada |
| v1.4 | 14-D | Modal sobre 14-A (v1.1) | ✅ Aprobada |

### Decisiones de flujo

- Tocar «Pasajero» en el selector abre 14-C; con «Confirmar» se guarda `modo_activo` y se recarga el dashboard (P06) en modo pasajero; con «Cancelar» el selector vuelve a «Conductor» (RF-14). _Adoptada sin objeción (2026-11-21)._
- Con un viaje `EN_CURSO`, tocar «Pasajero» abre 14-D en lugar de 14-C (RN-48). «Ir a Mis viajes» abre P17. _Adoptada sin objeción (2026-11-21)._
- La tarjeta de billetera abre P21; «Actualizar datos» abre P15; «Actualizar vehículo» y «Actualizar» de la franja abren P16 (P16-D ya muestra el SOAT por vencer). _Adoptada sin objeción (2026-11-21)._
- Los supuestos de arriba (selector en la tarjeta «MODO DE USO», tarjeta de billetera, SOAT en el perfil, estado de cuenta y cifras) se adoptan sin objeción.

### Revisión de v1.1 a v1.4 (2026-11-21)

Tamaños: v1.1 y v1.2 a 828 px (móvil a 2×); v1.3 y v1.4 a 860 × 1848 (móvil a 2× con 16 px de sombra de exportación a cada lado, no es escritorio).

**Lo que funciona:**

- **14-A (v1.1):** encabezado con «ColaboraCar», campana «3» y avatar «CM»; «Mi perfil» sin mayúsculas extra. La tarjeta de perfil trae «★ 4.9 (120 calificaciones)», el correo `@utp.edu.pe` completo y las estadísticas 86 / 97 % «Cumplimiento» / 187 kg en #1B1B1B, sin partir etiquetas. «MODO DE USO» trae el control segmentado con «Conductor» seleccionado y la ayuda. La billetera muestra 96 disponibles y 78 retirables. En el vehículo están el chip «Activo», la placa en rojo, 4 asientos, la fila SOAT, los chips «Apto para silla de ruedas» y «SOAT vigente» y la nota de declaración. Sede y residencia quedan de solo lectura, el estado de cuenta muestra «Activa» y debajo van «Cerrar sesión» y la barra de 5 pestañas con «Perfil» activa. No aparece nada fuera del alcance, y las tildes, «·», «•» y «CO₂» se ven bien.
- **14-B (v1.2):** franja ámbar con «Actualizar», SOAT «vence 30/11/2026», chip «Vence en 9 días» y «Actualizar vehículo» como botón primario. El resto es idéntico a v1.1, sin bloques repetidos ni elementos perdidos.
- **14-C (v1.3):** hoja inferior sobre el perfil de Carlos con el título, el texto de RF-14 literal, la nota de viajes publicados y «Confirmar» / «Cancelar». En el fondo, el selector sigue en «Conductor».
- **14-D (v1.4):** el título en dos líneas, el bloque con «En curso» y «Salió 14:20» y la ruta completa, sin «Confirmar».

**Pendiente (todo Bajo, se resuelve en la implementación):**

| # | Problema | Frame | Severidad | Veces |
| --- | --- | --- | --- | --- |
| 1 | La tarjeta de billetera no tiene la etiqueta «BILLETERA», y el chevron y el enlace «Ir a la billetera →» llevan al mismo lugar | 14-A | Baja | 1.ª |
| 2 | El velo de los modales es gris claro, no negro al 40 % | 14-C, 14-D | Baja | 1.ª |
| 3 | En 14-D la ruta parte «Víctor / Larco» entre líneas | 14-D | Baja | 1.ª |

### Decisión

Se aprueba el 2026-11-21 en la primera ronda. Capturas finales: 14-A → v1.1, 14-B → v1.2, 14-C → v1.3, 14-D → v1.4.

Ajustes a resolver en la implementación (React + Tailwind):

1. Tarjeta de billetera con la etiqueta «BILLETERA», toda la tarjeta como enlace a P21, y sin duplicar el chevron con el enlace de texto: se deja solo uno (#1).
2. Velo negro al 40 % a todo el ancho detrás de las hojas inferiores, como en P21 (#2).
3. Rutas con espacio no separable dentro de los nombres compuestos («Víctor Larco») o envoltura por palabras sin cortar el nombre del destino (#3).
4. «Puntualidad» pasa a «Cumplimiento» en `ProfilePage.tsx` también en modo conductor (RN-28), y se quitan «Cambiar sede» y «Modificar casa».
5. Franja y chip del SOAT: se muestran con 15 días o menos para el fin (`vehiculo.soat_fecha_fin`). Si ya venció: franja roja suave «Tu SOAT venció el DD/MM. Actualízalo para publicar viajes.» (no se diseñó).
6. Selector de modo: al tocar el modo no activo se abre 14-C, o 14-D si hay un viaje `EN_CURSO` (RN-48); el selector no cambia hasta confirmar.
7. Campana con contador de no leídas hasta «9+», igual que en P06 (RF-13).

**Aprendizaje para las siguientes pantallas:**

- En un rediseño, la tabla «Frame actual | Cambio | Regla», el layout adjunto y todos los datos fijados hicieron que los 4 frames salieran bien a la primera.
- P13 (perfil del pasajero) puede partir duplicando 14-A (v1.1): cambian el avatar y los datos, el selector queda en «Pasajero», la billetera muestra los retenidos y la tarjeta del vehículo se quita o pasa a «Registrar vehículo».
