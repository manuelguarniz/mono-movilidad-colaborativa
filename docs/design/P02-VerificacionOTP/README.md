# P02 — Verificación OTP

| Módulo | RF | Frame de referencia |
| --- | --- | --- |
| Autenticación | RF-01 | `frames/02. login_verificacion.jpeg` |

![Pantalla](screen.jpeg)

## Contenido

Código de 6 dígitos enviado al correo, máximo 3 intentos y reenvío con temporizador.

## Ajustes respecto al frame

Manda el README raíz (sección 11).

- Solo se muestra en el primer login de la cuenta, cuando `usuarios.ultima_conexion` está vacía (RN-35, decisión del 2026-11-21). Los logins siguientes van directo al dashboard.
