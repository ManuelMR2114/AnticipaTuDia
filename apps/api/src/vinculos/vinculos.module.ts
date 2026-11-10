import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module.js';
import { StudentLinksController } from './vinculos.controller.js';
import { StudentLinksService } from './vinculos.service.js';

@Module({
    imports: [SupabaseModule],
    controllers: [StudentLinksController],
    providers: [StudentLinksService],
})
export class StudentLinksModule { }
