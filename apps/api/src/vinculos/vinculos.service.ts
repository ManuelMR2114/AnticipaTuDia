import { Injectable, Logger } from '@nestjs/common';
import type { LinkRelation, MyStudent, StudentLink } from '@agenda/shared';
import { dbFailure } from '../common/rpc-error.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { LinkStudentDto } from './link-student.dto.js';

// Fila de la tabla "student_links" (snake_case)
interface LinkRow {
    id: string;
    student_id: string;
    linked_user_id: string;
    relation: LinkRelation;
}

interface ProfileNameRow {
    id: string;
    full_name: string;
}

// Lo que devuelve la función SQL get_my_students
interface MyStudentRow {
    student_id: string;
    full_name: string;
    relation: LinkRelation;
    pending: number;
    started: number;
    completed: number;
}

/**
 * HU-04 y HU-10.
 *
 * Todo se hace con el cliente "en nombre del usuario" (ver createUserClient): las
 * funciones SQL link_student / unlink_student exigen ser administrador y la RLS decide
 * qué vínculos puede ver cada uno. Aquí no se repite ninguna regla de permisos.
 */
@Injectable()
export class StudentLinksService {
    private readonly logger = new Logger(StudentLinksService.name);

    constructor(private readonly supabase: SupabaseService) { }

    /** HU-04: asociar un alumno con un tutor, profesor, especialista o familiar. */
    async link(token: string, dto: LinkStudentDto): Promise<StudentLink> {
        const { data, error } = await this.supabase
            .createUserClient(token)
            .rpc('link_student', {
                p_student_id: dto.studentId,
                p_user_id: dto.linkedUserId,
            });

        if (error) throw dbFailure(error, this.logger, 'link_student');

        const [vinculo] = await this.conNombres(token, [data as LinkRow]);
        return vinculo;
    }

    /** HU-04: quitar la asociación. */
    async unlink(token: string, studentId: string, linkedUserId: string): Promise<void> {
        const { error } = await this.supabase
            .createUserClient(token)
            .rpc('unlink_student', {
                p_student_id: studentId,
                p_user_id: linkedUserId,
            });

        if (error) throw dbFailure(error, this.logger, 'unlink_student');
    }

    /** HU-04: quién está asociado a un alumno (pantalla de administración). */
    async listForStudent(token: string, studentId: string): Promise<StudentLink[]> {
        const { data, error } = await this.supabase
            .createUserClient(token)
            .from('student_links')
            .select('id, student_id, linked_user_id, relation')
            .eq('student_id', studentId)
            .order('created_at', { ascending: true });

        if (error) throw dbFailure(error, this.logger, 'student_links/select');

        return this.conNombres(token, (data ?? []) as LinkRow[]);
    }

    /** HU-10: alumnos asignados a quien llama, con su recuento de tareas. */
    async myStudents(token: string): Promise<MyStudent[]> {
        const { data, error } = await this.supabase
            .createUserClient(token)
            .rpc('get_my_students');

        if (error) throw dbFailure(error, this.logger, 'get_my_students');

        return ((data ?? []) as MyStudentRow[]).map((fila) => ({
            studentId: fila.student_id,
            fullName: fila.full_name,
            relation: fila.relation,
            pending: fila.pending,
            started: fila.started,
            completed: fila.completed,
        }));
    }

    /** Añade el nombre del usuario vinculado (una sola consulta para todas las filas). */
    private async conNombres(token: string, filas: LinkRow[]): Promise<StudentLink[]> {
        if (filas.length === 0) return [];

        const ids = [...new Set(filas.map((fila) => fila.linked_user_id))];
        const { data, error } = await this.supabase
            .createUserClient(token)
            .from('profiles')
            .select('id, full_name')
            .in('id', ids);

        if (error) throw dbFailure(error, this.logger, 'profiles/select');

        const nombres = new Map(
            ((data ?? []) as ProfileNameRow[]).map((perfil) => [perfil.id, perfil.full_name]),
        );

        return filas.map((fila) => ({
            id: fila.id,
            studentId: fila.student_id,
            relation: fila.relation,
            linkedUser: {
                id: fila.linked_user_id,
                fullName: nombres.get(fila.linked_user_id) ?? '',
            },
        }));
    }
}
