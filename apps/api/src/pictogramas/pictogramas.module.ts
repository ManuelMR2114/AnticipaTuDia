import { Module } from '@nestjs/common';

import { PictogramsController } from './pictogramas.controller.js';
import { PictogramsService } from './pictogramas.service.js';

@Module({
    controllers: [PictogramsController],
    providers: [PictogramsService],
})
export class PictogramsModule { }
