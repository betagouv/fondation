import { Body, Controller, Get, HttpStatus, Post, Query, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { DateOnly } from '../../utils/date-only';
import { ApiPaginated, Pagination, QueryPagination } from '../framework/pagination';
import { AuthedUserId, HasRole } from '../simple-auth';

import { CallsForApplicationsService } from './calls-for-applications.service';
import {
  CreateCallForApplicationsDto,
  CreatedCallForApplicationsDto,
  ListCallsForApplicationsDto,
} from './infrastructure/call-for-applications.dto';
import { CallsForApplicationsFilter } from './infrastructure/calls-for-applications.filter';
import { FoundCallForApplicationsFormDto } from './infrastructure/queries/find-call-for-applications-form.query';
import { ListedCallsForApplicationsDto } from './infrastructure/queries/list-calls-for-applications.query';

function dateOf(date: string): DateOnly {
  return DateOnly.fromString(date, 'yyyy-MM-dd');
}

@ApiTags('Calls for applications')
@UseInterceptors(CallsForApplicationsFilter)
@Controller('/api/calls-for-applications/v1')
export class CallsForApplicationsController {
  constructor(private readonly callsForApplications: CallsForApplicationsService) {}

  @Post()
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.CREATED, type: CreatedCallForApplicationsDto })
  createCallForApplications(
    @AuthedUserId() authorId: string,
    @Body() body: CreateCallForApplicationsDto,
  ): Promise<CreatedCallForApplicationsDto> {
    return this.callsForApplications.createCallForApplications({
      authorId,
      comment: body.comment ?? null,
      deadline: body.deadline ? dateOf(body.deadline) : null,
      publishedOn: body.publishedOn ? dateOf(body.publishedOn) : null,
      targetJurisdictionType: body.targetJurisdictionType,
      type: body.type,
    });
  }

  @Get('/form')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @ZodResponse({ status: HttpStatus.OK, type: FoundCallForApplicationsFormDto })
  findCallForApplicationsForm(): FoundCallForApplicationsFormDto {
    return this.callsForApplications.findCallForApplicationsForm();
  }

  @Get()
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ status: HttpStatus.OK, type: ListedCallsForApplicationsDto })
  listCallsForApplications(
    @Query() query: ListCallsForApplicationsDto,
    @QueryPagination({ defaultLimit: 20 }) pagination: Pagination,
  ): Promise<ListedCallsForApplicationsDto> {
    return this.callsForApplications.listCallsForApplications({
      pagination,
      period: query.period,
      statuses: query.statuses ?? [],
      targetJurisdictionTypes: query.targetJurisdictionTypes ?? [],
      years: query.years ?? [],
    });
  }
}
