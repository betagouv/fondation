import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { Db } from '../../../../framework/database';
import { OfficialReportVersionFinder } from '../finders/official-report-version.finder';
import { EditedOfficialReportFileNoteDto } from '../official-reports.dto';
import { officialReportFileNote } from '../services/renderers/official-report-note.html';

@Injectable()
export class DetailsOfficialReportFileNoteQuery {
  constructor(
    private readonly db: Db,
    private readonly officialReportVersionFinder: OfficialReportVersionFinder,
  ) {}

  @Transactional()
  async handle(query: {
    nominationFileId: string;
    officialReportId: string;
  }): Promise<EditedOfficialReportFileNoteDto> {
    const file = await this.db.tx.officialReportNominationFile.findFirst({
      select: {
        note: true,
        noteEditedAt: true,
        noteEditor: { select: { firstName: true, id: true, lastName: true } },
        noteOutdated: true,
        noteStatus: true,
        recusedMembers: true,
      } satisfies Prisma.OfficialReportNominationFileSelect,
      where: {
        nominationFileId: query.nominationFileId,
        versionId: await this.officialReportVersionFinder.latest(query),
      },
    });

    if (!file) throw new NotFoundException();

    return officialReportFileNote(file);
  }
}
