# Login accesible — decisiones de diseño (iteración 1)

> Estado: **documento de decisiones, sin implementación todavía.**
> Fecha de la foto de la BD: 2026-11-05.
> Contexto general del proyecto: [../AGENTS.md](../AGENTS.md).

## 1. Objetivo de la iteración

Solo el **inicio de sesión**. Nada de agenda, tareas ni pantallas.

- **Personal** (`teacher`, `tutor`, `specialist` — y `admin`/`family`):
  login normal, correo + contraseña.
- **Alumnado** (`student`): login accesible. El **administrador configura
  para cada alumno** uno de estos métodos:

  | Método (`student_login_method`) | Qué hace el alumno |
  |---|---|
  | `password` | Escribe una contraseña simple |
  | `pin` | Teclea un PIN numérico corto |
  | `pattern` | Une puntos en una cuadrícula (patrón) |
  | `pictogram` | Toca sus pictogramas en el orden correcto |

- Principio aceptado por el equipo: en el alumnado **la accesibilidad prima
  sobre la seguridad**. Que el método sea menos seguro no es un defecto.
  Aun así se aplican mínimos higiénicos (sección 7).

## 2. Estado actual de la base de datos (verificado en Supabase)

Relevante para el login:

- `auth.users` (Supabase Auth): 0 usuarios. Es quien emite las sesiones JWT.
- `public.profiles`: perfil por usuario. Ya trae dos piezas pensadas para
  este login:
  - `login_identifier`: identificador corto del alumno (ej. `juan.garcia`),
    porque **no se puede suponer que un alumno tenga correo**.
  - `login_method`: método accesible asignado por el administrador.
- `public.student_credentials`: hash de la credencial para
  `password`/`pin`/`pattern`.
- `public.pictogram_credentials`: hash de la secuencia de pictogramas
  (`sequence_length` 3–4).
- `public.pictograms`: catálogo con 12 pictogramas semilla activos.
- RLS: las tablas de credenciales y el catálogo **no tienen políticas**, así
  que ningún cliente (ni `anon` ni `authenticated`) puede leerlos. Solo el
  backend con `service_role`.
- Migración `remove_login_lockout`: ya se decidió que **no hay bloqueo de
  cuenta por intentos fallidos** (un bloqueo dejaría fuera a un alumno que
  se equivoca; es una barrera de accesibilidad).
- `profiles.accessibility_prefs` (jsonb) ya existe: es donde irán las
  preferencias de accesibilidad del alumno (tamaño, contraste, audio…),
  fuera de esta iteración pero conviene no mezclarlo con el login.

### Revisión del equipo (2026-11-05, aplicada)

- **El alumnado también tiene correo**, como cualquier usuario: vive en
  `auth.users` (no se duplica en `profiles`). Lo que el alumno teclea para
  identificarse sigue siendo su `login_identifier` corto; el correo es un
  dato de su cuenta, no algo que tenga que escribir o memorizar.
- **Registro público desactivado** en Supabase Auth (hecho en el panel):
  todas las cuentas las crea el administrador.
- **C1** · Borrado el índice único duplicado de `login_identifier`
  (migración `login_review_fixes_c1_c2_c4_c5`).
- **C2** · `student_credentials` ya tiene trigger `touch_updated_at`.
- **C3** · Los 12 pictogramas tienen su `arasaac_id` oficial relleno
  (migración `pictograms_arasaac_ids`, verificados contra
  `api.arasaac.org`). La API devolverá ese id y el frontend construirá la
  imagen sin llamar a ARASAAC en cada login:
  `https://static.arasaac.org/pictograms/{arasaac_id}/{arasaac_id}_500.png`.
  Es la forma adecuada: menos latencia, funciona con la PWA en caché y no
  depende de que la API de búsqueda de ARASAAC responda en ese momento.
  Recordatorio: los pictogramas de ARASAAC son CC BY-NC-SA, hay que
  atribuir la autoría en la app.
- **C4** · Revocado `EXECUTE` de `rls_auto_enable()` a `public`, `anon` y
  `authenticated`: el event trigger `ensure_rls` sigue funcionando, pero
  la función ya no es invocable como RPC.
- **C5** · Coherencia credencial ↔ rol forzada en BD (triggers
  `guard_student_credentials` y `profiles_credentials_cleanup`):
  las credenciales accesibles solo pueden existir para `student` y solo
  la del método configurado; al cambiar de método o de rol, la credencial
  anterior se borra sola. Profesor, tutor, especialista, familia y admin
  entran únicamente con correo + contraseña de Supabase Auth, sin PIN,
  patrón ni pictogramas. Probado con un usuario temporal: sin método,
  con método incompatible, cambio de método y cambio de rol.


## 3. Decisiones ya cerradas (vienen del enunciado)

- **D1. Cuatro colectivos, dos experiencias de login.** Personal: correo +
  contraseña. Alumnado: método accesible por alumno.
- **D2. El método lo elige el administrador, no el alumno**, y queda guardado
  en `profiles.login_method`. El alumno no ve un selector de métodos: al
  introducir su identificador, la app le presenta directamente su método.
- **D3. El alumno se identifica tecleando su `login_identifier`, no su
  correo.** Su cuenta sí tiene correo real en `auth.users`, como la de
  cualquier persona; simplemente no es lo que usa para entrar.
- **D4. Sin bloqueo por intentos fallidos** (ya aplicado en BD).
- **D5. Cuentas creadas por el administrador.** No hay registro abierto ni
  recuperación de contraseña self-service para el alumnado: si un alumno
  olvida su PIN/patrón/secuencia, el administrador se lo reconfigura.

## 4. Arquitectura propuesta (pendiente de implementar)

**El backend NestJS media todo el login del alumnado; el frontend nunca
habla con las tablas de credenciales.** La sesión final es siempre una
sesión estándar de Supabase Auth, para que el resto de la app (RLS, RPC
`get_my_profile`, etc.) funcione igual para todos los roles.

Flujo del personal (simple, sin lógica propia):

1. Front → `POST /api/auth/login` `{ email, password }`.
2. API → Supabase Auth (`signInWithPassword`) y devuelve su sesión
   (`access_token` + `refresh_token`) junto al perfil (`profiles`).
3. Si el perfil está dado de baja (`deactivated_at`) o es un `student`,
   se rechaza: el alumnado entra por su flujo.

Flujo del alumnado (el backend verifica la credencial accesible y después
emite una sesión de Supabase):

1. Front → `POST /api/auth/student/method` `{ identifier }`.
   La API responde el método configurado y lo que la pantalla necesita
   (p. ej. el catálogo de pictogramas activos si el método es `pictogram`).
   **Nunca** devuelve nada de la credencial.
2. El alumno resuelve su método (PIN, patrón, pictogramas o contraseña).
3. Front → `POST /api/auth/student/login` `{ identifier, credential }`.
4. La API busca el perfil por `login_identifier`, comprueba que es
   `student` activo con método configurado, verifica la credencial contra
   su hash (sección 7) y, si es correcta, genera una sesión de Supabase
   Auth para ese usuario y la devuelve en el mismo formato que el login
   del personal.

Cómo generar la sesión sin conocer una contraseña de Supabase:

- El alumno tiene su usuario en `auth.users` **con su correo real** y una
  contraseña de Supabase aleatoria que ni él ni nadie usa (su contraseña
  "de verdad" es la accesible). El backend, con `service_role`, genera un
  enlace mágico (`generateLink`) sobre ese correo y lo canjea
  (`verifyOtp`) para obtener la sesión.
- (Descartado) Correo sintético: ya no hace falta, el alumnado tiene
  correo como cualquier usuario.
- (Descartado) JWT propio firmado por la API: rompería la integración
  con RLS/`auth.uid()` de Supabase.

## 5. Formato de cada credencial (propuesta)

La credencial viaja del front a la API ya "normalizada" y el backend la
hashea/verifica siempre en el mismo formato:

| Método | Qué envía el front | Normalización antes del hash | Dónde va el hash |
|---|---|---|---|
| `password` | La contraseña escrita | Tal cual (sin recortar espacios internos) | `student_credentials` |
| `pin` | Cadena de dígitos | Tal cual; 4–6 dígitos | `student_credentials` |
| `pattern` | Lista de puntos tocados (ej. `[0,4,8]`) | Unir con `-`: `"0-4-8"`; mínimo 4 puntos, sin repetir, cuadrícula 3×3 (puntos 0–8) | `student_credentials` |
| `pictogram` | Lista ordenada de ids (ej. `["pictograma-gato","pictograma-sol","pictograma-casa"]`) | Unir con `,`: `"pictograma-gato,pictograma-sol,pictograma-casa"`; 3–4 pictogramas, todos activos del catálogo | `pictogram_credentials` (`sequence_hash` + `sequence_length`) |

Notas:

- Repetir pictogramas dentro de la secuencia: permitido si el equipo no
  decide lo contrario (pregunta abierta Q4).
- El catálogo que se muestra en pantalla incluye distractores: se enseñan
  un subconjunto — Q5, no solo los de la secuencia del alumno.

## 6. Contrato API previsto (borrador para el equipo de frontend)

Todo bajo el prefijo `/api`. Respuesta de sesión común a ambos logins:

```jsonc
// POST /api/auth/login            (personal)
// POST /api/auth/student/login    (alumnado)
// -> 200
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "uuid", "fullName": "...", "role": "student" }
}
```

Endpoints previstos:

| Endpoint | Quién | Para qué |
|---|---|---|
| `POST /api/auth/login` | Personal | Correo + contraseña (Supabase Auth) |
| `POST /api/auth/refresh` | Todos | Renovar sesión con `refreshToken` |
| `GET /api/auth/me` | Todos | Perfil del usuario de la sesión |
| `POST /api/auth/student/method` | Público | Dado un `identifier`, método que le toca y datos para pintarlo (catálogo si es pictogramas) |
| `POST /api/auth/student/login` | Público | Verificar credencial accesible y emitir sesión |
| `GET /api/auth/pictograms` | Público | Catálogo activo de pictogramas (con `arasaac_id` para construir la imagen) |
| `POST /api/auth/admin/students` | Solo `admin` | Alta de alumno: identificador, nombre, método y credencial inicial |
| `PATCH /api/auth/admin/students/:id/login` | Solo `admin` | Cambiar método y/o credencial de un alumno (incluye "olvidó su PIN") |

Errores: JSON uniforme `{ "statusCode": 401, "message": "..." }` con
mensajes pensados para poder mostrarse/leerse en voz alta sin dar pistas
("Credenciales incorrectas", sin distinguir si falló el identificador o la
credencial). En `student/method`, identificador inexistente y alumno sin
método configurado deben distinguirse solo internamente; de cara al front
se valora responder igual para no filtrar qué identificadores existen
(Q6, bajo riesgo en un colegio, pero barato de hacer).

## 7. Seguridad mínima (compatible con la accesibilidad)

- **Nada de texto plano**: todas las credenciales se guardan como hash con
  sal (propuesta: `scrypt` de Node o `bcrypt`; si se hiciera en BD,
  `pgcrypto` ya está instalado). La secuencia de pictogramas también se
  hashea: es una contraseña, aunque sea débil.
- Verificación en tiempo constante y **sin mensajes que filtren** qué
  parte falló.
- Sin bloqueo de cuenta (D4). Como contrapeso barato: retardo pequeño tras
  intento fallido y registro de intentos en logs del servidor (sin guardar
  nunca la credencial intentada).
- `service_role` solo en el backend (variable de entorno). El frontend
  solo usa la `anon key` y los tokens de sesión.
- Las tablas de credenciales siguen sin políticas RLS: ni siquiera un
  usuario logueado puede leer hashes.
- Baja lógica: un perfil con `deactivated_at` no puede entrar por ningún
  flujo.

## 8. Configuración que necesitará el backend (al implementar)

Variables de entorno de `apps/api` (nunca en el repo):

```bash
SUPABASE_URL=                # URL del proyecto Supabase
SUPABASE_ANON_KEY=           # clave anon/publishable
SUPABASE_SERVICE_ROLE_KEY=   # SOLO backend, secreta
PORT=3000
```

Dependencias previstas en `apps/api`: `@supabase/supabase-js` y validación
(`class-validator`/`class-transformer`) — a instalar al implementar.

## 9. Preguntas abiertas para el equipo

- ~~**Q1.** Correo sintético del alumnado~~ — **resuelta**: el alumnado
  tiene correo real en `auth.users`; no hay correo sintético.
- **Q2.** Longitudes exactas: ¿PIN fijo de 4 o 4–6? ¿Patrón mínimo 4 puntos
  confirmado? ¿Contraseña simple con mínimo (p. ej. 4 caracteres)?
- **Q3.** ¿La cuadrícula del patrón es siempre 3×3 o se quiere configurable
  por alumno (guardable en `accessibility_prefs`)?
- **Q4.** ¿Se permiten pictogramas repetidos dentro de una secuencia?
- **Q5.** En la pantalla de pictogramas, ¿se muestran los 12 del catálogo
  o un subconjunto aleatorio con los suyos dentro?
- **Q6.** En `student/method`, ¿respuesta opaca ante identificadores
  inexistentes o mensaje claro de "usuario no encontrado"? (En un colegio
  el riesgo es bajo; prima la claridad para el alumno.)
- **Q7.** ¿`family` entra en esta iteración como login normal o se aparca?
  (En el enunciado no aparece, pero el rol ya existe en BD.)
- **Q8.** ¿Quién crea las cuentas del personal: el administrador desde la
  app o directamente en el panel de Supabase por ahora?

## 10. Nota sobre el estado de la BD

Migraciones de esta iteración, todas aplicadas y verificadas:

- `20261105094242 student_accessible_login` — enum `student_login_method`,
  `profiles.login_method`, índice único de `login_identifier` y tabla
  `student_credentials`.
- `20261105122025 login_review_fixes_c1_c2_c4_c5` — C1, C2, C4 y C5.
- `20261105122036 pictograms_arasaac_ids` — C3.
- `20261105122105 fix_student_credentials_guard_null_method` — corrección
  del guardia C5 con `login_method` a `NULL` (detectado en pruebas).

Todavía no hay código de API que use este esquema: eso es la
implementación, pendiente de arrancar.
