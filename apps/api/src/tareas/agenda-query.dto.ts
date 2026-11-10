import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

/** HU-00: filtros de la agenda. */
export class AgendaQueryDto {
    /** Alumno cuya agenda se consulta. Un alumno no lo envía: ve la suya. */
    @IsOptional()
    @IsUUID()
    studentId?: string;

    /** Tareas con fecha límite desde aquí (incluida). */
    @IsOptional()
    @IsISO8601()
    from?: string;

    /** Tareas con fecha límite hasta aquí (excluida). */
    @IsOptional()
    @IsISO8601()
    to?: string;
}
