import { Module } from '@nestjs/common';

import { SupabaseModule } from '../supabase/supabase.module.js';

import { PictogramsController } from '/pictograms.controller.js';
import { PictogramsService } from '/pictograms.service.js';

@Module({
    imports: [SupabaseModule],
    controllers: [PictogramsController],
    providers: [PictogramsService],
})
export class PictogramsModule { }