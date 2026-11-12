import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { SessionResponse, UserList } from '@agenda/shared';
import { Roles } from '../auth/guards/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import type { SupabaseUser } from '../auth/guards/supabase-user.js';
import { CreateUserDto } from './create-user.dto.js';
import { SetRoleDto } from './set-role.dto.js';
import { UsersService } from './users.service.js';

interface AuthedRequest {
    user: SupabaseUser;
}

/**
 * OJO: RolesGuard solo lee @Roles() del MÉTODO, no de la clase. Un método sin
 * @Roles('admin') queda abierto a cualquier usuario autenticado (incluido un alumno).
 */
@Controller('users')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly users: UsersService) { }

    /** alta de usuarios. */
    @Post()
    @Roles('admin')
    create(@Body() dto: CreateUserDto): Promise<SessionResponse['user']> {
        return this.users.create(dto);
    }

    /** baja */
    @Patch(':id/deactivate')
    @Roles('admin')
    @HttpCode(204)
    deactivate(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthedRequest,
    ): Promise<void> {
        return this.users.deactivate(id, req.user.sub);
    }

    /** asignar o cambiar el rol. */
    @Patch(':id/role')
    @Roles('admin')
    setRole(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: SetRoleDto,
        @Req() req: AuthedRequest,
    ): Promise<{ id: string; role: string }> {
        return this.users.setRole(id, dto.role, req.user.sub);
    }

    /** listado de usuarios para el panel de administración. */
    @Get()
    @Roles('admin')
    findAll(): Promise<UserList[]> {
        return this.users.findAll();
    }


}
