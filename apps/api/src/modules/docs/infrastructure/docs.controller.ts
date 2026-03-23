import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import { Role } from 'shared-models';

import { DocsService } from '../docs.service';
import { CreateAgendaDto, CreatedAgendaDto } from './docs.dto';
import {
  FoundChairmenDto,
  SearchChairmenQueryDto,
} from './queries/find-chairmen.query';

@Controller('/api/docs/v1')
export class DocsController {
  constructor(private readonly docs: DocsService) {}

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/chairmen')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: FoundChairmenDto, status: HttpStatus.OK })
  searchChairmen(
    @Query() query: SearchChairmenQueryDto,
  ): Promise<FoundChairmenDto> {
    return this.docs.searchChairmen({
      formation: query.formation,
    });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Post('/sessions/:sessionId/agendas')
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: CreatedAgendaDto, status: HttpStatus.CREATED })
  createAgenda(
    @AuthedUser() authUser: { id: string },
    @Param('sessionId') sessionId: string,
    @Body() body: CreateAgendaDto,
  ): Promise<CreatedAgendaDto> {
    return this.docs.createAgenda({
      sessionId,
      authorId: authUser.id,
      nominationFileIds: body.nominationFileIds,
    });
  }
}
