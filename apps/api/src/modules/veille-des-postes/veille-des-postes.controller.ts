import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { DateOnly } from '../../utils/date-only';
import { FILE_EXTENSIONS, type Multipart, RenameAttachmentDto, UseMultipartBody } from '../framework/files';
import { ApiPaginated, Pagination, QueryPagination } from '../framework/pagination';
import { AuthedUserId, HasRole } from '../simple-auth';

import { DeclarePositionVacancyDto } from './infrastructure/dtos/position-vacancy.dto';
import {
  ListCourtOfAppealFirstPresidentsDto,
  ListCourtOfCassationHoldersDto,
  ListJudicialCourtPresidentsDto,
} from './infrastructure/dtos/veille-des-postes.dto';
import { FoundPositionVacancyDto } from './infrastructure/queries/find-position-vacancy.query';
import { ListedCourtOfAppealFirstPresidentsDto } from './infrastructure/queries/list-court-of-appeal-first-presidents.query';
import { ListedCourtOfCassationHoldersDto } from './infrastructure/queries/list-court-of-cassation-holders.query';
import { ListedJudicialCourtPresidentsDto } from './infrastructure/queries/list-judicial-court-presidents.query';
import { OpenedPositionVacancyAttachmentDto } from './infrastructure/queries/open-position-vacancy-attachment.query';
import { VeilleDesPostesFilter } from './infrastructure/veille-des-postes.filter';
import { VeilleDesPostesService } from './veille-des-postes.service';

@ApiTags('Veille des postes')
@UseInterceptors(VeilleDesPostesFilter)
@Controller('/api/veille-des-postes/v1')
export class VeilleDesPostesController {
  constructor(private readonly veilleDesPostes: VeilleDesPostesService) {}

  @Get('/cours-d-appel')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ status: HttpStatus.OK, type: ListedCourtOfAppealFirstPresidentsDto })
  listCourtOfAppealFirstPresidents(
    @Query() query: ListCourtOfAppealFirstPresidentsDto,
    @QueryPagination({ defaultLimit: 20 }) pagination: Pagination,
  ): Promise<ListedCourtOfAppealFirstPresidentsDto> {
    return this.veilleDesPostes.listCourtOfAppealFirstPresidents({
      alerts: query.alerts ?? [],
      deadlines: query.deadlines ?? [],
      pagination,
      search: query.search,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      statuses: query.statuses ?? [],
    });
  }

  @Get('/cour-de-cassation')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ status: HttpStatus.OK, type: ListedCourtOfCassationHoldersDto })
  listCourtOfCassationHolders(
    @Query() query: ListCourtOfCassationHoldersDto,
    @QueryPagination({ defaultLimit: 20 }) pagination: Pagination,
  ): Promise<ListedCourtOfCassationHoldersDto> {
    return this.veilleDesPostes.listCourtOfCassationHolders({
      alerts: query.alerts ?? [],
      deadlines: query.deadlines ?? [],
      pagination,
      positions: query.positions ?? [],
      search: query.search,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      statuses: query.statuses ?? [],
    });
  }

  @Get('/tribunaux-judiciaires')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ status: HttpStatus.OK, type: ListedJudicialCourtPresidentsDto })
  listJudicialCourtPresidents(
    @Query() query: ListJudicialCourtPresidentsDto,
    @QueryPagination({ defaultLimit: 20 }) pagination: Pagination,
  ): Promise<ListedJudicialCourtPresidentsDto> {
    return this.veilleDesPostes.listJudicialCourtPresidents({
      alerts: query.alerts ?? [],
      deadlines: query.deadlines ?? [],
      pagination,
      ressorts: query.ressorts ?? [],
      search: query.search,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      statuses: query.statuses ?? [],
    });
  }

  @Put('/titulaires/:magistratId/vacance')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UseMultipartBody({
    destination: ({ id, mimetype, request }) =>
      `veille-des-postes/${request.params.magistratId}/${id}.${FILE_EXTENSIONS[mimetype]}`,
    schema: DeclarePositionVacancyDto,
  })
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async declarePositionVacancy(
    @AuthedUserId() authorId: string,
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
    @Body() { files, form }: Multipart<typeof DeclarePositionVacancyDto>,
  ): Promise<void> {
    await this.veilleDesPostes.declarePositionVacancy({
      authorId,
      files: files ?? [],
      magistratId,
      reason: form.reason,
      reasonDetail: form.reasonDetail ?? null,
      startDate: DateOnly.fromString(form.startDate, 'yyyy-MM-dd'),
    });
  }

  @Get('/titulaires/:magistratId/vacance')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @ZodResponse({ status: HttpStatus.OK, type: FoundPositionVacancyDto })
  findPositionVacancy(
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
  ): Promise<FoundPositionVacancyDto> {
    return this.veilleDesPostes.findPositionVacancy({ magistratId });
  }

  /** @warning this is a mutation: it signs a URL */
  @Get('/titulaires/:magistratId/vacance/pieces-jointes/:fileId')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @ZodResponse({ status: HttpStatus.OK, type: OpenedPositionVacancyAttachmentDto })
  openPositionVacancyAttachment(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
  ): Promise<OpenedPositionVacancyAttachmentDto> {
    return this.veilleDesPostes.openPositionVacancyAttachment({ fileId, magistratId });
  }

  @Delete('/titulaires/:magistratId/vacance/pieces-jointes/:fileId')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePositionVacancyAttachment(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
  ): Promise<void> {
    await this.veilleDesPostes.removePositionVacancyAttachment({ fileId, magistratId });
  }

  @Patch('/titulaires/:magistratId/vacance/pieces-jointes/:fileId')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async renamePositionVacancyAttachment(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
    @Body() { name }: RenameAttachmentDto,
  ): Promise<void> {
    await this.veilleDesPostes.renamePositionVacancyAttachment({ fileId, magistratId, name });
  }

  @Delete('/titulaires/:magistratId/vacance')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  async withdrawPositionVacancy(@Param('magistratId', ParseUUIDPipe) magistratId: string): Promise<void> {
    await this.veilleDesPostes.withdrawPositionVacancy({ magistratId });
  }
}
