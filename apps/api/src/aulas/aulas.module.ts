import { Module } from '@nestjs/common';

import { ClassroomsController } from './aulas.controller.js';
import { ClassroomsService } from './aulas.service.js';

@Module({
    controllers: [ClassroomsController],
    providers: [ClassroomsService],
})
export class ClassroomsModule { }