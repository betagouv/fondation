import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import type { RoleEnum } from '../../shared/role.enum';
import { AuthedUser, HasRole } from '../../simple-auth';
import { HelpService } from '../help.service';

import { DetailedHelpPageDto } from './queries/detail-help-page.query';

@ApiTags('Help')
@Controller('/api/help/v1/page')
export class ReaderHelpPageController {
  constructor(private readonly help: HelpService) {}

  @Get()
  @HasRole()
  @ZodResponse({ status: HttpStatus.OK, type: DetailedHelpPageDto })
  detailReaderHelpPage(@AuthedUser() user: { role: RoleEnum }): Promise<DetailedHelpPageDto> {
    return this.help.detailReaderHelpPage({ user });
  }
}
