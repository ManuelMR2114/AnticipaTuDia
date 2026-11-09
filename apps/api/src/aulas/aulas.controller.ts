import {
    Controller,
    Get,
    Param,
    Req,
    UseGuards,
} from '@nestjs/common';


import { Classroom, ClassroomStudent } from '@agenda/shared';
import { ClassroomsService } from './aulas.service.js';

/*
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { Roles } from '../auth/guards/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';*/

// Ruta pública: se usa en la pantalla "Elige tu clase", antes de iniciar sesión.
@Controller('classrooms')
export class ClassroomsController {
    constructor(
        private readonly classroomsService: ClassroomsService,
    ) { }
    
    @Get()
    async findAll() {
        return this.classroomsService.findAll();
    }

    //ejemplo guardas
    /*
    @Get()
    @UseGuards(SupabaseAuthGuard, RolesGuard)
    @Roles('admin', 'tutor')
    findAll() {
        return this.classroomsService.findAll();
    }*/

    //esta es la funcion para buscar la clase por estudiante
    @Get('student/:id')
    async findByStudent(@Param('id') id: string) : Promise<Classroom>{
        return this.classroomsService.findByStudent(id);
    }

    //esta es la funcion para buscar los estudiantes de una clase
    @Get(':id/students')
    async findByClass(@Param('id') id: string) : Promise<ClassroomStudent[]> {
        return this.classroomsService.findByClass(id);
    }
}