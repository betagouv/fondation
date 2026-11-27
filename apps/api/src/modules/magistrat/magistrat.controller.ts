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
  Post,
  Query,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiPaginated, Pagination, QueryPagination } from '../framework/pagination';
import { AuthedUser, AuthedUserId, HasRole } from '../simple-auth';

import {
  AddMagistratPhoneNumberDto,
  AttachUnrecognisedMagistratEmailDto,
  ListUnrecognisedMagistratEmailsDto,
  SearchMagistratsQueryDto,
  UpdateMagistratPhoneNumberDto,
} from './infrastructure/dtos/magistrat.dto';
import { MagistratFilter } from './infrastructure/magistrat.filter';
import { DetailedMagistratDto } from './infrastructure/queries/detail-magistrat.query';
import { ListedMagistratAttachedEmailsDto } from './infrastructure/queries/list-magistrat-attached-emails.query';
import { ListedMagistratPhoneNumbersDto } from './infrastructure/queries/list-magistrat-phone-numbers.query';
import { ListedUnrecognisedMagistratEmailsDto } from './infrastructure/queries/list-unrecognised-magistrat-emails.query';
import { SearchMagistratsResponseDto } from './infrastructure/queries/search-magistrats.query';
import { MagistratService } from './magistrat.service';

@ApiTags('Magistrats')
@Controller('/api/magistrats/v1')
@UseInterceptors(MagistratFilter)
export class MagistratController {
  constructor(private readonly magistrats: MagistratService) {}

  @Get()
  @HasRole()
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({
    status: HttpStatus.OK,
    type: SearchMagistratsResponseDto,
  })
  async searchMagistrats(
    @Query() query: SearchMagistratsQueryDto,
    @QueryPagination({ defaultLimit: 20 }) pagination: Pagination,
  ): Promise<SearchMagistratsResponseDto> {
    return this.magistrats.searchMagistrats({
      ignoreIds: query.ignore,
      pagination,
      search: query.search,
    });
  }

  // before /:magistratId that would take its path for an identifier
  @Get('/unrecognised-emails')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({ status: HttpStatus.OK, type: ListedUnrecognisedMagistratEmailsDto })
  listUnrecognisedMagistratEmails(
    @Query() query: ListUnrecognisedMagistratEmailsDto,
    @QueryPagination({ defaultLimit: 20 }) pagination: Pagination,
  ): Promise<ListedUnrecognisedMagistratEmailsDto> {
    return this.magistrats.listUnrecognisedEmails({
      pagination,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
    });
  }

  @Post('/unrecognised-emails/:id/attachment')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async attachUnrecognisedMagistratEmail(
    @AuthedUserId() authorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AttachUnrecognisedMagistratEmailDto,
  ): Promise<void> {
    await this.magistrats.attachUnrecognisedEmail({ authorId, id, magistratId: body.magistratId });
  }

  @Delete('/unrecognised-emails/:id')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  async dismissUnrecognisedMagistratEmail(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.magistrats.dismissUnrecognisedEmail({ id });
  }

  @Get('/:magistratId')
  @HasRole()
  @ZodResponse({
    status: HttpStatus.OK,
    type: DetailedMagistratDto,
  })
  detailMagistrat(@Param('magistratId') magistratId: string): Promise<DetailedMagistratDto> {
    return this.magistrats.detailMagistrat({ magistratId });
  }

  @Get('/:magistratId/attached-emails')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @ZodResponse({ status: HttpStatus.OK, type: ListedMagistratAttachedEmailsDto })
  listMagistratAttachedEmails(
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
  ): Promise<ListedMagistratAttachedEmailsDto> {
    return this.magistrats.listAttachedEmails({ magistratId });
  }

  @Delete('/:magistratId/attached-emails/:attachedEmailId')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  async detachMagistratEmail(
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
    @Param('attachedEmailId', ParseUUIDPipe) attachedEmailId: string,
  ): Promise<void> {
    await this.magistrats.detachEmail({ id: attachedEmailId, magistratId });
  }

  @Get('/:magistratId/phone-numbers')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @ZodResponse({
    type: ListedMagistratPhoneNumbersDto,
    status: HttpStatus.OK,
  })
  listMagistratPhoneNumbers(
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
  ): Promise<ListedMagistratPhoneNumbersDto> {
    return this.magistrats.listPhoneNumbers({ magistratId });
  }

  @Post('/:magistratId/phone-numbers')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async addMagistratPhoneNumber(
    @AuthedUser() authUser: { id: string },
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
    @Body() body: AddMagistratPhoneNumberDto,
  ): Promise<void> {
    await this.magistrats.addPhoneNumber({ ...body, authorId: authUser.id, magistratId });
  }

  @Patch('/:magistratId/phone-numbers/:phoneNumberId')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateMagistratPhoneNumber(
    @AuthedUser() authUser: { id: string },
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
    @Param('phoneNumberId', ParseUUIDPipe) phoneNumberId: string,
    @Body() body: UpdateMagistratPhoneNumberDto,
  ): Promise<void> {
    await this.magistrats.updatePhoneNumber({ ...body, authorId: authUser.id, magistratId, phoneNumberId });
  }

  @Delete('/:magistratId/phone-numbers/:phoneNumberId')
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMagistratPhoneNumber(
    @Param('magistratId', ParseUUIDPipe) magistratId: string,
    @Param('phoneNumberId', ParseUUIDPipe) phoneNumberId: string,
  ): Promise<void> {
    await this.magistrats.deletePhoneNumber({ magistratId, phoneNumberId });
  }
}
