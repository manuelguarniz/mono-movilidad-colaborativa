# Contexto común para Stitch

Se pega al inicio de **cada** pasada (Stitch no recuerda sesiones anteriores). Reemplazar lo que está entre `<…>`. Si una pantalla no lleva barra inferior (modal de flujo, formulario de registro), cambiar esa línea por «Sin barra de navegación inferior».

Fuente de los colores: `app-utp-movilidad-colaborativa/src/styles/index.css`. Si se cambia algo aquí, actualizar también los `prompt.md` que estén en iteración.

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
  (ej. "PRÓXIMO VIAJE"), títulos 28px semibold, horas grandes 28px con cifras tabulares.
- Iconos de línea (Material Symbols Outlined), estrellas de calificación en ámbar.
- Encabezado: menú hamburguesa a la izquierda, logotipo "ColaboraCar" en rojo #BD0016
  bold centrado, campana de notificaciones con punto rojo y avatar a la derecha.
- Barra de navegación inferior blanca, fija abajo a todo el ancho, con 5 pestañas: Viajes,
  Mis viajes, Historial, Billetera, Perfil. La pestaña activa es una píldora roja #BD0016
  con icono y texto blancos. En esta pantalla la activa es "<pestaña>".
- Debajo del encabezado: eyebrow "<EYEBROW>" y título "<Título>".

Reglas que el diseño debe reflejar:
- Cada viaje tiene una sola hora de salida (no rango) y lleva un chip con la sede
  (ej. "Sede Trujillo", "Sede Lima Centro").
- Precio por plaza entre 1 y 10 créditos.
- Estados con chip de color y estas etiquetas exactas: Publicado / Confirmada (gris azulado),
  En curso / En viaje (verde), Completado / Completada (gris), Cancelado / Cancelada por ti /
  Cancelado por el conductor / Cancelado: no se inició (rojo suave), No te presentaste (ámbar).
- Cancelar solo está permitido hasta 30 minutos antes de la salida.
- La necesidad de asistencia de movilidad de un pasajero solo la ve el conductor de su viaje
  (icono de accesibilidad + texto, ej. "Usa silla de ruedas").
- <reglas propias de la pantalla, con su RN>
- Nada de "ShareCar", "A/C activo", "Conductor frecuente", "Puntualidad", chat,
  botón de emergencia, seguimiento en vivo ni correos que no sean @utp.edu.pe.
- Contenido realista, nada de lorem ipsum.
```

## Si Stitch genera una pantalla de escritorio

Seleccionar el frame generado y pegar:

```text
Convierte esta pantalla a formato de teléfono móvil vertical:

- Ancho total de la pantalla: 390 px. Elimina todo el espacio vacío a la derecha;
  el contenido debe ocupar el 100 % del ancho, con márgenes laterales de 16 px.
- No es un diseño web ni de escritorio: una sola columna, sin barras laterales
  ni contenedores centrados con fondo vacío alrededor.
- El encabezado (menú, logotipo ColaboraCar, campana y avatar) ocupa todo el ancho arriba.
- La barra de navegación inferior (Viajes, Mis viajes, Historial, Billetera, Perfil)
  queda fija abajo, a todo el ancho, con "<pestaña>" activa como píldora roja #BD0016.
- <botón fijo, si lo hay> va fijo justo encima de la barra inferior,
  a todo el ancho menos los márgenes de 16 px.

Mantén todo lo demás igual: colores, tipografía Inter, textos y datos.
```
