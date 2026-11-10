import type { ClassroomStudent } from '@agenda/shared';

// Valores del enum login_method de la tabla profiles (null = sin método asignado)
export type MetodoLogin = 'password' | 'pin' | 'pattern' | 'pictogram';

// ClassroomStudent + el método de acceso del alumno.
// TODO: cuando loginMethod esté en @agenda/shared, usar ClassroomStudent directamente
// y borrar este tipo. La API debe devolverlo en GET /classrooms/:id/students.
export type EstudianteConMetodo = ClassroomStudent & {
  loginMethod: MetodoLogin | null;
};