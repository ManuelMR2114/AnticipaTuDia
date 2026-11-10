import { IsOptional, IsUUID } from 'class-validator';
import { TaskContentDto } from './task-content.dto.js';

/**
 * HU-13/14 (alumno) y HU-11/16 (profesionales).
 * Sin studentId: tarea personal del propio alumno. Con studentId: tarea asignada por
 * un profesional a ese alumno. El origen NO se envía: se deduce, para que el cliente
 * no pueda mentir sobre quién creó la tarea.
 */
export class CreateTaskDto extends TaskContentDto {
    @IsOptional()
    @IsUUID()
    studentId?: string;
}
