import { IsUUID } from 'class-validator';

/**
 * HU-04. No se envía la relación (tutor, profesor...): la base de datos la deduce
 * del ROL del usuario vinculado, así es imposible crear un vínculo incoherente
 * (p. ej. un profesor marcado como "familiar").
 */
export class LinkStudentDto {
    @IsUUID()
    studentId!: string;

    @IsUUID()
    linkedUserId!: string;
}
