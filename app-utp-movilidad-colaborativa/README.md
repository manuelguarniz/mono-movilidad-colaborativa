# ColaboraCar — Movilidad Colaborativa UTP

Aplicación web en **React + TypeScript + Vite + Tailwind CSS** diseñada para incrustarse en un **WebView** móvil. Permite a estudiantes y conductores registrarse, verificar su cuenta, completar el perfil y consultar viajes colaborativos disponibles.

Durante el desarrollo, el backend se simula con **MSW (Mock Service Worker)** para avanzar con el diseño sin depender de una API real. La API simulada sigue el contrato [docs/openapi.yaml](../docs/openapi.yaml), el mismo que implementa el backend.

## Requisitos

- Node.js 18+
- npm

## Inicio rápido

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173` (o la IP de tu máquina si usas `--host`).

### Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con la API simulada (MSW) |
| `npm run dev:api` | Servidor de desarrollo contra el backend real en `http://localhost:8080/api` |
| `npm run dev:local` | Desarrollo con modo `localdev` |
| `npm run dev:development` | Desarrollo con modo `development` |
| `npm run build` | Build de producción |
| `npm run build:development` | Build en modo development |
| `npm run preview` | Vista previa del build |
| `npm run typecheck` | Verificación de tipos TypeScript |

> **Nota:** Vite no permite usar `local` como nombre de modo porque entra en conflicto con `.env.local`.

## Variables de entorno

Copia `.env.example` como `.env.local` si necesitas personalizar la configuración:

```env
VITE_USE_MOCKS=true
VITE_AUTH_COOKIE_NAME=app_auth_token
VITE_AUTH_VERIFIED_COOKIE_NAME=app_auth_verified
```

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_USE_MOCKS` | `true`: API simulada con MSW. `false`: backend real | `true` |
| `VITE_API_BASE_URL` | URL base de la API; solo hace falta si el backend está en otro host o puerto | `http://localhost:3000/api` con mocks, `http://localhost:8080/api` sin ellos |
| `VITE_AUTH_COOKIE_NAME` | Cookie del token de sesión | `app_auth_token` |
| `VITE_AUTH_VERIFIED_COOKIE_NAME` | Cookie de verificación OTP | `app_auth_verified` |

### Cambiar entre la API simulada y el backend

| Quiero | Cómo |
|--------|------|
| API simulada (MSW) | `npm run dev` |
| Backend real en el puerto 8080 | `npm run dev:api`, o `VITE_USE_MOCKS=false` en `.env.local` |

`npm run dev:api` usa el modo `api` de Vite, que lee `.env.api`. Hay que reiniciar el servidor de desarrollo para cambiar de uno a otro. Al cambiar, cierra sesión o borra la cookie `app_auth_token`: el token de la API simulada no sirve en el backend, y viceversa.

Los mocks solo existen en desarrollo: un build (`npm run build`) siempre llama a la API real, así que en producción hay que definir `VITE_API_BASE_URL`.

## Flujos de la aplicación

### Inicio de sesión

```
Login → Verificación (OTP 6 dígitos) → Dashboard
```

### Registro

```
Registro → Completar perfil → Login
```

### Flujos diseñados (pendientes de implementar)

```
Completar perfil (con «Tengo vehículo») → Datos del vehículo
Dashboard → Condiciones del viaje
Dashboard → Detalle del viaje → Confirmar reserva
Dashboard → Publicar viaje → Confirmar publicación
Perfil (pasajero / conductor) → Actualizar datos / Actualizar vehículo
```

## Rutas

| Ruta | Pantalla | Acceso |
|------|----------|--------|
| `/auth/login` | Iniciar sesión | Público |
| `/auth/register` | Registro | Público |
| `/auth/verificacion` | Verificación OTP | Requiere token (post-login) |
| `/auth/completar-perfil` | Completar perfil | Tras registro (token `REGISTRATION`) |
| `/dashboard` | Listado de viajes | Requiere sesión verificada |

## Estructura del proyecto

```
app-utp-movilidad-colaborativa/
├── public/
│   └── mockServiceWorker.js   # Service worker de MSW
├── src/
│   ├── app/
│   │   ├── App.tsx            # Definición de rutas
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx  # Layout del dashboard (header + bottom nav)
│   │   └── routes/
│   │       └── ProtectedRoute.tsx
│   ├── assets/
│   │   └── images/              # Logo e iconos SVG (importados con `?react`)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/    # AuthField, AuthLayout, OtpInput, etc.
│   │   │   ├── pages/         # Login, Register, Verification, CompleteProfile
│   │   │   └── services/
│   │   │       ├── authService.ts
│   │   │       └── catalogService.ts  # Departamentos, distritos y sedes
│   │   └── dashboard/
│   │       ├── components/    # RideCard, BottomNav, DashboardHeader, etc.
│   │       ├── pages/
│   │       │   └── DashboardPage.tsx
│   │       ├── services/
│   │       │   └── dashboardService.ts
│   │       └── types.ts
│   ├── mocks/
│   │   ├── browser.ts           # Configuración del worker MSW
│   │   ├── db.ts                # Datos de prueba (catálogos, usuarios, viajes) y estado
│   │   ├── http.ts              # Errores, tokens simulados y validaciones comunes
│   │   ├── handlers.ts          # Reúne los handlers de todos los módulos
│   │   ├── handlers/            # Un archivo por módulo: auth, catalogs, files,
│   │   │                        # vehicles, rides y users
│   │   └── setup.ts             # Activación en desarrollo
│   ├── shared/
│   │   ├── config/
│   │   │   └── env.ts           # VITE_USE_MOCKS y URL base de la API
│   │   ├── api/
│   │   │   └── apiClient.ts     # Cliente Axios centralizado
│   │   └── icons/               # Iconos SVG reutilizables
│   ├── styles/
│   │   └── index.css            # Tailwind + estilos globales WebView
│   └── main.tsx                 # Punto de entrada
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### Convenciones

- **`src/app`**: configuración global, layouts y rutas.
- **`src/features`**: módulos por dominio (`auth`, `dashboard`). Cada feature agrupa páginas, componentes y servicios propios.
- **`src/shared`**: código transversal (API client, iconos).
- **`src/mocks`**: API simulada con MSW, activa solo en desarrollo y con `VITE_USE_MOCKS` distinto de `false`.

## API mock (MSW)

En desarrollo, MSW intercepta las peticiones HTTP. El worker se inicializa en `src/main.tsx` antes de montar la aplicación.

La API simulada implementa los 19 endpoints del contrato [docs/openapi.yaml](../docs/openapi.yaml) con las mismas formas de solicitud y respuesta, las mismas validaciones y los mismos códigos y mensajes de error que el backend ([README del backend](../app-movilidad-colaborativa-api/README.md), sección 4). Para probar contra el backend real, usa `npm run dev:api` (ver «Cambiar entre la API simulada y el backend»).

### Endpoints disponibles

| Método | Ruta | Descripción | Token |
|--------|------|-------------|-------|
| `POST` | `/api/auth/register` | Crear una cuenta | Público |
| `POST` | `/api/auth/complete-profile` | Completar el perfil | `REGISTRATION` o `SESSION` |
| `POST` | `/api/auth/login` | Inicio de sesión (paso 1, credenciales) | Público |
| `POST` | `/api/auth/verify-code` | Inicio de sesión (paso 2, código OTP) | `PRE_AUTH` |
| `POST` | `/api/auth/resend-code` | Reenvío del código, pasados 45 segundos | `PRE_AUTH` |
| `POST` | `/api/auth/logout` | Cerrar sesión | `SESSION` |
| `GET` | `/api/catalogs/departments` | Departamentos | Público |
| `GET` | `/api/catalogs/districts?departmentId=` | Distritos de un departamento | Público |
| `GET` | `/api/catalogs/campuses?districtId=` | Sedes de un distrito | Público |
| `POST` | `/api/files` | Subir una foto (JPG o PNG de hasta 5 MB) | `REGISTRATION` o `SESSION` |
| `POST` | `/api/vehicles` | Registrar el vehículo | `REGISTRATION` o `SESSION` |
| `GET` | `/api/vehicles/me` | Consultar mi vehículo | `SESSION` |
| `PUT` | `/api/vehicles/me` | Actualizar mi vehículo | `SESSION` |
| `GET` | `/api/rides` | Listado de viajes, con filtros `campusId`, `destination`, `time` y `passengers` | `SESSION` |
| `POST` | `/api/rides` | Publicar un viaje | `SESSION` |
| `GET` | `/api/rides/:rideId` | Detalle de un viaje, con la ruta | `SESSION` |
| `POST` | `/api/rides/:rideId/reserve` | Reservar un viaje | `SESSION` |
| `GET` | `/api/users/me` | Consultar mi perfil | `SESSION` |
| `PUT` | `/api/users/me` | Actualizar mis datos | `SESSION` |

Los errores tienen la forma del contrato, `{ code, message, errors?, details? }`. Un token con el alcance equivocado recibe 403 `FORBIDDEN_SCOPE`; sin token, 401 `UNAUTHORIZED`.

### Cuentas de prueba

Todas usan la contraseña `Clave#2026` y pertenecen a la sede UTP Trujillo. El formulario de login ya trae la primera.

| Correo | Rol | Vehículo |
|--------|-----|----------|
| `valeria.rodriguez@utp.edu.pe` | Pasajera | — |
| `carlos.mendoza@utp.edu.pe` | Conductor | Toyota Yaris, `ABC-123` |
| `andrea.paredes@utp.edu.pe` | Conductora | Chevrolet Spark, `XYZ-789` |

- **Verificación:** el código OTP es siempre `123456` (también se escribe en la consola del navegador). Otro código devuelve `OTP_INVALID` y descuenta uno de los 3 intentos.
- **Registro:** correo `@utp.edu.pe` que no exista y contraseña de 8 a 72 caracteres con letras, números y símbolos.
- **Viajes:** hay tres viajes publicados en la sede Trujillo, con salida en las próximas 24 horas. El listado no muestra los viajes del propio usuario.

### Datos y estado

- Los catálogos (11 departamentos, 15 distritos y 15 sedes) son los mismos de [docs/seed.js](../docs/seed.js), con los mismos identificadores.
- Lo que se crea durante la sesión (cuentas, vehículos, viajes y reservas) se guarda en `sessionStorage`, así que sobrevive a las recargas y se pierde al cerrar la pestaña.
- El token es simulado y no está firmado, pero lleva el alcance y el vencimiento del contrato (15 min, 10 min y 8 h).
- `POST /api/files` valida el archivo y devuelve una `url` con el formato del contrato, pero no guarda la imagen: esa URL no sirve ningún archivo. El backend todavía no implementa este endpoint, y por eso `photoFileId` es opcional en todos los formularios.

## Stack tecnológico

| Librería | Uso |
|----------|-----|
| [React 18](https://react.dev/) | UI |
| [TypeScript](https://www.typescriptlang.org/) | Tipado estático |
| [Vite](https://vitejs.dev/) | Bundler y dev server |
| [Tailwind CSS](https://tailwindcss.com/) | Estilos |
| [React Router](https://reactrouter.com/) | Navegación |
| [TanStack Query](https://tanstack.com/query) | Estado asíncrono y caché |
| [Axios](https://axios-http.com/) | Cliente HTTP |
| [js-cookie](https://github.com/js-cookie/js-cookie) | Gestión de cookies |
| [MSW](https://mswjs.io/) | API mock en desarrollo |
| [Faker](https://fakerjs.dev/) | Datos de prueba en mocks |
| [Inter](https://fontsource.org/fonts/inter) (`@fontsource-variable/inter`) | Tipografía de los mockups, servida desde la propia app |
| [vite-plugin-svgr](https://github.com/pd4d10/vite-plugin-svgr) | Importar SVG como componentes React |

## Consideraciones WebView

- Viewport con `viewport-fit=cover` para respetar notch y áreas seguras.
- Variables CSS `--safe-area-inset-*` para padding en iOS/Android.
- Layouts a pantalla completa (`100dvh`), sin marco tipo dispositivo.
- Selects personalizados en lugar de `<select>` nativo (evita bugs de posicionamiento en WebView).

## Próximos pasos sugeridos

- Implementar **Datos del vehículo** y enlazarla desde «Tengo vehículo» en Completar perfil.
- Agregar al dashboard los modales de **Condiciones del viaje** y **Confirmar reserva**.
- Implementar **Detalle del viaje** con mapa.
- Implementar **Publicar viaje** y su confirmación.
- Implementar **Perfil** de pasajero y conductor, con **Actualizar datos** y **Actualizar vehículo**.
- Conectar el resto de la navegación inferior (Historial, Billetera).
- Integrar API backend real reemplazando o desactivando MSW en producción.
