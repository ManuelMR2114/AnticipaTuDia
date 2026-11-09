import { Transform, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    ArrayUnique,
    IsArray,
    IsEmail,
    IsIn,
    IsNotEmpty,
    IsObject,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
    MinLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';

export const ROLES = ['student', 'tutor', 'teacher', 'specialist', 'family', 'admin'] as const;

const PIN_REGEX = /^\d{4}$/;

/** Cómo entrará el estudiante. Lo elige el admin (con el chico) en el alta. */
export class StudentAccessDto {
    @IsIn(['password', 'pin', 'pictograms'])
    method!: 'password' | 'pin' | 'pictograms';

    @ValidateIf((o: StudentAccessDto) => o.method === 'password')
    @IsString()
    @MinLength(6)
    @MaxLength(128)
    password?: string;

    @ValidateIf((o: StudentAccessDto) => o.method === 'pin')
    @Matches(PIN_REGEX)
    pin?: string;

    /** Ids (uuid) de pictograms. El orden elegido ES la contraseña. */
    @ValidateIf((o: StudentAccessDto) => o.method === 'pictograms')
    @IsArray()
    @ArrayMinSize(3)
    @ArrayMaxSize(3)
    @ArrayUnique()
    @IsUUID('all', { each: true })
    pictograms?: string[];
}

/**
 * Personal/familia/admin: { fullName, role, email, password }
 * Estudiante:             { fullName, role: 'student', access: { method, ... } }
 */
export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    fullName!: string;

    @IsIn(ROLES)
    role!: (typeof ROLES)[number];

    @ValidateIf((o: CreateUserDto) => o.role !== 'student')
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    @IsEmail()
    @MaxLength(254)
    email?: string;

    @ValidateIf((o: CreateUserDto) => o.role !== 'student')
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password?: string;

    @ValidateIf((o: CreateUserDto) => o.role === 'student')
    @IsObject()
    @ValidateNested()
    @Type(() => StudentAccessDto)
    access?: StudentAccessDto;
}