# Contrato de la API (pendiente de implementar)

Endpoints que el frontend necesita y que todavía no existen.

| Endpoint | Pantalla | HU | Estado |
|---|---|---|---|
| `GET /api/classrooms/:id/students` | ¿Quién eres? | HU-05 | Pendiente |
| `POST /api/auth/student/pin` | Confirma que eres tú (código) | HU-05 | Pendiente |
| `POST /api/auth/student/pictogramas` | Confirma que eres tú (pictogramas) | HU-05 | Pendiente |

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

---


## `POST /api/auth/student/pin`

Login de un alumno con `login_method = 'pin'`. Es **público**.

**Entrada (JSON):**
```json
{ "studentId": "0b6f1c1e-6f0d-4c1a-9a53-1f3f6c0a7e11", "pin": "1234" }
```

**Salida `200`:** `SessionResponse` (el mismo que devuelve `/auth/login`).

**Reglas:**
- Comprobar que el alumno existe, es `role = 'student'`, está activo y tiene `login_method = 'pin'`.
- Comparar el PIN con `student_credentials.credential_hash`. Nunca guardar ni devolver el PIN en claro.
- Mismo `401` si el alumno no existe, no usa PIN o el PIN es incorrecto, para no revelar cuál de los casos es.
- Limitar intentos por alumno e IP, porque un PIN corto se adivina por fuerza bruta.

**Errores:** `400` si falta `studentId` o `pin`, `401` credenciales incorrectas, `429` demasiados intentos, `503` si falla el servicio.

**Tablas:** `profiles` y `student_credentials`.

---

## `POST /api/auth/student/pictogramas`

Login de un alumno con `login_method = 'pictogram'`. Es **público**.

**Entrada (JSON):**
```json
{
  "studentId": "0b6f1c1e-6f0d-4c1a-9a53-1f3f6c0a7e11",
  "pictogramas": ["pic-id-1", "pic-id-2", "pic-id-3"]
}
```

**Salida `200`:** `SessionResponse` (el mismo que devuelve `/auth/login`).

**Reglas:**
- Comprobar que el alumno existe, es role = 'student', está activo y tiene login_method = 'pictogram'
- Comparar la secuencia de pictogramas recibida con la combinación almacenada en las credenciales del estudiante (student_credentials). Nunca guardar ni devolver la secuencia en texto plano si va hasheada.
- Mismo código 401 si el alumno no existe, no usa este método o la secuencia es incorrecta, para no revelar cuál de los casos es.
- Limitar los intentos por alumno para evitar ataques de fuerza bruta.

**Errores:** `400` si falta `studentId` o `pictogramas`, `401` credenciales incorrectas, `429` demasiados intentos, `503` si falla el servicio.

**Tablas:** `profiles`, `student_credentials` y `pictograms`.

