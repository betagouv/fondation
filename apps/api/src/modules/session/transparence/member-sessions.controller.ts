import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import type { RoleEnum } from 'src/modules/shared/role.enum';
import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import { WriteNominationFileMemberMemoDto } from './infrastructure/dtos/nomination-file.dto';
import { ListedMemberSessionsDto } from './infrastructure/queries/list-member-sessions.query';
import { TransparenceService } from './infrastructure/transparence.service';

@ApiTags('Members')
@Controller('/api/members/v1')
export class MemberSessionsController {
  constructor(private readonly sessions: TransparenceService) {}

  @HasRole()
  @Get('/:userId/sessions/transparence/garde-des-sceaux')
  @ZodResponse({ status: HttpStatus.OK, type: ListedMemberSessionsDto })
  listMemberSessions(
    @Param('userId') userId: string,
    @AuthedUser() authUser: { id: string; role: RoleEnum },
  ): Promise<ListedMemberSessionsDto> {
    if (userId !== authUser.id) throw new ForbiddenException();

    return this.sessions.listMemberSessions({ typeDeSaisine: 'TRANSPARENCE_GDS', user: authUser });
  }

  @HasRole()
  @Put('/:userId/sessions/transparence/garde-des-sceaux/:sessionId/files/:nominationFileId/memo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async writeNominationFileMemberMemo(
    @AuthedUser() authedUser: { id: string },
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() { memo }: WriteNominationFileMemberMemoDto,
  ) {
    if (authedUser.id !== userId) throw new ForbiddenException();

    await this.sessions.writeNominationFileMemberMemo({ memo, nominationFileId, sessionId, userId });
  }
}
