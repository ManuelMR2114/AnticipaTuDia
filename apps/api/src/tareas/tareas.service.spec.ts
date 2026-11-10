import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { SupabaseService } from '../supabase/supabase.service.js';
import { TasksService } from './tareas.service.js';

const TOKEN = 'token-del-usuario';
const TASK_ID = '11111111-1111-4111-8111-111111111111';
const STUDENT_ID = '22222222-2222-4222-8222-222222222222';

// Una tarea tal como la devuelve Supabase (snake_case, subtareas desordenadas)
const FILA = {
    id: TASK_ID,
    student_id: STUDENT_ID,
    title: 'Hacer deberes',
    description: null,
    due_at: '2026-11-12T10:00:00+00:00',
    origin: 'assigned',
    status: 'pending',
    started_at: null,
    completed_at: null,
    subtasks: [
        { id: 'b', position: 1, title: 'Resolver ejercicios', status: 'pending' },
        { id: 'a', position: 0, title: 'Abrir el libro', status: 'pending' },
    ],
};

/** Cliente de Supabase simulado: rpc() devuelve lo indicado y from().select().eq().maybeSingle() la fila. */
function preparar(opciones: {
    rpc?: { data?: unknown; error?: { code: string; message: string } | null };
    fila?: unknown;
} = {}) {
    const fila = 'fila' in opciones ? opciones.fila : FILA;
    const consulta = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: fila, error: null }),
    };
    const rpc = vi.fn().mockResolvedValue({
        data: opciones.rpc?.data ?? null,
        error: opciones.rpc?.error ?? null,
    });
    const crearCliente = vi.fn(() => ({ rpc, from: vi.fn(() => consulta) }));
    const servicio = new TasksService({ createUserClient: crearCliente } as unknown as SupabaseService);
    return { servicio, rpc, crearCliente };
}

describe('TasksService', () => {
    it('agenda: usa el token del usuario y convierte snake_case a camelCase con subtareas ordenadas', async () => {
        const { servicio, rpc, crearCliente } = preparar({ rpc: { data: [FILA] } });

        const agenda = await servicio.agenda(TOKEN, { studentId: STUDENT_ID });

        expect(crearCliente).toHaveBeenCalledWith(TOKEN);
        expect(rpc).toHaveBeenCalledWith('get_agenda', {
            p_student_id: STUDENT_ID,
            p_from: null,
            p_to: null,
        });
        expect(agenda).toHaveLength(1);
        expect(agenda[0]).toMatchObject({
            id: TASK_ID,
            studentId: STUDENT_ID,
            dueAt: '2026-11-12T10:00:00+00:00',
            startedAt: null,
        });
        expect(agenda[0].subtasks.map((s) => s.title)).toEqual(['Abrir el libro', 'Resolver ejercicios']);
    });

    it('create: llama a create_task con los parámetros p_* y devuelve la tarea completa', async () => {
        const { servicio, rpc } = preparar({ rpc: { data: TASK_ID } });

        const tarea = await servicio.create(TOKEN, {
            title: 'Hacer deberes',
            studentId: STUDENT_ID,
            subtasks: ['Abrir el libro', 'Resolver ejercicios'],
        });

        expect(rpc).toHaveBeenCalledWith('create_task', {
            p_title: 'Hacer deberes',
            p_description: null,
            p_due_at: null,
            p_student_id: STUDENT_ID,
            p_subtasks: ['Abrir el libro', 'Resolver ejercicios'],
        });
        expect(tarea.id).toBe(TASK_ID);
        expect(tarea.origin).toBe('assigned');
    });

    it('update: solo envía las claves recibidas y null significa borrar', async () => {
        const { servicio, rpc } = preparar();

        await servicio.update(TOKEN, TASK_ID, { description: null });

        expect(rpc).toHaveBeenCalledWith('update_task', {
            p_task_id: TASK_ID,
            p_patch: { description: null },
        });
    });

    it('update: sin ningún campo es un 400 y no toca la base de datos', async () => {
        const { servicio, rpc } = preparar();

        await expect(servicio.update(TOKEN, TASK_ID, {})).rejects.toBeInstanceOf(BadRequestException);
        expect(rpc).not.toHaveBeenCalled();
    });


    it('remove: permite ejecutar delete_task', async () => {
        const { servicio, rpc } = preparar();

        await expect(
            servicio.remove(TOKEN, TASK_ID),
        ).resolves.toBeUndefined();

        expect(rpc).toHaveBeenCalledWith('delete_task', {
            p_task_id: TASK_ID,
        });
    });

    it('remove: los errores de autorización se traducen a 403', async () => {
        const { servicio } = preparar({
            rpc: {
                error: {
                    code: 'P0001',
                    message: 'Solo puedes eliminar las tareas que tú has asignado',
                },
            },
        });

        await expect(
            servicio.remove(TOKEN, TASK_ID),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });


    it('findOne: una tarea que no existe (o no se puede ver) es un 404', async () => {
        const { servicio } = preparar({ fila: null });

        await expect(servicio.findOne(TOKEN, TASK_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('setSubtaskStatus: devuelve la subtarea en el formato del contrato', async () => {
        const { servicio, rpc } = preparar({
            rpc: { data: { id: 'a', task_id: TASK_ID, position: 0, title: 'Abrir el libro', status: 'completed' } },
        });

        const subtarea = await servicio.setSubtaskStatus(TOKEN, 'a', 'completed');

        expect(rpc).toHaveBeenCalledWith('set_subtask_status', { p_subtask_id: 'a', p_status: 'completed' });
        expect(subtarea).toEqual({ id: 'a', position: 0, title: 'Abrir el libro', status: 'completed' });
    });
});
