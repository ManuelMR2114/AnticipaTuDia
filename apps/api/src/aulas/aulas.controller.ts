import {
    Controller,
    Get,
} from '@nestjs/common';

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
}