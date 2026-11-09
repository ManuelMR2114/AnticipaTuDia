import {
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';

import type { Pictogram } from '@agenda/shared';
import { SupabaseService } from '../supabase/supabase.service.js';

interface PictogramRow {
    id: string;
    name: string;
    description: string;
    active: boolean;
    sort_order: number;
    arasaac_id: number | null;
}

// Esta interfazz al igual que la anterior, sirve para poder mapear los datos enviados como json a una interfaz más clara
interface StudentPictogramRow {
    user_id: string;
    pictograms: PictogramRow;
}

@Injectable()
export class PictogramsService {
    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

    async findAll(): Promise<Pictogram[]> {
        const supabase = this.supabaseService.admin;

        const { data, error } = await supabase
            .from('pictograms')
            .select(`
        id,
        name,
        description,
        active,
        sort_order,
        arasaac_id
      `)
            .eq('active', true)
            .order('sort_order', {
                ascending: true,
            });

        if (error) {
            throw new InternalServerErrorException(
                'No se pudieron obtener los pictogramas',
            );
        }

        return ((data ?? []) as PictogramRow[]).map((pictogram) => ({
            id: pictogram.id,
            name: pictogram.name,
            description: pictogram.description,

            imageUrl:
                pictogram.arasaac_id !== null
                    ? `https://static.arasaac.org/pictograms/${pictogram.arasaac_id}/${pictogram.arasaac_id}_500.png`
                    : null,

            sortOrder: pictogram.sort_order,
        }));
    }

    async findByStudent(id_student: string): Promise<Pictogram[]> {
        const supabase = this.supabaseService.admin;

        // Consultamos la tabla 'pictogram_credentials' y hacemos JOIN con 'pictograms' para obtener unicamente aquellos que pertenezcan al estudiante
        const { data, error } = await supabase
            .from('pictogram_credentials')
            .select(`
                user_id,
                pictograms!inner (
                    id,
                    name,
                    description,
                    active,
                    sort_order,
                    arasaac_id
                )
            `)
            .eq('user_id', id_student)
            .eq('pictograms.active', true);

        if (error) {
            throw new InternalServerErrorException(
                'No se pudieron obtener los pictogramas del estudiante',
            );
        }

        const rows = (data ?? []) as unknown as StudentPictogramRow[];

        // Mapeamos los pictogramas anidados al contrato Pictogram[] de @agenda/shared
        return rows.map((row) => {
            const pictogram = row.pictograms;
            return {
                id: pictogram.id,
                name: pictogram.name,
                description: pictogram.description,
                imageUrl:
                    pictogram.arasaac_id !== null
                        ? `https://static.arasaac.org/pictograms/${pictogram.arasaac_id}/${pictogram.arasaac_id}_500.png`
                        : null,
                sortOrder: pictogram.sort_order,
            };
        });
    }
}