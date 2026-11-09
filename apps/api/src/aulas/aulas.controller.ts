import {
    Controller,
    Get,
    Param,
} from '@nestjs/common';

import { Classroom, ClassroomStudent } from '@agenda/shared';
import { ClassroomsService } from './aulas.service.js';

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