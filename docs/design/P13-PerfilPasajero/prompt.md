# Prompt de diseño — P13 Perfil (pasajero)

Prompt para rediseñar la pantalla 13 del prototipo con una herramienta de diseño por IA (Stitch, Figma Make, v0 o similar). Es un rediseño (modo B) que parte del perfil del conductor ya aprobado (P14 14-A, [v1.1](../P14-PerfilConductor/v1.1.png)), porque ambos perfiles deben verse iguales. Del frame [screen.jpeg](screen.jpeg) se toma el contenido propio del pasajero. Se genera en varias pasadas: primero el bloque **Contexto común** junto con el frame 13-A, y luego cada variante duplicando el frame correcto.

Fuentes: README raíz (RF-14, escenarios Consultar, Actualizar datos, Vehículo y Cambiar de modo; RF-02, casuística C; RN-17, RN-22, RN-28, RN-47, RN-48; sección 1.1; sección 5.1, `usuarios`; tabla de la sección 11 para los frames 13 y 14), `app-utp-movilidad-colaborativa/src/styles/index.css`, el frame [screen.jpeg](screen.jpeg) y las capturas aprobadas de P14 (v1.1 a v1.4) y P21 (v1.2) como referencia de estilo.

**Qué se conserva del frame:** eyebrow «CONFIGURACIÓN» y título, la tarjeta de perfil con avatar, nombre, correo y tres estadísticas con icono, el botón «Actualizar datos», las tarjetas de sede y de residencia (sin botones), el estado de cuenta con el correo institucional verificado y «Cerrar sesión». El orden y el estilo de las tarjetas son los de P14 v1.1.

**Qué cambia y por qué:**

| Frame actual                                                                              | Cambio                                                                                                              | Regla                                        |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| «ShareCar», avatar con foto y barra de 4 pestañas en inglés                           | Encabezado común con campana «3» y avatar «LR»; barra de 5 pestañas con «Perfil» activa                     | Sección 11; RF-13; P14                      |
| «Valeria R.», «Estudiante», «Pasajero universitario»                                | «Lucía R.», sin chips de tipo de usuario (no existen en el README)                                               | Sección 5.1; datos compartidos con P17–P21 |
| Chip «Verificada» junto al título                                                      | Se quita; el estado va en la tarjeta «ESTADO DE CUENTA»                                                           | P14                                          |
| «Pasajera 4.9 ★» al pie del estado de cuenta                                           | «★ 4.8 (19 calificaciones)» bajo el nombre, como en P14                                                          | RF-14, RN-47                                 |
| 84 viajes / 98 % / 42 kg                                                                  | 24 viajes / 92 % / 34 kg (coherentes con su cancelación y su «No te presentaste» de P19)                         | RN-28                                        |
| Sin selector de modo                                                                      | Tarjeta «MODO DE USO» con «Pasajero» seleccionado                                                               | RF-14, RN-48; P14                            |
| Sin saldo                                                                                 | Tarjeta «BILLETERA» con 38 disponibles y 12 retenidos (sin retirable: no tiene rol conductor)                     | RF-14, RN-42; P21-B                          |
| Sin vehículo ni asistencia                                                               | Tarjeta «ASISTENCIA DE MOVILIDAD» (solo la ve ella) y tarjeta «¿TIENES VEHÍCULO?» con «Registrar vehículo» | RF-14, RN-17, RN-22                          |
| «Cambiar sede» y «Modificar casa»                                                     | Se quitan; las tarjetas quedan de solo lectura                                                                      | Sección 1.1                                 |
| «Activa 2024-II», «Carné universitario y matrícula al día», «Identidad validada» | «Activa» y «Correo institucional verificado · @utp.edu.pe»: la app no verifica matrícula ni identidad         | Sección 5.1 (`estado`)                    |

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
  (ej. "MODO DE USO"), títulos 28px semibold. Cifras con números tabulares,
  nunca en fuente monoespaciada.
- Iconos de línea (Material Symbols Outlined), estrellas de calificación en ámbar.
- Avatares: círculos grises #EEEEEE con las iniciales en #5B403D, nunca fotos ni imágenes.
- Encabezado: menú hamburguesa a la izquierda, logotipo "ColaboraCar" en rojo #BD0016
  bold centrado (solo el texto, sin punto ni adornos), campana de notificaciones con un
  contador rojo "3" y avatar "LR" a la derecha.
- Barra de navegación inferior blanca, fija abajo a todo el ancho, con 5 pestañas: Viajes,
  Mis viajes, Historial, Billetera, Perfil. La pestaña activa es una píldora roja #BD0016
  con icono y texto blancos. En esta pantalla la activa es "Perfil".
- Debajo del encabezado: eyebrow "CONFIGURACIÓN" y título "Mi perfil".

Reglas que el diseño debe reflejar:
- Esta es la única pantalla con selector de modo "Pasajero / Conductor"; cambiarlo
  siempre pide confirmación en un modal, y para ser conductor hace falta un vehículo.
- La calificación es solo el promedio de estrellas y la cantidad: no hay reseñas
  ni comentarios visibles.
- La estadística se llama "Cumplimiento", nunca "Puntualidad".
- La necesidad de asistencia de movilidad es un dato sensible y opcional: en el perfil
  solo la ve su dueña, y solo se comparte con los conductores de los viajes que reserve.
- La sede y la dirección de residencia se muestran solo para leer: sin botones
  "Cambiar sede" ni "Modificar casa".
- Nada de "ShareCar", "Estudiante", "Pasajero universitario", "Verificada", "matrícula",
  "Identidad validada", "Puntualidad", chat, botón de emergencia, reseñas
  ni correos que no sean @utp.edu.pe.
- Textos en UTF-8: tildes, ñ, "·", "•" y "−" deben verse correctos
  (ej. "Lucía", "Víctor Larco Herrera", "Piérola", "vehículo").
- Contenido realista, nada de lorem ipsum.
```

---

## Frame 13-A — Perfil de la pasajera (sin vehículo)

Adjuntar la captura aprobada de P14 [v1.1](../P14-PerfilConductor/v1.1.png) en Stitch (no `screen.jpeg`) y elegir el modo **App**. Guardar como `v1.1.png`.

```text
Usa la imagen adjunta (perfil de un conductor ya aprobado) como referencia exacta de estilo
y de layout: mismas tarjetas, bloques grises, chips, botones, encabezado y barra inferior.
Es el perfil de una pasajera: cambia los datos y las tarjetas como se indica.
Contenido, de arriba abajo:

1. Eyebrow "CONFIGURACIÓN" y título "Mi perfil". Sin chips ni iconos a la derecha.

2. Tarjeta de perfil:
   - Avatar circular de 72 px gris #EEEEEE con "LR".
   - A la derecha: "Lucía R." en 22px semibold; debajo "★ 4.8" con la estrella ámbar y
     "(19 calificaciones)" en #5F5E5E; debajo, con icono de sobre,
     "lucia.rojas@utp.edu.pe" en #5B403D (en una sola línea, completo).
   - Tres bloques grises iguales con icono, número y etiqueta: "24" / "Viajes";
     "92%" / "Cumplimiento"; "34 kg" / "Ahorro CO₂". Números en #1B1B1B.
   - Botón gris #EEEEEE a todo el ancho, icono de lápiz y "Actualizar datos".

3. Tarjeta "MODO DE USO":
   - Control segmentado a todo el ancho, fondo #EEEEEE, radio 12px, alto 48px:
     "Pasajero" (icono de persona) seleccionado como píldora blanca con sombra suave y texto
     #BD0016 semibold, y "Conductor" (icono de volante) sin seleccionar, texto #5B403D.
   - Debajo, en 13px #5F5E5E: "Como pasajera reservas plazas en viajes de la comunidad UTP.
     Para ser conductora necesitas registrar un vehículo."

4. Tarjeta "BILLETERA" (toda la tarjeta es tocable, con chevron ">" a la derecha):
   - Etiqueta "BILLETERA".
   - Icono de moneda dorada, "38" en 28px semibold y "créditos disponibles" en 14px #5B403D
     en la misma fila.
   - Debajo, en 13px #5F5E5E con icono de candado: "12 créditos retenidos en tu reserva
     de hoy, 14:20".
   No agregues "retirables", "Retirar" ni el enlace "Ir a la billetera".

5. Tarjeta "ASISTENCIA DE MOVILIDAD":
   - Cuadro gris #EEEEEE con icono de accesibilidad, etiqueta "ASISTENCIA DE MOVILIDAD"
     y, a la derecha, chip gris "No declarada".
   - Texto en 13px #5F5E5E con icono de candado: "Es opcional. Si la declaras, solo la
     verán los conductores de los viajes que reserves." 
   - Enlace de texto rojo #BD0016 semibold: "Declarar en Actualizar datos".

6. Tarjeta "¿TIENES VEHÍCULO?":
   - Cuadro rojo suave #FFDAD7 con icono de auto rojo, etiqueta "¿TIENES VEHÍCULO?" y
     "Comparte tus viajes" en 18px semibold.
   - Texto en #5B403D: "Registra tu vehículo y su SOAT para publicar viajes como conductora."
   - Botón rojo suave #FFDAD7 a todo el ancho, texto #BD0016 semibold, icono "+":
     "Registrar vehículo".

7. Tarjeta "SEDE UNIVERSITARIA" (solo lectura, sin botón), igual que en la imagen:
   "UTP Sede Trujillo" y "Av. Nicolás de Piérola 1221, Trujillo".

8. Tarjeta "DIRECCIÓN DE RESIDENCIA" (solo lectura, sin botón), igual que en la imagen:
   "Víctor Larco Herrera" y "Calle Los Cedros 245, Urb. El Golf, Trujillo".

9. Tarjeta "ESTADO DE CUENTA", igual que en la imagen: chip verde "Activa" y
   "Correo institucional verificado" con "@utp.edu.pe".

10. Botón "Cerrar sesión" (rojo suave) y barra inferior con "Perfil" activa.

No incluyas: la tarjeta "VEHÍCULO REGISTRADO", "Actualizar vehículo", SOAT, "retirables",
"Estudiante", "Pasajero universitario", "Verificada", "Identidad validada", "Cambiar sede",
"Modificar casa", fotos de personas, reseñas ni comentarios.
```

## Frame 13-B — Sin viajes completados

Seleccionar la última captura correcta de 13-A en Stitch. Guardar como el siguiente número de la ronda (`v1.2.png` si 13-A sale bien a la primera).

```text
Duplica el frame 13-A y cambia solo lo siguiente:
1. Bajo el nombre "Lucía R.", en lugar de la calificación: "Sin calificaciones aún"
   en #5F5E5E, con la estrella en contorno gris.
2. Los tres bloques de estadísticas: "0" / "Viajes"; "—" / "Cumplimiento";
   "0 kg" / "Ahorro CO₂".
3. Debajo de los bloques, en 12px #5F5E5E con icono de información:
   "Tu cumplimiento aparecerá cuando completes tu primer viaje."
4. Tarjeta "BILLETERA": "0" créditos disponibles y, debajo, "Recarga con Yape para
   reservar tu primer viaje." en lugar de la línea de retenidos.
Mantén todo lo demás igual. No dupliques tarjetas.
```

## Frame 13-C — Modal: pasar a conductor sin vehículo

Seleccionar la captura de 13-A como fondo. Guardar como el siguiente número de la ronda.

```text
Usa el mismo sistema visual del frame seleccionado: Inter, #BD0016, #FFDAD7, #EEEEEE,
radios 12 y 16 px. Sobre el frame 13-A (perfil de Lucía R.) atenuado con un velo negro
al 40 % a todo el ancho, una hoja inferior (bottom sheet) blanca con radio superior 24px
y asa gris arriba:
- Icono de auto en un círculo rojo suave #FFDAD7 de 56 px, centrado.
- Título centrado, 20px semibold, en dos líneas como máximo:
  "Registra un vehículo para usar la modalidad de conductor"
- Texto centrado en #5B403D: "Necesitas los datos del vehículo y su SOAT vigente.
  Te toma unos minutos."
- Botón primario rojo #BD0016 a todo el ancho: "Registrar vehículo".
- Botón gris #EEEEEE a todo el ancho debajo: "Cancelar".
En el fondo, el selector "MODO DE USO" sigue mostrando "Pasajero" seleccionado.
No incluyas "Confirmar" ni ningún botón que cambie el modo.
```

## Frame 13-D — Modal: cambiar a modo conductor (con vehículo)

Lucía no tiene vehículo, así que este modal se muestra sobre el perfil de Carlos M. en modo pasajero. Adjuntar P14 [v1.1](../P14-PerfilConductor/v1.1.png) en Stitch. Guardar como el siguiente número de la ronda.

```text
Usa el mismo sistema visual de la imagen adjunta (perfil de Carlos M.): Inter, #BD0016,
#FFDAD7, #EEEEEE, radios 12 y 16 px. Fondo: esa misma pantalla, pero con el selector
"MODO DE USO" en "Pasajero" (píldora blanca en "Pasajero", "Conductor" sin seleccionar),
atenuada con un velo negro al 40 % a todo el ancho. Encima, una hoja inferior blanca con
radio superior 24px y asa gris arriba:
- Icono de volante en un círculo rojo suave #FFDAD7 de 56 px, centrado.
- Título centrado, 20px semibold: "¿Cambiar a modo conductor?"
- Texto centrado en #5B403D: "Verás tus viajes publicados y podrás publicar nuevos."
- Nota en bloque gris #EEEEEE con icono de información: "Tus reservas como pasajero
  se mantienen. Las ves al volver a modo pasajero."
- Botón primario rojo #BD0016 a todo el ancho: "Confirmar".
- Botón gris #EEEEEE a todo el ancho debajo: "Cancelar".
```

## Frame 13-E — Modal: no se puede cambiar durante un viaje en curso (pasajera)

Seleccionar la captura de 13-A como fondo. Guardar como el siguiente número de la ronda.

```text
Usa el mismo sistema visual del frame seleccionado: Inter, #BD0016, #FFDAD7, #EEEEEE,
radios 12 y 16 px. Sobre el frame 13-A atenuado con un velo negro al 40 % a todo el ancho,
una hoja inferior blanca con radio superior 24px y asa gris arriba:
- Icono de auto en movimiento en un círculo ámbar #FFF4D6 de 56 px, centrado.
- Título centrado, 20px semibold: "No puedes cambiar de modo durante un viaje en curso"
  (en dos líneas como máximo).
- Bloque gris #EEEEEE, radio 12px, con chip verde "En viaje", "Salió 14:20", la ruta
  "Campus UTP Trujillo → Urb. El Golf, Víctor Larco" (completa, hasta dos líneas, sin
  separar "Víctor Larco") y, debajo, avatar gris "CM" con "Carlos M. · Toyota Yaris blanco".
- Texto en #5B403D: "Podrás cambiar de modo cuando el conductor finalice el viaje."
- Botón primario rojo #BD0016 a todo el ancho: "Ir a Mis viajes".
- Botón gris #EEEEEE a todo el ancho debajo: "Entendido".
No incluyas "Confirmar" ni ningún botón que cambie el modo.
```

---

## Supuestos a validar

- **Se parte de P14 v1.1, no del frame 13:** los dos perfiles deben verse iguales, y P14 ya resolvió el encabezado, el selector y las tarjetas.
- **Correo de ejemplo `lucia.rojas@utp.edu.pe`:** el apellido de Lucía R. no estaba fijado en ninguna pantalla.
- **Cifras de ejemplo:** 24 viajes; cumplimiento 24 ÷ (24 + 1 cancelada + 1 «No te presentaste», de P19) = 92 %; 34 kg de CO₂ (≈ 36 plazas × 5,2 km × 0,18); ★ 4.8 con 19 calificaciones como pasajera. Residencia «Calle Los Cedros 245, Urb. El Golf», que coincide con el destino de su reserva de P17.
- **Billetera sin retirable:** Lucía no tiene el rol `CONDUCTOR`, así que solo ve disponible y retenidos, como en P21-B (decisión del 2026-11-21 sobre retiros).
- **Tarjeta «ASISTENCIA DE MOVILIDAD» en el perfil:** RF-14 incluye la asistencia en el perfil, pero el frame no la muestra. Se propone una tarjeta que solo ve la dueña, con el estado («No declarada» o el tipo declarado, por ejemplo «Silla de ruedas») y el acceso a P15, donde se edita (RN-17). Con asistencia declarada, el chip dice el tipo y la nota se muestra debajo (no se diseña).
- **Tarjeta «¿TIENES VEHÍCULO?»:** RF-14 pide el botón «Registrar vehículo» cuando no hay vehículo; abre P05 (RF-02, casuística C).
- **Modal 13-C:** el README da el texto «Registra un vehículo para usar la modalidad de conductor» y el botón «Registrar vehículo»; se agrega «Cancelar» y una línea de ayuda.
- **Modal 13-D sobre el perfil de Carlos:** es el único usuario de ejemplo con vehículo. Si el usuario prefiere, se puede omitir y se reutiliza el layout de 14-C con el texto de RF-14.
- **Modal 13-E:** el mismo patrón de 14-D, con «En viaje» (estado de la reserva, sección 2.3) y el texto «Podrás cambiar de modo cuando el conductor finalice el viaje».

---

## Bitácora

| Captura | Frame | Prompt                                               | Resultado |
| ------- | ----- | ---------------------------------------------------- | --------- |
| v1.1    | 13-A  | Contexto común + 13-A (adjuntar P14 v1.1, modo App) | —        |

### Decisiones de flujo

- Tocar «Conductor» sin vehículo abre 13-C; «Registrar vehículo» abre P05 y, al guardar, el usuario suma el rol `CONDUCTOR` y entra al dashboard en modo conductor (RF-02, casuística C). _Propuesta._
- Con vehículo, tocar «Conductor» abre 13-D; con «Confirmar» se guarda `modo_activo` y se recarga el dashboard (P06) en modo conductor (RF-14). _Propuesta._
- Con una reserva `EN_VIAJE`, tocar «Conductor» abre 13-E antes que 13-C o 13-D (RN-48). _Propuesta._
- La tarjeta de billetera abre P21; «Actualizar datos» y «Declarar en Actualizar datos» abren P15; «Registrar vehículo» abre P05. _Propuesta._
