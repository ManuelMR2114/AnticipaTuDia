import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import type { Subtask, Task, TaskOrigin, TaskStatus } from '@agenda/shared';
import { dbFailure } from '../common/rpc-error.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { AgendaQueryDto } from './agenda-query.dto.js';
import type { AssignTaskDto } from './assign-task.dto.js';
import type { CreateTaskDto } from './create-task.dto.js';
import type { UpdateTaskDto } from './update-task.dto.js';

// Filas tal como las devuelve Supabase (snake_case)
interface SubtaskRow {
    id: string;
    position: number;
    title: string;
    status: TaskStatus;
}

interface TaskRow {
    id: string;
    student_id: string;
    title: string;
    description: string | null;
    due_at: string | null;
    origin: TaskOrigin;
    status: TaskStatus;
    started_at: string | null;
    completed_at: string | null;
    subtasks: SubtaskRow[] | null;
}

/** Misma forma que devuelve la función SQL get_agenda, para que todo el API sea uniforme. */
const TASK_COLUMNS =
    'id, student_id, title, description, due_at, origin, status, started_at, completed_at, ' +
    'subtasks(id, position, title, status)';

const toSubtask = (fila: SubtaskRow): Subtask => ({
    id: fila.id,
    position: fila.position,
    title: fila.title,
    status: fila.status,
});

const toTask = (fila: TaskRow): Task => ({
    id: fila.id,
    studentId: fila.student_id,
    title: fila.title,
    description: fila.description,
    dueAt: fila.due_at,
    origin: fila.origin,
    status: fila.status,
    startedAt: fila.started_at,
    completedAt: fila.completed_at,
    subtasks: [...(fila.subtasks ?? [])]
        .sort((a, b) => a.position - b.position)
        .map(toSubtask),
});

/**
 * HU-00 y HU-11 a HU-19.
 *
 * Todo pasa por el cliente "en nombre del usuario" (createUserClient) y por las
 * funciones SQL de la base de datos, que ya contienen las reglas: quién puede crear,
 * modificar, borrar o confirmar cada tarea. Este servicio NO repite esas reglas: solo
 * traduce formatos (camelCase <-> snake_case) y errores (ver common/rpc-error.ts).
 * Si una regla cambia, se cambia en la base de datos y aquí no hay que tocar nada.
 */
@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(private readonly supabase: SupabaseService) { }

    private db(token: string) {
        return this.supabase.createUserClient(token);
    }

    /** HU-00: agenda (tareas con sus subtareas), ordenada por fecha límite. */
    async agenda(token: string, query: AgendaQueryDto): Promise<Task[]> {
        const { data, error } = await this.db(token).rpc('get_agenda', {
            p_student_id: query.studentId ?? null,
            p_from: query.from ?? null,
            p_to: query.to ?? null,
        });
        if (error) throw dbFailure(error, this.logger, 'get_agenda');

        return ((data ?? []) as TaskRow[]).map(toTask);
    }

    /** Una tarea con sus subtareas. 404 si no existe o el usuario no puede verla. */
    async findOne(token: string, id: string): Promise<Task> {
        const { data, error } = await this.db(token)
            .from('tasks')
            .select(TASK_COLUMNS)
            .eq('id', id)
            .maybeSingle<TaskRow>();
        if (error) throw dbFailure(error, this.logger, 'tasks/select');
        if (!data) throw new NotFoundException('La tarea no existe o no tienes acceso a ella');

        return toTask(data);
    }

    /** HU-13, 14 (alumno) y HU-11, 16, 17 (profesional): crea una tarea con sus pasos. */
    async create(token: string, dto: CreateTaskDto): Promise<Task> {
        const { data, error } = await this.db(token).rpc('create_task', {
            p_title: dto.title,
            p_description: dto.description ?? null,
            p_due_at: dto.dueAt ?? null,
            p_student_id: dto.studentId ?? null,
            p_subtasks: dto.subtasks ?? [],
        });
        if (error) throw dbFailure(error, this.logger, 'create_task');

        return this.findOne(token, data as string);
    }

    /** HU-11: la misma tarea para varios alumnos. Atómico: si falla uno, no se crea ninguna. */
    async assign(token: string, dto: AssignTaskDto): Promise<{ taskIds: string[] }> {
        const { data, error } = await this.db(token).rpc('create_task_for_students', {
            p_student_ids: dto.studentIds,
            p_title: dto.title,
            p_description: dto.description ?? null,
            p_due_at: dto.dueAt ?? null,
            p_subtasks: dto.subtasks ?? [],
        });
        if (error) throw dbFailure(error, this.logger, 'create_task_for_students');

        return { taskIds: data as string[] };
    }

    /** HU-15: modifica título, descripción o fecha límite. */
    async update(token: string, id: string, dto: UpdateTaskDto): Promise<Task> {
        // Solo viajan las claves presentes; null significa "borrar el valor".
        const parche: Record<string, string | null> = {};
        if (dto.title !== undefined) parche.title = dto.title;
        if (dto.description !== undefined) parche.description = dto.description;
        if (dto.dueAt !== undefined) parche.due_at = dto.dueAt;

        if (Object.keys(parche).length === 0) {
            throw new BadRequestException('No hay nada que modificar');
        }

        const { error } = await this.db(token).rpc('update_task', {
            p_task_id: id,
            p_patch: parche,
        });
        if (error) throw dbFailure(error, this.logger, 'update_task');

        return this.findOne(token, id);
    }

    /** HU-12: elimina una tarea asignada por el propio profesional que la creó. */
    async remove(token: string, id: string): Promise<void> {
        const { error } = await this.db(token).rpc('delete_task', { p_task_id: id });
        if (error) throw dbFailure(error, this.logger, 'delete_task');
    }

    /** HU-17: sustituye la secuencia de subtareas (solo si la tarea no ha empezado). */
    async setSubtasks(token: string, id: string, titles: string[]): Promise<Subtask[]> {
        const { data, error } = await this.db(token).rpc('set_subtasks', {
            p_task_id: id,
            p_titles: titles,
        });
        if (error) throw dbFailure(error, this.logger, 'set_subtasks');

        return ((data ?? []) as SubtaskRow[]).map(toSubtask);
    }

    /** HU-18: el alumno confirma que empieza la tarea. */
    async start(token: string, id: string): Promise<Task> {
        const { error } = await this.db(token).rpc('start_task', { p_task_id: id });
        if (error) throw dbFailure(error, this.logger, 'start_task');

        return this.findOne(token, id);
    }

    /** HU-19: el alumno confirma que ha terminado la tarea (y todos sus pasos). */
    async complete(token: string, id: string): Promise<Task> {
        const { error } = await this.db(token).rpc('complete_task', { p_task_id: id });
        if (error) throw dbFailure(error, this.logger, 'complete_task');

        return this.findOne(token, id);
    }

    /** HU-18/19: el alumno marca un paso como iniciado o completado. */
    async setSubtaskStatus(token: string, subtaskId: string, status: TaskStatus): Promise<Subtask> {
        const { data, error } = await this.db(token).rpc('set_subtask_status', {
            p_subtask_id: subtaskId,
            p_status: status,
        });
        if (error) throw dbFailure(error, this.logger, 'set_subtask_status');

        return toSubtask(data as SubtaskRow);
    }
}
