# P15 — Actualizar datos

| Módulo | RF | Frame de referencia |
| --- | --- | --- |
| Perfil | RF-14 | En diseño ([prompt.md](prompt.md)) · frame original `frames/15. perfil_actualizar_datos.jpeg` |

![Pantalla](screen.jpeg)

## Frames planeados

| Frame | Vista |
| --- | --- |
| 15-A | Datos de la pasajera, documento registrado, sin asistencia |
| 15-B | Primer registro del documento y asistencia declarada |
| 15-C | Errores de validación |
| 15-D | Modal: quitar asistencia |

## Contenido

Foto y datos personales.

## Ajustes respecto al frame

Manda el README raíz (sección 11).

- El usuario elige tipo de documento (DNI o CE) e ingresa el número una sola vez; luego queda bloqueado (RN-14).
- La modalidad se cambia desde el perfil (13, 14), no en este formulario (RN-48).
- Agregar la sección de asistencia de movilidad (RN-17).

## Implementación (2026-11-21)

Se implementó a partir del prompt (15-A a 15-D), sin capturas aprobadas: cuando se aprueben, hay que comparar.

- `PUT /users/me` ya no recibe `activeMode` desde esta pantalla (sigue aceptándolo opcional) y recibe `mobilityAssistance` (`null` la quita).
- La tarjeta de asistencia es el mismo componente que P04 (`MobilityAssistanceCard`).
- «Declarar en Actualizar datos» (P13) abre la pantalla en la tarjeta (`/perfil/datos#asistencia`).
- «Descartar cambios» o «←» con cambios pendientes abren «¿Descartar los cambios?».
- La foto de perfil todavía no se exige (la API la acepta opcional).

