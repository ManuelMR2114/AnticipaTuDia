import {
    Controller,
    Get,
    Param,
} from '@nestjs/common';

import { PictogramsService } from './pictogramas.service.js';

import { Pictogram} from '@agenda/shared';

@Controller('pictograms')
export class PictogramsController {
    constructor(
        private readonly pictogramsService: PictogramsService,
    ) { }

    @Get()
    async findAll() {
        return this.pictogramsService.findAll();
    }

    @Get('student/:id')
    async findByStudent(@Param('id') id: string) : Promise<Pictogram[]> {
        return this.pictogramsService.findByStudent(id);
    }
}