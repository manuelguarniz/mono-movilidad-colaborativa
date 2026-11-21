# P13 — Perfil — pasajero (con modal de cambio de modo)

| Módulo | RF | Frame de referencia |
| --- | --- | --- |
| Perfil | RF-01, RF-14 | Rediseño aprobado: 13-A [v1.1](v1.1.png), 13-B [v1.2](v1.2.png), 13-C [v1.3](v1.3.png), 13-D [v1.4](v1.4.png), 13-E [v1.5](v1.5.png) ([prompt.md](prompt.md)). Frame original: [screen.jpeg](screen.jpeg) |

![13-A](v1.1.png)

Ajustes respecto al diseño, a resolver en la implementación: ver «Decisión» en [prompt.md](prompt.md) (estadísticas en tres bloques, «—» sin viajes, hojas inferiores ancladas con velo, texto neutro).

## Contenido

Datos, estadísticas, sede universitaria, dirección de residencia y estado de cuenta.

## Ajustes respecto al frame

Manda el README raíz (sección 11).

- Quitar «Cambiar sede» y «Modificar casa».
- Agregar el saldo con acceso a la billetera y la calificación.
- El cambio de modo usa un modal de confirmación (RN-48).
- La estadística se llama «Cumplimiento» (RN-28).

## Implementación (2026-11-21)

- Misma pantalla que P14 ([ProfilePage.tsx](../../../app-utp-movilidad-colaborativa/src/features/profile/pages/ProfilePage.tsx)) en modo pasajero, y hojas en [ModeChangeSheet.tsx](../../../app-utp-movilidad-colaborativa/src/features/profile/components/ModeChangeSheet.tsx).
- Asistencia de movilidad en solo lectura (decisión del usuario, 2026-11-21): `GET /users/me` devuelve `mobilityAssistance`; el enlace «Declarar en Actualizar datos» queda deshabilitado («próximamente») hasta que P15 tenga la sección.
- Textos neutros: «Como pasajero reservas plazas en viajes de la comunidad UTP. Para usar el modo conductor necesitas registrar un vehículo.» y «Registra tu vehículo y su SOAT para publicar viajes.».
- Al registrar el primer vehículo desde el perfil, la app cambia a modo conductor (`PATCH /users/me/mode`) y abre el dashboard; si hay un viaje en curso, vuelve al perfil.

