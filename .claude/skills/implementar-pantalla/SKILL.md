---
name: implementar-pantalla
description: Implementa o actualiza una pantalla aprobada de ColaboraCar (P01–P21) a partir de su diseño en docs/design/Pnn-Nombre/ y de las reglas del README raíz, de punta a punta: backend Spring Boot + MongoDB, contrato docs/openapi.yaml, frontend React + Tailwind, API simulada (MSW), tests y documentación. Usar cuando el usuario pida implementar una pantalla, actualizar una funcionalidad «en base al diseño», completar el backend que alimenta una pantalla, explicar qué dato agregar en Mongo para que algo se vea, o alinear código, contrato y README después de una decisión de diseño; aunque no nombre la skill ni diga «Pnn».
---

# Implementar una pantalla aprobada de ColaboraCar

Una pantalla aprobada (`docs/design/Pnn-Nombre/`, con sus frames y su sección «Decisión» en `prompt.md`) se lleva al código en todas las capas que la alimentan. El objetivo es que el diseño, el README raíz, el contrato, el backend, la API simulada y el frontend digan lo mismo al terminar. Si una capa queda atrás, el usuario lo descubre al probar con el backend real (por ejemplo: un chip verde que nunca aparece porque la API no devuelve el campo).

El diseño de la pantalla lo cubre la skill `diseno-stitch`. Esta skill empieza cuando la pantalla está aprobada.

## 1. Fuentes, en orden de autoridad

1. **El usuario.** Sus decisiones en el chat mandan sobre todo lo demás. Cuando contradigan el README o el diseño, se aplican y se anotan en esos documentos con la fecha. Ejemplos de esta forma de trabajar: «omite el texto "Sin accesibilidad…", no lo muestres» y «la ciudad sale de `sedes.distrito.nombre`», que reemplazó un campo `ciudad` que el README pedía.
2. **`README.md` raíz:** RF y criterios de aceptación (2.1), RN (2.2), estados y etiquetas (2.3), modelo de datos (5.1), secuencias (8 y 9, donde aparecen nombres de endpoints y códigos de error previstos), estado del backend (4.1) y decisiones (12).
3. **`docs/design/Pnn-Nombre/`:**
   - `README.md`: frames aprobados y «Ajustes respecto al frame».
   - `prompt.md`: lo que más importa para implementar está en «Decisión → Ajustes a resolver en la implementación», «Decisiones de flujo», «Mensajes de validación» y «Supuestos a validar».
   - Las capturas aprobadas `vN.M.png`. Ábrelas con Read: son la referencia visual, y los textos literales salen de ahí y de `prompt.md`.
4. **Contrato y backend:** `docs/openapi.yaml`, `app-movilidad-colaborativa-api/README.md` (códigos y mensajes por endpoint) y el código.

## 2. Análisis de brechas antes de tocar código

Recorre cada frame y lista cada dato que la pantalla muestra y cada regla que aplica. Para cada uno, contesta tres preguntas:

- ¿El contrato lo define?
- ¿El backend lo devuelve o lo valida?
- ¿El frontend lo usa?

Así se encuentran temprano los huecos típicos: campos que el modelo no tiene (accesibilidad, SOAT, ciudad), endpoints que no existen (`GET /rides/mine`), reglas sin implementar (RN-23, RN-30, RN-38) o pantallas destino que aún no existen (P17 Mis viajes, P18 Notificaciones).

Pregunta al usuario con AskUserQuestion, y solo entonces, cuando la brecha cambia el alcance o rompe algo existente:

- **Alcance:** «solo frontend» o «frontend + backend», si la pantalla depende de datos que la API no tiene. Recomienda frontend + backend: si no, lo que no tenga datos simplemente no aparece.
- **Reglas que romperían pantallas existentes.** Ejemplo: el README exige el SOAT para registrar el vehículo, pero los formularios de P05 y P16 todavía no lo envían. Se eligió «opcional por ahora: se valida si llega y no se exige», para no romper esos formularios.

Lo demás decídelo tú con un valor razonable y repórtalo al final.

## 3. Backend (`app-movilidad-colaborativa-api/`)

Convenciones del repo:

- **Nombres:**
  - El dominio va en español (`Viaje`, `Sede`, `ReglasViaje`) y el JSON de la API en inglés (`departureTime`, `campus.city`).
  - MongoDB guarda en snake_case por conversión automática: `aptoMovilidadReducida` → `apto_movilidad_reducida`.
  - En los `Update` a mano se escribe el nombre snake_case.
- **Modelos:** son records. Un campo nuevo en un documento que ya existe puede faltar en los datos viejos, así que trátalo como opcional (`null` ⇒ valor por defecto) y dilo en el Javadoc.
- **Validación:**
  - El formato va en el DTO de la solicitud, con mensajes en español.
  - Las reglas que dependen del estado van en la capa application, con `ApiException(CodigoError.X, mensaje)` o con `ValidacionException(campo, mensaje)`.
  - Los mensajes son los literales del README o de «Mensajes de validación» del `prompt.md`.
  - Un código nuevo va en `CodigoError`, con su estado HTTP.
- **Parámetros (RN-31):** se leen con `ParametrosService` del documento `{ _id: "config" }` de la colección `app`, en cada operación y con valores por defecto. Agrega ahí los que falten.
- **Copias:** `viajes` copia conductor, vehículo y sede. Si cambias un dato copiado, actualiza también la copia en los viajes activos (`PUBLICADO`, `EN_CURSO`), como hace `VehiculoService.actualizarCopiaEnViajes`.
- **Tests:** unitarios con Mockito, sin base de datos. Actualiza los constructores de records en los tests y agrega un caso por cada regla nueva.

Ejecuta:

```bash
cd app-movilidad-colaborativa-api
./gradlew test --offline -q --tests '*Test' --tests '!*ApplicationTests'
```

`ApplicationTests` necesita Atlas (`DB_HOST`): falla en local por el entorno, no por el código. Dilo así cuando reportes.

## 4. Contrato y documentación

Se actualizan en la misma tarea, no después:

- `docs/openapi.yaml`: esquemas, parámetros, respuestas y la lista de códigos de `Error.code`. Valida que siga siendo YAML válido:
  `cd app-utp-movilidad-colaborativa && node -e "require('js-yaml').load(require('fs').readFileSync('../docs/openapi.yaml','utf8'))"`
- `app-movilidad-colaborativa-api/README.md`: estado (sección 2), tabla de códigos (4.3) y reglas y mensajes por endpoint (4.4).
- `docs/http/<módulo>/*.http`: respuestas de ejemplo y los casos de error nuevos.
- `README.md` raíz: tabla de estado de la sección 4.1 y, si el usuario decidió algo distinto, el modelo de datos o la regla afectada, con la fecha de la decisión.
- `docs/design/Pnn/README.md` y `prompt.md`, si el usuario cambia un ajuste del diseño.

No inventes etiquetas ni textos de UI que el README no define. Si hace falta uno, descríbelo de forma neutra y avísalo. Ejemplo: el segundo check de accesibilidad no tiene texto en el README.

## 5. Frontend (`app-utp-movilidad-colaborativa/`)

- **Estructura:** `src/features/<módulo>/{components,pages,services,types.ts}`. Los tipos reflejan el contrato: lo que la API todavía no da va como opcional y con un comentario.
- **Estilos:**
  - Clases de componente con `@apply` en `src/styles/index.css`, agrupadas por pantalla. Antes de renombrar o borrar una clase, busca si otra pantalla la usa (por ejemplo, `publish-card` se usa en P09).
  - Tokens: `--brand-red`, `--brand-soft`, `--surface-muted`, `--text-*`.
  - Hojas inferiores: `app-sheet-backdrop` y `app-sheet`. Modales: `app-modal`.
- **Íconos:** SVG en `src/assets/images/icons/`, importados con `?react`. Si falta uno, créalo con trazo de línea 24×24.
- **Formatos del diseño:**
  - Horas en 24 h y fechas como «Hoy, 14:20» o «Mañana, vie 30 oct», con `shared/utils/limaTime.ts` y `features/rides/utils/route.ts`.
  - Distancias con coma decimal: «5,2 km».
  - Créditos enteros con la moneda dorada «C». Nunca «S/».
  - Cifras con `tabular-nums`.
- **React Query:**
  - Claves que ya se usan: `["users","me"]`, `["vehicles","me"]`, `["rides", ...]` y `["rides","mine"]`.
  - Al publicar o reservar, invalida `["rides"]`.
  - Para listas paginadas, usa `useInfiniteQuery` con un `IntersectionObserver`.
- **Pantallas destino que no existen** (P17, P18, P19, P21): deja la pestaña o el botón deshabilitado («próximamente»), o enlaza a la pantalla más cercana que sí exista (el detalle del viaje). Repórtalo como desviación.
- **Accesibilidad:** cuando un botón está deshabilitado por una regla, usa `aria-disabled` y `aria-describedby` hacia la franja que explica el motivo. Los íconos que dan información llevan `aria-label`.
- **StrictMode:** no hagas efectos secundarios en los inicializadores de `useState`, porque se ejecutan dos veces. Por ejemplo, leer y borrar un borrador de `sessionStorage` en el mismo inicializador.

## 6. API simulada (MSW)

`src/mocks/` debe aplicar las mismas reglas y la misma forma de respuesta que el backend: errores con el mismo `code` y mensaje, paginación y campos nuevos.

- Si cambias la forma de los datos guardados, sube el sufijo de `STORAGE_KEY` en `mocks/db.ts` (`colaboracar_mock_db_vN`). Así se descartan los datos viejos del sessionStorage.
- Usuarios demo:
  - `valeria.rodriguez@utp.edu.pe`: pasajera.
  - `carlos.mendoza@utp.edu.pe`: conductor con vehículo apto y SOAT.
  - `andrea.paredes@utp.edu.pe`: conductora sin accesibilidad.
  - Contraseña `Clave#2026` y OTP `123456`.

## 7. Verificación

1. `npx tsc --noEmit -p tsconfig.app.json` y `npx vite build --mode development --outDir <scratchpad>/dist`. Así no se toca el `dist` del repo.
2. Tests del backend, como en la sección 3.
3. Capturas reales comparadas con los frames aprobados. Usa [scripts/capturas.cjs](scripts/capturas.cjs), que entra con un usuario demo y fotografía rutas en 390×844 a 2×:
   - Levanta el frontend en segundo plano: `VITE_USE_MOCKS=true npx vite --port 5199 --strictPort`.
   - Instala `playwright-core@1.40.0` en un directorio del scratchpad y ejecuta el script desde ahí. Usa el Chrome instalado, sin descargar navegadores.
   - Abre las capturas con Read y compáralas con `vN.M.png`. Corrige lo que no coincida, por ejemplo textos partidos, chips ocultos o la moneda equivocada.
   - Al terminar, detén el servidor.
4. En la edición de archivos con scripts, cada reemplazo debe tener un ancla única. Un `str.replace` que coincide en dos métodos cambia los dos: pasó con `registrar` y `actualizar` en `VehiculoService`. Después de un reemplazo masivo, revisa el resultado con grep o sed.

## 8. Cierre

Reporta en español, breve:

- **Qué hace ahora la pantalla**, por frame, y qué cambió en cada capa.
- **Resultados:** tests y build con sus números. Si algo no se pudo probar, dilo, por ejemplo «no lo probé contra Atlas».
- **Desviaciones y decisiones que tomaste**, para que el usuario las confirme.
- **Datos que hay que agregar en Mongo** para que algo se vea, con el comando `updateOne` o `updateMany` exacto. Incluye las copias en `viajes` si aplica.
- **Lo que quedó pendiente** porque depende de otra pantalla o de otra funcionalidad.

No hagas commit si el usuario no lo pide.

Al citar secciones del README, escribe «sección 4.1» o «#4.1». No uses el símbolo de sección.
