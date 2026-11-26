import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { DateOnly } from '../../utils/date-only';
import { ApiPaginated, Pagination, QueryPagination } from '../framework/pagination';
import { AuthedUser, AuthedUserId, HasRole } from '../simple-auth';

import { CallsForApplicationsService } from './calls-for-applications.service';
import {
  CreateCallForApplicationsDto,
  CreatedCallForApplicationsDto,
  ListCallsForApplicationsDto,
  UpdateCallForApplicationsDto,
} from './infrastructure/call-for-applications.dto';
import { CallsForApplicationsFilter } from './infrastructure/calls-for-applications.filter';
import { FoundCallForApplicationsFormDto } from './infrastructure/queries/find-call-for-applications-form.query';
import { ListedCallsForApplicationsDto } from './infrastructure/queries/list-calls-for-applications.query';

function dateOf(date: string | null | undefined): DateOnly | null {
  return date ? DateOnly.fromString(date, 'yyyy-MM-dd') : null;
}

function metadataOf(body: CreateCallForApplicationsDto | UpdateCallForApplicationsDto) {
  return {
    comment: body.comment ?? null,
    deadline: dateOf(body.deadline),
    guidelinesAdaptations: body.guidelinesAdaptations ?? [],
    publishedOn: dateOf(body.publishedOn),
    targetCourts: body.targetCourts ?? [],
    targetPositions: body.targetPositions ?? [],
    type: body.type,
  };
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
    return this.callsForApplications.createCallForApplications({ ...metadataOf(body), authorId });
  }

  @Delete('/:callId')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCallForApplications(
    @AuthedUser() actor: { id: string; isAdmin: boolean },
    @Param('callId', ParseUUIDPipe) callId: string,
  ): Promise<void> {
    await this.callsForApplications.deleteCallForApplications({ actor, id: callId });
  }

  @Get('/form')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @ZodResponse({ status: HttpStatus.OK, type: FoundCallForApplicationsFormDto })
  findCallForApplicationsForm(): Promise<FoundCallForApplicationsFormDto> {
    return this.callsForApplications.findCallForApplicationsForm();
  }

  @Get()
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ status: HttpStatus.OK, type: ListedCallsForApplicationsDto })
  listCallsForApplications(
    @AuthedUser() actor: { isAdmin: boolean },
    @Query() query: ListCallsForApplicationsDto,
    @QueryPagination({ defaultLimit: 20 }) pagination: Pagination,
  ): Promise<ListedCallsForApplicationsDto> {
    return this.callsForApplications.listCallsForApplications({
      actor,
      pagination,
      period: query.period,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      statuses: query.statuses ?? [],
      types: query.types ?? [],
      years: query.years ?? [],
    });
  }

  @Put('/:callId')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateCallForApplications(
    @AuthedUser() actor: { id: string; isAdmin: boolean },
    @Param('callId', ParseUUIDPipe) callId: string,
    @Body() body: UpdateCallForApplicationsDto,
  ): Promise<void> {
    await this.callsForApplications.updateCallForApplications({ ...metadataOf(body), actor, id: callId });
  }
}
