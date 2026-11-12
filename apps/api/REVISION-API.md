# Revisión de `apps/api`

> Fecha: 2026-11-12. Verificado: `nest build` OK, 10 tests en verde (3 ficheros), `oxlint --type-aware` con 0 errores y 2 warnings.
>
> Marca cada punto con `[x]` cuando esté hecho.

## Qué está bien (no tocar)

- **Modularización por dominio Nest estándar:** un módulo/controlador/servicio por área (`auth`, `aulas`, `pictogramas`, `tareas`, `users`, `vinculos`, `supabase`) en `src/`, con DTOs por operación. Nada de controlador monolítico.
- **Separación de clientes Supabase bien pensada** (`src/supabase/supabase.service.ts`): `admin` (service_role, salta RLS) solo donde toca, `createUserClient(token)` para que la RLS y las funciones SQL decidan permisos en `tareas` y `vinculos`. Es el patrón correcto.
- **La lógica de negocio vive en la BD** (RPCs `create_task`, `get_agenda`…) y el servicio solo traduce formatos/errores, como documenta `src/tareas/tareas.service.ts`. `src/common/rpc-error.ts` centraliza la traducción y no filtra mensajes internos en errores desconocidos.
- **Validación global estricta:** `whitelist + forbidNonWhitelisted + transform` en `src/main.ts`, DTOs con validación condicional cuidada (`src/users/create-user.dto.ts`), y tipos de contrato compartidos desde `@agenda/shared` en vez de redefinirlos.
- **Detalles de seguridad correctos en auth:** respuesta anti-enumeración y revocación de sesión si el perfil no es válido en `src/auth/auth.service.ts`, rollback del alta a medias en `eliminarUsuarioCreado`, baja lógica idempotente «hacia el lado seguro».
- **Fail-fast de entorno** en `src/supabase/env.validation.ts` y TS en modo `strict` con ESM/NodeNext coherente (`.js` en imports).

---

## Cambios sí o sí (por orden)


- [ ] **1. Hacer `RolesGuard` fail-closed.** Si un método olvida su `@Roles()`, `src/auth/guards/roles.guard.ts` devuelve `true`. Los comentarios «OJO» en los controladores demuestran que el equipo ya lo sabe. Pasar a denegar por defecto (o `APP_GUARD` global + decorador `@Public()` explícito) elimina la clase entera de error.
- [ ] **2. Añadir `PASSWORD_PEPPER` a la validación de entorno.** Se exige con `getOrThrow` en `src/users/users.service.ts` pero no figura en `EnvVars`, en `REQUIRED` (`src/supabase/env.validation.ts`) ni en `.env.example` (ni en el `.env` local). El arranque no falla; revienta la primera alta de alumno con PIN/pictogramas. Añadirla a los tres sitios.
- [ ] **3. Resolver el método `pattern`: aceptado pero rompe.** El DTO (`src/users/create-user.dto.ts`) lo admite, pero en `src/users/users.service.ts` el secreto se calcula como `pin ? pin : pictograms.join('|')`: con `pattern`, `pictograms` es `undefined` → `TypeError` y 500. O se implementa la rama o se rechaza en el DTO hasta soportarlo.
- [ ] **4. Eliminar código muerto en aulas:** código comentado y ejemplo de guards muertos en `src/aulas/aulas.controller.ts` (son los 2 warnings de lint: imports `Req`/`UseGuards` sin uso).
- [ ] **5. Añadir rate-limiting en login.** No hay `@nestjs/throttler`, ni helmet, en ningún sitio. Con PINs de 4 dígitos y login accesible de alumnado en camino, el throttling en `/auth/login` (y futuros endpoints de alumno) no es opcional antes de exponer esto fuera de localhost.
- [ ] **6. Sacar CORS y revisar `SUPABASE_URL` antes de desplegar.** `origin: 'http://localhost:5173'` fijo en `src/main.ts`: debe salir de una variable de entorno antes de cualquier despliegue. Y revisad el `.env` local: `SUPABASE_URL` lleva sufijo `/rest/v1/`, que no es la URL de proyecto que espera `supabase-js` (construiría rutas `/rest/v1/auth/v1/…`); si la app funciona, probablemente otro entorno lo sobrescribe.
- [ ] **7. Tipar los roles:** `@Roles(...roles: string[])` debería ser `UserRole[]` de `@agenda/shared`; hoy un typo en un rol compila y deniega (o permite) en silencio.

---

## Mejoras (sin prisa)

- [ ] **Cerrar los endpoints públicos que devuelven datos de menores.** `src/aulas/aulas.controller.ts` y `src/pictogramas/pictogramas.controller.ts` no tienen ningún guard, y consultan con el cliente `admin`. Que el listado de aulas sea público para «Elige tu clase» es defendible; `GET /classrooms/:id/students` (nombres + método de login de alumnos) y `/pictograms/student/:id` sin autenticar, no. Hay que autenticarlos o reducirlos a lo mínimo imprescindible pre-login.
- [ ] **Tests donde está el riesgo:** hay specs de mapeo en `tareas` y `pictogramas`, pero nada de `UsersService` (357 líneas, el fichero más complejo), ni de guards, ni e2e pese a tener `vitest.config.e2e.ts` y supertest instalados. Y no hay CI que ejecute nada de esto.
- [ ] **Partir `UsersService`:** alta staff, alta alumno, bajas, roles, lectura de correos y limpieza comparten fichero; además usa `dto.email as string` / `acceso.pictograms as string[]` que anulan lo que el DTO garantiza.
- [ ] **Unificar el manejo de errores entre módulos:** `tareas`/`vinculos` usan `dbFailure`, `users`/`aulas`/`pictogramas` lanzan `InternalServerErrorException`/`ServiceUnavailableException` a mano con criterios distintos para el mismo fallo de BD.
- [ ] **Optimizar el guard de autenticación:** `src/auth/guards/supabase-auth.guard.ts` hace 2 viajes a Supabase (Auth + `profiles`) por cada petición, sin caché. Aceptable ahora; será el primer cuello de botella.
- [ ] **Eliminar el `as any` de `src/aulas/aulas.service.ts`** y reactivar `typescript/no-explicit-any` en `.oxlintrc.json` (hoy desactivado).
- [ ] **Eliminar duplicados:** interfaz `AuthedRequest` duplicada en `src/users/users.controller.ts`, mapeo de pictograma duplicado entre `findAll`/`findByStudent` en `src/pictogramas/pictogramas.service.ts`.
- [ ] **Quitar `jose` como dependencia** si solo se usa para el tipo `JWTPayload` (`src/auth/guards/supabase-user.ts`); se puede definir el tipo sin la librería.
- [ ] **Unificar convenciones de nombres:** carpetas en español (`aulas`, `tareas`) mezcladas con `users`/`auth` y rutas en inglés; clases en inglés. Funciona, pero conviene fijar un criterio.
- [ ] **Limpiar `SupabaseModule` global redundante:** está marcado `@Global()` y a la vez importado en `tareas`/`vinculos`; sobra una de las dos cosas.
- [ ] **Activar `strictPropertyInitialization`** en `tsconfig.json` (hoy en `false`).
- [ ] **Validar cota superior de `PORT`** en `src/supabase/env.validation.ts` (hoy acepta 99999).
- [ ] **Health check real:** `src/app.controller.ts` no comprueba Supabase; añadir comprobación de BD si se va a usar para despliegue/monitorización.
- [ ] **Valorar OpenAPI/Swagger** pese a tener el contrato en `shared`, para documentar la API.
- [ ] **Eliminar o corregir el script `"deploy": "nest deploy"`** en `package.json`, que no despliega nada.


---

**Resumen:** arquitectura y criterio, bien; el trabajo pendiente está en cerrar el perímetro (puntos 1–3) y en no dejar que `pattern`/`PASSWORD_PEPPER` rompan en producción (puntos 3–4).
