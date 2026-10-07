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
import type { RoleEnum } from '../shared/role.enum';
import { AuthedUser, HasRole } from '../simple-auth';

import {
  AddMagistratPhoneNumberDto,
  SearchMagistratsQueryDto,
  UpdateMagistratPhoneNumberDto,
} from './infrastructure/dtos/magistrat.dto';
import { MagistratFilter } from './infrastructure/magistrat.filter';
import { DetailedMagistratDto } from './infrastructure/queries/detail-magistrat.query';
import { ListedMagistratNominationFilesDto } from './infrastructure/queries/list-magistrat-nomination-files.query';
import { ListedMagistratObservationsDto } from './infrastructure/queries/list-magistrat-observations.query';
import { ListedMagistratPhoneNumbersDto } from './infrastructure/queries/list-magistrat-phone-numbers.query';
import { SearchMagistratsResponseDto } from './infrastructure/queries/search-magistrats.query';
import { MagistratService } from './magistrat.service';

@ApiTags('Magistrats')
@Controller('/api/magistrats/v1')
@UseInterceptors(MagistratFilter)
export class MagistratController {
  constructor(private readonly magistrats: MagistratService) {}

  @Get()
  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @UsePipes(ZodValidationPipe)
  @ApiPaginated()
  @ZodResponse({
    status: HttpStatus.OK,
    type: SearchMagistratsResponseDto,
  })
  async searchMagistrats(
    @Query() query: SearchMagistratsQueryDto,
    @QueryPagination({ defaultLimit: 10 }) pagination: Pagination,
  ): Promise<SearchMagistratsResponseDto> {
    return this.magistrats.searchMagistrats({
      ignoreIds: query.ignore,
      pagination,
      search: query.search,
    });
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

  @Get('/:magistratId/nomination-files')
  @HasRole()
  @ApiPaginated()
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListedMagistratNominationFilesDto,
  })
  listMagistratNominationFiles(
    @AuthedUser() user: { role: RoleEnum },
    @Param('magistratId') magistratId: string,
    @QueryPagination({ defaultLimit: 5 }) pagination: Pagination,
  ): Promise<ListedMagistratNominationFilesDto> {
    return this.magistrats.listNominationFiles({ magistratId, pagination, role: user.role });
  }

  @Get('/:magistratId/observations')
  @HasRole()
  @ApiPaginated()
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListedMagistratObservationsDto,
  })
  listMagistratObservations(
    @AuthedUser() user: { role: RoleEnum },
    @Param('magistratId') magistratId: string,
    @QueryPagination({ defaultLimit: 5 }) pagination: Pagination,
  ): Promise<ListedMagistratObservationsDto> {
    return this.magistrats.listObservations({ magistratId, pagination, role: user.role });
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
