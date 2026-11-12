# AnticipaTuDia

Agenda escolar accesible para alumnado de un colegio de educación especial.
Cada alumno entra con el método que el administrador le asigne (contraseña,
PIN, patrón o pictogramas); profesorado, tutores, especialistas, familias y
administración entran con correo y contraseña.

## Estructura

Monorepo con pnpm workspaces:

- `apps/api` — Backend NestJS. Rutas bajo `/api`, puerto 3000.
- `apps/web` — Frontend React + Vite (PWA). Puerto 5173, con proxy de `/api`
  al backend.
- `packages/shared` (`@agenda/shared`) — Tipos y DTO compartidos entre front
  y back: son el contrato de la API.

La base de datos vive en Supabase (PostgreSQL con RLS); el esquema y las
migraciones están en el proyecto de Supabase, no en este repositorio.

## Puesta en marcha

Requisitos: Node y pnpm.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env    # completar las claves de Supabase
pnpm dev   # web en http://localhost:5173 y API en http://localhost:3000/api
# `pnpm dev` compila @agenda/shared y lo deja en watch automáticamente
```

Para arrancar cada parte por separado: `pnpm dev:web` y `pnpm dev:api`.

## Comandos

```bash
pnpm build               # compila los tres paquetes
pnpm lint                # oxlint en todo el monorepo
pnpm --filter api test   # tests unitarios de la API (Vitest)
```

## Documentación

- Decisiones de diseño del login accesible:
  [apps/api/docs/login-accesible-decisiones.md](apps/api/docs/login-accesible-decisiones.md)
- Contrato front/back: los tipos de
  [packages/shared/src](packages/shared/src/index.ts).

Los pictogramas son de ARASAAC, con licencia CC BY-NC-SA.
