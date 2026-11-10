import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';
import { TaskContentDto } from './task-content.dto.js';

/** HU-11: la misma tarea para varios alumnos a la vez (se crea una por alumno). */
export class AssignTaskDto extends TaskContentDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(100)
    @ArrayUnique()
    @IsUUID('all', { each: true })
    studentIds!: string[];
}
