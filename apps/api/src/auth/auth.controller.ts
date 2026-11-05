import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './login.dto.js';
import type { SessionResponse } from './auth.types.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) { }

    @Post('login')
    @HttpCode(200)
    login(@Body() dto: LoginDto): Promise<SessionResponse> {
        return this.auth.loginStaff(dto.email, dto.password);
    }
}