
import {
    Body,
    Controller,
    Headers,
    HttpCode,
    HttpStatus,
    Post,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { LoginDto } from './login.dto.js';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard.js';

import type { SessionResponse } from '@agenda/shared';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly auth: AuthService,
    ) { }

    // Login de personal, familia y administradores.
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(
        @Body() dto: LoginDto,
    ): Promise<SessionResponse> {
        return this.auth.loginStaff(
            dto.email,
            dto.password,
        );
    }

    /** Método configurado para un alumno, usado por clientes que trabajan con identificador. */
    @Post('student/method')
    @HttpCode(HttpStatus.OK)
    studentLoginMethod(
        @Body() dto: StudentLoginMethodDto,
    ): Promise<{ studentId: string; method: 'password' | 'pin' | 'pattern' | 'pictogram' }> {
        return this.auth.studentLoginMethod(dto.identifier);
    }

    /** Contrato genérico recomendado: identificador + credencial según el método. */
    @Post('student/login')
    @HttpCode(HttpStatus.OK)
    studentLogin(@Body() dto: StudentLoginDto): Promise<SessionResponse> {
        return this.auth.loginStudent(dto);
    }

    /** Compatibilidad con la pantalla de PIN que ya consume el frontend. */
    @Post('student/pin')
    @HttpCode(HttpStatus.OK)
    loginStudentPin(@Body() dto: StudentPinLoginDto): Promise<SessionResponse> {
        return this.auth.loginStudentById(dto.studentId, 'pin', dto.pin);
    }

    /** Compatibilidad con la pantalla de patrón que ya consume el frontend. */
    @Post('student/pattern')
    @HttpCode(HttpStatus.OK)
    loginStudentPattern(@Body() dto: StudentPatternLoginDto): Promise<SessionResponse> {
        return this.auth.loginStudentById(dto.studentId, 'pattern', dto.pattern);
    }

    /** Compatibilidad con la pantalla de pictogramas existente; no altera la ruta GET de pictogramas. */
    @Post('student/pictogramas')
    @HttpCode(HttpStatus.OK)
    loginStudentPictograms(@Body() dto: StudentPictogramsLoginDto): Promise<SessionResponse> {
        return this.auth.loginStudentById(dto.studentId, 'pictogram', dto.pictogramas);
    }

    // Cierre de sesión.
    @Post('logout')
    @UseGuards(SupabaseAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    logout(
        @Headers('authorization') authorization?: string,
    ): Promise<void> {

        const token = /^Bearer\s+(.+)$/i
            .exec(authorization ?? '')?.[1];

        if (!token) {
            throw new UnauthorizedException(
                'Token no válido',
            );
        }

        return this.auth.logout(token);
    }
}
