# ColaboraCar — Movilidad Colaborativa UTP

Aplicación web en **React + TypeScript + Vite + Tailwind CSS** diseñada para incrustarse en un **WebView** móvil. Permite a estudiantes y conductores registrarse, verificar su cuenta, completar el perfil y consultar viajes colaborativos disponibles.

Durante el desarrollo, el backend se simula con **MSW (Mock Service Worker)** para avanzar con el diseño sin depender de una API real.

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
| `npm run dev` | Servidor de desarrollo |
| `npm run dev:local` | Desarrollo con modo `localdev` |
| `npm run dev:development` | Desarrollo con modo `development` |
| `npm run build` | Build de producción |
| `npm run build:development` | Build en modo development |
| `npm run preview` | Vista previa del build |
| `npm run typecheck` | Verificación de tipos TypeScript |

> **Nota:** Vite no permite usar `local` como nombre de modo porque entra en conflicto con `.env.local`.

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto si necesitas personalizar la configuración:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AUTH_COOKIE_NAME=app_auth_token
VITE_AUTH_VERIFIED_COOKIE_NAME=app_auth_verified
```

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_API_BASE_URL` | URL base de la API | `http://localhost:3000/api` |
| `VITE_AUTH_COOKIE_NAME` | Cookie del token de sesión | `app_auth_token` |
| `VITE_AUTH_VERIFIED_COOKIE_NAME` | Cookie de verificación OTP | `app_auth_verified` |

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
| `/auth/completar-perfil` | Completar perfil | Tras registro |
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
│   │   │   ├── data/          # Opciones de departamentos, distritos, sedes
│   │   │   ├── pages/         # Login, Register, Verification, CompleteProfile
│   │   │   └── services/
│   │   │       └── authService.ts
│   │   └── dashboard/
│   │       ├── components/    # RideCard, BottomNav, DashboardHeader, etc.
│   │       ├── pages/
│   │       │   └── DashboardPage.tsx
│   │       ├── services/
│   │       │   └── dashboardService.ts
│   │       └── types.ts
│   ├── mocks/
│   │   ├── browser.ts           # Configuración del worker MSW
│   │   ├── handlers.ts          # Endpoints mock
│   │   └── setup.ts             # Activación en desarrollo
│   ├── shared/
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
- **`src/mocks`**: API simulada con MSW, activa solo en `import.meta.env.DEV`.

## API mock (MSW)

En desarrollo, MSW intercepta las peticiones HTTP. El worker se inicializa en `src/main.tsx` antes de montar la aplicación.

### Endpoints disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Inicio de sesión |
| `POST` | `/api/auth/register` | Registro de usuario |
| `POST` | `/api/auth/verify-code` | Verificación OTP (6 dígitos) |
| `POST` | `/api/auth/resend-code` | Reenvío de código |
| `POST` | `/api/auth/complete-profile` | Completar perfil |
| `POST` | `/api/auth/logout` | Cerrar sesión |
| `GET` | `/api/rides` | Listado de viajes |
| `POST` | `/api/rides/:rideId/reserve` | Reservar viaje |

### Credenciales de prueba

- **Login:** cualquier correo y contraseña válidos.
- **Verificación:** cualquier código de **6 dígitos**.
- **Registro:** email + contraseña (mín. 8 caracteres con letras, números y símbolos).

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
