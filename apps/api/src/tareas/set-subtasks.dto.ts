import { ArrayMaxSize, IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** HU-17: la secuencia COMPLETA de pasos (sustituye a la anterior). [] la vacía. */
export class SetSubtasksDto {
    @IsArray()
    @ArrayMaxSize(30)
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    @MaxLength(200, { each: true })
    titles!: string[];
}
