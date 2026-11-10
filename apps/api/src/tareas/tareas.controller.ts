import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Subtask, Task } from '@agenda/shared';
import { AccessToken } from '../auth/guards/access-token.decorator.js';
import type { AuthedRequest } from '../auth/guards/authed-request.js';
import { Roles } from '../auth/guards/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { AgendaQueryDto } from './agenda-query.dto.js';
import { AssignTaskDto } from './assign-task.dto.js';
import { CreateTaskDto } from './create-task.dto.js';
import { SetSubtasksDto } from './set-subtasks.dto.js';
import { SubtaskStatusDto } from './subtask-status.dto.js';
import { TasksService } from './tareas.service.js';
import { UpdateTaskDto } from './update-task.dto.js';

/**
 * OJO: RolesGuard solo lee @Roles() del MÉTODO, no de la clase. Todos los métodos de
 * este controlador llevan su @Roles. Los @Roles dan un 403 rápido; la regla de verdad
 * (por ejemplo, "este tutor no es el de ese alumno") la aplica la base de datos.
 */
@Controller('tasks')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class TasksController {
    constructor(private readonly tasks: TasksService) { }

    /**
     * Un profesional siempre actúa sobre un alumno concreto. Sin esta comprobación, si
     * se olvidara el studentId, la base de datos respondería con un mensaje confuso
     * ("solo un estudiante puede crear tareas personales").
     */
    private exigirAlumno(req: AuthedRequest, studentId?: string): void {
        if (req.user.user_role !== 'student' && !studentId) {
            throw new BadRequestException('Indica el alumno (studentId)');
        }
    }

    /** HU-00: agenda. Un alumno ve la suya; un profesional o familiar indica studentId. */
    @Get()
    @Roles('student', 'tutor', 'teacher', 'specialist', 'family')
    agenda(
        @AccessToken() token: string,
        @Req() req: AuthedRequest,
        @Query() query: AgendaQueryDto,
    ): Promise<Task[]> {
        this.exigirAlumno(req, query.studentId);
        return this.tasks.agenda(token, query);
    }

    /** HU-11: asignar la misma tarea a varios alumnos. (Antes que las rutas con :id.) */
    @Post('assign')
    @Roles('tutor', 'teacher', 'specialist')
    assign(
        @AccessToken() token: string,
        @Body() dto: AssignTaskDto,
    ): Promise<{ taskIds: string[] }> {
        return this.tasks.assign(token, dto);
    }

    /** HU-13, 14 (alumno), HU-11, 16 (profesional) y HU-17 (con subtareas). */
    @Post()
    @Roles('student', 'tutor', 'teacher', 'specialist')
    create(
        @AccessToken() token: string,
        @Req() req: AuthedRequest,
        @Body() dto: CreateTaskDto,
    ): Promise<Task> {
        this.exigirAlumno(req, dto.studentId);
        return this.tasks.create(token, dto);
    }

    /** HU-18/19: marcar un paso como iniciado o completado. Solo el alumno. */
    @Patch('subtasks/:subtaskId/status')
    @Roles('student')
    setSubtaskStatus(
        @AccessToken() token: string,
        @Param('subtaskId', ParseUUIDPipe) subtaskId: string,
        @Body() dto: SubtaskStatusDto,
    ): Promise<Subtask> {
        return this.tasks.setSubtaskStatus(token, subtaskId, dto.status);
    }

    @Get(':id')
    @Roles('student', 'tutor', 'teacher', 'specialist', 'family')
    findOne(
        @AccessToken() token: string,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<Task> {
        return this.tasks.findOne(token, id);
    }

    /** HU-15: modificar una tarea. */
    @Patch(':id')
    @Roles('student', 'tutor', 'teacher', 'specialist')
    update(
        @AccessToken() token: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateTaskDto,
    ): Promise<Task> {
        return this.tasks.update(token, id, dto);
    }

    /**
     * HU-12: eliminar una tarea. Solo el profesional que la asignó.
     */
    @Delete(':id')
    @Roles('tutor', 'teacher', 'specialist', 'student')
    @HttpCode(204)
    remove(
        @AccessToken() token: string,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<void> {
        return this.tasks.remove(token, id);
    }

    /** HU-17: estructurar la tarea en una secuencia de subtareas. */
    @Put(':id/subtasks')
    @Roles('student', 'tutor', 'teacher', 'specialist')
    setSubtasks(
        @AccessToken() token: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: SetSubtasksDto,
    ): Promise<Subtask[]> {
        return this.tasks.setSubtasks(token, id, dto.titles);
    }

    /** HU-18: confirmación de inicio. Solo el alumno. */
    @Post(':id/start')
    @Roles('student')
    @HttpCode(200)
    start(
        @AccessToken() token: string,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<Task> {
        return this.tasks.start(token, id);
    }

    /** HU-19: confirmar que la tarea está terminada. Solo el alumno. */
    @Post(':id/complete')
    @Roles('student')
    @HttpCode(200)
    complete(
        @AccessToken() token: string,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<Task> {
        return this.tasks.complete(token, id);
    }
}
