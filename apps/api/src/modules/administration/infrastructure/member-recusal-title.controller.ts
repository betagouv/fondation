import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Put, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';

import { HasRole } from '../../simple-auth';
import { AdministrationService } from '../administration.service';

import { UpdateUserRecusalTitleDto } from './dto/administration.dto';

/** the secretariat's door to a member's recusal title, handled here for the draft official reports to follow it */
@ApiTags('Members')
@Controller('/api/members/v1')
export class MemberRecusalTitleController {
  constructor(private readonly administration: AdministrationService) {}

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:userId/recusal-title')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  updateRecusalTitle(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() { recusalTitle }: UpdateUserRecusalTitleDto,
  ): Promise<void> {
    return this.administration.updateMemberRecusalTitle({ recusalTitle, userId });
  }
}
