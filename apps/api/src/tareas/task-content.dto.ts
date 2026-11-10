import {
    ArrayMaxSize,
    IsArray,
    IsISO8601,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

/**
 * Contenido común de una tarea nueva. Los límites de longitud son del API (la base de
 * datos no los impone): ajústalos si el frontend necesita otros.
 */
export class TaskContentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title!: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    /** Fecha y hora límite, ISO 8601 (p. ej. 2026-11-12T10:00:00Z). */
    @IsOptional()
    @IsISO8601()
    dueAt?: string;

    /** HU-17: pasos de la tarea, EN ORDEN. */
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(30)
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    @MaxLength(200, { each: true })
    subtasks?: string[];
}
