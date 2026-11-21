# ColaboraCar — Backend

API REST de ColaboraCar: Spring Boot 4 (Java 25), Spring Security, Spring Validation y Spring Data MongoDB sobre MongoDB Atlas.

Este documento cubre lo que hace falta para ejecutar, probar y extender el backend: configuración, tokens, formato de errores y el catálogo de mensajes de validación. Los cuerpos de solicitud y respuesta de cada endpoint están en el contrato, [docs/openapi.yaml](../docs/openapi.yaml); los requerimientos, la arquitectura y el modelo de datos, en el [README principal](../README.md).

## 1. Ejecución local

Requiere Java 25 y un clúster de MongoDB Atlas. Los catálogos (departamentos, distritos y sedes) se cargan una vez con `docs/seed.js`, que es idempotente:

```bash
mongosh "mongodb+srv://<usuario>:<clave>@<cluster>/db_colabora_car" ../docs/seed.js
```

La configuración se pasa por variables de entorno. Las cuatro primeras son obligatorias: sin ellas la API no arranca.

| Variable | Uso | Valor por defecto |
| --- | --- | --- |
| `DB_USER`, `DB_PASSWORD`, `DB_HOST` | Credenciales y host del clúster de Atlas. | — |
| `JWT_SECRET` | Clave HS256 de al menos 32 caracteres. | — |
| `DB_NAME` | Nombre de la base de datos. | `localhost` |
| `SERVER_PORT` | Puerto de la API. | `8080` |
| `CORS_ALLOWED_ORIGINS` | Orígenes del frontend, separados por coma. | `http://localhost:5173,http://localhost:4173` |
| `MAIL_ENABLED` | Con `false` no se envía correo: el código OTP se escribe en el log. | `false` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM` | Servidor de correo, solo con `MAIL_ENABLED=true`. | Gmail, puerto 587 |
| `JWT_REGISTRATION_TTL`, `JWT_PRE_AUTH_TTL`, `JWT_SESSION_TTL` | Vigencia de cada token. | `15m`, `10m`, `8h` |
| `OTP_TTL`, `OTP_MAX_ATTEMPTS`, `OTP_RESEND_AFTER` | Reglas del OTP. | `5m`, `3`, `45s` |

Al arrancar, la API crea los índices de `usuarios`, `codigos_otp`, `viajes` y `reservas`, declarados con anotaciones en los modelos; los de los catálogos los crea `docs/seed.js`. La reserva de un viaje usa una transacción de MongoDB, que necesita un replica set: Atlas lo es, pero un `mongod` local sin replica set rechaza la reserva.

```bash
./gradlew bootRun    # API en http://localhost:8080/api
./gradlew test       # ApplicationTests necesita las variables obligatorias y acceso a Atlas
```

El resto de pruebas no usa la base de datos: `ValidacionSolicitudesTest` comprueba la validación de entrada y el formato de los errores; `PerfilServiceTest`, `VehiculoServiceTest`, `ViajeServiceTest` y `ReservaServiceTest`, el camino feliz y las reglas de estado de cada servicio; `ReglasViajeTest`, las reglas de los viajes y los índices de `viajes` y `reservas`; `IndicesUsuarioTest`, el índice único de la placa.

```bash
./gradlew test --tests '*ValidacionSolicitudesTest' --tests '*ServiceTest' --tests '*ReglasViajeTest' --tests '*IndicesUsuarioTest'
```

## 2. Estado y estructura

El contrato define 31 endpoints y el backend implementa 30. Toda la API cuelga de `/api`.

| Módulo | Endpoints | Estado |
| --- | --- | --- |
| Autenticación | `POST /auth/login`, `/auth/verify-code`, `/auth/resend-code`, `/auth/logout` | Implementado |
| Registro | `POST /auth/register`, `/auth/complete-profile` | Implementado; la foto de perfil es opcional hasta que exista `POST /files` |
| Catálogos | `GET /catalogs/departments`, `/catalogs/districts`, `/catalogs/campuses` | Implementado |
| Archivos | `POST /files` | Pendiente; solo existen el modelo y el repositorio |
| Vehículos | `POST /vehicles`, `GET` y `PUT /vehicles/me` | Implementado, con accesibilidad (RN-18) y SOAT (RN-36). El SOAT es opcional mientras P05 y P16 no lo pidan, y las fotos lo son hasta que exista `POST /files` |
| Viajes y reservas | `GET` y `POST /rides`, `GET /rides/{rideId}`, `POST /rides/{rideId}/reserve` | Implementado. La publicación valida el vehículo activo (RN-24), el límite de cancelaciones (RN-30, con los parámetros de la colección `app`) y el SOAT en la salida (RN-37) |
| Mis viajes | `GET /rides/mine`, `POST /rides/{rideId}/cancel`, `/start`, `/finish`, `GET /bookings/mine`, `POST /bookings/{bookingId}/cancel` | Implementado, con reembolso al cancelar y cobro al finalizar (RN-40). Sin notificaciones: no hay avisos al otro participante. El job que cancela o cierra los viajes vencidos (RF-08) está pendiente |
| Billetera | `GET /wallet`, `GET /wallet/movements`, `POST /wallet/top-ups`, `POST /wallet/withdrawals` | Implementado: saldo, retenido y retirable, movimientos, recarga simulada (RN-41) y retiro (RN-42). El job `ReversionRetirosJob` devuelve cada minuto los retiros que el operador marca `RECHAZADO` |
| Perfil | `GET` y `PUT /users/me`, `PATCH /users/me/mode` | Implementado, con el cambio de modo de RN-48 (`tripInProgress` en el perfil); la foto es opcional hasta que exista `POST /files` |
| Historial | `GET /history?role&page` | Implementado (RF-09, RN-50): como pasajero o como conductor, 20 por página, con lo que falta calificar en cada viaje completado |
| Calificaciones | `GET /ratings/rides/{rideId}`, `POST /ratings` | Implementado (RF-10, RN-47): plazo de 24 h desde `fecha_fin` (`dias_para_calificar`), una por reserva y persona, promedio recalculado en una transacción y copiado en los viajes activos. Sin la notificación «Viaje completado» |

El código está en `pe.edu.utp.app_movilidadcolaborativa`, organizado por módulo. Cada módulo tiene tres capas: `application` (casos de uso), `domain` (model, dto, validation) e `infrastructure` (web, persistence, security, mail).

| Paquete | Contenido |
| --- | --- |
| `auth` | Login (OTP solo en el primer login de la cuenta, RN-35), registro y completar perfil; emisión de JWT y envío del código por correo. |
| `catalogs` | Departamentos, distritos y sedes. |
| `users` | Modelo `Usuario`, con su vehículo embebido, y sus reglas (`ReglasUsuario`, RN-01 a RN-05 y RN-14); consulta y actualización del perfil. |
| `vehicles` | Registro, consulta y actualización del vehículo, que se guarda embebido en `Usuario`; sus reglas (`ReglasVehiculo`, RN-07 a RN-09). |
| `rides` | Listado, detalle y publicación de viajes (`ViajeService`) y reserva de plazas (`ReservaService`); modelos `Viaje` y `Reserva` y sus reglas (`ReglasViaje`, RN-11 a RN-13). |
| `ratings` | Calificaciones (`CalificacionService`): contexto para calificar, registro y promedio del calificado; modelo `CalificacionViaje` (colección `calificaciones`). El historial (`HistorialService`) vive en `rides`. |
| `wallet` | Billetera (`BilleteraService`), libro de créditos (`LibroCreditos`: cada cambio de saldo con su movimiento, retención, reembolso y liquidación) y el job de reversión de retiros; modelos `Pago`, `MovimientoCredito` y `Retiro`. |
| `files` | Modelo `Archivo` y su repositorio. |
| `shared` | Lo transversal: errores (`CodigoError`, `ApiException`, `ManejadorErrores`), validaciones comunes, alcances del token, seguridad, CORS y configuración. |

## 3. Tokens y alcances

La API es stateless y usa JWT firmados con HS256. El `subject` es el id del usuario y el claim `scope` lleva un único alcance. Cada ruta exige uno concreto, así que el token `PRE_AUTH` que entrega el primer login no sirve como token de sesión.

| Alcance | Lo entrega | Vigencia | Rutas que admite |
| --- | --- | --- | --- |
| `REGISTRATION` | `POST /auth/register` | 15 min | `/auth/complete-profile` y `POST /vehicles` |
| `PRE_AUTH` | `POST /auth/login`, solo en el primer login de la cuenta | 10 min | `/auth/verify-code` y `/auth/resend-code` |
| `SESSION` | `POST /auth/verify-code` y `POST /auth/login` desde el segundo login | 8 h | El resto de rutas protegidas, y también `/auth/complete-profile` y `POST /vehicles` |

- Son públicas `POST /auth/register`, `POST /auth/login` y `GET /catalogs/**`.
- Un token válido con el alcance equivocado recibe 403 `FORBIDDEN_SCOPE`.
- Sin token, o con uno vencido o mal firmado, la respuesta es 401 `UNAUTHORIZED`.
- No hay lista de revocación: cerrar sesión consiste en que el frontend borre el token. Un token `PRE_AUTH` sigue vigente hasta que vence, aunque ya se haya verificado el código.

Los alcances están en el enum `AlcanceToken` (`shared`) y las reglas por ruta en `SecurityConfig`.

## 4. Validación y errores

### 4.1 Dónde se valida

| Tipo | Dónde | Cómo |
| --- | --- | --- |
| Formato del dato: obligatorio, longitud, patrón | DTO de la solicitud | Anotaciones de Spring Validation; el controlador las comprueba con `@Valid` antes de llamar al servicio. |
| Parámetros de consulta | Controlador | El parámetro se declara con su tipo (`ObjectId`); si falta o no convierte, responde `ManejadorErrores`. Si son varios filtros opcionales, se agrupan en un record con anotaciones (`FiltroViajesRequest`) que el controlador recibe con `@Valid @ModelAttribute`. |
| Reglas que dependen del estado | Capa `application` | El servicio lanza `ApiException` con un `CodigoError`. |

Las reglas propias son anotaciones que delegan en el dominio:

| Anotación | Regla | Valor nulo o vacío |
| --- | --- | --- |
| `@CorreoUtp` | Correo del dominio `utp.edu.pe`, máximo 254 caracteres (RN-01, RN-02). | Válido; lo cubre `@NotBlank`. |
| `@ContrasenaSegura` | De 8 a 72 caracteres con letras, números y símbolos (RN-03). | Inválido. |
| `@NombrePersona` | Al menos una letra y máximo 60 caracteres (RN-05). | Válido; lo cubre `@NotBlank`. |
| `@IdObjeto` | Identificador de MongoDB: 24 caracteres hexadecimales. | Válido; lo cubre `@NotNull`. |
| `@PlacaPeru` | Tres caracteres, guion opcional y tres o cuatro caracteres más (RN-07). | Válido; lo cubre `@NotBlank`. |
| `@AnioFabricacion` | Entre 2000 y el año actual en la hora de Perú (RN-08). | Válido; lo cubre `@NotNull`. |
| `@HoraSalida` | Fecha futura con hora de Perú entre las 6:00 y las 23:00 (RN-12). | Válido; lo cubre `@NotNull`. |

Esa convención garantiza un solo error por campo. Antes de validar, el correo se pasa a minúsculas sin espacios, los nombres y apellidos se recortan y la placa se pasa a mayúsculas y con guion (`abc123` queda `ABC-123`).

### 4.2 Formato de la respuesta de error

Toda respuesta 4xx o 5xx tiene la misma forma. `code` es estable y es lo que debe leer el cliente; `message` es un texto en español para mostrar.

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Revisa los datos enviados",
  "errors": [
    { "field": "acceptedTerms", "message": "Debes aceptar los términos y condiciones" },
    { "field": "email", "message": "El correo debe ser del dominio utp.edu.pe" }
  ]
}
```

- Con `VALIDATION_ERROR` el `message` general es siempre «Revisa los datos enviados» y el detalle va en `errors`, ordenado por nombre de campo.
- La excepción es un cuerpo que no es JSON válido: responde `VALIDATION_ERROR` con el mensaje «El cuerpo de la solicitud no es un JSON válido» y sin `errors`.
- Los demás códigos no llevan `errors`. Dos de ellos agregan `details`:

```json
{
  "code": "OTP_INVALID",
  "message": "Código inválido. Te quedan 2 intentos.",
  "details": { "attemptsLeft": 2 }
}
```

### 4.3 Códigos de error

Están centralizados, con su estado HTTP, en el enum `CodigoError`. Los cuatro primeros tienen mensaje fijo.

| Código | HTTP | Mensaje |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Revisa los datos enviados |
| `UNAUTHORIZED` | 401 | Tu sesión expiró. Vuelve a iniciar sesión. |
| `FORBIDDEN_SCOPE` | 403 | No tienes permiso para realizar esta acción |
| `INTERNAL_ERROR` | 500 | Ocurrió un error inesperado. Inténtalo nuevamente. |
| `INVALID_CREDENTIALS` | 401 | Correo o contraseña incorrectos |
| `ACCOUNT_BLOCKED` | 403 | Tu cuenta está bloqueada. Comunícate con soporte. |
| `EMAIL_ALREADY_REGISTERED` | 409 | El correo ya está en uso |
| `INVALID_CATALOG_REFERENCE` | 400 | Según el caso; ver `complete-profile` en 4.4 |
| `INVALID_FILE_REFERENCE` | 400 | La foto de perfil (o del vehículo, o del SOAT) no existe o no te pertenece |
| `PROFILE_INCOMPLETE` | 409 | Completa tu perfil antes de actualizar tus datos (o de registrar tu vehículo) |
| `VEHICLE_REQUIRED` | 403 | Registra un vehículo para usar la modalidad de conductor (o para publicar viajes) |
| `PLATE_ALREADY_REGISTERED` | 409 | La placa ya está registrada |
| `VEHICLE_ALREADY_REGISTERED` | 409 | Ya tienes un vehículo registrado |
| `VEHICLE_NOT_FOUND` | 404 | No tienes un vehículo registrado |
| `SOAT_NOT_VALID` | 400 | Tu SOAT no está vigente. No puedes registrar el vehículo sin un SOAT vigente. |
| `SOAT_EXPIRES_BEFORE_DEPARTURE` | 409 | Tu SOAT vence antes de la salida. Actualízalo en tu perfil para publicar. |
| `DRIVER_CANCELLATION_LIMIT` | 403 | Cancelaste N viajes en los últimos 30 días. Podrás publicar de nuevo desde el DD/MM. (`details.count`, `details.until`) |
| `RIDE_NOT_FOUND` | 404 | Viaje no encontrado |
| `RIDE_NOT_AVAILABLE` | 409 | Este viaje ya no está disponible |
| `NO_SEATS_AVAILABLE` | 409 | Este viaje ya no tiene asientos disponibles |
| `ALREADY_BOOKED` | 409 | Ya tienes una reserva confirmada en este viaje |
| `OWN_RIDE` | 403 | No puedes reservar tu propio viaje |
| `ACTIVE_BOOKING_EXISTS` | 409 | Ya tienes una reserva activa. Cancélala para reservar otro viaje. |
| `PASSENGER_CANCELLATION_LIMIT` | 403 | Cancelaste o no te presentaste a N viajes en los últimos 30 días. Podrás reservar de nuevo desde el DD/MM. (`details.count`, `details.until`) |
| `BOOKING_NOT_FOUND` | 404 | Reserva no encontrada (no existe o es de otro usuario) |
| `INVALID_STATUS` | 409 | Esta reserva ya no está confirmada / Este viaje ya no está publicado / Este viaje no está en curso |
| `CANCELLATION_DEADLINE_PASSED` | 409 | Ya no puedes cancelar: faltan menos de 30 minutos para la salida (RN-25, RN-26) |
| `START_WINDOW_CLOSED` | 409 | Podrás iniciar el viaje desde las HH:mm / Ya pasó el plazo para iniciar este viaje (RN-43) |
| `RIDE_IN_PROGRESS_EXISTS` | 409 | Finaliza tu viaje en curso para iniciar este. (RN-46) |
| `TRIP_IN_PROGRESS` | 409 | No puedes cambiar de modo durante un viaje en curso (RN-48) |
| `INSUFFICIENT_CREDITS` | 409 | Saldo insuficiente: necesitas N créditos y tienes M. (RN-39; `details.required`, `details.available`) |
| `OPERATION_CODE_ALREADY_USED` | 409 | Este código de operación ya fue registrado (RN-41) |
| `WITHDRAWAL_PENDING` | 409 | Ya tienes un retiro pendiente (RN-42) |
| `DRIVER_ROLE_REQUIRED` | 403 | Solo los conductores pueden retirar créditos (RF-12) |
| `RATING_NOT_ALLOWED` | 403 | Solo pueden calificar quienes hicieron el viaje (RN-47) |
| `RATING_WINDOW_CLOSED` | 409 | El plazo para calificar este viaje terminó (RN-47) |
| `ALREADY_RATED` | 409 | Ya calificaste a esta persona en este viaje (RN-47) |
| `OTP_INVALID` | 400 | Código inválido. Te quedan N intentos. (`details.attemptsLeft`) |
| `OTP_EXPIRED` | 400 | El código expiró. Solicita uno nuevo. |
| `OTP_ATTEMPTS_EXCEEDED` | 429 | Agotaste los intentos. Solicita un nuevo código. |
| `OTP_RESEND_TOO_SOON` | 429 | Podrás reenviar el código en N segundos (`details.retryAfter`) |

`INTERNAL_ERROR` usa otro mensaje cuando falla el envío del correo: «No pudimos enviar el código de verificación. Inténtalo nuevamente.»

### 4.4 Mensajes por endpoint

Cada tabla lista los errores de formato (`VALIDATION_ERROR`, en `errors`) y después los errores de negocio del endpoint.

**`POST /auth/register`**

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `email` | Obligatorio | El correo es obligatorio |
| `email` | Dominio `utp.edu.pe` | El correo debe ser del dominio utp.edu.pe |
| `password` | Obligatoria; de 8 a 72 caracteres con letras, números y símbolos | La contraseña debe tener entre 8 y 72 caracteres con letras, números y símbolos |
| `acceptedTerms` | Debe ser `true` | Debes aceptar los términos y condiciones |

Negocio: 409 `EMAIL_ALREADY_REGISTERED`.

**`POST /auth/complete-profile`**

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `firstName` | Obligatorio | Los nombres son obligatorios |
| `firstName` | Al menos una letra, máximo 60 caracteres | Los nombres deben tener al menos una letra y como máximo 60 caracteres |
| `lastName` | Obligatorio | Los apellidos son obligatorios |
| `lastName` | Al menos una letra, máximo 60 caracteres | Los apellidos deben tener al menos una letra y como máximo 60 caracteres |
| `departmentId` | Obligatorio | El departamento es obligatorio |
| `departmentId` | Identificador válido | El departamento no es válido |
| `districtId` | Obligatorio | El distrito es obligatorio |
| `districtId` | Identificador válido | El distrito no es válido |
| `campusId` | Obligatorio | La sede es obligatoria |
| `campusId` | Identificador válido | La sede no es válida |
| `photoFileId` | Opcional; si llega, identificador válido | La foto de perfil no es válida |

Negocio:

| Código | HTTP | Mensaje |
| --- | --- | --- |
| `INVALID_CATALOG_REFERENCE` | 400 | El departamento no existe |
| `INVALID_CATALOG_REFERENCE` | 400 | El distrito no pertenece al departamento |
| `INVALID_CATALOG_REFERENCE` | 400 | La sede no pertenece al distrito (también si la sede está inactiva) |
| `INVALID_FILE_REFERENCE` | 400 | La foto de perfil no existe o no te pertenece |
| `UNAUTHORIZED` | 401 | Tu sesión expiró. Vuelve a iniciar sesión. (la cuenta ya no existe o está bloqueada) |

**`POST /auth/login`**

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `email` | Obligatorio | El correo es obligatorio |
| `email` | Dominio `utp.edu.pe` | El correo debe ser del dominio utp.edu.pe |
| `password` | Obligatoria | La contraseña es obligatoria |

Negocio: 401 `INVALID_CREDENTIALS`, 403 `ACCOUNT_BLOCKED` y 500 `INTERNAL_ERROR` si no se pudo enviar el correo.

OTP solo en el primer login (RN-35): si `usuarios.ultima_conexion` está vacía, envía el código y responde el token `PRE_AUTH` con `otp`. Si ya tiene fecha, la actualiza y responde el token `SESSION` con `user`, sin OTP. `POST /auth/verify-code` registra `ultima_conexion` al validar el código; un código incorrecto no la registra.

**`POST /auth/verify-code`**

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `code` | Obligatorio; exactamente 6 dígitos | El código debe tener 6 dígitos |

Negocio: 400 `OTP_INVALID`, 400 `OTP_EXPIRED`, 429 `OTP_ATTEMPTS_EXCEEDED` y 401 `UNAUTHORIZED` si la cuenta ya no existe o está bloqueada.

**`POST /auth/resend-code`**

No recibe cuerpo. Negocio: 429 `OTP_RESEND_TOO_SOON` y 401 `UNAUTHORIZED`.

**`POST /auth/logout`**

No recibe cuerpo ni tiene errores propios; solo exige un token `SESSION`.

**`GET /catalogs/districts` y `GET /catalogs/campuses`**

| Parámetro | Regla | Mensaje |
| --- | --- | --- |
| `departmentId` / `districtId` | Obligatorio | El parámetro departmentId es obligatorio |
| `departmentId` / `districtId` | Identificador válido (también si llega vacío) | El parámetro departmentId no es válido |

`GET /catalogs/departments` no recibe parámetros. Un identificador válido que no existe devuelve una lista vacía, no un error.

**`GET /users/me`**

No recibe parámetros. Devuelve el perfil completo, con el vehículo si el usuario es conductor y, en `tripInProgress`, el viaje `EN_CURSO` que conduce o en el que viaja con su reserva `EN_VIAJE` (`rideId`, `role`, `origin`, `destination`, `startedAt`, y las copias `driver` y `vehicle`; `null` si no hay). `mobilityAssistance` es `{ type, note }` (`WHEELCHAIR`, `CRUTCHES_OR_WALKER` u `OTHER`) o `null`; es solo de lectura y nunca trae la fecha de consentimiento (RN-17, RN-22). El saldo no viene aquí: se consulta en `GET /wallet`. Los datos que el usuario aún no registra llegan como `null` (teléfono, documento, dirección de residencia, vehículo, calificación y, mientras no exista `POST /files`, la foto); las estadísticas empiezan en cero. Negocio: 401 `UNAUTHORIZED` si la cuenta ya no existe o está bloqueada.

**`PUT /users/me`**

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `firstName` | Obligatorio | Los nombres son obligatorios |
| `firstName` | Al menos una letra, máximo 60 caracteres | Los nombres deben tener al menos una letra y como máximo 60 caracteres |
| `lastName` | Obligatorio | Los apellidos son obligatorios |
| `lastName` | Al menos una letra, máximo 60 caracteres | Los apellidos deben tener al menos una letra y como máximo 60 caracteres |
| `phone` | Obligatorio | El teléfono es obligatorio |
| `phone` | `+51` seguido de 9 dígitos | El teléfono debe tener el formato +51 seguido de 9 dígitos |
| `activeMode` | Obligatorio | La modalidad es obligatoria |
| `activeMode` | `PASSENGER` o `DRIVER` | La modalidad no es válida |
| `photoFileId` | Opcional; si llega, identificador válido | La foto de perfil no es válida |

El documento de identidad solo se valida mientras el usuario no tenga uno; lo hace el servicio y responde igual, como `VALIDATION_ERROR`. Una vez guardado, `documentType` y `documentNumber` se ignoran, igual que `email`.

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `documentType` | Obligatorio la primera vez | El tipo de documento es obligatorio |
| `documentType` | `DNI` o `CE` | El tipo de documento no es válido |
| `documentNumber` | Obligatorio la primera vez | El número de documento es obligatorio |
| `documentNumber` | DNI: exactamente 8 dígitos | El DNI debe tener 8 dígitos |
| `documentNumber` | CE: de 8 a 12 letras o números | El carné de extranjería debe tener entre 8 y 12 letras o números |

Negocio:

| Código | HTTP | Mensaje |
| --- | --- | --- |
| `INVALID_FILE_REFERENCE` | 400 | La foto de perfil no existe o no te pertenece |
| `VEHICLE_REQUIRED` | 403 | Registra un vehículo para usar la modalidad de conductor (`activeMode` es `DRIVER` y el usuario no tiene un vehículo `ACTIVO`) |
| `PROFILE_INCOMPLETE` | 409 | Completa tu perfil antes de actualizar tus datos (la cuenta sigue en `PROFILE_PENDING`) |
| `TRIP_IN_PROGRESS` | 409 | No puedes cambiar de modo durante un viaje en curso (`activeMode` cambia y hay un viaje `EN_CURSO`, RN-48) |
| `UNAUTHORIZED` | 401 | Tu sesión expiró. Vuelve a iniciar sesión. (la cuenta ya no existe o está bloqueada) |

**`PATCH /users/me/mode`**

Cambia solo `modo_activo`, después de confirmar en el modal del perfil (RF-14, RN-48). Pedir el modo que ya está activo responde 200 sin guardar nada.

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `activeMode` | Obligatorio | La modalidad es obligatoria |
| `activeMode` | `PASSENGER` o `DRIVER` | La modalidad no es válida |

Negocio, en orden: 401 `UNAUTHORIZED`, 409 `PROFILE_INCOMPLETE`, 403 `VEHICLE_REQUIRED` («Registra un vehículo para usar la modalidad de conductor»: pasa a `DRIVER` sin vehículo o con vehículo `INACTIVO`) y 409 `TRIP_IN_PROGRESS` («No puedes cambiar de modo durante un viaje en curso»: conduce un viaje `EN_CURSO` o tiene una reserva `EN_VIAJE`). Responde 200 con el perfil. `PUT /users/me` aplica las mismas dos reglas cuando `activeMode` cambia.

Si cambia el nombre o la foto de un conductor, el servicio actualiza su copia (`conductor.nombre`, `conductor.foto_url`) en sus viajes `PUBLICADO` o `EN_CURSO`.

**`POST /vehicles` y `PUT /vehicles/me`**

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `plate` | Obligatoria | La placa es obligatoria |
| `plate` | Formato de placa del Perú (RN-07) | La placa debe tener el formato ABC-123 |
| `type` | Obligatorio | El tipo de vehículo es obligatorio |
| `type` | `SEDAN`, `HATCHBACK`, `SUV`, `VAN` o `MOTORCYCLE` | El tipo de vehículo no es válido |
| `brand` | Obligatoria | La marca es obligatoria |
| `brand` | Máximo 40 caracteres | La marca debe tener como máximo 40 caracteres |
| `model` | Obligatorio | El modelo es obligatorio |
| `model` | Máximo 40 caracteres | El modelo debe tener como máximo 40 caracteres |
| `color` | Obligatorio | El color es obligatorio |
| `color` | Máximo 30 caracteres | El color debe tener como máximo 30 caracteres |
| `year` | Obligatorio | El año de fabricación es obligatorio |
| `year` | Entre 2000 y el año actual (RN-08) | El año de fabricación debe estar entre 2000 y el año actual |
| `seats` | Obligatorias | Las plazas son obligatorias |
| `seats` | Entre 1 y 10 (RN-09) | Las plazas deben estar entre 1 y 10 |
| `ownerDni` | Obligatorio en `POST`; opcional en `PUT` | El DNI del propietario es obligatorio |
| `ownerDni` | Exactamente 8 dígitos | El DNI debe tener 8 dígitos |
| `acceptedTerms` | Debe ser `true` | Debes aceptar los términos y condiciones |
| `photoFileId` | Opcional; si llega, identificador válido | La foto del vehículo no es válida |
| `accessibility` | Opcional: `{ wheelchair, boardingAssistance }`; lo que no llega vale `false` | — |
| `soat` | Opcional mientras P05 y P16 no lo pidan (RN-36) | — |
| `soat.insurer` | Obligatoria; máximo 60 caracteres | La aseguradora es obligatoria / La aseguradora debe tener como máximo 60 caracteres |
| `soat.policyNumber` | Obligatorio; de 6 a 20 letras, números o guiones | El número de póliza es obligatorio / El número de póliza debe tener de 6 a 20 letras, números o guiones |
| `soat.startDate` | Obligatoria (`AAAA-MM-DD`) | La fecha de inicio del SOAT es obligatoria |
| `soat.endDate` | Obligatoria (`AAAA-MM-DD`) | La fecha de fin del SOAT es obligatoria |
| `soat.endDate` | Posterior a la de inicio; lo valida el servicio | La fecha de fin debe ser posterior a la de inicio |
| `soat.endDate` | Vigencia de 366 días como máximo; lo valida el servicio | La vigencia del SOAT no puede superar los 366 días |
| `soat.photoFileId` | Opcional; si llega, identificador válido de propósito `FOTO_SOAT` | La foto del SOAT no es válida |
| `accessibility` | Una moto no marca ningún check (RN-18); lo valida el servicio | Una moto no puede marcarse como accesible |

`isOwner` es opcional: en el registro vale `false` si no llega y en la actualización conserva el valor guardado. `PUT /vehicles/me` no modifica el `ownerDni` de un vehículo ya registrado y, si no llega `photoFileId`, conserva la foto actual; mientras no exista `POST /files` no exige que el vehículo tenga foto (RN-15).

Negocio:

| Código | HTTP | Mensaje | Endpoint |
| --- | --- | --- | --- |
| `INVALID_FILE_REFERENCE` | 400 | La foto del vehículo no existe o no te pertenece | Ambos |
| `PLATE_ALREADY_REGISTERED` | 409 | La placa ya está registrada | Ambos |
| `SOAT_NOT_VALID` | 400 | Tu SOAT no está vigente. No puedes registrar el vehículo sin un SOAT vigente. (hoy no está entre `startDate` y `endDate`) | Ambos |
| `PROFILE_INCOMPLETE` | 409 | Completa tu perfil antes de registrar tu vehículo | `POST`, y `PUT` si el usuario no tiene vehículo |
| `VEHICLE_ALREADY_REGISTERED` | 409 | Ya tienes un vehículo registrado | `POST` |
| `UNAUTHORIZED` | 401 | Tu sesión expiró. Vuelve a iniciar sesión. (la cuenta ya no existe o está bloqueada) | Ambos |

`POST /vehicles` responde 201 con el vehículo y agrega el rol `CONDUCTOR` al usuario; no cambia su modalidad activa. `PUT /vehicles/me` actualiza la copia del vehículo (marca, modelo, color, placa, `apto_movilidad_reducida` y `soat_fecha_fin`) en los viajes `PUBLICADO` o `EN_CURSO` del conductor; las plazas de esos viajes no cambian. Si no llegan `accessibility` o `soat`, conserva los guardados; si el vehículo pasa a ser una moto sin enviar `accessibility`, se le quitan los checks.

En MongoDB, la accesibilidad va en `vehiculo.accesibilidad` (`silla_ruedas`, `ayuda_abordaje`) y el SOAT en `vehiculo.soat`, con las fechas al inicio del día en hora de Perú. La respuesta siempre trae `accessibility` (en `false` si el vehículo no la tiene guardada) y `soat` en `null` si no se declaró.

Si el usuario todavía no tiene vehículo, `PUT /vehicles/me` no lo rechaza: lo registra igual que `POST /vehicles` (agrega el rol `CONDUCTOR`, responde 200) y no toca los viajes, porque no hay ninguno. Como «Actualizar vehículo» no pide el DNI del propietario, `ownerDni` es opcional: si no llega se guarda el DNI del usuario, si ya lo registró en «Actualizar datos», y si no queda vacío.

**`GET /vehicles/me`**

No recibe parámetros. Negocio: 404 `VEHICLE_NOT_FOUND` si el usuario no tiene vehículo y 401 `UNAUTHORIZED`.

**`GET /rides`**

Todos los filtros son opcionales.

| Parámetro | Regla | Mensaje |
| --- | --- | --- |
| `campusId` | Identificador válido | El parámetro campusId no es válido |
| `destination` | Máximo 100 caracteres | El destino debe tener como máximo 100 caracteres |
| `time` | `HH:mm` de 24 horas | La hora debe tener el formato HH:mm |
| `passengers` | Entero de 1 a 99 | El número de pasajeros debe ser al menos 1 |
| `accessible` | `true` o `false` | El parámetro accessible debe ser true o false |
| `page` | Entero de 1 a 9999 | La página debe ser un número mayor o igual a 1 |

Lista 20 viajes `PUBLICADO` de todas las sedes (RN-49) con salida futura y plazas suficientes, sin los del propio usuario, ordenados por hora de salida. `campusId` restringe a una sede y `accessible=true` deja solo los vehículos aptos (RN-19). La respuesta es `{ data, page, hasMore, activeBooking, bookingBlock }`: `activeBooking` es la reserva `CONFIRMADA` o `EN_VIAJE` del usuario (RN-23) y `bookingBlock` su bloqueo por cancelaciones (RN-38, `max_cancelaciones_pasajero` de la colección `app`); cada uno es `null` si no aplica. Cada viaje trae `campus: { id, name, city }`: `city` es el distrito de la sede (`sedes.distrito.nombre`), copiado en `viajes.sede.ciudad` al publicar. Con `time` solo devuelve los viajes de hoy (hora de Perú) desde esa hora. `destination` busca en la etiqueta y la dirección del destino sin distinguir mayúsculas ni tildes.

**`POST /rides`**

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `direction` | Obligatorio | El sentido del viaje es obligatorio |
| `direction` | `TO_CAMPUS` o `TO_HOME` | El sentido del viaje no es válido |
| `departureTime` | Obligatoria | La hora de salida es obligatoria |
| `departureTime` | Futura y entre las 6:00 y las 23:00 de Perú (RN-12) | La hora de salida debe ser futura y estar entre las 6:00 y las 23:00 |
| `origin` | Obligatorio | El punto de partida es obligatorio |
| `destination` | Obligatorio | El destino es obligatorio |
| `stops` | Máximo 5 | Puedes agregar como máximo 5 paradas |
| `pricePerSeat` | Obligatorio | El precio por plaza es obligatorio |
| `pricePerSeat` | Entre 1 y 10 (RN-13) | El precio por plaza debe estar entre 1 y 10 |
| `seats` | Obligatorias | Las plazas son obligatorias |
| `seats` | Al menos 1 | Debes ofrecer al menos 1 plaza |
| `seats` | Como máximo las del vehículo (RN-11); lo valida el servicio | Las plazas no pueden superar las de tu vehículo |
| `conditions` | Máximo 10 | Puedes agregar como máximo 10 condiciones |
| `conditions[n]` | De 1 a 120 caracteres | Cada condición debe tener entre 1 y 120 caracteres |

`origin`, `destination` y cada elemento de `stops` son un lugar; sus errores llevan el campo con notación de punto (`origin.location.lat`, `stops[0].label`).

| Campo del lugar | Regla | Mensaje |
| --- | --- | --- |
| `label` | Obligatorio | El nombre del lugar es obligatorio |
| `label` | Máximo 80 caracteres | El nombre del lugar debe tener como máximo 80 caracteres |
| `address` | Opcional; máximo 160 caracteres | La dirección debe tener como máximo 160 caracteres |
| `location` | Obligatoria | La ubicación es obligatoria |
| `location.lat` | Obligatoria; entre -90 y 90 | La latitud es obligatoria / La latitud debe estar entre -90 y 90 |
| `location.lng` | Obligatoria; entre -180 y 180 | La longitud es obligatoria / La longitud debe estar entre -180 y 180 |

Una `departureTime` que no es una fecha ISO 8601 responde como cuerpo ilegible: «El cuerpo de la solicitud no es un JSON válido».

Negocio, en este orden:

| Código | HTTP | Regla | Mensaje |
| --- | --- | --- | --- |
| `UNAUTHORIZED` | 401 | La cuenta ya no existe o está bloqueada | Tu sesión expiró. Vuelve a iniciar sesión. |
| `VEHICLE_REQUIRED` | 403 | Sin vehículo o con vehículo `INACTIVO` (RN-24) | Registra un vehículo para publicar viajes |
| `DRIVER_CANCELLATION_LIMIT` | 403 | `max_cancelaciones_conductor` (10) o más viajes cancelados por el conductor o el sistema en los últimos `ventana_cancelaciones_dias` (30) (RN-30) | Cancelaste N viajes en los últimos 30 días. Podrás publicar de nuevo desde el DD/MM. |
| `SOAT_EXPIRES_BEFORE_DEPARTURE` | 409 | El SOAT declarado no está vigente en el día de salida (RN-37); sin SOAT no se valida | Tu SOAT vence antes de la salida. Actualízalo en tu perfil para publicar. |

`DRIVER_CANCELLATION_LIMIT` trae `details.count` (cancelaciones en la ventana) y `details.until` (desde cuándo podrá publicar: la fecha en que sale de la ventana la cancelación que lo deja por debajo del límite). Los parámetros se leen en cada solicitud del documento `{ _id: "config" }` de la colección `app` (RN-31); si falta un valor, se usa el de por defecto. `GET /users/me` informa el mismo bloqueo en `cancellationBlock`, para que «Publicar viaje» se bloquee desde la entrada.

Responde 201 con el detalle del viaje y la cabecera `Location` (`/api/rides/{rideId}`). Conductor, vehículo (con `apto_movilidad_reducida` y `soat_fecha_fin`) y sede se copian del usuario; en la respuesta, `vehicle.wheelchairAccessible` y `vehicle.soatEndDate`. `distanceKm` es la suma en línea recta entre origen, paradas y destino, con un decimal; `durationMin` la estima a 35 km/h, con un mínimo de 1 minuto.

**`GET /rides/mine`**

No recibe parámetros. Devuelve `{ data, cancellations }`: los viajes `PUBLICADO` y `EN_CURSO` del conductor, el que está en curso primero y luego por hora de salida. Cada elemento trae `ride` (el resumen del listado, con `startedAt`), `passengers` (reservas `CONFIRMADA`, `EN_VIAJE` y `NO_SE_PRESENTO`, con la calificación y la foto actuales de cada pasajero) y los plazos `cancellableUntil` (salida − `minutos_limite_cancelacion`), `startableFrom` (salida − `minutos_inicio_anticipado`) y `startableUntil` (salida + `minutos_tolerancia_inicio`). `cancellations` es el contador de RN-30: `count`, `limit`, `windowDays`, `blockedUntil` y `blockedUntilIfCancelled` (el bloqueo que tendría con una cancelación más ahora, para la advertencia de 17-D). Lo usan el dashboard en modo conductor y Mis viajes.

**`POST /rides/{rideId}/cancel`** (conductor, RN-26)

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `reason` | Opcional; hasta 200 caracteres | El motivo debe tener como máximo 200 caracteres |

El cuerpo es opcional. Negocio: 404 `RIDE_NOT_FOUND` (no existe o es de otro conductor), 409 `INVALID_STATUS` («Este viaje ya no está publicado») y 409 `CANCELLATION_DEADLINE_PASSED` («Ya no puedes cancelar: faltan menos de 30 minutos para la salida. Si no puedes hacer el viaje, no lo inicies y se cancelará solo.»). En una transacción, el viaje pasa a `CANCELADO` con `cancelado_por = CONDUCTOR`, `motivo_cancelacion` y `fecha_cancelacion`, y sus reservas `CONFIRMADA` a `CANCELADA` con `cancelada_por = CONDUCTOR`, cada una con su reembolso del 100 % (movimiento `REEMBOLSO`, RN-40). Responde 200 con `{ "message": "Viaje cancelado" }`.

**`POST /rides/{rideId}/start`** (conductor, RN-43, RN-46)

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `boardedBookingIds` | Obligatorio (puede ir vacío) | Indica qué pasajeros subieron |
| `boardedBookingIds[]` | Identificadores válidos | El identificador no es válido |

Negocio, en orden: 404 `RIDE_NOT_FOUND`, 409 `INVALID_STATUS` («Este viaje ya no está publicado»), 409 `START_WINDOW_CLOSED` (antes de salida − 15 min: «Podrás iniciar el viaje desde las HH:mm»; después de salida + 30 min: «Ya pasó el plazo para iniciar este viaje»), 409 `RIDE_IN_PROGRESS_EXISTS` («Finaliza tu viaje en curso para iniciar este.») y 400 `VALIDATION_ERROR` si una reserva no es `CONFIRMADA` de este viaje («Hay reservas que no pertenecen a este viaje»). En una transacción, el viaje pasa a `EN_CURSO` con `fecha_inicio`, las reservas de la lista a `EN_VIAJE` y el resto de las `CONFIRMADA` a `NO_SE_PRESENTO`. Responde 200 con `{ "message": "Viaje iniciado" }`.

**`POST /rides/{rideId}/finish`** (conductor, RN-45)

Sin cuerpo. Negocio: 404 `RIDE_NOT_FOUND` y 409 `INVALID_STATUS` («Este viaje no está en curso»). En una transacción, el viaje pasa a `COMPLETADO` con `fecha_fin` y `finalizado_por = CONDUCTOR`, y sus reservas `EN_VIAJE` a `COMPLETADA`. En la misma transacción se liquidan (RN-40): lo retenido de cada reserva `COMPLETADA` o `NO_SE_PRESENTO` con `liquidada = false` se paga al conductor (un `COBRO_VIAJE` por reserva) y sale de `creditos_retenidos` del pasajero. Responde 200 con `{ "message": "Viaje completado" }`.

**`GET /bookings/mine`** (pasajero, RF-06)

Devuelve `{ active, cancelled, cancellations }`: la reserva activa (`CONFIRMADA` o `EN_VIAJE`), las que le cancelaron el conductor o el sistema en las últimas 24 h y el contador de RN-38 (con la misma forma que el del conductor). Cada reserva trae `id`, `status` (`CONFIRMED`, `IN_RIDE` o `CANCELLED`), `cancelledBy` (`DRIVER` o `SYSTEM` en las canceladas), `seats`, `totalCredits`, `cancellableUntil` y `ride` (el resumen del viaje).

**`POST /bookings/{bookingId}/cancel`** (pasajero, RN-25)

Sin cuerpo. Negocio: 404 `BOOKING_NOT_FOUND` (no existe o es de otro usuario), 409 `INVALID_STATUS` («Esta reserva ya no está confirmada») y 409 `CANCELLATION_DEADLINE_PASSED` («Ya no puedes cancelar: faltan menos de 30 minutos para la salida»). En una transacción, la reserva pasa a `CANCELADA` con `cancelada_por = PASAJERO` y `fecha_cancelacion`, y sus plazas vuelven al viaje si sigue `PUBLICADO`; lo retenido vuelve al 100 % (movimiento `REEMBOLSO`). Responde 200 con `{ "message": "Reserva cancelada. Te devolvimos N créditos." }`, o «Reserva cancelada.» si la reserva es anterior a la billetera (sin `liquidada`) y no retuvo créditos.

**`GET /rides/{rideId}`**

| Parámetro | Regla | Mensaje |
| --- | --- | --- |
| `rideId` | Identificador válido | El parámetro rideId no es válido |

Responde para cualquier estado del viaje. Negocio: 404 `RIDE_NOT_FOUND`.

Además del viaje, trae lo que decide la barra inferior del detalle (P09). Si la reserva activa del usuario (`CONFIRMADA` o `EN_VIAJE`) es de este viaje, va en `myBooking`, con `status` (`CONFIRMED` o `IN_RIDE`), `seats`, `totalCredits` y `cancellableUntil`: la salida menos `minutos_limite_cancelacion` (30) de la colección `app` (RN-25). Si es de otro viaje, va en `activeBooking`, con la misma forma que en `GET /rides` (RN-23). Sin reserva activa, `bookingBlock` informa el bloqueo por cancelaciones (RN-38). Los tres son `null` si no aplican.

**`POST /rides/{rideId}/reserve`**

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `seats` | Opcional; al menos 1 | Debes reservar al menos 1 plaza |

El cuerpo es opcional: sin cuerpo, o sin `seats`, se reserva 1 plaza. Responde 201 con `{ "message": "Reserva confirmada" }`.

Negocio, en el orden en que se comprueba:

| Código | HTTP | Mensaje |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | Tu sesión expiró. Vuelve a iniciar sesión. (la cuenta ya no existe o está bloqueada) |
| `PROFILE_INCOMPLETE` | 409 | Completa tu perfil antes de reservar un viaje |
| `RIDE_NOT_FOUND` | 404 | Viaje no encontrado |
| `OWN_RIDE` | 403 | No puedes reservar tu propio viaje |
| `RIDE_NOT_AVAILABLE` | 409 | Este viaje ya no está disponible (no está `PUBLICADO` o ya salió) |
| `ALREADY_BOOKED` | 409 | Ya tienes una reserva confirmada en este viaje |
| `ACTIVE_BOOKING_EXISTS` | 409 | Ya tienes una reserva activa. Cancélala para reservar otro viaje. (RN-23: otra reserva `CONFIRMADA` o `EN_VIAJE`) |
| `PASSENGER_CANCELLATION_LIMIT` | 403 | Cancelaste o no te presentaste a N viajes en los últimos 30 días. Podrás reservar de nuevo desde el DD/MM. (RN-38) |
| `NO_SEATS_AVAILABLE` | 409 | Este viaje ya no tiene asientos disponibles |
| `INSUFFICIENT_CREDITS` | 409 | Saldo insuficiente: necesitas N créditos y tienes M. (RN-39) |

El descuento de plazas, la creación de la reserva (con `liquidada = false`) y la retención del total (movimiento `RETENCION_RESERVA`: baja `saldo_creditos` y sube `creditos_retenidos`) van en una misma transacción de MongoDB (`MongoTransactionManager`, en `MongoConfig`). El descuento filtra por `plazas_disponibles >= seats`, así que dos pasajeros no pueden llevarse la última plaza; si dos reservas chocan dentro de la transacción, se reintenta hasta 3 veces. El índice único parcial de `reservas` cubre la doble reserva simultánea del mismo pasajero.

**`GET /wallet`** (RF-11)

Devuelve `{ available, held, withdrawable, activeMode, driver, heldBooking, pendingWithdrawal, lastYapePhone, limits }`. `available` y `held` son `saldo_creditos` y `creditos_retenidos` (0 si faltan en cuentas antiguas). `withdrawable` es mín(disponible, Σ `COBRO_VIAJE` − Σ retiros no `RECHAZADO`) (RN-42). `heldBooking` es la reserva activa que retuvo créditos; `pendingWithdrawal`, el retiro `PENDIENTE` con los 3 últimos dígitos del celular; `limits`, `recarga_minima`, `recarga_maxima` y `retiro_minimo` de la colección `app`.

**`GET /wallet/movements?page=N`** (RF-11)

`{ data, page, hasMore }`, 20 por página, del más reciente al más antiguo. Cada movimiento trae `type` (`TOP_UP`, `BOOKING_HOLD`, `REFUND`, `RIDE_EARNING`, `WITHDRAWAL` o `WITHDRAWAL_REVERSAL`), `amount` con signo, `balanceAfter`, `description`, `createdAt` y, en los retiros, `withdrawal` con su `status` actual (`PENDING`, `PAID` o `REJECTED`) y `rejectionReason`.

**`POST /wallet/top-ups`** (RN-41)

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `amount` | Obligatorio; entero entre `recarga_minima` (5) y `recarga_maxima` (200) | Elige un monto entre S/ 5 y S/ 200. |
| `operationCode` | Obligatorio; de 6 a 12 dígitos | El código de operación tiene de 6 a 12 dígitos. |

Negocio: 409 `PROFILE_INCOMPLETE` («Completa tu perfil antes de recargar créditos») y 409 `OPERATION_CODE_ALREADY_USED` («Este código de operación ya fue registrado»; también lo da el índice único de `pagos.referencia_proveedor` ante dos recargas simultáneas). En una transacción se crea el pago `APROBADO` (`monto_centimos`, `proveedor = SIMULADO`), el movimiento `RECARGA` y sube el saldo, 1 crédito por sol. Responde 201 con `{ credits, balance, operationCode, createdAt }`.

**`POST /wallet/withdrawals`** (RN-42)

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `amount` | Obligatorio; desde `retiro_minimo` (10) hasta el saldo retirable | El retiro mínimo es de 10 créditos. / Solo puedes retirar hasta N créditos (lo que ganaste como conductor) |
| `yapePhone` | Obligatorio; 9 dígitos que empiezan con 9 | Ingresa un celular de 9 dígitos que empiece con 9. |

Negocio, en orden: 403 `DRIVER_ROLE_REQUIRED` («Solo los conductores pueden retirar créditos»), 400 el mínimo, 409 `WITHDRAWAL_PENDING` («Ya tienes un retiro pendiente»; también lo da el índice único parcial de `retiros`) y 400 el tope retirable. En una transacción se crea el retiro `PENDIENTE` y el movimiento `RETIRO`, que descuenta el saldo. Responde 201 con `{ id, credits, phoneLast3, status, requestedAt, balance }`.

**`GET /history?role=PASSENGER|DRIVER&page=N`** (RF-09, RN-50)

`role` es obligatorio: otro valor responde 400 `VALIDATION_ERROR` en `role` («El rol debe ser PASSENGER o DRIVER»). `{ data, page, hasMore }`, 20 por página, del más reciente al más antiguo por hora de salida. Como pasajero lista sus reservas `COMPLETADA`, `CANCELADA` y `NO_SE_PRESENTO` con el viaje (sede, conductor, vehículo); `credits` es `total_creditos` (0 si la reserva es anterior a la billetera). Como conductor lista sus viajes `COMPLETADO` y `CANCELADO` con los pasajeros que subieron, `noShows`, `refundedBookings` y `credits` (lo cobrado de las reservas `COMPLETADA` y `NO_SE_PRESENTO` liquidadas). En los completados, `rating` trae `deadline` (`fecha_fin` + `dias_para_calificar`), `open`, `pending` y `given` (nombre y puntaje, sin comentario). Nunca expone la asistencia de movilidad (RN-22).

**`GET /ratings/rides/{rideId}`** (RF-10)

404 `RIDE_NOT_FOUND`; 403 `RATING_NOT_ALLOWED` («Solo pueden calificar quienes hicieron el viaje») si el viaje no está `COMPLETADO` o el usuario no es su conductor ni un pasajero `COMPLETADA`. Devuelve `{ ride, role, deadline, open, targets }`: el pasajero recibe a su conductor (con el vehículo) y el conductor, a cada pasajero `COMPLETADA`; `rated` marca a quien ya calificó. Con el plazo vencido responde 200 con `open: false`.

**`POST /ratings`** (RN-47)

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `bookingId` | Obligatorio; ObjectId | Indica la reserva que calificas / El identificador no es válido |
| `score` | Obligatorio; entero de 1 a 5 | Toca una estrella para calificar / Elige de 1 a 5 estrellas |
| `comment` | Opcional; hasta 200 caracteres (en blanco se guarda `null`) | El comentario admite hasta 200 caracteres |

Negocio, en orden: 403 `RATING_NOT_ALLOWED` (reserva inexistente o no `COMPLETADA`, viaje no `COMPLETADO`, o el autor no es el pasajero de la reserva ni el conductor del viaje), 409 `RATING_WINDOW_CLOSED` («El plazo para calificar este viaje terminó»: pasaron `dias_para_calificar` días desde `fecha_fin`) y 409 `ALREADY_RATED` («Ya calificaste a esta persona en este viaje»; también lo da el índice único `reserva_id` + `autor.id` + `usuario_calificado_id` ante dos envíos simultáneos). En una transacción se inserta la calificación y se recalcula `usuarios.calificacion` del calificado con una agregación (promedio a un decimal y cantidad); después se copia en `conductor.calificacion` de sus viajes `PUBLICADO` y `EN_CURSO`. Responde 201 con `{ id, rideId, bookingId, ratedUserId, ratedRole, score, comment, createdAt }`. El comentario solo se devuelve aquí, a su autor.

El operador resuelve el retiro en Atlas: `estado = PAGADO` con `codigo_operacion` y `fecha_resolucion`, o `estado = RECHAZADO` con `motivo_rechazo`. `ReversionRetirosJob` (cada 60 s, configurable con `app.jobs.reversion-retiros`) devuelve los rechazados con `reversion_aplicada` distinto de `true`: inserta `REVERSION_RETIRO`, sube el saldo y marca `reversion_aplicada = true`, en una transacción.

## 5. Ejemplos con curl

Los ejemplos asumen la API en `http://localhost:8080/api`. Con `MAIL_ENABLED=false` el código OTP aparece en el log del backend.

Las mismas solicitudes están en [docs/http/](../docs/http/), un archivo `.http` por endpoint (para la extensión REST Client de VS Code o el cliente HTTP de IntelliJ), con los casos de error y la respuesta esperada de cada uno. Los tokens se pegan en las variables del inicio de cada archivo.

```bash
API=http://localhost:8080/api
```

Catálogos (públicos):

```bash
curl "$API/catalogs/departments"
curl "$API/catalogs/districts?departmentId=<departmentId>"
curl "$API/catalogs/campuses?districtId=<districtId>"
```

Registro. La respuesta trae el token `REGISTRATION`:

```bash
curl -X POST "$API/auth/register" -H "Content-Type: application/json" \
  -d '{"email":"ana.torres@utp.edu.pe","password":"Clave#2026","acceptedTerms":true}'
```

Completar perfil, con el token `REGISTRATION`:

```bash
curl -X POST "$API/auth/complete-profile" -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token REGISTRATION>" \
  -d '{"firstName":"Ana","lastName":"Torres","departmentId":"<departmentId>","districtId":"<districtId>","campusId":"<campusId>"}'
```

Login. En el primer login de la cuenta la respuesta trae el token `PRE_AUTH` y envía el código OTP. Desde el segundo login trae directamente el token `SESSION` y no hay que verificar código (RN-35):

```bash
curl -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"ana.torres@utp.edu.pe","password":"Clave#2026"}'
```

Verificar el código, con el token `PRE_AUTH`. La respuesta trae el token `SESSION`:

```bash
curl -X POST "$API/auth/verify-code" -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token PRE_AUTH>" \
  -d '{"code":"123456"}'
```

Reenviar el código, con el token `PRE_AUTH` y pasados 45 segundos:

```bash
curl -X POST "$API/auth/resend-code" -H "Authorization: Bearer <token PRE_AUTH>"
```

Cerrar sesión, con el token `SESSION`:

```bash
curl -X POST "$API/auth/logout" -H "Authorization: Bearer <token SESSION>"
```

Consultar y actualizar el perfil, con el token `SESSION`. El documento solo hace falta la primera vez:

```bash
curl "$API/users/me" -H "Authorization: Bearer <token SESSION>"

curl -X PUT "$API/users/me" -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token SESSION>" \
  -d '{"firstName":"Ana","lastName":"Torres","documentType":"DNI","documentNumber":"72345678","phone":"+51987654321","activeMode":"PASSENGER"}'
```

Registrar el vehículo, con el token `REGISTRATION` o `SESSION`; consultarlo y actualizarlo, con el token `SESSION`:

```bash
curl -X POST "$API/vehicles" -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"plate":"ABC-123","type":"SEDAN","brand":"Toyota","model":"Yaris","color":"Blanco","year":2021,"seats":3,"ownerDni":"45678912","isOwner":true,"acceptedTerms":true}'

curl "$API/vehicles/me" -H "Authorization: Bearer <token SESSION>"

curl -X PUT "$API/vehicles/me" -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token SESSION>" \
  -d '{"plate":"ABC-123","type":"SEDAN","brand":"Toyota","model":"Yaris","color":"Gris","year":2021,"seats":2,"acceptedTerms":true}'
```

Viajes, con el token `SESSION`. La hora de salida va en UTC: las 18:30Z son las 13:30 de Perú.

```bash
curl -X POST "$API/rides" -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token SESSION del conductor>" \
  -d '{"direction":"TO_HOME","departureTime":"<fecha futura>T18:30:00Z","origin":{"label":"UTP Sede Trujillo","location":{"lat":-8.0975,"lng":-79.0353}},"destination":{"label":"Huaca del Dragón","address":"La Esperanza, Trujillo","location":{"lat":-8.0716,"lng":-79.0412}},"pricePerSeat":5,"seats":3,"conditions":["No gritar"]}'

curl "$API/rides?destination=huaca&passengers=1" -H "Authorization: Bearer <token SESSION del pasajero>"
curl "$API/rides/<rideId>" -H "Authorization: Bearer <token SESSION>"
curl -X POST "$API/rides/<rideId>/reserve" -H "Authorization: Bearer <token SESSION del pasajero>"
```

Para comprobar el aislamiento de alcances, repite la llamada de cierre de sesión con el token `PRE_AUTH`: debe responder 403 `FORBIDDEN_SCOPE`.

## 6. Guía para agregar un endpoint

Los pasos siguen las convenciones de los módulos ya implementados. El ejemplo es `POST /vehicles`, ya implementado en el módulo `vehicles`.

1. **Partir del contrato.** El endpoint ya está definido en [docs/openapi.yaml](../docs/openapi.yaml): campos, respuestas y códigos de error. Si algo cambia, se actualiza primero ahí.

2. **Crear el DTO de la solicitud con sus validaciones.** Es un record en `<módulo>/domain/dto`, con una anotación y el mensaje exacto por cada regla. Lo que haya que normalizar va en el constructor, para que ocurra antes de validar.

   ```java
   public record VehiculoRequest(
           @NotBlank(message = "La placa es obligatoria")
           @PlacaPeru String plate,
           @NotNull(message = "Las plazas son obligatorias")
           @Min(value = 1, message = "Las plazas deben estar entre 1 y 10")
           @Max(value = 10, message = "Las plazas deben estar entre 1 y 10") Integer seats) {

       public VehiculoRequest {
           plate = plate == null ? null : plate.trim().toUpperCase();
       }
   }
   ```

3. **Si la regla es propia del negocio, crear su anotación.** Por ejemplo `@PlacaPeru` (RN-07) en `vehicles/domain/validation`, con la misma forma que `CorreoUtp`. El valor nulo o vacío se considera válido y lo cubre `@NotBlank` o `@NotNull`: así cada campo devuelve un solo error.

4. **Agregar los códigos de error nuevos.** En el enum `CodigoError`, con su estado HTTP y el nombre que fija el contrato: `PLATE_ALREADY_REGISTERED(HttpStatus.CONFLICT)`.

5. **Escribir el servicio solo con reglas de estado.** Recibe el DTO ya válido, así que no revisa formatos.
   - Una regla de negocio lanza `new ApiException(CodigoError.PLATE_ALREADY_REGISTERED, "La placa ya está registrada")`.
   - Una regla que necesita la base de datos pero pertenece a un campo lanza `new ValidacionException("seats", "Las plazas no pueden superar las de tu vehículo")`, que responde como `VALIDATION_ERROR`.

6. **Exponer el controlador.** El cuerpo lleva `@Valid @RequestBody` y el usuario sale del token con `@AuthenticationPrincipal Jwt`, como en `AuthController`. Los identificadores de la ruta o de la consulta se declaran como `ObjectId`.

7. **Revisar el alcance de la ruta.** Toda ruta nueva exige un token `SESSION` sin configurar nada. Solo se toca `SecurityConfig` si es pública o admite otro alcance. Según el contrato, `POST /vehicles` admite `REGISTRATION` o `SESSION`:

   ```java
   .requestMatchers(HttpMethod.POST, "/vehicles").hasAnyAuthority(REGISTRATION, SESSION)
   ```

8. **Persistir con actualización parcial.** `Usuario` solo declara los campos que usan los módulos ya implementados. Después de crear el documento se actualiza con `$set` (`mongoTemplate.updateFirst`) y nunca con `save()`, que lo reemplazaría entero y borraría los campos que la clase todavía no conoce.

9. **Probar y documentar.** Agregar los casos del endpoint a `ValidacionSolicitudesTest`, el camino feliz y las reglas de estado a la prueba de su servicio (como `VehiculoServiceTest`), y sus mensajes a la sección 4.4 de este documento.
