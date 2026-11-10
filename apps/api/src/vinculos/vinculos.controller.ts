import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import type { MyStudent, StudentLink } from '@agenda/shared';
import { AccessToken } from '../auth/guards/access-token.decorator.js';
import { Roles } from '../auth/guards/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { LinkStudentDto } from './link-student.dto.js';
import { StudentLinksService } from './vinculos.service.js';

/**
 * OJO: RolesGuard solo lee @Roles() del MÉTODO, no de la clase. Todos los métodos
 * de este controlador llevan su @Roles.
 */
@Controller('student-links')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class StudentLinksController {
    constructor(private readonly links: StudentLinksService) { }

    /** HU-10: alumnos asignados a quien llama. (Va antes que las rutas con parámetros.) */
    @Get('my-students')
    @Roles('tutor', 'teacher', 'specialist', 'family')
    myStudents(@AccessToken() token: string): Promise<MyStudent[]> {
        return this.links.myStudents(token);
    }

    /** HU-04: asociar un alumno con un tutor, profesor, especialista o familiar. */
    @Post()
    @Roles('admin')
    link(
        @AccessToken() token: string,
        @Body() dto: LinkStudentDto,
    ): Promise<StudentLink> {
        return this.links.link(token, dto);
    }

    /** HU-04: quién está asociado a un alumno. */
    @Get('student/:studentId')
    @Roles('admin')
    listForStudent(
        @AccessToken() token: string,
        @Param('studentId', ParseUUIDPipe) studentId: string,
    ): Promise<StudentLink[]> {
        return this.links.listForStudent(token, studentId);
    }

    /** HU-04: quitar la asociación. */
    @Delete(':studentId/:linkedUserId')
    @Roles('admin')
    @HttpCode(204)
    unlink(
        @AccessToken() token: string,
        @Param('studentId', ParseUUIDPipe) studentId: string,
        @Param('linkedUserId', ParseUUIDPipe) linkedUserId: string,
    ): Promise<void> {
        return this.links.unlink(token, studentId, linkedUserId);
    }
}
