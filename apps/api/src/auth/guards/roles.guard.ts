import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SupabaseUser } from './supabase-user.js';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
    ) {}

    canActivate(
        context: ExecutionContext,
    ): boolean {
        const requiredRoles =
            this.reflector.get<string[]>(
                'roles',
                context.getHandler(),
            );

        // Si el endpoint no tiene @Roles(),
        // no necesitamos comprobar ningún rol.
        if (!requiredRoles) {
            return true;
        }

        const request =
            context.switchToHttp().getRequest();

        const user =
            request.user as SupabaseUser;

        if (
            !user?.user_role ||
            !requiredRoles.includes(user.user_role)
        ) {
            throw new ForbiddenException(
                'Insufficient permissions',
            );
        }

        return true;
    }
}