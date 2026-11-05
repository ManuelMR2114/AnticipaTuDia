# AGENTS.md — AnticipaTuDia

> Contexto para futuras conversaciones con agentes. Leer también
> [docs/login-accesible-decisiones.md](docs/login-accesible-decisiones.md).

## Qué es el proyecto

Proyecto universitario: **agenda accesible para alumnado de un colegio de
educación especial** (alumnos con discapacidad).

Nuestro equipo se encarga **solo del backend y de la base de datos**.
El frontend lo hace otro equipo; aquí solo se define el contrato API que consumirá.

## Alcance

### Iteración actual (iteración 1): solo el login accesible

Todavía **no** hay que implementar la agenda (tareas, calendario, etc.),
aunque la BD ya trae tablas para ello (ver estado de la BD más abajo).

Usuarios y forma de acceso:

| Rol en BD (`user_role`) | Quién es | Login |
|---|---|---|
| `student` | Alumno con discapacidad | Accesible, configurable por alumno (ver abajo) |
| `teacher` | Profesor | Normal: correo + contraseña |
| `tutor` | Tutor | Normal: correo + contraseña |
| `specialist` | Especialista (logopeda, fisio, etc.) | Normal: correo + contraseña |
| `family` | Familia (ya existe en BD, fuera del enunciado de esta iteración) | Normal: correo + contraseña |
| `admin` | Administrador del centro | Normal: correo + contraseña; configura el login de cada alumno |

Métodos de login del alumnado, **elegidos por el administrador para cada alumno**
(no los elige el alumno en el momento de entrar):

1. `password` — contraseña simple escrita.
2. `pin` — PIN numérico corto.
3. `pattern` — patrón (unir puntos en una cuadrícula).
4. `pictogram` — secuencia ordenada de pictogramas: se muestran pictogramas y
   el alumno toca los suyos en el orden correcto.

Principio rector: **la accesibilidad manda sobre la seguridad en el acceso del
alumnado**. Los métodos accesibles son intrínsecamente menos seguros y eso es
aceptable y explícito en este proyecto. Aun así, las credenciales nunca se
guardan en texto plano (siempre hash) y nunca se exponen por la API.

### Fuera de alcance por ahora

- Agenda, tareas y subtareas (la BD ya las modela; no tocar en esta iteración).
- Registro abierto/self-service: las cuentas las crea el administrador.

## Estructura del monorepo

Monorepo con **pnpm workspaces** (`pnpm-workspace.yaml`):

- `apps/api` — Backend **NestJS 12** (TypeScript, ESM, Vitest, oxlint).
  Prefijo global `/api` en `apps/api/src/main.ts`. Puerto `PORT` o 3000.
  Hoy solo tiene el `AppController` de plantilla (`GET /api` → "Hello World!").
- `apps/web` — Frontend React 19 + Vite (equipo de frontend; no modificar
  salvo petición expresa).
- `packages/shared` (`@agenda/shared`) — Tipos/DTO compartidos entre front y back.

Comandos desde la raíz:

```bash
pnpm dev:api        # NestJS en modo watch
pnpm dev:web        # Vite
pnpm build          # build de todos los paquetes
pnpm lint           # oxlint en todos los paquetes
pnpm --filter api test      # Vitest (unit)
pnpm --filter api test:e2e  # Vitest e2e
```

## Base de datos (Supabase / PostgreSQL)

La BD vive en **Supabase** y es la fuente de verdad del esquema.
No hay carpeta `supabase/migrations` en el repo: las migraciones se aplican
contra el proyecto Supabase y quedan registradas allí. Al trabajar con la BD,
comprobar siempre el estado real (herramientas MCP de Supabase o SQL), no
fiarse solo de este documento: es una foto, puede quedar desactualizada.

### Estado verificado el 2026-11-05

Migraciones aplicadas:

1. `20261029122906 initial_schema_users_links_tasks`
2. `20261105084252 agenda_api_rpc_functions`
3. `20261105085738 pictogram_auth`
4. `20261105085901 remove_login_lockout` (decisión: **sin bloqueo por intentos**)
5. `20261105094242 student_accessible_login` (método y credenciales del alumnado;
   ver detalle en el documento de decisiones)
6. `20261105122025 login_review_fixes_c1_c2_c4_c5` (índice duplicado fuera,
   trigger de `updated_at`, `rls_auto_enable` no invocable, coherencia
   credencial ↔ rol)
7. `20261105122036 pictograms_arasaac_ids` (`arasaac_id` de los 12 pictogramas)
8. `20261105122105 fix_student_credentials_guard_null_method`

En Supabase Auth el **registro público está desactivado**: todas las
cuentas las crea el administrador. El alumnado tiene correo real en
`auth.users` como cualquier usuario; para entrar teclea su
`login_identifier`, no el correo.

Tablas en `public` (todas con RLS activado):

- `profiles` — Un perfil por usuario de `auth.users` (`id` = FK a `auth.users`).
  Columnas: `full_name`, `role` (enum `user_role`: `student | tutor | teacher |
  specialist | family | admin`, por defecto `student`), `accessibility_prefs`
  (jsonb), `deactivated_at` (baja lógica), `login_identifier`
  (usuario corto del alumno, formato `^[a-z0-9._-]{3,32}$`, único cuando no es
  nulo), `login_method` (enum `student_login_method`:
  `password | pin | pattern | pictogram`, solo para `role = 'student'`).
  El trigger `handle_new_user` crea el perfil al registrarse el usuario en
  Supabase Auth. El trigger `private.guard_profile_update` impide que un
  no-admin cambie `role`, `login_identifier` o `deactivated_at`.
- `student_credentials` — Hash de la credencial del alumno para
  `password | pin | pattern` (`user_id` PK → `profiles`). Sin políticas RLS:
  solo accede el backend con `service_role`. Tiene trigger
  `touch_updated_at`. Los triggers `private.guard_student_credentials` y
  `private.cleanup_student_credentials` fuerzan que la credencial solo
  exista para un `student` y solo la de su `login_method`: el personal
  (teacher/tutor/specialist/family/admin) **nunca** tiene PIN, patrón ni
  pictogramas, solo correo + contraseña de Supabase Auth.
- `pictogram_credentials` — Hash de la secuencia de pictogramas
  (`user_id` PK → `auth.users`, `sequence_length` entre 3 y 4). Sin políticas
  RLS: solo backend con `service_role`. Mismos triggers de coherencia.
- `pictograms` — Catálogo de pictogramas (`id` texto, `name`, `description`,
  `active`, `sort_order`, `arasaac_id`). 12 filas semilla con su
  `arasaac_id` oficial relleno: gato, perro, casa, sol, luna, manzana,
  árbol, flor, coche, libro, pelota, agua (ids `pictograma-*`). La imagen
  se construye como
  `https://static.arasaac.org/pictograms/{arasaac_id}/{arasaac_id}_500.png`
  (ARASAAC es CC BY-NC-SA: atribuir). Sin políticas RLS: el catálogo se
  sirve vía backend.
- `student_links` — Vínculos alumno ↔ profesor/tutor/especialista/familia
  (`relation`: `tutor | teacher | specialist | family`).
- `tasks` / `subtasks` — Agenda (iteraciones futuras; ya modeladas, con RLS).

Políticas RLS: existen para `profiles`, `student_links`, `tasks` y `subtasks`
(apoyadas en helpers `private.my_role()`, `private.is_linked()`,
`private.is_staff_of()`, etc.). Las tablas de credenciales y `pictograms`
**no tienen políticas**: inaccesibles para `anon`/`authenticated`; solo
`service_role` (el backend) puede leerlas.

Funciones RPC ya disponibles en `public` (pensadas para la agenda):
`get_my_profile`, `get_my_students`, `get_agenda`, `create_task`,
`create_task_for_students`, `update_task`, `delete_task`, `start_task`,
`complete_task`, `set_subtasks`, `set_subtask_status`, `link_student`,
`unlink_student`, `admin_set_role`, `update_my_accessibility_prefs`.

Todas las tablas de negocio están hoy a **0 filas** salvo `pictograms` (12).

Extensiones relevantes: `pgcrypto` instalada (por si el hash se hiciera en BD).

### Convenciones de BD

- Cambios de esquema = nueva migración en Supabase con nombre descriptivo en
  `snake_case`. Nunca editar a mano `auth.*`.
- RLS siempre activada. Credenciales y secretos: sin políticas para clientes,
  acceso solo desde el backend con `service_role`.
- La `service_role key` **nunca** va al frontend ni a un commit; solo variable
  de entorno del backend.
- ENUMs de PostgreSQL para valores cerrados (roles, métodos de login…).

## Decisiones y trabajo pendiente

Las decisiones de diseño del login accesible (arquitectura propuesta, flujos
por método, contrato API previsto, medidas de seguridad y preguntas abiertas
para el equipo) están en
[docs/login-accesible-decisiones.md](docs/login-accesible-decisiones.md).
Ese documento es **documentación de decisiones, no implementación**: en esta
sesión no se ha escrito código de la API de login.

## Reglas para trabajar en este repo

- Nuestro ámbito: `apps/api`, `packages/shared` y la BD de Supabase.
  No tocar `apps/web` salvo petición expresa.
- Todo el código y la documentación en **español** (identificadores técnicos
  en inglés cuando lo exija el framework o el esquema ya existente).
- Antes de proponer cambios de BD, revisar el estado real en Supabase.
- Ningún secreto en el repo: `.env` está en `.gitignore`; documentar las
  variables necesarias en el `.md` correspondiente.
- El alumnado tiene correo en `auth.users`, pero para entrar usa su
  `profiles.login_identifier` corto, no el correo.
