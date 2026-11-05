import {
    Controller,
    Get,
} from '@nestjs/common';

import { PictogramsService } from 'pictograms.service.js';

@Controller('pictograms')
export class PictogramsController {
    constructor(
        private readonly pictogramsService: PictogramsService,
    ) { }

    @Get()
    async findAll() {
        return this.pictogramsService.findAll();
    }
}