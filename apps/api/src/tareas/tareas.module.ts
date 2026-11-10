import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module.js';
import { TasksController } from './tareas.controller.js';
import { TasksService } from './tareas.service.js';

@Module({
    imports: [SupabaseModule],
    controllers: [TasksController],
    providers: [TasksService],
})
export class TasksModule { }
