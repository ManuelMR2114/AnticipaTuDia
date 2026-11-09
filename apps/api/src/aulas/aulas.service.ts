import {
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';

import type { Classroom } from '@agenda/shared';
import { ClassroomStudent } from '@agenda/shared';
import { SupabaseService } from '../supabase/supabase.service.js';

// Fila de la tabla "classrooms" en Supabase (snake_case)
interface ClassroomRow {
    id: string;
    name: string;
    group_name: string | null;
}

//interfaz para recibir los datos de supabase
interface StudentProfileRow {
  student: string;
  profiles: {
    id: string;
    full_name: string;
  };
}

@Injectable()
export class ClassroomsService {
    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

    async findAll(): Promise<Classroom[]> {
        const supabase = this.supabaseService.admin;

        const { data, error } = await supabase
            .from('classrooms')
            .select('id, name, group_name')
            .not('name', 'is', null) // "name" admite nulos en la BD: ignoramos aulas sin nombre
            .order('name', {
                ascending: true,
            });

        if (error) {
            throw new InternalServerErrorException(
                'No se pudieron obtener las aulas',
            );
        }

        return ((data ?? []) as ClassroomRow[]).map((classroom) => ({
            id: classroom.id,
            name: classroom.name,
            groupName: classroom.group_name,
        }));
    }

    async findByStudent(id_student: string): Promise<Classroom> {
        const supabase = this.supabaseService.admin;

        const { data, error } = await supabase
                .from('student-classroom')
                .select(`
                    student,
                    classrooms!inner (
                        id,
                        name,
                        group_name
                    )
                `)
                .eq('student', id_student)
                .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new NotFoundException(
                    `El estudiante con ID ${id_student} no está asignado a ninguna aula`,
                );
            }
            throw new InternalServerErrorException('Error al obtener el aula del estudiante');
        }

        // Supabase devuelve el objeto anidado classrooms
        const classroom = (data as any).classrooms as ClassroomRow;

        return {
            id: classroom.id,
            name: classroom.name,
            groupName: classroom.group_name,
        };
    }

    async findByClass(classId: string): Promise<ClassroomStudent[]> {
        const supabase = this.supabaseService.admin;

        // 1. Consultamos la tabla 'student-classroom' filtrando por el id del aula
        const { data, error } = await supabase
        .from('student-classroom')
        .select(`
            student,
            profiles!inner (
            id,
            full_name
            )
        `)
        .eq('classroom', classId);

        if (error) {
        throw new InternalServerErrorException('Error al obtener los estudiantes del aula');
        }

        // 2. Si no hay registros asociados o la lista viene vacía
        if (!data || data.length === 0) {
        throw new NotFoundException(`No se encontraron estudiantes para el aula con ID ${classId}`);
        }

        const rows = data as unknown as StudentProfileRow[];

        // 3. Mapeamos los resultados al contrato ClassroomStudent[] de @agenda/shared
        return rows.map((row) => ({
            id: row.profiles.id,
            fullName: row.profiles.full_name,
        }));
    }

    
}