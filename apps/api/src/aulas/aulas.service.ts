import {
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';

import type { Classroom } from '@agenda/shared';
import { SupabaseService } from '../supabase/supabase.service.js';

// Fila de la tabla "classrooms" en Supabase (snake_case)
interface ClassroomRow {
    id: string;
    name: string;
    group_name: string | null;
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
}