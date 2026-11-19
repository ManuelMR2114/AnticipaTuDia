import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Login de estudiante: { userId, password }.
 * Para PIN, patrón o pictogramas, `password` es el secreto que compone el
 * frontend (pictogramas: ids unidos con '|' en el orden elegido).
 */
export class StudentLoginDto {
    @IsUUID()
    userId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(256)
    password!: string;
}