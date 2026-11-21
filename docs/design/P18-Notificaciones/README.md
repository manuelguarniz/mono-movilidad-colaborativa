# P18 — Notificaciones

| Módulo | RF | Frame de referencia |
| --- | --- | --- |
| Notificaciones | RF-13 | En diseño ([prompt.md](prompt.md)) |

## Contenido

Bandeja con la más reciente primero (hasta 50), agrupada por día: icono por tipo, título, mensaje y hace cuánto llegó. Las no leídas se distinguen con un punto rojo y fondo rojo muy suave. Al tocar una se marca como leída y abre la pantalla relacionada (Mis viajes, historial, calificar o billetera). Botón «Marcar todas como leídas». Vacío: «No tienes notificaciones». Se abre desde la campana del encabezado.

## Frames planeados

| Frame | Vista |
| --- | --- |
| 18-A | Bandeja de la pasajera (Lucía R.), con 3 sin leer |
| 18-B | Bandeja del conductor (Carlos M.), con «Nueva reserva» y asistencia de movilidad (RN-22) |
| 18-C | Todas leídas (después de «Marcar todas como leídas») |
| 18-D | Estado vacío |

## Ajustes respecto al README

Manda el README raíz (RF-13, RN-32 a RN-34).

- Pantalla de flujo: encabezado «←» + «Notificaciones», sin barra inferior (se abre desde la campana).
- Los textos de los mensajes son los literales de la tabla de RF-13.
- El texto de asistencia solo aparece en las notificaciones del conductor (RN-22).
