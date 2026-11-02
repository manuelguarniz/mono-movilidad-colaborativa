# P17 — Mis viajes (con modales de cancelar, iniciar y finalizar)

| Módulo | RF | Frame de referencia |
| --- | --- | --- |
| Mis viajes | RF-06, RF-07 | Diseño aprobado: ver tabla de frames ([prompt.md](prompt.md)) |

## Contenido

Viajes próximos y en curso del usuario. El pasajero cancela su reserva y el conductor su viaje hasta 30 minutos antes de la salida. El conductor confirma el inicio marcando qué pasajeros subieron y finaliza el viaje al llegar.

## Frames aprobados

| Frame | Vista | Captura |
| --- | --- | --- |
| 17-A | Pasajero con reserva Confirmada | [v1.2.png](v1.2.png) |
| 17-B | Conductor: en curso, hoy y mañana | [v2.1.png](v2.1.png) |
| 17-C | Modal: cancelar reserva | [v1.4.png](v1.4.png) |
| 17-D | Modal: cancelar viaje | [v2.2.png](v2.2.png) |
| 17-E | Modal: ¿Quiénes subieron? | [v2.3.png](v2.3.png) |
| 17-F | Modal: finalizar viaje | [v1.7.png](v1.7.png) |
| 17-G | Estado vacío (pasajero) | [v2.4.png](v2.4.png) |
| 17-H | Pasajero con reserva En viaje | [v2.5.png](v2.5.png) |

![17-A](v1.2.png)
![17-B](v2.1.png)

## Ajustes respecto al diseño

Manda el README raíz. Las capturas son una referencia de alta fidelidad, no un plano exacto.

- Logotipo sin el punto rojo (17-H lo muestra) y sin el texto «Salió 14:22» encimado en el encabezado de 17-H.
- El fondo atenuado de los modales (17-D, 17-E, 17-F) es la versión anterior de 17-B: en la app va el 17-B aprobado, con un velo negro al 40 % y sin bandas a los lados.
- En la tarjeta de mañana de 17-B, «2 de 3 plazas reservadas» aparece dos veces: se deja solo la fila de ocupación con barra.
- Variantes que no se diseñaron: 17-G en modo conductor, 17-E sin pasajeros, 17-A fuera de plazo y 17-B con el límite de RN-30 (ver la sección Decisión de [prompt.md](prompt.md)).

## Ajustes en la implementación

- El velo de las hojas inferiores es negro al 40 %, a todo el ancho.
- La tarjeta de mañana de 17-B muestra solo la fila «Ocupación» con barra.
- «Finalizar viaje» (17-F) muestra el aviso «Viaje completado» y se queda en Mis viajes: P20 Calificar todavía no existe.
- 17-F calcula «Recibirás N créditos» con las reservas de quienes subieron y de quienes no se presentaron (RN-40). La billetera todavía no existe, así que el cobro y los reembolsos solo se informan.
- La línea de asistencia de movilidad del pasajero (RN-22) no aparece: el perfil todavía no guarda ese dato.
- El chip «Paso previo a la salida» de 17-E (agregado por Stitch) no se implementa.
- 17-D sin reservas omite la frase «Se cancelarán las N reservas…»; con una sola reserva dice «Se cancelará la reserva confirmada y se devolverán sus créditos.».
- Con el plazo de inicio vencido y sin el job de RF-08, la tarjeta muestra «Ya pasó el plazo para iniciar este viaje» (texto nuevo, igual al mensaje de la API).
- El chip de sede dice «Sede {ciudad}» con la ciudad del viaje (RN-49).
