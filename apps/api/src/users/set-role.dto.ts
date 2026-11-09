import { IsIn } from 'class-validator';
import { ROLES } from './create-user.dto.js';

export class SetRoleDto {
    @IsIn(ROLES)
    role!: (typeof ROLES)[number];
}
