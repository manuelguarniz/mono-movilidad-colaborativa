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

El contrato define 19 endpoints y el backend implementa 18. Toda la API cuelga de `/api`.

| Módulo | Endpoints | Estado |
| --- | --- | --- |
| Autenticación | `POST /auth/login`, `/auth/verify-code`, `/auth/resend-code`, `/auth/logout` | Implementado |
| Registro | `POST /auth/register`, `/auth/complete-profile` | Implementado; la foto de perfil es opcional hasta que exista `POST /files` |
| Catálogos | `GET /catalogs/departments`, `/catalogs/districts`, `/catalogs/campuses` | Implementado |
| Archivos | `POST /files` | Pendiente; solo existen el modelo y el repositorio |
| Vehículos | `POST /vehicles`, `GET` y `PUT /vehicles/me` | Implementado; la foto es opcional hasta que exista `POST /files` |
| Viajes y reservas | `GET` y `POST /rides`, `GET /rides/{rideId}`, `POST /rides/{rideId}/reserve` | Implementado |
| Perfil | `GET` y `PUT /users/me` | Implementado; la foto es opcional hasta que exista `POST /files` |

El código está en `pe.edu.utp.app_movilidadcolaborativa`, organizado por módulo. Cada módulo tiene tres capas: `application` (casos de uso), `domain` (model, dto, validation) e `infrastructure` (web, persistence, security, mail).

| Paquete | Contenido |
| --- | --- |
| `auth` | Login en dos pasos, OTP, registro y completar perfil; emisión de JWT y envío del código por correo. |
| `catalogs` | Departamentos, distritos y sedes. |
| `users` | Modelo `Usuario`, con su vehículo embebido, y sus reglas (`ReglasUsuario`, RN-01 a RN-05 y RN-14); consulta y actualización del perfil. |
| `vehicles` | Registro, consulta y actualización del vehículo, que se guarda embebido en `Usuario`; sus reglas (`ReglasVehiculo`, RN-07 a RN-09). |
| `rides` | Listado, detalle y publicación de viajes (`ViajeService`) y reserva de plazas (`ReservaService`); modelos `Viaje` y `Reserva` y sus reglas (`ReglasViaje`, RN-11 a RN-13). |
| `files` | Modelo `Archivo` y su repositorio. |
| `shared` | Lo transversal: errores (`CodigoError`, `ApiException`, `ManejadorErrores`), validaciones comunes, alcances del token, seguridad, CORS y configuración. |

## 3. Tokens y alcances

La API es stateless y usa JWT firmados con HS256. El `subject` es el id del usuario y el claim `scope` lleva un único alcance. Cada ruta exige uno concreto, así que el token que entrega el login no sirve como token de sesión.

| Alcance | Lo entrega | Vigencia | Rutas que admite |
| --- | --- | --- | --- |
| `REGISTRATION` | `POST /auth/register` | 15 min | `/auth/complete-profile` y `POST /vehicles` |
| `PRE_AUTH` | `POST /auth/login` | 10 min | `/auth/verify-code` y `/auth/resend-code` |
| `SESSION` | `POST /auth/verify-code` | 8 h | El resto de rutas protegidas, y también `/auth/complete-profile` y `POST /vehicles` |

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
| `INVALID_FILE_REFERENCE` | 400 | La foto de perfil (o del vehículo) no existe o no te pertenece |
| `PROFILE_INCOMPLETE` | 409 | Completa tu perfil antes de actualizar tus datos (o de registrar tu vehículo) |
| `VEHICLE_REQUIRED` | 403 | Registra un vehículo para usar la modalidad de conductor (o para publicar viajes) |
| `PLATE_ALREADY_REGISTERED` | 409 | La placa ya está registrada |
| `VEHICLE_ALREADY_REGISTERED` | 409 | Ya tienes un vehículo registrado |
| `VEHICLE_NOT_FOUND` | 404 | No tienes un vehículo registrado |
| `RIDE_NOT_FOUND` | 404 | Viaje no encontrado |
| `RIDE_NOT_AVAILABLE` | 409 | Este viaje ya no está disponible |
| `NO_SEATS_AVAILABLE` | 409 | Este viaje ya no tiene asientos disponibles |
| `ALREADY_BOOKED` | 409 | Ya tienes una reserva confirmada en este viaje |
| `OWN_RIDE` | 403 | No puedes reservar tu propio viaje |
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

No recibe parámetros. Devuelve el perfil completo, con el vehículo si el usuario es conductor. Los datos que el usuario aún no registra llegan como `null` (teléfono, documento, dirección de residencia, vehículo, calificación y, mientras no exista `POST /files`, la foto); las estadísticas empiezan en cero. Negocio: 401 `UNAUTHORIZED` si la cuenta ya no existe o está bloqueada.

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
| `VEHICLE_REQUIRED` | 403 | Registra un vehículo para usar la modalidad de conductor (`activeMode` es `DRIVER` y el usuario no tiene vehículo) |
| `PROFILE_INCOMPLETE` | 409 | Completa tu perfil antes de actualizar tus datos (la cuenta sigue en `PROFILE_PENDING`) |
| `UNAUTHORIZED` | 401 | Tu sesión expiró. Vuelve a iniciar sesión. (la cuenta ya no existe o está bloqueada) |

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

`isOwner` es opcional: en el registro vale `false` si no llega y en la actualización conserva el valor guardado. `PUT /vehicles/me` no modifica el `ownerDni` de un vehículo ya registrado y, si no llega `photoFileId`, conserva la foto actual; mientras no exista `POST /files` no exige que el vehículo tenga foto (RN-15).

Negocio:

| Código | HTTP | Mensaje | Endpoint |
| --- | --- | --- | --- |
| `INVALID_FILE_REFERENCE` | 400 | La foto del vehículo no existe o no te pertenece | Ambos |
| `PLATE_ALREADY_REGISTERED` | 409 | La placa ya está registrada | Ambos |
| `PROFILE_INCOMPLETE` | 409 | Completa tu perfil antes de registrar tu vehículo | `POST`, y `PUT` si el usuario no tiene vehículo |
| `VEHICLE_ALREADY_REGISTERED` | 409 | Ya tienes un vehículo registrado | `POST` |
| `UNAUTHORIZED` | 401 | Tu sesión expiró. Vuelve a iniciar sesión. (la cuenta ya no existe o está bloqueada) | Ambos |

`POST /vehicles` responde 201 con el vehículo y agrega el rol `CONDUCTOR` al usuario; no cambia su modalidad activa. `PUT /vehicles/me` actualiza la copia del vehículo (marca, modelo, color y placa) en los viajes `PUBLICADO` o `EN_CURSO` del conductor; las plazas de esos viajes no cambian.

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

Lista los viajes `PUBLICADO` de la sede con salida futura y plazas suficientes, sin los del propio usuario, ordenados por hora de salida. Sin `campusId` usa la sede del usuario; si no tiene sede, o la sede no existe, la lista llega vacía. Con `time` solo devuelve los viajes de hoy (hora de Perú) desde esa hora. `destination` busca en la etiqueta y la dirección del destino sin distinguir mayúsculas ni tildes.

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

Negocio: 403 `VEHICLE_REQUIRED` (Registra un vehículo para publicar viajes) y 401 `UNAUTHORIZED`.

Responde 201 con el detalle del viaje y la cabecera `Location` (`/api/rides/{rideId}`). Conductor, vehículo y sede se copian del usuario. `distanceKm` es la suma en línea recta entre origen, paradas y destino, con un decimal; `durationMin` la estima a 35 km/h, con un mínimo de 1 minuto.

**`GET /rides/{rideId}`**

| Parámetro | Regla | Mensaje |
| --- | --- | --- |
| `rideId` | Identificador válido | El parámetro rideId no es válido |

Responde para cualquier estado del viaje. Negocio: 404 `RIDE_NOT_FOUND`.

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
| `NO_SEATS_AVAILABLE` | 409 | Este viaje ya no tiene asientos disponibles |

El descuento de plazas y la creación de la reserva van en una misma transacción de MongoDB (`MongoTransactionManager`, en `MongoConfig`). El descuento filtra por `plazas_disponibles >= seats`, así que dos pasajeros no pueden llevarse la última plaza; si dos reservas chocan dentro de la transacción, se reintenta hasta 3 veces. El índice único parcial de `reservas` cubre la doble reserva simultánea del mismo pasajero.

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

Login. La respuesta trae el token `PRE_AUTH` y envía el código OTP:

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
