import { createZodDto } from 'nestjs-zod';
import { reportUpdateDto } from 'shared-models';

export class ReportUpdateDto extends createZodDto(reportUpdateDto) {}
