import { IsISO8601, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';

/**
 * HU-15: parche. Solo se modifica lo que viene en la petición.
 *  - campo ausente      -> no se toca
 *  - description: null  -> se borra la descripción
 *  - dueAt: null        -> se quita la fecha límite
 *  - title: null        -> error (el título es obligatorio)
 * ValidateIf distingue "ausente" (undefined) de "null", que IsOptional no hace.
 */
export class UpdateTaskDto {
    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title?: string;

    @ValidateIf((_objeto, valor) => valor !== undefined && valor !== null)
    @IsString()
    @MaxLength(2000)
    description?: string | null;

    @ValidateIf((_objeto, valor) => valor !== undefined && valor !== null)
    @IsISO8601()
    dueAt?: string | null;
}
