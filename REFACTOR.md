# Lista de cambios: AnticipaTuDia

Revisión de `apps/web` y `packages/shared`. Marca cada punto con `[x]` cuando esté hecho.

## Prioridades (orden recomendado)

- [ ] 1. Arreglar la inconsistencia `pictogram` / `pictograms` en `shared` (único punto que puede fallar en runtime)
- [ ] 2. Unificar nombres de carpetas y hooks (`use...`) en `apps/web`
- [ ] 3. Reorganizar `shared` por dominios (ver estructura propuesta)
- [ ] 4. Añadir capa de API centralizada y archivo de rutas en `web`
- [ ] 5. Reorganizar `apps/web` por funcionalidades (ver estructura propuesta)

---

## Decisiones ya tomadas (no hay que cambiarlas)

Se dejan documentadas para no volver a discutirlas.

### Versiones distintas de TypeScript

- `apps/web` usa `typescript@7.0.2` (muy reciente) y `packages/shared` + backend (Nest) usan `typescript@6.0.3`. Es intencionado: Nest necesita la 6.x.
- Como `shared` compila con la 6.0.3 y emite `.d.ts`, el frontend los lee sin problema con la 7.
- Recomendación menor: fijar versiones exactas (sin `^`) en cada `package.json` para que no se desincronicen sin querer.

### `shared` se consume compilado (`dist/`)

- Se mantiene `dist/` porque `shared` puede exportar funciones o constantes en el futuro, no solo tipos.
- El flujo de scripts del `package.json` raíz (`pnpm --filter @agenda/shared build` antes de `dev`) es correcto. `pnpm -r build` ordena los paquetes por dependencias, así que `shared` se compila antes que `web` y `api`.
- Mejoras opcionales sobre ese flujo:
  - [ ] `dev:web` y `dev:api` solo compilan `shared` una vez. Si editáis `shared` con el servidor en marcha hay que recompilar a mano. Opción: añadir un script `dev` en `shared` con `tsc --watch --preserveWatchOutput` y lanzarlo en paralelo.
  - [ ] Comprobar que `packages/shared/package.json` tiene `main`, `types` y `exports` apuntando a `dist/`, y `"files": ["dist"]`.
  - [X] Asegurar que `dist/` está en `.gitignore` (en `apps/web` y en `packages/shared`) y que el CI ejecuta el build de `shared` antes del resto.

---

## `packages/shared`

### Bugs e inconsistencias

- [ ] **`'pictogram'` vs `'pictograms'`.** `StudentLoginMethod` usa `'pictogram'` y `StudentAccess` usa `method: 'pictograms'`. Unificar y comprobar que coincide con lo que espera el backend (igual para `password`, `pin`, `pattern`). Propuesta de fuente única de verdad:

  ```ts
  export const STUDENT_LOGIN_METHODS = ['password', 'pin', 'pattern', 'pictogram'] as const;
  export type StudentLoginMethod = typeof STUDENT_LOGIN_METHODS[number];

  export type StudentAccess =
    | { method: 'pin'; pin: string }
    | { method: 'pattern'; pattern: string }
    | { method: 'password'; password: string }
    | { method: 'pictogram'; pictograms: string[] };
  ```

- [X] **Eliminar `ClassroomStudent`** (ya marcado como innecesario en el propio código). Reutilizar un tipo `Student` base o `Pick<UserSummary, 'id' | 'fullName'> & { loginMethod?: StudentLoginMethod | null }`.

### Nombres

- [ ] Renombrar `Usercreated` → `UserCreated`.
- [ ] Renombrar `UserList` a algo que refleje que es un elemento y no una lista (`UserSummary` o `AdminUserListItem`).
- [ ] Decidir criterio de nombres para los DTOs: hay `...Request` / `...Response` en unos tipos (`SessionResponse`, `CreateStudentRequest`) y no en otros (`Task`, `MyStudent`). Propuesta: `Request`/`Response` para lo que viaja por la API y nombre limpio para entidades del dominio.
- [ ] Crear `type ISODateString = string` y usarlo en `dueAt`, `startedAt`, `completedAt`, `deactivatedAt` para documentar que son fechas ISO 8601.

### Estructura propuesta

Agrupar por dominio, con un archivo por dominio. Se divide en carpetas solo cuando un archivo crezca demasiado.

```
packages/shared/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           (solo reexporta)
│   ├── common.ts          (ISODateString y tipos genéricos)
│   ├── auth.ts            (UserRole, SessionResponse, StudentLoginMethod, StudentAccess)
│   ├── users.ts           (CreateUserRequest, CreateStudentRequest, CreateStaffRequest, UserCreated, UserSummary)
│   ├── classrooms.ts      (Classroom y tipos de alumnos de clase)
│   ├── pictograms.ts      (Pictogram)
│   ├── tasks.ts           (Task, Subtask, TaskOrigin, TaskStatus)
│   └── links.ts           (LinkRelation, StudentLink, MyStudent)
└── dist/                  (generado, en .gitignore)
```

Cuando haya código en runtime se añadirían:

```
src/
├── constants/             (STUDENT_LOGIN_METHODS, etc.)
├── schemas/               (esquemas Zod, si se adopta)
└── utils/                 (funciones compartidas)
```

### Validación y documentación

- [ ] **Valorar Zod** para compartir validación en runtime entre frontend y backend (definir el esquema una vez y derivar el tipo con `z.infer`). Especialmente útil en `StudentAccess`. Si el backend ya valida con DTOs de class-validator, evitaría mantener dos definiciones. Encaja con la decisión de compilar `shared`, ya que pasaría a exportar código real.
- [ ] **Mover o generar `contrato.md`.** Valorar llevarlo a `docs/` en la raíz o generarlo desde OpenAPI para que no se desincronice del código.

---

## `apps/web`

### Convenciones y nombres

- [ ] **Unificar el idioma de las carpetas.** Ahora se mezclan nombres en español con tipos y API en inglés (`shared`). Decidir una sola convención (la propuesta usa inglés para carpetas técnicas; si el equipo prefiere español, vale igual mientras sea coherente).
- [ ] **Unificar mayúsculas/minúsculas.** Hay `Componentes`, `Contextos`, `Hooks`, `Pantallas`, `Tipos`, `Utilidades` con mayúscula y `assets` en minúscula. Usar minúscula en todas. En Linux `Componentes` y `componentes` son carpetas distintas, y en Windows/macOS no, lo que puede romper imports o CI.
- [ ] **Renombrar hooks.** `UseAccesibilidad.ts` → `useAccesibilidad.ts` y `UseUsuarios.ts` → `useUsuarios.ts`. La convención de React (y de los linters `react-hooks`) espera `use` en minúscula.
- [ ] **`Tipos/metodoLogin.tsx` → `.ts`.** Si solo contiene tipos no necesita JSX.
- [ ] **Eliminar duplicado de tipos.** Comprobar que `metodoLogin` no repite `StudentLoginMethod` de `@agenda/shared`; si es así, importar el de `shared`.

### Arquitectura

- [ ] **Crear capa de API centralizada** (`lib/api`): un único módulo que gestione base URL, token, refresh del `accessToken` con `refreshToken` y manejo de errores. Si `useUsuarios` hace `fetch` directo, moverlo ahí. Valorar TanStack Query.
- [ ] **Definir las rutas en un solo archivo** (`app/router.tsx`), sacándolas de `App.tsx`. Añadir lazy loading por rol (el alumno no debería descargar el código de admin).
- [ ] **Reorganizar por funcionalidades** (estructura propuesta abajo).

### Estructura propuesta

```
apps/web/src/
├── main.tsx
├── app/
│   ├── App.tsx
│   ├── router.tsx               (todas las rutas, con lazy loading por rol)
│   └── providers.tsx            (AccesibilidadProvider y futuros providers)
├── features/
│   ├── auth/
│   │   ├── pages/               (SeleccionRol, InicioSesionTutorFamilia)
│   │   ├── components/          (RutaProtegida, BotonCerrarSesion)
│   │   └── session.ts           (antes Utilidades/sesion.ts)
│   ├── student-login/
│   │   ├── pages/               (SeleccionEstudiante, InicioSesionClase, InicioSesionCodigo,
│   │   │                         InicioSesionPatron, InicioSesionPictogramas)
│   │   └── types.ts             (antes Tipos/metodoLogin.tsx, o importar de shared)
│   ├── admin/
│   │   ├── pages/               (PanelAdmin, AltaUsuarioAdmin, BajaUsuarioAdmin, GestionRolesAdmin)
│   │   ├── components/          (ListaUsuarios)
│   │   └── hooks/               (useUsuarios)
│   └── accessibility/
│       ├── AccesibilidadProvider.tsx
│       ├── BotonAccesibilidad.tsx
│       └── useAccesibilidad.ts
├── components/
│   ├── ui/                      (TarjetaSeleccion y componentes genéricos reutilizables)
│   └── layout/                  (PanelLateral)
├── lib/
│   └── api/                     (cliente HTTP, interceptor de refresh, funciones por recurso)
├── assets/
└── styles/                      (index.css, App.css)
```

Reglas para que no se desordene:

- Cada `feature` solo contiene lo que usa esa funcionalidad. Lo que usan varias va a `components/` o `lib/`.
- Las `features` no se importan entre sí, salvo a través de `components/` o `lib/`.
- A futuro, las pantallas de tutor/familia y las de tareas del alumno tendrían su propia `feature` (`tasks/`, `tutor/`).

Tabla de migración desde la estructura actual:

| Actual | Nuevo |
|---|---|
| `Pantallas/acceso/*` | `features/auth/pages/` |
| `Pantallas/alumno/*` | `features/student-login/pages/` |
| `Pantallas/admin/*` | `features/admin/pages/` |
| `Componentes/sesion/*` | `features/auth/components/` |
| `Componentes/accesibilidad/BotonAccesibilidad.tsx` | `features/accessibility/` |
| `Contextos/AccesibilidadProvider.tsx` | `features/accessibility/` |
| `Hooks/UseAccesibilidad.ts` | `features/accessibility/useAccesibilidad.ts` |
| `Hooks/UseUsuarios.ts` | `features/admin/hooks/useUsuarios.ts` |
| `Componentes/ui/ListaUsuarios.tsx` | `features/admin/components/` |
| `Componentes/ui/TarjetaSeleccion.tsx` | `components/ui/` |
| `Componentes/layout/PanelLateral.tsx` | `components/layout/` |
| `Utilidades/sesion.ts` | `features/auth/session.ts` |
| `Tipos/metodoLogin.tsx` | `features/student-login/types.ts` (o eliminar si duplica `shared`) |
| `App.tsx`, `App.css`, `index.css` | `app/App.tsx`, `styles/` |

### Entorno y herramientas

- [ ] **Añadir tests** (`vitest`).
- [ ] **Añadir `.env.example`** y definir `VITE_API_URL`.
- [ ] **Comprobar `src/vite-env.d.ts`** (tipos de `import.meta.env`).
- [ ] **Verificar `.gitignore`**: `dist/` y `node_modules/` deben estar ignorados.

---

## Pendiente de revisar

- [ ] Revisar `App.tsx`, `useUsuarios.ts` y `sesion.ts` para ver cómo se gestionan rutas, sesión y llamadas al backend.