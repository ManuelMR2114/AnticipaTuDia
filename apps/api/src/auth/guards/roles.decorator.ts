import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) =>
    SetMetadata('roles', roles);

//esto es solamente para poder usar @Roles como si fuera un decorador de nestjs nada más