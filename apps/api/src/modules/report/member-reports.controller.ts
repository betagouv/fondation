import { Controller, ForbiddenException, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import type { RoleEnum } from 'src/modules/shared/role.enum';
import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import { ListedMemberSessionReportsDto } from './infrastructure/queries/list-member-session-reports.query';
import { FoundNominationFileMembersReportDto } from './infrastructure/queries/search-nomination-file-members-report.query';
import { ReportService } from './report.service';

@ApiTags('Members')
@Controller('/api/members/v1')
export class MemberReportsController {
  constructor(private readonly reports: ReportService) {}

  @HasRole()
  @Get('/:userId/sessions/transparence/garde-des-sceaux/:sessionId/reports')
  @ZodResponse({ status: HttpStatus.OK, type: ListedMemberSessionReportsDto })
  listMemberSessionReports(
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @AuthedUser() authUser: { id: string; role: RoleEnum },
  ): Promise<ListedMemberSessionReportsDto> {
    if (userId !== authUser.id) throw new ForbiddenException();

    return this.reports.listMemberSessionReports({ sessionId, user: authUser });
  }

  @HasRole()
  @Get('/:userId/sessions/transparence/garde-des-sceaux/:sessionId/files/:nominationFileId/reports')
  @ZodResponse({ status: HttpStatus.OK, type: FoundNominationFileMembersReportDto })
  searchNominationFileMembersReport(
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @AuthedUser() authUser: { id: string },
  ): Promise<FoundNominationFileMembersReportDto> {
    if (userId !== authUser.id) throw new ForbiddenException();

    return this.reports.searchNominationFileMembersReport({ nominationFileId, sessionId, userId });
  }
}
