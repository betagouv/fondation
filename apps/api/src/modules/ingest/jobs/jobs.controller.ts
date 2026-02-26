import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { Role } from 'shared-models';
import { PrismaJobStatusEnum } from 'src/generated/prisma/enums';
import {
  ApiPaginated,
  Pagination,
  QueryPagination,
} from 'src/modules/framework/pagination';
import { HasRole } from 'src/modules/simple-auth';
import { JobsService } from './jobs.service';
import { DetailedJobDto } from './queries/details-job.query';
import { PaginatedJobsDto } from './queries/list-jobs.query';

@Controller('/api/jobs/v1')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  @HasRole(Role.ADMIN)
  @ApiPaginated()
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PrismaJobStatusEnum,
    enumName: 'JobStatusEnum',
  })
  @ZodResponse({ status: HttpStatus.OK, type: PaginatedJobsDto })
  listJobs(
    @QueryPagination() pagination: Pagination,
    @Query('status', new ParseEnumPipe(PrismaJobStatusEnum, { optional: true }))
    status: PrismaJobStatusEnum | undefined,
  ): Promise<PaginatedJobsDto> {
    return this.jobs.listJobs({ pagination, status });
  }

  @Get('/:jobId')
  @HasRole(Role.ADMIN)
  @ZodResponse({ status: HttpStatus.OK, type: DetailedJobDto })
  detailsJob(
    @Param('jobId', ParseIntPipe) jobId: number,
  ): Promise<DetailedJobDto> {
    return this.jobs.detailsJob({ jobId });
  }
}
