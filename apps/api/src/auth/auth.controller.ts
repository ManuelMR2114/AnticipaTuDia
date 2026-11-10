
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
