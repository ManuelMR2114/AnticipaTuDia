import {
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service.js';

interface PictogramRow {
    id: string;
    name: string;
    description: string;
    active: boolean;
    sort_order: number;
    arasaac_id: number | null;
}

@Injectable()
export class PictogramsService {
    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

    async findAll() {
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
}