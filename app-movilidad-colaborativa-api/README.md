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

```bash
./gradlew bootRun    # API en http://localhost:8080/api
./gradlew test       # ApplicationTests necesita las variables obligatorias y acceso a Atlas
```

`ValidacionSolicitudesTest` comprueba la validación de entrada y el formato de los errores sin base de datos:

```bash
./gradlew test --tests '*ValidacionSolicitudesTest'
```

## 2. Estado y estructura

El contrato define 19 endpoints y el backend implementa 9. Toda la API cuelga de `/api`.

| Módulo | Endpoints | Estado |
| --- | --- | --- |
| Autenticación | `POST /auth/login`, `/auth/verify-code`, `/auth/resend-code`, `/auth/logout` | Implementado |
| Registro | `POST /auth/register`, `/auth/complete-profile` | Implementado; la foto de perfil es opcional hasta que exista `POST /files` |
| Catálogos | `GET /catalogs/departments`, `/catalogs/districts`, `/catalogs/campuses` | Implementado |
| Archivos | `POST /files` | Pendiente; solo existen el modelo y el repositorio |
| Vehículos | `POST /vehicles`, `GET` y `PUT /vehicles/me` | Pendiente |
| Viajes y reservas | `GET` y `POST /rides`, `GET /rides/{rideId}`, `POST /rides/{rideId}/reserve` | Pendiente |
| Perfil | `GET` y `PUT /users/me` | Pendiente |

El código está en `pe.edu.utp.app_movilidadcolaborativa`, organizado por módulo. Cada módulo tiene tres capas: `application` (casos de uso), `domain` (model, dto, validation) e `infrastructure` (web, persistence, security, mail).

| Paquete | Contenido |
| --- | --- |
| `auth` | Login en dos pasos, OTP, registro y completar perfil; emisión de JWT y envío del código por correo. |
| `catalogs` | Departamentos, distritos y sedes. |
| `users` | Modelo `Usuario` y sus reglas (`ReglasUsuario`, RN-01 a RN-05). |
| `files` | Modelo `Archivo` y su repositorio. |
| `shared` | Lo transversal: errores (`CodigoError`, `ApiException`, `ManejadorErrores`), validaciones comunes, alcances del token, seguridad, CORS y configuración. |

## 3. Tokens y alcances

La API es stateless y usa JWT firmados con HS256. El `subject` es el id del usuario y el claim `scope` lleva un único alcance. Cada ruta exige uno concreto, así que el token que entrega el login no sirve como token de sesión.

| Alcance | Lo entrega | Vigencia | Rutas que admite |
| --- | --- | --- | --- |
| `REGISTRATION` | `POST /auth/register` | 15 min | `/auth/complete-profile` |
| `PRE_AUTH` | `POST /auth/login` | 10 min | `/auth/verify-code` y `/auth/resend-code` |
| `SESSION` | `POST /auth/verify-code` | 8 h | El resto de rutas protegidas, y también `/auth/complete-profile` |

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
| Parámetros de consulta | Controlador | El parámetro se declara con su tipo (`ObjectId`); si falta o no convierte, responde `ManejadorErrores`. |
| Reglas que dependen del estado | Capa `application` | El servicio lanza `ApiException` con un `CodigoError`. |

Las reglas propias son anotaciones que delegan en el dominio:

| Anotación | Regla | Valor nulo o vacío |
| --- | --- | --- |
| `@CorreoUtp` | Correo del dominio `utp.edu.pe`, máximo 254 caracteres (RN-01, RN-02). | Válido; lo cubre `@NotBlank`. |
| `@ContrasenaSegura` | De 8 a 72 caracteres con letras, números y símbolos (RN-03). | Inválido. |
| `@NombrePersona` | Al menos una letra y máximo 60 caracteres (RN-05). | Válido; lo cubre `@NotBlank`. |
| `@IdObjeto` | Identificador de MongoDB: 24 caracteres hexadecimales. | Válido; lo cubre `@NotNull`. |

Esa convención garantiza un solo error por campo. Antes de validar, el correo se pasa a minúsculas sin espacios y los nombres y apellidos se recortan.

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
| `INVALID_FILE_REFERENCE` | 400 | La foto de perfil no existe o no te pertenece |
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

## 5. Ejemplos con curl

Los ejemplos asumen la API en `http://localhost:8080/api`. Con `MAIL_ENABLED=false` el código OTP aparece en el log del backend.

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

Para comprobar el aislamiento de alcances, repite la última llamada con el token `PRE_AUTH`: debe responder 403 `FORBIDDEN_SCOPE`.

## 6. Guía para agregar un endpoint

Los pasos siguen las convenciones de los módulos ya implementados. El ejemplo es `POST /vehicles`, que aún está pendiente.

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

9. **Probar y documentar.** Agregar los casos del endpoint a `ValidacionSolicitudesTest` y sus mensajes a la sección 4.4 de este documento.
