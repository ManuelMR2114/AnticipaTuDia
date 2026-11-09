# Contrato de la API (pendiente de implementar)

Endpoints que el frontend necesita y que todavía no existen.

| Endpoint | Pantalla | HU | Estado |
|---|---|---|---|
| `GET /api/classrooms/:id/students` | ¿Quién eres? | HU-05 | Pendiente |

---

## `GET /api/classrooms/:id/students`

Alumnos de un aula, para que el estudiante toque su tarjeta en "¿Quién eres?". Es **público** (se llama antes del login).

**Entrada:** `id` del aula (uuid, en la ruta).

**Salida `200`:** array de `ClassroomStudent` (ya definido en `@agenda/shared`).

```json
[
  { "id": "0b6f1c1e-6f0d-4c1a-9a53-1f3f6c0a7e11", "fullName": "Alberto Montero" },
  { "id": "5d2a9c47-3b8e-4e55-8c2f-9b1a0f7d2c34", "fullName": "Pablo Ruiz" }
]
```

**Reglas:**
- Devolver solo `id` y `fullName` (es público y son menores).
- Solo alumnos activos (`role = 'student'` y `deactivated_at` nulo), ordenados por nombre.
- Si el aula no tiene alumnos: `200` con `[]`.

**Errores:** `400` si el `id` no es un uuid, `500` si falla la base de datos.

**Tablas:** `student-classroom` (une alumno y aula) y `profiles`.