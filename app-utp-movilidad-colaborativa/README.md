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
├── frames/                    # Mockups de diseño (referencia UI)
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
- **`frames/`**: diseños de referencia; no se importan en runtime.

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

## Diseños de referencia (`frames/`)

Los mockups guían la implementación visual. La UI está adaptada a **WebView** (sin marco móvil, safe areas, `100dvh`).

| # | Archivo | Pantalla | Módulo | Estado |
|---|---------|----------|--------|--------|
| 01 | [01. login.jpeg](<frames/01. login.jpeg>) | Iniciar sesión | Autenticación | Implementada |
| 02 | [02. login_verificacion.jpeg](<frames/02. login_verificacion.jpeg>) | Verificación OTP | Autenticación | Implementada |
| 03 | [03. registro.jpeg](<frames/03. registro.jpeg>) | Registro | Registro | Implementada |
| 04 | [04. registro_datos_personales.jpeg](<frames/04. registro_datos_personales.jpeg>) | Completar perfil | Registro | Implementada |
| 05 | [05. registro_vehiculo.jpeg](<frames/05. registro_vehiculo.jpeg>) | Datos del vehículo | Registro | Pendiente |
| 06 | [06. dashboard.jpeg](<frames/06. dashboard.jpeg>) | Dashboard / viajes | Dashboard | Implementada |
| 07 | [07. dashboard_condiciones_viaje.jpeg](<frames/07. dashboard_condiciones_viaje.jpeg>) | Condiciones del viaje | Dashboard | Pendiente |
| 08 | [08. dashboard_confirm_viaje.jpeg](<frames/08. dashboard_confirm_viaje.jpeg>) | Confirmar reserva (dashboard) | Dashboard | Pendiente |
| 09 | [09. dashboard_detalle_viaje.jpeg](<frames/09. dashboard_detalle_viaje.jpeg>) | Detalle del viaje | Reserva | Pendiente |
| 10 | [10. confirm_detalle_viaje.jpeg](<frames/10. confirm_detalle_viaje.jpeg>) | Confirmar reserva (detalle) | Reserva | Pendiente |
| 11 | [11. publicar_viaje.jpeg](<frames/11. publicar_viaje.jpeg>) | Publicar viaje | Publicación | Pendiente |
| 12 | [12. confirm_publicar_viaje.jpeg](<frames/12. confirm_publicar_viaje.jpeg>) | Confirmar publicación | Publicación | Pendiente |
| 13 | [13. perfil_pasajero.jpeg](<frames/13. perfil_pasajero.jpeg>) | Perfil — pasajero | Perfil | Pendiente |
| 14 | [14. perfil_conductor.jpeg](<frames/14. perfil_conductor.jpeg>) | Perfil — conductor | Perfil | Pendiente |
| 15 | [15. perfil_actualizar_datos.jpeg](<frames/15. perfil_actualizar_datos.jpeg>) | Actualizar datos | Perfil | Pendiente |
| 16 | [16. perfil_actualizar_vehiculo.jpeg](<frames/16. perfil_actualizar_vehiculo.jpeg>) | Actualizar vehículo | Perfil | Pendiente |

### Vista previa de pantallas

#### 01 — Iniciar sesión

Correo y contraseña, con acceso a registro y recuperación de contraseña.

<p align="center">
  <img src="frames/01. login.jpeg" alt="Pantalla iniciar sesión" width="360" />
</p>

#### 02 — Verificación OTP

Código de 6 dígitos enviado al correo, máximo 3 intentos y reenvío con temporizador.

<p align="center">
  <img src="frames/02. login_verificacion.jpeg" alt="Pantalla verificación otp" width="360" />
</p>

#### 03 — Registro

Email, contraseña, confirmación y aceptación de términos y condiciones.

<p align="center">
  <img src="frames/03. registro.jpeg" alt="Pantalla registro" width="360" />
</p>

#### 04 — Completar perfil

Foto, nombres, apellidos, departamento, distrito, sede y casilla «Tengo vehículo».

<p align="center">
  <img src="frames/04. registro_datos_personales.jpeg" alt="Pantalla completar perfil" width="360" />
</p>

#### 05 — Datos del vehículo

Foto, placa, tipo, año de fabricación, ocupantes y DNI del propietario.

<p align="center">
  <img src="frames/05. registro_vehiculo.jpeg" alt="Pantalla datos del vehículo" width="360" />
</p>

#### 06 — Dashboard / viajes

Buscador, filtros, botón «Publicar un viaje» y tarjetas de viajes con reserva.

<p align="center">
  <img src="frames/06. dashboard.jpeg" alt="Pantalla dashboard / viajes" width="360" />
</p>

#### 07 — Condiciones del viaje

Modal informativo con las condiciones que define el conductor.

<p align="center">
  <img src="frames/07. dashboard_condiciones_viaje.jpeg" alt="Pantalla condiciones del viaje" width="360" />
</p>

#### 08 — Confirmar reserva (dashboard)

Modal de confirmación con ruta, conductor y aporte total en créditos.

<p align="center">
  <img src="frames/08. dashboard_confirm_viaje.jpeg" alt="Pantalla confirmar reserva (dashboard)" width="360" />
</p>

#### 09 — Detalle del viaje

Mapa de la ruta, datos del conductor, puntos de partida y destino, vehículo y asientos.

<p align="center">
  <img src="frames/09. dashboard_detalle_viaje.jpeg" alt="Pantalla detalle del viaje" width="360" />
</p>

#### 10 — Confirmar reserva (detalle)

Mismo modal de confirmación, abierto desde el detalle del viaje.

<p align="center">
  <img src="frames/10. confirm_detalle_viaje.jpeg" alt="Pantalla confirmar reserva (detalle)" width="360" />
</p>

#### 11 — Publicar viaje

Mapa con paradas, sentido (ida/regreso), hora de salida, precio por plaza y plazas disponibles.

<p align="center">
  <img src="frames/11. publicar_viaje.jpeg" alt="Pantalla publicar viaje" width="360" />
</p>

#### 12 — Confirmar publicación

Modal de confirmación con el resumen del viaje a publicar.

<p align="center">
  <img src="frames/12. confirm_publicar_viaje.jpeg" alt="Pantalla confirmar publicación" width="360" />
</p>

#### 13 — Perfil — pasajero

Datos, estadísticas, sede universitaria, dirección de residencia y estado de cuenta.

<p align="center">
  <img src="frames/13. perfil_pasajero.jpeg" alt="Pantalla perfil — pasajero" width="360" />
</p>

#### 14 — Perfil — conductor

Igual que el de pasajero, más el vehículo registrado.

<p align="center">
  <img src="frames/14. perfil_conductor.jpeg" alt="Pantalla perfil — conductor" width="360" />
</p>

#### 15 — Actualizar datos

Cambio de modalidad (pasajero/conductor), foto y datos personales.

<p align="center">
  <img src="frames/15. perfil_actualizar_datos.jpeg" alt="Pantalla actualizar datos" width="360" />
</p>

#### 16 — Actualizar vehículo

Foto, placa, tipo, marca y modelo, año y plazas del vehículo.

<p align="center">
  <img src="frames/16. perfil_actualizar_vehiculo.jpeg" alt="Pantalla actualizar vehículo" width="360" />
</p>

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

- Implementar **Datos del vehículo** (`05`) y enlazarla desde «Tengo vehículo» en Completar perfil.
- Agregar al dashboard los modales de **Condiciones del viaje** (`07`) y **Confirmar reserva** (`08`).
- Implementar **Detalle del viaje** con mapa (`09`, `10`).
- Implementar **Publicar viaje** y su confirmación (`11`, `12`).
- Implementar **Perfil** de pasajero y conductor, con **Actualizar datos** y **Actualizar vehículo** (`13`–`16`).
- Conectar el resto de la navegación inferior (Historial, Billetera).
- Integrar API backend real reemplazando o desactivando MSW en producción.
