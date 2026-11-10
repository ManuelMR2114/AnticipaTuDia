import { IsIn } from 'class-validator';
import type { TaskStatus } from '@agenda/shared';

const ESTADOS: TaskStatus[] = ['pending', 'started', 'completed'];

export class SubtaskStatusDto {
    @IsIn(ESTADOS)
    status!: TaskStatus;
}
